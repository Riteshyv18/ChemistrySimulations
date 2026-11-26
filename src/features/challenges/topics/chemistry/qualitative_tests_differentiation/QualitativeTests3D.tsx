"use client";

import React, { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  useQualitativeTestsStore,
  QUALITATIVE_STAGES,
} from "./QualitativeTestsStore";
import { Droplet, Check, Plus, Minus } from "lucide-react";

// ============================================================================
// Single Mystery Test Tube with Fluid & Precipitate Shaders
// ============================================================================
interface MysteryTubeProps {
  id: "tubeA" | "tubeB";
  position: [number, number, number];
  title: string;
  poured: boolean;
  reactionProgress: number;
  isSelected: boolean;
  canSelect: boolean;
  isModalOpen?: boolean;
  onSelect: () => void;
  fluidColor: string;
  fluidOpacity: number;
  mirrorLevel: number;
  precipitateLevel: number;
  crystalsLevel: number;
  bathTemp: number;
  isReceivingPour: boolean;
}

function MysteryTube({
  id,
  position,
  title,
  poured,
  reactionProgress,
  isSelected,
  canSelect,
  isModalOpen,
  onSelect,
  fluidColor,
  fluidOpacity,
  mirrorLevel,
  precipitateLevel,
  crystalsLevel,
  bathTemp,
  isReceivingPour,
}: MysteryTubeProps) {
  const tubeGroupRef = useRef<THREE.Group>(null);
  const crystalsGroupRef = useRef<THREE.Group>(null);
  const fluidMeshRef = useRef<THREE.Mesh>(null);

  // Golden ratio laboratory Pyrex test tube proportions (Aspect ratio ~6.8:1)
  const TUBE_RADIUS = 0.165;
  const TUBE_HEIGHT = 2.24;
  const FLUID_RADIUS = 0.153;

  // 1. Seamless Outer Glass Tube Lathe Geometry (Single continuous mesh from rounded bowl to flared lip)
  const glassTubeGeometry = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const bottomY = -TUBE_HEIGHT / 2;
    const sphereCenterY = bottomY + TUBE_RADIUS;

    // Hemispherical round apex & bowl (14 points for silky smooth curvature)
    for (let i = 0; i <= 14; i++) {
      const theta = -Math.PI / 2 + (Math.PI / 2) * (i / 14);
      const x = TUBE_RADIUS * Math.cos(theta);
      const y = sphereCenterY + TUBE_RADIUS * Math.sin(theta);
      pts.push(new THREE.Vector2(Math.max(0, x), y));
    }

    // Cylindrical wall
    pts.push(new THREE.Vector2(TUBE_RADIUS, TUBE_HEIGHT / 2 - 0.12));

    // Flared fire-polished mouth
    pts.push(new THREE.Vector2(TUBE_RADIUS + 0.007, TUBE_HEIGHT / 2 - 0.04));
    pts.push(new THREE.Vector2(TUBE_RADIUS + 0.018, TUBE_HEIGHT / 2));

    const geom = new THREE.LatheGeometry(pts, 36);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 2. Seamless Inner Liquid Column Lathe Geometry (with concave liquid meniscus)
  const fluidGeometry = useMemo(() => {
    const topY = poured ? 0.08 : -0.38;
    const bottomY = -TUBE_HEIGHT / 2 + 0.012;
    const sphereCenterY = bottomY + FLUID_RADIUS;
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, bottomY)];

    // Inner bottom hemispherical bowl
    for (let i = 1; i <= 12; i++) {
      const theta = -Math.PI / 2 + (Math.PI / 2) * (i / 12);
      const x = FLUID_RADIUS * Math.cos(theta);
      const y = sphereCenterY + FLUID_RADIUS * Math.sin(theta);
      pts.push(new THREE.Vector2(x, y));
    }

    // Cylinder up to liquid meniscus
    pts.push(new THREE.Vector2(FLUID_RADIUS, topY));
    // Gentle concave meniscus top cap
    pts.push(new THREE.Vector2(FLUID_RADIUS * 0.5, topY - 0.005));
    pts.push(new THREE.Vector2(0, topY - 0.007));

    const geom = new THREE.LatheGeometry(pts, 32);
    geom.computeVertexNormals();
    return geom;
  }, [poured]);

  // 3. Stage 1: Silver Mirror Lathe Geometry (Lining the inner glass surface)
  const silverMirrorGeometry = useMemo(() => {
    const R_m = 0.158;
    const bottomY = -TUBE_HEIGHT / 2 + 0.008;
    const sphereCenterY = bottomY + R_m;
    const topY = 0.08;
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, bottomY)];

    for (let i = 1; i <= 12; i++) {
      const theta = -Math.PI / 2 + (Math.PI / 2) * (i / 12);
      const x = R_m * Math.cos(theta);
      const y = sphereCenterY + R_m * Math.sin(theta);
      pts.push(new THREE.Vector2(x, y));
    }
    pts.push(new THREE.Vector2(R_m, topY));

    const geom = new THREE.LatheGeometry(pts, 32);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Subtle heat vibration + fluid ripple on pour
  useFrame((state, delta) => {
    if (bathTemp >= 50 && tubeGroupRef.current) {
      tubeGroupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 6) * 0.012;
    }

    if (crystalsGroupRef.current && crystalsLevel > 0) {
      crystalsGroupRef.current.rotation.y += delta * 0.35;
    }

    if (isReceivingPour && fluidMeshRef.current) {
      fluidMeshRef.current.scale.x =
        1.0 + Math.sin(state.clock.elapsedTime * 20) * 0.025;
      fluidMeshRef.current.scale.z =
        1.0 + Math.cos(state.clock.elapsedTime * 20) * 0.025;
    } else if (fluidMeshRef.current) {
      fluidMeshRef.current.scale.set(1, 1, 1);
    }
  });

  // Canary-yellow crystal particles for iodoform (Stage 3)
  const crystalParticles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const radius = 0.02 + Math.random() * 0.09;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = -1.02 + Math.random() * 0.22;
      const size = 0.018 + Math.random() * 0.022;
      pts.push({ x, y, z, size });
    }
    return pts;
  }, []);

  return (
    <group ref={tubeGroupRef} position={position}>
      {/* ── Selection Ring Halo ── */}
      {isSelected && (
        <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.32, 32]} />
          <meshBasicMaterial
            color="#0284C7"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ── Clickable Collider Cylinder ── */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (canSelect) {
            onSelect();
          }
        }}
        visible={false}
      >
        <cylinderGeometry args={[0.24, 0.24, TUBE_HEIGHT, 16]} />
        <meshBasicMaterial />
      </mesh>

      {/* ── 1. Seamless Outer Glass Pyrex Tube Shell ── */}
      <mesh geometry={glassTubeGeometry}>
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.32}
          roughness={0.06}
          metalness={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Top Fire-Polished Beaded Lip Rim */}
      <mesh position={[0, TUBE_HEIGHT / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[TUBE_RADIUS + 0.016, 0.014, 16, 36]} />
        <meshStandardMaterial
          color="#BAE6FD"
          roughness={0.06}
          metalness={0.12}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Subtle Borosilicate Lab Graduation Marks */}
      {[-0.55, -0.25, 0.05, 0.35, 0.65].map((yMark, idx) => (
        <mesh key={`grad-${idx}`} position={[0, yMark, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1652, 0.1668, 24, 1, -Math.PI * 0.2, Math.PI * 0.4]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── 2. Seamless Liquid Meniscus Volume ── */}
      <mesh ref={fluidMeshRef} geometry={fluidGeometry}>
        <meshStandardMaterial
          color={fluidColor}
          transparent
          opacity={fluidOpacity}
          roughness={0.16}
          metalness={0.05}
        />
      </mesh>

      {/* ── Stage 1: Specular Silver Mirror (Lining the Inner Wall & Bowl) ── */}
      {mirrorLevel > 0.02 && (
        <mesh geometry={silverMirrorGeometry}>
          <meshStandardMaterial
            color="#F1F5F9"
            metalness={0.99}
            roughness={0.02}
            transparent={mirrorLevel < 0.95}
            opacity={Math.min(1.0, mirrorLevel * 1.05)}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ── Stage 2: Dense Brick-Red Cu2O Sediment Base ── */}
      {precipitateLevel > 0.1 && (
        <mesh
          position={[0, -1.108 + precipitateLevel * 0.04, 0]}
          rotation={[Math.PI, 0, 0]}
        >
          <sphereGeometry
            args={[
              0.154,
              32,
              16,
              0,
              Math.PI * 2,
              0,
              Math.PI * 0.32 * precipitateLevel,
            ]}
          />
          <meshStandardMaterial
            color="#991B1B"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* ── Stage 3: Canary-Yellow Iodoform (CHI3) Crystals ── */}
      {crystalsLevel > 0.2 && (
        <group ref={crystalsGroupRef}>
          {crystalParticles.map((pt, idx) => (
            <mesh
              key={idx}
              position={[pt.x, pt.y, pt.z]}
              rotation={[idx, idx * 0.4, idx * 0.2]}
            >
              <octahedronGeometry args={[pt.size * crystalsLevel, 0]} />
              <meshStandardMaterial
                color="#FACC15"
                roughness={0.25}
                metalness={0.3}
                emissive="#EAB308"
                emissiveIntensity={0.3}
              />
            </mesh>
          ))}
          <mesh position={[0, -1.04, 0]}>
            <cylinderGeometry args={[0.14, 0.13, 0.08 * crystalsLevel, 16]} />
            <meshStandardMaterial color="#EAB308" roughness={0.4} />
          </mesh>
        </group>
      )}

      {/* ── 3D Top Header & Interactive Selection Pill ── */}
      {!isModalOpen && (
        <Html position={[0, 1.32, 0]} center className="pointer-events-auto select-none">
          {canSelect ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm whitespace-nowrap ${isSelected
                  ? "bg-[#0284C7] text-white ring-2 ring-sky-300"
                  : "bg-white hover:bg-sky-50 text-slate-800 border border-sky-300 shadow-xs"
                }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              <span>{isSelected ? `${title} (Selected)` : `Select ${title}`}</span>
            </button>
          ) : (
            <span className="font-extrabold text-xs text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs whitespace-nowrap">
              {title}
            </span>
          )}
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Electric Spiral Heating Coil (Matching User Calrod Reference Photo)
// ============================================================================
function SpiralCalrodCoil({
  position,
  temperature,
  mirrorTerminals = false,
}: {
  position: [number, number, number];
  temperature: number;
  mirrorTerminals?: boolean;
}) {
  const isHot = temperature >= 50;
  const isRedHot = temperature >= 85;
  const heatFactor = Math.max(0, Math.min(1, (temperature - 25) / 75)); // 0 to 1

  // Color & emission matching realistic calrod heating elements
  const coilColor = isRedHot ? "#EF4444" : isHot ? "#EA580C" : "#334155";
  const emissiveColor = isRedHot ? "#EF4444" : isHot ? "#F97316" : "#000000";
  const emissiveIntensity = isRedHot ? 2.5 : isHot ? 1.0 * heatFactor : 0;

  // Concentric spiral rings (outer to inner)
  const rings = [
    { radius: 0.38, tube: 0.024 },
    { radius: 0.28, tube: 0.023 },
    { radius: 0.18, tube: 0.022 },
    { radius: 0.09, tube: 0.02 },
  ];

  const terminalPos = mirrorTerminals
    ? ([-0.32, 0, 0.22] as [number, number, number])
    : ([0.32, 0, 0.22] as [number, number, number]);
  const terminalRot = mirrorTerminals
    ? ([0, Math.PI / 4, 0] as [number, number, number])
    : ([0, -Math.PI / 4, 0] as [number, number, number]);

  return (
    <group position={position}>
      {/* Concentric Spiral Calrod Rings */}
      {rings.map((r, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r.radius, r.tube, 16, 36]} />
          <meshStandardMaterial
            color={coilColor}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.35}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Center Loop Crossover Return */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.16, 16]} />
        <meshStandardMaterial
          color={coilColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {/* Terminal Extension Leads with Ceramic Collars (As shown in reference photo) */}
      <group position={terminalPos} rotation={terminalRot}>
        {[-0.045, 0.045].map((offset, i) => (
          <group key={i} position={[offset, 0, 0]}>
            {/* Bent sheath terminal lead */}
            <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.24, 16]} />
              <meshStandardMaterial
                color={coilColor}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                roughness={0.35}
                metalness={0.7}
              />
            </mesh>
            {/* Ceramic Insulator Collar */}
            <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.05, 16]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.6} />
            </mesh>
            {/* Terminal Spade Connector Pin */}
            <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.014, 0.028, 0.04]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Mounting Metal Bracket Bar */}
        <mesh position={[0, 0, 0.25]}>
          <boxGeometry args={[0.16, 0.02, 0.025]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* Radiant Incandescent Glow Disk beneath coil when hot */}
      {isHot && (
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.42, 32]} />
          <meshBasicMaterial
            color={isRedHot ? "#EF4444" : "#F59E0B"}
            transparent
            opacity={0.35 * heatFactor}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// Connected Heat Water Bath with Spiral Calrod Coils & Digital Temperature Box
// ============================================================================
interface ElectricCoilHeatingBathProps {
  temperature: number;
  targetTemp: number;
  reagentsPoured: boolean;
  reactionCompleted: boolean;
  isModalOpen?: boolean;
  onTemperatureChange: (temp: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function ElectricCoilHeatingBath({
  temperature,
  targetTemp,
  reagentsPoured,
  reactionCompleted,
  isModalOpen = false,
  onTemperatureChange,
  onIncrement,
  onDecrement,
}: ElectricCoilHeatingBathProps) {
  const isHot = temperature >= 50;
  const isRedHot = temperature >= 85;
  const heatFactor = Math.max(0, Math.min(1, (temperature - 25) / 75));

  // Cables from each coil leading down into the temperature control box
  const { leftCableCurve, rightCableCurve } = useMemo(() => {
    // Left coil terminal output: x ≈ -0.84, y ≈ -0.32, z ≈ 0.44
    // Console left port: x = -0.43, y = -0.52, z = 0.45
    const leftCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.84, -0.32, 0.44),
      new THREE.Vector3(-0.74, -0.36, 0.47),
      new THREE.Vector3(-0.58, -0.47, 0.48),
      new THREE.Vector3(-0.43, -0.52, 0.45),
    ]);

    // Right coil terminal output: x ≈ 0.84, y ≈ -0.32, z ≈ 0.44
    // Console right port: x = 0.43, y = -0.52, z = 0.45
    const rightCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.84, -0.32, 0.44),
      new THREE.Vector3(0.74, -0.36, 0.47),
      new THREE.Vector3(0.58, -0.47, 0.48),
      new THREE.Vector3(0.43, -0.52, 0.45),
    ]);

    return { leftCableCurve: leftCurve, rightCableCurve: rightCurve };
  }, []);

  return (
    <group position={[0, -0.65, 0]}>
      {/* ── Dual Electric Spiral Calrod Coils (Under Tube A & Tube B) ── */}
      <group position={[0, -0.32, 0]}>
        {/* Ceramic Insulator Bed Plate */}
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[2.7, 0.04, 0.75]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Rubber Feet under the Bed Plate */}
        {[-1.15, 1.15].map((x, i) => (
          <group key={i}>
            <mesh position={[x, -0.14, 0.22]}>
              <cylinderGeometry args={[0.04, 0.045, 0.16, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.9} />
            </mesh>
            <mesh position={[x, -0.14, -0.22]}>
              <cylinderGeometry args={[0.04, 0.045, 0.16, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Spiral Calrod Coil Under Tube A (Left) */}
        <SpiralCalrodCoil position={[-0.95, 0, 0]} temperature={temperature} />

        {/* Spiral Calrod Coil Under Tube B (Right, with mirrored terminals toward center) */}
        <SpiralCalrodCoil position={[0.95, 0, 0]} temperature={temperature} mirrorTerminals={true} />
      </group>

      {/* ── 4. Connecting Power Cable Lines from Coils to Temperature Controller ── */}
      {/* Left Coil Heavy Cable */}
      <mesh>
        <tubeGeometry args={[leftCableCurve, 32, 0.018, 12, false]} />
        <meshStandardMaterial color="#0F172A" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Left Terminal Strain Relief Collar */}
      <mesh position={[-0.83, -0.32, 0.44]} rotation={[0, -Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.04, 12]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* Right Coil Heavy Cable */}
      <mesh>
        <tubeGeometry args={[rightCableCurve, 32, 0.018, 12, false]} />
        <meshStandardMaterial color="#0F172A" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Right Terminal Strain Relief Collar */}
      <mesh position={[0.83, -0.32, 0.44]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.04, 12]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* ── 5. Bottom Temperature Controller Console with - and + Buttons ── */}
      <group position={[0, -0.52, 0.46]}>
        {/* Sleek Dark Console Housing / Junction Box */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[0.88, 0.12, 0.04]} />
          <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Cable Gland Ports on Left and Right Sides */}
        <mesh position={[-0.43, 0, -0.01]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.04, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.43, 0, -0.01]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.04, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Clean Minimalist Pill (Matching Topic 1 Style) */}
        {!isModalOpen && (
          <Html position={[0, 0, 0.03]} center className="select-none pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-sky-300 shadow-md">
              {/* Minus Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecrement();
                }}
                disabled={temperature <= 25}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-xs transition-all cursor-pointer border border-slate-200"
                title="Decrease (-5°C)"
              >
                <Minus className="w-3 h-3 text-slate-600" />
              </button>

              {/* Center Number Block (Exact Topic 1 Style) */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200">
                <span className="font-mono font-black text-xs text-sky-800 whitespace-nowrap">
                  {Math.round(temperature)}°C
                </span>
              </div>

              {/* Plus Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onIncrement();
                }}
                disabled={temperature >= 100}
                className="w-5 h-5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] active:scale-90 text-white disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-xs transition-all cursor-pointer shadow-xs"
                title="Increase (+5°C)"
              >
                <Plus className="w-3 h-3 text-white" />
              </button>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

// ============================================================================
// Animated Laboratory Glass Pipette / Dropper with Falling Droplets
// ============================================================================
interface AnimatedPipetteProps {
  animState: "idle" | "pouringA" | "movingToB" | "pouringB" | "returning";
  animProgress: number; // 0 to 1 inside current phase
  fluidColor: string;
}

function AnimatedPipette({
  animState,
  animProgress,
  fluidColor,
}: AnimatedPipetteProps) {
  // Compute position & tilt of pipette dynamically
  const { pos, rot, isPouring, dropY } = useMemo(() => {
    let x = 2.35;
    let y = 0.25;
    let z = 0.2;
    let rz = 0;
    let pouring = false;
    let dY = 0;

    if (animState === "idle") {
      x = 2.35;
      y = 0.25;
      z = 0.2;
      rz = 0;
    } else if (animState === "pouringA") {
      // Resting tilted directly over mouth of Tube A (-0.95, 1.37)
      x = -1.06;
      y = 1.76;
      z = 0.05;
      rz = -0.26;
      pouring = true;
      dY = 1.35 - (animProgress % 0.33) * 2.8; // dropping cycles
    } else if (animState === "movingToB") {
      // Gliding gracefully from Tube A (-1.06) to Tube B (1.06)
      const t = animProgress;
      x = THREE.MathUtils.lerp(-1.06, 1.06, t);
      y = 1.76 + Math.sin(t * Math.PI) * 0.15;
      z = 0.05;
      rz = THREE.MathUtils.lerp(-0.26, 0.26, t);
    } else if (animState === "pouringB") {
      // Resting tilted directly over mouth of Tube B (0.95, 1.37)
      x = 1.06;
      y = 1.76;
      z = 0.05;
      rz = 0.26;
      pouring = true;
      dY = 1.35 - (animProgress % 0.33) * 2.8;
    } else if (animState === "returning") {
      // Returning to bottle
      const t = animProgress;
      x = THREE.MathUtils.lerp(1.06, 2.35, t);
      y = THREE.MathUtils.lerp(1.76, 0.25, t);
      z = THREE.MathUtils.lerp(0.05, 0.2, t);
      rz = THREE.MathUtils.lerp(0.26, 0, t);
    }

    return { pos: [x, y, z] as [number, number, number], rot: rz, isPouring: pouring, dropY: dY };
  }, [animState, animProgress]);

  if (animState === "idle") return null;

  return (
    <group position={pos} rotation={[0, 0, rot]}>
      {/* ── Glass Pipette Stem ── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.65, 16]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.45}
          roughness={0.06}
          metalness={0.1}
        />
      </mesh>

      {/* Tapered Nozzle Tip */}
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.04, 0.015, 0.15, 16]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.5}
          roughness={0.06}
          metalness={0.1}
        />
      </mesh>

      {/* Rubber Bulb Squeeze Cap */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#0284C7" roughness={0.6} />
      </mesh>

      {/* Fluid inside Pipette column */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 16]} />
        <meshStandardMaterial
          color={fluidColor}
          transparent
          opacity={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* ── Animated Falling Droplets Stream ── */}
      {isPouring && (
        <group position={[0, -0.45, 0]}>
          <mesh position={[0, Math.max(-0.6, dropY - 1.25), 0]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshStandardMaterial
              color={fluidColor}
              roughness={0.1}
              transparent
              opacity={0.9}
            />
          </mesh>
          <mesh position={[0, Math.max(-0.6, dropY - 1.1), 0]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial
              color={fluidColor}
              roughness={0.1}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ============================================================================
// Central 3D Reagent Bottle (Situated on the right lab bench)
// ============================================================================
function CentralReagentBottle({
  reagentName,
  isPouring,
  isModalOpen = false,
  onStartPourAnimation,
}: {
  reagentName: string;
  isPouring: boolean;
  isModalOpen?: boolean;
  onStartPourAnimation: () => void;
}) {
  return (
    <group
      position={[2.35, -0.4, 0.2]}
      onClick={(e) => {
        e.stopPropagation();
        if (!isPouring) onStartPourAnimation();
      }}
    >
      {/* Bottle Glass Body */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.5, 24]} />
        <meshStandardMaterial
          color="#E0F2FE"
          transparent
          opacity={0.42}
          roughness={0.08}
          metalness={0.1}
        />
      </mesh>

      {/* Bottle Neck & Rim */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 24]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.55}
          roughness={0.08}
          metalness={0.1}
        />
      </mesh>

      {/* Stopper Cork */}
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#B45309" roughness={0.7} />
      </mesh>

      {/* Reagent Fluid inside bottle */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.21, 0.38, 24]} />
        <meshStandardMaterial
          color="#38BDF8"
          transparent
          opacity={0.65}
          roughness={0.15}
        />
      </mesh>

      {/* One-Click Pour Action Button */}
      {!isPouring && !isModalOpen && (
        <Html position={[0, -0.32, 0]} center className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={onStartPourAnimation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs shadow-sm transition-all transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Droplet className="w-3.5 h-3.5 fill-sky-200" />
            <span>Pour {reagentName.split("[")[0]?.trim() || "Reagent"}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Inner Wet-Lab 3D Scene Component (Executed within Canvas context)
// ============================================================================
function WetLabScene() {
  const {
    stage,
    tubes,
    temperature,
    targetTemp,
    selectedAnswer,
    showSuccessModal,
    showWrongModal,
    showExplanationModal,
    setTemperature,
    incrementTemperature,
    decrementTemperature,
    pourReagent,
    selectTubeAnswer,
  } = useQualitativeTestsStore();

  const currentConfig = QUALITATIVE_STAGES[stage];

  // ── Pouring Animation State Machine ──
  const [animState, setAnimState] = useState<
    "idle" | "pouringA" | "movingToB" | "pouringB" | "returning"
  >("idle");
  const [animProgress, setAnimProgress] = useState<number>(0);
  const animTimeRef = useRef<number>(0);

  // Reset pouring animation whenever stage is restarted (tubes unpoured)
  useEffect(() => {
    if (!tubes.tubeA.poured && !tubes.tubeB.poured) {
      setAnimState("idle");
      setAnimProgress(0);
      animTimeRef.current = 0;
    }
  }, [tubes.tubeA.poured, tubes.tubeB.poured]);

  // Trigger full pouring animation
  const handleStartPourAnimation = () => {
    if (animState !== "idle") return;
    animTimeRef.current = 0;
    setAnimState("pouringA");
  };

  // Frame ticker driving the smooth multi-phase animation
  useFrame((_, delta) => {
    if (animState === "idle") return;

    animTimeRef.current += delta;
    const t = animTimeRef.current;

    // Timeline:
    // 0.0s - 1.8s: Pouring Tube A
    // 1.8s - 2.8s: Moving to Tube B
    // 2.8s - 4.6s: Pouring Tube B
    // 4.6s - 5.5s: Returning to bottle
    // > 5.5s: Idle & Completed
    if (t < 1.8) {
      if (animState !== "pouringA") setAnimState("pouringA");
      setAnimProgress(t / 1.8);
      // Dispense into Tube A midway through pour
      if (t >= 0.8 && !tubes.tubeA.poured) {
        pourReagent("tubeA");
      }
    } else if (t < 2.8) {
      if (animState !== "movingToB") setAnimState("movingToB");
      setAnimProgress((t - 1.8) / 1.0);
    } else if (t < 4.6) {
      if (animState !== "pouringB") setAnimState("pouringB");
      setAnimProgress((t - 2.8) / 1.8);
      // Dispense into Tube B midway through pour
      if (t >= 3.6 && !tubes.tubeB.poured) {
        pourReagent("tubeB");
      }
    } else if (t < 5.5) {
      if (animState !== "returning") setAnimState("returning");
      setAnimProgress((t - 4.6) / 0.9);
    } else {
      setAnimState("idle");
      setAnimProgress(0);
      animTimeRef.current = 0;
    }
  });

  // Visual state calculations per stage & tube (decoupled reaction driven by heat!)
  const visualState = useMemo(() => {
    let tubeAColor = "#F1F5F9";
    let tubeBColor = "#F1F5F9";
    let mirrorA = 0;
    let pptA = 0;
    let crystalsA = 0;
    let pipetteFluid = "#38BDF8";

    if (stage === 1) {
      // Stage 1: Tollens' Test
      pipetteFluid = "#CBD5E1";
      if (tubes.tubeA.poured) {
        // If reacted (heat >= 55C), mirror forms! Otherwise unreacted cold mixture
        tubeAColor = tubes.tubeA.reactionProgress > 0 ? "#E2E8F0" : "#F1F5F9";
        mirrorA = tubes.tubeA.reactionProgress;
      }
      if (tubes.tubeB.poured) {
        tubeBColor = "#F8FAFC"; // Stays clear
      }
    } else if (stage === 2) {
      // Stage 2: Fehling's Test
      pipetteFluid = "#1D4ED8";
      if (tubes.tubeA.poured) {
        // Unheated: deep royal blue. Heated: brick-red Cu2O precipitate
        tubeAColor = tubes.tubeA.reactionProgress > 0 ? "#991B1B" : "#1D4ED8";
        pptA = tubes.tubeA.reactionProgress;
      }
      if (tubes.tubeB.poured) {
        tubeBColor = "#1D4ED8"; // Stays Deep Royal Blue
      }
    } else {
      // Stage 3: Iodoform Test
      pipetteFluid = "#92400E";
      if (tubes.tubeA.poured) {
        // Unheated: amber I2. Heated: canary yellow CHI3 crystals
        tubeAColor = tubes.tubeA.reactionProgress > 0 ? "#FEF08A" : "#92400E";
        crystalsA = tubes.tubeA.reactionProgress;
      }
      if (tubes.tubeB.poured) {
        tubeBColor = "#F8FAFC"; // Stays clear
      }
    }

    return {
      tubeAColor,
      tubeBColor,
      mirrorA,
      pptA,
      crystalsA,
      pipetteFluid,
    };
  }, [stage, tubes]);

  const bothPoured = tubes.tubeA.poured && tubes.tubeB.poured;
  // Answer buttons unlock ONLY after both tubes are poured AND the reaction has occurred!
  const isReactionComplete = tubes.tubeA.reactionProgress > 0;
  // Hide interactive 3D pills when modals or overlays are open, or if an answer is already submitted
  const isModalOpen = showSuccessModal || showExplanationModal || showWrongModal;
  const canSelectAnswer = bothPoured && isReactionComplete && animState === "idle" && !selectedAnswer && !isModalOpen;

  return (
    <>
      {/* Studio Lighting */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} castShadow />
      <directionalLight position={[-4, 4, -3]} intensity={0.6} color="#BAE6FD" />
      <pointLight position={[0, 2, 2]} intensity={0.5} color="#FFFFFF" />

      {/* ── Rack & Glassware ── */}
      <group position={[0, -0.28, 0]}>
        {/* Connected Heat Water Bath with Spiral Calrod Coils & Digital Controller */}
        <ElectricCoilHeatingBath
          temperature={temperature}
          targetTemp={targetTemp}
          reagentsPoured={bothPoured}
          reactionCompleted={isReactionComplete}
          isModalOpen={isModalOpen}
          onTemperatureChange={setTemperature}
          onIncrement={incrementTemperature}
          onDecrement={decrementTemperature}
        />

        {/* Mystery Tube A (Left) */}
        <MysteryTube
          id="tubeA"
          position={[-0.95, 0.25, 0]}
          title="Tube A"
          poured={tubes.tubeA.poured}
          reactionProgress={tubes.tubeA.reactionProgress}
          isSelected={selectedAnswer === "tubeA"}
          canSelect={canSelectAnswer}
          isModalOpen={isModalOpen}
          onSelect={() => selectTubeAnswer("tubeA")}
          fluidColor={visualState.tubeAColor}
          fluidOpacity={tubes.tubeA.poured ? 0.9 : 0.75}
          mirrorLevel={visualState.mirrorA}
          precipitateLevel={visualState.pptA}
          crystalsLevel={visualState.crystalsA}
          bathTemp={temperature}
          isReceivingPour={animState === "pouringA"}
        />

        {/* Mystery Tube B (Right) */}
        <MysteryTube
          id="tubeB"
          position={[0.95, 0.25, 0]}
          title="Tube B"
          poured={tubes.tubeB.poured}
          reactionProgress={tubes.tubeB.reactionProgress}
          isSelected={selectedAnswer === "tubeB"}
          canSelect={canSelectAnswer}
          isModalOpen={isModalOpen}
          onSelect={() => selectTubeAnswer("tubeB")}
          fluidColor={visualState.tubeBColor}
          fluidOpacity={tubes.tubeB.poured ? 0.9 : 0.75}
          mirrorLevel={0}
          precipitateLevel={0}
          crystalsLevel={0}
          bathTemp={temperature}
          isReceivingPour={animState === "pouringB"}
        />

        {/* Animated Laboratory Pipette */}
        <AnimatedPipette
          animState={animState}
          animProgress={animProgress}
          fluidColor={visualState.pipetteFluid}
        />

        {/* Central Reagent Bottle with Pour Button */}
        <CentralReagentBottle
          reagentName={currentConfig.reagentName}
          isPouring={animState !== "idle" || bothPoured}
          isModalOpen={isModalOpen}
          onStartPourAnimation={handleStartPourAnimation}
        />
      </group>

      {/* ── Orbit Controls (Zoomable with comfortable bounds) ── */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2 + 0.1}
        dampingFactor={0.08}
      />
    </>
  );
}

// ============================================================================
// Main 3D Qualitative Tests Wet-Lab Scene with Real-Time Pouring Animation
// ============================================================================
export default function QualitativeTests3D() {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0.15, 2.7, 6.2], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <WetLabScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
