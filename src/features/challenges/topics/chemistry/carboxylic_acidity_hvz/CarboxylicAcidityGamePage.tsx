"use client";

import React from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
  Flame,
  RotateCw,
  MoveHorizontal,
  Plus,
  Minus,
  FlaskConical,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import {
  useCarboxylicAcidityStore,
  ACID_DATA,
  CARBOXYLIC_EXPLANATIONS,
} from "./CarboxylicAcidityStore";
import CarboxylicAcidity3D from "./CarboxylicAcidity3D";

export interface CarboxylicAcidityGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function CarboxylicAcidityGamePage({
  difficulty = "level1",
  onExit,
}: CarboxylicAcidityGamePageProps) {
  const {
    stage,
    introStep,
    gameStarted,
    showExplanationModal,
    showSuccessModal,
    showWrongModal,
    feedbackMessage,
    clCount,
    stage1Dissociated,
    stage1Animating,
    stage2Reagent,
    stage2PosOffset,
    stage2Substituted,
    stage2Animating,
    stage3CatalystAdded,
    stage3RotationDeg,
    stage3Coupled,
    stage3CouplingAnimating,
    stage3Temp,
    stage3Esterified,
    stage3Esterifying,
    setStage,
    setIntroStep,
    setGameStarted,
    setShowExplanationModal,
    setShowSuccessModal,
    setShowWrongModal,
    resetCurrentStage,
    setClCount,
    testStage1Dissociation,
    selectStage2Reagent,
    setStage2PosOffset,
    addStage3Catalyst,
    setStage3Rotation,
    setStage3Temp,
  } = useCarboxylicAcidityStore();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const handleNextStage = () => {
    setShowSuccessModal(false);
    if (stage < 3) {
      setStage((stage + 1) as 1 | 2 | 3);
    } else {
      setStage(1);
    }
  };

  const isModalOpen = showExplanationModal || showSuccessModal || showWrongModal;

  const hudTargetText =
    stage === 1
      ? `Boost Acidity (−I) & Dissociate H⁺`
      : stage === 2
      ? stage2Reagent === "br2_redp"
        ? "Align Br₂ over α-Carbon & React"
        : "Select HVZ Reagent (Br₂ / Red P)"
      : !stage3CatalystAdded
      ? "Add H⁺ Catalyst to Activate C=O"
      : !stage3Coupled
      ? "Rotate Ethanol & Click Approach"
      : "Heat ≥ 80°C to Eliminate H₂O";

  return (
    <div className="w-full h-full h-[100dvh] relative overflow-hidden bg-[#F8FAFC] select-none font-sans">
      {/* ══════════════════════════════════════════════════════════════════════
          INTRO MISSION & INSTRUCTIONS VIEW OVERLAY
          ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
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

          {/* ── STEP 1: MISSION SCREEN ── */}
          {introStep === "mission" && (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                MODULE 11 • CARBOXYLIC ACIDS
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Master Carboxylic Acidity, HVZ &amp; Esterification
              </h1>

              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep("instructions")}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: INSTRUCTIONS SCREEN ── */}
          {introStep === "instructions" && (
            <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-1 w-full animate-in fade-in duration-200 flex-1">
              <div className="text-center pt-0.5 pb-2">
                <h2 className="text-[#1E293B] text-sm sm:text-base md:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
                <p className="text-slate-500 font-medium text-xs mt-0.5">
                  Follow these 3 simple steps:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2.5 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
                {/* Card 1 */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Boost Acidity (−I)
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Add Chlorine atoms to pull electrons away from –COO⁻ and dissociate H⁺.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/acidity_step1_inductive.svg"
                      alt="Boost acidity with chlorine"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        HVZ α-Bromination
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Pick the HVZ reagent, slide Br₂ over the α-carbon, and click REACT ✓.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/acidity_step2_hvz.svg"
                      alt="HVZ alpha bromination"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Synthesize an Ester
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Add H⁺, rotate Ethanol into alignment, click APPROACH ✓, then heat to remove H₂O.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/acidity_step3_ester.svg"
                      alt="Fischer esterification"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 pb-0.5 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep("mission")}
                  className="px-5 sm:px-6 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-6 sm:px-8 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIVE 3D SIMULATION WORKSPACE
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 z-0">
            <CarboxylicAcidity3D isModalOpen={isModalOpen} />
          </div>

          {/* ── TOP HUD HEADER ── */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            <div className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm font-mono text-[11px] select-none pointer-events-none flex items-center gap-2 whitespace-nowrap">
              <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/80">
                STAGE {stage}/3
              </span>
              <span className="text-slate-700 font-bold">{hudTargetText}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-sky-600/25 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── MINIMAL FLOATING BOTTOM CONTROL DOCK ── */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto py-2 px-3.5 sm:px-5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-lg flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 sm:gap-3">
              {/* STAGE 1 CONTROLS */}
              {stage === 1 && (
                <>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                    <button
                      type="button"
                      disabled={clCount === 0 || stage1Dissociated || stage1Animating}
                      onClick={() => setClCount((clCount - 1) as 0 | 1 | 2 | 3)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-40"
                      title="Remove Cl"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-extrabold text-emerald-700 px-2">
                      {clCount} Cl
                    </span>
                    <button
                      type="button"
                      disabled={clCount === 3 || stage1Dissociated || stage1Animating}
                      onClick={() => setClCount((clCount + 1) as 0 | 1 | 2 | 3)}
                      className="w-6 h-6 rounded-full bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 cursor-pointer disabled:opacity-40"
                      title="Add −I Cl"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-700 px-2">
                    pKa: <strong className={clCount === 3 ? "text-emerald-600" : "text-amber-600"}>{ACID_DATA[clCount].pka.toFixed(2)}</strong>
                  </span>

                  <button
                    type="button"
                    disabled={stage1Dissociated || stage1Animating}
                    onClick={testStage1Dissociation}
                    className="px-4 py-1.5 rounded-full font-mono text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {stage1Dissociated ? "DISSOCIATED ✓" : "DISSOCIATE H⁺"}
                  </button>
                </>
              )}

              {/* STAGE 2 CONTROLS (HVZ) */}
              {stage === 2 && (
                <>
                  {stage2Reagent !== "br2_redp" ? (
                    <>
                      <button
                        type="button"
                        disabled={stage2Animating}
                        onClick={() => selectStage2Reagent("br2_redp")}
                        className="px-4 py-1.5 rounded-full font-mono text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        Br₂ + Red P
                      </button>
                      <button
                        type="button"
                        disabled={stage2Animating}
                        onClick={() => selectStage2Reagent("br2_febr3")}
                        className="px-4 py-1.5 rounded-full font-mono text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        Br₂ + FeBr₃
                      </button>
                      <button
                        type="button"
                        disabled={stage2Animating}
                        onClick={() => selectStage2Reagent("hbr")}
                        className="px-4 py-1.5 rounded-full font-mono text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        HBr
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-[240px] sm:min-w-[270px] animate-in fade-in duration-200">
                      <MoveHorizontal
                        className={`w-4 h-4 shrink-0 ${
                          Math.abs(stage2PosOffset) <= 0.22 ? "text-emerald-600" : "text-sky-600"
                        }`}
                      />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                        Position Br₂
                      </span>
                      <input
                        type="range"
                        min={-1.45}
                        max={1.45}
                        step={0.05}
                        disabled={stage2Substituted || stage2Animating}
                        value={stage2PosOffset}
                        onChange={(e) => setStage2PosOffset(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                      <span
                        className={`font-mono text-[11px] font-bold w-12 text-right ${
                          Math.abs(stage2PosOffset) <= 0.22 ? "text-emerald-600" : "text-slate-700"
                        }`}
                      >
                        {Math.abs(stage2PosOffset) <= 0.22
                          ? "α-C"
                          : stage2PosOffset < -0.5
                          ? "β-C"
                          : "C=O"}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* STAGE 3 CONTROLS (FISCHER ESTERIFICATION) */}
              {stage === 3 && (
                <>
                  {!stage3Coupled ? (
                    <>
                      <button
                        type="button"
                        disabled={stage3CatalystAdded || stage3CouplingAnimating}
                        onClick={addStage3Catalyst}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition active:scale-95 cursor-pointer ${
                          stage3CatalystAdded
                            ? "bg-amber-100 text-amber-800 border border-amber-300 cursor-default"
                            : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        }`}
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>{stage3CatalystAdded ? "H⁺ ACTIVE ✓" : "ADD H⁺"}</span>
                      </button>

                      <div className="flex items-center gap-2 min-w-[200px] sm:min-w-[230px]">
                        <RotateCw
                          className={`w-4 h-4 shrink-0 ${
                            Math.abs(stage3RotationDeg) <= 15 ? "text-emerald-600" : "text-sky-600"
                          }`}
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
                          Rotate
                        </span>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={5}
                          disabled={stage3CouplingAnimating}
                          value={stage3RotationDeg}
                          onChange={(e) => setStage3Rotation(parseInt(e.target.value, 10))}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                        />
                        <span
                          className={`font-mono text-xs font-bold w-11 text-right ${
                            Math.abs(stage3RotationDeg) <= 15 ? "text-emerald-600" : "text-slate-700"
                          }`}
                        >
                          {stage3CouplingAnimating ? "..." : `${stage3RotationDeg}°`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-[230px] sm:min-w-[260px] animate-in fade-in duration-200">
                      <Flame
                        className={`w-4 h-4 shrink-0 ${
                          stage3Temp >= 80 ? "text-orange-500" : "text-slate-500"
                        }`}
                      />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
                        Heat (Δ)
                      </span>
                      <input
                        type="range"
                        min={25}
                        max={110}
                        step={5}
                        disabled={stage3Esterified || stage3Esterifying}
                        value={stage3Temp}
                        onChange={(e) => setStage3Temp(parseInt(e.target.value, 10))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span
                        className={`font-mono text-xs font-bold w-12 text-right ${
                          stage3Temp >= 80 ? "text-orange-600" : "text-slate-700"
                        }`}
                      >
                        {stage3Temp}°C
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── EXPLANATION MODAL ── */}
          {showExplanationModal && (
            <div className="pointer-events-auto absolute inset-0 z-[110] bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {CARBOXYLIC_EXPLANATIONS[stage].title}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase font-mono">
                      {CARBOXYLIC_EXPLANATIONS[stage].subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    Physical &amp; Chemical Mechanism
                  </h3>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">
                    {CARBOXYLIC_EXPLANATIONS[stage].concept}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Key Equations &amp; Reactions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {CARBOXYLIC_EXPLANATIONS[stage].formulas.map((f, fIdx) => (
                      <div key={`formula-${fIdx}`} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="font-mono font-bold text-sky-800 text-xs mb-1">
                          {f.label}
                        </div>
                        <div className="font-mono font-black text-slate-900 text-sm sm:text-base mb-1">
                          {f.formula}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Step-by-Step Guide
                  </h3>
                  <div className="space-y-2">
                    {CARBOXYLIC_EXPLANATIONS[stage].steps.map((st) => (
                      <div key={`step-${st.step}`} className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-sky-500">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1">
                          Step {st.step}: {st.title}
                        </div>
                        {st.math && (
                          <div className="font-mono text-xs font-black text-sky-700 mb-1">
                            {st.math}
                          </div>
                        )}
                        <p className="text-[11px] sm:text-xs text-slate-600">
                          {st.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-medium leading-relaxed">
                  {CARBOXYLIC_EXPLANATIONS[stage].conclusion}
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS COMPLETION MODAL ── */}
          {showSuccessModal && (
            <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-emerald-300">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  STAGE {stage} COMPLETE
                </span>

                <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
                  Target Achieved!
                </h3>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                  {feedbackMessage}
                </p>

                <div className="flex gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      resetCurrentStage();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Theory</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStage}
                    className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {stage < 3 ? "Next →" : "Restart"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── WRONG / FAILURE MODAL ── */}
          {showWrongModal && (
            <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-rose-300">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <XCircle className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                  STAGE {stage} • INCORRECT ACTION
                </span>

                <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
                  Not Quite!
                </h3>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                  {feedbackMessage}
                </p>

                <div className="flex gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWrongModal(false);
                      resetCurrentStage();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowWrongModal(false);
                      setShowExplanationModal(true);
                    }}
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
      )}
    </div>
  );
}
