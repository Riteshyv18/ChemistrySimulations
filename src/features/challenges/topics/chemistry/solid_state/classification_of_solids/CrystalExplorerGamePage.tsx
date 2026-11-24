"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
  Gem,
  Compass,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import CrystalSolid3D, { SolidSampleConfig, SolidSampleType } from "./CrystalSolid3D";

// ============================================================================
// 5 DIVERSE SOLID STATE SAMPLES (MIX OF CRYSTALLINE & AMORPHOUS)
// ============================================================================
export const SOLID_SAMPLES: SolidSampleConfig[] = [
  {
    id: "quartz_crystal",
    name: "Quartz Crystal",
    chemicalFormula: "SiO₂ (Crystalline)",
    category: "crystalline",
    atomicSystem: "hexagonal",
    primaryColor: "#0284C7", // Bright crystalline sky-blue
    secondaryColor: "#38BDF8",
    particleRadius: 0.17,
    modelScale: 0.88, // 1st image: Zoom out with small margin so top & bottom are comfortably framed
    modelOffset: [0, 0, 0],
    description: "Natural crystalline quartz featuring a strict hexagonal repeating framework with long-range order.",
    hint: "Notice the symmetric repeating geometric pattern extending identically in all directions across the lattice.",
  },
  {
    id: "silica_glass",
    name: "Quartz Glass",
    chemicalFormula: "SiO₂ (Amorphous Glass)",
    category: "amorphous",
    atomicSystem: "amorphous_glass",
    primaryColor: "#0D9488", // Teal glass
    secondaryColor: "#2DD4BF",
    particleRadius: 0.165,
    modelScale: 0.68, // Zoomed out comfortably so it has breathing room from top bar and bottom buttons
    modelOffset: [0, 0.05, 0],
    description: "Fused silica glass formed by rapid cooling. Particles show local bonding but lack long-range periodicity.",
    hint: "Notice that while nearby particles connect, the bond angles and distances vary randomly with no repeating unit cell.",
  },
  {
    id: "table_salt",
    name: "Rock Salt (Sodium Chloride)",
    chemicalFormula: "NaCl (FCC Lattice)",
    category: "crystalline",
    atomicSystem: "fcc",
    primaryColor: "#8B5CF6", // Purple Na+
    secondaryColor: "#10B981", // Green Cl-
    particleRadius: 0.16,
    modelScale: 0.88, // 3rd image: Zoom out with small margin
    modelOffset: [0, 0, 0],
    description: "Classic ionic solid where Na⁺ and Cl⁻ ions alternate in a perfectly ordered face-centered cubic lattice.",
    hint: "Observe the alternating colored ions forming a strict cubic unit cell repeated uniformly throughout space.",
  },
  {
    id: "metallic_copper",
    name: "Metallic Copper",
    chemicalFormula: "Cu (Close-Packed)",
    category: "crystalline",
    atomicSystem: "simple_cubic",
    primaryColor: "#F59E0B", // Bright metallic amber/copper
    particleRadius: 0.175,
    modelScale: 0.85, // 4th image: Zoom out little with small margin
    modelOffset: [0, 0, 0],
    description: "Close-packed crystalline metallic lattice with identical atoms arranged in uniform repeating columns and rows.",
    hint: "Every single metal atom sits at an exact, predictable lattice coordinate with high geometric symmetry.",
  },
  {
    id: "polymer_tar",
    name: "Organic Rubber / Tar",
    chemicalFormula: "C₅H₈ (Amorphous Polymer)",
    category: "amorphous",
    atomicSystem: "amorphous_cluster",
    primaryColor: "#475569", // Slate grey/charcoal
    secondaryColor: "#64748B",
    particleRadius: 0.175,
    modelScale: 1.25, // 5th image: Zoom in so it's clearly visible and not small
    modelOffset: [0, 0, 0],
    description: "Complex polymer chains frozen in a tangled, non-periodic arrangement lacking regular geometric faces.",
    hint: "The atoms form an irregular, disordered cluster with no flat crystal planes or repeating lattice vectors.",
  },
];

