"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {
  ArrowLeft,
  RotateCcw,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Flame,
  Layers,
  Thermometer,
  X,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import RefiningPlant3D, { RefiningMethod } from "./RefiningPlant3D";

interface RefiningChallenge {
  id: string;
  level: number;
  crudeName: string;
  metalName: string;
  metalSymbol: string;
  impuritiesDesc: string;
  correctMethod: RefiningMethod;
  crudeColor: string;
  pureColor: string;
  anodeReaction?: string;
  cathodeReaction?: string;
  keyPrinciple: string;
  explanation: string;
}

const REFINING_CHALLENGES: RefiningChallenge[] = [
  {
    id: "blister_copper",
    level: 1,
    crudeName: "Blister Copper (98% Pure)",
    metalName: "Copper",
    metalSymbol: "Cu",
    impuritiesDesc: "Contains Fe, Ni, Zn (soluble) + Ag, Au, Pt (insoluble noble residue)",
    correctMethod: "electrolytic",
    crudeColor: "#991B1B", // Dark blister copper with rough impurities
    pureColor: "#F59E0B", // Brilliant lustrous refined cathode copper (99.99%)
    anodeReaction: "Cu (impure anode) ⟶ Cu²⁺ + 2e⁻",
    cathodeReaction: "Cu²⁺ + 2e⁻ ⟶ Cu (pure cathode, 99.99%)",
    keyPrinciple:
      "Electrolytic Refining: Impure copper forms the anode; pure copper forms the cathode in acidified CuSO₄. Pure Cu deposits at the cathode, while noble Ag and Au settle as valuable Anode Mud.",
    explanation:
      "Electrolytic refining uses electrical current to selectively dissolve copper from an impure anode and deposit it onto a pure cathode strip. Basic impurities like Fe and Ni dissolve into the bath as ions, while noble metals like Ag and Au do not oxidize and drop to the bottom as highly valuable 'Anode Mud'.",
  },
  {
    id: "crude_zinc",
    level: 2,
    crudeName: "Crude Zinc (Spelter)",
    metalName: "Zinc",
    metalSymbol: "Zn",
    impuritiesDesc: "Contains Lead (Pb) & Iron (Fe) with much higher boiling points",
    correctMethod: "distillation",
    crudeColor: "#64748B", // Dull raw zinc spelter
    pureColor: "#E2E8F0", // Bright silvery-white distilled zinc
    keyPrinciple:
      "Distillation: Used for volatile metals with low boiling points (Zn: 907°C; Hg: 357°C). The metal boils into vapor and condenses in a cold receiver, leaving non-volatile Pb and Fe behind.",
    explanation:
      "Zinc has a remarkably low boiling point (907°C) compared to its non-volatile impurities like iron (boils at 2862°C) and lead (1749°C). In fractional distillation, crude zinc boils into vapor first and is condensed back into pure liquid zinc in a water-cooled receiver.",
  },
  {
    id: "crude_tin",
    level: 3,
    crudeName: "Crude Tin / Lead",
    metalName: "Tin",
    metalSymbol: "Sn",
    impuritiesDesc: "Contains Iron (Fe), Copper (Cu), and Silica with high melting points",
    correctMethod: "liquation",
    crudeColor: "#475569", // Dark rough tin dross
    pureColor: "#CBD5E1", // Clean silvery-white refined tin
    keyPrinciple:
      "Liquation: Used when the metal has a lower melting point (Sn: 232°C) than its infusible impurities. The sloping hearth melts the tin, allowing it to flow away while dross stays behind.",
    explanation:
      "Liquation is designed for metals with very low melting points like Tin (232°C) and Lead (327°C). Crude metal is placed on a sloping reverberatory furnace hearth maintained just above tin's melting point. The pure tin melts and flows down the slope into a collection trough, leaving solid, infusible impurities behind.",
  },
  {
    id: "semiconductor_silicon",
    level: 4,
    crudeName: "Metallurgical Grade Silicon (99%)",
    metalName: "Silicon",
    metalSymbol: "Si",
    impuritiesDesc: "Trace B, P, Al impurities; requires 99.999999% ultra-purity for microchips",
    correctMethod: "zone",
    crudeColor: "#334155", // Dark grey crystalline crude silicon
    pureColor: "#94A3B8", // Ultra-pure semiconductor mirror-finish silicon
    keyPrinciple:
      "Zone Refining (Fractional Crystallization): Impurities are much more soluble in the molten melt than in the solid state. A circular induction heater sweeps impurities to one end.",
    explanation:
      "Modern computer microchips require ultra-pure semiconductors (purity exceeding 99.999999%). In zone refining, a circular mobile induction heater melts a narrow molten zone along a silicon rod. As the heater moves forward, pure silicon crystallizes behind it while impurities remain dissolved in the molten zone and get swept to the rod end, which is cut off.",
  },
];

