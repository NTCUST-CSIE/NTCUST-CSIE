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

        const eventData = {
            "freshman": {
                title: "✨迎新✨",
                desc: "歡迎新生加入資工科的大家庭！我們將舉辦一系列破冰遊戲與學長姐經驗分享，帶你快速認識校園環境與科上特色，並且認識未來五年的好夥伴。透過各項團康活動，我們將幫助新生打破隔閡，快速建立起同學之間的情感連結，並為未來的五專生活打下良好的基礎。",
                links: [
                    { text: "第七屆 資工迎新宿營", url: "https://drive.google.com/drive/folders/1yibFNRfDjlXbiEQWW2KV3oizhs09Z9NO?usp=sharing" },
                    { text: "第六屆 資工迎新宿營", url: "https://drive.google.com/drive/folders/1YNDYXn9n58YUlYSHgbilqxzXwVd5xr9V?usp=sharing" },
                    { text: "第五屆 資工迎新宿營", url: "https://drive.google.com/drive/folders/1IJ3-iAYoMM7y9mGLHJc-_h6C0i2_RFpb?usp=sharing" }
                ]
            },
            "badminton": {
                title: "🏅體育活動🏅",
                desc: "讀書也要顧身體！來和同學切磋球技，揮灑汗水，爭奪冠軍榮耀。活動分為單打與雙打等多個組別，無論是羽球校隊等級的高手，還是只想來流流汗的新手，都能在這裡找到屬於自己的舞台。",
                links: [
                    { text: "第七屆 資想羽你在一企", url: "https://drive.google.com/drive/folders/1kafqC9ohIbpxMRk0LDNlzcuaN1njBCmo?usp=sharing" },
                    { text: "第六屆 排球週", url: "https://drive.google.com/drive/folders/1JSyz6b_4Km2o2QYVlULpiheIOa2GS7Ix?usp=sharing?usp=sharing" },
                    { text: "第五屆 羽你討拍の日資", url: "https://drive.google.com/drive/folders/1kafqC9ohIbpxMRk0LDNlzcuaN1njBCmo?usp=sharing" },
                    { text: "第五屆 資訊會工", url: "https://drive.google.com/drive/folders/1EO9gzgsJaAok9geVtOU73LjGRfOB90vq?usp=sharing" }
                ]
            },
            "bbq": {
                title: "🍖科烤🍖",
                desc: "秋高氣爽最適合烤肉，在煙火與美食中拉近彼此距離，享受難得的悠閒時光。各年級難得齊聚一堂，不僅能大啖美食，還有學長姐精心準備的餘興節目，是資工科每年最具指標性的大型活動。",
                links: [
                    { text: "第七屆 企工宴", url: "https://www.instagram.com/p/DXWuinzkfPA/" },
                    { text: "第六屆 護住美味 工掐你胃", url: "https://drive.google.com/drive/folders/1aDiAUmXaUVISqWUGCDiR3DZkYC0HZUZN?usp=sharing" },
                    { text: "第五屆 哩洗勒烤", url: "https://drive.google.com/drive/folders/1M5yfrioqfHA4s40UZhlKNi9UiLyn8mP7?usp=sharing" }
                ]
            },
            "christmas": {
                title: "🎄聖誕晚會🎄",
                desc: "交換禮物、精彩表演、摸彩活動，與資工科的大家一起度過溫馨的聖誕節。歲末年終的特別活動，在冷冷的冬天裡，帶給你最溫暖的回憶與最刺激的抽獎環節！",
                links: [
                    { text: "第七屆 Count Down Xmas", url: "https://www.instagram.com/stories/highlights/18071770307458616/" },
                    { text: "第五屆 中科友派對", url: "https://drive.google.com/drive/folders/1LvXDep0aqWshqh6H8ube-HE_BgIJlQhJ?usp=sharing" }
                ]
            },
            "school-bd": {
                title: "🏫校慶、創意進場🏫",
                desc: "做網站的人很懶，什麼都沒留下，如果你看到這個，提醒一下做網站的人補上來，謝謝",
                links: [
                    { text: "第五屆 校慶、創意進場", url: "https://drive.google.com/drive/folders/1Tvtja33cy8GZpbi8DvPK9WAiYIjlVVXw?usp=sharing" }
                ]
            },
            "other": {
                title: "其他活動",
                desc: "做網站的人很懶，什麼都沒留下，如果你看到這個，提醒一下做網站的人補上來，謝謝",
                links: [
                    { text: "第七屆 404陀螺俱樂部", url: "https://www.instagram.com/404_beybladex/" },
                    { text: "第七屆 APSC 課程", url: "https://www.instagram.com/p/DX9PP8oxsSJ/" },
                    { text: "第七屆 網頁設計初學 課程", url: "https://www.instagram.com/p/DYxASKbzxTI/" },
                    { text: "第七屆 開源 改變世界 課程", url: "https://www.instagram.com/p/DY9JXxyRla2/" },
                    { text: "第七屆 𝐒𝐢𝐧𝐠 𝟒 𝐲𝐨𝐮", url: "https://www.instagram.com/p/DV8xzwckU-I/" },
                    { text: "第七屆 資戰無界", url: "https://www.instagram.com/p/DUaRcOGk6WK/" },
                ]
            }
        };

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
});
