const statusEl = document.getElementById("statusText");

function setPopupStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

document.getElementById("start").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["mic_listener.js"]
    }, () => {
      setPopupStatus("🎤 Borealis listening"); // Set status immediately on start
    });
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        if (window.recognition) {
          window.isMicOn = false;
          window.gvaRecognitionActive = false;
          window.recognition.stop();
          clearInterval(window.loopInterval || 0);
          window.loopStart = null;
          window.loopEnd = null;
          const overlay = document.getElementById("gva-overlay");
          if (overlay) overlay.remove();
          chrome.runtime.sendMessage({ status: "🛑 Microphone off" });
        }
      }
    });
  });
});

document.getElementById("reset").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const overlay = document.getElementById("gva-overlay");
        if (overlay) {
          overlay.style.top = "20px";
          overlay.style.left = "20px";
        }
      }
    });
  });
});

document.getElementById("guideBtn").addEventListener("click", () => {
  chrome.windows.create({
    url: chrome.runtime.getURL("guide.html"),
    type: "popup",
    width: 400,
    height: 480
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.status) {
    setPopupStatus(request.status);
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
      return {
        isMicOn: window.isMicOn,
        isCommandActive: window.isCommandActive
      };
    }
  }, (results) => {
    if (chrome.runtime.lastError || !results?.[0]?.result) {
      setPopupStatus("⚠️ Unable to fetch status");
      return;
    }

    const { isMicOn, isCommandActive } = results[0].result;
    if (!isMicOn) {
      setPopupStatus("🛑 Microphone off");
    } else if (isCommandActive) {
      setPopupStatus("🎤 Borealis listening");
    } else {
      setPopupStatus("👂 Borealis not listening");
    }
  });
});
