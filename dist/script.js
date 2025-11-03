// script.js — Modular app logic (local chatbot + automations)
// Uses: PapaParse, Chart.js, jsPDF (loaded via index.html CDNs)

import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";

// --- App state ---
const state = {
  files: [], // {id,name,headers:[],rows:[]}
  activeId: null,
  page: 0,
  perPage: 25,
  history: [],
  future: []
};

const uid = (n = 6) =>
  Math.random()
    .toString(36)
    .slice(2, 2 + n);

// --- Element refs ---
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const filesList = document.getElementById("filesList");
const activeFileName = document.getElementById("activeFileName");
const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");
const tableStats = document.getElementById("tableStats");
const columnsPanel = document.getElementById("columnsPanel");
const chartColumnSelect = document.getElementById("chartColumnSelect");
const miniChartCanvas = document.getElementById("miniChart").getContext("2d");
let miniChartInst = null;
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// Buttons
const addRowBtn = document.getElementById("addRowBtn");
const addColBtn = document.getElementById("addColBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const autoCleanBtn = document.getElementById("autoCleanBtn");
const vlookupBtn = document.getElementById("vlookupBtn");
const compareBtn = document.getElementById("compareBtn");
const exportWorkspaceBtn = document.getElementById("exportWorkspaceBtn");
const clearWorkspaceBtn = document.getElementById("clearWorkspaceBtn");
const exportChatPdfBtn = document.getElementById("exportChatPdfBtn");
const exportSummaryPdfBtn = document.getElementById("exportSummaryPdfBtn");

// Chat suggestions
document
  .querySelectorAll(".chatPrompt")
  .forEach((b) =>
    b.addEventListener("click", (e) =>
      chatSendQuery(e.target.textContent.trim())
    )
  );

// --- Persistence ---
const STORAGE_KEY = "ssd_mod_v1";
function saveLocal() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ files: state.files, activeId: state.activeId })
  );
}
function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const p = JSON.parse(raw);
    state.files = p.files || [];
    state.activeId =
      p.activeId || (state.files[0] && state.files[0].id) || null;
  } catch (e) {
    console.warn("load failed", e);
  }
}

// --- File upload / parse ---
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drop-drag");
});
dropZone.addEventListener("dragleave", () =>
  dropZone.classList.remove("drop-drag")
);
dropZone.addEventListener("drop", async (e) => {
  e.preventDefault();
  dropZone.classList.remove("drop-drag");
  await handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener("change", async (e) => {
  await handleFiles(e.target.files);
  fileInput.value = "";
});

async function handleFiles(list) {
  for (const f of Array.from(list)) {
    try {
      const parsed = await parseFile(f);
      const id = uid(8);
      state.files.push({
        id,
        name: f.name || parsed.name,
        headers: parsed.headers,
        rows: parsed.rows
      });
      state.activeId = id;
      pushHistory();
      renderAll();
      saveLocal();
    } catch (err) {
      alert(
        "Failed to parse " + (f.name || "file") + ": " + (err.message || err)
      );
    }
  }
}

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const name = file.name || "file-" + uid(4);
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "json") {
      const r = new FileReader();
      r.onload = (e) => {
        try {
          const arr = JSON.parse(e.target.result);
          if (!Array.isArray(arr))
            throw new Error("JSON must be an array of objects");
          const headers = Array.from(
            new Set(arr.flatMap((o) => Object.keys(o)))
          );
          resolve({
            name,
            headers,
            rows: arr.map((r) => normalizeRow(r, headers))
          });
        } catch (err) {
          reject(err);
        }
      };
      r.onerror = reject;
      r.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          const rows = results.data;
          const headers =
            results.meta.fields ||
            Array.from(new Set(rows.flatMap(Object.keys)));
          resolve({
            name,
            headers,
            rows: rows.map((r) => normalizeRow(r, headers))
          });
        },
        error: reject
      });
    }
  });
}

function normalizeRow(rawRow, headers) {
  const row = {};
  headers.forEach(
    (h) => (row[h] = rawRow && rawRow[h] !== undefined ? rawRow[h] : "")
  );
  return row;
}

