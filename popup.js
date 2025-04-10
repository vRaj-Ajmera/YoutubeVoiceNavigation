document.getElementById("start").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["mic_listener.js"]
      });
    });
  });
  
  document.getElementById("stop").addEventListener("click", () => {
    // Currently, mic auto-restarts in continuous mode; more logic would be needed to stop it.
    alert("Stopping listening isn't implemented yet.");
  });
  