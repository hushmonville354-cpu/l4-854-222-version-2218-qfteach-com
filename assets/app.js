(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMenu() {
        var button = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-to]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;
        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }
        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5600);
        }
        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-to")) || 0);
                start();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }
        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll(".js-search-panel"));
        panels.forEach(function (panel) {
            var grid = panel.parentElement.querySelector(".js-movie-grid") || document.querySelector(".js-movie-grid");
            if (!grid) {
                return;
            }
            var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
            var input = panel.querySelector("[data-search-input]");
            var yearSelect = panel.querySelector("[data-filter-year]");
            var typeSelect = panel.querySelector("[data-filter-type]");
            var empty = panel.parentElement.querySelector("[data-empty-state]") || document.querySelector("[data-empty-state]");
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";
            if (input && initialQuery) {
                input.value = initialQuery;
            }
            function apply() {
                var query = normalize(input ? input.value : "");
                var year = normalize(yearSelect ? yearSelect.value : "");
                var type = normalize(typeSelect ? typeSelect.value : "");
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = normalize(card.getAttribute("data-search"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var cardType = normalize(card.getAttribute("data-type"));
                    var matched = true;
                    if (query && haystack.indexOf(query) === -1) {
                        matched = false;
                    }
                    if (year && cardYear.indexOf(year) === -1) {
                        matched = false;
                    }
                    if (type && cardType.indexOf(type) === -1) {
                        matched = false;
                    }
                    card.classList.toggle("is-hidden-card", !matched);
                    if (matched) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }
            [input, yearSelect, typeSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", apply);
                    control.addEventListener("change", apply);
                }
            });
            apply();
        });
    }

    function mountPlayer(videoId, coverId, streamUrl) {
        var video = document.getElementById(videoId);
        var cover = document.getElementById(coverId);
        if (!video || !cover || !streamUrl) {
            return;
        }
        var prepared = false;
        var requested = false;
        var hls = null;
        function tryPlay() {
            var promise = video.play();
            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    cover.classList.remove("is-hidden");
                });
            }
        }
        function prepare() {
            if (prepared) {
                return;
            }
            prepared = true;
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = streamUrl;
                return;
            }
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    if (requested) {
                        tryPlay();
                    }
                });
                hls.on(window.Hls.Events.ERROR, function () {
                    cover.classList.remove("is-hidden");
                });
                return;
            }
            video.src = streamUrl;
        }
        function start() {
            requested = true;
            cover.classList.add("is-hidden");
            prepare();
            tryPlay();
        }
        cover.addEventListener("click", start);
        video.addEventListener("click", function () {
            if (video.paused) {
                start();
            }
        });
        video.addEventListener("play", function () {
            cover.classList.add("is-hidden");
        });
        video.addEventListener("ended", function () {
            cover.classList.remove("is-hidden");
        });
        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    window.SitePlayer = {
        mount: mountPlayer
    };

    ready(function () {
        initMenu();
        initHero();
        initFilters();
    });
}());
