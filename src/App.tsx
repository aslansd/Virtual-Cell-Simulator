import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ModuleDiffusion } from './components/ModuleDiffusion';
import { ModuleOsmosis } from './components/ModuleOsmosis';
import { ModuleATP } from './components/ModuleATP';
import { Sandbox } from './components/Sandbox';
import { 
  Dna, 
  Activity, 
  Droplet, 
  Zap, 
  Menu, 
  ChevronRight, 
  Sparkles, 
  HelpCircle,
  X
} from 'lucide-react';

type TabId = 'intro' | 'diffusion' | 'osmosis' | 'atp' | 'sandbox';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('intro');
  const [showHelperModal, setShowHelperModal] = useState<boolean>(false);

  // Quick navigation helper
  const tabsList: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'intro', label: '📖 Intro Guide', icon: <Dna className="w-4 h-4" />, color: 'bg-emerald-100 border-emerald-500 text-emerald-800' },
    { id: 'diffusion', label: '🔬 1. Diffusion / Gates', icon: <Activity className="w-4 h-4" />, color: 'bg-red-100 border-red-500 text-red-800' },
    { id: 'osmosis', label: '💧 2. Osmotic Balance', icon: <Droplet className="w-4 h-4" />, color: 'bg-sky-100 border-sky-500 text-sky-800' },
    { id: 'atp', label: '🔋 3. ATP Turbine Factory', icon: <Zap className="w-4 h-4" />, color: 'bg-purple-100 border-purple-500 text-purple-800' },
    { id: 'sandbox', label: '🕹️ 4. Systems Sandbox', icon: <Sparkles className="w-4 h-4" />, color: 'bg-yellow-105 border-yellow-500 text-yellow-800' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#2d2b2a] font-sans antialiased selection:bg-rose-100 select-none pb-12">
      
      {/* Upper Navigation Header Bar */}
      <header className="bg-white border-b-4 border-[#2d2b2a] py-4 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('intro')}>
            <div className="bg-[#fbbf24] border-3 border-[#2d2b2a] p-2 rounded-xl shadow-[3px_3px_0px_#2d2b2a] rotate-[-2deg]">
              <Dna className="w-7 h-7 text-[#2d2b2a]" />
            </div>
            <div>
              <h1 className="font-sans font-black text-2xl tracking-tight text-[#2d2b2a] leading-none">
                Virtual Cell Simulator
              </h1>
              <span className="font-mono text-xs font-bold text-slate-500 block mt-1 tracking-wider uppercase">
                An Explorable Systems Biology Workbench
              </span>
            </div>
          </div>

          {/* Interactive Navigation Menu List */}
          <div className="flex flex-wrap items-center gap-2">
            {tabsList.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative px-3.5 py-2 rounded-xl border-2 font-mono text-xs md:text-sm font-black transition-all duration-150 cursor-pointer ${
                  activeTab === t.id
                    ? 'border-[#2d2b2a] bg-[#fee2e2] text-rose-900 shadow-[4px_4px_0px_#2d2b2a] translate-x-[-1px] translate-y-[-1px]'
                    : 'border-slate-250 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {t.icon}
                  {t.label}
                </span>
              </button>
            ))}

            <button
              onClick={() => setShowHelperModal(true)}
              className="p-2 py-2 rounded-xl border-2 border-[#2d2b2a] bg-[#eff6ff] text-blue-800 font-mono text-xs font-black cursor-pointer shadow-[3px_3px_0px_#2d2b2a]"
              title="Show interactive legend"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Sandbox viewport container centered */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* INTRODUCTORY TAB */}
            {activeTab === 'intro' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4">
                
                {/* Introduction Text Block */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-6 md:p-8 shadow-[6px_6px_0px_#2d2b2a]">
                    <span className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
                      Welcome Explorer
                    </span>
                    
                    <h2 className="font-sans font-black text-3xl md:text-4xl text-[#2d2b2a] tracking-tight mt-4 leading-tight">
                      A cell is not a static bag of soup... <span className="text-emerald-600">It is a playable engine!</span>
                    </h2>

                    <p className="font-sans text-base md:text-lg text-slate-650 mt-5 leading-relaxed">
                      Every second, trillions of cell doors are snapping, spinning, spitting, and pumping to keep you alive. This simulation lets you slide the dials, build protein tunnels, spin ATP watermills, and test cellular mechanics!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="bg-[#f0fdf4] border-2 border-emerald-300 p-4 rounded-xl">
                        <span className="font-mono text-xs font-bold text-emerald-700 block mb-1">01 // THE BARRIER</span>
                        <p className="font-sans text-xs text-emerald-800 leading-relaxed">
                          Your skin is fat. The cell membrane is a <strong>double lipid layer</strong>. It repels polar candies (sugar) but allows gases to slip right through!
                        </p>
                      </div>

                      <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-xl">
                        <span className="font-mono text-xs font-bold text-amber-700 block mb-1">02 // SOLUTE FORCES</span>
                        <p className="font-sans text-xs text-amber-800 leading-relaxed">
                          Solutes like Sodium Sodium Sodium love water. Water pools towards salt (<strong>osmosis</strong>). Balanced states save cells from bursting!
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 border-t-2 border-[#2d2b2a]/10 pt-6 flex flex-wrap gap-3 items-center">
                      <button
                        onClick={() => setActiveTab('diffusion')}
                        className="flex items-center gap-2 bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black px-6 py-3 rounded-xl border-2 border-[#2d2b2a] cursor-pointer shadow-[4px_4px_0px_#2d2b2a] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        Start Exploring Cells <ChevronRight className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => setActiveTab('sandbox')}
                        className="flex items-center gap-2 bg-emerald-300 hover:bg-emerald-400 text-[#2d2b2a] font-black px-5 py-3 rounded-xl border-2 border-[#2d2b2a] cursor-pointer shadow-[3px_3px_0px_#2d2b2a]"
                      >
                        Launch Direct Sandbox
                      </button>
                    </div>
                  </div>

                  {/* Nicky Case principles reference design card */}
                  <div className="bg-[#f8fafc] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[4px_4px_0px_#fdba74]">
                    <h4 className="font-sans text-sm font-extrabold text-[#2d2b2a] flex items-center gap-1.5">
                      💡 Designed for Active Discovery
                    </h4>
                    <p className="font-sans text-xs text-slate-500 leading-relaxed mt-2">
                      In the spirit of active learning, this simulator is built to show systems thinking. Rather than listing definitions, tweak the sliders, remove channels, or uncouple mitochondria! Watch how simple chemical properties generate complex emergent cellular life.
                    </p>
                  </div>
                </div>

                {/* Introductory Interactive Right Side: Meet Celly */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  
                  {/* Celly preview profile */}
                  <div className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-6 shadow-[6px_6px_0px_#2d2b2a] flex flex-col items-center text-center">
                    <span className="font-mono text-xs font-bold text-slate-400">MEET THE LAB ASSISTANT</span>
                    
                    {/* Floating Celly vector */}
                    <div className="my-6">
                      <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-lg animate-bounce">
                        <path 
                          d="M 50,6 C 25,6 6,25 6,50 C 6,75 25,94 50,94 C 75,94 94,75 94,50 C 94,25 75,6 50,6 Z" 
                          fill="#86efac" stroke="#16a34a" strokeWidth="4.5"
                        />
                        <circle cx="36" cy="42" r="5" fill="#2d2b2a" />
                        <circle cx="36" cy="40" r="1.5" fill="#ffffff" />
                        <circle cx="64" cy="42" r="5" fill="#2d2b2a" />
                        <circle cx="64" cy="40" r="1.5" fill="#ffffff" />
                        <circle cx="26" cy="50" r="4.5" fill="#f472b6" opacity="0.6" />
                        <circle cx="74" cy="50" r="4.5" fill="#f472b6" opacity="0.6" />
                        <path d="M 40,58 Q 50,68 60,58" stroke="#2d2b2a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>

                    <h3 className="font-sans font-black text-xl text-[#2d2b2a]">"Hi, I'm Celly!"</h3>
                    <p className="font-sans text-xs text-slate-600 mt-2 max-w-sm">
                      I'm a single microscopic cell. I will adapt my face and emotions to guide you in the simulation. I reflect water levels, ATP energy counts, and health in real-time!
                    </p>

                    <div className="mt-4 flex gap-1 w-full border-t border-slate-200 pt-4 flex-wrap justify-center text-[10px] font-mono text-slate-400 uppercase">
                      <span>• Cytoplasma</span>
                      <span>• Lipids</span>
                      <span>• Mitochondria</span>
                      <span>• Aquaporins</span>
                    </div>
                  </div>

                  {/* Modules grid menu links */}
                  <div className="bg-white border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a] flex flex-col gap-3">
                    <span className="font-mono text-xs font-black text-[#2d2b2a] uppercase select-none border-b border-slate-200 pb-1">
                      Quick Start Modules
                    </span>

                    <button
                      onClick={() => setActiveTab('diffusion')}
                      className="p-2.5 border border-slate-300 rounded-xl text-left bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h5 className="font-sans text-xs font-black text-[#2d2b2a]">🔬 Module 1: Membranes & Gates</h5>
                        <p className="font-sans text-[10px] text-slate-500 leading-tight">Learn simple vs active glucose transport</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('osmosis')}
                      className="p-2.5 border border-slate-300 rounded-xl text-left bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h5 className="font-sans text-xs font-black text-[#2d2b2a]">💧 Module 2: Osmosis Water Rush</h5>
                        <p className="font-sans text-[10px] text-slate-500 leading-tight">Watch cells shrivel, swell or explode!</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('atp')}
                      className="p-2.5 border border-slate-300 rounded-xl text-left bg-white hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <h5 className="font-sans text-xs font-black text-[#2d2b2a]">🔋 Module 3: ATP Turbine Engine</h5>
                        <p className="font-sans text-[10px] text-slate-500 leading-tight">Spin ATP Synthase mills with Proton streams</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* DIFFUSION MODULE TAB */}
            {activeTab === 'diffusion' && <ModuleDiffusion />}

            {/* OSMOSIS MODULE TAB */}
            {activeTab === 'osmosis' && <ModuleOsmosis />}

            {/* ATP MODULE TAB */}
            {activeTab === 'atp' && <ModuleATP />}

            {/* SANDBOX GAMEPLAY TAB */}
            {activeTab === 'sandbox' && <Sandbox />}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* Interactive Legend Modal (Systems Diagnostics Sheet) */}
      <AnimatePresence>
        {showHelperModal && (
          <div className="fixed inset-0 bg-[#2d2b2a]/65 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-[#2d2b2a] rounded-2xl max-w-lg w-full p-6 shadow-[8px_8px_0px_#2d2b2a] relative"
            >
              <button
                onClick={() => setShowHelperModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 border-2 border-[#2d2b2a] bg-white text-[#2d2b2a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-sans text-xl font-black mb-4 pb-2 border-b-2 border-slate-200">
                🔬 Molecular Legend & Rules
              </h3>

              <div className="flex flex-col gap-4 text-sm font-sans">
                {/* O2 */}
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded-full bg-[#22c55e] border border-[#2d2b2a] inline-block shrink-0" />
                  <div>
                    <strong className="text-[#16a34a]">Oxygen (O₂) Gas</strong>
                    <p className="text-xs text-slate-500 leading-normal">
                      Tiny and nonpolar. slips directly through lipids without protein tunnels. Necessary for cell energy glycolysis.
                    </p>
                  </div>
                </div>

                {/* Glucose */}
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded-full bg-[#ec4899] border border-[#2d2b2a] inline-block shrink-0" />
                  <div>
                    <strong className="text-[#be185d]">Glucose Sugar</strong>
                    <p className="text-xs text-slate-500 leading-normal">
                      Huge polar candy nutrient. Absolutely bounced by lipids. Requires a green Carrier door (passive GLUT) or active pump.
                    </p>
                  </div>
                </div>

                {/* Water */}
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded-full bg-[#0284c7] border border-[#2d2b2a] inline-block shrink-0" />
                  <div>
                    <strong className="text-[#0369a1]">Water (H₂O)</strong>
                    <p className="text-xs text-slate-500 leading-normal">
                      Small polar fluid. Crosses slowly via leaks, but zooms at high speed through blue Aquaporins.
                    </p>
                  </div>
                </div>

                {/* Protons */}
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded-full bg-[#eab308] border border-[#2d2b2a] inline-block shrink-0 text-center text-xs font-black" style={{ lineHeight: '1.4rem' }}>+</span>
                  <div>
                    <strong className="text-[#854d0e]">Proton (H⁺) Ions</strong>
                    <p className="text-xs text-slate-500 leading-normal">
                      Charged hydrogen ions. Extremely blocked by fat. Pumped up to build battery gradient potentials, power spinning turbines.
                    </p>
                  </div>
                </div>

                {/* ATP */}
                <div className="flex gap-3 items-center">
                  <span className="w-6 h-6 rounded-full bg-[#a855f7] border border-[#2d2b2a] inline-block shrink-0" />
                  <div>
                    <strong className="text-[#6b21a8]">ATP Energy Currency</strong>
                    <p className="text-xs text-slate-500 leading-normal">
                      The golden currency coin of life. Generated by mitochondria turbine mills, consumed by membrane pumping engines.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t pt-4 text-center">
                <button
                  onClick={() => setShowHelperModal(false)}
                  className="bg-slate-800 text-white font-extrabold text-xs px-5 py-2 hover:bg-slate-700 border-2 border-[#2d2b2a] rounded-xl shadow-[2px_2px_0px_#2d2b2a] cursor-pointer"
                >
                  Got It, Let me Play!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
