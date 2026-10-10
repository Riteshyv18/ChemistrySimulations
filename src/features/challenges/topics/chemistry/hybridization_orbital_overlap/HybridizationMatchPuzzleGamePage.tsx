"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  CheckCircle2,
  Lock,
  ChevronLeft,
  RefreshCw,
  Check,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ArrowDown,
  Move,
  BookOpen,
  Target,
  Info,
  ChevronRight
} from 'lucide-react';
import { getQuaternionFromDirection } from './helpers';

// ── 5 Molecules Definition (BeCl2, BF3, CH4, PCl5, SF6) ──────────────────────
export interface MoleculeItem {
  id: string; // 'BeCl2' | 'BF3' | 'CH4' | 'PCl5' | 'SF6'
  name: string;
  formula: string;
  centralAtom: string;
  centralAtomName: string;
  hybridization: 'sp' | 'sp²' | 'sp³' | 'sp³d' | 'sp³d²';
  geometry: string;
  correctBox: 'A' | 'B' | 'C' | 'D' | 'E';
}

const MOLECULES: MoleculeItem[] = [
  {
    id: 'BeCl2',
    name: 'Beryllium Dichloride',
    formula: 'BeCl₂',
    centralAtom: 'Be',
    centralAtomName: 'Beryllium',
    hybridization: 'sp',
    geometry: 'Linear',
    correctBox: 'A',
  },
  {
    id: 'BF3',
    name: 'Boron Trifluoride',
    formula: 'BF₃',
    centralAtom: 'B',
    centralAtomName: 'Boron',
    hybridization: 'sp²',
    geometry: 'Trigonal planar',
    correctBox: 'B',
  },
  {
    id: 'CH4',
    name: 'Methane',
    formula: 'CH₄',
    centralAtom: 'C',
    centralAtomName: 'Carbon',
    hybridization: 'sp³',
    geometry: 'Tetrahedral',
    correctBox: 'C',
  },
  {
    id: 'PCl5',
    name: 'Phosphorus Pentachloride',
    formula: 'PCl₅',
    centralAtom: 'P',
    centralAtomName: 'Phosphorus',
    hybridization: 'sp³d',
    geometry: 'Trigonal bipyramidal',
    correctBox: 'D',
  },
  {
    id: 'SF6',
    name: 'Sulfur Hexafluoride',
    formula: 'SF₆',
    centralAtom: 'S',
    centralAtomName: 'Sulfur',
    hybridization: 'sp³d²',
    geometry: 'Octahedral',
    correctBox: 'E',
  },
];

// Target hybridization mapping for boxes A-E
const BOX_MAPPINGS: Record<'A' | 'B' | 'C' | 'D' | 'E', { hybridization: string; isUsed: boolean }> = {
  A: { hybridization: 'sp', isUsed: true },
  B: { hybridization: 'sp²', isUsed: true },
  C: { hybridization: 'sp³', isUsed: true },
  D: { hybridization: 'sp³d', isUsed: true },
  E: { hybridization: 'sp³d²', isUsed: true },
};

// Molecule Box Distinct Color Schemes (Light Mode Refined)
const MOLECULE_CARD_STYLES: Record<string, { border: string; bg: string; hover: string; glow: string }> = {
  BeCl2: {
    border: 'border-cyan-400',
    bg: 'bg-cyan-50/50',
    hover: 'hover:border-cyan-500 hover:shadow-md',
    glow: 'shadow-md border-cyan-500 ring-2 ring-cyan-200',
  },
  BF3: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-50/50',
    hover: 'hover:border-emerald-500 hover:shadow-md',
    glow: 'shadow-md border-emerald-500 ring-2 ring-emerald-200',
  },
  CH4: {
    border: 'border-purple-400',
    bg: 'bg-purple-50/50',
    hover: 'hover:border-purple-500 hover:shadow-md',
    glow: 'shadow-md border-purple-500 ring-2 ring-purple-200',
  },
  PCl5: {
    border: 'border-amber-400',
    bg: 'bg-amber-50/50',
    hover: 'hover:border-amber-500 hover:shadow-md',
    glow: 'shadow-md border-amber-500 ring-2 ring-amber-200',
  },
  SF6: {
    border: 'border-rose-400',
    bg: 'bg-rose-50/50',
    hover: 'hover:border-rose-500 hover:shadow-md',
    glow: 'shadow-md border-rose-500 ring-2 ring-rose-200',
  },
};

