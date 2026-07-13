# 貢獻指南 (Contributing Guidelines)

首先，非常感謝您願意花時間為 NTCUST CSIE 科學會網站貢獻心力！🎉
網站已經過模組化重構，現在無論您是**不會寫程式的學弟妹（內容維護者）**，還是**熟悉前端技術的高手（程式開發者）**，都能輕鬆參與專案！

請在提交任何修改前，閱讀並遵循以下指南。

## 👥 選擇你的貢獻角色

### 角色 A：內容維護者 (Content Editors)
如果您只是想**新增活動、更新財務報表、替換新任幹部資料**，您完全**不需要**碰觸任何 HTML 或 JavaScript！

1. 前往 `data/` 資料夾。
2. 根據您的需求，選擇對應的 JSON 檔案編輯：
   - `events.json`：新增或修改近期活動與報名連結。
   - `finance.json`：更新各學期的收支紀錄。
   - `members.json`：更換幹部名單、修改大頭貼圖片路徑 (`image` 屬性)。
   - `404.json`：設定短網址的轉址規則。
3. 確保 JSON 格式正確（請注意逗號 `{ "key": "value" },`）。
4. 上傳圖片請放至對應資料夾（或根目錄）並在 JSON 中設定好相對路徑（例如：`"./logo.png"`）。

### 角色 B：程式開發者 (Developers)
如果您想要**調整網站外觀、優化效能或是增加新功能**。

1. **HTML/CSS**: 盡量使用語意化的 HTML 標籤。CSS 請多加利用專案現有的 `var(--xxx)` CSS 變數來維持設計系統（顏色、間距等）的一致性。
2. **JavaScript**: 專案已落實**模組化 (Data-UI Separation)**。
   - 請不要把所有邏輯塞回 `script.js`！`script.js` 僅負責全站通用的功能（如深色模式、防護彩蛋、導覽列）。
   - 與特定頁面有關的渲染邏輯，請編寫在各自的獨立檔案中（例如 `finance.js`, `members.js`），並僅在該頁面引入，以達到按需載入 (Lazy Load) 的最佳效能。

---

## 💡 參與貢獻的標準流程 (Workflow)

### 1. 準備工作 (Fork & Clone)
1. 點擊本專案右上角的 **Fork** 按鈕，將專案複製到您的 GitHub 帳號下。
2. 將您 Fork 的專案 Clone 到本地端：
   ```bash
   git clone https://github.com/您的帳號/NTCUST-CSIE.git
   cd NTCUST-CSIE
   ```

### 2. 建立分支 (Create a Branch)
請務必不要直接在 `main` 分支上進行開發。請為您的修改建立一個具描述性的新分支：
```bash
git checkout -b content/update-finance-2026
# 或是開發新功能
git checkout -b feature/new-gallery-page
```

### 3. 開發與測試 (Development & Testing)
- 由於專案使用 `fetch()` 讀取 JSON 資料，請務必使用 **Live Server** 或 `npx serve` 來預覽您的修改，直接雙擊 HTML 檔案會導致 CORS 錯誤。
- 如果您是開發者，請確認您的修改在**電腦版**與**手機版 (Responsive)** 都有良好的顯示效果。
- **請保持 Vanilla JS 精神，切勿隨意引入未使用的外部依賴庫（如 CDN）以維持極致效能。**

### 4. 提交更改 (Commit Your Changes)
我們鼓勵使用 **Conventional Commits (約定式提交)** 來讓 Commit 歷史保持乾淨易讀：
- `data:` 更新 JSON 資料內容 (適合內容維護者)
- `feat:` 新增功能
- `fix:` 修復 Bug
- `docs:` 修改文件 (例如 README)
- `style:` 修改程式碼格式 (不影響邏輯，例如 CSS 調整)
- `refactor:` 重構程式碼
- `chore:` 雜項 (例如更新套件或設定)

範例：
```bash
git commit -m "data: 更新 115 學年度第一學期財務報表"
git commit -m "feat: 新增成員介紹頁面"
```

### 5. 發送 Pull Request (Push & PR)
1. 將您的分支推送到您 Fork 的儲存庫：
   ```bash
   git push origin <您的分支名稱>
   ```
2. 前往原專案的 GitHub 頁面，點擊 **Compare & pull request**。
3. 填寫 Pull Request 範本，並勾選對應的 Checklist。
4. 等待核心維護者 Review 您的程式碼。如果有需要修改的地方，請直接在原分支繼續 commit 並 push，PR 會自動更新。

---

## 🤝 行為準則
參與本專案請遵守我們的 [行為準則 (Code of Conduct)](CODE_OF_CONDUCT.md)。互相尊重、包容與友善是我們社群的核心價值。
