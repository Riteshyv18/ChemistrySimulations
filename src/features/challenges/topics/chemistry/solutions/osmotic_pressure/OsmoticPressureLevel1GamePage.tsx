"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Cylinder, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCcw,
  Sparkles,
  Droplets,
  CheckCircle2,
  Trophy,
  Play,
  ArrowRight,
  ArrowLeft,
  Gauge
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── Types & Stages ─────────────────────────────────────────────────────────────
interface StageConfig {
  id: number;
  label: string;
  missionTitle: string;
  lockedSlider: 'concentration' | 'pressure';
  targetOsmoticPressure: number; // in atm (π)
  targetAppliedPressure: number; // in atm (P_applied)
  targetSoluteMolarity?: number;
  initialSoluteMolarity: number; // in M (mol/L)
  initialAppliedPressure: number; // in atm
  temperatureK: number; // 298 K (25°C)
  gasConstantR: number; // 0.0821 L·atm/(mol·K)
  vanTHoff: number; // i = 1 for non-electrolyte
  tolerance: number; // in atm or M
  targetBadgeLabel: string;
  hint: string;
  explanation: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: 'Stage 1: Find Osmotic Pressure (P = π)',
    missionTitle: 'Stop Osmosis for 0.22 M Sample (Target P = 5.40 atm)',
    lockedSlider: 'concentration',
    targetOsmoticPressure: 5.40,
    targetAppliedPressure: 5.40,
    initialSoluteMolarity: 0.22, // Concentration locked at 0.22 M -> π ≈ 5.40 atm
    initialAppliedPressure: 1.50, // P < π -> forward osmosis
    temperatureK: 298,
    gasConstantR: 0.0821,
    vanTHoff: 1,
    tolerance: 0.06,
    targetBadgeLabel: 'Osmotic Pressure (π): 5.40 atm',
    hint: 'Concentration is locked at 0.22 M (π = 5.40 atm). Slide Applied Pressure (P) to 5.40 atm to reach Equilibrium and stop the flow!',
    explanation:
      'Equilibrium reached! When external applied pressure equals osmotic pressure (P = π = 5.40 atm), net solvent flow across the semipermeable membrane drops to zero.'
  },
  {
    id: 2,
    label: 'Stage 2: Find Required Concentration (C = ?)',
    missionTitle: 'Balance Fixed 7.34 atm Piston (Target C = 0.30 M)',
    lockedSlider: 'pressure',
    targetOsmoticPressure: 7.34,
    targetAppliedPressure: 7.34,
    targetSoluteMolarity: 0.30,
    initialSoluteMolarity: 0.12, // User adjusts this to 0.30 M
    initialAppliedPressure: 7.34, // Pressure locked at 7.34 atm
    temperatureK: 298,
    gasConstantR: 0.0821,
    vanTHoff: 1,
    tolerance: 0.015,
    targetBadgeLabel: 'Osmotic Pressure (π): 7.34 atm',
    hint: 'The piston is locked at 7.34 atm. Rearrange π = iCRT -> C = π / (iRT) = 7.34 / (1 × 0.0821 × 298) = 0.30 M. Slide Solute Concentration to 0.30 M!',
    explanation:
      'Target concentration found! At 0.30 M, the solution develops an osmotic pressure of π = 7.34 atm, perfectly balancing the fixed 7.34 atm piston.'
  }
];

// ── Responsive 3D Camera Controller ──────────────────────────────────────────
const UTubeCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fov = 38;
    const fovRad = (fov * Math.PI) / 180;
    // Target world width ~ 2.70 to zoom out comfortably so the whole apparatus and base are visible
    const requiredDistByWidth = 2.70 / (2 * Math.tan(fovRad / 2) * aspect);
    const finalDist = Math.max(4.8, requiredDistByWidth);

    // Aim camera lower (y=0.55) so the 3D apparatus at y=1.45 is pushed substantially upward on screen,
    // leaving a clear gap and distance above the bottom slider card.
    camera.position.set(0, 0.55, finalDist);
    camera.lookAt(0, 0.55, 0);
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);

  return null;
};

// ── 3D Ambient Micro-Bubble in Water ──────────────────────────────────────────
const MicroBubble3D = ({
  position,
  radius = 0.02
}: {
  position: [number, number, number];
  radius?: number;
}) => {
  return (
    <Sphere args={[radius, 12, 12]} position={position} renderOrder={5}>
      <meshStandardMaterial
        color="#FFFFFF"
        roughness={0.06}
        metalness={0.1}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </Sphere>
  );
};