// ── Atom Label 3D Badge Helper ───────────────────────────────────────────────
const AtomLabel = ({ symbol, color = "#1e293b", position = [0, 0, 0] }: { symbol: string; color?: string; position?: [number, number, number] }) => (
  <Html position={[position[0], position[1] + 0.45, position[2]]} center distanceFactor={14} zIndexRange={[100, 0]}>
    <span className="text-[11px] font-mono font-black leading-none select-none pointer-events-none drop-shadow-sm px-1 rounded bg-white/80 border border-slate-200" style={{ color }}>
      {symbol}
    </span>
  </Html>
);

// ── 3D Bond Cylinder Helper ──────────────────────────────────────────────────
const Bond = ({
  start,
  end,
  color = "#94a3b8",
  radius = 0.08
}: {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
  radius?: number;
}) => {
  const p1 = useMemo(() => new THREE.Vector3(...start), [start]);
  const p2 = useMemo(() => new THREE.Vector3(...end), [end]);
  const length = useMemo(() => p1.distanceTo(p2), [p1, p2]);
  const midpoint = useMemo(() => p1.clone().add(p2).multiplyScalar(0.5), [p1, p2]);
  const orientation = useMemo(() => {
    const dir = p2.clone().sub(p1).normalize();
    return getQuaternionFromDirection(dir);
  }, [p1, p2]);

  return (
    <group position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={orientation}>
      <Cylinder args={[radius, radius, length, 16]}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </Cylinder>
    </group>
  );
};

// ── 3D Molecule Geometry Renderers ────────────────────────────────────────────

// 1. BeCl2 - Linear
const BeCl2Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const bePos: [number, number, number] = [0, 0, 0];
  const cl1Pos: [number, number, number] = [-1.8, 0, 0];
  const cl2Pos: [number, number, number] = [1.8, 0, 0];

  return (
    <group>
      <Sphere args={[0.45, 32, 32]} position={bePos}>
        <meshStandardMaterial color="#0891b2" roughness={0.2} metalness={0.5} />
      </Sphere>
      {showLabels && <AtomLabel symbol="Be" position={bePos} color="#0891b2" />}

      <Sphere args={[0.55, 32, 32]} position={cl1Pos}>
        <meshStandardMaterial color="#16a34a" roughness={0.3} />
      </Sphere>
      {showLabels && <AtomLabel symbol="Cl" position={cl1Pos} color="#16a34a" />}

      <Sphere args={[0.55, 32, 32]} position={cl2Pos}>
        <meshStandardMaterial color="#16a34a" roughness={0.3} />
      </Sphere>
      {showLabels && <AtomLabel symbol="Cl" position={cl2Pos} color="#16a34a" />}

      <Bond start={bePos} end={cl1Pos} color="#64748b" />
      <Bond start={bePos} end={cl2Pos} color="#64748b" />

      {/* Cloud Representation */}
      <Sphere args={[0.65, 24, 24]} position={bePos}>
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.25} />
      </Sphere>
    </group>
  );
};

// 2. BF3 - Trigonal Planar
const BF3Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const bPos: [number, number, number] = [0, 0, 0];
  const r = 1.7;
  const f1Pos: [number, number, number] = [0, r, 0];
  const f2Pos: [number, number, number] = [r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6), 0];
  const f3Pos: [number, number, number] = [-r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6), 0];

  return (
    <group>
      <Sphere args={[0.42, 32, 32]} position={bPos}>
        <meshStandardMaterial color="#16a34a" roughness={0.2} />
      </Sphere>
      {showLabels && <AtomLabel symbol="B" position={bPos} color="#16a34a" />}

      <Sphere args={[0.48, 32, 32]} position={f1Pos}>
        <meshStandardMaterial color="#ea580c" roughness={0.3} />
      </Sphere>
      {showLabels && <AtomLabel symbol="F" position={f1Pos} color="#ea580c" />}

      <Sphere args={[0.48, 32, 32]} position={f2Pos}>
        <meshStandardMaterial color="#ea580c" roughness={0.3} />
      </Sphere>
      {showLabels && <AtomLabel symbol="F" position={f2Pos} color="#ea580c" />}

      <Sphere args={[0.48, 32, 32]} position={f3Pos}>
        <meshStandardMaterial color="#ea580c" roughness={0.3} />
      </Sphere>
      {showLabels && <AtomLabel symbol="F" position={f3Pos} color="#ea580c" />}

      <Bond start={bPos} end={f1Pos} color="#64748b" />
      <Bond start={bPos} end={f2Pos} color="#64748b" />
      <Bond start={bPos} end={f3Pos} color="#64748b" />
    </group>
  );
};

