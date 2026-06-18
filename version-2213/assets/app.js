(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initNavigation() {
    var button = document.querySelector('[data-nav-toggle]');
    var links = document.querySelector('[data-nav-links]');

    if (!button || !links) {
      return;
    }

    button.addEventListener('click', function () {
      links.classList.toggle('is-open');
    });
  }

  function initHeroSearch() {
    var forms = document.querySelectorAll('[data-site-search]');

    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = form.querySelector('input[name="q"]');
        var keyword = input ? input.value.trim() : '';
        var target = 'search.html';

        if (keyword) {
          target += '?q=' + encodeURIComponent(keyword);
        }

        window.location.href = target;
      });
    });
  }

  function initImageFallbacks() {
    document.querySelectorAll('img[data-cover]').forEach(function (image) {
      image.addEventListener('error', function () {
        var holder = image.closest('.movie-thumb, .ranking-cover, .detail-poster');

        if (holder) {
          holder.classList.add('cover-missing');
        }

        image.remove();
      }, { once: true });
    });
  }

  function initDomFilters() {
    document.querySelectorAll('[data-filter-form]').forEach(function (form) {
      var grid = form.parentElement.querySelector('[data-filter-grid]');
      var count = form.parentElement.querySelector('[data-filter-count]');

      if (!grid) {
        return;
      }

      var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-card]'));

      function applyFilter() {
        var data = new FormData(form);
        var keyword = normalize(data.get('q'));
        var year = normalize(data.get('year'));
        var region = normalize(data.get('region'));
        var type = normalize(data.get('type'));
        var visible = 0;

        cards.forEach(function (card) {
          var searchText = normalize(card.getAttribute('data-search'));
          var cardYear = normalize(card.getAttribute('data-year'));
          var cardRegion = normalize(card.getAttribute('data-region'));
          var cardType = normalize(card.getAttribute('data-type'));
          var matched = true;

          if (keyword && searchText.indexOf(keyword) === -1) {
            matched = false;
          }

          if (year && cardYear !== year) {
            matched = false;
          }

          if (region && cardRegion !== region) {
            matched = false;
          }

          if (type && cardType !== type) {
            matched = false;
          }

          card.hidden = !matched;
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = '当前显示 ' + visible + ' 部影片，共 ' + cards.length + ' 部。';
        }
      }

      form.addEventListener('input', applyFilter);
      form.addEventListener('change', applyFilter);
      form.addEventListener('reset', function () {
        window.setTimeout(applyFilter, 0);
      });
      applyFilter();
    });
  }

  function getInitialSearchKeyword() {
    var params = new URLSearchParams(window.location.search);
    return params.get('q') || '';
  }

  function movieMatches(movie, keyword, year, region, type) {
    var haystack = normalize([
      movie.title,
      movie.region,
      movie.type,
      movie.year,
      movie.genre,
      movie.tags ? movie.tags.join(' ') : '',
      movie.oneLine,
      movie.summary,
      movie.category
    ].join(' '));

    if (keyword && haystack.indexOf(keyword) === -1) {
      return false;
    }

    if (year && normalize(movie.year) !== year) {
      return false;
    }

    if (region && normalize(movie.region) !== region) {
      return false;
    }

    if (type && normalize(movie.type) !== type) {
      return false;
    }

    return true;
  }

  function renderMovie(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card movie-card-compact" data-card>',
      '  <a class="movie-thumb" href="' + escapeHtml(movie.url) + '" data-title="' + escapeHtml(movie.title) + '">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="《' + escapeHtml(movie.title) + '》封面" loading="lazy" data-cover>',
      '    <span class="movie-year">' + escapeHtml(movie.year) + '</span>',
      '    <span class="play-icon" aria-hidden="true">▶</span>',
      '  </a>',
      '  <div class="movie-card-body">',
      '    <a class="movie-title" href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a>',
      '    <p>' + escapeHtml(movie.oneLine || movie.summary || '') + '</p>',
      '    <div class="movie-meta">',
      '      <span>' + escapeHtml(movie.region) + '</span>',
      '      <span>' + escapeHtml(movie.type) + '</span>',
      '      <span>' + escapeHtml(movie.score) + ' 分</span>',
      '    </div>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</article>'
    ].join('');
  }

  function initIndexSearch() {
    var form = document.querySelector('[data-index-search]');
    var results = document.querySelector('[data-search-results]');
    var status = document.querySelector('[data-search-status]');
    var movies = window.MOVIE_INDEX || [];

    if (!form || !results || !movies.length) {
      return;
    }

    var initialKeyword = getInitialSearchKeyword();
    var input = form.querySelector('input[name="q"]');

    if (input && initialKeyword) {
      input.value = initialKeyword;
    }

    function applySearch() {
      var data = new FormData(form);
      var keyword = normalize(data.get('q'));
      var year = normalize(data.get('year'));
      var region = normalize(data.get('region'));
      var type = normalize(data.get('type'));
      var filtered = movies.filter(function (movie) {
        return movieMatches(movie, keyword, year, region, type);
      }).slice(0, 200);

      results.innerHTML = filtered.map(renderMovie).join('');
      initImageFallbacks();

      if (status) {
        status.textContent = '找到 ' + filtered.length + ' 条结果' + (filtered.length >= 200 ? '，已显示前 200 条。' : '。');
      }
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      applySearch();
    });
    form.addEventListener('input', applySearch);
    form.addEventListener('change', applySearch);
    form.addEventListener('reset', function () {
      window.setTimeout(applySearch, 0);
    });
    applySearch();
  }

  function loadHlsScript() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-hls-loader]');

      if (existing) {
        existing.addEventListener('load', function () {
          resolve(window.Hls);
        });
        existing.addEventListener('error', reject);
        return;
      }

      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-hls-loader', 'true');
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayers() {
    document.querySelectorAll('[data-player-start]').forEach(function (button) {
      button.addEventListener('click', function () {
        var shell = button.closest('[data-video-url]');
        var video = shell ? shell.querySelector('video') : null;
        var message = shell ? shell.querySelector('[data-player-message]') : null;
        var source = shell ? shell.getAttribute('data-video-url') : '';

        if (!shell || !video || !source) {
          return;
        }

        function setMessage(text) {
          if (message) {
            message.textContent = text;
          }
        }

        setMessage('正在加载播放源...');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          shell.classList.add('is-playing');
          video.play().catch(function () {
            setMessage('播放已准备好，请再次点击视频播放。');
          });
          return;
        }

        loadHlsScript().then(function (Hls) {
          if (!Hls || !Hls.isSupported()) {
            video.src = source;
            shell.classList.add('is-playing');
            setMessage('当前浏览器不支持增强播放组件，已尝试使用原生播放。');
            return;
          }

          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hls.loadSource(source);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, function () {
            shell.classList.add('is-playing');
            setMessage('播放源已就绪。');
            video.play().catch(function () {
              setMessage('播放源已加载，请点击视频控件开始播放。');
            });
          });
          hls.on(Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              setMessage('播放源加载失败，请稍后重试或更换浏览器。');
            }
          });
        }).catch(function () {
          video.src = source;
          shell.classList.add('is-playing');
          setMessage('播放组件加载失败，已切换为浏览器原生播放尝试。');
        });
      });
    });
  }

  ready(function () {
    initNavigation();
    initHeroSearch();
    initImageFallbacks();
    initDomFilters();
    initIndexSearch();
    initPlayers();
  });
})();
