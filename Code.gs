// ============================================================
//  LEADS MEETING — Google Apps Script Backend (v2)
//  All operations use GET requests to avoid CORS issues.
//  Paste this entire file into Apps Script, then redeploy.
// ============================================================

const SHEET_NAME = "Submissions";

// Everything goes through doGet — action is a URL parameter
function doGet(e) {
  try {
    const action = e.parameter.action || "list";

    if (action === "list")   return jsonResponse(handleList(e),   e);
    if (action === "submit") return jsonResponse(handleSubmit(e), e);
    if (action === "delete") return jsonResponse(handleDelete(e), e);
    if (action === "jobs")   return jsonResponse(handleJobs(e),   e);

    return jsonResponse({ error: "Unknown action: " + action }, e);
  } catch (err) {
    return jsonResponse({ error: err.message }, e);
  }
}

// ── List submissions (all, or filtered by date) ─────────────
function handleList(e) {
  const dateFilter = e.parameter.date || "";

  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();

  const submissions = data.slice(1)
    .filter(function(row) {
      if (!row[5]) return false; // skip empty/header rows
      if (!dateFilter) return true; // no filter → return all
      // Normalize both sides to string for safe comparison
      var rowDate = (row[0] instanceof Date)
        ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(row[0]).trim();
      return rowDate === dateFilter.trim();
    })
    .map(function(row) {
      var rowDate = (row[0] instanceof Date)
        ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
        : String(row[0]).trim();
      return {
        date:        rowDate,
        project:     row[1],
        lead:        row[2],
        items:       safeParseJSON(row[3]),
        submittedAt: row[4],
        id:          row[5]
      };
    });

  return { submissions };
}

// ── Submit / update a project entry ─────────────────────────
function handleSubmit(e) {
  const date    = e.parameter.date;
  const project = e.parameter.project;
  const lead    = e.parameter.lead;
  const items   = safeParseJSON(e.parameter.items || "[]");

  if (!date || !project || !lead) {
    return { error: "Missing required fields: date, project, lead" };
  }

  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();

  // Update existing row if same date + project + lead
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === date && data[i][1] === project && data[i][2] === lead) {
      sheet.getRange(i + 1, 4).setValue(JSON.stringify(items));
      sheet.getRange(i + 1, 5).setValue(new Date().toISOString());
      return { status: "updated", id: data[i][5] };
    }
  }

  // New row
  const id = Utilities.getUuid();
  sheet.appendRow([date, project, lead, JSON.stringify(items), new Date().toISOString(), id]);
  return { status: "created", id };
}

// ── Delete a submission by id ────────────────────────────────
function handleDelete(e) {
  const id = e.parameter.id;
  if (!id) return { error: "Missing id" };

  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === id) {
      sheet.deleteRow(i + 1);
      return { status: "deleted" };
    }
  }

  return { error: "Row not found" };
}

// ── Get job list from Jobs tab ──────────────────────────────
function handleJobs(e) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Jobs");
  if (!sheet) return { error: "No 'Jobs' tab found. Please create a sheet named 'Jobs' with Job Number in column A and Name in column B." };

  var data = sheet.getDataRange().getValues();
  var jobs = data
    .filter(function(row, i) {
      // Skip header row if first cell looks like a label
      if (i === 0 && isNaN(row[0]) && String(row[0]).toLowerCase().indexOf('job') !== -1) return false;
      return row[0] !== '' && row[0] !== null;
    })
    .map(function(row) {
      return { number: String(row[0]).trim(), name: String(row[1] || '').trim() };
    });

  return { jobs: jobs };
}

// ── Helpers ──────────────────────────────────────────────────
function getOrCreateSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["date", "project", "lead", "items", "submittedAt", "id"]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6)
      .setBackground("#1a1a1a")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setColumnWidth(1, 110);
    sheet.setColumnWidth(2, 140);
    sheet.setColumnWidth(3, 160);
    sheet.setColumnWidth(4, 380);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(6, 240);
  }
  return sheet;
}

function safeParseJSON(str) {
  try { return JSON.parse(str || "[]"); } catch(e) { return []; }
}

function jsonResponse(data, e) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    const js = callback + '(' + JSON.stringify(data) + ');';
    return ContentService
      .createTextOutput(js)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
