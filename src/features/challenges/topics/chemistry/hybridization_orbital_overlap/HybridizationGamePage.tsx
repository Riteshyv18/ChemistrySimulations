"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles, Torus } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  CheckCircle2,
  X,
  Info,
  RotateCcw,
  Undo2,
  Trophy,
  Sparkles as SparklesIcon
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
import {
  getHybridLobeMaterial,
  getBackLobeMaterial,
  getNucleusMaterial,
  getOrbitalMaterial
} from './materials';
import {
  getHybridDirections,
  getQuaternionFromDirection
} from './helpers';

// ── Hybridization Types & Metadata ──────────────────────────────────────────
export interface HybridShapeItem {
  code: 's' | 'sp' | 'sp2' | 'sp3' | 'sp3d' | 'sp3d2';
  label: string;
  name: string;
  lobesCount: number;
  angles: string;
  examples: string;
  description: string;
}

export const HYBRID_OPTIONS: HybridShapeItem[] = [
  {
    code: 's',
    label: 's',
    name: 'Unhybridized s Orbital',
    lobesCount: 1,
    angles: 'N/A (Spherical)',
    examples: 'H (1s), He (1s), Na (3s)',
    description: 'A pure unhybridized s atomic orbital with non-directional spherical symmetry around the nucleus.'
  },
  {
    code: 'sp',
    label: 'sp',
    name: 'Linear',
    lobesCount: 2,
    angles: '180°',
    examples: 'BeCl₂, C₂H₂, CO₂',
    description: '1 s + 1 p orbital mix into 2 equivalent sp hybrid orbitals oriented at 180°.'
  },
  {
    code: 'sp2',
    label: 'sp²',
    name: 'Trigonal Planar',
    lobesCount: 3,
    angles: '120°',
    examples: 'BF₃, C₂H₄, SO₃',
    description: '1 s + 2 p orbitals mix into 3 equivalent sp² hybrid orbitals in a plane at 120°.'
  },
  {
    code: 'sp3',
    label: 'sp³',
    name: 'Tetrahedral',
    lobesCount: 4,
    angles: '109.5°',
    examples: 'CH₄, NH₃, H₂O, CCl₄',
    description: '1 s + 3 p orbitals mix into 4 equivalent sp³ hybrid orbitals in 3D tetrahedral symmetry at 109.5°.'
  },
  {
    code: 'sp3d',
    label: 'sp³d',
    name: 'Trigonal Bipyramidal',
    lobesCount: 5,
    angles: '90° / 120°',
    examples: 'PCl₅, SF₄, ClF₃',
    description: '1 s + 3 p + 1 d orbitals mix into 5 equivalent sp³d hybrid orbitals (3 equatorial at 120°, 2 axial at 90°).'
  },
  {
    code: 'sp3d2',
    label: 'sp³d²',
    name: 'Octahedral',
    lobesCount: 6,
    angles: '90°',
    examples: 'SF₆, [Fe(CN)₆]³⁻',
    description: '1 s + 3 p + 2 d orbitals mix into 6 equivalent sp³d² hybrid orbitals oriented along Cartesian axes at 90°.'
  }
];

// ── 3D Single Hybrid Lobe Component ─────────────────────────────────────────
const HybridLobe3D = ({
  direction,
  index
}: {
  direction: THREE.Vector3;
  index: number;
}) => {
  const norm = useMemo(() => direction.clone().normalize(), [direction]);
  const quaternion = useMemo(() => getQuaternionFromDirection(norm), [norm]);

  const lobeColors = ['#06b6d4', '#a855f7', '#3b82f6', '#f43f5e', '#22c55e', '#f97316'];
  const emissiveColors = ['#0891b2', '#7e22ce', '#1d4ed8', '#be185d', '#15803d', '#c2410c'];

  const colorHex = lobeColors[index % lobeColors.length];
  const emissiveHex = emissiveColors[index % emissiveColors.length];

  const mainMat = useMemo(() => getHybridLobeMaterial(colorHex, emissiveHex), [colorHex, emissiveHex]);
  const backMat = useMemo(() => getBackLobeMaterial(), []);

  return (
    <group quaternion={quaternion}>
      {/* Front Major Lobe (concentrated electron density) */}
      <group position={[0, 1.15, 0]} scale={[0.72, 1.45, 0.72]}>
        <Sphere args={[0.85, 32, 32]} material={mainMat} />
      </group>

      {/* Back Minor Lobe */}
      <group position={[0, -0.38, 0]} scale={[0.42, 0.42, 0.42]}>
        <Sphere args={[0.7, 24, 24]} material={backMat} />
      </group>
    </group>
  );
};

