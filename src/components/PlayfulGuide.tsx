import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CellStateMood } from '../types';

interface PlayfulGuideProps {
  mood: CellStateMood;
  title: string;
  speech: string;
  hint?: string;
  onNext?: () => void;
  onPrev?: () => void;
  showNavigation?: boolean;
  nextLabel?: string;
  prevLabel?: string;
}

export const PlayfulGuide: React.FC<PlayfulGuideProps> = ({
  mood,
  title,
  speech,
  hint,
  onNext,
  onPrev,
  showNavigation = false,
  nextLabel = "Next",
  prevLabel = "Back",
}) => {
  // SVG face based on mood
  const renderCellyFace = () => {
    switch (mood) {
      case 'bursting':
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Outer skin - bloated pinkish red */}
            <motion.circle 
              cx="50" cy="50" r="45" 
              fill="#fda4af" stroke="#e11d48" strokeWidth="4"
              animate={{ r: [43, 46, 43], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            {/* Big stressed eyes */}
            <circle cx="35" cy="42" r="10" fill="#2d2b2a" />
            <circle cx="35" cy="42" r="3" fill="#ffffff" />
            <circle cx="65" cy="42" r="10" fill="#2d2b2a" />
            <circle cx="65" cy="42" r="3" fill="#ffffff" />
            {/* Worried sweat drops */}
            <path d="M 28,15 Q 26,18 24,18" stroke="#38bdf8" strokeWidth="2" fill="none" />
            <path d="M 72,15 Q 74,18 76,18" stroke="#38bdf8" strokeWidth="2" fill="none" />
            {/* Tiny stressed mouth */}
            <circle cx="50" cy="65" r="4" fill="#2d2b2a" />
          </svg>
        );
      case 'shriveled':
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Wrinklier dehydrated membrane */}
            <motion.path 
              d="M 50,5 C 20,4 5,20 8,50 C 10,75 25,95 50,92 C 75,90 95,75 92,50 C 90,25 75,6 50,5 Z" 
              fill="#eab308" stroke="#ca8a04" strokeWidth="4"
              animate={{ d: [
                "M 50,5 C 22,4 6,22 8,50 C 11,72 26,93 50,92 C 73,91 94,73 92,50 C 91,27 73,6 50,5 Z",
                "M 50,9 C 25,7 12,24 10,50 C 8,76 22,90 50,89 C 78,88 90,74 89,50 C 88,26 75,11 50,9 Z",
                "M 50,5 C 22,4 6,22 8,50 C 11,72 26,93 50,92 C 73,91 94,73 92,50 C 91,27 73,6 50,5 Z"
              ]}}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            {/* Squeezing eyes */}
            <path d="M 28,42 L 38,46 M 38,42 L 28,46" stroke="#2d2b2a" strokeWidth="3" strokeLinecap="round" />
            <path d="M 62,42 L 72,46 M 72,42 L 62,46" stroke="#2d2b2a" strokeWidth="3" strokeLinecap="round" />
            {/* Sad dehydrated mouth */}
            <path d="M 40,65 Q 50,58 60,65" stroke="#2d2b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'starving':
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Weak, pale body */}
            <motion.circle 
              cx="50" cy="50" r="42" 
              fill="#cbd5e1" stroke="#64748b" strokeWidth="4"
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            {/* Dizzy spiraling eyes */}
            <path d="M 30,38 A 6,6 0 1,1 40,44" stroke="#2d2b2a" strokeWidth="2.5" fill="none" />
            <path d="M 60,38 A 6,6 0 1,1 70,44" stroke="#2d2b2a" strokeWidth="2.5" fill="none" />
            {/* Slack mouth */}
            <ellipse cx="50" cy="65" rx="6" ry="9" fill="#2d2b2a" />
          </svg>
        );
      case 'energetic':
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Vibrant yellow-orange energized cell */}
            <motion.circle 
              cx="50" cy="50" r="44" 
              fill="#fbbf24" stroke="#d97706" strokeWidth="4"
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [-2, 2, -2]
              }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
            />
            {/* Sparkly hyper active eyes */}
            <g transform="translate(30, 35)">
              <polygon points="5,0 7,4 11,4 8,7 9,11 5,8 1,11 2,7 -1,4 3,4" fill="#2d2b2a" />
            </g>
            <g transform="translate(60, 35)">
              <polygon points="5,0 7,4 11,4 8,7 9,11 5,8 1,11 2,7 -1,4 3,4" fill="#2d2b2a" />
            </g>
            {/* Huge wide grin showing tongue */}
            <path d="M 33,58 C 33,75 67,75 67,58 Z" fill="#991b1b" stroke="#2d2b2a" strokeWidth="2" />
            <path d="M 42,66 Q 50,60 58,66 Q 50,73 42,66" fill="#f43f5e" />
          </svg>
        );
      case 'worried':
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Blue-purple worried cell */}
            <motion.circle 
              cx="50" cy="50" r="42" 
              fill="#a78bfa" stroke="#6d28d9" strokeWidth="4"
              animate={{ x: [-1, 1, -1, 0] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            {/* Slanted concerned eyebrows and nervous eyes */}
            <path d="M 28,30 L 40,35" stroke="#2d2b2a" strokeWidth="3" strokeLinecap="round" />
            <path d="M 72,30 L 60,35" stroke="#2d2b2a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="35" cy="44" r="5" fill="#2d2b2a" />
            <circle cx="65" cy="44" r="5" fill="#2d2b2a" />
            {/* Squiggly nervous mouth */}
            <path d="M 38,65 Q 43,58 48,65 T 58,65" stroke="#2d2b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'happy':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-md">
            {/* Cute healthy soft-green membrane */}
            <motion.path 
              d="M 50,6 C 25,6 6,25 6,50 C 6,75 25,94 50,94 C 75,94 94,75 94,50 C 94,25 75,6 50,6 Z" 
              fill="#86efac" stroke="#16a34a" strokeWidth="4"
              animate={{ d: [
                "M 50,6 C 25,6 6,25 6,50 C 6,75 25,94 50,94 C 75,94 94,75 94,50 C 94,25 75,6 50,6 Z",
                "M 50,7 C 27,5 7,27 6,50 C 5,73 27,95 50,93 C 73,95 95,73 94,50 C 93,27 73,5 50,7 Z",
                "M 50,6 C 25,6 6,25 6,50 C 6,75 25,94 50,94 C 75,94 94,75 94,50 C 94,25 75,6 50,6 Z"
              ]}}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            {/* Joyful eyes */}
            <circle cx="36" cy="42" r="5" fill="#2d2b2a" />
            <circle cx="36" cy="40" r="1.5" fill="#ffffff" />
            <circle cx="64" cy="42" r="5" fill="#2d2b2a" />
            <circle cx="64" cy="40" r="1.5" fill="#ffffff" />
            {/* Rosy cheeks */}
            <circle cx="26" cy="50" r="4" fill="#f472b6" opacity="0.6" />
            <circle cx="74" cy="50" r="4" fill="#f472b6" opacity="0.6" />
            {/* Happy curved mouth */}
            <path d="M 42,58 Q 50,68 58,58" stroke="#2d2b2a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div id="celly-guide-panel" className="bg-[#fffdf9] border-4 border-[#2d2b2a] rounded-2xl p-5 shadow-[6px_6px_0px_#2d2b2a] flex flex-col md:flex-row gap-5 items-center max-w-4xl mx-auto my-4 relative overflow-hidden">
      {/* Decorative background grid elements in theme of Nicky Case */}
      <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-[#2d2b2a]/20 select-none">
        SYS // CELLY_v1.0
      </div>

      {/* Celly Character Container */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 1 }}
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
        >
          {renderCellyFace()}
        </motion.div>
        <span className="mt-2 font-mono text-xs font-bold text-[#2d2b2a] border-2 border-[#2d2b2a] bg-[#f8fafc] px-2 py-0.5 rounded-full select-none shadow-[2px_2px_0px_#2d2b2a]">
          Celly
        </span>
      </div>

      {/* Dialog box / Speech Bubble */}
      <div className="flex-1 flex flex-col justify-between w-full h-full min-h-[110px]">
        <div>
          <h4 className="font-sans text-lg font-extrabold text-[#2d2b2a] tracking-tight border-b-2 border-[#2d2b2a]/10 pb-1 mb-2">
            {title}
          </h4>
          <p className="font-sans text-sm md:text-base text-[#475569] leading-relaxed">
            {speech}
          </p>
          
          <AnimatePresence>
            {hint && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 bg-[#fef9c3] border-2 border-[#eab308] text-xs md:text-sm text-[#854d0e] p-2 rounded-lg font-mono flex items-start gap-1"
              >
                <span className="font-bold shrink-0">💡 HINT:</span>
                <span>{hint}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        {showNavigation && (
          <div className="flex justify-between items-center mt-4 border-t-2 border-[#2d2b2a]/10 pt-3">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className={`px-3 py-1 text-xs md:text-sm font-bold font-mono rounded-lg border-2 border-[#2d2b2a] transition-all ${
                onPrev 
                  ? 'bg-white hover:bg-slate-100 cursor-pointer shadow-[3px_3px_0px_#2d2b2a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#2d2b2a]' 
                  : 'bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              ← {prevLabel}
            </button>
            <button
              onClick={onNext}
              disabled={!onNext}
              className={`px-4 py-1.5 text-xs md:text-sm font-bold font-mono rounded-lg border-2 border-[#2d2b2a] transition-all ${
                onNext 
                  ? 'bg-[#86efac] hover:bg-[#4ade80] cursor-pointer shadow-[3px_3px_0px_#2d2b2a] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#2d2b2a]' 
                  : 'bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
              }`}
            >
              {nextLabel} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
