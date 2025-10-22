import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const mins = String(Math.floor(total / 60)).padStart(2, '0');
  const secs = String(total % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export function initUI({
  whitelist,
  onReduceMotionToggle,
  onRandomSite,
  onOverlayClosed,
  onPlaybackToggle
}) {
  const overlay = document.querySelector('#overlay');
  const overlayContent = overlay.querySelector('.overlay__content');
  const overlayClose = document.querySelector('#overlay-close');
  const overlayTitle = document.querySelector('#overlay-title');
  const overlayTelemetry = document.querySelector('#overlay-telemetry');
  const overlayNode = document.querySelector('#overlay-node');
  const overlayDescription = document.querySelector('#overlay-description');
  const playButton = document.querySelector('#overlay-play');
  const progressBar = document.querySelector('#overlay-progress-bar');
  const timecodeEl = document.querySelector('#overlay-timecode');
  const tooltip = document.querySelector('#node-tooltip');
  const reduceMotionButton = document.querySelector('#reduce-motion-toggle');
  const randomButton = document.querySelector('#random-site');
  const accessList = document.querySelector('#access-node-list');

  const playbackState = {
    isPlaying: true,
    elapsed: 0,
    duration: 96,
    rafId: null,
    lastTick: null
  };

  let overlayVisible = false;
  let reduceMotion = false;
  let telemetryTimer = null;

  function updateTelemetry(node, video) {
    const now = new Date();
    const stamp = now.toISOString().split('T')[1].replace('Z', ' UTC');
    overlayTelemetry.textContent = `NODE ${node.id} » ${video.title.toUpperCase()} // ${stamp}`;
  }

  function step(timestamp) {
    if (!overlayVisible) return;
    if (!playbackState.lastTick) {
      playbackState.lastTick = timestamp;
    }
    const delta = timestamp - playbackState.lastTick;
    playbackState.lastTick = timestamp;
    if (playbackState.isPlaying) {
      playbackState.elapsed += delta;
      if (playbackState.elapsed > playbackState.duration * 1000) {
        playbackState.elapsed = 0;
      }
      const ratio = playbackState.elapsed / (playbackState.duration * 1000);
      progressBar.style.width = `${Math.min(100, ratio * 100)}%`;
      timecodeEl.textContent = formatTime(playbackState.elapsed / 1000);
    }
    playbackState.rafId = requestAnimationFrame(step);
  }

  function startPlaybackLoop() {
    cancelAnimationFrame(playbackState.rafId);
    playbackState.lastTick = null;
    playbackState.rafId = requestAnimationFrame(step);
  }

  function stopPlaybackLoop() {
    cancelAnimationFrame(playbackState.rafId);
    playbackState.rafId = null;
    playbackState.lastTick = null;
  }

  function openOverlay({ node, video }) {
    overlayVisible = true;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('overlay--visible', 'overlay--glitch');
    overlayTitle.textContent = video.title;
    overlayNode.textContent = node.label;
    overlayDescription.textContent = video.description ?? 'Flux opérationnel';
    updateTelemetry(node, video);
    playbackState.elapsed = 0;
    playbackState.isPlaying = true;
    playButton.textContent = 'Pause';
    playButton.setAttribute('aria-pressed', 'true');
    progressBar.style.width = '0%';
    timecodeEl.textContent = '00:00';
    onPlaybackToggle?.(true);
    startPlaybackLoop();
    telemetryTimer = setInterval(() => updateTelemetry(node, video), 4000);
    gsap.fromTo(
      overlayContent,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: reduceMotion ? 0 : 0.45,
        ease: 'power3.out'
      }
    );
    setTimeout(() => overlay.classList.remove('overlay--glitch'), 1200);
  }

  function closeOverlay() {
    if (!overlayVisible) return;
    overlayVisible = false;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('overlay--visible');
    overlay.classList.remove('overlay--glitch');
    stopPlaybackLoop();
    clearInterval(telemetryTimer);
    telemetryTimer = null;
    playbackState.isPlaying = false;
    onOverlayClosed?.();
  }

  function togglePlayback() {
    playbackState.isPlaying = !playbackState.isPlaying;
    playButton.textContent = playbackState.isPlaying ? 'Pause' : 'Play';
    playButton.setAttribute('aria-pressed', playbackState.isPlaying ? 'true' : 'false');
    onPlaybackToggle?.(playbackState.isPlaying);
  }

  function showNodeLabel(node, pointer) {
    if (!node || !pointer) return;
    tooltip.textContent = node.label;
    tooltip.style.left = `${pointer.x}px`;
    tooltip.style.top = `${pointer.y}px`;
    tooltip.classList.add('is-visible');
  }

  function hideNodeLabel() {
    tooltip.classList.remove('is-visible');
  }

  function renderNodeAccessList(nodes, onSelect) {
    accessList.innerHTML = '';
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    nodes.forEach((node) => {
      const item = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = node.label;
      btn.dataset.nodeId = node.id;
      btn.className = 'access-node-button';
      btn.addEventListener('click', () => onSelect(node.id));
      item.appendChild(btn);
      list.appendChild(item);
    });
    accessList.appendChild(list);
  }

  reduceMotionButton.addEventListener('click', () => {
    reduceMotion = !reduceMotion;
    reduceMotionButton.setAttribute('aria-pressed', reduceMotion ? 'true' : 'false');
    reduceMotionButton.textContent = reduceMotion ? 'Motion: Reduced' : 'Reduce Motion';
    onReduceMotionToggle?.(reduceMotion);
  });

  randomButton.addEventListener('click', () => {
    if (!Array.isArray(whitelist) || whitelist.length === 0) return;
    const index = window.crypto ? window.crypto.getRandomValues(new Uint32Array(1))[0] % whitelist.length : Math.floor(Math.random() * whitelist.length);
    const url = whitelist[index];
    if (typeof url === 'string' && url.startsWith('http')) {
      onRandomSite?.(url);
    }
  });

  overlayClose.addEventListener('click', () => {
    closeOverlay();
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.classList.contains('overlay__backdrop')) {
      closeOverlay();
    }
  });

  playButton.addEventListener('click', () => {
    togglePlayback();
  });

  return {
    openOverlay,
    closeOverlay,
    togglePlayback,
    showNodeLabel,
    hideNodeLabel,
    renderNodeAccessList,
    isOverlayVisible: () => overlayVisible
  };
}
