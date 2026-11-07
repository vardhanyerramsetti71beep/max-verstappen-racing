/* Max Verstappen Racing — "Super Max!" button.
   Plays the official upload through YouTube's IFrame player. The player script is only loaded
   when the button is pressed, and the player stays visible in the Now playing card while it plays
   (YouTube requires embedded players to be visible, at least 200×200). */
(() => {
  'use strict';
  const song = (window.MV && window.MV.song) || {};
  const btn = document.querySelector('[data-music-toggle]');
  const card = document.querySelector('[data-music-card]');
  const closeBtn = document.querySelector('[data-music-close]');
  const note = document.querySelector('[data-music-note]');
  if (!btn || !card || !song.youtube) return;

  document.querySelector('[data-music-title]').textContent = song.title;
  document.querySelector('[data-music-artist]').textContent = song.artist;
  const watchUrl = `https://www.youtube.com/watch?v=${song.youtube}`;

  let player = null, apiReady = null, playing = false;

  function loadApi() {
    if (apiReady) return apiReady;
    apiReady = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return apiReady;
  }

  function setState(on) {
    playing = on;
    btn.classList.toggle('is-on', on);
    btn.classList.remove('is-loading');
    card.classList.toggle('is-playing', on);
    btn.setAttribute('aria-pressed', on);
    btn.setAttribute('aria-label', on ? `Pause ${song.title}` : `Play ${song.title} by ${song.artist}`);
  }
  function openCard(open) {
    card.classList.toggle('is-open', open);
    card.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  function fail(msg) {
    btn.classList.remove('is-loading');
    note.innerHTML = `${msg} <a href="${watchUrl}" target="_blank" rel="noopener">Open on YouTube →</a>`;
    openCard(true);
  }

  async function play() {
    openCard(true);
    btn.classList.add('is-loading');
    if (player && player.playVideo) { player.playVideo(); return; }
    try { await loadApi(); } catch (e) { fail('Couldn’t load the YouTube player.'); return; }
    player = new window.YT.Player('mus-player', {
      host: 'https://www.youtube-nocookie.com',
      videoId: song.youtube,
      width: '100%', height: '100%',
      playerVars: { autoplay: 1, loop: 1, playlist: song.youtube, playsinline: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: e => { e.target.setVolume(70); e.target.playVideo(); },
        onStateChange: e => {
          const S = window.YT.PlayerState;
          if (e.data === S.PLAYING) setState(true);
          else if (e.data === S.PAUSED || e.data === S.ENDED) setState(false);
        },
        // 101 / 150: the owner doesn't allow embedding on other sites
        onError: e => fail(e.data === 101 || e.data === 150 ? 'This video can’t be played here.' : 'Playback failed.')
      }
    });
  }
  function pause() { if (player && player.pauseVideo) player.pauseVideo(); setState(false); }
  function stop() { if (player && player.stopVideo) player.stopVideo(); setState(false); openCard(false); }

  btn.addEventListener('click', e => { e.stopPropagation(); playing ? pause() : play(); });
  closeBtn.addEventListener('click', stop);
  addEventListener('keydown', e => { if (e.key === 'Escape' && card.classList.contains('is-open') && !document.documentElement.classList.contains('is-open')) stop(); });
})();
