const express = require('express');
const app = express();
const path = require('path');
const _ = require('lodash');
const Dropper = require("dropperjs")(app);
const cors = require('cors');
const bodyParser = require('body-parser');
const dropper = new Dropper({
  appName: "my-dropper",
  apiKey: "788caa30-2226-4957-9dec-7c3ae5fbd479"
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());

app.get("/", function(req, res) {
  res.sendFile(path.resolve("views/index.html"));
});

var relative = []

dropper.on("dataSync", function(ws, id, user) {
  var action;
  if (user.action) {
    action = user.action;
  }
  if (action == "add") {
    var usermodel = [{id:user.id, connectionID:id}];
    relative = _.unionBy(relative, usermodel, "id");
  }else if (action == "remove") {
    for (var i = 0; i < relative.length; i++) {
      if (relative[i].connectionID == id) {
        relative.splice(i,1)
      }
    }
  }
});

dropper.on("newUser", function(data) {
  dropper.emit("newUser", data.message)
});

var online = [];

dropper.on("updateUsers", function (data) {
  if (data.message.unload) {
    for (var i = 0; i < online.length; i++) {
      if (online[i].id == data.message.peer) {
        online.splice(i,1);
      }
    }
    dropper.emit("updateUsers", online)
  }else {
    data = data.message;
    if (online.length > 0 && data.length > 0) {
      online = _.unionBy(online, data, "id")
    }else {
      online = data;
    }
    dropper.emit("updateUsers", online)
  }
})

dropper.on("sendMS", function(data) {
  dropper.emit("sended", data.message)
});

dropper.on("typing", function(data) {
  dropper.emit("typing", data.message)
});

dropper.on("close", function(ws) {
  _.remove(relative, function(el){
    return el.connectionID === ws.id;
  })
  var diff = _.differenceBy(online, relative, "id");
  _.pullAllBy(online, diff, "id");
});

app.listen(3000)
