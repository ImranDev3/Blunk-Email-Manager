# Blunk Email Manager

> Developed by [**ImranDev3**](https://github.com/ImranDev3)

A professional, browser-based bulk email management tool with a premium dark UI, intelligent copy queue, and dynamic color theming. No server or build step required — works entirely offline after first load.

🔗 **GitHub Repository**: [github.com/ImranDev3/Blunk-Email-Manager](https://github.com/ImranDev3/Blunk-Email-Manager)

## Features

### Import
- **Paste** — paste emails in any delimiter (space, comma, semicolon, newline)
- **Upload** — drag-and-drop or browse `.xlsx`, `.csv`, `.txt` files (XLSX via SheetJS)
- **Single Add** — type one email, press Enter to add
- **Dot Generator** — generate Gmail dot-address variations (custom count, max 5000)

### Copy Queue
- Dedicated queue section showing one pending email at a time in large text
- **Copy & Next** — copy to clipboard and auto-advance to next pending
- **Skip** — mark current as done and advance without copying
- **Enter key** — press Enter anywhere on the copy screen to trigger Copy & Next
- Auto-scrolls to next pending card in the grid after each copy

### Email Grid
- Responsive card grid: 4 → 3 → 2 → 1 columns depending on viewport
- Click any card to copy instantly (auto-marks as Done)
- Copy and Toggle (Done/Pending) buttons on each card
- Full email display (multi-line word-break, no truncation)
- Done cards visually dimmed with line-through

### Filters & Search
- Filter by All / Pending / Done
- Real-time search across all emails
- Combined filter + search support

### Bulk Actions
- **Copy Remaining** — copy all pending emails at once, auto-mark all as Done
- **Clear All** — confirm-before-delete modal

### Dynamic Color Palette
- Fetches fresh 5-color palette from colormind.io on first load
- **Palette** button to regenerate colors on demand
- Palette persists in localStorage across sessions
- Smooth CSS variable updates — no flash
- Eye-comfortable defaults if API unavailable

### Stats
- Live counters: Total, Done, Remaining
- Badge in header showing total email count

### Persistence
- All data auto-saved to `localStorage` (key: `emailBulkMgr_v2`)
- Survives page reload, tab close, and browser restart

### UX
- Toast notifications (slide-up, auto-dismiss)
- Confirmation modal for destructive actions
- Smooth CSS transitions and animations
- Keyboard-friendly: Enter to copy, Ctrl+Enter to import paste
- Two-screen flow: Import → auto-switch to Copy on success

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Styling | Tailwind CSS v3 (CDN) + Custom CSS |
| Icons | Tabler Icons (outline webfont) |
| Spreadsheet | SheetJS / XLSX (CDN) |
| Color API | colormind.io |
| Persistence | localStorage |
| Clipboard | Clipboard API + `execCommand` fallback |
| Fonts | Inter (Google Fonts) |
| JS | Vanilla ES5+ (no frameworks, no build step) |

## Project Structure

```
Blunk-Email-Manager/
├── index.html          # HTML structure + CDN links
├── css/
│   └── style.css       # All custom styles (Mac-style dark UI)
├── js/
│   └── app.js          # All application logic
└── README.md
```

## Browser Support

Chrome, Firefox, Safari, Edge — any modern browser. No IE support.

## Setup

1. Clone the repo
2. Open `index.html` in any browser
3. Start importing emails

No build, no install, no server.

## Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `Enter` | Copy screen (no input focused) | Copy & Next (queue) |
| `Ctrl + Enter` | Paste textarea | Parse & Import |
| `Enter` | Single-add input | Add email |

## Development

All source files are plain HTML/CSS/JS. Edit directly — no bundler required.

```bash
git clone https://github.com/ImranDev3/Blunk-Email-Manager.git
cd Blunk-Email-Manager
# Open index.html in browser
```

## License

MIT — free to use, modify, and distribute.

---

## Credits

**Blunk Email Manager** was built with care by **ImranDev3**.

- GitHub: [github.com/ImranDev3](https://github.com/ImranDev3)
- Repository: [github.com/ImranDev3/Blunk-Email-Manager](https://github.com/ImranDev3/Blunk-Email-Manager)

If you find this tool useful, consider starring the repo ⭐
