function Dropper(config) {

  var username = config.username,
  app = config.appName,
  pass = config.password,
  auth = config.apiKey,
  connection = config.connect,
  domain = connection.domain || window.location.host,
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
    return;
  }

  var em = new EventEmitter();
  var prevClosing;
  var isCLosed = false;
  var pending = [];

  // HandShake

  fetch(protocol+domain+path, {
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
      if (ws) ws.close(4001, "Unauthorized");
      console.error(pass.message);
      isCLosed = true;
    }else {
      var ws = new WebSocket(wsProtocol+domain+path);
      isCLosed = false;

      // Events

      var onmessage = function (res){
        em.emit("message", res.data);
      }

      var onopen = function (res){
        em.emit("open", res.data);
        if (pending.length > 0) {
          for (var i = 0; i < pending.length; i++) {
            ws.send(pending[i]);
          }
          pending = [];
        }
        prevClosing = setInterval(() => {
          ws.send("dropper:prevent");
        },25000);
      }

      var onclose = function(res) {
        isCLosed = true;
        var code = res.code;
        clearInterval(prevClosing);
        if (code == 1002 || code == 4001 || code == 1000) {
          em.emit("close", res)
        }else {
          ws = null;
          var srt = setInterval(() => {
            if (navigator.onLine && isCLosed) {
              ws = new WebSocket(wsProtocol+domain+path);
              ws.onmessage = onmessage;
              ws.onopen = onopen;
              ws.onclose = onclose;
              isCLosed = false;
              clearInterval(srt);
            }else {
              console.log("Dropper is trying to reconnect...");
            }
          },100)
        }
      }

      ws.onmessage = onmessage;
      ws.onopen = onopen;
      ws.onclose = onclose;

      // RAW socket methods

      this.emit = function(thisEvent, thisMessage) {
        if (typeof thisMessage === "undefined") {
          thisMessage = thisEvent;
          thisEvent = null;
          ws.send(thisMessage);
        }else{
          if (isCLosed) {
            pending.push(JSON.stringify({event:thisEvent, message:thisMessage}));
            console.error("The connection is closed, but Dropper added your data in the queue to be sent when reconnecting.");
          }else {
            ws.send(JSON.stringify({event:thisEvent, message:thisMessage}));
          }
        }
      }

      this.close = function(c,r) {
        var code = c || 1000;
        var reason = r || "";
        ws.close(code, reason)
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
              if (isJson(data)) {
                data = JSON.parse(data);
              }
              if (data.channel) return;
              return cb(data);
            })
            break;
          case "close":
            em.on("close", function(res) {
              return cb(res)
            });
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

      // Channels methods

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
          ws.send(JSON.stringify({channel:channel, message:data}));
        }else {
          ws.send(JSON.stringify({channel: channel, event:evt, message:data}));
        }
      }
    }
  });
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
