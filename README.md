# NTCUST CSIE 資訊工程科 科學會

<div align="center">
  <img src="logo.png" alt="NTCUST CSIE Logo" width="200" />
  <br />
  <h3>國立臺中科技大學 資訊工程科 科學會 官方網站</h3>
  <p>這是一個以 HTML、CSS 和 JavaScript 打造的純前端靜態網站，用以展示科學會介紹、財務報表、活動資訊等相關內容。</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

## 📌 專案簡介 (About)

本專案旨在提供國立臺中科技大學五專部資訊工程科（NTCUST CSIE）的學生一個資訊公開透明的平台，包含：
- **活動剪影**：提供最新活動資訊與報名連結。
- **財務報表**：公開透明的科學會經費收支紀錄。
- **成員介紹**：現任科學會幹部名單。

## 🛠️ 技術棧 (Tech Stack)

- **HTML5**: 語意化網頁結構。
- **CSS3**: 採用 CSS Variables、Flexbox、Grid 等現代佈局技術，並支援深色模式 (Dark Mode)。
- **JavaScript (ES6+)**: Vanilla JS，不依賴大型前端框架，保持網站輕量。
- **GSAP (GreenSock)**: 高效能的頁面捲動與 UI 動畫。
- **Phosphor Icons**: 現代簡約的開源圖示庫。

## 📂 目錄結構 (Directory Structure)

為了維持專案的專業與可擴充性，靜態資源已分類至各對應的資料夾中：

```text
NTCUST-CSIE/
├── css/                  # 樣式表
│   └── style.css
├── js/                   # JavaScript 程式碼
│   ├── script.js         # 主要互動邏輯
│   ├── particles.js      # 首頁粒子特效
│   └── hero_animations.js# 首頁進場與捲動動畫
├── data/                 # JSON 資料 (用作簡易 API)
│   ├── finance.json      # 財務報表資料
│   ├── events.json       # 活動剪影資料
│   └── 404.json          # 短網址轉向設定
├── .github/              # GitHub 專用範本 (PR, Issue)
├── index.html            # 首頁
├── finance.html          # 財務報表頁面
├── events.html           # 活動剪影頁面
├── members.html          # 成員介紹頁面
└── 404.html              # 404 與短網址導向處理頁面
```

## 🚀 本地端開發 (Local Development)

若您想要在自己的電腦上運行並修改這個網站：

1. **Clone 專案**
   ```bash
   git clone https://github.com/NTCUST-CSIE/NTCUST-CSIE.git
   cd NTCUST-CSIE
   ```
2. **開啟 Live Server**
   因為我們在 JS 裡使用了 `fetch()` 來讀取 `data/` 中的 JSON 檔案，直接雙擊打開 HTML 檔案會遇到 CORS (跨來源資源共用) 的安全性限制。
   請使用 VS Code 的 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 擴充功能，或是使用 Node.js 的 `npx serve` 來啟動本地端伺服器。
   ```bash
   npx serve .
   ```
3. 打開瀏覽器訪問 `http://localhost:3000` (或 Live Server 顯示的 port)。

## ☁️ 部署 (Deployment - GitHub Pages)

本專案採用 **GitHub Pages** 直接託管。
任何合併到 `main` 分支的提交 (Commit) 都會自動觸發 GitHub Pages 的部署流程。

- **Domain**: 若有自訂網域，請確保 `CNAME` 檔案內容正確。
- **404 重新導向**: 專案內包含客製化的 `404.html`，可以用作自訂短網址的跳轉。

## 🤝 參與貢獻 (Contributing)

我們非常歡迎各位學長姐、學弟妹以及各路高手的 PR（Pull Requests）！
在開始提交程式碼之前，請務必先閱讀我們的 [貢獻指南 (CONTRIBUTING.md)](CONTRIBUTING.md) 以及 [行為準則 (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md)。

## 📜 授權 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
