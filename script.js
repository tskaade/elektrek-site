/* Elektrek — minimal interactivity: gallery thumbnails + dynamic year */
(function () {
  "use strict";

  // Gallery: clicking a thumbnail swaps the main image
  document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
    var mainImg = gallery.querySelector(".g-main img");
    var thumbs = gallery.querySelectorAll(".g-thumb");
    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var src = btn.getAttribute("data-src");
        if (src && mainImg) {
          mainImg.src = src;
          var thumbImg = btn.querySelector("img");
          mainImg.alt = thumbImg ? thumbImg.alt : mainImg.alt;
        }
        thumbs.forEach(function (t) { t.classList.remove("is-active"); });
        btn.classList.add("is-active");
      });
    });
  });

  // Footer year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
