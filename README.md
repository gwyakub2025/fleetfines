# FleetLedger — EWDS Vehicle Financial Dashboard

A React + Vite single-page web app. Import traffic-fine and Salik spreadsheets; consolidate by plate; review category totals and detailed transactions; export CSV/XLSX. Sage, concrete grey, and burnt amber UI. Can deploy as a static site on Vercel.

## Prerequisites
Node.js 20+ and npm. Internet connection for the initial dependency installation.

## Local installation
```bash
npm install
npm run dev
```
Open the local URL shown by Vite (normally http://localhost:5173).

## Tests and production build
```bash
npm test
npm run build
npm run preview
```
Tests cover plate normalization, money parsing, header detection, category assignment, aggregation, workbook parsing and a two-file-to-CSV integration scenario.

## How to use
1. Choose the **reporting month** (e.g. 2026-10).
2. Upload one traffic-fines file and one Salik file. `.xls`, `.xlsx`, and `.csv` are supported.
3. Confirm worksheet and mapping. For traffic fines, map an **authority** column to classify RTA vs Dubai Police. If no authority exists, those amounts remain **unclassified** and are excluded from categorized grand totals; do not assume a fine belongs to an authority.
4. Click **Save to selected month** for each upload. Records persist in this browser's IndexedDB and replace the previous upload for that month and source type.
5. Expand a plate to inspect each fine or toll. Export summary CSV or detailed XLSX with Summary, Plate Consolidated and Transactions sheets.
6. Switch reporting months to access other saved months. Save each month's exports as a backup.

## Column mapping assumptions
- Plate aliases include `Bike Number`, `License Plate`, `Plate Number`, `Vehicle Number`, `Plate`, etc. Plate comparison is case-insensitive and removes spaces/punctuation. **Caution:** if two emirates or plate codes have identical simplified plate identifiers, manual review is necessary; this app does not automatically distinguish them unless code is included in the plate value.
- Amount aliases include `Amount`, `Fine Amount`, `Charge`, `Toll Amount`, `Total Amount`, etc. Currency symbols and commas are stripped; invalid or blank amounts are flagged and skipped.
- Authority aliases include `Authority`, `Department`, `Fine Category`, etc. Text containing `RTA` or `Roads and Transport` is RTA; `Dubai Police` or `Police` is Dubai Police; unknown authority is unclassified.
- Date and reference columns are optional. Date strings are retained as shown in source; month grouping is **by the selected upload/reporting month**, not automatically by transaction date. Thus a two-month source file must be uploaded separately or split before upload if you need transaction-month reporting. Reuploading a month/type replaces its entire dataset.
- **All numeric-column totals:** the main report totals recognized monetary categories. Arbitrary numeric metadata columns in the source are not totaled. The app assumes one monetary amount column per transaction. This distinction prevents adding identifiers and dates as money.
- Exact duplicate transactions within a file are not automatically eliminated, because separate genuine transactions can share amount and plate. Verify the transaction detail and references.

## Privacy, data and limitations
- All data stays in the local browser (IndexedDB); the static site has no server or login. Browser storage can be deleted, and data does not synchronize between devices. **Export backups frequently.** For shared multi-user use, add authenticated database storage and role-based access before production deployment.
- Unclassified amounts are excluded from the financial grand total and shown separately. Import issues are listed for review.
- This app does not validate uploaded values against RTA, Dubai Police or Salik authorities.
- Excel exports use SheetJS. PDFs can be created by browser print-to-PDF if needed.

## GitHub → Vercel
1. Create a **private** GitHub repository, upload all project files (do not upload private fines source files).
2. Vercel → Add New Project → Import Git Repository.
3. Framework: **Vite**; Build command: `npm run build`; Output directory: `dist`.
4. Deploy. Every new push to `main` will deploy the latest version. The deployment is static; IndexedDB remains browser-specific.

## Source file safety
Financial files may contain personal data. Do not commit source spreadsheets to a public repository. Prefer private repos and Vercel deployment protection for sensitive company workflows.

## Automatic import (v1.1)
No column mapping review is required. The application scans the first 45 rows of each worksheet to locate the real table header. The provided EWDS traffic report uses `Plate Number`, `Fines source`, and `Ticket Fee`; the Salik report uses `Plate` and `Total Amount (AED) (Incl. VAT)`. It uses the VAT-inclusive Salik amount. Each plate is matched by uppercase alphanumeric normalized key. The **All fines by plate** table and exported **Plate Consolidated** sheet show RTA 1, RTA 2, etc., then category totals. Uploads replace the corresponding file for the selected reporting month in this browser. Note that a multi-month source is assigned to the selected reporting period, not split by transaction date. Rows lacking a plate or amount are skipped; unclassified fine authorities are flagged and excluded from classified totals.

## Updated fine-authority and rider billing reports
- The traffic file's **Fines source** column is treated as the source of truth: every distinct value becomes its own financial category, including Licensing Activities Monitoring Department and other authorities. No fixed RTA/Dubai-only restriction.
- For each authority, the consolidated Excel sheet includes exactly the maximum number of fine columns found for a plate in the selected reporting period, followed by that authority's total.
- Salik shows **transaction count and combined consumption amount only**, not individual trip columns.
- Select **Rider PDFs** to download one PDF containing one statement per vehicle (normally one page per plate; unusually long fine histories may overflow onto additional pages). The Plate summary also offers an individual PDF button.
- CSV and Excel reports include dynamically discovered authority totals. PDF output uses jsPDF.
- Re-upload both original files after installing this version. The browser may retain earlier imported records for the same month until they are replaced.
- Imported transactions are grouped by the month you select; a multi-month source file is not split automatically.
