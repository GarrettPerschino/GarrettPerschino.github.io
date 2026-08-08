(() => {
  "use strict";

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const canvases = Array.from(document.querySelectorAll("[data-ambient-field]"));
  if (!canvases.length) return;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class AmbientField {
    constructor(canvas, index) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      if (!this.context) return;

      this.host = canvas.parentElement;
      this.palette = canvas.dataset.palette === "speed" ? "speed" : "labs";
      this.random = seededRandom(49021 + index * 991);
      this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
      this.rotation = { x: -0.14, y: 0.18 };
      this.time = 0;
      this.lastFrame = 0;
      this.frameRequest = 0;
      this.isVisible = !document.hidden;
      this.isReduced = Boolean(reduceMotion?.matches);
      this.points = [];
      this.width = 1;
      this.height = 1;
      this.dpr = 1;

      this.handlePointer = this.handlePointer.bind(this);
      this.handleVisibility = this.handleVisibility.bind(this);
      this.handleMotionChange = this.handleMotionChange.bind(this);
      this.render = this.render.bind(this);

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host);
      window.addEventListener("pointermove", this.handlePointer, { passive: true });
      document.addEventListener("visibilitychange", this.handleVisibility);
      reduceMotion?.addEventListener?.("change", this.handleMotionChange);

      this.resize();
      this.start();
    }

    createPoints() {
      const area = this.width * this.height;
      const target = clamp(Math.round(area / 15000), 34, 76);
      this.points = Array.from({ length: target }, (_, index) => ({
        x: (this.random() - 0.5) * 8.4,
        y: (this.random() - 0.5) * 5.2,
        z: (this.random() - 0.5) * 6.5,
        radius: 0.72 + this.random() * 1.7,
        accent: index % 11 === 0 || this.random() > 0.92,
        phase: this.random() * Math.PI * 2,
        speed: 0.18 + this.random() * 0.34
      }));
    }

    resize() {
      const rect = this.host.getBoundingClientRect();
      this.width = Math.max(1, Math.floor(rect.width));
      this.height = Math.max(1, Math.floor(rect.height));

      const rawDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const maxPixels = 1920 * 1080;
      const requestedPixels = this.width * rawDpr * this.height * rawDpr;
      const scale = requestedPixels > maxPixels ? Math.sqrt(maxPixels / requestedPixels) : 1;
      this.dpr = rawDpr * scale;

      const pixelWidth = Math.max(1, Math.floor(this.width * this.dpr));
      const pixelHeight = Math.max(1, Math.floor(this.height * this.dpr));
      if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
        this.canvas.width = pixelWidth;
        this.canvas.height = pixelHeight;
      }
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.createPoints();
      if (this.isReduced) this.draw(0);
    }

    handlePointer(event) {
      if (this.isReduced) return;
      const rect = this.host.getBoundingClientRect();
      if (event.clientY < rect.top - 120 || event.clientY > rect.bottom + 120) return;
      this.pointer.targetX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      this.pointer.targetY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
    }

    handleVisibility() {
      this.isVisible = !document.hidden;
      if (this.isVisible) this.start();
      else this.stop();
    }

    handleMotionChange(event) {
      this.isReduced = event.matches;
      if (this.isReduced) {
        this.stop();
        this.draw(0);
      } else {
        this.start();
      }
    }

    start() {
      if (!this.context || this.frameRequest || !this.isVisible || this.isReduced) return;
      this.lastFrame = performance.now();
      this.frameRequest = requestAnimationFrame(this.render);
    }

    stop() {
      if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
      this.frameRequest = 0;
    }

    render(now) {
      this.frameRequest = 0;
      if (!this.isVisible || this.isReduced) return;
      const delta = Math.min(40, now - this.lastFrame) / 1000;
      this.lastFrame = now;
      this.time += delta;
      this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.035;
      this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.035;
      this.draw(this.time);
      this.frameRequest = requestAnimationFrame(this.render);
    }

    project(point, time) {
      const drift = Math.sin(time * point.speed + point.phase) * 0.11;
      let x = point.x + drift;
      let y = point.y + Math.cos(time * point.speed * 0.8 + point.phase) * 0.08;
      let z = point.z;

      const rotY = this.rotation.y + this.pointer.x * 0.16 + time * 0.025;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const rotX = this.rotation.x - this.pointer.y * 0.09;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const camera = 8.8;
      const perspective = camera / (camera + z2 + 3.2);
      const scale = Math.min(this.width, this.height) * 0.115;
      return {
        x: this.width * 0.63 + x1 * scale * perspective + this.pointer.x * 12,
        y: this.height * 0.5 + y1 * scale * perspective + this.pointer.y * 7,
        z: z2,
        perspective,
        radius: point.radius * perspective,
        accent: point.accent
      };
    }

    draw(time) {
      const ctx = this.context;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.width, this.height);

      const projected = this.points.map((point) => this.project(point, time));
      const maxConnection = clamp(Math.min(this.width, this.height) * 0.17, 72, 132);

      for (let i = 0; i < projected.length; i += 1) {
        const a = projected[i];
        if (a.x < -60 || a.x > this.width + 60 || a.y < -60 || a.y > this.height + 60) continue;
        for (let j = i + 1; j < projected.length; j += 1) {
          const b = projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > maxConnection) continue;
          const depthAlpha = clamp((a.perspective + b.perspective) * 0.25, 0.08, 0.42);
          const alpha = (1 - distance / maxConnection) * depthAlpha;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.32})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }

      const accent = this.palette === "speed" ? "255,0,51" : "255,44,86";
      projected
        .sort((a, b) => a.z - b.z)
        .forEach((point) => {
          const alpha = clamp(point.perspective * 0.72, 0.16, 0.85);
          ctx.beginPath();
          ctx.arc(point.x, point.y, Math.max(0.65, point.radius), 0, Math.PI * 2);
          ctx.fillStyle = point.accent
            ? `rgba(${accent},${alpha})`
            : `rgba(245,247,250,${alpha * 0.78})`;
          ctx.fill();

          if (point.accent && point.radius > 1.1) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius * 4.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accent},${alpha * 0.055})`;
            ctx.fill();
          }
        });
    }
  }

  canvases.forEach((canvas, index) => new AmbientField(canvas, index));
})();
