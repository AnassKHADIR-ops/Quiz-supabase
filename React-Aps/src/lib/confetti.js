// Lightweight, zero-dependency confetti animation
export function triggerConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const pieces = [];
  const colors = ["#4361ee", "#7c3aed", "#3a0ca3", "#4cc9f0", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 - 50,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 5,
      gravity: 0.35,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function update() {
    ctx.clearRect(0, 0, width, height);

    let active = false;
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;

      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 2.5) {
        p.opacity = Math.max(0, p.opacity - 0.03);
      }

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (active && Date.now() - startTime < 4500) {
      animationFrame = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrame);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  }

  animationFrame = requestAnimationFrame(update);
}
