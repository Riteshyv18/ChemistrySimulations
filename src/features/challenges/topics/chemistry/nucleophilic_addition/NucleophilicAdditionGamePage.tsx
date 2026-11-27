"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Play,
  Minus,
  Plus,
  Zap,
  X,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import NucleophilicAddition3D from "./NucleophilicAddition3D";
import {
  useNucleophilicAdditionStore,
  NUCLEOPHILIC_STAGES,
} from "./NucleophilicAdditionStore";

export interface NucleophilicAdditionGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function NucleophilicAdditionGamePage({
  difficulty = "standard",
  onExit,
}: NucleophilicAdditionGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Zustand Store
  const currentStage = useNucleophilicAdditionStore((s) => s.currentStage);
  const attackAngle = useNucleophilicAdditionStore((s) => s.attackAngle);
  const kineticEnergy = useNucleophilicAdditionStore((s) => s.kineticEnergy);
  const acidCatalystActive = useNucleophilicAdditionStore((s) => s.acidCatalystActive);
  const isSimulating = useNucleophilicAdditionStore((s) => s.isSimulating);
  const isWon = useNucleophilicAdditionStore((s) => s.isWon);
  const isGameOver = useNucleophilicAdditionStore((s) => s.isGameOver);
  const failureReason = useNucleophilicAdditionStore((s) => s.failureReason);
  const showResultModal = useNucleophilicAdditionStore((s) => s.showResultModal);

  const setAttackAngle = useNucleophilicAdditionStore((s) => s.setAttackAngle);
  const setKineticEnergy = useNucleophilicAdditionStore((s) => s.setKineticEnergy);
  const toggleAcidCatalyst = useNucleophilicAdditionStore((s) => s.toggleAcidCatalyst);
  const fireNucleophile = useNucleophilicAdditionStore((s) => s.fireNucleophile);
  const resetSimulation = useNucleophilicAdditionStore((s) => s.resetSimulation);
  const nextStage = useNucleophilicAdditionStore((s) => s.nextStage);

  const stage = NUCLEOPHILIC_STAGES[currentStage] || NUCLEOPHILIC_STAGES[1];

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const restartAll = useNucleophilicAdditionStore((s) => s.restartAll);

  // Editable angle input state
  const [isEditingAngle, setIsEditingAngle] = useState(false);
  const [typedAngle, setTypedAngle] = useState(attackAngle.toFixed(1));

  useEffect(() => {
    if (!isEditingAngle) {
      setTypedAngle(attackAngle.toFixed(1));
    }
  }, [attackAngle, isEditingAngle]);

  const commitTypedAngle = () => {
    setIsEditingAngle(false);
    const parsed = parseFloat(typedAngle);
    if (!isNaN(parsed) && Number.isFinite(parsed)) {
      setAttackAngle(parsed);
      setTypedAngle(parsed.toFixed(1));
    } else {
      setTypedAngle(attackAngle.toFixed(1));
    }
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const effectiveEa = acidCatalystActive && stage.catalyzedEa ? stage.catalyzedEa : stage.baselineEa;

  return (
    <div className="w-full h-full h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col">
      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 1: MISSION SCREEN (Matching Chemistry Template)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar with EXIT */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Mission Center Content */}
          <div className="max-w-2xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
            <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
              MODULE 11 • CARBONYL COMPOUNDS
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Aim the Nucleophile at the Correct Angle and Attack the Carbonyl Group
            </h1>

            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => setScreen("instructions")}
                className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 2: INSTRUCTIONS SCREEN (3 CARDS LANDSCAPE GRID)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar with EXIT */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Instructions Center Container */}
          <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-1 w-full animate-in fade-in duration-200 flex-1">
            <div className="text-center pt-0.5 pb-2">
              <h2 className="text-[#1E293B] text-sm sm:text-base md:text-lg font-black tracking-wide uppercase">
                INSTRUCTIONS TO PLAY
              </h2>
              <p className="text-slate-500 font-medium text-xs mt-0.5">
                Follow these 3 simple steps to complete the reaction:
              </p>
            </div>

            {/* 3 Step Cards Side-by-Side in Landscape Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2.5 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
              {/* Card 1: Set the Angle */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Set the Angle
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                    Use the ANGLE slider (+ / −) to aim the nucleophile along the optimal approach trajectory.
                  </p>
                </div>

                {/* Image Illustration 1 */}
                <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                  <img
                    src="/instructions/nucleophilic_step1_angle.svg"
                    alt="Angle alignment illustration"
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                  />
                </div>
              </div>

              {/* Card 2: Set the Energy */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Set the Energy
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                    Move the ENERGY slider to reach the required Ea shown at the top (turn on H⁺ in Stage 3).
                  </p>
                </div>

                {/* Image Illustration 2 */}
                <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                  <img
                    src="/instructions/nucleophilic_step2_energy.svg"
                    alt="Energy and catalyst illustration"
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                  />
                </div>
              </div>

              {/* Card 3: Click Attack */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Click Attack
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                    Press the ATTACK button to fire :C≡N⁻ and watch the flat molecule flip into a 3D tetrahedral shape!
                  </p>
                </div>

                {/* Image Illustration 3 */}
                <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                  <img
                    src="/instructions/nucleophilic_step3_attack.svg"
                    alt="Attack and tetrahedral flip illustration"
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Back and Play */}
            <div className="pt-2 pb-0.5 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setScreen("mission")}
                className="px-5 sm:px-6 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setScreen("lab")}
                className="px-6 sm:px-8 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: INTERACTIVE LAB GAMEPLAY (3D Canvas & HUD)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative z-10 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]">
          {/* Main 3D Simulation Canvas Area */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Canvas shadows gl={{ antialias: true, alpha: true }} className="w-full h-full">
              <NucleophilicAddition3D isModalOpen={showExplanation || showResultModal} />
            </Canvas>
          </div>

          {/* Floating Top Header Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Top-Left Exit Button */}
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Minimal Single-Line Central Target HUD */}
            <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm font-mono text-[11px] select-none pointer-events-none flex items-center gap-2 whitespace-nowrap">
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
                STAGE {currentStage}/3
              </span>
              <span className="font-bold text-slate-800">{stage.substrateName}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                Target: <span className="font-bold text-emerald-700">θ ≈ 107°</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                Ea:{" "}
                <span className={`font-bold ${acidCatalystActive ? "text-emerald-600" : "text-slate-800"}`}>
                  {effectiveEa.toFixed(0)} kJ/mol
                </span>
              </span>
            </div>

            {/* Top-Right Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanation(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-sky-600/25 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Minimal Floating Bottom Control Dock */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto py-2 px-3.5 sm:px-5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-lg flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 sm:gap-3">
              {/* Angle Slider */}
              <div className="flex items-center gap-2 min-w-[165px] sm:min-w-[185px]">
                <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  Angle
                </span>
                <input
                  type="range"
                  min={stage.minAngle}
                  max={stage.maxAngle}
                  step={0.5}
                  value={attackAngle}
                  disabled={isSimulating}
                  onChange={(e) => setAttackAngle(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:opacity-50"
                />
                <span className="font-mono text-xs font-bold text-slate-800 w-11 text-right shrink-0">
                  {attackAngle.toFixed(1)}°
                </span>
              </div>

              <div className="hidden sm:block w-px h-4 bg-slate-200" />

              {/* Energy Slider */}
              <div className="flex items-center gap-2 min-w-[155px] sm:min-w-[175px]">
                <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                  Energy
                </span>
                <input
                  type="range"
                  min={stage.minEnergy}
                  max={stage.maxEnergy}
                  step={5.0}
                  value={kineticEnergy}
                  disabled={isSimulating}
                  onChange={(e) => setKineticEnergy(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                />
                <span className="font-mono text-xs font-bold text-slate-800 w-11 text-right shrink-0">
                  {kineticEnergy.toFixed(0)} kJ
                </span>
              </div>

              {/* Stage 3 Special: Acid Catalyst Switch */}
              {currentStage === 3 && (
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={toggleAcidCatalyst}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-mono text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                    acidCatalystActive
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${acidCatalystActive ? "fill-current" : ""}`} />
                  <span>{acidCatalystActive ? "H⁺ ON" : "H⁺ OFF"}</span>
                </button>
              )}

              {/* Action Trigger Button */}
              <button
                type="button"
                disabled={isSimulating}
                onClick={fireNucleophile}
                className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs font-bold tracking-wider transition-all duration-200 shadow-sm ${
                  isSimulating
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#0284C7] hover:bg-[#0369A1] text-white active:scale-95 cursor-pointer"
                }`}
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? "animate-pulse" : ""}`} />
                <span>{isSimulating ? "FIRING..." : "ATTACK"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: EXPLANATION MODAL (KaTeX & Chemical Theory)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-[110] bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {stage.mathDerivation.title}
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase font-mono">
                  Module 11 • Carbonyl Reactivity & Bürgi–Dunitz Trajectory
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
            {/* Concept Overview */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                Physical & Orbital Mechanism
              </h3>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {stage.mathDerivation.concept}
              </p>
            </div>

            {/* Formulas Box */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Fundamental Equations & Principles
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {stage.mathDerivation.formulas.map((f, fIdx) => (
                  <div key={`formula-${fIdx}`} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-mono font-bold text-sky-800 text-xs mb-1">
                      {f.label}
                    </div>
                    <div className="font-mono font-black text-slate-900 text-sm sm:text-base mb-1">
                      {f.formula}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {f.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Derivation */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Step-by-Step Solution Analysis
              </h3>
              <div className="space-y-2">
                {stage.mathDerivation.steps.map((st) => (
                  <div key={`step-${st.step}`} className="p-3 rounded-xl bg-slate-50 border-l-4 border-sky-500">
                    <div className="font-bold text-slate-900 text-xs mb-1">
                      Step {st.step}: {st.title}
                    </div>
                    {st.math && (
                      <div className="font-mono text-xs font-black text-sky-700 mb-1">
                        {st.math}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-600">
                      {st.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusion */}
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium">
              {stage.mathDerivation.conclusion}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: VICTORY / STAGE CLEARED MODAL (Matching Standard Template)
          ══════════════════════════════════════════════════════════════════ */}
      {showResultModal && isWon && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-emerald-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              STAGE {currentStage} COMPLETE
            </span>

            <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
              Target Achieved!
            </h3>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed font-medium">
              Bürgi-Dunitz overlap achieved! The nucleophile pierced the π* LUMO and converted{" "}
              <strong>{stage.substrateName}</strong> into <strong>{stage.productName}</strong>.
            </p>

            {/* Stats Summary */}
            <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Attack Angle:</span>
                <span className="font-bold text-emerald-600">{attackAngle.toFixed(1)}° (θ_BD = 107.0°)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kinetic Energy:</span>
                <span className="font-bold text-slate-800">{kineticEnergy.toFixed(0)} kJ/mol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rehybridization:</span>
                <span className="font-bold text-sky-600">sp² (120°) ⟶ sp³ (109.5°)</span>
              </div>
            </div>

            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={resetSimulation}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Theory</span>
              </button>

              <button
                type="button"
                onClick={currentStage < 3 ? nextStage : restartAll}
                className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                {currentStage < 3 ? "Next →" : "Restart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: FAILURE / INCORRECT COLLISION MODAL (Matching Standard Template)
          ══════════════════════════════════════════════════════════════════ */}
      {showResultModal && isGameOver && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-rose-300">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <XCircle className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
              STAGE {currentStage} • COLLISION FAILED
            </span>

            <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
              Collision Failed!
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
              {failureReason}
            </p>

            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={resetSimulation}
                className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Theory</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
