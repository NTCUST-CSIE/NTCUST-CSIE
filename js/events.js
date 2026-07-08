document.addEventListener('DOMContentLoaded', () => {
    // Event Modal Logic
    const eventModal = document.getElementById('eventModal');
    if (eventModal) {
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
});
