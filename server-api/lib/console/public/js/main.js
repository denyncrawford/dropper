var maxwidth = 0;

$('nav.expn-menu .button-container button').each(function () {
    maxwidth = ($(this).width() > maxwidth ? $(this).width() : maxwidth);
    console.log(maxwidth);
});

$('nav.expn-menu .button-container button').width(maxwidth);

$(".coll").click(function() {
  $(this).children("i").toggleClass("cr-chevron-right");
  $(this).children("i").toggleClass("cr-chevron-left");
  $("#resizer-btn .title p").toggleText("Expand", "Collapse");
  $("nav").toggleClass("coll-menu");
  $("nav").toggleClass("expn-menu");
});

$(".button-container button").not("#resizer-btn").not("#sign").click(function() {
  var sectionID = $(this).attr("rel");
  $("#main-sandbox .sectionCanvas").not("#"+sectionID).removeClass("active");
  $(".button-container button").not(this).removeClass("active");
  $("#main-sandbox .sectionCanvas").not("#"+sectionID).hide();
  $("#"+sectionID).addClass("active");
  $(this).addClass("active");
  $("#"+sectionID).fadeIn();
  if ($(".button-container button[rel='terminal']").hasClass("active")) {
    $("nav").css({"background-color":"#edeef1"});

  }else {
    $("nav").css({"background-color":"#292f36"});
  }
});

//Utils

$.fn.toggleText = function(t1, t2){
  if (this.text() == t1) this.text(t2);
  else                   this.text(t1);
  return this;
};
