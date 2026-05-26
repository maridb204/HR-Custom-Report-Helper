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

// detail format:
//   'text'           → bullet point
//   '§ text'         → section sub-header
//   '> text'         → code-only block  (monospace, highlighted)
//   ['label','code'] → label: <code>
const CHECKLIST_STEPS = [
  {
    label: 'STEP 1  Column',
    details: [
      'เมนู: ตั้งค่าคอลัมน์รายงาน',
      'ค้นหา sal_ot → กด Duplicate',
      ['เปลี่ยนชื่อ', 'SAL_OT_{p}'],
      'กด กลุ่มรายการ (Manage List)',
      'ค้นหา SAL_OT → ดูข้อมูล → Duplicate',
      ['ใส่รหัส', 'SAL_OT_{p}'],
      'กด บันทึก → Publish',
    ],
  },
  {
    label: 'STEP 2  Record Type',
    details: [
      'เมนู: Record Type → กด เพิ่ม',
      ['ชื่อ/รหัส', '_jobtype{p}'],
      ['Label', 'job type {p}'],
      'Publish',
    ],
  },
  {
    label: 'STEP 3  Field',
    details: [
      'เมนู: Record Type',
      'ค้นหา AM_JobRoleForm → Duplicate',
      ['ชื่อฟอร์ม', '_jobrole{p}'],
      ['Label', 'job role {p}'],
      '§ ตั้งค่าฟิลด์',
      'หา jobLevel → กด Duplicate',
      ['ชื่อฟิลด์', 'jobtype{p}'],
      ['Label', 'job type {p}'],
      'Data Type → Record',
      'Form Display Row → Left',
      ['RelateRecordTypeName', 'SAX03_jobtype{p}'],
      ['Column Name', 'jobtype{p}'],
      'กด ตกลง',
    ],
  },
  {
    label: 'STEP 4  Query',
    details: [
      'Select เพิ่ม:',
      '> ,a.jobtype{p}',
      'Publish',
    ],
  },
  {
    label: 'STEP 5  Employee Template',
    details: [
      'เมนู: Employee Template',
      'กดรูประแจ → คัดลอกรายงาน',
      ['Report Title', 'Employee Template {p}'],
      'กดรูประแจ → Advance Configuration → Custom Form',
      'เพิ่ม join statement:',
      '> inner join SAX03_jobtype{p} jt',
      '> on job.jobtype{p} = jt.id',
      'Publish',
    ],
  },
  {
    label: 'STEP 6  Capture',
    details: [
      'กด + → Standard → Record Type',
      'เลือก jobtype{p} → ติ๊ก name → Add',
      '§ Captured — current period',
      'กด + → Captured',
      ['Capture Column', 'SAL_OT_{p}'],
      'period → month, period value → current period → Save',
      '§ Captured — 1 period before',
      'กด + → Captured',
      ['Capture Column', 'SAL_OT_{p}'],
      'period → month, period value → 1 period before → Save',
    ],
  },
  {
    label: 'STEP 7  Order',
    details: [
      ['Override Order', 'b1Name,name'],
      'Order Template → ลบให้ว่าง',
      'Publish',
    ],
  },
  {
    label: 'STEP 8  Master Data',
    details: [
      ['เมนู', 'job type {p}'],
      'กด เพิ่ม',
      '§ เพิ่มข้อมูล',
      'id = FCT, name = Factory → บันทึกและเพิ่ม',
      'id = STT, name = Station → บันทึก',
      '§ ตรวจสอบ Job Role',
      'ค้นหา hr manager → แก้ไข',
      'ตรวจสอบว่า jobtype{p} ขึ้นในฟอร์ม',
    ],
  },
  {
    label: 'STEP 9  Jasper',
    details: [
      '§ ทดสอบ Employee Template',
      'วันที่: 010426 – 300426',
      'หน่วยงาน: EU Capital Holding Company Limited',
      'กด ดำเนินการ',
      '§ ดาวน์โหลด Jasper File',
      'แก้ไขรายงาน → Jasper file upload → Download',
      '§ JasperSoft Studio',
      'ลบ Column ที่ไม่ใช้',
      'เพิ่ม Text Field + Number Field → Preview',
      'Create Group → Group By Job Type',
      'Add Header + Footer → ลาก Summary ลง Footer',
      '§ อัปโหลด',
      'Upload .jrxml → Publish → Export PDF',
    ],
  },
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

  // Clear generator
  document.getElementById('btnClear').addEventListener('click', handleClear);

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

function pinToSidePanel() {
  if (IS_PANEL) return;

  // chrome.sidePanel ไม่มี = extension ยังไม่ได้ Reload หลังอัปเดต manifest
  if (!chrome.sidePanel?.open) {
    showToast('กด Reload extension ที่ chrome://extensions/ ก่อน');
    return;
  }

  // ใช้ callback แทน async/await เพื่อรักษา user gesture context
  // Chrome จะ block chrome.sidePanel.open() ถ้า user gesture หายไประหว่าง await
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const windowId = tabs?.[0]?.windowId;
    chrome.sidePanel
      .open(windowId ? { windowId } : {})
      .then(() => window.close())
      .catch(err => showToast(err?.message || 'เปิด Side Panel ไม่สำเร็จ'));
  });
}

