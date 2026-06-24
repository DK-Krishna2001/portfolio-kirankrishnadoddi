// js/canvas.js
// High-performance 3D perspective data streams canvas background with cursor interactions

(function() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let particles = [];
  let width = 0;
  let height = 0;

  // Configuration variables
  const PARTICLE_SPEED_MIN = 0.5;
  const PARTICLE_SPEED_MAX = 1.8;
  const PARTICLE_SIZE_MIN = 0.8;
  const PARTICLE_SIZE_MAX = 2.5;
  const LINE_MAX_DISTANCE_3D = 180;
  
  // Camera angles for 3D rotation parallax
  let rotX = 0;
  let rotY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  // Mouse state
  let mouse = {
    x: null,
    y: null,
    radius: 180 // Screen connection radius
  };

  // Helper to fetch current theme colors from CSS variables dynamically
  function getThemeColors() {
    const style = getComputedStyle(document.documentElement);
    const primaryAccent = style.getPropertyValue('--color-accent').trim() || '#10b981';
    const secondaryAccent = style.getPropertyValue('--color-secondary').trim() || '#06b6d4';
    return { primaryAccent, secondaryAccent };
  }

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      // 3D coordinates relative to center of the coordinate space
      this.x = (Math.random() - 0.5) * width * 2.0;
      this.y = (Math.random() - 0.5) * height * 2.0;
      this.z = initial ? Math.random() * 1000 : 1000;
      
      this.baseSize = Math.random() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN) + PARTICLE_SIZE_MIN;
      
      // Velocities - move forward on Z axis (towards viewer) with slight drift on X/Y
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.vz = -(Math.random() * (PARTICLE_SPEED_MAX - PARTICLE_SPEED_MIN) + PARTICLE_SPEED_MIN);
      
      this.alpha = Math.random() * 0.5 + 0.2;
      this.isCyan = Math.random() > 0.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;

      // Reset when particle passes the camera (depth <= 0) or goes out of boundary
      if (this.z <= -150) {
        this.reset();
      }
    }
  }

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    const area = width * height;
    const particleDensity = 0.000045;
    const maxParticles = Math.min(100, Math.floor(area * particleDensity));

    particles = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Fetch dynamic colors to reflect accent customizer in real-time
    const currentColors = getThemeColors();

    // Smooth camera rotation rotation tracking
    rotX += (targetRotX - rotX) * 0.08;
    rotY += (targetRotY - rotY) * 0.08;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const projected = [];

    // 1. Update and Project particles into 2D screen space
    particles.forEach(p => {
      p.update();

      // Rotate around X-axis (Pitch)
      const y1 = p.y * cosX - p.z * sinX;
      const z1 = p.y * sinX + p.z * cosX;
      
      // Rotate around Y-axis (Yaw)
      const x2 = p.x * cosY + z1 * sinY;
      const z2 = -p.x * sinY + z1 * cosY;

      // 3D Perspective Projection
      const fov = 400;
      const scale = fov / (fov + z2);
      const screenX = x2 * scale + width / 2;
      const screenY = y1 * scale + height / 2;
      const size = p.baseSize * scale;

      // Calculate opacity based on Z depth (deeper = fainter)
      const depthAlpha = p.alpha * (1 - z2 / 1000);

      projected.push({
        origin: p,
        x: screenX,
        y: screenY,
        z: z2,
        size: size > 0.1 ? size : 0.1,
        alpha: depthAlpha > 0 ? depthAlpha : 0
      });
    });

    // 2. Draw Connections in 3D Space
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const p1 = projected[i];
        const p2 = projected[j];

        // 3D distance calculation
        const dx = p1.origin.x - p2.origin.x;
        const dy = p1.origin.y - p2.origin.y;
        const dz = p1.origin.z - p2.origin.z;
        const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist3D < LINE_MAX_DISTANCE_3D) {
          const force = (LINE_MAX_DISTANCE_3D - dist3D) / LINE_MAX_DISTANCE_3D;
          // Fade connection if it is deep in the coordinate space
          const avgZ = (p1.z + p2.z) / 2;
          const depthFade = 1 - (avgZ / 1000);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          
          ctx.strokeStyle = currentColors.secondaryAccent;
          ctx.globalAlpha = force * depthFade * 0.09;
          ctx.lineWidth = 0.5 * scaleThickness(avgZ);
          ctx.stroke();
        }
      }
    }

    // 3. Draw Active Cursor Connections in 2D Screen Space
    if (mouse.x !== null && mouse.y !== null) {
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const depthFade = 1 - (p.z / 1000);
          
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          
          ctx.strokeStyle = currentColors.primaryAccent;
          ctx.globalAlpha = force * depthFade * 0.18;
          ctx.lineWidth = 0.75 * scaleThickness(p.z);
          ctx.stroke();
        }
      }
    }

    // 4. Draw Projected Particles
    projected.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.origin.isCyan ? currentColors.secondaryAccent : currentColors.primaryAccent;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    
    // Reset globalAlpha to avoid leaks
    ctx.globalAlpha = 1.0;
    
    animationId = requestAnimationFrame(animate);
  }

  // Thickness helper based on depth
  function scaleThickness(z) {
    const minScale = 0.2;
    const maxScale = 1.0;
    return Math.max(minScale, maxScale * (1 - z / 1000));
  }

  // Event Listeners
  window.addEventListener('resize', resizeCanvas);
  
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Shift target rotation based on client position relative to window center
    targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 0.08;
    targetRotX = -((e.clientY / window.innerHeight) - 0.5) * 0.08;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
    targetRotX = 0;
    targetRotY = 0;
  });

  // Power Saver mode: Pause canvas animation if tab is hidden/inactive
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    } else {
      if (!animationId) {
        animate();
      }
    }
  });

  // Init
  resizeCanvas();
  animate();
})();
