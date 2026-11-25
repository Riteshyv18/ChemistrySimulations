"use client";

import React, { useState, Suspense } from "react";
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
  CircleDot,
  Check,
  X,
  Plus,
  Box,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import UnitCell3D, { CubicCellType } from "./UnitCell3D";

export interface UnitCellChallenge {
  id: string;
  level: number;
  crystalName: string;
  chemicalFormula: string;
  cellType: CubicCellType;
  cellTypeName: string;
  elementSymbol: string;
  atomColor: string;
  cornersRequired: boolean;
  bodyRequired: boolean;
  facesRequired: boolean;
  effectiveAtoms: number;
  calculationBreakdown: string;
  coordinationNumber: number;
  packingEfficiency: string;
  radiusRelation: string;
  description: string;
  hint: string;
}

export const UNIT_CELL_CHALLENGES: UnitCellChallenge[] = [
  {
    id: "polonium_sc",
    level: 1,
    crystalName: "Polonium (α-Po)",
    chemicalFormula: "Po (Rare Earth Metal)",
    cellType: "SC",
    cellTypeName: "Simple Cubic (Primitive)",
    elementSymbol: "Po",
    atomColor: "#0284C7", // Sky/Cyan metallic
    cornersRequired: true,
    bodyRequired: false,
    facesRequired: false,
    effectiveAtoms: 1,
    calculationBreakdown: "8 corners × (1/8 share per corner) = 1 atom/unit cell",
    coordinationNumber: 6,
    packingEfficiency: "52.4% (Least packed cubic arrangement)",
    radiusRelation: "a = 2r (atoms touch along the cube edge)",
    description: "Polonium is the only elemental solid that crystallizes in a primitive Simple Cubic lattice. Atoms occupy solely the 8 corners of the cube.",
    hint: "A Simple Cubic unit cell has particles placed ONLY at the 8 corners of the cube. No atoms sit at the body centre or on face planes.",
  },
  {
    id: "iron_bcc",
    level: 2,
    crystalName: "Alpha-Iron / Chromium",
    chemicalFormula: "α-Fe / Cr (High Strength Alloy)",
    cellType: "BCC",
    cellTypeName: "Body-Centred Cubic (BCC)",
    elementSymbol: "Fe",
    atomColor: "#3B82F6", // Deep Cobalt / Steel Blue
    cornersRequired: true,
    bodyRequired: true,
    facesRequired: false,
    effectiveAtoms: 2,
    calculationBreakdown: "[8 corners × 1/8] + [1 body centre × 1] = 2 atoms/unit cell",
    coordinationNumber: 8,
    packingEfficiency: "68.0% (Medium packing density)",
    radiusRelation: "4r = √3·a (atoms touch along body diagonal)",
    description: "Body-Centred Cubic metals like α-Fe, Cr, and W feature atoms at all 8 corners plus one unshared full atom sitting at the exact center of the unit cell.",
    hint: "For BCC, ensure you add the 8 Corner atoms AND place the 1 central Body Centre atom.",
  },
  {
    id: "copper_fcc",
    level: 3,
    crystalName: "Copper / Aluminium",
    chemicalFormula: "Cu / Al (Ductile Close-Packed)",
    cellType: "FCC",
    cellTypeName: "Face-Centred Cubic (FCC / CCP)",
    elementSymbol: "Cu",
    atomColor: "#EA580C", // Rich lustrous Copper orange
    cornersRequired: true,
    bodyRequired: false,
    facesRequired: true,
    effectiveAtoms: 4,
    calculationBreakdown: "[8 corners × 1/8] + [6 faces × 1/2] = 4 atoms/unit cell",
    coordinationNumber: 12,
    packingEfficiency: "74.0% (Maximum close-packed efficiency)",
    radiusRelation: "4r = √2·a (atoms touch along face diagonal)",
    description: "Face-Centred Cubic metals (Cu, Al, Ag, Au) are ductile with maximal packing. Atoms occupy all 8 corners plus the center of each of the 6 bounding cube faces.",
    hint: "For FCC, atoms sit at the 8 Corners and on all 6 Face Centres. There is no atom in the central body void.",
  },
];

