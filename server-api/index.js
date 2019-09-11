//Global Function

function Dropper(config) {

  var username = config.username,
  app = config.appName,
  pass = config.password
  server = config.server,
  encriptionKey = config.encription,
  appRoute = config.appRoute;

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
    })
  });

  // Find User/Instance

  db.find({username:username}, function(err, doc) {
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

  //Expected Console Connectios

  var clientRoute = appRoute + "/console"
  const index = pug.compileFile('./lib/console/index.pug');

  server.use(clientRoute, express.static(__dirname + '/lib/console/public'));

  server.get(clientRoute, function(req, res) {
    res.send(index({
      title: "Dropper Web Console - " + app,
      appname: app
    }))
  });

  // Constructor operational functions

  this.authenticate = function (req, res, done) {
    var username = req.headers.username;
    var password = req.headers.password;
    db.find({username:username}, function(err, doc) {
      if (err) {
        res.send(err);
        return;
      }
      doc = doc[0];
      if (doc && doc.password === password) {
        return done();
      }else{
        res.status(401).send("Wrong authentication credentials.");
      }
    })
  }

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
      gWs.send(JSON.stringify({message:data}));
    }else {
      gWs.send(JSON.stringify({event:evt, message:data}));
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
          return cb(msg)
        });
        break;
      case "close":

        break;
      default:

    }
  }

  // Data pusher notifications

  this.trigger = function(channel, bEvent, data) {
    var route = "apps."+app+".channels."+channel;
    gWs.send("Sended from Global")
    db.update({username: username}, {$set:{[route]: data}}, {}, function(err, doc) {
      if (err) {
        console.log(err);
      }
      console.log("New "+bEvent+" event was triggered into "+channel+".");
    });
  }

  this.test = function() {
    console.log("Bourze pusher is working!");
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

module.exports = Dropper;
