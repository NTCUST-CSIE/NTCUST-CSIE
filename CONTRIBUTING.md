# 貢獻指南 (Contributing Guidelines)

首先，非常感謝您願意花時間為 NTCUST CSIE 科學會網站貢獻程式碼！🎉
無論是修正錯字、修復 Bug 還是新增炫酷的功能，我們都非常歡迎。

為了讓大家能有良好且一致的合作體驗，請在提交任何修改前，閱讀並遵循以下指南。

## 💡 如何貢獻？

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
git checkout -b feature/your-feature-name
# 或是
git checkout -b fix/your-bugfix-name
```

### 3. 開發與測試 (Development & Testing)
- 由於專案使用 `fetch()` 讀取 JSON 資料，請務必使用 **Live Server** 或 `npx serve` 來預覽您的修改，直接雙擊 HTML 檔案會導致 CORS 錯誤。
- 確認您的修改在**電腦版**與**手機版 (Responsive)** 都有良好的顯示效果。

### 4. 提交更改 (Commit Your Changes)
我們鼓勵使用 **Conventional Commits (約定式提交)** 來讓 Commit 歷史保持乾淨易讀：
- `feat:` 新增功能
- `fix:` 修復 Bug
- `docs:` 修改文件 (例如 README)
- `style:` 修改程式碼格式 (不影響邏輯，例如 CSS 調整)
- `refactor:` 重構程式碼
- `chore:` 雜項 (例如更新套件或設定)

範例：
```bash
git commit -m "feat: 新增成員介紹頁面"
git commit -m "style: 調整導覽列在手機版的間距"
```

### 5. 發送 Pull Request (Push & PR)
1. 將您的分支推送到您 Fork 的儲存庫：
   ```bash
   git push origin feature/your-feature-name
   ```
2. 前往原專案的 GitHub 頁面，點擊 **Compare & pull request**。
3. 填寫 Pull Request 範本，清楚描述您的修改內容與動機。
4. 等待核心維護者 Review 您的程式碼。如果有需要修改的地方，請直接在原分支繼續 commit 並 push，PR 會自動更新。

## 📝 程式碼規範 (Coding Standards)

- **HTML/CSS**: 盡量使用語意化的 HTML 標籤。CSS 請多加利用專案現有的 `var(--xxx)` CSS 變數來維持設計系統（顏色、間距等）的一致性。
- **JavaScript**: 使用 ES6+ 語法（例如 `const`/`let`、箭頭函數）。請保持功能模組化，避免過於龐大的單一函數。

## 🤝 行為準則
參與本專案請遵守我們的 [行為準則 (Code of Conduct)](CODE_OF_CONDUCT.md)。互相尊重、包容與友善是我們社群的核心價值。
