<a name="module_libcommunication"></a>

## libcommunication

* [libcommunication](#module_libcommunication)
    * [~ServiceCommunication](#module_libcommunication..ServiceCommunication) : <code>Class</code>
        * [new ServiceCommunication([rabbitmq])](#new_module_libcommunication..ServiceCommunication_new)
        * [.connect(servicename)](#module_libcommunication..ServiceCommunication+connect) ⇒ <code>Promise</code>
        * [.wait(type, cb)](#module_libcommunication..ServiceCommunication+wait) ⇒ <code>Object</code>
        * [.sendAndWait(type, data)](#module_libcommunication..ServiceCommunication+sendAndWait) ⇒ <code>Promise</code>
    * [~handleAMessage](#module_libcommunication..handleAMessage) : <code>function</code>
    * [~msg](#module_libcommunication..msg) : <code>Object</code>
        * [.error([reason], [code])](#module_libcommunication..msg.error) ⇒ <code>Promise</code>
        * [.reply(sendData)](#module_libcommunication..msg.reply) ⇒ <code>Promise</code>

<a name="module_libcommunication..ServiceCommunication"></a>

### libcommunication~ServiceCommunication : <code>Class</code>
StayMarta's abstracted microservice protocol over RabbitMQ.

**Kind**: inner class of [<code>libcommunication</code>](#module_libcommunication)  
**Version**: 1.0  
**Author**: Jared Allard <jared@staymarta.com>  
**License**: BSD-3-Clause  
**Copyright**: (c) 2017 StayMarta.  

* [~ServiceCommunication](#module_libcommunication..ServiceCommunication) : <code>Class</code>
    * [new ServiceCommunication([rabbitmq])](#new_module_libcommunication..ServiceCommunication_new)
    * [.connect(servicename)](#module_libcommunication..ServiceCommunication+connect) ⇒ <code>Promise</code>
    * [.wait(type, cb)](#module_libcommunication..ServiceCommunication+wait) ⇒ <code>Object</code>
    * [.sendAndWait(type, data)](#module_libcommunication..ServiceCommunication+sendAndWait) ⇒ <code>Promise</code>

<a name="new_module_libcommunication..ServiceCommunication_new"></a>

#### new ServiceCommunication([rabbitmq])
Specify how to connect to RabbitMQ & instance this.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [rabbitmq] | <code>String</code> | <code>&#x27;rabbitmq&#x27;</code> | RabbitMQ Host URL. |

**Example** *(Basic instancing)*  
```js
const communication = require('libcommunication')
```
<a name="module_libcommunication..ServiceCommunication+connect"></a>

#### serviceCommunication.connect(servicename) ⇒ <code>Promise</code>
Connect to rabbitmq and setup our unique_queues, also some basic logic to
handle connection failures, and other things related to RabbitMQ's
connection.

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Promise</code> - when connected to rabbitmq.  

| Param | Type | Description |
| --- | --- | --- |
| servicename | <code>String</code> | Service's name. |

**Example** *(Connecting as the &#x27;users&#x27; service)*  
```js
(async () => {
 // Wrap in async function for await.
 await communication.connect('users')
})()
// doing more stuff ...
```
<a name="module_libcommunication..ServiceCommunication+wait"></a>

#### serviceCommunication.wait(type, cb) ⇒ <code>Object</code>
Wait for message of {type}

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Object</code> - [rabbot#handle](https://github.com/arobson/rabbot#handle-options-handler)  
**See**: https://github.com/arobson/rabbot#handle-options-handler  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | type of message to handle. |
| cb | <code>handleAMessage</code> | callback to handle message. |

**Example** *(Waiting for a request to act on)*  
```js
communication.wait('v1.users.get', msg => {
 console.log('doing something with', msg);
})
```
<a name="module_libcommunication..ServiceCommunication+sendAndWait"></a>

#### serviceCommunication.sendAndWait(type, data) ⇒ <code>Promise</code>
Send a message with **type** and wait for a reply from a service based on the
type provided.

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Promise</code> - .then with the data recived by the temporary handler.  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | message type. |
| data | <code>\*</code> | data to send |

**Example** *(Waiting and sending data, then getting a response)*  
```js
communication.sendAndWait('v1.my.service',  { data: sent })
.then(response => {
  console.log('response', response);
});
```
<a name="module_libcommunication..handleAMessage"></a>

### libcommunication~handleAMessage : <code>function</code>
Handle a message via callback via ~wait

**Kind**: inner typedef of [<code>libcommunication</code>](#module_libcommunication)  
**See**: ~msg  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>msg</code> | libcommunication~msg object |

<a name="module_libcommunication..msg"></a>

### libcommunication~msg : <code>Object</code>
**Kind**: inner typedef of [<code>libcommunication</code>](#module_libcommunication)  
**Extends**: <code>rabbot.handle~message</code>  
**See**: https://github.com/arobson/rabbot#message-format  

* [~msg](#module_libcommunication..msg) : <code>Object</code>
    * [.error([reason], [code])](#module_libcommunication..msg.error) ⇒ <code>Promise</code>
    * [.reply(sendData)](#module_libcommunication..msg.reply) ⇒ <code>Promise</code>

<a name="module_libcommunication..msg.error"></a>

#### msg.error([reason], [code]) ⇒ <code>Promise</code>
Reports an error over RabbitMQ, allowing services to react to this error.
This is handled as a critical error by the gateway, meaning it will kill
off client connections when it recieves a error from a service.

**Kind**: static method of [<code>msg</code>](#module_libcommunication..msg)  
**Returns**: <code>Promise</code> - ...  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [reason] | <code>String</code> | <code>&quot;GENERIC_ERROR&quot;</code> | reason for the error |
| [code] | <code>Number</code> | <code>1</code> | code for this error |

**Example** *(Basic error reported)*  
```js
const msg = await communication.wait('v1.users.get')
msg.error('ERROR_NOT_FOUND', 404)
```
<a name="module_libcommunication..msg.reply"></a>

#### msg.reply(sendData) ⇒ <code>Promise</code>
Simple message reply abstraction, taking just **sendData**. This data is
passed over RabbitMQ and sent back to whoever requested the data.
This should only be used when you need to respond to one service, i.e
the gateway, otherwise you should generic publish your message with a
future send method.

**Kind**: static method of [<code>msg</code>](#module_libcommunication..msg)  
**Returns**: <code>Promise</code> - [rabbot#publish](https://github.com/arobson/rabbot#publish-exchangename-options-connectionname)  
**See**: https://github.com/arobson/rabbot#publish-exchangename-options-connectionname  

| Param | Type | Description |
| --- | --- | --- |
| sendData | <code>Object</code> | data to send. |

**Example** *(Basic reply)*  
```js
const msg = await communication.wait('v1.users.get')
msg.reply({
 username: 'jaredallard',
 name: 'Jared Allard',
 // etc ...
})
```