// --- Rendering helpers ---
function getActive() {
  return state.files.find((f) => f.id === state.activeId) || null;
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function renderFilesList() {
  filesList.innerHTML = "";
  state.files.forEach((f) => {
    const el = document.createElement("div");
    el.className = "flex items-center justify-between p-2 border rounded";
    el.innerHTML = `<div class="flex items-center gap-2">
      <input type="radio" name="activeFile" data-id="${f.id}" ${
      f.id === state.activeId ? "checked" : ""
    }/>
      <div><div class="font-medium text-sm">${escapeHtml(
        f.name
      )}</div><div class="text-xs text-slate-500">${f.rows.length} rows • ${
      f.headers.length
    } cols</div></div>
    </div>
    <div class="flex gap-2"><button data-id="${
      f.id
    }" class="downloadBtn text-xs px-2 py-1 border rounded">Download</button><button data-id="${
      f.id
    }" class="deleteBtn text-xs px-2 py-1 border rounded">Delete</button></div>`;
    filesList.appendChild(el);
  });

  filesList.querySelectorAll("input[name=activeFile]").forEach((r) =>
    r.addEventListener("change", (e) => {
      state.activeId = e.target.dataset.id;
      pushHistory();
      renderAll();
      saveLocal();
    })
  );
  filesList.querySelectorAll(".deleteBtn").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      if (!confirm("Delete file?")) return;
      const idx = state.files.findIndex((x) => x.id === id);
      if (idx >= 0) {
        state.files.splice(idx, 1);
        if (state.activeId === id) state.activeId = state.files[0]?.id || null;
        pushHistory();
        renderAll();
        saveLocal();
      }
    })
  );
  filesList.querySelectorAll(".downloadBtn").forEach((b) =>
    b.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const f = state.files.find((x) => x.id === id);
      if (!f) return;
      const rows = [f.headers.join(",")].concat(
        f.rows.map((r) =>
          f.headers.map((h) => csvEscape(String(r[h] ?? ""))).join(",")
        )
      );
      downloadBlob(
        new Blob([rows.join("\n")], { type: "text/csv" }),
        f.name.replace(/\.[^/.]+$/, "") + ".csv"
      );
    })
  );
}

function renderTable() {
  const f = getActive();
  if (!f) {
    activeFileName.textContent = "— none —";
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    tableStats.textContent = "0 rows • 0 cols";
    columnsPanel.innerHTML = "";
    chartColumnSelect.innerHTML =
      '<option value="">Select numeric column</option>';
    return;
  }
  activeFileName.textContent = f.name;

  // pagination
  const start = state.page * state.perPage;
  const paged = f.rows.slice(start, start + state.perPage);

  // header
  tableHead.innerHTML = "";
  const trh = document.createElement("tr");
  trh.innerHTML =
    `<th class="p-2"><input id="selectAll" type="checkbox" /></th>` +
    f.headers
      .map(
        (h) =>
          `<th class="p-2 text-left">${escapeHtml(
            h
          )} <button data-col="${escapeAttr(
            h
          )}" class="rename-col text-xs px-1 py-0.5 border rounded ml-2">Rename</button> <button data-col="${escapeAttr(
            h
          )}" class="del-col text-xs px-1 py-0.5 border rounded ml-1">Del</button></th>`
      )
      .join("");
  tableHead.appendChild(trh);

  // body
  tableBody.innerHTML = "";
  paged.forEach((row, idx) => {
    const gIdx = start + idx;
    const tr = document.createElement("tr");
    tr.className = "border-t";
    let cells = `<td class="p-2"><input type="checkbox" class="rowSel" data-idx="${gIdx}" /></td>`;
    f.headers.forEach((h) => {
      const val = row[h] ?? "";
      cells += `<td class="p-2 align-top"><div contenteditable="true" data-idx="${gIdx}" data-col="${escapeAttr(
        h
      )}">${escapeHtml(String(val))}</div></td>`;
    });
    tr.innerHTML = cells;
    tableBody.appendChild(tr);
  });

  // wire cells
  tableBody.querySelectorAll("[contenteditable=true]").forEach((el) => {
    el.addEventListener("blur", (e) => {
      const idx = Number(e.target.dataset.idx),
        col = e.target.dataset.col;
      const file = getActive();
      if (!file) return;
      file.rows[idx][col] = e.target.textContent.trim();
      pushHistory();
      renderColumnsPanel();
      saveLocal();
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
    });
  });

  document.getElementById("selectAll").addEventListener("change", (e) => {
    tableBody
      .querySelectorAll(".rowSel")
      .forEach((cb) => (cb.checked = e.target.checked));
  });

  // rename / delete
  tableHead
    .querySelectorAll(".rename-col")
    .forEach((b) =>
      b.addEventListener("click", (e) =>
        promptRenameColumn(e.target.dataset.col)
      )
    );
  tableHead.querySelectorAll(".del-col").forEach((b) =>
    b.addEventListener("click", (e) => {
      if (confirm("Delete column " + e.target.dataset.col + "?"))
        deleteColumn(e.target.dataset.col);
    })
  );

  tableStats.textContent = `${f.rows.length} rows • ${f.headers.length} cols (showing ${paged.length})`;

  renderColumnsPanel();
  populateChartColumns();
}

function renderColumnsPanel() {
  const f = getActive();
  columnsPanel.innerHTML = "";
  if (!f) return;
  f.headers.forEach((h) => {
    const el = document.createElement("div");
    el.className = "flex items-center justify-between p-2 border rounded";
    el.innerHTML = `<div class="text-sm">${escapeHtml(
      h
    )}</div><div class="flex gap-2"><button data-col="${escapeAttr(
      h
    )}" class="sampleBtn px-2 py-1 border rounded text-xs">Sample</button><button data-col="${escapeAttr(
      h
    )}" class="statsBtn px-2 py-1 border rounded text-xs">Stats</button></div>`;
    columnsPanel.appendChild(el);
  });
  columnsPanel
    .querySelectorAll(".sampleBtn")
    .forEach((b) =>
      b.addEventListener("click", (e) => showColumnSample(e.target.dataset.col))
    );
  columnsPanel
    .querySelectorAll(".statsBtn")
    .forEach((b) =>
      b.addEventListener("click", (e) => showColumnStats(e.target.dataset.col))
    );
}

