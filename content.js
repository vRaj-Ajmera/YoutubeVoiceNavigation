// Inject mic listener logic directly into YouTube pages
const script = document.createElement('script');
script.src = chrome.runtime.getURL('mic_listener.js');
document.documentElement.appendChild(script);
