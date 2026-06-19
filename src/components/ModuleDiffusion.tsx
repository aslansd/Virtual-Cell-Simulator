import React, { useEffect, useRef, useState } from 'react';
import { Particle, Channel, MoleculeType } from '../types';
import { PlayfulGuide } from './PlayfulGuide';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MEMBRANE_Y, 
  LIPID_RADIUS, 
  createParticle, 
  updateParticlesPhysics, 
  getMoleculeCounts 
} from '../utils';
import { RefreshCw, Zap, PlusCircle, Trash2, ArrowRight } from 'lucide-react';

export const ModuleDiffusion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [atpCoins, setAtpCoins] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Initialize particles for step 0
  const resetModule = (activeStep: number) => {
    const list: Particle[] = [];
    
    if (activeStep === 0) {
      // Step 1: O2 outside, Glucose outside, nothing inside. Show they can't cross.
      // O2 passes easily, glucose bounces.
      for (let i = 0; i < 15; i++) {
        list.push(createParticle('O2', 'outside'));
      }
      for (let i = 0; i < 8; i++) {
        list.push(createParticle('Glucose', 'outside'));
      }
      setChannels([]);
    } else if (activeStep === 1) {
      // Step 2: Glucose Carrier channel exists!
      for (let i = 0; i < 15; i++) {
        list.push(createParticle('Glucose', 'outside'));
      }
      setChannels([
        { id: 'ch-1', type: 'GlucoseCarrier', x: CANVAS_WIDTH / 3, isOpen: true },
        { id: 'ch-2', type: 'GlucoseCarrier', x: (CANVAS_WIDTH * 2) / 3, isOpen: true }
      ]);
    } else if (activeStep === 2) {
      // Step 3: Active glucose pumps (requires ATP)
      // Cell wants to pack all glucose INSIDE
      for (let i = 0; i < 10; i++) {
        list.push(createParticle('Glucose', 'outside'));
      }
      for (let i = 0; i < 4; i++) {
        list.push(createParticle('Glucose', 'inside'));
      }
      setChannels([
        { id: 'ap-1', type: 'GlucoseActivePump', x: CANVAS_WIDTH / 2, isOpen: true }
      ]);
      setAtpCoins(5);
    }
    setParticles(list);
  };

  useEffect(() => {
    resetModule(step);
  }, [step]);

  // Main animation frame loop
  useEffect(() => {
    let animationFrameId: number;

    const tick = () => {
      if (isPlaying) {
        setParticles((prev) => {
          const { updatedParticles } = updateParticlesPhysics(
            prev,
            channels,
            () => {
              // Decrement ATP coin on active transport pump use
              setAtpCoins((prevCoins) => Math.max(0, prevCoins - 1));
            },
            () => {}
          );
          return updatedParticles;
        });
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, [channels, isPlaying]);

  // Draw Lipids, Membrane and Channels to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines for systems thinking blueprint paper aesthetic
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw cytoplasm tint bottom half
    ctx.fillStyle = 'rgba(219, 234, 254, 0.25)'; // very slight soft light blue
    ctx.fillRect(0, MEMBRANE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - MEMBRANE_Y);

    // Label Extracellular vs Cytoplasm
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('OUTSIDE OF CELL (EXTRACELLULAR FLUID)', 15, 25);
    ctx.fillText('INSIDE OF CELL (CYTOPLASM / INTRACELLULAR)', 15, CANVAS_HEIGHT - 15);

    // Draw Lipid Double Layer (excluding where channels are)
    const lipidSpacing = LIPID_RADIUS * 2 + 1.5;
    const lipidUpperY = MEMBRANE_Y - 5;
    const lipidLowerY = MEMBRANE_Y + 5;

    ctx.fillStyle = '#f87171'; // red heads
    ctx.lineWidth = 1.5;

    for (let lx = LIPID_RADIUS; lx < CANVAS_WIDTH; lx += lipidSpacing) {
      // Check if a channel covers this position
      const isChannelZone = channels.some((c) => Math.abs(lx - c.x) < 24);
      if (isChannelZone) continue;

      // Draw upper lipid head
      ctx.beginPath();
      ctx.arc(lx, lipidUpperY, LIPID_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5'; // light soft pink-red
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      // Draw lower lipid head
      ctx.beginPath();
      ctx.arc(lx, lipidLowerY, LIPID_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw Hydrophobic Tails (writhing slightly towards the center)
      const tailWiggle = Math.sin(Date.now() / 200 + lx / 40) * 1.5;
      ctx.strokeStyle = '#f59e0b'; // golden yellow hydrophobic tails

      // Upper tails going down
      ctx.beginPath();
      ctx.moveTo(lx - 2, lipidUpperY + LIPID_RADIUS);
      ctx.lineTo(lx - 2 + tailWiggle, MEMBRANE_Y);
      ctx.moveTo(lx + 2, lipidUpperY + LIPID_RADIUS);
      ctx.lineTo(lx + 2 - tailWiggle, MEMBRANE_Y);
      ctx.stroke();

      // Lower tails going up
      ctx.beginPath();
      ctx.moveTo(lx - 2, lipidLowerY - LIPID_RADIUS);
      ctx.lineTo(lx - 2 + tailWiggle, MEMBRANE_Y);
      ctx.moveTo(lx + 2, lipidLowerY - LIPID_RADIUS);
      ctx.lineTo(lx + 2 - tailWiggle, MEMBRANE_Y);
      ctx.stroke();
    }

    // Draw protein channels
    for (const ch of channels) {
      ctx.save();
      ctx.translate(ch.x, MEMBRANE_Y);

      if (ch.type === 'GlucoseCarrier') {
        // Draw open carrier gate styled container
        ctx.fillStyle = '#10b981'; // Green carrier
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#047857';

        // Draw left side bracket
        ctx.beginPath();
        ctx.moveTo(-16, -20);
        ctx.quadraticCurveTo(-22, 0, -16, 20);
        ctx.lineTo(-6, 20);
        ctx.quadraticCurveTo(-12, 0, -6, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw right side bracket
        ctx.beginPath();
        ctx.moveTo(16, -20);
        ctx.quadraticCurveTo(22, 0, 16, 20);
        ctx.lineTo(6, 20);
        ctx.quadraticCurveTo(12, 0, 6, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Label channel
        ctx.fillStyle = '#065f46';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('GLUCOSE', -20, -26);
        ctx.fillText('CARRIER', -18, -17);
      } 
      else if (ch.type === 'GlucoseActivePump') {
        // Draw violet pump (ATP driven)
        const isWorking = ch.activityTimer && ch.activityTimer > 0;
        ctx.fillStyle = isWorking ? '#c084fc' : '#8b5cf6'; // brighten purple when parsing
        ctx.strokeStyle = '#5b21b6';
        ctx.lineWidth = 3;

        // Draw structural barrel pump
        ctx.beginPath();
        ctx.arc(-13, 0, 10, Math.PI, Math.PI * 2);
        ctx.arc(13, 0, 10, Math.PI, Math.PI * 2, true);
        ctx.rect(-13, 0, 26, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ATP lightning slot indicator at the bottom
        ctx.fillStyle = isWorking ? '#fbbf24' : '#dac7fc';
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(3, 5);
        ctx.lineTo(-2, 12);
        ctx.lineTo(5, 12);
        ctx.lineTo(-3, 20);
        ctx.lineTo(0, 12);
        ctx.lineTo(-5, 12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#4c1d95';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('ACTIVE', -16, -26);
        ctx.fillText('PUMP', -13, -17);

        if (ch.activityTimer && ch.activityTimer > 0) {
          ch.activityTimer--;
        }
      }

      ctx.restore();
    }

    // Draw Particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2d2b2a';
      ctx.stroke();

      // Simple details (eyeballs/faces on glucose and O2 like Nicky Case)
      if (p.type === 'Glucose') {
        // Sweet pink cell wrapper
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - 2.5, p.y - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(p.x + 2.5, p.y - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(p.x - 2.5, p.y - 1, 0.7, 0, Math.PI * 2);
        ctx.arc(p.x + 2.5, p.y - 1, 0.7, 0, Math.PI * 2);
        ctx.fill();
        // Tiny mouth
        ctx.beginPath();
        ctx.arc(p.x, p.y + 2, 1.5, 0, Math.PI);
        ctx.stroke();
      } 
      else if (p.type === 'O2') {
        // Direct speedy oxygen circle face
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - 1.2, p.y - 1, 1.2, 0, Math.PI * 2);
        ctx.arc(p.x + 1.2, p.y - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 1, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [particles, channels]);

  // Handle manual additions
  const addMolecule = (type: MoleculeType, area: 'inside' | 'outside') => {
    setParticles((prev) => [...prev, createParticle(type, area)]);
  };

  const clearParticles = () => {
    setParticles([]);
  };

  const counts = getMoleculeCounts(particles);

  const stepsInfo = [
    {
      title: "Step 1: Simple Diffusion (Dissolving Gases)",
      speech: "Say hello to my outer skin, the lipid bilayer! It is made of fat. Tiny oxygen gas molecules (green) dissolve right through the greasy core! But look at those large pink glucose sugars: they are too polar and polar things bounce off fat!",
      hint: "Spawn more Glucose or Oxygen by clicking 'Add'. See how ONLY Oxygen (green) leaks directly through the lipid cells!"
    },
    {
      title: "Step 2: Facilitated Carriers (The Doorways)",
      speech: "Our sugar molecules are trapped! To let Glucose drift in, our cell must grow green 'Glucose Carrier' channels. These act as selective doors. But wait! Glucose only drifts from high to low concentration. This is passive transport!",
      hint: "Molecules naturally spread out to fill space evenly. Notice how they drift back and forth until the density inside equals outside (equilibrium)!"
    },
    {
      title: "Step 3: Pumps and Energy (Active Transport)",
      speech: "Sometimes we need EVERY drop of sugar inside the cell, even if it is crowded! To force sugars inside against the crowd, we use violet 'Active Pumps' powered by gold ATP coins. Pushing molecules into a crowd is active transport!",
      hint: "Make sure you have ATP coins. Watch the pump swallow a pink Glucose and drag it downwards when they touch! Click 'Spit ATP' to synthesize more energy coins."
    }
  ];

  return (
    <div id="module-diffusion-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Simulation Screen Wrapper (Left/Center) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {/* Playable Canvas Container with border */}
        <div className="border-4 border-[#2d2b2a] rounded-2xl bg-[#fffdfa] shadow-[6px_6px_0px_#2d2b2a] relative overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#fee2e2] px-4 py-2 border-b-4 border-[#2d2b2a] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#2d2b2a]" />
              <span className="font-mono text-xs font-bold text-[#2d2b2a]">LIPID MEMBRANE EXPERIMENT</span>
            </div>
            
            <div className="flex items-center gap-4">
              {step === 2 && (
                <div className="flex items-center gap-1.5 bg-[#fef9c3] border-2 border-[#eab308] px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#2d2b2a]">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-mono text-xs font-black text-[#2d2b2a]">{atpCoins} ATP</span>
                </div>
              )}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="font-mono text-xs font-bold border-2 border-[#2d2b2a] px-2 py-0.5 bg-white rounded hover:bg-slate-50 cursor-pointer shadow-[2px_2px_0px_#2d2b2a]"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
            </div>
          </div>

          {/* Actual Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto block max-w-full"
            />
          </div>

          {/* Quick Overlay Action Panel */}
          <div className="p-3 bg-slate-50 border-t-4 border-[#2d2b2a] flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => addMolecule('O2', 'outside')}
                className="flex items-center gap-1 bg-[#86efac] border-2 border-[#2d2b2a] hover:bg-[#a7f3d0] rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> + O₂ (Gas)
              </button>

              <button
                onClick={() => addMolecule('Glucose', 'outside')}
                className="flex items-center gap-1 bg-[#fbcfe8] border-2 border-[#2d2b2a] hover:bg-[#fce7f3] rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> + Glucose (Sugar)
              </button>

              {step === 2 && (
                <button
                  onClick={() => setAtpCoins((prev) => prev + 3)}
                  className="flex items-center gap-1 bg-[#fef08a] border-2 border-[#2d2b2a] hover:bg-[#fef9c3] rounded-lg px-2.5 py-1 text-xs font-mono font-bold shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> + 3 ATP Coins
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => resetModule(step)}
                title="Reset simulation"
                className="p-1 px-2.5 border-2 border-[#2d2b2a] hover:bg-slate-100 rounded-lg bg-white shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-700" />
              </button>
              <button
                onClick={clearParticles}
                title="Clears molecules"
                className="p-1 px-2.5 border-2 border-red-400 hover:bg-red-50 rounded-lg bg-white shadow-[2px_2px_0px_#ef4444] cursor-pointer flex items-center gap-1 font-mono text-xs font-bold text-red-600"
              >
                <Trash2 className="w-4 h-4 text-red-500" /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Celly Speech / Active Explorable Guide */}
        <PlayfulGuide
          mood={
            step === 0 
              ? 'happy' 
              : step === 1 
                ? 'happy' 
                : atpCoins === 0 ? 'starving' : 'energetic'
          }
          title={stepsInfo[step].title}
          speech={stepsInfo[step].speech}
          hint={stepsInfo[step].hint}
          showNavigation={true}
          onNext={step < 2 ? () => setStep(step + 1) : undefined}
          onPrev={step > 0 ? () => setStep(step - 1) : undefined}
          nextLabel="Next Concept"
          prevLabel="Back"
        />
      </div>

      {/* Systems Data Panel (Right Side) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a]">
          <h3 className="font-sans text-lg font-black text-[#2d2b2a] mb-3 pb-1.5 border-b-2 border-[#2d2b2a]/10 flex items-center gap-2">
            📊 Micro-Sensor Data
          </h3>

          <div className="flex flex-col gap-3">
            {/* O2 density */}
            <div className="bg-[#f0fdf4] border-2 border-[#22c55e] p-3 rounded-lg">
              <div className="flex justify-between font-mono text-xs font-bold text-[#15803d]">
                <span>O₂ inside: {counts.inside.O2}</span>
                <span>O₂ outside: {counts.outside.O2}</span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-[#2d2b2a]/10">
                <div 
                  className="bg-[#22c55e] h-2 transition-all duration-300"
                  style={{ 
                    width: `${counts.outside.O2 + counts.inside.O2 > 0 
                      ? (counts.inside.O2 / (counts.outside.O2 + counts.inside.O2)) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="font-sans text-[11px] text-[#166534] mt-1">
                {Math.abs(counts.inside.O2 - counts.outside.O2) <= 2
                  ? "✓ O₂ has reached dynamic equilibrum!"
                  : "O₂ is diffusing down gravity gradients."}
              </p>
            </div>

            {/* Glucose inside vs outside */}
            <div className="bg-[#fdf2f8] border-2 border-[#ec4899] p-3 rounded-lg">
              <div className="flex justify-between font-mono text-xs font-bold text-[#be185d]">
                <span>Glucose inside: {counts.inside.Glucose}</span>
                <span>Glucose outside: {counts.outside.Glucose}</span>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-[#2d2b2a]/10">
                <div 
                  className="bg-[#ec4899] h-2 transition-all duration-300"
                  style={{ 
                    width: `${counts.outside.Glucose + counts.inside.Glucose > 0 
                      ? (counts.inside.Glucose / (counts.outside.Glucose + counts.inside.Glucose)) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="font-sans text-[11px] text-[#9d174d] mt-1">
                {step === 0 
                  ? "❌ Lipids are blocking Glucose completely." 
                  : step === 1 
                    ? "✓ Glucose flows through passive door proteins." 
                    : "⚡ Pump is forcing Glucose against cellular crowd!"}
              </p>
            </div>
          </div>
        </div>

        {/* Explain the Concept / Lesson Deck */}
        <div className="bg-[#f8fafc] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a] flex-1">
          <h4 className="font-mono text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
            EXPLORABLE INSIGHT
          </h4>
          
          {step === 0 ? (
            <div className="font-sans text-sm text-[#475569] leading-relaxed flex flex-col gap-3">
              <p className="font-extrabold text-[#2d2b2a] text-base">Why does simple diffusion happen?</p>
              <p>
                Molecules are always vibrating and jumping randomly. Because of this, they migrate from 
                <strong> high crowds</strong> to <strong>low crowds</strong>.
              </p>
              <p className="bg-white p-2 rounded-lg border-2 border-[#2d2b2a]/10 italic font-mono text-xs">
                Since Membrane lipids are fats, small nonpolar gases look like lipids and slide right through. Huge sweet sugars get blocked by the lipid shield!
              </p>
            </div>
          ) : step === 1 ? (
            <div className="font-sans text-sm text-[#475569] leading-relaxed flex flex-col gap-3">
              <p className="font-extrabold text-[#2d2b2a] text-base">What is facilitated transport?</p>
              <p>
                Glucose cannot slide between lipids, but it finds structured tunnels called <strong>Carrier proteins</strong>.
              </p>
              <p>
                This process is <strong>passive</strong> because the cell doesn't pay any energy! Glucose simply slides down where it's less crowded automatically.
              </p>
            </div>
          ) : (
            <div className="font-sans text-sm text-[#475569] leading-relaxed flex flex-col gap-3">
              <p className="font-extrabold text-[#2d2b2a] text-base">Pumping Against the Crowd!</p>
              <p>
                What if the cell is already full of glucose, but there's a few sugars outside? The cell cannot wait for diffusion—diffusion would send sugars <em>out</em>!
              </p>
              <p>
                Instead, the cell consumes **ATP** (the cell's energetic currency) to drive active engines that clamp sugar and force it inside.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
