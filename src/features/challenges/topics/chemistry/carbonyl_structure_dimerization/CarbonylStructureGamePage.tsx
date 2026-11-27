"use client";

import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  X,
  Thermometer,
  Zap,
  Minus,
  Plus,
  RotateCw,
  Flame,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import {
  useCarbonylStructureStore,
  CARBONYL_STAGES,
  MOLECULE_POLARITY_LIST,
  STAGE_2_QUEUE,
  STAGE_2_OPTIONS,
  Stage2OptionId,
} from "./CarbonylStructureStore";
import CarbonylStructure3D from "./CarbonylStructure3D";

// ============================================================================
// Standard Chemistry Explanation Data (Per Stage, matching project template)
// ============================================================================
interface StageExplanationData {
  title: string;
  subtitle: string;
  concept: string;
  formulas: {
    label: string;
    formula: string;
    explanation: string;
  }[];
  steps: {
    step: number;
    title: string;
    math?: string;
    explanation: string;
  }[];
  conclusion: string;
}

const STAGE_EXPLANATIONS: Record<number, StageExplanationData> = {
  1: {
    title: "Carbonyl sp² Trigonal Planar Geometry & Orbital Overlap",
    subtitle: "Module 11 • Aldehydes & Ketones • Stage 1 of 3",
    concept:
      "The carbonyl group (>C=O) is the functional center of aldehydes and ketones. The carbonyl carbon is bonded to three neighboring atoms (one oxygen and two substituent groups or hydrogens).\n\nTo minimize electrostatic repulsion between bonding electron pairs (VSEPR theory), the carbon mixes its 2s orbital with two 2p orbitals to form three equivalent sp² hybrid orbitals. These three orbitals spread out on a single two-dimensional plane pointing toward the corners of an equilateral triangle, fixing all atoms in a completely flat plane at an angle of exactly 120.0°.",
    formulas: [
      {
        label: "Steric Number & Hybridization",
        formula: "Steric Number = 3 σ-bonds + 0 lone pairs = 3 (sp²)",
        explanation:
          "Three sp² hybrid orbitals lie in a single plane, separated by 120.0° angles to minimize electron-electron repulsion.",
      },
      {
        label: "Double Bond Architecture (Sigma vs. Pi)",
        formula: "C=O = 1 σ-bond (sp²-2p head-on) + 1 π-bond (2p_z-2p_z lateral)",
        explanation:
          "The unhybridized 2p_z orbital on carbon overlaps sideways with oxygen's 2p_z orbital, creating π-electron lobes situated above and below the flat molecular plane.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Establishing the Coplanar Trigonal Frame",
        math: "∠(H-C-H) = ∠(H-C=O) = 120.0°",
        explanation:
          "All four atoms of formaldehyde (H, H, C, O) lie in the exact same plane (Z = 0). There is zero torsional twisting.",
      },
      {
        step: 2,
        title: "Electronic Distribution and Bond Lengths",
        math: "d(C=O) = 1.22 Å  (vs. C-O single bond: 1.43 Å)",
        explanation:
          "Because the double bond has both σ and π components, carbon and oxygen are drawn closer together with a high bond dissociation energy of ~745 kJ/mol.",
      },
      {
        step: 3,
        title: "Facial Nucleophilic Attack Trajectory",
        math: "Attack Trajectory ≈ 107° (Bürgi–Dunitz Angle)",
        explanation:
          "Because the trigonal planar frame is flat, nucleophiles can attack the electrophilic carbon from either the top face or bottom face without hindrance from planar substituents.",
      },
    ],
    conclusion:
      "Key Takeaway: The carbonyl carbon is sp² hybridized, strictly trigonal planar, and features a 120.0° bond angle. The exposed π-system above and below the plane allows nucleophiles to attack from either face.",
  },
  2: {
    title: "Carbonyl Dipole Moments & Intermolecular Polarity Hierarchy",
    subtitle: "Module 11 • Intermolecular Forces & Boiling Points • Stage 2 of 3",
    concept:
      "Oxygen has an electronegativity of 3.44, which is much higher than carbon (2.55). Consequently, the mobile π-electron cloud of the carbonyl double bond is strongly shifted toward the oxygen atom.\n\nThis permanent polarization creates a partial negative charge (δ⁻) on oxygen and an electrophilic partial positive charge (δ⁺) on carbon, resulting in a strong permanent dipole vector (μ). Comparing compounds with nearly identical molar masses (~44 to 60 g/mol) demonstrates how carbonyl polarity drastically alters intermolecular attractions and boiling points.",
    formulas: [
      {
        label: "Electric Dipole Moment",
        formula: "μ = q × d (Debye, D)",
        explanation:
          "Measures bond polarity where q is the partial charge separation and d is the distance between charges.",
      },
      {
        label: "Intermolecular Force Strength Hierarchy",
        formula: "London Dispersion (< 4 kJ/mol) < Dipole-Dipole (5-20 kJ/mol) < H-Bonding (20-40 kJ/mol)",
        explanation:
          "Stronger intermolecular attractions require significantly higher thermal kinetic energy to overcome, raising the boiling point.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Propane (CH₃-CH₂-CH₃) — Non-polar Alkane",
        math: "Molar Mass = 44.1 g/mol  |  μ ≈ 0.08 D  |  B.P. = -42.1°C",
        explanation:
          "Propane is a symmetrical hydrocarbon with virtually no electronegativity difference. It is held together only by weak London dispersion forces, making it a gas at room temperature.",
      },
      {
        step: 2,
        title: "Acetone (CH₃-CO-CH₃) — Polar Carbonyl",
        math: "Molar Mass = 58.1 g/mol  |  μ = 2.88 D  |  B.P. = +56.1°C",
        explanation:
          "The polar C=O bond creates a strong permanent dipole (μ = 2.88 D). Acetone molecules attract each other through strong Dipole-Dipole (Keesom) interactions, elevating its boiling point by nearly 100°C over propane into a liquid.",
      },
      {
        step: 3,
        title: "Acetic Acid (CH₃-COOH) — Hydrogen-Bonding Carboxylic Acid",
        math: "Molar Mass = 60.1 g/mol  |  μ = 1.74 D  |  B.P. = +118.1°C",
        explanation:
          "Acetic acid possesses both a polarized C=O bond and a highly polarized O-H hydroxyl bond. It forms strong intermolecular hydrogen bonds, giving it by far the highest boiling point in the series.",
      },
    ],
    conclusion:
      "Key Takeaway: Across similar molecular weights, boiling points strictly follow intermolecular attraction strength: Non-polar Alkane (Propane, -42°C) < Polar Carbonyl (Acetone, 56°C) < Hydrogen-Bonded Acid (Acetic Acid, 118°C).",
  },
  3: {
    title: "Carboxylic Acid Dimerization & van 't Hoff Colligative Factor",
    subtitle: "Module 11 • Cyclic Dimers & Solution Thermodynamics • Stage 3 of 3",
    concept:
      "Carboxylic acids display an extraordinary ability to self-associate through complementary hydrogen bonding. In the vapor phase or non-polar solvents (such as benzene), acetic acid molecules spontaneously pair up into a stable, centrosymmetric 8-membered cyclic ring.\n\nEach acetic acid molecule acts simultaneously as a hydrogen-bond donor (via its acidic O-H group) and a hydrogen-bond acceptor (via its carbonyl C=O group). Rotating Monomer 2 by 180° into a head-to-tail alignment enables dual complementary H-bonds to form, releasing substantial stabilization energy.",
    formulas: [
      {
        label: "Dimerization Equilibrium",
        formula: "2 CH₃COOH ⇌ (CH₃COOH)₂   |   ΔH° ≈ -60 kJ/mol",
        explanation:
          "Exothermic association forming an 8-membered ring held by dual O-H···O=C hydrogen bonds at d ≈ 1.76 Å.",
      },
      {
        label: "van 't Hoff Factor for Association",
        formula: "i = 1 - α + (α / n)  →  When α ≈ 1 and n = 2:  i = 0.50",
        explanation:
          "Colligative properties depend on the total count of free particles in solution. Dimerization halves the particle count, reducing i from 1.00 to 0.50.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Centrosymmetric Head-to-Tail Alignment",
        math: "Orientation = 180°  |  Optimal d(O···H) = 1.76 Å",
        explanation:
          "A 180° flip places C=O opposite to H-O on both sides, allowing two linear, low-strain hydrogen bonds to lock into an 8-membered cyclic ring.",
      },
      {
        step: 2,
        title: "Colligative Behavior & Apparent Molar Mass",
        math: "M_apparent = M_theoretical / i = 60.05 / 0.50 ≈ 120 g/mol",
        explanation:
          "Because pairs of molecules travel together as single kinetic units, freezing point depression measurements in benzene yield an apparent molar mass twice as high as theoretical.",
      },
      {
        step: 3,
        title: "Why Heat Breaks the Dimer (Unlike Covalent Reactions)",
        math: "Dimer (25°C, i = 0.50, M = 120)  —(Δ ≥ 120°C)→  2 Monomers (i = 1.00, M = 60)",
        explanation:
          "Unlike Aldol or Esterification where heat drives covalent bond formation, hydrogen bonds are weak physical forces (ΔH ≈ -60 kJ/mol). Raising temperature to ≥ 120°C supplies enough kinetic energy to snap the dual H-bonds, breaking the dimer back into individual monomers!",
      },
    ],
    conclusion:
      "Key Takeaway: Acetic acid forms a cyclic dimer spontaneously at room temperature (25°C, i = 0.50, apparent molar mass = 120 g/mol). Heating (≥ 120°C) breaks the weak hydrogen bonds, restoring individual monomers (i = 1.00, molar mass = 60 g/mol).",
  },
};

