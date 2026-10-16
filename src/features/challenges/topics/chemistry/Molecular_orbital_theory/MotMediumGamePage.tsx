"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Undo2,
  CheckCircle2,
  X,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Play
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── Types & Interfaces ────────────────────────────────────────────────────────
interface MOItem {
  id: string;
  name: string;
  label: string;
  type: 'bonding' | 'antibonding';
  level: number;
  isDegenerate?: boolean;
  pairId?: string;
  electrons: ('up' | 'down')[];
  maxElectrons: number;
}

// B₂ MO Diagram (Z < 8): π2pₓ / π2pᵧ is LOWER in energy than σ2p due to 2s-2p mixing
const getInitialMODiagram = (): MOItem[] => [
  { id: 'sigma_star_2p', name: 'σ*2p', label: 'σ*2p', type: 'antibonding', level: 8, electrons: [], maxElectrons: 2 },
  { id: 'pi_star_2px', name: 'π*2pₓ', label: 'π*2pₓ', type: 'antibonding', level: 7, isDegenerate: true, pairId: 'pi_star_2py', electrons: [], maxElectrons: 2 },
  { id: 'pi_star_2py', name: 'π*2pᵧ', label: 'π*2pᵧ', type: 'antibonding', level: 7, isDegenerate: true, pairId: 'pi_star_2px', electrons: [], maxElectrons: 2 },
  { id: 'sigma_2p', name: 'σ2p', label: 'σ2p', type: 'bonding', level: 6, electrons: [], maxElectrons: 2 },
  { id: 'pi_2px', name: 'π2pₓ', label: 'π2pₓ', type: 'bonding', level: 5, isDegenerate: true, pairId: 'pi_2py', electrons: [], maxElectrons: 2 },
  { id: 'pi_2py', name: 'π2pᵧ', label: 'π2pᵧ', type: 'bonding', level: 5, isDegenerate: true, pairId: 'pi_2px', electrons: [], maxElectrons: 2 },
  { id: 'sigma_star_2s', name: 'σ*2s', label: 'σ*2s', type: 'antibonding', level: 4, electrons: [], maxElectrons: 2 },
  { id: 'sigma_2s', name: 'σ2s', label: 'σ2s', type: 'bonding', level: 3, electrons: [], maxElectrons: 2 },
  { id: 'sigma_star_1s', name: 'σ*1s', label: 'σ*1s', type: 'antibonding', level: 2, electrons: [], maxElectrons: 2 },
  { id: 'sigma_1s', name: 'σ1s', label: 'σ1s', type: 'bonding', level: 1, electrons: [], maxElectrons: 2 },
];

