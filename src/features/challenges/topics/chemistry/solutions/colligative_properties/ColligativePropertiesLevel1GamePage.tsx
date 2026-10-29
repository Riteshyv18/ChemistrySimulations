"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Cylinder, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  BookOpen,
  RotateCcw,
  Sparkles,
  Flame,
  Droplets,
  CheckCircle2,
  Trophy,
  Play
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── Types & Stages ─────────────────────────────────────────────────────────────
interface StageConfig {
  id: number;
  type: 'freezing' | 'boiling';
  label: string;
  propertyTitle: string;
  constantSymbol: string;
  constantValue: number; // in °C·kg/mol (K_f = 1.86, K_b = 0.512)
  pureSolventTemp: number; // in °C (0.00 °C or 100.00 °C)
  targetTemp: number; // in °C (-5.58 °C or 101.53 °C)
  initialSoluteMoles: number; // in mol
  initialSolventKg: number; // in kg
  tolerance: number; // in °C
  vanTHoff: number; // i = 1 for non-electrolyte glucose
  hint: string;
  explanation: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    type: 'freezing',
    label: 'Stage 1: Freezing Point (-5.58°C)',
    propertyTitle: 'Freezing Point Depression',
    constantSymbol: 'K_f',
    constantValue: 1.86,
    pureSolventTemp: 0.00,
    targetTemp: -5.58,
    initialSoluteMoles: 1.00,
    initialSolventKg: 1.00, // m = 1.00 mol/kg -> T_f = -1.86 °C
    tolerance: 0.06,
    vanTHoff: 1,
    hint: '🔴 Not enough solute! Add more glucose particles to lower the freezing point to -5.58°C.',
    explanation:
      'Target achieved! With molality m = 3.0 mol/kg, ΔT_f = 1 × 1.86 × 3.0 = 5.58°C. Therefore, freezing point T_f = 0.00°C − 5.58°C = −5.58°C.'
  },
  {
    id: 2,
    type: 'boiling',
    label: 'Stage 2: Boiling Point (101.53°C)',
    propertyTitle: 'Boiling Point Elevation',
    constantSymbol: 'K_b',
    constantValue: 0.512,
    pureSolventTemp: 100.00,
    targetTemp: 101.53,
    initialSoluteMoles: 1.00,
    initialSolventKg: 1.00, // m = 1.00 mol/kg -> T_b = 100.51 °C
    tolerance: 0.06,
    vanTHoff: 1,
    hint: '🔴 Not enough solute! Add more glucose particles to raise the boiling point to 101.53°C.',
    explanation:
      'Target achieved! With molality m = 3.0 mol/kg, ΔT_b = 1 × 0.512 × 3.0 = 1.536°C ≈ 1.54°C. Therefore, boiling point T_b = 100.00°C + 1.536°C = 101.53°C.'
  }
];

// ── Responsive 3D Camera Controller ──────────────────────────────────────────
const BeakerCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    // Fits the beaker prominently and comfortably in the upper viewport above the bottom controls
    const aspect = size.width / Math.max(1, size.height);
    const fov = 38;
    const fovRad = (fov * Math.PI) / 180;
    // Target world width ~ 3.10 so the glass beaker appears comfortably bigger and clearer
    const requiredDistByWidth = 3.10 / (2 * Math.tan(fovRad / 2) * aspect);
    const finalDist = Math.max(6.2, requiredDistByWidth);

    // Looking at y = -0.55 centers the enlarged beaker cleanly between header and controls
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

