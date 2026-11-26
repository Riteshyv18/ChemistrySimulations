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
  Flame,
  Zap,
  Sparkles,
  X,
  Target,
  FlaskConical,
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
  const carbonDelta = acidCatalystActive && stage.catalyzedCarbonDeltaPlus
    ? stage.catalyzedCarbonDeltaPlus
    : stage.carbonDeltaPlus;

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
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
              MODULE 11 • TOPIC 45
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Master Bürgi–Dunitz Trajectory &amp; Carbonyl Reactivity
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Align incoming nucleophiles along the non-orthogonal Bürgi–Dunitz trajectory (θ ≈ 107.0°) to overlap with the carbon π* LUMO orbital, overcome steric and inductive barriers in aldehydes vs ketones, and observe umbrella rehybridization from planar sp² to tetrahedral sp³.
            </p>

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

          {/* Bottom Footer Note */}
          <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0 pb-1">
            Click NEXT to view challenge instructions
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
            </div>

            {/* 3 Step Cards Side-by-Side in Landscape Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2.5 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
              {/* Card 1: Bürgi-Dunitz Angle */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Align Bürgi-Dunitz Angle
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Optimal θ = 107.0°
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Adjust the attack angle slider to θ ≈ 107.0° to maximize constructive overlap with the π* LUMO lobe and avoid oxygen lone-pair repulsion.
                  </p>
                </div>

                {/* Visual Diagram Box 1 */}
                <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-1.5 mt-2 text-white">
                  <div className="text-[10px] font-mono text-cyan-300 font-bold">
                    θ = 107.0° ± 2.0°
                  </div>
                  <div className="text-[8.5px] text-emerald-400 font-mono mt-0.5">
                    Maximum π* LUMO Overlap
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">
                    90°: Repelled • &gt;120°: Missed
                  </div>
                </div>
              </div>

              {/* Card 2: Kinetic Energy & Hindrance */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Tune Kinetic Energy (Ek)
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Steric &amp; +I Barriers
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Set collision energy (Ek ≥ Ea). Methyl groups in acetone create steric shielding and +I charge dampening, requiring higher energy or acid catalysis.
                  </p>
                </div>

                {/* Visual Diagram Box 2 */}
                <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-1.5 mt-2 text-white">
                  <div className="text-[9.5px] font-mono text-amber-300 font-bold">
                    HCHO: 40 kJ/mol (Fast)
                  </div>
                  <div className="text-[9.5px] font-mono text-rose-300 font-bold mt-0.5">
                    Acetone: 78 kJ/mol (Hindered)
                  </div>
                  <div className="text-[8px] text-emerald-300 font-mono mt-0.5">
                    + H⁺ Catalyst: Drops to 28 kJ/mol
                  </div>
                </div>
              </div>

              {/* Card 3: Collide & Rehybridize */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Collide &amp; Rehybridize
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      sp² ⟶ sp³ Inversion
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Click FIRE NUCLEOPHILE (:CN⁻). Watch the planar 120° sp² carbonyl umbrella-invert in slow motion into a tetrahedral 109.5° sp³ cyanohydrin!
                  </p>
                </div>

                {/* Visual Diagram Box 3 */}
                <div className="w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-1.5 mt-2 text-white">
                  <div className="text-[9.5px] font-mono text-emerald-400 font-bold">
                    sp² (120°) ⟶ sp³ (109.5°)
                  </div>
                  <div className="text-[8px] text-sky-300 font-mono mt-0.5">
                    Smooth Umbrella Pyramidalization
                  </div>
                  <div className="text-[8px] text-amber-300 font-bold mt-0.5">
                    Forms Tetrahedral Cyanohydrin
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back and Play */}
            <div className="pt-2 pb-0.5 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setScreen("mission")}
                className="px-5 sm:px-6 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
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
        <div className="w-full h-full relative z-10 overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]">
          {/* Main 3D Simulation Canvas Area */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Canvas shadows gl={{ antialias: true, alpha: true }} className="w-full h-full">
              <NucleophilicAddition3D />
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

            {/* Central Target & Parameter HUD */}
            <div className="max-w-[calc(100vw-360px)] lg:max-w-none text-[10px] sm:text-[11px] px-2.5 sm:px-3.5 py-1 rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-md border border-slate-300 shadow-xs font-mono select-none pointer-events-none flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 sm:gap-x-2">
              <span className="font-bold text-slate-800">Stage {currentStage}/3</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                Substrate: <span className="font-bold text-slate-800">{stage.substrateName}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                Target: <span className="font-bold text-sky-600">θ ≈ 107.0°</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                Ea: <span className="font-bold text-slate-800">{effectiveEa.toFixed(1)} kJ/mol</span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                C(δ⁺): <span className="font-bold text-sky-700">+{carbonDelta.toFixed(2)}</span>
              </span>
              {currentStage === 3 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className={`font-bold ${acidCatalystActive ? "text-emerald-600" : "text-amber-600"}`}>
                    {acidCatalystActive ? "H⁺ Acid ON (-50 kJ)" : "Acid OFF"}
                  </span>
                </>
              )}
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

          {/* Floating Bottom Control Dock */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto w-full max-w-2xl py-2 px-3 sm:py-2.5 sm:px-4 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-300 shadow-[0_4px_25px_rgba(0,0,0,0.1)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
              {/* Angle Control Column */}
              <div className="flex flex-col min-w-[170px] flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-700">
                    ATTACK ANGLE (θ)
                  </span>

                  {isEditingAngle ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.5"
                        autoFocus
                        disabled={isSimulating}
                        value={typedAngle}
                        onChange={(e) => setTypedAngle(e.target.value)}
                        onBlur={commitTypedAngle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitTypedAngle();
                          if (e.key === "Escape") setIsEditingAngle(false);
                        }}
                        className="w-16 px-1 py-0.5 text-right font-mono text-xs font-bold bg-white text-slate-900 border border-sky-500 rounded shadow-inner outline-none"
                      />
                      <span className="text-slate-500 text-xs font-mono">°</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSimulating}
                      onClick={() => {
                        setTypedAngle(attackAngle.toFixed(1));
                        setIsEditingAngle(true);
                      }}
                      className="group flex items-center gap-1 px-1.5 py-0.2 rounded hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-300 cursor-pointer"
                      title="Click to type exact angle"
                    >
                      <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-sky-700">
                        {attackAngle.toFixed(1)}°
                      </span>
                      <span className="text-[9px] text-slate-400 group-hover:text-sky-600 font-mono">✎</span>
                    </button>
                  )}
                </div>

                {/* Angle Slider + Steppers */}
                <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                  <button
                    type="button"
                    disabled={isSimulating || attackAngle <= stage.minAngle}
                    onClick={() => setAttackAngle(attackAngle - 1.0)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <input
                    type="range"
                    min={stage.minAngle}
                    max={stage.maxAngle}
                    step={0.5}
                    value={attackAngle}
                    disabled={isSimulating}
                    onChange={(e) => setAttackAngle(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:opacity-50 min-w-0"
                  />

                  <button
                    type="button"
                    disabled={isSimulating || attackAngle >= stage.maxAngle}
                    onClick={() => setAttackAngle(attackAngle + 1.0)}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Energy Control Column */}
              <div className="flex flex-col min-w-[150px] flex-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider text-slate-700">
                    ENERGY (Ek)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {kineticEnergy.toFixed(0)} kJ/mol
                  </span>
                </div>
                <input
                  type="range"
                  min={stage.minEnergy}
                  max={stage.maxEnergy}
                  step={5.0}
                  value={kineticEnergy}
                  disabled={isSimulating}
                  onChange={(e) => setKineticEnergy(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                />
              </div>

              {/* Stage 3 Special: Acid Catalyst Switch */}
              {currentStage === 3 && (
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={toggleAcidCatalyst}
                  className={`shrink-0 px-3 py-1.5 rounded-full font-mono text-[11px] font-bold border transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    acidCatalystActive
                      ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/30"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${acidCatalystActive ? "fill-current" : ""}`} />
                  <span>{acidCatalystActive ? "H⁺ ACID ON" : "H⁺ ACID OFF"}</span>
                </button>
              )}

              {/* Action Trigger Button */}
              <button
                type="button"
                disabled={isSimulating}
                onClick={fireNucleophile}
                className={`shrink-0 flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 shadow-md ${
                  isSimulating
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white active:scale-95 shadow-sky-600/30 cursor-pointer"
                }`}
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? "animate-pulse" : ""}`} />
                <span>{isSimulating ? "ATTACKING..." : "COLLIDE & ATTACK"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: EXPLANATION MODAL (KaTeX & Chemical Theory)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 rounded-3xl sm:rounded-[32px]">
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
          MODAL 2: VICTORY / STAGE CLEARED MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showResultModal && isWon && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Stage {currentStage} Cleared!
            </h3>

            <p className="text-xs text-slate-600 mb-3 leading-snug">
              Bürgi-Dunitz overlap achieved! The nucleophile pierced the π* LUMO and converted{" "}
              <strong>{stage.substrateName}</strong> into <strong>{stage.productName}</strong>.
            </p>

            {/* Stats Summary */}
            <div className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] mb-4 space-y-1">
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

            {/* Buttons: Replay & Next */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={resetSimulation}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              {currentStage < 3 ? (
                <button
                  type="button"
                  onClick={nextStage}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
                >
                  <span>STAGE {currentStage + 1}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resetSimulation}
                  className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-sky-600/25 cursor-pointer active:scale-95"
                >
                  <span>REPLAY ALL</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: FAILURE / INCORRECT COLLISION MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showResultModal && isGameOver && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-5 shadow-2xl border border-red-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2 shadow-inner">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Collision Failed!
            </h3>

            <p className="text-xs text-slate-600 mb-3 leading-snug">
              {failureReason}
            </p>

            <button
              type="button"
              onClick={resetSimulation}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