function populateChartColumns() {
  const f = getActive();
  chartColumnSelect.innerHTML =
    '<option value="">Select numeric column</option>';
  if (!f) return;
  const numericCandidates = f.headers.filter((h) =>
    f.rows.some((r) => !isNaN(parseFloat(r[h])) && r[h] !== "")
  );
  numericCandidates.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h;
    chartColumnSelect.appendChild(opt);
  });
}

// --- Chart mini render ---
function renderMiniChart(col) {
  const f = getActive();
  if (!f || !col) return;
  const counts = {};
  f.rows.forEach((r) => {
    const k = r[col] ?? "";
    counts[k] =
      (counts[k] || 0) + (isNaN(parseFloat(r[col])) ? 1 : parseFloat(r[col]));
  });
  const labels = Object.keys(counts).slice(0, 40);
  const data = labels.map((k) => counts[k]);
  if (miniChartInst) miniChartInst.destroy();
  miniChartInst = new Chart(miniChartCanvas, {
    type: "bar",
    data: { labels, datasets: [{ label: col, data }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// --- CRUD helpers ---
function addRow() {
  const f = getActive();
  if (!f) return alert("No active file");
  const row = {};
  f.headers.forEach((h) => (row[h] = ""));
  f.rows.push(row);
  pushHistory();
  renderAll();
  saveLocal();
}
function addColumn() {
  const f = getActive();
  if (!f) return alert("No active file");
  const name = prompt("Column name", "new_col");
  if (!name) return;
  if (f.headers.includes(name)) {
    alert("Column exists");
    return;
  }
  f.headers.push(name);
  f.rows.forEach((r) => (r[name] = ""));
  pushHistory();
  renderAll();
  saveLocal();
}
function deleteSelectedRows() {
  const f = getActive();
  if (!f) return;
  const sel = Array.from(document.querySelectorAll(".rowSel"))
    .filter((cb) => cb.checked)
    .map((cb) => Number(cb.dataset.idx));
  if (!sel.length) return alert("No rows selected");
  sel.sort((a, b) => b - a).forEach((i) => f.rows.splice(i, 1));
  pushHistory();
  renderAll();
  saveLocal();
}
function deleteColumn(col) {
  const f = getActive();
  if (!f) return;
  const idx = f.headers.indexOf(col);
  if (idx < 0) return;
  f.headers.splice(idx, 1);
  f.rows.forEach((r) => delete r[col]);
  pushHistory();
  renderAll();
  saveLocal();
}
function promptRenameColumn(oldName) {
  const newName = prompt("Rename column", oldName);
  if (!newName || newName.trim() === "") return;
  const f = getActive();
  if (!f) return;
  if (f.headers.includes(newName) && newName !== oldName) {
    alert("Column exists");
    return;
  }
  f.headers = f.headers.map((h) => (h === oldName ? newName : h));
  f.rows.forEach((r) => {
    r[newName] = r[oldName];
    delete r[oldName];
  });
  pushHistory();
  renderAll();
  saveLocal();
}

// --- Utilities ---
function csvEscape(v) {
  if (v == null) v = "";
  v = String(v);
  if (v.includes(",") || v.includes('"') || v.includes("\n"))
    return `"${v.replace(/"/g, '""')}"`;
  return v;
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Auto-cleaning / formatting ---
function autoCleanAllFiles() {
  state.files.forEach((f) => {
    f.rows.forEach((r) => {
      f.headers.forEach((h) => {
        let v = r[h];
        if (typeof v === "string") v = v.trim();
        // currency
        if (typeof v === "string" && /^\$?\s*\d[\d,]*\.?\d*$/.test(v)) {
          r[h] = parseFloat(String(v).replace(/[^0-9.-]+/g, ""));
          return;
        }
        // date detection
        const iso = parseDate(safeString(v));
        if (iso) {
          r[h] = new Date(iso).toISOString().slice(0, 10);
          return;
        }
        r[h] = v;
      });
    });
  });
  pushHistory();
  renderAll();
  saveLocal();
  alert(
    "Auto-clean applied (currency parsed; dates normalized where recognized)."
  );
}
function safeString(x) {
  return x == null ? "" : String(x);
}
function parseDate(s) {
  if (!s) return null;
  const d = Date.parse(s);
  if (!isNaN(d)) return new Date(d).toISOString();
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const mm = Number(m[1]) - 1;
    const dd = Number(m[2]);
    let yy = Number(m[3]);
    if (m[3].length === 2) yy += yy > 50 ? 1900 : 2000;
    return new Date(yy, mm, dd).toISOString();
  }
  return null;
}

// --- VLOOKUP / Merge ---
function openVlookupModal() {
  if (state.files.length < 2) return alert("Need at least two files");
  const html = `
    <div class="space-y-3">
      <h3 class="font-semibold">VLOOKUP / Merge</h3>
      <label>Base file</label>
      <select id="v_base" class="w-full border rounded p-2">${state.files
        .map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`)
        .join("")}</select>
      <label>Lookup file</label>
      <select id="v_lookup" class="w-full border rounded p-2">${state.files
        .map((f) => `<option value="${f.id}">${escapeHtml(f.name)}</option>`)
        .join("")}</select>
      <div class="grid grid-cols-2 gap-2">
        <div><label>Base key</label><select id="v_base_key" class="w-full border rounded p-2"></select></div>
        <div><label>Lookup key</label><select id="v_lookup_key" class="w-full border rounded p-2"></select></div>
      </div>
      <label>Columns to bring in (lookup file)</label>
      <div id="v_cols" class="max-h-48 overflow-auto border rounded p-2"></div>
      <div class="text-right"><button id="v_cancel" class="px-3 py-1 border rounded">Cancel</button><button id="v_run" class="px-3 py-1 bg-indigo-600 text-white rounded">Run Merge</button></div>
    </div>`;
  const modal = openModal(html);
  const v_base = modal.querySelector("#v_base"),
    v_lookup = modal.querySelector("#v_lookup");
  const v_base_key = modal.querySelector("#v_base_key"),
    v_lookup_key = modal.querySelector("#v_lookup_key");
  const v_cols = modal.querySelector("#v_cols"),
    v_cancel = modal.querySelector("#v_cancel"),
    v_run = modal.querySelector("#v_run");

  function populate() {
    const base = state.files.find((x) => x.id === v_base.value);
    const look = state.files.find((x) => x.id === v_lookup.value);
    v_base_key.innerHTML = base.headers
      .map((h) => `<option value="${escapeAttr(h)}">${escapeHtml(h)}</option>`)
      .join("");
    v_lookup_key.innerHTML = look.headers
      .map((h) => `<option value="${escapeAttr(h)}">${escapeHtml(h)}</option>`)
      .join("");
    v_cols.innerHTML = look.headers
      .map(
        (h) =>
          `<label class="block text-xs"><input type="checkbox" value="${escapeAttr(
            h
          )}" checked /> ${escapeHtml(h)}</label>`
      )
      .join("");
  }
  populate();
  v_base.addEventListener("change", populate);
  v_lookup.addEventListener("change", populate);
  v_cancel.addEventListener("click", closeModal);
  v_run.addEventListener("click", () => {
    const base = state.files.find((x) => x.id === v_base.value),
      look = state.files.find((x) => x.id === v_lookup.value);
    const baseKey = v_base_key.value,
      lookKey = v_lookup_key.value;
    const cols = Array.from(
      v_cols.querySelectorAll("input[type=checkbox]:checked")
    ).map((i) => i.value);
    if (!base || !look || !baseKey || !lookKey || !cols.length)
      return alert("Choose files, keys, and columns");
    const map = {};
    look.rows.forEach((r) => {
      const k = String(r[lookKey] ?? "").trim();
      if (k !== "") map[k] = r;
    });
    cols.forEach((c) => {
      if (!base.headers.includes(c)) base.headers.push(c);
    });
    base.rows.forEach((r) => {
      const k = String(r[baseKey] ?? "").trim();
      const found = map[k];
      cols.forEach((c) => (r[c] = found ? found[c] ?? "" : r[c] ?? ""));
    });
    pushHistory();
    renderAll();
    saveLocal();
    closeModal();
    alert("Merge complete");
  });
}

