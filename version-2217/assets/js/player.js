(function () {
  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function loadHls() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js';
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayer(root) {
    var video = root.querySelector('video');
    var overlay = root.querySelector('.player-overlay');
    var status = root.querySelector('.player-status');
    var src = root.getAttribute('data-video-src');
    var attached = false;
    var hlsInstance = null;

    if (!video || !overlay || !src) {
      return;
    }

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function attachNative() {
      video.src = src;
      attached = true;
      setStatus('正在加载影片');
    }

    function attachHls(Hls) {
      if (!Hls || !Hls.isSupported()) {
        setStatus('当前浏览器不支持此播放格式');
        return;
      }
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(src);
      hlsInstance.attachMedia(video);
      attached = true;
      setStatus('正在加载影片');
    }

    function attach() {
      if (attached) {
        return Promise.resolve();
      }
      video.controls = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        attachNative();
        return Promise.resolve();
      }
      return loadHls().then(function (Hls) {
        attachHls(Hls);
      }).catch(function () {
        setStatus('播放器加载失败');
      });
    }

    function play() {
      attach().then(function () {
        var playResult = video.play();
        overlay.classList.add('is-hidden');
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(function () {
            overlay.classList.remove('is-hidden');
            setStatus('点击播放按钮继续播放');
          });
        }
      });
    }

    overlay.addEventListener('click', play);
    video.addEventListener('play', function () {
      overlay.classList.add('is-hidden');
      setStatus('正在播放');
    });
    video.addEventListener('pause', function () {
      if (!video.ended) {
        setStatus('已暂停');
      }
    });
    video.addEventListener('ended', function () {
      setStatus('播放结束');
    });
    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    document.querySelectorAll('[data-video-player]').forEach(initPlayer);
  });
}());
