"use client";

import React, { useState, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import CrushingFurnace3D from "./CrushingFurnace3D";
import {
  ArrowLeft,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  Flame,
  Wind,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Factory
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

interface CrushingRoastingCalcinationGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export type OreCategory = "sulphide" | "carbonate";
export type ThermalProcess = "roasting" | "calcination";

interface MetallurgyOreSample {
  id: string;
  name: string;
  formula: string;
  oreCategory: OreCategory;
  rawColor: string;
  oxideColor: string;
  correctProcess: ThermalProcess;
  chemicalEquation: string;
  gasEvolved: string;
  oxideProduct: string;
  description: string;
  whyThisProcess: string;
}

const ORE_CHALLENGES: MetallurgyOreSample[] = [
  {
    id: "zinc_blende",
    name: "Zinc Blende",
    formula: "ZnS",
    oreCategory: "sulphide",
    rawColor: "#E2E8F0", // Bright silver-white mineral rock - high visibility against dark funnel!
    oxideColor: "#F1F5F9", // Zinc Oxide (pure chalk white)
    correctProcess: "roasting",
    chemicalEquation: "2ZnS + 3O₂ (excess air) ⟶ 2ZnO + 2SO₂↑",
    gasEvolved: "Sulphur Dioxide (SO₂)",
    oxideProduct: "Zinc Oxide (ZnO)",
    description: "Zinc Blende is a sulphide ore. Sulphides cannot be reduced directly to metal by carbon, so they must first be converted into metal oxides.",
    whyThisProcess: "Sulphide ores require ROASTING (heating strongly in excess air/oxygen) so that sulphur is expelled as volatile SO₂ gas and replaced by oxygen to form ZnO."
  },
  {
    id: "calamine",
    name: "Calamine",
    formula: "ZnCO₃",
    oreCategory: "carbonate",
    rawColor: "#38BDF8", // Electric blue-tinted hemimorphite/smithsonite (vivid distinct contrast!)
    oxideColor: "#E2E8F0", // Zinc Oxide (powdery white)
    correctProcess: "calcination",
    chemicalEquation: "ZnCO₃ (absence of air) ⟶ ZnO + CO₂↑",
    gasEvolved: "Carbon Dioxide (CO₂)",
    oxideProduct: "Zinc Oxide (ZnO)",
    description: "Calamine is a carbonate ore containing chemically bound carbonate ions.",
    whyThisProcess: "Carbonate ores already contain oxygen within their lattice. They undergo CALCINATION (heating below melting point in limited or no air), decomposing thermally to drive off CO₂ gas and leave porous ZnO."
  },
  {
    id: "copper_pyrites",
    name: "Chalcocite / Copper Sulphide",
    formula: "Cu₂S",
    oreCategory: "sulphide",
    rawColor: "#10B981", // Rich emerald-malachite copper green (vivid & distinct!)
    oxideColor: "#DC2626", // Cuprous Oxide (Cu2O deep brick red)
    correctProcess: "roasting",
    chemicalEquation: "2Cu₂S + 3O₂ (excess air) ⟶ 2Cu₂O + 2SO₂↑",
    gasEvolved: "Sulphur Dioxide (SO₂)",
    oxideProduct: "Cuprous Oxide (Cu₂O)",
    description: "A major sulphide ore of copper mined extensively worldwide.",
    whyThisProcess: "Because it contains sulphur bonds, ROASTING in a continuous blast of hot air is essential to convert Cu₂S into Cu₂O while exhausting volatile SO₂."
  },
  {
    id: "siderite",
    name: "Siderite / Limonite",
    formula: "FeCO₃",
    oreCategory: "carbonate",
    rawColor: "#A855F7", // Distinct mineral amethyst/purple siderite (no yellow mixing!)
    oxideColor: "#991B1B", // Iron Oxide (Fe2O3 dark reddish-brown)
    correctProcess: "calcination",
    chemicalEquation: "FeCO₃ (absence of air) ⟶ FeO + CO₂↑",
    gasEvolved: "Carbon Dioxide (CO₂)",
    oxideProduct: "Iron(II) Oxide (FeO)",
    description: "A natural iron carbonate ore commonly found alongside hydrated limonite.",
    whyThisProcess: "Heating in limited air during CALCINATION expels moisture and decomposes carbonate into CO₂ gas, rendering the iron ore porous for easy blast furnace reduction."
  }
];

export default function CrushingRoastingCalcinationGamePage({
  difficulty = "easy",
  onExit,
}: CrushingRoastingCalcinationGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Current Level
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentOre = ORE_CHALLENGES[levelIndex];

  // Plant State: "idle" | "crushing" | "crushed" | "furnace_running" | "transformed"
  const [stage, setStage] = useState<"idle" | "crushing" | "crushed" | "furnace_running" | "transformed">("idle");
  const [selectedProcess, setSelectedProcess] = useState<ThermalProcess | null>(null);

  // Modals & Level completion state
  const [isLevelPassed, setIsLevelPassed] = useState<boolean>(false);
  const [showFinalCompletionModal, setShowFinalCompletionModal] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState<string>("");
  const [showPromptTooltip, setShowPromptTooltip] = useState<string | null>(null);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Reset Challenge
  const handleReset = () => {
    setStage("idle");
    setSelectedProcess(null);
    setIsLevelPassed(false);
  };

  // Trigger Crushing Action
  const handleCrushOre = () => {
    if (stage === "idle") {
      setStage("crushing");
      setTimeout(() => {
        setStage("crushed");
      }, 1600);
    }
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    // If ore not crushed yet
    if (stage === "idle" || stage === "crushing") {
      setShowPromptTooltip("Please perform Step 1: Click '1. CRUSH ORE' first!");
      setTimeout(() => setShowPromptTooltip(null), 3000);
      return;
    }

    // If step 2 (Roasting or Calcination) is not selected yet
    if (!selectedProcess) {
      setShowPromptTooltip("Choose Step 2: Select 'ROASTING' or 'CALCINATION' first!");
      setTimeout(() => setShowPromptTooltip(null), 3000);
      return;
    }

    setShowPromptTooltip(null);
    const isCorrect = selectedProcess === currentOre.correctProcess;

    setStage("furnace_running");

    setTimeout(() => {
      setStage("transformed");

      if (isCorrect) {
        setIsLevelPassed(true);
        // If it's the last level (level 4), show the final challenge completed modal!
        if (levelIndex >= ORE_CHALLENGES.length - 1) {
          setShowFinalCompletionModal(true);
        }
      } else {
        setIsLevelPassed(false);
        if (currentOre.oreCategory === "sulphide") {
          setFailFeedback(
            `${currentOre.name} (${currentOre.formula}) is a SULPHIDE ore. It requires ROASTING with excess oxygen to replace sulphur with oxygen. Calcination lacks sufficient air, leaving the sulphide unreacted!`
          );
        } else {
          setFailFeedback(
            `${currentOre.name} (${currentOre.formula}) is a CARBONATE ore. It requires CALCINATION (heating in limited or no air) to thermally decompose and release CO₂ gas. Roasting with excess air is wasteful and unnecessary!`
          );
        }
        setShowFailModal(true);
      }
    }, 1800);
  };

  const handleNextLevel = () => {
    if (levelIndex < ORE_CHALLENGES.length - 1) {
      setLevelIndex((prev) => prev + 1);
      setStage("idle");
      setSelectedProcess(null);
      setIsLevelPassed(false);
    } else {
      setShowFinalCompletionModal(true);
    }
  };

  const handleReplayChallenge = () => {
    setShowFinalCompletionModal(false);
    setLevelIndex(0);
    setStage("idle");
    setSelectedProcess(null);
    setIsLevelPassed(false);
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: MISSION SCREEN                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col items-center justify-between p-6 sm:p-8 text-center relative z-10 bg-white">
          {/* Top Bar: EXIT ONLY */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div className="w-16" />
          </div>

          {/* Mission Body */}
          <div className="max-w-2xl flex flex-col items-center gap-4 my-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-blue-600">MISSION:</span> Operate the metallurgy plant: crush raw mineral boulders and convert them into metal oxides using the correct thermal furnace treatment!
            </h1>

            <button
              onClick={() => setScreen("instructions")}
              className="mt-4 flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>


        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: INSTRUCTIONS SCREEN                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-5 sm:p-6 relative z-10 bg-white overflow-hidden">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-600" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                Instructions To Play
              </span>
              <div className="w-8 h-0.5 bg-blue-600" />
            </div>
            <div className="w-16" />
          </div>

          {/* 3 Step Cards - Compact Height & Clear Straightforward Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 my-auto max-w-5xl mx-auto w-full">
            {/* Card 1: The 3D Plant & Ore Crushing */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 1: Crush The Ore</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  JAW CRUSHER & BELT
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Click <strong>1. CRUSH ORE</strong> to grind the raw ore chunks into fine powder that feeds into the reverberatory furnace.
                </p>
              </div>

              {/* Image 1: 3D Plant Visualization */}
              <div className="w-full h-20 sm:h-22 rounded-xl overflow-hidden border border-slate-200 bg-slate-900/10 relative p-1 flex items-center justify-center mt-auto">
                <img
                  src="/images/instructions_metallurgy_plant.png"
                  alt="Crushing and Furnace Simulation Plant"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Card 2: Choose Roasting or Calcination - Action Step Without Hints */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 2: Choose Process</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  ROASTING OR CALCINATION
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Look at the current ore sample name and formula, then choose either <strong>ROASTING</strong> (excess air) or <strong>CALCINATION</strong> (limited air).
                </p>
              </div>

              {/* Image 2: Process Options Selector Buttons */}
              <div className="w-full h-20 sm:h-22 rounded-xl overflow-hidden border border-slate-200 bg-white relative p-1 flex items-center justify-center mt-auto">
                <img
                  src="/images/instructions_metallurgy_process.jpg"
                  alt="Process Selection Buttons"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Card 3: Check Answer & Learn */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 3: Check & Next</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  VERIFY YOUR ANSWER
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Click <strong>CHECK ANSWER</strong> to run the thermal conversion. When correct, click <strong>NEXT LEVEL</strong> to move to the next ore.
                </p>
              </div>

              {/* Image 3: Check Answer & Reset Controls */}
              <div className="w-full h-20 sm:h-22 rounded-xl overflow-hidden border border-slate-200 bg-white relative p-1 flex items-center justify-center mt-auto">
                <img
                  src="/images/instructions_metallurgy_controls.jpg"
                  alt="Check Answer and Reset Controls"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Back & Play buttons */}
          <div className="w-full flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setScreen("mission")}
              className="w-32 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center justify-center"
            >
              &lt; BACK
            </button>
            <button
              onClick={() => setScreen("lab")}
              className="w-32 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>PLAY</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: INTERACTIVE LAB (Single Canvas Div: Exit + Content + All) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full flex flex-col justify-between p-1.5 sm:p-2 relative z-10 bg-white overflow-hidden">

          {/* Header Bar: Top Single Row (Exit, Target Pill, Explanation Button) */}
          <div className="w-full flex items-center justify-between pb-0.5 shrink-0 z-20">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Target Level Pill */}
            <div className="px-3.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs flex items-center gap-2 shadow-xs">
              <span className="font-black text-blue-700">Level {levelIndex + 1}:</span>
              <span>{currentOre.name} ({currentOre.formula})</span>
              <span className="text-slate-400">•</span>
              <span className="uppercase text-[10px] tracking-wider font-extrabold text-blue-600">
                {currentOre.oreCategory === "sulphide" ? "Sulphide Ore" : "Carbonate Ore"}
              </span>
            </div>

            {/* Explanation Button */}
            <button
              onClick={() => setShowExplanation(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Main 3D Simulation Canvas Area - Expanded Height, Soft Neutral Slate Grey Background */}
          <div className="flex-1 w-full min-h-0 relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#94A3B8] via-[#64748B] to-[#475569] border border-slate-300 shadow-inner">
            <Canvas shadows gl={{ antialias: true, alpha: true }} className="w-full h-full">
              {/* Zoomed-in closer camera for crisp visibility on mobile & landscape (z: 4.8, fov: 36) */}
              <PerspectiveCamera makeDefault position={[0, 0.95, 4.8]} fov={36} />
              <OrbitControls
                enablePan={false}
                minDistance={3.2}
                maxDistance={7.5}
                maxPolarAngle={Math.PI / 2.08}
              />
              <Suspense fallback={null}>
                <CrushingFurnace3D
                  stage={stage}
                  oreType={currentOre.oreCategory}
                  rawOreColor={currentOre.rawColor}
                  oxideColor={currentOre.oxideColor}
                  selectedProcess={selectedProcess}
                  isCorrectProcess={selectedProcess === currentOre.correctProcess}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Bottom Single-Row Control Bar - Ultra Compact Height */}
          <div className="w-full flex items-center gap-2 shrink-0 z-20 pt-1 border-t border-slate-100">

            {/* Button 1: Crush Ore Action */}
            <button
              onClick={handleCrushOre}
              disabled={stage !== "idle"}
              className={`py-1.5 px-3 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${stage === "idle"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 active:scale-95 shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>1. CRUSH ORE</span>
            </button>

            {/* Section 2: Process Selectors (Roasting vs Calcination) */}
            <div className="flex-1 grid grid-cols-2 gap-2 h-full">
              {/* Roasting Option */}
              <button
                onClick={() => setSelectedProcess("roasting")}
                className={`py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${selectedProcess === "roasting"
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/25 scale-[1.01]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                <Wind className="w-3.5 h-3.5 text-amber-300" />
                <span>ROASTING (Excess Air)</span>
              </button>

              {/* Calcination Option */}
              <button
                onClick={() => setSelectedProcess("calcination")}
                className={`py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${selectedProcess === "calcination"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.01]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
              >
                <Flame className="w-3.5 h-3.5 text-cyan-300" />
                <span>CALCINATION (Limited Air)</span>
              </button>
            </div>

            {/* Button 3: Reset */}
            <button
              onClick={handleReset}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition cursor-pointer shadow-xs"
              title="Reset Ore & Furnace"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">RESET</span>
            </button>

            {/* Button 4: Check Answer OR Next Level (When Passed) */}
            <div className="relative shrink-0">
              {/* Dynamic tooltip when clicking without completing step 1 or step 2 */}
              {showPromptTooltip && (
                <div className="absolute -top-11 right-0 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-[10.5px] font-bold shadow-xl border border-slate-700 whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-amber-400">⚠️</span>
                  <span>{showPromptTooltip}</span>
                  <div className="absolute top-full right-8 border-4 border-transparent border-t-slate-900" />
                </div>
              )}

              {isLevelPassed ? (
                <button
                  onClick={handleNextLevel}
                  className="w-36 sm:w-44 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0 whitespace-nowrap animate-bounce"
                >
                  <span>{levelIndex < ORE_CHALLENGES.length - 1 ? "NEXT LEVEL" : "VIEW RESULTS"}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={handleCheckAnswer}
                  disabled={stage === "crushing" || stage === "furnace_running"}
                  className="w-36 sm:w-44 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">CHECK ANSWER</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: EXPLANATION SCREEN (Full-Screen View)                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Crushing, Roasting & Calcination
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                  Chemical Metallurgy • Ore Pre-Treatment Concepts
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowExplanation(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content - Narrative Theory & Real-Life Examples (No excess nested boxes) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
            {/* Section 1: Crushing & Grinding */}
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                1. Why Do We Crush Ores? (Comminution & Surface Area)
              </h3>
              <p className="mb-2">
                When ores are mined from the earth, they come out as giant, dense boulders measuring several feet across. If you toss a giant rock directly into a furnace, only the outer few millimetres react, leaving the interior unchanged because gases and heat cannot penetrate dense solid stone.
              </p>
              <p className="mb-2">
                By feeding rocks into a <strong>Jaw Crusher</strong> and grinding them in a <strong>Ball Mill</strong> into fine microscopic powder, we multiply the exposed surface area by millions of times. This allows furnace heat and oxygen gas to contact every single mineral particle at once.
              </p>
              <p className="text-slate-800 bg-slate-100/90 rounded-xl p-3 border-l-4 border-blue-600 leading-normal">
                🌍 <strong>Real-Life Everyday Analogy:</strong> Think of a solid block of hard sugar versus granulated powdered sugar in tea. A solid sugar rock dissolves very slowly, but powdered sugar dissolves instantly because every single crystal touches hot liquid simultaneously. Crushing ore works the exact same way for chemical furnace reactions!
              </p>
            </div>

            {/* Section 2: Roasting Explained */}
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                2. Roasting: Burning Sulphur in Excess Air
              </h3>
              <p className="mb-2">
                <strong>Roasting</strong> is the process of heating concentrated ore in a continuous, heavy blast of air (oxygen) below its melting point in a reverberatory furnace. It is used specifically for <strong>Sulphide Ores</strong> like Zinc Blende (ZnS) and Copper Glance (Cu₂S).
              </p>
              <p className="mb-2">
                Because sulphide minerals contain zero oxygen in their crystal lattice, they require external atmospheric oxygen to burn off the sulphur. The sulphur oxidizes into pungent Sulphur Dioxide gas (SO₂↑) that escapes through the chimney, leaving behind porous solid Metal Oxide (e.g., ZnO, Cu₂O) which can easily be reduced to pure metal using carbon or coke.
              </p>
              <div className="bg-amber-50/80 rounded-xl p-3 border-l-4 border-amber-500 text-slate-800 space-y-1 mb-2 font-mono text-xs">
                <div>• 2ZnS (Zinc Blende) + 3O₂ (Excess Air) ⟶ 2ZnO (Zinc Oxide) + 2SO₂↑</div>
                <div>• 2Cu₂S (Copper Glance) + 3O₂ (Excess Air) ⟶ 2Cu₂O (Cuprous Oxide) + 2SO₂↑</div>
              </div>
              <p className="text-slate-800 bg-slate-100/90 rounded-xl p-3 border-l-4 border-amber-500 leading-normal">
                🏭 <strong>Real-Life Industrial Application:</strong> In commercial smelting plants, the SO₂ gas escaping the chimney is never released into nature. It is captured by scrubber units and turned directly into concentrated Sulphuric Acid (H₂SO₄), one of the world’s most valuable industrial chemicals used in batteries, fertilizers, and refining!
              </p>
            </div>

            {/* Section 3: Calcination Explained */}
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-600" />
                3. Calcination: Thermal Baking Without Air
              </h3>
              <p className="mb-2">
                <strong>Calcination</strong> is the process of heating ore in a limited supply or complete absence of air below its melting point. It is used for <strong>Carbonate Ores</strong> (like Calamine ZnCO₃, Siderite FeCO₃, Limestone CaCO₃) and <strong>Hydrated Ores</strong> (like Bauxite Al₂O₃·2H₂O).
              </p>
              <p className="mb-2">
                These ores already have oxygen atoms locked directly inside their chemical formula! They do not need outside oxygen from the air. Instead, intense thermal baking causes thermal decomposition: trapped moisture (H₂O) evaporates and carbon dioxide (CO₂↑) is driven out, leaving a brittle, highly porous metal oxide.
              </p>
              <div className="bg-blue-50/80 rounded-xl p-3 border-l-4 border-cyan-600 text-slate-800 space-y-1 mb-2 font-mono text-xs">
                <div>• ZnCO₃ (Calamine) ⟶ ZnO (Zinc Oxide) + CO₂↑</div>
                <div>• FeCO₃ (Siderite) ⟶ FeO (Iron Oxide) + CO₂↑</div>
                <div>• CaCO₃ (Limestone) ⟶ CaO (Quicklime) + CO₂↑</div>
              </div>
              <p className="text-slate-800 bg-slate-100/90 rounded-xl p-3 border-l-4 border-cyan-600 leading-normal">
                🏛️ <strong>Real-Life Everyday Analogy:</strong> Making traditional building mortar and cement relies directly on calcination. Natural limestone rock (CaCO₃) is baked inside huge kilns without air to drive off CO₂, producing dry quicklime powder (CaO). When water is added back at a construction site, it reacts strongly to form rock-solid slaked lime cement!
              </p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-center p-3 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setShowExplanation(false)}
              className="px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: FINAL CHALLENGE COMPLETED MODAL (At Last Level)            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFinalCompletionModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 shadow-inner">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Challenge Completed!
            </h3>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Outstanding work! You have successfully mastered crushing comminution, roasting sulphide ores, and calcining carbonate ores into pure metal oxides.
            </p>

            <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] mb-4 text-slate-800 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>All 4 Ores Processed:</span>
                <span>100% SUCCESS</span>
              </div>
              <div className="text-[10.5px] text-slate-600">
                • ZnS & Cu₂S ⟶ Roasting (Excess Air)<br />
                • ZnCO₃ & FeCO₃ ⟶ Calcination (Limited Air)
              </div>
            </div>

            {/* 2 Buttons: REPLAY and EXPLANATION */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={handleReplayChallenge}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                onClick={() => {
                  setShowFinalCompletionModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: COMPACT INCORRECT MODAL (With Retry & Explanation)         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-rose-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Incorrect!
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {failFeedback}
            </p>

            {/* 2 Buttons: RETRY and EXPLANATION */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={() => setShowFailModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-500/25 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

