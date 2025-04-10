document.getElementById("start").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["mic_listener.js"]
    });
  });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        if (window.recognition && window.gvaRecognitionActive) {
          console.log("Voice recognition manually stopped.");
          window.recognition.stop();
          window.gvaRecognitionActive = false;
        } else {
          console.log("Voice recognition was not active.");
        }
      }
    });
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.status) {
    const statusEl = document.getElementById("statusText");
    if (statusEl) statusEl.textContent = request.status;
  }
});
