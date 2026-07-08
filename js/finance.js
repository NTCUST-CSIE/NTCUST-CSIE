document.addEventListener('DOMContentLoaded', () => {
// ==========================================
// 財務報表資料庫 (Finance Data)
// ==========================================
// 格式化金額 (加上千分位逗號)
function formatCurrency(num) {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString('en-US');
}

// 渲染財務報表與產生 JSON-LD
async function renderFinancePage() {
    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return; // Not on the finance page

    try {
        const response = await fetch('data/finance.json');
        if (!response.ok) throw new Error('無法載入財務資料');
        const financeData = await response.json();

    const tabs = document.querySelectorAll('.finance-tab');

    function renderTab(semesterCode, semesterName) {
        const semesterData = financeData[semesterCode];
        if (!semesterData) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">無此學期的財務資料。</td></tr>';
            return;
        }

        // 更新標題
        const titleElem = document.getElementById('finance-title');
        if (titleElem) titleElem.textContent = `${semesterName} 收支明細表`;

        // 計算總計與結餘
        let totalIncome = 0;
        let totalExpense = 0;
        let currentBalance = 0;
        
        semesterData.forEach(month => {
            month.records.forEach(record => {
                if (record.income) totalIncome += record.income;
                if (record.expense) totalExpense += record.expense;
                
                // 自動計算單筆結餘
                currentBalance += (record.income || 0) - (record.expense || 0);
                record.balance = currentBalance;
            });
        });
        let finalBalance = totalIncome - totalExpense;

        let html = "";
        
        // Render Rows
        semesterData.forEach(month => {
            html += `
                <tr class="month-divider">
                    <td colspan="5">${month.monthLabel}</td>
                </tr>
            `;
            
            month.records.forEach(record => {
                html += `
                    <tr>
                        <td>${record.date}</td>
                        <td>${record.desc}</td>
                        <td class="amount-col income">${formatCurrency(record.income)}</td>
                        <td class="amount-col expense">${formatCurrency(record.expense)}</td>
                        <td class="amount-col balance">${formatCurrency(record.balance)}</td>
                    </tr>
                `;
            });
        });

        // Render Total Row
        html += `
            <tr class="total-row">
                <td colspan="2" style="text-align: right; font-weight: bold;">本學期結餘總計</td>
                <td class="amount-col income">${formatCurrency(totalIncome)}</td>
                <td class="amount-col expense">${formatCurrency(totalExpense)}</td>
                <td class="amount-col balance highlight-amount">${formatCurrency(finalBalance)}</td>
            </tr>
        `;

        tbody.innerHTML = html;

        // 更新 JSON-LD
        let lastUpdatedDate = "2026/07/01"; // 預設值
        const updatedElem = document.getElementById('finance-last-updated');
        if (updatedElem) {
            lastUpdatedDate = updatedElem.textContent.replace('最後更新日期：', '').trim();
        }

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": `國立臺中科技大學五專部資工科科學會 - ${semesterName} 財務報表`,
            "description": `最後更新於 ${lastUpdatedDate}，本期學期結餘 ${formatCurrency(finalBalance)} 元。`,
            "creator": {
                "@type": "Organization",
                "name": "NTCUST CSIE Student Association"
            },
            "dateModified": lastUpdatedDate.replace(/\//g, '-'),
            "hasPart": semesterData.flatMap(m => m.records.map(r => ({
                "@type": "DataFeedItem",
                "dateCreated": r.date,
                "name": r.desc,
                "value": r.balance
            })))
        };

        let scriptObj = document.getElementById('finance-json-ld');
        if (!scriptObj) {
            scriptObj = document.createElement("script");
            scriptObj.id = "finance-json-ld";
            scriptObj.type = "application/ld+json";
            document.head.appendChild(scriptObj);
        }
        scriptObj.text = JSON.stringify(jsonLd, null, 2);
    }

    // 綁定頁籤點擊事件
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderTab(tab.getAttribute('data-target'), tab.textContent.trim());
        });
    });

    // 初始載入預設頁籤
    const activeTab = document.querySelector('.finance-tab.active');
    if (activeTab) {
        renderTab(activeTab.getAttribute('data-target'), activeTab.textContent.trim());
    }

    } catch (error) {
        console.error("載入財務報表失敗：", error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--color-danger);">載入資料失敗。</td></tr>';
    }
}

// 初始化
renderFinancePage();
});
