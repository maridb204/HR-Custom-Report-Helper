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
    label: 'STEP 1  ตั้งค่าคอลัมน์รายงาน',
    details: [
      'เข้าเมนู: ตั้งค่าคอลัมน์รายงาน',
      'ค้นหา sal_ot',
      'กด Duplicate / คัดลอก',
      ['เปลี่ยนชื่อ', 'SAL_OT_{p}'],
      'กด กลุ่มรายการ (Manage List)',
      'ค้นหา SAL_OT แล้วกด ดูข้อมูล',
      'กด Duplicate / คัดลอก',
      ['ใส่ชื่อ รหัส', 'SAL_OT_{p}'],
      'กด บันทึก',
      'กด Publish',
    ],
  },
  {
    label: 'STEP 2  สร้างประเภทข้อมูล (Job Type)',
    details: [
      'เข้าเมนู: Record Type',
      'กด เพิ่ม',
      ['สร้าง Job Type', '_jobtype{p}'],
      ['Label', 'job type {p}'],
      'กด Publish',
    ],
  },
  {
    label: 'STEP 3  คัดลอก AM Job Role Form',
    details: [
      'เข้าเมนู: Record Type',
      'ค้นหา AM_JobRoleForm',
      'กด Duplicate',
      ['เปลี่ยนชื่อฟอร์ม', '_jobrole{p}'],
      ['Label', 'job role {p}'],
      '§ 3.1 ตั้งค่ารายการฟิลด์',
      'หา Field เช่น jobLevel',
      'กด Duplicate',
      ['แก้ชื่อ', 'jobtype{p}'],
      ['Label', 'job type {p}'],
      'Data Type → Record',
      'Form Display Row → Left',
      ['RelateRecordTypeName', 'SAX03_jobtype{p}'],
      ['Column Name', 'jobtype{p}'],
      'กด ตกลง',
      '§ 3.2 ตั้งค่า Custom Query',
      'Select เพิ่ม:',
      '> ,a.jobtype{p}',
      'กด Publish',
    ],
  },
  {
    label: 'STEP 4  สร้าง Master Data',
    details: [
      ['เข้าเมนู', 'job type {p}'],
      'กด เพิ่ม',
      'กรอก id = FCT, name = Factory',
      'กด บันทึกและเพิ่ม',
      'กรอก id = STT, name = Station',
      'กด บันทึก',
    ],
  },
  {
    label: 'STEP 5  ตรวจสอบ Job Role',
    details: [
      'กลับมาหน้า job role',
      'ค้นหา hr manager',
      'กด แก้ไข',
      'ตรวจสอบว่า jobtype{p} ขึ้นในฟอร์มหรือไม่',
    ],
  },
  {
    label: 'STEP 6  สร้าง Employee Template',
    details: [
      'เข้าเมนู: Employee Template',
      'กดรูประแจ Setting',
      'กด คัดลอกรายงาน',
      ['เปลี่ยนชื่อ Report Title', 'Employee Template {p}'],
      'กดรูประแจ → Advance Configuration',
      'ไปที่หัวข้อ Custom Form',
      'เพิ่มคำสั่ง join statement:',
      '> inner join SAX03_jobtype{p} jt',
      '> on job.jobtype{p} = jt.id',
      'กด Publish',
    ],
  },
  {
    label: 'STEP 7  เพิ่ม Standard และ Capture',
    details: [
      'กด + → Standard → Record Type',
      ['เลือก', 'jobtype{p}'],
      'ติ๊ก name → Add',
      '§ Captured — current period',
      'กด + → Captured',
      ['Capture Column', 'SAL_OT_{p}'],
      'period → month, period value → current period',
      'กด Save',
      '§ Captured — 1 period before',
      'กด + → Captured',
      ['Capture Column', 'SAL_OT_{p}'],
      'period → month, period value → 1 period before',
      'กด Save',
    ],
  },
  {
    label: 'STEP 8  ตั้งค่าการเรียงข้อมูล',
    details: [
      'กดรูประแจ → Advance Configuration',
      ['Override Order', 'b1Name,name'],
      'Order Template → ลบให้ว่าง',
      'กด Publish',
    ],
  },
  {
    label: 'STEP 9  ทดสอบ Employee Template',
    details: [
      'วันที่: 010426 – 300426',
      'หน่วยงาน: EU Capital Holding Company Limited',
      'กด ดำเนินการ',
    ],
  },
  {
    label: 'STEP 10  ดาวน์โหลด Jasper File',
    details: [
      'กด แก้ไขรายงาน',
      'กด Jasper file upload',
      'กด Download',
    ],
  },
  {
    label: 'STEP 11  แก้ไข JasperSoft Studio',
    details: [
      'เปิดไฟล์ .jrxml',
      'ลบ Column ที่ไม่ใช้',
      'เพิ่ม Text Field',
      'เพิ่ม Number Field',
      'กด Preview',
    ],
  },
  {
    label: 'STEP 12  สร้าง Group และ Summary',
    details: [
      'Create Group',
      'Group By Job Type',
      'Add Header',
      'Add Footer',
      'ลาก Summary ลง Footer',
    ],
  },
  {
    label: 'STEP 13  อัปโหลด Jasper File',
    details: [
      'Upload ไฟล์ .jrxml',
      'กด Publish',
      'ทดลอง Export PDF',
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
  initSectionCollapse();
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

// ── SECTION COLLAPSE ─────────────────────────────
const SEC_KEY = 'hr_section_state_v1';

function initSectionCollapse() {
  const saved = JSON.parse(localStorage.getItem(SEC_KEY) || '{}');

  document.querySelectorAll('.section').forEach(sec => {
    const id     = sec.id;
    const toggle = sec.querySelector('.section-toggle');
    const body   = sec.querySelector('.section-body');
    if (!toggle || !body) return;

    // Restore saved state (default: open)
    const isCollapsed = saved[id] === true;
    if (isCollapsed) {
      body.classList.add('collapsed');
      toggle.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
    }

    // Click on title row (but not interactive children) to toggle
    sec.querySelector('.section-title').addEventListener('click', e => {
      // Ignore clicks on badge or other buttons inside title
      if (e.target.closest('.project-badge') || e.target.closest('.btn-pin')) return;

      const nowCollapsed = body.classList.toggle('collapsed');
      toggle.classList.toggle('collapsed', nowCollapsed);
      toggle.setAttribute('aria-expanded', String(!nowCollapsed));

      // Persist state
      const state = JSON.parse(localStorage.getItem(SEC_KEY) || '{}');
      state[id] = nowCollapsed;
      localStorage.setItem(SEC_KEY, JSON.stringify(state));
    });
  });
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
  document.getElementById('checklistBadge').textContent = '';
  initChecklist();
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

  // Refresh checklist details so {p} shows actual project name
  initChecklist();
  document.getElementById('checklistBadge').textContent = raw;
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
