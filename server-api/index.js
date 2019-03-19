//Global Function

function BPusher(config) {

  var username = config.username,
  app = config.appName,
  pass = config.password
  server = config.server,
  encriptionKey = config.encription;

  const events = require('events');
  const em = new events.EventEmitter();
  const uuid = require('uuid/v1');
  const fs = require('fs');
  const Datastore = require('nedb');
  const db = new Datastore({ filename: './store/datastore.json', autoload: true });
  var expressWs = require('express-ws')(server);

  // Open ws connection

  var clients = {};
  var gWs;

  server.ws('/socket', function(ws, req) {
    gWs = ws;
    ws.id = req.headers['sec-websocket-key'];
    var refID = ws.id;
    clients[ws.id] = ws;
    var response = {event:"session", data:{connection:refID}};
    clients[refID].send(JSON.stringify(response));
    ws.on('message', function(msg) {
      const ip = req.connection.remoteAddress;
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
          throw "Seem like you're missconfigurating the "+keys[i]+" value in your BPusher instance."
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

  this.clients = clients;

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
}

module.exports = BPusher;
