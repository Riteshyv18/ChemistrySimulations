"use client";

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles as SparklesIcon,
  RotateCcw,
  Undo2,
  CheckCircle2,
  HelpCircle,
  X,
  ArrowRight,
  Layers,
  Info,
  Atom,
  ChevronRight,
  Zap,
  Lock,
  Flame,
  Award,
  ChevronLeft,
  BookOpen,
  Target
} from 'lucide-react';

// ── 3D Atom & Orbital Renderers for Level 1 & Level 2 ──────────────────────────

// Hydrogen Atom (1s)
const HydrogenAtom3D = ({
  position,
  hasOrbital,
  label = "H",
  hideHtml = false
}: {
  position: [number, number, number];
  hasOrbital: boolean;
  label?: string;
  hideHtml?: boolean;
}) => {
  return (
    <group position={position}>
      {/* Central Nucleus */}
      <Sphere args={[0.3, 32, 32]}>
        <meshStandardMaterial color="#f1f5f9" emissive="#cbd5e1" emissiveIntensity={0.6} roughness={0.2} />
      </Sphere>
      {!hideHtml && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-slate-900 font-extrabold text-[11px] select-none bg-white/90 px-1.5 py-0.5 rounded-full shadow-md border border-slate-200">
            {label}
          </div>
        </Html>
      )}

      {/* 1s Orbital Cloud */}
      {hasOrbital && (
        <group>
          <Sphere args={[0.85, 32, 32]}>
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7e22ce"
              emissiveIntensity={0.5}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </Sphere>
          <Sphere args={[0.87, 16, 16]}>
            <meshBasicMaterial color="#d8b4fe" wireframe transparent opacity={0.2} />
          </Sphere>
        </group>
      )}
    </group>
  );
};

