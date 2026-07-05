document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    // Randomly select between "cyber" and "particles"
    const availableAnims = ["cyber", "particles"];
    let currentAnim = availableAnims[Math.floor(Math.random() * availableAnims.length)];
    let animFrame;
    let resizeTimeout;
    
    // Colors
    let pColor = '148, 163, 184';
    let lColor = '203, 213, 225';
    let brandColor = '59, 130, 246';
    
    const hexToRgb = (hex) => {
        if (!hex || typeof hex !== 'string') return '59, 130, 246';
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
        if (hex.length !== 6) return '59, 130, 246';
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return isNaN(r) ? '59, 130, 246' : `${r}, ${g}, ${b}`;
    };
    
    const updateColors = () => {
        const style = getComputedStyle(document.documentElement);
        pColor = style.getPropertyValue('--particle-color').trim() || '148, 163, 184';
        lColor = style.getPropertyValue('--particle-line-color').trim() || '203, 213, 225';
        let hexBrand = style.getPropertyValue('--color-brand-primary').trim();
        brandColor = hexToRgb(hexBrand);
    };
    updateColors();
    
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    // Resize
    const resizeCanvas = () => {
        if(canvas.parentElement) {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    };
    
    // Mouse interaction
    let mouse = { x: -1000, y: -1000, radius: 150 };
    window.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    window.addEventListener("mouseout", () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // ----------------------------------------------------
    // ANIMATION: Cyber Data Flow (Original Restored & Enhanced)
    // ----------------------------------------------------
    class CyberNode {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.active = 0;
        }
        draw() {
            if(this.active > 0) this.active -= 0.02;
            
            // Nodes use brand color, base opacity 0.15, glows when active
            ctx.fillStyle = `rgba(${brandColor}, ${0.15 + this.active})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2 + this.active * 3, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    let cyberNodes = [];
    const initCyber = () => {
        cyberNodes = [];
        const cols = Math.floor(canvas.width / 50);
        const rows = Math.floor(canvas.height / 50);
        for(let i=0; i<cols; i++) {
            for(let j=0; j<rows; j++) {
                cyberNodes.push(new CyberNode(i*50 + 25, j*50 + 25));
            }
        }
    };
    
    const drawCyber = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if(Math.random() < 0.1 && cyberNodes.length > 0) {
            const node = cyberNodes[Math.floor(Math.random() * cyberNodes.length)];
            node.active = 1;
        }
        
        // Use brand color for grid lines so they are clearly visible
        // Increased opacity to make the grid more prominent
        ctx.strokeStyle = `rgba(${brandColor}, 0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x=25; x<canvas.width; x+=50) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        }
        for(let y=25; y<canvas.height; y+=50) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
        
        cyberNodes.forEach(node => node.draw());
        
        let mouseNodeDist = Infinity;
        let closestNode = null;
        cyberNodes.forEach(node => {
            let dist = Math.hypot(node.x - mouse.x, node.y - mouse.y);
            if(dist < mouseNodeDist) {
                mouseNodeDist = dist;
                closestNode = node;
            }
        });
        if(closestNode && mouseNodeDist < 100) {
            closestNode.active = 1;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${brandColor}, 0.8)`;
            ctx.moveTo(closestNode.x, closestNode.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
    };

    // ----------------------------------------------------
    // ANIMATION: Retro Particles
    // ----------------------------------------------------
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
        draw() {
            ctx.fillStyle = `rgba(${pColor}, 0.8)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    let retroParticles = [];
    const initParticles = () => {
        retroParticles = [];
        let numP = window.innerWidth < 768 ? 40 : 80;
        for (let i = 0; i < numP; i++) retroParticles.push(new Particle());
    };
    
    const drawParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        retroParticles.forEach(p => { p.update(); p.draw(); });
        
        for (let a = 0; a < retroParticles.length; a++) {
            for (let b = a; b < retroParticles.length; b++) {
                let dx = retroParticles[a].x - retroParticles[b].x;
                let dy = retroParticles[a].y - retroParticles[b].y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    // Increased line visibility from 0.5 to 0.8 multiplier
                    ctx.strokeStyle = `rgba(${lColor}, ${(1 - dist/120) * 0.8})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(retroParticles[a].x, retroParticles[a].y);
                    ctx.lineTo(retroParticles[b].x, retroParticles[b].y);
                    ctx.stroke();
                }
            }
            if (mouse.x > 0) {
                let dx = retroParticles[a].x - mouse.x;
                let dy = retroParticles[a].y - mouse.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    // Increased line visibility for mouse connections
                    ctx.strokeStyle = `rgba(${lColor}, ${(1 - dist/150) * 1.0})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(retroParticles[a].x, retroParticles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    };

    // ----------------------------------------------------
    // Main Loop
    // ----------------------------------------------------
    const animate = () => {
        if(currentAnim === "cyber") drawCyber();
        else drawParticles();
        
        animFrame = requestAnimationFrame(animate);
    };

    // Initialization
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            if(currentAnim === "cyber") initCyber();
            else initParticles();
        }, 100);
    });
    
    resizeCanvas();
    if(currentAnim === "cyber") initCyber();
    else initParticles();
    animate();
});
