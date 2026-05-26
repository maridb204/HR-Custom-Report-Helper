/* ================================================
   HR Custom Report Helper — popup.js
   ================================================ */

// ── CONFIGURATION ─────────────────────────────────
// Update these URLs to match your internal HR system
const WORKSPACE_URLS = [
  'about:blank',  // TODO: URL สำหรับตั้งค่าคอลัมน์รายงาน
  'about:blank',  // TODO: URL สำหรับ Record Type
  'about:blank',  // TODO: URL สำหรับ Employee Template
];

const CHECKLIST_STEPS = [
  'STEP 1  Column',
  'STEP 2  Record Type',
  'STEP 3  Field',
  'STEP 4  Query',
  'STEP 5  Employee Template',
  'STEP 6  Capture',
  'STEP 7  Order',
  'STEP 8  Master Data',
  'STEP 9  Jasper',
];

const LS_KEY = 'hr_report_checklist_v1';

// true เมื่อเปิดในโหมด Side Panel (URL มี ?mode=panel)
const IS_PANEL = new URLSearchParams(window.location.search).get('mode') === 'panel';

// ── STATE ─────────────────────────────────────────
let currentProject = '';   // ชื่อ project ที่ generate ล่าสุด
let jrxmlContent  = '';    // เนื้อหาไฟล์ .jrxml ที่อ่านแล้ว
let jrxmlFileName = '';    // ชื่อไฟล์ .jrxml ที่อัปโหลด

// ── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  bindEvents();
  initPanelMode();
});

// ── BIND EVENTS ──────────────────────────────────
function bindEvents() {
  // Generate
  document.getElementById('btnGenerate').addEventListener('click', handleGenerate);
  document.getElementById('projectName').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleGenerate();
  });

  // Copy buttons (data-copy attribute routing)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-copy]');
    if (btn) handleCopy(btn.dataset.copy);
  });

  // Checklist reset
  document.getElementById('btnResetChecklist').addEventListener('click', resetChecklist);

  // Open Workspace
  document.getElementById('btnOpenWorkspace').addEventListener('click', openWorkspace);

  // Jasper file select
  document.getElementById('jrxmlFile').addEventListener('change', handleFileSelect);

  // Jasper process
  document.getElementById('btnProcess').addEventListener('click', processJrxml);

  // Pin button
  document.getElementById('btnPin').addEventListener('click', pinToSidePanel);
}

// ── PANEL MODE ───────────────────────────────────
function initPanelMode() {
  const btn = document.getElementById('btnPin');
  if (IS_PANEL) {
    // กำลังรันใน Side Panel — เปลี่ยนปุ่มเป็น "Pinned"
    document.body.classList.add('side-panel-mode');
    btn.textContent = 'Pinned';
    btn.classList.add('pinned');
    btn.title = 'กำลังแสดงในโหมด Side Panel';
  }
}

async function pinToSidePanel() {
  if (IS_PANEL) return; // ถ้าอยู่ใน panel อยู่แล้ว ไม่ต้องทำอะไร
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close(); // ปิด popup หลังจากเปิด side panel
  } catch {
    showToast('Side Panel ต้องการ Chrome 114+');
  }
}

// ── GENERATOR ────────────────────────────────────
function handleGenerate() {
  const raw = document.getElementById('projectName').value.trim();
  if (!raw) {
    showToast('กรุณาใส่ชื่อ project');
    return;
  }

  currentProject = raw;

  // Build text blocks
  const names = buildNames(raw);
  const { queryCol, joinStmt } = buildSQL(raw);

  // Render Names section
  document.getElementById('namesText').textContent = names;
  document.getElementById('namesOutput').style.display = 'block';

  // Render SQL section
  document.getElementById('queryText').textContent = queryCol;
  document.getElementById('joinText').textContent  = joinStmt;
  document.getElementById('sqlOutput').style.display = 'block';
  document.getElementById('sqlHint').style.display   = 'none';

  // Enable Jasper button if file already loaded
  if (jrxmlContent) {
    document.getElementById('btnProcess').disabled = false;
  }
}

