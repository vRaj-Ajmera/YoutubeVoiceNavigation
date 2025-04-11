console.log("YouTube Voice Assistant loaded.");

if (!window.gvaRecognitionActive) {
  window.gvaRecognitionActive = true;
  window.recognition = new webkitSpeechRecognition();
  const recognition = window.recognition;

  let isMicOn = true;
  let isCommandActive = true;
  let loopStart = null;
  let loopEnd = null;
  let loopInterval = null;
  let lastCommand = "—";
  let lastResponse = "—";

  injectOverlay();
  updateOverlay();

  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    lastCommand = result;
    updateOverlay();

    const video = getYouTubeVideo();
    if (!video) return (lastResponse = "Video not ready"), updateOverlay();

    if (result.includes("start borealis")) {
      isCommandActive = true;
      lastResponse = "Borealis activated";
      updatePopupStatus("🎤 Borealis listening");
      return updateOverlay();
    }

    if (result.includes("stop borealis")) {
      isCommandActive = false;
      lastResponse = "Borealis deactivated";
      updatePopupStatus("🛑 Borealis not listening");
      return updateOverlay();
    }

    if (!isCommandActive) {
      lastResponse = "Command ignored (Borealis off)";
      return updateOverlay();
    }

    if (result.includes("stop listening")) {
      isMicOn = false;
      recognition.stop();
      window.gvaRecognitionActive = false;
      clearInterval(loopInterval);
      removeOverlay();
      updatePopupStatus("🚫 Microphone off");
      return;
    }

    // COMMANDS
    if (result.includes("pause") || result.includes("play")) {
      video.paused ? video.play() : video.pause();
      lastResponse = "Toggled play/pause";
    } else if (result.includes("back")) {
      const time = extractTimestamp(result);
      video.currentTime -= time ?? 2;
      lastResponse = `Rewound ${time ?? 2} seconds`;
    } else if (result.includes("forward")) {
      const time = extractTimestamp(result);
      video.currentTime += time ?? 2;
      lastResponse = `Skipped forward ${time ?? 2} seconds`;
    } else if (result.includes("seek")) {
      const time = extractTimestamp(result);
      if (time !== null) {
        const jump = time - video.currentTime;
        video.currentTime = time;
        lastResponse = `Seeked ${jump > 0 ? "forward" : "backward"} ${Math.abs(jump).toFixed(1)}s to ${formatTime(time)}`;
      } else {
        lastResponse = "Could not parse seek target";
      }
    } else if (result.includes("speed")) {
      const match = result.match(/speed (\d+(\.\d+)?)/);
      const keywordMatch = result.match(/speed (normal|one|double|triple|half|quarter)/);
      let rate = null;

      if (match) {
        rate = parseFloat(match[1]);
      } else if (keywordMatch) {
        const keyword = keywordMatch[1];
        rate = {
          one: 1.0,
          normal: 1.0,
          double: 2.0,
          triple: 3.0,
          half: 0.5,
          quarter: 0.25,
        }[keyword];
      }

      if (rate) {
        video.playbackRate = Math.min(Math.max(rate, 0.1), 3.0);
        lastResponse = `Playback speed set to ${video.playbackRate.toFixed(2)}x`;
      } else {
        lastResponse = "Could not parse speed";
      }
    } else if (result.includes("stop loop")) {
      clearInterval(loopInterval);
      loopStart = null;
      loopEnd = null;
      lastResponse = "Loop cleared";
    } else if (result.includes("loop")) {
      const fullMatch = result.match(/loop (.+?) to (.+)/);
      const toOnlyMatch = result.match(/loop to (.+)/);
    
      if (fullMatch) {
        const start = extractTimestamp(fullMatch[1]);
        const end = extractTimestamp(fullMatch[2]);
        if (start !== null && end !== null && end > start) {
          loopStart = start;
          loopEnd = end;
          clearInterval(loopInterval);
          video.currentTime = loopStart;
          loopInterval = setInterval(() => {
            const v = getYouTubeVideo();
            if (v && v.currentTime >= loopEnd) v.currentTime = loopStart;
          }, 500);
          lastResponse = `Looping ${formatTime(start)} to ${formatTime(end)}`;
        } else {
          lastResponse = "Invalid loop range";
        }
      } else if (toOnlyMatch) {
        const end = extractTimestamp(toOnlyMatch[1]);
        const start = Math.floor(video.currentTime);
        if (end !== null && end > start) {
          loopStart = start;
          loopEnd = end;
          clearInterval(loopInterval);
          loopInterval = setInterval(() => {
            const v = getYouTubeVideo();
            if (v && v.currentTime >= loopEnd) v.currentTime = loopStart;
          }, 500);
          lastResponse = `Looping from current time ${formatTime(start)} to ${formatTime(end)}`;
        } else {
          lastResponse = "Invalid loop range (loop to)";
        }
    
      } else {
        lastResponse = "Could not parse loop command";
      }
    }
    updateOverlay();
  };

  recognition.onerror = (event) => {
    lastResponse = `Recognition error: ${event.error}`;
    updateOverlay();
  };

  recognition.onend = () => {
    if (isMicOn) {
      console.log("Restarting recognition...");
      recognition.start();
      updatePopupStatus(
        isCommandActive
          ? "🎤 Listening & responding to commands (Borealis active)"
          : "👂 Listening but not responding to commands (Borealis off)"
      );
    } else {
      updatePopupStatus("🛑 Mic off");
    }
  };

  recognition.start();

  function updateOverlay() {
    const overlay = document.getElementById('gva-overlay');
    if (!overlay) return;
    const micStatus = isMicOn ? "on" : "off";
    const borealisStatus = isCommandActive ? "active (listening and responding)" : 'inactive (say "Start Borealis")';
    const loopStatus =
      loopStart !== null && loopEnd !== null
        ? `${formatTime(loopStart)} to ${formatTime(loopEnd)}`
        : "inactive";
    overlay.innerText = [
      "🎤 YouTube Voice Assistant",
      `Borealis: ${borealisStatus}`,
      `Microphone: ${micStatus}`,
      `Loop: ${loopStatus}`,
      `Last: ${lastCommand}`,
      `Response: ${lastResponse}`,
    ].join("\n");
  }
}

function getYouTubeVideo() {
  const video = document.querySelector('.html5-main-video');
  if (!video || video.readyState < 1) return null;
  return video;
}

function extractTimestamp(text) {
  const fullMatch = text.match(/(\d+)\s*minutes?\s*(\d+)?\s*seconds?/);
  const secOnlyMatch = text.match(/(\d+)\s*seconds?/);
  const minOnlyMatch = text.match(/(\d+)\s*minutes?/);
  if (fullMatch) return parseInt(fullMatch[1]) * 60 + parseInt(fullMatch[2] || 0);
  if (minOnlyMatch) return parseInt(minOnlyMatch[1]) * 60;
  if (secOnlyMatch) return parseInt(secOnlyMatch[1]);
  return null;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function injectOverlay() {
  if (document.getElementById('gva-overlay')) return;

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
  let isDragging = false;
  let offsetX, offsetY;

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
