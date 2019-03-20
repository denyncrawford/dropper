# Dropper

**A simple WebSocket based event/data pusher that runs in your NodeJS/ExpressJS app.**

Send and recive notifications, messages, updates and any data, in real-time with custom events and methods served on your own web, Dropper is Open Source, self-served and FREE forever!

###### Someone said:

>"Easily build scalable realtime graphs, geotracking, multiplayer games, and more in your web and mobile apps with **our hosted pub/sub messaging API**."

###### We say:

>"Easily build scalable realtime aplications with **our Open Source self-hosted pub/sub messaging API."**

## What can I do with Dropper?

**Dropper** is a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) solution for sending data between servers and clients, all in real-time.

Our **Server and Client APIs** are designed to handle real-time data sent by your peers, you can work with our structured event methods that allows to handle, send and receive data in a simpler way..

### Event methods:

- **Socket**, by default **Dropper** returns a socket instance, this is a **simplified but traditional way** to send and receive data through WebSocket, **based on customized events**. 

   You can listen and send events in real-time to run code as you need it, **on the client and server side**.

    **client.js**

      socket.emit("pizza", "I sent you a pizza!");
      socket.on("thanks", function(data){
        console.log(data) // => Hey mate thank you!
      });

    **server.js**

      sokcet.on("pizza", function(data){
        console.log(data) // => I sent you a pizza!
        socket.emit("thanks", "Hey mate thank you!");
      });


- **Channels**, are dedicated spaces to **listen and send data to specific users** who are subscribed to them, the channels are designed to **communicate more easily between peers** in **a personalized space** with the same WebSocket techonology, in this way you can send data in real-time just to listeners who need it.

    **client.js**

        var channel = dropper.subscribe('my-channel');
        channel.bind('my-event', function(data) {
          console.log(data.message) /* => Message sent from my-channel
          and triggered by the my-event event*/
        });

    **server.js**

        pusher.trigger('my-channel', 'my-event', {
          "message": "Message sent from my-channel and triggered by the my-event event"
        });

---

## Documents

###### Go to the [API section]("") to learn how to use Dropper and its methods. With Dropper you can do what you want without any paid third-party service.

## Credits

Lead Developer - Denyn crawford (@samaels_bitch)

## License

The MIT License (MIT)

Copyright (c) 2019 Denyn Crawford

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
