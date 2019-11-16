function Dropper(config) {

  var username = config.username,
  app = config.appName,
  pass = config.password,
  encription = config.secret,
  conection = config.conect

  var socket = new WebSocket("ws://"+conection.domain+conection.path, encription);

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
        socket.onopen = function(res) {
          return cb(res)
        }
        break;
      case "message":
        socket.onmessage = function(res) {
          var data = res.data;
          if (isJson(res.data)) {
            data = JSON.parse(res.data);
          }
          return cb(data)
        }
        break;
      case "close":
        socket.onclose = function(res) {
          return cb(res)
        }
        break;
      default:
        socket.onmessage = function(res) {
          console.log(isJson(res.data));
          if (isJson(res.data)) {
            data = JSON.parse(res.data);
          }
          if (!data.event) return cb("Not event detected, try the default 'message' event to read raw data.")
          if (evt == data.event) {
            return cb(data.message, data)
          }
        }
    }
  }
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
