"use client";

import React, { useState, useRef, Suspense } from "react";
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
  X,
  Check,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import CrystalPacking3D, { LayerType } from "./CrystalPacking3D";

interface StackingLevel {
  level: number;
  targetLabel: string;
  packingRevealTitle: string;
  sequence: LayerType[]; // Includes initial "A" at index 0
  successExplanation: string;
}

const STACKING_LEVELS: StackingLevel[] = [
  {
    level: 1,
    targetLabel: "Hexagonal Close Packing (HCP)",
    packingRevealTitle: "Hexagonal Close Packing (HCP) Completed!",
    sequence: ["A", "B", "A", "B"],
    successExplanation:
      "You built Hexagonal Close Packing (HCP)! The 3rd layer aligns directly over the 1st layer, giving Coordination Number = 12 and 74.0% packing efficiency.",
  },
  {
    level: 2,
    targetLabel: "Cubic Close Packing (CCP / FCC)",
    packingRevealTitle: "Cubic Close Packing (CCP / FCC) Completed!",
    sequence: ["A", "B", "C", "A"],
    successExplanation:
      "You built Cubic Close Packing (CCP / FCC)! The 3rd layer sits in the remaining hollows offset from the first two layers, giving CN = 12 and 74.0% packing efficiency.",
  },
];

