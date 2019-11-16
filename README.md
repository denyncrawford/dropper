# Dropper

**A simple WebSocket based event/data pusher that runs in your NodeJS/ExpressJS app.**

Send and recive notifications, messages, updates and any data, all in real-time with custom events and methods served on your own web, Dropper is Open Source, self-served and FREE forever!

[![](https://data.jsdelivr.com/v1/package/npm/dropperjs/badge)](https://www.jsdelivr.com/package/npm/dropperjs) ![Hits](https://hitcounter.pythonanywhere.com/count/tag.svg?url=https%3A%2F%2Fgithub.com%2Fdenyncrawford%2Fdropper)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/denyncrawford/dropper/blob/master/LICENSE?style=flat-square)
![npm](https://img.shields.io/npm/v/dropperjs?color=green&label=version&style=flat-square)
![npm](https://img.shields.io/npm/dm/dropper?color=blue&style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/denyncrawford/dropper?style=flat-square)

###### The counterpart says:

>"Easily build scalable realtime graphs, geotracking, multiplayer games, and more in your web and mobile apps with **our hosted pub/sub messaging API**."

###### We say:

>"Easily build scalable realtime aplications with **our Open Source self-hosted pub/sub messaging API."**

With Dropper you can do what you want without any paid third-party service.

## What can I do with Dropper?

Since **Dropper** is a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) solution for delivering messages between servers and clients in real-time, our **Side by Side APIs** are designed to handle custom events sent by your aplication peers, you can work with our structured event hadlelers that allows to send and receive data in a simpler and contolated way.

### Dropper instance:

The Dropper instance is designed to return two different work modalities, which allows you to code projects of different scales and purposes.

- **Socket:**

  By default **Dropper** returns an instance of WebSocket, which is a simplified but traditional way to deliver messaging with a very similar structure **WS API for Browsers like**, but based on custom events.

   You can listen and send events in real-time to run code as you need it, **on the client and server side**.

    **client.js**

      dropper.emit("pizza", "I sent you a pizza!");
      dropper.on("thanks", function(data){
        console.log(data) // => Hey mate thank you!
      });

    **server.js**

      dropper.on("pizza", function(data){
        console.log(data) // => I sent you a pizza!
        dropper.emit("thanks", "Hey mate thank you!");
      });


- **Channels:**

  **Dropper Channels** are dedicated spaces to **listen and send data to specific peers** who are subscribed to them, the channels are designed to **communicate more easily between peers** in **a personalized space** with the same WebSocket techonology.

  In this way you can push **real-time** data/messaging to different instances in your application, just to listeners who need it, without any problem of repeated events in the same instance or mixed listeners who should not listen to the event being emitted.

    **client.js**

      var channel = dropper.subscribe('pizza-store-channel');

      channel.bind('pizza', function(myOrder) {
        console.log(myOrder.state) // => Hello customer, your pizza is ready!
      });

    **server.js**

      dropper.trigger('pizza-store-channel', 'pizza', {
        "state": "Hello customer, your pizza is ready!"
      });

---
### Features

Dropper enables real-time bidirectional event-based communication. It consists of:

- a Node.js server.
- a Javascript client library for the browser (or a Node.js client)

- Protocol

We are constantly developing for improvements and delivering more features to make Dropper a totally reliable tool.

For now it is a WebSocket-based tool with connections secured by a handshake authenticated with an initial http request, but we are currently working on a more advanced protocol that has side-by-side encryption.

- Simple API

Dropper has a very easy to use API, both the server and the client are practically identical.

- Channels

In order to developing scalable applications Dropper has dedicated spaces called "channels" which exists to broadcast information separate from the global scope of your dropper instance.

Of course there may be different instances of Dropper in a single application but this means that for each instance / app, you have the possibility to dispatch events in separate spaces without affecting the functionality of other channels.

## Installation

##### NodeJS

    npm install dropperjs

##### Client / Browser

-  **JsDelivr**


        <script src="https://cdn.jsdelivr.net/gh/denyncrawford/dropper/client-api/dropper-client.js"></script>


- **RawGitHack**


        <script src="https://raw.githack.com/denyncrawford/dropper/master/client-api/dropper-client.js" charset="utf-8"></script>

## Documents

###### Go to the [API section]("") to learn how to use Dropper and its methods.

## Credits

Lead Developer - Denyn crawford (@samaels_bitch)

## License

The MIT License (MIT)

Copyright (c) 2019 Crawford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
