import React, { useEffect, useRef, useState } from 'react';
import { Particle, Channel, MoleculeType, ChannelType, Challenge } from '../types';
import { PlayfulGuide } from './PlayfulGuide';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  MEMBRANE_Y, 
  createParticle, 
  updateParticlesPhysics, 
  getMoleculeCounts 
} from '../utils';
import { 
  PlusCircle, 
  Activity, 
  Zap, 
  Heart, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  Trophy, 
  Flame, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const CHALLENGES: Challenge[] = [
  {
    id: 'ch-1',
    title: "Challenge 1: The Choking Cell (Waste Diffusion)",
    description: "Your cell's metabolism generates toxic CO₂ waste, but lacks channels! If CO₂ builds up past 12 units inside, Celly gets acidic poisoning. Get O₂ inside and let CO₂ diffuse out!",
    introductionText: "Celly is locked in an airtight box! CO₂ waste is building up and choking her, while Oxygen is locked outside. O₂ and CO₂ can pass through lipids, but leak channels speed it up! Open pathways and keep health above 65% for 15 seconds to win!",
    successText: "Excellent job! You demonstrated that gases like Oxygen and Carbon dioxide diffuse directly through lipid layers and pass easily, helping cells breathe and flush acidic waste!",
    failText: "Oops! CO₂ levels built up too high, causing severe acidosis! Re-spawn and make sure wastes can diffuse out.",
    initialChannels: [],
    availableChannels: ['LeakyLipids'],
    initialMolecules: [
      { type: 'CO2', area: 'inside', count: 18 },
      { type: 'O2', area: 'outside', count: 15 }
    ],
    targetCondition: (state, elapsed) => elapsed >= 15 && state.cellHealth > 65,
    targetMessage: "Keep cell health > 65% for 15 seconds!"
  },
  {
    id: 'ch-2',
    title: "Challenge 2: The Sugar Intake (Facilitated Balance)",
    description: "Your cell needs constant Glucose for glycolysis, but candy sugars cannot pass through lipids! Synthesize carrier proteins to absorb sugar until internal Glucose is >= 8.",
    introductionText: "Celly is starving! She needs sugar to power ATP engines, but Glucose is locked outside. Build 'Glucose Carrier' channels to allow sugar to glide down its concentration gradient until you have at least 8 Glucose units inside!",
    successText: "Way to go! Glucose flowed down its concentration gradient into the cell using facilitated carrier doors without burning any ATP!",
    failText: "Oh no! Time's up and Celly didn't get enough glucose. Build more carriers!",
    initialChannels: [],
    availableChannels: ['GlucoseCarrier'],
    initialMolecules: [
      { type: 'Glucose', area: 'outside', count: 16 },
      { type: 'O2', area: 'inside', count: 8 }
    ],
    targetCondition: (state) => state.glucoseInside >= 8,
    targetMessage: "Absorb Glucose until Inside count is >= 8!"
  },
  {
    id: 'ch-3',
    title: "Challenge 3: Desalination (Osmotic Survival)",
    description: "Your cell is dropped in a hypertonic brine environment! Water is leaking out, shriveling cell volume. Place Aquaporins and use ATP Pumps to survive!",
    introductionText: "S.O.S! Celly's surrounding fluid is intensely salty. Water is leaking out, dehydrated! You must place Aquaporins to let water flow, but wait: water travels towards the salty side! If you can pump out sodium or generate ATP to balance things, you will survive. Keep cell alive for 20 seconds!",
    successText: "Fantastic! You survived the severe salt brine and maintained osmotic equilibrium in a hostile environment!",
    failText: "Celly shriveled to a tiny raisin because water departed! Try again.",
    initialChannels: [
      { type: 'Aquaporin', isOpen: true, x: 200 }
    ],
    availableChannels: ['Aquaporin', 'GlucoseCarrier', 'GlucoseActivePump'],
    initialMolecules: [
      { type: 'Water', area: 'inside', count: 10 },
      { type: 'Water', area: 'outside', count: 20 },
      { type: 'Glucose', area: 'outside', count: 15 }
    ],
    targetCondition: (state, elapsed) => elapsed >= 20 && state.cellHealth > 50,
    targetMessage: "Survive hypertonic shock with Health > 50% for 20 seconds!"
  }
];

export const Sandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Simulation Controls & Resources
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [atpCount, setAtpCount] = useState<number>(6);
  const [cellHealth, setCellHealth] = useState<number>(100);
  const [waterInsidePercent, setWaterInsidePercent] = useState<number>(50); // cell water ratio

  // Simulation speed timer
  const [timeElapsed, setTimeElapsed] = useState<number>(0);

  // Core entities
  const [particles, setParticles] = useState<Particle[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Challenge Level states
  const [activeChallengeIdx, setActiveChallengeIdx] = useState<number | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle');

  // Channel assembly list
  const channelList: { type: ChannelType; label: string; color: string; desc: string }[] = [
    { type: 'Aquaporin', label: 'Aquaporin', color: '#38bdf8', desc: 'Allows Water to flow' },
    { type: 'GlucoseCarrier', label: 'Glucose Carrier', color: '#10b981', desc: 'Passive Glucose transit' },
    { type: 'GlucoseActivePump', label: 'Active Sugar Pump', color: '#8b5cf6', desc: 'Pumps Glucose in (Costs 1 ATP)' },
    { type: 'ProtonPump', label: 'H⁺ Proton Pump', color: '#eab308', desc: 'Pumps Acid up (Costs 1 ATP)' },
    { type: 'ATPSynthase', label: 'ATP Synthase', color: '#d8b4fe', desc: 'Generates ATP when H⁺ flows down' }
  ];

  // Initialize general sandbox or active level
  const initEnvironment = (challengeIdx: number | null) => {
    setTimeElapsed(0);
    setCellHealth(100);
    setWaterInsidePercent(50);
    setChallengeStatus(challengeIdx !== null ? 'running' : 'idle');

    let initialParts: Particle[] = [];
    let initialChs: Channel[] = [];

    if (challengeIdx !== null) {
      const ch = CHALLENGES[challengeIdx];
      // Create molecules
      for (const group of ch.initialMolecules) {
        for (let i = 0; i < group.count; i++) {
          initialParts.push(createParticle(group.type, group.area));
        }
      }
      // Set channels
      initialChs = ch.initialChannels.map((c, idx) => ({
        ...c,
        id: `level-ch-${idx}`,
        isOpen: true
      }));
      setAtpCount(challengeIdx === 2 ? 8 : 4);
    } else {
      // General free-play sandbox: equal spread of everything
      setAtpCount(12);
      const defaultMolecules: { type: MoleculeType; area: 'inside' | 'outside'; count: number }[] = [
        { type: 'O2', area: 'outside', count: 12 },
        { type: 'CO2', area: 'inside', count: 4 },
        { type: 'Glucose', area: 'outside', count: 10 },
        { type: 'Water', area: 'inside', count: 15 },
        { type: 'Water', area: 'outside', count: 15 },
        { type: 'Proton', area: 'outside', count: 8 }
      ];
      for (const group of defaultMolecules) {
        for (let i = 0; i < group.count; i++) {
          initialParts.push(createParticle(group.type, group.area));
        }
      }
      // Some starter carriers
      initialChs = [
        { id: 'ch-init-1', type: 'GlucoseCarrier', x: 220, isOpen: true },
        { id: 'ch-init-2', type: 'Aquaporin', x: 480, isOpen: true }
      ];
    }

    setParticles(initialParts);
    setChannels(initialChs);
  };

  useEffect(() => {
    initEnvironment(activeChallengeIdx);
  }, [activeChallengeIdx]);

  // Append a channel to the membrane if space permits
  const handleAddChannel = (type: ChannelType) => {
    // If we are in a level, verify if this channel is allowed
    if (activeChallengeIdx !== null) {
      const allowed = CHALLENGES[activeChallengeIdx].availableChannels.includes(type);
      if (!allowed) return;
    }

    if (channels.length >= 8) {
      alert("Exceeded maximum protein channel densities on this membrane region (Max 8)!");
      return;
    }

    // Determine unused x location along membrane to prevent overlap
    const newX = 80 + Math.random() * (CANVAS_WIDTH - 200);
    const newChannel: Channel = {
      id: `ch-user-${Date.now()}`,
      type,
      x: newX,
      isOpen: true
    };

    setChannels((prev) => [...prev, newChannel]);
  };

  const removeChannel = (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const countsObj = getMoleculeCounts(particles);

  // Cellular metabolism life engine
  useEffect(() => {
    if (!isPlaying) return;

    const lifeInterval = setInterval(() => {
      setTimeElapsed((p) => p + 1);

      // Metobolic rule: cell cytoplasm consumes Glucose and O2 to synthesize energy (ATP)
      const hasO2 = countsObj.inside.O2 > 0;
      const hasGlucose = countsObj.inside.Glucose > 0;

      // Consume assets inside Cytoplasm
      setParticles((prev) => {
        let o2Consumed = false;
        let glucoseConsumed = false;
        let filterParts = [...prev];

        if (hasO2 && hasGlucose) {
          // Find 1 O2 and 1 Glucose inside (y > MEMBRANE_Y) and remove them
          const o2Idx = filterParts.findIndex((p) => p.type === 'O2' && p.y >= MEMBRANE_Y);
          if (o2Idx !== -1) {
            filterParts.splice(o2Idx, 1);
            o2Consumed = true;
          }
          const gluIdx = filterParts.findIndex((p) => p.type === 'Glucose' && p.y >= MEMBRANE_Y);
          if (gluIdx !== -1) {
            filterParts.splice(gluIdx, 1);
            glucoseConsumed = true;
          }
        }

        // If metabolic respiration completes, generate 1 ATP energy and emit 1 CO2 toxin waste inside Cytoplasm!
        if (o2Consumed && glucoseConsumed) {
          filterParts.push(createParticle('ATP', 'inside'));
          filterParts.push(createParticle('CO2', 'inside'));
          setAtpCount((prevCount) => prevCount + 2);
        }

        return filterParts;
      });

      // Calculate state statistics to adjust cell health
      setCellHealth((prevHealth) => {
        let damage = 0;

        // 1. Oxygen starvation check
        if (countsObj.inside.O2 === 0) {
          damage += 3; // asphyxiation
        }

        // 2. Glucose starvation check
        if (countsObj.inside.Glucose === 0) {
          damage += 3; // starving
        }

        // 3. Acidic Carbon Dioxide metabolic toxicity check
        if (countsObj.inside.CO2 > 11) {
          damage += 5; // acidosis poisoning
        }

        // 4. Osmotic water shrivel bounds
        const insideWaterCount = countsObj.inside.Water;
        if (insideWaterCount < 5) damage += 4;
        else if (insideWaterCount > 25) damage += 4; // swollen bloat

        const nextHealth = Math.max(0, Math.min(100, prevHealth - damage + (damage === 0 ? 1.5 : 0)));
        return nextHealth;
      });

    }, 1000);

    return () => clearInterval(lifeInterval);
  }, [isPlaying, particles]);

  // Challenge goal check
  useEffect(() => {
    if (activeChallengeIdx === null || challengeStatus !== 'running') return;

    const ch = CHALLENGES[activeChallengeIdx];
    
    // Check win condition
    const winState = {
      isPlaying,
      atpCount,
      cellHealth,
      waterInside: countsObj.inside.Water,
      waterOutside: countsObj.outside.Water,
      glucoseInside: countsObj.inside.Glucose,
      glucoseOutside: countsObj.outside.Glucose,
      o2Inside: countsObj.inside.O2,
      o2Outside: countsObj.outside.O2,
      co2Inside: countsObj.inside.CO2,
      co2Outside: countsObj.outside.CO2,
      protonInside: countsObj.inside.Proton,
      protonOutside: countsObj.outside.Proton,
    };

    if (ch.targetCondition(winState, timeElapsed)) {
      setChallengeStatus('won');
      setIsPlaying(false);
    }

    // Check optional fail condition
    if (cellHealth <= 0) {
      setChallengeStatus('lost');
      setIsPlaying(false);
    }
  }, [timeElapsed, cellHealth, activeChallengeIdx, challengeStatus]);

  // Simulation physics frame updater
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (isPlaying) {
        setParticles((prev) => {
          const { updatedParticles } = updateParticlesPhysics(
            prev,
            channels,
            () => {
              // ATP spent in active transport!
              setAtpCount((prevCount) => Math.max(0, prevCount - 1));
            },
            () => {
              // ATP synthesized from Proton streaming down synthase!
              setAtpCount((prevCount) => prevCount + 1);
            }
          );
          return updatedParticles;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, channels]);

  // Canvas drawing routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fffdfa';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Systems graph paper lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }

    // Cytoplasm cytoplasmic fluid bottom half tint (greenish red)
    ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.fillRect(0, MEMBRANE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - MEMBRANE_Y);

    // Draw Double lipid membrane layer
    const lipidY1 = MEMBRANE_Y - 5;
    const lipidY2 = MEMBRANE_Y + 5;
    const spacing = 11;

    ctx.fillStyle = '#fca5a5';
    ctx.lineWidth = 1;

    for (let lx = 6; lx < CANVAS_WIDTH; lx += spacing) {
      // Don't draw membrane lipids where ANY protein channel is active
      const hasChannel = channels.some((ch) => Math.abs(lx - ch.x) < 22);
      if (hasChannel) continue;

      ctx.beginPath();
      ctx.arc(lx, lipidY1, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(lx, lipidY2, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // yellow tails
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(lx, lipidY1 + 3.8);
      ctx.lineTo(lx, MEMBRANE_Y);
      ctx.moveTo(lx, lipidY2 - 3.8);
      ctx.lineTo(lx, MEMBRANE_Y);
      ctx.stroke();
    }

    // Label Areas
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('EXTRACELLULAR SPACE (OUTSIDE CELL)', 15, 20);
    ctx.fillText('CELL CYTOPLASM (INTRACELLULAR MATRIX)', 15, CANVAS_HEIGHT - 12);

    // Draw active Protein Channels
    for (const ch of channels) {
      ctx.save();
      ctx.translate(ch.x, MEMBRANE_Y);

      let color = '#38bdf8';
      let title = 'PORT';

      if (ch.type === 'Aquaporin') {
        color = '#38bdf8';
        title = 'AQP';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-14, -20, 28, 40, 4);
        ctx.fill();
        ctx.stroke();
        // Aquaporin water slip lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-4, -12); ctx.lineTo(-4, 12);
        ctx.moveTo(4, -12); ctx.lineTo(4, 12);
        ctx.stroke();
      } 
      else if (ch.type === 'GlucoseCarrier') {
        color = '#10b981';
        title = 'GLUT';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-13, 0, 8, -Math.PI / 2, Math.PI / 2);
        ctx.arc(13, 0, 8, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } 
      else if (ch.type === 'GlucoseActivePump') {
        color = '#a855f7';
        title = 'ACTIVE SUGAR';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-16, -18, 32, 36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('ATP', -7, 6);
      } 
      else if (ch.type === 'ProtonPump') {
        color = '#f59e0b';
        title = 'H⁺ PUMP';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(-12, -18, 24, 36);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('⚡', -4, 4);
      } 
      else if (ch.type === 'ATPSynthase') {
        color = '#d8b4fe';
        title = 'SYNTHASE';
        ctx.fillStyle = color;
        ctx.strokeStyle = '#6b21a8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, -20);
        ctx.lineTo(-8, 15);
        ctx.lineTo(8, 15);
        ctx.lineTo(18, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 0, -23);

      ctx.restore();
    }

    // Render Particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      // little labels for clarity
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.type === 'Water' ? 'H₂O' : p.type, p.x, p.y + 2.5);
    }

  }, [particles, channels, isPlaying]);

  // Spawn simple molecules manually
  const spawnFreeMolecule = (type: MoleculeType, area: 'inside' | 'outside') => {
    setParticles((prev) => [...prev, createParticle(type, area)]);
  };

  const clearMolecules = () => {
    setParticles([]);
  };

  const counts = countsObj;

  const getDiagnosticsMood = (): 'happy' | 'worried' | 'shriveled' | 'starving' | 'bursting' | 'energetic' => {
    if (cellHealth < 40) return 'starving';
    if (counts.inside.CO2 > 10) return 'worried';
    if (counts.inside.O2 === 0) return 'shriveled';
    if (counts.inside.Glucose === 0) return 'starving';
    if (atpCount > 15) return 'energetic';
    return 'happy';
  };

  return (
    <div id="sandbox-root-container" className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4">
      {/* Simulation Box (Left xl:9) */}
      <div className="xl:col-span-9 flex flex-col gap-4">
        
        {/* Playable sandbox viewport */}
        <div className="border-4 border-[#2d2b2a] rounded-2xl bg-[#fffdfa] shadow-[6px_6px_0px_#2d2b2a] relative overflow-hidden">
          {/* Top Panel bar */}
          <div className="bg-[#f0fdf4] px-4 py-2 border-b-4 border-[#2d2b2a] flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border border-[#2d2b2a] animate-pulse" />
              <h2 className="font-sans text-sm font-black text-[#2d2b2a] flex items-center gap-1.5 uppercase">
                <Activity className="w-4 h-4 text-emerald-600" /> Cell Membrane Construction Workbench
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Health progress bar */}
              <div className="flex items-center gap-1.5 bg-red-50 border-2 border-red-500 px-2.5 py-0.5 rounded-full">
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-bounce" />
                <span className="font-mono text-xs font-black text-red-700">{Math.round(cellHealth)}% CELL HEALTH</span>
              </div>

              {/* ATP balance */}
              <div className="flex items-center gap-1.5 bg-[#fef9c3] border-2 border-yellow-500 px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#2d2b2a]">
                <Zap className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500" />
                <span className="font-mono text-xs font-black text-[#2d2b2a]">{atpCount} ATP</span>
              </div>

              {/* Step stopwatch */}
              <div className="bg-slate-100 border border-slate-300 font-mono text-xs px-2.5 py-0.5 rounded font-black text-slate-800">
                ⏱️ {timeElapsed}s
              </div>
            </div>
          </div>

          {/* Actual Active Challenge Info bar overlay */}
          {activeChallengeIdx !== null && (
            <div className="bg-[#eff6ff] border-b-2 border-blue-200 p-3 px-5 flex items-start gap-3">
              <Trophy className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-xs font-bold text-blue-600 block uppercase">ACTIVE CHALLENGE LEVEL</span>
                <h4 className="font-sans text-sm font-extrabold text-blue-900 leading-tight">
                  {CHALLENGES[activeChallengeIdx].title}
                </h4>
                <p className="font-sans text-xs text-blue-700 mt-1 leading-normal">
                  {CHALLENGES[activeChallengeIdx].introductionText}
                </p>
                <div className="mt-2 text-xs font-mono font-bold text-red-700 bg-red-100/60 p-1 px-2.5 rounded inline-block">
                  🎯 GOAL: {CHALLENGES[activeChallengeIdx].targetMessage}
                </div>
              </div>
            </div>
          )}

          {/* Active Canvas sandbox */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto block max-w-full"
            />

            {/* Game state banners */}
            {challengeStatus === 'won' && (
              <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-center p-6 text-white backdrop-blur-sm z-30">
                <Award className="w-16 h-16 text-yellow-300 fill-yellow-300 animate-bounce mb-3" />
                <h2 className="font-sans text-2xl font-black">🎉 Level Completed! Success!</h2>
                <p className="text-sm max-w-md my-2">
                  {CHALLENGES[activeChallengeIdx!].successText}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (activeChallengeIdx! < CHALLENGES.length - 1) {
                        setActiveChallengeIdx(activeChallengeIdx! + 1);
                      } else {
                        setActiveChallengeIdx(null); // free play
                      }
                    }}
                    className="bg-white text-emerald-800 font-extrabold text-xs px-4 py-2 border-2 border-[#2d2b2a] rounded-xl hover:bg-slate-100 cursor-pointer shadow-[3px_3px_0px_#2d2b2a] active:translate-y-0.5"
                  >
                    {activeChallengeIdx! < CHALLENGES.length - 1 ? 'LOAD NEXT CHALLENGE' : 'ENTER FREE-PLAY SANDBOX'}
                  </button>
                </div>
              </div>
            )}

            {challengeStatus === 'lost' && (
              <div className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center text-center p-6 text-white backdrop-blur-sm z-30">
                <ShieldAlert className="w-16 h-16 text-white animate-pulse mb-3" />
                <h2 className="font-sans text-2xl font-black">🥀 Celly Perished! Fail</h2>
                <p className="text-sm max-w-md my-2">
                  {CHALLENGES[activeChallengeIdx!].failText}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => initEnvironment(activeChallengeIdx)}
                    className="bg-white text-red-800 font-extrabold text-xs px-4 py-2 border-2 border-[#2d2b2a] rounded-xl hover:bg-slate-100 cursor-pointer shadow-[3px_3px_0px_#2d2b2a] active:translate-y-0.5"
                  >
                    RETRY LEVEL (LOAD AGAIN)
                  </button>
                  <button
                    onClick={() => setActiveChallengeIdx(null)}
                    className="bg-slate-800 text-white font-extrabold text-xs px-4 py-2 border-2 border-[#2d2b2a] rounded-xl hover:bg-slate-700 cursor-pointer shadow-[3px_3px_0px_#2d2b2a]"
                  >
                    GIVE UP FOR FREE PLAY
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Particle Spawn controls tray */}
          <div className="p-3 bg-slate-50 border-t-4 border-[#2d2b2a] flex flex-wrap gap-2 items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-500">SPAWN INJECTORS:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => spawnFreeMolecule('O2', 'outside')}
                className="bg-[#22c55e] hover:bg-[#4ade80] text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-[#2d2b2a] cursor-pointer"
              >
                + O₂ (Outside)
              </button>
              <button
                onClick={() => spawnFreeMolecule('Glucose', 'outside')}
                className="bg-[#ec4899] hover:bg-[#f472b6] text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-[#2d2b2a] cursor-pointer"
              >
                + Glucose (Outside)
              </button>
              <button
                onClick={() => spawnFreeMolecule('Water', 'outside')}
                className="bg-[#0284c7] hover:bg-[#38bdf8] text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-[#2d2b2a] cursor-pointer"
              >
                + Water (Outside)
              </button>
              <button
                onClick={() => spawnFreeMolecule('Proton', 'outside')}
                className="bg-[#eab308] hover:bg-[#facc15] text-[#2d2b2a] text-[10px] font-mono font-bold px-2 py-1 rounded border border-[#2d2b2a] cursor-pointer"
              >
                + Proton (Outside)
              </button>
              <button
                onClick={() => spawnFreeMolecule('CO2', 'inside')}
                className="bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-mono font-bold px-2 py-1 rounded border border-[#2d2b2a] cursor-pointer"
              >
                + CO₂ (Inside Cytosol)
              </button>
            </div>

            {/* Sim state controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1 px-3 border border-slate-300 rounded hover:bg-slate-100 bg-white"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-slate-700" /> : <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />}
              </button>
              <button
                onClick={() => initEnvironment(activeChallengeIdx)}
                title="Refresh simulation"
                className="p-1 px-3 border border-slate-300 rounded hover:bg-slate-100 bg-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
              </button>
              <button
                onClick={clearMolecules}
                title="Clears all floats"
                className="p-1 px-2.5 bg-red-100 border border-red-300 rounded hover:bg-red-200 text-red-700 font-mono text-[10px] font-bold cursor-pointer"
              >
                Clear floats
              </button>
            </div>
          </div>
        </div>

        {/* Celly feedback element */}
        <PlayfulGuide
          mood={getDiagnosticsMood()}
          title={activeChallengeIdx === null ? "🕹️ Sandbox Active Diagnostics" : `🏁 Challenge Target Checking`}
          speech={
            activeChallengeIdx === null 
              ? `We are live in free-play! Currently synthesizing ATP from O₂ and Glucose. Inside details: O₂ is ${counts.inside.O2}, Glucose is ${counts.inside.Glucose}, waste CO₂ is ${counts.inside.CO2}. Make sure wastes can always slide out, and sugar keeps coming in!`
              : `Focus on the goal: ${CHALLENGES[activeChallengeIdx].description}`
          }
          hint={
            activeChallengeIdx === null
              ? "Spawn more glucose/oxygen to fuel respiration, or craft ATP synthases to generate purple gold tokens!"
              : "Read the target and construct only the allowed lanes."
          }
        />
      </div>

      {/* Control Bench Side Panels (Right xl:3) */}
      <div className="xl:col-span-3 flex flex-col gap-5">
        
        {/* Challenge Levels Panel Selection */}
        <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-4 shadow-[6px_6px_0px_#2d2b2a]">
          <h3 className="font-sans text-sm font-black text-[#2d2b2a] uppercase tracking-wider mb-2 pb-1.5 border-b-2 border-slate-200 flex items-center gap-1">
            🏆 Select Level
          </h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveChallengeIdx(null)}
              className={`p-2 py-1.5 text-xs text-left font-mono font-bold rounded border-2 border-[#2d2b2a] cursor-pointer transition-all ${
                activeChallengeIdx === null 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              Free Play Sandbox
            </button>
            {CHALLENGES.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => setActiveChallengeIdx(idx)}
                className={`p-2 py-1.5 text-xs text-left font-sans rounded border-2 border-[#2d2b2a] cursor-pointer transition-all flex flex-col ${
                  activeChallengeIdx === idx 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0px_#2d2b2a] active:translate-y-0.5 active:shadow-none'
                }`}
              >
                <span className="font-extrabold">Level {idx + 1}</span>
                <span className="text-[10px] opacity-90 leading-tight line-clamp-1">{ch.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grow / Craft channels Panel */}
        <div className="bg-white border-4 border-[#2d2b2a] rounded-2xl p-4 shadow-[6px_6px_0px_#2d2b2a]">
          <h3 className="font-sans text-sm font-black text-[#2d2b2a] uppercase tracking-wider mb-2 pb-1.5 border-b-2 border-slate-200">
            🏗️ Grow Channels
          </h3>
          <p className="font-sans text-[11px] text-slate-500 mb-2">
            Click a membrane channel type below to grow/insert it into the current live cell lipid layer:
          </p>

          <div className="flex flex-col gap-2.5">
            {channelList.map((tool) => {
              // Hide if not allowed in active challenge
              const isAllowed = 
                activeChallengeIdx === null || 
                CHALLENGES[activeChallengeIdx].availableChannels.includes(tool.type);

              if (!isAllowed) return null;

              return (
                <button
                  key={tool.type}
                  onClick={() => handleAddChannel(tool.type)}
                  className="p-2 border-2 border-[#2d2b2a] hover:bg-slate-50 rounded-xl text-left cursor-pointer transition-all shadow-[2px_2px_0px_#2d2b2a] active:translate-y-0.5 active:shadow-none bg-white flex items-center justify-between gap-1"
                >
                  <div>
                    <h5 className="font-sans text-xs font-black text-[#2d2b2a]">{tool.label}</h5>
                    <p className="font-sans text-[9px] text-[#4b5563] leading-tight mt-0.5">{tool.desc}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 p-0.5 px-1.5 rounded font-mono font-bold shrink-0">
                    + Add
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear/Manage Placed channels list */}
        <div className="bg-slate-50 border-4 border-[#2d2b2a] rounded-2xl p-4 shadow-[6px_6px_0px_#2d2b2a] flex-1">
          <h3 className="font-sans text-sm font-black text-[#2d2b2a] uppercase tracking-widest pb-1 border-b border-dashed border-slate-300">
            🛠️ Membrane Slices ({channels.length})
          </h3>
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto mt-2">
            {channels.length === 0 ? (
              <span className="font-mono text-[10px] text-zinc-400 italic block mt-2 text-center">
                Pristine Lipids: No channels grew.
              </span>
            ) : (
              channels.map((ch) => (
                <div 
                  key={ch.id}
                  className="flex justify-between items-center bg-white p-1.5 px-2 rounded-lg border border-slate-300"
                >
                  <span className="font-mono text-[10px] text-zinc-700 font-extrabold truncate max-w-[130px]">
                    ⚙️ {ch.type}
                  </span>
                  <button
                    onClick={() => removeChannel(ch.id)}
                    className="p-0.5 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 cursor-pointer"
                    title="Dissolve channel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
