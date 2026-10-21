'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Trophy,
  X,
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
import { Orbital3DCanvas } from './Orbitals3D';
import {
  INITIAL_DROP_BOXES_9,
  ORBITAL_DECK_9,
  OrbitalItem,
  DropBoxSlot,
} from './types';

export interface AtomicOrbitalsGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function AtomicOrbitalsGamePage({
  difficulty = 'level1',
  onExit,
}: AtomicOrbitalsGamePageProps) {
  // Screen Flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Deck of 9 orbitals to match
  const [deck, setDeck] = useState<OrbitalItem[]>(ORBITAL_DECK_9);
  const [currentOrbitalIndex, setCurrentOrbitalIndex] = useState(0);

  // 9 Drop Boxes (3 rows x 3 columns)
  const [boxes, setBoxes] = useState<DropBoxSlot[]>(INITIAL_DROP_BOXES_9);

  // Animation & Feedback State
  const [isSliding, setIsSliding] = useState(false);
  const [shakingBoxId, setShakingBoxId] = useState<string | null>(null);
  const [selectedForPlacement, setSelectedForPlacement] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // History stack for Revert button
  const [history, setHistory] = useState<
    Array<{
      boxes: DropBoxSlot[];
      deck: OrbitalItem[];
      currentOrbitalIndex: number;
    }>
  >([]);

  const activeOrbital = deck[currentOrbitalIndex] || null;
  const matchedCount = boxes.filter((b) => b.filledWith !== null).length;

  // Check victory condition
  useEffect(() => {
    if (matchedCount === 9 && gameStarted) {
      setTimeout(() => {
        setIsCompleted(true);
      }, 600);
    }
  }, [matchedCount, gameStarted]);

  // Handle Placing an orbital into a target box
  const handlePlaceIntoBox = (boxId: string) => {
    if (!activeOrbital) return;
    const targetBox = boxes.find((b) => b.id === boxId);
    if (!targetBox) return;

    if (targetBox.filledWith !== null) {
      setFeedback({
        type: 'info',
        message: 'This drop box is already filled! Choose an empty box.',
      });
      return;
    }

    // Exact Match: orbital ID must match target box's targetOrbitalId
    if (activeOrbital.id === targetBox.targetOrbitalId) {
      // Save history for Revert
      setHistory((prev) => [
        ...prev,
        {
          boxes: JSON.parse(JSON.stringify(boxes)),
          deck: [...deck],
          currentOrbitalIndex,
        },
      ]);

      // Success: Fill the box
      setBoxes((prev) =>
        prev.map((b) => (b.id === boxId ? { ...b, filledWith: activeOrbital } : b))
      );

      setFeedback({
        type: 'success',
        message: `Correct! ${activeOrbital.displayName} matched into ${targetBox.label}.`,
      });
      setSelectedForPlacement(false);

      // Trigger slide out of current card and slide in of next from right
      setIsSliding(true);
      setTimeout(() => {
        const nextDeck = deck.filter((_, idx) => idx !== currentOrbitalIndex);
        setDeck(nextDeck);
        setCurrentOrbitalIndex(0);
        setIsSliding(false);
      }, 350);
    } else {
      // Error: Shake the incorrect box
      setShakingBoxId(boxId);
      setTimeout(() => setShakingBoxId(null), 600);

      setFeedback({
        type: 'error',
        message: `Not quite! This is ${activeOrbital.displayName} (${activeOrbital.shapeDescription}), which does not match ${targetBox.label}.`,
      });
    }
  };

  // Revert previous placement
  const handleRevert = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setBoxes(previous.boxes);
    setDeck(previous.deck);
    setCurrentOrbitalIndex(previous.currentOrbitalIndex);
    setSelectedForPlacement(false);
    setFeedback({
      type: 'info',
      message: 'Reverted previous orbital placement.',
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!activeOrbital) return;
    e.dataTransfer.setData('text/plain', activeOrbital.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    handlePlaceIntoBox(boxId);
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-2.5 max-w-[440px] mx-auto">

      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN */}
          {introStep === 'mission' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                ATOMIC ORBITALS
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Match Atomic Orbitals — Identify Shapes &amp; Spatial Orientations of all 9 Orbitals
              </h1>

              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN */}
          {introStep === 'instructions' && (
            <div className="max-w-md mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
              <div className="text-center pt-1 pb-3">
                <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              <div className="flex flex-col gap-3 w-full mx-auto my-auto">
                {/* 1. Inspect 3D Orbital Shape & Orientation */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Inspect 3D Orbital Shape
                      </h3>
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px] tracking-wide">
                        Quantum Geometry
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Rotate and inspect the 3D lobes and nodal planes to identify the specific orbital: s, px, py, pz, dxy, dyz, dzx, dx²-y², or dz².
                    </p>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200/90 shadow-xs p-2.5 mt-2 flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 shadow-md flex items-center justify-center text-white text-[10px] font-black">
                        s
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-700 mt-1">Spherical</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <div className="w-3 h-7 rounded-full bg-red-500 shadow-xs mr-0.5" />
                        <div className="w-3 h-7 rounded-full bg-blue-500 shadow-xs ml-0.5" />
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-700 mt-1">Dumbbell</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 relative flex items-center justify-center">
                        <div className="w-2.5 h-7 rounded-full bg-red-500 shadow-xs" />
                        <div className="w-7 h-2.5 rounded-full border-2 border-blue-600 bg-blue-500/40 absolute" />
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-700 mt-1">Doughnut</span>
                    </div>
                  </div>
                </div>

                {/* 2. Drag & Drop or Match to Target Box */}
                <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">
                        Place in Dedicated Box
                      </h3>
                    </div>
                    <div className="mt-1.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] tracking-wide">
                        9 Unique Targets
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                      Tap the 3D card &quot;Place in Drop Box&quot; to match each orbital into its specific box. Match all 9 to win!
                    </p>
                  </div>

                  {/* 3x3 Grid Diagram */}
                  <div className="w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 p-2 mt-2">
                    <div className="grid grid-cols-3 gap-1 text-[8.5px] font-bold text-center">
                      <div className="p-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-400/40">DROP s</div>
                      <div className="p-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40">DROP px</div>
                      <div className="p-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40">DROP py</div>
                      <div className="p-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">DROP pz</div>
                      <div className="p-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">DROP dxy</div>
                      <div className="p-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-400/40">DROP dyz</div>
                      <div className="p-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">DROP dzx</div>
                      <div className="p-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">DROP dx²-y²</div>
                      <div className="p-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40">DROP dz²</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-3 pb-1 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-8 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer Note (Only on mission step) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0 pb-1">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE 3D GAMEPLAY SCREEN ──────────────────────────────── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">

          {/* ── 1. TOP TOOLBAR HEADER (EXIT, REVERT, EXPLANATION) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-0.5 mb-1">
            {/* Top Left: Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Center: Title */}
            {/* <div className="text-center font-bold text-xs sm:text-sm text-slate-800 tracking-tight flex items-center gap-1">
              <span>Match the Orbitals</span>
            </div> */}

            {/* Top Right: Explanation Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                title="View Theory & Explanation"
              >
                <BookOpen className="w-3 h-3 text-purple-600" />
                <span>Explanation</span>
              </button>
            </div>
          </header>

          {/* ── 2. TOP SECTION: 9 DROP BOXES (COVERS 40% OF SCREEN) ── */}
          <div className="w-full h-[39%] min-h-0 px-0.5 pb-1 shrink-0 flex flex-col">
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-full w-full">
              {boxes.map((box) => {
                const isFilled = box.filledWith !== null;
                const isShaking = shakingBoxId === box.id;
                const isEligibleHighlight =
                  selectedForPlacement &&
                  !isFilled &&
                  activeOrbital &&
                  activeOrbital.id === box.targetOrbitalId;

                return (
                  <div
                    key={box.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, box.id)}
                    onClick={() => handlePlaceIntoBox(box.id)}
                    className={`relative rounded-2xl p-1 h-full w-full flex flex-col items-center justify-center transition-all cursor-pointer ${isShaking ? 'animate-shake ring-2 ring-red-500 shadow-md' : ''
                      } ${isFilled
                        ? 'shadow-xs border-solid'
                        : isEligibleHighlight
                          ? 'ring-2 ring-offset-2 ring-sky-500 scale-[1.03] animate-pulse'
                          : ''
                      }`}
                    style={{
                      backgroundColor: isShaking
                        ? '#FEF2F2'
                        : isFilled
                          ? '#ECFDF5'
                          : box.bgColor,
                      borderWidth: '2px',
                      borderStyle: isFilled ? 'solid' : 'dashed',
                      borderColor: isShaking
                        ? '#EF4444'
                        : isFilled
                          ? '#10B981'
                          : box.borderColor,
                    }}
                    title={isFilled ? `Filled with ${box.filledWith?.displayName}` : `Drop ${box.label} here`}
                  >
                    {/* Inner dashed ring */}
                    {!isFilled && !isShaking && (
                      <div
                        className="absolute inset-1 rounded-xl pointer-events-none"
                        style={{
                          border: `1.5px dashed ${box.borderColor}`,
                          opacity: 0.45,
                        }}
                      />
                    )}

                    {isFilled ? (
                      <div className="flex flex-col items-center justify-center z-10 animate-in zoom-in-95 duration-200">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mb-0.5 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-black font-mono text-slate-900 leading-tight truncate">
                          {box.filledWith?.name}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 uppercase tracking-tight">
                          MATCHED ✓
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center z-10">
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight mb-0.5">
                          DROP
                        </span>
                        <span
                          className="text-xs sm:text-sm font-black tracking-tight uppercase leading-tight block font-mono"
                          style={{ color: box.textColor }}
                        >
                          {box.label.replace('DROP ', '')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback message banner (if any) */}
          {feedback && (
            <div
              className={`mx-1 my-0.5 px-2.5 py-1 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-in fade-in duration-150 shrink-0 ${feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
            >
              <span className="text-[11px] sm:text-xs leading-tight">{feedback.message}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-600 ml-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── 3. CENTER / BOTTOM: CURRENT 3D ORBITAL AREA (INSIDE SINGLE CANVAS) ── */}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-between pt-1 relative">
            {activeOrbital ? (
              <div
                draggable="true"
                onDragStart={handleDragStart}
                className={`w-full flex-1 min-h-0 flex flex-col justify-between relative transition-all duration-300 ${isSliding
                  ? 'transform -translate-x-[110%] opacity-0 scale-95'
                  : 'transform translate-x-0 opacity-100 scale-100 animate-in slide-in-from-right duration-300'
                  }`}
              >
                {/* 3D WebGL Canvas */}
                <div className="w-full flex-1 min-h-0 relative overflow-hidden bg-white cursor-grab active:cursor-grabbing">
                  <Canvas camera={{ position: [1.15, 0.45, 4.5], fov: 38 }}>
                    <Orbital3DCanvas orbitalId={activeOrbital.id} autoRotate={false} />
                  </Canvas>
                </div>

                {/* Bottom Action: Revert Button */}
                <div className="pt-1.5 pb-0.5 flex flex-col items-center shrink-0">
                  <button
                    type="button"
                    onClick={handleRevert}
                    disabled={history.length === 0}
                    className={`w-full max-w-[260px] py-2 px-4 rounded-full font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 ${
                      history.length > 0
                        ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:brightness-105 transform hover:scale-[1.02] active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60 shadow-none'
                    }`}
                    title="Revert previous orbital placement"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 flex flex-col items-center justify-center bg-white rounded-2xl p-6 text-center border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">All 9 Orbitals Matched!</h3>
                <p className="text-xs text-slate-500 mt-1">Outstanding job mastering the s, p, and d subshell geometries.</p>
              </div>
            )}

            {/* Bottom Progress Text */}
            <div className="text-center py-1 shrink-0">
              <span className="text-xs font-semibold text-slate-600 font-sans">
                {matchedCount} of 9 Orbitals Matched
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. THEORY / EXPLANATION MODAL (TEXTBOOK STYLE) ───────────────────── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[999] bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Atomic Orbitals: Geometry &amp; Quantum Numbers
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95 shrink-0"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-7 sm:space-y-8 text-black text-base sm:text-lg leading-relaxed max-w-3xl mx-auto w-full">

            {/* Section 1: Overview of the 9 Atomic Orbitals */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                1. Overview of the 9 Atomic Orbitals (s, p, d)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                An atomic orbital is a three-dimensional probability density wave function described by quantum numbers n, l, and mₗ. In our 3D challenge, you classified all 9 foundational orbitals across the s, p, and d subshells:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>1 s-Orbital (l = 0, mₗ = 0):</strong> Spherical symmetry, non-directional, zero angular nodes.
                </li>
                <li>
                  <strong>3 p-Orbitals (l = 1, mₗ = -1, 0, +1):</strong> Directed along the Cartesian axes (pₓ, p_y, p_z) as two-lobed dumbbells with one planar node.
                </li>
                <li>
                  <strong>5 d-Orbitals (l = 2, mₗ = -2, -1, 0, +1, +2):</strong> Four cloverleaf geometries (d_xy, d_yz, d_zx, d_x²-y²) and one unique dumbbell-plus-doughnut orbital (d_z²).
                </li>
              </ul>
            </div>

            {/* Section 2: The s-Orbital */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                2. The s-Orbital (l = 0)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                Because l = 0, the magnetic quantum number can only be mₗ = 0. The angular wave function is a constant, producing complete spherical symmetry around the nucleus.
              </p>
            </div>

            {/* Section 3: The Three p-Orbitals */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                3. The Three p-Orbitals (pₓ, p_y, p_z)
              </h3>
              <p className="text-black text-base sm:text-lg leading-relaxed">
                For l = 1, the three degenerate orbitals are mutually perpendicular:
              </p>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>pₓ Orbital:</strong> Oriented along the x-axis with an angular planar node in the yz-plane (x = 0).
                </li>
                <li>
                  <strong>p_y Orbital:</strong> Oriented along the y-axis with an angular planar node in the xz-plane (y = 0).
                </li>
                <li>
                  <strong>p_z Orbital:</strong> Oriented along the z-axis with an angular planar node in the xy-plane (z = 0).
                </li>
              </ul>
            </div>

            {/* Section 4: The Five d-Orbitals */}
            <div className="space-y-3.5">
              <h3 className="text-xl sm:text-2xl font-bold text-black">
                4. The Five d-Orbitals (d_xy, d_yz, d_zx, d_x²-y², d_z²)
              </h3>
              <ul className="list-disc pl-5 sm:pl-7 space-y-2.5 sm:space-y-3 text-black text-base sm:text-lg leading-relaxed">
                <li>
                  <strong>d_xy, d_yz, d_zx:</strong> Four lobes lying in their respective Cartesian planes pointing at 45° between the coordinate axes.
                </li>
                <li>
                  <strong>d_x²-y²:</strong> Four lobes pointing directly along the x and y axes, with nodal planes at 45° (x = y and x = -y).
                </li>
                <li>
                  <strong>d_z²:</strong> Two vertical elongated lobes along the z-axis (positive phase, Red) encircled by a toroidal doughnut ring around the xy equatorial waist (negative phase, Blue).
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}

      {/* ── 5. VICTORY / COMPLETION MODAL ─────────────────────────────────────── */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-[#22C55E] flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Trophy className="w-8 h-8 fill-current" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#1E293B] uppercase tracking-wide mb-1">
              Challenge Completed!
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mb-4">
              Mastery achieved in Atomic Orbitals! You successfully classified and matched all 9 s, p, and d subshell orbitals into their dedicated boxes.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-5 text-center text-xs font-mono">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-1.5">
                <span className="text-orange-700 block text-[10px] font-bold">s Subshell</span>
                <span className="font-extrabold text-slate-800">s</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-1.5">
                <span className="text-blue-700 block text-[10px] font-bold">p Subshell</span>
                <span className="font-extrabold text-slate-800">px, py, pz</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5">
                <span className="text-emerald-700 block text-[10px] font-bold">d Subshell</span>
                <span className="font-extrabold text-slate-800">5 Orbitals</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setBoxes(INITIAL_DROP_BOXES_9);
                  setDeck(ORBITAL_DECK_9);
                  setCurrentOrbitalIndex(0);
                  setHistory([]);
                  setFeedback(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Replay Lab
              </button>

              <button
                type="button"
                onClick={() => (onExit ? onExit() : exitSimulation())}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black text-xs uppercase shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Back to Topics
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
