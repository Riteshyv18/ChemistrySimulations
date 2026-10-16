"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  X,
  BarChart2,
  Ruler,
  Dumbbell,
  Trophy,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Play
} from 'lucide-react';

import { exitSimulation } from '@/lib/mobileBridge';
import { KEY_CONCEPTS_DATA } from './helpers';

// ── 3D Oxygen Molecule Graphic Component (Adapted for Light/Dark Canvas) ────────
const OxygenMolecule3D = ({
  molecule = 'O2',
  size = 'md'
}: {
  molecule?: 'O2' | 'O2+' | 'O2-';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const containerClasses =
    size === 'sm'
      ? 'w-16 h-10'
      : size === 'lg'
      ? 'w-32 h-16'
      : 'w-24 h-12';

  const sphereSize =
    size === 'sm'
      ? 'w-6 h-6 text-[10px]'
      : size === 'lg'
      ? 'w-11 h-11 text-sm'
      : 'w-8.5 h-8.5 text-xs';

  const bondWidth =
    size === 'sm' ? 'w-4 h-2' : size === 'lg' ? 'w-8 h-3.5' : 'w-6 h-3';

  const badgeText = molecule === 'O2+' ? '+' : molecule === 'O2-' ? '–' : null;
  const badgeColor =
    molecule === 'O2+'
      ? 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-amber-300'
      : 'bg-cyan-400 text-slate-950 shadow-sm ring-1 ring-cyan-300';

  return (
    <div className={`relative flex items-center justify-center ${containerClasses} shrink-0 select-none`}>
      {/* Ambient Pulsing Glow Background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-sky-400/20 to-rose-400/20 blur-md animate-pulse pointer-events-none" />

      {/* Main 3D Molecule Capsule */}
      <div className="relative z-10 flex items-center justify-center gap-1 bg-white/90 p-1.5 rounded-full border border-slate-200 shadow-md backdrop-blur-sm">
        {/* Left Oxygen Sphere */}
        <div className={`relative ${sphereSize} rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff9999_0%,#ef4444_40%,#991b1b_80%,#450a0a_100%)] shadow-md flex items-center justify-center font-black text-white tracking-tighter shrink-0`}>
          <div className="absolute top-[12%] left-[18%] w-[35%] h-[35%] bg-white/70 rounded-full blur-[0.5px] pointer-events-none" />
          <span className="drop-shadow-sm font-sans">O</span>
        </div>

        {/* 3D Covalent Double-Bond Lines */}
        <div className={`flex flex-col gap-1 justify-center items-center ${bondWidth} shrink-0 px-0.5`}>
          <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-rose-400 via-sky-400 to-rose-400 shadow-sm" />
          <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-rose-400 via-sky-400 to-rose-400 shadow-sm" />
        </div>

        {/* Right Oxygen Sphere */}
        <div className={`relative ${sphereSize} rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff9999_0%,#ef4444_40%,#991b1b_80%,#450a0a_100%)] shadow-md flex items-center justify-center font-black text-white tracking-tighter shrink-0`}>
          <div className="absolute top-[12%] left-[18%] w-[35%] h-[35%] bg-white/70 rounded-full blur-[0.5px] pointer-events-none" />
          <span className="drop-shadow-sm font-sans">O</span>

          {/* Charge Badge */}
          {badgeText && (
            <span className={`absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full ${badgeColor} text-[11px] font-black flex items-center justify-center z-20`}>
              {badgeText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MotHardGamePage({
  difficulty = 'level3',
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  // Screen View Mode: intro mission target screen vs instructions vs interactive single canvas mode
  const [gameStarted, setGameStarted] = useState(false);
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [score, setScore] = useState(0);

  // Key Concepts Modal State
  const [showConceptsModal, setShowConceptsModal] = useState(false);

  // ── Drag and Drop Ordering Rows State ──────────────────────────────────
  const [rowPlacements, setRowPlacements] = useState<{
    bondOrder: (string | null)[];
    bondLength: (string | null)[];
    bondStrength: (string | null)[];
  }>({
    bondOrder: [null, null, null],
    bondLength: [null, null, null],
    bondStrength: [null, null, null]
  });

  const [dragFeedback, setDragFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [activeDragMol, setActiveDragMol] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const CORRECT_ORDER = ['O2-', 'O2', 'O2+'];

  const isRowComplete = (row: (string | null)[]) => {
    return (
      row[0] === CORRECT_ORDER[0] &&
      row[1] === CORRECT_ORDER[1] &&
      row[2] === CORRECT_ORDER[2]
    );
  };

  const isCompleted =
    isRowComplete(rowPlacements.bondOrder) &&
    isRowComplete(rowPlacements.bondLength) &&
    isRowComplete(rowPlacements.bondStrength);

  const handleDropMolecule = (
    rowKey: 'bondOrder' | 'bondLength' | 'bondStrength',
    slotIndex: number,
    molId: string
  ) => {
    const expectedMol = CORRECT_ORDER[slotIndex];

    // Always place the molecule in the slot (droppable even if incorrect)
    setRowPlacements((prev) => {
      const newRow = [...prev[rowKey]];
      newRow[slotIndex] = molId;
      return { ...prev, [rowKey]: newRow };
    });

    if (molId === expectedMol) {
      setDragFeedback({
        type: 'success',
        message: 'Correct'
      });

      setTimeout(() => {
        setRowPlacements((latest) => {
          if (
            isRowComplete(latest.bondOrder) &&
            isRowComplete(latest.bondLength) &&
            isRowComplete(latest.bondStrength)
          ) {
            setScore(100);
            setShowCompletionModal(true);
          }
          return latest;
        });
      }, 300);
    } else {
      setDragFeedback({
        type: 'error',
        message: 'Incorrect'
      });
    }
  };

  const handleReset = () => {
    setRowPlacements({
      bondOrder: [null, null, null],
      bondLength: [null, null, null],
      bondStrength: [null, null, null]
    });
    setDragFeedback(null);
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col">
      
      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-2 sm:p-4 bg-white/95 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN */}
          {introStep === 'mission' && (
            <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
                MOLECULAR ORBITAL THEORY
              </div>

              <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Compare &amp; Arrange O₂, O₂⁺ and O₂⁻ by Bond Order, Bond Length and Bond Strength
              </h1>

              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN */}
          {introStep === 'instructions' && (
            <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
              {/* Header Title */}
              <div className="text-center pt-1 pb-3">
                <h2 className="text-[#1E293B] text-base sm:text-lg md:text-xl font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              {/* Horizontal Instruction Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-3.5 sm:gap-5 w-full mx-auto my-auto items-stretch">
                {/* 1. Tap on molecule & empty box */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-200 flex flex-col justify-between transition-all hover:shadow-2xl">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Select &amp; Place Molecule
                      </h3>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] sm:text-[11px] tracking-wide">
                        Molecule Tray
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-sm leading-snug mt-1.5">
                      Tap a molecule in the tray to select it, then tap an empty slot box to place it.
                    </p>
                  </div>

                  {/* Big Visible Image Box */}
                  <div className="w-full h-32 sm:h-40 md:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-3">
                    <img
                      src="/images/mot/l3_step1_select_molecule.svg"
                      alt="Step 1: Select and place molecule"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Order for properties */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-200 flex flex-col justify-between transition-all hover:shadow-2xl">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Arrange in Order
                      </h3>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] sm:text-[11px] tracking-wide">
                        Compare Properties
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-sm leading-snug mt-1.5">
                      Follow the same approach for Bond Order, Bond Length, and Bond Strength to place in order.
                    </p>
                  </div>

                  {/* Big Visible Image Box */}
                  <div className="w-full h-32 sm:h-40 md:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-3">
                    <img
                      src="/images/mot/l3_step2_place_order.svg"
                      alt="Step 2: Place in order"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-3 sm:pt-4 pb-1 flex items-center justify-center gap-3 sm:gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-7 sm:px-9 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer Note (Only on mission step) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE SINGLE CANVAS INTERACTIVE VIEW ───────────────────── */}
      <div className={`flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden relative bg-slate-50 transition-all duration-300 ${!gameStarted ? 'filter blur-sm pointer-events-none select-none opacity-70' : ''}`}>

        {/* ── 1. TOP TOOLBAR HEADER (EXIT, TARGET COMPLETED BADGE, RESET, EXPLANATION) ── */}
        <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-1 mb-1.5">
          {/* Top Left: Exit Button */}
          <button
            type="button"
            onClick={() => (onExit ? onExit() : exitSimulation())}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            title="Exit Simulation (Back to App)"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>EXIT</span>
          </button>

          {/* Center: Target Completed Badge */}
          {isCompleted ? (
            <div className="bg-emerald-600/90 border border-emerald-400 text-white px-2.5 sm:px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5 select-none animate-in fade-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                Completed
              </span>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Top Right: Reset Order & Explanation Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 text-rose-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="Revert all placements"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Revert</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConceptsModal(true)}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Explanation</span>
            </button>
          </div>
        </header>

        {/* ── 2. MAIN DRAG AND DROP CONTENT AREA (741 PORTRAIT FULL SCREEN COVER) ──────── */}
        <main className="flex-1 min-h-0 w-full flex flex-col justify-between overflow-hidden">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between gap-2.5 pb-1">
            
            {/* 3 ORDERING ROWS CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm flex-1 flex flex-col justify-between gap-2">
              {/* ── ROW 1: BOND ORDER ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                      <BarChart2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#2563EB]">Bond Order</div>
                      <div className="text-[9.5px] text-[#64748B]">Arrange from lowest to highest bond order.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-[#2563EB] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    <span>Lowest</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Highest</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 pt-0.5">
                  {[0, 1, 2].map((idx) => {
                    const placedMol = rowPlacements.bondOrder[idx];
                    const isCorrectSlot = placedMol === CORRECT_ORDER[idx];

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const molId = e.dataTransfer.getData('text/plain');
                          if (molId) {
                            handleDropMolecule('bondOrder', idx, molId);
                          }
                        }}
                        onClick={() => {
                          if (activeDragMol) {
                            handleDropMolecule('bondOrder', idx, activeDragMol);
                            setActiveDragMol(null);
                          } else if (placedMol) {
                            setRowPlacements((prev) => {
                              const newRow = [...prev.bondOrder];
                              newRow[idx] = null;
                              return { ...prev, bondOrder: newRow };
                            });
                            setDragFeedback(null);
                          }
                        }}
                        className={`h-20 sm:h-22 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-1 ${
                          isCorrectSlot
                            ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                            : placedMol
                            ? 'border-rose-400 bg-rose-50 text-rose-700'
                            : 'border-slate-300 bg-white hover:border-[#38A9E8] hover:bg-sky-50'
                        }`}
                      >
                        {placedMol ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                            <div className="text-center leading-tight">
                              <div className="text-[11px] font-black text-[#1E293B]">
                                {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                              </div>
                              <div className="text-[9.5px] font-mono text-[#2563EB] font-bold">
                                {placedMol === 'O2' ? 'BO = 2' : placedMol === 'O2+' ? 'BO = 2.5' : 'BO = 1.5'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-[#2563EB] border border-slate-200 text-xs sm:text-sm font-black font-mono flex items-center justify-center shadow-inner">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── ROW 2: BOND LENGTH ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#22C55E]">
                      <Ruler className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#22C55E]">Bond Length</div>
                      <div className="text-[9.5px] text-[#64748B]">Arrange from longest to shortest bond length.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-[#22C55E] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span>Longest</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Shortest</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 pt-0.5">
                  {[0, 1, 2].map((idx) => {
                    const placedMol = rowPlacements.bondLength[idx];
                    const isCorrectSlot = placedMol === CORRECT_ORDER[idx];

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const molId = e.dataTransfer.getData('text/plain');
                          if (molId) {
                            handleDropMolecule('bondLength', idx, molId);
                          }
                        }}
                        onClick={() => {
                          if (activeDragMol) {
                            handleDropMolecule('bondLength', idx, activeDragMol);
                            setActiveDragMol(null);
                          } else if (placedMol) {
                            setRowPlacements((prev) => {
                              const newRow = [...prev.bondLength];
                              newRow[idx] = null;
                              return { ...prev, bondLength: newRow };
                            });
                            setDragFeedback(null);
                          }
                        }}
                        className={`h-20 sm:h-22 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-1 ${
                          isCorrectSlot
                            ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                            : placedMol
                            ? 'border-rose-400 bg-rose-50 text-rose-700'
                            : 'border-slate-300 bg-white hover:border-[#22C55E] hover:bg-emerald-50/50'
                        }`}
                      >
                        {placedMol ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                            <div className="text-center leading-tight">
                              <div className="text-[11px] font-black text-[#1E293B]">
                                {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-[#22C55E] border border-slate-200 text-xs sm:text-sm font-black font-mono flex items-center justify-center shadow-inner">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── ROW 3: BOND STRENGTH ── */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-rose-600">Bond Strength</div>
                      <div className="text-[9.5px] text-[#64748B]">Arrange from weakest to strongest bond.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[9.5px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    <span>Weakest</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>Strongest</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 pt-0.5">
                  {[0, 1, 2].map((idx) => {
                    const placedMol = rowPlacements.bondStrength[idx];
                    const isCorrectSlot = placedMol === CORRECT_ORDER[idx];

                    return (
                      <div
                        key={idx}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const molId = e.dataTransfer.getData('text/plain');
                          if (molId) {
                            handleDropMolecule('bondStrength', idx, molId);
                          }
                        }}
                        onClick={() => {
                          if (activeDragMol) {
                            handleDropMolecule('bondStrength', idx, activeDragMol);
                            setActiveDragMol(null);
                          } else if (placedMol) {
                            setRowPlacements((prev) => {
                              const newRow = [...prev.bondStrength];
                              newRow[idx] = null;
                              return { ...prev, bondStrength: newRow };
                            });
                            setDragFeedback(null);
                          }
                        }}
                        className={`h-20 sm:h-22 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-1 ${
                          isCorrectSlot
                            ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                            : placedMol
                            ? 'border-rose-400 bg-rose-50 text-rose-700'
                            : 'border-slate-300 bg-white hover:border-rose-400 hover:bg-rose-50/50'
                        }`}
                      >
                        {placedMol ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                            <div className="text-center leading-tight">
                              <div className="text-[11px] font-black text-[#1E293B]">
                                {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-rose-600 border border-slate-200 text-xs sm:text-sm font-black font-mono flex items-center justify-center shadow-inner">
                            {idx + 1}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {dragFeedback && (
                <div
                  className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-sm ${
                    dragFeedback.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {dragFeedback.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  )}
                  <span>{dragFeedback.message}</span>
                </div>
              )}
            </div>

            {/* ── MOLECULES BOX (HORIZONTAL SINGLE LINE) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm shrink-0">
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                {[
                  { id: 'O2', label: 'O₂' },
                  { id: 'O2+', label: 'O₂⁺' },
                  { id: 'O2-', label: 'O₂⁻' },
                ].map((mol) => {
                  const isSelected = activeDragMol === mol.id;

                  return (
                    <div
                      key={mol.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', mol.id);
                        setActiveDragMol(mol.id);
                      }}
                      onClick={() => setActiveDragMol(mol.id)}
                      className={`h-22 sm:h-24 py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm select-none ${
                        isSelected
                          ? 'ring-2 ring-[#2563EB] border-[#2563EB] bg-blue-50'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <OxygenMolecule3D molecule={mol.id as any} size="sm" />
                      <div className="text-center mt-1.5 leading-tight">
                        <div className="text-xs sm:text-sm font-black text-[#1E293B]">{mol.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── 3. COMPLETION MODAL ──────────────────────────────────────────────── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center relative animate-in zoom-in-95 text-[#1E293B]">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 mx-auto shadow-md">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#1E293B]">🎉 MOT Level 3 Challenge Complete!</h2>
              <p className="text-xs text-[#64748B] mt-1">
                You have mastered the bond order, bond length, and bond strength relationships for O₂, O₂⁺ and O₂⁻!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left space-y-1.5 font-mono text-xs">
              <div className="text-[#2563EB] font-bold">✓ O₂ bond order = 2</div>
              <div className="text-purple-700 font-bold">✓ O₂⁺ bond order = 2.5</div>
              <div className="text-teal-700 font-bold">✓ O₂⁻ bond order = 1.5</div>
              <div className="text-[#22C55E] font-bold pt-1 border-t border-slate-200">
                ✓ Higher bond order → stronger bond & shorter bond length
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  handleReset();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Replay Challenge
              </button>
              <button
                onClick={() => (onExit ? onExit() : exitSimulation())}
                className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Complete Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. EXPLANATION & THEORY FULLSCREEN VIEW (MATCHES LEVEL 2 IMAGE FORMAT) ─ */}
      {showConceptsModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Molecular Orbital Theory (MOT) — Level 3: O₂, O₂⁺ &amp; O₂⁻
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                Electronic Configuration, Bond Order, Bond Length, Bond Strength &amp; Stability
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowConceptsModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-9 text-black text-base sm:text-lg leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Molecular Orbital Configuration of Oxygen Species */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                1. Molecular Orbital Electronic Configurations of O₂, O₂⁺ &amp; O₂⁻
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Oxygen has atomic number Z = 8 with ground-state atomic electronic configuration 1s² 2s² 2p⁴. For diatomic species with Z ≥ 8 (such as O₂ and F₂), there is negligible 2s–2p orbital mixing, meaning the σ2p_z bonding orbital lies lower in energy than the degenerate π2p_x and π2p_y molecular orbitals.
              </p>
              <h4 className="text-base sm:text-lg font-bold text-black underline underline-offset-4 pt-1">
                Molecular Orbital Energy Ordering (Z ≥ 8):
              </h4>
              <p className="text-black text-base sm:text-lg leading-relaxed font-mono bg-neutral-100 p-2.5 rounded-xl text-center">
                σ1s &lt; σ*1s &lt; σ2s &lt; σ*2s &lt; σ2p_z &lt; (π2p_x = π2p_y) &lt; (π*2p_x = π*2p_y) &lt; σ*2p_z
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Neutral O₂ (16 electrons):</strong> σ1s² σ*1s² σ2s² σ*2s² σ2p_z² (π2p_x² = π2p_y²) (π*2p_x¹ = π*2p_y¹). Contains 10 bonding electrons and 6 antibonding electrons. The 2 unpaired electrons in antibonding π* orbitals confer experimental <em>paramagnetic</em> character.
                </li>
                <li>
                  <strong>Dioxygenyl cation O₂⁺ (15 electrons):</strong> Formed by ionization (loss of 1 electron from an antibonding π* orbital): σ1s² σ*1s² σ2s² σ*2s² σ2p_z² (π2p_x² = π2p_y²) π*2p_x¹. Contains 10 bonding electrons and 5 antibonding electrons (1 unpaired electron, paramagnetic).
                </li>
                <li>
                  <strong>Superoxide anion O₂⁻ (17 electrons):</strong> Formed by electron gain (adding 1 electron into an antibonding π* orbital): σ1s² σ*1s² σ2s² σ*2s² σ2p_z² (π2p_x² = π2p_y²) (π*2p_x² = π*2p_y¹). Contains 10 bonding electrons and 7 antibonding electrons (1 unpaired electron, paramagnetic).
                </li>
              </ul>
            </div>

            {/* Section 2: Bond Order Calculation & Comparison */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                2. Bond Order Calculation &amp; Comparison
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                The Bond Order quantifies the net number of stable covalent bonds formed between the two oxygen nuclei:
              </p>
              <div className="p-3 bg-neutral-100 rounded-xl font-mono text-center font-bold text-black text-base sm:text-lg">
                Bond Order = ½ (N_b − N_a)
              </div>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>O₂ Bond Order:</strong> ½ (10 − 6) = <strong>2.0</strong> (Represents a stable double bond).
                </li>
                <li>
                  <strong>O₂⁺ Bond Order:</strong> ½ (10 − 5) = <strong>2.5</strong> (Removing an electron from an antibonding orbital raises the net bond order).
                </li>
                <li>
                  <strong>O₂⁻ Bond Order:</strong> ½ (10 − 7) = <strong>1.5</strong> (Adding an electron to an antibonding orbital diminishes the net bond order).
                </li>
                <li>
                  <strong>Ascending Order (Lowest to Highest):</strong> O₂⁻ (1.5) &lt; O₂ (2.0) &lt; O₂⁺ (2.5).
                </li>
              </ul>
            </div>

            {/* Section 3: Bond Strength Relationship */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                3. Bond Strength &amp; Dissociation Energy Correlation
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Bond strength (and its thermodynamic equivalent, bond dissociation enthalpy) is <strong>directly proportional</strong> to the bond order. A greater bond order indicates higher electron density between the bonded atoms, holding them more tightly together:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Direct relationship:</strong> Higher Bond Order = Stronger Bond = Higher Dissociation Enthalpy.
                </li>
                <li>
                  <strong>Ascending Order (Weakest to Strongest):</strong> O₂⁻ (1.5, weakest) &lt; O₂ (2.0) &lt; O₂⁺ (2.5, strongest).
                </li>
              </ul>
            </div>

            {/* Section 4: Bond Length Relationship */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                4. Bond Length Correlation
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Bond length (internuclear distance between the two oxygen nuclei) is <strong>inversely proportional</strong> to the bond order. Stronger nuclear-electron electrostatic attractions pull the nuclei closer together:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Inverse relationship:</strong> Higher Bond Order = Shorter Bond Length. Lower Bond Order = Longer Bond Length.
                </li>
                <li>
                  <strong>Experimentally Determined Values:</strong> O₂⁺ (~112 pm) &lt; O₂ (~121 pm) &lt; O₂⁻ (~128 pm).
                </li>
                <li>
                  <strong>Ordering (Longest to Shortest):</strong> O₂⁻ (longest, ~128 pm) &gt; O₂ (~121 pm) &gt; O₂⁺ (shortest, ~112 pm).
                </li>
              </ul>
            </div>

            {/* Section 5: Comparative Summary Table */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                5. Comparative Summary Table
              </h3>
              <div className="overflow-x-auto border border-neutral-300 rounded-xl">
                <table className="w-full text-left text-sm sm:text-base border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300">
                      <th className="p-2 sm:p-3 font-bold text-black">Species</th>
                      <th className="p-2 sm:p-3 font-bold text-black">Electrons</th>
                      <th className="p-2 sm:p-3 font-bold text-black">N_b / N_a</th>
                      <th className="p-2 sm:p-3 font-bold text-black">Bond Order</th>
                      <th className="p-2 sm:p-3 font-bold text-black">Bond Length</th>
                      <th className="p-2 sm:p-3 font-bold text-black">Bond Strength</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-blue-600">O₂⁺</td>
                      <td className="p-2 sm:p-3">15 e⁻</td>
                      <td className="p-2 sm:p-3">10 / 5</td>
                      <td className="p-2 sm:p-3 font-bold">2.5</td>
                      <td className="p-2 sm:p-3">Shortest (~112 pm)</td>
                      <td className="p-2 sm:p-3 font-semibold text-emerald-700">Strongest</td>
                    </tr>
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-neutral-800">O₂</td>
                      <td className="p-2 sm:p-3">16 e⁻</td>
                      <td className="p-2 sm:p-3">10 / 6</td>
                      <td className="p-2 sm:p-3 font-bold">2.0</td>
                      <td className="p-2 sm:p-3">Intermediate (~121 pm)</td>
                      <td className="p-2 sm:p-3">Intermediate</td>
                    </tr>
                    <tr>
                      <td className="p-2 sm:p-3 font-extrabold text-rose-600">O₂⁻</td>
                      <td className="p-2 sm:p-3">17 e⁻</td>
                      <td className="p-2 sm:p-3">10 / 7</td>
                      <td className="p-2 sm:p-3 font-bold">1.5</td>
                      <td className="p-2 sm:p-3">Longest (~128 pm)</td>
                      <td className="p-2 sm:p-3 font-semibold text-rose-700">Weakest</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowConceptsModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
