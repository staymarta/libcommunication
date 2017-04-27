/**
 * (c) 2017 StayMarta
 *
 * RabbitMQ communication librarary.
 * @author Jared Allard <jaredallard@outlook.com>
 * @version 1.0
 **/

const path   = require('path');
const debug  = require('debug')('staymarta:libcommunication')
const os     = require('os');

/**
 * @class
 **/
class ServiceCommunication {
  constructor(rabbitmq = 'rabbitmq') {
    this.rabbot = require('rabbot')
    this.rabbitmq = rabbitmq
  }

  /**
   * Connect to rabbitmq
   *
   * @param {String} [servicename] - If in service mode, what do we identify as?
   * @returns {Promise} std node promise
   **/
  async connect(servicename) {
    this.exchange = 'v1';
    this.timeout  = 5000;
    this.service_id = os.hostname() // HACK: Think about using container ID?

    let unique_queue = `${this.exchange}.api--${this.service_id}`
    this.unique_queue = unique_queue;
    this.service_queue = `v1.${servicename}`;

    // HACK Doesn't distinguish between service / gateway right now.
    await this.rabbot.configure({
      connection: {
        host: this.rabbitmq,
        port: 5672,
        timeout: 2000,
        heatbeat: 10,
        vhost: '%2f',
        publishTimeout: 2000
      },

      exchanges: [
        {
          name: this.exchange,
          type: 'direct',
          autoDelete: true
        },
        {
          name: `${this.exchange}.api`,
          type: 'direct',
          autoDelete: true
        }
      ],

      queues: [
        {
          name: this.service_queue,
          autoDelete: true,
          subscribe: true,
          limit: 20
        },

        {
          name: unique_queue,
          autoDelete: true,
          subscribe: true
        }
      ],

      // binds exchanges and queues to one another
      bindings: [
        {
          exchange: this.exchange,
          target: this.service_queue,
          keys: this.service_queue
        },
        {
          exchange: `${this.exchange}.api`,
          target: unique_queue,
          keys: this.service_id
        }
      ]
    })

    this.rabbot.on('unreachable', () => {
      this.rabbot.retry()
      debug('rabbit', 'unreacheable.')
    })

    this.rabbit = this.rabbot;
  }

  /**
   * Wait for message type {type}
   *
   * @param {String} type - type of message to handle.
   * @param {Function} cb - callback to handle message.
   * @returns {Promise} handle promise
   **/
  wait(type, cb) {
    let timeout =  this.timeout;
    let exchange = this.exchange

    // send reply
    debug(`waiting for message type:'${type}' on queue:'${this.service_queue}'`)
    this.rabbit.handle({
      queue: this.service_queue,
      type: type,
      context: { // isolate the context
        rabbit: this.rabbit,
        service_id: this.service_id
      }
    }, msg => {
      let request = msg.body.request;
      if(!request) return debug('notice', 'failed to access the request object. Is this a response?')


      /**
       * Returns an error.
       *
       * @param {String} [reason="GENERIC_ERROR"] - reason for the error
       * @param {Number} [code=1] - code for this error
       **/
      msg.error = (reason = "GENERIC_ERROR", code = 1) => {
        msg.reply({
          error: reason,
          code: code
        })
      }

      /**
       * Message reply override to include custom type and autorequest insertion
       *
       * @param {Object} sendData - data to send.
       * @returns {Promise} rabbot#publish
       **/
      msg.reply = sendData => {
        const data = {};
        let routingKey = null;

        // Copy over request setup / reply queue.
        if(request) {
          data.request = request;

          // Add custom routing if present in the message.
          exchange    = data.request.reply || exchange;
          routingKey  = data.request.key || '';
        }

        // reply stats
        data.reply = {
          created: Date.now(),
          service_id: this.service_id,
          id: data.request.id
        }

        data.data = sendData;

        debug('reply', `on '${exchange}' with rk '${routingKey}', type '${type}.response'`)
        return this.rabbit.publish(exchange, {
          routingKey: routingKey,
          type: `${type}.response`,
          contentType: 'application/json',
          expiresAfter: timeout,
          body: data,
          timeout: timeout,
          timestamp: Date.now(),
          mandatory: true
        })
      }

      // acknowledge the request.
      msg.ack();

      return cb(msg)
    });
  }

  /**
   * Send a message with $type and wait for a reply
   *
   * @param {String} type - message type.
   * @param {*} data - data to send
   * @returns {Promise} .then/.progress, see rabbot.
   **/
  sendAndWait(type, data) {
    let timeout = 5000;
    let exchange = this.exchange;

    const replyPromise = new Promise((resolv, reject) => {
      // Responder
      const handler = this.rabbit.handle({
        queue: this.unique_queue,
        type: `${type}.response`,
        context: {
          rabbit: this.rabbit
        }
      }, msg => {
        // ack the msg, remove the handler, stop timeout.
        msg.ack();
        handler.remove()
        clearTimeout(requestTimeout);
        return resolv(msg)
      })

      // Request Timeout watcher.
      let requestTimeout = setTimeout(() => {
        debug('timeout', 'triggered')
        handler.remove();
        return reject('timeout')
      }, timeout)
    })

    // handle reply
    if(!data.request) return debug('rejecting non-request object.')
    data.request.reply = `${this.exchange}.api` || null;
    data.request.key   = this.service_id || null;

    // Publish the message to the general exchange.
    let topicFormat = type.split('.');
    let topic = `${topicFormat[0]}.${topicFormat[1]}`

    debug(`sending message type:'${type}' on exchange:'${exchange}', waiting on queue:'${this.unique_queue}', routingKey:'${topic}'`)
    this.rabbit.publish(exchange, {
      routingKey: topic,
      type: type,
      contentType: 'application/json',
      body: data,
      expiresAfter: timeout,
      timeout: timeout,
      timestamp: Date.now(), // posix timestamp (long)
      mandatory: true //Must be set to true for onReturned to receive unqueued message
    })

    return replyPromise;
  }
}

module.exports = ServiceCommunication;
