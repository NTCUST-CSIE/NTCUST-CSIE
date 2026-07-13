document.addEventListener('DOMContentLoaded', () => {
    const eventModal = document.getElementById('eventModal');
    const eventsContainer = document.getElementById('events-container');

    if (!eventModal || !eventsContainer) return;

    const eModalClose = eventModal.querySelector('.modal-close');
    const eModalTitle = document.getElementById('eventModalTitle');
    const eModalDesc = document.getElementById('eventModalDesc');
    const eModalLinks = document.getElementById('eventModalLinks');
    const eModalImage = document.getElementById('eventModalImage');
    const eModalGrid = document.querySelector('.event-modal-grid');

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
        
        const eventKeys = Object.keys(data);
        if (eventKeys.length === 0) {
            eventsContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); grid-column:1/-1;">目前沒有近期活動。</p>';
            return;
        }

        eventKeys.forEach(key => {
            const ev = data[key];
            const imageUrl = ev.image ? ev.image : './img/event_nopng.png';

            const cardHtml = `
                <div class="event-card glass-card">
                    <div class="event-image">
                        <img src="${imageUrl}" alt="${ev.title}" loading="lazy">
                    </div>
                    <div class="event-info">
                        <h3>${ev.title}</h3>
                        <a href="javascript:void(0)" class="btn btn-outline event-btn" data-event="${key}">查看詳情</a>
                    </div>
                </div>
            `;
            eventsContainer.innerHTML += cardHtml;
        });
    }

    function bindModalEvents() {
        const eventTriggers = document.querySelectorAll('.event-btn');
        
        eventTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const eventId = e.target.getAttribute('data-event');
                const data = eventData[eventId];
                
                if (data) {
                    eModalTitle.textContent = data.title;
                    eModalDesc.textContent = data.desc;
                    
                    if(eModalImage) {
                        const imgSrc = data.image ? data.image : './img/event_nopng.png';
                        eModalImage.src = imgSrc;
                        eModalImage.removeAttribute('data-fallback-applied');
                        
                        const imageContainer = eModalImage.closest('.event-modal-image-container');
                        if (imgSrc.includes('nopng.png')) {
                            if (imageContainer) imageContainer.style.display = 'none';
                        } else {
                            if (imageContainer) imageContainer.style.display = 'block';
                        }
                    }
                    
                    eModalLinks.innerHTML = '';
                    
                    const validLinks = (data.links || []).filter(link => link.text && link.url);
                    const rightPanel = eModalLinks.closest('.event-modal-right');
                    
                    if (validLinks.length > 0) {
                        if (eModalGrid) eModalGrid.classList.remove('no-links');
                        if (rightPanel) rightPanel.style.display = 'block';
                        validLinks.forEach(link => {
                            const li = document.createElement('li');
                            li.innerHTML = `<a href="${link.url}" target="_blank" rel="noopener noreferrer"><i class="ph-bold ph-link"></i> ${link.text}</a>`;
                            eModalLinks.appendChild(li);
                        });
                    } else {
                        if (eModalGrid) eModalGrid.classList.add('no-links');
                        if (rightPanel) rightPanel.style.display = 'none';
                    }
                    
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
