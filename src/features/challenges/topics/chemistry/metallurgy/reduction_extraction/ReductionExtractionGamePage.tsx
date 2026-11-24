"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import ReductionFurnace3D, { type ExtractionMethod } from "./ReductionFurnace3D";
import {
  ArrowLeft,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  ChevronDown,
  Flame,
  Zap,
  RefreshCw,
  Sparkles,
  Award,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

interface ReductionExtractionGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

interface ReductionChallenge {
  id: string;
  level: number;
  oxideName: string;
  oxideFormula: string;
  metalName: string;
  metalSymbol: string;
  reactivityTier: "high" | "moderate" | "low";
  reactivityDesc: string;
  correctMethod: ExtractionMethod;
  oxideColor: string;
  metalColor: string;
  reactionEquation: string;
  byproduct: string;
  explanation: string;
  whyThisMethod: string;
}

const REDUCTION_CHALLENGES: ReductionChallenge[] = [
  {
    id: "zn_oxide",
    level: 1,
    oxideName: "Zinc Oxide",
    oxideFormula: "ZnO",
    metalName: "Zinc",
    metalSymbol: "Zn",
    reactivityTier: "moderate",
    reactivityDesc: "Moderate Reactivity (Below Al, above H)",
    correctMethod: "carbon",
    oxideColor: "#F8FAFC", // White zinc oxide powder (philosopher's wool)
    metalColor: "#E2E8F0", // Bright shiny silvery-white zinc
    reactionEquation: "ZnO + C ⟶ Zn + CO↑ (at ~1200°C)",
    byproduct: "Carbon Monoxide (CO↑) Gas",
    explanation:
      "Zinc is a moderately reactive metal in the middle of the reactivity series. Carbon has a stronger thermodynamic affinity for oxygen than zinc at high temperatures, allowing Coke (C) to readily strip oxygen from ZnO in a retorting furnace.",
    whyThisMethod:
      "Carbon Reduction is cost-effective and thermodynamically favorable for moderate metals like Zn, Fe, and Pb.",
  },
  {
    id: "alumina",
    level: 2,
    oxideName: "Alumina",
    oxideFormula: "Al₂O₃",
    metalName: "Aluminium",
    metalSymbol: "Al",
    reactivityTier: "high",
    reactivityDesc: "High Reactivity (Near top of reactivity series)",
    correctMethod: "electrolytic",
    oxideColor: "#E2E8F0", // Pure white calcined alumina
    metalColor: "#F1F5F9", // Bright shiny silver aluminium
    reactionEquation: "2Al₂O₃ ⟶ 4Al (at cathode) + 3O₂↑ (at carbon anode)",
    byproduct: "Oxygen gas (O₂↑) & CO₂ at anodes",
    explanation:
      "Aluminium is strongly electropositive with an enormous chemical affinity for oxygen. Carbon is not a strong enough reducing agent to displace aluminium from Al₂O₃. Therefore, it MUST be extracted by Electrolytic Reduction (Hall–Héroult Process) in a molten cryolite bath.",
    whyThisMethod:
      "Electrolytic Reduction is mandatory for highly reactive metals (K, Na, Ca, Mg, Al) because their oxides cannot be reduced by carbon at any practical temperature.",
  },
  {
    id: "iron_oxide",
    level: 3,
    oxideName: "Hematite",
    oxideFormula: "Fe₂O₃",
    metalName: "Iron",
    metalSymbol: "Fe",
    reactivityTier: "moderate",
    reactivityDesc: "Moderate Reactivity (Middle of activity series)",
    correctMethod: "carbon",
    oxideColor: "#7F1D1D", // Deep reddish-brown rust hematite
    metalColor: "#CBD5E1", // Bright clean refined iron metal
    reactionEquation: "Fe₂O₃ + 3CO ⟶ 2Fe + 3CO₂↑ (Blast Furnace)",
    byproduct: "Carbon Dioxide (CO₂↑) & Molten Slag (CaSiO₃)",
    explanation:
      "In industrial Blast Furnaces, coke burns to produce Carbon Monoxide (CO). CO acts as the primary gaseous reducing agent, penetrating the porous iron ore lumps and reducing iron oxide step-by-step into molten liquid pig iron.",
    whyThisMethod:
      "Carbon / CO reduction in a blast furnace is the foundational process of world steelmaking for moderate-reactivity iron.",
  },
  {
    id: "copper_glance",
    level: 4,
    oxideName: "Cuprous Oxide + Sulphide",
    oxideFormula: "2Cu₂O + Cu₂S",
    metalName: "Copper",
    metalSymbol: "Cu",
    reactivityTier: "low",
    reactivityDesc: "Low Reactivity (Near bottom of series)",
    correctMethod: "self",
    oxideColor: "#991B1B", // Ruby reddish cuprous oxide mixed with dark copper glance
    metalColor: "#F59E0B", // Bright lustrous golden-orange copper
    reactionEquation: "2Cu₂O + Cu₂S ⟶ 6Cu + SO₂↑ (Bessemer Converter)",
    byproduct: "Sulphur Dioxide (SO₂↑) creating blister copper",
    explanation:
      "Copper is a low-reactivity metal. In a Bessemer converter, part of the copper sulphide ore is partially roasted to Cu₂O. When heating continues, the Cu₂O reacts directly with the unroasted Cu₂S to reduce each other into metallic copper without needing any external reducing agent! This is known as Self-Reduction or Auto-Reduction.",
    whyThisMethod:
      "Self-Reduction avoids the cost of external reducing agents for low-reactivity sulphide-derived metals like Cu, Pb, and Hg.",
  },
];

export default function ReductionExtractionGamePage({
  difficulty = "standard",
  onExit,
}: ReductionExtractionGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Gameplay state
  const [levelIndex, setLevelIndex] = useState(0);
  const currentChallenge = REDUCTION_CHALLENGES[levelIndex];

  // Scramble the order of extraction method options per level so they are not in fixed predictable order
  const shuffledMethods = useMemo((): ExtractionMethod[] => {
    const permutations: ExtractionMethod[][] = [
      ["carbon", "electrolytic", "self"], // Level 1 (Answer: carbon at 1st pos)
      ["self", "electrolytic", "carbon"], // Level 2 (Answer: electrolytic at 2nd pos)
      ["electrolytic", "carbon", "self"], // Level 3 (Answer: carbon at 2nd pos)
      ["carbon", "self", "electrolytic"], // Level 4 (Answer: self at 2nd pos)
    ];
    return permutations[levelIndex % permutations.length];
  }, [levelIndex]);

  const [selectedMethod, setSelectedMethod] = useState<ExtractionMethod | null>(null);
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [stage, setStage] = useState<"idle" | "extracting" | "extracted">("idle");
  const [isLevelPassed, setIsLevelPassed] = useState(false);
  const [showPromptTooltip, setShowPromptTooltip] = useState<string | null>(null);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFinalCompletionModal, setShowFinalCompletionModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState("");

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Step 1: Start extraction action - triggers animation and immediately shows outcome modal
  // Step 1: Start extraction action - runs reaction, reveals extracted metal, then after 3s displays outcome popup
  const handleStartExtraction = () => {
    if (!selectedMethod) {
      setShowPromptTooltip("Choose an Extraction Method First!");
      setTimeout(() => setShowPromptTooltip(null), 3200);
      return;
    }
    setIsMethodDropdownOpen(false);
    setStage("extracting");

    // Phase 1: Reaction completes after 1.2s -> reveals pure extracted metal ingot bars in 3D table
    setTimeout(() => {
      setStage("extracted");

      // Phase 2: User gets 3 full seconds to view the pure extracted metal in the 3D plant before popup appears
      setTimeout(() => {
        if (selectedMethod === currentChallenge.correctMethod) {
          setIsLevelPassed(true);
          if (levelIndex < REDUCTION_CHALLENGES.length - 1) {
            setShowSuccessModal(true);
          } else {
            setShowFinalCompletionModal(true);
          }
        } else {
          let feedback = "";
          if (currentChallenge.correctMethod === "electrolytic") {
            feedback = `${currentChallenge.metalName} is a HIGHLY reactive metal. Its oxide cannot be reduced by carbon or self-reduction because it holds oxygen too tightly! It requires Electrolytic Reduction (Electrometallurgy).`;
          } else if (currentChallenge.correctMethod === "carbon") {
            feedback = `${currentChallenge.metalName} is a MODERATELY reactive metal. It is economically and chemically reduced using Coke (Carbon) or CO at high temperatures in a furnace.`;
          } else {
            feedback = `${currentChallenge.metalName} is a LOW reactivity metal. It undergoes Self-Reduction where the oxide and sulphide react together directly without needing external carbon or electricity!`;
          }
          setFailFeedback(feedback);
          setShowFailModal(true);
        }
      }, 3000);
    }, 1200);
  };

  // Advance to next level or show final modal
  const handleNextLevel = () => {
    setShowSuccessModal(false);
    if (levelIndex < REDUCTION_CHALLENGES.length - 1) {
      setLevelIndex((prev) => prev + 1);
      setSelectedMethod(null);
      setStage("idle");
      setIsLevelPassed(false);
    } else {
      setShowFinalCompletionModal(true);
    }
  };

  // Replay current level from success modal
  const handleReplayCurrentLevel = () => {
    setShowSuccessModal(false);
    setSelectedMethod(null);
    setStage("idle");
    setIsLevelPassed(false);
  };

  // Reset current challenge
  const handleReset = () => {
    setSelectedMethod(null);
    setIsMethodDropdownOpen(false);
    setStage("idle");
    setIsLevelPassed(false);
    setShowPromptTooltip(null);
  };

  const handleReplayChallenge = () => {
    setShowFinalCompletionModal(false);
    setLevelIndex(0);
    setSelectedMethod(null);
    setStage("idle");
    setIsLevelPassed(false);
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: MISSION BRIEFING SCREEN                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-6 sm:p-8 relative z-10 bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
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
          <div className="max-w-2xl flex flex-col items-center gap-4 my-auto mx-auto text-center">
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
        <div className="w-full h-full flex flex-col justify-between p-5 sm:p-6 relative z-10 bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
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

          {/* 3 Step Cards - Compact Height & Clear Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 my-auto max-w-5xl mx-auto w-full">
            {/* Card 1: Inspect Target Metal Oxide */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 1: Check Target</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Look at the top pill to see the metal oxide name and chemical formula to be extracted.
                </p>
              </div>

              {/* Visual 1: Level Target Pill Image */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center mt-auto p-2">
                <img
                  src="/instructions_reduction_step1_new.png"
                  alt="Target Metal Oxide Pill"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Card 2: Choose Method */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 2: Choose Method</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Click the dropdown and select the correct extraction method for the metal.
                </p>
              </div>

              {/* Visual 2: Method Dropdown Options Image */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center mt-auto p-2">
                <img
                  src="/instructions_reduction_step2_new.png"
                  alt="Choose Extraction Method Dropdown"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>

            {/* Card 3: Start Extraction */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 3: Start Extraction</h3>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Click <strong>START EXTRACTION</strong> to run the plant, see pure metal cast, and check your answer!
                </p>
              </div>

              {/* Visual 3: Start Extraction Button Image */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center mt-auto p-2">
                <img
                  src="/instructions_reduction_step3_new.png"
                  alt="Start Extraction Button"
                  className="max-h-full max-w-full object-contain"
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
              className="w-32 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-blue-500/20"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: INTERACTIVE LAB GAMEPLAY (Single Fullscreen 3D Canvas)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative z-10 overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]">
          {/* Main 3D Simulation Canvas Area - Single Fullscreen Canvas */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Canvas shadows gl={{ antialias: true, alpha: true }} className="w-full h-full">
              {/* Zoomed out with small margin for comfortable framing: position z: 5.75, y: 0.85 */}
              <PerspectiveCamera makeDefault position={[0, 0.85, 5.75]} fov={38} />
              <OrbitControls
                enablePan={false}
                minDistance={3.8}
                maxDistance={8.5}
                maxPolarAngle={Math.PI / 2.08}
              />
              <Suspense fallback={null}>
                <ReductionFurnace3D
                  stage={stage}
                  oxideName={currentChallenge.oxideName}
                  metalName={currentChallenge.metalName}
                  reactivityTier={currentChallenge.reactivityTier}
                  oxideColor={currentChallenge.oxideColor}
                  metalColor={currentChallenge.metalColor}
                  selectedMethod={selectedMethod}
                  isCorrectMethod={selectedMethod === currentChallenge.correctMethod}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Floating Top Header Bar */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Top-Left Exit Button (Single Unified Black Pill) */}
            <button
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Central Target Pill */}
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-200 shadow-md flex items-center gap-1.5">
                <span className="text-blue-600 font-extrabold">Level {currentChallenge.level}:</span>
                <span>{currentChallenge.oxideName} ({currentChallenge.oxideFormula})</span>
              </span>
            </div>

            {/* Explanation Button */}
            <button
              onClick={() => setShowExplanation(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Floating Bottom Control Bar: Exactly 2 Centered Buttons (Method Dropdown + Start Extraction) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto relative flex items-center gap-2 sm:gap-3">
              {/* Tooltip prompt when clicking without required selections */}
              {showPromptTooltip && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-[10.5px] font-bold shadow-xl border border-slate-700 whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-amber-400">⚠️</span>
                  <span>{showPromptTooltip}</span>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              )}

              {/* Button 1: Method Dropdown Trigger & Popover */}
              <div className="relative">
                {/* Dropdown Menu Popover (Opens Upwards) */}
                {isMethodDropdownOpen && stage === "idle" && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMethodDropdownOpen(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 px-2 py-1">
                        CHOOSE METHOD
                      </div>
                      {shuffledMethods.map((methodKey) => {
                        const isSelected = selectedMethod === methodKey;
                        const config =
                          methodKey === "electrolytic"
                            ? { label: "ELECTROLYTIC", icon: Zap, color: "cyan" }
                            : methodKey === "carbon"
                            ? { label: "CARBON / CO", icon: Flame, color: "amber" }
                            : { label: "SELF-REDUCTION", icon: RefreshCw, color: "purple" };
                        const Icon = config.icon;

                        return (
                          <button
                            key={methodKey}
                            onClick={() => {
                              setSelectedMethod(methodKey);
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer text-left ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                config.color === "cyan"
                                  ? "text-cyan-500"
                                  : config.color === "amber"
                                  ? "text-amber-500"
                                  : "text-purple-500"
                              }`}
                            />
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Dropdown Trigger Button */}
                <button
                  onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
                  disabled={stage !== "idle"}
                  className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md border ${
                    stage !== "idle"
                      ? "opacity-60 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    selectedMethod === "electrolytic"
                      ? "bg-cyan-600 text-white border-cyan-500 shadow-cyan-500/20"
                      : selectedMethod === "carbon"
                      ? "bg-amber-600 text-white border-amber-500 shadow-amber-500/20"
                      : selectedMethod === "self"
                      ? "bg-purple-600 text-white border-purple-500 shadow-purple-500/20"
                      : "bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {selectedMethod === "electrolytic" ? (
                    <Zap className="w-4 h-4 text-cyan-200" />
                  ) : selectedMethod === "carbon" ? (
                    <Flame className="w-4 h-4 text-amber-200" />
                  ) : selectedMethod === "self" ? (
                    <RefreshCw className="w-4 h-4 text-purple-200" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  )}
                  <span>
                    {selectedMethod === "electrolytic"
                      ? "ELECTROLYTIC"
                      : selectedMethod === "carbon"
                      ? "CARBON / CO"
                      : selectedMethod === "self"
                      ? "SELF-REDUCTION"
                      : "SELECT METHOD"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isMethodDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Button 2: Start Extraction Button */}
              <button
                onClick={handleStartExtraction}
                disabled={stage !== "idle"}
                className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
                  stage !== "idle"
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-blue-500/25 cursor-pointer"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>START EXTRACTION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2A: LEVEL PASSED MODAL (Levels 1 - 3)                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-[310px] sm:max-w-[330px] bg-white rounded-2xl p-4 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Correct Extraction!
            </h3>

            <p className="text-[11px] text-slate-600 mb-2.5 leading-snug">
              Great job! You chose the correct extraction route for{" "}
              <strong>{currentChallenge.oxideName} ({currentChallenge.oxideFormula})</strong>.
            </p>

            <div className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[10.5px] mb-3 text-slate-800 space-y-1">
              <div className="text-emerald-700 font-bold leading-tight">
                ✓ Reaction: {currentChallenge.reactionEquation}
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                • {currentChallenge.whyThisMethod}
              </div>
            </div>

            {/* 2 Buttons: REPLAY and NEXT LEVEL */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={handleReplayCurrentLevel}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                onClick={handleNextLevel}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <span>NEXT LEVEL</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: RICH EXPLANATION MODAL (Narrative Theory & Real-Life)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Reduction & Extraction of Metals
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">
                  Chemical Metallurgy • Reactivity Series & Extraction Principles
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

          {/* Narrative Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto">
            {/* Section 1: The Three Extraction Methods in Detail (Explaining the image clearly) */}
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Understanding the 3 Extraction Methods
              </h3>
              <p className="mb-3">
                In metallurgy, metals are bound to oxygen as metal oxides. The chemical strength of this bond depends entirely on where the metal sits in the reactivity series:
              </p>

              <div className="space-y-3">
                <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-cyan-500">
                  <div className="font-bold text-cyan-800 text-xs sm:text-sm mb-1">
                    1. Electrolytic Reduction (for High-Reactivity Metals: K, Na, Ca, Mg, Al)
                  </div>
                  <p className="text-slate-600">
                    High-reactivity metals hold onto oxygen with tremendous force—stronger than carbon! No chemical reducing agent can pull oxygen away from them. Therefore, powerful electrical energy must be passed through their molten salts (electrolysis) to force the metal ions to accept electrons and deposit pure metal at the cathode.
                  </p>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-amber-500">
                  <div className="font-bold text-amber-800 text-xs sm:text-sm mb-1">
                    2. Carbon / CO Reduction (for Moderate Metals: Zn, Fe, Pb, Sn)
                  </div>
                  <p className="text-slate-600">
                    Moderate metals hold oxygen with medium strength. At high temperatures inside a furnace, Carbon (coke) and Carbon Monoxide (CO) have a higher affinity for oxygen than these metals do. The carbon eagerly strips oxygen away from the ore, forming CO or CO₂ gas and leaving pure molten metal behind.
                  </p>
                </div>

                <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-purple-500">
                  <div className="font-bold text-purple-800 text-xs sm:text-sm mb-1">
                    3. Self-Reduction (for Low-Reactivity Metals: Cu, Hg, Pb)
                  </div>
                  <p className="text-slate-600">
                    Low-reactivity metals form relatively weak oxides. External reducing agents like coke or electricity are not needed! Simply heating the partially roasted metal oxide with its own unroasted sulphide ore causes them to reduce each other directly into pure metal and SO₂ gas.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Real-World Industrial Insights */}
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                Real-World Industrial Applications
              </h3>
              <p className="mb-2">
                • <strong>Aluminium (Hall–Héroult Process):</strong> Molten cryolite is used to dissolve alumina and conduct electric current. Before this electrolytic method was invented in 1886, aluminium was rarer and more expensive than gold!
              </p>
              <p className="mb-2">
                • <strong>Iron &amp; Steel (Blast Furnaces):</strong> Giant blast furnaces run non-stop for up to 15 years, continuously blowing air through coke to produce CO gas and tap molten pig iron from the hearth.
              </p>
              <p>
                • <strong>Copper (Bessemer Converter):</strong> During self-reduction, bubbling SO₂ gas escapes as molten copper solidifies, leaving characteristic blisters that give it the name <em>Blister Copper</em> (98–99% pure).
              </p>
            </div>

            {/* Section 3: How to Play (At the End) */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                How to Play
              </h3>
              <p className="mb-1.5">
                <strong>Step 1: Check Target</strong> — Look at the top pill to see the metal oxide formula and its reactivity level (High, Moderate, or Low).
              </p>
              <p className="mb-1.5">
                <strong>Step 2: Choose Method</strong> — Select the matching method from the bottom bar based on its reactivity:
                <br />&nbsp;&nbsp;• <em>High Reactivity</em> ⟶ <strong>ELECTROLYTIC REDUCTION</strong>
                <br />&nbsp;&nbsp;• <em>Moderate Reactivity</em> ⟶ <strong>CARBON / CO REDUCTION</strong>
                <br />&nbsp;&nbsp;• <em>Low Reactivity</em> ⟶ <strong>SELF-REDUCTION</strong>
              </p>
              <p>
                <strong>Step 3: Extract &amp; Check</strong> — Click <strong>1. START EXTRACTION</strong> to run the reaction and fill the ingot mould with pure metal. Then click <strong>CHECK ANSWER</strong> to verify and advance to the next challenge!
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
              Outstanding! You have mastered metal reduction principles: Carbon Reduction for moderate metals, Electrolytic Reduction for reactive metals, and Self-Reduction for sulphide ores.
            </p>

            <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] mb-4 text-slate-800 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>All 4 Metals Extracted:</span>
                <span>100% SUCCESS</span>
              </div>
              <div className="text-[10.5px] text-slate-600">
                • ZnO & Fe₂O₃ ⟶ Carbon / CO Reduction<br />
                • Al₂O₃ ⟶ Electrolytic Reduction<br />
                • 2Cu₂O + Cu₂S ⟶ Self-Reduction
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
      {/* MODAL 3: INCORRECT MODAL (With Retry & Explanation)                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-rose-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Incorrect Method!
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {failFeedback}
            </p>

            {/* 2 Buttons: RETRY and EXPLANATION */}
            <div className="w-full flex items-center gap-2">
              <button
                onClick={() => {
                  setShowFailModal(false);
                  setStage("idle");
                  setSelectedMethod(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                onClick={() => {
                  setShowFailModal(false);
                  setStage("idle");
                  setShowExplanation(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/25"
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