// ── GENERATOR ────────────────────────────────────
function handleClear() {
  currentProject = '';
  document.getElementById('projectName').value = '';
  document.getElementById('namesOutput').style.display = 'none';
  document.getElementById('sqlOutput').style.display   = 'none';
  document.getElementById('sqlHint').style.display     = '';
  document.getElementById('btnProcess').disabled       = true;
  document.getElementById('projectName').focus();
}

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

  CHECKLIST_STEPS.forEach((step, i) => {
    const isDone = !!saved[i];

    const wrapper = document.createElement('div');
    wrapper.className = `checklist-item${isDone ? ' done' : ''}`;

    // Header row
    const header = document.createElement('div');
    header.className = 'checklist-header';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = isDone;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'checklist-label';
    labelSpan.textContent = step.label;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'checklist-toggle';
    toggleBtn.textContent = '›'; // ›
    toggleBtn.setAttribute('aria-expanded', 'false');

    header.appendChild(cb);
    header.appendChild(labelSpan);
    header.appendChild(toggleBtn);

    // Details panel
    const detailPanel = document.createElement('div');
    detailPanel.className = 'checklist-details';

    const ul = document.createElement('ul');
    step.details.forEach(raw => ul.appendChild(renderDetailItem(raw)));
    detailPanel.appendChild(ul);

    // Events
    cb.addEventListener('change', () => {
      saveChecklistItem(i, cb.checked);
      wrapper.classList.toggle('done', cb.checked);
    });

    header.addEventListener('click', e => {
      if (e.target === cb) return;
      const isOpen = detailPanel.classList.contains('open');
      detailPanel.classList.toggle('open', !isOpen);
      toggleBtn.classList.toggle('open', !isOpen);
      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    wrapper.appendChild(header);
    wrapper.appendChild(detailPanel);
    container.appendChild(wrapper);
  });
}

// Render one detail line based on its format
function renderDetailItem(raw) {
  const li = document.createElement('li');

  if (Array.isArray(raw)) {
    // ['label', 'code'] → "label: <code>value</code>"
    const [lbl, code] = raw;
    li.className = 'detail-pair';
    const lblEl = document.createElement('span');
    lblEl.className = 'd-label';
    lblEl.textContent = lbl + ': ';
    const codeEl = document.createElement('code');
    codeEl.className = 'd-code';
    codeEl.textContent = subProject(code);
    li.appendChild(lblEl);
    li.appendChild(codeEl);
    return li;
  }

  if (raw.startsWith('§ ') || raw.startsWith('§ ')) {
    // Section sub-header
    li.className = 'detail-section';
    li.textContent = raw.slice(2).trim();
    return li;
  }

  if (raw.startsWith('> ')) {
    // Code-only block
    li.className = 'detail-code-block';
    li.textContent = subProject(raw.slice(2));
    return li;
  }

  // Normal bullet
  li.textContent = subProject(raw);
  return li;
}

// Replace {p} with current project name (or '{project}' if not set)
function subProject(text) {
  return text.replace(/\{p\}/g, currentProject || '{project}');
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
