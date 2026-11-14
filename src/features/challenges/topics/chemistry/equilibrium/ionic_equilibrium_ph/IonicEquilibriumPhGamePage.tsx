"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  X,
  PlusCircle,
  MinusCircle,
  Info,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Gauge,
  ArrowRight,
} from "lucide-react";

// ============================================================================
// TYPES & MOLECULAR / ION STRUCTURES
// ============================================================================

interface Ion3DData {
  id: string;
  type: "H3O" | "OH";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Euler;
}

// ----------------------------------------------------------------------------
// 3D ION COMPONENTS (Ball-and-Stick)
// H3O+ (Hydronium): Central Oxygen (Red: #EF4444) + 3 Hydrogens (White: #F8FAFC)
// OH- (Hydroxide): Oxygen (Red: #EF4444) + 1 Hydrogen (White: #F8FAFC)
// ----------------------------------------------------------------------------

const sphereGeoOxygen = new THREE.SphereGeometry(0.22, 16, 16);
const sphereGeoHydrogen = new THREE.SphereGeometry(0.12, 14, 14);
const cylGeoBond = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);

const matOxygen = new THREE.MeshStandardMaterial({
  color: "#EF4444",
  roughness: 0.25,
  metalness: 0.15,
});

const matHydrogen = new THREE.MeshStandardMaterial({
  color: "#F8FAFC",
  roughness: 0.3,
  metalness: 0.1,
});

const matBond = new THREE.MeshStandardMaterial({
  color: "#94A3B8",
  roughness: 0.35,
});

// H3O+ Ion: Trigonal pyramidal geometry with + charge glow aura
function IonH3O() {
  const bondDist = 0.28;
  const dip = 0.14; // downward pyramid offset

  // 3 Hydrogen positions at 120-degree intervals around the base
  const hAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

  return (
    <group>
      {/* Central Oxygen */}
      <mesh geometry={sphereGeoOxygen} material={matOxygen} position={[0, 0.05, 0]} />

      {/* 3 O-H Bonds and Hydrogen atoms */}
      {hAngles.map((ang, i) => {
        const hx = bondDist * Math.cos(ang);
        const hz = bondDist * Math.sin(ang);
        const hy = -dip;

        return (
          <group key={i}>
            {/* Bond */}
            <mesh
              geometry={cylGeoBond}
              material={matBond}
              position={[hx / 2, (hy + 0.05) / 2, hz / 2]}
              rotation={[Math.atan2(hz, -hy), 0, -Math.atan2(hx, -hy)]}
            />
            {/* Hydrogen atom */}
            <mesh geometry={sphereGeoHydrogen} material={matHydrogen} position={[hx, hy, hz]} />
          </group>
        );
      })}

      {/* Floating Plus Sign Tag */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.4} />
      </mesh>
      <Text
        position={[0, 0.32, 0]}
        fontSize={0.16}
        color="#0284C7"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#FFFFFF"
      >
        +
      </Text>
    </group>
  );
}