// 3. CH4 - Tetrahedral
const CH4Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const cPos: [number, number, number] = [0, 0, 0];
  const r = 1.6;
  const h1Pos: [number, number, number] = [0, r, 0];
  const h2Pos: [number, number, number] = [r * (8 / 9) ** 0.5, -r / 3, 0];
  const h3Pos: [number, number, number] = [-r * (2 / 9) ** 0.5, -r / 3, r * (2 / 3) ** 0.5];
  const h4Pos: [number, number, number] = [-r * (2 / 9) ** 0.5, -r / 3, -r * (2 / 3) ** 0.5];

  return (
    <group>
      <Sphere args={[0.45, 32, 32]} position={cPos}>
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </Sphere>
      {showLabels && <AtomLabel symbol="C" position={cPos} color="#1e293b" />}

      {[h1Pos, h2Pos, h3Pos, h4Pos].map((pos, idx) => (
        <group key={idx}>
          <Sphere args={[0.38, 32, 32]} position={pos}>
            <meshStandardMaterial color="#94a3b8" roughness={0.2} />
          </Sphere>
          {showLabels && <AtomLabel symbol="H" position={pos} color="#475569" />}
          <Bond start={cPos} end={pos} color="#cbd5e1" />
        </group>
      ))}
    </group>
  );
};

// 4. PCl5 - Trigonal Bipyramidal
const PCl5Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const pPos: [number, number, number] = [0, 0, 0];
  const rAxial = 1.7;
  const rEq = 1.5;

  const clAx1: [number, number, number] = [0, rAxial, 0];
  const clAx2: [number, number, number] = [0, -rAxial, 0];

  const clEq1: [number, number, number] = [rEq, 0, 0];
  const clEq2: [number, number, number] = [-rEq * 0.5, 0, rEq * 0.866];
  const clEq3: [number, number, number] = [-rEq * 0.5, 0, -rEq * 0.866];

  return (
    <group>
      <Sphere args={[0.45, 32, 32]} position={pPos}>
        <meshStandardMaterial color="#d97706" roughness={0.2} />
      </Sphere>
      {showLabels && <AtomLabel symbol="P" position={pPos} color="#d97706" />}

      {[clAx1, clAx2, clEq1, clEq2, clEq3].map((pos, idx) => (
        <group key={idx}>
          <Sphere args={[0.42, 32, 32]} position={pos}>
            <meshStandardMaterial color="#16a34a" roughness={0.3} />
          </Sphere>
          {showLabels && <AtomLabel symbol="Cl" position={pos} color="#16a34a" />}
          <Bond start={pPos} end={pos} color="#64748b" />
        </group>
      ))}
    </group>
  );
};

// 5. SF6 - Octahedral
const SF6Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const sPos: [number, number, number] = [0, 0, 0];
  const r = 1.5;

  const fPositions: [number, number, number][] = [
    [r, 0, 0],
    [-r, 0, 0],
    [0, r, 0],
    [0, -r, 0],
    [0, 0, r],
    [0, 0, -r],
  ];

  return (
    <group>
      <Sphere args={[0.45, 32, 32]} position={sPos}>
        <meshStandardMaterial color="#e11d48" roughness={0.2} />
      </Sphere>
      {showLabels && <AtomLabel symbol="S" position={sPos} color="#e11d48" />}

      {fPositions.map((pos, idx) => (
        <group key={idx}>
          <Sphere args={[0.4, 32, 32]} position={pos}>
            <meshStandardMaterial color="#ea580c" roughness={0.3} />
          </Sphere>
          {showLabels && <AtomLabel symbol="F" position={pos} color="#ea580c" />}
          <Bond start={sPos} end={pos} color="#64748b" />
        </group>
      ))}
    </group>
  );
};

// Single 3D Molecule Switcher Component
const Molecule3DRenderer = ({
  code,
  isHighlighted = false,
  autoRotate = true,
  showLabels = true
}: {
  code: string;
  isHighlighted?: boolean;
  autoRotate?: boolean;
  showLabels?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef} scale={isHighlighted ? [1.1, 1.1, 1.1] : [0.95, 0.95, 0.95]}>
      {code === 'BeCl2' && <BeCl2Molecule3D showLabels={showLabels} />}
      {code === 'BF3' && <BF3Molecule3D showLabels={showLabels} />}
      {code === 'CH4' && <CH4Molecule3D showLabels={showLabels} />}
      {code === 'PCl5' && <PCl5Molecule3D showLabels={showLabels} />}
      {code === 'SF6' && <SF6Molecule3D showLabels={showLabels} />}
    </group>
  );
};