// Carbon Atom (sp²)
const CarbonAtom3D = ({
  position,
  hasP = false,
  isLeft = true,
  showHeadOn = true,
  showTopCH = false,
  showBottomCH = false,
  label = "C",
  hideHtml = false,
  piFormed = false
}: {
  position: [number, number, number];
  hasP?: boolean;
  isLeft?: boolean;
  showHeadOn?: boolean;
  showTopCH?: boolean;
  showBottomCH?: boolean;
  label?: string;
  hideHtml?: boolean;
  piFormed?: boolean;
}) => {
  const headOnAngle = isLeft ? 0 : Math.PI;
  const topCHAngle = isLeft ? (3 * Math.PI) / 4 : Math.PI / 4;
  const bottomCHAngle = isLeft ? (-3 * Math.PI) / 4 : -Math.PI / 4;

  return (
    <group position={position}>
      {/* Central Carbon Nucleus */}
      <Sphere args={[0.4, 32, 32]}>
        <meshStandardMaterial color="#334155" emissive="#1e293b" emissiveIntensity={0.8} roughness={0.3} metalness={0.8} />
      </Sphere>
      {!hideHtml && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-xs select-none bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full shadow-lg">
            {label}
          </div>
        </Html>
      )}

      {/* Head-on sp² Lobe (C-C σ) */}
      {showHeadOn && (
        <group position={[Math.cos(headOnAngle) * 0.9, Math.sin(headOnAngle) * 0.9, 0]} rotation={[0, 0, headOnAngle - Math.PI / 2]}>
          <Sphere args={[0.55, 24, 24]} scale={[0.65, 1.2, 0.65]}>
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Top C-H sp² Lobe */}
      {showTopCH && (
        <group position={[Math.cos(topCHAngle) * 0.9, Math.sin(topCHAngle) * 0.9, 0]} rotation={[0, 0, topCHAngle - Math.PI / 2]}>
          <Sphere args={[0.55, 24, 24]} scale={[0.65, 1.2, 0.65]}>
            <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Bottom C-H sp² Lobe */}
      {showBottomCH && (
        <group position={[Math.cos(bottomCHAngle) * 0.9, Math.sin(bottomCHAngle) * 0.9, 0]} rotation={[0, 0, bottomCHAngle - Math.PI / 2]}>
          <Sphere args={[0.55, 24, 24]} scale={[0.65, 1.2, 0.65]}>
            <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Unhybridized p Orbital (Perpendicular along Z-axis) */}
      {hasP && (
        <group>
          {/* Top p lobe */}
          <group position={[0, 0, 1.0]} scale={[0.55, 0.55, 1.1]}>
            <Sphere args={[0.6, 24, 24]}>
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} transparent opacity={0.75} />
            </Sphere>
          </group>
          {/* Bottom p lobe */}
          <group position={[0, 0, -1.0]} scale={[0.55, 0.55, 1.1]}>
            <Sphere args={[0.6, 24, 24]}>
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} transparent opacity={0.75} />
            </Sphere>
          </group>
        </group>
      )}

      {/* Parallel Pi (π) Overlap Cloud when Pi Bond Formed */}
      {piFormed && (
        <group>
          {/* Top Pi cloud overlap */}
          <group position={[0, 0, 1.0]}>
            <Cylinder args={[0.7, 0.7, isLeft ? 1.6 : 1.6, 32]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#f43f5e" emissive="#be123c" emissiveIntensity={0.9} transparent opacity={0.65} />
            </Cylinder>
          </group>
          {/* Bottom Pi cloud overlap */}
          <group position={[0, 0, -1.0]}>
            <Cylinder args={[0.7, 0.7, isLeft ? 1.6 : 1.6, 32]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#f43f5e" emissive="#be123c" emissiveIntensity={0.9} transparent opacity={0.65} />
            </Cylinder>
          </group>
        </group>
      )}
    </group>
  );
};

// ── Overlap Bond Visualization (Sigma & Pi Cloud) ─────────────────────────────
const BondOverlapVisualizer = ({
  level,
  step,
  isAligned,
  isBondFormed,
  ccSigmaFormed,
  chSigmaFormed,
  piFormed
}: {
  level: number;
  step: number;
  isAligned: boolean;
  isBondFormed: boolean;
  ccSigmaFormed: boolean;
  chSigmaFormed: boolean;
  piFormed: boolean;
}) => {
  if (level === 1) {
    // Level 1: H2 Sigma Bond
    return (
      <group>
        {/* Head-on Sigma Overlap Region */}
        {isBondFormed && (
          <group position={[0, 0, 0]}>
            {/* Central Overlap Lens */}
            <Sphere args={[0.9, 32, 32]} scale={[1.8, 0.95, 0.95]}>
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#0891b2"
                emissiveIntensity={1.0}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </Sphere>
            {/* Sparkles around bond */}
            <Sparkles count={25} scale={2.5} size={3} speed={0.4} color="#38bdf8" />
            {/* Internuclear Axis Line */}
            <Cylinder args={[0.04, 0.04, 3.2, 16]} rotation={[0, 0, Math.PI / 2]}>
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
            </Cylinder>
          </group>
        )}
      </group>
    );
  }

  // Level 2: C2H4 Ethene Double Bond (1 Sigma + 1 Pi)
  return (
    <group>
      {/* Central C-C Sigma (σ) Bond Overlap */}
      {ccSigmaFormed && (
        <group position={[0, 0, 0]}>
          <Sphere args={[0.7, 32, 32]} scale={[1.5, 0.75, 0.75]}>
            <meshStandardMaterial
              color="#06b6d4"
              emissive="#0891b2"
              emissiveIntensity={1.1}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </Sphere>
          <Cylinder args={[0.04, 0.04, 2.5, 16]} rotation={[0, 0, Math.PI / 2]}>
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.7} />
          </Cylinder>
        </group>
      )}

      {/* C-H Sigma (σ) Bonds Connection Lines (4 locations) */}
      {chSigmaFormed && (
        <group>
          {/* Top-Left H1-C1 */}
          <group position={[-1.825, 0.9, 0]} rotation={[0, 0, Math.atan2(1.8, -1.15) - Math.PI / 2]}>
            <Cylinder args={[0.06, 0.06, 2.15, 16]}>
              <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} transparent opacity={0.85} />
            </Cylinder>
            <Sparkles count={8} scale={1.2} size={2} speed={0.3} color="#f472b6" />
          </group>

          {/* Bottom-Left H2-C1 */}
          <group position={[-1.825, -0.9, 0]} rotation={[0, 0, Math.atan2(-1.8, -1.15) - Math.PI / 2]}>
            <Cylinder args={[0.06, 0.06, 2.15, 16]}>
              <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} transparent opacity={0.85} />
            </Cylinder>
            <Sparkles count={8} scale={1.2} size={2} speed={0.3} color="#f472b6" />
          </group>

          {/* Top-Right H3-C2 */}
          <group position={[1.825, 0.9, 0]} rotation={[0, 0, Math.atan2(1.8, 1.15) - Math.PI / 2]}>
            <Cylinder args={[0.06, 0.06, 2.15, 16]}>
              <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} transparent opacity={0.85} />
            </Cylinder>
            <Sparkles count={8} scale={1.2} size={2} speed={0.3} color="#f472b6" />
          </group>

          {/* Bottom-Right H4-C2 */}
          <group position={[1.825, -0.9, 0]} rotation={[0, 0, Math.atan2(-1.8, 1.15) - Math.PI / 2]}>
            <Cylinder args={[0.06, 0.06, 2.15, 16]}>
              <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.8} transparent opacity={0.85} />
            </Cylinder>
            <Sparkles count={8} scale={1.2} size={2} speed={0.3} color="#f472b6" />
          </group>
        </group>
      )}

      {/* Sidewise Pi (π) Bond Cloud (Top & Bottom parallel lobes along Z) */}
      {piFormed && (
        <group position={[0, 0, 0]}>
          <Sparkles count={30} scale={3.5} size={3} speed={0.5} color="#fb7185" />
        </group>
      )}
    </group>
  );
};

