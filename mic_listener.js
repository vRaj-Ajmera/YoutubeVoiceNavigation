console.log("YouTube Voice Assistant loaded.");

if (!window.gvaRecognitionActive) {
  window.gvaRecognitionActive = true;
  window.recognition = new webkitSpeechRecognition();
  const recognition = window.recognition;

  window.isMicOn = true;
  window.isCommandActive = true;
  window.loopStart = null;
  window.loopEnd = null;
  clearInterval(window.loopInterval || 0);
  window.loopInterval = null;
  window.lastCommand = "—";
  window.lastResponse = "—";

  if (document.getElementById('gva-overlay')) document.getElementById('gva-overlay').remove();
  injectOverlay();
  updateOverlay();

  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    window.lastCommand = result;
    updateOverlay();

    const video = getYouTubeVideo();
    if (!video) return (window.lastResponse = "Video not ready"), updateOverlay();

    if (result.includes("start borealis")) {
      window.isCommandActive = true;
      window.lastResponse = "Borealis activated";
      updatePopupStatus("🎤 Borealis listening");
      return updateOverlay();
    }

    if (result.includes("stop borealis")) {
      window.isCommandActive = false;
      window.lastResponse = "Borealis deactivated";
      updatePopupStatus("🛑 Borealis not listening");
      return updateOverlay();
    }

    if (!window.isCommandActive) {
      window.lastResponse = "Command ignored (Borealis off)";
      return updateOverlay();
    }

    if (result.includes("stop listening")) {
      window.isMicOn = false;
      window.gvaRecognitionActive = false;
      recognition.stop();
      clearInterval(window.loopInterval);
      window.loopStart = null;
      window.loopEnd = null;
      window.lastResponse = "Microphone stopped";
      removeOverlay();
      updatePopupStatus("🛑 Microphone off");
      return;
    }

    // Commands
    if (result.includes("pause") || result.includes("play")) {
      video.paused ? video.play() : video.pause();
      window.lastResponse = "Toggled play/pause";
    } else if (result.includes("back")) {
      const time = extractTimestamp(result);
      video.currentTime -= time ?? 2;
      window.lastResponse = `Rewound ${time ?? 2} seconds`;
    } else if (result.includes("forward")) {
      const time = extractTimestamp(result);
      video.currentTime += time ?? 2;
      window.lastResponse = `Skipped forward ${time ?? 2} seconds`;
    } else if (result.includes("seek")) {
      const time = extractTimestamp(result);
      if (time !== null) {
        const jump = time - video.currentTime;
        video.currentTime = time;
        window.lastResponse = `Seeked ${jump > 0 ? "forward" : "backward"} ${Math.abs(jump).toFixed(1)}s to ${formatTime(time)}`;
      } else {
        window.lastResponse = "Could not parse seek target";
      }
    } else if (result.includes("speed")) {
      const match = result.match(/speed (\d+(\.\d+)?)/);
      const keywordMatch = result.match(/speed (normal|one|double|triple|half|quarter)/);
      let rate = null;

      if (match) {
        rate = parseFloat(match[1]);
      } else if (keywordMatch) {
        rate = {
          one: 1.0,
          normal: 1.0,
          double: 2.0,
          triple: 3.0,
          half: 0.5,
          quarter: 0.25,
        }[keywordMatch[1]];
      }

      if (rate) {
        video.playbackRate = Math.min(Math.max(rate, 0.1), 3.0);
        window.lastResponse = `Speed set to ${video.playbackRate.toFixed(2)}x`;
      } else {
        window.lastResponse = "Could not parse speed";
      }
    } else if (result.includes("stop loop")) {
      clearInterval(window.loopInterval);
      window.loopStart = null;
      window.loopEnd = null;
      window.lastResponse = "Loop cleared";
    } else if (result.includes("loop")) {
      const fullMatch = result.match(/loop (.+?) to (.+)/);
      const toOnlyMatch = result.match(/loop to (.+)/);
      const start = fullMatch ? extractTimestamp(fullMatch[1]) : Math.floor(video.currentTime);
      const end = fullMatch ? extractTimestamp(fullMatch[2]) : extractTimestamp(toOnlyMatch?.[1]);

      if (start !== null && end !== null && end > start) {
        clearInterval(window.loopInterval);
        window.loopStart = start;
        window.loopEnd = end;
        video.currentTime = start;
        window.loopInterval = setInterval(() => {
          if (video.currentTime >= end) video.currentTime = start;
        }, 500);
        window.lastResponse = `Looping ${formatTime(start)} to ${formatTime(end)}`;
      } else {
        window.lastResponse = "Invalid loop command";
      }
    }

    updateOverlay();
  };

  recognition.onerror = (event) => {
    window.lastResponse = `Mic error: ${event.error}`;
    updateOverlay();
  };

  recognition.onend = () => {
    if (window.isMicOn && window.gvaRecognitionActive) {
      recognition.start();
      updatePopupStatus(
        window.isCommandActive
          ? "🎤 Listening & responding to commands (Borealis active)"
          : "👂 Listening but not responding to commands (Borealis off)"
      );
    } else {
      updatePopupStatus("🛑 Mic off");
    }
  };

  recognition.start();
}

// Helpers
function updateOverlay() {
  const overlay = document.getElementById('gva-overlay');
  if (!overlay) return;
  const micStatus = window.isMicOn ? "on" : "off";
  const borealisStatus = window.isCommandActive ? "active (listening and responding)" : 'inactive (say "start borealis")';
  const loopStatus =
    window.loopStart !== null && window.loopEnd !== null
      ? `${formatTime(window.loopStart)} to ${formatTime(window.loopEnd)}`
      : "inactive";

  overlay.innerText = [
    "🎤 YouTube Voice Assistant",
    `Borealis: ${borealisStatus}`,
    `Microphone: ${micStatus}`,
    `Loop: ${loopStatus}`,
    `Last: ${window.lastCommand}`,
    `Response: ${window.lastResponse}`,
  ].join("\n");
}

function getYouTubeVideo() {
  const video = document.querySelector('.html5-main-video');
  return video && video.readyState >= 1 ? video : null;
}

function extractTimestamp(text) {
  const full = text.match(/(\d+)\s*minutes?\s*(\d+)?\s*seconds?/);
  const sec = text.match(/(\d+)\s*seconds?/);
  const min = text.match(/(\d+)\s*minutes?/);
  if (full) return parseInt(full[1]) * 60 + parseInt(full[2] || 0);
  if (min) return parseInt(min[1]) * 60;
  if (sec) return parseInt(sec[1]);
  return null;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function injectOverlay() {
  const existing = document.getElementById('gva-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'gva-overlay';
  overlay.style = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0,0,0,0.8);
    color: #0f0;
    padding: 12px 18px;
    border-radius: 10px;
    font-family: monospace;
    font-size: 14px;
    z-index: 99999;
    max-width: 420px;
    cursor: move;
    user-select: none;
    white-space: pre-line;
  `;
  document.body.appendChild(overlay);
  makeDraggable(overlay);
}

function makeDraggable(el) {
  let isDragging = false, offsetX = 0, offsetY = 0;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "auto";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    }
  });
}

function removeOverlay() {
  const overlay = document.getElementById('gva-overlay');
  if (overlay) overlay.remove();
}

function updatePopupStatus(status) {
  chrome.runtime.sendMessage({ status });
}
