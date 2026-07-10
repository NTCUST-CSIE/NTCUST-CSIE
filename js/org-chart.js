document.addEventListener('DOMContentLoaded', () => {
    const orgTree = document.getElementById('index-org-tree');
    if (!orgTree) return;

    fetch('data/members.json')
        .then(response => {
            if (!response.ok) throw new Error('無法載入成員資料');
            return response.json();
        })
        .then(departments => {
            let topLevelHtml = '';
            let bottomLevelHtml = '';

            // Process President Dept
            const presDept = departments.find(d => d.id === 'dept-president');
            if (presDept) {
                const presVp = presDept.members
                    .filter(m => m.title.includes('會長'))
                    .map(m => m.name)
                    .join('・');
                
                const execSec = presDept.members
                    .filter(m => m.title.includes('秘書'))
                    .map(m => m.name)
                    .join('・');

                topLevelHtml = `
                    <div class="org-level top-level">
                        <div class="top-level-wrapper">
                            <div class="org-node-wrapper">
                                <a href="members.html#dept-president" class="org-node glass-card">
                                    <span class="node-title">會長 / 副會長</span>
                                    <span class="node-name">${presVp}</span>
                                </a>
                            </div>
                            <div class="side-connector"></div>
                            <div class="org-node-wrapper side-node-wrapper">
                                <a href="members.html#dept-president" class="org-node glass-card side-node">
                                    <span class="node-title">執行秘書</span>
                                    <span class="node-name">${execSec}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Process other Depts
            const otherDepts = departments.filter(d => d.id !== 'dept-president');
            if (otherDepts.length > 0) {
                bottomLevelHtml = '<div class="org-level bottom-level">';
                otherDepts.forEach(dept => {
                    const membersStr = dept.members.map(m => m.name).join('・');
                    bottomLevelHtml += `
                        <div class="org-node-wrapper">
                            <a href="members.html#${dept.id}" class="org-node glass-card">
                                <span class="node-title">${dept.departmentTitle}</span>
                                <span class="node-name">${membersStr}</span>
                            </a>
                        </div>
                    `;
                });
                bottomLevelHtml += '</div>';
            }

            orgTree.innerHTML = topLevelHtml + bottomLevelHtml;

            // Re-trigger scroll reveal for newly added elements
            const revealElements = orgTree.querySelectorAll('.glass-card');
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
            checkReveal(); // Initial check
        })
        .catch(err => {
            console.error('載入首頁組織圖失敗:', err);
            orgTree.innerHTML = '<p style="text-align:center; color:var(--color-danger);">無法載入組織架構圖</p>';
        });
});
