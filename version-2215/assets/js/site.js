(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var navLinks = document.querySelector('[data-nav-links]');

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
  }

  document.querySelectorAll('img').forEach(function (image) {
    image.addEventListener('error', function () {
      image.classList.add('image-hidden');
    }, { once: true });
  });

  initHero();
  initLocalFilters();
  initGlobalSearch();
  initPlayers();

  function initHero() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === current);
      });
    }

    function startTimer() {
      if (slides.length < 2) {
        return;
      }

      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        window.clearInterval(timer);
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startTimer();
      });
    });

    startTimer();
  }

  function initLocalFilters() {
    var input = document.querySelector('[data-local-search]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

    if (!cards.length || (!input && !yearSelect)) {
      return;
    }

    function applyFilter() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var year = yearSelect ? yearSelect.value : '';

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-type'),
          card.getAttribute('data-genre'),
          card.getAttribute('data-tags'),
          card.getAttribute('data-year')
        ].join(' ').toLowerCase();
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchYear = !year || card.getAttribute('data-year') === year;
        card.classList.toggle('hidden-by-filter', !(matchKeyword && matchYear));
      });
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', applyFilter);
    }
  }

  function initGlobalSearch() {
    var results = document.querySelector('[data-search-results]');

    if (!results || !window.movieSearchIndex) {
      return;
    }

    var input = document.querySelector('[data-global-search]');
    var type = document.querySelector('[data-global-type]');
    var region = document.querySelector('[data-global-region]');

    function buildCard(movie) {
      var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
        return '<span>' + escapeHtml(tag) + '</span>';
      }).join('');

      return [
        '<a class="movie-card" href="' + escapeHtml(movie.url) + '">',
        '  <span class="poster-wrap">',
        '    <img class="poster-img" src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
        '    <span class="poster-shade"></span>',
        '    <span class="year-pill">' + escapeHtml(movie.year) + '</span>',
        '  </span>',
        '  <span class="card-body">',
        '    <strong>' + escapeHtml(movie.title) + '</strong>',
        '    <em>' + escapeHtml(movie.oneLine) + '</em>',
        '    <span class="meta-line">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + ' · ' + escapeHtml(movie.genre) + '</span>',
        '    <span class="tag-row">' + tags + '</span>',
        '  </span>',
        '</a>'
      ].join('');
    }

    function render() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var selectedType = type ? type.value : '';
      var selectedRegion = region ? region.value : '';
      var items = window.movieSearchIndex.filter(function (movie) {
        var text = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          (movie.tags || []).join(' '),
          movie.oneLine
        ].join(' ').toLowerCase();
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchType = !selectedType || movie.type === selectedType;
        var matchRegion = !selectedRegion || movie.region.indexOf(selectedRegion) !== -1;
        return matchKeyword && matchType && matchRegion;
      }).slice(0, 96);

      results.innerHTML = items.map(buildCard).join('');
      results.querySelectorAll('img').forEach(function (image) {
        image.addEventListener('error', function () {
          image.classList.add('image-hidden');
        }, { once: true });
      });
    }

    [input, type, region].forEach(function (element) {
      if (element) {
        element.addEventListener('input', render);
        element.addEventListener('change', render);
      }
    });

    render();
  }

  function initPlayers() {
    document.querySelectorAll('[data-player]').forEach(function (player) {
      var video = player.querySelector('video');
      var toggle = player.querySelector('[data-player-toggle]');
      var message = player.querySelector('[data-player-message]');
      var hls = null;
      var ready = false;

      if (!video || !toggle) {
        return;
      }

      function setMessage(text) {
        if (!message) {
          return;
        }

        message.textContent = text || '';
        message.classList.toggle('visible', Boolean(text));
      }

      function attachSource() {
        if (ready) {
          return Promise.resolve();
        }

        var src = video.getAttribute('data-src');

        if (!src) {
          setMessage('播放源暂不可用');
          return Promise.reject(new Error('empty source'));
        }

        setMessage('正在加载播放源');

        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });

          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            ready = true;
            setMessage('');
          });

          hls.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (!data || !data.fatal) {
              return;
            }

            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              setMessage('网络波动，正在重新连接');
              hls.startLoad();
              return;
            }

            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              setMessage('媒体加载异常，正在恢复');
              hls.recoverMediaError();
              return;
            }

            setMessage('当前播放暂不可用');
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          ready = true;
          setMessage('');
        } else {
          setMessage('当前浏览器不支持 HLS 播放');
          return Promise.reject(new Error('hls unsupported'));
        }

        return Promise.resolve();
      }

      function playVideo() {
        attachSource().then(function () {
          video.controls = true;
          player.classList.add('is-playing');
          var playPromise = video.play();

          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
              setMessage('请再次点击播放');
            });
          }
        }).catch(function () {});
      }

      toggle.addEventListener('click', playVideo);
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener('playing', function () {
        player.classList.add('is-playing');
        setMessage('');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          player.classList.remove('is-playing');
        }
      });
      window.addEventListener('pagehide', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, function (character) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[character];
    });
  }
})();