// ── 3D Glucose Non-Electrolyte Molecule Component ─────────────────────────────
// Hexagonal chair-like ring representation (Purple/Indigo glucose cluster)
const GlucoseMolecule3D = ({
  position,
  scale = 1.0
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={scale}>
      {/* Central Core Carbon-Oxygen cluster */}
      <Sphere args={[0.09, 16, 16]}>
        <meshStandardMaterial color="#9333EA" roughness={0.25} metalness={0.15} />
      </Sphere>
      {/* Ring nodes (CH2OH & OH clusters) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        const x = Math.cos(angle) * 0.085;
        const z = Math.sin(angle) * 0.085;
        return (
          <Sphere key={i} args={[0.055, 12, 12]} position={[x, (i % 2 === 0 ? 0.03 : -0.03), z]}>
            <meshStandardMaterial color="#C084FC" roughness={0.3} metalness={0.1} />
          </Sphere>
        );
      })}
    </group>
  );
};

// ── 3D Beaker with Mounted Thermometer & Thermal Micro-Effects ─────────────────
const ColligativeBeaker3D = ({
  soluteMoles,
  solventKg,
  stage
}: {
  soluteMoles: number;
  solventKg: number;
  stage: StageConfig;
}) => {
  const beakerRadius = 1.15;
  const beakerHeight = 2.85;

  // Molality calculation (m = moles of solute / kg of solvent)
  const molality = solventKg > 0 ? soluteMoles / solventKg : 0;

  // Temperature calculation
  const deltaT = stage.vanTHoff * stage.constantValue * molality;
  const currentTemp =
    stage.type === 'freezing'
      ? stage.pureSolventTemp - deltaT
      : stage.pureSolventTemp + deltaT;

  // Dynamic Liquid Height: mapped to solvent mass (0.50 kg to 2.50 kg)
  const liquidHeight = Math.min(
    1.85,
    Math.max(0.65, 0.55 + (solventKg / 2.50) * 1.15 + Math.min(soluteMoles * 0.03, 0.15))
  );
  const liquidY = -beakerHeight / 2 + liquidHeight / 2;
  const surfaceY = -beakerHeight / 2 + liquidHeight;

  // Dissolved Solute (Glucose) count (4 to 24 particles based on solute moles)
  const glucoseCount = useMemo(() => {
    return Math.min(24, Math.max(3, Math.round(soluteMoles * 5)));
  }, [soluteMoles]);

  const glucosePositions = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const radius = (0.2 + ((i * 0.17) % 0.75)) * beakerRadius;
      const angle = i * 1.4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const yRel = (i * 0.13) % 0.85;
      return { x, z, yRel, phase: i * 0.7 };
    });
  }, [beakerRadius]);

  // Bulk Solvent Water molecules
  const bulkSolventPositions = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const radius = (0.15 + ((i * 0.19) % 0.75)) * beakerRadius;
      const angle = i * 1.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const yRel = (i * 0.11) % 0.82;
      return { x, z, yRel, phase: i * 0.9 };
    });
  }, [beakerRadius]);

  // Thermal micro-particles (Icy frost crystals for Freezing, Steam/Bubbles for Boiling)
  const thermalParticlesRef = useRef<THREE.Group>(null);
  const thermalSeeds = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      x: Math.sin(i * 1.7) * (beakerRadius * 0.65),
      z: Math.cos(i * 1.7) * (beakerRadius * 0.65),
      speed: 0.35 + (i % 3) * 0.15,
      offset: i / 14,
      scale: 0.03 + (i % 3) * 0.015,
      phase: i * 0.6
    }));
  }, [beakerRadius]);

  // Thermometer fluid height animation
  const thermoFluidHeight = useMemo(() => {
    if (stage.type === 'freezing') {
      // Scale from 0°C down to -8°C (higher depression -> lower fluid)
      const frac = Math.max(0.15, Math.min(0.9, 0.85 - (deltaT / 7.0) * 0.65));
      return frac * 1.4;
    } else {
      // Scale from 100°C up to 103°C (higher elevation -> higher fluid)
      const frac = Math.max(0.2, Math.min(0.95, 0.35 + (deltaT / 2.5) * 0.55));
      return frac * 1.4;
    }
  }, [stage.type, deltaT]);

  // Particle motion
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (thermalParticlesRef.current) {
      thermalParticlesRef.current.children.forEach((child, idx) => {
        const seed = thermalSeeds[idx];
        if (seed) {
          if (stage.type === 'boiling') {
            // Rising boiling bubbles & steam wisps
            const progress = (t * seed.speed + seed.offset) % 1;
            child.position.x = seed.x + Math.sin(t * 1.8 + idx) * 0.03;
            child.position.y = -beakerHeight / 2 + 0.15 + progress * (liquidHeight + 0.55);
            child.position.z = seed.z + Math.cos(t * 1.8 + idx) * 0.03;
            const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
            if (mat) {
              mat.opacity = Math.sin(progress * Math.PI) * 0.5;
            }
          } else {
            // Gently drifting icy frost crystals
            child.position.x = seed.x + Math.sin(t * 0.8 + seed.phase) * 0.02;
            child.position.y = -beakerHeight / 2 + 0.15 + (seed.offset * liquidHeight) + Math.cos(t * 0.7 + seed.phase) * 0.03;
            child.position.z = seed.z + Math.cos(t * 0.8 + seed.phase) * 0.02;
          }
        }
      });
    }
  });

  return (
    // Glass Beaker Root Group: Shifted to [0, -0.18, 0] to match exact approved position
    <group position={[0, -0.18, 0]}>
      {/* ── Outer Cylindrical Glass Beaker Body ── */}
      <Cylinder args={[beakerRadius, beakerRadius, beakerHeight, 48, 1, true]}>
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
      <Cylinder args={[beakerRadius, beakerRadius, 0.08, 48]} position={[0, -beakerHeight / 2, 0]} renderOrder={10}>
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.35} roughness={0.1} depthWrite={false} />
      </Cylinder>

      {/* Glass Top Lip Ring */}
      <mesh position={[0, beakerHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
        <torusGeometry args={[beakerRadius, 0.035, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.08} metalness={0.08} />
      </mesh>

      {/* ── Floating Target Badge over Glass Top Rim (Spacing = beakerHeight/2 + 0.56) ── */}
      <Html
        position={[0, beakerHeight / 2 + 0.56, 0]}
        center
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#0F172A] text-white border border-slate-700/90 shadow-xl select-none whitespace-nowrap">
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-emerald-400 uppercase">
            TARGET:
          </span>
          <span className="text-xs sm:text-sm font-mono font-black text-white">
            {stage.targetTemp > 0 ? `+${stage.targetTemp.toFixed(2)}` : stage.targetTemp.toFixed(2)} °C
          </span>
        </div>
      </Html>

      {/* ── 3D Liquid Solution Volume ── */}
      <Cylinder args={[beakerRadius * 0.96, beakerRadius * 0.96, liquidHeight, 36]} position={[0, liquidY, 0]}>
        <meshPhysicalMaterial
          color={stage.type === 'freezing' ? '#7DD3FC' : '#38BDF8'}
          transmission={0.85}
          roughness={stage.type === 'freezing' ? 0.18 : 0.08}
          transparent
          opacity={stage.type === 'freezing' ? 0.48 : 0.55}
          depthWrite={false}
        />
      </Cylinder>

      {/* Liquid Meniscus Rim */}
      <mesh position={[0, surfaceY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[beakerRadius * 0.88, beakerRadius * 0.96, 36]} />
        <meshBasicMaterial
          color={stage.type === 'freezing' ? '#38BDF8' : '#0284C7'}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Surface liquid disc */}
      <mesh position={[0, surfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[beakerRadius * 0.88, 36]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transmission={0.85}
          transparent
          opacity={0.4}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* ── Dissolved Glucose Solute Particles ── */}
      {glucosePositions.slice(0, glucoseCount).map((pos, idx) => {
        const y = -beakerHeight / 2 + 0.12 + pos.yRel * (liquidHeight - 0.22);
        return <GlucoseMolecule3D key={`glucose-${idx}`} position={[pos.x, y, pos.z]} scale={0.88} />;
      })}

      {/* ── Bulk Solvent Water Molecules ── */}
      {bulkSolventPositions.map((pos, idx) => {
        const y = -beakerHeight / 2 + 0.10 + pos.yRel * (liquidHeight - 0.20);
        return <WaterMolecule3D key={`solv-${idx}`} position={[pos.x, y, pos.z]} scale={0.7} />;
      })}

      {/* ── Thermal Micro-Particles Group (Ice Crystals or Steam Bubbles) ── */}
      <group ref={thermalParticlesRef}>
        {thermalSeeds.map((seed, idx) => (
          <mesh
            key={`thermal-${idx}`}
            position={[seed.x, -beakerHeight / 2 + 0.2 + seed.offset * liquidHeight, seed.z]}
            renderOrder={5}
          >
            <sphereGeometry args={[seed.scale, 10, 10]} />
            <meshBasicMaterial
              color={stage.type === 'freezing' ? '#E0F2FE' : '#BAE6FD'}
              transparent
              opacity={0.4}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ── Stage 2 Heating Mantle Glow (When Boiling Challenge Active) ── */}
      {stage.type === 'boiling' && (
        <group position={[0, -beakerHeight / 2 - 0.12, 0]}>
          <Cylinder args={[beakerRadius * 1.05, beakerRadius * 1.15, 0.18, 36]}>
            <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.4} />
          </Cylinder>
          {/* Glowing Burner Core */}
          <Cylinder args={[beakerRadius * 0.9, beakerRadius * 0.9, 0.05, 32]} position={[0, 0.09, 0]}>
            <meshBasicMaterial color="#F97316" />
          </Cylinder>
          <pointLight position={[0, 0.2, 0]} intensity={1.8} color="#FB923C" distance={2.5} />
        </group>
      )}

      {/* ── Mounted 3D Thermometer inside Beaker ── */}
      <group position={[beakerRadius * 0.58, 0.15, 0]}>
        {/* Outer glass tube */}
        <Cylinder args={[0.045, 0.045, 1.85, 24]}>
          <meshPhysicalMaterial
            color="#FFFFFF"
            transparent
            opacity={0.35}
            roughness={0.05}
            transmission={0.9}
            depthWrite={false}
          />
        </Cylinder>
        {/* Thermometer bottom bulb */}
        <Sphere args={[0.08, 20, 20]} position={[0, -0.92, 0]}>
          <meshStandardMaterial
            color={stage.type === 'freezing' ? '#0284C7' : '#EF4444'}
            roughness={0.2}
            metalness={0.2}
          />
        </Sphere>
        {/* Dynamic fluid column inside thermometer */}
        <Cylinder
          args={[0.024, 0.024, thermoFluidHeight, 16]}
          position={[0, -0.92 + thermoFluidHeight / 2, 0]}
        >
          <meshBasicMaterial color={stage.type === 'freezing' ? '#0284C7' : '#EF4444'} />
        </Cylinder>
        {/* Top stopper bead */}
        <Sphere args={[0.05, 16, 16]} position={[0, 0.93, 0]}>
          <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.6} />
        </Sphere>
      </group>

      {/* ── Constant Property Badge on Left Side of Beaker ── */}
      <group position={[-beakerRadius * 0.82, 0.65, 0]} rotation={[0, 0.45, 0]}>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.8} />
        </mesh>
        <Html position={[-0.18, 0, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-sm border shadow-md select-none whitespace-nowrap ${stage.type === 'freezing'
                ? 'bg-sky-50/95 border-sky-300'
                : 'bg-amber-50/95 border-amber-300'
              }`}
          >
            <span className="text-sm">{stage.type === 'freezing' ? '🧊' : '🔥'}</span>
            <div className="flex flex-col text-left">
              <span
                className={`text-[8px] font-black uppercase leading-none ${stage.type === 'freezing' ? 'text-sky-700' : 'text-amber-700'
                  }`}
              >
                Constant {stage.constantSymbol}
              </span>
              <span
                className={`text-xs font-mono font-black leading-tight ${stage.type === 'freezing' ? 'text-sky-950' : 'text-amber-950'
                  }`}
              >
                {stage.constantValue} <span className="text-[9px] font-semibold text-slate-500">°C·kg/mol</span>
              </span>
            </div>
          </div>
        </Html>
      </group>

      {/* ── Graduation Marks on Glass Beaker Body ── */}
      {[0.5, 1.0, 1.5, 2.0, 2.5].map((kg) => {
        const frac = kg / 2.5;
        const markY = -beakerHeight / 2 + 0.55 + frac * 1.15;
        return (
          <group key={`grad-${kg}`} position={[-beakerRadius * 0.94, markY, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
              <meshStandardMaterial color="#334155" roughness={0.3} />
            </mesh>
            <Html position={[-0.14, 0, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
              <span className="text-[8px] font-mono font-bold text-slate-600 select-none">
                {kg.toFixed(1)}kg
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// ── Main Colligative Properties Game Page Component ───────────────────────────
export interface ColligativePropertiesLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function ColligativePropertiesLevel1GamePage({
  difficulty = 'level1',
  onExit
}: ColligativePropertiesLevel1GamePageProps) {
  // Step Flow: 'mission' -> 'instructions' -> 'playing'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions' | 'playing'>('mission');

  // Stages State
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = STAGES[currentStageIdx];

  // Sliders State (Solute in mol, Solvent in kg)
  const [soluteMoles, setSoluteMoles] = useState(currentStage.initialSoluteMoles);
  const [solventKg, setSolventKg] = useState(currentStage.initialSolventKg);

  // Modals & Completion State
  const [isStageCompleted, setIsStageCompleted] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    checked: boolean;
    isCorrect: boolean;
    calculatedTemp: number;
    message: string;
  } | null>(null);

  // Colligative Calculations
  const molality = solventKg > 0 ? soluteMoles / solventKg : 0;
  const deltaT = Number((currentStage.vanTHoff * currentStage.constantValue * molality).toFixed(2));
  const calculatedTemp = Number(
    (currentStage.type === 'freezing'
      ? currentStage.pureSolventTemp - deltaT
      : currentStage.pureSolventTemp + deltaT
    ).toFixed(2)
  );

  // Handle stage selection
  const handleStageSelect = (idx: number) => {
    setCurrentStageIdx(idx);
    setSoluteMoles(STAGES[idx].initialSoluteMoles);
    setSolventKg(STAGES[idx].initialSolventKg);
    setIsStageCompleted(false);
    setSubmitResult(null);
  };

  // Submit check handler
  const handleSubmit = () => {
    const isCorrect = Math.abs(calculatedTemp - currentStage.targetTemp) <= currentStage.tolerance;
    if (isCorrect) {
      setSubmitResult({
        checked: true,
        isCorrect: true,
        calculatedTemp,
        message:
          currentStage.type === 'freezing'
            ? `🟢 Target achieved! You lowered the freezing point to ${calculatedTemp.toFixed(2)}°C.`
            : `🟢 Target achieved! You raised the boiling point to ${calculatedTemp.toFixed(2)}°C.`
      });
      setIsStageCompleted(true);
    } else {
      setSubmitResult({
        checked: true,
        isCorrect: false,
        calculatedTemp,
        message:
          calculatedTemp < currentStage.targetTemp && currentStage.type === 'boiling'
            ? '🔴 Not enough solute! Add more glucose to raise the boiling point.'
            : calculatedTemp > currentStage.targetTemp && currentStage.type === 'freezing'
              ? '🔴 Not enough solute! Add more glucose to lower the freezing point.'
              : `Current ${currentStage.propertyTitle} is ${calculatedTemp.toFixed(2)}°C. Target is ${currentStage.targetTemp.toFixed(2)}°C. Adjust concentration and try again!`
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
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col max-w-[440px] mx-auto">
      {/* ── STEP 1: MISSION SCREEN (MATCHING IMAGE 1) ───────────────────────── */}
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
              SOLUTIONS & COLLIGATIVE PROPERTIES
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Adjust the solute concentration to achieve the target freezing point and boiling point.
            </h1>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setIntroStep('instructions')}
                className="px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronLeft className="w-4 h-4 text-sky-200 rotate-180" />
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 font-medium">
            Click NEXT to view challenge instructions
          </div>
        </div>
      )}

      {/* ── STEP 2: INSTRUCTIONS SCREEN (MATCHING IMAGE 2) ───────────────────── */}
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

          {/* 3 Step Cards (Centered vertically in view with increased card height) */}
          <div className="flex flex-col gap-3.5 sm:gap-4 w-full mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Glucose Solute */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Add Non-Electrolyte Solute (Glucose)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solute Amount
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solute bar to increase glucose particles.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    Solute (Glucose)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-900">3.00 mol</span>
                </div>
                <div className="relative w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[60%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Solvent Water Mass */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Solvent Water (Mass, kg)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solvent Mass
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solvent bar to adjust water mass in kilograms.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Solvent (Water)
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-900">1.00 kg</span>
                </div>
                <div className="relative w-full h-2.5 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[40%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Match Target Colligative Temperature */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Match Target Freezing / Boiling Point
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Colligative Goal: ΔT = i·K·m
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Once the calculated temperature matches the target above the beaker, click Submit Answer to verify your result.
                </p>
              </div>
              <div className="mt-3 w-full py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs text-center shadow-xs">
                Submit Answer
              </div>
            </div>
          </div>

          {/* Bottom Navigation Buttons (Centered Compact Pills matching Image 1 & 2) */}
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

      {/* ── STEP 3: 3D FULL-SCREEN CANVAS (MATCHING IMAGE 3) ────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ fov: 38 }} className="w-full h-full touch-none cursor-grab active:cursor-grabbing">
          <color attach="background" args={['#FFFFFF']} />
          <BeakerCamera />
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

          <ColligativeBeaker3D
            soluteMoles={soluteMoles}
            solventKg={solventKg}
            stage={currentStage}
          />
        </Canvas>
      </div>

      {/* ── Top Floating Header (Exit on left, Explanation on right) ────────── */}
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

      {/* Subtle Axis Rotation Hint */}
      <div className="absolute bottom-[240px] sm:bottom-[250px] right-2.5 px-2 py-0.5 rounded-full bg-slate-900/40 backdrop-blur-xs text-white text-[9px] font-mono pointer-events-none select-none flex items-center gap-1 shadow-2xs z-10">
        <span>Drag to rotate on axis ↺</span>
      </div>

      {/* ── Target Achieved (Success) Dialog Overlay (Matching Image 5) ──────── */}
      {isStageCompleted && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-xs shadow-2xl border border-emerald-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Target Achieved!
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
              {currentStage.explanation}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>
              {currentStageIdx < STAGES.length - 1 ? (
                <button
                  type="button"
                  onClick={() => handleStageSelect(currentStageIdx + 1)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Next Stage &gt;</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStageSelect(0)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                >
                  <span>Replay Lab ↺</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Incorrect Submission Dialog Overlay (Matching Previous Topic) ───── */}
      {submitResult && !submitResult.isCorrect && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Incorrect Temperature
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-snug">
              Current {currentStage.propertyTitle} is{' '}
              <span className="font-bold font-mono text-rose-600">
                {submitResult.calculatedTemp > 0 ? `+${submitResult.calculatedTemp.toFixed(2)}` : submitResult.calculatedTemp.toFixed(2)}°C
              </span>
              .<br />
              Target is{' '}
              <span className="font-bold font-mono text-emerald-600">
                {currentStage.targetTemp > 0 ? `+${currentStage.targetTemp.toFixed(2)}` : currentStage.targetTemp.toFixed(2)}°C
              </span>
              .
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

      {/* ── Bottom Controls: Two Sliders (Solute & Solvent) + Submit Button ──── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto flex flex-col gap-2 p-2.5 sm:p-3 bg-gradient-to-t from-white via-white/95 to-transparent pt-6">
        {/* 1. Long Slider for Solute (Glucose, in mol) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-md">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              Solute (Glucose)
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
              {soluteMoles.toFixed(2)} mol
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="5.00"
            step="0.25"
            value={soluteMoles}
            onChange={(e) => {
              setSoluteMoles(parseFloat(e.target.value));
              setSubmitResult(null);
            }}
            className="w-full h-2.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* 2. Long Slider for Solvent (Water, in kg) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-md">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
              <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
              Solvent (Water)
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-sky-900 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
              {solventKg.toFixed(2)} kg
            </span>
          </div>
          <input
            type="range"
            min="0.50"
            max="2.50"
            step="0.25"
            value={solventKg}
            onChange={(e) => {
              setSolventKg(parseFloat(e.target.value));
              setSubmitResult(null);
            }}
            className="w-full h-2.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* 3. Submit Button (Matching User Image with N badge and Submit Answer) */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 sm:py-3 rounded-2xl bg-[#3B50FF] hover:bg-[#3141DE] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wide"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center font-black text-xs text-white shadow-xs">
            N
          </div>
          <span>Submit Answer</span>
        </button>
      </footer>

      {/* ── STEP 4: FULL-SCREEN EXPLANATION MODAL (MATCHING IMAGE 4) ─────────── */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between p-4 sm:p-5 overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide uppercase">
              Colligative Properties &amp; Formulas
            </h2>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {/* Scrollable Content (Clean normal text without covering card boxes) */}
          <div className="flex-1 overflow-y-auto py-3 space-y-5 px-2 text-left">
            {/* 1. Real-World Motivation: Why Does This Matter? */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                1. Real-World Motivation: Why Does This Matter?
              </h3>
              <p className="text-sm sm:text-base text-slate-800 font-semibold">
                Have you ever wondered:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 list-disc pl-5">
                <li>
                  <strong>Why do trucks spread salt on icy roads in winter?</strong> Salt dissolves in the thin layer of water and lowers its freezing point below 0°C, melting the ice even when it is below freezing!
                </li>
                <li>
                  <strong>Why do car radiators use antifreeze/coolant?</strong> Adding a solute (like ethylene glycol) does two things at once: it stops the coolant from freezing in winter and prevents the engine from boiling over in summer!
                </li>
              </ul>
              <p className="text-xs sm:text-sm text-purple-700 font-semibold pt-1">
                This simulation lets you directly control these two phenomena.
              </p>
            </div>

            <div className="h-px bg-slate-200 w-full" />

            {/* 2. The Core Concepts You Are Learning */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                2. The Core Concepts You Are Learning
              </h3>

              {/* Concept 1 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-blue-700">
                  Concept 1: What is a &quot;Colligative Property&quot;?
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  The word <em>colligative</em> comes from the Latin word meaning <strong>&quot;bound together by quantity&quot;</strong>.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  These are properties of a solution that depend <strong>ONLY on the NUMBER of dissolved solute particles</strong>, not on what the solute is (whether it is sugar, urea, or glucose).
                </p>
              </div>

              {/* Concept 2 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-purple-700">
                  Concept 2: Why Molality (m) Instead of Molarity (M)?
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  In our earlier topic, we used Molarity (M = moles / Liters of solution).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  But when liquid is heated or cooled, its volume expands and contracts, so <strong>molarity changes with temperature!</strong>
                </p>
                <p className="text-xs sm:text-sm font-mono font-bold text-slate-900 pl-2">
                  Molality (m) = Moles of solute (mol) / Mass of solvent (kg)
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Molality uses mass in kilograms. <strong>Mass never changes with temperature</strong>, making it the correct unit for freezing and boiling studies.
                </p>
              </div>

              {/* Concept 3 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-sky-700">
                  Concept 3: Freezing Point Depression (ΔT_f)
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Pure water freezes at <strong>0.00°C</strong> by organizing into a rigid, ordered crystal lattice (ice).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  When solute particles (glucose) dissolve, they physically get in the way and disrupt the water molecules from locking into a solid crystal.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  You must pull out more heat (cool it lower) to force it to freeze:
                </p>
                <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 pl-2 space-y-0.5">
                  <div>ΔT_f = i · K_f · m</div>
                  <div>New Freezing Point (T_f) = 0.00°C − ΔT_f</div>
                </div>
                <p className="text-xs text-slate-500 pl-2">
                  (For water: cryoscopic constant K_f = 1.86 °C·kg/mol)
                </p>
              </div>

              {/* Concept 4 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-amber-700">
                  Concept 4: Boiling Point Elevation (ΔT_b)
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  A liquid boils when its internal vapor pressure equals atmospheric pressure (<strong>1 atm</strong>).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  In the previous Raoult’s Law topic, you saw that adding non-volatile solute particles lowers vapor pressure.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Because the vapor pressure is now lower, you have to heat the solution to a higher temperature to make it reach 1 atm and boil:
                </p>
                <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 pl-2 space-y-0.5">
                  <div>ΔT_b = i · K_b · m</div>
                  <div>New Boiling Point (T_b) = 100.00°C + ΔT_b</div>
                </div>
                <p className="text-xs text-slate-500 pl-2">
                  (For water: ebullioscopic constant K_b = 0.512 °C·kg/mol)
                </p>
              </div>

              {/* Concept 5 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-700">
                  Concept 5: The van &apos;t Hoff Factor (i)
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Glucose (<strong>C₆H₁₂O₆</strong>) is a non-electrolyte. When dissolved in water, 1 molecule stays as 1 intact molecule (it doesn&apos;t break into ions).
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-900 pl-2">
                  Therefore, i = 1
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full" />

            {/* 3. Applying in the Simulation Lab */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                3. Applying This in the Simulation Lab
              </h3>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <div>
                  <strong className="text-sky-800 block">🧊 Stage 1: Target Freezing Point = −5.58°C</strong>
                  <div className="font-mono pl-2 text-slate-800 space-y-0.5">
                    <div>ΔT_f = 0.00°C − (−5.58°C) = 5.58°C</div>
                    <div>5.58 = 1 × 1.86 × m  =&gt;  m = 5.58 / 1.86 = <strong>3.00 mol/kg</strong></div>
                    <div className="text-slate-500 text-xs">Recipe: 3.00 mol glucose in 1.00 kg water</div>
                  </div>
                </div>
                <div>
                  <strong className="text-amber-800 block">🔥 Stage 2: Target Boiling Point = 101.53°C</strong>
                  <div className="font-mono pl-2 text-slate-800 space-y-0.5">
                    <div>ΔT_b = 101.53°C − 100.00°C = 1.53°C</div>
                    <div>1.53 = 1 × 0.512 × m  =&gt;  m = 1.53 / 0.512 ≈ <strong>3.00 mol/kg</strong></div>
                    <div className="text-slate-500 text-xs">Recipe: 3.00 mol glucose in 1.00 kg water</div>
                  </div>
                </div>
              </div>
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