interface CrystalExplorerGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function CrystalExplorerGamePage({
  onExit,
}: CrystalExplorerGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Sample sequence
  const [sampleIndex, setSampleIndex] = useState(0);
  const currentSample = SOLID_SAMPLES[sampleIndex];

  // Feedback & Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState("");

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const handleResetGame = () => {
    setSampleIndex(0);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
  };

  // Handle classification answer
  const handleClassify = (selectedType: SolidSampleType) => {
    const isCorrect = selectedType === currentSample.category;

    if (isCorrect) {
      if (sampleIndex < SOLID_SAMPLES.length - 1) {
        setNotification(
          `✓ Correct! ${currentSample.name} is ${currentSample.category.toUpperCase()}! Loading next sample...`
        );
        setTimeout(() => setNotification(null), 2500);
        setSampleIndex((prev) => prev + 1);
      } else {
        // Mastered all 5 samples!
        setShowVictoryModal(true);
      }
    } else {
      setIncorrectFeedback(
        `${currentSample.name} is actually ${currentSample.category.toUpperCase()}! ${currentSample.hint}`
      );
      setShowIncorrectModal(true);
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ─── TOAST NOTIFICATION (Vibrant Green for Correct Classification) ─── */}
      {notification && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2 rounded-full text-xs font-black tracking-wide shadow-xl border border-emerald-400 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none text-center max-w-[90%] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 1: MISSION SCREEN (LANDSCAPE STUDIO DESIGN)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-6 sm:p-7 relative bg-white">
          {/* Top Bar with EXIT */}
          <div className="w-full flex items-center justify-start z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Central Mission Statement */}
          <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-4 space-y-4">

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-[#0284C7] font-extrabold uppercase">MISSION:</span> Inspect the 3D atomic arrangement of unknown solid samples and classify them as Crystalline or Amorphous!
            </h2>



            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreen("instructions")}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 2: INSTRUCTIONS SCREEN (LANDSCAPE STUDIO DESIGN)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden">
          {/* Top Bar with EXIT and INSTRUCTIONS TO PLAY badge */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-slate-900 to-slate-900 rounded-full hidden sm:block" />
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-900 bg-slate-100 px-3.5 py-1 rounded-full border border-slate-300 shadow-2xs">
                INSTRUCTIONS TO PLAY
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-l from-transparent via-slate-900 to-slate-900 rounded-full hidden sm:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Step Guidance Cards */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 flex-1 my-1">
            <div className="grid grid-cols-3 gap-3.5 w-full items-stretch">
              {/* Card 1: Explore & Rotate */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Explore the Sample
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Rotate and zoom the 3D solid to inspect how its atomic bonds are connected.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 flex items-center justify-center mt-2 shadow-inner p-2 text-center">
                  <div className="flex flex-col items-center gap-1 text-sky-400">
                    <Compass className="w-6 h-6 animate-spin duration-1000" />
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                      360° 3D ROTATION
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Inspect Arrangement */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Inspect Arrangement
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Observe whether atoms form an ordered lattice or a disordered network.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 flex items-center justify-center mt-2 shadow-inner p-2 text-center">
                  <div className="flex items-center gap-3 text-xs font-mono font-black">
                    <span className="text-emerald-400">ORDERED</span>
                    <span className="text-slate-500">vs</span>
                    <span className="text-amber-400">IRREGULAR</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Classify & Advance */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Make a Decision
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Select Crystalline or Amorphous to verify your answer and proceed.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 flex items-center justify-center mt-2 shadow-inner p-2 gap-2">
                  <div className="px-2 py-1 rounded bg-sky-600 text-white font-mono text-[9px] font-bold">
                    CRYSTALLINE
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-700 text-white font-mono text-[9px] font-bold">
                    AMORPHOUS
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-2 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreen("mission")}
              className="flex items-center gap-1.5 h-9 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen("lab")}
              className="flex items-center justify-center gap-1.5 h-9 px-8 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/25 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: INTERACTIVE LAB (SINGLE FULLSCREEN 3D CANVAS)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative z-10 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] flex flex-col items-center justify-between">
          {/* FULL SCREEN 3D WEBGL CANVAS VIEWPORT */}
          <div className="absolute inset-0 w-full h-full z-0">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
              {/* Zoomed in closer (z: 4.6, y: 0.25) so user can easily inspect particle structure */}
              <PerspectiveCamera makeDefault position={[0, 0.25, 4.6]} fov={38} />
              <OrbitControls
                enablePan={false}
                minDistance={2.5}
                maxDistance={8.0}
                maxPolarAngle={Math.PI / 1.8}
              />
              <ambientLight intensity={1.3} />
              <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow />
              <directionalLight position={[-4, 3, -2]} intensity={0.8} color="#BAE6FD" />
              <pointLight position={[0, 2, 3]} intensity={0.9} />

              <Suspense fallback={null}>
                {/* Shifted slightly downward to center the solid specimen perfectly in view */}
                <group key={currentSample.id} position={[0, 0.35, 0]}>
                  <CrystalSolid3D sample={currentSample} />
                </group>
              </Suspense>
            </Canvas>
          </div>

          {/* FLOATING TOP BAR: EXIT & EXPLANATION */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Left: Exit Button */}
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            {/* Right: Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanation(true)}
              className="pointer-events-auto flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* FLOATING BOTTOM CONTROLS: CRYSTALLINE OR AMORPHOUS (Direct Pill Buttons, Compact Width) */}
          <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 z-30 flex items-center justify-center pointer-events-none px-4">
            <div className="pointer-events-auto flex items-center justify-center gap-2.5 max-w-xs sm:max-w-[340px] w-full">
              {/* Option 1: Crystalline */}
              <button
                type="button"
                onClick={() => handleClassify("crystalline")}
                className="flex-1 py-2 px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border border-sky-400/40"
              >
                <Gem className="w-3.5 h-3.5 text-sky-200" />
                <span>CRYSTALLINE</span>
              </button>

              {/* Option 2: Amorphous */}
              <button
                type="button"
                onClick={() => handleClassify("amorphous")}
                className="flex-1 py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-slate-900/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700/60"
              >
                <Layers className="w-3.5 h-3.5 text-slate-300" />
                <span>AMORPHOUS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VICTORY MODAL (COMPACT WITH REPLAY & EXPLANATION)
          ══════════════════════════════════════════════════════════════════ */}
      {showVictoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[290px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Classification Master!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              You correctly classified all <strong>{SOLID_SAMPLES.length} solid samples</strong> as Crystalline or Amorphous based on their 3D particle arrangement!
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleResetGame}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVictoryModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          INCORRECT HINT MODAL (COMPACT WITH RETRY & EXPLANATION)
          ══════════════════════════════════════════════════════════════════ */}
      {showIncorrectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-rose-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-2 text-rose-600 shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-black text-slate-900 mb-1 leading-tight">
              Incorrect Classification
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              {incorrectFeedback}
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowIncorrectModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowIncorrectModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EDUCATIONAL EXPLANATION FULLSCREEN VIEW (CLEAN, NO EXTRA BOXES)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-200 select-text overflow-y-auto">
          {/* Top Bar with Title and Close Button */}
          <div className="w-full flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Classification of Solids: Crystalline vs Amorphous
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Fundamental comparison of particle arrangement, symmetry, and thermal properties
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition-all cursor-pointer active:scale-90"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Clean Single-Column Detailed Explanation Content */}
          <div className="py-6 flex-1 max-w-3xl w-full mx-auto space-y-7 text-slate-800">
            {/* Section 1: Introduction */}
            <div className="space-y-2">
              <h3 className="text-[17px] sm:text-lg font-black text-slate-900 border-b border-slate-200 pb-1.5">
                1. What Are Solids?
              </h3>
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                In solid matter, atoms, ions, or molecules are packed closely together by strong chemical or intermolecular forces. Because the particles cannot move freely from place to place, solids have a fixed shape and volume. However, based on <strong>how the particles are arranged inside</strong>, all solids are classified into two broad categories: <strong>Crystalline</strong> and <strong>Amorphous</strong>.
              </p>
            </div>

            {/* Section 2: Crystalline Solids */}
            <div className="space-y-3">
              <h3 className="text-[17px] sm:text-lg font-black text-slate-900 border-b border-slate-200 pb-1.5">
                2. Crystalline Solids (True Solids)
              </h3>
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                In a crystalline solid, particles are arranged in a perfectly orderly, repeating 3D pattern called a <strong>crystal lattice</strong>. This regular order repeats consistently over large atomic distances (known as <strong>long-range order</strong>).
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-[15px] text-slate-700 pl-1 leading-relaxed">
                <li>
                  <strong>Sharp Melting Point:</strong> Because every unit cell in the crystal lattice has identical bond strengths, all bonds break at the exact same temperature. For example, ice melts sharply at 0 °C (273 K).
                </li>
                <li>
                  <strong>Anisotropic Properties:</strong> Physical properties such as electrical conductivity, refractive index, and thermal expansion have different values when measured along different directions in the crystal, because particle spacing changes along different angles.
                </li>
                <li>
                  <strong>Definite Cleavage:</strong> When sliced with a sharp tool, crystalline solids split cleanly along flat, smooth geometric planes.
                </li>
                <li>
                  <strong>Real-World Examples:</strong> Table salt (NaCl), quartz crystal, diamond, graphite, ice, copper, and iron.
                </li>
              </ul>
            </div>

            {/* Section 3: Amorphous Solids */}
            <div className="space-y-3">
              <h3 className="text-[17px] sm:text-lg font-black text-slate-900 border-b border-slate-200 pb-1.5">
                3. Amorphous Solids (Pseudo Solids or Supercooled Liquids)
              </h3>
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                The word <em>amorphous</em> comes from Greek meaning &quot;without form&quot;. In an amorphous solid, particles are arranged randomly without any regular repeating 3D pattern. While nearby neighbors may temporarily bond (<strong>short-range order</strong>), there is no long-range pattern across the material.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-[15px] text-slate-700 pl-1 leading-relaxed">
                <li>
                  <strong>Gradual Softening Range:</strong> Since different bonds have irregular lengths and angles, they break at different temperatures. An amorphous solid softens gradually over a wide temperature range before becoming liquid (e.g. glass blowing).
                </li>
                <li>
                  <strong>Isotropic Properties:</strong> Because particle arrangement is completely random and disordered in all directions, physical properties like refractive index and thermal conductivity are identical regardless of direction.
                </li>
                <li>
                  <strong>Irregular Cleavage:</strong> When broken, amorphous solids shatter into irregular, curved surfaces with no flat faces (known as conchoidal fracture).
                </li>
                <li>
                  <strong>Real-World Examples:</strong> Window glass, silica glass (fused quartz), rubber, plastic polymers, pitch, and tar.
                </li>
              </ul>
            </div>

            {/* Section 4: Practical Example */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h3 className="text-[17px] sm:text-lg font-black text-slate-900">
                4. Why Quartz vs. Quartz Glass Illustrates the Core Concept
              </h3>
              <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                Both <strong>crystalline quartz</strong> and <strong>quartz glass</strong> have the exact same chemical formula (SiO₂). In crystalline quartz, the SiO₄ tetrahedra connect in orderly, repeating hexagonal rings, giving it a sharp melting point and directional optical properties. When quartz is melted and cooled very rapidly, the atoms do not have time to organize into a crystal lattice and freeze into a tangled, disordered network — creating amorphous quartz glass!
              </p>
            </div>
          </div>

          {/* Bottom Bar with RESUME CHALLENGE button */}
          <div className="w-full flex items-center justify-center pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="py-2.5 px-8 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-sky-600/25"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

