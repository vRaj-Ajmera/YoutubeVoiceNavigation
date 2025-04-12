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

  recognition.onresult = async (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    window.lastCommand = result;
    updateOverlay();

    const video = await getYouTubeVideo(); // <- now returns Promise
    if (!video) {
      window.lastResponse = "🎞️ Video not ready";
      updateOverlay();
      return;
    }

    if (result.includes("start borealis")) {
      window.isCommandActive = true;
      window.lastResponse = "Borealis activated";
      updatePopupStatus("🎤 Borealis listening");
      return updateOverlay();
    }

    if (result.includes("stop borealis")) {
      window.isCommandActive = false;
      window.lastResponse = "Borealis deactivated";
      updatePopupStatus("👂 Borealis not listening");
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
      updatePopupStatus("🛑 Microphone off");
    }
  };

  recognition.start();
}

// Async retry logic for video readiness
function getYouTubeVideo(retry = false) {
  const video = document.querySelector('.html5-main-video');
  if (video && video.readyState >= 1) return Promise.resolve(video);

  if (!retry) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getYouTubeVideo(true)), 300);
    });
  }

  return Promise.resolve(null);
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

function normalizeSpokenNumbers(text) {
  const map = {
    zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
    eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15",
    sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19", twenty: "20",
    thirty: "30", forty: "40", fifty: "50", sixty: "60"
  };

  return text
    .replace(/,/g, "")            // Remove commas
    .replace(/\band\b/g, " ")     // Replace "and" with space
    .replace(/\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty)\b/gi,
      match => map[match.toLowerCase()] ?? match
    );
}

function extractTimestamp(text) {
  text = normalizeSpokenNumbers(text);

  // Remove "and" and commas for flexibility
  text = text.replace(/,/g, "").replace(/\band\b/g, " ");

  const fullHMS = text.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?\s*(\d+)?\s*seconds?/);
  const fullHM = text.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/);
  const fullMS = text.match(/(\d+)\s*minutes?\s*(\d+)?\s*seconds?/);
  const hOnly = text.match(/(\d+)\s*hours?/);
  const mOnly = text.match(/(\d+)\s*minutes?/);
  const sOnly = text.match(/(\d+)\s*seconds?/);

  if (fullHMS) {
    const h = parseInt(fullHMS[1]) || 0;
    const m = parseInt(fullHMS[2]) || 0;
    const s = parseInt(fullHMS[3]) || 0;
    return h * 3600 + m * 60 + s;
  }

  if (fullHM) {
    const h = parseInt(fullHM[1]) || 0;
    const m = parseInt(fullHM[2]) || 0;
    return h * 3600 + m * 60;
  }

  if (fullMS) {
    const m = parseInt(fullMS[1]) || 0;
    const s = parseInt(fullMS[2]) || 0;
    return m * 60 + s;
  }

  if (hOnly) return parseInt(hOnly[1]) * 3600;
  if (mOnly) return parseInt(mOnly[1]) * 60;
  if (sOnly) return parseInt(sOnly[1]);

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
  try {
    if (typeof chrome !== "undefined" &&
        chrome.runtime &&
        typeof chrome.runtime.sendMessage === "function") {
      chrome.runtime.sendMessage({ status });
    } else {
      console.log("[Popup Status]", status); // Fallback in YouTube context
    }
  } catch (err) {
    console.log("[Popup Status Error]", err);
  }
}