// --- Compare headers ---
function compareHeaders() {
  if (state.files.length < 2) return alert("Upload at least two files");
  const pairs = [];
  for (let i = 0; i < state.files.length; i++) {
    for (let j = i + 1; j < state.files.length; j++) {
      const a = state.files[i],
        b = state.files[j];
      const onlyA = a.headers.filter((h) => !b.headers.includes(h));
      const onlyB = b.headers.filter((h) => !a.headers.includes(h));
      const both = a.headers.filter((h) => b.headers.includes(h));
      pairs.push({ a: a.name, b: b.name, onlyA, onlyB, both });
    }
  }
  const html = pairs
    .map(
      (p) =>
        `<div class="mb-2 border-b pb-2"><div class="font-medium">${escapeHtml(
          p.a
        )} ⇄ ${escapeHtml(
          p.b
        )}</div><div class="text-xs text-slate-600">Shared: ${
          p.both.length
        } • Only ${escapeHtml(p.a)}: ${p.onlyA.length} • Only ${escapeHtml(
          p.b
        )}: ${p.onlyB.length}</div></div>`
    )
    .join("");
  openModal(
    `<div><h3 class="font-semibold">Header Comparison</h3><div class="max-h-64 overflow-auto mt-2">${html}</div><div class="text-right mt-2"><button id="closeCmp" class="px-3 py-1 border rounded">Close</button></div></div>`
  );
  document.getElementById("closeCmp").addEventListener("click", closeModal);
}

