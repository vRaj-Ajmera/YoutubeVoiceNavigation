console.log("Guitar Voice Assistant loaded.");

if (!window.gvaRecognitionActive) {
  window.gvaRecognitionActive = true;
  window.recognition = new webkitSpeechRecognition();
  const recognition = window.recognition;

  let isCommandActive = true;
  let loopStart = null;
  let loopEnd = null;
  let loopInterval = null;

  injectOverlay();

  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("Heard:", result);

    updateOverlay({ lastCommand: result });

    const video = document.querySelector('video');
    if (!video) return;

    // Control activation
    if (result.includes("start borealis")) {
      isCommandActive = true;
      updateOverlay({ borealis: true });
      return;
    }

    if (result.includes("stop borealis")) {
      isCommandActive = false;
      updateOverlay({ borealis: false });
      return;
    }

    if (!isCommandActive) return;

    // Commands
    if (result.includes("stop listening")) {
      recognition.stop();
      window.gvaRecognitionActive = false;
      return;
    }

    if (result.includes("pause") || result.includes("play")) {
      video.paused ? video.play() : video.pause();
    } else if (result.includes("back")) {
      const secs = parseFloat(result.match(/back (\\d+(\\.\\d+)?)/)?.[1] || "2");
      video.currentTime -= secs;
    } else if (result.includes("forward")) {
      const secs = parseFloat(result.match(/forward (\\d+(\\.\\d+)?)/)?.[1] || "2");
      video.currentTime += secs;
    } else if (result.includes("seek")) {
      const time = extractTimestamp(result);
      if (time !== null) video.currentTime = time;
    } else if (result.includes("playback")) {
      const match = result.match(/playback (\\d+(\\.\\d+)?)x/);
      if (match) {
        const rate = parseFloat(match[1]);
        video.playbackRate = Math.min(Math.max(rate, 0.1), 3.0);
      }
    } else if (result.includes("stop loop")) {
      clearInterval(loopInterval);
      loopStart = null;
      loopEnd = null;
      updateOverlay({ loop: null });
    } else if (result.includes("loop")) {
      const times = result.match(/loop (.+?) to (.+)/);
      if (times) {
        const start = extractTimestamp(times[1]);
        const end = extractTimestamp(times[2]);
        if (start !== null && end !== null && end > start) {
          loopStart = start;
          loopEnd = end;
          clearInterval(loopInterval);
          loopInterval = setInterval(() => {
            if (video.currentTime >= loopEnd) video.currentTime = loopStart;
          }, 500);
          updateOverlay({ loop: { start, end } });
        }
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Recognition ended.");
  };

  recognition.start();
}

// Helper: convert phrases to time in seconds
function extractTimestamp(text) {
  const match = text.match(/(?:(\\d+)\\s*minutes?)?\\s*(\\d+)?\\s*seconds?/);
  if (!match) return null;
  const min = parseInt(match[1]) || 0;
  const sec = parseInt(match[2]) || 0;
  return min * 60 + sec;
}

// --- Overlay UI ---
function injectOverlay() {
  if (document.getElementById('gva-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'gva-overlay';
  overlay.style = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0,0,0,0.7);
    color: #0f0;
    padding: 10px 15px;
    border-radius: 10px;
    font-family: monospace;
    font-size: 14px;
    z-index: 99999;
    pointer-events: none;
    white-space: pre-line;
  `;
  overlay.innerText = '🎸 Guitar Voice Assistant\nBorealis: active\nLoop: inactive\nLast: —';
  document.body.appendChild(overlay);
}

function updateOverlay({ borealis, loop, lastCommand }) {
  const overlay = document.getElementById('gva-overlay');
  if (!overlay) return;

  const prev = overlay.innerText.split('\\n');
  let borealisLine = borealis !== undefined ? `Borealis: ${borealis ? 'active' : 'off'}` : prev[1];
  let loopLine = loop
    ? `Loop: ${formatTime(loop.start)} to ${formatTime(loop.end)}`
    : loop === null ? 'Loop: inactive' : prev[2];
  let lastLine = lastCommand ? `Last: ${lastCommand}` : prev[3];

  overlay.innerText = `${prev[0]}\n${borealisLine}\n${loopLine}\n${lastLine}`;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
