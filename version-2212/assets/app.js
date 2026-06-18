(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function text(value) {
        return (value || "").toString().toLowerCase();
    }

    function escapeHtml(value) {
        return (value || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    ready(function () {
        var toggle = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-menu]");

        if (toggle && menu) {
            toggle.addEventListener("click", function () {
                menu.classList.toggle("is-open");
            });
        }

        document.querySelectorAll("[data-site-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = form.querySelector("input[name='q']");
                var query = input ? input.value.trim() : "";

                if (query) {
                    window.location.href = "search.html?q=" + encodeURIComponent(query);
                }
            });
        });

        document.querySelectorAll("[data-filter-area]").forEach(function (area) {
            var input = area.querySelector("[data-filter-input]");
            var year = area.querySelector("[data-filter-year]");
            var cards = Array.prototype.slice.call(area.querySelectorAll(".movie-card, .movie-list-item"));
            var empty = area.querySelector("[data-filter-empty]");

            function apply() {
                var query = text(input ? input.value : "");
                var selectedYear = year ? year.value : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = text([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-genre"),
                        card.getAttribute("data-year")
                    ].join(" "));
                    var yearValue = card.getAttribute("data-year") || "";
                    var matched = (!query || haystack.indexOf(query) !== -1) && (!selectedYear || yearValue === selectedYear);
                    card.hidden = !matched;

                    if (matched) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }

            if (year) {
                year.addEventListener("change", apply);
            }
        });

        var searchResults = document.querySelector("[data-search-results]");
        var searchForm = document.querySelector("[data-search-page-form]");
        var searchYear = document.querySelector("[data-search-year]");
        var searchEmpty = document.querySelector("[data-search-empty]");

        if (searchResults && window.SEARCH_MOVIES) {
            var params = new URLSearchParams(window.location.search);
            var initialQuery = params.get("q") || "";
            var input = searchForm ? searchForm.querySelector("input[name='q']") : null;

            if (input) {
                input.value = initialQuery;
            }

            function renderSearch() {
                var query = text(input ? input.value : "");
                var yearValue = searchYear ? searchYear.value : "";
                var matches = window.SEARCH_MOVIES.filter(function (movie) {
                    var haystack = text([
                        movie.title,
                        movie.region,
                        movie.genre,
                        movie.year,
                        movie.type,
                        movie.tags,
                        movie.line
                    ].join(" "));
                    return (!query || haystack.indexOf(query) !== -1) && (!yearValue || movie.year === yearValue);
                }).slice(0, 96);

                searchResults.innerHTML = matches.map(function (movie) {
                    return [
                        "<article class=\"movie-card\" data-title=\"" + escapeHtml(movie.title) + "\" data-year=\"" + escapeHtml(movie.year) + "\" data-region=\"" + escapeHtml(movie.region) + "\" data-genre=\"" + escapeHtml(movie.genre + " " + movie.tags) + "\">",
                        "    <a href=\"" + escapeHtml(movie.url) + "\" aria-label=\"" + escapeHtml(movie.title) + " 在线观看\">",
                        "        <span class=\"card-poster\"><img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\"></span>",
                        "        <span class=\"card-body\">",
                        "            <span class=\"card-title\">" + escapeHtml(movie.title) + "</span>",
                        "            <span class=\"card-desc\">" + escapeHtml(movie.line) + "</span>",
                        "            <span class=\"card-meta\"><span>" + escapeHtml(movie.type) + "</span><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span></span>",
                        "            <span class=\"tag-row\"><span>" + escapeHtml(movie.genre) + "</span></span>",
                        "        </span>",
                        "    </a>",
                        "</article>"
                    ].join("");
                }).join("");

                if (searchEmpty) {
                    searchEmpty.hidden = matches.length !== 0;
                }
            }

            if (searchForm) {
                searchForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    renderSearch();
                });
            }

            if (input) {
                input.addEventListener("input", renderSearch);
            }

            if (searchYear) {
                searchYear.addEventListener("change", renderSearch);
            }

            renderSearch();
        }
    });

    window.initMoviePlayer = function (url, videoId) {
        var video = document.getElementById(videoId);

        if (!video) {
            return;
        }

        var box = video.closest(".player-box");
        var overlay = box ? box.querySelector(".player-overlay") : null;
        var attached = false;

        function attach() {
            if (attached) {
                return;
            }

            attached = true;

            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });

                hls.loadSource(url);
                hls.attachMedia(video);
                video.hlsInstance = hls;
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            }
        }

        function playVideo() {
            attach();

            if (overlay) {
                overlay.hidden = true;
            }

            var promise = video.play();

            if (promise && typeof promise.catch === "function") {
                promise.catch(function () {
                    if (overlay) {
                        overlay.hidden = false;
                    }
                });
            }
        }

        attach();

        if (overlay) {
            overlay.addEventListener("click", playVideo);
        }

        video.addEventListener("click", function () {
            if (video.paused) {
                playVideo();
            } else {
                video.pause();
            }
        });

        video.addEventListener("play", function () {
            if (overlay) {
                overlay.hidden = true;
            }
        });

        video.addEventListener("pause", function () {
            if (overlay && !video.ended) {
                overlay.hidden = false;
            }
        });

        window.addEventListener("beforeunload", function () {
            if (video.hlsInstance && typeof video.hlsInstance.destroy === "function") {
                video.hlsInstance.destroy();
            }
        });
    };
}());