// --- Column sample / stats UI ---
function showColumnSample(col) {
  const f = getActive();
  if (!f) return;
  const samples = f.rows
    .slice(0, 50)
    .map((r) => r[col])
    .slice(0, 30);
  openModal(
    `<div><h3 class="font-semibold">Sample: ${escapeHtml(
      col
    )}</h3><div class="max-h-48 overflow-auto p-2 border rounded text-xs">${samples
      .map((s) => escapeHtml(String(s)))
      .join(
        "<br/>"
      )}</div><div class="text-right mt-2"><button id="closeS" class="px-3 py-1 border rounded">Close</button></div></div>`
  );
  document.getElementById("closeS").addEventListener("click", closeModal);
}

function showColumnStats(col) {
  const f = getActive();
  if (!f) return;
  const vals = f.rows
    .map((r) => {
      const n = parseFloat(String(r[col]).replace(/[^0-9.-]+/g, ""));
      return isNaN(n) ? null : n;
    })
    .filter((x) => x !== null);
  if (!vals.length) return alert("No numeric values");
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  openModal(
    `<div><h3 class="font-semibold">Stats: ${escapeHtml(col)}</h3><div>Count: ${
      vals.length
    }</div><div>Sum: ${sum}</div><div>Avg: ${avg}</div><div>Min: ${min}</div><div>Max: ${max}</div><div class="text-right mt-2"><button id="closeSt" class="px-3 py-1 border rounded">Close</button></div></div>`
  );
  document.getElementById("closeSt").addEventListener("click", closeModal);
}

// --- Chatbot (local rule-based, powerful commands) ---
function appendChat(text, who = "user") {
  const div = document.createElement("div");
  div.className = "mb-2";
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + (who === "user" ? "user" : "bot");
  bubble.textContent = text;
  div.appendChild(bubble);
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function chatSendQuery(q) {
  if (!q) return;
  appendChat(q, "user");
  chatInput.value = "";
  setTimeout(() => processQuery(q), 250);
}

chatSend.addEventListener("click", () => chatSendQuery(chatInput.value.trim()));
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    chatSend.click();
  }
});

