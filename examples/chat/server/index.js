const express = require('express');
const app = express();
const path = require('path');
const Dropper = require("dropperjs")(app);
const cors = require('cors');
const bodyParser = require('body-parser');
const dropper = new Dropper({
  appName: "my-dropper",
  apiKey: "788caa30-2226-4957-9dec-7c3ae5fbd479"
});

app.use(express.static(__dirname+'public'));
app.use(bodyParser.json());
app.use(cors());

app.get("/", function(req, res) {
  res.sendFile(path.resolve("views/index.html"));
})

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
    if (online.length > 0) {
      for (var i = 0; i < online.length; i++) {
        for (var j = 0; j < data.length; j++) {
          if (online[i].id != data[j].id) online.push(data[i])
        }
      }
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

app.listen(3000)