// Orbital Clue Lobe 3D Mini View for Step 1
const OrbitalClueLobe3D = ({ count }: { count: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  // Colors for clues
  const colors: Record<number, string> = {
    2: '#06b6d4',
    3: '#22c55e',
    4: '#3b82f6',
    5: '#f59e0b',
    6: '#a855f7',
  };
  const color = colors[count] || '#3b82f6';

  return (
    <group ref={groupRef}>
      {/* Central Nucleus */}
      <Sphere args={[0.22, 24, 24]}>
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </Sphere>

      {/* Render lobe shapes based on count */}
      {count === 2 && (
        <group>
          <Sphere args={[0.45, 24, 24]} position={[-0.75, 0, 0]} scale={[1.2, 0.65, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
          <Sphere args={[0.45, 24, 24]} position={[0.75, 0, 0]} scale={[1.2, 0.65, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
        </group>
      )}

      {count === 3 && (
        <group>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, 0, angle]}>
              <Sphere args={[0.42, 24, 24]} position={[0, 0.7, 0]} scale={[0.6, 1.1, 0.6]}>
                <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
              </Sphere>
            </group>
          ))}
        </group>
      )}

      {count === 4 && (
        <group>
          {[
            [0, 0.7, 0],
            [0.6, -0.35, 0],
            [-0.3, -0.35, 0.5],
            [-0.3, -0.35, -0.5],
          ].map((pos, idx) => (
            <Sphere key={idx} args={[0.38, 24, 24]} position={pos as any}>
              <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
            </Sphere>
          ))}
        </group>
      )}

      {count >= 5 && (
        <group>
          {[
            [0, 0.7, 0],
            [0, -0.7, 0],
            [0.6, 0, 0],
            [-0.3, 0, 0.5],
            [-0.3, 0, -0.5],
          ].map((pos, idx) => (
            <Sphere key={idx} args={[0.35, 24, 24]} position={pos as any}>
              <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
            </Sphere>
          ))}
        </group>
      )}
    </group>
  );
};

