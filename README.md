# NTCUST CSIE 資訊工程科 科學會

<div align="center">
  <img src="./public/img/logo.png" alt="NTCUST CSIE Logo" width="200" />
  <br />
  <h3>國立臺中科技大學 資訊工程科 科學會 官方網站</h3>
  <p>這是一個以 React 和 Vite 打造的前端靜態網站 (SPA)，採用「資料與介面分離 (Data-UI Separation)」架構，用以展示科學會介紹、財務報表、活動資訊等相關內容。</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
</div>

## 📌 專案簡介 (About)

本專案旨在提供國立臺中科技大學五專部資訊工程科（NTCUST CSIE）的學生一個資訊公開透明的平台，包含：
- **活動剪影**：提供最新活動資訊與報名連結。
- **財務報表**：公開透明的科學會經費收支紀錄。
- **成員介紹**：現任科學會幹部名單與部門組織圖。

## 🛠️ 網站架構與技術 (Architecture & Tech Stack)

本網站採用現代化的「**資料與介面分離 (Data-UI Separation)**」設計模式。所有的資料內容皆存放於獨立的 JSON 檔案中，而介面渲染與互動邏輯則由各個獨立的 React 元件負責。

- **資料層 (Data)**：`src/data/*.json`。非技術背景的同學也能輕鬆維護網站內容。
- **前端框架 (Framework)**：**React 19** + **React Router 7**。
- **建置工具 (Build Tool)**：**Vite** 提供極速的本地開發體驗。
- **介面層 (UI)**：**CSS3**。採用 CSS Variables、Flexbox、Grid 佈局，並支援深色模式 (Dark Mode)。
- **圖示庫 (Icons)**：**Phosphor Icons** 現代簡約的開源圖示庫 (`@phosphor-icons/react`)。

## 📂 目錄結構 (Directory Structure)

```text
NTCUST-CSIE/
├── public/               # 靜態資源 (不經過編譯)
│   ├── img/              # 圖片資源
│   ├── _headers          # Cloudflare Pages 的 CSP 標頭設定
│   └── robots.txt / sitemap.xml # SEO 基礎建設
├── src/                  # React 程式碼源始目錄
│   ├── assets/           # 需要編譯的靜態資源 (如全站 style.css)
│   ├── components/       # 可共用的 React 元件 (Navbar, Footer, Modals...)
│   ├── pages/            # 路由頁面元件 (Home, Events, Members, Finance...)
│   ├── data/             # JSON 資料庫 (修改內容請改這裡！)
│   │   ├── members.json  # 科會成員、部門與大頭貼資料
│   │   ├── finance.json  # 財務報表與收支資料
│   │   ├── events.json   # 活動剪影與連結資料
│   │   └── nav.json      # 導覽列與短網址設定
│   ├── App.tsx           # React Router 路由設定
│   └── main.tsx          # 應用程式進入點
├── .github/              # GitHub 專用範本與 Actions 工作流
├── index.html            # 網站進入點 (Vite)
├── package.json          # 專案依賴套件設定檔
└── vite.config.ts        # Vite 設定檔
```

## 🔒 安全性與效能 (Security & Performance)

- **內容安全策略 (CSP)**：透過 `public/_headers` 設定嚴格的 Content-Security-Policy，防止 XSS 攻擊。
- **SEO 與 GEO 最佳化**：加入 JSON-LD 結構化資料，提升 Google Search 與生成式 AI (ChatGPT/Gemini) 的解析精確度。
- **圖片最佳化**：大型圖片已經過壓縮處理，減輕頻寬負擔。

## 🚀 本地端開發 (Local Development)

若您想要在自己的電腦上運行並修改這個網站：

1. **Clone 專案**
   ```bash
   git clone https://github.com/NTCUST-CSIE/NTCUST-CSIE.git
   cd NTCUST-CSIE
   ```
2. **安裝依賴套件**
   請確保您的電腦已安裝 [Node.js](https://nodejs.org/)。
   ```bash
   npm install
   ```
3. **啟動開發伺服器**
   ```bash
   npm run dev
   ```
4. 打開瀏覽器訪問 `http://localhost:5173`。

## ☁️ 部署 (Deployment - Cloudflare Pages)

本專案強烈建議部署於 **Cloudflare Pages**（而非 GitHub Pages），因為我們使用了 SPA 路由以及自訂的 `_headers`。

- **框架設定 (Framework preset)**：請選擇 `Vite`。
- **建置指令 (Build command)**：`npm run build`。
- **輸出目錄 (Output directory)**：`dist`。
- 部署完成後，所有的路由 (如 `/members`) 皆可正常運作，且 CSP 標頭將會自動套用。

## 🤝 參與貢獻 (Contributing)

我們非常歡迎各位學長姐、學弟妹以及各路高手的 PR（Pull Requests）！
為了降低門檻，我們區分了「內容維護者」與「程式開發者」。在開始提交修改之前，請務必先閱讀我們的 [貢獻指南 (CONTRIBUTING.md)](CONTRIBUTING.md) 以及 [行為準則 (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md)。

## 📜 授權 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
