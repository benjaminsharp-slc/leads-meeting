# SETUP GUIDE — Leads Meeting System (v2)

You have 4 files:
- `Code.gs` — the Google Apps Script backend
- `lead-form.html` — what leads open on their phones
- `agenda.html` — what you use to generate the agenda
- `SETUP.md` — this file

---

## STEP 1 — Create the Google Sheet & Deploy the Backend

1. Go to **https://sheets.google.com** and create a new blank spreadsheet.
   Name it something like "Leads Meeting Submissions."

2. In the menu, click **Extensions → Apps Script.**
   A new tab opens with a code editor.

3. Delete all the existing code (it says `function myFunction() {}`).

4. Open `Code.gs` from these files and **paste the entire contents** into the editor.

5. Press **Ctrl+S** (or Cmd+S on Mac) to save.

6. Click **Deploy → New deployment**
   - Click the **gear icon** next to "Type" and select **Web app**
   - Description: anything (e.g. `Leads Meeting API`)
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

7. Google will ask you to authorize:
   - Click **Authorize access**
   - Choose your Google account
   - If you see "Google hasn't verified this app," click **Advanced → Go to [project] (unsafe)**
   - Click **Allow**

8. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

## STEP 2 — Configure the HTML Files

Paste your URL into **both** HTML files.

1. Open `lead-form.html` in a text editor (Notepad, VS Code, TextEdit, etc.)
2. Find this line near the bottom:
   ```
   const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL';
   ```
3. Replace `YOUR_APPS_SCRIPT_URL` with your actual URL:
   ```
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```
4. Save. Repeat for `agenda.html`.

---

## STEP 3 — Host the Files

### Netlify Drop (free, ~2 minutes — recommended)
1. Go to **https://app.netlify.com/drop**
2. Drag both HTML files into the drop zone
3. You get a URL like `https://random-name.netlify.app`
4. Form: `https://random-name.netlify.app/lead-form.html`
5. Agenda: `https://random-name.netlify.app/agenda.html`

### GitHub Pages (free, better for ongoing updates)
1. Create a repo at **https://github.com**, upload both HTML files
2. Go to Settings → Pages → set source to `main` branch
3. Files are live at `https://yourusername.github.io/repo-name/lead-form.html`

---

## STEP 4 — Share

- Send leads the `lead-form.html` URL — they open it on their phones
- Bookmark `agenda.html` on your computer (and phone if needed)
- Click **Refresh** on the agenda page to pull in the latest submissions

---

## REDEPLOYING AFTER CHANGES

If you update `Code.gs` (or if submissions stop working), redeploy:

1. In Apps Script, click **Deploy → Manage deployments**
2. Click the **pencil (edit) icon** on your deployment
3. Change the version dropdown to **"New version"**
4. Click **Deploy**

The URL stays the same — no need to update the HTML files.

---

## HOW IT WORKS

```
Lead's phone                    Google's servers              Your office
─────────────                   ─────────────────             ───────────
lead-form.html  ──── GET ─────► Apps Script  ──── writes ──► Google Sheet
                                     │
agenda.html     ──── GET  ────►      │ ◄── reads ──────────── Google Sheet
                ◄── JSON ────
```

All communication uses simple GET requests (URL parameters), which work
reliably from any browser without CORS issues.

---

## TROUBLESHOOTING

**"Unexpected response", "timed out", or "Could not reach server" error**
- The most common cause: you need to **redeploy as a new version** after pasting the new `Code.gs`
- Go to Apps Script → Deploy → Manage deployments → pencil icon → New version → Deploy
- Make sure "Who has access" is **Anyone** (not "Anyone with Google account")

**Form shows ⚠️ Setup required**
- You haven't replaced `YOUR_APPS_SCRIPT_URL` in the HTML file yet

**Agenda shows no submissions after refresh**
- Verify the date on the agenda page matches what leads submitted
- Open the Google Sheet directly — check if a "Submissions" tab exists and has data
- If the sheet is empty, the first submission will create the tab automatically

**"Authorization required" in the sheet**
- Re-authorize: Apps Script → Deploy → Manage deployments → edit → re-authorize
