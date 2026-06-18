import { H as Hls } from './hls.esm.js';

const initializePlayer = (player) => {
  const video = player.querySelector('video');
  const overlay = player.querySelector('.player-overlay');

  if (!video || !overlay) {
    return;
  }

  const stream = video.dataset.stream;
  let loaded = false;
  let hls = null;

  const loadVideo = () => {
    if (loaded || !stream) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
      video.hls = hls;
    } else {
      video.src = stream;
    }

    video.controls = true;
    loaded = true;
  };

  const startPlayback = async () => {
    loadVideo();
    overlay.classList.add('is-hidden');

    try {
      await video.play();
    } catch (error) {
      overlay.classList.remove('is-hidden');
      video.controls = true;
    }
  };

  overlay.addEventListener('click', (event) => {
    event.preventDefault();
    startPlayback();
  });

  player.addEventListener('click', (event) => {
    if (event.target === overlay || overlay.contains(event.target)) {
      return;
    }
    if (!loaded) {
      startPlayback();
    }
  });

  video.addEventListener('play', () => {
    overlay.classList.add('is-hidden');
  });
};

document.querySelectorAll('[data-player]').forEach(initializePlayer);