// Main NL parsing for common intents
function processQuery(q) {
  const text = q.toLowerCase().trim();
  const f = getActive();
  if (!f) {
    appendChat("Please upload and select a file first.", "bot");
    return;
  }

  // Basic intents
  if (/how many rows|row count|number of rows/.test(text)) {
    appendChat(`There are ${f.rows.length} rows in "${f.name}".`, "bot");
    return;
  }
  if (/columns|headers|list columns|what columns/.test(text)) {
    appendChat(`Columns: ${f.headers.join(", ")}`, "bot");
    return;
  }

  // unique values
  if (/unique (values )?in (column )?(.*)/.test(text)) {
    const m = text.match(/unique (?:values )?in (?:column )?(.*)/);
    const col = trimQuotes(m[1].trim());
    if (!f.headers.includes(col)) {
      appendChat(`Column "${col}" not found.`, "bot");
      return;
    }
    const set = new Set(f.rows.map((r) => String(r[col] ?? "")));
    appendChat(
      `Unique in ${col} (${set.size}): ${Array.from(set)
        .slice(0, 30)
        .join(", ")}`,
      "bot"
    );
    return;
  }

  // aggregations: sum/total
  const aggMatch =
    text.match(
      /(?:sum|total|aggregate) (?:of )?([a-z0-9 _-]+?)(?: by (.+))?$/
    ) || text.match(/(?:what is the )?(?:sum|total) of (.+?)(?: by (.+))?$/);
  if (aggMatch) {
    const col = trimQuotes((aggMatch[1] || "").trim());
    const groupBy = aggMatch[2] ? trimQuotes(aggMatch[2].trim()) : null;
    if (!f.headers.includes(col)) {
      appendChat(`Column "${col}" not found.`, "bot");
      return;
    }
    if (groupBy && !f.headers.includes(groupBy)) {
      appendChat(`Group-by column "${groupBy}" not found.`, "bot");
      return;
    }
    if (groupBy) {
      const grouped = groupByAgg(f.rows, groupBy, col, "sum");
      appendChat(
        `Sum of ${col} by ${groupBy}:\n` +
          Object.entries(grouped)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n"),
        "bot"
      );
      openResultChart(
        Object.keys(grouped),
        Object.values(grouped),
        `Sum ${col} by ${groupBy}`
      );
    } else {
      const total = f.rows.reduce((s, r) => {
        const n = parseFloat(r[col]);
        return s + (isNaN(n) ? 0 : n);
      }, 0);
      appendChat(`Total ${col}: ${total}`, "bot");
    }
    return;
  }

  // average
  const avgMatch = text.match(/average (?:of )?([a-z0-9 _-]+?)(?: by (.+))?$/);
  if (avgMatch) {
    const col = trimQuotes((avgMatch[1] || "").trim());
    const groupBy = avgMatch[2] ? trimQuotes(avgMatch[2].trim()) : null;
    if (!f.headers.includes(col)) {
      appendChat(`Column "${col}" not found.`, "bot");
      return;
    }
    if (groupBy && !f.headers.includes(groupBy)) {
      appendChat(`Group-by column "${groupBy}" not found.`, "bot");
      return;
    }
    if (groupBy) {
      const grouped = groupByAgg(f.rows, groupBy, col, "avg");
      appendChat(
        `Average ${col} by ${groupBy}:\n` +
          Object.entries(grouped)
            .map(([k, v]) => `${k}: ${Number(v).toFixed(2)}`)
            .join("\n"),
        "bot"
      );
      openResultChart(
        Object.keys(grouped),
        Object.values(grouped),
        `Avg ${col} by ${groupBy}`
      );
    } else {
      const nums = f.rows
        .map((r) => parseFloat(r[col]))
        .filter((n) => !isNaN(n));
      if (!nums.length)
        return appendChat("No numeric values found in that column.", "bot");
      const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
      appendChat(`Average ${col}: ${avg}`, "bot");
    }
    return;
  }

  // top N pattern
  let topMatch =
    text.match(/top (\d+) (.+?) by (.+)/) || text.match(/top (\d+) (.+)/);
  if (topMatch) {
    const n = Number(topMatch[1]);
    let what = (topMatch[2] || "").trim();
    let by = topMatch[3] ? topMatch[3].trim() : null;
    if (!by && / by /.test(text)) {
      const parts = text.split(" by ");
      what = parts[0].replace(/^top \d+ /i, "").trim();
      by = parts[1].trim();
    }
    if (by) {
      const groupCol = what;
      const valCol = by;
      if (!f.headers.includes(groupCol) || !f.headers.includes(valCol)) {
        appendChat("Columns not found for top query", "bot");
        return;
      }
      const grouped = groupByAgg(f.rows, groupCol, valCol, "sum");
      const arr = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n);
      appendChat(
        `Top ${n} ${groupCol} by ${valCol}:\n` +
          arr.map((a) => `${a[0]}: ${a[1]}`).join("\n"),
        "bot"
      );
      openResultChart(
        arr.map((a) => a[0]),
        arr.map((a) => a[1]),
        `Top ${n} ${groupCol} by ${valCol}`
      );
      return;
    } else {
      appendChat(
        "Couldn't parse top request. Try 'Top 5 products by revenue'.",
        "bot"
      );
      return;
    }
  }

  // plot / chart requests
  if (/plot|chart|show.*over time|graph/.test(text)) {
    const dateCol = f.headers.find((h) => /date|time|month|day|order/i.test(h));
    const valueCol =
      f.headers.find((h) =>
        /sales|amount|price|revenue|total|qty|quantity|count/i.test(h)
      ) || f.headers[1];
    if (!dateCol || !valueCol)
      return appendChat(
        'Could not auto-detect date/time and numeric column to plot. Try "Plot sales over time" and ensure column names.',
        "bot"
      );
    const series = aggregateTimeSeries(f.rows, dateCol, valueCol);
    if (Object.keys(series).length === 0)
      return appendChat("No parsable dates found for time series.", "bot");
    appendChat(`Plotting ${valueCol} over time (by month).`, "bot");
    openResultChart(
      Object.keys(series),
      Object.values(series),
      `${valueCol} over time`
    );
    return;
  }

  // compare columns across files: "compare column X between file A and file B"
  const cmp = text.match(/compare (?:column )?(.+?) between (.+?) and (.+)/);
  if (cmp) {
    const col = trimQuotes(cmp[1].trim()),
      nameA = cmp[2].trim(),
      nameB = cmp[3].trim();
    const fileA = state.files.find(
      (ff) =>
        ff.name.toLowerCase().includes(nameA.toLowerCase()) || ff.id === nameA
    );
    const fileB = state.files.find(
      (ff) =>
        ff.name.toLowerCase().includes(nameB.toLowerCase()) || ff.id === nameB
    );
    if (!fileA || !fileB)
      return appendChat("Could not find both files by those names.", "bot");
    if (!fileA.headers.includes(col) || !fileB.headers.includes(col))
      return appendChat("Column not present in both files.", "bot");
    const countsA = frequencyMap(fileA.rows.map((r) => String(r[col] ?? ""))),
      countsB = frequencyMap(fileB.rows.map((r) => String(r[col] ?? "")));
    appendChat(
      `Comparison of ${col}:\nFile "${fileA.name}": ${
        Object.keys(countsA).length
      } distinct.\nFile "${fileB.name}": ${
        Object.keys(countsB).length
      } distinct.`,
      "bot"
    );
    return;
  }

  // summary
  if (/summary|summarize|overview/.test(text)) {
    appendChat(summarize(getActive()), "bot");
    return;
  }

  // fallback tries simple "total X by Y"
  const bymatch = text.match(/(?:total|sum|aggregate) (.+?) by (.+)/);
  if (bymatch) {
    const col = trimQuotes(bymatch[1].trim()),
      group = trimQuotes(bymatch[2].trim());
    if (!f.headers.includes(col) || !f.headers.includes(group))
      return appendChat("Columns not found for that query.", "bot");
    const g = groupByAgg(f.rows, group, col, "sum");
    appendChat(
      "Result:\n" +
        Object.entries(g)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n"),
      "bot"
    );
    openResultChart(Object.keys(g), Object.values(g), `Sum ${col} by ${group}`);
    return;
  }

  appendChat(
    "I couldn't parse that. Try: 'How many rows?', 'Total sales by region', 'Average price by category', 'Plot sales over time', or 'Summarize data'.",
    "bot"
  );
}