export interface RefiningOfMetalsGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function RefiningOfMetalsGamePage({
  difficulty = "standard",
  onExit,
}: RefiningOfMetalsGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Gameplay state
  const [levelIndex, setLevelIndex] = useState(0);
  const currentChallenge = REFINING_CHALLENGES[levelIndex];

  // Scramble the order of refining method buttons differently for each level
  // Ensures buttons are never in chronological level order
  const shuffledMethods = useMemo((): RefiningMethod[] => {
    const permutations: RefiningMethod[][] = [
      ["liquation", "zone", "electrolytic", "distillation"], // Level 1 (Answer: electrolytic at 3rd pos)
      ["zone", "liquation", "electrolytic", "distillation"], // Level 2 (Answer: distillation at 4th pos)
      ["electrolytic", "distillation", "zone", "liquation"], // Level 3 (Answer: liquation at 4th pos)
      ["distillation", "zone", "liquation", "electrolytic"], // Level 4 (Answer: zone at 2nd pos)
    ];
    return permutations[levelIndex % permutations.length];
  }, [levelIndex]);

  const [selectedMethod, setSelectedMethod] = useState<RefiningMethod | null>(null);
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false);
  const [stage, setStage] = useState<"idle" | "refining" | "refined">("idle");
  const [isLevelPassed, setIsLevelPassed] = useState(false);
  const [showPromptTooltip, setShowPromptTooltip] = useState<string | null>(null);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
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

  // Step 1: Start Refining Action
  const handleStartRefining = () => {
    if (!selectedMethod) {
      setShowPromptTooltip("Choose a Refining Method First!");
      setTimeout(() => setShowPromptTooltip(null), 3200);
      return;
    }
    setStage("refining");
    // Duration matches the smooth full single-pass sweep (3.6s for zone refining, 3.2s for others)
    const duration = selectedMethod === "zone" ? 3600 : 3000;
    setTimeout(() => {
      setStage("refined");
    }, duration);
  };

  // Step 2: Check Answer
  const handleCheckAnswer = () => {
    if (!selectedMethod) {
      setShowPromptTooltip("Select a Refining Method First!");
      setTimeout(() => setShowPromptTooltip(null), 3200);
      return;
    }

    if (stage === "idle") {
      setShowPromptTooltip("Click '1. START REFINING' To Run Process!");
      setTimeout(() => setShowPromptTooltip(null), 3200);
      return;
    }

    if (selectedMethod === currentChallenge.correctMethod) {
      setIsLevelPassed(true);
    } else {
      // Auto-reset so "START REFINING" reactivates and models reset
      setStage("idle");
      let feedback = "";
      if (currentChallenge.correctMethod === "electrolytic") {
        feedback = `${currentChallenge.metalName} contains both soluble basic impurities (Fe, Ni) and insoluble noble metals (Ag, Au). It requires Electrolytic Refining where pure metal plates onto the cathode while anode mud collects below.`;
      } else if (currentChallenge.correctMethod === "distillation") {
        feedback = `${currentChallenge.metalName} has a remarkably low boiling point compared to its impurities. It is refined via Distillation by vaporizing the volatile metal and condensing it in a receiver.`;
      } else if (currentChallenge.correctMethod === "liquation") {
        feedback = `${currentChallenge.metalName} has a very low melting point compared to infusible dross impurities. It requires Liquation on a sloping hearth where the metal melts and flows away.`;
      } else {
        feedback = `${currentChallenge.metalName} requires ultra-high purity (99.9999%) for semiconductors. It is purified by Zone Refining using fractional crystallization with a mobile induction heater.`;
      }
      setFailFeedback(feedback);
      setShowFailModal(true);
    }
  };

  // Advance to next level or show final modal
  const handleNextLevel = () => {
    if (levelIndex < REFINING_CHALLENGES.length - 1) {
      setLevelIndex((prev) => prev + 1);
      setSelectedMethod(null);
      setStage("idle");
      setIsLevelPassed(false);
    } else {
      setShowFinalCompletionModal(true);
    }
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
          {/* Top Bar with Exit */}
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div />
          </div>

          {/* Central Hero Mission Briefing */}
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug sm:leading-tight mb-4">
              <span className="text-blue-600">MISSION:</span> Convert impure metal into high-purity (99.99%) metal using the correct refining method!
            </h1>

          </div>

          {/* Bottom Bar: Action Next Button */}
          <div className="w-full flex items-center justify-center pt-2">
            <button
              onClick={() => setScreen("instructions")}
              className="w-40 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25"
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
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 relative z-10 bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
          {/* Top Bar */}
          <div className="flex items-center justify-between w-full pb-1 border-b border-slate-100">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div className="text-slate-800 font-black text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
              <span className="w-6 h-0.5 bg-blue-600" />
              INSTRUCTIONS TO PLAY
              <span className="w-6 h-0.5 bg-blue-600" />
            </div>
            <div />
          </div>

          {/* 3 Step Cards - Compact Height & Clear Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 my-auto max-w-5xl mx-auto w-full">
            {/* Card 1: Inspect Sample & Plant Setup */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 1: Inspect Metal</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  CHECK IMPURITIES &amp; SETUP
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Look at the crude metal and its impurities shown at the top pill, and inspect the 3D plant setup.
                </p>
              </div>

              {/* Visual 1: 3D Refining Plant Setup */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-900/10 relative flex items-center justify-center mt-auto">
                <img
                  src="/instructions_refining_step1.jpg"
                  alt="3D Refining Plant Setup"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Card 2: Select Refining Method */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 2: Choose Method</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  PICK REFINING ROUTE
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Select the correct button: <strong>ELECTROLYTIC</strong>, <strong>DISTILLATION</strong>, <strong>LIQUATION</strong>, or <strong>ZONE REFINING</strong>.
                </p>
              </div>

              {/* Visual 2: Method Selector Option Graphic */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center mt-auto">
                <img
                  src="/instructions_refining_step2.jpg"
                  alt="Refining Route Options"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 3: Start Refining & Check Answer */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-xs overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Step 3: Start &amp; Verify</h3>
                </div>
                <div className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider mb-1 w-fit">
                  RUN &amp; CHECK ANSWER
                </div>
                <p className="text-slate-600 text-[11px] leading-snug mb-2">
                  Click <strong>1. START REFINING</strong> to watch the purification. Then click <strong>CHECK ANSWER</strong> to verify!
                </p>
              </div>

              {/* Visual 3: Action Controls */}
              <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center mt-auto">
                <img
                  src="/instructions_refining_step3.jpg"
                  alt="Start Refining, Reset and Check Answer"
                  className="w-full h-full object-contain"
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
      {/* SCREEN 3: INTERACTIVE LAB GAMEPLAY (Single Landscape Div / Canvas)  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full flex flex-col justify-between p-3 sm:p-4 relative z-10 bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit + Target Challenge Info + Explanation */}
          <div className="flex items-center justify-between w-full pb-1 z-20 shrink-0 gap-2">
            {/* Exit Button */}
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Central Target Pill */}
            <div className="flex items-center justify-center flex-1 min-w-0">
              <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-xs flex items-center gap-1.5 max-w-full overflow-hidden">
                <span className="text-blue-600 shrink-0">Level {currentChallenge.level}:</span>
                <span className="truncate">{currentChallenge.crudeName}</span>
              </span>
            </div>

            {/* Explanation Button */}
            <button
              onClick={() => setShowExplanation(true)}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Main 3D Simulation Canvas Area - Light clean background & zoomed in view */}
          <div className="flex-1 w-full min-h-0 relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] border border-slate-200 shadow-inner">
            <Canvas shadows gl={{ antialias: true, alpha: true }} className="w-full h-full">
              {/* Balanced perspective: fov 31, camera at [0, 1.15, 3.6], looking right at [0, 0.25, 0] */}
              <PerspectiveCamera makeDefault position={[0, 1.15, 3.6]} fov={31} />
              <OrbitControls
                enablePan={false}
                minDistance={2.2}
                maxDistance={5.5}
                target={[0, 0.25, 0]}
                maxPolarAngle={Math.PI / 2.02}
              />
              <Suspense fallback={null}>
                <RefiningPlant3D
                  stage={stage}
                  metalName={currentChallenge.metalName}
                  metalSymbol={currentChallenge.metalSymbol}
                  crudeColor={currentChallenge.crudeColor}
                  pureColor={currentChallenge.pureColor}
                  selectedMethod={selectedMethod}
                  isCorrectMethod={selectedMethod === currentChallenge.correctMethod}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Bottom Single-Row Control Bar: 4 Centered Buttons (Dropdown, Start, Reset, Check/Next) */}
          <div className="w-full flex items-center justify-center gap-2 sm:gap-3 shrink-0 z-20 pt-1.5 pb-0.5 border-t border-slate-100 relative">
            {/* Action 1: Method Selector Dropdown Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsMethodDropdownOpen((prev) => !prev)}
                disabled={stage === "refining"}
                className={`py-1.5 px-3 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  selectedMethod
                    ? selectedMethod === "electrolytic"
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-cyan-500/20"
                      : selectedMethod === "distillation"
                      ? "bg-amber-600 text-white border-amber-600 shadow-amber-500/20"
                      : selectedMethod === "liquation"
                      ? "bg-orange-600 text-white border-orange-600 shadow-orange-500/20"
                      : "bg-purple-600 text-white border-purple-600 shadow-purple-500/20"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                }`}
              >
                {selectedMethod === "electrolytic" && <Zap className="w-3.5 h-3.5 text-cyan-200" />}
                {selectedMethod === "distillation" && <Thermometer className="w-3.5 h-3.5 text-amber-200" />}
                {selectedMethod === "liquation" && <Flame className="w-3.5 h-3.5 text-orange-200" />}
                {selectedMethod === "zone" && <Layers className="w-3.5 h-3.5 text-purple-200" />}
                {!selectedMethod && <Sparkles className="w-3.5 h-3.5 text-blue-500" />}

                <span>
                  {selectedMethod
                    ? selectedMethod === "electrolytic"
                      ? "ELECTROLYTIC"
                      : selectedMethod === "distillation"
                      ? "DISTILLATION"
                      : selectedMethod === "liquation"
                      ? "LIQUATION"
                      : "ZONE REFINING"
                    : "SELECT METHOD"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMethodDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu (Opens Upward to not get cut off) */}
              {isMethodDropdownOpen && (
                <>
                  {/* Backdrop to close on click outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMethodDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Choose Method
                    </div>
                    {shuffledMethods.map((method: RefiningMethod) => {
                      if (method === "electrolytic") {
                        return (
                          <button
                            key="electrolytic"
                            onClick={() => {
                              setSelectedMethod("electrolytic");
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-left text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                              selectedMethod === "electrolytic"
                                ? "bg-cyan-50 text-cyan-700 font-black"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 text-cyan-500" />
                            <span>ELECTROLYTIC</span>
                          </button>
                        );
                      }
                      if (method === "distillation") {
                        return (
                          <button
                            key="distillation"
                            onClick={() => {
                              setSelectedMethod("distillation");
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-left text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                              selectedMethod === "distillation"
                                ? "bg-amber-50 text-amber-700 font-black"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                            <span>DISTILLATION</span>
                          </button>
                        );
                      }
                      if (method === "liquation") {
                        return (
                          <button
                            key="liquation"
                            onClick={() => {
                              setSelectedMethod("liquation");
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-left text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                              selectedMethod === "liquation"
                                ? "bg-orange-50 text-orange-700 font-black"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                            <span>LIQUATION</span>
                          </button>
                        );
                      }
                      if (method === "zone") {
                        return (
                          <button
                            key="zone"
                            onClick={() => {
                              setSelectedMethod("zone");
                              setIsMethodDropdownOpen(false);
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-left text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
                              selectedMethod === "zone"
                                ? "bg-purple-50 text-purple-700 font-black"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-purple-500" />
                            <span>ZONE REFINING</span>
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Action 2: Start Refining Button */}
            <button
              onClick={handleStartRefining}
              disabled={stage !== "idle"}
              className={`py-1.5 px-3 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 ${
                stage === "idle"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 active:scale-95 shadow-md shadow-blue-500/20"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>START REFINING</span>
            </button>

            {/* Action 3: Reset Button */}
            <button
              onClick={handleReset}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
              title="Reset Setup"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>

            {/* Action 4: Check Answer OR Next Level (When Passed) */}
            <div className="relative shrink-0">
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
                  className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition cursor-pointer animate-pulse"
                >
                  <span>{levelIndex === REFINING_CHALLENGES.length - 1 ? "FINISH" : "NEXT LEVEL"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCheckAnswer}
                  className="py-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CHECK ANSWER</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: EXPLANATION MODAL (Textbook Theory + How to Play)           */}
      {/* Full screen modal with rounded-3xl borders matching container        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden rounded-3xl sm:rounded-[32px] p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                    Refining of Metals
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Chemical Metallurgy • Industrial Purification Methods
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExplanation(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Close Explanation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Narrative Content */}
            <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-1 sm:px-4 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
              {/* Section 1: The 4 Refining Methods in Detail */}
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  Understanding the 4 Refining Methods
                </h3>
                <p className="mb-3">
                  Crude metals extracted by smelting contain residual impurities. Depending on differences in boiling points, melting points, and oxidation tendencies, different refining methods are applied:
                </p>

                <div className="space-y-3">
                  <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-cyan-500">
                    <div className="font-bold text-cyan-800 text-xs sm:text-sm mb-1">
                      1. Electrolytic Refining (for Copper, Nickel, Silver, Gold)
                    </div>
                    <p className="text-slate-600">
                      The impure metal is cast into thick slabs used as the <strong>anode (+)</strong>, while thin pure sheets serve as the <strong>cathode (-)</strong> in an acidified salt bath (e.g. CuSO₄ + H₂SO₄). When electric current passes, pure copper dissolves from the anode and plates onto the cathode with 99.99% purity. Less electropositive noble metals (Ag, Au, Pt) do not dissolve and drop to the bottom as valuable <strong>Anode Mud</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-amber-500">
                    <div className="font-bold text-amber-800 text-xs sm:text-sm mb-1">
                      2. Distillation (for Low-Boiling Volatile Metals: Zn, Hg, Cd)
                    </div>
                    <p className="text-slate-600">
                      Used when the metal has a significantly lower boiling point than its impurities. For example, Zinc boils at 907°C while impurities like iron boil above 2800°C. Heating crude zinc vaporizes the zinc first, which travels through a condenser into a cold receiver, leaving non-volatile dross behind.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-orange-500">
                    <div className="font-bold text-orange-800 text-xs sm:text-sm mb-1">
                      3. Liquation (for Low-Melting Metals: Sn, Pb, Bi)
                    </div>
                    <p className="text-slate-600">
                      Used when the metal has a much lower melting point than its impurities. Crude tin (melting point 232°C) is placed on a sloping hearth of a reverberatory furnace. When gently heated, tin melts into a liquid stream that flows down the slope into a receiving basin, leaving solid infusible impurities on the hearth.
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-xl border-l-4 border-purple-500">
                    <div className="font-bold text-purple-800 text-xs sm:text-sm mb-1">
                      4. Zone Refining / Fractional Crystallization (for Semiconductors: Si, Ge, Ga, In)
                    </div>
                    <p className="text-slate-600">
                      Based on the principle that impurities are much more soluble in the molten liquid phase than in the solid state. A mobile circular induction heater moves slowly along a semiconductor rod, melting a narrow zone. As the molten zone sweeps forward, ultra-pure metal recrystallizes behind it, concentrating impurities at the end of the rod. Repeating this sweep yields semiconductor purity exceeding 99.999999%!
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Real-World Industrial Applications */}
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  Real-World Industrial Applications
                </h3>
                <p className="mb-2">
                  • <strong>Value of Anode Mud:</strong> In electrolytic copper refining, recovering gold and silver from anode mud often pays for the entire operating cost of the refinery plant!
                </p>
                <p className="mb-2">
                  • <strong>Microchips &amp; Solar Cells:</strong> Without zone refining producing &ldquo;electronic grade&rdquo; silicon (99.999999% pure), modern computer processors and smartphones would be impossible because even parts-per-billion impurities disrupt transistor conductivity.
                </p>
                <p>
                  • <strong>High-Purity Zinc Alloys:</strong> Distilled zinc provides extreme corrosion resistance for zinc galvanizing on automotive steel frames.
                </p>
              </div>

              {/* Section 3: How to Play (At the End) */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  How to Play
                </h3>
                <p className="mb-1.5">
                  <strong>Step 1: Inspect Sample</strong> — Look at the top pill to see the metal name, formula, and impurity nature.
                </p>
                <p className="mb-1.5">
                  <strong>Step 2: Choose Method</strong> — Select the matching refining technique:
                  <br />&nbsp;&nbsp;• <em>Crude Copper with Noble Ag/Au</em> ⟶ <strong>ELECTROLYTIC</strong>
                  <br />&nbsp;&nbsp;• <em>Volatile Zinc with High-Boiling Pb/Fe</em> ⟶ <strong>DISTILLATION</strong>
                  <br />&nbsp;&nbsp;• <em>Low-Melting Tin with Infusible Dross</em> ⟶ <strong>LIQUATION</strong>
                  <br />&nbsp;&nbsp;• <em>Semiconductor Silicon/Germanium</em> ⟶ <strong>ZONE REFINING</strong>
                </p>
                <p>
                  <strong>Step 3: Refine &amp; Check</strong> — Click <strong>1. START REFINING</strong> to watch the separation process in 3D. Then click <strong>CHECK ANSWER</strong> to verify and advance!
                </p>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="flex items-center justify-center pt-2 sm:pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setShowExplanation(false)}
                className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
              >
                Resume Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: FINAL CHALLENGE COMPLETED MODAL (At Last Level)            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFinalCompletionModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              Refining Master!
            </h2>
            <p className="text-xs text-slate-600 mb-4 max-w-sm">
              Outstanding work! You have mastered Electrolytic Refining, Distillation, Liquation, and Zone Refining, achieving ultra-pure metals!
            </p>

            <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-200 mb-4 text-xs font-mono text-slate-700 flex justify-around">
              <div>
                <span className="text-slate-400 block text-[10px]">CHALLENGES</span>
                <span className="font-bold text-blue-600 text-sm">4 / 4 PASSED</span>
              </div>
              <div className="border-r border-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px]">PURITY LEVEL</span>
                <span className="font-bold text-emerald-600 text-sm">&gt; 99.999%</span>
              </div>
            </div>

            <div className="w-full flex items-center gap-2">
              <button
                onClick={handleReplayChallenge}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                onClick={handleExit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-blue-500/25"
              >
                <span>FINISH</span>
                <ChevronRight className="w-3.5 h-3.5" />
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

