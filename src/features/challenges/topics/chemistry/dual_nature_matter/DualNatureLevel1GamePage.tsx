'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  BookOpen,
  X,
  CheckCircle2,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── LIGHTWEIGHT WEB AUDIO SYNTHESIZER ─────────────────────────────────────────
function playAudioTone(type: 'click' | 'correct' | 'wrong' | 'unlock' | 'laser') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'unlock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'laser') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    // Web audio might be restricted before user gesture
  }
}

// ── QUANTUM DOUBLE-SLIT PROBABILITY DISTRIBUTION SAMPLER ─────────────────────
// Uses physical double-slit formula: P(x) = [cos(pi*d*x / (lambda*L))]^2 * [sinc(pi*a*x / (lambda*L))]^2
function sampleDoubleSlitX(): number {
  // Rejection sampling strictly contained within detection plate bounds (-1.55 to +1.55)
  const xMin = -1.55;
  const xMax = 1.55;
  const d = 1.6; // slit separation parameter
  const a = 0.45; // slit width parameter

  for (let iter = 0; iter < 1000; iter++) {
    const x = xMin + Math.random() * (xMax - xMin);
    const beta = Math.PI * d * x * 0.9;
    const alpha = Math.PI * a * x * 0.9;
    const sinc = alpha === 0 ? 1 : Math.sin(alpha) / alpha;
    const cosTerm = Math.cos(beta);
    const prob = cosTerm * cosTerm * sinc * sinc;

    if (Math.random() <= prob) {
      return x;
    }
  }
  return (Math.random() - 0.5) * 1.5;
}

// ── 3D LAB COMPONENTS ────────────────────────────────────────────────────────

// 1. Electron Gun (Cathode source with collimator and glow)
function ElectronGun3D({
  isFiring,
  isInspected,
  onClick,
}: {
  isFiring: boolean;
  isInspected: boolean;
  onClick: () => void;
}) {
  const nozzleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nozzleRef.current && isFiring) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 14) * 0.15;
      nozzleRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[-3.8, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Base Mount */}
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.35, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Main Cylinder Chamber */}
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 1.4, 32]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Collimator Rings */}
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[-0.3, 0, 0]}>
        <torusGeometry args={[0.45, 0.05, 16, 32]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.2, 0, 0]}>
        <torusGeometry args={[0.45, 0.05, 16, 32]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Front Nozzle / Aperture */}
      <mesh ref={nozzleRef} rotation={[0, 0, -Math.PI / 2]} position={[0.75, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.35, 0.3, 24]} />
        <meshStandardMaterial
          color={isFiring ? '#06B6D4' : '#64748B'}
          emissive={isFiring ? '#0891B2' : '#000000'}
          emissiveIntensity={isFiring ? 0.9 : 0}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Cathode Internal Glow */}
      <pointLight position={[0.7, 0, 0]} intensity={isFiring ? 2.5 : 0.6} color="#06B6D4" distance={2.5} />

      {/* Component HTML Badge */}
      <Html position={[0, 0.85, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-md border whitespace-nowrap transition-all ${isInspected
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-white/95 border-blue-300 text-blue-700 animate-pulse'
            }`}
        >
          {isInspected ? '✓ Electron Gun' : 'Tap: Electron Gun'}
        </div>
      </Html>
    </group>
  );
}

// 2. Double-Slit Barrier
function DoubleSlitBarrier3D({
  isInspected,
  onClick,
}: {
  isInspected: boolean;
  onClick: () => void;
}) {
  return (
    <group position={[-0.8, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Top and Bottom Supporting Frame */}
      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[0.2, 0.35, 2.8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.2, 0.35, 2.8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Barrier Left Flank */}
      <mesh position={[0, 0, -0.9]}>
        <boxGeometry args={[0.12, 2.2, 0.9]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Barrier Center Divider (between the 2 slits) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 2.2, 0.45]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Barrier Right Flank */}
      <mesh position={[0, 0, 0.9]}>
        <boxGeometry args={[0.12, 2.2, 0.9]} />
        <meshStandardMaterial color="#334155" metalness={0.65} roughness={0.35} />
      </mesh>

      {/* Slit 1 (Left translucent blue slit guide) */}
      <mesh position={[0, 0, -0.32]}>
        <boxGeometry args={[0.122, 1.8, 0.12]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.55} emissive="#0284C7" emissiveIntensity={0.6} />
      </mesh>

      {/* Slit 2 (Right translucent blue slit guide) */}
      <mesh position={[0, 0, 0.32]}>
        <boxGeometry args={[0.122, 1.8, 0.12]} />
        <meshStandardMaterial color="#38BDF8" transparent opacity={0.55} emissive="#0284C7" emissiveIntensity={0.6} />
      </mesh>

      {/* Component HTML Badge */}
      <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-md border whitespace-nowrap transition-all ${isInspected
              ? 'bg-emerald-600 border-emerald-400 text-white'
              : 'bg-white/95 border-emerald-300 text-emerald-700 animate-pulse'
            }`}
        >
          {isInspected ? '✓ Double-Slit Barrier' : 'Tap: Double Slit'}
        </div>
      </Html>
    </group>
  );
}

