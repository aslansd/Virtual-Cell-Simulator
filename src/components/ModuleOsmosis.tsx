import React, { useEffect, useRef, useState } from 'react';
import { PlayfulGuide } from './PlayfulGuide';
import { CellStateMood } from '../types';
import { RefreshCw, ShieldAlert, Droplet, Waves } from 'lucide-react';

interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isWater: boolean; // false means Salt ion!
}

export const ModuleOsmosis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Slider values
  const [fluidSaltiness, setFluidSaltiness] = useState<number>(30); // 0 (Hypotonic) to 100 (Hypertonic), 30 Isotonic
  const [aquaporinsOpen, setAquaporinsOpen] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  
  // Cell Physical Volume State
  // 100 = Default, < 65 = shriveled, > 140 = danger bloated, > 170 = burst!
  const [cellVolume, setCellVolume] = useState<number>(100);
  const [hasBurst, setHasBurst] = useState<boolean>(false);
  
  // Particles: water and salt
  const [particles, setParticles] = useState<WaterParticle[]>([]);

  // Reset particles inside / outside floating cell
  const initOsmosis = () => {
    setCellVolume(100);
    setHasBurst(false);

    const list: WaterParticle[] = [];
    const canvasWidth = 720;
    const canvasHeight = 350;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Define water particles inside cell
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 45;
      list.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        isWater: true
      });
    }

    // Inside salts (constant concentration)
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 45;
      list.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        isWater: false
      });
    }

    // Outside particles based on state
    const outsideSaltCount = Math.floor(fluidSaltiness * 0.4);
    const outsideWaterCount = 80;

    for (let i = 0; i < outsideWaterCount; i++) {
      // Spawn outside 65 radius circular cell boundary
      let spawned = false;
      let px = 0; let py = 0;
      while (!spawned) {
        px = Math.random() * canvasWidth;
        py = Math.random() * canvasHeight;
        const dist = Math.hypot(px - centerX, py - centerY);
        if (dist > 75) {
          spawned = true;
        }
      }
      list.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
        isWater: true
      });
    }

    for (let i = 0; i < outsideSaltCount; i++) {
      let spawned = false;
      let px = 0; let py = 0;
      while (!spawned) {
        px = Math.random() * canvasWidth;
        py = Math.random() * canvasHeight;
        const dist = Math.hypot(px - centerX, py - centerY);
        if (dist > 75) {
          spawned = true;
        }
      }
      list.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        isWater: false
      });
    }

    setParticles(list);
  };

  useEffect(() => {
    initOsmosis();
  }, [fluidSaltiness]);

  // Physics & Volume Adjustment loop
  useEffect(() => {
    if (!isPlaying || hasBurst) return;

    let animId: number;

    const loop = () => {
      // Target volume depends on fluid saltiness
      // 0 (hypotonic) -> wants to expand to 160
      // Isotonic (30) -> wants to stay around 100
      // 100 (hypertonic) -> wants to shrink to 50
      let targetVol = 100;
      if (fluidSaltiness < 25) {
        // Hypotonic: water rushes IN
        targetVol = 100 + (25 - fluidSaltiness) * 2.8; 
      } else if (fluidSaltiness > 35) {
        // Hypertonic: water rushes OUT
        targetVol = 100 - (fluidSaltiness - 35) * 0.7;
      }

      // Aquaporins affect speed of volume change
      const flowRate = aquaporinsOpen ? 0.015 : 0.0015; // 10x slower if lipid leak only!
      
      setCellVolume((prev) => {
        const diff = targetVol - prev;
        const nextVolume = prev + diff * flowRate;

        // Check burst condition
        if (nextVolume > 165) {
          setHasBurst(true);
          return 170;
        }
        return nextVolume;
      });

      // Update particle positions
      setParticles((prev) => {
        const canvasWidth = 720;
        const canvasHeight = 350;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const currentRadius = 60 * (cellVolume / 100);

        return prev.map((p) => {
          let nx = p.x + p.vx;
          let ny = p.y + p.vy;
          let nvx = p.vx;
          let nvy = p.vy;

          // Wall bounce
          if (nx < 5 || nx > canvasWidth - 5) nvx = -p.vx;
          if (ny < 5 || ny > canvasHeight - 5) nvy = -p.vy;

          // Cell membrane bounce
          const dist = Math.hypot(nx - centerX, ny - centerY);
          
          if (!p.isWater) {
            // Ions cannot cross membrane at all under any condition!
            const wasOutside = Math.hypot(p.x - centerX, p.y - centerY) > currentRadius;
            const isInsideNow = dist <= currentRadius;
            const wasInside = Math.hypot(p.x - centerX, p.y - centerY) <= currentRadius;
            const isOutsideNow = dist > currentRadius;

            if ((wasOutside && isInsideNow) || (wasInside && isOutsideNow)) {
              // Normal reflection vector
              const angle = Math.atan2(ny - centerY, nx - centerX);
              nvx = Math.cos(angle) * Math.abs(p.vx) * (wasOutside ? 1 : -1);
              nvy = Math.sin(angle) * Math.abs(p.vy) * (wasOutside ? 1 : -1);
              nx = centerX + Math.cos(angle) * (currentRadius + (wasOutside ? 3 : -3));
            }
          } else {
            // Water particles can cross, especially if aquaporins are open!
            // In a simple simulation, particles can move freely but water gets pulled visually toward the saltier side.
            // Let's bias water velocity slightly towards the higher salt concentration side
            const totalSolutesOutside = fluidSaltiness;
            const totalSolutesInside = 30; // constant salt inside
            
            if (totalSolutesOutside > totalSolutesInside) {
              // pull toward outside
              const angle = Math.atan2(ny - centerY, nx - centerX);
              nvx += Math.cos(angle) * 0.005;
              nvy += Math.sin(angle) * 0.005;
            } else if (totalSolutesOutside < totalSolutesInside) {
              // pull inside
              const angle = Math.atan2(ny - centerY, nx - centerX);
              nvx -= Math.cos(angle) * 0.01;
              nvy -= Math.sin(angle) * 0.01;
            }
          }

          return { ...p, x: nx, y: ny, vx: nvx, vy: nvy };
        });
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, fluidSaltiness, aquaporinsOpen, cellVolume, hasBurst]);

  // Draw simulation to Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 720;
    const height = 350;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 60 * (cellVolume / 100);

    // Context drawing
    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, width, height);

    // Fluid tint based on concentration (hypotonic = clear white, hypertonic = salty dirty gray-amber)
    const fluidOpacity = Math.min(0.2, (fluidSaltiness / 100) * 0.2);
    ctx.fillStyle = `rgba(180, 140, 60, ${fluidOpacity})`;
    ctx.fillRect(0, 0, width, height);

    // Blueprint grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (hasBurst) {
      // Draw Burst Cell Remnants
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([4, 12]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw red splatter inside
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 85, 0, Math.PI * 2);
      ctx.fill();

      // Scattered organelles/remnants
      ctx.font = '24px Arial';
      ctx.fillText('💥', centerX - 25, centerY - 15);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CELL LYSIS (BURST!)', centerX - 80, centerY + 20);
    } else {
      // Draw Living cell cytoplasm background
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // light green cytosol
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw Lipids along the cell membrane circles (representing cells)
      ctx.strokeStyle = '#16a34a'; // green healthy outline
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Little Membrane Lipid Heads
      const lipidCount = Math.floor(radius * 0.45);
      ctx.fillStyle = '#86efac';
      for (let i = 0; i < lipidCount; i++) {
        const theta = (i / lipidCount) * Math.PI * 2;
        const hx = centerX + Math.cos(theta) * radius;
        const hy = centerY + Math.sin(theta) * radius;
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Aquaporin "Doors" if open or closed
      const gateCount = 4;
      for (let i = 0; i < gateCount; i++) {
        const theta = (i / gateCount) * Math.PI * 2 + (Date.now() / 2000);
        const gx = centerX + Math.cos(theta) * radius;
        const gy = centerY + Math.sin(theta) * radius;

        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(theta);

        // draw gate
        ctx.fillStyle = aquaporinsOpen ? '#38bdf8' : '#64748b'; // blue or gray
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(-8, -4, 16, 8);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Draw Cell Face (moving with vibration)
      const wobbleX = Math.sin(Date.now() / 150) * 1.5;
      const wobbleY = Math.cos(Date.now() / 200) * 1.5;
      const faceX = centerX + wobbleX;
      const faceY = centerY + wobbleY;

      if (cellVolume > 135) {
        // Bloated sweat face
        ctx.strokeStyle = '#2d2b2a';
        ctx.lineWidth = 3;
        // Big round white eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(faceX - 12, faceY - 5, 8, 0, Math.PI * 2);
        ctx.arc(faceX + 12, faceY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Tiny pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(faceX - 12, faceY - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(faceX + 12, faceY - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Worried open circle mouth
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(faceX, faceY + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } 
      else if (cellVolume < 75) {
        // Shriveling dizzy face
        ctx.strokeStyle = '#2d2b2a';
        ctx.lineWidth = 2.5;
        // Squiggly X eyes
        ctx.beginPath();
        ctx.moveTo(faceX - 16, faceY - 9); ctx.lineTo(faceX - 8, faceY - 3);
        ctx.moveTo(faceX - 8, faceY - 9); ctx.lineTo(faceX - 16, faceY - 3);
        ctx.moveTo(faceX + 8, faceY - 9); ctx.lineTo(faceX + 16, faceY - 3);
        ctx.moveTo(faceX + 16, faceY - 9); ctx.lineTo(faceX + 8, faceY - 3);
        ctx.stroke();
        // Curved sad mouth
        ctx.beginPath();
        ctx.arc(faceX, faceY + 14, 6, Math.PI, 0);
        ctx.stroke();
      } 
      else {
        // Happy relaxed face
        ctx.strokeStyle = '#2d2b2a';
        ctx.lineWidth = 3;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(faceX - 10, faceY - 5, 4, 0, Math.PI * 2);
        ctx.arc(faceX + 10, faceY - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        // smile mouth
        ctx.beginPath();
        ctx.arc(faceX, faceY + 6, 8, 0, Math.PI);
        ctx.stroke();
      }
    }

    // Draw Particles
    for (const p of particles) {
      ctx.beginPath();
      if (p.isWater) {
        ctx.arc(p.x, p.y, p.isWater ? 4 : 7, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8'; // Blue water
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#0284c7';
        ctx.stroke();
      } else {
        // Solute salt: bigger gray or bronze sphere with little outline
        ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8'; // Salt ion
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        
        // draw miniature '+' or '-' sign
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('Na', p.x - 5, p.y + 3.5);
      }
    }

    // Label counts of Na+ outside vs inside
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Outside Salt concentration (Solutes): ${fluidSaltiness}%`, 20, 25);
    ctx.fillText(`Inside Salt concentration (Solutes): 30%`, 20, 42);
    ctx.fillText(`Internal Cell Volume: ${Math.round(cellVolume)}%`, 20, 59);

  }, [particles, cellVolume, hasBurst, fluidSaltiness, aquaporinsOpen]);

  // Determine speech mood based on cell status
  const getCellyMood = (): CellStateMood => {
    if (hasBurst) return 'starving'; // dead/burst
    if (cellVolume > 135) return 'bursting';
    if (cellVolume < 75) return 'shriveled';
    if (fluidSaltiness < 15) return 'worried';
    return 'happy';
  };

  const getOsmosisExplanationTitle = () => {
    if (hasBurst) return "💥 Oh Noz! Celly Swelled and Burst!";
    if (cellVolume > 135) return "🎈 Bloated Balloon! (Hypotonic Shock)";
    if (cellVolume < 75) return "🥀 Dehydrated Prune! (Hypertonic Shock)";
    return "⚖️ Solute Equilibrium (Isotonic Bliss)";
  };

  const getOsmosisExplanationSpeech = () => {
    if (hasBurst) {
      return "The fresh water outside has no saltiness, so water rushed inside to dissolve my salts. Without an ion pump, I swelled so large that my membrane couldn't hold it. Click 'Heal Celly' to rebuild my membrane!";
    }
    if (cellVolume > 135) {
      return "Whoa! Help! The external fluid is too watery (hypotonic). Water molecules are racing to get inside me through the Aquaporins. Salts are like high-solute magnets, calling for water!";
    }
    if (cellVolume < 75) {
      return "Urgh... too salty... (hypertonic). The external solution has high salt, so water is leaving my cytoplasm to dilute the external ocean. I am shriveling up!";
    }
    return "Ah, perfectly balanced! The saltiness outside (30%) is similar to my inside (30%). Solid water molecules leave and enter at equal, healthy rates. I feel wonderful!";
  };

  const getCellyHint = () => {
    if (hasBurst) return "Click 'Repair Cell membrane' and then slide the Salt concentration back to Isotonic (around 30%)!";
    if (!aquaporinsOpen) return "Aquaporin channels are closed! This blocks water from crossing quickly. Notice how slow the shrivel or swell is when closed!";
    return "Try moving the Osmotic Saltiness slider of the external fluid! Watch how closing the Aquaporins blocks rapid water rushing.";
  };

  return (
    <div id="module-osmosis-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4">
      {/* Simulation Screen Wrapper (Left/Center) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Playable Canvas Container with border */}
        <div className="border-4 border-[#2d2b2a] rounded-2xl bg-[#fffdfa] shadow-[6px_6px_0px_#2d2b2a] relative overflow-hidden">
          {/* Header Bar */}
          <div className="bg-[#e0f2fe] px-4 py-2 border-b-4 border-[#2d2b2a] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-600 fill-sky-600 animate-bounce" />
              <span className="font-mono text-xs font-bold text-[#2d2b2a]">OSMOSIS & OSMOTIC BALANCE BOX</span>
            </div>

            <div className="flex items-center gap-2">
              {hasBurst ? (
                <button
                  onClick={initOsmosis}
                  className="bg-[#fca55a] hover:bg-[#f97316] text-[#2d2b2a] font-black border-2 border-[#2d2b2a] text-xs px-3 py-1 rounded-lg cursor-pointer shadow-[2px_2px_0px_#2d2b2a] transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> REPAIR CELL (HEAL)
                </button>
              ) : (
                <span className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border-2 border-[#2d2b2a] ${
                  cellVolume > 130 ? 'bg-red-200 text-red-900 border-red-500' :
                  cellVolume < 75 ? 'bg-amber-200 text-amber-900 border-amber-500' : 'bg-emerald-200 text-emerald-900 border-emerald-500'
                }`}>
                  VOLUME: {Math.round(cellVolume)}% {cellVolume > 130 ? '⚠️ HIGH' : cellVolume < 75 ? '⚠️ SHRIVEL' : '✓ OK'}
                </span>
              )}
            </div>
          </div>

          {/* Actual Canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={720}
              height={350}
              className="w-full h-auto block max-w-full"
            />

            {/* Quick alert overlay if shriveling or bloated */}
            {!hasBurst && (cellVolume > 140 || cellVolume < 70) && (
              <div className="absolute top-16 right-4 bg-red-100 border-2 border-red-600 p-2 rounded-xl text-red-700 font-mono text-xs flex items-center gap-1.5 animate-pulse shadow-md">
                <ShieldAlert className="w-4 h-4" /> 
                {cellVolume > 140 ? 'DANGER: HYPOTONIC SWELL!' : 'DANGER: DEHYDRATION!'}
              </div>
            )}
          </div>

          {/* Play/Control Deck Area */}
          <div className="p-4 bg-slate-50 border-t-4 border-[#2d2b2a] flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Slider */}
            <div className="flex-1 w-full flex flex-col gap-1">
              <div className="flex justify-between font-mono text-xs font-bold text-slate-700">
                <span>🍦 Pure Water (Hypo)</span>
                <span className="font-extrabold text-[#0284c7]">External Fluid Saltiness: {fluidSaltiness}%</span>
                <span>🧂 Salty Sea (Hyper)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fluidSaltiness}
                onChange={(e) => setFluidSaltiness(Number(e.target.value))}
                className="w-full h-3 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-[#0284c7] border-2 border-[#2d2b2a]"
              />
            </div>

            {/* Channels Switch */}
            <div className="shrink-0 flex items-center gap-3 bg-white border-2 border-[#2d2b2a] p-2 rounded-xl shadow-[2px_2px_0px_#2d2b2a]">
              <span className="font-mono text-xs font-bold text-[#2d2b2a]">Aquaporins (Water Doors):</span>
              <button
                onClick={() => setAquaporinsOpen(!aquaporinsOpen)}
                className={`px-3 py-1 text-xs font-black rounded-lg border-2 border-[#2d2b2a] cursor-pointer shadow-[2px_2px_0px_#2d2b2a] active:translate-x-[1px] active:translate-y-[1px] ${
                  aquaporinsOpen ? 'bg-sky-200 text-sky-800' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {aquaporinsOpen ? 'OPEN (SPEEDY FLOW)' : 'CLOSED (LIPID BARRIER)'}
              </button>
            </div>
          </div>
        </div>

        {/* Celly Explorable Guide */}
        <PlayfulGuide
          mood={getCellyMood()}
          title={getOsmosisExplanationTitle()}
          speech={getOsmosisExplanationSpeech()}
          hint={getCellyHint()}
          showNavigation={false}
        />
      </div>

      {/* Systems Data Panel (Right Side) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* Systems Science insights card */}
        <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a]">
          <h3 className="font-sans text-lg font-black text-[#2d2b2a] mb-3 pb-1.5 border-b-2 border-[#2d2b2a]/10 flex items-center gap-2">
            🧬 Osmotic Systems Thinking
          </h3>

          <div className="font-sans text-sm text-[#475569] leading-relaxed flex flex-col gap-3">
            <p>
              Water is the universal cellular lubricant. Although cell lipid membranes block big sugars, water molecules can cross over slow and steady (passive leakage).
            </p>
            <p>
              To speed up water, cells construct <strong>Aquaporins</strong>. When a cell floats in a salty ecosystem:
            </p>
            <div className="bg-slate-100 p-3 rounded-lg border-2 border-[#2d2b2a]/10 font-mono text-xs flex flex-col gap-1 text-slate-800">
              <p>• <strong>Hypotonic (Salt &lt; 30%)</strong>: Water rushes INSIDE causing inflation or burst (Lysis).</p>
              <p>• <strong>Isotonic (Salt = 30%)</strong>: Balances water influx and efflux perfectly!</p>
              <p>• <strong>Hypertonic (Salt &gt; 30%)</strong>: Water departs, shriveling cell skin (Crenation).</p>
            </div>
            <p className="text-xs text-slate-400">
              *Real red blood cells lack structural cell walls, so they lyse easily in pure tap water, which is why intravenous medical bags must be strictly isotonic saline (0.9% NaCl)!
            </p>
          </div>
        </div>

        {/* Fun fact interactivity */}
        <div className="bg-[#f0fdfa] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a] flex-1">
          <h4 className="font-mono text-xs font-black text-teal-600 uppercase mb-1">
            🔬 Celly's Bio-Lab Secret
          </h4>
          <p className="font-sans text-xs text-teal-800 leading-relaxed">
            Did you know? Aquaporins are so specialized that they form a tight hydrogen-bonded bridge allowing single-file water molecules ($H_2O$) to race through at **3 billion molecules per second**, yet they completely refuse passage to acidic Protons ($H^+$)! 
          </p>
          <div className="mt-4 border-t border-teal-200 pt-3 flex items-center justify-between">
            <span className="font-bold text-xs text-teal-700">Explore rates:</span>
            <span className="font-mono text-xs text-teal-900 bg-white border border-teal-300 px-2 py-0.5 rounded">
              {aquaporinsOpen ? 'Flow limit: 3,000,000,000 / sec/ pore' : 'Blocked (0.1%)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
