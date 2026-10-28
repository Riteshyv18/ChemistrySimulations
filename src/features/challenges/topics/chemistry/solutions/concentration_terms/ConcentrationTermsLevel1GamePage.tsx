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
  Plus,
  Minus,
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
  targetMolarity: number; // e.g., 0.50 M
  initialMoles: number;
  initialVolume: number;
  tolerance: number; // e.g., 0.02
  hint: string;
  explanation: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: 'Stage 1: 0.50 M',
    targetMolarity: 0.50,
    initialMoles: 0.25,
    initialVolume: 0.87,
    tolerance: 0.03,
    hint: 'Adjust solute and solvent so that M = n / V equals 0.50 M!',
    explanation: 'M = n / V. At 0.50 mol solute in 1.00 L solution (or 0.25 mol in 0.50 L), the molarity equals exactly 0.50 M.'
  },
  {
    id: 2,
    label: 'Stage 2: 1.00 M',
    targetMolarity: 1.00,
    initialMoles: 0.50,
    initialVolume: 1.00,
    tolerance: 0.03,
    hint: 'Double the solute to 1.00 mol in 1.00 L, or reduce the water to 0.50 L for 0.50 mol!',
    explanation: 'Higher particle count in the same volume increases solute-to-solvent ratio, doubling concentration to 1.00 M.'
  },
  {
    id: 3,
    label: 'Stage 3: 0.20 M (Dilution)',
    targetMolarity: 0.20,
    initialMoles: 0.20,
    initialVolume: 0.50,
    tolerance: 0.03,
    hint: 'Dilute the solution! Add water up to 1.00 L while keeping solute at 0.20 mol (0.20 / 1.00 = 0.20 M).',
    explanation: 'Dilution principle (M1V1 = M2V2): Adding solvent increases total volume V, dispersing particles and lowering molarity.'
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

// ── Pre-cached Canvas Textures for Na and Cl Chemical Sprites ────────────────
let cachedNaTexture: THREE.CanvasTexture | null = null;
let cachedClTexture: THREE.CanvasTexture | null = null;

function getChemicalSpriteTexture(text: 'Na' | 'Cl'): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (text === 'Na') {
    if (!cachedNaTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 256, 256);
        ctx.font = '900 112px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Dark contrast outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 14;
        ctx.strokeText('Na', 128, 136);
        // Pure crisp white fill
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Na', 128, 136);
        cachedNaTexture = new THREE.CanvasTexture(canvas);
        cachedNaTexture.needsUpdate = true;
      }
    }
    return cachedNaTexture;
  } else {
    if (!cachedClTexture) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 256, 256);
        ctx.font = '900 112px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Dark contrast outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 14;
        ctx.strokeText('Cl', 128, 136);
        // Pure crisp white fill
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Cl', 128, 136);
        cachedClTexture = new THREE.CanvasTexture(canvas);
        cachedClTexture.needsUpdate = true;
      }
    }
    return cachedClTexture;
  }
}

// Pre-defined coordination bond offsets for hydrated ions (mirroring Image 2)
const HYDRATION_BONDS: { offset: [number, number, number]; rot: [number, number, number] }[] = [
  { offset: [0.12, 0.08, 0.04], rot: [0.4, 0.6, 0.8] },
  { offset: [-0.11, -0.09, 0.05], rot: [-0.5, -0.4, 0.7] },
  { offset: [0.04, 0.13, -0.07], rot: [0.8, -0.3, -0.5] },
  { offset: [-0.06, 0.05, 0.12], rot: [-0.2, 0.9, 0.3] }
];

