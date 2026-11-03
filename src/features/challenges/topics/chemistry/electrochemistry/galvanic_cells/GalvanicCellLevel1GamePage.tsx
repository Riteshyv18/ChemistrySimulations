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
  Layers,
  ArrowRight,
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── LIGHTWEIGHT WEB AUDIO SYNTHESIZER ─────────────────────────────────────────
function playAudioTone(type: 'click' | 'correct' | 'wrong' | 'unlock' | 'hum') {
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
    } else if (type === 'hum') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.setValueAtTime(240, now + 0.3);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Web audio might be restricted before user gesture
  }
}

// ── 3D GLASS BEAKER WITH AQUEOUS SOLUTION ────────────────────────────────────
function Beaker3D({
  position,
  liquidColor,
  liquidOpacity = 0.55,
  label,
  subLabel,
  solutionFormula,
  isSelected = false,
  onClick,
}: {
  position: [number, number, number];
  liquidColor: string;
  liquidOpacity?: number;
  label: string;
  subLabel: string;
  solutionFormula: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      {/* Outer Selection Glow Ring */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 1.45, 36]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.8} />
        </mesh>
      )}
      {/* Outer Glass Beaker Cylinder */}
      <mesh position={[0, 0.9, 0]} renderOrder={2}>
        <cylinderGeometry args={[1.2, 1.18, 1.8, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.05}
          transmission={0.92}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beaker Glass Base */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.18, 36]} />
        <meshStandardMaterial color="#CBD5E1" transparent opacity={0.5} roughness={0.1} />
      </mesh>

      {/* Glass Rim Top Ring */}
      <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.035, 16, 40]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.1} />
      </mesh>

      {/* Aqueous Electrolyte Solution Volume */}
      <mesh position={[0, 0.75, 0]} renderOrder={1}>
        <cylinderGeometry args={[1.16, 1.15, 1.45, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={liquidOpacity}
        />
      </mesh>

      {/* Solution Meniscus / Top Surface */}
      <mesh position={[0, 1.47, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[1.15, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.15}
          metalness={0.15}
          transparent
          opacity={Math.min(0.95, liquidOpacity + 0.1)}
        />
      </mesh>

      {/* Beaker Measurement Ticks */}
      {[-0.3, 0.0, 0.3, 0.6].map((yOff, idx) => (
        <mesh key={idx} position={[1.18, 0.8 + yOff, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
          <meshBasicMaterial color="#94A3B8" />
        </mesh>
      ))}

      {/* Liquid Name on Glass Center */}
      <Html position={[0, 0.65, 1.25]} center distanceFactor={8.5} zIndexRange={[15, 0]}>
        <div className={`bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full border ${isSelected ? 'border-sky-400 ring-2 ring-sky-400 text-sky-200 shadow-md' : 'border-white/20 text-white'} font-mono text-[10px] font-extrabold shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 tracking-wider transition-all`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: liquidColor }} />
          <span>{solutionFormula}</span>
        </div>
      </Html>


    </group>
  );
}

// ── 3D ZINC ANODE ELECTRODE STRIP ────────────────────────────────────────────
function ZincElectrode3D({
  isPlaced,
  onClick,
}: {
  isPlaced: boolean;
  onClick: () => void;
}) {
  // Target immersed position: left beaker at [-2.2, 1.0, 0], tilted
  // Unplaced position: on the table beside the beaker at [-3.8, 0.2, 0.6]
  const targetPos = isPlaced ? [-2.4, 0.95, 0] : [-3.8, 0.15, 0.5];
  const targetRot = isPlaced ? [0.1, 0.05, 0.25] : [Math.PI / 2, 0, 0.4];

  return (
    <group
      position={targetPos as [number, number, number]}
      rotation={targetRot as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Zinc Metallic Bar */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.32, 1.9, 0.08]} />
        <meshStandardMaterial
          color="#D1D5DB"
          metalness={0.88}
          roughness={0.22}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Minimal Transparent Tag for Anode */}
      <Html position={[-0.8, 1.35, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-300/40 text-slate-100 font-mono text-[9px] font-bold shadow-sm pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span>Anode (Zn)</span>
        </div>
      </Html>



      {/* Terminal Contact Clamp Top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Alligator Clip Jaw */}
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>


    </group>
  );
}

// ── 3D COPPER CATHODE ELECTRODE STRIP ─────────────────────────────────────────
function CopperElectrode3D({
  isPlaced,
  onClick,
}: {
  isPlaced: boolean;
  onClick: () => void;
}) {
  // Target immersed position: right beaker at [2.2, 1.0, 0], tilted
  // Unplaced position: on the table beside the beaker at [3.8, 0.15, 0.5]
  const targetPos = isPlaced ? [2.4, 0.95, 0] : [3.8, 0.15, 0.5];
  const targetRot = isPlaced ? [-0.1, -0.05, -0.25] : [Math.PI / 2, 0, -0.4];

  return (
    <group
      position={targetPos as [number, number, number]}
      rotation={targetRot as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Polished Reddish-Orange Copper Bar */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.32, 1.9, 0.08]} />
        <meshStandardMaterial
          color="#EA580C"
          metalness={0.92}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Minimal Transparent Tag for Cathode */}
      <Html position={[0.8, 1.35, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-orange-400/40 text-orange-200 font-mono text-[9px] font-bold shadow-sm pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span>Cathode (Cu)</span>
        </div>
      </Html>

      {/* Terminal Contact Clamp Top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        <meshStandardMaterial color="#B45309" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Red Alligator Clip Jaw */}
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} />
      </mesh>


    </group>
  );
}

// ── 3D U-SHAPED GLASS SALT BRIDGE ────────────────────────────────────────────
function SaltBridge3D({
  isPlaced,
  isActive,
  onClick,
}: {
  isPlaced: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const targetPos = isPlaced ? [0, 1.9, 0] : [0, 0.25, 2.2];
  const targetRot = isPlaced ? [0, 0, 0] : [Math.PI / 2, 0, 0];

  return (
    <group
      position={targetPos as [number, number, number]}
      rotation={targetRot as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Horizontal Bridge Tube Span */}
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 3.8, 24]} />
        <meshPhysicalMaterial
          color="#8B5CF6" transparent opacity={0.65} roughness={0.1}
        />
      </mesh>

      {/* Internal Agar-Agar Electrolyte Core (KCl) */}
      <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 3.75, 16]} />
        <meshStandardMaterial color="#6D28D9" transparent opacity={0.98} roughness={0.15} metalness={0.2} />
      </mesh>

      {/* Left Inverted Leg (Into ZnSO₄) */}
      <mesh position={[-1.9, -0.2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 1.3, 24]} />
        <meshPhysicalMaterial
          color="#8B5CF6" transparent opacity={0.88} roughness={0.1} depthWrite={false}
        />
      </mesh>
      {/* Left Cotton Plug */}
      <mesh position={[-1.9, -0.85, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
      </mesh>

      {/* Right Inverted Leg (Into CuSO₄) */}
      <mesh position={[1.9, -0.2, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 1.3, 24]} />
        <meshPhysicalMaterial
          color="#8B5CF6" transparent opacity={0.88} roughness={0.1} depthWrite={false}
        />
      </mesh>
      {/* Right Cotton Plug */}
      <mesh position={[1.9, -0.85, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
      </mesh>

      {/* Minimal Transparent Tag */}
      <Html position={[0, 0.75, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div className="bg-slate-900/65 backdrop-blur-xs px-2 py-0.5 rounded-full border border-purple-400/30 text-purple-200 font-mono text-[9px] font-bold shadow-xs pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>KCl Salt Bridge</span>
        </div>
      </Html>

      {/* Elbow Joints Left & Right */}
      <mesh position={[-1.9, 0.45, 0]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshPhysicalMaterial color="#7C3AED" transparent opacity={0.75} />
      </mesh>
      <mesh position={[1.9, 0.45, 0]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshPhysicalMaterial color="#7C3AED" transparent opacity={0.75} />
      </mesh>




    </group>
  );
}

// ── 3D DIGITAL MULTIMETER / VOLTMETER ────────────────────────────────────────
function Voltmeter3D({
  isPlaced,
  isActive,
  voltage,
  onClick,
}: {
  isPlaced: boolean;
  isActive: boolean;
  voltage: number;
  onClick: () => void;
}) {
  const targetPos = isPlaced ? [0, 0.65, 1.45] : [0, 0.2, 3.2];
  const targetRot = isPlaced ? [-0.45, 0, 0] : [-Math.PI / 2, 0, 0];

  return (
    <group
      position={targetPos as [number, number, number]}
      rotation={targetRot as [number, number, number]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Rugged Yellow Multimeter Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.0, 0.45]} />
        <meshStandardMaterial color="#EAB308" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* LCD Display Bezel Top */}
      <mesh position={[0, 0.55, 0.23]}>
        <boxGeometry args={[1.2, 0.65, 0.05]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>

      {/* LCD Screen Glass */}
      <mesh position={[0, 0.55, 0.26]}>
        <planeGeometry args={[1.1, 0.55]} />
        <meshBasicMaterial color="#A3E635" />
      </mesh>

      {/* LCD 7-Segment Value Display */}
      <Html position={[0, 0.55, 0.27]} center distanceFactor={6} zIndexRange={[30, 0]}>
        <div className="font-mono font-black text-slate-950 text-xl tracking-widest bg-lime-400 px-3 py-0.5 rounded border border-lime-600 shadow-inner flex items-center gap-1">
          <span>{voltage.toFixed(2)}</span>
          <span className="text-xs font-bold text-slate-800">V</span>
        </div>
      </Html>

      {/* Central Rotary Selector Knob */}
      <mesh position={[0, -0.22, 0.25]} rotation={[0, 0, isActive ? -0.4 : 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.14, 28]} />
        <meshStandardMaterial color="#1E293B" roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Knob Dial Pointer Indicator */}
      <mesh position={[0, -0.1, 0.33]} rotation={[0, 0, isActive ? -0.4 : 0]}>
        <boxGeometry args={[0.04, 0.16, 0.02]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>

      {/* Black COM Port Jack (Anode input) */}
      <mesh position={[-0.32, -0.75, 0.25]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>

      {/* Red V/Ω Port Jack (Cathode input) */}
      <mesh position={[0.32, -0.75, 0.25]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 16]} />
        <meshStandardMaterial color="#DC2626" roughness={0.2} />
      </mesh>


    </group>
  );
}

// ── 3D WIRES & MOVING ELECTRON PARTICLES ──────────────────────────────────────
function ConnectingWires3D({
  isPlaced,
  isActive,
}: {
  isPlaced: boolean;
  isActive: boolean;
}) {
  const pointsLeft = useMemo(
    () => [
      new THREE.Vector3(-2.4, 1.85, 0), // Zn electrode tip
      new THREE.Vector3(-2.0, 2.3, 0.5),
      new THREE.Vector3(-1.1, 1.6, 1.2),
      new THREE.Vector3(-0.32, 0.35, 1.4), // Multimeter COM jack
    ],
    []
  );

  const pointsRight = useMemo(
    () => [
      new THREE.Vector3(2.4, 1.85, 0), // Cu electrode tip
      new THREE.Vector3(2.0, 2.3, 0.5),
      new THREE.Vector3(1.1, 1.6, 1.2),
      new THREE.Vector3(0.32, 0.35, 1.4), // Multimeter V/Ω jack
    ],
    []
  );

  const curveLeft = useMemo(() => new THREE.CatmullRomCurve3(pointsLeft), [pointsLeft]);
  const curveRight = useMemo(() => new THREE.CatmullRomCurve3(pointsRight), [pointsRight]);

  const tubeGeoLeft = useMemo(() => new THREE.TubeGeometry(curveLeft, 32, 0.035, 12, false), [curveLeft]);
  const tubeGeoRight = useMemo(() => new THREE.TubeGeometry(curveRight, 32, 0.035, 12, false), [curveRight]);

  // Animated Electron Dots flowing through wire (Anode Zn -> Voltmeter -> Cathode Cu)
  const electronCount = 14;
  const electronInstRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!electronInstRef.current || !isActive) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < electronCount; i++) {
      const progress = ((time * 0.45 + i / electronCount) % 1);
      let pos: THREE.Vector3;

      if (progress < 0.5) {
        // Flowing from Zn electrode along curveLeft to meter
        const t = progress * 2;
        pos = curveLeft.getPointAt(t);
      } else {
        // Flowing from meter along curveRight toward Cu electrode
        const t = 1 - (progress - 0.5) * 2;
        pos = curveRight.getPointAt(t);
      }

      dummy.position.copy(pos);
      dummy.scale.setScalar(0.065 + Math.sin(time * 8 + i) * 0.015);
      dummy.updateMatrix();
      electronInstRef.current.setMatrixAt(i, dummy.matrix);
    }
    electronInstRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isPlaced) return null;

  return (
    <group>
      {/* Black Negative Wire (Anode to COM) */}
      <mesh geometry={tubeGeoLeft}>
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Red Positive Wire (Cathode to V/Ω) */}
      <mesh geometry={tubeGeoRight}>
        <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Electron Flow Particles */}
      {isActive && (
        <instancedMesh ref={electronInstRef} args={[undefined, undefined, electronCount]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#38BDF8" toneMapped={false} />
        </instancedMesh>
      )}


    </group>
  );
}

// ── 3D LIGHT BULB INDICATOR ──────────────────────────────────────────────────
function LightBulb3D({
  position,
  isActive,
}: {
  position: [number, number, number];
  isActive: boolean;
}) {
  return (
    <group position={position}>
      {/* Minimal Transparent Tag */}
      <Html position={[0, 0.55, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div className="bg-slate-900/65 backdrop-blur-xs px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-200 font-mono text-[9px] font-bold shadow-xs pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>Bulb</span>
        </div>
      </Html>

      {/* Ceramic Screw Base */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.4, 20]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Glass Bulb Dome */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshPhysicalMaterial
          color={isActive ? '#FBBF24' : '#E2E8F0'}
          emissive={isActive ? '#B45309' : '#000000'}
          emissiveIntensity={isActive ? 1.6 : 0}
          transparent
          opacity={0.8}
          roughness={0.1}
          transmission={0.85}
        />
      </mesh>

      {/* Glowing Filament Light Source */}
      {isActive && (
        <>
          <pointLight color="#F59E0B" intensity={4.5} distance={6} />
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#FDE047" />
          </mesh>
        </>
      )}


    </group>
  );
}

// ── MAIN LANDSCAPE GAME PAGE COMPONENT ───────────────────────────────────────
export default function GalvanicCellLevel1GamePage({
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Assembly State Steps
  const [placedZn, setPlacedZn] = useState(false);
  const [placedCu, setPlacedCu] = useState(false);
  const [placedBridge, setPlacedBridge] = useState(false);
  const [connectedWires, setConnectedWires] = useState(false);
  const [cellActivated, setCellActivated] = useState(false);

  // Solution Selection & Matching Interaction State
  const [selectedSolution, setSelectedSolution] = useState<'znso4' | 'cuso4' | null>(null);
  const [mismatchError, setMismatchError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Meter Reading Animated Transition
  const [meterVoltage, setMeterVoltage] = useState(0.0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Handle selecting an electrolyte solution
  const handleSelectSolution = (sol: 'znso4' | 'cuso4') => {
    setSelectedSolution(sol);
    setMismatchError(null);
    setFeedbackSuccess(null);
    playAudioTone('click');
  };

  // Handle picking an electrode rod for the currently selected solution
  const handleChooseElectrode = (rod: 'zn' | 'cu') => {
    if (!selectedSolution) {
      setMismatchError("Please select a solution first!");
      playAudioTone('wrong');
      return;
    }

    if (selectedSolution === 'znso4') {
      if (rod === 'zn') {
        setPlacedZn(true);
        setSelectedSolution(null);
        setMismatchError(null);
        setFeedbackSuccess("Correct! Zinc rod matches ZnSO₄ (Anode Oxidation Half-Cell)");
        playAudioTone('correct');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      } else {
        setMismatchError("Incorrect Match! Copper rod cannot be placed in ZnSO₄. A metal must be placed in a solution containing its own ions!");
        playAudioTone('wrong');
      }
    } else if (selectedSolution === 'cuso4') {
      if (rod === 'cu') {
        setPlacedCu(true);
        setSelectedSolution(null);
        setMismatchError(null);
        setFeedbackSuccess("Correct! Copper rod matches CuSO₄ (Cathode Reduction Half-Cell)");
        playAudioTone('correct');
        setTimeout(() => setFeedbackSuccess(null), 3000);
      } else {
        setMismatchError("Incorrect Match! Zinc rod cannot be placed in CuSO₄. A metal must be placed in a solution containing its own ions!");
        playAudioTone('wrong');
      }
    }
  };

  const handlePlaceBridge = () => {
    if (!placedBridge) {
      setPlacedBridge(true);
      playAudioTone('unlock');
    }
  };

  const handleConnectWires = () => {
    if (!connectedWires) {
      setConnectedWires(true);
      playAudioTone('unlock');
    }
  };

  const handleActivateCell = () => {
    if (!placedZn || !placedCu || !placedBridge || !connectedWires) {
      playAudioTone('wrong');
      return;
    }

    setCellActivated(true);
    playAudioTone('hum');

    // Smoothly animate voltage reading to 1.10 V
    let currentV = 0.0;
    const interval = setInterval(() => {
      currentV += 0.11;
      if (currentV >= 1.10) {
        setMeterVoltage(1.10);
        clearInterval(interval);
        playAudioTone('correct');
        // Stay on page, do not pop up automatically; user clicks FINISH to open popup
      } else {
        setMeterVoltage(Number(currentV.toFixed(2)));
      }
    }, 40);
  };

  // Reset entire challenge
  const handleResetChallenge = () => {
    setPlacedZn(false);
    setPlacedCu(false);
    setPlacedBridge(false);
    setConnectedWires(false);
    setCellActivated(false);
    setSelectedSolution(null);
    setMismatchError(null);
    setFeedbackSuccess(null);
    setMeterVoltage(0.0);
    setShowSuccessModal(false);
    playAudioTone('click');
  };

  const allComponentsReady = placedZn && placedCu && placedBridge && connectedWires;

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

          {/* Mission Center: Title & Next Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#2563EB]">MISSION:</span> Power the 1.10 V Lab Bulb
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

          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ── SCREEN 2: INSTRUCTIONS SCREEN (Matching 3-Card Landscape Layout) ── */}
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
              {/* Card 1: Prepare Electrodes */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Match Solution &amp; Rod
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Select &amp; Test Rod
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    First select a solution beaker, then choose the matching electrode. Wrong matches will be rejected!
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5 font-mono text-[9px] space-y-1">
                  <span className="text-slate-300 font-bold">Zn(s) → Zn²⁺ + 2e⁻</span>
                  <span className="text-orange-400 font-bold">Cu²⁺ + 2e⁻ → Cu(s)</span>
                </div>
              </div>

              {/* Card 2: Bridge & Circuit */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Bridge &amp; Circuit
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Salt Bridge &amp; Wires
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Connect both beakers with the KCl salt bridge to balance ionic charges, then wire up the voltmeter.
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[9.5px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Internal Ion Circuit</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono mt-1">Cl⁻ to Zn²⁺ | K⁺ to SO₄²⁻</span>
                </div>
              </div>

              {/* Card 3: Measure & Power */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Measure &amp; Power
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Target 1.10 V
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Activate the cell to witness spontaneous electron flow, light up the bulb, and record 1.10 V!
                  </p>
                </div>

                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5">
                  <span className="text-lime-400 font-mono text-base font-black tracking-wider">
                    1.10 V
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono mt-0.5">E°cell = E°cath - E°anod</span>
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
              camera={{ position: [0, 4.0, 7.8], fov: 38 }}
              className="w-full h-full touch-none"
            >
              <color attach="background" args={['#F8FAFC']} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[6, 9, 6]} intensity={1.4} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.5} />

              {/* 3D Lab Bench Surface */}
              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[22, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.05} />
              </mesh>

              {/* Lab Bench Subtle Grid Lines */}
              <gridHelper args={[20, 40, '#E2E8F0', '#F1F5F9']} position={[0, -0.04, 0]} />

              {/* Left Beaker: Zinc Sulphate ZnSO4(aq) */}
              <Beaker3D
                position={[-2.2, 0, 0]}
                liquidColor="#475569"
                liquidOpacity={0.82}
                label="Zinc Compartment"
                subLabel="Oxidation Half-Cell"
                solutionFormula="ZnSO₄(aq)"
                isSelected={selectedSolution === 'znso4'}
                onClick={() => !placedZn && handleSelectSolution('znso4')}
              />

              {/* Right Beaker: Copper Sulphate CuSO4(aq) */}
              <Beaker3D
                position={[2.2, 0, 0]}
                liquidColor="#0284C7"
                liquidOpacity={0.82}
                label="Copper Compartment"
                subLabel="Reduction Half-Cell"
                solutionFormula="CuSO₄(aq)"
                isSelected={selectedSolution === 'cuso4'}
                onClick={() => !placedCu && handleSelectSolution('cuso4')}
              />

              {/* Zinc Electrode - appears on Step 1 */}
              {placedZn && <ZincElectrode3D isPlaced={placedZn} onClick={() => { }} />}

              {/* Copper Electrode - appears on Step 2 */}
              {placedCu && <CopperElectrode3D isPlaced={placedCu} onClick={() => { }} />}

              {/* Salt Bridge - appears on Step 3 */}
              {placedBridge && (
                <SaltBridge3D
                  isPlaced={placedBridge}
                  isActive={cellActivated}
                  onClick={handlePlaceBridge}
                />
              )}

              {/* Voltmeter / Multimeter - appears on Step 4 */}
              {connectedWires && (
                <Voltmeter3D
                  isPlaced={connectedWires}
                  isActive={cellActivated}
                  voltage={meterVoltage}
                  onClick={handleConnectWires}
                />
              )}

              {/* Connecting Wires & Animated Electrons - appears on Step 4 */}
              {connectedWires && (
                <ConnectingWires3D isPlaced={connectedWires} isActive={cellActivated} />
              )}

              {/* Light Bulb Circuit Load */}
              <LightBulb3D position={[4.6, 0.45, 0.3]} isActive={cellActivated} />

              {/* Orbit Controls (Limited tilt to keep landscape scene pristine) */}
              <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={9.5}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={Math.PI / 4.5}
              />
            </Canvas>
          </div>

          {/* ── TOP BAR OVERLAY: EXIT BUTTON (LEFT) & EXPLANATION (RIGHT) ─── */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
            {/* Left Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800/90 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer pointer-events-auto active:scale-95 backdrop-blur-md"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Right Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer pointer-events-auto active:scale-95"
              title="Learn Theory & Formulas"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-200 shrink-0" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── BOTTOM DOCK: INTERACTIVE STEP-BY-STEP ASSEMBLY BAR ───────── */}
          <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2 sm:inset-x-6 z-20 flex flex-col items-center pointer-events-none gap-2">

            {/* Feedback Message (Error or Success) */}
            {mismatchError && (
              <div className="bg-red-600/95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg border border-red-400 flex items-center gap-2 pointer-events-auto animate-bounce">
                <span>⚠️</span>
                <span>{mismatchError}</span>
              </div>
            )}
            {feedbackSuccess && (
              <div className="bg-emerald-600/95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200">
                <span>✅</span>
                <span>{feedbackSuccess}</span>
              </div>
            )}

            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full px-2.5 sm:px-4 py-1.5 shadow-xl border border-slate-200/90 flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pointer-events-auto">

              {/* Step 1: Solution Selection & Electrode Matching */}
              {(!placedZn || !placedCu) ? (
                <>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                    Step 1:
                  </span>

                  {/* Solution 1 Button */}
                  <button
                    type="button"
                    onClick={() => !placedZn && handleSelectSolution('znso4')}
                    disabled={placedZn}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${placedZn
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedSolution === 'znso4'
                          ? 'bg-sky-600 text-white ring-2 ring-sky-400 shadow-md scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${placedZn ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                    <span>ZnSO₄ Sol.</span>
                  </button>

                  {/* Solution 2 Button */}
                  <button
                    type="button"
                    onClick={() => !placedCu && handleSelectSolution('cuso4')}
                    disabled={placedCu}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${placedCu
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : selectedSolution === 'cuso4'
                          ? 'bg-sky-600 text-white ring-2 ring-sky-400 shadow-md scale-105'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${placedCu ? 'bg-emerald-600' : 'bg-sky-500'}`} />
                    <span>CuSO₄ Sol.</span>
                  </button>

                  {/* Electrode Choices when a solution is selected */}
                  {selectedSolution && (
                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-300 animate-in fade-in">
                      <span className="text-[10px] font-bold text-sky-700 uppercase">Dip Rod:</span>

                      <button
                        type="button"
                        onClick={() => handleChooseElectrode('zn')}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white shadow-xs cursor-pointer active:scale-95"
                      >
                        Zinc Rod (Zn)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChooseElectrode('cu')}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer active:scale-95"
                      >
                        Copper Rod (Cu)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Once both electrodes are matched */
                <>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Electrodes Ready</span>
                  </div>
                </>
              )}

              {/* Step 2: Salt Bridge */}
              <button
                type="button"
                onClick={handlePlaceBridge}
                disabled={!placedZn || !placedCu}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${placedBridge
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : (!placedZn || !placedCu)
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${placedBridge ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                <span>Salt Bridge</span>
              </button>

              {/* Step 3: Connecting Wires & Voltmeter */}
              <button
                type="button"
                onClick={handleConnectWires}
                disabled={!placedBridge}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${connectedWires
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : !placedBridge
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${connectedWires ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                <span>Wires &amp; Meter</span>
              </button>

              {/* Step 4: Power Activate / FINISH Button */}
              {!cellActivated ? (
                <button
                  type="button"
                  onClick={handleActivateCell}
                  disabled={!allComponentsReady}
                  className={`flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer whitespace-nowrap shadow-md ${allComponentsReady
                      ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white animate-pulse'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>ACTIVATE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(true)}
                  className="flex items-center gap-1.5 px-5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 animate-bounce cursor-pointer whitespace-nowrap transition-all transform hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>FINISH</span>
                </button>
              )}

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetChallenge}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer ml-1"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>


        </div>
      )}

      {/* ── SUCCESS MODAL POPUP ────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-emerald-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Cell Voltage: 1.10 V Achieved!
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                Excellent! You successfully built a galvanic cell and generated electrical energy.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left font-mono text-xs space-y-1">
              <div className="text-slate-500 font-bold uppercase text-[10px]">Net Electrochemical Reaction</div>
              <div className="font-extrabold text-slate-900">Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)</div>
              <div className="text-emerald-700 font-bold pt-1">E°cell = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = +1.10 V</div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {/* Replay Button */}
              <button
                type="button"
                onClick={() => {
                  handleResetChallenge();
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Replay</span>
              </button>

              {/* Explanation Button */}
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex items-center gap-1.5 px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLANATION MODAL (Rich Pedagogical Theory & Formulas) ─────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Galvanic Cells &amp; Daniell Cell Guide
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Topic 01: Electrochemistry &bull; Standard Daniell Cell (Zn-Cu)
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">

            {/* BOX 1: Core Scientific Concept (Highlight Card) */}
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  1
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-sky-950">
                  The Core Scientific Concept
                </h3>
              </div>
              <p className="text-slate-700">
                In a normal spontaneous redox reaction, if you drop a piece of zinc metal directly into copper sulfate solution, electrons transfer directly from zinc to copper atoms at the contact surface and the chemical energy is lost entirely as <strong>heat</strong>.
              </p>
              <p className="text-sky-950 font-semibold bg-white/90 p-3 rounded-xl border border-sky-100">
                💡 <strong>What this game teaches:</strong> By physically separating the zinc and copper into two isolated beakers and connecting them with a wire and a salt bridge, we force electrons to travel through the external wire to reach the copper. That flow of moving electrons is <strong>electricity</strong> that powers a light bulb or a circuit.
              </p>
            </div>

            {/* NORMAL TEXT SECTION: Step-by-Step Learning */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  2
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  What Students Learn Step-by-Step
                </h3>
              </div>

              {/* Step 1 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  1. Insert Zinc in ZnSO₄ <span className="font-semibold text-slate-500">— Anode (Oxidation Half-Cell)</span>
                </div>
                <div className="font-mono font-bold text-slate-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-slate-400">
                  Zn(s) → Zn²⁺(aq) + 2e⁻
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Zinc atoms lose electrons into the metal strip and dissolve into the solution as Zn²⁺ cations. The electrode acts as the negative terminal (electron source).
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  2. Insert Copper in CuSO₄ <span className="font-semibold text-slate-500">— Cathode (Reduction Half-Cell)</span>
                </div>
                <div className="font-mono font-bold text-amber-900 text-[11.5px] sm:text-xs pl-2 border-l-2 border-amber-500">
                  Cu²⁺(aq) + 2e⁻ → Cu(s)
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Dissolved Cu²⁺ ions in solution pull electrons arriving through the strip and deposit onto it as solid metallic copper. The cathode gains mass over time.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  3. Insert Salt Bridge <span className="font-semibold text-slate-500">— Internal Circuit & Electrical Neutrality</span>
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  As Zn²⁺ ions build up in the left beaker (positive charge surplus) and SO₄²⁻ ions build up in the right beaker (negative charge surplus), current would immediately stop due to charge accumulation. The salt bridge allows <strong>Cl⁻ to migrate to the zinc beaker</strong> and <strong>K⁺ to migrate to the copper beaker</strong>, maintaining charge neutrality and closing the circuit.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  4. Connect Wires & Voltmeter <span className="font-semibold text-slate-500">— External Circuit & Electron Flow</span>
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Electrons (<strong>e⁻</strong>) travel from the electron-rich Anode (Zn) through the external wire to the electron-deficient Cathode (Cu).
                </p>
              </div>

              {/* Step 5 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  5. Activate Cell <span className="font-semibold text-slate-500">— Cell Potential (EMF) & Useful Work</span>
                </div>
                <div className="font-mono font-bold text-emerald-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-emerald-500">
                  E°cell = E°cathode - E°anode = (+0.34 V) - (-0.76 V) = +1.10 V
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Under standard conditions (298 K, 1 M solutions), the chemical driving force produces exactly 1.10 V, which powers and lights the bulb!
                </p>
              </div>
            </div>

            {/* BOX 2: Key Takeaways for Students (Summary Card) */}
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  3
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  Key Takeaways for Students
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  <strong>• AN OX & RED CAT Rule:</strong> Anode is always Oxidation (Zn). Reduction is always Cathode (Cu).
                </p>
                <p>
                  <strong>• Direction of Flow:</strong> Electrons flow <strong>Anode → Cathode</strong> in the wire. Conventional current flows <strong>Cathode → Anode</strong>.
                </p>
                <p>
                  <strong>• Role of Salt Bridge:</strong> Prevents liquid junction potential and keeps solutions neutral so the current doesn't choke.
                </p>
                <p>
                  <strong>• IUPAC Cell Notation:</strong> <code className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">Zn(s) | ZnSO₄(aq) || CuSO₄(aq) | Cu(s)</code> (Anode on the Left, Cathode on the Right, Double vertical bar || represents the Salt Bridge).
                </p>
              </div>
            </div>

          </div>
          {/* Sticky Blue Resume Button */}
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
