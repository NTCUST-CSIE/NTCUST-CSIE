// Developer Console Easter Egg (Multi-layered detection)
(function() {
    let isEasterEggShown = false;
    const showEasterEgg = () => {
        if (isEasterEggShown) return;
        isEasterEggShown = true;
        console.clear();
        console.log(
            "%c嗨！",
            "font-size: 25px; line-height: 1.6; font-family: 'Noto Sans TC', sans-serif;"
        );
        console.log(
            "%c你開了F12 想必是對於這個網頁改善有充足的想法\n歡迎加入資訊工程科學會協助我們改善！！",
            "font-size: 20px; line-height: 1.6; font-family: 'Noto Sans TC', sans-serif;"
        );
    };

    // Method 1: Keyboard shortcuts (F12, Ctrl+Shift+I, Cmd+Opt+I, etc.)
    window.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
           (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'c')) || 
           (e.metaKey && e.altKey && (e.key.toLowerCase() === 'i' || e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'c'))) {
            showEasterEgg();
        }
    });

    // Method 2: Resize detection (works when DevTools is docked and opened via right-click)
    const checkResize = () => {
        const threshold = 160;
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            showEasterEgg();
        }
    };
    window.addEventListener('resize', checkResize);
    setInterval(checkResize, 1000);

    // Method 3: RegExp toString evaluation trick (Fallback for some browsers)
    const devtools = /./;
    devtools.toString = function() {
        showEasterEgg();
        return '';
    };
    console.log('%c', devtools);
})();

// Theme Initialization (runs immediately to prevent flash)
const initTheme = () => {
    const currentTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
};
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                theme = 'light';
            } else if (theme === 'light') {
                theme = 'dark';
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = prefersDark ? 'light' : 'dark';
            }
            
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    });

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Toggle icon from list to x
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('ph-list');
                icon.classList.add('ph-x');
            } else {
                icon.classList.remove('ph-x');
                icon.classList.add('ph-list');
            }
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('ph-x');
                icon.classList.add('ph-list');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Reveal elements on scroll
    // In minimalist design, we use subtler reveals
    const revealElements = document.querySelectorAll('.glass-card:not(.org-node), .org-tree, .member-card, .event-card, .stat-card, .contact-info, .social-links, .section-title');
    
    // Set initial class
    revealElements.forEach(el => el.classList.add('reveal'));

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach((el) => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    // Trigger once on load
    revealOnScroll();

    // Member Modal Logic
    const modal = document.getElementById('memberModal');
    const modalClose = document.querySelector('.modal-close');
    const modalName = document.getElementById('modalName');
    const modalTitle = document.getElementById('modalTitle');
    const modalIntro = document.getElementById('modalIntro');
    const modalIcon = document.getElementById('modalIcon');

    if (modal) {
        document.querySelectorAll('.member-card').forEach(card => {
            const intro = card.querySelector('.hidden-intro').innerHTML.trim();
            if (intro !== '') {
                card.classList.add('clickable-card');
                card.addEventListener('click', () => {
                    const name = card.querySelector('.member-name').textContent;
                    const title = card.querySelector('.member-title').textContent;
                    const iconHTML = card.querySelector('.member-icon').innerHTML;
                    
                    modalName.textContent = name;
                    modalTitle.textContent = title;
                    modalIntro.innerHTML = intro;
                    modalIcon.innerHTML = iconHTML;

                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                });
            }
        });

        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Event Modal Logic
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
        const eModalClose = eventModal.querySelector('.modal-close');
        const eModalTitle = document.getElementById('eventModalTitle');
        const eModalDesc = document.getElementById('eventModalDesc');
        const eModalLinks = document.getElementById('eventModalLinks');

        let eventData = {};

        // 載入外部活動資料
        fetch('events.json')
            .then(response => {
                if (!response.ok) throw new Error('無法載入活動資料');
                return response.json();
            })
            .then(data => {
                eventData = data;
            })
            .catch(error => console.error('載入 events.json 失敗:', error));

        document.querySelectorAll('.event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const eventId = btn.getAttribute('data-event');
                const data = eventData[eventId];
                
                if (data) {
                    eModalTitle.textContent = data.title;
                    eModalDesc.textContent = data.desc;
                    
                    eModalLinks.innerHTML = '';
                    data.links.forEach(link => {
                        const li = document.createElement('li');
                        li.innerHTML = `<a href="${link.url}"><i class="ph-bold ph-link"></i> ${link.text}</a>`;
                        eModalLinks.appendChild(li);
                    });
                    
                    eventModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        eModalClose.addEventListener('click', () => {
            eventModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        eventModal.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

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
        const response = await fetch('finance.json');
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--color-danger);">載入資料失敗，若您在本地端開啟，請確認是否透過伺服器環境 (如 Live Server) 執行。</td></tr>';
    }
}

// 初始化
renderFinancePage();
});

function triggerEasterEgg() {
    function b64DecodeUnicode(str) {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }
    alert(b64DecodeUnicode("6YCZ5qij546p55y8552b5LiN55eb5ZeO"));
}

const themeToggleBtn = document.querySelector('.theme-toggle');

let clickCount = 0;
let lastClickTime = 0;

themeToggleBtn.addEventListener('click', () => {
    const currentTime = new Date().getTime();
    
    if (currentTime - lastClickTime > 1500) {
        clickCount = 0;
    }
    
    clickCount++;
    lastClickTime = currentTime;
    
    if (clickCount === 10) {
        triggerEasterEgg();
        clickCount = 0;
    }
});