interface CrystalPackingGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function CrystalPackingGamePage({
  onExit,
}: CrystalPackingGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Level & Layer State
  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = STACKING_LEVELS[levelIndex];
  const [placedLayers, setPlacedLayers] = useState<LayerType[]>(["A"]);
  const [selectedLayer, setSelectedLayer] = useState<LayerType | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Modals & Notifications
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showFinalCompletionModal, setShowFinalCompletionModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expectedNextLayer: LayerType | null =
    placedLayers.length < currentLevel.sequence.length
      ? currentLevel.sequence[placedLayers.length]
      : null;

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const handleAttemptPlace = () => {
    if (isCompleted || !expectedNextLayer) return;

    if (!selectedLayer) {
      setNotification("Select Layer A, B, or C first, then drag or tap Snap!");
      setTimeout(() => setNotification(null), 2200);
      return;
    }

    if (selectedLayer === expectedNextLayer) {
      const nextPlaced = [...placedLayers, selectedLayer];
      setPlacedLayers(nextPlaced);
      setSelectedLayer(null);

      if (nextPlaced.length === currentLevel.sequence.length) {
        // Level completed! Rotate crystal and reveal packing type, then show modal
        setIsCompleted(true);
        setNotification(`✓ ${currentLevel.packingRevealTitle}`);
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        revealTimerRef.current = setTimeout(() => {
          setNotification(null);
          if (levelIndex < STACKING_LEVELS.length - 1) {
            setShowSuccessModal(true);
          } else {
            setShowFinalCompletionModal(true);
          }
        }, 1600);
      } else {
        setNotification(`✓ Layer ${selectedLayer} snapped into place! Place the next layer.`);
        setTimeout(() => setNotification(null), 2000);
      }
    } else {
      const prevLayer = placedLayers[placedLayers.length - 1];
      const reason =
        selectedLayer === prevLayer
          ? `Layer ${selectedLayer} cannot sit directly on top of Layer ${prevLayer} — close packing places atoms into staggered hollows!`
          : `That layer does not match ${currentLevel.targetLabel}. Think about how the layers align or check Explanation for help!`;
      setFailFeedback(reason);
      setSelectedLayer(null);
      setShowFailModal(true);
    }
  };

  const handleNextLevel = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setShowSuccessModal(false);
    setIsCompleted(false);
    setSelectedLayer(null);
    setPlacedLayers(["A"]);
    if (levelIndex < STACKING_LEVELS.length - 1) {
      setLevelIndex((prev) => prev + 1);
    } else {
      setShowFinalCompletionModal(true);
    }
  };

  const handleReplayCurrentLevel = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setShowSuccessModal(false);
    setIsCompleted(false);
    setSelectedLayer(null);
    setPlacedLayers(["A"]);
  };

  const handleReplayChallenge = () => {
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setShowFinalCompletionModal(false);
    setLevelIndex(0);
    setIsCompleted(false);
    setSelectedLayer(null);
    setPlacedLayers(["A"]);
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ─── TOAST NOTIFICATION ─── */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl text-xs font-bold tracking-wide shadow-xl border border-emerald-400 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none text-center max-w-[85%] flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 1: MISSION SCREEN (PORTRAIT STUDIO DESIGN)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-5 sm:p-7 relative bg-white">
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
          <div className="max-w-md w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-5 space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug text-center">
              <span className="text-blue-600 font-black uppercase">MISSION:</span>{" "}
              Arrange the atom layers in order to make HCP and FCC crystals!
            </h1>

            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreen("instructions")}
                className="w-32 sm:w-36 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
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
          SCREEN 2: INSTRUCTIONS SCREEN (PORTRAIT VERTICAL STACK)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden">
          {/* Top Header: EXIT on top-left */}
          <div className="w-full flex items-center justify-start z-10 shrink-0 pt-2 sm:pt-2.5">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          {/* 3 Step Guidance Cards + INSTRUCTIONS TO PLAY Tab: Vertically Centered Together */}
          <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center z-10 px-1 flex-1 my-auto space-y-2 sm:space-y-2.5 py-1.5">
            {/* INSTRUCTIONS TO PLAY Tab */}
            <div className="mb-10 sm:mb-12 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-5 py-1.5 rounded-full shadow-sm">
              INSTRUCTIONS TO PLAY
            </div>

            {/* Card 1: Select the Next Layer */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                    1
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                    Select Layer A, B, or C
                  </h3>
                </div>
                <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-2">
                  Bottom Layer A is already placed. Choose the next layer (A, B, or C) from the bottom buttons.
                </p>
              </div>
              <div className="w-full h-14 sm:h-16 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1 gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-black shadow-2xs">
                  LAYER A
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-black shadow-2xs">
                  LAYER B
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black shadow-2xs">
                  LAYER C
                </span>
              </div>
            </div>

            {/* Card 2: Drag & Snap into Highlighted Position */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                    2
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                    Drag &amp; Snap onto Target
                  </h3>
                </div>
                <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-2">
                  Drag the loose spheres onto the highlighted zone above the crystal (or tap Snap Layer).
                </p>
              </div>
              <div className="w-full h-14 sm:h-16 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1">
                <img
                  src="/instructions_packing_step2.png"
                  alt="Drag and Snap Layer onto Target"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 3: Complete Stacking Sequence */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                    3
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                    Reveal Packing Type
                  </h3>
                </div>
                <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-2">
                  Complete the layer stacking for HCP and CCP/FCC to watch the finished crystal rotate!
                </p>
              </div>
              <div className="w-full h-14 sm:h-16 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1">
                <span className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  SNAP LAYER
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions: BACK and PLAY */}
          <div className="w-full flex items-center justify-center gap-4 max-w-sm mx-auto pt-2 pb-1 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreen("mission")}
              className="w-28 sm:w-32 flex items-center justify-center gap-1.5 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen("lab")}
              className="w-28 sm:w-32 flex items-center justify-center gap-1.5 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: 3D LAB SCREEN (SINGLE FULLSCREEN CANVAS + FLOATING UI)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative overflow-hidden bg-white flex flex-col justify-between">
          {/* ── 3D CANVAS (Middle Canvas Covering Whole Screen, Shifted Upward for Portrait) ── */}
          <div className="absolute -top-8 sm:-top-10 bottom-24 sm:bottom-28 left-0 right-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[1.35, 1.35, 6.8]} fov={38} />
              <ambientLight intensity={0.85} />
              <directionalLight position={[6, 8, 5]} intensity={1.2} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.45} color="#94A3B8" />
              <pointLight position={[0, 4, 0]} intensity={0.6} color="#BAE6FD" />

              <OrbitControls
                enabled={!isDraggingLayer}
                target={[0.1, 0.15, 0]}
                enablePan={false}
                minDistance={3.2}
                maxDistance={12.0}
                enableDamping
                dampingFactor={0.06}
              />

              <Suspense fallback={null}>
                <group position={[0, 0.05, 0]} scale={0.51}>
                  <CrystalPacking3D
                    placedLayers={placedLayers}
                    expectedNextLayer={expectedNextLayer}
                    selectedLayer={selectedLayer}
                    isCompleted={isCompleted}
                    onDragStateChange={setIsDraggingLayer}
                    onAttemptPlace={handleAttemptPlace}
                  />
                </group>
              </Suspense>
            </Canvas>
          </div>

          {/* ── Floating Top Header Bar (EXIT, EXPLANATION, and Centered Target Pill) ── */}
          <div className="absolute top-0 left-0 right-0 p-2.5 sm:p-3 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-full flex items-center justify-between pointer-events-none">
              <button
                onClick={handleExit}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>EXIT</span>
              </button>

              <button
                onClick={() => setShowExplanation(true)}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>

            {/* Central Target Pill */}
            <div className="pointer-events-auto mt-2 sm:mt-2.5 flex flex-col items-center gap-1">
              <span className="text-[10.5px] sm:text-[11px] font-black text-slate-900 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1 whitespace-nowrap">
                <span className="text-blue-600 font-extrabold">Target:</span>
                <span className="text-slate-900 font-black tracking-wide">
                  {currentLevel.targetLabel}
                </span>
              </span>
            </div>
          </div>

          {/* ── Floating Bottom Control Bar: Stack Progress Pill + 2×2 Layer & Snap Grid ── */}
          <div className="absolute bottom-4.5 sm:bottom-5.5 left-0 right-0 px-3 sm:px-4 z-30 flex flex-col items-center justify-center pointer-events-none gap-2">
            {/* Compact Stack Sequence Indicator */}
            <div className="pointer-events-auto px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-xs flex items-center gap-1.5 text-[10.5px] font-mono font-bold text-slate-700">
              <span className="text-slate-500 uppercase">Stack:</span>
              {currentLevel.sequence.map((_, idx) => {
                const placed = placedLayers[idx];
                return (
                  <span
                    key={idx}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      placed === "A"
                        ? "bg-sky-600 text-white"
                        : placed === "B"
                        ? "bg-teal-600 text-white"
                        : placed === "C"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-400 border border-dashed border-slate-300"
                    }`}
                  >
                    {placed || "?"}
                  </span>
                );
              })}
            </div>

            {/* 2×2 Layer Options (A, B, C) + Snap Layer */}
            <div className="pointer-events-auto w-full max-w-sm grid grid-cols-2 gap-2 sm:gap-2.5">
              {(["A", "B", "C"] as LayerType[]).map((layer) => {
                const isSelected = selectedLayer === layer;
                const activeStyle =
                  layer === "A"
                    ? "bg-sky-600 text-white border-sky-500 shadow-sky-500/20"
                    : layer === "B"
                    ? "bg-teal-600 text-white border-teal-500 shadow-teal-500/20"
                    : "bg-amber-500 text-white border-amber-400 shadow-amber-500/20";

                return (
                  <button
                    key={layer}
                    type="button"
                    disabled={isCompleted}
                    onClick={() => setSelectedLayer(layer)}
                    className={`h-11 sm:h-12 w-full px-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-tight whitespace-nowrap flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                      isSelected
                        ? `${activeStyle} active:scale-95`
                        : "bg-white/95 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? "border-white bg-white/20" : "border-slate-400"
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span>LAYER {layer}</span>
                  </button>
                );
              })}

              {/* Button 4: Snap Selected Layer into Position */}
              <button
                type="button"
                disabled={isCompleted}
                onClick={handleAttemptPlace}
                className="h-11 sm:h-12 w-full px-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-tight whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <span>SNAP LAYER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: LEVEL 1 SUCCESS MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              {currentLevel.targetLabel} Built!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              {currentLevel.successExplanation}
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleReplayCurrentLevel}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={handleNextLevel}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <span>NEXT LEVEL</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: TRY AGAIN MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center mb-2 text-rose-600 shadow-inner">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Wrong Layer Sequence!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              {failFeedback}
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowFailModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: FINAL COMPLETION MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showFinalCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Crystal Packing Mastered!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              Outstanding work! You built both close-packed crystal architectures: Hexagonal Close Packing (HCP) and Cubic Close Packing (CCP / FCC).
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full text-left font-mono text-[10px] text-slate-700 space-y-1 mb-3">
              <div className="flex justify-between font-bold text-emerald-700 border-b border-slate-200 pb-1">
                <span>Summary:</span>
                <span>2 / 2 Complete</span>
              </div>
              <div>&bull; HCP: CN = 12, 74.0% packed</div>
              <div>&bull; CCP / FCC: CN = 12, 74.0% packed</div>
              <div>&bull; Voids: 2N Tetrahedral + N Octahedral</div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleReplayChallenge}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
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
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EXPLANATION MODAL (PORTRAIT OPTIMIZED WITH ROUNDED CORNERS)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white rounded-3xl sm:rounded-[32px] flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Close Packing, Coordination Number &amp; Voids
                </h2>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Solid State Chemistry • ABAB (HCP) &amp; ABCABC (CCP / FCC)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Editorial Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto w-full">
            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                1. Building 3D Close-Packed Layers (A, B &amp; C)
              </h3>
              <p>
                Atoms in metals and crystals pack in 2D hexagonal sheets (<strong>Layer A</strong>) to minimize empty space. When placing a second sheet (<strong>Layer B</strong>), spheres settle into half of the triangular depressions (hollows) of Layer A.
              </p>
              <p>
                For the third layer, there are two ways to stack:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>ABAB... Stacking (HCP — Hexagonal Close Packing):</strong> The 3rd layer sits directly above the 1st <strong>Layer A</strong> atoms, repeating <strong>A → B → A → B</strong> (examples: Mg, Zn).
                </li>
                <li>
                  <strong>ABCABC... Stacking (CCP / FCC — Cubic Close Packing):</strong> The 3rd layer (<strong>Layer C</strong>) sits over the remaining uncovered hollows, offset from both A and B, repeating <strong>A → B → C → A</strong> (examples: Cu, Ag, Au).
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Coordination Number &amp; Interstitial Voids
              </h3>
              <p>
                In both <strong>HCP</strong> and <strong>CCP/FCC</strong>, every interior atom touches <strong>12 nearest neighbors</strong> (6 in its own layer + 3 below + 3 above), giving <strong>Coordination Number = 12</strong> and <strong>74.0% packing efficiency</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Tetrahedral Voids (CN = 4):</strong> Formed directly under a Layer-B sphere sitting in a 3-atom hollow of Layer A (<strong>2N</strong> voids for <em>N</em> spheres).
                </li>
                <li>
                  <strong>Octahedral Voids (CN = 6):</strong> Formed where an empty hollow of Layer A meets an opposite hollow of Layer B (<strong>N</strong> voids for <em>N</em> spheres).
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                3. Packing Efficiency Summary
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm font-mono">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-black">Structure</th>
                      <th className="p-2.5 font-black">Stacking</th>
                      <th className="p-2.5 font-black">CN</th>
                      <th className="p-2.5 font-black">Packing %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-bold">Simple Cubic (SC)</td>
                      <td className="p-2.5">AAAA...</td>
                      <td className="p-2.5">6</td>
                      <td className="p-2.5">52.4%</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Body-Centred (BCC)</td>
                      <td className="p-2.5">Non-CP</td>
                      <td className="p-2.5">8</td>
                      <td className="p-2.5">68.0%</td>
                    </tr>
                    <tr className="bg-emerald-50/60">
                      <td className="p-2.5 font-bold text-emerald-800">HCP / CCP (FCC)</td>
                      <td className="p-2.5 font-bold text-emerald-800">ABAB / ABCABC</td>
                      <td className="p-2.5 font-bold text-emerald-800">12</td>
                      <td className="p-2.5 font-bold text-emerald-800">74.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sticky Footer */}
          <div className="w-full px-6 py-3.5 border-t border-slate-100 flex items-center justify-center bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