function trimQuotes(s) {
  return s.replace(/^["']|["']$/g, "").trim();
}
function groupByAgg(rows, groupCol, valueCol, op = "sum") {
  const map = {},
    counts = {};
  rows.forEach((r) => {
    const g = String(r[groupCol] ?? "").trim();
    const v = parseFloat(r[valueCol]);
    if (isNaN(v)) return;
    map[g] = (map[g] || 0) + v;
    counts[g] = (counts[g] || 0) + 1;
  });
  if (op === "avg")
    Object.keys(map).forEach((k) => (map[k] = map[k] / counts[k]));
  return map;
}
function aggregateTimeSeries(rows, dateCol, valueCol) {
  const map = {};
  rows.forEach((r) => {
    const d =
      parseDate(r[dateCol]) ||
      (Date.parse(r[dateCol]) ? new Date(r[dateCol]).toISOString() : null);
    if (!d) return;
    const m = new Date(d).toISOString().slice(0, 7);
    const v = parseFloat(r[valueCol]);
    if (isNaN(v)) return;
    map[m] = (map[m] || 0) + v;
  });
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  );
}
function frequencyMap(arr) {
  const m = {};
  arr.forEach((x) => (m[x] = (m[x] || 0) + 1));
  return m;
}
function summarize(f) {
  const cols = f.headers;
  const rows = f.rows;
  const numeric = cols.filter((c) =>
    rows.some((r) => !isNaN(parseFloat(r[c])))
  );
  const out = [
    `Summary for ${f.name}`,
    `Rows: ${rows.length}`,
    `Columns: ${cols.join(", ")}`,
    `Numeric columns: ${numeric.join(", ")}`
  ];
  numeric.forEach((c) => {
    const vals = rows.map((r) => parseFloat(r[c])).filter((n) => !isNaN(n));
    if (!vals.length) return;
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    out.push(
      `${c} — count:${vals.length} sum:${sum.toFixed(2)} avg:${avg.toFixed(
        2
      )} min:${min} max:${max}`
    );
  });
  return out.join("\n");
}
function openResultChart(labels, data, title = "Chart") {
  const id = "modalChart_" + uid(4);
  const html = `<div><h3 class="font-semibold mb-2">${escapeHtml(
    title
  )}</h3><canvas id="${id}" height="220"></canvas><div class="text-right mt-3"><button id="closeChart" class="px-3 py-1 border rounded">Close</button></div></div>`;
  const modal = openModal(html);
  const ctx = modal.querySelector("#" + id).getContext("2d");
  const c = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: title, data }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
  modal.querySelector("#closeChart").addEventListener("click", () => {
    c.destroy();
    closeModal();
  });
}

