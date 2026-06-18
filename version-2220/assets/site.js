
(function() {
    const menuButton = document.querySelector("[data-menu-button]");
    const mobilePanel = document.querySelector("[data-mobile-panel]");

    if (menuButton && mobilePanel) {
        menuButton.addEventListener("click", function() {
            mobilePanel.classList.toggle("is-open");
        });
    }

    const hero = document.querySelector("[data-hero]");

    if (hero) {
        const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
        const prev = hero.querySelector("[data-hero-prev]");
        const next = hero.querySelector("[data-hero-next]");
        let index = 0;
        let timer = null;

        const show = function(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;

            slides.forEach(function(slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === index);
            });

            dots.forEach(function(dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        };

        const start = function() {
            timer = window.setInterval(function() {
                show(index + 1);
            }, 5000);
        };

        const reset = function() {
            if (timer) {
                window.clearInterval(timer);
            }

            start();
        };

        if (prev) {
            prev.addEventListener("click", function() {
                show(index - 1);
                reset();
            });
        }

        if (next) {
            next.addEventListener("click", function() {
                show(index + 1);
                reset();
            });
        }

        dots.forEach(function(dot, dotIndex) {
            dot.addEventListener("click", function() {
                show(dotIndex);
                reset();
            });
        });

        start();
    }

    const normalize = function(value) {
        return (value || "").toString().trim().toLowerCase();
    };

    document.querySelectorAll("[data-filter-panel]").forEach(function(panel) {
        const input = panel.querySelector("[data-filter-input]");
        const year = panel.querySelector("[data-year-filter]");
        const grid = document.querySelector("[data-card-grid]");
        const empty = document.querySelector("[data-empty-state]");
        const urlQuery = panel.getAttribute("data-url-query");

        if (!grid) {
            return;
        }

        const cards = Array.from(grid.querySelectorAll("[data-movie-card]"));

        if (urlQuery && input) {
            const params = new URLSearchParams(window.location.search);
            const initial = params.get(urlQuery) || "";
            input.value = initial;
        }

        const apply = function() {
            const q = normalize(input ? input.value : "");
            const selectedYear = year ? year.value : "";
            let visible = 0;

            cards.forEach(function(card) {
                const text = normalize([
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-genre"),
                    card.getAttribute("data-category")
                ].join(" "));
                const cardYear = card.getAttribute("data-year") || "";
                const matchedText = !q || text.includes(q);
                const matchedYear = !selectedYear || cardYear === selectedYear;
                const showCard = matchedText && matchedYear;

                card.hidden = !showCard;

                if (showCard) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.hidden = visible !== 0;
            }
        };

        if (input) {
            input.addEventListener("input", apply);
        }

        if (year) {
            year.addEventListener("change", apply);
        }

        apply();
    });
})();

window.MovieSitePlayer = {
    mount: function(videoId, layerId, url) {
        const video = document.getElementById(videoId);
        const layer = document.getElementById(layerId);

        if (!video || !layer || !url) {
            return;
        }

        let hls = null;
        let ready = false;

        const setReady = function() {
            if (ready) {
                return true;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
                ready = true;
                return true;
            }

            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({ enableWorker: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                ready = true;
                return true;
            }

            const text = layer.querySelector(".player-text");
            if (text) {
                text.textContent = "暂时无法播放";
            }
            return false;
        };

        const start = function(event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }

            if (!setReady()) {
                return;
            }

            layer.classList.add("is-hidden");
            video.setAttribute("controls", "controls");
            const playPromise = video.play();

            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function() {
                    layer.classList.remove("is-hidden");
                });
            }
        };

        layer.addEventListener("click", start);
        video.addEventListener("click", function() {
            if (video.paused) {
                start();
            }
        });

        window.addEventListener("beforeunload", function() {
            if (hls) {
                hls.destroy();
            }
        });
    }
};