// ============================================================================
// Main Game Page Component (Matching Chemistry Mission & Instructions Template)
// ============================================================================
export default function CarbonylStructureGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Navigation Flow: 'mission' -> 'instructions' -> active 3D gameplay
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const {
    stage,
    showExplanationModal,
    showSuccessModal,
    lastFailureReason,
    setStage,
    setShowExplanationModal,
    setShowSuccessModal,
    // Stage 1
    showPiOrbitals,
    showDipoleVector,
    stage1MeasuredAngle,
    togglePiOrbitals,
    toggleDipoleVector,
    setStage1MeasuredAngle,
    verifyStage1Planarity,
    // Stage 2
    selectedMolecule,
    electricFieldStrength,
    stage2QueueIndex,
    stage2SlideState,
    stage2SlideDirection,
    stage2SelectedOption,
    stage2Feedback,
    setSelectedMolecule,
    setElectricFieldStrength,
    verifyStage2Alignment,
    setStage2SelectedOption,
    submitStage2Answer,
    // Stage 3
    monomer2Rotation,
    temperature,
    dimerLocked,
    dimerJoining,
    dimerDissociating,
    dimerDissociated,
    vanTHoffFactor,
    setMonomer2Rotation,
    setTemperature,
    resetCurrentStage,
  } = useCarbonylStructureStore();

  const currentStageConfig = CARBONYL_STAGES[stage];

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  return (
    <div className="w-full h-full h-[100dvh] relative overflow-hidden bg-[#F8FAFC] select-none font-sans">
      {/* ══════════════════════════════════════════════════════════════════════
          INTRO MISSION & INSTRUCTIONS VIEW OVERLAY (Matching Chemistry Template)
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
                <span className="text-[#2563EB]">MISSION:</span> Carbonyl Shape, Polarity &amp; Dimerization
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

          {/* ── STEP 2: INSTRUCTIONS SCREEN (3 CARDS IN LANDSCAPE GRID) ── */}
          {introStep === "instructions" && (
            <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-1 w-full animate-in fade-in duration-200 flex-1">
              <div className="text-center pt-0.5 pb-2">
                <h2 className="text-[#1E293B] text-sm sm:text-base md:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              {/* 3 Instruction Cards Side-by-Side in Landscape Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2.5 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
                {/* Card 1: sp² Planarity */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Verify Planar Geometry
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Adjust the bond angle to 120.0° to confirm the flat sp² carbonyl shape.
                    </p>
                  </div>

                  {/* Image Illustration 1: Bond Angle Slider */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-2 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/carbonyl_step1_angle.png"
                      alt="Bond angle slider"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 2: Dipole & Polarity */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Classify Molecule Polarity
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Select whether each molecule is Non-polar, Polar Dipole, or Hydrogen-Bonding.
                    </p>
                  </div>

                  {/* Image Illustration 2: Polarity Selection Buttons */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-2 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/carbonyl_step2_polarity.png"
                      alt="Polarity buttons"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 3: 8-Membered Cyclic Dimer */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Assemble Cyclic Dimer
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Rotate monomer to 180° and slide distance to ~1.76 Å to lock the dimer ring.
                    </p>
                  </div>

                  {/* Image Illustration 3: Rotation & Distance Sliders + LOCK Button */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-2 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/carbonyl_step3_dimer.png"
                      alt="Assemble and lock cyclic dimer"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
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
          ACTIVE 3D SIMULATION SCREEN (Runs when gameStarted === true)
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="w-full h-full relative">
          {/* ── TOP HEADER BAR: STANDARD CHEMISTRY TEMPLATE (EXIT, HUD, EXPLANATION) ── */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Top-Left Exit Button (Standard Chemistry Dark Slate Pill) */}
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Central Target & Parameter HUD */}
            <div className="pointer-events-none max-w-[calc(100vw-280px)] sm:max-w-none px-3.5 sm:px-5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-300 shadow-sm font-mono select-none flex items-center justify-center gap-2 sm:gap-3 text-xs">
              <span className="font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                Stage {stage}/3
              </span>

              {stage === 1 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-600 font-bold hidden md:inline">
                    {currentStageConfig.substrate}
                  </span>
                  <span className="text-slate-300 hidden md:inline">·</span>
                  <span className="text-slate-500">Angle:</span>
                  <span className="font-extrabold text-sky-700">{stage1MeasuredAngle.toFixed(1)}°</span>
                  <span className="text-slate-400 text-[11px]">(Target: 120.0°)</span>
                </>
              )}

              {stage === 2 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-black text-slate-800 capitalize">
                    {selectedMolecule === "acetic_acid" ? "Acetic Acid" : selectedMolecule}
                  </span>
                  <span className="text-slate-400 font-medium">
                    ({stage2QueueIndex + 1}/3)
                  </span>
                </>
              )}

              {stage === 3 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-extrabold text-slate-800">Acetic Acid Dimer</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">i =</span>
                  <span className={`font-black ${dimerLocked ? "text-emerald-600" : "text-amber-600"}`}>
                    {vanTHoffFactor.toFixed(2)}
                  </span>
                  {dimerLocked && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[11px] hidden sm:inline">
                      -60 kJ/mol
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Top-Right Explanation Button (Standard Chemistry Sky Blue Pill) */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="pointer-events-auto px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              title="View Theory & Explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── 3D CANVAS VIEWPORT (With Smooth Slide Animation for Stage 2) ── */}
          <div className="w-full h-full absolute inset-0 overflow-hidden">
            <div
              className={`w-full h-full relative ${stage === 2 && stage2SlideState === "sliding-out"
                ? `transition-all duration-300 ease-in transform ${stage2SlideDirection === "left" ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"
                }`
                : stage === 2 && stage2SlideState === "sliding-in"
                  ? `transition-none transform ${stage2SlideDirection === "right" ? "translate-x-full opacity-0" : "-translate-x-full opacity-0"
                  }`
                  : "transition-all duration-350 ease-out transform translate-x-0 opacity-100"
                }`}
            >
              <Canvas>
                <Suspense fallback={null}>
                  <CarbonylStructure3D />
                </Suspense>
              </Canvas>
            </div>
          </div>

          {/* ── FAILURE / DIAGNOSTIC BANNER ── */}
          {lastFailureReason && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] max-w-lg w-[90%] pointer-events-auto">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="flex-1 font-sans font-medium">{lastFailureReason}</div>
                <button
                  type="button"
                  onClick={() => useCarbonylStructureStore.setState({ lastFailureReason: null })}
                  className="text-rose-500 hover:text-rose-900 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── MINIMAL FLOATING BOTTOM CONTROL DOCK ── */}
          {!showExplanationModal && !showSuccessModal && (
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-30 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto py-2 px-3.5 sm:px-5 rounded-full bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-lg flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 sm:gap-3">
              {/* Stage 1 Controls: Minimalist Bond Angle Slider */}
              {stage === 1 && (
                <>
                  <div className="flex items-center gap-2 min-w-[210px] sm:min-w-[240px]">
                    <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                      Bond Angle
                    </span>
                    <input
                      type="range"
                      min={110}
                      max={130}
                      step={0.5}
                      value={stage1MeasuredAngle}
                      onChange={(e) => setStage1MeasuredAngle(parseFloat(e.target.value))}
                      className="flex-1 accent-sky-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                    <span className="font-mono text-xs font-bold text-sky-700 w-12 text-right shrink-0">
                      {stage1MeasuredAngle.toFixed(1)}°
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={verifyStage1Planarity}
                    className="px-4 py-1.5 rounded-full font-mono text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    VERIFY PLANARITY
                  </button>
                </>
              )}

              {/* Stage 2 Controls: 3 Minimalist Pills */}
              {stage === 2 && (
                <>
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap hidden sm:inline">
                    Polarity:
                  </span>

                  {STAGE_2_OPTIONS.map((opt) => {
                    const isSel = stage2SelectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={stage2SlideState !== "idle"}
                        onClick={() => {
                          setStage2SelectedOption(opt.id);
                          // Direct submission on click for fast fluid flow
                          setTimeout(() => submitStage2Answer(), 50);
                        }}
                        className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition active:scale-95 cursor-pointer ${
                          isSel
                            ? "bg-sky-600 text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Stage 3 Controls: Rotate -> Join -> Heat Breakdown */}
              {stage === 3 && (
                <>
                  {!dimerLocked && !dimerDissociating && !dimerDissociated ? (
                    /* ── PHASE 1: Rotate Slider Only ── */
                    <div className="flex items-center gap-2.5 min-w-[230px] sm:min-w-[260px]">
                      <RotateCw
                        className={`w-4 h-4 shrink-0 ${
                          Math.abs(monomer2Rotation - 180) <= 15 ? "text-emerald-600" : "text-sky-600"
                        }`}
                      />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                        Rotate
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={5}
                        disabled={dimerJoining}
                        value={monomer2Rotation}
                        onChange={(e) => setMonomer2Rotation(parseInt(e.target.value, 10))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-60"
                      />
                      <span
                        className={`font-mono text-xs font-bold w-14 text-right ${
                          Math.abs(monomer2Rotation - 180) <= 15
                            ? "text-emerald-600"
                            : "text-slate-700"
                        }`}
                      >
                        {dimerJoining ? "Joining..." : `${monomer2Rotation}°`}
                      </span>
                    </div>
                  ) : (
                    /* ── PHASE 2: Heat Slider Replaces Rotate Once Connected ── */
                    <div className="flex items-center gap-2.5 min-w-[230px] sm:min-w-[260px] animate-in fade-in duration-200">
                      <Flame
                        className={`w-4 h-4 shrink-0 ${
                          temperature >= 120 ? "text-rose-500" : "text-slate-500"
                        }`}
                      />
                      <span className="font-mono text-[10px] font-bold text-slate-600 uppercase whitespace-nowrap">
                        Heat (Δ)
                      </span>
                      <input
                        type="range"
                        min={25}
                        max={150}
                        step={5}
                        disabled={dimerDissociating || dimerDissociated}
                        value={temperature}
                        onChange={(e) => setTemperature(parseInt(e.target.value, 10))}
                        className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <span
                        className={`font-mono text-xs font-bold w-12 text-right ${
                          temperature >= 120 ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        {temperature}°C
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          )}
        </div>
      )}

      {/* ── EXPLANATION MODAL (Standard Chemistry Simulation Template - Stage Specific) ── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-[100] bg-white/98 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {STAGE_EXPLANATIONS[stage]?.title || "Theory & Chemical Mechanisms"}
                </h2>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase font-mono">
                  {STAGE_EXPLANATIONS[stage]?.subtitle || `Stage ${stage} of 3`}
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

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
            {/* Concept Overview */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                Physical &amp; Orbital Mechanism
              </h3>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {STAGE_EXPLANATIONS[stage]?.concept}
              </p>
            </div>

            {/* Formulas Box */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Fundamental Equations &amp; Principles
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {STAGE_EXPLANATIONS[stage]?.formulas.map((f, fIdx) => (
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
                {STAGE_EXPLANATIONS[stage]?.steps.map((st) => (
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
              {STAGE_EXPLANATIONS[stage]?.conclusion}
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE SUCCESS MODAL (Standard Chemistry Dialog Layout) ── */}
      {showSuccessModal && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-emerald-300">
            {/* Emerald Trophy Icon Badge */}
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
              {stage === 1 &&
                "Formaldehyde displays strict trigonal planarity with 120.0° bond angles and perpendicular π-lobes."}
              {stage === 2 &&
                "All 3 molecules verified! Polar carbonyls possess high permanent dipoles (μ = 2.88 D) which align with the electric field, whereas non-polar hydrocarbons do not."}
              {stage === 3 &&
                "Thermal dissociation verified! At 25°C, Acetic Acid forms an 8-membered cyclic dimer (i = 0.50, M = 120 g/mol). Heating ≥ 120°C breaks the dual H-bonds back into monomers (i = 1.00, M = 60 g/mol)."}
            </p>

            <div className="flex items-center gap-2">
              {/* Retry Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  resetCurrentStage();
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                title="Retry this stage"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Retry</span>
              </button>

              {/* Explanation Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                title="View Explanation"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>

              {/* Next Stage / Complete */}
              {stage < 3 ? (
                <button
                  type="button"
                  onClick={() => setStage((stage + 1) as 1 | 2 | 3)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Next Stage &gt;</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExit}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Complete ✓</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
