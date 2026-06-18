(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  function setupMenu() {
    var button = document.querySelector("[data-menu-button]");
    var nav = document.querySelector("[data-mobile-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
      });
    });
    setInterval(function () {
      show(index + 1);
    }, 5200);
  }

  function setupFilters() {
    var inputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-input]"));
    inputs.forEach(function (input) {
      var scope = document.querySelector(input.getAttribute("data-filter-scope")) || document;
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
      var empty = scope.querySelector("[data-empty-state]");
      input.addEventListener("input", function () {
        var query = input.value.trim().toLowerCase();
        var visible = 0;
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-keywords") || card.textContent || "").toLowerCase();
          var match = !query || text.indexOf(query) !== -1;
          card.style.display = match ? "" : "none";
          if (match) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("show", visible === 0);
        }
      });
    });
  }

  function createCard(movie) {
    var article = document.createElement("article");
    article.className = "movie-card";
    var line = movie.oneLine || movie.genre || "高清在线播放";
    article.innerHTML = [
      '<a class="card-poster" href="' + movie.file + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="play-chip">播放</span>',
      '</a>',
      '<div class="card-body">',
      '<h3><a href="' + movie.file + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="card-line">' + escapeHtml(line) + '</p>',
      '<div class="card-meta"><span>' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.year) + '</span></div>',
      '</div>'
    ].join("");
    return article;
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setupSearchPage() {
    var input = document.querySelector("[data-search-input]");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");
    if (!input || !results || !window.MOVIE_SEARCH_DATA) {
      return;
    }
    function render(list) {
      results.innerHTML = "";
      list.slice(0, 96).forEach(function (movie) {
        results.appendChild(createCard(movie));
      });
      if (empty) {
        empty.classList.toggle("show", list.length === 0);
      }
    }
    render(window.MOVIE_SEARCH_DATA.slice(0, 24));
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        render(window.MOVIE_SEARCH_DATA.slice(0, 24));
        return;
      }
      var matches = window.MOVIE_SEARCH_DATA.filter(function (movie) {
        var text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.oneLine].join(" ").toLowerCase();
        return text.indexOf(query) !== -1;
      });
      render(matches);
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupSearchPage();
  });
})();

function initMoviePlayer(videoId, overlayId, source, poster) {
  var video = document.getElementById(videoId);
  var overlay = document.getElementById(overlayId);
  if (!video || !overlay || !source) {
    return;
  }
  var loaded = false;
  if (poster) {
    video.setAttribute("poster", poster);
  }
  function attach() {
    if (loaded) {
      return;
    }
    loaded = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls();
      hls.loadSource(source);
      hls.attachMedia(video);
    } else {
      video.src = source;
    }
  }
  function play() {
    attach();
    overlay.classList.add("is-hidden");
    var action = video.play();
    if (action && typeof action.catch === "function") {
      action.catch(function () {
        overlay.classList.remove("is-hidden");
      });
    }
  }
  overlay.addEventListener("click", play);
  video.addEventListener("click", function () {
    if (video.paused) {
      play();
    }
  });
}