export interface UnitCellBuilderGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function UnitCellBuilderGamePage({
  difficulty = "standard",
  onExit,
}: UnitCellBuilderGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Gameplay level state
  const [levelIndex, setLevelIndex] = useState(0);
  const currentChallenge = UNIT_CELL_CHALLENGES[levelIndex];

  // User-placed atom positions in the 3D cube
  const [placedCorners, setPlacedCorners] = useState(false);
  const [placedBody, setPlacedBody] = useState(false);
  const [placedFaces, setPlacedFaces] = useState(false);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showFinalCompletionModal, setShowFinalCompletionModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Reset placed atoms for current level
  const handleClear = () => {
    setPlacedCorners(false);
    setPlacedBody(false);
    setPlacedFaces(false);
  };

  // Toggle corners (8 atoms)
  const handleToggleCorners = () => {
    setPlacedCorners((prev) => !prev);
  };

  // Toggle body center (1 atom)
  const handleToggleBody = () => {
    setPlacedBody((prev) => !prev);
  };

  // Toggle face centers (6 atoms)
  const handleToggleFaces = () => {
    setPlacedFaces((prev) => !prev);
  };

  // Verify answer
  const handleVerify = () => {
    const isCornersCorrect = placedCorners === currentChallenge.cornersRequired;
    const isBodyCorrect = placedBody === currentChallenge.bodyRequired;
    const isFacesCorrect = placedFaces === currentChallenge.facesRequired;

    if (isCornersCorrect && isBodyCorrect && isFacesCorrect) {
      if (levelIndex < UNIT_CELL_CHALLENGES.length - 1) {
        setShowSuccessModal(true);
      } else {
        setShowFinalCompletionModal(true);
      }
    } else {
      // Diagnostic feedback explaining what is missing or incorrect
      const errors: string[] = [];
      if (currentChallenge.cornersRequired && !placedCorners) {
        errors.push("Missing 8 Corner atoms.");
      } else if (!currentChallenge.cornersRequired && placedCorners) {
        errors.push("Corner atoms should not be placed here.");
      }

      if (currentChallenge.bodyRequired && !placedBody) {
        errors.push("Missing central Body atom.");
      } else if (!currentChallenge.bodyRequired && placedBody) {
        errors.push("An atom was placed at the Body Centre, but this cell does not have a central atom.");
      }

      if (currentChallenge.facesRequired && !placedFaces) {
        errors.push("Missing 6 Face-Centred atoms.");
      } else if (!currentChallenge.facesRequired && placedFaces) {
        errors.push("Face-Centred atoms were placed, but this cell does not have face-centred atoms.");
      }

      setFailFeedback(`${errors.join(" ")} ${currentChallenge.hint}`);
      handleClear();
      setShowFailModal(true);
    }
  };

  // Next level
  const handleNextLevel = () => {
    setShowSuccessModal(false);
    if (levelIndex < UNIT_CELL_CHALLENGES.length - 1) {
      setLevelIndex((prev) => prev + 1);
      handleClear();
    } else {
      setShowFinalCompletionModal(true);
    }
  };

  // Replay current level
  const handleReplayCurrentLevel = () => {
    setShowSuccessModal(false);
    setShowFailModal(false);
    handleClear();
  };

  // Replay entire challenge
  const handleReplayChallenge = () => {
    setShowFinalCompletionModal(false);
    setLevelIndex(0);
    handleClear();
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ─── TOAST NOTIFICATION ─── */}
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
          <div className="max-w-3xl w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-4 space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-snug sm:leading-tight">
              <span className="text-blue-600 font-extrabold uppercase">MISSION:</span> Build the correct cubic unit cell to unlock the crystal structure!
            </h1>

            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreen("instructions")}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
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

          {/* 3 Step Guidance Cards (Using uploaded images 4, 5, 6 with clear simple instructions) */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 flex-1 my-1">
            <div className="grid grid-cols-3 gap-3.5 w-full items-stretch">
              {/* Card 1: Inspect 3D Unit Cell (Image 4) */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Inspect 3D Unit Cell
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Rotate the 3D cube to inspect empty positions at corners, faces, and the center.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions_unitcell_step1.png"
                    alt="Inspect 3D Unit Cell"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Card 2: Place Lattice Atoms (Image 5) */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Place Lattice Atoms
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Click the buttons to toggle Corner atoms, Body Centre, or Face Centre atoms.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions_unitcell_step2.png"
                    alt="Place Lattice Atoms"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Card 3: Verify Unit Cell (Image 6) */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Verify Unit Cell
                    </h3>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                    Click Verify Unit Cell to check your structure!
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions_unitcell_step3.png"
                    alt="Verify Unit Cell"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions: BACK and PLAY */}
          <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-2 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreen("mission")}
              className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen("lab")}
              className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: 3D LAB SCREEN (FULLSCREEN LANDSCAPE CANVAS & FLOATING UI)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30 flex flex-col justify-between">
          {/* ── 3D CANVAS (Fills Entire Middle Viewport) ── */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[1.15, 0.95, 5.4]} fov={38} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[6, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.4} color="#94A3B8" />
              <pointLight position={[0, 4, 0]} intensity={0.6} color="#BAE6FD" />

              <OrbitControls
                enablePan={false}
                minDistance={2.5}
                maxDistance={8.5}
                enableDamping
                dampingFactor={0.06}
              />

              <Suspense fallback={null}>
                <group position={[0, 0.08, 0]} scale={0.85}>
                  <UnitCell3D
                    hasCorners={placedCorners}
                    hasBody={placedBody}
                    hasFaces={placedFaces}
                    atomColor={currentChallenge.atomColor}
                    wireframeColor="#0F172A"
                    showGhostNodes={true}
                  />
                </group>
              </Suspense>
            </Canvas>
          </div>

          {/* ── Floating Top Header Bar ── */}
          <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Top-Left Exit Button (Unified Black Pill) */}
            <button
              onClick={handleExit}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            {/* Central Target Crystal Pill (Small & Compact) */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-900 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1.5">
                <span className="text-blue-600 font-extrabold">Level {currentChallenge.level}:</span>
                <span className="text-slate-900 font-black tracking-wide">
                  {currentChallenge.cellType === "SC"
                    ? "SC (Simple Cube)"
                    : currentChallenge.cellType === "BCC"
                    ? "BCC"
                    : "FCC"}
                </span>
              </span>
            </div>

            {/* Top-Right Explanation Button */}
            <button
              onClick={() => setShowExplanation(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── Floating Bottom Control Bar: Compact Standalone Buttons Without Outer Box ── */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-3 z-30 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              {/* Button 1: Toggle Corners (8 atoms) */}
              <button
                type="button"
                onClick={handleToggleCorners}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                  placedCorners
                    ? "bg-sky-600 text-white border-sky-500 shadow-sky-500/20 active:scale-95"
                    : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    placedCorners ? "border-white bg-white/20" : "border-slate-400"
                  }`}
                >
                  {placedCorners && <Check className="w-2 h-2 text-white" />}
                </div>
                <span>CORNERS (8)</span>
              </button>

              {/* Button 2: Toggle Body Centre (1 atom) */}
              <button
                type="button"
                onClick={handleToggleBody}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                  placedBody
                    ? "bg-amber-600 text-white border-amber-500 shadow-amber-500/20 active:scale-95"
                    : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    placedBody ? "border-white bg-white/20" : "border-slate-400"
                  }`}
                >
                  {placedBody && <Check className="w-2 h-2 text-white" />}
                </div>
                <span>BODY CENTRE (1)</span>
              </button>

              {/* Button 3: Toggle Face Centres (6 atoms) */}
              <button
                type="button"
                onClick={handleToggleFaces}
                className={`py-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                  placedFaces
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 active:scale-95"
                    : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                    placedFaces ? "border-white bg-white/20" : "border-slate-400"
                  }`}
                >
                  {placedFaces && <Check className="w-2 h-2 text-white" />}
                </div>
                <span>FACE CENTRES (6)</span>
              </button>

              {/* Primary Action Button: Verify Unit Cell */}
              <button
                type="button"
                onClick={handleVerify}
                className="py-1.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white active:scale-95 shadow-md shadow-blue-500/25 transition cursor-pointer"
              >
                <span>VERIFY UNIT CELL</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: LEVEL PASSED SUCCESS MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-2xl p-4 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Unit Cell Completed!
            </h3>

            <p className="text-[11.5px] text-slate-600 mb-2 leading-snug">
              Excellent! You built the correct <strong>{currentChallenge.cellTypeName}</strong> for {currentChallenge.crystalName}.
            </p>

            <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[10.5px] mb-3 text-slate-800 space-y-1">
              <div className="text-emerald-700 font-bold leading-tight">
                ✓ Atoms per Unit Cell (Z): {currentChallenge.effectiveAtoms}
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                • {currentChallenge.calculationBreakdown}
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                • Coordination Number: {currentChallenge.coordinationNumber}
              </div>
              <div className="text-[10px] text-slate-600 leading-tight">
                • Packing Efficiency: {currentChallenge.packingEfficiency}
              </div>
            </div>

            {/* 2 Buttons: REPLAY and NEXT LEVEL */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplayCurrentLevel}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
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

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: INCORRECT BUILD MODAL (With Retry & Explanation)
          ══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-rose-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2.5">
              <XCircle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              Incorrect Unit Cell!
            </h3>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {failFeedback}
            </p>

            {/* 2 Buttons: RETRY and EXPLANATION */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  handleClear();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanation(true);
                  handleClear();
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

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: FINAL CHALLENGE COMPLETED MODAL (Compact Layout)
          ══════════════════════════════════════════════════════════════════ */}
      {showFinalCompletionModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-[330px] bg-white rounded-2xl p-3.5 shadow-2xl border border-emerald-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1.5 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-black text-slate-900 mb-0.5">
              Unit Cells Mastered!
            </h3>

            <p className="text-[10.5px] text-slate-600 mb-2 leading-snug">
              Outstanding work! You mastered the atomic architecture of SC, BCC, and FCC crystal lattices.
            </p>

            <div className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[10px] mb-2.5 text-slate-800 space-y-0.5">
              <div className="flex items-center justify-between text-emerald-700 font-bold mb-0.5">
                <span>Summary of Cubic Systems:</span>
                <span>3 / 3 Complete</span>
              </div>
              <div className="text-[9.5px] text-slate-600 leading-tight">
                • <strong>Simple Cubic (SC):</strong> Z = 1, Coord No. = 6, 52.4%<br />
                • <strong>Body-Centred (BCC):</strong> Z = 2, Coord No. = 8, 68.0%<br />
                • <strong>Face-Centred (FCC):</strong> Z = 4, Coord No. = 12, 74.0%
              </div>
            </div>

            {/* 2 Buttons: REPLAY and EXPLANATION */}
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplayChallenge}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFinalCompletionModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FULLSCREEN EXPLANATION MODAL (Clean Single-Column Layout)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Unit Cells, Crystal Lattices &amp; Types of Cubic Unit Cells
                </h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Solid State Fundamentals • Atomic Coordinate Geometry &amp; Packing Fractions
                </p>
              </div>
            </div>

            {/* Circular Cross Button */}
            <button
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full border border-slate-300 hover:border-slate-500 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
              title="Close Explanation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Single Column Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-slate-700 max-w-3xl mx-auto w-full text-xs sm:text-sm leading-relaxed">
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                1. What is a Space Lattice and a Unit Cell?
              </h3>
              <p className="mb-2">
                A <strong>crystal lattice</strong> (or space lattice) is a regular, repeating three-dimensional array of points in space, where each point represents the constituent particle (an atom, ion, or molecule) of a crystalline solid.
              </p>
              <p>
                A <strong>unit cell</strong> is the smallest repeating structural unit of the space lattice which, when repeated over and over again in three dimensions, generates the entire macroscopic crystal.
              </p>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                2. Corner, Body, and Face Sharing Contributions
              </h3>
              <p className="mb-2">
                Because unit cells pack edge-to-edge and face-to-face in all three dimensions, atoms sitting on boundaries are shared between neighboring unit cells:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>
                  <strong>Corner Atom (1/8 share):</strong> A corner atom is shared simultaneously by 8 adjacent cubes. Hence, each unit cell receives only <span className="font-bold text-blue-700">1/8</span> of that atom.
                </li>
                <li>
                  <strong>Face-Centred Atom (1/2 share):</strong> An atom at the center of any face is shared between 2 adjacent cubes touching that face, contributing <span className="font-bold text-emerald-700">1/2</span> of an atom.
                </li>
                <li>
                  <strong>Body-Centred Atom (1 share):</strong> An atom at the exact center of the cube belongs entirely to that single unit cell and is not shared with any neighbor (<span className="font-bold text-amber-700">full 1.0</span> share).
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                3. The Three Types of Cubic Unit Cells
              </h3>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-blue-700 text-xs sm:text-sm mb-1">
                    A. Simple Cubic (Primitive / SC)
                  </h4>
                  <p className="mb-1">
                    Atoms sit strictly at the 8 corners of the cube.
                  </p>
                  <p className="font-mono text-[11px] text-slate-600">
                    • Total atoms per unit cell (Z) = 8 × (1/8) = <strong>1 atom</strong><br />
                    • Coordination number = <strong>6</strong><br />
                    • Relation between edge length (a) and radius (r): <strong>a = 2r</strong><br />
                    • Packing efficiency = <strong>52.4%</strong> (leaves 47.6% empty space)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-amber-700 text-xs sm:text-sm mb-1">
                    B. Body-Centred Cubic (BCC)
                  </h4>
                  <p className="mb-1">
                    Atoms sit at all 8 corners plus one full atom at the body centre.
                  </p>
                  <p className="font-mono text-[11px] text-slate-600">
                    • Total atoms per unit cell (Z) = [8 × (1/8)] + [1 × 1] = <strong>2 atoms</strong><br />
                    • Coordination number = <strong>8</strong><br />
                    • Relation between a and r: <strong>4r = √3 · a</strong><br />
                    • Packing efficiency = <strong>68.0%</strong> (e.g. Iron, Chromium, Tungsten)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <h4 className="font-bold text-emerald-700 text-xs sm:text-sm mb-1">
                    C. Face-Centred Cubic (FCC / CCP)
                  </h4>
                  <p className="mb-1">
                    Atoms sit at all 8 corners plus at the center of all 6 faces.
                  </p>
                  <p className="font-mono text-[11px] text-slate-600">
                    • Total atoms per unit cell (Z) = [8 × (1/8)] + [6 × (1/2)] = <strong>4 atoms</strong><br />
                    • Coordination number = <strong>12</strong><br />
                    • Relation between a and r: <strong>4r = √2 · a</strong><br />
                    • Packing efficiency = <strong>74.0%</strong> (highest possible packing; e.g. Cu, Al, Ag, Au)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base mb-2">
                4. Summary Comparison Table
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="p-2 border border-slate-200">Unit Cell Type</th>
                      <th className="p-2 border border-slate-200">Atom Sites</th>
                      <th className="p-2 border border-slate-200">Total Atoms (Z)</th>
                      <th className="p-2 border border-slate-200">Coord. No.</th>
                      <th className="p-2 border border-slate-200">Packing %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-200 font-bold text-blue-700">Simple Cubic (SC)</td>
                      <td className="p-2 border border-slate-200">8 Corners only</td>
                      <td className="p-2 border border-slate-200 font-mono">1</td>
                      <td className="p-2 border border-slate-200 font-mono">6</td>
                      <td className="p-2 border border-slate-200 font-mono">52.4%</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2 border border-slate-200 font-bold text-amber-700">Body-Centred (BCC)</td>
                      <td className="p-2 border border-slate-200">8 Corners + 1 Body</td>
                      <td className="p-2 border border-slate-200 font-mono">2</td>
                      <td className="p-2 border border-slate-200 font-mono">8</td>
                      <td className="p-2 border border-slate-200 font-mono">68.0%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-200 font-bold text-emerald-700">Face-Centred (FCC)</td>
                      <td className="p-2 border border-slate-200">8 Corners + 6 Faces</td>
                      <td className="p-2 border border-slate-200 font-mono">4</td>
                      <td className="p-2 border border-slate-200 font-mono">12</td>
                      <td className="p-2 border border-slate-200 font-mono">74.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-center p-3 border-t border-slate-200 shrink-0 bg-white">
            <button
              onClick={() => setShowExplanation(false)}
              className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