// ── 3D Shape Model Scene ────────────────────────────────────────────────────
const HybridShapeModel = ({ shape }: { shape: HybridShapeItem }) => {
  const groupRef = useRef<THREE.Group>(null);
  const nucleusMat = useMemo(() => getNucleusMaterial(), []);
  const directions = useMemo(() => getHybridDirections(shape.code), [shape.code]);
  const sOrbitalMat = useMemo(() => getOrbitalMaterial('s'), []);

  // Gentle auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={0.92}>
      {/* Subtle ambient orbital sparkles */}
      <Sparkles count={30} scale={6} size={2.5} speed={0.4} color="#38BDF8" />

      {/* Central Atom Nucleus */}
      <Sphere args={[0.38, 32, 32]} position={[0, 0, 0]} material={nucleusMat}>
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-xs select-none drop-shadow">
            {shape.code === 's' ? 'H' : 'C'}
          </div>
        </Html>
      </Sphere>

      {/* Unhybridized Spherical s Orbital */}
      {shape.code === 's' && (
        <group position={[0, 0, 0]}>
          <Sphere args={[1.55, 36, 36]} material={sOrbitalMat} />
        </group>
      )}

      {/* Hybrid Orbitals Lobes */}
      {shape.code !== 's' &&
        directions.map((dir, idx) => (
          <HybridLobe3D
            key={`${shape.code}-lobe-${idx}`}
            direction={dir}
            index={idx}
          />
        ))}
    </group>
  );
};

// Helper to create a randomized queue where every shape appears exactly once
const createShuffledQueue = () => {
  const queue = HYBRID_OPTIONS.map((_, i) => i);
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
};

