"use client";

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html, Sparkles, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import {
  Sparkles as SparklesIcon,
  RotateCcw,
  CheckCircle2,
  X,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Play
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

// ── 3D Atom & Orbital Renderers for Level 2 (C₂H₄ Ethylene) ──────────────────

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
      {/* Central 3D Hydrogen Nucleus (Big, 3D Shaded Sphere) */}
      <Sphere args={[0.44, 32, 32]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.45}
        />
      </Sphere>
      {/* Specular Fresnel highlight shell */}
      <Sphere args={[0.45, 24, 24]}>
        <meshStandardMaterial
          color="#bfdbfe"
          emissive="#60a5fa"
          emissiveIntensity={0.12}
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={0.35}
        />
      </Sphere>
      {!hideHtml && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-xs select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-sans pointer-events-none tracking-wide">
            {label}
          </div>
        </Html>
      )}

      {/* 1s Orbital Cloud */}
      {hasOrbital && (
        <group>
          <Sphere args={[0.95, 32, 32]}>
            <meshStandardMaterial
              color="#a855f7"
              emissive="#7e22ce"
              emissiveIntensity={0.45}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </Sphere>
          <Sphere args={[0.97, 16, 16]}>
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
      {/* Central 3D Carbon Nucleus (Big, 3D Shaded Sphere) */}
      <Sphere args={[0.58, 32, 32]}>
        <meshStandardMaterial
          color="#6366f1"
          emissive="#312e81"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.45}
        />
      </Sphere>
      {/* Specular Fresnel highlight shell */}
      <Sphere args={[0.59, 24, 24]}>
        <meshStandardMaterial
          color="#c7d2fe"
          emissive="#818cf8"
          emissiveIntensity={0.12}
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={0.35}
        />
      </Sphere>
      {!hideHtml && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-sm select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-sans pointer-events-none tracking-wide">
            {label}
          </div>
        </Html>
      )}

      {/* Head-on sp² Lobe (C-C σ) */}
      {showHeadOn && (
        <group position={[Math.cos(headOnAngle) * 0.95, Math.sin(headOnAngle) * 0.95, 0]} rotation={[0, 0, headOnAngle - Math.PI / 2]}>
          <Sphere args={[0.6, 24, 24]} scale={[0.7, 1.25, 0.7]}>
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Top C-H sp² Lobe */}
      {showTopCH && (
        <group position={[Math.cos(topCHAngle) * 0.95, Math.sin(topCHAngle) * 0.95, 0]} rotation={[0, 0, topCHAngle - Math.PI / 2]}>
          <Sphere args={[0.6, 24, 24]} scale={[0.7, 1.25, 0.7]}>
            <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Bottom C-H sp² Lobe */}
      {showBottomCH && (
        <group position={[Math.cos(bottomCHAngle) * 0.95, Math.sin(bottomCHAngle) * 0.95, 0]} rotation={[0, 0, bottomCHAngle - Math.PI / 2]}>
          <Sphere args={[0.6, 24, 24]} scale={[0.7, 1.25, 0.7]}>
            <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.8} transparent opacity={0.75} />
          </Sphere>
        </group>
      )}

      {/* Unhybridized p Orbital (Perpendicular along Z-axis) */}
      {hasP && (
        <group>
          {/* Top p lobe */}
          <group position={[0, 0, 1.15]} scale={[0.6, 0.6, 1.25]}>
            <Sphere args={[0.65, 24, 24]}>
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} transparent opacity={0.75} />
            </Sphere>
          </group>
          {/* Bottom p lobe */}
          <group position={[0, 0, -1.15]} scale={[0.6, 0.6, 1.25]}>
            <Sphere args={[0.65, 24, 24]}>
              <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.7} transparent opacity={0.75} />
            </Sphere>
          </group>
        </group>
      )}

      {/* Parallel Pi (π) Overlap Cloud when Pi Bond Formed */}
      {piFormed && (
        <group>
          {/* Top Pi cloud overlap */}
          <group position={[0, 0, 1.15]}>
            <Cylinder args={[0.75, 0.75, 1.7, 32]} rotation={[0, 0, Math.PI / 2]}>
              <meshStandardMaterial color="#f43f5e" emissive="#be123c" emissiveIntensity={0.9} transparent opacity={0.65} />
            </Cylinder>
          </group>
          {/* Bottom Pi cloud overlap */}
          <group position={[0, 0, -1.15]}>
            <Cylinder args={[0.75, 0.75, 1.7, 32]} rotation={[0, 0, Math.PI / 2]}>
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
  ccSigmaFormed,
  chSigmaFormed,
  piFormed
}: {
  ccSigmaFormed: boolean;
  chSigmaFormed: boolean;
  piFormed: boolean;
}) => {
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

// ── 3D Scene Composition for Workshop (No pedestal / plate) ────────────────────
const WorkshopScene = ({
  placedCarbons,
  placedHydrogens,
  placedSp2Count,
  placedH1sCount,
  placedPCount,
  ccSigmaFormed,
  chSigmaFormed,
  piFormed,
  hideHtml
}: {
  placedCarbons: number;
  placedHydrogens: number;
  placedSp2Count: number;
  placedH1sCount: number;
  placedPCount: number;
  ccSigmaFormed: boolean;
  chSigmaFormed: boolean;
  piFormed: boolean;
  hideHtml: boolean;
}) => {
  // Positions for Level 2 (C2H4 Ethene)
  const leftCPos: [number, number, number] = [-1.25, 0, 0];
  const rightCPos: [number, number, number] = [1.25, 0, 0];

  const h1Pos: [number, number, number] = [-2.4, 1.8, 0];
  const h2Pos: [number, number, number] = [-2.4, -1.8, 0];
  const h3Pos: [number, number, number] = [2.4, 1.8, 0];
  const h4Pos: [number, number, number] = [2.4, -1.8, 0];

  return (
    <group position={[0, 0, 0]}>
      {/* Floating Ambient Sparkles (Clean, no plate) */}
      <Sparkles count={35} scale={8} size={2.2} speed={0.3} color="#38A9E8" />

      {/* Left Carbon Atom */}
      {placedCarbons >= 1 && (
        <CarbonAtom3D
          position={leftCPos}
          isLeft={true}
          hasP={placedPCount >= 1}
          showHeadOn={placedSp2Count >= 1}
          showTopCH={placedSp2Count >= 3}
          showBottomCH={placedSp2Count >= 4}
          label="C"
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
          label="C"
          hideHtml={hideHtml}
          piFormed={piFormed}
        />
      )}

      {/* 4 Hydrogen Atoms for Ethene */}
      {placedHydrogens >= 1 && (
        <HydrogenAtom3D position={h1Pos} hasOrbital={placedH1sCount >= 1} label="H" hideHtml={hideHtml} />
      )}
      {placedHydrogens >= 2 && (
        <HydrogenAtom3D position={h2Pos} hasOrbital={placedH1sCount >= 2} label="H" hideHtml={hideHtml} />
      )}
      {placedHydrogens >= 3 && (
        <HydrogenAtom3D position={h3Pos} hasOrbital={placedH1sCount >= 3} label="H" hideHtml={hideHtml} />
      )}
      {placedHydrogens >= 4 && (
        <HydrogenAtom3D position={h4Pos} hasOrbital={placedH1sCount >= 4} label="H" hideHtml={hideHtml} />
      )}

      {/* Overlap & Bond Visualizer */}
      <BondOverlapVisualizer
        ccSigmaFormed={ccSigmaFormed}
        chSigmaFormed={chSigmaFormed}
        piFormed={piFormed}
      />
    </group>
  );
};

// ── MAIN LEVEL 2 ORBITAL WORKSHOP COMPONENT ──────────────────────────────────
interface OrbitalWorkshopGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function OrbitalWorkshopGamePage({ onExit }: OrbitalWorkshopGamePageProps) {
  // Screens navigation
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // Step Progress State (1 = Atoms, 2 = C-C σ, 3 = C-H σ, 4 = C=C π)
  const [step, setStep] = useState<number>(1);
  const [placedCarbons, setPlacedCarbons] = useState<number>(0);
  const [placedHydrogens, setPlacedHydrogens] = useState<number>(0);
  const [placedSp2Count, setPlacedSp2Count] = useState<number>(0);
  const [placedH1sCount, setPlacedH1sCount] = useState<number>(0);
  const [placedPCount, setPlacedPCount] = useState<number>(0);

  const [ccSigmaFormed, setCcSigmaFormed] = useState<boolean>(false);
  const [chSigmaFormed, setChSigmaFormed] = useState<boolean>(false);
  const [piFormed, setPiFormed] = useState<boolean>(false);
  const [isBondFormed, setIsBondFormed] = useState<boolean>(false);

  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Place Carbon Handler (C)
  const handlePlaceCarbon = () => {
    if (placedCarbons < 2) {
      const nextC = placedCarbons + 1;
      setPlacedCarbons(nextC);
      setErrorMessage(null);
      if (nextC === 2 && placedHydrogens === 4 && step === 1) {
        setStep(2);
      }
    } else {
      setErrorMessage("Both Carbon atoms are already placed.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Place Hydrogen Handler (H)
  const handlePlaceHydrogen = () => {
    if (placedCarbons < 2) {
      setErrorMessage("Place 2 Carbon atoms first.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (placedHydrogens < 4) {
      const nextH = placedHydrogens + 1;
      setPlacedHydrogens(nextH);
      setErrorMessage(null);
      if (placedCarbons === 2 && nextH === 4 && step === 1) {
        setStep(2);
      }
    } else {
      setErrorMessage("All 4 Hydrogen atoms are already placed.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Add sp² Orbital Handler
  const handleAddSp2Orbital = () => {
    if (step < 2) {
      setErrorMessage("Place all Carbon & Hydrogen atoms first.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (step === 2) {
      if (placedSp2Count < 2) {
        setPlacedSp2Count(prev => prev + 1);
        setErrorMessage(null);
      } else {
        setErrorMessage("Both head-on sp² orbitals placed. Click Form C–C σ Bond!");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } else if (step === 3) {
      if (placedSp2Count < 6) {
        setPlacedSp2Count(prev => prev + 1);
        setErrorMessage(null);
      } else {
        setErrorMessage("All 6 sp² orbitals have been placed.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } else {
      setErrorMessage("sp² orbitals are already complete.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Add 1s Orbital Handler (Hydrogen)
  const handleAddH1sOrbital = () => {
    if (step < 3) {
      setErrorMessage("Form the C–C σ bond first.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (step === 3) {
      if (placedH1sCount < 4) {
        setPlacedH1sCount(prev => prev + 1);
        setErrorMessage(null);
      } else {
        setErrorMessage("All 4 Hydrogen 1s orbitals have been placed.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } else {
      setErrorMessage("Hydrogen 1s orbitals are already placed.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Add p Orbital Handler (Carbon unhybridized)
  const handleAddPOrbital = () => {
    if (step < 4) {
      setErrorMessage("Complete all σ bonds first before adding p orbitals.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    if (step === 4) {
      if (placedPCount < 2) {
        setPlacedPCount(prev => prev + 1);
        setErrorMessage(null);
      } else {
        setErrorMessage("All 2 p orbitals placed. Click Form π Bond!");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  // Form Bond Handler
  const handleFormBond = () => {
    if (step === 2) {
      if (placedSp2Count < 2) {
        setErrorMessage("Add 2 sp² orbitals for Carbon atoms first.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      setCcSigmaFormed(true);
      setStep(3);
      setErrorMessage(null);
    } else if (step === 3) {
      if (placedSp2Count < 6 || placedH1sCount < 4) {
        setErrorMessage("Add 4 remaining sp² orbitals and 4 H 1s orbitals for C–H bonds first.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      setChSigmaFormed(true);
      setStep(4);
      setErrorMessage(null);
    } else if (step === 4) {
      if (placedPCount < 2) {
        setErrorMessage("Add 2 unhybridized p orbitals first.");
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      setPiFormed(true);
      setIsBondFormed(true);
      setErrorMessage(null);
    }
  };

  // Revert / Undo Step Back Handler
  const handleRevertStep = () => {
    setErrorMessage(null);

    if (isBondFormed || piFormed) {
      setPiFormed(false);
      setIsBondFormed(false);
      return;
    }

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
      } else if (placedCarbons > 0) {
        setPlacedCarbons(prev => prev - 1);
      }
    }
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
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-2.5 gap-1.5 sm:gap-2">
      {/* ── INTRO MISSION TARGET & INSTRUCTIONS VIEW OVERLAY (NO SCROLL AT HEIGHT 376) ── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-1.5 sm:p-2.5 bg-white/95 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] sm:text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3 h-3 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN (COMPACT, FITS AT HEIGHT 376) */}
          {introStep === 'mission' && (
            <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-4 z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                HYBRIDIZATION &amp; ORBITAL OVERLAP
              </div>

              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Construct &amp; Overlap Orbitals for C₂H₄ (Ethylene)
              </h1>

              <div className="pt-1.5 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-6 sm:px-8 py-1.5 sm:py-2 bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 text-teal-200 hover:text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider rounded-full shadow-lg border border-teal-400/50 flex items-center gap-1.5 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN (WITH IMAGES, NO SUBTITLE TEXT, FULLY VISIBLE) */}
          {introStep === 'instructions' && (
            <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-0.5 w-full animate-in fade-in duration-200 flex-1">
              {/* Header Title */}
              <div className="text-center pt-0.5 pb-1 sm:pb-1.5">
                <h2 className="text-[#1E293B] text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              {/* 3 Instructions Side-by-Side in Landscape Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2 sm:gap-3 w-full mx-auto my-auto items-stretch">
                {/* 1. Tap H and C to form C2H4 */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Place Atoms
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                        C₂H₄ Molecule
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                      Tap the C and H atoms to form the C₂H₄ (Ethylene) molecule.
                    </p>
                  </div>

                  <div className="w-full h-18 sm:h-22 md:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-1 sm:mt-1.5">
                    <img
                      src="/images/hybridization/l2_step1_place_atoms.svg"
                      alt="Step 1: Place atoms"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Tap required orbitals */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Attach Orbitals
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                        Hybrid Orbitals
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                      Tap the required orbitals (sp², 1s, and p) to attach them.
                    </p>
                  </div>

                  <div className="w-full h-18 sm:h-22 md:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-1 sm:mt-1.5">
                    <img
                      src="/images/hybridization/l2_step2_add_orbitals.svg"
                      alt="Step 2: Add orbitals"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 3. Tap create bond button */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Form Bonds
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                        Overlap Bonds
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                      After placing orbitals, tap Create Bond button to form bonds.
                    </p>
                  </div>

                  <div className="w-full h-18 sm:h-22 md:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-1 sm:mt-1.5">
                    <img
                      src="/images/hybridization/l2_step3_form_bonds.png"
                      alt="Step 3: Form bonds button"
                      className="w-full h-full object-contain"
                    />
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
          )}

          {/* Bottom Footer Note (Only on mission step) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[9.5px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER (ONLY EXIT AND EXPLANATION, NO MIDDLE LONG BUTTON) ── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0">
        {/* Top Left: Exit Button Only */}
        <button
          type="button"
          onClick={() => (onExit ? onExit() : exitSimulation())}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          title="Exit Simulation (Back to App)"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>EXIT</span>
        </button>

        {/* Top Right: Explanation Button Only */}
        <button
          type="button"
          onClick={() => setShowCompletionModal(true)}
          className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          title="View Theory & Explanation"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-600" />
          <span>Explanation</span>
        </button>
      </div>

      {/* ── MAIN 3D WORKSHOP CANVAS ────────────────────────────────────── */}
      <main
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex-1 w-full relative bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden shadow-inner z-10 min-h-[190px]"
      >
        <div className="w-full h-full">
          <Canvas camera={{ position: [0, 0.1, 9.8], fov: 45 }} style={{ width: '100%', height: '100%' }}>
            <ambientLight intensity={0.85} />
            <directionalLight position={[6, 9, 7]} intensity={1.8} />
            <directionalLight position={[-6, -4, 4]} intensity={0.6} color="#818cf8" />
            <pointLight position={[0, 2, 5]} intensity={0.9} color="#ffffff" />

            <WorkshopScene
              placedCarbons={placedCarbons}
              placedHydrogens={placedHydrogens}
              placedSp2Count={placedSp2Count}
              placedH1sCount={placedH1sCount}
              placedPCount={placedPCount}
              ccSigmaFormed={ccSigmaFormed}
              chSigmaFormed={chSigmaFormed}
              piFormed={piFormed}
              hideHtml={showCompletionModal}
            />

            <OrbitControls target={[0, 0, 0]} enablePan={true} enableZoom={true} minDistance={4} maxDistance={20} />
          </Canvas>
        </div>

        {/* Error Toast Banner */}
        {errorMessage && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-1.5 animate-shake font-medium">
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* ── VERTICAL STEPS TRACKER (COMPACT WITH GENEROUS BOTTOM MARGIN) ── */}
        <div className="absolute right-2 sm:right-3 top-2 sm:top-2.5 z-20 bg-white/95 border border-slate-200/90 rounded-xl p-1.5 sm:p-2 shadow-md backdrop-blur-md flex flex-col gap-1 w-32 sm:w-36 md:w-40 select-none animate-in fade-in slide-in-from-right-2 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-0.5 px-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Steps
            </span>
            <span className="text-[8.5px] font-mono font-bold bg-blue-50 text-blue-700 px-1 py-0.2 rounded border border-blue-200">
              {step}/4
            </span>
          </div>

          {/* Step 1: Atoms */}
          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-all ${
            step > 1 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            step === 1 ? 'bg-blue-50 text-blue-900 border border-blue-300 shadow-xs ring-1 ring-blue-300/40' :
            'bg-slate-50 text-slate-400 border border-slate-200'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
              step > 1 ? 'bg-emerald-600 text-white' :
              step === 1 ? 'bg-blue-600 text-white animate-pulse' :
              'bg-slate-300 text-slate-600'
            }`}>
              {step > 1 ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : '1'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[9.5px] sm:text-[10px] font-extrabold leading-tight truncate">1. Atoms</div>
              <div className="text-[7.5px] sm:text-[8px] text-slate-500 leading-tight">2 C & 4 H</div>
            </div>
          </div>

          {/* Step 2: C-C Sigma */}
          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-all ${
            step > 2 || ccSigmaFormed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            step === 2 ? 'bg-purple-50 text-purple-900 border border-purple-300 shadow-xs ring-1 ring-purple-300/40' :
            'bg-slate-50 text-slate-400 border border-slate-200'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
              step > 2 || ccSigmaFormed ? 'bg-emerald-600 text-white' :
              step === 2 ? 'bg-purple-600 text-white animate-pulse' :
              'bg-slate-300 text-slate-600'
            }`}>
              {step > 2 || ccSigmaFormed ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : '2'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[9.5px] sm:text-[10px] font-extrabold leading-tight truncate">2. C–C σ</div>
              <div className="text-[7.5px] sm:text-[8px] text-slate-500 leading-tight">sp²–sp²</div>
            </div>
          </div>

          {/* Step 3: C-H Sigma */}
          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-all ${
            step > 3 || chSigmaFormed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            step === 3 ? 'bg-sky-50 text-sky-900 border border-sky-300 shadow-xs ring-1 ring-sky-300/40' :
            'bg-slate-50 text-slate-400 border border-slate-200'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
              step > 3 || chSigmaFormed ? 'bg-emerald-600 text-white' :
              step === 3 ? 'bg-sky-600 text-white animate-pulse' :
              'bg-slate-300 text-slate-600'
            }`}>
              {step > 3 || chSigmaFormed ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : '3'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[9.5px] sm:text-[10px] font-extrabold leading-tight truncate">3. C–H σ</div>
              <div className="text-[7.5px] sm:text-[8px] text-slate-500 leading-tight">4× (sp²–1s)</div>
            </div>
          </div>

          {/* Step 4: C-C Pi */}
          <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-lg transition-all ${
            piFormed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
            step === 4 ? 'bg-rose-50 text-rose-900 border border-rose-300 shadow-xs ring-1 ring-rose-300/40' :
            'bg-slate-50 text-slate-400 border border-slate-200'
          }`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
              piFormed ? 'bg-emerald-600 text-white' :
              step === 4 ? 'bg-rose-600 text-white animate-pulse' :
              'bg-slate-300 text-slate-600'
            }`}>
              {piFormed ? <CheckCircle2 className="w-2.5 h-2.5 text-white" /> : '4'}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[9.5px] sm:text-[10px] font-extrabold leading-tight truncate">4. C=C π</div>
              <div className="text-[7.5px] sm:text-[8px] text-slate-500 leading-tight">p–p sidewise</div>
            </div>
          </div>
        </div>

        {/* Target Completed Rectangle Box (Centered when completed) */}
        {isBondFormed && piFormed && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
            <div className="bg-emerald-600/85 border border-emerald-400/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 select-none">
              <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
                  Target Completed (100%)
                </div>
                <div className="text-[9px] font-medium text-white/95 leading-tight">
                  C₂H₄ Ethylene Molecule Assembled (5σ + 1π Bonds)!
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM DOCK (CENTERED ATOMS & ORBITALS, NO "ELEMENTS & ORBITALS" TEXT) ── */}
      <footer className="w-full bg-white/95 border border-slate-200 rounded-2xl p-1.5 sm:p-2 shadow-md flex items-center justify-center gap-1.5 sm:gap-2.5 backdrop-blur-xl shrink-0 z-20 select-none flex-wrap">
        {/* Carbon Atom */}
        <div
          draggable={step === 1 && placedCarbons < 2}
          onDragStart={(e) => handleDragStart(e, 'carbon-atom')}
          onClick={handlePlaceCarbon}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
            step === 1 && placedCarbons < 2
              ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
          title="Place Carbon Atom (C)"
        >
          <div className="w-4 h-4 rounded-full bg-slate-700 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0">
            C
          </div>
          <span className="text-[11px] font-extrabold whitespace-nowrap">Carbon</span>
        </div>

        {/* Hydrogen Atom */}
        <div
          draggable={step === 1 && placedCarbons === 2 && placedHydrogens < 4}
          onDragStart={(e) => handleDragStart(e, 'hydrogen-atom')}
          onClick={handlePlaceHydrogen}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
            step === 1 && placedCarbons === 2 && placedHydrogens < 4
              ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'
              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
          title="Place Hydrogen Atom (H)"
        >
          <div className="w-4 h-4 rounded-full bg-blue-600 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0">
            H
          </div>
          <span className="text-[11px] font-extrabold text-[#1E293B] whitespace-nowrap">Hydrogen</span>
        </div>

        {/* Carbon sp² Orbital */}
        <div
          draggable={(step === 2 && placedSp2Count < 2) || (step === 3 && placedSp2Count < 6)}
          onDragStart={(e) => handleDragStart(e, 'sp2-orbital')}
          onClick={handleAddSp2Orbital}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
            ((step === 2 && placedSp2Count < 2) || (step === 3 && placedSp2Count < 6))
              ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-900'
              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
          title="Carbon sp² Hybrid Orbital"
        >
          <div className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
            sp²
          </div>
          <span className="text-[11px] font-extrabold text-[#1E293B] whitespace-nowrap">sp²</span>
        </div>

        {/* Hydrogen 1s Orbital */}
        <div
          draggable={step === 3 && placedH1sCount < 4}
          onDragStart={(e) => handleDragStart(e, 'h1s-orbital')}
          onClick={handleAddH1sOrbital}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
            step === 3 && placedH1sCount < 4
              ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
          title="Hydrogen 1s Orbital"
        >
          <div className="w-4 h-4 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
            1s
          </div>
          <span className="text-[11px] font-extrabold text-[#1E293B] whitespace-nowrap">1s</span>
        </div>

        {/* Carbon p Orbital */}
        <div
          draggable={step === 4 && placedPCount < 2}
          onDragStart={(e) => handleDragStart(e, 'p-orbital')}
          onClick={handleAddPOrbital}
          className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
            step === 4 && placedPCount < 2
              ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
              : 'bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
          title="Carbon unhybridized 2p Orbital"
        >
          <div className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
            p
          </div>
          <span className="text-[11px] font-extrabold text-[#1E293B] whitespace-nowrap">p</span>
        </div>

        {/* Action Trigger for Bond Creation (Rendered cleanly inline) */}
        {step === 2 && placedSp2Count >= 2 && !ccSigmaFormed && (
          <button
            type="button"
            onClick={handleFormBond}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl transition-all shadow-md animate-pulse flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Form C–C σ Bond ✨</span>
          </button>
        )}

        {step === 3 && placedSp2Count === 6 && placedH1sCount === 4 && !chSigmaFormed && (
          <button
            type="button"
            onClick={handleFormBond}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl transition-all shadow-md animate-pulse flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Form C–H σ Bonds ✨</span>
          </button>
        )}

        {step === 4 && placedPCount === 2 && !piFormed && (
          <button
            type="button"
            onClick={handleFormBond}
            className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] px-3 py-1 rounded-xl transition-all shadow-md animate-pulse flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Form π Bond ✨</span>
          </button>
        )}

        {/* Revert One Step */}
        {(placedCarbons > 0 || placedSp2Count > 0 || isBondFormed) && (
          <button
            type="button"
            onClick={handleRevertStep}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
            title="Revert last action"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        )}
      </footer>

      {/* ── THEORY / EXPLANATION PAGE (FULL CANVAS / WHOLE SCREEN) ─── */}
      {showCompletionModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                C₂H₄ (Ethylene) Orbital Overlap &amp; Double Bond Guide
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                sp² Hybridization, Head-on σ Overlap, and Sidewise π Overlap Principles
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowCompletionModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8 text-black text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Core Principles of Sigma and Pi Overlap */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                1. Core Principles of σ (Sigma) and π (Pi) Overlap
              </h3>
              <p className="text-black leading-relaxed">
                According to <strong>Valence Bond (VB) Theory</strong>, a covalent bond forms when two atomic or hybrid orbitals overlap and their shared electron spins pair up. The nature and strength of the bond depends directly on the geometry of spatial overlap:
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Bond Types &amp; Spatial Orientation:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>σ (Sigma) Bond (Head-On Overlap):</strong> Formed by direct end-to-end (axial) overlap along the internuclear axis. The resulting electron charge density is cylindrically symmetrical around the bond line. All single bonds are σ bonds, giving maximum orbital overlap and high bond strength (~347 kJ/mol).
                </li>
                <li>
                  <strong>π (Pi) Bond (Sidewise / Lateral Overlap):</strong> Formed by lateral/sidewise overlap of two parallel, unhybridized 2p orbitals oriented perpendicular to the internuclear axis. The electron cloud is concentrated in two lobes: one above and one below the nodal molecular plane. π bonds are weaker (~264 kJ/mol) and cannot rotate freely.
                </li>
              </ul>
            </div>

            {/* Section 2: sp² Hybridization in Carbon */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                2. sp² Hybridization of Carbon in Ethylene (C₂H₄)
              </h3>
              <p className="text-black leading-relaxed">
                Carbon has a ground-state valence configuration of <strong>2s² 2p²</strong>. In ethylene, carbon promotes one 2s electron to the vacant 2p_z orbital, then mixes the <strong>2s</strong> with two 2p orbitals (<strong>2p_x and 2p_y</strong>):
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Orbital Breakdown:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>3 sp² Hybrid Orbitals:</strong> Contain 33.3% s and 66.7% p character. Spread out symmetrically in the XY plane separated by <strong>120° bond angles</strong> (Trigonal Planar).
                </li>
                <li>
                  <strong>1 Unhybridized 2p_z Orbital:</strong> Remains pure p character. Points strictly along the Z-axis, perpendicular (90°) to the molecular trigonal plane.
                </li>
                <li>
                  <strong>Planar Molecular Skeleton:</strong> All 6 atoms (2 Carbons and 4 Hydrogens) reside in a single flat plane, minimizing steric repulsion.
                </li>
              </ul>
            </div>

            {/* Section 3: Master Bond Accounting Matrix */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                3. Master Bond Breakdown for Ethylene (C₂H₄)
              </h3>
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border border-neutral-300 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-black font-bold border-b border-neutral-300 text-[11px]">
                    <tr>
                      <th className="p-2.5">Bond</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Overlapping Orbitals</th>
                      <th className="p-2.5">Overlap Geometry</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Approx. Energy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">C — C</td>
                      <td className="p-2.5 font-bold">σ (Sigma)</td>
                      <td className="p-2.5 font-mono">C(sp²) — C(sp²)</td>
                      <td className="p-2.5 font-bold">Head-on axial</td>
                      <td className="p-2.5 font-bold font-mono">1</td>
                      <td className="p-2.5 font-mono">~347 kJ/mol</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">C — H</td>
                      <td className="p-2.5 font-bold">σ (Sigma)</td>
                      <td className="p-2.5 font-mono">C(sp²) — H(1s)</td>
                      <td className="p-2.5 font-bold">Head-on axial</td>
                      <td className="p-2.5 font-bold font-mono">4</td>
                      <td className="p-2.5 font-mono">~413 kJ/mol</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">C = C</td>
                      <td className="p-2.5 font-bold">π (Pi)</td>
                      <td className="p-2.5 font-mono">C(2p_z) — C(2p_z)</td>
                      <td className="p-2.5 font-bold">Sidewise lateral</td>
                      <td className="p-2.5 font-bold font-mono">1</td>
                      <td className="p-2.5 font-mono">~264 kJ/mol</td>
                    </tr>
                    <tr className="bg-neutral-100 font-bold text-black border-t border-neutral-300">
                      <td className="p-2.5">Total</td>
                      <td className="p-2.5">Double Bond (C=C)</td>
                      <td className="p-2.5 font-mono">5 σ + 1 π bonds</td>
                      <td className="p-2.5">Trigonal Planar</td>
                      <td className="p-2.5 font-mono">6 bonds</td>
                      <td className="p-2.5 font-mono">Total ~2380 kJ/mol</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Structural Consequences (Restricted Rotation) */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                4. Physical &amp; Chemical Consequences of the π Bond
              </h3>
              <p className="text-black leading-relaxed">
                The presence of the sidewise π bond has profound consequences on molecular properties:
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Key Structural Effects:
              </h4>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Restricted Rotation:</strong> Unlike single σ bonds which rotate freely, rotating the C=C bond breaks the parallel alignment of the 2p orbitals, destroying the π bond. This requires ~264 kJ/mol of energy, locking the molecule into rigid cis/trans configurations.
                </li>
                <li>
                  <strong>Enhanced Reactivity:</strong> The π electron cloud is exposed above and below the nuclear plane rather than shielded between nuclei, making it readily accessible to electrophilic reagents (e.g. halogen addition, hydrogenation).
                </li>
                <li>
                  <strong>Shorter Bond Length:</strong> The C=C double bond length is <strong>1.34 Å</strong>, significantly shorter than the single C—C bond (1.54 Å) due to the combined pulling attraction of the σ and π bonds.
                </li>
              </ul>
            </div>

            {/* Section 5: Step-by-Step Level 2 Challenge Guide */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                5. How to Solve the Level 2 Challenge in the Simulation
              </h3>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>Step 1 (Place Atoms):</strong> Tap <strong>2 Carbon (C)</strong> atoms and <strong>4 Hydrogen (H)</strong> atoms from the tray to place them in the workspace.
                </li>
                <li>
                  <strong>Step 2 (C–C σ Bond):</strong> Tap 2 <strong>sp² orbitals</strong> for the carbon atoms, then click <strong>Form C–C σ Bond ✨</strong>.
                </li>
                <li>
                  <strong>Step 3 (C–H σ Bonds):</strong> Tap the remaining 4 <strong>sp² orbitals</strong> and 4 <strong>1s orbitals</strong>, then click <strong>Form C–H σ Bonds ✨</strong>.
                </li>
                <li>
                  <strong>Step 4 (C=C π Bond):</strong> Tap 2 <strong>p orbitals</strong> along the Z-axis, then click <strong>Form π Bond ✨</strong> to finish the molecule!
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowCompletionModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
