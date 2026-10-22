import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  BookOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

// Lightweight Web Audio feedback for tactile student learning
function playAudioTone(type: 'correct' | 'wrong' | 'drop') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'correct') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Audio context may be restricted by browser until user gesture
  }
}

// ── TYPES & SUBSHELL SPECIFICATIONS ─────────────────────────────────────────

export type SubshellId = '1s' | '2s' | '2p' | '3s' | '3p';
export type ElementId = 'Na' | 'S';

export interface SubshellDef {
  id: SubshellId;
  name: string;
  n: number;
  l: number; // 0 = s, 1 = p
  capacity: number;
  targetCount: number;
  radius: number; // SVG concentric circle radius
  ringColor: string; // Dark, distinct color
  ringGlow: string;
  electronColor: string; // Distinct electron color
  electronGlow: string;
  textColor: string;
  bgLight: string;
  rotationDuration: string; // Orbit rotation speed along axis
}

export interface ElementData {
  id: ElementId;
  name: string;
  symbol: string;
  z: number;
  subshells: SubshellDef[];
  targetConfiguration: Record<SubshellId, number>;
  successMessage: string;
}

const ELEMENTS: Record<ElementId, ElementData> = {
  Na: {
    id: 'Na',
    name: 'Sodium',
    symbol: 'Na',
    z: 11,
    subshells: [
      {
        id: '1s',
        name: '1s Subshell',
        n: 1,
        l: 0,
        capacity: 2,
        targetCount: 2,
        radius: 62,
        ringColor: '#1D4ED8', // Dark Royal Blue
        ringGlow: 'rgba(37, 99, 235, 0.45)',
        electronColor: '#2563EB', // Vivid Blue
        electronGlow: 'rgba(37, 99, 235, 0.5)',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50',
        rotationDuration: '14s',
      },
      {
        id: '2s',
        name: '2s Subshell',
        n: 2,
        l: 0,
        capacity: 2,
        targetCount: 2,
        radius: 112,
        ringColor: '#0E7490', // Dark Cyan/Teal
        ringGlow: 'rgba(6, 182, 212, 0.45)',
        electronColor: '#06B6D4', // Vivid Cyan
        electronGlow: 'rgba(6, 182, 212, 0.5)',
        textColor: 'text-cyan-700',
        bgLight: 'bg-cyan-50',
        rotationDuration: '22s',
      },
      {
        id: '2p',
        name: '2p Subshell',
        n: 2,
        l: 1,
        capacity: 6,
        targetCount: 6,
        radius: 164,
        ringColor: '#6D28D9', // Dark Violet/Purple
        ringGlow: 'rgba(139, 92, 246, 0.45)',
        electronColor: '#8B5CF6', // Vivid Purple
        electronGlow: 'rgba(139, 92, 246, 0.5)',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-50',
        rotationDuration: '30s',
      },
      {
        id: '3s',
        name: '3s Subshell',
        n: 3,
        l: 0,
        capacity: 2,
        targetCount: 1, // Sodium has only 1 valence electron in 3s!
        radius: 216,
        ringColor: '#B45309', // Dark Amber/Orange
        ringGlow: 'rgba(245, 158, 11, 0.45)',
        electronColor: '#F59E0B', // Vivid Amber
        electronGlow: 'rgba(245, 158, 11, 0.5)',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50',
        rotationDuration: '38s',
      },
    ],
    targetConfiguration: {
      '1s': 2,
      '2s': 2,
      '2p': 6,
      '3s': 1,
      '3p': 0,
    },
    successMessage: '🎉 Correct configuration! Sodium (Na, Z=11) ground state is correct.',
  },
  S: {
    id: 'S',
    name: 'Sulfur',
    symbol: 'S',
    z: 16,
    subshells: [
      {
        id: '1s',
        name: '1s Subshell',
        n: 1,
        l: 0,
        capacity: 2,
        targetCount: 2,
        radius: 50,
        ringColor: '#1D4ED8',
        ringGlow: 'rgba(37, 99, 235, 0.45)',
        electronColor: '#2563EB',
        electronGlow: 'rgba(37, 99, 235, 0.5)',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50',
        rotationDuration: '14s',
      },
      {
        id: '2s',
        name: '2s Subshell',
        n: 2,
        l: 0,
        capacity: 2,
        targetCount: 2,
        radius: 92,
        ringColor: '#0E7490',
        ringGlow: 'rgba(6, 182, 212, 0.45)',
        electronColor: '#06B6D4',
        electronGlow: 'rgba(6, 182, 212, 0.5)',
        textColor: 'text-cyan-700',
        bgLight: 'bg-cyan-50',
        rotationDuration: '20s',
      },
      {
        id: '2p',
        name: '2p Subshell',
        n: 2,
        l: 1,
        capacity: 6,
        targetCount: 6,
        radius: 134,
        ringColor: '#6D28D9',
        ringGlow: 'rgba(139, 92, 246, 0.45)',
        electronColor: '#8B5CF6',
        electronGlow: 'rgba(139, 92, 246, 0.5)',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-50',
        rotationDuration: '26s',
      },
      {
        id: '3s',
        name: '3s Subshell',
        n: 3,
        l: 0,
        capacity: 2,
        targetCount: 2,
        radius: 176,
        ringColor: '#B45309',
        ringGlow: 'rgba(245, 158, 11, 0.45)',
        electronColor: '#F59E0B',
        electronGlow: 'rgba(245, 158, 11, 0.5)',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50',
        rotationDuration: '32s',
      },
      {
        id: '3p',
        name: '3p Subshell',
        n: 3,
        l: 1,
        capacity: 6,
        targetCount: 4, // Sulfur has 4 valence electrons in 3p! (Total = 16)
        radius: 218,
        ringColor: '#C026D3', // Dark Fuchsia
        ringGlow: 'rgba(217, 70, 239, 0.45)',
        electronColor: '#D946EF', // Vivid Magenta
        electronGlow: 'rgba(217, 70, 239, 0.5)',
        textColor: 'text-fuchsia-700',
        bgLight: 'bg-fuchsia-50',
        rotationDuration: '38s',
      },
    ],
    targetConfiguration: {
      '1s': 2,
      '2s': 2,
      '2p': 6,
      '3s': 2,
      '3p': 4,
    },
    successMessage: '🎉 Correct configuration! Sulfur (S, Z=16) ground state 1s² 2s² 2p⁶ 3s² 3p⁴ is correct.',
  },
};

