"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Cylinder, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  BookOpen,
  RotateCcw,
  Sparkles,
  Droplets,
  Gauge,
  CheckCircle2,
  X,
  Trophy,
  Info
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── Types & Stages ─────────────────────────────────────────────────────────────
interface StageConfig {
  id: number;
  label: string;
  targetPressure: number; // in mmHg
  pureSolventPressure: number; // P° in mmHg (e.g. 24.0 mmHg at 25°C)
  initialSoluteMoles: number;
  initialSolventMoles: number;
  tolerance: number; // in mmHg
  hint: string;
  explanation: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: 'Stage 1: 18.00 mmHg',
    targetPressure: 18.00,
    pureSolventPressure: 24.00,
    initialSoluteMoles: 0.50,
    initialSolventMoles: 5.50, // P = (5.5/6.0)*24 = 22.0 mmHg
    tolerance: 0.35,
    hint: 'Lower the vapour pressure from 22.0 mmHg to 18.00 mmHg by adjusting solute or solvent moles!',
    explanation:
      'Target matched! When solvent mole fraction X_solvent = 0.75 (e.g. 3.0 mol water & 1.0 mol solute), P_A = 0.75 × 24.00 mmHg = 18.00 mmHg.'
  },
  {
    id: 2,
    label: 'Stage 2: 20.00 mmHg',
    targetPressure: 20.00,
    pureSolventPressure: 24.00,
    initialSoluteMoles: 2.00,
    initialSolventMoles: 4.00, // P = (4/6)*24 = 16.0 mmHg
    tolerance: 0.35,
    hint: 'Increase the solvent mole fraction so that P_A = X_A × 24.00 mmHg reaches 20.00 mmHg!',
    explanation:
      'Target matched! With solvent mole fraction X_solvent = 5/6 ≈ 0.833 (e.g. 5.0 mol water & 1.0 mol solute), P_A = 20.00 mmHg.'
  },
  {
    id: 3,
    label: 'Stage 3: 16.00 mmHg',
    targetPressure: 16.00,
    pureSolventPressure: 24.00,
    initialSoluteMoles: 0.50,
    initialSolventMoles: 4.50, // P = (4.5/5.0)*24 = 21.6 mmHg
    tolerance: 0.35,
    hint: 'Add more non-volatile solute particles to block the liquid surface and lower vapour pressure to 16.00 mmHg!',
    explanation:
      'Target matched! When solvent mole fraction X_solvent = 2/3 ≈ 0.667 (e.g. 2.0 mol water & 1.0 mol solute), P_A = (2/3) × 24.00 mmHg = 16.00 mmHg.'
  }
];

// ── Responsive 3D Camera Controller ──────────────────────────────────────────
const FlaskCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    // Fits the flask prominently and comfortably in the upper viewport above the bottom controls
    const aspect = size.width / Math.max(1, size.height);
    const fov = 38;
    const fovRad = (fov * Math.PI) / 180;
    // Target world width ~ 3.10 so the container appears comfortably bigger and clearer
    const requiredDistByWidth = 3.10 / (2 * Math.tan(fovRad / 2) * aspect);
    const finalDist = Math.max(6.2, requiredDistByWidth);

    // Looking at y = -0.55 centers the enlarged flask cleanly between header and controls
    camera.position.set(0, -0.55, finalDist);
    camera.lookAt(0, -0.55, 0);
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);

  return null;
};

// ── 3D Water Molecule Component (Oxygen + 2 Hydrogens) ─────────────────────────
const WaterMolecule3D = ({
  position,
  scale = 1.0
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={scale}>
      {/* Central Oxygen Sphere (Red) */}
      <Sphere args={[0.075, 16, 16]}>
        <meshStandardMaterial color="#EF4444" roughness={0.2} metalness={0.1} />
      </Sphere>
      {/* Hydrogen Sphere 1 (Light Blue/White) */}
      <Sphere args={[0.048, 12, 12]} position={[0.065, 0.05, 0]}>
        <meshStandardMaterial color="#E0F2FE" roughness={0.3} />
      </Sphere>
      {/* Hydrogen Sphere 2 (Light Blue/White) */}
      <Sphere args={[0.048, 12, 12]} position={[-0.065, 0.05, 0]}>
        <meshStandardMaterial color="#E0F2FE" roughness={0.3} />
      </Sphere>
    </group>
  );
};

