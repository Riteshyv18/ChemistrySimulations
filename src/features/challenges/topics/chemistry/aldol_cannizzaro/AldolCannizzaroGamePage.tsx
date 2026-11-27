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
  Zap,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import {
  useAldolCannizzaroStore,
  ALDOL_EXPLANATIONS,
} from "./AldolCannizzaroStore";
import AldolCannizzaro3D from "./AldolCannizzaro3D";

export interface AldolCannizzaroGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function AldolCannizzaroGamePage({
  difficulty = "level1",
  onExit,
}: AldolCannizzaroGamePageProps) {
  const {
    stage,
    introStep,
    gameStarted,
    showExplanationModal,
    showSuccessModal,
    showWrongModal,
    feedbackMessage,
    stage1Molecule,
    stage1Animating,
    stage1SlideState,
    stage2RotationDeg,
    stage2Coupled,
    stage2CouplingAnimating,
    stage2Temp,
    stage2Dehydrated,
    stage2Dehydrating,
    stage3BaseAdded,
    stage3HydrateAnimating,
    stage3HydrideShifted,
    stage3HydrideAnimating,
    setStage,
    setIntroStep,
    setGameStarted,
    setShowExplanationModal,
    setShowSuccessModal,
    setShowWrongModal,
    resetCurrentStage,
    chooseStage1Pathway,
    setStage2Rotation,
    setStage2Temp,
    triggerStage3Base,
    triggerStage3Hydride,
  } = useAldolCannizzaroStore();

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
      ? stage1Molecule === "acetaldehyde"
        ? "Acetaldehyde (1/2) • Choose Pathway"
        : "Benzaldehyde (2/2) • Choose Pathway"
      : stage === 2
      ? stage2Coupled
        ? "Heat ≥ 80°C to Dehydrate (Δ)"
        : "Rotate Enolate & Click Approach"
      : "Add Conc. OH⁻ & Transfer :H⁻";

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
                MODULE 11 • CARBONYL COMPOUNDS
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Complete the Aldol and Cannizzaro Reactions
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
                        Choose the Pathway
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Look at the molecule and pick Aldol Pathway or Cannizzaro Pathway.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/aldol_step1_check.svg"
                      alt="Choose pathway"
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
                        Rotate, Join &amp; Heat
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Use the Rotate slider to align, click APPROACH ✓ to join, then raise Heat to ≥ 80°C.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/aldol_step2_react.svg"
                      alt="Rotate, join and heat"
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
                        Add Base &amp; Shift Hydride
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      In Stage 3, add OH⁻ base and click Transfer Hydride (:H⁻) to finish the reaction.
                    </p>
                  </div>
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/aldol_step3_heat.svg"
                      alt="Add base and shift hydride"
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
          {/* 3D Canvas with smooth slide transition for Stage 1 sequential molecules */}
          <div
            className={`absolute inset-0 z-0 ${
              stage === 1 && stage1SlideState === "sliding-out"
                ? "transition-all duration-300 ease-in transform -translate-x-full opacity-0"
                : stage === 1 && stage1SlideState === "sliding-in"
                ? "transition-none transform translate-x-full opacity-0"
                : "transition-all duration-300 ease-out transform translate-x-0 opacity-100"
            }`}
          >
            <AldolCannizzaro3D isModalOpen={isModalOpen} />
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
              {stage === 1 && (
                <>
                  {/* Pathway Choice Buttons */}
                  <button
                    type="button"
                    disabled={stage1Animating || stage1SlideState !== "idle"}
                    onClick={() => chooseStage1Pathway("aldol")}
                    className="px-5 py-2 rounded-full font-mono text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Aldol Pathway
                  </button>
                  <button
                    type="button"
                    disabled={stage1Animating || stage1SlideState !== "idle"}
                    onClick={() => chooseStage1Pathway("cannizzaro")}
                    className="px-5 py-2 rounded-full font-mono text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Cannizzaro Pathway
                  </button>
                </>
              )}

              {stage === 2 && (
                <>
                  {!stage2Coupled ? (
                    /* Step 1: Show Rotate Slider Only */
                    <div className="flex items-center gap-2.5 min-w-[230px] sm:min-w-[260px]">
                      <RotateCw className={`w-4 h-4 shrink-0 ${Math.abs(stage2RotationDeg) <= 15 ? "text-emerald-600" : "text-sky-600"}`} />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
                        Rotate
                      </span>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={5}
                        disabled={stage2CouplingAnimating}
                        value={stage2RotationDeg}
                        onChange={(e) => setStage2Rotation(parseInt(e.target.value, 10))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:opacity-60"
                      />
                      <span className={`font-mono text-xs font-bold w-14 text-right ${Math.abs(stage2RotationDeg) <= 15 ? "text-emerald-600" : "text-slate-700"}`}>
                        {stage2CouplingAnimating ? "Joining..." : `${stage2RotationDeg}°`}
                      </span>
                    </div>
                  ) : (
                    /* Step 2: Replaced by Heat Slider once Connected */
                    <div className="flex items-center gap-2.5 min-w-[230px] sm:min-w-[260px] animate-in fade-in duration-200">
                      <Flame className={`w-4 h-4 shrink-0 ${stage2Temp >= 80 ? "text-orange-500" : "text-slate-500"}`} />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase">
                        Heat (Δ)
                      </span>
                      <input
                        type="range"
                        min={25}
                        max={100}
                        step={5}
                        disabled={stage2Dehydrated || stage2Dehydrating}
                        value={stage2Temp}
                        onChange={(e) => setStage2Temp(parseInt(e.target.value, 10))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className={`font-mono text-xs font-bold w-12 text-right ${stage2Temp >= 80 ? "text-orange-600" : "text-slate-700"}`}>
                        {stage2Temp}°C
                      </span>
                    </div>
                  )}
                </>
              )}

              {stage === 3 && (
                <>
                  <button
                    type="button"
                    disabled={stage3BaseAdded || stage3HydrateAnimating}
                    onClick={triggerStage3Base}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs font-bold transition active:scale-95 cursor-pointer ${
                      stage3BaseAdded
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-default"
                        : "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm"
                    }`}
                  >
                    <span>{stage3BaseAdded ? "OH⁻ ADDED ✓" : stage3HydrateAnimating ? "ADDING..." : "1. ADD CONC. OH⁻"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={stage3HydrideShifted || stage3HydrideAnimating}
                    onClick={triggerStage3Hydride}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs font-bold transition active:scale-95 cursor-pointer ${
                      stage3HydrideShifted
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                      {stage3HydrideShifted
                        ? "HYDRIDE SHIFTED ✓"
                        : stage3HydrideAnimating
                        ? "TRANSFERRING..."
                        : "2. TRANSFER HYDRIDE (:H⁻)"}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── EXPLANATION MODAL (Standard Chemistry Template, No GOT IT Footer) ── */}
          {showExplanationModal && (
            <div className="pointer-events-auto absolute inset-0 z-[110] bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {ALDOL_EXPLANATIONS[stage].title}
                    </h2>
                    <p className="text-xs text-slate-500 font-bold tracking-wider uppercase font-mono">
                      {ALDOL_EXPLANATIONS[stage].subtitle}
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
                    {ALDOL_EXPLANATIONS[stage].concept}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Key Equations &amp; Reactions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {ALDOL_EXPLANATIONS[stage].formulas.map((f, fIdx) => (
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
                    {ALDOL_EXPLANATIONS[stage].steps.map((st) => (
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
                  {ALDOL_EXPLANATIONS[stage].conclusion}
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
                  Incorrect Pathway!
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
