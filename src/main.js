import { initScene } from './scene.js';
import { initUI } from './ui.js';

async function loadJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${url}`);
  }
  return response.json();
}

function clockFormatter(date) {
  return date.toLocaleTimeString('fr-FR', { hour12: false });
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('#scene-container');
  const fallbackCanvas = document.querySelector('#fallback-canvas');

  const [videos, whitelist] = await Promise.all([
    loadJSON('./src/data/videos.json'),
    loadJSON('./src/data/whitelist.json')
  ]);

  const appState = {
    reduceMotion: false,
    currentNode: null
  };

  const ui = initUI({
    whitelist,
    onReduceMotionToggle: handleReduceMotionToggle,
    onRandomSite: handleRandomSite,
    onOverlayClosed: () => {
      scene.resetView();
      scene.resumeRotation();
    },
    onPlaybackToggle: handlePlaybackToggle
  });

  const scene = initScene({
    container,
    fallbackCanvas,
    getReduceMotion: () => appState.reduceMotion,
    onNodeHover: (node, pointer) => ui.showNodeLabel(node, pointer),
    onNodeLeave: () => ui.hideNodeLabel(),
    onNodeClick: handleNodeSelection
  });

  ui.renderNodeAccessList(scene.getAccessibleNodes(), handleNodeSelectionFromAccessList);

  function handleNodeSelection(nodeData) {
    if (!nodeData) return;
    appState.currentNode = nodeData;
    const videoMeta = videos.find((entry) => entry.id === nodeData.videoId) ?? videos[0];
    ui.openOverlay({
      node: nodeData,
      video: videoMeta
    });
    scene.focusOnNode(nodeData);
  }

  function handleNodeSelectionFromAccessList(nodeId) {
    const node = scene.getAccessibleNodes().find((entry) => entry.id === nodeId);
    if (node) {
      handleNodeSelection(node);
    }
  }

  function handleOverlayClose() {
    ui.closeOverlay();
  }

  function handlePlaybackToggle(isPlaying) {
    if (isPlaying) {
      scene.resumeRotation();
    } else {
      scene.pauseRotation();
    }
  }

  function handleReduceMotionToggle(nextState) {
    appState.reduceMotion = nextState;
    scene.setReduceMotion(nextState);
    document.body.classList.toggle('is-reduce-motion', nextState);
  }

  function handleRandomSite(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }

  // HUD clock + fps simulation
  const clockEl = document.querySelector('#hud-clock');
  const fpsEl = document.querySelector('#hud-fps');
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 0;

  function updateClock() {
    clockEl.textContent = clockFormatter(new Date());
  }

  setInterval(updateClock, 1000);
  updateClock();

  function loop(time) {
    frameCount++;
    const delta = time - lastTime;
    if (delta >= 1000) {
      fps = Math.round((frameCount * 1000) / delta);
      fpsEl.textContent = `fps: ${fps}`;
      frameCount = 0;
      lastTime = time;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (ui.isOverlayVisible()) {
        event.preventDefault();
        handleOverlayClose();
      }
    }
    if (event.key === ' ') {
      if (ui.isOverlayVisible()) {
        event.preventDefault();
        ui.togglePlayback();
      }
    }
  });
});