// Mini orbital shape diagrams for 1s, 2s, 2p, 3s, 3p boxes
function renderOrbitalShape(id: SubshellId) {
  if (id === '1s') {
    return (
      <svg viewBox="0 0 28 28" className="w-5 h-5 shrink-0" aria-label="1s spherical orbital">
        <defs>
          <radialGradient id="shape1sGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="65%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="10.5" fill="url(#shape1sGrad)" filter="drop-shadow(0 1px 2px rgba(37,99,235,0.3))" />
        <ellipse cx="14" cy="14" rx="10.5" ry="3.5" fill="none" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.65" />
      </svg>
    );
  }
  if (id === '2s') {
    return (
      <svg viewBox="0 0 28 28" className="w-5 h-5 shrink-0" aria-label="2s spherical orbital with node">
        <defs>
          <radialGradient id="shape2sGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="65%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0891B2" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="11.5" fill="none" stroke="#0E7490" strokeWidth="1.2" strokeDasharray="2 1.5" />
        <circle cx="14" cy="14" r="7.5" fill="url(#shape2sGrad)" filter="drop-shadow(0 1px 2px rgba(6,182,212,0.3))" />
      </svg>
    );
  }
  if (id === '2p') {
    return (
      <svg viewBox="0 0 28 28" className="w-5 h-5 shrink-0" aria-label="2p dumbbell orbital">
        <defs>
          <linearGradient id="shape2pLobeA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D8B4FE" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="shape2pLobeB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
        </defs>
        <path d="M14 14 C10 10, 8 4, 14 4 C20 4, 18 10, 14 14 Z" fill="url(#shape2pLobeA)" filter="drop-shadow(0 1px 2px rgba(124,58,237,0.3))" />
        <path d="M14 14 C10 18, 8 24, 14 24 C20 24, 18 18, 14 14 Z" fill="url(#shape2pLobeB)" filter="drop-shadow(0 1px 2px rgba(147,51,234,0.3))" />
        <circle cx="14" cy="14" r="1.5" fill="#FFFFFF" stroke="#6D28D9" strokeWidth="0.5" />
      </svg>
    );
  }
  if (id === '3s') {
    return (
      <svg viewBox="0 0 28 28" className="w-5 h-5 shrink-0" aria-label="3s spherical orbital with nodes">
        <defs>
          <radialGradient id="shape3sGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
        </defs>
        <circle cx="14" cy="14" r="12" fill="none" stroke="#B45309" strokeWidth="1" strokeDasharray="2 1.5" />
        <circle cx="14" cy="14" r="8.5" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <circle cx="14" cy="14" r="5" fill="url(#shape3sGrad)" filter="drop-shadow(0 1px 2px rgba(245,158,11,0.3))" />
      </svg>
    );
  }
  // 3p
  return (
    <svg viewBox="0 0 28 28" className="w-5 h-5 shrink-0" aria-label="3p dumbbell orbital with node">
      <defs>
        <linearGradient id="shape3pLobeA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5D0FE" />
          <stop offset="100%" stopColor="#C026D3" />
        </linearGradient>
        <linearGradient id="shape3pLobeB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FAE8FF" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <path d="M14 14 C10 9, 8 3, 14 3 C20 3, 18 9, 14 14 Z" fill="url(#shape3pLobeA)" filter="drop-shadow(0 1px 2px rgba(192,38,211,0.3))" />
      <path d="M14 14 C10 19, 8 25, 14 25 C20 25, 18 19, 14 14 Z" fill="url(#shape3pLobeB)" filter="drop-shadow(0 1px 2px rgba(217,70,239,0.3))" />
      <ellipse cx="14" cy="14" rx="4" ry="1.6" fill="none" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1.5 1" opacity="0.8" />
      <circle cx="14" cy="14" r="1.5" fill="#FFFFFF" stroke="#C026D3" strokeWidth="0.5" />
    </svg>
  );
}

