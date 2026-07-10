document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('members-container');
    const modal = document.getElementById('memberModal');
    const modalClose = document.querySelector('.modal-close');
    const modalName = document.getElementById('modalName');
    const modalTitle = document.getElementById('modalTitle');
    const modalIntro = document.getElementById('modalIntro');
    const modalIcon = document.getElementById('modalIcon');

    if (!container) return;

    // 載入成員資料
    fetch('data/members.json')
        .then(response => {
            if (!response.ok) throw new Error('無法載入成員資料');
            return response.json();
        })
        .then(departments => {
            renderMembers(departments);
            bindModalEvents();
        })
        .catch(error => {
            console.error('載入 members.json 失敗:', error);
            container.innerHTML = '<p style="text-align:center; color:var(--color-danger);">無法載入成員資料，請稍後再試。</p>';
        });

    function renderMembers(departments) {
        let html = '';
        departments.forEach(dept => {
            html += `
                <div id="${dept.id}" class="department">
                    <h3 class="department-title">${dept.departmentTitle}</h3>
                    <div class="members-grid">
            `;
            dept.members.forEach(member => {
                html += `
                        <div class="member-card glass-card">
                            <div class="member-icon">
                                ${member.image ? `<img src="${member.image}" alt="${member.name} 的頭像">` : `<i class="ph-fill ph-user"></i>`}
                            </div>
                            <div class="member-name">${member.name}</div>
                            <div class="member-title">${member.title}</div>
                            <div class="hidden-intro" style="display: none;">${member.intro}</div>
                        </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        
        // 觸發 reveal 動畫效果
        const revealElements = container.querySelectorAll('.member-card');
        revealElements.forEach(el => el.classList.add('reveal'));
        
        const checkReveal = () => {
            const windowHeight = window.innerHeight;
            revealElements.forEach(el => {
                const elementTop = el.getBoundingClientRect().top;
                if (elementTop < windowHeight - 100) {
                    el.classList.add('active');
                }
            });
        };
        
        window.addEventListener('scroll', checkReveal);
        checkReveal(); // Check immediately on render
    }

    function bindModalEvents() {
        if (!modal) return;
        
        document.querySelectorAll('.member-card').forEach(card => {
            const introElem = card.querySelector('.hidden-intro');
            if (introElem) {
                const intro = introElem.innerHTML.trim();
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
});
