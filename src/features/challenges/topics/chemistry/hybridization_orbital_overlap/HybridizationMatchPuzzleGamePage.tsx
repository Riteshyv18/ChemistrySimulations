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
  ChevronRight,
  Eye,
  Maximize2,
  ArrowLeft,
  Play
} from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';
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
  difficulty = 'level3',
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  // Intro Target Screen State
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);

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
  const [showHud, setShowHud] = useState<boolean>(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReset = () => {
    setMatchedMolecules({});
    setClueAnswers({});
    setBoxesUnlocked(false);
    setActiveStep(1);
    setStep1Collapsed(false);
    setShowSuccessModal(false);
    setFeedback(null);
  };

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
      className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-2.5 gap-1.5 sm:gap-2"
    >
      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY (NO SCROLL AT HEIGHT 376) ── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-2 sm:p-4 bg-white/80 backdrop-blur-md overflow-hidden">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] sm:text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN (COMPACT, FITS AT HEIGHT 376) */}
          {introStep === 'mission' && (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-2 sm:space-y-3 z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[9.5px] sm:text-[11px] font-mono font-bold tracking-[0.2em] uppercase">
                HYBRIDIZATION & ORBITAL OVERLAP
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Match Hybridization Boxes & 3D Molecular Geometries
              </h1>

              <div className="pt-2 sm:pt-3">
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

          {/* STEP 2: INSTRUCTIONS SCREEN (WITH IMAGES, NO SUBTITLE TEXT, FULLY VISIBLE AT HEIGHT 376) */}
          {introStep === 'instructions' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-1.5 sm:space-y-2 z-10 px-2 sm:px-3 py-0.5 animate-in fade-in duration-200 w-full">
              <div className="text-[#1E293B] text-sm sm:text-base font-black tracking-wide">
                Instructions
              </div>

              <div className="space-y-1.5 text-left max-w-xl mx-auto">
                {/* 1. Unlock boxes */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2.5 transition-all hover:border-blue-300">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm">
                      1
                    </div>
                    <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                      Select the correct hybridization to unlock the hybridization boxes.
                    </p>
                  </div>
                  <div className="w-16 sm:w-20 h-7 sm:h-8 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                    <img
                      src="/images/hybridization/l3_step1_unlock_boxes.svg"
                      alt="Step 1: Unlock boxes"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Match molecules */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2.5 transition-all hover:border-blue-300">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-sm">
                      2
                    </div>
                    <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                      Tap or drag each molecule to drop it into its matching hybridization box.
                    </p>
                  </div>
                  <div className="w-16 sm:w-20 h-7 sm:h-8 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                    <img
                      src="/images/hybridization/l3_step2_drop_molecules.svg"
                      alt="Step 2: Drop molecules"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play (Guaranteed visible at height 376) */}
              <div className="pt-1.5 sm:pt-2 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-5 sm:px-6 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-6 sm:px-8 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
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

      {/* Floating touch drag avatar */}
      {touchDragInfo?.active && touchDragInfo.moleculeId && (
        <div
          className="fixed z-[300] pointer-events-none px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-2xl border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5"
          style={{ left: `${touchDragInfo.x}px`, top: `${touchDragInfo.y}px` }}
        >
          <span>{MOLECULES.find((m) => m.id === touchDragInfo.moleculeId)?.formula}</span>
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER (EXIT, TARGET COMPLETED BADGE, EXPLANATION) ── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Top Left: Exit Button Only */}
        <button
          type="button"
          onClick={() => (onExit ? onExit() : exitSimulation())}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
          title="Exit Simulation (Back to App)"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>EXIT</span>
        </button>

        {/* Center: Target Completed Badge (shown with green light color as used in Level 1 & Level 2) */}
        {matchesCount === 5 ? (
          <div className="bg-emerald-600/85 border border-emerald-400/60 backdrop-blur-md text-white px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-md flex items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-300">
            <div className="w-4 h-4 rounded-md bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-100 leading-tight">
                Target Completed (100%)
              </div>
              <div className="text-[9px] sm:text-[10px] font-medium text-white/95 leading-tight hidden xs:block">
                All 5 Molecules Successfully Matched to Hybridization Boxes!
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Top Right: Explanation Button Only */}
        <button
          type="button"
          onClick={() => setShowExplanationModal(true)}
          className="h-8 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5 text-purple-700 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
          title="View Theory & Explanation"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-600" />
          <span>Explanation</span>
        </button>
      </div>

      {/* ── MAIN GAMEPLAY AREA ── */}
      {!boxesUnlocked ? (
        /* ── PHASE 1: STEP 1 UNLOCK THE HYBRIDIZATION BOXES (5 ORBITAL CARDS GRID) ── */
        <section className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-2 sm:p-3 shadow-sm flex flex-col justify-between min-h-0 overflow-hidden">
          {/* Header Row */}
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-slate-100 shrink-0">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-[#1E293B]">
                Unlock the Hybridization Boxes
              </h2>
              <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium">
                Match the number of hybrid orbitals to the correct hybridization.
              </p>
            </div>
          </div>

          {/* 5 Orbital Cards Grid */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 flex-1 min-h-0 items-stretch py-1">
            {[2, 3, 4, 5, 6].map((count) => {
              const assigned = clueAnswers[count];
              const targets: Record<number, string> = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
              const isCorrect = assigned === targets[count];

              return (
                <div
                  key={count}
                  className={`bg-slate-50 border rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-between text-center transition-all ${
                    isCorrect
                      ? 'border-emerald-400 bg-emerald-50/60 shadow-xs'
                      : assigned
                        ? 'border-blue-300'
                        : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {/* 3D Mini Canvas Lobe */}
                  <div className="w-full flex-1 min-h-[70px] rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner pointer-events-none">
                    <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
                      <ambientLight intensity={1.1} />
                      <directionalLight position={[3, 4, 2]} intensity={1.5} />
                      <OrbitalClueLobe3D count={count} />
                    </Canvas>
                  </div>

                  <span className="text-[10px] sm:text-xs font-extrabold text-[#1E293B] mt-1 shrink-0">
                    {count} hybrid orbitals
                  </span>

                  {/* Dropdown Selector */}
                  <select
                    disabled={boxesUnlocked}
                    value={assigned || ''}
                    onChange={(e) => handleAssignClue(count, e.target.value)}
                    className={`mt-1 w-full text-[10px] sm:text-xs font-mono font-bold rounded-lg px-1.5 py-1 text-center border focus:outline-none transition-all cursor-pointer ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : assigned
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-slate-200 text-[#1E293B] hover:border-blue-300'
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
        </section>
      ) : (
        /* ── PHASE 2: STEP 2 & 3: MAIN 3-PANEL GAMEPLAY AREA (NO BANNER, 100% HEIGHT) ── */
        <div
          ref={mainGameplayRef}
          className="flex-1 w-full flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch min-h-0 animate-in fade-in duration-300"
        >
          {/* ── PANEL 1 (LEFT): (2) MOLECULES (35% Width) ────────────────────── */}
          <section className="w-full sm:w-[35%] bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-sm min-h-0 flex-1">
            <div className="flex flex-col flex-1 min-h-0 justify-between">
              <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-100 shrink-0">
                <div className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-extrabold text-[#1E293B] leading-tight">Molecules</h3>
                  <p className="text-[9.5px] text-[#64748B] font-medium truncate">Select a molecule to view 3D structure and drop into box.</p>
                </div>
              </div>

              {/* 5 Molecule Cards Grid */}
              <div className="grid grid-cols-2 gap-1 p-0.5 flex-1 min-h-0 auto-rows-fr">
                {MOLECULES.map((mol) => {
                  const isMatched = !!matchedMolecules[mol.id];
                  const isSelected = activeMoleculeId === mol.id;
                  const cardStyle = MOLECULE_CARD_STYLES[mol.id] || MOLECULE_CARD_STYLES.BeCl2;

                  return (
                    <div
                      key={mol.id}
                      draggable={!isMatched}
                      onDragStart={(e) => handleMoleculeDragStart(e, mol.id)}
                      onTouchStart={(e) => handleTouchStart(e, mol.id)}
                      onClick={() => setActiveMoleculeId(mol.id)}
                      className={`border-2 rounded-xl p-1 flex flex-col items-center justify-between text-center cursor-pointer transition-all relative h-full w-full min-h-0 ${cardStyle.bg} ${
                        isMatched
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : isSelected
                            ? `${cardStyle.glow} scale-[1.01]`
                            : `${cardStyle.border} ${cardStyle.hover}`
                      }`}
                    >
                      <Move className="w-2.5 h-2.5 text-slate-400 opacity-60 absolute top-1 right-1 pointer-events-none" />

                      {isMatched && (
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 text-white font-extrabold flex items-center justify-center text-[8px] shadow-sm z-10">
                          ✓
                        </div>
                      )}

                      <div className="w-full flex-1 min-h-[28px] rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner">
                        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
                          <ambientLight intensity={1.1} />
                          <directionalLight position={[4, 5, 3]} intensity={1.3} />
                          <Molecule3DRenderer code={mol.id} autoRotate={!isMatched} showLabels={false} />
                        </Canvas>
                      </div>

                      <div className="mt-0.5 text-center shrink-0">
                        <div className="text-[10px] sm:text-[11px] font-extrabold text-[#1E293B] leading-tight">{mol.formula}</div>
                        <div className="text-[8px] sm:text-[9px] font-semibold text-[#64748B] truncate max-w-[80px] sm:max-w-none">{mol.centralAtomName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── PANEL 2 (MIDDLE): (3) HYBRIDIZATION BOXES (35% Width) ────────── */}
          <section className="w-full sm:w-[35%] bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-sm min-h-0 flex-1">
            <div className="flex flex-col flex-1 min-h-0 justify-between">
              <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-100 shrink-0">
                <div className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-extrabold text-[#1E293B] leading-tight">Hybridization Boxes</h3>
                  <p className="text-[9.5px] text-[#64748B] font-medium truncate">Drag or tap molecule to the correct box.</p>
                </div>
              </div>

              {/* 5 Target Box Cards Grid */}
              <div className="grid grid-cols-2 gap-1 p-0.5 flex-1 min-h-0 auto-rows-fr">
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
                      onClick={() => handleMatchToBox(activeMoleculeId, boxKey)}
                      className={`bg-slate-50 border-2 rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer h-full w-full min-h-0 ${
                        matchedMol
                          ? 'border-emerald-400 bg-emerald-50/50 shadow-sm cursor-default'
                          : 'border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:scale-[1.01]'
                      }`}
                    >
                      <div className="text-center shrink-0">
                        <div className="text-xs sm:text-sm font-extrabold text-[#1E293B] leading-none">{boxKey}</div>
                        <div className="text-[9px] sm:text-[10px] font-mono font-bold text-blue-700 mt-0.5">{info.hybridization}</div>
                      </div>

                      {/* Drop Zone Box */}
                      <div className={`w-full mt-0.5 flex-1 min-h-[24px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                        matchedMol
                          ? 'border-emerald-300 bg-white text-emerald-800 font-extrabold text-xs'
                          : 'border-slate-300 bg-white text-[#64748B]'
                      }`}>
                        {matchedMol ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9.5px] font-extrabold text-emerald-800">{matchedMol.formula}</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white text-[7.5px] flex items-center justify-center font-extrabold">✓</span>
                          </div>
                        ) : (
                          <span className="text-[8px] font-mono font-bold text-[#64748B]">DROP</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── PANEL 3 (RIGHT): 3D MOLECULE INSPECTION VIEWER (30% Width) ───── */}
          <section className="w-full sm:w-[30%] bg-white border border-slate-200 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-sm min-h-0 flex-1">
            <div className="shrink-0">
              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#1E293B] tracking-tight truncate">{activeMolecule.formula}</h3>
                  <p className="text-[10px] font-bold text-[#64748B] truncate">{activeMolecule.centralAtomName}</p>
                </div>

                {feedback && (
                  <div className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all shrink-0 ml-1 ${
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
            <div className="relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-[120px] flex items-center justify-center shadow-inner my-0.5">
              <Canvas camera={{ position: [0, 0, 5.2 / zoomLevel], fov: 45 }}>
                <ambientLight intensity={1.1} />
                <directionalLight position={[5, 6, 4]} intensity={1.4} />
                <directionalLight position={[-5, -4, -3]} intensity={0.4} />
                <Molecule3DRenderer code={activeMolecule.id} isHighlighted={true} autoRotate={autoRotate} showLabels={false} />
                <OrbitControls ref={controlsRef} enableZoom={true} />
              </Canvas>

              {/* Bottom Control Buttons */}
              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap items-center justify-start gap-1 z-10 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setAutoRotate((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                    autoRotate
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-[#1E293B]'
                  }`}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Rotate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => (prev === 1 ? 1.3 : 1))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-2.5 h-2.5" />
                  <span>Zoom</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-[#1E293B] hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── EDUCATIONAL EXPLANATION & THEORY PAGE (FULL CANVAS / WHOLE SCREEN) ── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-[#1E293B] animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-2 sm:py-2.5 border-b border-slate-200 bg-white shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-base font-black text-slate-900 leading-tight">
                  Hybridization & Molecular Geometries Guide
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                  Mastering Steric Numbers, Hybrid Orbitals, and 3D Molecular Shapes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
              title="Close Explanation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm text-slate-700 font-sans">
              {/* Section 1: Core Principles */}
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                    1
                  </div>
                  <h3>Principles of Orbital Hybridization</h3>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                  Hybridization is the mathematical and quantum mechanical mixing of atomic orbitals (such as s, p, and d) of comparable energies in the valence shell of an atom. When bonds form, these mixed orbitals produce an equal number of new, degenerate <strong>hybrid orbitals</strong>. These hybrid orbitals feature concentrated directional electron lobes that maximize spatial separation and orbital overlap with neighboring atoms, thereby minimizing electrostatic electron-pair repulsions according to VSEPR theory.
                </p>
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-800">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Golden Rule:</strong> Number of Hybrid Orbitals Formed = Number of Pure Atomic Orbitals Mixed.
                    <br />
                    • 1s + 1p → <strong>2 sp</strong> orbitals (180° apart)
                    <br />
                    • 1s + 2p → <strong>3 sp²</strong> orbitals (120° apart)
                    <br />
                    • 1s + 3p → <strong>4 sp³</strong> orbitals (109.5° apart)
                    <br />
                    • 1s + 3p + 1d → <strong>5 sp³d</strong> orbitals (90° and 120° apart)
                    <br />
                    • 1s + 3p + 2d → <strong>6 sp³d²</strong> orbitals (all 90° apart)
                  </div>
                </div>
              </div>

              {/* Section 2: Master Reference Table */}
              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-purple-900 font-extrabold text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                    2
                  </div>
                  <h3>Master Quick Reference Table</h3>
                </div>
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2">Molecule</th>
                        <th className="p-2">Central Atom</th>
                        <th className="p-2">Steric No.</th>
                        <th className="p-2">Hybridization</th>
                        <th className="p-2">Geometry</th>
                        <th className="p-2">Bond Angles</th>
                        <th className="p-2">Net Dipole (μ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-cyan-700">BeCl₂</td>
                        <td className="p-2">Beryllium (Z=4)</td>
                        <td className="p-2 font-mono">2</td>
                        <td className="p-2 font-bold font-mono text-blue-700">sp</td>
                        <td className="p-2 font-semibold">Linear</td>
                        <td className="p-2 font-mono">180°</td>
                        <td className="p-2 font-mono text-emerald-600">0 (Non-polar)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-emerald-700">BF₃</td>
                        <td className="p-2">Boron (Z=5)</td>
                        <td className="p-2 font-mono">3</td>
                        <td className="p-2 font-bold font-mono text-emerald-700">sp²</td>
                        <td className="p-2 font-semibold">Trigonal Planar</td>
                        <td className="p-2 font-mono">120°</td>
                        <td className="p-2 font-mono text-emerald-600">0 (Non-polar)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-purple-700">CH₄</td>
                        <td className="p-2">Carbon (Z=6)</td>
                        <td className="p-2 font-mono">4</td>
                        <td className="p-2 font-bold font-mono text-purple-700">sp³</td>
                        <td className="p-2 font-semibold">Tetrahedral</td>
                        <td className="p-2 font-mono">109.5°</td>
                        <td className="p-2 font-mono text-emerald-600">0 (Non-polar)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-amber-700">PCl₅</td>
                        <td className="p-2">Phosphorus (Z=15)</td>
                        <td className="p-2 font-mono">5</td>
                        <td className="p-2 font-bold font-mono text-amber-700">sp³d</td>
                        <td className="p-2 font-semibold">Trigonal Bipyramidal</td>
                        <td className="p-2 font-mono">90° (ax) & 120° (eq)</td>
                        <td className="p-2 font-mono text-emerald-600">0 (Non-polar)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-rose-700">SF₆</td>
                        <td className="p-2">Sulfur (Z=16)</td>
                        <td className="p-2 font-mono">6</td>
                        <td className="p-2 font-bold font-mono text-rose-700">sp³d²</td>
                        <td className="p-2 font-semibold">Octahedral</td>
                        <td className="p-2 font-mono">90° (all adjacent)</td>
                        <td className="p-2 font-mono text-emerald-600">0 (Non-polar)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Detailed Molecule-by-Molecule Theory */}
              <div className="space-y-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                    3
                  </div>
                  <h3>Comprehensive Theory for All 5 Molecules</h3>
                </div>

                {/* 1. BeCl2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-blue-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono text-xs">Box A</span>
                      BeCl₂ — Beryllium Dichloride
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs font-mono">
                      sp Hybridization • Linear (180°)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Configuration</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Ground State Be (Z=4):</strong> 1s² 2s² (zero unpaired electrons)
                        <br />
                        • <strong>Excited State:</strong> One 2s electron promotes to 2pₓ → 1s² 2s¹ 2pₓ¹
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orbital Mixing & Geometry</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Mixing:</strong> 1s + 1p orbital combine to yield <strong>2 sp hybrid orbitals</strong>
                        <br />
                        • <strong>Orientation:</strong> Collinear at <strong>180°</strong> along the internuclear axis
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Bonding & Chemical Details:</strong> Each of the two sp hybrid orbitals on Be overlaps axially (head-on) with a half-filled 3p_z orbital from a Chlorine atom, generating two identical, highly directional σ(Be–Cl) bonds. The two bond dipole vectors are equal in magnitude and point in exactly opposite directions (180°), completely canceling each other (μ = 0 D). Two unhybridized 2p orbitals (2p_y, 2p_z) on Beryllium remain empty.
                  </p>
                </div>

                {/* 2. BF3 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-emerald-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-mono text-xs">Box B</span>
                      BF₃ — Boron Trifluoride
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs font-mono">
                      sp² Hybridization • Trigonal Planar (120°)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Configuration</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Ground State B (Z=5):</strong> 1s² 2s² 2p¹ (1 unpaired electron)
                        <br />
                        • <strong>Excited State:</strong> 2s electron unpairs and promotes to 2p_y → 1s² 2s¹ 2pₓ¹ 2p_y¹
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orbital Mixing & Geometry</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Mixing:</strong> One 2s + two 2p (2pₓ, 2p_y) mix to form <strong>3 sp² hybrid orbitals</strong>
                        <br />
                        • <strong>Orientation:</strong> Planar, directed to vertices of an equilateral triangle at <strong>120°</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Bonding & Chemical Details:</strong> The three sp² hybrid orbitals overlap head-on with singly occupied 2p_z orbitals of 3 Fluorine atoms, forming three strong σ(B–F) bonds. The remaining unhybridized 2p_z orbital lies perpendicular to the triangular plane and stays vacant. Because Boron only possesses 6 valence electrons around it in BF₃, it has an incomplete octet and acts as a quintessential <em>Lewis acid</em>, readily accepting electron pairs from Lewis bases (like NH₃). Symmetrical triangular cancellation gives μ = 0 D.
                  </p>
                </div>

                {/* 3. CH4 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-purple-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-mono text-xs">Box C</span>
                      CH₄ — Methane
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-bold text-xs font-mono">
                      sp³ Hybridization • Tetrahedral (109.5°)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Configuration</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Ground State C (Z=6):</strong> 1s² 2s² 2pₓ¹ 2p_y¹ (2 unpaired electrons)
                        <br />
                        • <strong>Excited State:</strong> 2s electron promotes to 2p_z → 1s² 2s¹ 2pₓ¹ 2p_y¹ 2p_z¹ (tetravalent)
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orbital Mixing & Geometry</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Mixing:</strong> One 2s + three 2p orbitals mix to form <strong>4 equivalent sp³ hybrid orbitals</strong>
                        <br />
                        • <strong>Orientation:</strong> Point toward vertices of a regular tetrahedron at <strong>109.5°</strong> (109°28')
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Bonding & Chemical Details:</strong> Each sp³ hybrid orbital on Carbon overlaps axially with the spherical 1s orbital of a Hydrogen atom to form 4 equivalent, exceptionally strong σ(C–H) bonds. Each C–H bond length is identical (108.7 pm) with equal bond dissociation energy (435 kJ/mol). The regular tetrahedral geometry distributes the electron density symmetrically in 3D space, meaning all individual bond dipoles cancel completely (μ = 0 D), rendering methane non-polar and chemically stable.
                  </p>
                </div>

                {/* 4. PCl5 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-mono text-xs">Box D</span>
                      PCl₅ — Phosphorus Pentachloride
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs font-mono">
                      sp³d Hybridization • Trigonal Bipyramidal (90° & 120°)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Configuration & Expanded Octet</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Ground State P (Z=15):</strong> [Ne] 3s² 3pₓ¹ 3p_y¹ 3p_z¹
                        <br />
                        • <strong>Excited State:</strong> 3s electron promotes to vacant 3d_z² orbital → [Ne] 3s¹ 3p³ 3d_z²¹ (5 unpaired electrons)
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orbital Mixing & Geometry</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Mixing:</strong> 1s + 3p + 1d (d_z²) combine into <strong>5 sp³d hybrid orbitals</strong>
                        <br />
                        • <strong>Orientation:</strong> Trigonal Bipyramid with <strong>3 equatorial bonds</strong> (120°) and <strong>2 axial bonds</strong> (90° to equatorial, 180° to each other)
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-100/60 border border-amber-300/80 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Crucial Scientific Concept: Axial vs Equatorial Bond Asymmetry
                    </div>
                    <p className="leading-relaxed">
                      In PCl₅, the 5 bonds are <strong>not equivalent</strong>! The two axial P–Cl bonds experience greater repulsion (repelled by 3 equatorial electron pairs at 90°) than the equatorial bonds (repelled by only 2 axial pairs at 90°). Consequently, the <strong>axial bonds are longer (214 pm) and weaker</strong> than the <strong>equatorial bonds (202 pm)</strong>. This explains why PCl₅ is thermally reactive and easily dissociates when heated:
                      <br />
                      <span className="font-mono font-bold text-slate-800 bg-white/80 px-2 py-0.5 rounded inline-block mt-1">
                        PCl₅(g) ⇌ PCl₃(g) + Cl₂(g)
                      </span>
                    </p>
                  </div>
                </div>

                {/* 5. SF6 */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-extrabold text-sm text-rose-900 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-mono text-xs">Box E</span>
                      SF₆ — Sulfur Hexafluoride
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs font-mono">
                      sp³d² Hybridization • Octahedral (All 90°)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Electronic Configuration & Expanded Octet</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Ground State S (Z=16):</strong> [Ne] 3s² 3pₓ² 3p_y¹ 3p_z¹ (2 unpaired electrons)
                        <br />
                        • <strong>Excited State:</strong> 3s and 3p electrons promote to 3d_x²-y² and 3d_z² → [Ne] 3s¹ 3p³ 3d² (6 unpaired electrons)
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Orbital Mixing & Geometry</div>
                      <div className="mt-0.5 text-slate-700">
                        • <strong>Mixing:</strong> 1s + 3p + 2d (d_x²-y², d_z²) mix to form <strong>6 equivalent sp³d² hybrid orbitals</strong>
                        <br />
                        • <strong>Orientation:</strong> Regular Octahedron (square bipyramid); <strong>all adjacent bond angles are 90°</strong> (trans angles 180°)
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Bonding & Chemical Inertness:</strong> All 6 S–F bonds are completely identical in length (156 pm) and strength. The 6 highly electronegative Fluorine atoms form an octahedral steric cage that tightly encloses and shields the central Sulfur atom. This exceptional steric shielding makes SF₆ chemically unreactive, non-flammable, non-toxic, and an extraordinary electrical insulator widely used in high-voltage circuit breakers and power substations. Symmetrical cancellation guarantees μ = 0 D.
                  </p>
                </div>
              </div>

              {/* Section 4: Fast Calculation / Exam Shortcut */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm sm:text-base">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">
                    4
                  </div>
                  <h3>Quick Steric Number Formula for Competitive Exams</h3>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1.5">
                  <div className="font-mono font-bold text-emerald-800 bg-white/90 p-1.5 rounded-lg border border-emerald-200 text-center">
                    Steric Number (SN) = (Number of σ-Bonds) + (Number of Lone Pairs on Central Atom)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-center font-mono text-[11px]">
                    <div className="bg-white p-1 rounded-lg border border-emerald-200">
                      <strong>SN = 2</strong> → sp
                      <div className="text-[10px] text-slate-500 font-sans">Linear (180°)</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-emerald-200">
                      <strong>SN = 3</strong> → sp²
                      <div className="text-[10px] text-slate-500 font-sans">Trigonal Planar (120°)</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-emerald-200">
                      <strong>SN = 4</strong> → sp³
                      <div className="text-[10px] text-slate-500 font-sans">Tetrahedral (109.5°)</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-emerald-200">
                      <strong>SN = 5</strong> → sp³d
                      <div className="text-[10px] text-slate-500 font-sans">TBP (90° & 120°)</div>
                    </div>
                    <div className="bg-white p-1 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                      <strong>SN = 6</strong> → sp³d²
                      <div className="text-[10px] text-slate-500 font-sans">Octahedral (90°)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ── FINAL SUCCESS COMPLETION MODAL ───────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-center animate-in fade-in zoom-in-95 my-auto text-[#1E293B]">
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-2.5 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-[#1E293B] tracking-tight mb-1">
              🎉 Level 3 Completed!
            </h2>
            <p className="text-xs text-[#64748B] font-medium mb-3">
              Successfully matched all 5 molecules to their correct hybridization boxes!
            </p>

            <div className="inline-block bg-emerald-50 border border-emerald-200 px-3.5 py-0.5 rounded-full text-xs font-bold text-emerald-800 mb-3 font-mono">
              Score: 5/5 Correct (100%)
            </div>

            {/* Summary Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left mb-4 overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-blue-700 border-b border-slate-200 text-[10px]">
                    <th className="pb-1 font-bold text-left">Molecule</th>
                    <th className="pb-1 font-bold text-center">Hybridization</th>
                    <th className="pb-1 font-bold text-right">Geometry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {MOLECULES.map((m) => (
                    <tr key={m.id} className="text-[#1E293B]">
                      <td className="py-1 font-bold">{m.formula} ({m.name})</td>
                      <td className="py-1 text-center text-blue-700 font-bold">{m.hybridization}</td>
                      <td className="py-1 text-right text-purple-700">{m.geometry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetGame}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[#1E293B] py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
              >
                Replay Challenge
              </button>

              <button
                type="button"
                onClick={() => (onExit ? onExit() : router.back())}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer"
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
