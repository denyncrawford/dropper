// Login

var socket = new Dropper({
  appName: "my-dropper",
  apiKey: "788caa30-2226-4957-9dec-7c3ae5fbd479",
  connect: {
    domain: "192.168.0.249:3000"
  }
});

$(document).ready(function() {
  var cookie = Cookies.get("login");
  if (cookie == undefined || cookie == null) {
    Cookies.set("login", uuid.v1());
  }
});

$("#mainText").on("keypress", function(e) {
  var value = $(this).val();
  var cookie = Cookies.get("login")
  if (e.code == "Enter" && value.length != 0 ) {
    console.log(cookie);
    var appenn = new AppendMS({
      message: value,
      date: moment().format("DDMMYYYh:mm:ss"),
      peer: cookie
    })
    $(this).val("");
  }
});

function AppendMS(params) {
  var message = params.message,
  date = params.date,
  peer = params.peer,
  relative = moment(date, "DDMMYYYh:mm:sss").fromNow();
  socket.emit("appendMS", message);
  var box = $(".mainScroll");
  var last = $(".messageGroup").last();
  if (last.hasClass("me") && last.hasClass(peer)) {
    last.append("<div class='message'><p>"+message+"</p></div>");
    $(".chatview").scrollTop(box.height());
  }else {
    box.append("<div class='messageGroup me "+peer+"'><div class='message'><p>"+message+"</p></div></div>")
    $(".chatview").scrollTop(box.height());
  }
}
