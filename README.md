# HR Custom Report Helper — Chrome Extension

ช่วยสร้าง Custom Report สำหรับระบบ HR ได้เร็วขึ้น

---

## วิธีติดตั้ง

### ขั้นตอนที่ 1 — เปิด Extensions ใน Chrome

เปิด Chrome แล้วพิมพ์ที่ address bar:

```
chrome://extensions/
```

---

### ขั้นตอนที่ 2 — เปิด Developer Mode

มุมขวาบนของหน้า Extensions ให้เปิด toggle **Developer mode**

---

### ขั้นตอนที่ 3 — Load Extension

กดปุ่ม **Load unpacked** แล้วเลือกโฟลเดอร์:

```
y:\customreport
```

---

### ขั้นตอนที่ 4 — ใช้งาน

Extension จะปรากฏที่ toolbar มุมขวาบนของ Chrome  
กด icon เพื่อเปิด popup

> ถ้าไม่เห็น icon ให้กด icon รูปจิ๊กซอว์ (Extensions) แล้ว pin **HR Custom Report Helper**

---

## ตั้งค่า Workspace URLs

แก้ไขไฟล์ `popup.js` บรรทัดที่ 14–18:

```js
const WORKSPACE_URLS = [
  'https://your-hr-system/column-settings',   // ตั้งค่าคอลัมน์รายงาน
  'https://your-hr-system/record-type',        // Record Type
  'https://your-hr-system/employee-template',  // Employee Template
];
```

หลังแก้แล้วให้กด **Reload** ที่หน้า `chrome://extensions/` เพื่อโหลด Extension ใหม่

---

## Files

```
customreport/
├── manifest.json   — Extension config (Manifest V3)
├── popup.html      — UI
├── popup.js        — Logic ทั้งหมด
├── style.css       — Dark mode styles
└── README.md       — คู่มือนี้
```
