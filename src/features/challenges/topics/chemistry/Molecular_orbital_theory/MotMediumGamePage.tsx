"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Atom,
  RotateCcw,
  Undo2,
  CheckCircle2,
  X,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
  Target,
  ArrowRight,
  Play
} from 'lucide-react';

import { MOT_MEDIUM_STEPS, KEY_CONCEPTS_DATA } from './helpers';

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

// Helper function to return initial MO diagram based on active molecule (B₂ vs O₂)
const getInitialMODiagram = (molecule: 'B2' | 'O2'): MOItem[] => {
  if (molecule === 'O2') {
    // For O₂ (Z >= 8), σ2p is LOWER in energy than π2pₓ / π2pᵧ
    return [
      { id: 'sigma_star_2p', name: 'σ*2p', label: 'σ*2p', type: 'antibonding', level: 8, electrons: [], maxElectrons: 2 },
      { id: 'pi_star_2px', name: 'π*2pₓ', label: 'π*2pₓ', type: 'antibonding', level: 7, isDegenerate: true, pairId: 'pi_star_2py', electrons: [], maxElectrons: 2 },
      { id: 'pi_star_2py', name: 'π*2pᵧ', label: 'π*2pᵧ', type: 'antibonding', level: 7, isDegenerate: true, pairId: 'pi_star_2px', electrons: [], maxElectrons: 2 },
      { id: 'pi_2px', name: 'π2pₓ', label: 'π2pₓ', type: 'bonding', level: 6, isDegenerate: true, pairId: 'pi_2py', electrons: [], maxElectrons: 2 },
      { id: 'pi_2py', name: 'π2pᵧ', label: 'π2pᵧ', type: 'bonding', level: 6, isDegenerate: true, pairId: 'pi_2px', electrons: [], maxElectrons: 2 },
      { id: 'sigma_2p', name: 'σ2p', label: 'σ2p', type: 'bonding', level: 5, electrons: [], maxElectrons: 2 },
      { id: 'sigma_star_2s', name: 'σ*2s', label: 'σ*2s', type: 'antibonding', level: 4, electrons: [], maxElectrons: 2 },
      { id: 'sigma_2s', name: 'σ2s', label: 'σ2s', type: 'bonding', level: 3, electrons: [], maxElectrons: 2 },
      { id: 'sigma_star_1s', name: 'σ*1s', label: 'σ*1s', type: 'antibonding', level: 2, electrons: [], maxElectrons: 2 },
      { id: 'sigma_1s', name: 'σ1s', label: 'σ1s', type: 'bonding', level: 1, electrons: [], maxElectrons: 2 },
    ];
  }

  // Default B₂ (Z < 8): π2pₓ / π2pᵧ is LOWER in energy than σ2p
  return [
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
};

export default function MotMediumGamePage({ difficulty = 'medium' }: { difficulty?: string }) {
  const router = useRouter();

  // Screen View Mode: intro mission target screen vs interactive challenge mode
  const [gameStarted, setGameStarted] = useState(false);

  // Molecule Choice State ('B2' or 'O2')
  const [molecule, setMolecule] = useState<'B2' | 'O2'>('B2');

  // State Management
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);

  // Total electrons for current active molecule (B₂ = 10, O₂ = 16)
  const totalTargetElectrons = molecule === 'B2' ? 10 : 16;

  // Molecular Orbitals Filling State
  const [moDiagram, setMoDiagram] = useState<MOItem[]>(() => getInitialMODiagram('B2'));
  const [availableElectrons, setAvailableElectrons] = useState(10);
  const [historyStack, setHistoryStack] = useState<MOItem[][]>([]);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    ruleName?: 'Aufbau Principle' | 'Pauli Exclusion Principle' | "Hund's Rule";
    message: string;
    suggestion?: string;
    targetId?: string;
    canNextMolecule?: boolean;
  } | null>(null);

  // Key Concepts Modal Drawer
  const [showConceptsModal, setShowConceptsModal] = useState(false);

  // Current Step Info
  const stepInfo = MOT_MEDIUM_STEPS.find((s) => s.id === currentStep) || MOT_MEDIUM_STEPS[0];

  // Calculate total electrons placed
  const placedElectronsCount = useMemo(() => {
    return moDiagram.reduce((acc, mo) => acc + mo.electrons.length, 0);
  }, [moDiagram]);

  // Switch Active Molecule (B₂ <-> O₂)
  const switchMolecule = (mol: 'B2' | 'O2') => {
    setMolecule(mol);
    setMoDiagram(getInitialMODiagram(mol));
    setAvailableElectrons(mol === 'B2' ? 10 : 16);
    setHistoryStack([]);
    setFeedback({
      type: 'success',
      message: `✨ Switched to ${mol === 'B2' ? 'B₂ (10 Electrons)' : 'O₂ (16 Electrons)'}. Fill the orbitals!`
    });
  };

  // Reset the diagram for current molecule
  const handleReset = () => {
    setMoDiagram(getInitialMODiagram(molecule));
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
    setFeedback({ type: 'success', message: '↩ Reverted last electron placement step.' });
  };

  // Drag and Drop or Click to Fill Rules Engine (Aufbau, Pauli, Hund)
  const handleAddElectron = (targetId: string) => {
    if (placedElectronsCount >= totalTargetElectrons) {
      setFeedback({ type: 'error', message: `✕ All ${totalTargetElectrons} electrons have already been placed for ${molecule === 'B2' ? 'B₂' : 'O₂'}.`, targetId });
      return;
    }

    const targetMO = moDiagram.find((m) => m.id === targetId);
    if (!targetMO) return;

    // 1. Pauli Check: Maximum 2 electrons per orbital
    if (targetMO.electrons.length >= 2) {
      setFeedback({
        type: 'error',
        ruleName: 'Pauli Exclusion Principle',
        message: '✕ An orbital can hold a maximum of 2 electrons.',
        suggestion: '💡 Pauli Exclusion Rule: No orbital can contain more than 2 electrons, and they must have opposite spins (↑↓).',
        targetId
      });
      return;
    }

    // 2. Aufbau Check: Fill lower-energy orbitals first before higher
    const lowerUnfilledMO = moDiagram
      .filter((m) => m.level < targetMO.level)
      .find((m) => m.electrons.length < m.maxElectrons);

    if (lowerUnfilledMO) {
      setFeedback({
        type: 'error',
        ruleName: 'Aufbau Principle',
        message: `✕ Fill lower-energy molecular orbitals (${lowerUnfilledMO.label}) before moving to higher energy.`,
        suggestion: `💡 Aufbau Rule: Electrons must occupy lower-energy molecular orbitals (${lowerUnfilledMO.label}) before higher energy levels can be filled.`,
        targetId
      });
      return;
    }

    // 3. Hund's Rule Check for degenerate orbitals (π2p or π*2p)
    if (targetMO.isDegenerate && targetMO.pairId) {
      const pairMO = moDiagram.find((m) => m.id === targetMO.pairId);
      if (pairMO) {
        // If target orbital is trying to get a 2nd electron (pairing) while pair MO has 0 electrons
        if (targetMO.electrons.length === 1 && pairMO.electrons.length === 0) {
          setFeedback({
            type: 'error',
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
    setFeedback({ type: 'success', message: '✓ Correct!' });

    // Check completion
    const newCount = placedElectronsCount + 1;
    if (newCount === totalTargetElectrons) {
      setScore((prev) => Math.max(prev, 100));
      setFeedback({
        type: 'success',
        message: `🎉 ${molecule === 'B2' ? 'B₂' : 'O₂'} MO Configuration Complete! (${totalTargetElectrons} Electrons)`,
        canNextMolecule: molecule === 'B2'
      });
    }
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col">
      
      {/* ── 1. TOP TOOLBAR HEADER (Matching Easy Challenge) ─────────────────── */}
      <header className="w-full bg-white/90 border-b border-slate-200 backdrop-blur-md px-4 py-2.5 flex items-center justify-between z-20 shadow-sm shrink-0">
        {/* Top Left: Back Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[#1E293B] font-extrabold text-xs transition-all shadow-md backdrop-blur-md cursor-pointer"
            title="Back to Topics"
          >
            <ChevronLeft className="w-5 h-5 text-[#2563EB]" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Top Center: Target Completed Badge */}
        {placedElectronsCount === totalTargetElectrons && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/40 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm text-xs font-extrabold text-[#22C55E] flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span>TARGET COMPLETED</span>
          </div>
        )}

        {/* Right Action: Molecule Switcher Tabs + Explanation Drawer Button */}
        <div className="flex items-center gap-3">
          {/* Molecule Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => switchMolecule('B2')}
              className={`px-3 py-1 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                molecule === 'B2'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200'
              }`}
            >
              B₂ (10 e⁻)
            </button>
            <button
              onClick={() => switchMolecule('O2')}
              className={`px-3 py-1 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                molecule === 'O2'
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200'
              }`}
            >
              O₂ (16 e⁻)
            </button>
          </div>

          {/* Explanation Button */}
          <button
            onClick={() => setShowConceptsModal(true)}
            className="px-3.5 py-1.5 bg-[#F1F5F9] hover:bg-[#E5EEF5] text-[#2563EB] border border-[#38A9E8]/40 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#2563EB]" />
            <span>Explanation</span>
          </button>
        </div>
      </header>

      {/* ── 2. INTRO MISSION TARGET OVERLAY SCREEN (Matching Easy Challenge) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-sm overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>

          {/* Central Target Text & Start Mission Button (Floating without box container) */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2">
            <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
              MOLECULAR ORBITAL THEORY
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Fill MOs for B₂ & O₂ to determine their electronic configurations
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

      {/* ── 3. MAIN WORKSHOP DIAGRAM AREA ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-between p-4 bg-[#F8FAFC] relative overflow-hidden">
        
        {/* Top Floating Live Electronic Configuration Badge */}
        <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-3 shadow-md flex items-center justify-between text-xs text-[#1E293B] mb-2 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-[#2563EB]">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>{molecule === 'B2' ? 'B₂' : 'O₂'} MO Configuration:</span>
            </div>
            <div className="font-mono text-xs text-[#64748B] flex items-center gap-2 flex-wrap">
              <span className="bg-[#E5EEF5] text-[#2563EB] px-2 py-0.5 rounded font-bold">
                Core: σ1s² σ*1s²
              </span>
              <span className="bg-emerald-50 text-[#22C55E] px-2 py-0.5 rounded font-bold border border-emerald-200">
                Valence ({placedElectronsCount}/{totalTargetElectrons} e⁻)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRevert}
              disabled={historyStack.length === 0}
              className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1 transition-all ${
                historyStack.length > 0
                  ? 'text-[#2563EB] bg-[#E5EEF5] hover:bg-blue-100 border-[#38A9E8]/40 shadow-sm cursor-pointer'
                  : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
              }`}
              title="Undo last electron placement"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Revert</span>
            </button>

            <button
              onClick={handleReset}
              className="text-xs font-bold text-[#EF4444] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Reset all orbital fills"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* CENTER STAGE: FULL SCREEN MO ENERGY DIAGRAM */}
        <div className="flex-1 w-full max-w-4xl mx-auto bg-[#F1F5F9] border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-inner flex flex-col justify-between relative overflow-y-auto">
          
          <div className="flex-1 flex items-center justify-center gap-8 py-2">
            {/* Sleek Energy Arrow Vector Indicator */}
            <div className="flex flex-col items-center justify-between h-full max-h-[420px] py-1 shrink-0">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300 shadow-sm whitespace-nowrap">
                <span>HIGHER ENERGY</span>
                <span>↑</span>
              </div>

              <div className="flex-1 w-2 bg-gradient-to-t from-blue-500 via-cyan-400 to-purple-600 rounded-full my-3 relative shadow-md">
                <div className="absolute -top-1 -left-[5px] w-0 h-0 border-x-[8px] border-x-transparent border-b-[12px] border-b-purple-600" />
              </div>

              <div className="text-[11px] font-extrabold text-[#2563EB] bg-blue-100 px-2.5 py-1 rounded-full border border-blue-300 shadow-sm whitespace-nowrap">
                <span>LOWER ENERGY</span>
              </div>
            </div>

            {/* MO Levels Column */}
            <div className="flex-1 flex flex-col justify-between gap-3 py-1 max-w-[500px]">
              {(molecule === 'O2'
                ? [
                    { id: 'sigma_star_2p', label: 'σ*2p', type: 'single' },
                    { id: 'pi_star_2p', label: 'π*2pₓ  π*2pᵧ', type: 'double', ids: ['pi_star_2px', 'pi_star_2py'] },
                    { id: 'pi_2p', label: 'π2pₓ  π2pᵧ', type: 'double', ids: ['pi_2px', 'pi_2py'] },
                    { id: 'sigma_2p', label: 'σ2p', type: 'single' },
                    { id: 'sigma_star_2s', label: 'σ*2s', type: 'single' },
                    { id: 'sigma_2s', label: 'σ2s', type: 'single' },
                    { id: 'sigma_star_1s', label: 'σ*1s', type: 'single' },
                    { id: 'sigma_1s', label: 'σ1s', type: 'single' },
                  ]
                : [
                    { id: 'sigma_star_2p', label: 'σ*2p', type: 'single' },
                    { id: 'pi_star_2p', label: 'π*2pₓ  π*2pᵧ', type: 'double', ids: ['pi_star_2px', 'pi_star_2py'] },
                    { id: 'sigma_2p', label: 'σ2p', type: 'single' },
                    { id: 'pi_2p', label: 'π2pₓ  π2pᵧ', type: 'double', ids: ['pi_2px', 'pi_2py'] },
                    { id: 'sigma_star_2s', label: 'σ*2s', type: 'single' },
                    { id: 'sigma_2s', label: 'σ2s', type: 'single' },
                    { id: 'sigma_star_1s', label: 'σ*1s', type: 'single' },
                    { id: 'sigma_1s', label: 'σ1s', type: 'single' },
                  ]
              ).map((lvl) => {
                if (lvl.type === 'single') {
                  const mo = moDiagram.find((m) => m.id === lvl.id)!;
                  const isFeedbackTarget = feedback?.targetId === mo.id;

                  return (
                    <div key={mo.id} className="flex items-center justify-center gap-3">
                      <div className="w-12 h-0.5 bg-slate-300" />
                      <button
                        onClick={() => handleAddElectron(mo.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleAddElectron(mo.id);
                        }}
                        className={`w-32 sm:w-36 h-12 sm:h-13 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-lg sm:text-xl transition-all duration-200 cursor-pointer shadow-md ${
                          isFeedbackTarget && feedback?.type === 'error'
                            ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce shadow-rose-200'
                            : mo.electrons.length > 0
                            ? 'border-[#22C55E] bg-emerald-50 text-[#EF4444] shadow-md ring-2 ring-emerald-400/30'
                            : 'border-slate-300 bg-white text-slate-400 hover:border-[#38A9E8] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {mo.electrons.length > 0 &&
                          mo.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black drop-shadow-sm">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                      </button>
                      <div className="w-12 h-0.5 bg-slate-300" />
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-[#2563EB] w-24 text-left">{mo.label}</span>
                    </div>
                  );
                } else {
                  const mo1 = moDiagram.find((m) => m.id === lvl.ids![0])!;
                  const mo2 = moDiagram.find((m) => m.id === lvl.ids![1])!;

                  return (
                    <div key={lvl.id} className="flex items-center justify-center gap-2">
                      <div className="w-6 h-0.5 bg-slate-300" />
                      <button
                        onClick={() => handleAddElectron(mo1.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleAddElectron(mo1.id);
                        }}
                        className={`w-24 sm:w-28 h-12 sm:h-13 rounded-2xl border-2 flex items-center justify-center gap-1.5 font-black text-lg sm:text-xl transition-all duration-200 cursor-pointer shadow-md ${
                          feedback?.targetId === mo1.id && feedback?.type === 'error'
                            ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce shadow-rose-200'
                            : mo1.electrons.length > 0
                            ? 'border-[#22C55E] bg-emerald-50 text-[#EF4444] shadow-md ring-2 ring-emerald-400/30'
                            : 'border-slate-300 bg-white text-slate-400 hover:border-[#38A9E8] hover:bg-[#F8FAFC]'
                        }`}
                        title={`Molecular Orbital: ${mo1.label}`}
                      >
                        {mo1.electrons.length > 0 &&
                          mo1.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black drop-shadow-sm">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                      </button>

                      <button
                        onClick={() => handleAddElectron(mo2.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleAddElectron(mo2.id);
                        }}
                        className={`w-24 sm:w-28 h-12 sm:h-13 rounded-2xl border-2 flex items-center justify-center gap-1.5 font-black text-lg sm:text-xl transition-all duration-200 cursor-pointer shadow-md ${
                          feedback?.targetId === mo2.id && feedback?.type === 'error'
                            ? 'border-rose-500 bg-rose-100 text-rose-700 animate-bounce shadow-rose-200'
                            : mo2.electrons.length > 0
                            ? 'border-[#22C55E] bg-emerald-50 text-[#EF4444] shadow-md ring-2 ring-emerald-400/30'
                            : 'border-slate-300 bg-white text-slate-400 hover:border-[#38A9E8] hover:bg-[#F8FAFC]'
                        }`}
                        title={`Molecular Orbital: ${mo2.label}`}
                      >
                        {mo2.electrons.length > 0 &&
                          mo2.electrons.map((sp, idx) => (
                            <span key={idx} className="text-[#EF4444] font-black drop-shadow-sm">
                              {sp === 'up' ? '↑' : '↓'}
                            </span>
                          ))}
                      </button>
                      <div className="w-6 h-0.5 bg-slate-300" />
                      <span className="text-xs sm:text-sm font-mono font-extrabold text-[#2563EB] w-24 text-left">{lvl.label}</span>
                    </div>
                  );
                }
              })}
            </div>
          </div>

          {/* Feedback Callout Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-2xl border flex flex-col gap-1.5 mt-2 text-xs font-semibold shadow-md transition-all ${
                feedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                )}

                {feedback.ruleName && (
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold font-mono uppercase tracking-wide bg-rose-100 text-rose-700 border border-rose-300 shadow-sm">
                    {feedback.ruleName} Violation
                  </span>
                )}

                <span className="font-extrabold">{feedback.message}</span>
              </div>

              {feedback.suggestion && (
                <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl font-medium leading-relaxed mt-1">
                  {feedback.suggestion}
                </div>
              )}

              {feedback.canNextMolecule && (
                <button
                  onClick={() => switchMolecule('O2')}
                  className="mt-2 py-2 px-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>🎉 Continue to O₂ Molecule (16 Electrons) →</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 4. BOTTOM DOCK AREA: DRAG & DROP ELECTRONS + INSTRUCTION BADGE ─────── */}
        <div className="w-full flex flex-col items-center gap-2 pointer-events-auto z-20 mt-3 shrink-0">
          
          {/* Target Instruction Pill */}
          <div className="flex items-center gap-2 bg-white/95 border border-[#38A9E8]/40 px-4 py-1.5 rounded-full text-[#1E293B] text-xs font-extrabold shadow-md backdrop-blur-md">
            <Target className="w-4 h-4 text-[#2563EB]" />
            <span>
              {placedElectronsCount === totalTargetElectrons
                ? `TARGET COMPLETED: All ${totalTargetElectrons} electrons placed for ${molecule === 'B2' ? 'B₂' : 'O₂'}!`
                : `TARGET: Drag or Click e⁻ electrons into lowest unfilled MO levels (${totalTargetElectrons - placedElectronsCount} left)`}
            </span>
          </div>

          {/* Draggable Electron Tray */}
          <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-lg flex items-center gap-2 flex-wrap justify-center max-w-2xl w-full">
            <span className="text-xs font-bold text-[#64748B] mr-2">
              {molecule === 'B2' ? 'B₂' : 'O₂'} Electrons ({placedElectronsCount}/{totalTargetElectrons}):
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center items-center">
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
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-xs transition-all shadow-sm ${
                      isPlaced
                        ? 'opacity-30 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-[#EF4444] bg-white text-[#EF4444] hover:bg-rose-50 hover:scale-110 hover:border-red-600 shadow-md cursor-grab active:cursor-grabbing'
                    }`}
                    title={isPlaced ? 'Electron placed' : 'Drag this electron into an orbital box above'}
                  >
                    {isPlaced ? '✓' : 'e⁻'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      {/* ── 5. EXPLANATION & THEORY MODAL DRAWER ────────────────────────────────── */}
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
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B]">Molecular Orbital Theory — Medium Level Guide</h3>
                  <p className="text-xs text-[#64748B]">Understanding MO diagrams, filling order, and magnetic properties</p>
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
              
              {/* Aufbau Principle */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>⚡</span> 1. The Aufbau Principle (Energy Level Order)
                </h4>
                <p className="text-[#1E293B]">
                  Electrons fill molecular orbitals starting from the lowest energy state (σ1s) up to higher energy states. For homonuclear diatomic molecules like Boron (B₂), the energy order is: <strong>σ1s &lt; σ*1s &lt; σ2s &lt; σ*2s &lt; (π2pₓ = π2pᵧ) &lt; σ2p &lt; (π*2pₓ = π*2pᵧ) &lt; σ*2p</strong>.
                </p>
              </div>

              {/* Pauli Exclusion Principle */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>⚛️</span> 2. Pauli Exclusion Principle
                </h4>
                <p className="text-[#64748B]">
                  Each molecular orbital box can accommodate a maximum of <strong>2 electrons</strong>. When two electrons occupy the same orbital, they must have opposite spins (represented as <strong>↑↓</strong>).
                </p>
              </div>

              {/* Hund's Rule */}
              <div className="p-4 bg-[#E5EEF5]/50 border border-[#38A9E8]/40 rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-[#2563EB] flex items-center gap-2">
                  <span>🔄</span> 3. Hund's Rule of Maximum Multiplicity
                </h4>
                <p className="text-[#1E293B]">
                  When filling degenerate (equal energy) orbitals such as <strong>π2pₓ & π2pᵧ</strong> or <strong>π*2pₓ & π*2pᵧ</strong>, electrons enter singly with parallel spins (<strong>↑</strong>) before pairing up. In B₂, the 9th and 10th electrons enter separate π2p orbitals, making B₂ <strong>paramagnetic</strong> with 2 unpaired electrons!
                </p>
              </div>

              {/* B2 vs O2 Structural Difference */}
              <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                <h4 className="text-sm font-extrabold text-purple-700 flex items-center gap-2">
                  <span>🔬</span> B₂ vs O₂ Energy Order Inversion
                </h4>
                <p className="text-[#1E293B]">
                  In lighter elements (B₂, C₂, N₂ where Z &lt; 8), 2s-2p mixing raises the energy of σ2p above π2p. In heavier elements (O₂, F₂ where Z ≥ 8), σ2p drops below π2p.
                </p>
              </div>

            </div>

            {/* Sticky Bottom Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setShowConceptsModal(false)}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Close Explanation & Resume Workshop
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
