document.addEventListener('DOMContentLoaded', () => {
    const eventModal = document.getElementById('eventModal');
    const eventsContainer = document.getElementById('events-container');

    if (!eventModal || !eventsContainer) return;

    const eModalClose = eventModal.querySelector('.modal-close');
    const eModalTitle = document.getElementById('eventModalTitle');
    const eModalDesc = document.getElementById('eventModalDesc');
    const eModalLinks = document.getElementById('eventModalLinks');

    let eventData = {};

    // 載入外部活動資料
    fetch('data/events.json')
        .then(response => {
            if (!response.ok) throw new Error('無法載入活動資料');
            return response.json();
        })
        .then(data => {
            eventData = data;
            renderEvents(data);
            bindModalEvents();
            initScrollReveal();
        })
        .catch(error => {
            console.error('載入 events.json 失敗:', error);
            eventsContainer.innerHTML = '<p style="text-align:center; color:var(--color-danger); grid-column:1/-1;">無法載入活動資料</p>';
        });

    function renderEvents(data) {
        eventsContainer.innerHTML = '';
        
        // 遍歷物件的 key 和 value
        Object.keys(data).forEach(eventId => {
            const ev = data[eventId];
            
            const imageUrl = ev.image ? ev.image : './img/nopng.png';

            const cardHtml = `
                <div class="event-card glass-card">
                    <div class="event-image">
                        <img src="${imageUrl}" alt="${ev.title}">
                    </div>
                    <div class="event-info">
                        <h3>${ev.title}</h3>
                        <a href="javascript:void(0)" class="btn btn-outline event-btn" data-event="${eventId}">查看詳情</a>
                    </div>
                </div>
            `;
            eventsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    function bindModalEvents() {
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
                        li.innerHTML = `<a href="${link.url}" target="_blank" rel="noopener noreferrer"><i class="ph-bold ph-link"></i> ${link.text}</a>`;
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

    function initScrollReveal() {
        const revealElements = eventsContainer.querySelectorAll('.event-card');
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
        checkReveal(); // 立即檢查一次確保第一個進入畫面的卡片會顯示
    }
});