// ── 3D Non-Volatile Solute Particle Component (Sugar / Salt Cluster) ───────────
const SoluteParticle3D = ({
  position,
  scale = 1.0
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={scale}>
      <Sphere args={[0.11, 20, 20]}>
        <meshStandardMaterial
          color="#9333EA"
          emissive="#581C87"
          emissiveIntensity={0.25}
          roughness={0.25}
          metalness={0.2}
        />
      </Sphere>
      {/* Surrounding hydrated shell nodes */}
      <Sphere args={[0.04, 10, 10]} position={[0.09, 0.06, 0]}>
        <meshStandardMaterial color="#C084FC" roughness={0.3} />
      </Sphere>
      <Sphere args={[0.04, 10, 10]} position={[-0.09, -0.05, 0.04]}>
        <meshStandardMaterial color="#C084FC" roughness={0.3} />
      </Sphere>
    </group>
  );
};

// ── 3D Closed Sealed Flask with Vapour Space & Pressure Gauge ─────────────────
const ClosedFlask3D = ({
  soluteMoles,
  solventMoles,
  purePressure,
  targetPressure
}: {
  soluteMoles: number;
  solventMoles: number;
  purePressure: number;
  targetPressure: number;
}) => {
  const flaskRadius = 1.15;
  const flaskHeight = 2.85;

  // Raoult's Law calculations
  const totalMoles = soluteMoles + solventMoles;
  const solventMoleFraction = totalMoles > 0 ? solventMoles / totalMoles : 1;
  const calculatedPressure = solventMoleFraction * purePressure;

  // Dynamic Liquid Height: rises visibly with solvent moles (1.00 to 8.00 mol)
  const liquidHeight = Math.min(
    1.65,
    Math.max(0.60, 0.45 + (solventMoles / 8.0) * 1.05 + Math.min(soluteMoles * 0.03, 0.15))
  );
  const liquidY = -flaskHeight / 2 + liquidHeight / 2;
  const surfaceY = -flaskHeight / 2 + liquidHeight;
  const headspaceHeight = flaskHeight - liquidHeight;

  // Vapour kinetic molecule positions
  // Headspace particle count directly mirrors vapour pressure P_A (higher P = more particles)
  const vapourParticleCount = useMemo(() => {
    return Math.round((calculatedPressure / purePressure) * 20); // 10 to 20 particles
  }, [calculatedPressure, purePressure]);

  const vapourParticlesRef = useRef<THREE.Group>(null);

  // Generate randomized fixed offsets for vapour molecules inside headspace
  const vapourSeeds = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      baseX: Math.sin(i * 1.7) * (flaskRadius * 0.72),
      baseZ: Math.cos(i * 1.7) * (flaskRadius * 0.72),
      headspaceFrac: Math.sin(i * 2.3) * 0.5 + 0.5,
      speedX: 0.4 + (i % 3) * 0.25,
      speedY: 0.6 + (i % 4) * 0.2,
      phase: i * 0.8
    }));
  }, [flaskRadius]);

  // Solute particles in the liquid phase (Zero when soluteMoles === 0)
  const soluteCount = useMemo(() => {
    if (soluteMoles <= 0) return 0;
    return Math.min(18, Math.max(1, Math.round(soluteMoles * 4)));
  }, [soluteMoles]);

  const solutePositions = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const radius = (0.2 + ((i * 0.17) % 0.8)) * flaskRadius;
      const angle = i * 1.35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Some at the surface, some in the bulk liquid
      const isSurface = i % 3 === 0;
      const yRel = (i * 0.13) % 0.75;
      return { x, z, isSurface, yRel };
    });
  }, [flaskRadius]);

  // Solvent molecules in bulk liquid
  const bulkSolventPositions = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => {
      const radius = (0.15 + ((i * 0.19) % 0.75)) * flaskRadius;
      const angle = i * 0.95;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const yRel = (i * 0.11) % 0.80;
      return { x, z, yRel };
    });
  }, [flaskRadius]);

  // Animate vapour particles bouncing softly in headspace + gas puffs + rising steam
  const gasPuffRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);

  // Gas puff cloud clusters for volumetric vapour appearance
  const gasPuffSeeds = useMemo(() => [
    { x: -0.32, z: -0.22, frac: 0.28, radius: 0.38, phase: 0.0 },
    { x: 0.35, z: 0.20, frac: 0.44, radius: 0.42, phase: 1.3 },
    { x: -0.22, z: 0.30, frac: 0.68, radius: 0.37, phase: 2.4 },
    { x: 0.26, z: -0.26, frac: 0.74, radius: 0.40, phase: 3.6 },
    { x: 0.02, z: 0.02, frac: 0.50, radius: 0.45, phase: 4.8 },
    { x: -0.28, z: -0.04, frac: 0.84, radius: 0.32, phase: 5.7 },
    { x: 0.28, z: -0.12, frac: 0.22, radius: 0.34, phase: 0.9 },
  ], []);

  // Evaporating steam micro-droplets rising from liquid surface into headspace
  const steamSeeds = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      x: Math.sin(i * 1.85) * (flaskRadius * 0.62),
      z: Math.cos(i * 1.85) * (flaskRadius * 0.62),
      speed: 0.28 + (i % 3) * 0.12,
      offset: i / 12,
      scale: 0.035 + (i % 2) * 0.015,
    }));
  }, [flaskRadius]);

  // Animate vapour particles bouncing softly in headspace
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (vapourParticlesRef.current) {
      vapourParticlesRef.current.children.forEach((child, idx) => {
        const seed = vapourSeeds[idx];
        if (seed) {
          const baseY = surfaceY + 0.18 + seed.headspaceFrac * (headspaceHeight - 0.38);
          child.position.x = seed.baseX + Math.sin(t * seed.speedX + seed.phase) * 0.08;
          child.position.y = baseY + Math.cos(t * seed.speedY + seed.phase) * 0.06;
          child.position.z = seed.baseZ + Math.sin(t * seed.speedX * 0.8 + seed.phase) * 0.08;
        }
      });
    }

    // Animate volumetric gas puffs
    if (gasPuffRef.current) {
      gasPuffRef.current.rotation.y = t * 0.05;
      gasPuffRef.current.children.forEach((child, idx) => {
        const seed = gasPuffSeeds[idx];
        if (seed) {
          const baseY = surfaceY + 0.14 + seed.frac * (headspaceHeight - 0.28);
          child.position.y = baseY + Math.sin(t * 0.9 + seed.phase) * 0.03;
          const s = 1 + Math.sin(t * 0.75 + seed.phase) * 0.08;
          child.scale.set(s, s * 0.85, s);
        }
      });
    }

    // Animate rising evaporation steam particles
    if (steamRef.current) {
      steamRef.current.children.forEach((child, idx) => {
        const seed = steamSeeds[idx];
        if (seed) {
          const progress = (t * seed.speed + seed.offset) % 1;
          child.position.x = seed.x + Math.sin(t * 1.4 + idx) * 0.03;
          child.position.y = surfaceY + 0.05 + progress * (headspaceHeight - 0.12);
          child.position.z = seed.z + Math.cos(t * 1.4 + idx) * 0.03;
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          if (mat) {
            const fade = Math.sin(progress * Math.PI);
            mat.opacity = fade * (0.2 + (calculatedPressure / purePressure) * 0.35);
          }
        }
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ── Outer Cylindrical Glass Flask Body ── */}
      <Cylinder args={[flaskRadius, flaskRadius, flaskHeight, 48, 1, true]}>
        <meshPhysicalMaterial
          color="#E0F2FE"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.05}
          transmission={0.92}
          thickness={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </Cylinder>

      {/* Glass Bottom Base */}
      <Cylinder args={[flaskRadius, flaskRadius, 0.08, 48]} position={[0, -flaskHeight / 2, 0]} renderOrder={10}>
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
      </Cylinder>

      {/* ── Airtight Sealed Top Stopper / Lid (Closed Container for Vapour Pressure) ── */}
      <group position={[0, flaskHeight / 2, 0]}>
        {/* Rubber gasket / sealing collar */}
        <Cylinder args={[flaskRadius + 0.03, flaskRadius + 0.03, 0.08, 48]} position={[0, 0.04, 0]}>
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.3} />
        </Cylinder>
        {/* Top stopper cap */}
        <Cylinder args={[flaskRadius * 0.88, flaskRadius * 0.98, 0.16, 48]} position={[0, 0.15, 0]}>
          <meshStandardMaterial color="#1E293B" roughness={0.25} metalness={0.65} />
        </Cylinder>
        {/* Top center valve / gauge mount */}
        <Cylinder args={[0.14, 0.14, 0.22, 24]} position={[0, 0.32, 0]}>
          <meshStandardMaterial color="#94A3B8" roughness={0.15} metalness={0.8} />
        </Cylinder>
      </group>

      {/* ── Floating Target Badge over Glass Top Rim ── */}
      <Html
        position={[0, flaskHeight / 2 + 0.58, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F172A] text-white border border-slate-700/90 shadow-xl select-none whitespace-nowrap">
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-emerald-400 uppercase">
            TARGET:
          </span>
          <span className="text-xs sm:text-sm font-mono font-black text-white">
            {targetPressure.toFixed(2)} mmHg
          </span>
        </div>
      </Html>

      {/* ── Liquid Phase (Bottom) ── */}
      <Cylinder args={[flaskRadius * 0.96, flaskRadius * 0.96, liquidHeight, 36]} position={[0, liquidY, 0]}>
        <meshPhysicalMaterial
          color="#38BDF8"
          transmission={0.85}
          roughness={0.12}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </Cylinder>

      {/* Liquid-Gas Meniscus Rim (Surface) */}
      <mesh position={[0, surfaceY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[flaskRadius * 0.88, flaskRadius * 0.96, 36]} />
        <meshBasicMaterial color="#0284C7" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Surface liquid disc */}
      <mesh position={[0, surfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[flaskRadius * 0.88, 36]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transmission={0.85}
          transparent
          opacity={0.4}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* ── Bulk Solvent Particles inside Liquid ── */}
      {bulkSolventPositions.map((pos, idx) => {
        const y = -flaskHeight / 2 + 0.10 + pos.yRel * (liquidHeight - 0.20);
        return <WaterMolecule3D key={`solv-${idx}`} position={[pos.x, y, pos.z]} scale={0.7} />;
      })}

      {/* ── Non-Volatile Solute Particles inside Liquid & at Surface ── */}
      {soluteCount > 0 &&
        solutePositions.slice(0, soluteCount).map((pos, idx) => {
          const y = pos.isSurface
            ? surfaceY - 0.04
            : -flaskHeight / 2 + 0.12 + pos.yRel * (liquidHeight - 0.24);
          return (
            <SoluteParticle3D
              key={`solute-${idx}`}
              position={[pos.x, y, pos.z]}
              scale={pos.isSurface ? 0.95 : 0.85}
            />
          );
        })}

      {/* ── Headspace Volumetric Vapour Gas Layer (Pressure Visualizer) ── */}
      <Cylinder
        args={[flaskRadius * 0.94, flaskRadius * 0.94, Math.max(0.08, headspaceHeight - 0.04), 36]}
        position={[0, surfaceY + headspaceHeight / 2, 0]}
        renderOrder={2}
      >
        <meshPhysicalMaterial
          color="#38BDF8"
          transparent
          opacity={0.07 + (calculatedPressure / purePressure) * 0.17}
          roughness={0.92}
          transmission={0.45}
          depthWrite={false}
        />
      </Cylinder>

      {/* ── Soft Billowing Vapour Cloud Puffs (Gas Phase Headspace) ── */}
      <group ref={gasPuffRef}>
        {gasPuffSeeds.map((seed, idx) => (
          <mesh
            key={`gas-puff-${idx}`}
            position={[seed.x, surfaceY + 0.14 + seed.frac * (headspaceHeight - 0.28), seed.z]}
            renderOrder={3}
          >
            <sphereGeometry args={[seed.radius, 16, 16]} />
            <meshStandardMaterial
              color="#BAE6FD"
              transparent
              opacity={0.08 + (calculatedPressure / purePressure) * 0.14}
              roughness={0.95}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ── Rising Evaporation Micro-Steam Particles ── */}
      <group ref={steamRef}>
        {steamSeeds.map((seed, idx) => (
          <mesh key={`steam-${idx}`} position={[seed.x, surfaceY + 0.1, seed.z]} renderOrder={4}>
            <sphereGeometry args={[seed.scale, 8, 8]} />
            <meshBasicMaterial color="#E0F2FE" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        ))}
      </group>

      {/* ── Headspace Gas Luminescence Point Light ── */}
      <pointLight
        position={[0, surfaceY + headspaceHeight / 2, 0]}
        intensity={0.4 + (calculatedPressure / purePressure) * 0.6}
        color="#7DD3FC"
        distance={flaskRadius * 2.6}
      />

      {/* ── Vapour Phase Kinetic Molecules (Headspace Above Liquid) ── */}
      <group ref={vapourParticlesRef}>
        {vapourSeeds.slice(0, vapourParticleCount).map((seed, idx) => (
          <WaterMolecule3D
            key={`vapour-${idx}`}
            position={[seed.baseX, 0, seed.baseZ]}
            scale={0.75}
          />
        ))}
      </group>

      {/* ── Constant Room Temperature Badge on Flask ── */}
      <group position={[-flaskRadius * 0.82, 0.65, 0]} rotation={[0, 0.45, 0]}>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.8} />
        </mesh>
        <Html position={[-0.18, 0, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/95 backdrop-blur-sm border border-amber-300 shadow-md select-none whitespace-nowrap">
            <span className="text-sm">🌡️</span>
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-black uppercase text-amber-700 leading-none">Constant Temp</span>
              <span className="text-xs font-mono font-black text-amber-900 leading-tight">
                25°C
              </span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};

// ── Main Raoult's Law Game Page Component ─────────────────────────────────────
export interface RaoultsLawLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function RaoultsLawLevel1GamePage({
  difficulty = 'level1',
  onExit
}: RaoultsLawLevel1GamePageProps) {
  // Intro Flow: 'mission' -> 'instructions' -> 'playing'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions' | 'playing'>('mission');

  // Stages State
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = STAGES[currentStageIdx];

  // Sliders State (in moles)
  const [soluteMoles, setSoluteMoles] = useState(currentStage.initialSoluteMoles);
  const [solventMoles, setSolventMoles] = useState(currentStage.initialSolventMoles);

  // Modals & Completion State
  const [isStageCompleted, setIsStageCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    checked: boolean;
    isCorrect: boolean;
    calculatedPressure: number;
    message: string;
  } | null>(null);

  // Calculations
  const totalMoles = soluteMoles + solventMoles;
  const solventMoleFraction = totalMoles > 0 ? solventMoles / totalMoles : 1;
  const calculatedPressure = Number((solventMoleFraction * currentStage.pureSolventPressure).toFixed(2));

  // Handle stage selection
  const handleStageSelect = (idx: number) => {
    setCurrentStageIdx(idx);
    setSoluteMoles(STAGES[idx].initialSoluteMoles);
    setSolventMoles(STAGES[idx].initialSolventMoles);
    setIsStageCompleted(false);
    setSubmitResult(null);
  };

  // Submit check handler
  const handleSubmit = () => {
    const isCorrect = Math.abs(calculatedPressure - currentStage.targetPressure) <= currentStage.tolerance;
    if (isCorrect) {
      setSubmitResult({
        checked: true,
        isCorrect: true,
        calculatedPressure,
        message: `🎉 Correct! Vapour pressure is ${calculatedPressure.toFixed(2)} mmHg (Target: ${currentStage.targetPressure.toFixed(2)} mmHg).`
      });
      setIsStageCompleted(true);
    } else {
      setSubmitResult({
        checked: true,
        isCorrect: false,
        calculatedPressure,
        message: `Current Vapour Pressure = ${calculatedPressure.toFixed(2)} mmHg. Target is ${currentStage.targetPressure.toFixed(2)} mmHg. Adjust moles and try again!`
      });
    }
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans">
      {/* ── STEP 1: MISSION SCREEN (EXACTLY MATCHING IMAGE 1) ───────────────── */}
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
              SOLUTIONS & RAOULT&apos;S LAW
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Adjust the solute and solvent to match the target vapour pressure (P).
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

      {/* ── STEP 2: INSTRUCTIONS SCREEN (EXACTLY MATCHING IMAGE 2) ───────────── */}
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

          {/* Title */}
          <div className="text-center my-1 shrink-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider">
              INSTRUCTIONS TO PLAY
            </h2>
          </div>

          {/* 3 Step Cards (Centered vertically in view) */}
          <div className="flex flex-col gap-3.5 sm:gap-4 w-full max-w-2xl mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Non-Volatile Solute */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Add Non-Volatile Solute (Moles, n)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solute Amount
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solute bar to add sugar particles and lower vapour pressure.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    Solute (Sugar)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-900">1.00 mol</span>
                </div>
                <div className="relative w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[35%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Volatile Solvent */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Volatile Solvent (Moles, n)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solvent Volume
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solvent bar to adjust water moles and raise vapour pressure.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Solvent (Water)
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-900">3.00 mol</span>
                </div>
                <div className="relative w-full h-2.5 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[60%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Match Target Pressure */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Match Target Vapour Pressure
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Raoult&apos;s Goal: P = X_A × P°
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Once the vapour pressure matches the target, click Submit to verify.
                </p>
              </div>
              <div className="mt-2.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs sm:text-sm text-center shadow-xs">
                Submit
              </div>
            </div>
          </div>

          {/* Bottom Navigation Buttons (Centered Compact Pills matching Image 1) */}
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

      {/* ── STEP 3: 3D FULL-SCREEN CANVAS ── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ fov: 38 }} className="w-full h-full touch-none cursor-grab active:cursor-grabbing">
          <color attach="background" args={['#FFFFFF']} />
          <FlaskCamera />
          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.14}
            maxPolarAngle={Math.PI / 1.88}
            rotateSpeed={1.1}
            enableDamping
            dampingFactor={0.06}
            target={[0, -0.55, 0]}
          />
          <ambientLight intensity={1.45} />
          <directionalLight position={[-4, 6, 4]} intensity={2.0} color="#FFFFFF" />
          <directionalLight position={[4, 4, 3]} intensity={1.3} color="#E0F2FE" />
          <pointLight position={[0, 0.8, 3.0]} intensity={1.2} color="#BAE6FD" />

          <ClosedFlask3D
            soluteMoles={soluteMoles}
            solventMoles={solventMoles}
            purePressure={currentStage.pureSolventPressure}
            targetPressure={currentStage.targetPressure}
          />
        </Canvas>
      </div>

      {/* ── Top Floating Header (Exit on left, Room Temp in center, Explanation on right) ── */}
      <header className="absolute top-0 left-0 right-0 z-20 p-2.5 sm:p-3 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-1 px-3.5 sm:px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
          title="Exit Simulation"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
          <span>EXIT</span>
        </button>

        {/* Room Temperature Pill */}


        <button
          type="button"
          onClick={() => setShowExplanation(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
          title="View Explanation"
        >
          <BookOpen className="w-4 h-4 text-white shrink-0" />
          <span>EXPLANATION</span>
        </button>
      </header>

      {/* ── Winning (Target Achieved) Dialog Box Overlay ── */}
      {isStageCompleted && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-xs shadow-2xl border border-emerald-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Target Achieved!
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-snug">
              {currentStage.explanation}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-2.5 px-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/30 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-white" />
                <span>Explanation</span>
              </button>

              {currentStageIdx < STAGES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleStageSelect(currentStageIdx + 1)}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Next Stage &gt;</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStageSelect(0)}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:brightness-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Replay Lab ↺</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Incorrect Submission Dialog Box Overlay ── */}
      {submitResult && !submitResult.isCorrect && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Incorrect Pressure
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-snug">
              Current Vapour Pressure is <span className="font-bold font-mono text-rose-600">{submitResult.calculatedPressure.toFixed(2)} mmHg</span>.<br />
              Target is <span className="font-bold font-mono text-emerald-600">{currentStage.targetPressure.toFixed(2)} mmHg</span>.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubmitResult(null)}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitResult(null);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2.5 px-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs rounded-xl shadow-md shadow-sky-600/30 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-white" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Minimalist Floating Dock (Module 11 Style) ── */}
      <footer className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[94%] max-w-2xl">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-3xl px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Solute (Sugar, mol) */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 whitespace-nowrap">
                Solute (Sugar)
              </span>
              <span className="text-xs font-mono font-black text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                {soluteMoles.toFixed(2)} mol
              </span>
            </div>
            <input
              type="range"
              min={0.00}
              max={5.00}
              step={0.05}
              value={soluteMoles}
              onChange={(e) => {
                setSoluteMoles(Number(e.target.value));
                setSubmitResult(null);
              }}
              className="w-full h-2 bg-purple-100 accent-purple-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200 shrink-0" />

          {/* Solvent (Water, mol) */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 whitespace-nowrap">
                Solvent (Water)
              </span>
              <span className="text-xs font-mono font-black text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                {solventMoles.toFixed(2)} mol
              </span>
            </div>
            <input
              type="range"
              min={1.00}
              max={8.00}
              step={0.05}
              value={solventMoles}
              onChange={(e) => {
                setSolventMoles(Number(e.target.value));
                setSubmitResult(null);
              }}
              className="w-full h-2 bg-sky-100 accent-sky-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 sm:px-6 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
          >
            Submit
          </button>
        </div>
      </footer>

      {/* ── STEP 4: EXPLANATION SCREEN (FULL CANVAS WHOLE SCREEN) ─────────── */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-5 bg-white overflow-y-auto animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <h2 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-wide">
              Raoult&apos;s Law & Vapour Pressure
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-3 space-y-5 px-1 pr-1.5">
            {/* Section 1: What is Vapour Pressure? */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                What is Vapour Pressure?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Imagine water in a closed container. Some water molecules escape from the liquid surface into the headspace above it as vapour. At equilibrium (rate of evaporation equals rate of condensation), the vapour exerts a measurable pressure called <strong>Vapour Pressure</strong>.
              </p>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-950">
                Pure water at room temperature (25°C) has a constant saturation vapour pressure of approximately <strong>P° = 24.0 mmHg</strong>.
              </div>
            </div>

            {/* Section 2: Raoult's Law Formulation */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                What Does Raoult&apos;s Law State?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                For an ideal solution containing a volatile solvent and a non-volatile solute:
              </p>
              <div className="p-3 bg-sky-50 text-sky-950 border border-sky-200 rounded-xl text-center font-mono font-bold text-sm tracking-wide shadow-xs">
                P_A = X_A × P_A°
              </div>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc list-inside leading-relaxed">
                <li><strong>P_A</strong>: Vapour pressure of the solvent above the solution.</li>
                <li><strong>X_A</strong>: Mole fraction of the solvent in the solution [n_solvent / (n_solvent + n_solute)].</li>
                <li><strong>P_A°</strong>: Vapour pressure of the pure volatile solvent at the same temperature.</li>
              </ul>
            </div>

            {/* Section 3: Why Non-Volatile Solutes Lower Vapour Pressure */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                  3
                </span>
                Effect of Adding Non-Volatile Solute
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When a non-volatile solute (e.g. sugar, salt, urea) is dissolved in water:
              </p>
              <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Solute particles occupy positions on the liquid surface.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Fewer volatile solvent molecules are available at the surface to escape into vapour.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Consequently, the rate of evaporation decreases and the equilibrium vapour pressure is lowered.</span>
                </li>
              </ul>
            </div>

            {/* Section 4: Worked Example */}
            <div className="space-y-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                  4
                </span>
                Step-by-Step Example
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Suppose pure water at 25°C has a vapour pressure of <strong>P° = 24.00 mmHg</strong>. We dissolve <strong>1.0 mol of non-volatile solute</strong> into <strong>3.0 mol of water</strong>. Here is how to find the resulting vapour pressure step-by-step:
              </p>
              
              <div className="space-y-2">
                {/* Step A */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center">a</span>
                    <span>Find total moles in solution:</span>
                  </div>
                  <div className="font-mono text-slate-800 pl-5">
                    n_total = n_water + n_solute = 3.0 mol + 1.0 mol = <strong>4.0 mol</strong>
                  </div>
                </div>

                {/* Step B */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center">b</span>
                    <span>Calculate water&apos;s mole fraction (X_water):</span>
                  </div>
                  <div className="font-mono text-slate-800 pl-5">
                    X_water = n_water / n_total = 3.0 / 4.0 = <strong>0.75</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-5 mt-1">
                    (This tells us that 75% of the molecules at the surface are water, and 25% are solute blocking the surface).
                  </p>
                </div>

                {/* Step C */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center">c</span>
                    <span>Apply Raoult&apos;s Law to find the solution vapour pressure:</span>
                  </div>
                  <div className="font-mono text-sky-900 font-bold pl-5">
                    P_solution = X_water × P° = 0.75 × 24.00 mmHg = <strong>18.00 mmHg</strong>
                  </div>
                </div>

                {/* Step D */}
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-xs leading-relaxed">
                  <div className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] flex items-center justify-center">d</span>
                    <span>Calculate the lowering of vapour pressure (ΔP):</span>
                  </div>
                  <div className="font-mono text-purple-900 pl-5">
                    ΔP = P° - P_solution = 24.00 mmHg - 18.00 mmHg = <strong>6.00 mmHg</strong>
                  </div>
                  <p className="text-[11px] text-purple-700 pl-5 mt-1 font-medium">
                    Relative Lowering = ΔP / P° = 6.00 / 24.00 = 0.25 (exactly equals the solute mole fraction X_solute).
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Multiple Volatile Components */}
            <div className="space-y-2 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs">
                  5
                </span>
                Solutions with Two Volatile Liquids
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                When both components A and B are volatile (e.g. ethanol and water), the total vapour pressure is the sum of both partial pressures:
              </p>
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-center font-mono font-bold text-xs text-sky-950">
                P_total = P_A + P_B = (X_A × P_A°) + (X_B × P_B°)
              </div>
            </div>
          </div>

          {/* Bottom Action Button */}
          <div className="pt-3 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-full py-3 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wide"
            >
              <span>RESUME CHALLENGE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
