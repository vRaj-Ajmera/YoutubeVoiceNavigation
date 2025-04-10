console.log("Guitar Voice Assistant loaded.");

// Prevent redeclaration
if (!window.gvaRecognitionActive) {
  window.gvaRecognitionActive = true;

  const recognition = new webkitSpeechRecognition(); // or SpeechRecognition
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.toLowerCase();
    console.log("Heard:", result);

    const video = document.querySelector('video');
    if (!video) return;

    if (result.includes("stop listening")) {
      console.log("Voice control stopped.");
      recognition.stop();
      window.gvaRecognitionActive = false;
    } else if (result.includes("pause") || result.includes("play")) {
      video.paused ? video.play() : video.pause();
    } else if (result.includes("back")) {
      const secs = parseFloat(result.match(/back (\\d+(\\.\\d+)?)/)?.[1] || "2");
      video.currentTime -= secs;
    } else if (result.includes("forward")) {
      const secs = parseFloat(result.match(/forward (\\d+(\\.\\d+)?)/)?.[1] || "2");
      video.currentTime += secs;
    } else if (result.includes("slower")) {
      video.playbackRate = Math.max(video.playbackRate - 0.1, 0.1);
    } else if (result.includes("faster")) {
      video.playbackRate = Math.min(video.playbackRate + 0.1, 4.0);
    }
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
  };

  recognition.onend = () => {
    console.log("Recognition ended.");
    // Optional: auto-restart if you want continuous mode
    // recognition.start();
  };

  recognition.start();
}