// ── 3D Glass Beaker Component (Enhanced to Match Image 2 Reference) ───────────
const GlassBeaker3D = ({
  volume,
  moles,
  isPouringSalt,
  isAddingWater,
  isDraining,
  targetMolarity
}: {
  volume: number; // 0.2 to 1.0 L
  moles: number;
  isPouringSalt: boolean;
  isAddingWater: boolean;
  isDraining: boolean;
  targetMolarity?: number;
}) => {
  const beakerRadius = 1.15;
  const beakerHeight = 2.85;
  const maxVolume = 1.0;

  // Fluid height mapped linearly to volume (0.2L -> 0.45 units, 1.0L -> 2.25 units)
  const fluidHeight = Math.max(0.32, (volume / maxVolume) * 2.25);
  const fluidY = -beakerHeight / 2 + fluidHeight / 2;

  // Cached Chemical Sprite Textures
  const naTexture = useMemo(() => getChemicalSpriteTexture('Na'), []);
  const clTexture = useMemo(() => getChemicalSpriteTexture('Cl'), []);

  // Generate floating ion particles inside the fluid volume (Na & Cl)
  const particleCount = useMemo(() => Math.min(50, Math.max(8, Math.round(moles * 32))), [moles]);
  const particles = useMemo(() => {
    const list: { x: number; yNorm: number; z: number; phase: number; isNa: boolean; rotY: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (beakerRadius * 0.72);
      list.push({
        x: Math.cos(angle) * dist,
        yNorm: Math.random(), // 0 to 1 relative to fluid height
        z: Math.sin(angle) * dist,
        phase: Math.random() * Math.PI * 2,
        isNa: i % 2 === 0,
        rotY: Math.random() * Math.PI * 2
      });
    }
    return list;
  }, [particleCount, beakerRadius]);

  // Ambient floating H2O water molecules (Red Oxygen + 2 White Hydrogen) matching Image 2
  const waterMolecules = useMemo(() => {
    const list: { x: number; yNorm: number; z: number; rotX: number; rotY: number; rotZ: number; phase: number }[] = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (beakerRadius * 0.70);
      list.push({
        x: Math.cos(angle) * dist,
        yNorm: Math.random(),
        z: Math.sin(angle) * dist,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      });
    }
    return list;
  }, [beakerRadius]);

  // Micro-bubbles scattered in water volume (fizzy dissolved bubbles in Image 2)
  const bubbles = useMemo(() => {
    const list: { x: number; yNorm: number; z: number; radius: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (beakerRadius * 0.72);
      list.push({
        x: Math.cos(angle) * dist,
        yNorm: Math.random(),
        z: Math.sin(angle) * dist,
        radius: 0.016 + Math.random() * 0.022,
        speed: 0.8 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      });
    }
    return list;
  }, [beakerRadius]);

  const particlesRef = useRef<THREE.Group>(null);
  const waterMoleculesRef = useRef<THREE.Group>(null);
  const bubblesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, idx) => {
        const p = particles[idx];
        if (p) {
          child.position.y = -beakerHeight / 2 + p.yNorm * fluidHeight + Math.sin(t * 1.4 + p.phase) * 0.045;
          child.position.x = p.x + Math.cos(t * 1.1 + p.phase) * 0.025;
        }
      });
    }
    if (waterMoleculesRef.current) {
      waterMoleculesRef.current.children.forEach((child, idx) => {
        const w = waterMolecules[idx];
        if (w) {
          child.position.y = -beakerHeight / 2 + w.yNorm * fluidHeight + Math.sin(t * 1.3 + w.phase) * 0.04;
          child.position.x = w.x + Math.cos(t * 1.0 + w.phase) * 0.02;
          child.rotation.z = w.rotZ + Math.sin(t * 0.8 + w.phase) * 0.2;
        }
      });
    }
    if (bubblesRef.current) {
      bubblesRef.current.children.forEach((child, idx) => {
        const b = bubbles[idx];
        if (b) {
          // Micro bubbles gently bobbing up and oscillating
          child.position.y = -beakerHeight / 2 + ((b.yNorm + t * 0.08 * b.speed) % 1) * fluidHeight;
          child.position.x = b.x + Math.sin(t * 2.0 + b.phase) * 0.015;
        }
      });
    }
  });

  return (
    <group position={[0, -0.18, 0]}>
      {/* ── 1. 3D Dynamic Fluid Solution (Crystal Clear Light Aqua Water matching Image 2) ── */}
      <group position={[0, fluidY, 0]} renderOrder={1}>
        <Cylinder args={[beakerRadius * 0.97, beakerRadius * 0.97, fluidHeight, 48]}>
          <meshStandardMaterial
            color="#38BDF8"
            roughness={0.06}
            metalness={0.05}
            transparent
            opacity={0.20}
            depthWrite={false}
          />
        </Cylinder>

        {/* Top Liquid Meniscus Surface */}
        <mesh position={[0, fluidHeight / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <circleGeometry args={[beakerRadius * 0.96, 48]} />
          <meshStandardMaterial
            color="#38BDF8"
            roughness={0.04}
            metalness={0.08}
            opacity={0.30}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Subtle Meniscus Edge Rim (Vibrant azure ring like Image 2) */}
        <mesh position={[0, fluidHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={3}>
          <torusGeometry args={[beakerRadius * 0.96, 0.018, 16, 48]} />
          <meshBasicMaterial color="#0284C7" opacity={0.75} transparent />
        </mesh>
      </group>

      {/* ── 2. Ambient Micro-Bubbles (Translucent fizzy bubbles matching Image 2) ── */}
      <group ref={bubblesRef} renderOrder={3}>
        {bubbles.map((b, idx) => (
          <Sphere
            key={`bubble-${idx}`}
            args={[b.radius, 12, 12]}
            position={[b.x, -beakerHeight / 2 + b.yNorm * fluidHeight, b.z]}
          >
            <meshStandardMaterial
              color="#E0F2FE"
              roughness={0.06}
              metalness={0.15}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </Sphere>
        ))}
      </group>

      {/* ── 3. Ambient Floating H2O Molecules (Red Oxygen + White Hydrogen matching Image 2) ── */}
      <group ref={waterMoleculesRef} renderOrder={4}>
        {waterMolecules.map((w, idx) => (
          <group
            key={`h2o-${idx}`}
            position={[w.x, -beakerHeight / 2 + w.yNorm * fluidHeight, w.z]}
            rotation={[w.rotX, w.rotY, w.rotZ]}
          >
            {/* Central Oxygen Sphere (Vibrant Red) */}
            <Sphere args={[0.064, 18, 18]}>
              <meshStandardMaterial
                color="#EF4444"
                roughness={0.15}
                metalness={0.1}
                emissive="#991B1B"
                emissiveIntensity={0.25}
              />
            </Sphere>

            {/* Bond 1 to Hydrogen 1 */}
            <mesh position={[-0.042, 0.034, 0]} rotation={[0, 0, Math.PI / 4]}>
              <cylinderGeometry args={[0.011, 0.011, 0.065, 10]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.1} />
            </mesh>
            {/* Hydrogen 1 (Pure White) */}
            <Sphere args={[0.042, 16, 16]} position={[-0.072, 0.056, 0]}>
              <meshStandardMaterial color="#FFFFFF" roughness={0.12} metalness={0.05} />
            </Sphere>

            {/* Bond 2 to Hydrogen 2 */}
            <mesh position={[0.042, 0.034, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <cylinderGeometry args={[0.011, 0.011, 0.065, 10]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.1} />
            </mesh>
            {/* Hydrogen 2 (Pure White) */}
            <Sphere args={[0.042, 16, 16]} position={[0.072, 0.056, 0]}>
              <meshStandardMaterial color="#FFFFFF" roughness={0.12} metalness={0.05} />
            </Sphere>
          </group>
        ))}
      </group>

      {/* ── 4. 3D Dissolved Ion Solute Particles (Na & Cl with Hydration Shell matching Image 2) ── */}
      <group ref={particlesRef} renderOrder={6}>
        {particles.map((p, idx) => {
          const radius = p.isNa ? 0.135 : 0.155;
          const tex = p.isNa ? naTexture : clTexture;

          return (
            <group
              key={`ion-${idx}`}
              position={[p.x, -beakerHeight / 2 + p.yNorm * fluidHeight, p.z]}
            >
              {/* Glossy Core Ion Sphere: Royal Blue for Na, Emerald Green for Cl */}
              <Sphere args={[radius, 24, 24]}>
                <meshStandardMaterial
                  color={p.isNa ? '#0284C7' : '#16A34A'}
                  roughness={0.10}
                  metalness={0.18}
                  emissive={p.isNa ? '#0369A1' : '#15803D'}
                  emissiveIntensity={0.35}
                />
              </Sphere>

              {/* Solvation Shell: Coordination bonds & attached water spheres matching Image 2 */}
              {HYDRATION_BONDS.map((b, bIdx) => (
                <group key={`bond-${bIdx}`} rotation={b.rot}>
                  {/* Connecting coordination bond rod */}
                  <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.012, 0.012, 0.12, 10]} />
                    <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.1} />
                  </mesh>
                  {/* Coordinating ligand sphere */}
                  <Sphere args={[0.052, 14, 14]} position={[0, 0.14, 0]}>
                    <meshStandardMaterial
                      color={p.isNa ? '#38BDF8' : '#86EFAC'}
                      roughness={0.14}
                      metalness={0.1}
                      emissive={p.isNa ? '#0284C7' : '#22C55E'}
                      emissiveIntensity={0.2}
                    />
                  </Sphere>
                </group>
              ))}

              {/* Crisp 3D Chemical Symbol Sprite (Na / Cl) Always Facing Camera & 100% Legible */}
              {tex && (
                <sprite scale={[radius * 2.3, radius * 2.3, 1]} position={[0, 0, 0]} renderOrder={9}>
                  <spriteMaterial map={tex} transparent depthWrite={false} depthTest={false} />
                </sprite>
              )}
            </group>
          );
        })}
      </group>

      {/* ── 5. 3D Transparent Outer Glass Beaker (depthWrite=false prevents hiding water!) ── */}
      <Cylinder args={[beakerRadius, beakerRadius, beakerHeight, 48, 1, true]} position={[0, 0, 0]} renderOrder={10}>
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.06}
          metalness={0.05}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          reflectivity={0.9}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </Cylinder>

      {/* Glass Bottom Base */}
      <Cylinder args={[beakerRadius, beakerRadius, 0.08, 36]} position={[0, -beakerHeight / 2, 0]} renderOrder={10}>
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.30}
          roughness={0.12}
          depthWrite={false}
        />
      </Cylinder>

      {/* Glass Top Lip Ring */}
      <mesh position={[0, beakerHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={10}>
        <torusGeometry args={[beakerRadius, 0.04, 16, 48]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.08} metalness={0.08} />
      </mesh>

      {/* ── Floating Target Badge over Glass Top Rim (User Request) ── */}
      {targetMolarity !== undefined && (
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
              {targetMolarity.toFixed(2)} M
            </span>
          </div>
        </Html>
      )}

      {/* ── Printed Graduation Marks (0.2L, 0.4L, 0.6L, 0.8L, 1.0L) ── */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
        const markY = -beakerHeight / 2 + (v / maxVolume) * 2.25;
        return (
          <group key={v} position={[0, markY, 0]} renderOrder={12}>
            {/* Graduation tick mark line on beaker */}
            <mesh position={[-beakerRadius * 0.95, 0, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.20, 0.02, 0.02]} />
              <meshBasicMaterial color="#1E293B" opacity={0.85} transparent />
            </mesh>
          </group>
        );
      })}

      {/* ── Inflow Water Stream (When Adding Water) ── */}
      {isAddingWater && (
        <group position={[0, beakerHeight / 2 + 0.35, 0]}>
          <Cylinder args={[0.06, 0.08, 1.0, 16]}>
            <meshPhysicalMaterial color="#38BDF8" transmission={0.9} transparent opacity={0.7} />
          </Cylinder>
          <Html position={[0, 0.7, 0]} center zIndexRange={[20, 0]}>
            <div className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-300 px-2 py-0.5 rounded-full shadow-xs animate-bounce">
              + Water Flow
            </div>
          </Html>
        </group>
      )}

      {/* ── Salt Crystals Pouring Stream (When Adding Salt) ── */}
      {isPouringSalt && (
        <group position={[0.3, beakerHeight / 2 + 0.4, 0]}>
          {[...Array(6)].map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 0.2, -i * 0.16, (Math.random() - 0.5) * 0.2]}>
              <boxGeometry args={[0.07, 0.07, 0.07]} />
              <meshStandardMaterial color="#FFFFFF" emissive="#A855F7" emissiveIntensity={0.4} />
            </mesh>
          ))}
          <Html position={[0.3, 0.35, 0]} center zIndexRange={[20, 0]}>
            <div className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-300 px-2 py-0.5 rounded-full shadow-xs">
              + Salt NaCl
            </div>
          </Html>
        </group>
      )}

      {/* ── Drain Stream (When Draining) ── */}
      {isDraining && (
        <group position={[0, -beakerHeight / 2 - 0.4, 0]}>
          <Cylinder args={[0.05, 0.06, 0.7, 16]}>
            <meshPhysicalMaterial color="#38BDF8" transmission={0.8} transparent opacity={0.6} />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

// ── Main Game Page Component ──────────────────────────────────────────────────
export interface ConcentrationTermsLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function ConcentrationTermsLevel1GamePage({
  difficulty = 'level1',
  onExit
}: ConcentrationTermsLevel1GamePageProps) {
  // Navigation & Intro State
  const [introStep, setIntroStep] = useState<'mission' | 'instructions' | 'playing'>('mission');
  const [showExplanation, setShowExplanation] = useState(false);

  // Stage & Solution State
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const currentStage = STAGES[currentStageIdx];

  const [moles, setMoles] = useState(currentStage.initialMoles); // n in mol
  const [volume, setVolume] = useState(currentStage.initialVolume); // V in L

  // Active Flow Animations
  const [isPouringSalt, setIsPouringSalt] = useState(false);
  const [isAddingWater, setIsAddingWater] = useState(false);
  const [isDraining, setIsDraining] = useState(false);

  // History for Revert/Reset
  const [history, setHistory] = useState<{ moles: number; volume: number }[]>([]);

  // Feedback & Completion
  const [isStageCompleted, setIsStageCompleted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    checked: boolean;
    isCorrect: boolean;
    calculatedMolarity: number;
    message: string;
  } | null>(null);

  // Current Molarity Calculation
  const currentMolarity = useMemo(() => {
    if (volume <= 0) return 0;
    return Number((moles / volume).toFixed(2));
  }, [moles, volume]);

  // Manual Check Handler (No auto-correct, triggered ONLY by Submit button)
  const handleSubmit = () => {
    if (volume <= 0) return;
    const calcMolarity = Number((moles / volume).toFixed(2));
    const isCorrect = Math.abs(calcMolarity - currentStage.targetMolarity) <= currentStage.tolerance;
    if (isCorrect) {
      setSubmitResult({
        checked: true,
        isCorrect: true,
        calculatedMolarity: calcMolarity,
        message: `🎉 Correct! Molarity is ${calcMolarity.toFixed(2)} M (Target: ${currentStage.targetMolarity.toFixed(2)} M).`
      });
      setIsStageCompleted(true);
    } else {
      setSubmitResult({
        checked: true,
        isCorrect: false,
        calculatedMolarity: calcMolarity,
        message: `Current Molarity = ${calcMolarity.toFixed(2)} M. Target is ${currentStage.targetMolarity.toFixed(2)} M. Adjust and try again!`
      });
    }
  };

  // Handle stage change
  const handleStageSelect = (idx: number) => {
    setCurrentStageIdx(idx);
    setMoles(STAGES[idx].initialMoles);
    setVolume(STAGES[idx].initialVolume);
    setIsStageCompleted(false);
    setSubmitResult(null);
    setHistory([]);
  };

  // Revert action
  const handleRevert = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setMoles(prev.moles);
      setVolume(prev.volume);
      setHistory((h) => h.slice(0, -1));
    } else {
      setMoles(currentStage.initialMoles);
      setVolume(currentStage.initialVolume);
    }
    setIsStageCompleted(false);
  };

  // Add Salt Solute (+0.25 mol)
  const handleAddSalt = () => {
    if (moles >= 2.0) return;
    setHistory((h) => [...h, { moles, volume }]);
    setIsPouringSalt(true);
    setTimeout(() => setIsPouringSalt(false), 600);
    setMoles((m) => Number(Math.min(2.0, m + 0.25).toFixed(2)));
  };

  // Remove Salt Solute (-0.25 mol)
  const handleRemoveSalt = () => {
    if (moles <= 0.1) return;
    setHistory((h) => [...h, { moles, volume }]);
    setMoles((m) => Number(Math.max(0.1, m - 0.25).toFixed(2)));
  };

  // Add Water Solvent (+0.10 L)
  const handleAddWater = () => {
    if (volume >= 1.0) return;
    setHistory((h) => [...h, { moles, volume }]);
    setIsAddingWater(true);
    setTimeout(() => setIsAddingWater(false), 600);
    setVolume((v) => Number(Math.min(1.0, v + 0.1).toFixed(2)));
  };

  // Drain Water Solvent (-0.10 L)
  const handleDrainWater = () => {
    if (volume <= 0.2) return;
    setHistory((h) => [...h, { moles, volume }]);
    setIsDraining(true);
    setTimeout(() => setIsDraining(false), 600);
    setVolume((v) => Number(Math.max(0.2, v - 0.1).toFixed(2)));
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
              SOLUTIONS & CONCENTRATION TERMS
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Adjust the salt and water amounts to match the target molarity (M).
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

          <div className="text-center pt-1 pb-2">
            <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
              INSTRUCTIONS TO PLAY
            </h2>
          </div>

          {/* Instruction Cards (Formatted cleanly to fit one screen) */}
          <div className="flex flex-col gap-2.5 w-full mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Solute */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Dispense Salt Solute (Moles, n)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solute Amount
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1.5">
                  Slide the solute bar to the right to increase the amount of salt until it reaches the required value.
                </p>
              </div>

              {/* Visual Preview: Solute Slider */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2 sm:p-2.5 mt-2 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    Solute (Salt)
                  </span>
                </div>
                <div className="relative w-full h-2 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[35%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Solvent */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Water Volume (Liters, V)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Solvent Volume
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1.5">
                  Slide the solvent bar to the right to adjust the amount of water and achieve a concentration.
                </p>
              </div>

              {/* Visual Preview: Solvent Slider */}
              <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2 sm:p-2.5 mt-2 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Solvent (Water)
                  </span>
                </div>
                <div className="relative w-full h-2 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[80%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Target Match */}
            <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Match Target Molarity
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Concentration Goal
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-snug mt-1.5">
                  Once both bars are set to the correct values, click the Submit Answer button to check your result.
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

          <GlassBeaker3D
            volume={volume}
            moles={moles}
            isPouringSalt={isPouringSalt}
            isAddingWater={isAddingWater}
            isDraining={isDraining}
            targetMolarity={currentStage.targetMolarity}
          />
        </Canvas>
      </div>

      {/* ── Top Floating Header (Exit on left, Explanation on right; Target moved over Glass Top) ── */}
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

      {/* Stage Completion Banner Overlay */}
      {isStageCompleted && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-4 text-center max-w-xs shadow-2xl border border-emerald-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Target Achieved!
            </h3>
            <p className="text-xs text-slate-600 mb-3 leading-snug">
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

      {/* ── Incorrect Submission Dialog Box Overlay (Matching Winning Dialog) ── */}
      {submitResult && !submitResult.isCorrect && (
        <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs absolute inset-0 flex items-center justify-center p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl border border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Incorrect Concentration
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-snug">
              Current Molarity is <span className="font-bold font-mono text-rose-600">{submitResult.calculatedMolarity.toFixed(2)} M</span>.<br />
              Target is <span className="font-bold font-mono text-emerald-600">{currentStage.targetMolarity.toFixed(2)} M</span>.
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

      {/* ── Bottom Controls: Two Sliders (Solute & Solvent) + Submit Button inside Canvas Bottom Area ────── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto flex flex-col gap-2 p-2.5 sm:p-3 bg-gradient-to-t from-white via-white/95 to-transparent pt-6">

        {/* 1. Long Slider for Solute (Salt, n in mol) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-md">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              Solute (Salt)
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-1 rounded-lg shadow-2xs">
              {moles.toFixed(2)} mol
            </span>
          </div>
          <input
            type="range"
            min={0.10}
            max={2.00}
            step={0.01}
            value={moles}
            onChange={(e) => {
              setMoles(Number(e.target.value));
              setSubmitResult(null);
            }}
            className="w-full h-2.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* 2. Long Slider for Solvent (Water, V in L) */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-md">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-sm font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
              <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
              Solvent (Water)
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-sky-900 bg-sky-100 border border-sky-300 px-2.5 py-1 rounded-lg shadow-2xs">
              {volume.toFixed(2)} L
            </span>
          </div>
          <input
            type="range"
            min={0.20}
            max={1.00}
            step={0.01}
            value={volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setSubmitResult(null);
            }}
            className="w-full h-2.5 bg-sky-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* 3. Submit Button (Matching User Image 3 with N badge and Submit Answer) */}
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

      {/* ── STEP 4: EXPLANATION MODAL (MATCHING IMAGES 4 & 5) ────────────────── */}
      {/* ── STEP 4: EXPLANATION SCREEN (FULL CANVAS WHOLE SCREEN) ─────────── */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 sm:p-5 bg-white overflow-y-auto animate-in fade-in duration-200">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <h2 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-wide">
              Concentration Terms: Molarity (M)
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
            {/* Section 1: Definition & Formula */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  1
                </span>
                What is Molarity?
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                <strong>Molarity (M)</strong> is the most common quantitative concentration unit used in chemistry. It expresses the number of moles of solute dissolved per liter of total solution:
              </p>
              <div className="py-2 text-center font-mono font-black text-xs sm:text-sm text-slate-900 tracking-wide">
                Molarity (M) = Moles of Solute (n) / Volume of Solution (V in Liters)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>SI Unit:</strong> <span className="font-mono font-bold text-slate-800">mol/L</span> or <span className="font-mono font-bold text-slate-800">mol·dm⁻³</span>, commonly symbolized by capital <strong>M</strong> (spoken as &quot;molar&quot;).
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 2: Solute Moles & Mass */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  2
                </span>
                Solute Moles vs Gram Mass
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                The number of moles (<span className="font-mono font-bold text-purple-700">n</span>) depends on the mass (<span className="font-mono font-bold">m</span> in grams) and the molecular weight (<span className="font-mono font-bold">M_w</span> in g/mol):
              </p>
              <div className="py-2 text-center font-mono font-black text-xs sm:text-sm text-purple-900 tracking-wide">
                n (moles) = mass (g) / Molar Mass (g/mol)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • For table salt (<strong className="text-slate-800">NaCl</strong>), Molar Mass ≈ <strong>58.44 g/mol</strong>. Therefore, <span className="font-mono font-bold text-purple-800">0.50 mol NaCl</span> corresponds to exactly <strong>29.22 g</strong> of salt.
              </p>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 3: Effect of Adding Solute vs Solvent */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  3
                </span>
                Effect of Adding Solute vs Solvent
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-purple-800">Adding Solute (n ↑):</strong> Increases the ion concentration of Na⁺ and Cl⁻ per unit volume. The solution becomes darker and more concentrated.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sky-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-sky-800">Adding Water (V ↑):</strong> Dilutes the solution. The dissolved particles spread farther apart, and molarity decreases.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                  <span>
                    <strong className="text-amber-800">Draining Water (V ↓):</strong> Removing solvent while keeping solute constant increases particle density, raising concentration.
                  </span>
                </li>
              </ul>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 4: Dilution Law & Calculation */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  4
                </span>
                The Dilution Law
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                When additional pure solvent is added to an existing solution, the total moles of solute (<span className="font-mono font-bold">n</span>) remain completely constant (<span className="font-mono font-bold">n₁ = n₂</span>):
              </p>
              <div className="py-2 text-center font-mono font-black text-xs sm:text-sm text-sky-800 tracking-wide">
                M₁ × V₁ = M₂ × V₂
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                • <strong>Quick Example:</strong> If you start with <strong>0.50 L</strong> of a <strong>1.00 M</strong> solution (<span className="font-mono font-bold">0.50 mol</span>) and add water to reach <strong>1.00 L</strong>:
              </p>
              <div className="py-1 text-center font-mono font-bold text-xs sm:text-sm text-sky-900">
                M₂ = (1.00 M × 0.50 L) / 1.00 L = 0.50 M
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section 5: Temperature Note */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                  5
                </span>
                Temperature Dependence
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Because liquid volumes expand with heating and contract with cooling, <strong>Molarity is temperature-dependent</strong>. For experiments where temperature changes significantly, chemists often use <em>Molality (m, mol/kg solvent)</em>, which is independent of temperature.
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
