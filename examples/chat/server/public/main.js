// Login

var dropper = new Dropper({
  appName: "my-dropper",
  apiKey: "788caa30-2226-4957-9dec-7c3ae5fbd479",
  connect: {
    secure: true,
    domain: "192.168.0.249:3000"
  }
});

$(document).ready(function() {
  var cookie = Cookies.get("login");
  if (cookie == undefined || cookie == null) {
    Cookies.set("login", uuid.v1());
  }
});

var online = [];

dropper.on("newUser", function(user) {
  online.push(user)
});

dropper.on("updateUsers", function(users) {
  online = users;
  $(".header h4 span").html("("+users.length+" Online)");
});

$("#nameset").on("keypress", (e) => {
  $("#nameset").removeClass("wrong");
  if (e.code == "Enter") {
    var name = $("#nameset").val();
    if (name.length == 0) {
      $("#nameset").addClass("wrong");
    }else {
      var pictureString = name.split(" ").join("+");
      var user = {
        username: name,
        id: Cookies.get("login"),
        piture: "https://ui-avatars.com/api/?name="+pictureString+"&bold=true&background=30EEA4&color=242424"
      }
      Cookies.set("user", user);
      $("#nameset").fadeOut(200);
      setTimeout(() => {
        $(".nameSelector h2").fadeIn(200);
        dropper.emit("newUser", user);
      }, 300)
      setTimeout(() => {
        dropper.emit("updateUsers", online);
        $(".nameSelector").fadeOut(200);
      },2000)
    }
  }
})

var stopTyping;
var gCookie = Cookies.get("login");
var typing = false;

$("#mainText").on("keydown", () => {
  if (!typing) {
    dropper.emit("typing", {peer:gCookie, state:true});
    typing = true;
  }
  clearTimeout(stopTyping);
});

$("#mainText").on("keyup", (e) => {
  clearTimeout(stopTyping);
  stopTyping = setTimeout(() => {
    typing = false;
    dropper.emit("typing", {peer:gCookie, state:false});
  },1500)
});

$("#mainText").on("keydown", function(e) {
  var value = $(this).val();
  var cookie = Cookies.get("login")
  if (e.code == "Backspace") {
    typing = false;
    clearTimeout(stopTyping);
    dropper.emit("typing", {peer:cookie, state:false});
  }
  if (e.code == "Enter" && value.length != 0 ) {
    var append = new SendMS({
      message: value,
      date: moment().format("DDMMYYYh:mm:ss"),
      peer: cookie
    })
    $(this).val("");
    typing = false;
    clearTimeout(stopTyping);
    dropper.emit("typing", {peer:cookie, state:false});
  }
});

dropper.on("typing", function(data) {
  var box = $(".mainScroll");
  var last = $(".messageGroup").last();
  if (data.state) {
    if (data.peer != gCookie) {
      if (last.hasClass("other") && last.hasClass(data.peer)) {
        last.append("<div data-typing="+data.peer+" class='message typing'><div class='dots'><div class='dot'></div> <div class='dot'></div> <div class='dot'></div></div></div>");
        $(".chatview").scrollTop(box.height());
      }else {
        var img;
        var username;
        for (var i = 0; i < online.length; i++) {
          if (data.peer == online[i].id) {
            img = online[i].piture;
            username = online[i].username
            break;
          }
        }
        box.append("<div data-typing="+data.peer+" class='messageGroup other "+data.peer+"'><div class='userPiture' style='background-image:url("+img+")'><p class='username'>"+username+"</p></div><div data-typing="+data.peer+" class='message typing'><div class='dots'><div class='dot'></div> <div class='dot'></div> <div class='dot'></div></div></div></div>")
        $(".chatview").scrollTop(box.height());
      }
    }
  }else {
    $('*[data-typing='+data.peer+']').remove();
  }
});

function SendMS(params) {
  var message = params.message,
  date = params.date,
  peer = params.peer,
  relative = moment(date, "DDMMYYYh:mm:sss").fromNow();
  dropper.emit("sendMS", params);
}

var title = document.querySelector("title");
var originalText = title.innerHTML;
var notSeen = 0;
var notif = document.getElementById("notif");

dropper.on("sended", function(data) {
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
  var bLast = $(".messageGroup").eq(-2);
  if (data.peer == cookie) {
    if (last.hasClass("me") && last.hasClass(data.peer)) {
      last.append("<div class='message'><p>"+data.message+"</p></div>");
      $(".chatview").scrollTop(box.height());
    }else {
      box.append("<div class='messageGroup me "+data.peer+"'><div class='message'><p>"+data.message+"</p></div></div>")
      $(".chatview").scrollTop(box.height());
    }
  } else {
    if (last.hasClass("other") && last.hasClass(data.peer) && last.data("typing") != data.peer) {
      last.append("<div class='message'><p>"+data.message+"</p></div>");
      $(".chatview").scrollTop(box.height());
    } else if (bLast.hasClass("other") && bLast.hasClass(data.peer) && bLast.data("typing") != data.peer) {
      bLast.append("<div class='message'><p>"+data.message+"</p></div>");
      $(".chatview").scrollTop(box.height());
    } else {
      var img;
      var username;
      for (var i = 0; i < online.length; i++) {
        if (data.peer == online[i].id) {
          img = online[i].piture;
          username = online[i].username;
          break;
        }
      }
      box.append("<div class='messageGroup other "+data.peer+"'><div class='userPiture' style='background-image:url("+img+")'><p class='username'>"+username+"</p></div><div class='message'><p>"+data.message+"</p></div></div>")
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

$(window).on("beforeunload", function() {
  dropper.emit("updateUsers", {unload:true, peer:gCookie});
});
