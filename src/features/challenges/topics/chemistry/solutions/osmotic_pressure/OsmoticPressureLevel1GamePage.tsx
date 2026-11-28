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
  Gauge,
  X,
  Plus,
  Minus
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
    const requiredDistByWidth = 2.85 / (2 * Math.tan(fovRad / 2) * aspect);
    const finalDist = Math.max(5.0, requiredDistByWidth);

    camera.position.set(0, 0.05, finalDist);
    camera.lookAt(0, 0.05, 0);
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
    <group position={[0, 0.38, 0]}>
      {/* ── PURE SOLVENT TAB (LEFT COLUMN) ─────────────────────────────────── */}
      <Html position={[-0.85, 1.14, 0]} center distanceFactor={7.5}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 border border-sky-200/90 backdrop-blur-sm select-none pointer-events-none whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-sky-800">Solvent</span>
        </div>
      </Html>

      {/* ── SOLUTION TAB (RIGHT COLUMN) ────────────────────────────────────── */}
      <Html position={[0.85, 1.14, 0]} center distanceFactor={7.5}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 border border-indigo-200/90 backdrop-blur-sm select-none pointer-events-none whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-800">Solution</span>
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
      <Html position={[0, -0.99, 0.35]} center distanceFactor={7.5}>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 border border-emerald-200/90 backdrop-blur-sm select-none pointer-events-none whitespace-nowrap shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">SPM</span>
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

        {/* Applied Pressure Indicator Tag on Glass */}
        <Html position={[0, 0.28, 0.40]} center distanceFactor={7.5}>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 border border-purple-200/90 text-[9px] font-mono font-bold text-purple-800 shadow-2xs backdrop-blur-sm select-none pointer-events-none whitespace-nowrap">
            <span>P = {appliedPressure.toFixed(2)} atm ↓</span>
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
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans">
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
          <div className="flex flex-col gap-3.5 sm:gap-4 w-full max-w-2xl mx-auto my-auto flex-1 justify-center">
            {/* Card 1: Stage 1 - Find Osmotic Pressure */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Adjust applied pressure (P) until it balances osmotic pressure to stop osmosis.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-purple-700 flex items-center gap-1.5 tracking-wide">
                    <Gauge className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Applied Pressure (P)
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-900">5.40 atm</span>
                </div>
                <div className="relative w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-purple-600 rounded-full w-[54%]" />
                </div>
              </div>
            </div>

            {/* Card 2: Stage 2 - Find Required Concentration */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Adjust solute concentration (c) until generated osmotic pressure balances external pressure.
                </p>
              </div>

              {/* Visual Preview */}
              <div className="rounded-xl bg-sky-50/70 border border-sky-200 p-2.5 sm:p-3 mt-2.5 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase text-sky-700 flex items-center gap-1.5 tracking-wide">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    Solute Concentration (c)
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-900">0.30 M</span>
                </div>
                <div className="relative w-full h-2.5 bg-sky-200 rounded-full overflow-hidden flex items-center">
                  <div className="h-full bg-sky-600 rounded-full w-[60%]" />
                </div>
              </div>
            </div>

            {/* Card 3: Submit Answer & Progress */}
            <div className="bg-white rounded-2xl p-4 sm:p-4.5 shadow-md border border-slate-200 flex flex-col justify-between min-h-[128px] sm:min-h-[136px]">
              <div>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
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
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                  Once equilibrium is reached, submit your answer to verify and progress.
                </p>
              </div>

              {/* Visual Preview Button */}
              <div className="mt-2.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs sm:text-sm text-center shadow-xs">
                Submit
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
            target={[0, 0.05, 0]}
          />
        </Canvas>
      </div>

      {/* ── Top Floating Header (Module 11 Minimalist Pill Style) ── */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 flex items-center justify-between pointer-events-none gap-2">
        <button
          type="button"
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 shadow-md transition-all cursor-pointer active:scale-95 shrink-0"
          title="Exit Simulation"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" />
          <span>EXIT</span>
        </button>

        {/* Central Minimalist Stage Pill */}
        <div className="pointer-events-none px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm font-mono select-none flex items-center justify-center text-xs">
          <span className="font-extrabold text-sky-700">
            Stage {currentStage.id}/2
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation(true)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
          title="View Explanation"
        >
          <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
          <span>EXPLANATION</span>
        </button>
      </header>

      {/* ── Bottom Minimalist Floating Dock (Module 11 Style) ── */}
      <footer className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[94%] max-w-2xl">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-3xl px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {currentStage.lockedSlider === 'concentration' ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-600 whitespace-nowrap shrink-0">
                <span>c = {soluteMolarity.toFixed(2)} M 🔒</span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 whitespace-nowrap">
                    Applied Pressure (P)
                  </span>
                  <span className="text-xs font-mono font-black text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {appliedPressure.toFixed(2)} atm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAppliedPressure((p) => Math.max(0, Number((p - 0.05).toFixed(2))))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    aria-label="Decrease pressure"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0.00"
                    max="10.00"
                    step="0.05"
                    value={appliedPressure}
                    onChange={(e) => setAppliedPressure(parseFloat(e.target.value))}
                    className="w-full h-2 bg-purple-100 accent-purple-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setAppliedPressure((p) => Math.min(10, Number((p + 0.05).toFixed(2))))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    aria-label="Increase pressure"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-600 whitespace-nowrap shrink-0">
                <span>P = {appliedPressure.toFixed(2)} atm 🔒</span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 whitespace-nowrap">
                    Solute Conc (c)
                  </span>
                  <span className="text-xs font-mono font-black text-sky-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {soluteMolarity.toFixed(2)} M
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSoluteMolarity((c) => Math.max(0, Number((c - 0.01).toFixed(2))))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    aria-label="Decrease concentration"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0.00"
                    max="0.50"
                    step="0.01"
                    value={soluteMolarity}
                    onChange={(e) => setSoluteMolarity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-sky-100 accent-sky-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setSoluteMolarity((c) => Math.min(0.5, Number((c + 0.01).toFixed(2))))}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
                    aria-label="Increase concentration"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 sm:px-6 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer shrink-0"
          >
            Submit
          </button>
        </div>
      </footer>

      {/* ── STEP 4: FULL-SCREEN EXPLANATION MODAL ─────────── */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Osmotic Pressure &amp; Osmosis
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full text-left">
            {/* 1. What is Osmosis & Osmotic Pressure? */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <span>What is Osmosis &amp; Osmotic Pressure (π)?</span>
              </h3>
              <p className="text-slate-600 font-medium">
                In the U-tube, pure water (<strong>Solvent</strong>) and a sugar solution (<strong>Solution</strong>) are separated by a <strong>Semipermeable Membrane (SPM)</strong>. The SPM lets tiny water molecules pass through, but blocks larger dissolved solute molecules.
              </p>
              <p className="text-slate-600 font-medium">
                Water naturally flows from the pure solvent side into the solution side (<strong>Osmosis</strong>). <strong>Osmotic pressure (π)</strong> is the exact external pressure you must apply with the piston to stop that inward flow.
              </p>
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 text-xs font-medium space-y-1">
                <div>• <strong>P &lt; π (Forward Osmosis):</strong> Water flows into the solution side; the piston rises.</div>
                <div>• <strong>P = π (Equilibrium):</strong> Applied pressure balances osmotic pressure; net flow is <strong>zero</strong>.</div>
                <div>• <strong>P &gt; π (Reverse Osmosis):</strong> Water is forced backwards out of the solution into pure water.</div>
              </div>
            </div>

            {/* 2. The van 't Hoff Formula */}
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <span>The van &apos;t Hoff Equation</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-mono font-bold text-sky-800 text-[11px] uppercase mb-1">
                    Osmotic Pressure Formula
                  </div>
                  <div className="font-mono font-black text-slate-900 text-sm bg-white p-2 rounded-lg border border-slate-200 text-center">
                    π = i · c · R · T
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-0.5 font-medium">
                  <div>• <strong>i = 1</strong> (non-electrolyte solute stays intact)</div>
                  <div>• <strong>c</strong> = Molar concentration (mol/L or M)</div>
                  <div>• <strong>R</strong> = 0.0821 L·atm/(mol·K)</div>
                  <div>• <strong>T</strong> = 298 K (25°C)</div>
                </div>
              </div>
            </div>

            {/* 3. Step-by-Step Calculation for This Stage */}
            <div className="space-y-2.5">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <span>Step-by-Step Calculation ({currentStage.label})</span>
              </h3>

              {currentStage.id === 1 ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-purple-500">
                    <div className="font-bold text-slate-900 text-xs mb-1">
                      Step A: Identify the given values
                    </div>
                    <div className="font-mono text-xs font-bold text-purple-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mb-1">
                      c = 0.22 M (Locked) · i = 1 · R = 0.0821 · T = 298 K
                    </div>
                    <p className="text-[11px] text-slate-600">
                      The solute concentration is fixed at 0.22 M at room temperature (298 K).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-purple-500">
                    <div className="font-bold text-slate-900 text-xs mb-1">
                      Step B: Calculate the Osmotic Pressure (π)
                    </div>
                    <div className="font-mono text-xs font-bold text-purple-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mb-1">
                      π = 1 × 0.22 × 0.0821 × 298 = 5.40 atm
                    </div>
                    <p className="text-[11px] text-slate-600">
                      The 0.22 M solution generates 5.40 atm of osmotic pressure pulling water inward.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border-l-4 border-emerald-500">
                    <div className="font-bold text-emerald-950 text-xs mb-1">
                      Step C: Set the Slider to Reach Equilibrium (P = π)
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-900 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 mb-1">
                      Applied Pressure (P) = 5.40 atm
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Slide <strong>Pressure (P)</strong> to <strong>5.40 atm</strong> so the piston balances osmosis, then click <strong>Submit</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-sky-500">
                    <div className="font-bold text-slate-900 text-xs mb-1">
                      Step A: Identify the given values
                    </div>
                    <div className="font-mono text-xs font-bold text-sky-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mb-1">
                      P = π = 7.34 atm (Locked) · i = 1 · R = 0.0821 · T = 298 K
                    </div>
                    <p className="text-[11px] text-slate-600">
                      The piston is locked at 7.34 atm, so the solution must produce π = 7.34 atm to balance it.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border-l-4 border-sky-500">
                    <div className="font-bold text-slate-900 text-xs mb-1">
                      Step B: Rearrange π = i·c·R·T to solve for Concentration (c)
                    </div>
                    <div className="font-mono text-xs font-bold text-sky-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 mb-1">
                      c = π / (i · R · T) = 7.34 / (1 × 0.0821 × 298) = 0.30 M
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Multiplying 0.0821 × 298 gives 24.466, and 7.34 / 24.466 = 0.30 M.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border-l-4 border-emerald-500">
                    <div className="font-bold text-emerald-950 text-xs mb-1">
                      Step C: Set the Slider to Reach Equilibrium (P = π)
                    </div>
                    <div className="font-mono text-xs font-bold text-emerald-900 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 mb-1">
                      Solute Concentration (c) = 0.30 M
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Slide <strong>Conc (c)</strong> to <strong>0.30 M</strong> so osmotic pressure matches 7.34 atm, then click <strong>Submit</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Button */}
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
