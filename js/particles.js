document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("particle-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    
    let particles = [];
    let numParticles = window.innerWidth < 768 ? 40 : 80;
    
    // Color caching for performance (avoid getComputedStyle in animation loop)
    let pColor = '148, 163, 184';
    let lColor = '203, 213, 225';
    
    const updateColors = () => {
        const style = getComputedStyle(document.documentElement);
        pColor = style.getPropertyValue('--particle-color').trim();
        lColor = style.getPropertyValue('--particle-line-color').trim();
    };
    
    // Initial color grab
    updateColors();
    
    // Watch for theme changes to update colors dynamically
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    
    // Resize canvas
    const resizeCanvas = () => {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        // Re-calculate number of particles based on new size
        const targetParticles = window.innerWidth < 768 ? 40 : 80;
        if (numParticles !== targetParticles) {
            numParticles = targetParticles;
            initParticles();
        }
    };
    
    // Mouse interaction
    let mouse = { x: null, y: null, radius: 150 };
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });
    
    window.addEventListener("mouseout", () => {
        mouse.x = null;
        mouse.y = null;
    });
    
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
            
            // Bounce off edges
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }
        
        draw() {
            ctx.fillStyle = `rgba(${pColor}, 0.8)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    const initParticles = () => {
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    };
    
    const connectParticles = () => {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let dx = particles[a].x - particles[b].x;
                let dy = particles[a].y - particles[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    let opacity = 1 - (distance / 120);
                    ctx.strokeStyle = `rgba(${lColor}, ${opacity * 0.5})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
            
            // Mouse interaction
            if (mouse.x != null && mouse.y != null) {
                let dxMouse = particles[a].x - mouse.x;
                let dyMouse = particles[a].y - mouse.y;
                let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if (distanceMouse < mouse.radius) {
                    let opacity = 1 - (distanceMouse / mouse.radius);
                    // Mouse connections are slightly stronger
                    ctx.strokeStyle = `rgba(${lColor}, ${opacity * 0.8})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    };
    
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        
        connectParticles();
        requestAnimationFrame(animate);
    };
    
    window.addEventListener("resize", resizeCanvas);
    
    // Initialize
    resizeCanvas();
    initParticles();
    animate();
});