// ── 3D Scene Composition for Workshop ──────────────────────────────────────────
const WorkshopScene = ({
  level,
  step,
  placedAtomsCount,
  addedOrbitalsCount,
  isAligned,
  isBondFormed,
  ccSigmaFormed,
  chSigmaFormed,
  piFormed,
  placedCarbons,
  placedHydrogens,
  placedSp2Count,
  placedH1sCount,
  placedPCount,
  hideHtml
}: {
  level: number;
  step: number;
  placedAtomsCount: number;
  addedOrbitalsCount: number;
  isAligned: boolean;
  isBondFormed: boolean;
  ccSigmaFormed: boolean;
  chSigmaFormed: boolean;
  piFormed: boolean;
  placedCarbons: number;
  placedHydrogens: number;
  placedSp2Count: number;
  placedH1sCount: number;
  placedPCount: number;
  hideHtml: boolean;
}) => {
  // Positions for Level 1 (H2)
  const leftHPos: [number, number, number] = isAligned ? [-1.3, 0, 0] : [-2.5, 0, 0];
  const rightHPos: [number, number, number] = isAligned ? [1.3, 0, 0] : [2.5, 0, 0];

  // Positions for Level 2 (C2H4 Ethene)
  const leftCPos: [number, number, number] = [-1.25, 0, 0];
  const rightCPos: [number, number, number] = [1.25, 0, 0];

  const h1Pos: [number, number, number] = [-2.4, 1.8, 0];
  const h2Pos: [number, number, number] = [-2.4, -1.8, 0];
  const h3Pos: [number, number, number] = [2.4, 1.8, 0];
  const h4Pos: [number, number, number] = [2.4, -1.8, 0];

  return (
    <group>
      {/* Pedestal Base Ring Platform matching Easy challenge */}
      <group position={[0, -2.85, 0]}>
        <Cylinder args={[3.8, 4.2, 0.25, 64]}>
          <meshStandardMaterial color="#F1F5F9" roughness={0.3} metalness={0.1} />
        </Cylinder>
        <Torus args={[3.9, 0.04, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#38A9E8" emissive="#38A9E8" emissiveIntensity={0.6} />
        </Torus>
        <Torus args={[3.1, 0.03, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
        </Torus>
      </group>

      {/* Floating Ambient Sparkles */}
      <Sparkles count={45} scale={7} size={2.5} speed={0.4} color="#38A9E8" />

      {/* ── LEVEL 1 (H₂) RENDER ────────────────────────────────────────────── */}
      {level === 1 && (
        <group>
          {/* Left H Atom */}
          {placedAtomsCount >= 1 && (
            <HydrogenAtom3D
              position={leftHPos}
              hasOrbital={addedOrbitalsCount >= 1}
              label="H (A)"
              hideHtml={hideHtml}
            />
          )}

          {/* Right H Atom */}
          {placedAtomsCount >= 2 && (
            <HydrogenAtom3D
              position={rightHPos}
              hasOrbital={addedOrbitalsCount >= 2}
              label="H (B)"
              hideHtml={hideHtml}
            />
          )}

          {/* Overlap & Bond Visualizer */}
          <BondOverlapVisualizer
            level={level}
            step={step}
            isAligned={isAligned}
            isBondFormed={isBondFormed}
            ccSigmaFormed={ccSigmaFormed}
            chSigmaFormed={chSigmaFormed}
            piFormed={piFormed}
          />
        </group>
      )}

      {/* ── LEVEL 2 (C₂H₄) RENDER ──────────────────────────────────────────── */}
      {level === 2 && (
        <group>
          {/* Left Carbon Atom */}
          {placedCarbons >= 1 && (
            <CarbonAtom3D
              position={leftCPos}
              isLeft={true}
              hasP={placedPCount >= 1}
              showHeadOn={placedSp2Count >= 1}
              showTopCH={placedSp2Count >= 3}
              showBottomCH={placedSp2Count >= 4}
              label="C₁"
              hideHtml={hideHtml}
              piFormed={piFormed}
            />
          )}

          {/* Right Carbon Atom */}
          {placedCarbons >= 2 && (
            <CarbonAtom3D
              position={rightCPos}
              isLeft={false}
              hasP={placedPCount >= 2}
              showHeadOn={placedSp2Count >= 2}
              showTopCH={placedSp2Count >= 5}
              showBottomCH={placedSp2Count >= 6}
              label="C₂"
              hideHtml={hideHtml}
              piFormed={piFormed}
            />
          )}

          {/* 4 Hydrogen Atoms for Ethene */}
          {placedHydrogens >= 1 && (
            <HydrogenAtom3D position={h1Pos} hasOrbital={placedH1sCount >= 1} label="H₁" hideHtml={hideHtml} />
          )}
          {placedHydrogens >= 2 && (
            <HydrogenAtom3D position={h2Pos} hasOrbital={placedH1sCount >= 2} label="H₂" hideHtml={hideHtml} />
          )}
          {placedHydrogens >= 3 && (
            <HydrogenAtom3D position={h3Pos} hasOrbital={placedH1sCount >= 3} label="H₃" hideHtml={hideHtml} />
          )}
          {placedHydrogens >= 4 && (
            <HydrogenAtom3D position={h4Pos} hasOrbital={placedH1sCount >= 4} label="H₄" hideHtml={hideHtml} />
          )}

          {/* Overlap & Bond Visualizer */}
          <BondOverlapVisualizer
            level={level}
            step={step}
            isAligned={isAligned}
            isBondFormed={isBondFormed}
            ccSigmaFormed={ccSigmaFormed}
            chSigmaFormed={chSigmaFormed}
            piFormed={piFormed}
          />
        </group>
      )}
    </group>
  );
};

// ── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function OrbitalWorkshopGamePage({
  difficulty = 'medium'
}: {
  difficulty?: string;
}) {
  const router = useRouter();

  // Intro Target Screen State
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Active Level (1 = Level 1: H2, 2 = Level 2: C2H4)
  const [level, setLevel] = useState<1 | 2>(1);
  const [unlockedLevel2, setUnlockedLevel2] = useState<boolean>(false);

  // Step Progress State
  const [step, setStep] = useState<number>(1);
  const [placedAtomsCount, setPlacedAtomsCount] = useState<number>(0);
  const [addedOrbitalsCount, setAddedOrbitalsCount] = useState<number>(0);
  const [isAligned, setIsAligned] = useState<boolean>(false);
  const [isBondFormed, setIsBondFormed] = useState<boolean>(false);
  const [ccSigmaFormed, setCcSigmaFormed] = useState<boolean>(false);
  const [chSigmaFormed, setChSigmaFormed] = useState<boolean>(false);
  const [piFormed, setPiFormed] = useState<boolean>(false);

  // Level 2 Orbital Tracking States
  const [placedCarbons, setPlacedCarbons] = useState<number>(0);
  const [placedHydrogens, setPlacedHydrogens] = useState<number>(0);
  const [placedSp2Count, setPlacedSp2Count] = useState<number>(0);
  const [placedH1sCount, setPlacedH1sCount] = useState<number>(0);
  const [placedPCount, setPlacedPCount] = useState<number>(0);

  const [hintOpen, setHintOpen] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available Item Limits for Current Level
  const maxAtoms = level === 1 ? 2 : 6; // L1: 2 H | L2: 2 C + 4 H
  const maxOrbitals = level === 1 ? 2 : 6; // L1: 2 s | L2: 4 sp2 + 2 p

  // Place Atom Handler (Level 1 General)
  const handlePlaceAtom = () => {
    if (placedAtomsCount < maxAtoms) {
      const nextCount = placedAtomsCount + 1;
      setPlacedAtomsCount(nextCount);
      setErrorMessage(null);
      if (nextCount === maxAtoms && step === 1) {
        setStep(2);
      }
    }
  };

  // Place Carbon Handler (Level 2)
  const handlePlaceCarbon = () => {
    if (placedCarbons < 2) {
      const nextC = placedCarbons + 1;
      setPlacedCarbons(nextC);
      setPlacedAtomsCount(nextC + placedHydrogens);
      setErrorMessage(null);
      if (nextC === 2 && placedHydrogens === 4 && step === 1) {
        setStep(2);
      }
    }
  };

  // Place Hydrogen Handler (Level 2)
  const handlePlaceHydrogen = () => {
    if (level === 1) {
      handlePlaceAtom();
      return;
    }
    if (placedCarbons < 2) {
      setErrorMessage("Place 2 Carbon atoms first.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (placedHydrogens < 4) {
      const nextH = placedHydrogens + 1;
      setPlacedHydrogens(nextH);
      setPlacedAtomsCount(placedCarbons + nextH);
      setErrorMessage(null);
      if (placedCarbons === 2 && nextH === 4 && step === 1) {
        setStep(2);
      }
    }
  };

  // Add s Orbital Handler (Level 1)
  const handleAddOrbital = () => {
    if (placedAtomsCount < maxAtoms) {
      setErrorMessage("Place two Hydrogen atoms in the scene first.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (addedOrbitalsCount < maxOrbitals) {
      const nextCount = addedOrbitalsCount + 1;
      setAddedOrbitalsCount(nextCount);
      setErrorMessage(null);
      if (nextCount === maxOrbitals && step === 2) {
        setStep(3);
      }
    }
  };

  // Add sp² Orbital Handler (Level 2 - Carbon)
  const handleAddSp2Orbital = () => {
    if (step < 2) {
      setErrorMessage("Place all Carbon & Hydrogen atoms first.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (step === 2) {
      if (placedSp2Count < 2) {
        const nextCount = placedSp2Count + 1;
        setPlacedSp2Count(nextCount);
        setAddedOrbitalsCount(nextCount);
        setErrorMessage(null);
        if (nextCount === 2) {
          setIsAligned(true);
        }
      }
    } else if (step === 3) {
      if (placedSp2Count < 6) {
        const nextCount = placedSp2Count + 1;
        setPlacedSp2Count(nextCount);
        setAddedOrbitalsCount(nextCount + placedH1sCount);
        setErrorMessage(null);
      } else {
        setErrorMessage("All 6 sp² orbitals have been placed.");
        setTimeout(() => setErrorMessage(null), 3500);
      }
    }
  };

  // Add 1s Orbital Handler (Level 2 - Hydrogen)
  const handleAddH1sOrbital = () => {
    if (step < 3) {
      setErrorMessage("Form the C–C σ bond first.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (step === 3) {
      if (placedH1sCount < 4) {
        const nextCount = placedH1sCount + 1;
        setPlacedH1sCount(nextCount);
        setAddedOrbitalsCount(placedSp2Count + nextCount);
        setErrorMessage(null);
      } else {
        setErrorMessage("All 4 Hydrogen 1s orbitals have been placed.");
        setTimeout(() => setErrorMessage(null), 3500);
      }
    } else if (step === 4) {
      setErrorMessage("Hydrogen 1s orbitals are already used. Use p orbitals for π bond.");
      setTimeout(() => setErrorMessage(null), 3500);
    }
  };

  // Add p Orbital Handler (Level 2 - Carbon)
  const handleAddPOrbital = () => {
    if (step < 4) {
      setErrorMessage("Complete all σ bonds first before adding p orbitals.");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    if (step === 4) {
      if (placedPCount < 2) {
        const nextCount = placedPCount + 1;
        setPlacedPCount(nextCount);
        setAddedOrbitalsCount(placedSp2Count + placedH1sCount + nextCount);
        setErrorMessage(null);
        if (nextCount === 2) {
          setIsAligned(true);
        }
      } else {
        setErrorMessage("All 2 p orbitals have been placed.");
        setTimeout(() => setErrorMessage(null), 3500);
      }
    }
  };

  // Align Handler
  const handleAlign = () => {
    if (level === 1) {
      if (addedOrbitalsCount < maxOrbitals) {
        setErrorMessage("Add 1s orbitals to both Hydrogen atoms before aligning.");
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
      setIsAligned(true);
      setErrorMessage(null);
      if (step === 3) setStep(4);
    } else if (level === 2) {
      if (step === 2) {
        if (placedSp2Count < 2) {
          setErrorMessage("Add 2 sp² orbitals for Carbon atoms before aligning.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setIsAligned(true);
        setErrorMessage(null);
      } else if (step === 3) {
        if (placedSp2Count < 6 || placedH1sCount < 4) {
          setErrorMessage("Add remaining 4 sp² orbitals and 4 H 1s orbitals before aligning.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setIsAligned(true);
        setErrorMessage(null);
      } else if (step === 4) {
        if (placedPCount < 2) {
          setErrorMessage("Add 2 p orbitals before aligning.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setIsAligned(true);
        setErrorMessage(null);
      }
    }
  };

  // Form Bond Handler
  const handleFormBond = () => {
    if (level === 1) {
      if (!isAligned) {
        setErrorMessage("Align the orbitals first before forming the bond.");
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
      setIsBondFormed(true);
      setErrorMessage(null);
      setUnlockedLevel2(true);
    } else if (level === 2) {
      if (step === 2) {
        if (placedSp2Count < 2) {
          setErrorMessage("Add 2 sp² orbitals for Carbon atoms first.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setCcSigmaFormed(true);
        setIsAligned(false);
        setStep(3);
        setErrorMessage(null);
      } else if (step === 3) {
        if (placedSp2Count < 6 || placedH1sCount < 4) {
          setErrorMessage("Add 4 remaining sp² orbitals and 4 H 1s orbitals for C–H bonds first.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setChSigmaFormed(true);
        setIsAligned(false);
        setStep(4);
        setErrorMessage(null);
      } else if (step === 4) {
        if (placedPCount < 2) {
          setErrorMessage("Add 2 unhybridized p orbitals first.");
          setTimeout(() => setErrorMessage(null), 3500);
          return;
        }
        setPiFormed(true);
        setIsBondFormed(true);
        setErrorMessage(null);
      }
    }
  };

  // Reset Workshop State
  const handleReset = () => {
    setStep(1);
    setPlacedAtomsCount(0);
    setAddedOrbitalsCount(0);
    setPlacedCarbons(0);
    setPlacedHydrogens(0);
    setPlacedSp2Count(0);
    setPlacedH1sCount(0);
    setPlacedPCount(0);
    setIsAligned(false);
    setIsBondFormed(false);
    setCcSigmaFormed(false);
    setChSigmaFormed(false);
    setPiFormed(false);
    setErrorMessage(null);
  };

  // Revert / Undo One Step Back
  const handleRevertStep = () => {
    setErrorMessage(null);

    // If completion modal / final bond formed is active
    if (showCompletionModal || isBondFormed) {
      setShowCompletionModal(false);
      setIsBondFormed(false);
      if (level === 2) {
        setPiFormed(false);
      }
      return;
    }

    if (level === 1) {
      if (step === 4) {
        setStep(3);
        setIsAligned(false);
      } else if (step === 3) {
        if (isAligned) {
          setIsAligned(false);
        } else {
          setStep(2);
        }
      } else if (step === 2) {
        if (addedOrbitalsCount > 0) {
          setAddedOrbitalsCount(prev => prev - 1);
        } else {
          setStep(1);
        }
      } else if (step === 1) {
        if (placedAtomsCount > 0) {
          setPlacedAtomsCount(prev => prev - 1);
        }
      }
    } else {
      // Level 2 (C2H4)
      if (step === 4) {
        if (placedPCount > 0) {
          setPlacedPCount(prev => prev - 1);
        } else {
          setChSigmaFormed(false);
          setStep(3);
        }
      } else if (step === 3) {
        if (chSigmaFormed) {
          setChSigmaFormed(false);
        } else if (placedH1sCount > 0) {
          setPlacedH1sCount(prev => prev - 1);
        } else if (placedSp2Count > 2) {
          setPlacedSp2Count(prev => prev - 1);
        } else {
          setCcSigmaFormed(false);
          setStep(2);
        }
      } else if (step === 2) {
        if (ccSigmaFormed) {
          setCcSigmaFormed(false);
        } else if (placedSp2Count > 0) {
          setPlacedSp2Count(prev => prev - 1);
        } else {
          setStep(1);
        }
      } else if (step === 1) {
        if (placedHydrogens > 0) {
          setPlacedHydrogens(prev => prev - 1);
          setPlacedAtomsCount(prev => Math.max(0, prev - 1));
        } else if (placedCarbons > 0) {
          setPlacedCarbons(prev => prev - 1);
          setPlacedAtomsCount(prev => Math.max(0, prev - 1));
        }
      }
    }
  };

  // Switch Level
  const handleSwitchLevel = (lvl: 1 | 2) => {
    if (lvl === 2 && !unlockedLevel2) {
      setErrorMessage("Complete Level 1 (H₂) first to unlock Level 2 (C₂H₄).");
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }
    setLevel(lvl);
    setStep(1);
    setPlacedAtomsCount(0);
    setAddedOrbitalsCount(0);
    setPlacedCarbons(0);
    setPlacedHydrogens(0);
    setPlacedSp2Count(0);
    setPlacedH1sCount(0);
    setPlacedPCount(0);
    setIsAligned(false);
    setIsBondFormed(false);
    setCcSigmaFormed(false);
    setChSigmaFormed(false);
    setPiFormed(false);
    setErrorMessage(null);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, itemType: string) => {
    e.dataTransfer.setData('text/plain', itemType);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemType = e.dataTransfer.getData('text/plain');
    if (itemType.includes('carbon-atom')) {
      handlePlaceCarbon();
    } else if (itemType.includes('hydrogen-atom')) {
      handlePlaceHydrogen();
    } else if (itemType.includes('sp2')) {
      handleAddSp2Orbital();
    } else if (itemType.includes('h1s') || itemType.includes('s-orbital')) {
      handleAddH1sOrbital();
    } else if (itemType.includes('p-orbital')) {
      handleAddPOrbital();
    } else if (itemType.includes('atom')) {
      handlePlaceAtom();
    } else if (itemType.includes('orbital')) {
      handleAddOrbital();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-6 gap-2 sm:gap-4">
      {/* ── INTRO MISSION TARGET OVERLAY VIEW (COVERS FULL PAGE CONTAINER WITH BLUR) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Breadcrumb Header Bar */}
          <div className="w-full flex items-center justify-between text-xs text-[#64748B] z-10 shrink-0">
            <div className="flex items-center gap-2 font-medium drop-shadow-sm">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
              </button>
              <span>Chemistry</span>
              <span>›</span>
              <span>Chemical Bonding</span>
              <span>›</span>
              <span>Hybridization & Orbital Overlap</span>
              <span>›</span>
              <span className="text-[#2563EB] font-semibold">Challenge (medium)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/30 uppercase tracking-wider">
                MEDIUM
              </span>
              <div className="flex items-center gap-1.5 text-[#22C55E] font-mono text-[11px] bg-white border border-[#22C55E]/30 px-3 py-1 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span>LIVE 3D</span>
              </div>
            </div>
          </div>

          {/* Central Target Text & Start Mission Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2">
            <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
              HYBRIDIZATION & ORBITAL OVERLAP
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Construct & Overlap Orbitals for H₂ (Level 1) & C₂H₄ (Level 2)
            </h1>

            <div className="pt-1 sm:pt-4">
              <button
                onClick={() => setGameStarted(true)}
                className="px-6 py-2 sm:px-8 sm:py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg border border-blue-400 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                START MISSION
              </button>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="w-full text-center text-[10px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
            Click Start Mission to launch the single canvas orbital workshop
          </div>
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER ────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Back Button */}
        <Link
          href="/chemistry/chemical-bonding-molecular-structure/hybridization-orbital-overlap"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 font-bold text-xs shadow-sm transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-[#64748B]" />
          <span>Back</span>
        </Link>

        {/* Step Indicator & Level Switcher */}
        <div className="flex items-center gap-2">
          {/* Level Switcher */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center gap-1 shadow-sm">
            <button
              onClick={() => handleSwitchLevel(1)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                level === 1
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-200" />
              <span>Level 1: H₂</span>
            </button>

            <button
              onClick={() => handleSwitchLevel(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                level === 2
                  ? 'bg-purple-600 text-white shadow-md'
                  : unlockedLevel2
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 cursor-not-allowed'
              }`}
            >
              {unlockedLevel2 ? (
                <span className="w-2 h-2 rounded-full bg-purple-200" />
              ) : (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
              <span>Level 2: C₂H₄</span>
            </button>
          </div>

          {/* Step Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${step >= 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
              <span>1. Atoms</span>
              {step > 1 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${step >= 2 ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-400'}`}>
              <span>2. {level === 1 ? 'Orbitals' : 'C–C σ'}</span>
              {(step > 2 || ccSigmaFormed) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${step >= 3 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
              <span>3. {level === 1 ? 'Align' : 'C–H σ'}</span>
              {(step > 3 || chSigmaFormed) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${step >= 4 || (level === 1 && step === 4) ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-400'}`}>
              <span>4. {level === 1 ? 'Bond' : 'π Bond'}</span>
              {(isBondFormed || piFormed) && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
          </div>
        </div>

        {/* Action Controls Top Right */}
        <div className="flex items-center gap-2">
          {/* Explanation Button */}
          <button
            onClick={() => setShowCompletionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Explanation</span>
          </button>

          <button
            onClick={handleRevertStep}
            title="Undo Step"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition-all flex items-center gap-1 font-bold text-xs"
          >
            <Undo2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={handleReset}
            title="Reset Workshop"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── MAIN 3D WORKSHOP CANVAS ────────────────────────────────────── */}
      <main
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex-1 w-full relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-inner z-10 min-h-[350px]"
      >
        <div className="w-full h-full">
          <Canvas camera={{ position: [0, 2.2, 11.5], fov: 45 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 10, 7]} intensity={1.3} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a855f7" />
            <pointLight position={[0, 4, 0]} intensity={1.0} color="#06b6d4" />

            <WorkshopScene
              level={level}
              step={step}
              placedAtomsCount={placedAtomsCount}
              addedOrbitalsCount={addedOrbitalsCount}
              isAligned={isAligned}
              isBondFormed={isBondFormed}
              ccSigmaFormed={ccSigmaFormed}
              chSigmaFormed={chSigmaFormed}
              piFormed={piFormed}
              placedCarbons={placedCarbons}
              placedHydrogens={placedHydrogens}
              placedSp2Count={placedSp2Count}
              placedH1sCount={placedH1sCount}
              placedPCount={placedPCount}
              hideHtml={showCompletionModal}
            />

            <OrbitControls enablePan={true} enableZoom={true} minDistance={4} maxDistance={20} />
          </Canvas>
        </div>

        {/* Error Toast Banner */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md flex items-center gap-2 animate-shake font-medium">
            <Info className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Floating Top-Right Bond Shapes Reference Guide Card */}
        {!showCompletionModal && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 border border-slate-200 rounded-2xl p-3 shadow-xl backdrop-blur-md max-w-[260px] w-full flex flex-col gap-2 animate-in fade-in zoom-in-95 text-[#1E293B]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#2563EB] uppercase tracking-wider">
                <SparklesIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Bond Shapes Guide</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                {level === 1 ? 'σ Only' : '1σ + 1π'}
              </span>
            </div>

            {/* Sigma (σ) Shape Diagram */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col gap-1">
              <div className="text-[10px] font-bold text-blue-900 flex items-center justify-between">
                <span>σ Bond (Head-on)</span>
                <span className="text-[8.5px] font-mono text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">End-to-End</span>
              </div>
              <svg viewBox="0 0 210 48" className="w-full h-11 rounded-lg bg-white border border-slate-200">
                <line x1="12" y1="24" x2="198" y2="24" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                <ellipse cx="72" cy="24" rx="34" ry="13" fill="#0891b2" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="1.3" />
                <ellipse cx="138" cy="24" rx="34" ry="13" fill="#0891b2" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="1.3" />
                <ellipse cx="105" cy="24" rx="17" ry="13" fill="#38bdf8" fillOpacity="0.8" stroke="#0284c7" strokeWidth="1.6" />
                <circle cx="48" cy="24" r="3.5" fill="#1e293b" />
                <circle cx="162" cy="24" r="3.5" fill="#1e293b" />
                <text x="48" y="41" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">C/H</text>
                <text x="162" y="41" fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold">C/H</text>
                <text x="105" y="13" fontSize="8" fill="#0284c7" textAnchor="middle" fontWeight="bold">σ Overlap</text>
              </svg>
            </div>

            {/* Pi (π) Shape Diagram (Level 2) */}
            {level === 2 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col gap-1">
                <div className="text-[10px] font-bold text-rose-900 flex items-center justify-between">
                  <span>π Bond (Sidewise)</span>
                  <span className="text-[8.5px] font-mono text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">Parallel p</span>
                </div>
                <svg viewBox="0 0 210 56" className="w-full h-12 rounded-lg bg-white border border-slate-200">
                  <line x1="12" y1="28" x2="198" y2="28" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                  <ellipse cx="64" cy="13" rx="8" ry="10" fill="#be123c" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.1" />
                  <ellipse cx="64" cy="43" rx="8" ry="10" fill="#be123c" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.1" />
                  <ellipse cx="146" cy="13" rx="8" ry="10" fill="#be123c" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.1" />
                  <ellipse cx="146" cy="43" rx="8" ry="10" fill="#be123c" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.1" />
                  <path d="M 58 12 Q 105 2 152 12 Q 105 22 58 12 Z" fill="#f43f5e" fillOpacity="0.8" stroke="#e11d48" strokeWidth="1.3" />
                  <path d="M 58 44 Q 105 34 152 44 Q 105 54 58 44 Z" fill="#f43f5e" fillOpacity="0.8" stroke="#e11d48" strokeWidth="1.3" />
                  <circle cx="64" cy="28" r="3" fill="#1e293b" />
                  <circle cx="146" cy="28" r="3" fill="#1e293b" />
                  <text x="105" y="13" fontSize="8" fill="#be123c" textAnchor="middle" fontWeight="bold">Top π Cloud</text>
                  <text x="105" y="50" fontSize="8" fill="#be123c" textAnchor="middle" fontWeight="bold">Bottom π Cloud</text>
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Floating Success Notification inside Canvas when bond formed */}
        {gameStarted && isBondFormed && !showCompletionModal && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-500 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 max-w-sm w-full">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-extrabold text-white">
                {level === 1 ? "σ Bond Created! (H₂)" : "1σ + 1π Bonds Created! (C₂H₄)"}
              </h4>
              <p className="text-[10px] text-emerald-100 font-medium">
                {level === 1 ? "Hydrogen molecule complete!" : "Ethene double bond structure complete!"}
              </p>
            </div>
            {level === 1 ? (
              <button
                onClick={() => handleSwitchLevel(2)}
                className="bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs px-3 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>Next Level</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setShowCompletionModal(true)}
                className="bg-white text-purple-800 hover:bg-purple-50 font-extrabold text-xs px-3 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>View Theory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM DOCK LINE & ITEM PALETTE ───────────────────────────── */}
      <footer className="w-full bg-white border border-slate-200 rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl shrink-0 z-20">
        {/* Target Instruction Pill */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] font-extrabold text-xs shadow-sm">
            <Target className="w-4 h-4 text-[#2563EB]" />
            <span>
              TARGET: {level === 1
                ? (step === 1 ? "Place 2 H Atoms" : step === 2 ? "Add 2 1s Orbitals" : step === 3 ? "Align Orbitals" : "Form σ Bond")
                : (step === 1 ? "Place 2 C & 4 H Atoms" : step === 2 ? "Add sp² for C–C σ" : step === 3 ? "Add sp² & 1s for C–H σ" : "Add p for π Bond")
              }
            </span>
          </div>

          {/* Action Trigger in Bottom Bar */}
          {!isAligned && step >= 2 && !isBondFormed && (
            <button
              onClick={handleAlign}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1 cursor-pointer"
            >
              <span>Align Orbitals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {(isAligned || level === 2) && !isBondFormed && step >= 2 && (
            <button
              onClick={handleFormBond}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-1.5 rounded-xl transition-all shadow-md animate-pulse flex items-center gap-1 cursor-pointer"
            >
              <span>
                {level === 1
                  ? 'Form Bond ✨'
                  : step === 2
                    ? 'Form C–C σ Bond ✨'
                    : step === 3
                      ? 'Form C–H σ Bonds ✨'
                      : 'Form π Bond ✨'}
              </span>
            </button>
          )}
        </div>

        {/* Drag & Drop Palette */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
          {level === 1 ? (
            <>
              {/* Level 1: Hydrogen Atom */}
              <div
                draggable={placedAtomsCount < 2}
                onDragStart={(e) => handleDragStart(e, 'hydrogen-atom')}
                onClick={handlePlaceAtom}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  placedAtomsCount < 2
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white font-extrabold text-[11px] flex items-center justify-center">
                  H
                </div>
                <div className="text-xs font-extrabold text-[#1E293B]">Hydrogen Atom</div>
                <span className="text-[9.5px] font-mono bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{2 - placedAtomsCount}
                </span>
              </div>

              {/* Level 1: s Orbital */}
              <div
                draggable={addedOrbitalsCount < 2}
                onDragStart={(e) => handleDragStart(e, 's-orbital')}
                onClick={handleAddOrbital}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  addedOrbitalsCount < 2
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                  s
                </div>
                <div className="text-xs font-extrabold text-[#1E293B]">s Orbital</div>
                <span className="text-[9.5px] font-mono bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{2 - addedOrbitalsCount}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Level 2: Carbon Atom */}
              <div
                draggable={step === 1 && placedCarbons < 2}
                onDragStart={(e) => handleDragStart(e, 'carbon-atom')}
                onClick={handlePlaceCarbon}
                className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  step === 1 && placedCarbons < 2
                    ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-700 text-white font-extrabold text-[10px] flex items-center justify-center">
                  C
                </div>
                <div className="text-xs font-extrabold">Carbon</div>
                <span className="text-[9px] font-mono bg-slate-600 text-white px-1.5 py-0.5 rounded-md font-bold">
                  ×{Math.max(0, 2 - placedCarbons)}
                </span>
              </div>

              {/* Level 2: Hydrogen Atom */}
              <div
                draggable={step === 1 && placedCarbons === 2 && placedHydrogens < 4}
                onDragStart={(e) => handleDragStart(e, 'hydrogen-atom')}
                onClick={handlePlaceHydrogen}
                className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  step === 1 && placedCarbons === 2 && placedHydrogens < 4
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                  H
                </div>
                <div className="text-xs font-extrabold">Hydrogen</div>
                <span className="text-[9px] font-mono bg-blue-200 text-blue-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{Math.max(0, 4 - placedHydrogens)}
                </span>
              </div>

              {/* Level 2: Carbon sp² Orbital */}
              <div
                draggable={(step === 2 && placedSp2Count < 2) || (step === 3 && placedSp2Count < 6)}
                onDragStart={(e) => handleDragStart(e, 'sp2-orbital')}
                onClick={handleAddSp2Orbital}
                className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  ((step === 2 && placedSp2Count < 2) || (step === 3 && placedSp2Count < 6))
                    ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-900'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[9.5px] flex items-center justify-center">
                  sp²
                </div>
                <div className="text-xs font-extrabold">sp² Orbital</div>
                <span className="text-[9px] font-mono bg-cyan-200 text-cyan-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{Math.max(0, 6 - placedSp2Count)}
                </span>
              </div>

              {/* Level 2: Hydrogen 1s Orbital */}
              <div
                draggable={step === 3 && placedH1sCount < 4}
                onDragStart={(e) => handleDragStart(e, 'h1s-orbital')}
                onClick={handleAddH1sOrbital}
                className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  step === 3 && placedH1sCount < 4
                    ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[9.5px] flex items-center justify-center">
                  1s
                </div>
                <div className="text-xs font-extrabold">1s Orbital</div>
                <span className="text-[9px] font-mono bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{Math.max(0, 4 - placedH1sCount)}
                </span>
              </div>

              {/* Level 2: Carbon p Orbital */}
              <div
                draggable={step === 4 && placedPCount < 2}
                onDragStart={(e) => handleDragStart(e, 'p-orbital')}
                onClick={handleAddPOrbital}
                className={`px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm ${
                  step === 4 && placedPCount < 2
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
                    : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                  p
                </div>
                <div className="text-xs font-extrabold">p Orbital</div>
                <span className="text-[9px] font-mono bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded-md font-bold">
                  ×{Math.max(0, 2 - placedPCount)}
                </span>
              </div>
            </>
          )}
        </div>
      </footer>

      {/* ── COMPLETION & THEORY MODAL DIALOG ───────────────────────────── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-auto text-[#1E293B]">
            <button
              onClick={() => setShowCompletionModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B]">
                  Level {level} Theory & Key Concepts 📚
                </h2>
                <p className="text-xs text-[#64748B] font-medium">
                  {level === 1 ? 'Hydrogen (H₂) Sigma Bond Principles' : 'Ethene (C₂H₄) σ & π Overlap Principles'}
                </p>
              </div>
            </div>

            {/* Theory Content Summary */}
            <div className="space-y-3 mb-6">
              {/* Target Info Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Target Completed</span>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {level === 1 ? 'Single σ Bond' : 'Double Bond (1σ + 1π)'}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-[#1E293B]">
                  {level === 1 ? 'H₂ (Hydrogen Molecule)' : 'C₂H₄ (Ethene Molecule)'}
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#1E293B] border-t border-slate-200 pt-2 font-mono">
                  {level === 1 ? (
                    <>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">Orbital Overlap:</span>
                        <span className="text-blue-700 font-bold">1s – 1s</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">Overlap Type:</span>
                        <span className="text-purple-700 font-bold">Head-on</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">C–C σ Bond:</span>
                        <span className="text-blue-700 font-bold">sp² – sp²</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">C–C π Bond:</span>
                        <span className="text-rose-700 font-bold">p – p (sidewise)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">C–H σ Bonds:</span>
                        <span className="text-purple-700 font-bold">4 × (sp² – 1s)</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[#64748B] block text-[10px]">Total Bonds:</span>
                        <span className="text-emerald-700 font-bold">5 σ + 1 π</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Key Concept Theory Explanation */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-purple-700 text-xs font-bold uppercase tracking-wider">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Key Concept & Theory</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#1E293B]">
                  {level === 1 ? 'Sigma (σ) Bond Formation' : 'Sigma (σ) & Pi (π) Bonding Principles'}
                </h4>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {level === 1
                    ? "A sigma (σ) bond is formed by the direct end-to-end overlap of two atomic orbitals along the internuclear axis. In H₂, two spherical 1s orbitals overlap head-on to form a strong single covalent bond."
                    : "A carbon-carbon double bond in C₂H₄ consists of one strong σ bond (sp²-sp² head-on overlap) and one π bond (sidewise overlap of parallel unhybridized 2p orbitals above and below the molecular plane)."}
                </p>

                <div className="space-y-1.5 text-xs font-mono text-[#1E293B] bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>σ bond:</strong> Head-on overlap along internuclear axis</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span><strong>π bond:</strong> Sidewise overlap of parallel p-orbitals</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span><strong>C=C Double Bond:</strong> 1 σ bond + 1 π bond</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              {level === 1 ? (
                <>
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      handleReset();
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1E293B] py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Replay Level 1
                  </button>

                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      handleSwitchLevel(2);
                    }}
                    className="flex-1 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Continue to Level 2 (C₂H₄)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowCompletionModal(false);
                      handleReset();
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1E293B] py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Replay Level 2
                  </button>

                  <Link
                    href="/chemistry/chemical-bonding-molecular-structure/hybridization-orbital-overlap"
                    className="flex-1 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                  >
                    <span>Continue to Challenge 3 →</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
