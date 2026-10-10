"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Atom,
  RotateCcw,
  Check,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  X,
  BarChart2,
  Ruler,
  Dumbbell,
  Trophy,
  Sparkles,
  ArrowRight,
  Target,
  Eye,
  Maximize2
} from 'lucide-react';

import { MOT_HARD_STEPS, KEY_CONCEPTS_DATA } from './helpers';

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

export default function MotHardGamePage({ difficulty = 'hard' }: { difficulty?: string }) {
  const router = useRouter();

  // Screen View Mode: intro mission target screen vs interactive single canvas mode
  const [gameStarted, setGameStarted] = useState(false);

  // Active Step State (1 or 2)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [score, setScore] = useState(0);

  // Key Concepts Modal State
  const [showConceptsModal, setShowConceptsModal] = useState(false);
  const [showHud, setShowHud] = useState(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ── STEP 1 STATE: Bond Order Calculations & Electron Inputs ──────────────────
  const [calcInputs, setCalcInputs] = useState<{
    [key in 'O2' | 'O2+' | 'O2-']: {
      bonding: string;
      antibonding: string;
      bondOrder: string;
      isCorrect: boolean;
    };
  }>({
    O2: { bonding: '', antibonding: '', bondOrder: '', isCorrect: false },
    'O2+': { bonding: '', antibonding: '', bondOrder: '', isCorrect: false },
    'O2-': { bonding: '', antibonding: '', bondOrder: '', isCorrect: false }
  });

  const [calcFeedback, setCalcFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    molecule?: string;
  } | null>(null);

  const isStep1Complete =
    calcInputs.O2.isCorrect &&
    calcInputs['O2+'].isCorrect &&
    calcInputs['O2-'].isCorrect;

  const handleCheckMoleculeCalc = (mol: 'O2' | 'O2+' | 'O2-') => {
    const input = calcInputs[mol];
    const targetBonding = 10;
    const targetAntibonding = mol === 'O2' ? 6 : mol === 'O2+' ? 5 : 7;
    const targetBondOrder = mol === 'O2' ? 2 : mol === 'O2+' ? 2.5 : 1.5;

    const userBonding = parseInt(input.bonding.trim(), 10);
    const userAntibonding = parseInt(input.antibonding.trim(), 10);
    const userBondOrder = parseFloat(input.bondOrder.trim());

    if (
      userBonding === targetBonding &&
      userAntibonding === targetAntibonding &&
      Math.abs(userBondOrder - targetBondOrder) < 0.05
    ) {
      setCalcInputs((prev) => ({
        ...prev,
        [mol]: { ...prev[mol], isCorrect: true }
      }));

      setCalcFeedback({
        type: 'success',
        message: `✓ Correct! ${mol} (Bonding=${targetBonding}, Antibonding=${targetAntibonding}, Bond Order=${targetBondOrder})`
      });

      const nextInputs = {
        ...calcInputs,
        [mol]: { ...calcInputs[mol], isCorrect: true }
      };

      if (
        nextInputs.O2.isCorrect &&
        nextInputs['O2+'].isCorrect &&
        nextInputs['O2-'].isCorrect
      ) {
        setScore((prev) => prev + 50);
        setCalcFeedback({
          type: 'success',
          message: '🎉 All Bond Order calculations verified! Click "Next: Compare and Order" to proceed.'
        });
      }
    } else {
      if (userBonding !== targetBonding || userAntibonding !== targetAntibonding) {
        setCalcFeedback({
          type: 'error',
          message: `✕ Incorrect electron count for ${mol}. Count bonding (blue) vs antibonding (red) electrons from the diagram above.`
        });
      } else {
        setCalcFeedback({
          type: 'error',
          message: `✕ Incorrect bond order for ${mol}. Formula: ½ (${userBonding || 10} - ${userAntibonding || 6}) = ${targetBondOrder}`
        });
      }
    }
  };

  // ── STEP 2 STATE: Drag and Drop Ordering Rows ──────────────────────────────────
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

  const isStep2Complete =
    isRowComplete(rowPlacements.bondOrder) &&
    isRowComplete(rowPlacements.bondLength) &&
    isRowComplete(rowPlacements.bondStrength);

  const handleDropMolecule = (
    rowKey: 'bondOrder' | 'bondLength' | 'bondStrength',
    slotIndex: number,
    molId: string
  ) => {
    const expectedMol = CORRECT_ORDER[slotIndex];

    if (molId === expectedMol) {
      setRowPlacements((prev) => {
        const newRow = [...prev[rowKey]];
        newRow[slotIndex] = molId;
        return { ...prev, [rowKey]: newRow };
      });

      setDragFeedback({
        type: 'success',
        message: `✓ Correct placement for ${
          rowKey === 'bondOrder'
            ? 'Bond Order'
            : rowKey === 'bondLength'
            ? 'Bond Length'
            : 'Bond Strength'
        }!`
      });

      setTimeout(() => {
        setRowPlacements((latest) => {
          if (
            isRowComplete(latest.bondOrder) &&
            isRowComplete(latest.bondLength) &&
            isRowComplete(latest.bondStrength)
          ) {
            setScore((prev) => prev + 50);
            setShowCompletionModal(true);
          }
          return latest;
        });
      }, 300);
    } else {
      let hintMsg = '✕ Check bond order values: O₂⁻ = 1.5, O₂ = 2, O₂⁺ = 2.5';
      if (rowKey === 'bondLength') {
        hintMsg = '✕ Remember: higher bond order means a shorter bond length.';
      } else if (rowKey === 'bondStrength') {
        hintMsg = '✕ Remember: higher bond order means a stronger bond.';
      }

      setDragFeedback({
        type: 'error',
        message: hintMsg
      });
    }
  };

  const handleResetStep2 = () => {
    setRowPlacements({
      bondOrder: [null, null, null],
      bondLength: [null, null, null],
      bondStrength: [null, null, null]
    });
    setDragFeedback(null);
  };

  const handleResetAll = () => {
    setCurrentStep(1);
    setCalcInputs({
      O2: { bonding: '', antibonding: '', bondOrder: '', isCorrect: false },
      'O2+': { bonding: '', antibonding: '', bondOrder: '', isCorrect: false },
      'O2-': { bonding: '', antibonding: '', bondOrder: '', isCorrect: false }
    });
    setCalcFeedback(null);
    handleResetStep2();
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col">
      
      {/* ── SCREEN 1: INTRO MISSION TARGET OVERLAY VIEW (BLURRED BACKGROUND) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>

          {/* Central Target Text & Start Mission Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2">
            <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
              MOLECULAR ORBITAL THEORY
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Calculate bond orders & determine bond length & strength for O₂, O₂⁺ & O₂⁻
            </h1>

            <div className="pt-1 sm:pt-4">
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 sm:px-8 sm:py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg border border-blue-400 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                START MISSION
              </button>
            </div>
          </div>

          {/* Bottom Footer Info */}
          <div className="text-center text-[10px] sm:text-xs text-[#64748B] z-10 shrink-0">
            Click Start Mission to launch the single canvas orbital workshop
          </div>
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE SINGLE CANVAS INTERACTIVE VIEW ───────────────────── */}
      <div className={`flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-hidden relative bg-slate-50 transition-all duration-300 ${!gameStarted ? 'filter blur-sm pointer-events-none select-none opacity-70' : ''}`}>

        {/* ── 1. TOP FLOATING NAVIGATION BAR ─────────────────────────────────── */}
        <div className="w-full flex items-center justify-between z-20 shrink-0 mb-2">
          {/* Top Left: Back Button & Scene Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[#1E293B] font-extrabold text-xs transition-all shadow-md backdrop-blur-md cursor-pointer"
              title="Back to Topics"
            >
              <ChevronLeft className="w-5 h-5 text-[#2563EB]" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              onClick={() => setShowHud(!showHud)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-md backdrop-blur-md cursor-pointer ${
                showHud
                  ? 'bg-[#E5EEF5] border-[#22B8CF] text-[#2563EB]'
                  : 'bg-white border-slate-200 text-[#64748B]'
              }`}
              title="Toggle HUD / Overlay"
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetAll}
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md backdrop-blur-md cursor-pointer"
              title="Reset Challenge"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md backdrop-blur-md cursor-pointer"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Top Center Step Indicator */}
          <div className="bg-white border border-slate-200 px-4 py-1 rounded-full shadow-sm text-xs font-extrabold text-[#2563EB] font-mono tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>Step {currentStep}/2: {currentStep === 1 ? 'Bond Order Calculations' : 'Compare & Order Properties'}</span>
          </div>

          {/* Top Right: Explanation Button & Score */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowConceptsModal(true)}
              className="h-9 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-2 text-purple-700 text-xs font-bold transition-all shadow-md cursor-pointer"
              title="View Explanation & Key Concepts"
            >
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Explanation</span>
            </button>

            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-800 font-extrabold text-xs shadow-sm">
              <span>⭐</span>
              <span>{score}</span>
            </div>
          </div>
        </div>

        {/* ── 2. MAIN SINGLE CANVAS CONTENT AREA ────────────────────────────── */}
        <main className="flex-1 min-h-0 w-full overflow-y-auto pr-1 space-y-3">
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* STEP 1: O₂ MO CONFIGURATION + BOND ORDER CALCULATION                */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 ? (
            <div className="space-y-3">
              
              {/* CARD 1: O₂ Molecular Orbital Configuration (Already Filled) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#1E293B]">
                        O₂ Molecular Orbital Configuration (16 Electrons - Filled)
                      </h3>
                      <p className="text-[10.5px] text-[#64748B]">
                        Observe the filled molecular orbital energy diagram for O₂.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl shrink-0">
                    <OxygenMolecule3D molecule="O2" size="sm" />
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-[#1E293B]">O₂</div>
                      <div className="text-[9.5px] font-mono text-[#2563EB] font-bold">(16 electrons)</div>
                    </div>
                  </div>
                </div>

                {/* Horizontal 10 MO Slots Container */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                    {/* Energy Arrow */}
                    <div className="flex flex-col items-center justify-between h-20 py-1 shrink-0 pr-2 border-r border-slate-200">
                      <span className="text-[9px] font-extrabold text-purple-600">High</span>
                      <div className="w-1 flex-1 bg-gradient-to-t from-blue-500 via-sky-400 to-purple-500 rounded-full my-1 relative">
                        <div className="absolute -top-1 -left-[3px] w-0 h-0 border-x-[5px] border-x-transparent border-b-[8px] border-b-purple-500" />
                      </div>
                      <span className="text-[9px] font-extrabold text-[#2563EB]">Low</span>
                    </div>

                    {/* 10 MO Slots */}
                    <div className="flex-1 flex items-center justify-between gap-1.5 min-w-[540px]">
                      {[
                        { label: 'σ 1s', electrons: ['up', 'down'], type: 'bonding' },
                        { label: 'σ* 1s', electrons: ['up', 'down'], type: 'antibonding' },
                        { label: 'σ 2s', electrons: ['up', 'down'], type: 'bonding' },
                        { label: 'σ* 2s', electrons: ['up', 'down'], type: 'antibonding' },
                        { label: 'σ 2p_z', electrons: ['up', 'down'], type: 'bonding' },
                        { label: 'π 2p_x', electrons: ['up', 'down'], type: 'bonding' },
                        { label: 'π 2p_y', electrons: ['up', 'down'], type: 'bonding' },
                        { label: 'π* 2p_x', electrons: ['up'], type: 'antibonding' },
                        { label: 'π* 2p_y', electrons: ['up'], type: 'antibonding' },
                        { label: 'σ* 2p_z', electrons: [], type: 'antibonding' },
                      ].map((mo, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono font-bold text-[#2563EB] whitespace-nowrap">
                            {mo.label}
                          </span>

                          <div
                            className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center gap-0.5 font-black text-sm shadow-sm transition-all ${
                              mo.type === 'bonding'
                                ? 'border-[#38A9E8] bg-sky-50 text-[#2563EB]'
                                : mo.electrons.length > 0
                                ? 'border-rose-400 bg-rose-50 text-rose-600'
                                : 'border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {mo.electrons.length === 0 ? (
                              <span className="text-[9px] text-slate-300">empty</span>
                            ) : (
                              mo.electrons.map((sp, sIdx) => (
                                <span
                                  key={sIdx}
                                  className={sp === 'up' ? 'text-[#EF4444]' : 'text-[#2563EB]'}
                                >
                                  {sp === 'up' ? '↑' : '↓'}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MO Legend Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10.5px]">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[#2563EB] font-bold">
                        <div className="w-3 h-1 bg-[#38A9E8] rounded-full" />
                        <span>Bonding MO (10 e⁻)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                        <div className="w-3 h-1 bg-rose-500 rounded-full" />
                        <span>Antibonding MO (6 e⁻)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-[#2563EB] font-mono text-[10px] font-bold border border-sky-200">
                        Bonding MO (Stabilizing)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-bold border border-rose-200">
                        Antibonding MO (Destabilizing)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Bond Order Calculation */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#1E293B]">Bond Order Calculation</h3>
                      <p className="text-[10.5px] text-[#64748B]">
                        Calculate bond order for O₂, O₂⁺ and O₂⁻ using the formula below.
                      </p>
                    </div>
                  </div>

                  {/* Formula Pill */}
                  <div className="bg-[#E5EEF5] border border-[#38A9E8]/40 px-3 py-1 rounded-xl text-xs font-mono font-bold text-[#1E293B] shadow-sm flex items-center gap-1">
                    <span>Bond Order = </span>
                    <span className="text-[#2563EB]">½</span>
                    <span>(</span>
                    <span className="text-[#22C55E]">Bonding e⁻</span>
                    <span> − </span>
                    <span className="text-[#EF4444]">Antibonding e⁻</span>
                    <span>)</span>
                  </div>
                </div>

                {/* 3 Molecule Input Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Molecule 1: O₂ */}
                  <div
                    className={`bg-slate-50 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                      calcInputs.O2.isCorrect
                        ? 'border-[#22C55E] bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-base font-black text-[#1E293B]">O₂</div>
                        <div className="text-[10px] text-[#64748B] font-mono">(16 electrons)</div>
                      </div>
                      <OxygenMolecule3D molecule="O2" size="sm" />
                    </div>

                    <div className="space-y-2 text-[11px] font-mono py-2 border-t border-b border-slate-200 my-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#22C55E] font-bold">Bonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs.O2.bonding}
                          disabled={calcInputs.O2.isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              O2: { ...prev.O2, bonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#22C55E] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#EF4444] font-bold">Antibonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs.O2.antibonding}
                          disabled={calcInputs.O2.isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              O2: { ...prev.O2, antibonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#EF4444] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                        <span className="text-[#2563EB] font-bold">Bond Order =</span>
                        <input
                          type="text"
                          value={calcInputs.O2.bondOrder}
                          disabled={calcInputs.O2.isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              O2: { ...prev.O2, bondOrder: e.target.value }
                            }))
                          }
                          placeholder="Result"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckMoleculeCalc('O2')}
                      disabled={calcInputs.O2.isCorrect}
                      className={`w-full py-1.5 rounded-xl border font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        calcInputs.O2.isCorrect
                          ? 'bg-[#22C55E] text-white border-[#22C55E] cursor-default'
                          : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-blue-400 shadow-sm'
                      }`}
                    >
                      {calcInputs.O2.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Verified (BO = 2)</span>
                        </>
                      ) : (
                        <span>Check O₂</span>
                      )}
                    </button>
                  </div>

                  {/* Molecule 2: O₂⁺ */}
                  <div
                    className={`bg-slate-50 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                      calcInputs['O2+'].isCorrect
                        ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-base font-black text-[#1E293B]">O₂⁺</div>
                        <div className="text-[10px] text-[#64748B] font-mono">(15 electrons)</div>
                      </div>
                      <OxygenMolecule3D molecule="O2+" size="sm" />
                    </div>

                    <div className="space-y-2 text-[11px] font-mono py-2 border-t border-b border-slate-200 my-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#22C55E] font-bold">Bonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs['O2+'].bonding}
                          disabled={calcInputs['O2+'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2+': { ...prev['O2+'], bonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#22C55E] focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#EF4444] font-bold">Antibonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs['O2+'].antibonding}
                          disabled={calcInputs['O2+'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2+': { ...prev['O2+'], antibonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#EF4444] focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                        <span className="text-purple-700 font-bold">Bond Order =</span>
                        <input
                          type="text"
                          value={calcInputs['O2+'].bondOrder}
                          disabled={calcInputs['O2+'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2+': { ...prev['O2+'], bondOrder: e.target.value }
                            }))
                          }
                          placeholder="Result"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#1E293B] focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckMoleculeCalc('O2+')}
                      disabled={calcInputs['O2+'].isCorrect}
                      className={`w-full py-1.5 rounded-xl border font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        calcInputs['O2+'].isCorrect
                          ? 'bg-purple-600 text-white border-purple-600 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-400 shadow-sm'
                      }`}
                    >
                      {calcInputs['O2+'].isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Verified (BO = 2.5)</span>
                        </>
                      ) : (
                        <span>Check O₂⁺</span>
                      )}
                    </button>
                  </div>

                  {/* Molecule 3: O₂⁻ */}
                  <div
                    className={`bg-slate-50 border rounded-2xl p-3 flex flex-col justify-between transition-all ${
                      calcInputs['O2-'].isCorrect
                        ? 'border-teal-500 bg-teal-50/50 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-base font-black text-[#1E293B]">O₂⁻</div>
                        <div className="text-[10px] text-[#64748B] font-mono">(17 electrons)</div>
                      </div>
                      <OxygenMolecule3D molecule="O2-" size="sm" />
                    </div>

                    <div className="space-y-2 text-[11px] font-mono py-2 border-t border-b border-slate-200 my-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#22C55E] font-bold">Bonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs['O2-'].bonding}
                          disabled={calcInputs['O2-'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2-': { ...prev['O2-'], bonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#22C55E] focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[#EF4444] font-bold">Antibonding e⁻ =</span>
                        <input
                          type="text"
                          value={calcInputs['O2-'].antibonding}
                          disabled={calcInputs['O2-'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2-': { ...prev['O2-'], antibonding: e.target.value }
                            }))
                          }
                          placeholder="Count"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#EF4444] focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                        <span className="text-teal-700 font-bold">Bond Order =</span>
                        <input
                          type="text"
                          value={calcInputs['O2-'].bondOrder}
                          disabled={calcInputs['O2-'].isCorrect}
                          onChange={(e) =>
                            setCalcInputs((prev) => ({
                              ...prev,
                              'O2-': { ...prev['O2-'], bondOrder: e.target.value }
                            }))
                          }
                          placeholder="Result"
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center text-xs font-bold text-[#1E293B] focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleCheckMoleculeCalc('O2-')}
                      disabled={calcInputs['O2-'].isCorrect}
                      className={`w-full py-1.5 rounded-xl border font-extrabold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        calcInputs['O2-'].isCorrect
                          ? 'bg-teal-600 text-white border-teal-600 cursor-default'
                          : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-400 shadow-sm'
                      }`}
                    >
                      {calcInputs['O2-'].isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Verified (BO = 1.5)</span>
                        </>
                      ) : (
                        <span>Check O₂⁻</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Feedback Banner */}
                {calcFeedback && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-sm transition-all ${
                      calcFeedback.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {calcFeedback.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                    )}
                    <span>{calcFeedback.message}</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════════ */
            /* STEP 2: DRAG AND DROP ORDERING ROWS                                  */
            /* ════════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
              
              {/* LEFT: 3 ORDERING ROWS (Takes 8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-[#1E293B]">Drag and Drop to Arrange</h3>
                      <p className="text-[10.5px] text-[#64748B]">
                        Arrange molecules in the correct order for each property.
                      </p>
                    </div>

                    <button
                      onClick={handleResetStep2}
                      className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Reset all placements"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Order</span>
                    </button>
                  </div>

                  {/* ── ROW 1: BOND ORDER ────────────────────────────────────────── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                          <BarChart2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#2563EB]">Bond Order</div>
                          <div className="text-[10px] text-[#64748B]">Arrange from lowest to highest bond order.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#2563EB] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                        <span>Lowest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Highest</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
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
                              }
                            }}
                            className={`h-22 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-2 ${
                              isCorrectSlot
                                ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                                : placedMol
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-300 bg-white hover:border-[#38A9E8] hover:bg-sky-50'
                            }`}
                          >
                            {placedMol ? (
                              <div className="flex flex-col items-center gap-1">
                                <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                                <div className="text-center">
                                  <div className="text-xs font-black text-[#1E293B]">
                                    {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                                  </div>
                                  <div className="text-[9.5px] font-mono text-[#2563EB] font-bold">
                                    {placedMol === 'O2' ? 'BO = 2' : placedMol === 'O2+' ? 'BO = 2.5' : 'BO = 1.5'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-[#2563EB] border border-slate-200 text-xs font-black font-mono flex items-center justify-center shadow-inner">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── ROW 2: BOND LENGTH ───────────────────────────────────────── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#22C55E]">
                          <Ruler className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#22C55E]">Bond Length</div>
                          <div className="text-[10px] text-[#64748B]">Arrange from longest to shortest bond length.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#22C55E] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <span>Longest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Shortest</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
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
                              }
                            }}
                            className={`h-22 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-2 ${
                              isCorrectSlot
                                ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                                : placedMol
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-300 bg-white hover:border-[#22C55E] hover:bg-emerald-50/50'
                            }`}
                          >
                            {placedMol ? (
                              <div className="flex flex-col items-center gap-1">
                                <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                                <div className="text-center">
                                  <div className="text-xs font-black text-[#1E293B]">
                                    {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-[#22C55E] border border-slate-200 text-xs font-black font-mono flex items-center justify-center shadow-inner">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── ROW 3: BOND STRENGTH ─────────────────────────────────────── */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-rose-600">Bond Strength</div>
                          <div className="text-[10px] text-[#64748B]">Arrange from weakest to strongest bond.</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <span>Weakest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Strongest</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-1">
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
                              }
                            }}
                            className={`h-22 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer relative p-2 ${
                              isCorrectSlot
                                ? 'border-[#22C55E] bg-emerald-50 text-emerald-800 shadow-sm'
                                : placedMol
                                ? 'border-rose-400 bg-rose-50 text-rose-700'
                                : 'border-slate-300 bg-white hover:border-rose-400 hover:bg-rose-50/50'
                            }`}
                          >
                            {placedMol ? (
                              <div className="flex flex-col items-center gap-1">
                                <OxygenMolecule3D molecule={placedMol as any} size="sm" />
                                <div className="text-center">
                                  <div className="text-xs font-black text-[#1E293B]">
                                    {placedMol === 'O2' ? 'O₂' : placedMol === 'O2+' ? 'O₂⁺' : 'O₂⁻'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-slate-100 text-rose-600 border border-slate-200 text-xs font-black font-mono flex items-center justify-center shadow-inner">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {dragFeedback && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold shadow-sm ${
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

              {/* RIGHT: MOLECULE TRAY (Takes 4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-extrabold text-[#1E293B]">
                      Molecules <span className="text-[#2563EB] font-normal">(Drag or click to place)</span>
                    </h3>
                    <p className="text-[10px] text-[#64748B]">
                      Select a molecule then click a slot box on the left.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { id: 'O2', label: 'O₂', electrons: 16 },
                      { id: 'O2+', label: 'O₂⁺', electrons: 15 },
                      { id: 'O2-', label: 'O₂⁻', electrons: 17 },
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
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-grab active:cursor-grabbing hover:scale-[1.02] shadow-sm ${
                            isSelected
                              ? 'ring-2 ring-[#2563EB] border-[#2563EB] bg-blue-50'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <OxygenMolecule3D molecule={mol.id as any} size="md" />
                            <div>
                              <div className="text-sm font-black text-[#1E293B]">{mol.label}</div>
                              <div className="text-[10px] font-mono text-[#64748B]">
                                ({mol.electrons} electrons)
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono text-[#2563EB] bg-white px-2 py-1 rounded border border-blue-200 font-bold">
                            Drag / Select
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* REMEMBER CARD */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Key Rules</span>
                  </div>
                  <ul className="text-[11px] space-y-1 list-disc list-inside leading-relaxed text-amber-900/90">
                    <li>Higher bond order = stronger bond & shorter length.</li>
                    <li>Removing 1 e⁻ (O₂⁺) raises bond order to 2.5.</li>
                    <li>Adding 1 e⁻ (O₂⁻) lowers bond order to 1.5.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}
        </main>

        {/* ── 3. FLOATING BOTTOM CONTROL DOCK & TARGET INSTRUCTIONS ──────────────── */}
        <div className="w-full flex flex-col items-center gap-2 z-20 shrink-0 pt-2 border-t border-slate-200">
          {/* Target Instruction Pill (Bottom Line) */}
          <div className="flex items-center gap-2 bg-white border border-[#38A9E8]/40 px-4 py-1.5 rounded-full text-[#1E293B] text-xs font-extrabold shadow-md">
            <Target className="w-4 h-4 text-[#2563EB]" />
            <span>
              {currentStep === 1
                ? isStep1Complete
                  ? 'TARGET COMPLETED: All bond order calculations verified! Click Next below.'
                  : 'TARGET: Calculate bond orders for O₂, O₂⁺ and O₂⁻ using the formula'
                : isStep2Complete
                ? 'TARGET COMPLETED: All properties correctly ordered!'
                : 'TARGET: Drag or click molecules into correct order for each property'}
            </span>
          </div>

          {/* Bottom Dock Control Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-3 max-w-2xl w-full justify-between">
            
            {/* Prev Step Button */}
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-[#1E293B] transition-all cursor-pointer"
              >
                ‹ Prev Step
              </button>
            ) : (
              <div className="w-20" />
            )}

            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep === 1 ? 'bg-[#2563EB] ring-2 ring-blue-300' : 'bg-slate-300'}`} />
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${currentStep === 2 ? 'bg-[#2563EB] ring-2 ring-blue-300' : 'bg-slate-300'}`} />
            </div>

            {/* Next Step / Action Button */}
            {currentStep === 1 ? (
              <button
                onClick={() => {
                  if (isStep1Complete) {
                    setCurrentStep(2);
                  }
                }}
                disabled={!isStep1Complete}
                className={`px-5 py-2 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all uppercase tracking-wider ${
                  isStep1Complete
                    ? 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white cursor-pointer transform hover:scale-105'
                    : 'bg-slate-200 text-[#64748B] border border-slate-300 cursor-not-allowed opacity-75'
                }`}
              >
                <span>Next: Compare and Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleResetAll}
                className="px-4 py-2 bg-[#22C55E] hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Lab</span>
              </button>
            )}

          </div>
        </div>

      </div>

      {/* ── 3. COMPLETION MODAL ──────────────────────────────────────────────── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center relative animate-in zoom-in-95 text-[#1E293B]">
            <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 mx-auto shadow-md">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h2 className="text-lg font-black text-[#1E293B]">🎉 MOT Hard Challenge Complete!</h2>
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
                  handleResetAll();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Replay Challenge
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Complete Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. EXPLANATION & THEORY MODAL DRAWER ────────────────────────────────── */}
      {showConceptsModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 pb-6">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full flex flex-col max-h-[calc(100vh-7rem)] shadow-2xl overflow-hidden relative text-[#1E293B]">
            
            {/* Sticky Top Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B]">Molecular Orbital Theory — Advanced Guide</h3>
                  <p className="text-xs text-[#64748B]">Calculating Bond Order, Bond Length, and Bond Strength</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowConceptsModal(false)}
                className="p-2 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200 transition-all cursor-pointer shrink-0 ml-2"
                title="Close Explanation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-[#1E293B] leading-relaxed overflow-y-auto flex-1">
              
              {/* Bond Order Formula */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>📐</span> 1. Bond Order Formula
                </h4>
                <p className="text-[#1E293B]">
                  Bond Order measures the net number of bonding electron pairs holding two atoms together:
                </p>
                <div className="p-2 bg-white border border-slate-200 rounded-xl font-mono text-center font-bold text-[#2563EB]">
                  Bond Order = ½ (Bonding e⁻ − Antibonding e⁻)
                </div>
              </div>

              {/* Molecule Comparisons */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>🧪</span> 2. Oxygen Species Comparison
                </h4>
                <div className="space-y-2 font-mono text-[11.5px]">
                  <div className="p-2 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <strong className="text-[#2563EB]">O₂ (16 e⁻):</strong> 10 bonding e⁻, 6 antibonding e⁻ → BO = ½(10 - 6) = <strong>2.0</strong>
                  </div>
                  <div className="p-2 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <strong className="text-purple-700">O₂⁺ (15 e⁻):</strong> 10 bonding e⁻, 5 antibonding e⁻ → BO = ½(10 - 5) = <strong>2.5</strong> (Stronger & Shorter bond than O₂)
                  </div>
                  <div className="p-2 bg-teal-50/60 border border-teal-200 rounded-xl">
                    <strong className="text-teal-700">O₂⁻ (17 e⁻):</strong> 10 bonding e⁻, 7 antibonding e⁻ → BO = ½(10 - 7) = <strong>1.5</strong> (Weaker & Longer bond than O₂)
                  </div>
                </div>
              </div>

              {/* Property Correlations */}
              <div className="p-4 bg-[#E5EEF5]/50 border border-[#38A9E8]/40 rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>🔗</span> 3. Bond Order vs Length vs Strength
                </h4>
                <ul className="space-y-1.5 list-disc list-inside text-[#1E293B]">
                  <li>Higher Bond Order → <strong>Stronger Bond</strong> (More energy required to break bond).</li>
                  <li>Higher Bond Order → <strong>Shorter Bond Length</strong> (Nuclei are pulled closer together).</li>
                  <li><strong>Order of Bond Order / Strength:</strong> O₂⁻ (1.5) &lt; O₂ (2.0) &lt; O₂⁺ (2.5)</li>
                  <li><strong>Order of Bond Length:</strong> O₂⁺ (shortest) &lt; O₂ &lt; O₂⁻ (longest)</li>
                </ul>
              </div>

              {/* Key Concepts Grid */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-purple-700 flex items-center gap-2">
                  <span>📚</span> Key Concepts Summary
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {KEY_CONCEPTS_DATA.map((c, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="font-bold text-[#2563EB] text-[11px] flex items-center justify-between">
                        <span>{c.title}</span>
                        {c.symbol && <span className="font-mono text-[10px] text-purple-600">{c.symbol}</span>}
                      </div>
                      <p className="text-[10.5px] text-[#64748B] leading-tight">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowConceptsModal(false)}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Close Explanation & Resume Lab
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
