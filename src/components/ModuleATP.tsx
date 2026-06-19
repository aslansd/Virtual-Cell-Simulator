import React, { useEffect, useRef, useState } from 'react';
import { PlayfulGuide } from './PlayfulGuide';
import { RefreshCw, Zap, Flame, Wind } from 'lucide-react';

interface ProtonParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ATPParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

const CANVAS_W = 740;
const CANVAS_H = 340;
const INNER_MEMBRANE_Y = 160;

export const ModuleATP: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulation states
  const [protons, setProtons] = useState<ProtonParticle[]>([]);
  const [atps, setAtps] = useState<ATPParticle[]>([]);
  const [turbineAngle, setTurbineAngle] = useState<number>(0);
  const [turbineSpeed, setTurbineSpeed] = useState<number>(0); // RPM visual indicator
  const [atpSynthesizedCount, setAtpSynthesizedCount] = useState<number>(0);
  const [uncouplerLeaking, setUncouplerLeaking] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Initialize mitochondrial space
  const resetMitochondria = () => {
    setAtpSynthesizedCount(0);
    setTurbineSpeed(0);
    setTurbineAngle(0);
    setAtps([]);

    // Spawn initial protons: high density top, low density bottom
    const list: ProtonParticle[] = [];
    
    // Top side: Intermembrane space (15 protons)
    for (let i = 0; i < 20; i++) {
      list.push({
        id: `h-top-${i}-${Math.random()}`,
        x: 20 + Math.random() * (CANVAS_W - 40),
        y: 15 + Math.random() * (INNER_MEMBRANE_Y - 30),
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.8,
      });
    }

    // Bottom side: Matrix (5 protons)
    for (let i = 0; i < 4; i++) {
      list.push({
        id: `h-bot-${i}-${Math.random()}`,
        x: 20 + Math.random() * (CANVAS_W - 40),
        y: INNER_MEMBRANE_Y + 30 + Math.random() * (CANVAS_H - INNER_MEMBRANE_Y - 50),
        vx: (Math.random() - 0.5) * 1.8,
        vy: (Math.random() - 0.5) * 1.8,
      });
    }

    setProtons(list);
  };

  useEffect(() => {
    resetMitochondria();
  }, []);

  // Pump Protons manually (represents electron food delivery feeding NADH)
  const pumpProtonElectrons = () => {
    // Take 4 protons from bottom (matrix) and forcefully pump them up
    // Play sound/vibe
    setProtons((prev) => {
      let matrixHits = 0;
      return prev.map((p) => {
        if (p.y > INNER_MEMBRANE_Y && matrixHits < 4) {
          matrixHits++;
          return {
            ...p,
            y: INNER_MEMBRANE_Y - 25, // pump directly up!
            vy: -Math.abs(p.vy) - 0.8 // kick it faster upward
          };
        }
        return p;
      });
    });

    // Spawn 2 extra protons top as dietary nutrition bonus
    const extra: ProtonParticle[] = Array.from({ length: 3 }, (_, k) => ({
      id: `h-pump-${Date.now()}-${k}`,
      x: 30 + Math.random() * (CANVAS_W - 150),
      y: 20 + Math.random() * 60,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    }));
    setProtons((prev) => [...prev, ...extra]);
  };

  // Main system update loop
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;

    const tick = () => {
      // Rotate turbine speed decay
      setTurbineSpeed((prev) => Math.max(0, prev - 0.4));
      setTurbineAngle((prev) => prev + turbineSpeed * 0.05);

      // Update synthesized ATP drift
      setAtps((prev) => 
        prev
          .map((a) => ({
            ...a,
            x: a.x + a.vx,
            y: a.y + a.vy,
            alpha: a.alpha - 0.006 // fade out or stay
          }))
          .filter((a) => a.y < CANVAS_H && a.alpha > 0)
      );

      // Update Protons and Synthase logic
      setProtons((prev) => {
        const SynthaseX = CANVAS_W - 130; // Position of ATP Synthase
        const SynthaseRadius = 38;

        return prev.map((p) => {
          let nx = p.x + p.vx;
          let ny = p.y + p.vy;
          let nvx = p.vx;
          let nvy = p.vy;

          // Wall bounces
          if (nx < 6 || nx > CANVAS_W - 6) nvx = -p.vx;
          if (ny < 6 || ny > CANVAS_H - 10) nvy = -p.vy;

          // Membrane barrier collision (between y = INNER_MEMBRANE_Y - 10 and y = INNER_MEMBRANE_Y + 10)
          const isAtSynthase = Math.abs(nx - SynthaseX) < SynthaseRadius;
          const isLeakyRegion = uncouplerLeaking && nx < CANVAS_W - 200; // toxin uncoupling leak anywhere

          const wasTop = p.y < INNER_MEMBRANE_Y;
          const isTopNow = ny < INNER_MEMBRANE_Y;
          const crossed = wasTop !== isTopNow;

          if (crossed) {
            if (isAtSynthase) {
              // Proton pours down the ATP Synthase!
              if (wasTop) {
                // Flowing top to bottom drives the energy wheel!
                // Increase speed!
                setTurbineSpeed((speed) => Math.min(35, speed + 7.5));
                
                // Synthesize 1 ATP coin physically!
                setAtpSynthesizedCount((c) => c + 1);
                setAtps((prevAtps) => [
                  ...prevAtps,
                  {
                    id: `atp-${Date.now()}-${Math.random()}`,
                    x: SynthaseX + (Math.random() - 0.5) * 15,
                    y: INNER_MEMBRANE_Y + 50,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 1.2 + Math.random() * 0.8,
                    alpha: 1.0
                  }
                ]);
              }
              // Allow passage
            } 
            else if (isLeakyRegion) {
              // Leak through uncoupling pore directly, bypassing synthase!
              // Simply let it slide through without turbine rotation
            } 
            else {
              // Bounces off the membrane lipids!
              nvx = p.vx;
              nvy = -p.vy;
              ny = wasTop ? INNER_MEMBRANE_Y - 8 : INNER_MEMBRANE_Y + 8;
            }
          }

          return {
            ...p,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
          };
        });
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, turbineSpeed, uncouplerLeaking]);

  // Canvas render logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Systems graph paper lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
    }

    // Intermembrane Space top-half background (tinted slight amber)
    ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    ctx.fillRect(0, 0, CANVAS_W, INNER_MEMBRANE_Y);

    // Matrix bottom half (tinted deep purple-red mitochondrial environment)
    ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
    ctx.fillRect(0, INNER_MEMBRANE_Y, CANVAS_W, CANVAS_H - INNER_MEMBRANE_Y);

    // Render Lipids double boundary
    const lipidY1 = INNER_MEMBRANE_Y - 5;
    const lipidY2 = INNER_MEMBRANE_Y + 5;
    const spacing = 11;
    
    ctx.lineWidth = 1;
    
    const SynthaseX = CANVAS_W - 130;
    const SynthaseRadius = 40;

    for (let lx = 6; lx < CANVAS_W; lx += spacing) {
      // Don't draw membrane lipids where ATP Synthase is located
      if (Math.abs(lx - SynthaseX) < SynthaseRadius) continue;

      // Hydrophilic red-head circles
      ctx.beginPath();
      ctx.arc(lx, lipidY1, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fb7185'; // soft red pink
      ctx.fill();
      ctx.strokeStyle = '#e11d48';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(lx, lipidY2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw wiggle hydrophobic lipid feet
      ctx.beginPath();
      ctx.strokeStyle = '#ca8a04';
      ctx.moveTo(lx, lipidY1 + 4);
      ctx.lineTo(lx, INNER_MEMBRANE_Y);
      ctx.moveTo(lx, lipidY2 - 4);
      ctx.lineTo(lx, INNER_MEMBRANE_Y);
      ctx.stroke();

      // If leaking toxin mode, draw tiny glowing orange leak pores along the membrane
      if (uncouplerLeaking && lx % 66 === 0) {
        ctx.fillStyle = '#ea580c';
        ctx.strokeStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(lx, INNER_MEMBRANE_Y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Label spaces
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#b45309';
    ctx.fillText('🔋 TOP: INTERMEMBRANE PROTON SPACE (HIGH H+ CONCENTRATION)', 15, 20);
    ctx.fillStyle = '#be123c';
    ctx.fillText('⚙️ BOTTOM: MITOCHONDRIAL MATRIX (LOW H+ CONCENTRATION)', 15, CANVAS_H - 12);

    // Draw active ETC Complex pumps that glow and accept food electrons
    // We render 3 cute machine protein blocks
    const complexes = [120, 260, 400];
    for (const cx of complexes) {
      ctx.fillStyle = '#0ea5e9'; // blue trans-membrane proteins
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - 20, INNER_MEMBRANE_Y - 24, 40, 48, 8);
      ctx.fill();
      ctx.stroke();

      // Little dynamic visual indicators
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(cx, INNER_MEMBRANE_Y - 12, 3, 0, Math.PI * 2);
      ctx.fill();

      // draw upward flashing arrow indicating proton pumping
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, INNER_MEMBRANE_Y + 12);
      ctx.lineTo(cx, INNER_MEMBRANE_Y - 12);
      ctx.lineTo(cx - 4, INNER_MEMBRANE_Y - 8);
      ctx.moveTo(cx, INNER_MEMBRANE_Y - 12);
      ctx.lineTo(cx + 4, INNER_MEMBRANE_Y - 8);
      ctx.stroke();

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('ETC PUMP', cx - 21, INNER_MEMBRANE_Y - 28);
    }

    // Render ATP Synthase turbine mill at SynthaseX (CANVAS_W - 130)
    // Draw static funnel housing
    ctx.fillStyle = '#9333ea'; // violet synthase housing
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 3;
    
    // Left funnel bracket
    ctx.beginPath();
    ctx.moveTo(SynthaseX - 35, INNER_MEMBRANE_Y - 25);
    ctx.lineTo(SynthaseX - 15, INNER_MEMBRANE_Y + 15);
    ctx.lineTo(SynthaseX - 15, INNER_MEMBRANE_Y + 45);
    ctx.lineTo(SynthaseX - 35, INNER_MEMBRANE_Y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right funnel bracket
    ctx.beginPath();
    ctx.moveTo(SynthaseX + 35, INNER_MEMBRANE_Y - 25);
    ctx.lineTo(SynthaseX + 15, INNER_MEMBRANE_Y + 15);
    ctx.lineTo(SynthaseX + 15, INNER_MEMBRANE_Y + 45);
    ctx.lineTo(SynthaseX + 35, INNER_MEMBRANE_Y + 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw the spinning rotor turbine wheel inside
    ctx.save();
    ctx.translate(SynthaseX, INNER_MEMBRANE_Y + 28);
    ctx.rotate(turbineAngle);

    // Draw central spinning turbine peg
    ctx.fillStyle = '#d8b4fe';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw spinning watermill blades!
    ctx.strokeStyle = '#682773';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 6; i++) {
      const bladeAngle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(bladeAngle) * 23, Math.sin(bladeAngle) * 23);
      ctx.stroke();

      // little blade cups
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(Math.cos(bladeAngle) * 23, Math.sin(bladeAngle) * 23, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Label Synthase
    ctx.fillStyle = '#581c87';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('ATP SYNTHASE', SynthaseX - 34, INNER_MEMBRANE_Y - 32);
    ctx.fillText('TURBINE MILL', SynthaseX - 30, INNER_MEMBRANE_Y - 22);

    // Render Protons (yellow circles with plus signs)
    for (const p of protons) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.y < INNER_MEMBRANE_Y ? 5.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b'; // Gold
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#78350f';
      ctx.stroke();

      // Little + sign inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('+', p.x - 2.5, p.y + 2.5);
    }

    // Render synthesized physical ATP falling down
    for (const atp of atps) {
      ctx.save();
      ctx.globalAlpha = atp.alpha;

      // purple glowing bubble
      ctx.fillStyle = 'rgba(216, 180, 254, 0.9)';
      ctx.strokeStyle = '#701a75';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(atp.x, atp.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw gold star or energy label inside
      ctx.fillStyle = '#701a75';
      ctx.font = 'black 8px monospace';
      ctx.fillText('ATP', atp.x - 7, atp.y + 3);

      ctx.restore();
    }

    // Draw speed indicator light on bottom-right of synthase
    if (turbineSpeed > 2) {
      ctx.fillStyle = '#22c55e'; // green spinning indicator
      ctx.beginPath();
      ctx.arc(SynthaseX, INNER_MEMBRANE_Y + 70, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '9px monospace';
      ctx.fillText(`✓ MILL ROTATING`, SynthaseX - 44, INNER_MEMBRANE_Y + 82);
    } else {
      ctx.fillStyle = '#ef4444'; // idle red
      ctx.beginPath();
      ctx.arc(SynthaseX, INNER_MEMBRANE_Y + 70, 4, 0, Math.PI * 2);
      ctx.fill();
    }

  }, [protons, atps, turbineAngle, turbineSpeed, uncouplerLeaking]);

  const countsTop = protons.filter((p) => p.y < INNER_MEMBRANE_Y).length;
  const countsBottom = protons.filter((p) => p.y >= INNER_MEMBRANE_Y).length;

  return (
    <div id="module-atp-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Simulation Screen (Left/Center) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Playable Canvas */}
        <div className="border-4 border-[#2d2b2a] rounded-2xl bg-[#fffdfa] shadow-[6px_6px_0px_#2d2b2a] relative overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#f3e8ff] px-4 py-2 border-b-4 border-[#2d2b2a] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 fill-purple-300 animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#2d2b2a]">MITOCHONDRIA ATP GENERATOR</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-purple-100 border-2 border-purple-600 px-3 py-0.5 rounded-full font-mono text-xs font-black text-[#2d2b2a] flex items-center gap-1">
                🔋 SYNTHESIZED: {atpSynthesizedCount} ATP
              </div>
            </div>
          </div>

          {/* Actual Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-auto block max-w-full"
            />
          </div>

          {/* Controls Box */}
          <div className="p-3 bg-slate-50 border-t-4 border-[#2d2b2a] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={pumpProtonElectrons}
                className="flex items-center gap-1 bg-[#fbbf24] border-2 border-[#2d2b2a] hover:bg-[#fca511] rounded-lg px-3 py-1.5 text-xs font-mono font-bold shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
              >
                <Flame className="w-4 h-4 text-yellow-800 fill-yellow-500 animate-pulse" /> FEED NADH ELECTRONS (Pump H⁺)
              </button>

              <button
                onClick={() => setUncouplerLeaking(!uncouplerLeaking)}
                className={`flex items-center gap-1 border-2 border-[#2d2b2a] rounded-lg px-3 py-1.5 text-xs font-[#2d2b2a] font-mono font-bold shadow-[2px_2px_0px_#2d2b2a] cursor-pointer ${
                  uncouplerLeaking ? 'bg-orange-400 text-white hover:bg-orange-300' : 'bg-white text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Wind className="w-4 h-4" /> 
                {uncouplerLeaking ? 'REMOVE LEAKS (RECOUPLE)' : 'INTRODUCE TOXIN LEAKS'}
              </button>
            </div>

            <button
              onClick={resetMitochondria}
              title="Reset factory"
              className="p-1.5 px-3 border-2 border-[#2d2b2a] bg-white rounded-lg hover:bg-slate-50 shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playful Celly Speech Guide */}
        <PlayfulGuide
          mood={uncouplerLeaking ? 'shriveled' : atpSynthesizedCount > 10 ? 'energetic' : 'happy'}
          title={uncouplerLeaking ? "⚠️ Mitochondrial Uncoupling!" : "🔬 The Microscopic Watermill"}
          speech={
            uncouplerLeaking 
              ? "Oh no! Toxins popped holes in our membrane! Look at those orange leaks: Protons are escaping back down directly through the fats, completely avoiding the Synthase Turbine! We have fuel but we aren't spinning any ATP!"
              : "Inside our mitochondria, there's a mini turbine! Food nutrition (NADH) delivers electrons to pump Protons (H⁺) up to the top space. When it locks and pours down the purple ATP Synthase, it spins the mill wheel to pack energy into ATP coins!"
          }
          hint={
            uncouplerLeaking 
              ? "Toxin leaking makes the cell burn energy like crazy while producing ZERO ATP (this is why uncoupling agents are highly fatal!). Turn OFF toxin leaks to restore power."
              : "Click 'FEED NADH ELECTRONS' repeatedly to build a high gold proton gradient at the top, then watch them pour down and spin the turbine wild!"
          }
        />
      </div>

      {/* Systems Data Panel (Right) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* RPM spinning display */}
        <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-4 shadow-[6px_6px_0px_#2d2b2a] text-center">
          <span className="font-mono text-xs font-bold text-slate-400 block uppercase mb-1">
            TURBINE TACO-METER
          </span>
          <div className="font-mono text-3xl font-black text-purple-800 flex items-center justify-center gap-1.5">
            <span className={turbineSpeed > 5 ? 'animate-spin' : ''}>⚙️</span>
            {Math.round(turbineSpeed * 315)} RPM
          </div>
          <p className="text-xs text-slate-500 mt-2 font-sans">
            Protons flowing down the gradient provide physical rotational torque to ATP Synthase!
          </p>
        </div>

        {/* ETC Systems Blueprint insights */}
        <div className="bg-[#fbfbfa] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a] flex-1">
          <h3 className="font-sans text-sm font-black text-[#2d2b2a] uppercase tracking-wider border-b-2 border-slate-200 pb-1.5 mb-2">
            🧬 How Metabolic Machinery Works
          </h3>
          
          <div className="font-sans text-xs text-[#52525b] leading-relaxed flex flex-col gap-2">
            <p>
              1. <strong>Feeding (Glycolysis & Krebs)</strong>: Candy glucose is converted to NADH, donating hot electrons to the three blue Electron Transport Chain (ETC) pumps shown.
            </p>
            <p>
              2. <strong>Building Gradient</strong>: The pumps use electron energy to pack acidic Protons ($H^+$) into the tiny Intermembrane space.
            </p>
            <p>
              3. <strong>Turbine Flow</strong>: This creates a heavy positive battery potential. Protons can only pour back down to the negative side through the **ATP Synthase rotor**.
            </p>
            <p>
              4. <strong>ATP synthesis</strong>: Squeezing of the rotating active site attaches Inorganic Phosphate to ADP, producing **ATP (Adenosine Triphosphate)**.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
