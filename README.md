# FundApp — 家庭資金管理

- **DB**: Google Sheets
- **後端**: Google Apps Script Web App
- **前端**: Vite + React + TypeScript + Tailwind,GitHub Pages 部署
- **鑑權**: Google 帳號 (Google Identity Services) + `AllowedUsers` 白名單

Phase 1 範圍:收支記帳 CRUD。詳細計畫見 `..\.claude\plans\google-sheet-streamed-pearl.md`。

---

## 一次性外部設定 (需要你自己做)

### 1. 建立 Google Sheet

新開一份 spreadsheet,取名 `FundApp DB`,建三個分頁與表頭 (row 1):

**`Transactions`**
```
id | createdAt | date | type | category | amount | note | userEmail
```

**`Categories`**
```
name | type | icon
```
先塞幾筆種子:
```
餐飲     | expense |
交通     | expense |
日用     | expense |
娛樂     | expense |
薪資     | income  |
其他收入 | income  |
```

**`AllowedUsers`**
```
email | displayName | role
```
把自己與家人的 Gmail 填進去 (email 全小寫)。

記下 spreadsheet ID (URL 中 `/d/<ID>/edit` 那段)。

### 2. Google Cloud Console — 建 OAuth Client ID

1. https://console.cloud.google.com/ 建/選一個 project
2. **APIs & Services > OAuth consent screen** — 設 External,填 app name、support email;測試階段可以只加自己家人的 email 到 Test users
3. **APIs & Services > Credentials > Create Credentials > OAuth client ID** → Application type = **Web application**
4. **Authorized JavaScript origins** 加:
   - `http://localhost:5173`
   - `https://<你的 GitHub username>.github.io`
5. 建好後複製 Client ID (`xxx.apps.googleusercontent.com`)

### 3. 部署 Apps Script

1. 打開你的 `FundApp DB` sheet → **Extensions > Apps Script**
2. 把 `apps-script/` 目錄裡的 `Code.gs`、`Auth.gs`、`Sheets.gs`、`Transactions.gs` 內容逐一貼進 Apps Script 編輯器 (檔名對應同名 script)
3. 左側齒輪「Project Settings > Show `appsscript.json` in editor」勾起來 → 用 `apps-script/appsscript.json` 內容覆蓋
4. 「Project Settings > Script properties」新增:
   - `OAUTH_CLIENT_ID` = 上一步的 OAuth Client ID
   - `SPREADSHEET_ID` = Sheet 的 ID
5. **Deploy > New deployment** → type = Web app → Execute as = **Me**, Who has access = **Anyone** → Deploy
   - 首次會要求授權 (Spreadsheets + external requests) — 同意
6. 複製 `/exec` URL

> 想從 IDE 手動測後端:先在 `Code.gs` 執行 `test_listCategories_` 或 `test_createTransaction_`,檢查 Sheet 是否更新。

---

## 本地開發

```bash
cd frontend
cp .env.example .env.local
# 填入 VITE_API_URL 與 VITE_GOOGLE_CLIENT_ID

npm install
npm run dev
```

打開 http://localhost:5173,用你 (已加入 `AllowedUsers` 的) Gmail 登入。

---

## 部署到 GitHub Pages

1. GitHub 建 repo (例如 `fund-app`),推程式到 `main`
2. Repo 的 **Settings > Pages** — Source 選 `GitHub Actions`
3. **Settings > Secrets and variables > Actions > New repository secret** 新增:
   - `VITE_API_URL` = Apps Script `/exec` URL
   - `VITE_GOOGLE_CLIENT_ID` = OAuth Client ID
   - `VITE_BASE` = `/fund-app/` (依 repo 名調整;若之後用 custom domain 可移除)
4. 記得把 OAuth Client ID 的 Authorized origins 加上 `https://<user>.github.io`
5. Push 觸發 `.github/workflows/deploy-pages.yml` 自動 build & 部署

---

## 專案結構

```
frontend/       Vite + React + TS + Tailwind
apps-script/    .gs files to paste into Apps Script editor
.github/        GitHub Actions workflow (Pages deploy)
```

## API 契約 (前後端共享)

所有請求都是 `POST` 到 `/exec`,body:
```json
{ "idToken": "<GIS ID token>", "action": "<name>", "payload": { ... } }
```
回應:
```json
{ "ok": true, "data": ... }
```
或
```json
{ "ok": false, "error": "..." }
```

Actions:
- `listCategories` — `{}` → `Category[]`
- `listTransactions` — `{ from?, to?, limit? }` → `Transaction[]`
- `createTransaction` — `{ date, type, category, amount, note? }` → `Transaction`
- `updateTransaction` — `{ id, ...patch }` → `Transaction`
- `deleteTransaction` — `{ id }` → `{ id }`
- `whoami` — `{}` → 已鑑權的 user

## 已知限制 / 未來

- Phase 2: Recharts 分類統計圖 (資料已在 Sheet 齊全)
- Phase 3: 加 `Accounts` sheet + `Transactions.accountId`,加投資淨值
- Apps Script 6 分鐘上限;list 若超過幾千筆需分頁 (Phase 1 用不到)
- 建議定期把 Sheet 複製一份備份 (Google 有版本歷史但獨立副本更保險)