// ── 3D Solute Particle Component (Solvated Royal Ion with Hydration Halo) ─────
const SoluteParticle3D = ({
  position,
  scale = 1.0
}: {
  position: [number, number, number];
  scale?: number;
}) => {
  return (
    <group position={position} scale={scale} renderOrder={5}>
      {/* Glossy Core Solute Sphere */}
      <Sphere args={[0.048, 16, 16]}>
        <meshStandardMaterial
          color="#1D4ED8"
          emissive="#2563EB"
          emissiveIntensity={0.35}
          roughness={0.12}
          metalness={0.18}
        />
      </Sphere>
      {/* Translucent Hydration Envelope */}
      <Sphere args={[0.076, 14, 14]}>
        <meshPhysicalMaterial
          color="#93C5FD"
          transmission={0.85}
          transparent
          opacity={0.32}
          roughness={0.1}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
};

// ── 3D Semipermeable Membrane (SPM) with Visible Pores & Grid ──────────────────
const SemipermeableMembrane3D = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Main Membrane Disc / Plate */}
      <Cylinder args={[0.34, 0.34, 0.06, 24]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0.85}
        />
      </Cylinder>
      {/* Outer clamping collar ring */}
      <Cylinder args={[0.38, 0.38, 0.08, 24]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#047857" metalness={0.6} roughness={0.3} />
      </Cylinder>
    </group>
  );
};

// ── U-Tube Parametric Centerline Curves ───────────────────────────────────────
class UTubeCurve extends THREE.Curve<THREE.Vector3> {
  yTop: number;
  yBend: number;
  bendRadius: number;

  constructor(yTop = 0.95, yBend = -0.60, bendRadius = 0.85) {
    super();
    this.yTop = yTop;
    this.yBend = yBend;
    this.bendRadius = bendRadius;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const point = optionalTarget;
    const legLen = this.yTop - this.yBend;
    const arcLen = Math.PI * this.bendRadius;
    const totalLen = 2 * legLen + arcLen;
    const s = t * totalLen;

    if (s <= legLen) {
      const u = s / legLen;
      return point.set(-this.bendRadius, this.yTop - u * legLen, 0);
    } else if (s <= legLen + arcLen) {
      const arcS = s - legLen;
      const angle = Math.PI - (arcS / arcLen) * Math.PI;
      return point.set(
        this.bendRadius * Math.cos(angle),
        this.yBend - this.bendRadius * Math.sin(angle),
        0
      );
    } else {
      const u = (s - legLen - arcLen) / legLen;
      return point.set(this.bendRadius, this.yBend + u * legLen, 0);
    }
  }
}

class LeftLiquidCurve extends THREE.Curve<THREE.Vector3> {
  yLevel: number;
  yBend: number;
  bendRadius: number;

  constructor(yLevel = 0.0, yBend = -0.60, bendRadius = 0.85) {
    super();
    this.yLevel = yLevel;
    this.yBend = yBend;
    this.bendRadius = bendRadius;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const point = optionalTarget;
    const legLen = Math.max(0.01, this.yLevel - this.yBend);
    const halfArcLen = (Math.PI / 2) * this.bendRadius;
    const totalLen = legLen + halfArcLen;
    const s = t * totalLen;

    if (s <= legLen) {
      const u = s / legLen;
      return point.set(-this.bendRadius, this.yLevel - u * legLen, 0);
    } else {
      const arcS = s - legLen;
      const angle = Math.PI - (arcS / halfArcLen) * (Math.PI / 2);
      return point.set(
        this.bendRadius * Math.cos(angle),
        this.yBend - this.bendRadius * Math.sin(angle),
        0
      );
    }
  }
}

class RightLiquidCurve extends THREE.Curve<THREE.Vector3> {
  yLevel: number;
  yBend: number;
  bendRadius: number;

  constructor(yLevel = 0.0, yBend = -0.60, bendRadius = 0.85) {
    super();
    this.yLevel = yLevel;
    this.yBend = yBend;
    this.bendRadius = bendRadius;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const point = optionalTarget;
    const halfArcLen = (Math.PI / 2) * this.bendRadius;
    const legLen = Math.max(0.01, this.yLevel - this.yBend);
    const totalLen = halfArcLen + legLen;
    const s = t * totalLen;

    if (s <= halfArcLen) {
      const angle = (Math.PI / 2) - (s / halfArcLen) * (Math.PI / 2);
      return point.set(
        this.bendRadius * Math.cos(angle),
        this.yBend - this.bendRadius * Math.sin(angle),
        0
      );
    } else {
      const u = (s - halfArcLen) / legLen;
      return point.set(this.bendRadius, this.yBend + u * legLen, 0);
    }
  }
}

