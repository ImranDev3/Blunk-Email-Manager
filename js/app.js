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
      emails.push({ email: normalizeEmail(trimmed), done: false });
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
    emails.push({ email: normalizeEmail(t), done: false });
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
    if (domain !== 'gmail.com' && domain !== 'googlemail.com') return [];
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
      results.push(dotted + '@gmail.com');
    }
    return results;
  }

  function updateDotCount() {
    const input = $('#dotInput').value.trim().toLowerCase();
    const parts = input.split('@');
    const countEl = $('#dotCount');
    if (parts.length !== 2 || (parts[1] !== 'gmail.com' && parts[1] !== 'googlemail.com')) {
      countEl.textContent = 'Need @gmail.com';
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
      showToast('Only works with @gmail.com addresses.', 'error');
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
        showToast('Copied: ' + text, 'success');
      } else {
        showToast('Failed to copy.', 'error');
      }
    });
  }

  /* ---- Render ---- */
  function render() {
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

  /* ---- Init ---- */
  function init() {
    loadState();

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
