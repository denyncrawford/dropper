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

//Utils

$.fn.toggleText = function(t1, t2){
  if (this.text() == t1) this.text(t2);
  else                   this.text(t1);
  return this;
};
