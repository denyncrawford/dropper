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

var stopTyping;
var gCookie = Cookies.get("login");
var typing = false;

$("#mainText").on("keydown", () => {
  if (!typing) {
    socket.emit("typing", {peer:gCookie, state:true});
    typing = true;
  }
  clearTimeout(stopTyping);
});

$("#mainText").on("keyup", () => {
  clearTimeout(stopTyping);
  stopTyping = setTimeout(() => {
    typing = false;
    socket.emit("typing", {peer:gCookie, state:false});
  },2000)
});

$("#mainText").on("keypress", function(e) {
  var value = $(this).val();
  var cookie = Cookies.get("login")
  if (e.code == "Enter" && value.length != 0 ) {
    console.log(cookie);
    var append = new SendMS({
      message: value,
      date: moment().format("DDMMYYYh:mm:ss"),
      peer: cookie
    })
    $(this).val("");
    clearTimeout(stopTyping);
    socket.emit("typing", {peer:cookie, state:false});
  }
});

socket.on("typing", function(data) {
  console.log(data);
})

function SendMS(params) {
  var message = params.message,
  date = params.date,
  peer = params.peer,
  relative = moment(date, "DDMMYYYh:mm:sss").fromNow();
  socket.emit("sendMS", params);
}

var title = document.querySelector("title");
var originalText = title.innerHTML;
var notSeen = 0;
var notif = document.getElementById("notif");

socket.on("sended", function(data) {
  var cookie = Cookies.get("login");
  var focused = document.hasFocus();
  if (!focused) {
    notSeen++
    title.innerHTML = originalText + " - " + notSeen + " new messages."
    notif.pause();
    notif.currentTime = 0;
    notif.play();
  }
  var box = $(".mainScroll");
  var last = $(".messageGroup").last();
  if (data.peer == cookie) {
    if (last.hasClass("me") && last.hasClass(data.peer)) {
      last.append("<div class='message'><p>"+data.message+"</p></div>");
      $(".chatview").scrollTop(box.height());
    }else {
      box.append("<div class='messageGroup me "+data.peer+"'><div class='message'><p>"+data.message+"</p></div></div>")
      $(".chatview").scrollTop(box.height());
    }
  } else {
    if (last.hasClass("other") && last.hasClass(data.peer)) {
      last.append("<div class='message'><p>"+data.message+"</p></div>");
      $(".chatview").scrollTop(box.height());
    }else {
      box.append("<div class='messageGroup other "+data.peer+"'><div class='message'><p>"+data.message+"</p></div></div>")
      $(".chatview").scrollTop(box.height());
    }
  }
});

$(window).focus(function() {
  title.innerHTML = originalText;
  notSeen = 0;
});

function isInWindow() {
  var state = true;
  $(window).focus(() => {
    state = true;
  })
  $(window).focusout(() => {
    state = false;
  })
  return state;
}
