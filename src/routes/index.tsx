import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Runner, type GameState } from "@/game/engine";
import { playSfx, startMusic, stopMusic } from "@/game/audio";
import runImg from "@/assets/smarty-run.png";
import run2Img from "@/assets/smarty-run2.png";
import wave2Img from "@/assets/smarty-wave2.png";
import sad2Img from "@/assets/smarty-sad2.png";
import jumpImg from "@/assets/smarty-jump.png";
import sadImg from "@/assets/smarty-sad.png";
import wave from "@/assets/smarty-wave.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smarty the Kitten: Endless Run" },
      { name: "description", content: "Run, jump and collect fish treats with Smarty the Kitten in this cute endless runner." },
      { property: "og:title", content: "Smarty the Kitten: Endless Run" },
      { property: "og:description", content: "Run, jump and collect fish treats with Smarty the Kitten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runner = useRef<Runner | null>(null);
  const [state, setState] = useState<GameState | "loading" | "error">("loading");
  const [hud, setHud] = useState({ score: 0, fish: 0, lives: 3 });
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const [music, setMusic] = useState(true);
  const [sfx, setSfx] = useState(true);
  const sfxRef = useRef(true);
  sfxRef.current = sfx;

  useEffect(() => {
    setBest(Number(localStorage.getItem("smarty-best") || 0));
    const s = localStorage.getItem("smarty-sound");
    if (s) { const v = JSON.parse(s); setMusic(v.music); setSfx(v.sfx); }
  }, []);

  useEffect(() => {
    localStorage.setItem("smarty-sound", JSON.stringify({ music, sfx }));
    if (!music || state !== "playing") stopMusic();
    else startMusic();
  }, [music, sfx, state]);

  useEffect(() => {
    let r: Runner | null = null;
    Promise.all([loadImg(runImg), loadImg(run2Img), loadImg(jumpImg), loadImg(wave2Img), loadImg(sadImg), loadImg(sad2Img)])
      .then(([a, a2, b]) => {
        if (!canvasRef.current) return;
        r = new Runner(canvasRef.current, a!, a2!, b!, {
          onScore: (score, fish, lives) => setHud((h) => (h.score === score && h.fish === fish && h.lives === lives ? h : { score, fish, lives })),
          onOver: (score) => {
            setState("over");
            if (sfxRef.current) playSfx("over");
            const prev = Number(localStorage.getItem("smarty-best") || 0);
            setNewBest(score > prev);
            if (score > prev) { localStorage.setItem("smarty-best", String(score)); setBest(score); }
          },
          sfx: (n) => sfxRef.current && playSfx(n),
        });
        runner.current = r;
        setState("ready");
      })
      .catch(() => setState("error"));
    return () => { r?.destroy(); stopMusic(); };
  }, []);

  const start = () => { runner.current?.start(); setNewBest(false); setState("playing"); };
  const pause = () => { runner.current?.togglePause(); setState(runner.current!.state); };
  const jump = () => runner.current?.doJump();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = runner.current;
      if (!r) return;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        if (r.state === "playing") r.doJump();
        else if (r.state === "ready" || r.state === "over") start();
      }
      if (e.code === "Escape" || e.code === "KeyP") pause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="game-shell">
      <div className="game-frame">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          onPointerDown={(e) => { e.preventDefault(); if (state === "playing") jump(); }}
        />

        {state === "playing" || state === "paused" ? (
          <div className="hud">
            <span className="pill">⭐ {hud.score}</span>
            <span className="pill">🐟 {hud.fish}</span>
            <span className="pill">{"❤️".repeat(Math.max(0, hud.lives))}</span>
            <button className="pill pill-btn ml-auto" onClick={pause} aria-label="Pause">⏸</button>
          </div>
        ) : null}

        {state === "playing" && (
          <button className="jump-btn" onPointerDown={(e) => { e.preventDefault(); jump(); }} aria-label="Jump">
            Jump
          </button>
        )}

        {state === "loading" && <Overlay><p className="title-sm">Loading Smarty…</p></Overlay>}
        {state === "error" && <Overlay><p className="title-sm">Oops, Smarty couldn't load. Please refresh.</p></Overlay>}

        {state === "ready" && (
          <Overlay>
            <FlipBook frames={[wave.url, wave2Img]} ms={450} alt="Smarty waving" className="kitten-still" />
            <h1 className="title">Smarty the Kitten</h1>
            <p className="subtitle">Endless Run</p>
            <button className="btn-play" onClick={start}>Play</button>
            <p className="hint">Space / tap to jump · tap twice for a double jump · Esc to pause</p>
            <p className="hint">Best: {best}</p>
            <Sound music={music} sfx={sfx} setMusic={setMusic} setSfx={setSfx} />
          </Overlay>
        )}

        {state === "paused" && (
          <Overlay>
            <h2 className="title-sm">Paused</h2>
            <button className="btn-play" onClick={pause}>Resume</button>
            <button className="btn-soft" onClick={start}>Restart</button>
            <button className="btn-soft" onClick={() => { runner.current!.state = "ready"; setState("ready"); }}>Main menu</button>
            <Sound music={music} sfx={sfx} setMusic={setMusic} setSfx={setSfx} />
          </Overlay>
        )}

        {state === "over" && (
          <Overlay>
            <FlipBook frames={[sadImg, sad2Img]} ms={700} alt="Sad Smarty" className="kitten-still" />
            <h2 className="title-sm">Oh no, Smarty bumped!</h2>
            <p className="subtitle">Score {hud.score} · 🐟 {hud.fish}</p>
            <p className="hint">{newBest ? "🎉 New best score!" : `Best: ${best}`}</p>
            <button className="btn-play" onClick={start}>Play again</button>
            <button className="btn-soft" onClick={() => { runner.current!.state = "ready"; setState("ready"); }}>Main menu</button>
          </Overlay>
        )}
      </div>
    </main>
  );
}

function FlipBook({ frames, ms, alt, className }: { frames: string[]; ms: number; alt: string; className: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % frames.length), ms);
    return () => clearInterval(id);
  }, [frames.length, ms]);
  return <img src={frames[i]} alt={alt} className={className} />;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="overlay"><div className="panel">{children}</div></div>;
}

function Sound(p: { music: boolean; sfx: boolean; setMusic: (v: boolean) => void; setSfx: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      <button className="btn-toggle" data-on={p.music} onClick={() => p.setMusic(!p.music)}>🎵 Music {p.music ? "on" : "off"}</button>
      <button className="btn-toggle" data-on={p.sfx} onClick={() => p.setSfx(!p.sfx)}>🔊 Sounds {p.sfx ? "on" : "off"}</button>
    </div>
  );
}