// ── MAIN PAGE COMPONENT ──────────────────────────────────────────────────────
export default function HybridizationMatchPuzzleGamePage({
  difficulty = 'hard'
}: {
  difficulty?: string;
}) {
  const router = useRouter();

  // Intro Target Screen State
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  // ── Game State ─────────────────────────────────────────────────────────────

  // Step 1 Orbital Clue assignments: count (2,3,4,5,6) -> assigned hybridization string
  const [clueAnswers, setClueAnswers] = useState<Record<number, string | null>>({
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
  });

  // Step 1 completion / Box Unlocking flag
  const [boxesUnlocked, setBoxesUnlocked] = useState<boolean>(false);
  // Collapsed state for Step 1 when boxes are unlocked
  const [step1Collapsed, setStep1Collapsed] = useState<boolean>(false);

  // Active inspected molecule
  const [activeMoleculeId, setActiveMoleculeId] = useState<string>('BeCl2');

  // Matched molecules mapping: moleculeId -> boxKey ('A' | 'B' | 'C' | 'D' | 'E')
  const [matchedMolecules, setMatchedMolecules] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});

  // Active step focus (1: 'Unlock', 2: 'Inspect', 3: 'Match', 4: 'Complete')
  const [activeStep, setActiveStep] = useState<number>(1);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'incorrect' | null;
    message?: string;
  } | null>(null);

  // 3D View Inspection Controls
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const controlsRef = useRef<any>(null);

  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Ref for lower section
  const mainGameplayRef = useRef<HTMLDivElement>(null);

  // Active molecule item lookup
  const activeMolecule = useMemo(() => {
    return MOLECULES.find((m) => m.id === activeMoleculeId) || MOLECULES[0];
  }, [activeMoleculeId]);

  // Matches Count (0/5)
  const matchesCount = useMemo(() => Object.keys(matchedMolecules).length, [matchedMolecules]);

  // When boxes are unlocked, auto-collapse Step 1 & bring main gameplay cleanly into view
  useEffect(() => {
    if (boxesUnlocked) {
      setStep1Collapsed(true);
      if (mainGameplayRef.current) {
        setTimeout(() => {
          mainGameplayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [boxesUnlocked]);

  // Trigger Completion Screen when all 5 molecules are correctly matched
  useEffect(() => {
    if (matchesCount === 5) {
      setActiveStep(4);
      setTimeout(() => setShowSuccessModal(true), 600);
    }
  }, [matchesCount]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Step 1: Assign Hybridization to Orbital Clue Card
  const handleAssignClue = (orbitalCount: number, selectedHybrid: string) => {
    const updated = { ...clueAnswers, [orbitalCount]: selectedHybrid };
    setClueAnswers(updated);

    const targets: Record<number, string> = {
      2: 'sp',
      3: 'sp²',
      4: 'sp³',
      5: 'sp³d',
      6: 'sp³d²',
    };

    let allCorrect = true;
    for (const c of [2, 3, 4, 5, 6]) {
      if (updated[c] !== targets[c]) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      setBoxesUnlocked(true);
      setFeedback({
        type: 'correct',
        message: '✓ Boxes Unlocked Successfully! Proceed to inspect & match molecules.',
      });
      setActiveStep(2);
    } else {
      setBoxesUnlocked(false);
    }
  };

  // Reset 3D Inspection Camera
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    setZoomLevel(1);
    setAutoRotate(true);
  };

  // Step 2 & 3: Attempt to Match Molecule to Target Box
  const handleMatchToBox = (moleculeId: string, boxKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (!boxesUnlocked) {
      setFeedback({
        type: 'incorrect',
        message: 'Complete Step 1 to unlock the hybridization boxes first.',
      });
      return;
    }

    const targetMolecule = MOLECULES.find((m) => m.id === moleculeId);
    if (!targetMolecule) return;

    if (targetMolecule.correctBox === boxKey) {
      // Correct Match!
      const updatedMatches = {
        ...matchedMolecules,
        [moleculeId]: boxKey as 'A' | 'B' | 'C' | 'D' | 'E',
      };
      setMatchedMolecules(updatedMatches);
      setActiveStep(3);

      setFeedback({
        type: 'correct',
        message: `✓ Correct! ${targetMolecule.formula} → ${targetMolecule.hybridization} hybridization`,
      });

      // Automatically select the next unmatched molecule
      const nextUnmatched = MOLECULES.find((m) => !updatedMatches[m.id]);
      if (nextUnmatched) {
        setTimeout(() => {
          setActiveMoleculeId(nextUnmatched.id);
        }, 400);
      }
    } else {
      // Incorrect Match
      setFeedback({
        type: 'incorrect',
        message: '✕ Try Again! Look closely at the 3D domain arrangement.',
      });
    }
  };

  // Full Game Reset
  const handleResetGame = () => {
    setClueAnswers({ 2: null, 3: null, 4: null, 5: null, 6: null });
    setBoxesUnlocked(false);
    setStep1Collapsed(false);
    setMatchedMolecules({});
    setActiveMoleculeId('BeCl2');
    setFeedback(null);
    setShowSuccessModal(false);
    setActiveStep(1);
  };

  // Touch Drag-and-Drop state for Mobile
  const [touchDragInfo, setTouchDragInfo] = useState<{
    active: boolean;
    moleculeId: string | null;
    x: number;
    y: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, moleculeId: string) => {
    if (!boxesUnlocked) return;
    const touch = e.touches[0];
    setActiveMoleculeId(moleculeId);
    setTouchDragInfo({
      active: true,
      moleculeId,
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragInfo || !touchDragInfo.active) return;
    const touch = e.touches[0];
    setTouchDragInfo((prev) => (prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragInfo || !touchDragInfo.active || !touchDragInfo.moleculeId) {
      setTouchDragInfo(null);
      return;
    }
    const touch = e.changedTouches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const boxCard = targetEl?.closest('[data-box-key]');
    if (boxCard) {
      const boxKey = boxCard.getAttribute('data-box-key') as 'A' | 'B' | 'C' | 'D' | 'E';
      if (boxKey) {
        handleMatchToBox(touchDragInfo.moleculeId, boxKey);
      }
    }
    setTouchDragInfo(null);
  };

  // HTML5 Drag and Drop Support
  const handleMoleculeDragStart = (e: React.DragEvent, moleculeId: string) => {
    e.dataTransfer.setData('text/plain', moleculeId);
  };

  const handleBoxDrop = (e: React.DragEvent, boxKey: 'A' | 'B' | 'C' | 'D' | 'E') => {
    e.preventDefault();
    const moleculeId = e.dataTransfer.getData('text/plain');
    if (moleculeId) {
      handleMatchToBox(moleculeId, boxKey);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-3.5 sm:p-4 gap-2.5"
    >
      {/* ── INTRO MISSION TARGET OVERLAY VIEW (COVERS FULL PAGE CONTAINER WITH BLUR) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-[#2563EB]" />
            </button>
          </div>

          {/* Central Target Text & Start Mission Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-5 z-10 px-2 sm:px-4 py-2">
            <div className="text-[#2563EB] text-[10px] sm:text-sm font-mono font-bold tracking-[0.25em] uppercase">
              HYBRIDIZATION & ORBITAL OVERLAP
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> Match Hybridization Boxes & 3D Molecular Geometries
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

      {/* Floating touch drag avatar */}
      {touchDragInfo?.active && touchDragInfo.moleculeId && (
        <div
          className="fixed z-[300] pointer-events-none px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-2xl border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5"
          style={{ left: `${touchDragInfo.x}px`, top: `${touchDragInfo.y}px` }}
        >
          <span>{MOLECULES.find((m) => m.id === touchDragInfo.moleculeId)?.formula}</span>
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER ────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Back Button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#64748B]" />
          <span>Back</span>
        </button>

        {/* Step Indicator & Progress Pills */}
        <div className="flex items-center gap-2">
          {/* Matches Counter Badge */}
          <div className="bg-white border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm text-xs font-bold text-[#1E293B]">
            <span className="text-slate-500 hidden sm:inline">Matches:</span>
            <span className="text-blue-600 font-mono font-extrabold">{matchesCount}/5</span>
          </div>

          {/* Step Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <button
              onClick={() => {
                setActiveStep(1);
                setStep1Collapsed(false);
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeStep === 1 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span>1. Unlock Boxes</span>
              {boxesUnlocked && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => boxesUnlocked && setActiveStep(2)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeStep === 2 ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span>2. Inspect</span>
              {!boxesUnlocked && <Lock className="w-3 h-3 text-slate-400" />}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <button
              onClick={() => boxesUnlocked && setActiveStep(3)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                activeStep === 3 ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span>3. Match</span>
              {!boxesUnlocked && <Lock className="w-3 h-3 text-slate-400" />}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />

            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${
              matchesCount === 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
            }`}>
              <span>4. Complete</span>
              {matchesCount === 5 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
            </div>
          </div>
        </div>

        {/* Action Controls Top Right */}
        <div className="flex items-center gap-2">
          {/* Explanation Button */}
          <button
            onClick={() => setShowSuccessModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Explanation</span>
          </button>

          <button
            onClick={handleResetGame}
            title="Reset Challenge"
            className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ── STEP 1 BOX: UNLOCK THE HYBRIDIZATION BOXES ─────────────────────── */}
      <section className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative shrink-0">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full font-extrabold text-xs flex items-center justify-center transition-all ${
              boxesUnlocked
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-blue-50 text-blue-700 border border-blue-300'
            }`}>
              {boxesUnlocked ? '✓' : '1'}
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-[#1E293B] flex items-center gap-2">
                <span>Unlock the Hybridization Boxes</span>
                {boxesUnlocked && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Unlocked (5/5 Clues Solved)
                  </span>
                )}
              </h2>
              {!step1Collapsed && (
                <p className="text-[11px] text-[#64748B] font-medium">Match the number of hybrid orbitals to the correct hybridization.</p>
              )}
            </div>
          </div>

          {/* Toggle Button when Unlocked */}
          {boxesUnlocked && (
            <button
              onClick={() => setStep1Collapsed((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#1E293B] transition-all cursor-pointer"
            >
              <span>{step1Collapsed ? 'View Clues' : 'Hide Clues'}</span>
              {step1Collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Expanded Step 1 Content */}
        {!step1Collapsed && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
              {[2, 3, 4, 5, 6].map((count) => {
                const assigned = clueAnswers[count];
                const targets: Record<number, string> = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
                const isCorrect = assigned === targets[count];

                return (
                  <div
                    key={count}
                    className={`bg-slate-50 border rounded-2xl p-2.5 flex flex-col items-center justify-between text-center transition-all ${
                      isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : assigned
                          ? 'border-blue-300'
                          : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* 3D Mini Canvas Lobe */}
                    <div className="w-full h-20 rounded-xl bg-white border border-slate-200 overflow-hidden relative shadow-inner pointer-events-none">
                      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
                        <ambientLight intensity={1.0} />
                        <directionalLight position={[3, 4, 2]} intensity={1.4} />
                        <OrbitalClueLobe3D count={count} />
                      </Canvas>
                    </div>

                    <span className="text-xs font-extrabold text-[#1E293B] mt-2">{count} hybrid orbitals</span>

                    {/* Dropdown Selector */}
                    <select
                      disabled={boxesUnlocked}
                      value={assigned || ''}
                      onChange={(e) => handleAssignClue(count, e.target.value)}
                      className={`mt-2 w-full text-xs font-mono font-bold rounded-xl px-2 py-1 text-center border focus:outline-none transition-all ${
                        boxesUnlocked || isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 cursor-default'
                          : assigned
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-white border-slate-200 text-[#1E293B] hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="sp">sp</option>
                      <option value="sp²">sp²</option>
                      <option value="sp³">sp³</option>
                      <option value="sp³d">sp³d</option>
                      <option value="sp³d²">sp³d²</option>
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Green Banner Below Cards when Unlocked */}
            {boxesUnlocked && (
              <div className="w-full py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold text-center flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Boxes Unlocked Successfully! Proceed to inspect & match molecules below.</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── STEP 2 & 3: MAIN 3-PANEL GAMEPLAY AREA ─────────────────────────── */}
      <div
        ref={mainGameplayRef}
        className={`flex flex-col sm:flex-row gap-3 items-stretch transition-all duration-300 flex-1 min-h-0 ${
          !boxesUnlocked ? 'opacity-60 filter grayscale-[20%]' : 'opacity-100'
        }`}
      >
        {/* ── PANEL 1 (LEFT): (2) MOLECULES (35% Width) ────────────────────── */}
        <section className="w-full sm:w-[35%] order-1 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm min-h-0 flex-1">
          <div className="flex flex-col flex-1 min-h-0 justify-between">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 shrink-0">
              <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                2
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1E293B]">Molecules</h3>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium truncate">Select a molecule to view 3D structure and drag to box.</p>
              </div>
            </div>

            {/* 5 Molecule Cards Grid (Auto-Scales cleanly inside Panel, NO Scrollbars) */}
            <div className="grid grid-cols-2 gap-1.5 p-0.5 flex-1 min-h-0 auto-rows-fr">
              {MOLECULES.map((mol) => {
                const isMatched = !!matchedMolecules[mol.id];
                const isSelected = activeMoleculeId === mol.id;
                const cardStyle = MOLECULE_CARD_STYLES[mol.id] || MOLECULE_CARD_STYLES.BeCl2;

                return (
                  <div
                    key={mol.id}
                    draggable={!isMatched && boxesUnlocked}
                    onDragStart={(e) => handleMoleculeDragStart(e, mol.id)}
                    onTouchStart={(e) => handleTouchStart(e, mol.id)}
                    onClick={() => boxesUnlocked && setActiveMoleculeId(mol.id)}
                    className={`border-2 rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between text-center cursor-pointer transition-all relative h-full w-full min-h-0 ${cardStyle.bg} ${
                      isMatched
                        ? 'border-emerald-400 bg-emerald-50/50'
                        : isSelected
                          ? `${cardStyle.glow} scale-[1.01]`
                          : `${cardStyle.border} ${cardStyle.hover}`
                    }`}
                  >
                    <Move className="w-3 h-3 text-slate-400 opacity-60 absolute top-1 right-1 pointer-events-none" />

                    {isMatched && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-[9px] shadow-sm z-10">
                        ✓
                      </div>
                    )}

                    <div className="w-full flex-1 min-h-[30px] rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner">
                      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                        <ambientLight intensity={1.0} />
                        <directionalLight position={[4, 5, 3]} intensity={1.3} />
                        <Molecule3DRenderer code={mol.id} autoRotate={!isMatched} showLabels={false} />
                      </Canvas>
                    </div>

                    <div className="mt-0.5 text-center shrink-0">
                      <div className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] leading-tight">{mol.formula}</div>
                      <div className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#64748B] truncate max-w-[80px] sm:max-w-none">{mol.centralAtomName}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!boxesUnlocked && (
            <div className="w-full mt-1.5 p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-[10px] font-bold text-[#64748B] flex items-center justify-center gap-1.5 shrink-0">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Complete Step 1 to unlock molecules.</span>
            </div>
          )}
        </section>

        {/* ── PANEL 2 (MIDDLE): (3) HYBRIDIZATION BOXES (35% Width) ────────── */}
        <section className="w-full sm:w-[35%] order-2 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm min-h-0 flex-1">
          <div className="flex flex-col flex-1 min-h-0 justify-between">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 shrink-0">
              <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                3
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#1E293B]">Hybridization Boxes</h3>
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium truncate">Drag the molecule to the correct box.</p>
              </div>
            </div>

            {/* 5 Target Box Cards Grid (Auto-Scales cleanly inside Panel, NO Scrollbars) */}
            <div className="grid grid-cols-2 gap-1.5 p-0.5 flex-1 min-h-0 auto-rows-fr">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((boxKey) => {
                const info = BOX_MAPPINGS[boxKey];
                const matchedMolId = Object.keys(matchedMolecules).find(
                  (mId) => matchedMolecules[mId] === boxKey
                );
                const matchedMol = MOLECULES.find((m) => m.id === matchedMolId);

                return (
                  <div
                    key={boxKey}
                    data-box-key={boxKey}
                    onDrop={(e) => handleBoxDrop(e, boxKey)}
                    onDragOver={handleDragOver}
                    onClick={() => boxesUnlocked && handleMatchToBox(activeMoleculeId, boxKey)}
                    className={`bg-slate-50 border-2 rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer h-full w-full min-h-0 ${
                      matchedMol
                        ? 'border-emerald-400 bg-emerald-50/50 shadow-sm cursor-default'
                        : !info.isUsed
                          ? 'border-slate-200 opacity-40 cursor-not-allowed'
                          : 'border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="text-center shrink-0">
                      <div className="text-xs sm:text-sm font-extrabold text-[#1E293B] leading-none">{boxKey}</div>
                      <div className="text-[9.5px] sm:text-[10.5px] font-mono font-bold text-blue-700 mt-0.5">{info.hybridization}</div>
                    </div>

                    {/* Drop Zone Box */}
                    <div className={`w-full mt-0.5 flex-1 min-h-[26px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                      matchedMol
                        ? 'border-emerald-300 bg-white text-emerald-800 font-extrabold text-xs'
                        : 'border-slate-300 bg-white text-[#64748B]'
                    }`}>
                      {matchedMol ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] font-extrabold text-emerald-800">{matchedMol.formula}</span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-extrabold">✓</span>
                        </div>
                      ) : (
                        <span className="text-[8.5px] font-mono font-bold text-[#64748B]">DROP</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PANEL 3 (RIGHT): 3D MOLECULE INSPECTION VIEWER (30% Width) ───── */}
        <section className="w-full sm:w-[30%] order-3 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm min-h-0 flex-1">
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E293B] tracking-tight truncate">{activeMolecule.formula}</h3>
                <p className="text-[11px] font-bold text-[#64748B] truncate">{activeMolecule.centralAtomName}</p>
              </div>

              {feedback && (
                <div className={`px-2 py-0.5 rounded-xl text-[9.5px] font-bold border transition-all shrink-0 ml-1.5 ${
                  feedback.type === 'correct'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {feedback.message}
                </div>
              )}
            </div>
          </div>

          {/* 3D Canvas View Container */}
          <div className="relative bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex-1 min-h-[160px] flex items-center justify-center shadow-inner my-0.5">
            <Canvas camera={{ position: [0, 0, 5.2 / zoomLevel], fov: 45 }}>
              <ambientLight intensity={1.0} />
              <directionalLight position={[5, 6, 4]} intensity={1.4} />
              <directionalLight position={[-5, -4, -3]} intensity={0.4} />
              <Molecule3DRenderer code={activeMolecule.id} isHighlighted={true} autoRotate={autoRotate} showLabels={false} />
              <OrbitControls ref={controlsRef} enableZoom={true} />
            </Canvas>

            {/* Bottom Control Buttons */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-start gap-1.5 z-10 pointer-events-auto">
              <button
                onClick={() => setAutoRotate((prev) => !prev)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  autoRotate
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-[#1E293B]'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rotate</span>
              </button>

              <button
                onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.3 : 1))}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
                <span>Zoom</span>
              </button>

              <button
                onClick={handleResetCamera}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── FINAL COMPLETION & THEORY MODAL ───────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-center animate-in fade-in zoom-in-95 my-auto text-[#1E293B]">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto mb-3 shadow-sm">
              <BookOpen className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-[#1E293B] tracking-tight mb-1">
              🎉 Hybridization Match Complete!
            </h2>
            <p className="text-xs text-[#64748B] font-medium mb-4">
              Successfully matched all 5 molecules to their correct hybridization boxes!
            </p>

            <div className="inline-block bg-emerald-50 border border-emerald-200 px-4 py-1 rounded-full text-xs font-bold text-emerald-800 mb-4 font-mono">
              Score: 5/5 Correct
            </div>

            {/* Summary Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left mb-5 overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-blue-700 border-b border-slate-200 text-[10.5px]">
                    <th className="pb-1.5 font-bold text-left">Molecule</th>
                    <th className="pb-1.5 font-bold text-center">Hybridization</th>
                    <th className="pb-1.5 font-bold text-right">Geometry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MOLECULES.map((m) => (
                    <tr key={m.id} className="text-[#1E293B]">
                      <td className="py-1.5 font-bold">{m.formula} ({m.name})</td>
                      <td className="py-1.5 text-center text-blue-700 font-bold">{m.hybridization}</td>
                      <td className="py-1.5 text-right text-purple-700">{m.geometry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleResetGame}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1E293B] py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
              >
                Replay Challenge
              </button>

              <button
                onClick={() => router.back()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <span>Back to Topic</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