// ── 3D U-Tube Osmosis Apparatus ───────────────────────────────────────────────
const OsmosisChamber3D = ({
  molarity,
  appliedPressure,
  osmoticPressure,
  targetAppliedPressure
}: {
  molarity: number;
  appliedPressure: number;
  osmoticPressure: number;
  targetAppliedPressure: number;
}) => {
  const leftWaterGroupRef = useRef<THREE.Group>(null);
  const rightSolutionGroupRef = useRef<THREE.Group>(null);
  const flowParticlesGroupRef = useRef<THREE.Group>(null);
  const pistonRef = useRef<THREE.Group>(null);

  // Pressure differential: ΔP = P_applied - π
  const deltaP = appliedPressure - osmoticPressure;
  const isEquilibrium = Math.abs(deltaP) <= 0.06;
  const isReverseOsmosis = deltaP > 0.06;

  // Dynamic fluid column heights based on pressure balance
  const heightOffset = useMemo(() => {
    return Math.max(-0.45, Math.min(0.45, -deltaP * 0.08));
  }, [deltaP]);

  const leftLevel = 0.00 - heightOffset;
  const rightLevel = 0.00 + heightOffset;

  // Seamless curved glass U-tube and dynamic liquid geometries
  const glassGeo = useMemo(() => {
    return new THREE.TubeGeometry(new UTubeCurve(0.95, -0.60, 0.85), 64, 0.38, 32, false);
  }, []);

  const leftLiquidGeo = useMemo(() => {
    return new THREE.TubeGeometry(new LeftLiquidCurve(leftLevel, -0.60, 0.85), 44, 0.366, 28, false);
  }, [leftLevel]);

  const rightLiquidGeo = useMemo(() => {
    return new THREE.TubeGeometry(new RightLiquidCurve(rightLevel, -0.60, 0.85), 44, 0.366, 28, false);
  }, [rightLevel]);

  // Translucent micro-bubbles rising gently in left pure solvent
  const leftBubbles = useMemo(() => {
    const list: { x: number; y: number; z: number; r: number; speed: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const rx = (Math.random() - 0.5) * 0.44;
      const ry = -1.15 + Math.random() * 0.95;
      const rz = (Math.random() - 0.5) * 0.44;
      const r = 0.012 + Math.random() * 0.014;
      const speed = 0.08 + Math.random() * 0.12;
      list.push({ x: -0.85 + rx, y: ry, z: rz, r, speed });
    }
    return list;
  }, []);

  // Solvated solute particles distributed inside right solution
  const rightSolutes = useMemo(() => {
    const count = Math.min(18, Math.max(4, Math.round(molarity * 36)));
    const list: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * 0.42;
      const ry = -1.05 + Math.random() * 0.85;
      const rz = (Math.random() - 0.5) * 0.42;
      list.push([0.85 + rx, ry, rz]);
    }
    return list;
  }, [molarity]);

  // Ambient micro-bubbles in right solution
  const rightBubbles = useMemo(() => {
    const list: { x: number; y: number; z: number; r: number; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const rx = (Math.random() - 0.5) * 0.42;
      const ry = -1.05 + Math.random() * 0.85;
      const rz = (Math.random() - 0.5) * 0.42;
      const r = 0.010 + Math.random() * 0.012;
      const speed = 0.06 + Math.random() * 0.10;
      list.push({ x: 0.85 + rx, y: ry, z: rz, r, speed });
    }
    return list;
  }, []);

  // Animated flow particles across membrane at bottom of U-tube
  const flowDots = useMemo(() => {
    const dots: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < 8; i++) {
      dots.push({
        x: -0.40 + i * 0.10,
        y: -1.45 + (Math.random() - 0.5) * 0.08,
        z: (Math.random() - 0.5) * 0.12,
        speed: 0.008 + Math.random() * 0.006
      });
    }
    return dots;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Subtle liquid surface pulsation
    if (leftWaterGroupRef.current) {
      leftWaterGroupRef.current.children.forEach((child, idx) => {
        const b = leftBubbles[idx];
        if (b) {
          child.position.y += b.speed * 0.008;
          if (child.position.y > leftLevel - 0.04) {
            child.position.y = -1.18;
          }
        }
      });
    }

    if (rightSolutionGroupRef.current) {
      rightSolutionGroupRef.current.children.forEach((child, idx) => {
        const bubbleIdx = idx - rightSolutes.length;
        if (bubbleIdx >= 0 && rightBubbles[bubbleIdx]) {
          const b = rightBubbles[bubbleIdx];
          child.position.y += b.speed * 0.007;
          if (child.position.y > rightLevel - 0.05) {
            child.position.y = -1.12;
          }
        }
      });
    }

    // Piston rests physically on the surface of the right solution
    if (pistonRef.current) {
      pistonRef.current.position.y = rightLevel + 0.04;
    }

    // Flow particles animation across SPM channel
    if (flowParticlesGroupRef.current) {
      flowParticlesGroupRef.current.children.forEach((child, idx) => {
        if (!isEquilibrium) {
          const dir = isReverseOsmosis ? -1 : 1;
          child.position.x += dir * flowDots[idx].speed;
          if (child.position.x > 0.45) child.position.x = -0.45;
          if (child.position.x < -0.45) child.position.x = 0.45;
        }
      });
    }
  });

  return (
    <group position={[0, 1.45, 0]}>
      {/* ── TOP OSMOTIC PRESSURE (π) BADGE (SHIFTED UPWARD & COMPACT) ────── */}
      <Html position={[0, 1.46, 0]} center distanceFactor={15}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/85 border border-slate-700/80 shadow-xs backdrop-blur-md select-none shrink-0 pointer-events-none whitespace-nowrap">
          <span className="text-[5px] font-black tracking-wider uppercase text-emerald-400">
            Osmotic Pressure (π):
          </span>
          <span className="text-[6px] font-mono font-black text-white">
            {targetAppliedPressure.toFixed(2)} atm
          </span>
        </div>
      </Html>

      {/* ── PURE SOLVENT TAB (LEFT COLUMN) ─────────────────────────────────── */}
      <Html position={[-0.85, 1.05, 0]} center distanceFactor={14}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/40 border border-sky-400/50 backdrop-blur-md select-none pointer-events-none whitespace-nowrap shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
          <span className="text-[6px] font-black uppercase tracking-wider text-sky-200">Solvent</span>
        </div>
      </Html>

      {/* ── SOLUTION TAB (RIGHT COLUMN) ────────────────────────────────────── */}
      <Html position={[0.85, 1.05, 0]} center distanceFactor={14}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/40 border border-indigo-400/50 backdrop-blur-md select-none pointer-events-none whitespace-nowrap shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
          <span className="text-[6px] font-black uppercase tracking-wider text-indigo-200">Solution</span>
        </div>
      </Html>

      {/* ── SEAMLESS BOROSILICATE GLASS U-TUBE (CURVED BOTTOM) ─────────────── */}
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.18}
          roughness={0.03}
          transmission={0.95}
          thickness={0.5}
          ior={1.52}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Left Top Glass Lip Rim */}
      <mesh position={[-0.85, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.016, 16, 36]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transmission={0.92}
          roughness={0.04}
          ior={1.52}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Right Top Glass Lip Rim */}
      <mesh position={[0.85, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.016, 16, 36]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transmission={0.92}
          roughness={0.04}
          ior={1.52}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* ── SEMIPERMEABLE MEMBRANE (SPM) AT BOTTOM CENTER OF U-TUBE ────────── */}
      <SemipermeableMembrane3D position={[0, -1.45, 0]} />
      <Html position={[0, -0.99, 0.35]} center distanceFactor={14}>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/40 border border-emerald-400/50 backdrop-blur-md select-none pointer-events-none whitespace-nowrap shadow-xs">
          <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[5.5px] font-black uppercase tracking-wider text-emerald-200">SPM</span>
        </div>
      </Html>

      {/* ── CONDITION & EQUILIBRIUM TAB (BELOW CURVED BOTTOM) ──────────────── */}
      <Html position={[0, -2.12, 0.35]} center distanceFactor={12.5}>
        <div
          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full backdrop-blur-md select-none pointer-events-none whitespace-nowrap shadow-sm border ${
            isEquilibrium
              ? 'bg-emerald-950/75 border-emerald-400 text-emerald-300'
              : isReverseOsmosis
              ? 'bg-amber-950/75 border-amber-400 text-amber-300'
              : 'bg-sky-950/75 border-sky-400 text-sky-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isEquilibrium
                ? 'bg-emerald-400 animate-pulse'
                : isReverseOsmosis
                ? 'bg-amber-400'
                : 'bg-sky-400'
            }`}
          />
          <span className="text-[8px] font-black uppercase tracking-wider">
            {isEquilibrium
              ? 'Equilibrium (P = π)'
              : isReverseOsmosis
              ? 'Reverse Osmosis (P > π)'
              : 'Forward Osmosis (P < π)'}
          </span>
        </div>
      </Html>

      {/* ── REALISTIC LIQUID VOLUMES IN CURVED U-TUBE ──────────────────────── */}
      {/* Left Column + Left Bend: Pure Solvent (Water) */}
      <mesh geometry={leftLiquidGeo}>
        <meshPhysicalMaterial
          color="#38BDF8"
          transparent
          opacity={0.34}
          roughness={0.04}
          transmission={0.88}
          ior={1.333}
          depthWrite={false}
        />
      </mesh>
      {/* Left Liquid Meniscus Surface Cap */}
      <mesh position={[-0.85, leftLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.365, 36]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transparent
          opacity={0.55}
          roughness={0.06}
          transmission={0.85}
          ior={1.333}
          depthWrite={false}
        />
      </mesh>
      {/* Left Meniscus Curvature Contact Ring */}
      <mesh position={[-0.85, leftLevel + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.366, 36]} />
        <meshStandardMaterial
          color="#E0F2FE"
          transparent
          opacity={0.6}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Right Column + Right Bend: Solution */}
      <mesh geometry={rightLiquidGeo}>
        <meshPhysicalMaterial
          color={molarity > 0.35 ? '#4338CA' : '#4F46E5'}
          transparent
          opacity={0.42 + Math.min(0.38, molarity * 0.75)}
          roughness={0.06}
          transmission={0.78}
          ior={1.35}
          depthWrite={false}
        />
      </mesh>
      {/* Right Liquid Meniscus Surface Cap */}
      <mesh position={[0.85, rightLevel, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.365, 36]} />
        <meshPhysicalMaterial
          color="#C7D2FE"
          transparent
          opacity={0.65}
          roughness={0.08}
          transmission={0.75}
          ior={1.35}
          depthWrite={false}
        />
      </mesh>
      {/* Right Meniscus Curvature Contact Ring */}
      <mesh position={[0.85, rightLevel + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.366, 36]} />
        <meshStandardMaterial
          color="#E0E7FF"
          transparent
          opacity={0.65}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* ── APPLIED PRESSURE PISTON (PHYSICALLY RESTING ON SOLUTION SURFACE) ─ */}
      <group ref={pistonRef} position={[0.85, rightLevel + 0.04, 0]}>
        {/* Piston Disc */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.366, 0.366, 0.08, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Rubber O-Ring Gasket */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.367, 0.012, 12, 32]} />
          <meshStandardMaterial color="#0F172A" roughness={0.9} />
        </mesh>
        {/* Stainless Steel Piston Rod */}
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.68, 20]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.92} roughness={0.15} />
        </mesh>
        {/* Piston Top Cap / Handle */}
        <mesh position={[0, 0.74, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.75} roughness={0.3} />
        </mesh>

        {/* Applied Pressure Indicator Tag on Glass (Transparent Glassmorphism) */}
        <Html position={[0, 0.28, 0.40]} center distanceFactor={13.5}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/35 border border-purple-400/60 text-[6px] font-mono font-black text-purple-100 shadow-sm backdrop-blur-md select-none pointer-events-none whitespace-nowrap">
            <span className="text-purple-300 font-bold">P:</span>
            <span>{appliedPressure.toFixed(2)} atm ↓</span>
          </div>
        </Html>
      </group>

      {/* ── AMBIENT BUBBLES IN PURE SOLVENT (LEFT) ─────────────────────────── */}
      <group ref={leftWaterGroupRef}>
        {leftBubbles.map((b, idx) => (
          <MicroBubble3D
            key={`left-bubble-${idx}`}
            position={[b.x, b.y, b.z]}
            radius={b.r}
          />
        ))}
      </group>

      {/* ── SOLUTE IONS & AMBIENT BUBBLES IN SOLUTION (RIGHT) ──────────────── */}
      <group ref={rightSolutionGroupRef}>
        {rightSolutes.map((pos, idx) => (
          <SoluteParticle3D key={`solute-${idx}`} position={pos} scale={0.88} />
        ))}
        {rightBubbles.map((b, idx) => (
          <MicroBubble3D
            key={`right-bubble-${idx}`}
            position={[b.x, b.y, b.z]}
            radius={b.r}
          />
        ))}
      </group>

      {/* ── FLOW DIRECTION PARTICLES (CROSSING SPM) ─────────────────────────── */}
      <group ref={flowParticlesGroupRef}>
        {flowDots.map((dot, idx) => (
          <Sphere key={`flow-dot-${idx}`} args={[0.032, 8, 8]} position={[dot.x, dot.y, dot.z]}>
            <meshStandardMaterial
              color={isReverseOsmosis ? '#F59E0B' : isEquilibrium ? '#10B981' : '#38BDF8'}
              emissive={isReverseOsmosis ? '#D97706' : isEquilibrium ? '#059669' : '#0284C7'}
              emissiveIntensity={0.6}
            />
          </Sphere>
        ))}
      </group>
    </group>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
export interface OsmoticPressureLevel1GamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function OsmoticPressureLevel1GamePage({
  difficulty = 'level1',
  onExit
}: OsmoticPressureLevel1GamePageProps) {
  // Navigation & Intro Flow
  const [introStep, setIntroStep] = useState<'mission' | 'instructions' | 'playing'>('mission');
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const currentStage = STAGES[currentStageIndex];

  // Simulation Sliders State
  const [soluteMolarity, setSoluteMolarity] = useState<number>(currentStage.initialSoluteMolarity);
  const [appliedPressure, setAppliedPressure] = useState<number>(currentStage.initialAppliedPressure);

  // Modals
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>('');

  // Audio helper
  const playSound = (type: 'success' | 'click' | 'incorrect') => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'incorrect') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // AudioContext fallback
    }
  };

  // Reset sliders when stage changes
  useEffect(() => {
    setSoluteMolarity(currentStage.initialSoluteMolarity);
    setAppliedPressure(currentStage.initialAppliedPressure);
  }, [currentStageIndex, currentStage]);

  // Real-time calculated Osmotic Pressure: π = i · c · R · T
  const calculatedOsmoticPressure = useMemo(() => {
    const pi = currentStage.vanTHoff * soluteMolarity * currentStage.gasConstantR * currentStage.temperatureK;
    return Math.round(pi * 100) / 100;
  }, [currentStage, soluteMolarity]);

  // Dynamic Osmosis Flow & Equilibrium State
  const deltaP = appliedPressure - calculatedOsmoticPressure;
  const isEquilibrium = Math.abs(deltaP) < 0.30;
  const isReverseOsmosis = deltaP >= 0.30;

  // Handle Exit
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Check Answer Handler
  const handleSubmit = () => {
    let isCorrect = false;

    if (currentStage.id === 1) {
      // Stage 1: Concentration locked at 0.22 M. User adjusts P to match π (5.40 atm)
      const diff = Math.abs(appliedPressure - currentStage.targetAppliedPressure);
      isCorrect = diff <= currentStage.tolerance;
      if (!isCorrect) {
        if (appliedPressure < currentStage.targetAppliedPressure) {
          setIncorrectFeedback(
            `🔴 Applied pressure (${appliedPressure.toFixed(2)} atm) is too low! Forward osmosis is still occurring. Increase pressure to match π = 5.40 atm.`
          );
        } else {
          setIncorrectFeedback(
            `🔴 Applied pressure (${appliedPressure.toFixed(2)} atm) exceeds osmotic pressure, causing reverse flow! Decrease pressure to 5.40 atm.`
          );
        }
      }
    } else {
      // Stage 2: Pressure locked at 7.34 atm. User adjusts concentration to 0.30 M
      const concDiff = Math.abs(soluteMolarity - 0.30);
      isCorrect = concDiff <= currentStage.tolerance;
      if (!isCorrect) {
        if (soluteMolarity < 0.30) {
          setIncorrectFeedback(
            `🔴 Current concentration (${soluteMolarity.toFixed(2)} M) creates π = ${calculatedOsmoticPressure.toFixed(2)} atm (too low). Increase concentration to 0.30 M to balance the 7.34 atm piston!`
          );
        } else {
          setIncorrectFeedback(
            `🔴 Current concentration (${soluteMolarity.toFixed(2)} M) creates π = ${calculatedOsmoticPressure.toFixed(2)} atm (too high). Decrease concentration to 0.30 M to balance the 7.34 atm piston!`
          );
        }
      }
    }

    if (isCorrect) {
      playSound('success');
      setShowSuccessModal(true);
    } else {
      playSound('incorrect');
      setShowIncorrectModal(true);
    }
  };

  const handleNextStage = () => {
    setShowSuccessModal(false);
    if (currentStageIndex < STAGES.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      setIntroStep('mission');
      setCurrentStageIndex(0);
    }
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col max-w-[440px] mx-auto">
      {/* ── STEP 1: MISSION SCREEN (EXACTLY MATCHING IMAGE 1) ───────────────── */}
      {introStep === 'mission' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-5 bg-white/98 backdrop-blur-md">
          {/* Top Left Exit Button */}
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

          {/* Central Mission Content */}
          <div className="max-w-xl mx-auto my-auto text-center space-y-4 z-10 px-2 py-2 animate-in fade-in duration-200">
            <div className="text-[#2563EB] text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
              SOLUTIONS &amp; OSMOTIC PRESSURE
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
              <span className="text-[#2563EB]">MISSION:</span> Control solute concentration &amp; external pressure to balance osmosis (π = i·c·R·T).
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

      {/* ── STEP 2: INSTRUCTIONS SCREEN (MATCHING IMAGE 2 & INCREASED HEIGHT) ─── */}
      {introStep === 'instructions' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Left Exit Button */}
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

          {/* 3 Step Instruction Cards */}
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Stage 1 - Find Osmotic Pressure */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Stage 1: Find Osmotic Pressure (P = π)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Target: 5.40 atm
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-1.5">
                  Concentration is <strong>Locked (🔒)</strong>. Calculate <strong>π = i·c·R·T</strong>, then slide <strong>Applied Pressure (P)</strong> to reach equilibrium and stop osmosis!
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-lg sm:rounded-xl bg-purple-50/70 border border-purple-200 p-2 sm:p-2.5 mt-2 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-purple-700 flex items-center gap-1 tracking-wide">
                    <Gauge className="w-3 h-3 text-purple-600 shrink-0" />
                    Applied Pressure (P)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-purple-900">5.40 atm</span>
                </div>
                <div className="relative w-full h-2 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[54%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Stage 2 - Find Required Concentration */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Stage 2: Find Required Concentration (c)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Target: 0.30 M
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-1.5">
                  External pressure is <strong>Locked (🔒)</strong>. Rearrange <strong>c = π / (i·R·T)</strong>, then slide <strong>Solute Concentration (c)</strong> to balance the piston!
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-lg sm:rounded-xl bg-sky-50/70 border border-sky-200 p-2 sm:p-2.5 mt-2 shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-sky-700 flex items-center gap-1 tracking-wide">
                    <Droplets className="w-3 h-3 text-sky-600 shrink-0" />
                    Solute Concentration (c)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-sky-900">0.30 M</span>
                </div>
                <div className="relative w-full h-2 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[60%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Submit Answer & Progress */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Submit Your Answer
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] whitespace-nowrap shrink-0">
                    Equilibrium (P = π)
                  </span>
                </div>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-1.5">
                  After achieving the <strong>Equilibrium (P = π)</strong> state, click the <strong>Submit Answer</strong> button to verify and proceed to the next stage!
                </p>
              </div>

              {/* Visual Preview Button */}
              <div className="mt-2 w-full py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs text-center shadow-xs">
                Submit Answer
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

      {/* ── STEP 3: 3D FULL-SCREEN CANVAS (SINGLE CANVAS ARCHITECTURE) ── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Canvas camera={{ fov: 38 }} className="w-full h-full touch-none cursor-grab active:cursor-grabbing">
          <color attach="background" args={['#FFFFFF']} />
          <ambientLight intensity={1.1} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} />
          <directionalLight position={[-5, -4, 3]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, 1.5, 4]} intensity={0.8} />

          <UTubeCamera />

          <OsmosisChamber3D
            molarity={soluteMolarity}
            appliedPressure={appliedPressure}
            osmoticPressure={calculatedOsmoticPressure}
            targetAppliedPressure={currentStage.targetAppliedPressure}
          />

          <OrbitControls
            makeDefault
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 2.3}
            maxPolarAngle={Math.PI / 1.7}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
            target={[0, 0.55, 0]}
          />
        </Canvas>
      </div>

      {/* ── Top Floating Header (EXIT on left, EXPLANATION on right) ── */}
      <header className="absolute top-0 left-0 right-0 z-20 p-2.5 sm:p-3 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95"
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
          <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
          <span>EXPLANATION</span>
        </button>
      </header>

      {/* ── Bottom Controls Dock: Sliders & Submit Button inside Canvas ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto flex flex-col gap-2 p-2.5 sm:p-3 bg-gradient-to-t from-white via-white/95 to-transparent pt-6">
        {/* Slider 1: Solute Concentration (c, M) */}
        <div
          className={`rounded-xl border p-2.5 sm:p-3 shadow-md transition-all ${
            currentStage.lockedSlider === 'concentration'
              ? 'bg-slate-100/90 border-slate-300 opacity-80'
              : 'bg-white/95 backdrop-blur-sm border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
              Solute Concentration (c)
            </span>
            <span
              className={`text-xs sm:text-sm font-mono font-black px-2.5 py-0.5 rounded-lg shadow-2xs border ${
                currentStage.lockedSlider === 'concentration'
                  ? 'bg-slate-200 border-slate-400 text-slate-700'
                  : 'bg-sky-100 border-sky-300 text-sky-950'
              }`}
            >
              {soluteMolarity.toFixed(2)} M{currentStage.lockedSlider === 'concentration' ? ' (Fixed 🔒)' : ''}
            </span>
          </div>
          <input
            type="range"
            min="0.00"
            max="0.50"
            step="0.01"
            value={soluteMolarity}
            disabled={currentStage.lockedSlider === 'concentration'}
            onChange={(e) => setSoluteMolarity(parseFloat(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none ${
              currentStage.lockedSlider === 'concentration'
                ? 'bg-slate-300 accent-slate-400 cursor-not-allowed'
                : 'bg-sky-100 accent-sky-600 cursor-pointer'
            }`}
          />
        </div>

        {/* Slider 2: Applied External Pressure (P, atm) */}
        <div
          className={`rounded-xl border p-2.5 sm:p-3 shadow-md transition-all ${
            currentStage.lockedSlider === 'pressure'
              ? 'bg-slate-100/90 border-slate-300 opacity-80'
              : 'bg-white/95 backdrop-blur-sm border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs sm:text-sm font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              Applied Pressure (P)
            </span>
            <span
              className={`text-xs sm:text-sm font-mono font-black px-2.5 py-0.5 rounded-lg shadow-2xs border ${
                currentStage.lockedSlider === 'pressure'
                  ? 'bg-slate-200 border-slate-400 text-slate-700'
                  : 'bg-purple-100 border-purple-300 text-purple-950'
              }`}
            >
              {appliedPressure.toFixed(2)} atm{currentStage.lockedSlider === 'pressure' ? ' (Fixed 🔒)' : ''}
            </span>
          </div>
          <input
            type="range"
            min="0.00"
            max="10.00"
            step="0.05"
            value={appliedPressure}
            disabled={currentStage.lockedSlider === 'pressure'}
            onChange={(e) => setAppliedPressure(parseFloat(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none ${
              currentStage.lockedSlider === 'pressure'
                ? 'bg-slate-300 accent-slate-400 cursor-not-allowed'
                : 'bg-purple-100 accent-purple-600 cursor-pointer'
            }`}
          />
        </div>

        {/* Submit Answer Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wide"
        >
          <span>Submit Answer</span>
        </button>
      </footer>

      {/* ── STEP 4: FULL-SCREEN EXPLANATION PAGE (CLEAN TEXT WITHOUT ENCLOSING BOXES) ─ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between p-4 sm:p-5 overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-wide uppercase">
              Osmotic Pressure &amp; Osmosis Guide
            </h2>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {/* Scrollable Content (Clean normal text format) */}
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
                  <strong>How do tall trees draw water 100 meters up from the soil?</strong> Tree roots contain high solute concentrations, creating intense osmotic pressure that draws ground water upward across cell membranes against gravity!
                </li>
                <li>
                  <strong>Why must medical IV drips match blood salinity (0.9% saline)?</strong> If pure water is injected, red blood cells absorb water by osmosis and violently burst (hemolysis). Osmotic pressure balance preserves cell life!
                </li>
                <li>
                  <strong>How do RO water purifiers make drinking water from seawater?</strong> By applying mechanical pressure that exceeds seawater’s natural osmotic pressure (Reverse Osmosis), pure water is forced backwards through the membrane, leaving all salts and contaminants behind.
                </li>
              </ul>
              <p className="text-xs sm:text-sm text-purple-700 font-semibold pt-1">
                This simulation lets you directly control these osmosis and reverse osmosis phenomena in real-time.
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
                  Concept 1: What is Osmosis &amp; the Semipermeable Membrane (SPM)?
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Imagine two chambers separated by a <strong>semipermeable membrane (SPM)</strong>. This membrane possesses microscopic pores that allow small solvent molecules (water) to pass freely, but physically blocks larger dissolved solute particles (sugar, glucose, hydrated ions).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  When pure water is on one side and a solution is on the other, water molecules spontaneously diffuse from the region of higher solvent chemical potential (pure water) into the solution. This spontaneous net flow is called <strong>Osmosis</strong>.
                </p>
              </div>

              {/* Concept 2 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-purple-700">
                  Concept 2: What is &quot;Osmotic Pressure&quot; (π)?
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  As water flows into the solution arm, the liquid level rises, creating hydrostatic pressure.
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong>Osmotic pressure (π)</strong> is defined as the <em>exact minimum external pressure</em> that must be applied to the solution arm to completely prevent the inward flow of solvent across the semipermeable membrane.
                </p>
              </div>

              {/* Concept 3 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-sky-700">
                  Concept 3: The van &apos;t Hoff Formula (π = i·c·R·T)
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  For dilute ideal solutions, J.H. van &apos;t Hoff discovered that osmotic pressure follows an equation analogous to the ideal gas law (PV = nRT):
                </p>
                <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 pl-2 space-y-0.5">
                  <div>π = i · c · R · T</div>
                </div>
                <ul className="text-xs text-slate-600 pl-4 space-y-0.5">
                  <li>• <strong>π:</strong> Osmotic pressure in atmospheres (atm).</li>
                  <li>• <strong>i:</strong> van &apos;t Hoff factor (number of particles produced per formula unit).</li>
                  <li>• <strong>c:</strong> Molar concentration of the solution (M = mol/L).</li>
                  <li>• <strong>R:</strong> Universal gas constant = <strong>0.0821 L·atm/(mol·K)</strong>.</li>
                  <li>• <strong>T:</strong> Absolute temperature in Kelvin (K = °C + 273.15). At 25°C, T = 298 K.</li>
                </ul>
              </div>

              {/* Concept 4 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-amber-700">
                  Concept 4: The Three Pressure Regimes
                </h4>
                <div className="space-y-1 text-xs sm:text-sm text-slate-700 pl-2">
                  <div>
                    • <strong>P &lt; π (Forward Osmosis):</strong> Natural flow from pure solvent into solution. Solution arm level rises.
                  </div>
                  <div>
                    • <strong>P = π (Osmotic Equilibrium):</strong> Applied pressure exactly matches osmotic pressure. Net flow is <strong>zero</strong>!
                  </div>
                  <div>
                    • <strong>P &gt; π (Reverse Osmosis / RO):</strong> Applied pressure overcomes osmotic pressure, forcing solvent molecules backwards through the membrane out of the solution into pure water.
                  </div>
                </div>
              </div>

              {/* Concept 5 */}
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-700">
                  Concept 5: The van &apos;t Hoff Factor (i)
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  For non-electrolytes like glucose or sucrose, molecules stay intact in water, so <strong>i = 1</strong>.
                </p>
                <p className="text-xs text-slate-500 pl-2">
                  (In contrast, an electrolyte like table salt NaCl dissociates into Na⁺ + Cl⁻, giving i = 2 and doubling the resulting osmotic pressure!)
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full" />

            {/* 3. Applying in the Simulation Lab */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                3. Applying This in the Simulation Lab
              </h3>
              <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                {/* Stage 1 */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <strong className="text-purple-900 font-extrabold">
                      🎯 Stage 1: Find Osmotic Pressure (P = π)
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[10px] font-bold">
                      Concentration Locked: 0.22 M 🔒
                    </span>
                  </div>
                  <div className="font-mono text-xs text-purple-950 font-bold bg-white/80 p-2 rounded-lg border border-purple-100 space-y-0.5">
                    <div>π = i · c · R · T</div>
                    <div>π = 1.0 × 0.22 M × 0.0821 × 298 K = <strong>5.40 atm</strong></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>How to solve:</strong> Slide <strong>Applied Pressure (P)</strong> to <strong>5.40 atm</strong> to balance the natural osmotic pressure and reach <strong>Equilibrium (P = π)</strong>!
                  </p>
                </div>

                {/* Stage 2 */}
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <strong className="text-sky-900 font-extrabold">
                      🎯 Stage 2: Find Required Concentration (c = ?)
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-900 text-[10px] font-bold">
                      Pressure Locked: 7.34 atm 🔒
                    </span>
                  </div>
                  <div className="font-mono text-xs text-sky-950 font-bold bg-white/80 p-2 rounded-lg border border-sky-100 space-y-0.5">
                    <div>c = π / (i · R · T)</div>
                    <div>c = 7.34 / (1.0 × 0.0821 × 298) = <strong>0.30 M</strong></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>How to solve:</strong> Slide <strong>Solute Concentration (c)</strong> to <strong>0.30 M</strong> so the solution generates matching osmotic pressure to balance the 7.34 atm piston!
                  </p>
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

      {/* ── SUCCESS MODAL ────────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center space-y-3.5 shadow-2xl border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {currentStageIndex < STAGES.length - 1 ? 'Target Mastered!' : 'Simulation Completed!'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {currentStage.explanation}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleNextStage}
                className="w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
              >
                {currentStageIndex < STAGES.length - 1 ? 'NEXT STAGE ▶' : 'RESTART SIMULATION ↺'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExplanation(true);
                }}
                className="w-full py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                View Full Science Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INCORRECT / RETRY MODAL ──────────────────────────────────────────── */}
      {showIncorrectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center space-y-3.5 shadow-2xl border border-rose-100">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <RotateCcw className="w-7 h-7" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Not Balanced Yet!
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {incorrectFeedback || currentStage.hint}
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowIncorrectModal(false)}
                className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95"
              >
                TRY AGAIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIncorrectModal(false);
                  setShowExplanation(true);
                }}
                className="w-full py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                View Explanation &amp; Formulas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