// ── Main Page Component ─────────────────────────────────────────────────────
export default function HybridizationGamePage({
  difficulty = 'level1',
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen flow: 'mission' -> 'instructions' -> 'playing'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions' | 'playing'>('mission');
  const [showExplanation, setShowExplanation] = useState(false);

  // Finite Queue: Each of the 6 shapes appears once
  const [challengeQueue, setChallengeQueue] = useState<number[]>(() => createShuffledQueue());
  const [queueIndex, setQueueIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentShapeIndex = challengeQueue[queueIndex] ?? 0;
  const currentShape = HYBRID_OPTIONS[currentShapeIndex];

  // Slider selection: 0=s, 1=sp, 2=sp2, 3=sp3, 4=sp3d, 5=sp3d2
  const [sliderIndex, setSliderIndex] = useState(0); // default 's'
  const trackRef = useRef<HTMLDivElement>(null);

  // Slide transition: 'idle' | 'sliding-out' | 'sliding-in'
  const [slideState, setSlideState] = useState<'idle' | 'sliding-out' | 'sliding-in'>('idle');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  // Score & Feedback
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const handleRestart = () => {
    setChallengeQueue(createShuffledQueue());
    setQueueIndex(0);
    setIsCompleted(false);
    setScore(0);
    setSliderIndex(0);
    setFeedback(null);
    setSlideState('idle');
  };

  const handleTrackPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newIndex = Math.round(ratio * (HYBRID_OPTIONS.length - 1));
    setSliderIndex(newIndex);
    setFeedback(null);
  };

  // Submit Answer
  const handleSubmit = () => {
    if (slideState !== 'idle' || isCompleted) return;
    const selectedOption = HYBRID_OPTIONS[sliderIndex];

    if (selectedOption.code === currentShape.code) {
      // Correct Answer!
      const isLast = queueIndex + 1 >= challengeQueue.length;
      setFeedback({
        type: 'success',
        message: isLast
          ? `🎉 Correct! Challenge completed! All 6 shapes identified.`
          : `🎉 Correct! This geometry represents ${currentShape.label} (${currentShape.name}, ${currentShape.angles}).`
      });
      setScore((s) => s + 1);

      // Trigger slide out after 700ms
      setTimeout(() => {
        // Randomly slide out to left or right
        const exitTo = Math.random() > 0.5 ? 'left' : 'right';
        setSlideDirection(exitTo);
        setSlideState('sliding-out');

        setTimeout(() => {
          if (isLast) {
            setIsCompleted(true);
            setFeedback(null);
            setSlideState('idle');
          } else {
            setQueueIndex((prev) => prev + 1);
            setFeedback(null);

            // Next shape enters from opposite side
            const enterFrom = exitTo === 'left' ? 'right' : 'left';
            setSlideDirection(enterFrom);
            setSlideState('sliding-in');

            // Smoothly slide in to center
            setTimeout(() => {
              setSlideState('idle');
            }, 40);
          }
        }, 320);
      }, 700);
    } else {
      // Incorrect
      setFeedback({
        type: 'error',
        message: currentShape.code === 's'
          ? `Not quite! Notice this is a non-directional spherical orbital (1s unhybridized orbital).`
          : `Not quite! Count the number of directional hybrid lobes (this shape has ${currentShape.lobesCount} lobes). Try rotating to inspect!`
      });
    }
  };

  const handleRevert = () => {
    setSliderIndex(0); // reset to 's'
    setFeedback(null);
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col max-w-[440px] mx-auto p-3 sm:p-4">
      {/* ── STEP 1: MISSION SCREEN ─────────────────────────────────────────── */}
      {introStep === 'mission' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-5 bg-white/98 backdrop-blur-md">
          {/* Top Exit */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Centered Mission Statement */}
          <div className="max-w-xl mx-auto my-auto text-center space-y-4 z-10 px-2 py-2 animate-in fade-in duration-200">
            <div className="text-[#2563EB] text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
              CHEMICAL BONDING & HYBRIDIZATION
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Identify each incoming 3D hybridization shape by sliding to match its geometry.
            </h1>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIntroStep('instructions')}
                className="px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium">
            Click NEXT to view challenge instructions
          </div>
        </div>
      )}

      {/* ── STEP 2: INSTRUCTIONS SCREEN ─────────────────────────────────────── */}
      {introStep === 'instructions' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Header */}
          <div className="w-full flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="text-center pt-1 pb-2">
            <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
              INSTRUCTIONS TO PLAY
            </h2>
          </div>

          {/* Instruction Cards */}
          <div className="flex flex-col gap-2.5 w-full mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Inspect 3D Shape */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    1
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                    Inspect 3D Hybrid Shape
                  </h3>
                </div>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[10px]">
                    3D Orbital Geometry
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                  A random 3D hybridization shape will slide onto the screen. Drag to rotate in 3D to count the directional lobes.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-cyan-50/70 border border-cyan-200 p-2 sm:p-2.5 mt-2 flex items-center justify-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-900">
                  Rotate 3D Shapes (1, 2, 3, 4, 5, or 6 lobes) ↺
                </span>
              </div>
            </div>

            {/* Card 2: Select Hybridization */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    2
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                    Slide to Match Hybridization
                  </h3>
                </div>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                    Hybridization Slider
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                  Slide the bottom bar to choose between <strong>s, sp, sp², sp³, sp³d, and sp³d²</strong>.
                </p>
              </div>

              {/* Visual Preview: Slider */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2 sm:p-2.5 mt-2 shadow-2xs">
                <div className="relative w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[50%]" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-700 mt-1 font-extrabold">
                  <span>s</span>
                  <span>sp</span>
                  <span>sp²</span>
                  <span>sp³</span>
                  <span>sp³d</span>
                  <span>sp³d²</span>
                </div>
              </div>
            </div>

            {/* Card 3: Submit Answer */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    3
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight">
                    Submit &amp; Slide Next
                  </h3>
                </div>
                <div className="mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Progress &amp; Score
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1">
                  Click Submit Answer. If correct, the shape slides away and a new random 3D shape slides in from the side!
                </p>
              </div>

              {/* Visual Preview: Submit Button */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-2 mt-2 flex items-center justify-center shadow-2xs">
                <div className="w-full max-w-[210px] py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 pointer-events-none tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Answer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="pt-2 pb-1 flex items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIntroStep('mission')}
              className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
              <span>BACK</span>
            </button>
            <button
              type="button"
              onClick={() => setIntroStep('playing')}
              className="px-7 sm:px-9 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
              <span>PLAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: 3D GAMEPLAY SCREEN (SINGLE CANVAS IN PORTRAIT) ──────────── */}
      {/* ── 1. Top Header: Only Exit & Explanation ── */}
      <header className="w-full z-20 shrink-0 p-2.5 sm:p-3 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={handleExit}
          className="flex items-center gap-1 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
          title="Exit Simulation"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
          <span>EXIT</span>
        </button>

        <button
          type="button"
          onClick={() => setShowExplanation(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
          title="View Explanation"
        >
          <BookOpen className="w-4 h-4 text-white shrink-0" />
          <span>EXPLANATION</span>
        </button>
      </header>

      {/* ── 2. Middle Single Canvas (With Slide Animation) ── */}
      <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-white flex flex-col shrink">
        {/* Animated Sliding Container */}
        <div
          className={`w-full h-full relative ${
            slideState === 'sliding-out'
              ? `transition-all duration-300 ease-in transform ${
                  slideDirection === 'left' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                }`
              : slideState === 'sliding-in'
                ? `transition-none transform ${
                    slideDirection === 'right' ? 'translate-x-full opacity-0' : '-translate-x-full opacity-0'
                  }`
                : 'transition-all duration-350 ease-out transform translate-x-0 opacity-100'
          }`}
        >
          <Canvas
            camera={{ position: [0, 0, 9.4], fov: 42 }}
            className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
          >
            <color attach="background" args={['#FFFFFF']} />
            <ambientLight intensity={1.3} />
            <directionalLight position={[6, 8, 6]} intensity={1.5} />
            <directionalLight position={[-6, -6, -6]} intensity={0.6} />
            <pointLight position={[0, 4, 3]} intensity={0.7} color="#38BDF8" />

            <HybridShapeModel shape={currentShape} />

            <OrbitControls
              enableZoom={true}
              minDistance={5}
              maxDistance={20}
              enablePan={false}
              rotateSpeed={0.8}
            />
          </Canvas>
        </div>

        {/* Rotate Hint Overlay at bottom of canvas */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-slate-200 text-[10px] font-bold shadow-xs flex items-center gap-1.5">
            <span>Drag to rotate · Pinch to zoom</span>
            <RotateCcw className="w-3 h-3 text-sky-400" />
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Controls: Hybridization Slider & Submit Button ── */}
      <footer className="w-full z-20 shrink-0 p-3 sm:p-4 bg-white/95 border-t border-slate-100 flex flex-col gap-3">
        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`w-full p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{feedback.message}</span>
          </div>
        )}

        {/* Slider Box */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-3 shadow-2xs">
          {/* Label & Active Value Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-black uppercase text-slate-700 flex items-center gap-1.5 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
              Hybridization State
            </span>
            <span className="text-xs sm:text-sm font-black text-blue-900 bg-blue-100/80 border border-blue-200 px-3 py-0.5 rounded-xl shadow-2xs font-mono">
              {HYBRID_OPTIONS[sliderIndex].label} · {HYBRID_OPTIONS[sliderIndex].name}
            </span>
          </div>

          {/* Interactive Slider: Only selected hybridization has the Blue Dot (no blue fill line) */}
          <div className="px-5 py-2">
            <div
              ref={trackRef}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                handleTrackPointer(e.clientX);
              }}
              onPointerMove={(e) => {
                if (e.buttons === 1) {
                  handleTrackPointer(e.clientX);
                }
              }}
              className="relative w-full h-7 flex items-center cursor-pointer select-none touch-none"
            >
              {/* Background neutral track (no filled blue line) */}
              <div className="w-full h-2 bg-slate-200 rounded-full" />

              {/* Step tick points on track */}
              {HYBRID_OPTIONS.map((_, idx) => {
                const pct = (idx / (HYBRID_OPTIONS.length - 1)) * 100;
                return (
                  <div
                    key={`tick-${idx}`}
                    style={{ left: `${pct}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-300 pointer-events-none"
                  />
                );
              })}

              {/* ONLY the Selected Hybridization has the Blue Circle Dot */}
              <div
                style={{ left: `${(sliderIndex / (HYBRID_OPTIONS.length - 1)) * 100}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center transition-all duration-150 pointer-events-none"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>

            {/* Step Pills - EXACTLY at same percentage as thumb */}
            <div className="relative w-full h-7 mt-1.5">
              {HYBRID_OPTIONS.map((opt, idx) => {
                const pct = (idx / (HYBRID_OPTIONS.length - 1)) * 100;
                const isSelected = sliderIndex === idx;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setSliderIndex(idx);
                      setFeedback(null);
                    }}
                    style={{ left: `${pct}%` }}
                    className={`absolute top-0 -translate-x-1/2 px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs scale-105'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons: Revert & Submit Answer (Matching Reference UI) */}
        <div className="flex items-center justify-center gap-2 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={handleRevert}
            className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Reset slider to default"
          >
            <Undo2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Revert</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 max-w-[240px] h-9 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Submit Answer</span>
          </button>
        </div>
      </footer>

      {/* ── STEP 4: LEVEL COMPLETE MODAL ── */}
      {isCompleted && (
        <div className="absolute inset-0 z-40 bg-white/98 backdrop-blur-md flex flex-col items-center justify-center text-center p-5 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-200 flex items-center justify-center mb-3 shadow-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">
            🎉 Challenge Completed!
          </h2>
          <p className="text-slate-500 mb-6 text-xs sm:text-sm max-w-xs leading-relaxed">
            Excellent work! You successfully identified all 6 orbital &amp; hybridization geometries:
            <span className="block mt-1 font-bold text-slate-700">s, sp, sp², sp³, sp³d, and sp³d²</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PLAY AGAIN</span>
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <span>EXIT</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: EXPLANATION SCREEN (FULL CANVAS WHOLE SCREEN WITHOUT BOXES) ─ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-5 bg-white overflow-y-auto animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <h2 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-wide">
              Theory: Hybridization &amp; Orbital Shapes
            </h2>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content filling the full screen without card boxes */}
          <div className="flex-1 overflow-y-auto py-3 space-y-5 px-1 pr-1.5">
            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  1
                </span>
                What is Orbital Hybridization?
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                <strong>Hybridization</strong> is the concept of mixing atomic orbitals (s, p, d) on a central atom to form new equivalent <strong>hybrid orbitals</strong>. This process equalizes bond energies and maximizes spatial separation to minimize electron repulsion.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Asymmetric Lobes:</strong> Hybrid orbitals have one large directional front lobe (ideal for strong coaxial σ-bonding) and a small back lobe.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 2: s Orbital */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  2
                </span>
                Unhybridized s Orbital (Spherical Symmetry)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                The pure <strong>s atomic orbital</strong> is completely spherical with uniform electron density in all directions. Because it is non-directional, it does not possess lobes or bond angles until it mixes with directional p or d orbitals.
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                Pure s orbital: 1 spherical lobe (l = 0, mₗ = 0)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> H (1s¹), He (1s²), Na (3s¹ valence).
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 3: sp */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  3
                </span>
                sp Hybridization (Linear · 180°)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Mixing <strong>1 s + 1 p</strong> orbital creates <strong>2 equivalent sp hybrid orbitals</strong> pointing in opposite directions along a straight line (180°).
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                1s + 1p → 2 sp hybrid orbitals (180°)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> BeCl₂, C₂H₂ (acetylene), CO₂.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 4: sp2 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  4
                </span>
                sp² Hybridization (Trigonal Planar · 120°)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Mixing <strong>1 s + 2 p</strong> orbitals creates <strong>3 equivalent sp² hybrid orbitals</strong> arranged in a flat 2D plane separated by 120°.
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                1s + 2p → 3 sp² hybrid orbitals (120°)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> BF₃, C₂H₄ (ethylene), SO₃.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 5: sp3 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  5
                </span>
                sp³ Hybridization (Tetrahedral · 109.5°)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Mixing <strong>1 s + 3 p</strong> orbitals creates <strong>4 equivalent sp³ hybrid orbitals</strong> directed toward the corners of a regular tetrahedron at 109.5°.
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                1s + 3p → 4 sp³ hybrid orbitals (109.5°)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> CH₄ (methane), NH₃, H₂O, CCl₄.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 6: sp3d */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  6
                </span>
                sp³d Hybridization (Trigonal Bipyramidal · 90° / 120°)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Mixing <strong>1 s + 3 p + 1 d</strong> orbitals creates <strong>5 equivalent sp³d hybrid orbitals</strong> with 3 equatorial lobes at 120° and 2 axial lobes at 90°/180°.
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                1s + 3p + 1d → 5 sp³d hybrid orbitals (120° eq / 90° ax)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> PCl₅, SF₄ (seesaw), ClF₃ (T-shaped).
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 7: sp3d2 */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  7
                </span>
                sp³d² Hybridization (Octahedral · 90°)
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Mixing <strong>1 s + 3 p + 2 d</strong> orbitals creates <strong>6 equivalent sp³d² hybrid orbitals</strong> pointing symmetrically along the Cartesian axes at 90°.
              </p>
              <div className="py-1 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                1s + 3p + 2d → 6 sp³d² hybrid orbitals (90°)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Examples:</strong> SF₆, [Fe(CN)₆]³⁻, BrF₅.
              </p>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-3 pb-1 shrink-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-full sm:w-auto sm:px-10 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-sky-600/30 transition-all cursor-pointer active:scale-95 text-center"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
