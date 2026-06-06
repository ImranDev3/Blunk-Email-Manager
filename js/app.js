/* ============================================
   Blunk Email Manager — App Logic
   ============================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'emailBulkMgr_v2';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let emails = [];
  let currentFilter = 'all';
  let searchQuery = '';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /* ---- Screen Switching ---- */
  function showImportScreen() {
    $('#screenImport').style.display = '';
    $('#screenCopy').style.display = 'none';
  }

  function showCopyScreen() {
    $('#screenImport').style.display = 'none';
    $('#screenCopy').style.display = '';
  }

  /* ---- Storage ---- */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) emails = parsed;
      }
    } catch (_) {}
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(emails)); } catch (_) {}
  }

  /* ---- Helpers ---- */
  function normalizeEmail(e) { return e.trim().toLowerCase(); }
  function isValidEmail(e) { return emailRegex.test(e.trim()); }
  function isDuplicate(e) {
    const norm = normalizeEmail(e);
    return emails.some((item) => item.email === norm);
  }

  /* ---- CRUD ---- */
  function addEmails(rawList) {
    let added = 0;
    for (let i = 0; i < rawList.length; i++) {
      const raw = rawList[i];
      if (!raw || typeof raw !== 'string') continue;
      const trimmed = raw.trim();
      if (!trimmed || !isValidEmail(trimmed) || isDuplicate(trimmed)) continue;
      emails.unshift({ email: normalizeEmail(trimmed), done: false });
      added++;
    }
    if (added > 0) { saveState(); render(); }
    return added;
  }

  function addSingle(email) {
    const t = email.trim();
    if (!t) return { ok: false, msg: 'Please enter an email address.' };
    if (!isValidEmail(t)) return { ok: false, msg: 'Invalid email format.' };
    if (isDuplicate(t)) return { ok: false, msg: 'Duplicate — already in list.' };
    emails.unshift({ email: normalizeEmail(t), done: false });
    saveState();
    render();
    return { ok: true, msg: 'Email added!' };
  }

  function removeEmail(index) {
    if (index >= 0 && index < emails.length) {
      emails.splice(index, 1);
      saveState();
      render();
    }
  }

  function toggleDone(index) {
    if (index >= 0 && index < emails.length) {
      emails[index].done = !emails[index].done;
      saveState();
      render();
    }
  }

  function markDone(index) {
    if (index >= 0 && index < emails.length) {
      emails[index].done = true;
      saveState();
      render();
    }
  }

  /* ---- Filter & Search ---- */
  function getFiltered() {
    let list = emails;
    if (currentFilter === 'pending') list = list.filter((e) => !e.done);
    else if (currentFilter === 'done') list = list.filter((e) => e.done);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.email.includes(q));
    }
    return list;
  }

  /* ---- Clipboard ---- */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true);
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Promise.resolve(ok);
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  /* ---- Toast ---- */
  function showToast(msg, type) {
    type = type || 'info';
    const iconMap = { success: 'ti ti-circle-check', error: 'ti ti-alert-circle', info: 'ti ti-info-circle' };
    const container = $('#toastContainer');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<i class="' + (iconMap[type] || iconMap.info) + '"></i> ' + msg;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('slide-out');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
    }, 3000);
  }

  /* ---- Confirm Modal ---- */
  function showConfirm(title, message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
      '<i class="ti ti-alert-triangle"></i>' +
      '<h3>' + title + '</h3>' +
      '<p>' + message + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="confirmCancel">Cancel</button>' +
      '<button class="btn btn-danger" id="confirmOk">Clear All</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmOk').addEventListener('click', () => {
      document.body.removeChild(overlay);
      onConfirm();
    });
    overlay.querySelector('#confirmCancel').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }

  /* ---- Parse pasted text ---- */
  function parseText(text) {
    const parts = text.split(/[\s,;]+/);
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i].trim();
      if (p) result.push(p);
    }
    return result;
  }

  /* ---- Dot Email Generator ---- */
  function generateDotEmails(email, count) {
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return [];
    const [name, domain] = parts;
    const n = name.length;
    if (n < 2) return [];
    const total = Math.pow(2, n - 1);
    const limit = Math.min(count || total, total, 5000);
    const results = [];
    for (let mask = 0; mask < limit; mask++) {
      let dotted = '';
      for (let i = 0; i < n; i++) {
        dotted += name[i];
        if (i < n - 1 && (mask & (1 << i))) dotted += '.';
      }
      results.push(dotted + '@' + domain);
    }
    return results;
  }

  function updateDotCount() {
    const input = $('#dotInput').value.trim().toLowerCase();
    const parts = input.split('@');
    const countEl = $('#dotCount');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      countEl.textContent = 'Enter email@domain';
      countEl.style.color = 'var(--text-muted)';
      return;
    }
    const n = parts[0].length;
    if (n < 2) { countEl.textContent = 'Name too short'; countEl.style.color = 'var(--danger)'; return; }
    const total = Math.pow(2, n - 1);
    const display = total > 9999 ? (total / 1000).toFixed(1) + 'k' : total;
    countEl.textContent = display + ' possible';
    countEl.style.color = 'var(--primary)';
  }

  function handleDotGenerate() {
    const input = $('#dotInput').value.trim();
    if (!input) { showToast('Enter a Gmail address first.', 'error'); return; }
    let count = parseInt($('#dotCountInput').value, 10);
    if (isNaN(count) || count < 1) count = 100;
    const dots = generateDotEmails(input, count);
    if (dots.length === 0) {
      showToast('Invalid email or name too short.', 'error');
      return;
    }
    const added = addEmails(dots);
    if (added > 0) {
      showToast(added + ' dot email' + (added > 1 ? 's' : '') + ' generated & imported!', 'success');
      showCopyScreen();
    } else {
      showToast('All variations already in list.', 'info');
    }
  }

  /* ---- Import handlers ---- */
  function handlePaste() {
    const ta = $('#pasteArea');
    const raw = ta.value.trim();
    if (!raw) { showToast('Paste area is empty.', 'error'); return; }
    const tokens = parseText(raw);
    if (tokens.length === 0) { showToast('No emails found.', 'error'); return; }
    const added = addEmails(tokens);
    if (added > 0) {
      showToast(added + ' email' + (added > 1 ? 's' : '') + ' imported.', 'success');
      ta.value = '';
      showCopyScreen();
    } else {
      showToast('No new valid emails (all duplicates or invalid).', 'info');
    }
  }

  function handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const tokens = parseText(text);
        const added = addEmails(tokens);
        if (added > 0) {
          showToast(added + ' email' + (added > 1 ? 's' : '') + ' imported.', 'success');
          showCopyScreen();
        } else {
          showToast('No new valid emails in ' + file.name + '.', 'info');
        }
        $('#fileInput').value = '';
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const tokens = [];
          for (let s = 0; s < wb.SheetNames.length; s++) {
            const sheet = wb.Sheets[wb.SheetNames[s]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            for (let r = 0; r < json.length; r++) {
              const row = json[r];
              for (let c = 0; c < row.length; c++) {
                const val = row[c];
                if (val && typeof val === 'string') {
                  const parsed = parseText(val);
                  for (let p = 0; p < parsed.length; p++) tokens.push(parsed[p]);
                } else if (val && typeof val === 'number') {
                  tokens.push(String(val));
                }
              }
            }
          }
          const added = addEmails(tokens);
          if (added > 0) {
            showToast(added + ' email' + (added > 1 ? 's' : '') + ' imported.', 'success');
            showCopyScreen();
          } else {
            showToast('No new valid emails in ' + file.name + '.', 'info');
          }
        } catch (err) {
          showToast('Error parsing Excel: ' + err.message, 'error');
        }
        $('#fileInput').value = '';
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast('Unsupported file format.', 'error');
      $('#fileInput').value = '';
    }
  }

  /* ---- Bulk ---- */
  function handleCopyAll() {
    const pending = emails.filter((e) => !e.done);
    if (pending.length === 0) { showToast('No pending emails to copy.', 'info'); return; }
    const text = pending.map((e) => e.email).join('\n');
    copyToClipboard(text).then((ok) => {
      if (ok) {
        for (let i = 0; i < emails.length; i++) emails[i].done = true;
        saveState();
        render();
        showToast(pending.length + ' email' + (pending.length > 1 ? 's' : '') + ' copied & marked Done.', 'success');
      } else {
        showToast('Failed to copy to clipboard.', 'error');
      }
    });
  }

  function handleClearAll() {
    if (emails.length === 0) { showToast('List is already empty.', 'info'); return; }
    showConfirm('Clear all emails?', 'Delete all ' + emails.length + ' email' + (emails.length > 1 ? 's' : '') + '? This cannot be undone.', () => {
      const count = emails.length;
      emails = [];
      saveState();
      render();
      showToast('Cleared ' + count + ' email' + (count > 1 ? 's' : '') + '.', 'info');
      showImportScreen();
    });
  }

  /* ---- Card copy handler ---- */
  function handleRowCopy(index) {
    const text = emails[index].email;
    copyToClipboard(text).then((ok) => {
      if (ok) {
        markDone(index);

        const card = document.querySelector('.email-card[data-index="' + index + '"]');
        if (card) card.classList.add('flash-copied');

        /* Auto-scroll to next pending card */
        setTimeout(function () {
          var nextCard = document.querySelector('.email-card:not(.done)');
          if (nextCard) {
            nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nextCard.style.transition = 'box-shadow 0.3s';
            nextCard.style.boxShadow = '0 0 0 2px var(--primary), 0 4px 16px rgba(124,140,248,0.25)';
            setTimeout(function () { nextCard.style.boxShadow = ''; }, 1500);
          }
        }, 120);

        showToast('Copied: ' + text, 'success');
      } else {
        showToast('Failed to copy.', 'error');
      }
    });
  }

  /* ---- Copy Queue ---- */
  function getQueueEmail() {
    for (var i = 0; i < emails.length; i++) {
      if (!emails[i].done) return { item: emails[i], index: i };
    }
    return null;
  }

  function updateQueue() {
    var q = getQueueEmail();
    var total = emails.length;
    var done = 0;
    for (var i = 0; i < emails.length; i++) { if (emails[i].done) done++; }
    var remaining = total - done;

    $('#queueProgress').textContent = done + ' / ' + total;

    if (!q) {
      $('#queueBody').style.display = 'none';
      $('#queueDone').style.display = 'flex';
      $('#queueEmail').textContent = '\u2014';
      return;
    }

    $('#queueBody').style.display = 'flex';
    $('#queueDone').style.display = 'none';
    $('#queueEmail').textContent = q.item.email;
  }

  function queueCopy() {
    var q = getQueueEmail();
    if (!q) { showToast('All emails are done.', 'info'); return; }
    var text = q.item.email;
    copyToClipboard(text).then(function (ok) {
      if (ok) {
        q.item.done = true;
        saveState();
        render();
        showToast('Copied: ' + text, 'success');
      } else {
        showToast('Failed to copy.', 'error');
      }
    });
  }

  function queueSkip() {
    var q = getQueueEmail();
    if (!q) { showToast('All emails are done.', 'info'); return; }
    q.item.done = true;
    saveState();
    render();
    showToast('Skipped: ' + q.item.email, 'info');
  }

  /* ---- Render ---- */
  function render() {
    updateQueue();
    const list = getFiltered();
    const container = $('#emailList');

    const total = emails.length;
    let doneCount = 0;
    for (let i = 0; i < emails.length; i++) { if (emails[i].done) doneCount++; }
    const remaining = total - doneCount;

    $('#statTotal').textContent = total;
    $('#statDone').textContent = doneCount;
    $('#statRemaining').textContent = remaining;
    $('#liveCount').textContent = total + ' email' + (total !== 1 ? 's' : '');
    $('#listCount').textContent = total;

    if (list.length === 0) {
      container.innerHTML =
        '<div class="list-empty"><i class="ti ti-mail-off"></i><p>' +
        (emails.length === 0 ? 'No emails yet.' : 'No matching emails found.') +
        '</p></div>';
      return;
    }

    let html = '<div class="email-grid">';
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const realIndex = emails.indexOf(item);
      const doneClass = item.done ? 'done' : '';
      const badgeCls = item.done ? 'done' : 'pending';
      const badgeTxt = item.done ? 'Done' : 'Pending';
      const toggleIcon = item.done ? 'ti ti-circle-minus' : 'ti ti-circle-check';
      const toggleTitle = item.done ? 'Unmark' : 'Mark Done';

      html +=
        '<div class="email-card ' + doneClass + '" data-index="' + realIndex + '">' +
          '<div class="card-top">' +
            '<span class="card-idx">' + (realIndex + 1) + '</span>' +
            '<span class="email-text">' + escHtml(item.email) + '</span>' +
          '</div>' +
          '<div class="card-bottom">' +
            '<span class="badge ' + badgeCls + '">' + badgeTxt + '</span>' +
            '<div class="card-actions">' +
              '<button class="card-btn copy-btn" title="Copy" data-index="' + realIndex + '"><i class="ti ti-copy"></i></button>' +
              '<button class="card-btn toggle-btn" title="' + toggleTitle + '" data-index="' + realIndex + '"><i class="' + toggleIcon + '"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function escHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  /* ---- Palette / Color API (colormind.io) ---- */
  const DEFAULT_PALETTE = [
    [124, 140, 248],  // primary — soft indigo
    [90, 109, 245],   // primary-dark
    [64, 182, 133],   // success — muted emerald
    [232, 104, 104],  // danger — soft rose
    [212, 160, 48],   // warning — warm amber
  ];

  let currentPalette = null;

  function rgbStr(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  function applyPalette(palette) {
    if (!palette || palette.length < 5) return;
    currentPalette = palette;
    const root = document.documentElement;
    root.style.setProperty('--primary', rgbStr(palette[0]));
    root.style.setProperty('--primary-dark', rgbStr(palette[1]));
    root.style.setProperty('--primary-glow', 'rgba(' + palette[0][0] + ',' + palette[0][1] + ',' + palette[0][2] + ',0.15)');
    root.style.setProperty('--success', rgbStr(palette[2]));
    root.style.setProperty('--success-glow', 'rgba(' + palette[2][0] + ',' + palette[2][1] + ',' + palette[2][2] + ',0.15)');
    root.style.setProperty('--danger', rgbStr(palette[3]));
    root.style.setProperty('--warning', rgbStr(palette[4]));
    updateSwatches(palette);
    try { localStorage.setItem('emailBulkMgr_palette', JSON.stringify(palette)); } catch (_) {}
  }

  function updateSwatches(palette) {
    const container = $('#paletteSwatches');
    if (!container) return;
    container.innerHTML = palette.map(function (c) {
      return '<span class="palette-swatch" style="background:' + rgbStr(c) + '"></span>';
    }).join('');
  }

  function fetchPalette() {
    // Try saved palette first
    try {
      var saved = localStorage.getItem('emailBulkMgr_palette');
      if (saved) { var p = JSON.parse(saved); if (p && p.length === 5) { applyPalette(p); return; } }
    } catch (_) {}

    // Apply default while waiting
    applyPalette(DEFAULT_PALETTE);

    // Fetch from colormind.io
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://colormind.io/api/', true);
    xhr.timeout = 5000;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.result && data.result.length === 5) {
            applyPalette(data.result);
          }
        } catch (_) {}
      }
    };
    xhr.onerror = function () { /* fallback to default */ };
    xhr.ontimeout = function () { /* fallback to default */ };
    xhr.send(JSON.stringify({ model: 'default' }));
  }
  function init() {
    loadState();

    /* Load / fetch color palette */
    fetchPalette();

    /* Palette refresh button */
    $('#paletteBtn').addEventListener('click', function () {
      this.disabled = true;
      this.innerHTML = '<i class="ti ti-loader"></i> Loading...';
      try { localStorage.removeItem('emailBulkMgr_palette'); } catch (_) {}
      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://colormind.io/api/', true);
      xhr.timeout = 5000;
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function () {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data && data.result && data.result.length === 5) {
              applyPalette(data.result);
            }
          } catch (_) {}
        }
        var btn = $('#paletteBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-palette"></i> Palette';
      };
      xhr.onerror = function () {
        var btn = $('#paletteBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-palette"></i> Palette';
      };
      xhr.ontimeout = xhr.onerror;
      xhr.send(JSON.stringify({ model: 'default' }));
    });

    /* Screen: choose which to show on load */
    if (emails.length > 0) {
      showCopyScreen();
      showToast('Loaded ' + emails.length + ' email' + (emails.length > 1 ? 's' : '') + ' from storage.', 'info');
    } else {
      showImportScreen();
    }

    /* Top Clear All button */
    $('#topClearAllBtn').addEventListener('click', handleClearAll);

    /* Tabs */
    $$('#importTabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        $$('#importTabs .tab-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        const name = this.getAttribute('data-tab');
        $$('.tab-panel').forEach((p) => p.classList.remove('active'));
        const target = $('#tab' + name.charAt(0).toUpperCase() + name.slice(1));
        if (target) target.classList.add('active');
      });
    });

    /* Paste */
    $('#parsePasteBtn').addEventListener('click', handlePaste);
    $('#clearPasteBtn').addEventListener('click', () => { $('#pasteArea').value = ''; });
    $('#pasteArea').addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handlePaste(); }
    });

    /* Upload */
    const zone = $('#uploadZone');
    const fileInput = $('#fileInput');
    zone.addEventListener('click', () => fileInput.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });

    /* Single add */
    const singleInput = $('#singleEmail');
    $('#addSingleBtn').addEventListener('click', () => {
      const r = addSingle(singleInput.value);
      showToast(r.msg, r.ok ? 'success' : 'error');
      if (r.ok) { singleInput.value = ''; showCopyScreen(); singleInput.focus(); }
    });
    singleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const r = addSingle(singleInput.value);
        showToast(r.msg, r.ok ? 'success' : 'error');
        if (r.ok) { singleInput.value = ''; showCopyScreen(); }
      }
    });

    /* Dot Generator */
    $('#dotInput').addEventListener('input', updateDotCount);
    $('#dotGenBtn').addEventListener('click', handleDotGenerate);
    $('#dotInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleDotGenerate(); }
    });

    /* Filter */
    $$('#filterGroup .filter-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        $$('#filterGroup .filter-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        render();
      });
    });

    /* Search */
    $('#searchInput').addEventListener('input', function () {
      searchQuery = this.value;
      render();
    });

    /* Bulk */
    $('#copyAllBtn').addEventListener('click', handleCopyAll);
    $('#clearAllBtn').addEventListener('click', handleClearAll);

    /* Copy Queue */
    $('#queueCopyBtn').addEventListener('click', queueCopy);
    $('#queueSkipBtn').addEventListener('click', queueSkip);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey && $('#screenCopy').style.display !== 'none') {
        var active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          queueCopy();
        }
      }
    });

    /* Email list delegation */
    $('#emailList').addEventListener('click', (e) => {
      const target = e.target.closest('button');
      const card = e.target.closest('.email-card');
      if (!card) return;
      const index = parseInt(card.getAttribute('data-index'), 10);
      if (isNaN(index) || index < 0 || index >= emails.length) return;

      if (target) {
        e.stopPropagation();
        if (target.classList.contains('copy-btn')) { handleRowCopy(index); }
        else if (target.classList.contains('toggle-btn')) { toggleDone(index); }
        return;
      }

      handleRowCopy(index);
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
