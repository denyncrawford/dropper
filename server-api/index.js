//Global Function

function Dropper(server) {
  function Instance(config) {
    var username = config.username,
    app = config.appName,
    pass = config.password
    server = server || config.server,
    apiKey = config.apiKey,
    appRoute = config.appRoute || "dropper",
    logs = config.logs || false;

    const events = require('events');
    const express = require('express');
    const em = new events.EventEmitter();
    const uuid = require('uuid/v1');
    const fs = require('fs');
    const pug = require('pug');
    const Datastore = require('nedb');
    const db = new Datastore({ filename: './store/datastore.json', autoload: true });
    const expressWs = require('express-ws')(server);
    const xterm = require('xterm');

    // Open Websocket connection

    var clients = {};
    var ids = [];
    var gWs;
    var aWss = expressWs.getWss(appRoute);

    server.get(appRoute, function(req, res) {
      var auth = req.get("Authorization");
      if (auth != apiKey) {
        gWs.close();
        res.send(JSON.stringify({message:"Wrong auth credentials.",bool:false}))
      }else {
        res.send(JSON.stringify({message:"Success connection.",bool:true}))
      }
    })

    server.ws(appRoute, function(ws, req) {
      gWs = ws;
      ws.id = req.headers['sec-websocket-key'];
      var refID = ws.id;
      ids.push(refID);
      clients[ws.id] = ws;
      var response = {event:"session", data:{connection:refID}};
      clients[refID].send(JSON.stringify(response));
      ws.on('message', function(msg) {
        em.emit("message", msg);
      });
      ws.on("close", function() {
        delete clients[ws.id];
        for (var i = 0; i < ids.length; i++) {
          if (ids[i] == ws.id) ids.splice(i);
        }
        em.emit("close", ws.id);
      })
    });

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
        title: "Dropper Web Console - " + app,
        appname: app
      }))
    });

    //WebSocket api

    this.client = function() {
      if (typeof gWs == "undefined") return "No conection detected, please execute this on events methods."
      return gWs
    }

    this.client.id = function() {
      if (typeof gWs == "undefined") return "No conection detected, please execute this on events methods."
      return gWs.id
    };

    this.clients = clients;

    this.clients.ids = ids;

    //Websocket main triggers

    this.emit = function(evt, data) {
      if (typeof gWs == "undefined") return

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

    this.close = function() {
      gWs.close()
    }

    this.client.emit = function(clientID, evt, data) {
      if (typeof gWs == "undefined") return
      if (typeof clientID == "undefined") return "Please, introduce a ClientID to send the event."

      if (typeof data == "undefined") {
        data = evt;
        evt = null;
        clients[clientID].send(JSON.stringify({message:data}));
      }else {
        clients[clientID].send(JSON.stringify({event:evt, message:data}));
      }
    }

    //Websocket event Listeners

    this.on = function(evt, cb) {
      switch (evt) {
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

    // Data pusher notifications

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
      if (typeof gWs == "undefined") return
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
