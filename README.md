# Blunk Email Manager

A professional bulk email management tool — organized with separate HTML, CSS (Tailwind), and JS files. Works entirely in the browser.

## Features

- **3 Import Methods**: Paste emails in any format, upload `.xlsx`/`.csv`/`.txt` files, or add one at a time
- **One-Click Copy**: Click any email row to copy instantly — auto-marks as Done
- **Email List**: Scrollable with index, email, status badge, copy, mark/unmark, and delete actions
- **Live Stats**: Total, Done (green), Remaining (amber) counters + header badge
- **Filters & Search**: Filter by All/Pending/Done with real-time search
- **Bulk Actions**: Copy all remaining emails, clear entire list with confirmation
- **Auto-Clear**: Import area clears after successful paste/upload
- **Persistence**: Auto-saves to localStorage (`emailBulkMgr_v2`), survives reload
- **Deduplication**: Case-insensitive duplicate prevention
- **Dark Mode**: Automatic via `prefers-color-scheme`
- **Toast Notifications**: Bottom-right animated feedback for all actions

## Project Structure

```
Blunk-Email-Manager/
├── index.html       # HTML structure (Tailwind CDN)
├── css/
│   └── style.css    # Custom styles + Tailwind layers
├── js/
│   └── app.js       # All application logic
└── README.md
```

## Tech

- Tailwind CSS v3 (CDN)
- Vanilla JavaScript (no frameworks)
- Tabler Icons (outline webfont)
- SheetJS (XLSX) via CDN
- localStorage persistence
- Clipboard API + `execCommand` fallback

## Credits

Built by ImranDev3.
