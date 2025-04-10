let recognition;
let isMicOn = false;
let isCommandActive = false;
let loopStart = null;
let loopEnd = null;
let loopInterval = null;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("status");
const heardText = document.getElementById("heardText");
const actionText = document.getElementById("actionText");

startBtn.addEventListener("click", () => {
  if (isMicOn) return;

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
    console.log("Heard:", result);

    heardText.textContent = result;

    if (result.includes("start borealis")) {
      isCommandActive = true;
      updateStatus();
      actionText.textContent = "🎤 Command listening activated";
      return;
    }

    if (result.includes("stop borealis")) {
      isCommandActive = false;
      updateStatus();
      actionText.textContent = "🛑 Command listening deactivated";
      return;
    }

    if (isCommandActive) {
      const actionOutput = interpretCommand(result);
      actionText.textContent = actionOutput;
    } else {
      actionText.textContent = "👂 Heard input, but command mode is off";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    statusText.textContent = "Error: " + event.error;
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");
    if (isMicOn) {
      console.log("Restarting recognition...");
      recognition.start();
      statusText.textContent = isCommandActive
        ? "🎤 Listening & responding to commands (Borealis active)"
        : "👂 Listening but not responding to commands (Borealis off)";
    } else {
      statusText.textContent = "🛑 Mic off";
      toggleButtons();
    }
  };

  recognition.start();
  isMicOn = true;
  isCommandActive = true;
  updateStatus();
  toggleButtons();
});

stopBtn.addEventListener("click", () => {
  if (!isMicOn) return;
  isMicOn = false;
  recognition.stop();
  clearInterval(loopInterval);
  removeLoopMarkers();
});

function toggleButtons() {
  startBtn.disabled = isMicOn;
  stopBtn.disabled = !isMicOn;
}

function updateStatus() {
  if (isMicOn && isCommandActive) {
    statusText.textContent = "🎤 Listening & responding to commands (Borealis active)";
  } else if (isMicOn && !isCommandActive) {
    statusText.textContent = "👂 Listening but not responding to commands (Borealis off)";
  } else {
    statusText.textContent = "🛑 Mic off";
  }
}

function interpretCommand(result) {
  const video = document.getElementById("testVideo");
  if (!video) return "❌ No video element found";

  if (result.includes("pause")) {
    video.pause();
    return "⏸️ Paused video";
  } else if (result.includes("play")) {
    video.play();
    return "▶️ Playing video";
  } else if (result.includes("back")) {
    const secs = parseFloat(result.match(/back (\d+(\.\d+)?)/)?.[1] || "2");
    video.currentTime -= secs;
    return `⏪ Rewinding ${secs} seconds`;
  } else if (result.includes("forward")) {
    const secs = parseFloat(result.match(/forward (\d+(\.\d+)?)/)?.[1] || "2");
    video.currentTime += secs;
    return `⏩ Skipping ahead ${secs} seconds`;
  } else if (result.includes("slower")) {
    video.playbackRate = Math.max(video.playbackRate - 0.1, 0.1);
    return `🐢 Slowed to ${video.playbackRate.toFixed(2)}x`;
  } else if (result.includes("faster")) {
    video.playbackRate = Math.min(video.playbackRate + 0.1, 3.0);
    return `⚡ Sped up to ${video.playbackRate.toFixed(2)}x`;
  } else if (result.includes("seek")) {
    const seekTo = extractTimestamp(result);
    if (seekTo !== null) {
      video.currentTime = seekTo;
      return `🎯 Seeking to ${formatTime(seekTo)}`;
    }
    return "❌ Could not parse seek time";
  } else if (result.includes("stop loop")) {
    clearInterval(loopInterval);
    loopStart = null;
    loopEnd = null;
    removeLoopMarkers();
    return "🛑 Loop stopped";
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
          if (video.currentTime >= loopEnd) {
            video.currentTime = loopStart;
          }
        }, 500);
        addLoopMarkers(video, start, end);
        return `🔁 Looping from ${formatTime(start)} to ${formatTime(end)}`;
      }
    }
    return "❌ Could not parse loop range";
  }

  return "🤷 Command not recognized";
}

function extractTimestamp(text) {
  const timeMatch = text.match(/(?:(\d+)\s*minutes?)?\s*(\d+)?\s*seconds?/);
  if (!timeMatch) return null;

  const minutes = parseInt(timeMatch[1]) || 0;
  const seconds = parseInt(timeMatch[2]) || 0;
  return minutes * 60 + seconds;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function addLoopMarkers(video, start, end) {
  removeLoopMarkers();
  const container = video.parentElement;
  const width = video.clientWidth;
  const duration = video.duration || 1;
  const bar = document.createElement("div");
  bar.id = "loopBar";
  bar.style.position = "absolute";
  bar.style.bottom = "8px";
  bar.style.left = `${(start / duration) * 100}%`;
  bar.style.width = `${((end - start) / duration) * 100}%`;
  bar.style.height = "6px";
  bar.style.backgroundColor = "rgba(0, 200, 255, 0.6)";
  bar.style.borderRadius = "3px";
  bar.style.pointerEvents = "none";
  container.style.position = "relative";
  container.appendChild(bar);
}

function removeLoopMarkers() {
  const existing = document.getElementById("loopBar");
  if (existing) existing.remove();
}
