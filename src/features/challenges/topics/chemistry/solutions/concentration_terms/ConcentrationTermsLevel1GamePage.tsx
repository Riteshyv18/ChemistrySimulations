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

// ── Standard Stage Explanation Data Interface ──────────────────────────────────
interface StageExplanationData {
  title: string;
  subtitle: string;
  concept: string;
  formulas: {
    label: string;
    formula: string;
    explanation: string;
  }[];
  steps: {
    step: number;
    title: string;
    math?: string;
    explanation: string;
  }[];
  comparison?: {
    term: string;
    formula: string;
    tempDependence: string;
    keyFeature: string;
  }[];
  conclusion: string;
}

const STAGE_EXPLANATIONS: Record<number, StageExplanationData> = {
  1: {
    title: "Molarity (M) & Solution Preparation",
    subtitle: "Module 3: Solutions • Concentration Terms • Stage 1 of 3",
    concept:
      "A solution is a homogeneous mixture formed when a solute uniformly dissolves in a solvent. Quantitative chemistry requires knowing exactly how many reactive particles (moles) exist inside a given liquid volume.\n\nIn this stage, your target is 0.50 M (0.50 mol/L). You can achieve this by dissolving 0.50 mol of NaCl into 1.00 L of water, or equivalently 0.25 mol into 0.50 L. Both produce the identical particle density and chemical properties.",
    formulas: [
      {
        label: "Definition of Molarity",
        formula: "M = n / V  (mol/L or Molar)",
        explanation: "Where n is the amount of solute in moles, and V is the total volume of solution in liters.",
      },
      {
        label: "Moles from Mass",
        formula: "n = mass (g) / Molar Mass (g/mol)",
        explanation: "For NaCl (M = 58.44 g/mol), 0.50 mol equals 29.22 g of salt crystals.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Identify Required Target Molarity",
        math: "Target M = 0.50 mol/L",
        explanation: "We need a ratio of solute moles (n) to total liquid volume (V) that simplifies to 0.50.",
      },
      {
        step: 2,
        title: "Balance Solute (n) and Volume (V)",
        math: "Option A: 0.50 mol / 1.00 L = 0.50 M   |   Option B: 0.25 mol / 0.50 L = 0.50 M",
        explanation: "Adjust the Solute slider and Water slider until the quotient n / V equals 0.50 M.",
      },
      {
        step: 3,
        title: "Particle Dissolution & Ion Solvation",
        math: "NaCl (s) + H₂O (l) ⟶ Na⁺ (aq) + Cl⁻ (aq)",
        explanation: "When NaCl dissolves, polar water molecules orient their partial charges around each ion (hydration shell), dispersing them freely throughout the solution.",
      },
    ],
    comparison: [
      {
        term: "Molarity (M)",
        formula: "moles solute / L solution",
        tempDependence: "Temperature Dependent (Volume V expands upon heating)",
        keyFeature: "Most practical for liquid volume titrations and laboratory benchwork.",
      },
      {
        term: "Molality (m)",
        formula: "moles solute / kg solvent",
        tempDependence: "Temperature Independent (Mass invariant with temperature)",
        keyFeature: "Used for colligative properties (ΔTb, ΔTf) across changing temperatures.",
      },
      {
        term: "Mole Fraction (x)",
        formula: "nA / (nA + nB)",
        tempDependence: "Temperature Independent",
        keyFeature: "Directly governs vapor pressure in Raoult's Law (P = xA · P°A).",
      },
    ],
    conclusion:
      "Key Takeaway: Concentration is an intensive property — it depends strictly on the ratio n/V, not the absolute size of the container.",
  },
  2: {
    title: "High-Concentration Solutions & Particle Density",
    subtitle: "Module 3: Solutions • Concentration Terms • Stage 2 of 3",
    concept:
      "Concentration represents the crowding of solute particles in space. In Stage 2, reaching a higher concentration of 1.00 M requires doubling the solute particle count in the same liquid volume (e.g., 1.00 mol in 1.00 L) or halving the volume (0.50 mol in 0.50 L).\n\nAs concentration increases, inter-ionic interactions between Na⁺ and Cl⁻ become more frequent, visible in the simulation through closer particle proximity and stronger hydration clustering.",
    formulas: [
      {
        label: "Higher Molarity Calculation",
        formula: "M = 1.00 mol / 1.00 L = 1.00 M  (or 0.50 mol / 0.50 L = 1.00 M)",
        explanation: "Doubling n while holding V constant doubles the molar concentration.",
      },
      {
        label: "Mass Percentage (w/w %)",
        formula: "Mass % = (Mass of Solute / Total Mass of Solution) × 100",
        explanation: "1.00 M NaCl (58.44 g in ~1058 g solution) corresponds to approximately 5.5% w/w NaCl.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Analyze the Target Increase",
        math: "Target M = 1.00 mol/L (Double Stage 1)",
        explanation: "To reach 1.00 M from 0.50 M, you can either add solute (increase n) or remove solvent (decrease V).",
      },
      {
        step: 2,
        title: "Approach 1: Add Solute",
        math: "Set n = 1.00 mol, keep V = 1.00 L ⟹ M = 1.00 / 1.00 = 1.00 M",
        explanation: "Adding salt directly increases the numerator n without expanding the volume.",
      },
      {
        step: 3,
        title: "Approach 2: Evaporate / Reduce Solvent",
        math: "Set n = 0.50 mol, drain V to 0.50 L ⟹ M = 0.50 / 0.50 = 1.00 M",
        explanation: "Compressing the volume into half space doubles the concentration for the same solute amount.",
      },
    ],
    comparison: [
      {
        term: "Dilute Solution",
        formula: "n / V is small (< 0.1 M)",
        tempDependence: "Behaves ideally",
        keyFeature: "Ions remain far apart; van 't Hoff factor i approaches ideal integer (i ≈ 2 for NaCl).",
      },
      {
        term: "Concentrated Solution",
        formula: "n / V is large (≥ 1.0 M)",
        tempDependence: "Inter-ionic effects significant",
        keyFeature: "Ion-pairing and electrostatic drag reduce effective activity coefficient (γ < 1).",
      },
    ],
    conclusion:
      "Key Takeaway: You can increase concentration by either adding solute or evaporating/draining solvent. Both increase the frequency of particle interactions.",
  },
  3: {
    title: "Dilution Law (M₁V₁ = M₂V₂) & Volume Conservation",
    subtitle: "Module 3: Solutions • Concentration Terms • Stage 3 of 3",
    concept:
      "Dilution is the process of decreasing the concentration of a solute in a solution, usually simply by mixing with more solvent.\n\nCrucially, when pure water is added to a beaker, the total number of dissolved solute particles (moles) does not change at all. Only the space they occupy expands. Because moles are conserved (n₁ = n₂), the product of initial molarity and volume strictly equals the final product.",
    formulas: [
      {
        label: "The Fundamental Dilution Law",
        formula: "M₁ × V₁ = M₂ × V₂",
        explanation: "Because initial moles n₁ (M₁V₁) must equal final moles n₂ (M₂V₂).",
      },
      {
        label: "Dilution Factor (DF)",
        formula: "DF = V_final / V_initial = M_initial / M_final",
        explanation: "Diluting from 0.50 L to 1.00 L gives DF = 2, cutting concentration exactly in half.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Starting Concentrated Solution",
        math: "Start: n = 0.20 mol in V₁ = 0.50 L ⟹ M₁ = 0.40 M",
        explanation: "The beaker begins with 0.20 mol of salt packed into half a liter.",
      },
      {
        step: 2,
        title: "Apply Dilution Formula to Reach 0.20 M",
        math: "M₂ = n / V₂  ⟹  0.20 = 0.20 / V₂  ⟹  V₂ = 1.00 L",
        explanation: "By sliding the Water slider to 1.00 L while leaving salt untouched at 0.20 mol, the volume doubles and concentration drops to 0.20 M.",
      },
      {
        step: 3,
        title: "Verify Solute Invariance",
        math: "n_before = 0.40 M × 0.50 L = 0.20 mol  =  n_after = 0.20 M × 1.00 L",
        explanation: "Every single Na⁺ and Cl⁻ ion is preserved; they are merely separated by more water molecules.",
      },
    ],
    comparison: [
      {
        term: "Concentrated Stock",
        formula: "Small V₁, High M₁",
        tempDependence: "High particle density",
        keyFeature: "Economical and stable form used to store chemicals in chemical stockrooms.",
      },
      {
        term: "Working Dilution",
        formula: "Large V₂, Lower M₂",
        tempDependence: "Spaced particle density",
        keyFeature: "Safely calibrated for delicate chemical reactions and titrations.",
      },
    ],
    conclusion:
      "Key Takeaway: Dilution never destroys solute; it only increases solvent volume. M₁V₁ = M₂V₂ is the single most widely used calculation in real-world chemical labs.",
  },
};

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
          <div className="flex flex-col gap-3.5 sm:gap-4 w-full max-w-2xl mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Solute */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solute bar to adjust the moles of salt dissolved.
                </p>
              </div>

              {/* Visual Preview: Solute Slider */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                    Solute (Salt)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-900">0.50 mol</span>
                </div>
                <div className="relative w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[35%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Solvent */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Slide the solvent bar to adjust the water volume in liters.
                </p>
              </div>

              {/* Visual Preview: Solvent Slider */}
              <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Solvent (Water)
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-900">0.80 L</span>
                </div>
                <div className="relative w-full h-2.5 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[80%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Target Match */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Once the target molarity is reached, click Submit to verify.
                </p>
              </div>

              {/* Visual Preview: Submit Button */}
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

      {/* ── Bottom Minimalist Floating Dock (Module 11 Style) ── */}
      <footer className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[94%] max-w-2xl">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-3xl px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Solute (Salt, n in mol) */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 whitespace-nowrap">
                Solute (Salt)
              </span>
              <span className="text-xs font-mono font-black text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md whitespace-nowrap">
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
              className="w-full h-2 bg-purple-100 accent-purple-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-200 shrink-0" />

          {/* Solvent (Water, V in L) */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 whitespace-nowrap">
                Solvent (Water)
              </span>
              <span className="text-xs font-mono font-black text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md whitespace-nowrap">
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

      {/* ── STEP 4: EXPLANATION MODAL / SCREEN (STANDARD RICH PEDAGOGICAL TEMPLATE) ── */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white overflow-hidden animate-in fade-in duration-200">
          {/* Top Sticky Header */}
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-700 uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200">
                  STAGE {currentStage.id} EXPLANATION
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">Target: {currentStage.targetMolarity.toFixed(2)} M</span>
              </div>
              <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight mt-0.5">
                {STAGE_EXPLANATIONS[currentStage.id]?.title || "Concentration Terms: Molarity (M)"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition-all cursor-pointer active:scale-95 border border-slate-300"
            >
              <X className="w-4 h-4 text-slate-600" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
            {/* Concept Overview Box */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                Physical &amp; Molecular Concept
              </h3>
              <p className="whitespace-pre-line leading-relaxed text-slate-600 font-medium">
                {STAGE_EXPLANATIONS[currentStage.id]?.concept}
              </p>
            </div>

            {/* Formulas Cards Grid */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Fundamental Formulas &amp; Equations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAGE_EXPLANATIONS[currentStage.id]?.formulas.map((f, fIdx) => (
                  <div key={`formula-${fIdx}`} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="font-mono font-bold text-sky-800 text-[11px] uppercase tracking-wider mb-1">
                        {f.label}
                      </div>
                      <div className="font-mono font-black text-slate-900 text-sm sm:text-base mb-1.5 bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                        {f.formula}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug mt-1">
                      {f.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Problem Solving Breakdown */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Step-by-Step Solution Breakdown
              </h3>
              <div className="space-y-2.5">
                {STAGE_EXPLANATIONS[currentStage.id]?.steps.map((st) => (
                  <div key={`step-${st.step}`} className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-sky-500 shadow-2xs">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-black text-[10px] shrink-0 border border-sky-300">
                        {st.step}
                      </span>
                      <span>{st.title}</span>
                    </div>
                    {st.math && (
                      <div className="font-mono text-xs font-black text-sky-800 bg-sky-50/80 px-2.5 py-1.5 rounded-lg border border-sky-200 my-1.5">
                        {st.math}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {st.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparative Reference Table (Molarity vs Molality vs Mole Fraction) */}
            {STAGE_EXPLANATIONS[currentStage.id]?.comparison && (
              <div className="space-y-2.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  Key Concentration Terms Comparison
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Term</th>
                        <th className="py-2.5 px-3">Formula</th>
                        <th className="py-2.5 px-3">Temperature Impact</th>
                        <th className="py-2.5 px-3">Laboratory Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {STAGE_EXPLANATIONS[currentStage.id]?.comparison?.map((row, rIdx) => (
                        <tr key={`comp-${rIdx}`} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{row.term}</td>
                          <td className="py-2.5 px-3 font-mono text-purple-700 font-semibold">{row.formula}</td>
                          <td className="py-2.5 px-3 text-slate-600">{row.tempDependence}</td>
                          <td className="py-2.5 px-3 text-slate-600">{row.keyFeature}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conclusion & Takeaway Box */}
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs">
              <span className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                💡
              </span>
              <span>{STAGE_EXPLANATIONS[currentStage.id]?.conclusion}</span>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-full sm:w-auto px-8 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95 text-center"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
