# InversionLab

A browser-based simulator for priority inversion under Plain Mutex, Priority Inheritance, and Priority Ceiling protocols.

## Run locally

Open `index.html` in VS Code and use Live Server, or serve the folder with:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Files

- `index.html` — page structure and controls
- `style.css` — responsive dark theme
- `sim.js` — tick-based scheduler engine
- `ui.js` — canvas timelines and metrics
