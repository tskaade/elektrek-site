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

  // Marine Forecast: open in a long, narrow (phone-shaped) window on desktop.
  // Falls back to a normal new tab where the browser ignores the size
  // (most mobile browsers, strict popup blockers).
  document.querySelectorAll("[data-popup]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      var w = 420;
      var h = Math.min(900, Math.max(640, window.screen.availHeight - 80));
      // Center it on screen
      var left = Math.max(0, (window.screen.availWidth - w) / 2);
      var top = Math.max(0, (window.screen.availHeight - h) / 2);
      var features =
        "width=" + w + ",height=" + h +
        ",left=" + left + ",top=" + top +
        ",resizable=yes,scrollbars=yes";
      var popup = window.open(link.href, "marineForecast", features);
      // If the popup opened, prevent the default same-tab/new-tab navigation.
      // If it was blocked (popup === null), let the normal target="_blank" happen.
      if (popup) {
        e.preventDefault();
        popup.focus();
      }
    });
  });
})();
