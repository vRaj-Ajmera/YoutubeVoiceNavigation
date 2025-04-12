# YouTube Voice Assistant Extension

![Manifest V3](https://img.shields.io/badge/Extension-Manifest%20V3-blue)
![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow)
![Mic Access](https://img.shields.io/badge/Requires-Microphone-red)
![Browser](https://img.shields.io/badge/Browser-Edge%20%7C%20Chrome-green)

Control YouTube playback using your voice — hands-free, keyboard-free, and frustration-free.

## 🎤 About Borealis Mode
**Borealis** is the command mode for this assistant:
- When you click **Start Listening** in the extension popup, **Borealis is active by default**
- You can say `stop borealis` to disable command recognition while keeping the mic on
- Say `start borealis` again to resume command response
- Say `stop listening` to turn off the microphone and close the overlay entirely

---

## 🎬 Playback Controls

| Command | Action |
|--------|--------|
| `pause` / `play` | Toggle video playback |
| `back 10 seconds` | Rewind by X seconds |
| `forward 1 minute 30 seconds` | Fast forward (supports formats like `2 minutes and 10 seconds`, `one minute 45`) |
| `seek 2 minutes 10 seconds` | Jump to a specific point in the video |

---

## ⏩ Playback Speed

| Command                     | Result                      |
|----------------------------|-----------------------------|
| `speed one` / `normal`     | 1.0x playback               |
| `speed half` / `0.5`       | 0.5x playback               |
| `speed quarter` / `0.25`   | 0.25x playback (very slow)  |
| `speed double` / `2`       | 2.0x playback               |
| `speed triple` / `3`       | 3.0x playback (very fast)   |
| `speed 1.25`               | Precise control (decimals)  |


---

## 🔁 Looping

| Command | Action |
|--------|--------|
| `loop 2 minutes to 2 minutes 45 seconds` | Loop a fixed range |
| `loop to 1 minute 10 seconds` | Loop from current position to target time |
| `stop loop` | Cancel current loop |

---

## 🧠 Notes
- You can speak numbers as words or digits:  
  `one minute`, `2 minutes`, `30 seconds`, etc.
- Commas and `and` are supported:  
  `seek 2 minutes and 10 seconds`, `loop one minute, 30 seconds`
- The overlay updates in real time and is draggable on the page
- Use the popup to start/stop listening, reset the overlay, or view the usage guide

---

## 🧪 Installing on Microsoft Edge

1. Visit `edge://extensions/`
2. Enable **Developer mode** (top right)
3. Click **"Load unpacked"**
4. Select the folder where this extension lives

Done! You're ready to use voice to control YouTube hands-free 🎧

---

## 💡 Tip
Try saying:

> “Loop one hour to one hour and two minutes”  
> “Speed one point five”  
> “Seek two minutes, 45 seconds”

---

Feel free to improve, fork, or contribute. Built for smooth YouTube practicing, watching, or transcribing.