function buildNames(p) {
  return [
    `SAL_OT_${p}`,
    `_jobtype${p}`,
    `_jobrole${p}`,
    `Employee Template ${p}`,
  ].join('\n');
}

function buildSQL(p) {
  return {
    queryCol: `,a.jobtype${p}`,
    joinStmt: `inner join SAX03_jobtype${p} jt\non job.jobtype${p} = jt.id`,
  };
}

// ── COPY ──────────────────────────────────────────
function handleCopy(type) {
  if (!currentProject && type !== 'names') {
    showToast('Generate project name ก่อน');
    return;
  }

  const p = currentProject;
  let text = '';

  switch (type) {
    case 'names':
      text = document.getElementById('namesText').textContent;
      break;
    case 'query':
      text = document.getElementById('queryText').textContent;
      break;
    case 'join':
      text = document.getElementById('joinText').textContent;
      break;
    case 'all':
      // รวมทุก section: names + SQL query + SQL join
      text = [
        buildNames(p),
        '',
        buildSQL(p).queryCol,
        '',
        buildSQL(p).joinStmt,
      ].join('\n');
      break;
    default:
      return;
  }

  if (!text) return;

  navigator.clipboard.writeText(text)
    .then(() => showToast('Copied!'))
    .catch(() => showToast('Copy ไม่สำเร็จ'));
}

// ── CHECKLIST ─────────────────────────────────────
function initChecklist() {
  const saved     = loadChecklist();
  const container = document.getElementById('checklist');
  container.innerHTML = '';

  CHECKLIST_STEPS.forEach((label, i) => {
    const isDone = !!saved[i];

    const item = document.createElement('label');
    item.className = `checklist-item${isDone ? ' done' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.index = i;
    cb.checked = isDone;

    const span = document.createElement('span');
    span.textContent = label;

    cb.addEventListener('change', () => {
      saveChecklistItem(i, cb.checked);
      item.classList.toggle('done', cb.checked);
    });

    item.appendChild(cb);
    item.appendChild(span);
    container.appendChild(item);
  });
}

function loadChecklist() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveChecklistItem(index, value) {
  const saved = loadChecklist();
  saved[index] = value;
  localStorage.setItem(LS_KEY, JSON.stringify(saved));
}

function resetChecklist() {
  localStorage.removeItem(LS_KEY);
  initChecklist();
  showToast('Checklist reset');
}

// ── OPEN WORKSPACE ────────────────────────────────
function openWorkspace() {
  WORKSPACE_URLS.forEach(url => {
    chrome.tabs.create({ url, active: false });
  });
  showToast('เปิด tabs แล้ว');
}

// ── JASPER REPLACE ────────────────────────────────
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  jrxmlFileName = file.name;
  document.getElementById('fileName').textContent = file.name;

  // Enable process button only if project name exists
  document.getElementById('btnProcess').disabled = !currentProject;

  const reader = new FileReader();
  reader.onload = ev => { jrxmlContent = ev.target.result; };
  reader.onerror = () => showToast('อ่านไฟล์ไม่สำเร็จ');
  reader.readAsText(file, 'UTF-8');
}

function processJrxml() {
  if (!jrxmlContent) {
    showToast('กรุณาเลือกไฟล์ .jrxml ก่อน');
    return;
  }
  if (!currentProject) {
    showToast('Generate project name ก่อน');
    return;
  }

  // Replace all occurrences of SAL_OT (not already followed by _project) -> SAL_OT_<project>
  const replaced = jrxmlContent.replaceAll('SAL_OT', `SAL_OT_${currentProject}`);

  // Build new filename: report.jrxml -> report_tide.jrxml
  const newName = jrxmlFileName.replace(/\.jrxml$/i, `_${currentProject}.jrxml`);

  downloadText(replaced, newName, 'application/xml');
  showToast('Downloaded: ' + newName);
}

// ── HELPERS ───────────────────────────────────────
function downloadText(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 1800);
}
