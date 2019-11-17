const express = require('express');
const app = express();
const Dropper = require('dropperjs')(app);
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dropper = new Dropper({
  appName: "my-dropper",
  apiKey: "788caa30-2226-4957-9dec-7c3ae5fbd479"
});

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());

app.get("/", function(req, res) {
  res.sendFile(path.resolve("views/index.html"));
})

dropper.on("sendMS", function(data) {
  console.log(dropper.clients.ids);
  dropper.emit("sended", data.message)
})

app.listen(3000)
