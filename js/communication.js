/** @module libcommunication **/

/**
 * Node.JS path module
 * @type {constant}
 * @private
 */
const path   = require('path')

/**
 * debug library
 * @type {constant}
 * @private
 */
const debug  = require('debug')('staymarta:libcommunication')

/**
 * Node.JS os module.
 * @type {constant}
 * @private
 */
const os     = require('os');

/**
 * StayMarta's abstracted microservice protocol over RabbitMQ.
 *
 * @copyright (c) 2017 StayMarta.
 * @author Jared Allard <jared@staymarta.com>
 * @version 1.0
 * @license BSD-3-Clause
 * @type {Class}
 */
class ServiceCommunication {
  /**
   * Specify how to connect to RabbitMQ & instance this.
   *
   * @constructor
   * @param  {String} [rabbitmq='rabbitmq'] RabbitMQ Host URL.
   * @example <caption>Basic instancing</caption>
   * const communication = require('libcommunication')
   * @return {Object} rabbot instance.
   */
  constructor(rabbitmq = 'rabbitmq') {
    this.rabbot = require('rabbot')
    return this.rabbitmq = rabbitmq
  }

  /**
   * Connect to rabbitmq and setup our unique_queues, also some basic logic to
   * handle connection failures, and other things related to RabbitMQ's
   * connection.
   *
   * @param {String} servicename Service's name.
   * @example <caption>Connecting as the 'users' service</caption>
   * (async () => {
   *  // Wrap in async function for await.
   *  await communication.connect('users')
   * })()
   * // doing more stuff ...
   * @returns {Promise} when connected to rabbitmq.
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
   * Handle a message via callback via ~wait
   * @callback handleAMessage
   * @see ~msg
   * @param {msg} msg libcommunication~msg object
   */

  /**
   * Wait for message of {type}
   *
   * @param {String} type type of message to handle.
   * @param {handleAMessage} cb callback to handle message.
   * @see https://github.com/arobson/rabbot#handle-options-handler
   * @example <caption>Waiting for a request to act on</caption>
   * communication.wait('v1.users.get', msg => {
   *  console.log('doing something with', msg);
   * })
   * @returns {Object} [rabbot#handle](https://github.com/arobson/rabbot#handle-options-handler)
   **/
  wait(type, cb) {
    let timeout =  this.timeout;
    let exchange = this.exchange

    // send reply
    debug(`waiting for message type:'${type}' on queue:'${this.service_queue}'`)
    return this.rabbit.handle({
      queue: this.service_queue,
      type: type,
      context: { // isolate the context
        rabbit: this.rabbit,
        service_id: this.service_id
      }
    },

    /**
     * @typedef {Object} msg
     * @extends {rabbot.handle~message}
     * @see https://github.com/arobson/rabbot#message-format
     */
    msg => {
      let request = msg.body.request;
      if(!request) return debug('notice', 'failed to access the request object. Is this a response?')



      /**
       * Reports an error over RabbitMQ, allowing services to react to this error.
       * This is handled as a critical error by the gateway, meaning it will kill
       * off client connections when it recieves a error from a service.
       *
       * @param {String} [reason="GENERIC_ERROR"] - reason for the error
       * @param {Number} [code=1] - code for this error
       * @example <caption>Basic error reported</caption>
       * const msg = await communication.wait('v1.users.get')
       * msg.error('ERROR_NOT_FOUND', 404)
       * @returns {Promise} ...
       **/
      msg.error = (reason = "GENERIC_ERROR", code = 1) => {
        return msg.reply({
          error: reason,
          code: code
        })
      }

      /**
       * Simple message reply abstraction, taking just **sendData**. This data is
       * passed over RabbitMQ and sent back to whoever requested the data.
       * This should only be used when you need to respond to one service, i.e
       * the gateway, otherwise you should generic publish your message with a
       * future send method.
       *
       * @param {Object} sendData - data to send.
       * @see https://github.com/arobson/rabbot#publish-exchangename-options-connectionname
       * @example <caption>Basic reply</caption>
       * const msg = await communication.wait('v1.users.get')
       * msg.reply({
       *  username: 'jaredallard',
       *  name: 'Jared Allard',
       *  // etc ...
       * })
       * @returns {Promise} [rabbot#publish](https://github.com/arobson/rabbot#publish-exchangename-options-connectionname)
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
   * Send a message with **type** and wait for a reply from a service based on the
   * type provided.
   *
   * @param {String} type - message type.
   * @param {*} data - data to send
   * @example <caption>Waiting and sending data, then getting a response</caption>
   * communication.sendAndWait('v1.my.service',  { data: sent })
   * .then(response => {
   *   console.log('response', response);
   * });
   * @returns {Promise} .then with the data recived by the temporary handler.
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
