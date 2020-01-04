//Global Function

function Dropper(server) {
  function Instance(config) {
    var username = config.username,
    name = config.appName,
    pass = config.password,
    connection = config.connect || {},
    apiKey = config.apiKey,
    appRoute = connection.appRoute || "/dropper",
    logs = config.logs || false,
    secure = connection.secure || false,
    perms = connection.perms;

    if (appRoute[0] != "/") appRoute = "/"+ appRoute;
    if (!apiKey || apiKey.length == 0) {
      console.error("Please provide any apiKey in the options to secure the Droppet instance");
      return
    }

    const events = require('events');
    const express = require('express');
    const bodyParser = require('body-parser');
    const em = new events.EventEmitter();
    em.setMaxListeners(0)
    const uuid = require('uuid/v1');
    const fs = require('fs');
	  const ip = require("ip")
    const pug = require('pug');
    const cors = require('cors');
    //const Datastore = require('nedb');
    //const db = new Datastore({ filename: './store/datastore.json', autoload: true });
    const expressWs = require('express-ws')(server);
    const xterm = require('xterm');

    // Open Websocket connection

    var ids = [];
    var aWss = expressWs.getWss(appRoute);
    var clients = aWss.clients;
    var sign = false;

    server.use(cors());
    server.use(bodyParser.json());

    server.get(appRoute, function(req, res, next) {
      console.log(req.hostname);
      var auth = req.get("Authorization");
      var id = req.query.id;
      var checkProtocol = req.connection.encrypted;
      if (!id) {
        res.send(JSON.stringify({message:"Wrong auth credentials.",bool:false}))
        em.emit("sign", sign)
        return next();
      }
      if (secure && !checkProtocol) {
        aWss.clients.forEach((client) => {
          if (client.id == id) client.close(1002, "Not Secure.")
        });
        res.send(JSON.stringify({message:"Set the the secure option to false to allow not seccure connections.",bool:false}))
        return next();
      }
      if (auth != apiKey) {
        aWss.clients.forEach((client) => {
          if (client.id == id) client.close(4001, "Unauthorized");
        });
        res.send(JSON.stringify({message:"Wrong auth credentials.",bool:false}))
        em.emit("sign", sign, id)
      }else {
        sign = true;
        em.emit("sign", sign, id)
        res.send(JSON.stringify({message:"Success connection.",bool:true}));
      }
    });

    server.ws(appRoute, function(ws, req) {
      ws.id = req.query.id;
      var refID = ws.id;
      ids.push(refID);
      ws.on('message', function(msg) {
        var pre = msg;
        if (isJson(msg)) {
          pre = JSON.parse(msg);
        }
        if (pre.event == "dataSync") {
          em.emit("dataSync", {ws: ws, id:ws.id, data:pre.message});
        }else {
          em.emit("message", msg);
        }
      });
      ws.on("close", function() {
        var id = ws.id;
        for (var i = 0; i < ids.length; i++) {
          if (ids[i] == id) {ids = ids.splice(i,1); break;}
        }
        var msg = {id:id, all:ids};
        em.emit("d-disconnection", msg);
        var model = {event:"dropper_disconnection", message:msg};
        aWss.clients.forEach((client) => {
          client.send(JSON.stringify(model));
        });
        em.emit("close", ws);
      })
    });

    aWss.on("connection", (ws) => {
      var msg = {id:ws.id, all:ids}
      em.emit("d-connection", msg);
      var model = {event:"dropper_connection", message:msg};
      aWss.clients.forEach((client) => {
        client.send(JSON.stringify(model));
      });
    })

    em.on("sign", (data, id) => {
      if (!data && id) {
        aWss.clients.forEach((client) => {
          if (id == client.id) client.close();
        })
      }
    })

    // Find User/Instance

    /*db.find({username:username}, function(err, doc) {
      if (err) throw err;
      if (doc.length > 1) {
        throw "User already taken, take another username to this new instance.";
      }else if (doc.length == 0){
        var newUserModel = {
          username: username,
          password: pass,
          encription: encriptionKey,
          apps: {
            [app]: {}
          }
        }
        var keys = Object.keys(newUserModel);
        for (var i = 0; i < keys.length; i++) {
          if (newUserModel[keys[i]] == null && newUserModel[keys[i]] == undefined) {
            throw "Seem like you're missconfigurating the "+keys[i]+" value in your Dropper instance."
          }
        }
        db.insert(newUserModel, function(err, newdoc) {
          if (err) throw err
        })
      }else if (doc.length == 1) {
        doc = doc[0];
        if (!doc.apps[app]) {
          var route = "apps."+app;
          db.update({username:username},{$set: {[route]:{}}}, {}, function(err, changed) {
            if (err) throw err;
          });
        }
      }
    });
*/
    //Expected Console Connectios

    var clientRoute = appRoute + "/console"
    const index = pug.compileFile(__dirname +'/lib/console/index.pug');

    server.use(clientRoute, express.static(__dirname + '/lib/console/public'));

    server.get(clientRoute, function(req, res) {
      res.send(index({
        title: "Dropper Web Console - " + name,
        appname: name
      }))
    });

    //WebSocket api

    this.client = function(clientID) {
      if (typeof clientID == "undefined") return "No conection detected, please execute this on events methods."
      aWss.clients.forEach((client) => {
        if (client.id == clientID) {
          return client;
        }
      })
    }

    this.client.id = function() {
      if (aWss.clients.length <= 0) return "No conection detected, please execute this on events methods."
      aWss.clients.forEach((client) => {
        if (client.id == clientID) {
          return client.id;
        }
      })
    };

    this.clients = aWss.clients;

    this.clients.ids = ids;

    //Websocket main triggers

    this.emit = function(evt, data) {
      if (typeof data == "undefined") {
        data = evt;
        evt = null;
        aWss.clients.forEach((client) => {
          client.send(JSON.stringify({message:data}));
        });
      }else {
        aWss.clients.forEach((client) => {
          client.send(JSON.stringify({event:evt, message:data}));
        });
      }
    }

    this.close = function(c,r,id) {
      var code = c || 1000;
      var reason = r || "";
      if (!id) {
        aWss.clients.forEach((client) => {
          client.close();
        })
      }else {
        aWss.clients.forEach((client) => {
          if (client.id == id) {
            client.close();
          }
        })
      }
    }

    this.client.emit = function(clientID, evt, data) {
      if (typeof clientID == "undefined") return "Please, introduce a ClientID to send the event."

      if (typeof data == "undefined") {
        data = evt;
        evt = null;
        aWss.clients.forEach((client) => {
          if (client.id == clientID) {
            client.send(JSON.stringify({message:data}));
          }
        });
      }else {
        aWss.clients.forEach((client) => {
          if (client.id == clientID) {
            client.send(JSON.stringify({event:evt, message:data}));
          }
        });
      }
    }

    //Websocket event Listeners

    this.on = function(evt, cb) {
      switch (evt) {
        case "dropper_connection":
          em.on("d-connection", function(msg) {
            return cb(msg)
          });
          break;
        case "dropper_disconnection":
          em.on("d-disconnection", function(msg) {
            return cb(msg)
          });
          break;
        case "dataSync":
          em.on("dataSync", function(msg) {
            return cb(msg.ws,msg.id,msg.data)
          })
          break;
        case "message":
          em.on("message", function(msg) {
            if (isJson(msg)) {
              msg = JSON.parse(msg);
            }
            if (msg.channel) return;
            return cb(msg)
          });
          break;
        case "close":
          em.on("close", function(id) {
            return cb(id)
          });
          break;
        default:
          em.on("message", function(msg) {
            if (isJson(msg)) {
              msg = JSON.parse(msg);
            }
            if (msg.channel) return;
            if (msg.event == evt) return cb(msg)
            return;
          });
          break;
      }
    }

    // Channels API

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
        aWss.clients.forEach((client) => {
          client.send(JSON.stringify({channel:channel, message:data}));
        });
      }else {
        aWss.clients.forEach((client) => {
          client.send(JSON.stringify({channel: channel, event:evt, message:data}));
        });
      }
    }

    this.test = function() {
      console.log("Dropper is working!");
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
  }
  return Instance;
}

module.exports = Dropper;
