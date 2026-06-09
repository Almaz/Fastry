(function() {
  'use strict';
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var particles = [];
  var particleCount = 140;

  var mouseX = null;
  var mouseY = null;
  var mouseRadius = 150;

  function isDark() {
    return document.documentElement.classList.contains('dark');
  }

  function getColors() {
    if (isDark()) {
      return {
        bgFill: 'rgba(10, 10, 18, 0.18)',
        gradStops: [
          { pos: 0, color: 'hsla(260, 75%, 12%, 0.35)' },
          { pos: 0.6, color: 'hsla(210, 80%, 18%, 0.45)' },
          { pos: 1, color: 'rgba(5, 5, 12, 0.7)' },
        ],
        lineColor: 'rgba(139, 92, 246, ',
        particleColors: [
          'rgba(139, 92, 246, ',
          'rgba(59, 130, 246, ',
          'rgba(168, 85, 247, ',
          'rgba(96, 165, 250, ',
          'rgba(192, 132, 252, ',
        ],
        waveColor: 'rgba(139, 92, 246, 0.05)',
      };
    } else {
      return {
        bgFill: 'rgba(255, 255, 255, 0.25)',
        gradStops: [
          { pos: 0, color: 'hsla(260, 40%, 92%, 0.5)' },
          { pos: 0.6, color: 'hsla(210, 45%, 90%, 0.5)' },
          { pos: 1, color: 'rgba(240, 240, 250, 0.6)' },
        ],
        lineColor: 'rgba(139, 92, 246, ',
        particleColors: [
          'rgba(139, 92, 246, ',
          'rgba(59, 130, 246, ',
          'rgba(168, 85, 247, ',
          'rgba(96, 165, 250, ',
          'rgba(192, 132, 252, ',
        ],
        waveColor: 'rgba(139, 92, 246, 0.04)',
      };
    }
  }

  var colors = getColors();

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function initParticles() {
    particles = [];
    for (var i = 0; i < particleCount; i++) {
      var baseSize = randomRange(0.5, 1.7);
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: baseSize,
        alpha: randomRange(0.3, 0.85),
        colorIndex: Math.floor(Math.random() * colors.particleColors.length),
        pulseSpeed: randomRange(0.005, 0.02),
        pulsePhase: Math.random() * Math.PI * 2,
        originalSize: baseSize,
      });
    }
  }

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initParticles();
  }

  function updateParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      if (mouseX !== null && mouseY !== null) {
        var dx = mouseX - p.x;
        var dy = mouseY - p.y;
        var dist = Math.hypot(dx, dy);
        if (dist < mouseRadius) {
          var force = (1 - dist / mouseRadius) * 0.015;
          p.vx += dx * force;
          p.vy += dy * force;
        }
      }

      p.vx += (Math.random() - 0.5) * 0.08;
      p.vy += (Math.random() - 0.5) * 0.08;

      var maxSpeed = 1.3;
      if (Math.abs(p.vx) > maxSpeed) p.vx *= 0.95;
      if (Math.abs(p.vy) > maxSpeed) p.vy *= 0.95;

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = 0; p.vx *= -0.7; }
      if (p.x > width) { p.x = width; p.vx *= -0.7; }
      if (p.y < 0) { p.y = 0; p.vy *= -0.7; }
      if (p.y > height) { p.y = height; p.vy *= -0.7; }

      var pulse = Math.sin(Date.now() * p.pulseSpeed + p.pulsePhase) * 0.3;
      p.size = Math.max(0.5, p.originalSize + pulse);
    }
  }

  function draw() {
    colors = getColors();

    ctx.fillStyle = colors.bgFill;
    ctx.fillRect(0, 0, width, height);

    var grad = ctx.createLinearGradient(0, 0, width * 0.6, height);
    var timeGrad = Date.now() * 0.0015;
    var hue1 = (Math.sin(timeGrad) * 20 + 260) % 360;
    var hue2 = (Math.sin(timeGrad + 2.2) * 20 + 210) % 360;

    if (isDark()) {
      grad.addColorStop(0, 'hsla(' + hue1 + ', 75%, 12%, 0.35)');
      grad.addColorStop(0.6, 'hsla(' + hue2 + ', 80%, 18%, 0.45)');
      grad.addColorStop(1, 'rgba(5, 5, 12, 0.7)');
    } else {
      grad.addColorStop(0, 'hsla(' + hue1 + ', 40%, 92%, 0.5)');
      grad.addColorStop(0.6, 'hsla(' + hue2 + ', 45%, 90%, 0.5)');
      grad.addColorStop(1, 'rgba(240, 240, 250, 0.6)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    var particleColors = colors.particleColors;
    var lineColor = colors.lineColor;

    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var p1 = particles[i];
        var p2 = particles[j];
        var dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        var maxDist = 120;
        if (dist < maxDist) {
          var opacity = (1 - dist / maxDist) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = lineColor + (opacity * 0.8) + ')';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var color = particleColors[p.colorIndex];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      var radGrad = ctx.createRadialGradient(p.x - 1, p.y - 1, 0.5, p.x, p.y, p.size * 1.5);
      radGrad.addColorStop(0, color + Math.min(1, p.alpha + 0.3) + ')');
      radGrad.addColorStop(0.9, color + (p.alpha * 0.6) + ')');
      ctx.fillStyle = radGrad;
      ctx.fill();

      ctx.shadowBlur = 6;
      ctx.shadowColor = color + '0.6)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 8; i++) {
      var waveX = width * 0.5 + Math.sin(Date.now() * 0.0008 + i) * width * 0.2;
      var waveY = height * 0.6 + Math.cos(Date.now() * 0.0005 + i * 1.2) * height * 0.1;
      var gradient = ctx.createRadialGradient(waveX, waveY, 20, waveX + 5, waveY - 5, 150);
      gradient.addColorStop(0, colors.waveColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
  function handleMouseLeave() {
    mouseX = null;
    mouseY = null;
  }
  function handleTouchMove(e) {
    if (e.touches.length) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }
  function handleTouchEnd() {
    mouseX = null;
    mouseY = null;
  }

  function animate() {
    updateParticles();
    draw();
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd);

  resizeCanvas();
  animate();
})();