export default function MotMediumGamePage({
  difficulty = 'level2',
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  // Screen View Mode: 'mission' | 'instructions'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Total electrons for B₂ = 10
  const totalTargetElectrons = 10;

  // Molecular Orbitals Filling State (B₂ only)
  const [moDiagram, setMoDiagram] = useState<MOItem[]>(getInitialMODiagram);
  const [availableElectrons, setAvailableElectrons] = useState(10);
  const [historyStack, setHistoryStack] = useState<MOItem[][]>([]);
  
  // Center screen Principle Violation Popup Feedback
  const [feedback, setFeedback] = useState<{
    ruleName: 'Aufbau Principle' | 'Pauli Exclusion Principle' | "Hund's Rule";
    message: string;
    suggestion?: string;
    targetId?: string;
  } | null>(null);

  // Key Concepts Modal (Full Canvas)
  const [showConceptsModal, setShowConceptsModal] = useState(false);

  // Calculate total electrons placed
  const placedElectronsCount = useMemo(() => {
    return moDiagram.reduce((acc, mo) => acc + mo.electrons.length, 0);
  }, [moDiagram]);

  // Reset the diagram
  const handleReset = () => {
    setMoDiagram(getInitialMODiagram());
    setAvailableElectrons(totalTargetElectrons);
    setHistoryStack([]);
    setFeedback(null);
  };

  // Revert / Undo last electron placement step
  const handleRevert = () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setMoDiagram(previousState);
    setHistoryStack((prev) => prev.slice(0, -1));
    setAvailableElectrons((prev) => Math.min(totalTargetElectrons, prev + 1));
    setFeedback(null);
  };

  // Click or Drop to Fill Rules Engine (Aufbau, Pauli, Hund)
  const handleAddElectron = (targetId: string) => {
    if (placedElectronsCount >= totalTargetElectrons) {
      return;
    }

    const targetMO = moDiagram.find((m) => m.id === targetId);
    if (!targetMO) return;

    // 1. Pauli Exclusion Check: Max 2 electrons per orbital
    if (targetMO.electrons.length >= 2) {
      setFeedback({
        ruleName: 'Pauli Exclusion Principle',
        message: '✕ An orbital can hold a maximum of 2 electrons.',
        suggestion: '💡 Pauli Exclusion Rule: No orbital can contain more than 2 electrons, and they must have opposite spins (↑↓).',
        targetId
      });
      return;
    }

    // 2. Aufbau Principle Check: Lower energy orbitals must be filled first
    const lowerUnfilledMO = moDiagram
      .filter((m) => m.level < targetMO.level)
      .find((m) => m.electrons.length < m.maxElectrons);

    if (lowerUnfilledMO) {
      setFeedback({
        ruleName: 'Aufbau Principle',
        message: `✕ Fill lower-energy molecular orbitals (${lowerUnfilledMO.label}) before moving to higher energy.`,
        suggestion: `💡 Aufbau Rule: Electrons must occupy lower-energy molecular orbitals (${lowerUnfilledMO.label}) before higher energy levels can be filled.`,
        targetId
      });
      return;
    }

    // 3. Hund's Rule Check for degenerate orbitals (π2p)
    if (targetMO.isDegenerate && targetMO.pairId) {
      const pairMO = moDiagram.find((m) => m.id === targetMO.pairId);
      if (pairMO) {
        // Trying to pair up when the other degenerate orbital has 0 electrons
        if (targetMO.electrons.length === 1 && pairMO.electrons.length === 0) {
          setFeedback({
            ruleName: "Hund's Rule",
            message: `✕ Degenerate orbitals (${targetMO.label} & ${pairMO.label}) have equal energy. Fill one electron in each orbital first.`,
            suggestion: `💡 Hund's Rule: When filling equal-energy (degenerate) orbitals, place one electron in each orbital with parallel spins before pairing up.`,
            targetId
          });
          return;
        }
      }
    }

    // Save history snapshot before making mutation
    setHistoryStack((prev) => [...prev, moDiagram]);

    // Correct Placement
    const newSpin: 'up' | 'down' = targetMO.electrons.length === 0 ? 'up' : 'down';
    setMoDiagram((prev) =>
      prev.map((m) => (m.id === targetId ? { ...m, electrons: [...m.electrons, newSpin] } : m))
    );

    setAvailableElectrons((prev) => Math.max(0, prev - 1));
    setFeedback(null);
  };

  const isCompleted = placedElectronsCount === totalTargetElectrons;

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-2.5">
      
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
                <span className="text-[#2563EB]">MISSION:</span> Fill the Molecular Orbitals for B₂ to determine its electronic configuration
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
                {/* 1. Tap empty orbital */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-200 flex flex-col justify-between transition-all hover:shadow-2xl">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Fill Empty Orbital
                      </h3>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] sm:text-[11px] tracking-wide">
                        Orbital Diagram
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-sm leading-snug mt-1.5">
                      Tap the empty orbital to fill the electron.
                    </p>
                  </div>

                  {/* Big Visible Image Box */}
                  <div className="w-full h-32 sm:h-40 md:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-3">
                    <img
                      src="/images/mot/l2_step1_fill_orbital.svg"
                      alt="Step 1: Fill orbital"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Tap revert button */}
                <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-slate-200 flex flex-col justify-between transition-all hover:shadow-2xl">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Revert Last Step
                      </h3>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] sm:text-[11px] tracking-wide">
                        Undo Action
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs sm:text-sm leading-snug mt-1.5">
                      Tap the Revert button to go step back.
                    </p>
                  </div>

                  {/* Big Visible Image Box */}
                  <div className="w-full h-32 sm:h-40 md:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-3">
                    <img
                      src="/images/mot/l2_step2_revert.svg"
                      alt="Step 2: Tap revert"
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

      {/* ── ACTIVE GAMEPLAY SCREEN (PORTRAIT-OPTIMIZED) ───────────────────────── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          
          {/* ── 1. TOP TOOLBAR HEADER (EXIT, TARGET COMPLETED BADGE, EXPLANATION) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-1">
            {/* Top Left: Exit Button Only */}
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
              <div className="bg-emerald-600/90 border border-emerald-400 text-white px-3 sm:px-4 py-1 rounded-xl shadow-md flex items-center gap-1.5 select-none animate-in fade-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  Target Completed (100%)
                </span>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Top Right: Explanation Button */}
            <button
              type="button"
              onClick={() => setShowConceptsModal(true)}
              className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Explanation</span>
            </button>
          </header>

          {/* ── 2. CENTER STAGE: MO ENERGY DIAGRAM (PORTRAIT-FIT) ───────────────── */}
          <main className="flex-1 w-full flex items-center justify-center p-1 sm:p-2 overflow-hidden relative">
            <div className="w-full max-w-md h-full max-h-[500px] bg-slate-50/90 border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-inner flex items-center justify-center gap-3 sm:gap-6 relative">
              
              {/* Energy Axis Vector on Left */}
              <div className="flex flex-col items-center justify-between h-full py-2 shrink-0 select-none">
                <div className="text-[9px] sm:text-[10px] font-black text-purple-700 bg-purple-100 px-1.5 sm:px-2 py-0.5 rounded-full border border-purple-300 shadow-2xs whitespace-nowrap">
                  HIGH ↑
                </div>

                <div className="flex-1 w-1.5 sm:w-2 bg-gradient-to-t from-blue-500 via-cyan-400 to-purple-600 rounded-full my-2 relative shadow-xs">
                  <div className="absolute -top-1 -left-[3px] sm:-left-[4px] w-0 h-0 border-x-[5px] sm:border-x-[6px] border-x-transparent border-b-[8px] sm:border-b-[10px] border-b-purple-600" />
                </div>

                <div className="text-[9px] sm:text-[10px] font-black text-[#2563EB] bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-300 shadow-2xs whitespace-nowrap">
                  LOW
                </div>
              </div>

              {/* Stack of 8 MO Energy Levels */}
              <div className="flex-1 h-full flex flex-col justify-between py-1 max-w-[280px] sm:max-w-[320px]">
                {[
                  { id: 'sigma_star_2p', label: 'σ*2p', type: 'single' },
                  { id: 'pi_star_2p', label: 'π*2pₓ, π*2pᵧ', type: 'double', ids: ['pi_star_2px', 'pi_star_2py'] },
                  { id: 'sigma_2p', label: 'σ2p', type: 'single' },
                  { id: 'pi_2p', label: 'π2pₓ, π2pᵧ', type: 'double', ids: ['pi_2px', 'pi_2py'] },
                  { id: 'sigma_star_2s', label: 'σ*2s', type: 'single' },
                  { id: 'sigma_2s', label: 'σ2s', type: 'single' },
                  { id: 'sigma_star_1s', label: 'σ*1s', type: 'single' },
                  { id: 'sigma_1s', label: 'σ1s', type: 'single' },
                ].map((lvl) => {
                  if (lvl.type === 'single') {
                    const mo = moDiagram.find((m) => m.id === lvl.id)!;
                    const isError = feedback?.targetId === mo.id;

                    return (
                      <div key={mo.id} className="flex items-center justify-center gap-2">
                        <div className="w-4 sm:w-6 h-0.5 bg-slate-300" />
                        <button
                          type="button"
                          onClick={() => handleAddElectron(mo.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleAddElectron(mo.id);
                          }}
                          className={`w-24 sm:w-32 h-10 sm:h-11 rounded-2xl border-2 flex items-center justify-center gap-1.5 font-black text-lg sm:text-xl transition-all cursor-pointer shadow-xs ${
                            isError
                              ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce'
                              : mo.electrons.length > 0
                              ? 'border-emerald-500 bg-emerald-50 text-red-600'
                              : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50'
                          }`}
                          title={`Click to fill ${mo.label}`}
                        >
                          {mo.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black leading-none drop-shadow-xs">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                        </button>
                        <div className="w-4 sm:w-6 h-0.5 bg-slate-300" />
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-[#2563EB] w-14 sm:w-16 text-left shrink-0">
                          {mo.label}
                        </span>
                      </div>
                    );
                  } else {
                    const mo1 = moDiagram.find((m) => m.id === lvl.ids![0])!;
                    const mo2 = moDiagram.find((m) => m.id === lvl.ids![1])!;
                    const isError1 = feedback?.targetId === mo1.id;
                    const isError2 = feedback?.targetId === mo2.id;

                    return (
                      <div key={lvl.id} className="flex items-center justify-center gap-1.5 sm:gap-2">
                        <div className="w-2 sm:w-4 h-0.5 bg-slate-300" />
                        
                        {/* Degenerate Orbital 1 */}
                        <button
                          type="button"
                          onClick={() => handleAddElectron(mo1.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleAddElectron(mo1.id);
                          }}
                          className={`w-14 sm:w-18 h-10 sm:h-11 rounded-2xl border-2 flex items-center justify-center gap-1 font-black text-lg sm:text-xl transition-all cursor-pointer shadow-xs ${
                            isError1
                              ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce'
                              : mo1.electrons.length > 0
                              ? 'border-emerald-500 bg-emerald-50 text-red-600'
                              : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50'
                          }`}
                          title={`Click to fill ${mo1.label}`}
                        >
                          {mo1.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black leading-none drop-shadow-xs">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                        </button>

                        {/* Degenerate Orbital 2 */}
                        <button
                          type="button"
                          onClick={() => handleAddElectron(mo2.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleAddElectron(mo2.id);
                          }}
                          className={`w-14 sm:w-18 h-10 sm:h-11 rounded-2xl border-2 flex items-center justify-center gap-1 font-black text-lg sm:text-xl transition-all cursor-pointer shadow-xs ${
                            isError2
                              ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce'
                              : mo2.electrons.length > 0
                              ? 'border-emerald-500 bg-emerald-50 text-red-600'
                              : 'border-slate-300 bg-white hover:border-sky-400 hover:bg-sky-50'
                          }`}
                          title={`Click to fill ${mo2.label}`}
                        >
                          {mo2.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black leading-none drop-shadow-xs">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                        </button>

                        <div className="w-2 sm:w-4 h-0.5 bg-slate-300" />
                        <span className="text-[10px] sm:text-xs font-mono font-bold text-[#2563EB] w-14 sm:w-16 text-left shrink-0">
                          {lvl.label}
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* ── CENTER SCREEN PRINCIPLE VIOLATION POPUP (AUFBAU / PAULI / HUND) ── */}
            {feedback && (
              <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-rose-50/95 border-2 border-rose-300 rounded-2xl p-3.5 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col gap-2 relative">
                  
                  {/* Top Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black font-mono uppercase tracking-wide bg-rose-200/80 text-rose-800 border border-rose-300 shadow-2xs">
                        {feedback.ruleName} Violation
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFeedback(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Violation Message */}
                  <div className="text-xs sm:text-sm font-black text-rose-800 leading-snug">
                    {feedback.message}
                  </div>

                  {/* Suggestion Card */}
                  {feedback.suggestion && (
                    <div className="text-[10.5px] sm:text-xs text-amber-900 bg-amber-50/90 border border-amber-200 p-2 rounded-xl font-medium leading-relaxed flex items-start gap-1.5 shadow-2xs">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{feedback.suggestion}</span>
                    </div>
                  )}

                  {/* Action Buttons: Revert & Dismiss */}
                  <div className="flex items-center gap-2 pt-1">
                    {historyStack.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRevert}
                        className="flex-1 py-1.5 px-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Revert Step</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setFeedback(null)}
                      className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ── 3. BOTTOM CONTROL DOCK (ELECTRON TRAY + REVERT/RESET) ───────────── */}
          <footer className="w-full flex items-center justify-center py-1 shrink-0">
            <div className="bg-white/95 border border-slate-200 rounded-2xl p-2 sm:p-2.5 shadow-md flex flex-col items-center gap-1.5 max-w-xs sm:max-w-sm w-full">
              
              {/* Header: B2 Electrons (0/10) matching 3rd image */}
              <div className="text-[11px] sm:text-xs font-bold text-slate-700 font-mono">
                B₂ Electrons ({placedElectronsCount}/10):
              </div>

              {/* Red Circle Electrons Tray matching 3rd image */}
              <div className="flex flex-wrap gap-1.5 justify-center items-center max-w-[260px] sm:max-w-[280px]">
                {Array.from({ length: totalTargetElectrons }).map((_, idx) => {
                  const isPlaced = idx < placedElectronsCount;
                  return (
                    <div
                      key={idx}
                      draggable={!isPlaced}
                      onDragStart={(e) => {
                        if (!isPlaced) {
                          e.dataTransfer.setData('text/plain', 'electron');
                          e.dataTransfer.effectAllowed = 'copy';
                        }
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all select-none ${
                        isPlaced
                          ? 'opacity-25 border-slate-300 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'border-[#EF4444] bg-white text-[#EF4444] shadow-xs cursor-grab active:cursor-grabbing hover:scale-110 hover:border-red-600'
                      }`}
                      title={isPlaced ? 'Placed' : 'Drag into orbital'}
                    >
                      {isPlaced ? '✓' : 'e⁻'}
                    </div>
                  );
                })}
              </div>

              {/* Revert and Reset Action Buttons */}
              {historyStack.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleRevert}
                    className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 animate-in fade-in duration-200"
                    title="Undo last electron placement"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95 animate-in fade-in duration-200"
                    title="Reset all orbitals"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              )}
            </div>
          </footer>

        </div>
      )}

      {/* ── 4. THEORY / EXPLANATION PAGE (BLACK FONT TEXTBOOK STYLE) ─────────── */}
      {showConceptsModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Molecular Orbital Theory (MOT) — Level 2: B₂
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                Electronic Configuration, Aufbau Principle, Pauli Exclusion, Hund&apos;s Rule &amp; Bond Order
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

          {/* Scrollable Content Body (Pure Black Font, Generous Line Height, Mixed Paragraphs & Bullet Points) */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-9 text-black text-base sm:text-lg leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Molecular Orbital Configuration of B2 */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                1. Molecular Orbital Configuration of Boron (B₂)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Each Boron atom has atomic number Z = 5 with atomic electronic configuration 1s² 2s² 2p¹. In diatomic Boron (B₂), there are a total of 10 electrons (4 core electrons and 6 valence electrons) distributed across bonding and antibonding molecular orbitals.
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Core electrons configuration:</strong> σ1s² σ*1s² (4 electrons occupying the lowest energy core molecular orbitals).
                </li>
                <li>
                  <strong>Valence electrons configuration:</strong> σ2s² σ*2s² (π2pₓ¹ = π2pᵧ¹) (6 electrons occupying valence molecular orbitals).
                </li>
                <li>
                  <strong>Complete molecular orbital configuration:</strong> σ1s² σ*1s² σ2s² σ*2s² π2pₓ¹ π2pᵧ¹.
                </li>
                <li>
                  <strong>Total number of electrons:</strong> 10 electrons.
                </li>
              </ul>
            </div>

            {/* Section 2: Aufbau Principle & Energy Ordering */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                2. The Aufbau Principle &amp; Energy Ordering (Z &lt; 8)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                According to the Aufbau Principle, electrons occupy the lowest available energy levels first before filling higher energy molecular orbitals.
              </p>
              <h4 className="text-base sm:text-lg font-bold text-black underline underline-offset-4 pt-1">
                Effect of 2s–2p Orbital Mixing in Lighter Diatomics:
              </h4>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Orbital mixing phenomenon:</strong> In homonuclear diatomic molecules of lighter elements (Z &lt; 8, such as B₂, C₂, and N₂), the energy difference between 2s and 2p atomic orbitals is small, allowing significant 2s–2p mixing.
                </li>
                <li>
                  <strong>Energy level inversion:</strong> This mixing repels the σ2s orbital downward and raises the σ2p orbital in energy, placing π2pₓ and π2pᵧ lower in energy than σ2p.
                </li>
                <li>
                  <strong>Complete energy order for B₂:</strong> σ1s &lt; σ*1s &lt; σ2s &lt; σ*2s &lt; (π2pₓ = π2pᵧ) &lt; σ2p &lt; (π*2pₓ = π*2pᵧ) &lt; σ*2p.
                </li>
                <li>
                  <strong>Filling sequence for 10 electrons:</strong> Electrons fill σ1s (2), σ*1s (2), σ2s (2), σ*2s (2), and the final 2 electrons enter the degenerate π2p orbitals.
                </li>
              </ul>
            </div>

            {/* Section 3: Pauli Exclusion Principle */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                3. Pauli Exclusion Principle
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Formulated by Wolfgang Pauli in 1925, this fundamental quantum mechanical principle governs electron spin and orbital occupancy.
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Maximum capacity:</strong> A single molecular orbital can accommodate a maximum of 2 electrons.
                </li>
                <li>
                  <strong>Spin requirement:</strong> When two electrons occupy the same orbital, they must have opposite spins (represented as ↑↓, with spin quantum numbers +1/2 and -1/2).
                </li>
                <li>
                  <strong>Application in B₂:</strong> The σ1s, σ*1s, σ2s, and σ*2s molecular orbitals each hold 2 paired electrons with antiparallel spins.
                </li>
              </ul>
            </div>

            {/* Section 4: Hund's Rule of Maximum Multiplicity & Paramagnetism */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                4. Hund&apos;s Rule of Maximum Multiplicity &amp; Paramagnetism
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Hund&apos;s Rule states that when degenerate (equal energy) molecular orbitals are available, electrons occupy them singly with parallel spins before pairing occurs.
              </p>
              <h4 className="text-base sm:text-lg font-bold text-black underline underline-offset-4 pt-1">
                Consequences for the B₂ Molecule:
              </h4>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Degenerate π2p orbitals:</strong> The π2pₓ and π2pᵧ molecular orbitals possess identical energy.
                </li>
                <li>
                  <strong>Unpaired electron distribution:</strong> The 9th electron enters π2pₓ with spin-up (↑), and the 10th electron enters π2pᵧ with parallel spin-up (↑), rather than pairing in a single orbital.
                </li>
                <li>
                  <strong>Paramagnetic character:</strong> Because B₂ possesses 2 unpaired electrons, it has a net magnetic dipole moment and is attracted into external magnetic fields (paramagnetic).
                </li>
                <li>
                  <strong>Decisive triumph of MOT:</strong> Valence Bond Theory predicted B₂ to have all electrons paired (diamagnetic). Experimental verification of paramagnetism was landmark proof supporting Molecular Orbital Theory.
                </li>
              </ul>
            </div>

            {/* Section 5: Bond Order Calculation and Stability */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                5. Bond Order Calculation &amp; Molecular Stability
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                The bond order provides a quantitative measure of covalent bond strength and net molecular stability between the two Boron nuclei.
              </p>
              <h4 className="text-base sm:text-lg font-bold text-black underline underline-offset-4 pt-1">
                Mathematical Formula &amp; Step-by-Step Values:
              </h4>
              <ul className="list-disc pl-5 sm:pl-7 space-y-3 sm:space-y-3.5 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>Formula:</strong> Bond Order = (Nb - Na) / 2.
                </li>
                <li>
                  <strong>Bonding electrons (Nb):</strong> 6 electrons (2 in σ1s, 2 in σ2s, 1 in π2pₓ, 1 in π2pᵧ).
                </li>
                <li>
                  <strong>Antibonding electrons (Na):</strong> 4 electrons (2 in σ*1s, 2 in σ*2s).
                </li>
                <li>
                  <strong>Calculation:</strong> Bond Order = (6 - 4) / 2 = 1.0.
                </li>
                <li>
                  <strong>Interpretation:</strong> A positive bond order of 1.0 indicates that diatomic Boron is a stable molecule held together by a net single bond formed by the two half-filled π molecular orbitals.
                </li>
              </ul>
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
