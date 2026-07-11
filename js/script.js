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
            "%c你開了F12\n想必是對於這個網頁改善有充足的想法\n歡迎加入資訊工程科學會協助我們改善！！",
            "font-size: 20px; line-height: 1.6; font-family: 'Noto Sans TC', sans-serif;"
        );
        console.log(
            "%c如果您不是為了協助我們改善，那我有一些小知識送給你：\n\n《刑法》第 36 章：\n第358條：無故入侵電腦罪（最高 3 年徒刑）\n第359條：無故取得、變更電磁紀錄罪（最高 5 年徒刑）\n第360條：干擾電腦系統罪（最高 3 年徒刑）\n\n依第363條規定，以上行為「未遂犯亦罰之」\n只要有嘗試著手即構成犯罪。\n請立即停止任何未經授權的動作。\n\n若您發現漏洞，請與我們聯絡。",
            "font-size:14px;line-height:1.8;font-family:'Noto Sans TC',sans-serif;"
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
    // Prevent image dragging globally
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // Global ESC key to close any active modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            if (activeModals.length > 0) {
                activeModals.forEach(modal => {
                    modal.classList.remove('active');
                });
                document.body.style.overflow = ''; // Restore scrolling
            }
        }
    });
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

    // Hamburger Menu Logic (Event Delegation for dynamically added links)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
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
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('ph-x');
                    icon.classList.add('ph-list');
                }
            }
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

    // Dynamic Navbar Links Loading
    if (navLinks) {
        fetch('data/nav.json')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load nav.json');
                return res.json();
            })
            .then(links => {
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                
                // Identify the theme toggle li to keep it at the end
                let themeToggleLi = null;
                Array.from(navLinks.children).forEach(child => {
                    if (child.querySelector('.theme-toggle')) {
                        themeToggleLi = child;
                    } else {
                        child.remove(); // Clear old hardcoded links
                    }
                });
                
                links.forEach(link => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    
                    let finalUrl = link.url;
                    // For same-page anchor links on index.html
                    if (currentPage === 'index.html' || currentPage === '') {
                        if (link.url.startsWith('index.html#')) {
                            finalUrl = link.url.replace('index.html', '');
                        }
                    }
                    
                    a.href = finalUrl;
                    a.textContent = link.text;
                    
                    if (link.url === currentPage || (currentPage === '' && link.url === 'index.html')) {
                        a.classList.add('active');
                    }
                    
                    li.appendChild(a);
                    if (themeToggleLi) {
                        navLinks.insertBefore(li, themeToggleLi);
                    } else {
                        navLinks.appendChild(li);
                    }
                });
            })
            .catch(err => console.error('載入導覽列失敗:', err));
    }

    // Smooth scroll for anchor links (Event Delegation for dynamic elements)
    document.body.addEventListener('click', function (e) {
        // Find closest anchor tag
        const anchor = e.target.closest('a');
        if (anchor && anchor.getAttribute('href') && anchor.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
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
