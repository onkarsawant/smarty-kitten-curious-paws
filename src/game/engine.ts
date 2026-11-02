// Endless runner engine for Smarty the Kitten. Pure canvas, no deps.
export type GameState = "ready" | "playing" | "paused" | "over";

export interface Callbacks {
  onScore: (score: number, fish: number, lives: number) => void;
  onOver: (score: number, fish: number) => void;
  sfx: (name: "jump" | "land" | "fish" | "star" | "hit" | "meow") => void;
}

interface Thing {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: "box" | "puddle" | "yarn" | "fish" | "star";
  vx?: number;
  taken?: boolean;
  spin?: number;
}

interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }

const W = 960;
const H = 540;
const GROUND = 450;
const GRAVITY = 2600;
const JUMP_V = -1000;

export class Runner {
  ctx: CanvasRenderingContext2D;
  run: HTMLImageElement;
  jump: HTMLImageElement;
  cb: Callbacks;
  state: GameState = "ready";
  speed = 360;
  dist = 0;
  score = 0;
  fish = 0;
  lives = 3;
  y = GROUND;
  vy = 0;
  onGround = true;
  jumpsLeft = 2;
  invuln = 0;
  things: Thing[] = [];
  particles: Particle[] = [];
  spawnIn = 1.2;
  t = 0;
  clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 200, y: 40 + Math.random() * 120, s: 0.6 + Math.random() * 0.8 }));
  raf = 0;
  last = 0;

  constructor(canvas: HTMLCanvasElement, run: HTMLImageElement, jump: HTMLImageElement, cb: Callbacks) {
    canvas.width = W;
    canvas.height = H;
    this.ctx = canvas.getContext("2d")!;
    this.run = run;
    this.jump = jump;
    this.cb = cb;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() { cancelAnimationFrame(this.raf); }

  start() {
    Object.assign(this, { speed: 360, dist: 0, score: 0, fish: 0, lives: 3, y: GROUND, vy: 0, onGround: true, jumpsLeft: 2, invuln: 0, things: [], particles: [], spawnIn: 1.2 });
    this.state = "playing";
    this.cb.sfx("meow");
    this.cb.onScore(0, 0, 3);
  }

  togglePause() {
    if (this.state === "playing") this.state = "paused";
    else if (this.state === "paused") { this.state = "playing"; this.last = performance.now(); }
  }

  doJump() {
    if (this.state !== "playing" || this.jumpsLeft <= 0) return;
    this.vy = this.jumpsLeft === 2 ? JUMP_V : JUMP_V * 0.85;
    this.jumpsLeft--;
    this.onGround = false;
    this.cb.sfx("jump");
    this.burst(170, this.y, "#fff7e0", 6);
  }

  burst(x: number, y: number, color: string, n = 10) {
    for (let i = 0; i < n; i++)
      this.particles.push({ x, y, vx: (Math.random() - 0.5) * 400, vy: -Math.random() * 400, life: 0.6, color });
  }

  spawn() {
    const r = Math.random();
    const x = W + 60;
    const level = Math.min(1, this.dist / 30000);
    if (r < 0.35) this.things.push({ kind: "box", x, y: GROUND - 56, w: 56, h: 56 });
    else if (r < 0.55) this.things.push({ kind: "puddle", x, y: GROUND - 10, w: 110, h: 14 });
    else if (r < 0.55 + 0.2 * (0.4 + level)) this.things.push({ kind: "yarn", x, y: GROUND - 44, w: 44, h: 44, vx: 120, spin: 0 });
    else {
      // row/arc of fish
      const n = 4 + Math.floor(Math.random() * 3);
      const high = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const arc = high ? Math.sin((i / (n - 1)) * Math.PI) * 120 : 0;
        this.things.push({ kind: "fish", x: x + i * 54, y: GROUND - 90 - arc, w: 40, h: 24 });
      }
      if (Math.random() < 0.25) this.things.push({ kind: "star", x: x + n * 54 + 40, y: GROUND - 260, w: 36, h: 36 });
    }
    const gap = Math.max(0.55, 1.4 - level * 0.7) + Math.random() * 0.6;
    this.spawnIn = gap;
  }

  update(dt: number) {
    this.t += dt;
    for (const c of this.clouds) {
      c.x -= this.speed * 0.08 * c.s * dt;
      if (c.x < -200) { c.x = W + 100; c.y = 40 + Math.random() * 120; }
    }
    if (this.state !== "playing") return;

    this.speed = Math.min(900, this.speed + 9 * dt);
    this.dist += this.speed * dt;
    this.score = Math.floor(this.dist / 10) + this.fish * 10;

    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND) {
      if (!this.onGround) { this.cb.sfx("land"); this.burst(170, GROUND, "#e8d9b5", 5); }
      this.y = GROUND; this.vy = 0; this.onGround = true; this.jumpsLeft = 2;
    }
    if (this.invuln > 0) this.invuln -= dt;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) this.spawn();

    const px = 130, pw = 80, ph = 80, py = this.y - ph;
    for (const o of this.things) {
      o.x -= (this.speed + (o.vx ?? 0)) * dt;
      if (o.spin !== undefined) o.spin -= dt * 8;
      if (o.taken) continue;
      const pad = o.kind === "puddle" ? 18 : 10;
      const hit = px + pad < o.x + o.w && px + pw - pad > o.x && py + pad < o.y + o.h && py + ph > o.y + 4;
      if (!hit) continue;
      if (o.kind === "fish") { o.taken = true; this.fish++; this.cb.sfx("fish"); this.burst(o.x, o.y, "#7cc7f0", 8); }
      else if (o.kind === "star") { o.taken = true; this.fish += 5; this.cb.sfx("star"); this.burst(o.x, o.y, "#ffd34d", 16); }
      else if (this.invuln <= 0) {
        this.lives--; this.invuln = 1.5; this.cb.sfx("hit"); this.burst(px + 40, py + 40, "#ff8a8a", 14);
        if (this.lives <= 0) { this.state = "over"; this.cb.onOver(this.score, this.fish); }
      }
    }
    this.things = this.things.filter((o) => o.x > -150 && !(o.taken && (o.kind === "fish" || o.kind === "star")));
    this.cb.onScore(this.score, this.fish, this.lives);
  }

  draw() {
    const c = this.ctx;
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#bfe6ff"); sky.addColorStop(1, "#fff1d6");
    c.fillStyle = sky; c.fillRect(0, 0, W, H);

    // sun
    c.fillStyle = "#ffe08a"; c.beginPath(); c.arc(820, 90, 46, 0, Math.PI * 2); c.fill();

    for (const cl of this.clouds) {
      c.fillStyle = "rgba(255,255,255,0.9)";
      for (const [dx, dy, rx, ry] of [[0, 0, 50, 22], [30, -14, 34, 22], [-30, -6, 28, 18]]) {
        c.beginPath(); c.ellipse(cl.x + dx * cl.s, cl.y + dy * cl.s, rx * cl.s, ry * cl.s, 0, 0, Math.PI * 2); c.fill();
      }
    }

    // hills (parallax)
    const hill = (off: number, amp: number, base: number, color: string, k: number) => {
      c.fillStyle = color; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) c.lineTo(x, base - Math.sin((x + off * k) / 140) * amp - Math.sin((x + off * k) / 57) * amp * 0.3);
      c.lineTo(W, H); c.fill();
    };
    hill(this.dist, 30, 360, "#c8ebc0", 0.15);
    hill(this.dist, 22, 400, "#a9dda0", 0.35);

    // ground
    c.fillStyle = "#8fce7d"; c.fillRect(0, GROUND, W, 14);
    c.fillStyle = "#f2dcae"; c.fillRect(0, GROUND + 14, W, H - GROUND);
    // flowers on ground
    for (let i = 0; i < 14; i++) {
      const fx = ((i * 97 - this.dist) % W + W) % W;
      c.fillStyle = ["#ff9ec4", "#ffd34d", "#ffffff"][i % 3];
      c.beginPath(); c.arc(fx, GROUND + 4, 5, 0, Math.PI * 2); c.fill();
    }

    for (const o of this.things) this.drawThing(o);

    // kitten
    const blink = this.invuln > 0 && Math.floor(this.t * 12) % 2 === 0;
    if (!blink) {
      const img = this.onGround ? this.run : this.jump;
      const bob = this.onGround && this.state === "playing" ? Math.abs(Math.sin(this.t * 14)) * 6 : 0;
      const h = 112, w = h * (img.width / img.height || 0.75);
      c.save();
      c.translate(170, this.y - bob);
      if (this.onGround) c.rotate(Math.sin(this.t * 14) * 0.04);
      c.drawImage(img, -w / 2, -h + 8, w, h);
      c.restore();
    }

    for (const p of this.particles) {
      c.globalAlpha = Math.max(0, p.life / 0.6);
      c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, 5, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
  }

  drawThing(o: Thing) {
    const c = this.ctx;
    if (o.kind === "box") {
      c.fillStyle = "#d9a066"; c.fillRect(o.x, o.y, o.w, o.h);
      c.strokeStyle = "#a8703d"; c.lineWidth = 4; c.strokeRect(o.x + 2, o.y + 2, o.w - 4, o.h - 4);
      c.beginPath(); c.moveTo(o.x + o.w / 2, o.y); c.lineTo(o.x + o.w / 2, o.y + 18); c.stroke();
    } else if (o.kind === "puddle") {
      c.fillStyle = "#8ccdf0"; c.beginPath(); c.ellipse(o.x + o.w / 2, o.y + 8, o.w / 2, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.ellipse(o.x + o.w / 3, o.y + 5, 14, 3, 0, 0, Math.PI * 2); c.fill();
    } else if (o.kind === "yarn") {
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
      c.save(); c.translate(cx, cy); c.rotate(o.spin ?? 0);
      c.fillStyle = "#f58fb8"; c.beginPath(); c.arc(0, 0, o.w / 2, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#d6609a"; c.lineWidth = 3;
      for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 8, 0, o.w / 2 - 4, -1, 1); c.stroke(); }
      c.restore();
    } else if (o.kind === "fish") {
      const bob = Math.sin(this.t * 5 + o.x / 50) * 4;
      const cx = o.x + 18, cy = o.y + 12 + bob;
      c.fillStyle = "#5fb4e8"; c.beginPath(); c.ellipse(cx, cy, 18, 11, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(cx + 14, cy); c.lineTo(cx + 28, cy - 10); c.lineTo(cx + 28, cy + 10); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(cx - 9, cy - 3, 3, 0, Math.PI * 2); c.fill();
    } else if (o.kind === "star") {
      const cx = o.x + 18, cy = o.y + 18 + Math.sin(this.t * 4) * 6;
      c.fillStyle = "#ffd34d"; c.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 9 : 20, a = (i / 10) * Math.PI * 2 - Math.PI / 2 + this.t;
        c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      c.fill();
    }
  }

  loop(now: number) {
    const dt = Math.min(0.033, (now - (this.last || now)) / 1000);
    this.last = now;
    if (this.state !== "paused") {
      this.update(dt);
      for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt; }
      this.particles = this.particles.filter((p) => p.life > 0);
    }
    this.draw();
    this.raf = requestAnimationFrame(this.loop);
  }
}
