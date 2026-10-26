'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Trophy,
  Sparkles,
  Lightbulb,
  Play,
  Check,
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  Atom,
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
import {
  OrbitalRenderer,
} from './Orbitals3D';

// ── Web Audio Synthesizer for Crisp Tactile Feedback ────────────────────────
function playSound(type: 'click' | 'correct' | 'wrong' | 'complete') {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'complete') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        const startTime = now + i * 0.09;
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq, startTime);
        subGain.gain.setValueAtTime(0.12, startTime);
        subGain.gain.exponentialRampToValueAtTime(0.002, startTime + 0.35);
        subOsc.start(startTime);
        subOsc.stop(startTime + 0.35);
      });
    }
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
}

type SpinOption = '+1/2' | '-1/2' | '+1/4' | '-1/4';

// ── 3D Electron Spin Indicator Component ─────────────────────────────────────
function SingleElectronSpinParticle({
  isDown,
  color,
  badgeText,
  badgeClass,
  baseY = 1.35,
  hideBadge = false,
}: {
  isDown: boolean;
  color: string;
  badgeText?: string;
  badgeClass?: string;
  baseY?: number;
  hideBadge?: boolean;
}) {
  const arrowGroup = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (arrowGroup.current) {
      // Top electron stays at +baseY, Bottom electron stays at -baseY right on the axis
      const targetY = !isDown ? baseY : -baseY;
      arrowGroup.current.position.y =
        targetY + Math.sin(Date.now() * 0.005 + (isDown ? Math.PI : 0)) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += (!isDown ? 1 : -1) * delta * 4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <group ref={arrowGroup}>
        {/* Electron sphere */}
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial
            color="#3B82F6"
            emissive="#2563EB"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        {/* Shaft */}
        <mesh position={[0, !isDown ? 0.38 : -0.38, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.44, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        {/* Head */}
        <mesh
          position={[0, !isDown ? 0.65 : -0.65, 0]}
          rotation={[!isDown ? 0 : Math.PI, 0, 0]}
        >
          <coneGeometry args={[0.12, 0.24, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
        {/* Precession Ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.32, 0.022, 16, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.8}
            emissive={color}
            emissiveIntensity={0.4}
          />
        </mesh>

        {badgeText && !hideBadge && (
          <Html position={[0, !isDown ? 0.95 : -0.95, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div
              className={`px-2.5 py-1 rounded-full font-mono font-black text-[11px] text-white shadow-md border whitespace-nowrap ${badgeClass}`}
            >
              {badgeText}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

function ElectronSpin3D({
  selectedSpins,
  hideBadge = false,
}: {
  selectedSpins: SpinOption[];
  hideBadge?: boolean;
}) {
  if (!selectedSpins || selectedSpins.length === 0) {
    return null;
  }

  const hasPlusHalf = selectedSpins.includes('+1/2');
  const hasMinusHalf = selectedSpins.includes('-1/2');
  const hasPlusFourth = selectedSpins.includes('+1/4');
  const hasMinusFourth = selectedSpins.includes('-1/4');

  // Top spin (spin-up): fixed right on the top axis (x=0, y=+baseY)
  const topSpin = hasPlusFourth ? '+1/4' : hasPlusHalf ? '+1/2' : null;

  // Bottom spin (spin-down): fixed right on the bottom axis (x=0, y=-baseY)
  const bottomSpin = hasMinusFourth ? '-1/4' : hasMinusHalf ? '-1/2' : null;

  return (
    <group>
      {topSpin && (
        <SingleElectronSpinParticle
          key={topSpin}
          isDown={false}
          color={topSpin === '+1/2' ? '#10B981' : '#8B5CF6'}
          badgeText={`m_s = ${topSpin} (↑)`}
          badgeClass={
            topSpin === '+1/2'
              ? 'bg-emerald-600 border-emerald-400'
              : 'bg-purple-600 border-purple-400'
          }
          baseY={1.35}
          hideBadge={hideBadge}
        />
      )}
      {bottomSpin && (
        <SingleElectronSpinParticle
          key={bottomSpin}
          isDown={true}
          color={bottomSpin === '-1/2' ? '#10B981' : '#8B5CF6'}
          badgeText={`m_s = ${bottomSpin} (↓)`}
          badgeClass={
            bottomSpin === '-1/2'
              ? 'bg-emerald-600 border-emerald-400'
              : 'bg-purple-600 border-purple-400'
          }
          baseY={1.35}
          hideBadge={hideBadge}
        />
      )}
    </group>
  );
}

// ── Concentric Shells Atom Visualizer for Mission 1 ─────────────────────────
function Shells2DVisualizer({
  selectedN,
  targetN,
  onSelectShell,
}: {
  selectedN: number | null;
  targetN: number;
  onSelectShell: (n: number) => void;
}) {
  const shells = [
    { n: 1, label: 'K Shell (n=1)', r: 44, color: '#0EA5E9' },
    { n: 2, label: 'L Shell (n=2)', r: 86, color: '#3B82F6' },
    { n: 3, label: 'M Shell (n=3)', r: 130, color: '#6366F1' },
    { n: 4, label: 'N Shell (n=4)', r: 174, color: '#8B5CF6' },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden p-0">
      <svg
        viewBox="-182 -194 364 380"
        className="w-full h-full filter drop-shadow-sm"
      >
        <defs>
          <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
            <stop offset="60%" stopColor="#DC2626" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#991B1B" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Nucleus Core */}
        <circle cx="0" cy="0" r="18" fill="url(#nucleusGlow)" />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="11"
          fontWeight="bold"
          className="pointer-events-none font-mono"
        >
          +Ze
        </text>

        {/* Concentric Shells */}
        {shells.map((s) => {
          const isSelected = selectedN === s.n;
          const isTarget = isSelected && s.n === targetN;

          return (
            <g
              key={s.n}
              onClick={() => onSelectShell(s.n)}
              className="cursor-pointer group"
            >
              {/* Shell Orbit Track */}
              <circle
                cx="0"
                cy="0"
                r={s.r}
                fill={isSelected ? (isTarget ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') : 'transparent'}
                stroke={
                  isSelected
                    ? isTarget
                      ? '#10B981'
                      : '#EF4444'
                    : s.color
                }
                strokeWidth={isSelected ? '4' : '2.5'}
                strokeDasharray={isSelected ? 'none' : '5,4'}
                className="transition-all duration-300 group-hover:stroke-blue-600 group-hover:stroke-[3.5]"
              />

              {/* Clickable Area for easier thumb tapping on mobile */}
              <circle
                cx="0"
                cy="0"
                r={s.r}
                fill="none"
                stroke="transparent"
                strokeWidth="26"
              />

              {/* Electron Marker on Orbit */}
              <circle
                cx={s.r * Math.cos((s.n * Math.PI) / 2.3)}
                cy={s.r * Math.sin((s.n * Math.PI) / 2.3)}
                r={isSelected ? 7 : 5}
                fill={isSelected ? (isTarget ? '#10B981' : '#EF4444') : '#2563EB'}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-300"
              />

              {/* Shell Tag Badge */}
              <g
                transform={`translate(0, ${-s.r})`}
                className="pointer-events-none transition-transform duration-200"
              >
                <rect
                  x="-22"
                  y="-13"
                  width="44"
                  height="18"
                  rx="9"
                  fill={
                    isSelected
                      ? isTarget
                        ? '#10B981'
                        : '#EF4444'
                      : '#F1F5F9'
                  }
                  stroke={isSelected ? '#FFFFFF' : '#CBD5E1'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#334155'}
                  fontSize="10.5"
                  fontWeight="bold"
                  className="font-mono"
                >
                  n = {s.n}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export interface QuantumNumbersLevel2GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function QuantumNumbersLevel2GamePage({
  difficulty = 'level2',
  onExit,
}: QuantumNumbersLevel2GamePageProps) {
  // Navigation Screens: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Active Mission Stage (1 through 3: S1 = n, S2 = l, S3 = ms)
  const [activeStage, setActiveStage] = useState<1 | 2 | 3>(1);

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score] = useState(150);

  // ── Mission 1 State: Principal Energy Level n ──
  const [targetN] = useState<number>(3); // Target: n = 3
  const [selectedN, setSelectedN] = useState<number | null>(null);
  const [m1Correct, setM1Correct] = useState(false);

  // ── Mission 2 State: Subshell l ──
  const [selectedL, setSelectedL] = useState<number | null>(null);
  const [m2Correct, setM2Correct] = useState(false);

  // Dynamically update the 3D orbital model on top when selecting l = 0 (s), l = 1 (p), or l = 2 (d)
  const currentMission2Orbital = useMemo<'s' | 'pz' | 'dxy'>(() => {
    if (selectedL === 0) return 's';
    if (selectedL === 1) return 'pz';
    return 'dxy'; // default or when l = 2 is selected
  }, [selectedL]);

  // ── Mission 3 State: Electron Spin ms ──
  const [selectedSpins, setSelectedSpins] = useState<SpinOption[]>([]);
  const [m3Confirmed, setM3Confirmed] = useState(false);

  // General Instant Feedback banner
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Reset current mission
  const handleResetCurrentMission = () => {
    playSound('click');
    setFeedback(null);
    if (activeStage === 1) {
      setSelectedN(null);
      setM1Correct(false);
    } else if (activeStage === 2) {
      setSelectedL(null);
      setM2Correct(false);
    } else if (activeStage === 3) {
      setSelectedSpins([]);
      setM3Confirmed(false);
    }
  };

  // ── Mission Handlers ──
  const handleMission1Select = (nVal: number) => {
    setSelectedN(nVal);
    if (nVal === targetN) {
      playSound('correct');
      setM1Correct(true);
      setFeedback({
        type: 'success',
        message: 'Correct! n = 3 defines the 3rd energy level (M shell) with 3 subshells (s, p, d).',
      });
    } else {
      playSound('wrong');
      setM1Correct(false);
      setFeedback({
        type: 'error',
        message: `Incorrect! That is n = ${nVal}. Tap the shell where n = ${targetN}.`,
      });
    }
  };

  const handleMission2Select = (lVal: number) => {
    setSelectedL(lVal);
    // target is dxy -> l = 2 (d subshell)
    if (lVal === 2) {
      playSound('correct');
      setM2Correct(true);
      setFeedback({
        type: 'success',
        message: 'Correct! The 4-leaf clover geometry is a d-orbital with angular momentum l = 2.',
      });
    } else {
      playSound('wrong');
      setM2Correct(false);
      const names = ['spherical s orbital', 'two-lobed dumbbell p orbital'];
      setFeedback({
        type: 'error',
        message: `Now viewing ${names[lVal]} (l = ${lVal}) above. For the n = 3 challenge, find the d orbital with l = 2.`,
      });
    }
  };

  const handleMissionSpinToggle = (spin: SpinOption) => {
    setSelectedSpins((prev) => {
      const isAlreadySelected = prev.includes(spin);
      const next = isAlreadySelected
        ? prev.filter((s) => s !== spin)
        : [...prev, spin];

      const hasPlusHalf = next.includes('+1/2');
      const hasMinusHalf = next.includes('-1/2');
      const hasPlusFourth = next.includes('+1/4');
      const hasMinusFourth = next.includes('-1/4');

      const isBothCorrectOnly = hasPlusHalf && hasMinusHalf && !hasPlusFourth && !hasMinusFourth;

      if (isBothCorrectOnly) {
        playSound('correct');
        setM3Confirmed(true);
        setFeedback({
          type: 'success',
          message: 'Excellent! Both +1/2 and -1/2 selected. Opposite spins (↑↓) satisfy Pauli exclusion!',
        });
      } else if (hasPlusFourth || hasMinusFourth) {
        playSound('wrong');
        setM3Confirmed(false);
        setFeedback({
          type: 'error',
          message: 'Spin (m_s) cannot be ±1/4. Only ±1/2 are valid. Deselect invalid values.',
        });
      } else if (hasPlusHalf && !hasMinusHalf) {
        playSound('click');
        setM3Confirmed(false);
        setFeedback({
          type: 'info',
          message: 'Selected +1/2 (Spin-Up). Now also select -1/2 (Spin-Down) to pair the electrons.',
        });
      } else if (!hasPlusHalf && hasMinusHalf) {
        playSound('click');
        setM3Confirmed(false);
        setFeedback({
          type: 'info',
          message: 'Selected -1/2 (Spin-Down). Now also select +1/2 (Spin-Up) to pair the electrons.',
        });
      } else {
        setM3Confirmed(false);
        setFeedback(null);
      }

      return next;
    });
  };

  const handleNextStage = () => {
    playSound('click');
    setFeedback(null);
    if (activeStage < 3) {
      setActiveStage((prev) => (prev + 1) as 1 | 2 | 3);
    } else {
      setIsCompleted(true);
      playSound('complete');
    }
  };

  const handlePlayAgain = () => {
    playSound('click');
    setIsCompleted(false);
    setActiveStage(1);
    setSelectedN(null);
    setM1Correct(false);
    setSelectedL(null);
    setM2Correct(false);
    setSelectedSpins([]);
    setM3Confirmed(false);
    setFeedback(null);
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-2.5 max-w-[440px] mx-auto">
      {/* ── SCREEN 1 & 2: MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-2.5 sm:p-3 bg-white/98 backdrop-blur-md overflow-hidden">
          {/* Top Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* SCREEN 1: MISSION TARGET OVERVIEW */}
          {introStep === 'mission' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                QUANTUM NUMBERS &amp; ATOMIC ORBITALS
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Choose the correct quantum numbers and electron spin to build the 3D orbital and complete the quantum challenge.
              </h1>

              {/* Next Button */}
              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setIntroStep('instructions');
                  }}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 2: INSTRUCTIONS SCREEN (COMFORTABLE HEIGHT, NO SCROLL) */}
          {introStep === 'instructions' && (
            <div className="max-w-md mx-auto flex flex-col justify-between z-10 px-1 sm:px-2 py-1 animate-in fade-in duration-200 w-full flex-1 min-h-0 overflow-hidden">
              <div className="text-center pt-1 pb-2 shrink-0">
                <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              {/* Instructions Cards (Generous Height, Beautifully Spaced, No Scroll) */}
              <div className="flex flex-col gap-2.5 sm:gap-3 w-full my-auto flex-1 justify-center min-h-0">
                {/* ── CARD 1: Principal Quantum Number (n) ── */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-200/90 flex flex-col">
                  <div className="flex items-center justify-between gap-2 pb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                        Choose Principal Quantum Number (n)
                      </h3>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[9px] tracking-wide shrink-0">
                      Shell Energy
                    </span>
                  </div>

                  {/* Visual Preview Matching User Image 2 (Matched Height) */}
                  <div className="mt-1 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { n: 1, shell: 'K Shell', color: '#0284C7', ringSize: 'w-4 h-4' },
                        { n: 2, shell: 'L Shell', color: '#3B82F6', ringSize: 'w-5 h-5' },
                        { n: 3, shell: 'M Shell', color: '#6366F1', ringSize: 'w-6 h-6' },
                        { n: 4, shell: 'N Shell', color: '#8B5CF6', ringSize: 'w-7 h-7' },
                      ].map((item) => (
                        <div
                          key={item.n}
                          className="h-22 sm:h-24 py-2 px-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs sm:text-sm font-black font-mono text-slate-800">
                              n = {item.n}
                            </span>
                          </div>
                          <div className="my-auto flex items-center justify-center">
                            <div
                              className={`${item.ringSize} rounded-full border-2 border-dashed flex items-center justify-center`}
                              style={{ borderColor: item.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            </div>
                          </div>
                          <span className="text-[9.5px] sm:text-[10px] text-slate-600 font-bold pb-0.5">{item.shell}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── CARD 2: Orbital Angular Momentum Quantum Number (l) ── */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-200/90 flex flex-col">
                  <div className="flex items-center justify-between gap-2 pb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                        Select Orbital Angular Momentum (l)
                      </h3>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[9px] tracking-wide shrink-0">
                      Subshell 3D Shape
                    </span>
                  </div>

                  {/* Visual Preview Matching User Image 3 (Matched Height) */}
                  <div className="mt-1 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80">
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* l = 0 */}
                      <div className="h-22 sm:h-24 py-2 px-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between">
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-2xs" />
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-800">l = 0</span>
                        </div>
                        <div className="my-auto flex items-center justify-center">
                          <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                            <defs>
                              <radialGradient id="instSphereLg" cx="35%" cy="35%" r="65%">
                                <stop offset="0%" stopColor="#60A5FA" />
                                <stop offset="55%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#1D4ED8" />
                              </radialGradient>
                            </defs>
                            <circle cx="20" cy="20" r="14" fill="url(#instSphereLg)" />
                            <ellipse cx="16" cy="15" rx="5" ry="3" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 16 15)" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-700 font-bold pb-0.5">Spherical</span>
                      </div>

                      {/* l = 1 */}
                      <div className="h-22 sm:h-24 py-2 px-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between">
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-800">l = 1</span>
                        </div>
                        <div className="my-auto flex items-center justify-center">
                          <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                            <ellipse cx="20" cy="11.5" rx="5.5" ry="8" fill="#EF4444" />
                            <ellipse cx="18" cy="9" rx="2.5" ry="3.5" fill="#FFFFFF" opacity="0.35" />
                            <ellipse cx="20" cy="28.5" rx="5.5" ry="8" fill="#3B82F6" />
                            <ellipse cx="18" cy="26" rx="2.5" ry="3.5" fill="#FFFFFF" opacity="0.35" />
                            <circle cx="20" cy="20" r="1.5" fill="#475569" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-700 font-bold pb-0.5">Dumbbell</span>
                      </div>

                      {/* l = 2 */}
                      <div className="h-22 sm:h-24 py-2 px-1 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-between">
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 shadow-2xs" />
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-800">l = 2</span>
                        </div>
                        <div className="my-auto flex items-center justify-center">
                          <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                            <g transform="rotate(45 20 20)">
                              <ellipse cx="20" cy="10.5" rx="5" ry="7.5" fill="#EF4444" />
                              <ellipse cx="20" cy="29.5" rx="5" ry="7.5" fill="#EF4444" />
                              <ellipse cx="10.5" cy="20" rx="7.5" ry="5" fill="#3B82F6" />
                              <ellipse cx="29.5" cy="20" rx="7.5" ry="5" fill="#3B82F6" />
                              <circle cx="20" cy="20" r="1.8" fill="#334155" />
                            </g>
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-slate-700 font-bold pb-0.5">Cloverleaf</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CARD 3: Electron Spin Quantum Numbers (m_s) ── */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-200/90 flex flex-col">
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                        Select Electron Spins (m_s)
                      </h3>
                    </div>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] tracking-wide shrink-0">
                      Pauli Exclusion
                    </span>
                  </div>

                  {/* Visual Preview Matching User Image 4 */}
                  <div className="mt-1 p-2 bg-slate-50/90 rounded-xl border border-slate-200/80">
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { val: '+1/2', sub: 'Spin-Up (↑)', icon: ArrowUp },
                        { val: '-1/2', sub: 'Spin-Down (↓)', icon: ArrowDown },
                        { val: '+1/4', sub: 'Spin-Up (↑)', icon: ArrowUp },
                        { val: '-1/4', sub: 'Spin-Down (↓)', icon: ArrowDown },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={idx}
                            className="h-10 sm:h-11 py-1.5 px-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                <Icon className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] sm:text-[11px] font-black font-mono text-slate-800 leading-none">
                                  m_s = {item.val}
                                </span>
                                <span className="text-[8px] text-slate-400 font-medium truncate mt-0.5">
                                  {item.sub}
                                </span>
                              </div>
                            </div>
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 ml-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar: Back and Play Buttons */}
              <div className="pt-2 pb-1 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setIntroStep('mission');
                  }}
                  className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('correct');
                    setGameStarted(true);
                  }}
                  className="px-8 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer note on mission step */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0 pb-1">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE GAMEPLAY (UNIFIED SINGLE CANVAS - EXACTLY MATCHING IMAGE 3) ── */}
      {gameStarted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {/* ── 1. TOP TOOLBAR HEADER (EXIT & EXPLANATION) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-1 mb-1">
            {/* Top Left: Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Top Right: Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="h-8 px-2.5 sm:px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              title="View quantum theory explanation"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Explanation</span>
            </button>
          </header>

          {/* ── 2. CENTER VISUAL STAGE (SEAMLESS CANVAS - NO INNER BORDER!) ── */}
          <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-white flex items-center justify-center my-auto">
            {/* Mission 1: Concentric 2D Shells Visualizer */}
            {activeStage === 1 && (
              <Shells2DVisualizer
                selectedN={selectedN}
                targetN={targetN}
                onSelectShell={handleMission1Select}
              />
            )}

            {/* Missions 2 & 3: Three.js 3D Viewport */}
            {activeStage >= 2 && activeStage <= 3 && (
              <div className="w-full h-full relative bg-white">
                <Canvas
                  camera={{ position: [0, 0, 5.2], fov: 45 }}
                  className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
                >
                  <color attach="background" args={['#FFFFFF']} />
                  <ambientLight intensity={1.1} />
                  <directionalLight position={[6, 8, 6]} intensity={1.3} />
                  <directionalLight position={[-6, -4, -6]} intensity={0.5} />
                  <pointLight position={[0, 4, 3]} intensity={0.5} color="#FFFFFF" />

                  {/* Mission 2: Identifying Subshell l */}
                  {activeStage === 2 && (
                    <group key={currentMission2Orbital} scale={0.92}>
                      <OrbitalRenderer
                        orbitalId={currentMission2Orbital}
                        autoRotate={true}
                        hideLabels={isCompleted || showExplanationModal}
                      />
                    </group>
                  )}

                  {/* Mission 3: 3D Orbital with Electron Spin Indicator */}
                  {activeStage === 3 && (
                    <group scale={0.78}>
                      <OrbitalRenderer
                        orbitalId="dxy"
                        autoRotate={false}
                        hideLabels={isCompleted || showExplanationModal}
                      />
                      <ElectronSpin3D
                        selectedSpins={selectedSpins}
                        hideBadge={isCompleted || showExplanationModal}
                      />
                    </group>
                  )}

                  <OrbitControls
                    makeDefault
                    enableZoom={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 8}
                    maxPolarAngle={(7 * Math.PI) / 8}
                  />
                </Canvas>

                {/* Touch interaction helper hint */}
                <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/60 backdrop-blur-sm text-white text-[9px] font-mono pointer-events-none">
                  Drag to rotate in 3D
                </div>
              </div>
            )}
          </div>

          {/* ── 3. LOWER SECTION: BIG BUTTONS TRAY (MATCHING IMAGE 3 EXACTLY) ── */}
          <div className="w-full pt-1.5 pb-0.5 shrink-0 flex flex-col justify-end">
            {/* Mission 1 Controls: Principal Quantum Number n */}
            {activeStage === 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-800 px-1">
                  <span>1. Find the Energy Level (n)</span>

                </div>


                {/* BIG BUTTONS GRID FOR STAGE 1 */}
                <div className="grid grid-cols-4 gap-2 pt-0.5">
                  {[
                    { n: 1, shell: 'K Shell', color: '#0EA5E9' },
                    { n: 2, shell: 'L Shell', color: '#3B82F6' },
                    { n: 3, shell: 'M Shell', color: '#6366F1' },
                    { n: 4, shell: 'N Shell', color: '#8B5CF6' },
                  ].map((item) => {
                    const isSelected = selectedN === item.n;
                    const isTarget = isSelected && item.n === targetN;
                    return (
                      <button
                        key={item.n}
                        type="button"
                        onClick={() => handleMission1Select(item.n)}
                        className={`h-20 sm:h-22 py-2 px-1 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${isSelected
                          ? isTarget
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 text-emerald-950 shadow-sm'
                            : 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 text-rose-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800 hover:border-sky-300'
                          }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm font-black font-mono">
                            n = {item.n}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold text-center leading-tight">
                          {item.shell}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Note */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[10px] leading-tight">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>The principal quantum number (n) describes the electron shell size and energy level.</span>
                </div>
              </div>
            )}

            {/* Mission 2 Controls: Orbital Angular Momentum Quantum Number l */}
            {activeStage === 2 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-800 px-1">
                  <span>2. Select the Orbital Angular Momentum Quantum Number</span>
                </div>


                {/* BIG BUTTONS GRID FOR STAGE 2: L = 0, 1, 2 */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
                  {[
                    {
                      l: 0,
                      shape: 'Spherical',
                      color: '#3B82F6',
                      renderIcon: () => (
                        <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                          <defs>
                            <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="55%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#1D4ED8" />
                            </radialGradient>
                          </defs>
                          <circle cx="20" cy="20" r="14" fill="url(#sphereGrad)" />
                          <ellipse cx="16" cy="15" rx="5" ry="3" fill="#FFFFFF" opacity="0.4" transform="rotate(-30 16 15)" />
                        </svg>
                      ),
                    },
                    {
                      l: 1,
                      shape: 'Dumbbell',
                      color: '#10B981',
                      renderIcon: () => (
                        <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                          <defs>
                            <radialGradient id="pLobeRed" cx="35%" cy="30%" r="70%">
                              <stop offset="0%" stopColor="#F87171" />
                              <stop offset="60%" stopColor="#EF4444" />
                              <stop offset="100%" stopColor="#B91C1C" />
                            </radialGradient>
                            <radialGradient id="pLobeBlue" cx="65%" cy="70%" r="70%">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="60%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#1D4ED8" />
                            </radialGradient>
                          </defs>
                          <ellipse cx="20" cy="11" rx="6" ry="8.5" fill="url(#pLobeRed)" />
                          <ellipse cx="18" cy="8.5" rx="2.5" ry="3.5" fill="#FFFFFF" opacity="0.35" />
                          <ellipse cx="20" cy="29" rx="6" ry="8.5" fill="url(#pLobeBlue)" />
                          <ellipse cx="18" cy="26.5" rx="2.5" ry="3.5" fill="#FFFFFF" opacity="0.35" />
                          <circle cx="20" cy="20" r="1.5" fill="#475569" />
                        </svg>
                      ),
                    },
                    {
                      l: 2,
                      shape: 'Cloverleaf',
                      color: '#8B5CF6',
                      renderIcon: () => (
                        <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9">
                          <defs>
                            <radialGradient id="dLobeRed" cx="35%" cy="35%" r="70%">
                              <stop offset="0%" stopColor="#F87171" />
                              <stop offset="70%" stopColor="#EF4444" />
                              <stop offset="100%" stopColor="#B91C1C" />
                            </radialGradient>
                            <radialGradient id="dLobeBlue" cx="35%" cy="35%" r="70%">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="70%" stopColor="#3B82F6" />
                              <stop offset="100%" stopColor="#1D4ED8" />
                            </radialGradient>
                          </defs>
                          <g transform="rotate(45 20 20)">
                            <ellipse cx="20" cy="10" rx="5" ry="7.5" fill="url(#dLobeRed)" />
                            <ellipse cx="20" cy="30" rx="5" ry="7.5" fill="url(#dLobeRed)" />
                            <ellipse cx="10" cy="20" rx="7.5" ry="5" fill="url(#dLobeBlue)" />
                            <ellipse cx="30" cy="20" rx="7.5" ry="5" fill="url(#dLobeBlue)" />
                            <circle cx="20" cy="20" r="1.8" fill="#334155" />
                          </g>
                        </svg>
                      ),
                    },
                  ].map((item) => {
                    const isSelected = selectedL === item.l;
                    const isCorrectChoice = isSelected && item.l === 2;
                    return (
                      <button
                        key={item.l}
                        type="button"
                        onClick={() => handleMission2Select(item.l)}
                        className={`h-22 sm:h-24 py-1.5 px-1 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer shadow-xs active:scale-95 ${isSelected
                          ? isCorrectChoice
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 text-emerald-950 shadow-sm'
                            : 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 text-rose-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800 hover:border-sky-300'
                          }`}
                      >
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-xs sm:text-sm font-black font-mono text-[#1E293B]">
                            l = {item.l}
                          </span>
                        </div>
                        <div className="my-auto flex items-center justify-center">
                          {item.renderIcon()}
                        </div>
                        <div className="text-[10px] text-slate-600 font-bold text-center leading-tight pb-0.5">
                          {item.shape}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Note */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-[10px] leading-tight">
                  <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>The orbital angular momentum quantum number (l) dictates the 3D angular shape of the orbital cloud.</span>
                </div>
              </div>
            )}

            {/* Mission 3 Controls: Electron Spin ms */}
            {activeStage === 3 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-800 px-1">
                  <span>3. Electron Spin Quantum Numbers (m_s)</span>
                  <span className="text-blue-600 font-mono font-black">Pauli Exclusion</span>
                </div>


                {/* 4 OPTIONS IN A 2x2 GRID (2 IN ROW, BELOW 2 - BIG BOXES) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
                  {[
                    {
                      id: '+1/2' as const,
                      spinValue: '+1/2',
                      sub: 'Spin-Up (↑)',
                      isCorrect: true,
                      icon: ArrowUp,
                    },
                    {
                      id: '-1/2' as const,
                      spinValue: '-1/2',
                      sub: 'Spin-Down (↓)',
                      isCorrect: true,
                      icon: ArrowDown,
                    },
                    {
                      id: '+1/4' as const,
                      spinValue: '+1/4',
                      sub: 'Spin-Up (↑)',
                      isCorrect: false,
                      icon: ArrowUp,
                    },
                    {
                      id: '-1/4' as const,
                      spinValue: '-1/4',
                      sub: 'Spin-Down (↓)',
                      isCorrect: false,
                      icon: ArrowDown,
                    },
                  ].map((item) => {
                    const isSelected = selectedSpins.includes(item.id);
                    const IconComponent = isSelected && !item.isCorrect ? X : item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleMissionSpinToggle(item.id)}
                        className={`min-h-[72px] sm:min-h-[78px] py-2.5 px-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-95 ${isSelected
                          ? item.isCorrect
                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 text-emerald-950 shadow-sm'
                            : 'bg-rose-50 border-rose-400 ring-2 ring-rose-300 text-rose-950 shadow-sm'
                          : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-800 hover:border-sky-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected
                              ? item.isCorrect
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                              : 'bg-slate-200/80 text-slate-600'
                              }`}
                          >
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                          </div>
                          <div className="flex flex-col text-left min-w-0">
                            <div className="flex items-baseline gap-1 leading-none">
                              <span className="text-[11px] sm:text-xs font-bold text-slate-500 font-mono tracking-tight">
                                m_s =
                              </span>
                              <span
                                className={`text-base sm:text-lg font-black font-mono tracking-tight ${isSelected
                                  ? item.isCorrect
                                    ? 'text-emerald-950'
                                    : 'text-rose-950'
                                  : 'text-slate-900'
                                  }`}
                              >
                                {item.spinValue}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] sm:text-[11px] font-bold mt-1 leading-tight truncate ${isSelected
                                ? item.isCorrect
                                  ? 'text-slate-600'
                                  : 'text-rose-600 font-extrabold'
                                : 'text-slate-400'
                                }`}
                            >
                              {isSelected
                                ? item.isCorrect
                                  ? 'Selected (✓)'
                                  : 'Incorrect (✗)'
                                : item.sub}
                            </span>
                          </div>
                        </div>

                        {/* Selection check indicator */}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ml-1 ${isSelected
                            ? item.isCorrect
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-rose-600 border-rose-600 text-white'
                            : 'border-slate-300 bg-white'
                            }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pedagogical Note */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] leading-tight">
                  <Atom className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>By Pauli Exclusion Principle, two electrons in the same orbital must have opposite spins (↑↓).</span>
                </div>
              </div>
            )}

            {/* Action Footer: Feedback Banner & Primary Next Button */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {/* N Avatar Badge (Matching Image 3) */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-sm">
                N
              </div>

              <div className="flex-1 min-w-0">
                {feedback && (
                  <div
                    className={`text-[11px] leading-tight font-medium px-2.5 py-1 rounded-xl border truncate ${feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : feedback.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    title={feedback.message}
                  >
                    {feedback.message}
                  </div>
                )}
              </div>

              {/* Next / Finish Stage Button: in Stage 3, button appears only when both +1/2 and -1/2 are selected */}
              {activeStage === 3 ? (
                m3Confirmed ? (
                  <button
                    type="button"
                    onClick={handleNextStage}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg border border-emerald-400/50 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 shrink-0"
                  >
                    <span>Finish Challenge →</span>
                  </button>
                ) : (
                  <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 shrink-0">
                    Select both ±½ to finish
                  </div>
                )
              ) : (
                <button
                  type="button"
                  disabled={
                    (activeStage === 1 && !m1Correct) ||
                    (activeStage === 2 && !m2Correct)
                  }
                  onClick={handleNextStage}
                  className="px-6 py-2 bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 disabled:opacity-40 disabled:cursor-not-allowed text-teal-200 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md border border-teal-400/50 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-102 active:scale-95 shrink-0"
                >
                  <span>NEXT →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLETION MODAL / CELEBRATION (Image 5 Mission Complete) ──────────── */}
      {isCompleted && (
        <div className="absolute inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-3.5 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-[#1E293B]">
              Mission Complete!
            </h3>

            <p className="text-slate-600 text-xs leading-relaxed">
              You've successfully mastered quantum numbers (n, l, m_s) and electron spin!
            </p>

            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>+{score} Mastery Points</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePlayAgain}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
              <button
                type="button"
                onClick={() => (onExit ? onExit() : exitSimulation())}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Exit to Curriculum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEXTBOOK EXPLANATION MODAL (Matching MotEasyGamePage typography) ─── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[99999] bg-white text-black flex flex-col overflow-hidden select-text animate-in fade-in duration-200 font-sans">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-black" />
              <h2 className="text-base sm:text-lg font-bold text-black tracking-tight">
                Quantum Numbers &amp; Atomic Orbitals Guide
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="p-1 rounded-full hover:bg-neutral-200 text-black transition-colors cursor-pointer"
              title="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 text-sm sm:text-base leading-relaxed text-black max-w-3xl mx-auto w-full">
            {/* Section 1: The 4 Quantum Numbers */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-black">
                1. The Four Quantum Numbers
              </h3>
              <p className="text-black">
                In wave mechanics, the spatial distribution and energy of an electron in an atom are completely specified by four quantum numbers:
              </p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-black">
                <li>
                  <strong>Principal Quantum Number (n):</strong> Takes positive integer values (n = 1, 2, 3, 4...). It dictates the size of the electron cloud and the primary energy level of the shell. As n increases, the electron spends more time further from the nucleus.
                </li>
                <li>
                  <strong>Azimuthal / Angular Momentum Quantum Number (l):</strong> Takes values from 0 to n - 1. It defines the three-dimensional geometric shape of the orbital cloud:
                  <ul className="list-circle pl-5 mt-1 space-y-0.5">
                    <li>l = 0 → <strong>s orbital</strong> (Spherical cloud)</li>
                    <li>l = 1 → <strong>p orbital</strong> (Dumbbell shape with 1 nodal plane)</li>
                    <li>l = 2 → <strong>d orbital</strong> (Four-leaf cloverleaf or torus dumbbell)</li>
                    <li>l = 3 → <strong>f orbital</strong> (Complex 8-lobed geometries)</li>
                  </ul>
                </li>
                <li>
                  <strong>Magnetic Quantum Number (m_l):</strong> Takes integer values from -l to +l, giving exactly (2l + 1) allowed spatial quantum states. It describes the spatial orientation of the orbital angular momentum vector under an external magnetic field.
                </li>
                <li>
                  <strong>Spin Quantum Number (m_s):</strong> Takes values of +1/2 (spin-up ↑) or -1/2 (spin-down ↓). It represents the intrinsic angular momentum of the electron.
                </li>
              </ul>
            </div>

            {/* Section 2: Scientific Accuracy on Magnetic States */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-black">
                2. Why m_l Identifies Allowed States, Not Pure Cartesian Axes
              </h3>
              <p className="text-black">
                A common misconception is mapping m_l = -1, 0, +1 strictly to p_x, p_y, p_z. In quantum mechanics:
              </p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-black">
                <li>
                  Only the <strong>p_z orbital</strong> corresponds directly to a pure eigenstate of orbital angular momentum (m_l = 0).
                </li>
                <li>
                  The real <strong>p_x and p_y orbitals</strong> are linear combinations (superpositions) of the complex spherical harmonics Y₁¹ and Y₁⁻¹:
                  <br />
                  <span className="font-mono text-xs sm:text-sm pl-2">p_x = (Y₁¹ + Y₁⁻¹) / √2</span>
                  <br />
                  <span className="font-mono text-xs sm:text-sm pl-2">p_y = (Y₁¹ - Y₁⁻¹) / (i√2)</span>
                </li>
                <li>
                  Therefore, m_l identifies the <strong>(2l + 1) allowed quantum states</strong> in a magnetic field rather than an exclusive 1:1 tag for each Cartesian axis.
                </li>
              </ul>
            </div>

            {/* Section 3: Essential Quantum Rules & Pauli Exclusion */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-black">
                3. Quantum Rules &amp; Electron Capacities
              </h3>
              <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 text-black">
                <li>
                  <strong>Pauli Exclusion Principle:</strong> No two electrons in the same atom can possess the identical set of all four quantum numbers (n, l, m_l, m_s).
                </li>
                <li>
                  <strong>Orbital Capacity:</strong> Each orbital (defined by unique n, l, m_l) can hold a maximum of 2 electrons with opposite spins (↑↓).
                </li>
                <li>
                  <strong>Subshell Capacity:</strong> A subshell with angular momentum l contains (2l + 1) orbitals and holds at most 2(2l + 1) electrons (s=2, p=6, d=10, f=14).
                </li>
                <li>
                  <strong>Shell Capacity:</strong> An energy level n contains n² orbitals and accommodates a maximum of 2n² electrons.
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
