<a name="module_libcommunication"></a>

## libcommunication

* [libcommunication](#module_libcommunication)
    * [~msg](#module_libcommunication..msg) : <code>Object</code>
        * [.error([reason], [code])](#module_libcommunication..msg.error)
        * [.reply(sendData)](#module_libcommunication..msg.reply) ⇒ <code>Promise</code>
    * [~ServiceCommunication](#module_libcommunication..ServiceCommunication) : <code>Class</code>
        * [new ServiceCommunication([rabbitmq])](#new_module_libcommunication..ServiceCommunication_new)
        * [.connect(servicename)](#module_libcommunication..ServiceCommunication+connect) ⇒ <code>Promise</code>
        * [.wait(type, cb)](#module_libcommunication..ServiceCommunication+wait) ⇒ <code>Object</code>
        * [.sendAndWait(type, data)](#module_libcommunication..ServiceCommunication+sendAndWait) ⇒ <code>Promise</code>
    * [~path](#module_libcommunication..path) : <code>constant</code>
    * [~debug](#module_libcommunication..debug) : <code>constant</code>
    * [~os](#module_libcommunication..os) : <code>constant</code>

<a name="module_libcommunication..msg"></a>

### libcommunication~msg : <code>Object</code>
**Kind**: inner {constant} of [<code>libcommunication</code>](#module_libcommunication)  
**Extends**: <code>rabbot.handle#message</code>  
**See**: https://github.com/arobson/rabbot#message-format  

* [~msg](#module_libcommunication..msg) : <code>Object</code>
    * [.error([reason], [code])](#module_libcommunication..msg.error)
    * [.reply(sendData)](#module_libcommunication..msg.reply) ⇒ <code>Promise</code>

<a name="module_libcommunication..msg.error"></a>

#### msg.error([reason], [code])
Returns an error.

**Kind**: static method of [<code>msg</code>](#module_libcommunication..msg)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [reason] | <code>String</code> | <code>&quot;GENERIC_ERROR&quot;</code> | reason for the error |
| [code] | <code>Number</code> | <code>1</code> | code for this error |

<a name="module_libcommunication..msg.reply"></a>

#### msg.reply(sendData) ⇒ <code>Promise</code>
Simple message reply abstraction, taking just {sendData}

**Kind**: static method of [<code>msg</code>](#module_libcommunication..msg)  
**Returns**: <code>Promise</code> - rabbot#publish  
**See**: https://github.com/arobson/rabbot#publish-exchangename-options-connectionname-  

| Param | Type | Description |
| --- | --- | --- |
| sendData | <code>Object</code> | data to send. |

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

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [rabbitmq] | <code>String</code> | <code>&#x27;rabbitmq&#x27;</code> | RabbitMQ Host URL. |

<a name="module_libcommunication..ServiceCommunication+connect"></a>

#### serviceCommunication.connect(servicename) ⇒ <code>Promise</code>
Connect to rabbitmq

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Promise</code> - when connected to rabbitmq.  

| Param | Type | Description |
| --- | --- | --- |
| servicename | <code>String</code> | Service's name. |

<a name="module_libcommunication..ServiceCommunication+wait"></a>

#### serviceCommunication.wait(type, cb) ⇒ <code>Object</code>
Wait for message of {type}

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Object</code> - Rabbot#handle  
**See**: https://github.com/arobson/rabbot#handle-options-handler-  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | type of message to handle. |
| cb | <code>function</code> | callback to handle message. |

<a name="module_libcommunication..ServiceCommunication+sendAndWait"></a>

#### serviceCommunication.sendAndWait(type, data) ⇒ <code>Promise</code>
Send a message with $type and wait for a reply

**Kind**: instance method of [<code>ServiceCommunication</code>](#module_libcommunication..ServiceCommunication)  
**Returns**: <code>Promise</code> - .then/.progress, see rabbot.  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>String</code> | message type. |
| data | <code>\*</code> | data to send |

<a name="module_libcommunication..path"></a>

### libcommunication~path : <code>constant</code>
Node.JS path module

**Kind**: inner constant of [<code>libcommunication</code>](#module_libcommunication)  
<a name="module_libcommunication..debug"></a>

### libcommunication~debug : <code>constant</code>
debug library

**Kind**: inner constant of [<code>libcommunication</code>](#module_libcommunication)  
<a name="module_libcommunication..os"></a>

### libcommunication~os : <code>constant</code>
Node.JS os module.

**Kind**: inner constant of [<code>libcommunication</code>](#module_libcommunication)  