// --- Export chat & summary to PDF ---
function exportChatPdf() {
  const doc = new jsPDF();
  const lines = Array.from(chatBox.querySelectorAll(".chat-bubble")).map(
    (b) => b.textContent
  );
  let y = 10;
  doc.setFontSize(11);
  lines.forEach((line) => {
    const wrap = doc.splitTextToSize(line, 180);
    doc.text(wrap, 10, y);
    y += wrap.length * 7;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save("chat.pdf");
}
function exportSummaryPdf() {
  const f = getActive();
  if (!f) return alert("No active file");
  const doc = new jsPDF();
  const lines = summarize(f).split("\n");
  let y = 10;
  doc.setFontSize(11);
  lines.forEach((line) => {
    const wrap = doc.splitTextToSize(line, 180);
    doc.text(wrap, 10, y);
    y += wrap.length * 7;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save(`${f.name.replace(/\.[^/.]+$/, "")}_summary.pdf`);
}

// --- Modal helpers ---
function openModal(html) {
  const root = document.getElementById("modalRoot");
  root.innerHTML = "";
  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40";
  const inner = document.createElement("div");
  inner.className = "bg-white p-4 rounded max-w-2xl w-full";
  inner.innerHTML = html;
  overlay.appendChild(inner);
  root.appendChild(overlay);
  return inner;
}
function closeModal() {
  document.getElementById("modalRoot").innerHTML = "";
}

// --- History (undo/redo minimal) ---
function pushHistory() {
  try {
    const snap = JSON.stringify({ files: state.files });
    state.history.push(snap);
    if (state.history.length > 50) state.history.shift();
    state.future = [];
  } catch (e) {}
}

// --- Misc helpers for UI ---
function showColumnSample(col) {
  const f = getActive();
  if (!f) return;
  const s = f.rows
    .slice(0, 50)
    .map((r) => r[col])
    .slice(0, 30);
  openModal(
    `<div><h3 class="font-semibold">Sample: ${escapeHtml(
      col
    )}</h3><div class="max-h-48 overflow-auto p-2 border rounded text-xs">${s
      .map((x) => escapeHtml(String(x)))
      .join(
        "<br/>"
      )}</div><div class="text-right mt-2"><button id="closeS" class="px-3 py-1 border rounded">Close</button></div></div>`
  );
  document.getElementById("closeS").addEventListener("click", closeModal);
}
function showColumnStats(col) {
  showColumnStats;
} // already implemented above as showColumnStats (kept for compatibility)

// --- Export / clear workspace ---
exportWorkspaceBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ files: state.files }, null, 2)], {
    type: "application/json"
  });
  downloadBlob(blob, "workspace.json");
});
clearWorkspaceBtn.addEventListener("click", () => {
  if (!confirm("Clear workspace?")) return;
  state.files = [];
  state.activeId = null;
  saveLocal();
  renderAll();
});

// --- Small helpers & binding ---
function csvEscape(v) {
  if (v == null) v = "";
  v = String(v);
  if (v.includes(",") || v.includes('"') || v.includes("\n"))
    return `"${v.replace(/"/g, '""')}"`;
  return v;
}
function downloadBlobFn(blob, name) {
  downloadBlob(blob, name);
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- small wrappers to link UI buttons to functions ---
addRowBtn.addEventListener("click", addRow);
addColBtn.addEventListener("click", addColumn);
deleteSelectedBtn.addEventListener("click", deleteSelectedRows);
exportCsvBtn.addEventListener("click", () => {
  const f = getActive();
  if (!f) return alert("No active file");
  const rows = [f.headers.join(",")].concat(
    f.rows.map((r) => f.headers.map((h) => csvEscape(r[h])).join(","))
  );
  downloadBlob(
    new Blob([rows.join("\n")], { type: "text/csv" }),
    f.name.replace(/\.[^/.]+$/, "") + ".csv"
  );
});
autoCleanBtn.addEventListener("click", autoCleanAllFiles);
vlookupBtn.addEventListener("click", openVlookupModal);
compareBtn.addEventListener("click", compareHeaders);
exportChatPdfBtn.addEventListener("click", exportChatPdf);
exportSummaryPdfBtn.addEventListener("click", exportSummaryPdf);

// Chart select
chartColumnSelect.addEventListener("change", () => {
  renderMiniChart(chartColumnSelect.value);
});

// --- Init: load, demo if empty, render ---
loadLocal();
if (!state.files.length) {
  // small demo dataset
  const demo = {
    id: uid(6),
    name: "demo_sales.csv",
    headers: ["order_date", "region", "product", "units", "price", "revenue"],
    rows: [
      {
        order_date: "2024-01-05",
        region: "West",
        product: "A",
        units: "10",
        price: "12.5",
        revenue: "125"
      },
      {
        order_date: "2024-02-14",
        region: "East",
        product: "B",
        units: "4",
        price: "20",
        revenue: "80"
      },
      {
        order_date: "2024-03-03",
        region: "West",
        product: "A",
        units: "7",
        price: "12.5",
        revenue: "87.5"
      }
    ]
  };
  state.files.push(demo);
  state.activeId = demo.id;
  pushHistory();
  saveLocal();
}
renderAll();

// --- Top-level renderAll ---
function renderAll() {
  renderFilesList();
  renderTable();
  saveLocal();
}

// --- Helper placeholders used earlier (avoids duplication) ---
function showColumnStats(col) {
  const f = getActive();
  if (!f) return;
  const vals = f.rows
    .map((r) => {
      const n = parseFloat(String(r[col]).replace(/[^0-9.-]+/g, ""));
      return isNaN(n) ? null : n;
    })
    .filter((x) => x !== null);
  if (!vals.length) return alert("No numeric values");
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  openModal(
    `<div><h3 class="font-semibold">Stats: ${escapeHtml(col)}</h3><div>Count: ${
      vals.length
    }</div><div>Sum: ${sum}</div><div>Avg: ${avg}</div><div>Min: ${min}</div><div>Max: ${max}</div><div class="text-right mt-2"><button id="closeSt" class="px-3 py-1 border rounded">Close</button></div></div>`
  );
  document.getElementById("closeSt").addEventListener("click", closeModal);
}