// 3. Phosphor Detector Screen (Receives electron hits)
function PhosphorDetector3D({
  impactDots,
  showCurve,
  isInspected,
  onClick,
}: {
  impactDots: Array<{ id: number; x: number; y: number }>;
  showCurve: boolean;
  isInspected: boolean;
  onClick: () => void;
}) {
  return (
    <group position={[2.8, 0, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Outer Screen Frame */}
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[0.16, 2.9, 3.8]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Fluorescent Detection Plate Surface */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 2.7, 3.6]} />
        <meshStandardMaterial
          color="#064E3B"
          emissive="#022C22"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle Phosphorescent Glowing Interference Fringe Bands */}
      {impactDots.length >= 20 && (
        <group position={[-0.021, 0, 0]}>
          {[0, -0.69, 0.69, -1.38, 1.38].map((fringeZ, idx) => {
            const alpha = idx === 0 ? 0.2 : Math.abs(idx) === 1 ? 0.13 : 0.07;
            const width = idx === 0 ? 0.44 : 0.34;
            return (
              <mesh
                key={`fringe-${idx}`}
                position={[0, 0, fringeZ]}
                rotation={[0, -Math.PI / 2, 0]}
              >
                <planeGeometry args={[width, 2.65]} />
                <meshBasicMaterial
                  color="#10B981"
                  transparent
                  opacity={alpha}
                  toneMapped={false}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Detected Electron Glowing Hits rendered in 3D (Flat circular fluorescent marks) */}
      {impactDots.map((dot) => (
        <mesh
          key={`dot-${dot.id}`}
          position={[-0.022, dot.y, dot.x]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <circleGeometry args={[0.038, 16]} />
          <meshBasicMaterial color="#34D399" toneMapped={false} />
        </mesh>
      ))}

      {/* Overlay: Theoretical Interference Wave Intensity Curve (Smooth Upward Display) */}
      {showCurve && (
        <group position={[-0.03, 1.45, 0]}>
          {/* Glass readout backing panel */}
          <mesh position={[0, 0.38, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[3.4, 0.76]} />
            <meshStandardMaterial
              color="#0F172A"
              transparent
              opacity={0.88}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Thin blue zero-baseline */}
          <mesh position={[-0.005, 0.02, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[3.3, 0.02]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} />
          </mesh>

          {/* Smooth upward-rising wave curve */}
          {Array.from({ length: 70 }).map((_, idx) => {
            const zNorm = (idx / 69) * 3.2 - 1.6;
            const beta = Math.PI * 1.6 * zNorm * 0.9;
            const alpha = Math.PI * 0.45 * zNorm * 0.9;
            const sinc = alpha === 0 ? 1 : Math.sin(alpha) / alpha;
            const cosTerm = Math.cos(beta);
            const intensity = cosTerm * cosTerm * sinc * sinc;
            const barHeight = Math.max(0.015, intensity * 0.65);

            return (
              <mesh
                key={`curve-${idx}`}
                position={[-0.008, 0.02 + barHeight / 2, zNorm]}
                rotation={[0, -Math.PI / 2, 0]}
              >
                <planeGeometry args={[0.045, barHeight]} />
                <meshBasicMaterial
                  color="#FBBF24"
                  transparent
                  opacity={0.88}
                  toneMapped={false}
                />
              </mesh>
            );
          })}

          {/* Label: P(x) ∝ |Ψ|² */}
          <Html position={[0, 0.72, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="px-2 py-0.5 rounded-full bg-slate-900/95 border border-amber-400/80 text-amber-300 font-mono text-[9px] font-black shadow-md tracking-wider whitespace-nowrap">
              P(x) ∝ |Ψ|² (Wave Intensity)
            </div>
          </Html>
        </group>
      )}

      {/* Component HTML Badge */}
      <Html position={[0, showCurve ? 2.38 : 1.65, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-md border whitespace-nowrap transition-all ${isInspected
              ? 'bg-purple-600 border-purple-400 text-white'
              : 'bg-white/95 border-purple-300 text-purple-700 animate-pulse'
            }`}
        >
          {isInspected ? '✓ Phosphor Screen' : 'Tap: Phosphor Screen'}
        </div>
      </Html>
    </group>
  );
}

// 4. In-Flight Electron Wavepacket Beam
function FlyingElectrons3D({ isFiring }: { isFiring: boolean }) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 18;

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      t: Math.random(),
      speed: 0.35 + Math.random() * 0.25,
      ySpread: (Math.random() - 0.5) * 0.35,
      zSpread: (Math.random() - 0.5) * 0.35,
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!particlesRef.current || !isFiring) return;

    particles.forEach((p, i) => {
      p.t = (p.t + delta * p.speed) % 1;

      // Trajectory from Gun (-3.0) through Slits (-0.8) to Detector (2.7)
      const x = -3.0 + p.t * 5.7;
      let z = 0;

      if (x < -0.8) {
        // Pre-slit narrowing toward either left or right slit
        const targetSlit = i % 2 === 0 ? -0.32 : 0.32;
        const progress = Math.max(0, (x + 3.0) / 2.2);
        z = progress * targetSlit + p.zSpread * (1 - progress);
      } else {
        // Post-slit diffraction fan out toward interference distribution
        const slitZ = i % 2 === 0 ? -0.32 : 0.32;
        const postT = (x + 0.8) / 3.5;
        const fanZ = (i % 5 - 2) * 0.55;
        z = slitZ + postT * fanZ;
      }

      dummy.position.set(x, p.ySpread * (1 + (x + 3) * 0.1), z);
      const s = 0.065 + Math.sin(p.t * Math.PI) * 0.035;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      particlesRef.current!.setMatrixAt(i, dummy.matrix);
    });

    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isFiring) return null;

  return (
    <instancedMesh ref={particlesRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#0284C7" toneMapped={false} />
    </instancedMesh>
  );
}

// ── MAIN LANDSCAPE GAME PAGE COMPONENT ───────────────────────────────────────
export default function DualNatureLevel1GamePage({
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Stage Management: 1 = Prepare Lab, 2 = Discover Mystery
  const [stage, setStage] = useState<1 | 2>(1);

  // Stage 1: Lab Component Inspection State
  const [inspectedComponents, setInspectedComponents] = useState<{
    gun: boolean;
    slits: boolean;
    detector: boolean;
  }>({
    gun: false,
    slits: false,
    detector: false,
  });

  // Stage 2: Experiment Mode: 'observation' | 'predicting' | 'discovery' | 'completed'
  const [experimentStep, setExperimentStep] = useState<
    'observation' | 'predicting' | 'discovery' | 'completed'
  >('observation');

  // Electron impact dots accumulated on screen
  const [impactDots, setImpactDots] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [isFiring, setIsFiring] = useState(false);
  const [electronCount, setElectronCount] = useState(0);

  // Prediction challenge state
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [predictionFeedback, setPredictionFeedback] = useState<{
    isCorrect: boolean;
    title: string;
    text: string;
  } | null>(null);
  const [score, setScore] = useState(0);

  // Theoretical interference curve toggle
  const [showCurve, setShowCurve] = useState(false);

  // Modals & UI Feedback
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Handle Component Placement in Stage 1
  const handleInspectComponent = (key: 'gun' | 'slits' | 'detector') => {
    if (key === 'gun') {
      setInspectedComponents((prev) => ({ ...prev, gun: true }));
      playAudioTone('unlock');
    } else if (key === 'slits') {
      setInspectedComponents((prev) => ({ ...prev, slits: true }));
      playAudioTone('unlock');
    } else if (key === 'detector') {
      setInspectedComponents((prev) => ({ ...prev, detector: true }));
      playAudioTone('unlock');
    }
  };

  // Check if Stage 1 is fully unlocked
  const isLabPrepared =
    inspectedComponents.gun && inspectedComponents.slits && inspectedComponents.detector;

  // Advance from Stage 1 to Stage 2
  const handleStartExperiment = () => {
    setStage(2);
    setExperimentStep('observation');
    playAudioTone('correct');
  };

  // Stage 2 — Observation Round: Launch 20 electrons
  const handleLaunchObservationBatch = () => {
    if (isFiring) return;
    setIsFiring(true);
    playAudioTone('laser');

    let launched = 0;
    const interval = setInterval(() => {
      launched += 1;
      const xPos = sampleDoubleSlitX();
      const yPos = (Math.random() - 0.5) * 2.2;

      setImpactDots((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          x: xPos,
          y: yPos,
        },
      ]);
      setElectronCount((c) => c + 1);
      playAudioTone('click');

      if (launched >= 20) {
        clearInterval(interval);
        setIsFiring(false);
      }
    }, 90);
  };

  // Stage 2 — Submit Prediction Challenge
  const handleSelectPrediction = (choice: string) => {
    setSelectedPrediction(choice);

    if (choice === 'wave_interference') {
      setScore((s) => s + 100);
      setPredictionFeedback({
        isCorrect: true,
        title: '🎉 Outstanding Prediction! (+100 Quantum Points)',
        text: 'Electrons are quantum matter waves! Even though each lands as a single particle dot, the probability distribution produces an interference pattern with alternating bright and dark fringes.',
      });
      playAudioTone('correct');
    } else if (choice === 'two_lines') {
      setPredictionFeedback({
        isCorrect: false,
        title: 'Classical Intuition (Common Misconception)',
        text: 'Classical physics would predict two lines (like bullets or spray paint through two slits). But quantum matter waves pass through BOTH slits simultaneously and interfere with themselves!',
      });
      playAudioTone('wrong');
    } else if (choice === 'random_scatter') {
      setPredictionFeedback({
        isCorrect: false,
        title: 'Random Scatter Hypothesis',
        text: 'Uniform random scattering assumes zero coherence. In reality, de Broglie wave interference strictly channels electrons into alternating constructive fringes and destructive nodes!',
      });
      playAudioTone('wrong');
    } else {
      setPredictionFeedback({
        isCorrect: false,
        title: 'Concentric Rings Hypothesis',
        text: 'Concentric circular rings occur with circular pinholes. Two parallel vertical slits produce parallel vertical interference stripes!',
      });
      playAudioTone('wrong');
    }
  };

  // Stage 2 — Discovery Round: Launch 200 electrons to form full interference pattern
  const handleLaunchFullBatch = () => {
    if (isFiring) return;
    setIsFiring(true);
    setPredictionFeedback(null);
    playAudioTone('laser');

    let batchCount = 0;
    const totalToFire = 180; // Total 200 with previous 20

    const interval = setInterval(() => {
      batchCount += 5;
      const newDots: Array<{ id: number; x: number; y: number }> = [];

      for (let i = 0; i < 5; i++) {
        newDots.push({
          id: Date.now() + Math.random() + i,
          x: sampleDoubleSlitX(),
          y: (Math.random() - 0.5) * 2.2,
        });
      }

      setImpactDots((prev) => [...prev, ...newDots]);
      setElectronCount((c) => c + 5);
      playAudioTone('click');

      if (batchCount >= totalToFire) {
        clearInterval(interval);
        setIsFiring(false);
        setExperimentStep('completed');
        setShowCurve(true);
        playAudioTone('correct');
      }
    }, 45);
  };

  // Reset entire challenge
  const handleResetChallenge = () => {
    setStage(1);
    setInspectedComponents({ gun: false, slits: false, detector: false });
    setExperimentStep('observation');
    setImpactDots([]);
    setElectronCount(0);
    setIsFiring(false);
    setSelectedPrediction(null);
    setPredictionFeedback(null);
    setShowCurve(false);
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col">
      {/* ── SCREEN 1: MISSION SCREEN (Clean: Mission One-Liner + Next Button) ── */}
      {!gameStarted && introStep === 'mission' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Mission Center: One-Liner Title & Next Button That Is It */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#2563EB]">MISSION:</span> Discover Electron Wave-Particle Duality
            </h1>

            <div>
              <button
                type="button"
                onClick={() => setIntroStep('instructions')}
                className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          </div>

          {/* Empty spacer to keep center content vertically centered */}
          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ── SCREEN 2: INSTRUCTIONS SCREEN (Matching Reference Image 3 in Landscape) ── */}
      {!gameStarted && introStep === 'instructions' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-2.5 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-0.5 w-full animate-in fade-in duration-200 flex-1">
            <div className="text-center pt-0.5 pb-1 sm:pb-2">
              <h2 className="text-[#1E293B] text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
                INSTRUCTIONS TO PLAY
              </h2>
            </div>

            {/* 3 Instructions Side-by-Side in Landscape Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2 sm:gap-3 w-full mx-auto my-auto items-stretch">
              {/* Card 1: Inspect Equipment */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Prepare the Lab
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Inspect Apparatus
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Tap the <strong>Electron Gun</strong>, <strong>Double Slits</strong>, and <strong>Phosphor Screen</strong> in 3D to prepare the lab.
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-1 sm:mt-1.5">
                  <div className="flex items-center justify-around w-full text-slate-300 font-mono text-[9px] font-bold">
                    <span className="text-cyan-400">Gun [e⁻]</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-400">Slits ||</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-purple-400">Screen</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Observe Single Electrons */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Observation Round
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      20 Electrons
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Fire single electrons one-by-one. Watch discrete dots appear scattered on the detector screen.
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[9.5px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Discrete Particle Hits</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Seemingly random scatter</span>
                </div>
              </div>

              {/* Card 3: Predict & Discover Wave Pattern */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Predict &amp; Discover
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Quantum Interference
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Predict what happens when hundreds of electrons arrive, then launch the batch to reveal wave interference!
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-2 mt-1 sm:mt-1.5">
                  <div className="flex items-center gap-0.5 w-full justify-center">
                    <div className="w-1.5 h-10 bg-emerald-500/30 rounded-xs" />
                    <div className="w-2.5 h-14 bg-emerald-400/80 rounded-xs" />
                    <div className="w-3.5 h-16 bg-emerald-300 rounded-xs" />
                    <div className="w-2.5 h-14 bg-emerald-400/80 rounded-xs" />
                    <div className="w-1.5 h-10 bg-emerald-500/30 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Back and Play */}
            <div className="pt-1.5 sm:pt-2 pb-0.5 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIntroStep('mission')}
                className="px-5 sm:px-6 py-1 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="px-6 sm:px-8 py-1 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE 3D GAMEPLAY SCREEN (SINGLE CANVAS FULL SCREEN) ──── */}
      {gameStarted && (
        <div className="w-full h-full relative overflow-hidden">
          {/* ── 3D CANVAS (FULL SCREEN, SINGLE CANVAS) ───────────────────── */}
          <div className="absolute inset-0 z-0">
            <Canvas
              camera={{ position: [0, 3.2, 7.2], fov: 42 }}
              className="w-full h-full touch-none"
            >
              <color attach="background" args={['#FFFFFF']} />
              <ambientLight intensity={1.4} />
              <directionalLight position={[6, 9, 6]} intensity={1.3} />
              <directionalLight position={[-6, -4, -4]} intensity={0.5} />

              {/* 3D Lab Bench Surface */}
              <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 10]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.4} metalness={0.08} />
              </mesh>

              {/* Lab Bench Grid Lines */}
              <gridHelper args={[20, 40, '#E2E8F0', '#F1F5F9']} position={[0, -1.49, 0]} />

              {/* Three Lab Components - placed dynamically when user taps bottom buttons */}
              {(stage === 2 || inspectedComponents.gun) && (
                <ElectronGun3D
                  isFiring={isFiring}
                  isInspected={inspectedComponents.gun}
                  onClick={() => handleInspectComponent('gun')}
                />
              )}

              {(stage === 2 || inspectedComponents.slits) && (
                <DoubleSlitBarrier3D
                  isInspected={inspectedComponents.slits}
                  onClick={() => handleInspectComponent('slits')}
                />
              )}

              {(stage === 2 || inspectedComponents.detector) && (
                <PhosphorDetector3D
                  impactDots={impactDots}
                  showCurve={showCurve}
                  isInspected={inspectedComponents.detector}
                  onClick={() => handleInspectComponent('detector')}
                />
              )}

              {/* Flying Electron Particles */}
              <FlyingElectrons3D isFiring={isFiring} />

              <OrbitControls
                target={[0, 0, 0]}
                enableZoom={true}
                minDistance={3.5}
                maxDistance={16}
                maxPolarAngle={Math.PI / 2 - 0.05}
              />
            </Canvas>
          </div>

          {/* ── FLOATING TOP HEADER OVERLAY (DIRECTLY IN SINGLE CANVAS) ───── */}
          <header className="absolute top-2.5 sm:top-3.5 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="pointer-events-auto flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Right: Explanation Button Only */}
            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 shrink-0"
                title="View Theory & Explanation"
              >
                <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </header>

          {/* ── FLOATING HUD INTERACTION DOCK (BOTTOM OF SINGLE CANVAS) ───── */}
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex items-center justify-center pointer-events-none">
            {/* STAGE 1 CONTROLS: Component Checklist */}
            {stage === 1 && (
              <div className={`bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-200 pointer-events-auto flex items-center ${isLabPrepared ? 'justify-between' : 'justify-center'} w-full max-w-xl mx-auto gap-2`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleInspectComponent('gun')}
                    className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      inspectedComponents.gun
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{inspectedComponents.gun ? '✓' : '○'}</span>
                    <span>1. Gun</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInspectComponent('slits')}
                    className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      inspectedComponents.slits
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{inspectedComponents.slits ? '✓' : '○'}</span>
                    <span>2. Double Slit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInspectComponent('detector')}
                    className={`px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      inspectedComponents.detector
                        ? 'bg-purple-50 border-purple-400 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{inspectedComponents.detector ? '✓' : '○'}</span>
                    <span>3. Detector</span>
                  </button>
                </div>

                {isLabPrepared && (
                  <button
                    type="button"
                    onClick={handleStartExperiment}
                    className="px-4 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all animate-pulse active:scale-95 shrink-0"
                  >
                    <span>START EXPERIMENT</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* STAGE 2 CONTROLS: Observation Round */}
            {stage === 2 && experimentStep === 'observation' && (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-200 pointer-events-auto flex items-center justify-between w-full max-w-xl mx-auto gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Observation Round:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[11px]">
                    {electronCount} / 20 e⁻
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {electronCount < 20 ? (
                    <button
                      type="button"
                      disabled={isFiring}
                      onClick={handleLaunchObservationBatch}
                      className={`px-4 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${isFiring
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#0284C7] hover:bg-[#0369A1] text-white cursor-pointer shadow-sky-600/30'
                        }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isFiring ? 'FIRING ELECTRONS…' : 'LAUNCH 20 ELECTRONS'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExperimentStep('predicting')}
                      className="px-4 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-pulse"
                    >
                      <span>DISCOVERY PREDICTION</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 2 CONTROLS: Discovery Round (Full Beam Launch) */}
            {stage === 2 && experimentStep === 'discovery' && (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-xl border border-slate-200 pointer-events-auto flex items-center justify-between w-full max-w-xl mx-auto gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Discovery Batch:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-mono font-bold text-[11px]">
                    {electronCount} / 200 e⁻
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isFiring}
                    onClick={handleLaunchFullBatch}
                    className={`px-4 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${isFiring
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/30'
                      }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isFiring ? 'ACCUMULATING BEAM…' : 'LAUNCH 200 ELECTRONS'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2 CONTROLS: Completed Mode */}
            {stage === 2 && experimentStep === 'completed' && (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl px-5 py-2 sm:py-2.5 shadow-xl border border-slate-200 pointer-events-auto flex items-center justify-center gap-2 mx-auto animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-emerald-800">
                  Wave-Particle Duality Proven!
                </span>
              </div>
            )}
          </div>

          {/* STAGE 2 PREDICTION CHALLENGE MODAL OVERLAY */}
          {stage === 2 && experimentStep === 'predicting' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-200 max-w-xl sm:max-w-2xl w-full flex flex-col gap-2 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs">
                      ?
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">
                      Predict the Quantum Mystery!
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Challenge: +100 Pts
                  </span>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed">
                  The 20 electrons appeared as random, localized dots. <strong>What pattern will emerge when 200 electrons are detected?</strong>
                </p>

                {/* 4 Visual Image Options (Replacing text options) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {/* Option A: Two Lines */}
                  <button
                    type="button"
                    onClick={() => handleSelectPrediction('two_lines')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${selectedPrediction === 'two_lines'
                        ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-300 shadow-md scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-1">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                        A
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">Classical</span>
                    </div>
                    {/* SVG Image: Two Lines */}
                    <svg viewBox="0 0 100 68" className="w-full h-16 rounded-lg bg-[#064E3B] border border-slate-800 shadow-inner">
                      <line x1="36" y1="6" x2="36" y2="62" stroke="#10B981" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
                      <line x1="64" y1="6" x2="64" y2="62" stroke="#10B981" strokeWidth="5" opacity="0.3" strokeLinecap="round" />
                      {[10, 18, 26, 34, 42, 50, 58].map((y, i) => (
                        <g key={`dots-a-${i}`}>
                          <circle cx={35 + (i % 3)} cy={y} r="1.8" fill="#34D399" />
                          <circle cx={63 + (i % 3)} cy={y} r="1.8" fill="#34D399" />
                        </g>
                      ))}
                    </svg>
                    <div className="text-center">
                      <div className="text-[11px] font-extrabold text-slate-800 leading-tight">Two Lines</div>
                      <div className="text-[9px] text-slate-500 font-medium">Particle Bullets</div>
                    </div>
                  </button>

                  {/* Option B: Random Scatter */}
                  <button
                    type="button"
                    onClick={() => handleSelectPrediction('random_scatter')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${selectedPrediction === 'random_scatter'
                        ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-300 shadow-md scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-1">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                        B
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">Uniform</span>
                    </div>
                    {/* SVG Image: Random Scatter */}
                    <svg viewBox="0 0 100 68" className="w-full h-16 rounded-lg bg-[#064E3B] border border-slate-800 shadow-inner">
                      {[
                        [18, 14], [25, 45], [32, 22], [42, 55], [52, 18], [62, 48], [72, 28], [82, 58],
                        [88, 16], [15, 52], [38, 38], [58, 34], [78, 42], [48, 62], [68, 12], [28, 60],
                        [65, 24], [45, 12], [85, 36], [22, 32]
                      ].map(([cx, cy], i) => (
                        <circle key={`dots-b-${i}`} cx={cx} cy={cy} r="1.8" fill="#34D399" />
                      ))}
                    </svg>
                    <div className="text-center">
                      <div className="text-[11px] font-extrabold text-slate-800 leading-tight">Random Scatter</div>
                      <div className="text-[9px] text-slate-500 font-medium">No Pattern</div>
                    </div>
                  </button>

                  {/* Option C: Interference Fringes */}
                  <button
                    type="button"
                    onClick={() => handleSelectPrediction('wave_interference')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${selectedPrediction === 'wave_interference'
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400 shadow-md scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-1">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                        C
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">Quantum</span>
                    </div>
                    {/* SVG Image: Interference Fringes */}
                    <svg viewBox="0 0 100 68" className="w-full h-16 rounded-lg bg-[#064E3B] border border-slate-800 shadow-inner">
                      {/* Faint vertical fringe glows */}
                      <rect x="45" y="4" width="10" height="60" rx="3" fill="#10B981" opacity="0.35" />
                      <rect x="29" y="8" width="7" height="52" rx="2" fill="#10B981" opacity="0.22" />
                      <rect x="64" y="8" width="7" height="52" rx="2" fill="#10B981" opacity="0.22" />
                      <rect x="14" y="14" width="5" height="40" rx="2" fill="#10B981" opacity="0.12" />
                      <rect x="81" y="14" width="5" height="40" rx="2" fill="#10B981" opacity="0.12" />
                      {/* Fringes dots */}
                      {[8, 16, 24, 32, 40, 48, 56, 60].map((y, i) => (
                        <g key={`dots-c-${i}`}>
                          <circle cx={49 + (i % 3 - 1)} cy={y} r="1.8" fill="#34D399" />
                          {i % 2 === 0 && <circle cx={32} cy={y} r="1.7" fill="#34D399" />}
                          {i % 2 === 1 && <circle cx={67} cy={y} r="1.7" fill="#34D399" />}
                          {i % 3 === 0 && <circle cx={16} cy={y} r="1.5" fill="#34D399" />}
                          {i % 3 === 1 && <circle cx={83} cy={y} r="1.5" fill="#34D399" />}
                        </g>
                      ))}
                    </svg>
                    <div className="text-center">
                      <div className="text-[11px] font-extrabold text-slate-800 leading-tight">Interference Fringes</div>
                      <div className="text-[9px] text-slate-500 font-medium">Wave Duality</div>
                    </div>
                  </button>

                  {/* Option D: Concentric Rings */}
                  <button
                    type="button"
                    onClick={() => handleSelectPrediction('concentric_rings')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${selectedPrediction === 'concentric_rings'
                        ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-300 shadow-md scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-1">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                        D
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-500">Circular</span>
                    </div>
                    {/* SVG Image: Concentric Rings */}
                    <svg viewBox="0 0 100 68" className="w-full h-16 rounded-lg bg-[#064E3B] border border-slate-800 shadow-inner">
                      <circle cx="50" cy="34" r="12" stroke="#10B981" strokeWidth="2.5" fill="none" opacity="0.35" />
                      <circle cx="50" cy="34" r="23" stroke="#10B981" strokeWidth="2" fill="none" opacity="0.2" />
                      <circle cx="50" cy="34" r="2" fill="#34D399" />
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const x1 = 50 + 12 * Math.cos(rad);
                        const y1 = 34 + 12 * Math.sin(rad);
                        const x2 = 50 + 23 * Math.cos(rad + 0.2);
                        const y2 = 34 + 23 * Math.sin(rad + 0.2);
                        return (
                          <g key={`dots-d-${i}`}>
                            <circle cx={x1} cy={y1} r="1.7" fill="#34D399" />
                            <circle cx={x2} cy={y2} r="1.5" fill="#34D399" />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="text-center">
                      <div className="text-[11px] font-extrabold text-slate-800 leading-tight">Concentric Rings</div>
                      <div className="text-[9px] text-slate-500 font-medium">Circular Symmetry</div>
                    </div>
                  </button>
                </div>

                {/* Feedback Explanation Card after selecting */}
                {predictionFeedback && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${predictionFeedback.isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}
                  >
                    <strong className="block mb-0.5">{predictionFeedback.title}</strong>
                    <p>{predictionFeedback.text}</p>
                  </div>
                )}

                {/* Action Button: Proceed to Discovery Round */}
                {selectedPrediction && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setExperimentStep('discovery')}
                      className="px-5 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <span>LAUNCH FULL BEAM &amp; REVEAL</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 4: EXPLANATION MODAL (Matching Reference Image 5 in Landscape) ── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-150 p-2 sm:p-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                Dual Nature of Matter &amp; Electron Double-Slit Diffraction Guide
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Topic 07: Atomic Structure &amp; Quantum Mechanics
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Pedagogical Sections */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {/* Section 1: The Big Question */}
            <section className="bg-blue-50/60 rounded-2xl p-3 border border-blue-200/80 space-y-1.5 shadow-xs">
              <h3 className="text-xs sm:text-sm font-extrabold text-blue-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                The Big Question
              </h3>
              <p className="font-semibold text-blue-950 text-xs sm:text-[13px] italic bg-white/80 p-2 rounded-xl border border-blue-100">
                &ldquo;Is an electron a tiny solid particle (like a marble), or is it a wave (like ripples in water)?&rdquo;
              </p>
              <p className="text-slate-600 text-[11px] sm:text-xs">
                Before quantum physics, everyone believed electrons were strictly localized, solid miniature spheres orbiting a central nucleus.
              </p>
            </section>

            {/* Section 2: The Thought Experiment (Classical vs. Quantum) */}
            <section className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 space-y-2 shadow-xs">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                The Thought Experiment (Classical vs. Quantum)
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950">
                  <strong>If electrons were just classical particles:</strong> Firing them through two open slits would produce exactly <strong>two straight lines</strong> on the detector screen directly behind the slits (like spray paint through two stencils).
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                  <strong>What actually happens in this 3D laboratory:</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] sm:text-xs text-emerald-900">
                    <li>
                      <strong>Stage 1 (Few Electrons):</strong> When electrons are shot one-by-one, each electron hits the detector as an individual, localized dot (behaving like a <em>particle</em> upon arrival).
                    </li>
                    <li>
                      <strong>Stage 2 (Many Electrons Accumulated):</strong> As 200+ electrons accumulate over time, they do <strong>not</strong> form two lines! Instead, they form an alternating series of bright bands and dark gaps &mdash; an <strong>interference pattern</strong>!
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3: What Students Realize */}
            <section className="bg-purple-50/60 rounded-2xl p-3 border border-purple-200/80 space-y-1.5 shadow-xs">
              <h3 className="text-xs sm:text-sm font-extrabold text-purple-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  3
                </span>
                What Students Realize
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                <li>
                  <strong>Waves Interfere:</strong> Only waves can overlap, cancel each other out (<em>destructive interference = dark gaps</em>), and amplify each other (<em>constructive interference = bright stripes</em>).
                </li>
                <li>
                  <strong>Self-Interference:</strong> Even though electrons are fired <em>one at a time</em>, each electron travels through both slits as a continuous probability wave, interferes with itself, and lands according to quantum probability!
                </li>
                <li>
                  <strong>The Central Conclusion:</strong> <span className="font-extrabold text-purple-900">&ldquo;Electrons travel as waves, but arrive as particles.&rdquo;</span>
                </li>
              </ul>
            </section>

            {/* Section 4: Key Scientific Formulas Learned */}
            <section className="bg-sky-50/60 rounded-2xl p-3 border border-sky-200/80 space-y-2 shadow-xs">
              <h3 className="text-xs sm:text-sm font-extrabold text-sky-950 flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shrink-0">
                  4
                </span>
                Key Scientific Formulas Learned
              </h3>

              {/* de Broglie Equation */}
              <div className="bg-white p-2.5 rounded-xl border border-sky-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-900">de Broglie Matter-Wave Equation (1924)</span>
                  <span className="font-mono text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">λ = h / p</span>
                </div>
                <div className="p-2 bg-sky-50 rounded-lg text-center font-mono font-black text-xs text-sky-950">
                  λ = h / p = h / (m · v)
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                  <li>Every moving physical object possesses an associated matter wavelength (&lambda;).</li>
                  <li>For everyday heavy objects (like a cricket ball), &lambda; is infinitely tiny (&sim; 10<sup>-34</sup> m), making wave diffraction impossible to notice.</li>
                  <li>For ultralight electrons (m &sim; 9.1 &times; 10<sup>-31</sup> kg), &lambda; matches atomic lattice spacing (&sim; 0.1 nm), making wave diffraction clearly visible!</li>
                </ul>
              </div>

              {/* Born's Probability Density */}
              <div className="bg-white p-2.5 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900">Born&apos;s Probability Density (|Ψ|²)</span>
                  <span className="font-mono text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">P(x) ∝ |Ψ|²</span>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg text-center font-mono font-black text-xs text-purple-950">
                  P(x) ∝ |Ψ|² = |Ψ₁ + Ψ₂|²
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                  <li>The electron matter wave is fundamentally a <strong>quantum probability wave (&Psi;)</strong>.</li>
                  <li>The yellow intensity curve toggled in the lab graph plots exactly where electrons have the highest statistical probability to hit the phosphor detector.</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Sticky Blue Resume Challenge Button */}
          <div className="p-2 border-t border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer text-center block"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
