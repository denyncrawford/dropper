function Dropper(config) {

  var username = config.username,
  app = config.appName,
  pass = config.password,
  auth = config.apiKey,
  connection = config.connect,
  path = connection.path || "/dropper",
  logs = config.logs || false,
  protocol = "http://",
  wsProtocol = "ws://",
  secure = connection.secure || false;

  if (secure == true) {
    protocol = "https://";
    wsProtocol = "wss://"
  }
  if (path[0] != "/") path = "/"+ path;
  if (!auth || auth.length == 0) {
    console.error("Please provide any apiKey in the options to connect the Droppet instance");
    return
  }

  var socket = new WebSocket(wsProtocol+connection.domain+path);

  var em = new EventEmitter();

  fetch(protocol+connection.domain+path, {
    method: "GET",
    mode: "cors",
    headers: {
      "Authorization": auth,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(pass => {
    if (!pass.bool) {
      socket.close();
      console.log(pass.message);
  }
  });

  // Events

  socket.onmessage = (res) => {
    em.emit("message", res.data);
  }

  socket.onopen = function(res) {
    em.emit("open", res.data);
  }

  // RAW socket functions

  this.emit = function(thisEvent, thisMessage) {
    if (typeof thisMessage === "undefined") {
      thisMessage = thisEvent;
      thisEvent = null;
      socket.send(thisMessage);
    }else{
      socket.send(JSON.stringify({event:thisEvent, message:thisMessage}));
    }
  }

  this.close = function() {
    socket.close();
  }

  this.on = function(evt, cb) {
    switch (evt) {
      case "open":
        em.on("open",function(res) {
          return cb(res)
        })
        break;
      case "message":
        em.on("message", function(data) {
          console.log(data);
          if (isJson(data)) {
            data = JSON.parse(data);
          }
          if (data.channel) return;
          return cb(data);
        })
        break;
      case "close":
        socket.onclose = function(res) {
          return cb(res)
        }
        break;
      default:
        em.on ("message", function(data) {
          if (isJson(data)) {
            data = JSON.parse(data);
          }
          if (!data.event) return cb("Not event detected, try the default 'message' event to read raw data.")
          if (evt == data.event) {
            if (data.channel) return;
            return cb(data.message, data)
          }
        })
    }
  }

  this.subscribe = function(channelName) {
    var bind = function (evt, cb) {
      em.on("message", function(msg) {
        if (isJson(msg)) {
          msg = JSON.parse(msg);
        }
        if (!msg.channel) return;
        if (msg.channel != channelName) return;
        if (msg.event == evt) return cb(msg.message)
        return;
      })
    }
    return {
      bind: bind
    }
  }

  this.trigger = function(channel, evt, data) {
    if (typeof channel == "undefined") return console.log("Please provide a channel to use the trigger method.");
    if (typeof data == "undefined") {
      data = evt;
      evt = null;
      socket.send(JSON.stringify({channel:channel, message:data}));
    }else {
      socket.send(JSON.stringify({channel: channel, event:evt, message:data}));
    }
  }
  //-------
}

// Utils

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/* Polyfill indexOf. */
var indexOf;

if (typeof Array.prototype.indexOf === 'function') {
    indexOf = function (haystack, needle) {
        return haystack.indexOf(needle);
    };
} else {
    indexOf = function (haystack, needle) {
        var i = 0, length = haystack.length, idx = -1, found = false;

        while (i < length && !found) {
            if (haystack[i] === needle) {
                idx = i;
                found = true;
            }

            i++;
        }

        return idx;
    };
};


/* Polyfill EventEmitter. */

var EventEmitter = function () {
    this.events = {};
};

EventEmitter.prototype.on = function (event, listener) {
    if (typeof this.events[event] !== 'object') {
        this.events[event] = [];
    }

    this.events[event].push(listener);
};

EventEmitter.prototype.removeListener = function (event, listener) {
    var idx;

    if (typeof this.events[event] === 'object') {
        idx = indexOf(this.events[event], listener);

        if (idx > -1) {
            this.events[event].splice(idx, 1);
        }
    }
};

EventEmitter.prototype.emit = function (event) {
    var i, listeners, length, args = [].slice.call(arguments, 1);

    if (typeof this.events[event] === 'object') {
        listeners = this.events[event].slice();
        length = listeners.length;

        for (i = 0; i < length; i++) {
            listeners[i].apply(this, args);
        }
    }
};

EventEmitter.prototype.once = function (event, listener) {
    this.on(event, function g () {
        this.removeListener(event, g);
        listener.apply(this, arguments);
    });
};