export interface AufbauSodiumLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function AufbauSodiumLevel1GamePage({
  difficulty = 'level1',
  onExit,
}: AufbauSodiumLevel1GamePageProps) {
  // Navigation Screens: 'mission' -> 'instructions' -> active gameplay
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Current active element challenge: 'Na' (Z=11) -> 'S' (Z=16)
  const [currentElementId, setCurrentElementId] = useState<ElementId>('Na');
  const currentElement = ELEMENTS[currentElementId];

  // Active Subshell Selected by User
  const [selectedSubshellId, setSelectedSubshellId] = useState<SubshellId>('1s');

  // Electron occupancy count in each subshell (freeform insertion)
  const [occupancy, setOccupancy] = useState<Record<SubshellId, number>>({
    '1s': 0,
    '2s': 0,
    '2p': 0,
    '3s': 0,
    '3p': 0,
  });

  // Assessment Submission Status: 'idle' | 'correct' | 'incorrect'
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // UI Feedback / Alerts
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const [shakingSubshellId, setShakingSubshellId] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [, setIsCompleted] = useState(false);

  const exitSimulation = () => {
    window.location.href = '/challenge/atomic-structure-quantum-mechanics/electronic-configurations';
  };

  // Total electrons filled so far for the active element
  const totalElectrons = useMemo(() => {
    return currentElement.subshells.reduce((acc, sub) => acc + (occupancy[sub.id] || 0), 0);
  }, [occupancy, currentElement]);

  // Check Aufbau principle: lower-energy orbitals must be occupied with at least 1 e⁻ first
  const canOccupySubshell = (id: SubshellId) => {
    const subshells = currentElement.subshells;
    const curIdx = subshells.findIndex((s) => s.id === id);
    if (curIdx < 0) return false;
    for (let i = 0; i < curIdx; i++) {
      const priorSub = subshells[i];
      if ((occupancy[priorSub.id] || 0) < 1) {
        return false;
      }
    }
    return true;
  };

  // Trigger Aufbau feedback warning
  const triggerAufbauError = (subshellId: string) => {
    setShakingSubshellId(subshellId);
    setTimeout(() => setShakingSubshellId(null), 600);
    setFeedback({
      type: 'error',
      message: 'Follow the Aufbau principle, which says electrons occupy lower-energy orbitals first!',
    });
    try {
      playAudioTone('wrong');
    } catch {
      // ignore
    }
    setTimeout(() => {
      setFeedback((prev) =>
        prev?.message.includes('Aufbau') ? null : prev
      );
    }, 3200);
  };

  // Handle selecting subshell with Aufbau validation notice
  const handleSelectSubshell = (id: SubshellId) => {
    if (!canOccupySubshell(id)) {
      triggerAufbauError(id);
    }
    setSelectedSubshellId(id);
  };

  // Add electron to selected subshell (must satisfy Aufbau: all lower-energy subshells have >= 1 e⁻)
  const handleAddElectron = (targetId?: SubshellId) => {
    const id = targetId || selectedSubshellId;
    if (submissionStatus === 'correct') return;

    // Aufbau rule check: lower energy subshells must be occupied with at least 1 electron first
    if (!canOccupySubshell(id)) {
      triggerAufbauError(id);
      return;
    }

    // Reset incorrect status upon re-editing
    if (submissionStatus === 'incorrect') {
      setSubmissionStatus('idle');
      setFeedback(null);
    }

    // Safety ceiling of 14 per subshell to prevent visual clutter
    if ((occupancy[id] || 0) >= 14) return;

    setOccupancy((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    try {
      playAudioTone('drop');
    } catch {
      // ignore
    }
  };

  // Remove electron from selected subshell
  const handleRemoveElectron = (targetId?: SubshellId) => {
    const id = targetId || selectedSubshellId;
    if (submissionStatus === 'correct') return;

    if (submissionStatus === 'incorrect') {
      setSubmissionStatus('idle');
      setFeedback(null);
    }

    if ((occupancy[id] || 0) <= 0) return;

    setOccupancy((prev) => ({ ...prev, [id]: prev[id] - 1 }));
    try {
      playAudioTone('drop');
    } catch {
      // ignore
    }
  };

  // Submit and verify user's electronic configuration against active element ground state
  const handleSubmit = () => {
    const target = currentElement.targetConfiguration;
    const isCorrect = currentElement.subshells.every(
      (sub) => (occupancy[sub.id] || 0) === target[sub.id]
    );

    if (isCorrect) {
      setSubmissionStatus('correct');
      setIsCompleted(true);
      setFeedback({
        type: 'success',
        message: currentElement.successMessage,
      });
      try {
        playAudioTone('correct');
      } catch {
        // ignore
      }
    } else {
      setSubmissionStatus('incorrect');
      setShakingSubshellId('all');
      setTimeout(() => setShakingSubshellId(null), 600);
      setFeedback({
        type: 'error',
        message: '❌ Incorrect configuration! Please try again.',
      });
      try {
        playAudioTone('wrong');
      } catch {
        // ignore
      }
    }
  };

  // Advance to Stage 2: Sulfur (S, Z=16)
  const handleNextElement = () => {
    setCurrentElementId('S');
    setSelectedSubshellId('1s');
    setOccupancy({ '1s': 0, '2s': 0, '2p': 0, '3s': 0, '3p': 0 });
    setSubmissionStatus('idle');
    setFeedback({
      type: 'info',
      message: '🌟 Stage 2: Fill electrons for Sulfur (S, Z=16)!',
    });
    setIsCompleted(false);
    setTimeout(() => {
      setFeedback((prev) => (prev?.type === 'info' ? null : prev));
    }, 3000);
  };

  // Play Again: reset electrons and assessment status without revealing the solution
  const handlePlayAgain = () => {
    setOccupancy({ '1s': 0, '2s': 0, '2p': 0, '3s': 0, '3p': 0 });
    setSelectedSubshellId('1s');
    setSubmissionStatus('idle');
    setFeedback(null);
    setIsCompleted(false);
  };

  const handleReset = () => {
    handlePlayAgain();
  };

  // Selected subshell object
  const activeSubshell =
    currentElement.subshells.find((s) => s.id === selectedSubshellId) ||
    currentElement.subshells[0];

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-2.5 max-w-[440px] mx-auto">
      {/* ── SCREEN 1: MISSION SCREEN (Matching Reference Image 1) ───────────── */}
      {!gameStarted && introStep === 'mission' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Mission Center Title and Next Button */}
          <div className="max-w-md mx-auto my-auto text-center space-y-4 sm:space-y-5 z-10 px-4 py-4 animate-in fade-in duration-200">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Fill Sodium&apos;s Electron Shells
            </h1>

            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => setIntroStep('instructions')}
                className="px-8 sm:px-10 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>

          {/* Bottom Left Badge Placeholder */}
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-md">
            Na
          </div>
        </div>
      )}

      {/* ── SCREEN 2: INSTRUCTIONS SCREEN (Matching Reference Image 2) ──────── */}
      {!gameStarted && introStep === 'instructions' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-md mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
            <div className="text-center pt-1 pb-2">
              <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                INSTRUCTIONS TO PLAY
              </h2>
            </div>

            <div className="flex flex-col gap-3 w-full mx-auto my-auto">
              {/* Card 1: Select Subshell & Add Electrons (Matching real gameplay controls) */}
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                      Select Subshell &amp; Add Electrons
                    </h3>
                  </div>

                  <div className="mt-1.5 mb-2">
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                      Step 1: Fill Subshells
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    At the bottom, select a subshell tab (<strong>1s, 2s, 2p, or 3s</strong>). Then tap the <strong>+ ADD TO [SUBSHELL]</strong> button to insert electrons into that orbital ring.
                  </p>
                </div>

                {/* Visual Preview Box 1: Exact miniature representation of the real gameplay bottom deck */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 px-1">
                    <span>SUBSHELL &amp; ELECTRON CONTROLS</span>
                    <span className="text-blue-600 font-bold">Tap to Select &amp; Add</span>
                  </div>

                  {/* 4 Subshell Cards */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* 1s (Active) */}
                    <div className="h-15 rounded-xl border-2 border-blue-500 bg-blue-50/70 p-1 flex flex-col items-center justify-between shadow-xs ring-1 ring-blue-300">
                      <div className="flex items-center justify-between w-full px-0.5 leading-none">
                        <span className="text-[10px] font-mono font-black text-blue-700">1S</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 my-auto">
                        {renderOrbitalShape('1s')}
                        <span className="font-mono font-black text-xs text-blue-900">0</span>
                      </div>
                      <span className="text-[7px] font-mono font-extrabold uppercase px-1 py-0.5 rounded-xs bg-blue-200 text-blue-900 leading-none">
                        ACTIVE
                      </span>
                    </div>

                    {/* 2s */}
                    <div className="h-15 rounded-xl border border-slate-200 bg-white p-1 flex flex-col items-center justify-between shadow-xs">
                      <div className="flex items-center justify-between w-full px-0.5 leading-none">
                        <span className="text-[10px] font-mono font-black text-slate-600">2S</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 my-auto">
                        {renderOrbitalShape('2s')}
                        <span className="font-mono font-black text-xs text-slate-800">0</span>
                      </div>
                      <span className="text-[7px] font-mono font-extrabold uppercase px-1 py-0.5 rounded-xs text-slate-400 leading-none">
                        SELECT
                      </span>
                    </div>

                    {/* 2p */}
                    <div className="h-15 rounded-xl border border-slate-200 bg-white p-1 flex flex-col items-center justify-between shadow-xs">
                      <div className="flex items-center justify-between w-full px-0.5 leading-none">
                        <span className="text-[10px] font-mono font-black text-slate-600">2P</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 my-auto">
                        {renderOrbitalShape('2p')}
                        <span className="font-mono font-black text-xs text-slate-800">0</span>
                      </div>
                      <span className="text-[7px] font-mono font-extrabold uppercase px-1 py-0.5 rounded-xs text-slate-400 leading-none">
                        SELECT
                      </span>
                    </div>

                    {/* 3s */}
                    <div className="h-15 rounded-xl border border-slate-200 bg-white p-1 flex flex-col items-center justify-between shadow-xs">
                      <div className="flex items-center justify-between w-full px-0.5 leading-none">
                        <span className="text-[10px] font-mono font-black text-slate-600">3S</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 my-auto">
                        {renderOrbitalShape('3s')}
                        <span className="font-mono font-black text-xs text-slate-800">0</span>
                      </div>
                      <span className="text-[7px] font-mono font-extrabold uppercase px-1 py-0.5 rounded-xs text-slate-400 leading-none">
                        SELECT
                      </span>
                    </div>
                  </div>

                  {/* Buttons replica from gameplay */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <div className="w-7 h-6.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 shadow-2xs">
                      <RotateCcw className="w-3 h-3" />
                    </div>
                    <div className="px-2 h-6.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[9px] font-mono font-bold text-slate-400 shadow-2xs">
                      — REMOVE E⁻
                    </div>
                    <div className="flex-1 h-6.5 rounded-lg bg-blue-600 text-white flex items-center justify-center gap-1 text-[9.5px] font-mono font-black tracking-wide shadow-xs">
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>+ ADD TO 1S</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Fill Electrons & Submit Configuration */}
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                      Submit &amp; Check Your Answer
                    </h3>
                  </div>

                  <div className="mt-1.5 mb-2">
                    <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                      Step 2: Verify Configuration
                    </span>
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    Fill the electrons for Sodium (Na, Z=11) based on your knowledge. Tap <strong>SUBMIT CONFIGURATION</strong> to check. If wrong, tap <strong>PLAY AGAIN</strong> to retry without hints!
                  </p>
                </div>

                {/* Visual Preview Box 2: Verification buttons preview */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 px-1">
                    <span>SELF-CHECK VALIDATION</span>
                    <span className="text-sky-600 font-bold">Submit When Ready</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="py-1.5 px-3 rounded-lg bg-[#0284C7] text-white text-center text-xs font-mono font-black flex items-center justify-center gap-1.5 shadow-xs">
                      <span>SUBMIT CONFIGURATION</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="py-1 px-2 rounded-lg bg-rose-50 border border-rose-300 text-center text-[10px] font-mono font-black text-rose-700 flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3 text-rose-600" />
                        <span>PLAY AGAIN</span>
                      </div>
                      <div className="py-1 px-2 rounded-lg bg-emerald-50 border border-emerald-300 text-center text-[10px] font-mono font-black text-emerald-800 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>CORRECT (NEXT)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back & Play */}
            <div className="pt-3 pb-1 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIntroStep('mission')}
                className="px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="px-8 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE GAMEPLAY SCREEN (Matching Reference Image 3) ────── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {/* ── 1. TOP TOOLBAR: EXIT & EXPLANATION ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-0.5 mb-1 px-0.5">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
              <span>EXPLANATION</span>
            </button>
          </header>

          {/* Floating Error / Success Banner */}
          {feedback && (
            <div className="absolute top-11 left-2 right-2 z-30 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-1 duration-200">
              <div
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md max-w-[95%] text-center border backdrop-blur-md pointer-events-auto flex items-center gap-1.5 ${
                  feedback.type === 'error'
                    ? 'bg-red-500/95 text-white border-red-600 animate-shake shadow-red-500/20'
                    : feedback.type === 'success'
                    ? 'bg-emerald-600/95 text-white border-emerald-700 shadow-emerald-500/20'
                    : 'bg-slate-800/90 text-white border-slate-700'
                }`}
              >
                {feedback.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
                )}
                {feedback.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* ── 2. UPPER / MAIN AREA: NESTED CIRCULAR ORBITS CANVAS ── */}
          <div className="w-full flex-1 min-h-0 relative overflow-hidden bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-0.5">
            {/* SVG of Nested Circular Shells */}
            <svg
              viewBox="-240 -240 480 480"
              className="w-full h-full max-h-[500px] sm:max-h-[540px] select-none"
            >
              {/* Animation keyframes for moving on axis */}
              <defs>
                <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#1E40AF" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
                </radialGradient>
              </defs>

              <style>{`
                @keyframes orbitSpinCw {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes orbitSpinCcw {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(-360deg); }
                }
              `}</style>

              {/* Concentric Subshell Circles */}
              {currentElement.subshells.map((sub, idx) => {
                const count = occupancy[sub.id] || 0;
                const isSelected = selectedSubshellId === sub.id;
                const isCorrect = submissionStatus === 'correct';
                const isShaking = shakingSubshellId === sub.id || shakingSubshellId === 'all';

                // Color calculation:
                // Only if verified correct upon submit -> Green (#059669)
                // If shaking upon incorrect submit -> Red (#EF4444)
                // Otherwise during play -> Distinct subshell color (no hints, no green)
                const strokeColor = isShaking
                  ? '#EF4444'
                  : isCorrect
                  ? '#059669'
                  : sub.ringColor;

                const strokeWidth = isSelected ? 4 : isCorrect ? 3.5 : 2.8;
                const strokeDasharray = isCorrect ? 'none' : isSelected ? 'none' : '6 4';

                // Electron angles evenly spaced along the circumference for unlimited electrons
                const divisor = Math.max(count, sub.capacity, 1);
                const electronAngles = Array.from({ length: count }).map((_, i) => {
                  return (i * 360) / divisor - 90;
                });

                return (
                  <g key={`ring-${sub.id}`}>
                    {/* Ring highlight glow when selected or verified correct */}
                    {(isSelected || isCorrect) && (
                      <circle
                        cx="0"
                        cy="0"
                        r={sub.radius}
                        fill="none"
                        stroke={isCorrect ? 'rgba(16, 185, 129, 0.35)' : sub.ringGlow}
                        strokeWidth={isSelected ? 12 : 8}
                        className={isSelected ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* Main Subshell Ring (Clickable, distinct color, dark stroke) */}
                    <circle
                      cx="0"
                      cy="0"
                      r={sub.radius}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => {
                        handleSelectSubshell(sub.id);
                        handleAddElectron(sub.id);
                      }}
                    />

                    {/* Ring Label Badge (Positioned at top of each ring) - ENLARGED BOX */}
                    <g
                      transform={`translate(0, ${-sub.radius})`}
                      className="cursor-pointer"
                      onClick={() => handleSelectSubshell(sub.id)}
                    >
                      <rect
                        x="-27"
                        y="-13"
                        width="54"
                        height="26"
                        rx="13"
                        fill={isCorrect ? '#059669' : isSelected ? sub.ringColor : '#FFFFFF'}
                        stroke={isCorrect ? '#047857' : sub.ringColor}
                        strokeWidth="2.5"
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.18))"
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill={isCorrect || isSelected ? '#FFFFFF' : sub.ringColor}
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="monospace"
                      >
                        {sub.id}
                      </text>
                    </g>

                    {/* Orbiting Electrons Group - Moving continuously on its axis! */}
                    <g
                      style={{
                        transformOrigin: '0px 0px',
                        animation: `${idx % 2 === 0 ? 'orbitSpinCw' : 'orbitSpinCcw'} ${sub.rotationDuration} linear infinite`,
                      }}
                    >
                      {electronAngles.map((angleDeg, eIdx) => {
                        const rad = (angleDeg * Math.PI) / 180;
                        const ex = sub.radius * Math.cos(rad);
                        const ey = sub.radius * Math.sin(rad);

                        return (
                          <g key={`elec-${sub.id}-${eIdx}`} transform={`translate(${ex}, ${ey})`}>
                            {/* Outer electron glow with distinct subshell color */}
                            <circle
                              r="16"
                              fill={sub.electronGlow}
                              className="animate-pulse"
                            />
                            {/* Core electron sphere with distinct subshell color (Almost double size) */}
                            <circle
                              r="11"
                              fill={sub.electronColor}
                              stroke="#FFFFFF"
                              strokeWidth="2.2"
                              filter="drop-shadow(0 2px 6px rgba(0,0,0,0.35))"
                            />
                            {/* Prominent minus sign */}
                            <text
                              x="0"
                              y="4.5"
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="15"
                              fontWeight="900"
                              fontFamily="monospace"
                            >
                              -
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </g>
                );
              })}

              {/* Central Nucleus */}
              <circle cx="0" cy="0" r="28" fill="url(#nucleusGlow)" />
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="#0F172A"
                stroke={currentElementId === 'S' ? '#D946EF' : '#3B82F6'}
                strokeWidth="2"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
              />
              {/* Nucleus Symbol */}
              <text
                x="0"
                y="-1"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                {currentElement.symbol}
              </text>
              <text
                x="0"
                y="9"
                textAnchor="middle"
                fill={currentElementId === 'S' ? '#F5D0FE' : '#93C5FD'}
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Z={currentElement.z}
              </text>
            </svg>

            {/* Subshell Selection Status Bar right below canvas (Enlarged font, Total e- removed) */}
            <div className="flex items-center justify-center w-full max-w-[400px] px-2 pt-1.5 pb-1">
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-600 tracking-wide">
                Active Ring:{' '}
                <strong className={`font-black text-sm sm:text-base ${activeSubshell.textColor}`}>
                  {activeSubshell.name}
                </strong>
              </span>
            </div>
          </div>

          {/* ── 3. BOTTOM SECTION: SUBSHELL DECK & ELECTRON FILLING OPTIONS ── */}
          <div className="w-full shrink-0 flex flex-col gap-2 pt-1.5 pb-2 px-1 bg-white border-t border-slate-100/80">
            {/* ROW 1: Subshell Selection Deck */}
            <div className="w-full flex flex-col items-center">
              <div
                className={`grid ${
                  currentElement.subshells.length === 5 ? 'grid-cols-5 gap-1' : 'grid-cols-4 gap-1.5'
                } w-full max-w-[430px]`}
              >
                {currentElement.subshells.map((sub) => {
                  const count = occupancy[sub.id] || 0;
                  const isSelected = selectedSubshellId === sub.id;
                  const isCorrect = submissionStatus === 'correct';
                  const isIncorrect = submissionStatus === 'incorrect';
                  const isShaking = shakingSubshellId === sub.id || shakingSubshellId === 'all';

                  return (
                    <button
                      key={`deck-${sub.id}`}
                      type="button"
                      onClick={() => handleSelectSubshell(sub.id)}
                      className={`h-20 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-between py-1.5 px-0.5 sm:px-1 transition-all cursor-pointer shadow-xs ${
                        isShaking || isIncorrect
                          ? 'bg-rose-50/80 border-rose-400 text-rose-700 animate-shake'
                          : isCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-300'
                          : isSelected
                          ? `${sub.bgLight} border-blue-500 ring-2 ring-blue-400 ${sub.textColor} scale-[1.03]`
                          : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {/* Subshell ID & Status Icon */}
                      <div className="flex items-center justify-between w-full px-1 leading-none">
                        <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-tight">
                          {sub.id}
                        </span>
                        {isCorrect && (
                          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>

                      {/* Center: Orbital Shape Diagram + Count Number */}
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-auto">
                        {renderOrbitalShape(sub.id)}
                        <span className="font-mono font-black text-base sm:text-lg leading-none">
                          {count}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`text-[7px] sm:text-[8px] font-mono font-black uppercase px-1 py-0.5 rounded-xs leading-none ${
                          isCorrect
                            ? 'bg-emerald-200 text-emerald-900 font-extrabold'
                            : isSelected
                            ? 'bg-blue-200 text-blue-900 font-extrabold'
                            : 'text-slate-400'
                        }`}
                      >
                        {isCorrect ? 'CORRECT' : isSelected ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: Electron Action Controls (+ Add Electron, Remove, Reset) */}
            <div className="flex items-center justify-between w-full max-w-[430px] mx-auto px-1 gap-2">
              {/* Reset button */}
              <button
                type="button"
                onClick={handleReset}
                className="h-11 sm:h-12 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Reset all electron assignments"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
              </button>

              {/* Remove Electron Button */}
              <button
                type="button"
                disabled={submissionStatus === 'correct' || (occupancy[selectedSubshellId] || 0) <= 0}
                onClick={() => handleRemoveElectron()}
                className={`h-11 sm:h-12 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider border flex items-center gap-1.5 transition-all shadow-xs ${
                  submissionStatus !== 'correct' && (occupancy[selectedSubshellId] || 0) > 0
                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 cursor-pointer active:scale-95'
                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                }`}
                title={`Remove electron from ${selectedSubshellId.toUpperCase()}`}
              >
                <Minus className="w-4 h-4" />
                <span>Remove e⁻</span>
              </button>

              {/* Add Electron to Selected Subshell Button */}
              <button
                type="button"
                disabled={submissionStatus === 'correct'}
                onClick={() => handleAddElectron()}
                className={`flex-1 h-11 sm:h-12 px-4 rounded-xl font-mono font-black text-xs sm:text-sm uppercase tracking-wider border flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                  submissionStatus === 'correct'
                    ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer shadow-blue-500/20'
                }`}
                title={`Add electron to ${selectedSubshellId.toUpperCase()}`}
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ ADD TO {selectedSubshellId.toUpperCase()}</span>
              </button>
            </div>

            {/* ROW 3: Submit / Play Again / Next Level Action Buttons */}
            <div className="w-full max-w-[430px] mx-auto px-1 pt-0.5 flex flex-col gap-1.5">
              {submissionStatus === 'idle' && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={totalElectrons === 0}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                    totalElectrons > 0
                      ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer shadow-sky-600/30'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <span>SUBMIT CONFIGURATION</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {submissionStatus === 'incorrect' && (
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 cursor-pointer active:scale-95 animate-pulse"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>PLAY AGAIN</span>
                </button>
              )}

              {submissionStatus === 'correct' && currentElementId === 'Na' && (
                <button
                  type="button"
                  onClick={handleNextElement}
                  className="w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 animate-pulse"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Next: Sulfur (S, Z=16)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {submissionStatus === 'correct' && currentElementId === 'S' && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      '/challenge/atomic-structure-quantum-mechanics/electronic-configurations?difficulty=medium';
                  }}
                  className="w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02] active:scale-95 animate-pulse"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Next: Level 2 (Exchange Stability)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 4: EXPLANATION MODAL (Matching Reference Image 4) ────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug">
                Aufbau Principle &amp; Shell Filling (Sodium &amp; Sulfur)
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Level 1: Ground-State Electronic Configurations
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Pedagogical Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {/* Section 1: The Aufbau Principle */}
            <section className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                The Aufbau Principle &amp; (n + l) Energy Order
              </h3>
              <p>
                The word <em>Aufbau</em> is German for &quot;building up&quot;. In the ground state of an atom, electrons occupy subshells of lowest available energy before filling higher-energy subshells:
              </p>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 font-mono text-center text-xs sm:text-sm font-black text-blue-900">
                1s &lt; 2s &lt; 2p &lt; 3s &lt; 3p &lt; 4s &lt; 3d
              </div>
              <p>
                The relative energy of each subshell is governed by the <strong>(n + l) rule (Madelung rule)</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  Subshells with a lower <strong>(n + l)</strong> value have lower energy.
                </li>
                <li>
                  When two subshells have the same <strong>(n + l)</strong> value (such as 2p with 2+1=3 and 3s with 3+0=3), the one with the smaller principal quantum number <strong>n</strong> has lower energy and fills first (2p fills before 3s).
                </li>
              </ul>
            </section>

            {/* Section 2: Subshell Capacities */}
            <section className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-cyan-600 text-white flex items-center justify-center text-xs font-black">
                  2
                </span>
                Subshell Electron Capacities (2(2l + 1))
              </h3>
              <p>
                Due to the <strong>Pauli Exclusion Principle</strong>, each individual spatial orbital can hold a maximum of 2 electrons with opposite spins:
              </p>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-blue-700">s Subshell (l = 0)</div>
                  <div className="text-xs text-slate-500">1 orbital = 2 electrons max</div>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-bold text-purple-700">p Subshell (l = 1)</div>
                  <div className="text-xs text-slate-500">3 orbitals = 6 electrons max</div>
                </div>
              </div>
            </section>

            {/* Section 3: Sodium Configuration */}
            <section className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                Step-by-Step Shell Filling of Sodium (Z = 11)
              </h3>
              <p>
                Neutral Sodium has 11 protons and 11 electrons. Following Aufbau order:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-200 flex justify-between">
                  <span>1. Innermost 1s shell:</span>
                  <span className="font-bold text-blue-700">1s² (2 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50/60 border border-cyan-200 flex justify-between">
                  <span>2. Second shell 2s:</span>
                  <span className="font-bold text-cyan-700">2s² (2 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200 flex justify-between">
                  <span>3. Second shell 2p:</span>
                  <span className="font-bold text-purple-700">2p⁶ (6 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 flex justify-between">
                  <span>4. Outermost valence 3s:</span>
                  <span className="font-bold text-amber-700">3s¹ (1 e⁻ valence)</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-center font-mono font-black text-emerald-900 text-sm">
                Complete Ground State: 1s² 2s² 2p⁶ 3s¹ (or [Ne] 3s¹)
              </div>
            </section>

            {/* Section 4: Sulfur Configuration */}
            <section className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-fuchsia-600 text-white flex items-center justify-center text-xs font-black">
                  4
                </span>
                Step-by-Step Shell Filling of Sulfur (Z = 16)
              </h3>
              <p>
                Neutral Sulfur has 16 protons and 16 electrons. Following Aufbau order:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-200 flex justify-between">
                  <span>1. Innermost 1s shell:</span>
                  <span className="font-bold text-blue-700">1s² (2 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50/60 border border-cyan-200 flex justify-between">
                  <span>2. Second shell 2s:</span>
                  <span className="font-bold text-cyan-700">2s² (2 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200 flex justify-between">
                  <span>3. Second shell 2p:</span>
                  <span className="font-bold text-purple-700">2p⁶ (6 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200 flex justify-between">
                  <span>4. Third shell 3s:</span>
                  <span className="font-bold text-amber-700">3s² (2 e⁻ filled)</span>
                </div>
                <div className="p-2 rounded-lg bg-fuchsia-50/60 border border-fuchsia-200 flex justify-between">
                  <span>5. Outermost valence 3p:</span>
                  <span className="font-bold text-fuchsia-700">3p⁴ (4 e⁻ filled)</span>
                </div>
              </div>
              <div className="p-2.5 bg-fuchsia-50 rounded-xl border border-fuchsia-300 text-center font-mono font-black text-fuchsia-900 text-sm">
                Complete Ground State: 1s² 2s² 2p⁶ 3s² 3p⁴ (or [Ne] 3s² 3p⁴)
              </div>
            </section>

            {/* Section 5: Valence Electrons & Reactivity */}
            <section className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs font-black">
                  5
                </span>
                Core Electrons vs. Valence Electrons
              </h3>
              <p>
                In Sodium (Z = 11), [Ne] forms the stable inner core and <strong>3s¹</strong> provides 1 valence electron. In Sulfur (Z = 16), the valence shell is n = 3 with <strong>3s² 3p⁴</strong> (6 valence electrons), readily accepting 2 electrons to form S²⁻ with an Argon noble-gas octet [Ar].
              </p>
            </section>
          </div>

          {/* Sticky Blue Resume Challenge Button (Matching Reference Image 4) */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer text-center block"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