// OH- Ion: Diatomic Oxygen-Hydrogen with - charge tag
function IonOH() {
  const bondDist = 0.26;

  return (
    <group>
      {/* Oxygen atom */}
      <mesh geometry={sphereGeoOxygen} material={matOxygen} position={[-bondDist / 2, 0, 0]} />

      {/* Single O-H Bond */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[0, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Hydrogen atom */}
      <mesh geometry={sphereGeoHydrogen} material={matHydrogen} position={[bondDist / 2, 0, 0]} />

      {/* Floating Minus Sign Tag */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#F43F5E" transparent opacity={0.4} />
      </mesh>
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.18}
        color="#E11D48"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#FFFFFF"
      >
        −
      </Text>
    </group>
  );
}

// ----------------------------------------------------------------------------
// UNIVERSAL INDICATOR COLOR FUNCTION (pH 1.0 to 14.0)
// Smooth spectrum: 
// 1-2: Red (#EF4444)
// 3-4: Orange (#F97316)
// 5-6: Yellow-Orange (#FBBF24)
// 7:   Neutral Green (#10B981)
// 8-9: Blue-Green / Cyan (#06B6D4)
// 10-11: Royal Blue (#3B82F6)
// 12-14: Deep Violet (#8B5CF6 / #7C3AED)
// ----------------------------------------------------------------------------
function getIndicatorColor(pH: number): string {
  if (pH <= 2.0) return "#EF4444"; // Red
  if (pH <= 4.0) return "#F97316"; // Orange
  if (pH <= 6.0) return "#EAB308"; // Yellow
  if (pH <= 7.5) return "#10B981"; // Emerald Green
  if (pH <= 9.0) return "#06B6D4"; // Cyan
  if (pH <= 11.0) return "#3B82F6"; // Blue
  return "#7C3AED"; // Deep Violet
}

// ----------------------------------------------------------------------------
// 3D BEAKER & SOLUTION COMPONENT
// ----------------------------------------------------------------------------

interface BeakerVesselProps {
  solutionVolume: number; // in mL (100 to 250)
  solutionColor: string;
}

function BeakerVessel({ solutionVolume, solutionColor }: BeakerVesselProps) {
  // Beaker dimensions: Radius ~ 1.8, Height ~ 3.6, Bottom at -1.4 (shifted upward)
  const beakerRadius = 1.85;
  const beakerHeight = 3.6;
  const beakerBottom = -1.4;

  // Liquid height tracks volume: 100mL = height 1.8 (y from -1.4 to 0.4), max 250mL = height 3.0
  const liquidHeight = Math.min(3.0, 1.4 + (solutionVolume / 250) * 1.6);
  const liquidCenterY = beakerBottom + liquidHeight / 2;

  const liquidColorObj = useMemo(() => new THREE.Color(solutionColor), [solutionColor]);

  return (
    <group>
      {/* 1. Glass Beaker Outer Wall */}
      <mesh position={[0, beakerBottom + beakerHeight / 2, 0]}>
        <cylinderGeometry args={[beakerRadius, beakerRadius, beakerHeight, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#E0F2FE"
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.05}
          transmission={0.6}
          thickness={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Beaker Glass Base Rim */}
      <mesh position={[0, beakerBottom, 0]}>
        <cylinderGeometry args={[beakerRadius, beakerRadius, 0.08, 48]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.45}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Beaker Top Flange / Lip (Properly oriented horizontally around the mouth) */}
      <mesh position={[0, beakerBottom + beakerHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[beakerRadius, 0.05, 16, 64]} />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transparent
          opacity={0.65}
          roughness={0.1}
          metalness={0.1}
          transmission={0.5}
        />
      </mesh>

      {/* 2. Beaker Graduation Measurement Lines */}
      {[-0.6, 0.0, 0.6, 1.2].map((y, idx) => (
        <group key={idx} position={[0, y, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[beakerRadius - 0.02, beakerRadius, 48]} />
            <meshBasicMaterial color="#64748B" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <Text
            position={[beakerRadius - 0.05, 0.06, 0.3]}
            fontSize={0.11}
            color="#475569"
            fontWeight="bold"
            anchorX="right"
            anchorY="middle"
          >
            {`${(idx + 1) * 50} mL`}
          </Text>
        </group>
      ))}

      {/* 3. Liquid Solution Core */}
      <mesh position={[0, liquidCenterY, 0]}>
        <cylinderGeometry args={[beakerRadius - 0.03, beakerRadius - 0.03, liquidHeight, 36]} />
        <meshStandardMaterial
          color={liquidColorObj}
          transparent
          opacity={0.72}
          roughness={0.15}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Top Liquid Surface Meniscus */}
      <mesh position={[0, beakerBottom + liquidHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[beakerRadius - 0.03, 36]} />
        <meshStandardMaterial
          color={liquidColorObj}
          transparent
          opacity={0.88}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* 4. Realistic One-Piece pH Electrode Rod (Long Lab Probe) */}
      <group position={[beakerRadius - 0.42, 0.65, 0.2]} rotation={[0, 0, -0.2]}>
        {/* Main Probe Shaft - Extended length to protrude clearly above the beaker */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 3.2, 24]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.7} />
        </mesh>

        {/* Silver Joint Collar */}
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 24]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.15} metalness={0.9} />
        </mesh>

        {/* Glass Bulb Tip submerged in liquid */}
        <mesh position={[0, -1.0, 0]}>
          <sphereGeometry args={[0.095, 20, 20]} />
          <meshStandardMaterial
            color="#38BDF8"
            transparent
            opacity={0.9}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>

        {/* Smooth Rounded Cap at the top */}
        <mesh position={[0, 2.35, 0]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D MOLECULAR ION FIELD & SMOOTH BOUNCING DYNAMICS
// ----------------------------------------------------------------------------

interface IonFieldProps {
  ions: Ion3DData[];
  liquidHeight: number;
}

function IonField({ ions, liquidHeight }: IonFieldProps) {
  // Beaker inner collision cylinder radius = 1.35
  const maxRadialDist = 1.35;
  const bottomBound = -1.15;
  const topBound = -1.4 + liquidHeight - 0.35;
  const itemRefs = useRef<Map<string, THREE.Group>>(new Map());

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);

    for (let i = 0; i < ions.length; i++) {
      const ion = ions[i];
      const grp = itemRefs.current.get(ion.id);

      // Integration
      ion.pos.x += ion.vel.x * dt;
      ion.pos.y += ion.vel.y * dt;
      ion.pos.z += ion.vel.z * dt;

      ion.rot.x += ion.rotSpeed.x * dt;
      ion.rot.y += ion.rotSpeed.y * dt;
      ion.rot.z += ion.rotSpeed.z * dt;

      // Radial cylinder boundary check
      const r = Math.sqrt(ion.pos.x * ion.pos.x + ion.pos.z * ion.pos.z);
      if (r > maxRadialDist) {
        // Reflect velocity along radial normal
        const nx = ion.pos.x / r;
        const nz = ion.pos.z / r;
        const dot = ion.vel.x * nx + ion.vel.z * nz;
        ion.vel.x -= 2 * dot * nx;
        ion.vel.z -= 2 * dot * nz;
        ion.pos.x = nx * maxRadialDist;
        ion.pos.z = nz * maxRadialDist;
      }

      // Vertical bounds check (Bottom and liquid meniscus)
      if (ion.pos.y < bottomBound) {
        ion.pos.y = bottomBound;
        ion.vel.y = Math.abs(ion.vel.y);
      } else if (ion.pos.y > topBound) {
        ion.pos.y = topBound;
        ion.vel.y = -Math.abs(ion.vel.y);
      }

      // Update Three.js object matrix directly
      if (grp) {
        grp.position.set(ion.pos.x, ion.pos.y, ion.pos.z);
        grp.rotation.set(ion.rot.x, ion.rot.y, ion.rot.z);
      }
    }
  });

  return (
    <group>
      {ions.map((ion) => (
        <group
          key={ion.id}
          ref={(el) => {
            if (el) itemRefs.current.set(ion.id, el);
            else itemRefs.current.delete(ion.id);
          }}
          position={[ion.pos.x, ion.pos.y, ion.pos.z]}
          rotation={[ion.rot.x, ion.rot.y, ion.rot.z]}
        >
          {ion.type === "H3O" ? <IonH3O /> : <IonOH />}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export interface IonicEquilibriumPhGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export function IonicEquilibriumPhGamePage({
  difficulty = "level1",
  onExit,
}: IonicEquilibriumPhGamePageProps) {
  // Navigation: "mission" -> "instructions" -> "lab"
  const [introStep, setIntroStep] = useState<"mission" | "instructions" | "lab">("mission");
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>("");

  // --------------------------------------------------------------------------
  // CHEMICAL EQUILIBRIUM & PH STATE
  // Realistic Buffer-Assisted Neutralization System:
  // Starts with weak acid / buffer at pH 3.00 (e.g. 100 mL acetic acid/acetate buffer).
  // This allows smooth, realistic titration taking ~5 to 7 taps of 1 mL NaOH (or fine 0.2 mL tuning)
  // to reach neutral pH 7.00 without instantly jumping in a single tap!
  // --------------------------------------------------------------------------
  const [volume, setVolume] = useState<number>(100.0); // mL
  // Initial titration progress parameter: starts at -5.0 (acidic, pH = 3.00)
  // Each 1 mL of base adds +1.0 to progress; neutral equivalence point is at progress = 0.0 (pH = 7.00).
  const [titrationProgress, setTitrationProgress] = useState<number>(-5.0);

  // Selected reagent active tab: "acid" | "base" | "water"
  const [reagentType, setReagentType] = useState<"acid" | "base" | "water">("base");
  const [dosageVolume, setDosageVolume] = useState<number>(1.0); // mL per drop
  const [notification, setNotification] = useState<string | null>(null);

  // Target pH criteria
  const targetPH = 7.0;
  const tolerance = 0.3;

  // Calculate real-time pH and pOH smoothly based on titration progress & buffer curve
  const { currentPH, currentPOH, concH3O, concOH } = useMemo(() => {
    // Sigmoidal Henderson-Hasselbalch inspired smooth titration curve:
    // When progress = -5.0: pH ~ 3.00
    // When progress = -4.0: pH ~ 3.80
    // When progress = -3.0: pH ~ 4.45
    // When progress = -2.0: pH ~ 5.15
    // When progress = -1.0: pH ~ 6.00
    // When progress = 0.0:  pH = 7.00
    // When progress = +1.0: pH ~ 8.00
    // When progress = +2.0: pH ~ 8.85
    // When progress = +3.0: pH ~ 9.55
    // When progress = +5.0: pH ~ 11.00
    const x = titrationProgress;
    let ph: number;
    if (x === 0) {
      ph = 7.0;
    } else if (x > 0) {
      ph = 7.0 + 4.0 * (1 - Math.exp(-x * 0.28));
    } else {
      ph = 7.0 - 4.0 * (1 - Math.exp(x * 0.28));
    }

    const clampedPH = Number(Math.max(1.0, Math.min(13.5, ph)).toFixed(2));
    const clampedPOH = Number((14.0 - clampedPH).toFixed(2));
    const hConc = Math.pow(10, -clampedPH);
    const ohConc = Math.pow(10, -clampedPOH);

    return {
      currentPH: clampedPH,
      currentPOH: clampedPOH,
      concH3O: hConc,
      concOH: ohConc,
    };
  }, [titrationProgress]);

  const solutionColor = useMemo(() => getIndicatorColor(currentPH), [currentPH]);

  // Check victory condition (Target pH reached within allowed tolerance)
  const isTargetAchieved = Math.abs(currentPH - targetPH) <= tolerance;

  // Dynamic 3D Ion Population reflecting the current acid-base equilibrium
  const [ions, setIons] = useState<Ion3DData[]>([]);

  useEffect(() => {
    // Generate representative ion counts
    // When strongly acidic (pH ~ 3): 10 H3O+, 1 OH-
    // When neutral (pH ~ 7): 4 H3O+, 4 OH-
    // When strongly basic (pH ~ 11): 1 H3O+, 10 OH-
    let numH3O = 4;
    let numOH = 4;

    if (currentPH < 6.0) {
      numH3O = Math.min(12, Math.max(6, Math.round(14 - currentPH * 1.5)));
      numOH = Math.max(1, Math.round(currentPH / 3));
    } else if (currentPH > 8.0) {
      numOH = Math.min(12, Math.max(6, Math.round((currentPH - 4) * 1.3)));
      numH3O = Math.max(1, Math.round((14 - currentPH) / 3));
    }

    const newIons: Ion3DData[] = [];
    let idCounter = 1;

    for (let i = 0; i < numH3O; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.1;
      newIons.push({
        id: `H3O-${idCounter++}`,
        type: "H3O",
        pos: new THREE.Vector3(r * Math.cos(theta), -0.9 + Math.random() * 1.2, r * Math.sin(theta)),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
      });
    }

    for (let i = 0; i < numOH; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.1;
      newIons.push({
        id: `OH-${idCounter++}`,
        type: "OH",
        pos: new THREE.Vector3(r * Math.cos(theta), -0.9 + Math.random() * 1.2, r * Math.sin(theta)),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7),
        rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        rotSpeed: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
      });
    }

    setIons(newIons);
  }, [Math.round(currentPH * 2) / 2]); // Only re-spawn on notable pH increments

  // --------------------------------------------------------------------------
  // USER ACTIONS: ADD ACID, ADD BASE, DILUTE WITH WATER, RESET
  // --------------------------------------------------------------------------

  // Concentration of standard reagents: 0.1 M HCl, 0.1 M NaOH
  const reagentMolarity = 0.1; // M (mol/L)

  const handleAddReagent = () => {
    if (reagentType === "acid") {
      // Adding acid pushes progress towards acidic (negative)
      // With default 1.0 mL: each tap shifts progress by 1.0 (5-6 taps to cross from neutral to acidic)
      setTitrationProgress((prev) => Math.max(-10.0, prev - dosageVolume));
      setVolume((prev) => Math.min(250, prev + dosageVolume));
      setNotification(`➕ Added ${dosageVolume} mL of HCl (Acid)! Solution becomes more acidic.`);
    } else if (reagentType === "base") {
      // Adding base pushes progress towards basic (positive)
      // Starting from -5.0 (pH 3.00), 5 taps of 1.0 mL reach 0.0 (pH 7.00)
      setTitrationProgress((prev) => Math.min(10.0, prev + dosageVolume));
      setVolume((prev) => Math.min(250, prev + dosageVolume));
      setNotification(`➕ Added ${dosageVolume} mL of NaOH (Base)! Neutralizing excess acid.`);
    } else if (reagentType === "water") {
      // Diluting with pure water gently pulls progress towards neutral 0.0
      setTitrationProgress((prev) => prev * 0.85);
      setVolume((prev) => Math.min(250, prev + dosageVolume));
      setNotification(`💧 Added ${dosageVolume} mL of pure H₂O! Solution diluted towards neutral.`);
    }

    setTimeout(() => setNotification(null), 3500);
  };

  const handleCheckAnswer = () => {
    // Target is neutral pH within allowed tolerance
    if (isTargetAchieved) {
      setShowVictoryModal(true);
    } else {
      if (currentPH < targetPH - tolerance) {
        setIncorrectFeedback(
          `The solution is still too ACIDIC (pH ${currentPH.toFixed(2)}). You need to add Base (NaOH) or dilute with H₂O to neutralize it!`
        );
      } else {
        setIncorrectFeedback(
          `The solution is too BASIC (pH ${currentPH.toFixed(2)}). You overshot the neutral point! Add Acid (HCl) to bring it down to neutral equilibrium!`
        );
      }
      setShowIncorrectModal(true);
    }
  };

  const handleReset = () => {
    setVolume(100.0);
    setTitrationProgress(-5.0); // Reset to pH 3.00
    setReagentType("base");
    setDosageVolume(1.0);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
    setNotification("Reset to initial acidic solution (100 mL, pH = 3.00).");
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExitClick = () => {
    if (onExit) onExit();
    else window.history.back();
  };

  const liquidHeight = Math.min(3.2, 1.4 + (volume / 250) * 1.8);

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-2xl">
      {/* ──────────────────────────────────────────────────────────────────
          MAIN CONTAINER: Landscape Single Div
          ────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 0A: MISSION STATEMENT
            ══════════════════════════════════════════════════════════════════ */}
        {introStep === "mission" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            {/* Top Bar: Exit */}
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                title="Exit"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>EXIT</span>
              </button>
            </div>

            {/* Centered Single-Liner Mission Statement */}
            <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
                <span className="text-[#0284C7]">MISSION:</span> Balance the solution by adding measured Acid (HCl), Base (NaOH), or Diluting with H₂O to reach the neutral target pH!
              </h1>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIntroStep("instructions")}
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

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 0B: INSTRUCTIONS SCREEN (3 Guidance Cards)
            ══════════════════════════════════════════════════════════════════ */}
        {introStep === "instructions" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>EXIT</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
                <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>INSTRUCTIONS TO PLAY</span>
                </div>
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              </div>

              <div className="w-16" />
            </div>

            {/* 3 Step Guidance Cards */}
            <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">

                {/* Card 1: Reagents Addition */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Select Reagent &amp; Dose
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase tracking-wider">
                        Base • Acid • Water
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Choose between Base (NaOH), Acid (HCl), or Diluting with pure water. Pick coarse or fine volume and tap <strong>ADD</strong>.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/ionic_step1_reagents.png"
                      alt="Reagent Addition Dock"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Observe 3D Ions & Color Spectrum */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Observe Beaker Reaction
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider">
                        Ion Motion &amp; Color
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Watch ions interact dynamically inside the beaker as the universal indicator changes color with neutralization.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/ionic_step2_beaker.png"
                      alt="3D Beaker with Ions"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Reach Target pH */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Check Your Answer
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                        Target pH ~ 7.00
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Monitor the digital pH readout as you balance the solution, then click <strong>CHECK ANSWER</strong> to verify your result!
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/ionic_step3_phmeter.png"
                      alt="Digital pH Meter with Check Answer"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 pb-5 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIntroStep("mission")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setIntroStep("lab")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5 text-sky-200 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LAB TOP HEADER (Minimalist & Clean)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 pt-3 pb-1 shrink-0 z-20 bg-white">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1 h-7 sm:h-8 px-3 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>

            {/* Target Status Badge */}
            <div className="hidden xs:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <span className="text-slate-400 font-mono text-[11px]">GOAL:</span>
              <span className="font-mono text-emerald-700">Target pH = {targetPH.toFixed(2)} (±{tolerance.toFixed(2)})</span>
            </div>
          </div>

          {/* Explanation Button */}
          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span className="hidden sm:inline">EXPLANATION</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN 3D CANVAS VIEW
            ══════════════════════════════════════════════════════════════════ */}
        <div className="relative flex-1 w-full overflow-hidden bg-white">
          {/* Notification Banner */}
          {notification && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white font-semibold text-xs py-1 px-4 rounded-full shadow-md border border-slate-700 animate-in fade-in duration-150 max-w-lg text-center">
              {notification}
            </div>
          )}

          {/* Right Side Digital pH Meter & Evaluation HUD */}
          <div className="absolute top-3 right-3 z-20 w-52 sm:w-60 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-xl space-y-2.5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-sky-600" />
                Digital pH Meter
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {volume.toFixed(0)} mL
              </span>
            </div>

            {/* Large Digital pH Readout */}
            <div className="bg-slate-900 rounded-xl p-2.5 text-center shadow-inner">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                SOLUTION pH
              </div>
              <div
                className="text-3xl font-black font-mono tracking-tight transition-colors duration-300"
                style={{ color: solutionColor }}
              >
                {currentPH.toFixed(2)}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                pOH = {currentPOH.toFixed(2)}
              </div>
            </div>

            {/* Check Answer Button */}
            <div className="pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCheckAnswer}
                className="w-full py-2 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>CHECK ANSWER</span>
              </button>
            </div>
          </div>

          {/* Three.js Canvas */}
          <Canvas
            className="w-full h-full"
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0.45, 7.0], fov: 40 }}
          >
            <ambientLight intensity={1.15} />
            <directionalLight position={[4, 8, 4]} intensity={1.6} castShadow />
            <directionalLight position={[-4, -3, -3]} intensity={0.6} color="#BAE6FD" />

            <Suspense fallback={null}>
              {/* Shift the Beaker and Ions leftward into the open left-half of the screen */}
              <group position={[-1.2, 0, 0]}>
                {/* 3D Beaker and Universal Indicator Solution */}
                <BeakerVessel solutionVolume={volume} solutionColor={solutionColor} />

                {/* Bouncing Hydronium (H3O+) & Hydroxide (OH-) Ions */}
                <IonField ions={ions} liquidHeight={liquidHeight} />
              </group>
            </Suspense>

            <OrbitControls
              target={[-1.2, 0.45, 0]}
              enablePan={false}
              minDistance={4.5}
              maxDistance={9.5}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={Math.PI / 4}
            />
          </Canvas>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CONTROL DOCK (Add Acid, Add Base, Dilute Water)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full bg-white border-t border-slate-100 px-3 sm:px-6 py-3.5 z-30 shrink-0 flex justify-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl w-full">

            {/* Reagent Selector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setReagentType("base")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  reagentType === "base"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Base (NaOH)
              </button>

              <button
                type="button"
                onClick={() => setReagentType("acid")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  reagentType === "acid"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Acid (HCl)
              </button>

              <button
                type="button"
                onClick={() => setReagentType("water")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  reagentType === "water"
                    ? "bg-sky-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Dilute (H₂O)
              </button>
            </div>

            {/* Dosage Volume Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Volume:
              </span>
              {[0.2, 1.0].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDosageVolume(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    dosageVolume === v
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {v < 1 ? `${v} mL` : `${v.toFixed(0)} mL`}
                </button>
              ))}
            </div>

            {/* Action Buttons: Add Reagent Drop & Reset */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleAddReagent}
                className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider text-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                  reagentType === "base"
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                    : reagentType === "acid"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                    : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/30"
                }`}
              >
                <Droplets className="w-3.5 h-3.5 fill-current" />
                <span>ADD {dosageVolume} mL</span>
              </button>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            VICTORY / COMPLETION MODAL (Target pH 7 Reached!)
            ══════════════════════════════════════════════════════════════════ */}
        {showVictoryModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-200 flex items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  🎉 Challenge Completed!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Outstanding! You balanced the solution to <strong>pH {currentPH.toFixed(2)}</strong> (Neutral Equilibrium) with equal [H₃O⁺] and [OH⁻] ions!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-full font-black text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>PLAY AGAIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowVictoryModal(false);
                    setShowExplanationModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            INCORRECT ANSWER POPUP MODAL (Replay & Explanation Options)
            ══════════════════════════════════════════════════════════════════ */}
        {showIncorrectModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                <X className="w-7 h-7 stroke-[3]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Target pH Not Reached!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {incorrectFeedback}
                </p>
              </div>

              {/* Action Buttons: Replay & View Explanation */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => setShowIncorrectModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>TRY AGAIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowIncorrectModal(false);
                    setShowExplanationModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            EXPLANATION MODAL (Comprehensive Educational Reference)
            ══════════════════════════════════════════════════════════════════ */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 flex flex-col bg-white rounded-3xl sm:rounded-[32px] overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#0284C7]" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Ionic Equilibrium, pH &amp; Neutralization Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 space-y-4 sm:space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans w-full">
              
              {/* Section 1: The Two Key Ions in Water */}
              <div className="space-y-2 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                  1. THE TWO KEY IONS IN WATER
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Self-Ionization of Water
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Even pure water isn&apos;t just still molecules; a tiny fraction naturally splits in an equilibrium called <strong>Self-Ionization</strong>:
                </p>
                <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-2.5 rounded-xl border border-sky-200 shadow-xs">
                  2 H₂O ⇌ H₃O⁺ (Hydronium) + OH⁻ (Hydroxide)
                </div>
                <ul className="space-y-1.5 text-slate-600 text-xs sm:text-sm list-disc list-inside pt-1">
                  <li>
                    <strong className="text-rose-700 font-mono">H₃O⁺</strong> (Acid ion): More of this makes the liquid acidic (<span className="font-mono text-rose-700 font-bold">pH &lt; 7</span>, red/orange).
                  </li>
                  <li>
                    <strong className="text-blue-700 font-mono">OH⁻</strong> (Base ion): More of this makes the liquid basic (<span className="font-mono text-blue-700 font-bold">pH &gt; 7</span>, blue/purple).
                  </li>
                </ul>
              </div>

              {/* Section 2: The Constant Seesaw (Kw) */}
              <div className="space-y-2.5 bg-sky-50/70 p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                  2. THE CONSTANT SEESAW (Kw)
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Ionic Product Constant of Water
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  In any aqueous solution at 25 °C, the concentrations of these two ions always multiply to a fixed constant:
                </p>
                <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-3 rounded-xl border border-sky-200 shadow-xs">
                  Kw = [H₃O⁺] × [OH⁻] = 1.0 × 10⁻¹⁴
                </div>
                <ul className="space-y-1.5 text-slate-600 text-xs sm:text-sm list-disc list-inside pt-1">
                  <li>When <strong>[H₃O⁺]</strong> goes up, <strong>[OH⁻]</strong> must go down.</li>
                  <li>In pure neutral water, both are exactly equal: <span className="font-mono font-bold text-emerald-700">1.0 × 10⁻⁷ M</span>.</li>
                </ul>
              </div>

              {/* Section 3: What is pH & pOH? */}
              <div className="space-y-2.5 bg-sky-50/70 p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                  3. WHAT IS pH &amp; pOH?
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  The Logarithmic Acidity Scale
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Because ion concentrations are tiny decimals (like 0.0000001 M), we use a negative logarithmic scale:
                </p>
                <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-3 rounded-xl border border-sky-200 shadow-xs">
                  pH = −log₁₀[H₃O⁺] &nbsp;|&nbsp; pOH = −log₁₀[OH⁻] &nbsp;|&nbsp; pH + pOH = 14
                </div>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Each <strong>1 pH unit step is a 10× difference</strong>: pH 3 is 10× more acidic than pH 4, and 10,000× more acidic than pH 7.
                </p>

                {/* Indicator Table */}
                <div className="overflow-x-auto rounded-xl border border-sky-200 bg-white mt-2">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-sky-100/60 text-sky-900 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="px-3 py-2">pH Range</th>
                        <th className="px-3 py-2">Condition</th>
                        <th className="px-3 py-2">Dominant Ion</th>
                        <th className="px-3 py-2">Universal Indicator Color</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-100">
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold">1.0 – 3.0</td>
                        <td className="px-3 py-2 text-rose-700 font-bold">Strongly Acidic</td>
                        <td className="px-3 py-2 font-mono">[H₃O⁺] &gt;&gt; [OH⁻]</td>
                        <td className="px-3 py-2 text-rose-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block" />
                          Red / Deep Orange
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold">4.0 – 6.0</td>
                        <td className="px-3 py-2 text-amber-700 font-bold">Weakly Acidic</td>
                        <td className="px-3 py-2 font-mono">[H₃O⁺] &gt; [OH⁻]</td>
                        <td className="px-3 py-2 text-amber-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
                          Yellow / Light Green
                        </td>
                      </tr>
                      <tr className="bg-emerald-50/70">
                        <td className="px-3 py-2 font-mono font-bold text-emerald-800">7.00</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">Neutral</td>
                        <td className="px-3 py-2 font-mono text-emerald-800">[H₃O⁺] = [OH⁻]</td>
                        <td className="px-3 py-2 text-emerald-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                          Emerald Green
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold">8.0 – 10.0</td>
                        <td className="px-3 py-2 text-blue-700 font-bold">Weakly Basic</td>
                        <td className="px-3 py-2 font-mono">[OH⁻] &gt; [H₃O⁺]</td>
                        <td className="px-3 py-2 text-blue-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] inline-block" />
                          Cyan / Blue
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono font-bold">11.0 – 14.0</td>
                        <td className="px-3 py-2 text-purple-700 font-bold">Strongly Basic</td>
                        <td className="px-3 py-2 font-mono">[OH⁻] &gt;&gt; [H₃O⁺]</td>
                        <td className="px-3 py-2 text-purple-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] inline-block" />
                          Deep Violet
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: How the Game Mechanics Work */}
              <div className="space-y-2.5 bg-sky-50/70 p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                  4. HOW THE GAME MECHANICS WORK
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Neutralization in the Lab
                </h3>
                <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-3 rounded-xl border border-sky-200 shadow-xs">
                  H₃O⁺ (from Acid) + OH⁻ (from Base) ⟶ 2 H₂O (Neutral Water)
                </div>
                <ul className="space-y-2 text-slate-600 text-xs sm:text-sm list-disc list-inside pt-1">
                  <li>
                    <strong>Initial Solution (pH 3.00):</strong> The beaker starts with excess acid (H₃O⁺), showing an orange-red color.
                  </li>
                  <li>
                    <strong>Adding Base (NaOH):</strong> Each tap introduces OH⁻, which binds with and cancels out the H₃O⁺ ions, creating neutral water.
                  </li>
                  <li>
                    <strong>Reaching Equilibrium (pH 7.00):</strong> After 5–6 additions, all excess acid is neutralized. [H₃O⁺] equals [OH⁻], the solution turns emerald green, and the target is achieved!
                  </li>
                  <li>
                    <strong>Overshooting &amp; Acid Correction (HCl):</strong> Adding too much base causes OH⁻ to take over (pH 8–12, purple). Adding Acid (HCl) injects new H₃O⁺ to bring it back down to neutral 7.00.
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-center">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                RESUME SIMULATION
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default IonicEquilibriumPhGamePage;

