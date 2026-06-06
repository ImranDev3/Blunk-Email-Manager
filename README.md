# Blunk Email Manager

A professional bulk email management tool — single HTML file, zero dependencies, works entirely in the browser.

## Features

- **3 Import Methods**: Paste emails in any format, upload `.xlsx`/`.csv`/`.txt` files, or add one at a time
- **Email List**: Scrollable list with status badges, copy, mark/unmark, and delete per email
- **Live Stats**: Total, Done (green), Remaining (amber) counters
- **Filters & Search**: Filter by All/Pending/Done, real-time search
- **Bulk Actions**: Copy all remaining emails, clear entire list
- **Persistence**: Auto-saves to localStorage (`emailBulkMgr_v2`)
- **Deduplication**: Case-insensitive duplicate prevention
- **Dark Mode**: Automatic via `prefers-color-scheme`
- **Toast Notifications**: Bottom-right feedback for all actions

## Tech

- Vanilla JavaScript (no frameworks)
- Tabler Icons (outline webfont)
- SheetJS (XLSX) via CDN
- localStorage persistence
- Clipboard API + `execCommand` fallback
