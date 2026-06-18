(function () {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");

    if (toggle && panel) {
        toggle.addEventListener("click", function () {
            panel.classList.toggle("is-open");
        });
    }

    var queryInput = document.querySelector("[data-query-input]");
    var filterInput = document.querySelector("[data-filter-input]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
    var count = document.querySelector("[data-filter-count]");
    var empty = document.querySelector("[data-empty-state]");

    function normalize(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    }

    function updateCards(value) {
        var keyword = normalize(value);
        var visible = 0;

        cards.forEach(function (card) {
            var haystack = normalize(card.getAttribute("data-search"));
            var matched = !keyword || haystack.indexOf(keyword) !== -1;
            card.style.display = matched ? "" : "none";
            if (matched) {
                visible += 1;
            }
        });

        if (count) {
            count.textContent = visible ? "匹配 " + visible + " 部影片" : "没有匹配内容";
        }

        if (empty) {
            empty.classList.toggle("is-visible", visible === 0);
        }
    }

    if (filterInput && cards.length) {
        if (queryInput) {
            var params = new URLSearchParams(window.location.search);
            var q = params.get("q") || "";
            queryInput.value = q;
            updateCards(q);
        } else {
            updateCards(filterInput.value);
        }

        filterInput.addEventListener("input", function () {
            updateCards(filterInput.value);
        });
    }
})();

function initMoviePlayer(videoId, overlayId, sourceUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    var loaded = false;
    var hlsPlayer = null;

    if (!video || !overlay || !sourceUrl) {
        return;
    }

    function attachSource() {
        if (loaded) {
            return;
        }

        loaded = true;

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
            return;
        }

        if (window.Hls && window.Hls.isSupported()) {
            hlsPlayer = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsPlayer.loadSource(sourceUrl);
            hlsPlayer.attachMedia(video);
            return;
        }

        video.src = sourceUrl;
    }

    function startPlayer() {
        attachSource();
        overlay.classList.add("is-hidden");
        video.setAttribute("controls", "controls");
        var playTask = video.play();

        if (playTask && typeof playTask.catch === "function") {
            playTask.catch(function () {
                overlay.classList.remove("is-hidden");
            });
        }
    }

    overlay.addEventListener("click", startPlayer);
    video.addEventListener("click", function () {
        if (video.paused) {
            startPlayer();
        }
    });
    video.addEventListener("play", function () {
        overlay.classList.add("is-hidden");
    });
    video.addEventListener("ended", function () {
        overlay.classList.remove("is-hidden");
    });
    window.addEventListener("beforeunload", function () {
        if (hlsPlayer) {
            hlsPlayer.destroy();
        }
    });
}
