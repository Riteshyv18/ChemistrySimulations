"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Html, Sparkles } from '@react-three/drei';
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
    correctBox: 'D',
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
    correctBox: 'B',
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

// Target hybridization mapping for boxes A-E (Ordered: sp, sp³d, sp³, sp², sp³d²)
const BOX_MAPPINGS: Record<'A' | 'B' | 'C' | 'D' | 'E', { hybridization: string; isUsed: boolean }> = {
  A: { hybridization: 'sp', isUsed: true },
  B: { hybridization: 'sp³d', isUsed: true },
  C: { hybridization: 'sp³', isUsed: true },
  D: { hybridization: 'sp²', isUsed: true },
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

// ── 3D Atom & Bond Components (Matching Topic 2 Level 2 Style) ───────────────

interface AtomTheme {
  color: string;
  emissive: string;
  highlight: string;
  emissiveHighlight: string;
}

const ATOM_THEMES: Record<string, AtomTheme> = {
  Be: { color: '#0284c7', emissive: '#0369a1', highlight: '#bae6fd', emissiveHighlight: '#38bdf8' },
  B:  { color: '#8b5cf6', emissive: '#5b21b6', highlight: '#ddd6fe', emissiveHighlight: '#a78bfa' },
  C:  { color: '#6366f1', emissive: '#312e81', highlight: '#c7d2fe', emissiveHighlight: '#818cf8' },
  H:  { color: '#3b82f6', emissive: '#1d4ed8', highlight: '#bfdbfe', emissiveHighlight: '#60a5fa' },
  P:  { color: '#f59e0b', emissive: '#92400e', highlight: '#fde68a', emissiveHighlight: '#f59e0b' },
  S:  { color: '#e11d48', emissive: '#9f1239', highlight: '#fecdd3', emissiveHighlight: '#fb7185' },
  Cl: { color: '#10b981', emissive: '#047857', highlight: '#a7f3d0', emissiveHighlight: '#34d399' },
  F:  { color: '#06b6d4', emissive: '#0e7490', highlight: '#cffafe', emissiveHighlight: '#22d3ee' },
};

// Atom3D matching Topic 2 Level 2 CarbonAtom3D & HydrogenAtom3D
const Atom3D = ({
  symbol,
  position = [0, 0, 0],
  radius = 0.48,
  showLabels = true,
}: {
  symbol: string;
  position?: [number, number, number];
  radius?: number;
  showLabels?: boolean;
}) => {
  const theme = ATOM_THEMES[symbol] || {
    color: '#6366f1',
    emissive: '#312e81',
    highlight: '#c7d2fe',
    emissiveHighlight: '#818cf8',
  };

  return (
    <group position={position}>
      {/* Central 3D Nucleus (Big, 3D Shaded Sphere) */}
      <Sphere args={[radius, 32, 32]}>
        <meshStandardMaterial
          color={theme.color}
          emissive={theme.emissive}
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.45}
        />
      </Sphere>

      {/* Specular Fresnel highlight shell */}
      <Sphere args={[radius + 0.015, 24, 24]}>
        <meshStandardMaterial
          color={theme.highlight}
          emissive={theme.emissiveHighlight}
          emissiveIntensity={0.12}
          roughness={0.1}
          metalness={0.7}
          transparent
          opacity={0.35}
        />
      </Sphere>

      {/* Level 2 crisp white label */}
      {showLabels && (
        <Html center distanceFactor={5.8} style={{ pointerEvents: 'none' }}>
          <div className="text-white font-black text-xs select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-sans pointer-events-none tracking-wide text-center leading-none">
            {symbol}
          </div>
        </Html>
      )}
    </group>
  );
};

// ── 3D Bond Cylinder Helper ──────────────────────────────────────────────────
const Bond = ({
  start,
  end,
  color = "#64748b",
  radius = 0.05
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
  const cl1Pos: [number, number, number] = [-1.7, 0, 0];
  const cl2Pos: [number, number, number] = [1.7, 0, 0];

  return (
    <group>
      <Atom3D symbol="Be" position={bePos} radius={0.50} showLabels={showLabels} />
      <Atom3D symbol="Cl" position={cl1Pos} radius={0.46} showLabels={showLabels} />
      <Atom3D symbol="Cl" position={cl2Pos} radius={0.46} showLabels={showLabels} />

      <Bond start={bePos} end={cl1Pos} />
      <Bond start={bePos} end={cl2Pos} />
    </group>
  );
};

// 2. BF3 - Trigonal Planar
const BF3Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const bPos: [number, number, number] = [0, 0, 0];
  const r = 1.6;
  const f1Pos: [number, number, number] = [0, r, 0];
  const f2Pos: [number, number, number] = [r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6), 0];
  const f3Pos: [number, number, number] = [-r * Math.cos(-Math.PI / 6), r * Math.sin(-Math.PI / 6), 0];

  return (
    <group>
      <Atom3D symbol="B" position={bPos} radius={0.50} showLabels={showLabels} />
      <Atom3D symbol="F" position={f1Pos} radius={0.44} showLabels={showLabels} />
      <Atom3D symbol="F" position={f2Pos} radius={0.44} showLabels={showLabels} />
      <Atom3D symbol="F" position={f3Pos} radius={0.44} showLabels={showLabels} />

      <Bond start={bPos} end={f1Pos} />
      <Bond start={bPos} end={f2Pos} />
      <Bond start={bPos} end={f3Pos} />
    </group>
  );
};

// 3. CH4 - Tetrahedral
const CH4Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const cPos: [number, number, number] = [0, 0, 0];
  const r = 1.5;
  const h1Pos: [number, number, number] = [0, r, 0];
  const h2Pos: [number, number, number] = [r * (8 / 9) ** 0.5, -r / 3, 0];
  const h3Pos: [number, number, number] = [-r * (2 / 9) ** 0.5, -r / 3, r * (2 / 3) ** 0.5];
  const h4Pos: [number, number, number] = [-r * (2 / 9) ** 0.5, -r / 3, -r * (2 / 3) ** 0.5];

  return (
    <group>
      <Atom3D symbol="C" position={cPos} radius={0.52} showLabels={showLabels} />
      {[h1Pos, h2Pos, h3Pos, h4Pos].map((pos, idx) => (
        <group key={idx}>
          <Atom3D symbol="H" position={pos} radius={0.38} showLabels={showLabels} />
          <Bond start={cPos} end={pos} />
        </group>
      ))}
    </group>
  );
};

// 4. PCl5 - Trigonal Bipyramidal
const PCl5Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const pPos: [number, number, number] = [0, 0, 0];
  const rAxial = 1.55;
  const rEq = 1.4;

  const clAx1: [number, number, number] = [0, rAxial, 0];
  const clAx2: [number, number, number] = [0, -rAxial, 0];

  const clEq1: [number, number, number] = [rEq, 0, 0];
  const clEq2: [number, number, number] = [-rEq * 0.5, 0, rEq * 0.866];
  const clEq3: [number, number, number] = [-rEq * 0.5, 0, -rEq * 0.866];

  return (
    <group>
      <Atom3D symbol="P" position={pPos} radius={0.52} showLabels={showLabels} />
      {[clAx1, clAx2, clEq1, clEq2, clEq3].map((pos, idx) => (
        <group key={idx}>
          <Atom3D symbol="Cl" position={pos} radius={0.42} showLabels={showLabels} />
          <Bond start={pPos} end={pos} />
        </group>
      ))}
    </group>
  );
};

// 5. SF6 - Octahedral
const SF6Molecule3D = ({ showLabels = true }: { showLabels?: boolean }) => {
  const sPos: [number, number, number] = [0, 0, 0];
  const r = 1.4;

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
      <Atom3D symbol="S" position={sPos} radius={0.52} showLabels={showLabels} />
      {fPositions.map((pos, idx) => (
        <group key={idx}>
          <Atom3D symbol="F" position={pos} radius={0.40} showLabels={showLabels} />
          <Bond start={sPos} end={pos} />
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
    <group ref={groupRef} scale={isHighlighted ? [0.95, 0.95, 0.95] : [0.8, 0.8, 0.8]}>
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
      groupRef.current.rotation.x = 0.22; // slight 3D tilt to clearly show depth and geometry
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
    <group ref={groupRef} scale={0.82}>
      {/* Central Nucleus */}
      <Sphere args={[0.18, 24, 24]}>
        <meshStandardMaterial color="#1e293b" roughness={0.3} />
      </Sphere>

      {/* 2 hybrid orbitals (sp - Linear 180°) */}
      {count === 2 && (
        <group>
          <Sphere args={[0.38, 24, 24]} position={[-0.6, 0, 0]} scale={[1.2, 0.65, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
          <Sphere args={[0.38, 24, 24]} position={[0.6, 0, 0]} scale={[1.2, 0.65, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
        </group>
      )}

      {/* 3 hybrid orbitals (sp² - Trigonal Planar 120°) */}
      {count === 3 && (
        <group>
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, 0, angle]}>
              <Sphere args={[0.34, 24, 24]} position={[0, 0.58, 0]} scale={[0.65, 1.15, 0.65]}>
                <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
              </Sphere>
            </group>
          ))}
        </group>
      )}

      {/* 4 hybrid orbitals (sp³ - Tetrahedral 109.5°) */}
      {count === 4 && (
        <group>
          {[
            [0, 0.62, 0],
            [0.58, -0.22, 0],
            [-0.29, -0.22, 0.5],
            [-0.29, -0.22, -0.5],
          ].map((pos, idx) => (
            <Sphere key={idx} args={[0.31, 24, 24]} position={pos as any}>
              <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
            </Sphere>
          ))}
        </group>
      )}

      {/* 5 hybrid orbitals (sp³d - Trigonal Bipyramidal: 2 Axial + 3 Equatorial) */}
      {count === 5 && (
        <group>
          {/* 2 Axial Lobes (Top & Bottom along Y) */}
          <Sphere args={[0.27, 24, 24]} position={[0, 0.62, 0]} scale={[0.65, 1.15, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
          <Sphere args={[0.27, 24, 24]} position={[0, -0.62, 0]} scale={[0.65, 1.15, 0.65]}>
            <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
          </Sphere>
          {/* 3 Equatorial Lobes (Horizontal at 120°) */}
          {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, idx) => (
            <group key={idx} rotation={[0, angle, 0]}>
              <Sphere args={[0.27, 24, 24]} position={[0.54, 0, 0]} scale={[1.15, 0.65, 0.65]}>
                <meshStandardMaterial color={color} roughness={0.3} transparent opacity={0.85} />
              </Sphere>
            </group>
          ))}
        </group>
      )}

      {/* 6 hybrid orbitals (sp³d² - Octahedral: 6 symmetric lobes along ±X, ±Y, ±Z) */}
      {count === 6 && (
        <group>
          {[
            { pos: [0, 0.56, 0], scale: [0.65, 1.15, 0.65] },
            { pos: [0, -0.56, 0], scale: [0.65, 1.15, 0.65] },
            { pos: [0.56, 0, 0], scale: [1.15, 0.65, 0.65] },
            { pos: [-0.56, 0, 0], scale: [1.15, 0.65, 0.65] },
            { pos: [0, 0, 0.56], scale: [0.65, 0.65, 1.15] },
            { pos: [0, 0, -0.56], scale: [0.65, 0.65, 1.15] },
          ].map((item, idx) => (
            <Sphere key={idx} args={[0.25, 24, 24]} position={item.pos as any} scale={item.scale as any}>
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

  // Incorrectly placed molecules mapping: moleculeId -> boxKey ('A' | 'B' | 'C' | 'D' | 'E')
  const [incorrectMatches, setIncorrectMatches] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | 'E'>>({});

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
    setIncorrectMatches({});
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

    // If molecule is already correctly matched or placed in an incorrect box, ignore
    if (matchedMolecules[moleculeId] || incorrectMatches[moleculeId]) return;

    // If target box is already occupied by any molecule, ignore
    const isBoxOccupied = Object.values(matchedMolecules).includes(boxKey) || Object.values(incorrectMatches).includes(boxKey);
    if (isBoxOccupied) return;

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
      const nextUnmatched = MOLECULES.find((m) => !updatedMatches[m.id] && !incorrectMatches[m.id]);
      if (nextUnmatched) {
        setTimeout(() => {
          setActiveMoleculeId(nextUnmatched.id);
        }, 400);
      }
    } else {
      // Incorrect Match: Droppable into the red box with instant revert option
      setIncorrectMatches((prev) => ({
        ...prev,
        [moleculeId]: boxKey,
      }));

      setActiveMoleculeId(moleculeId);

      setFeedback({
        type: 'incorrect',
        message: '✕ Incorrect Match! Look closely at the 3D domain arrangement.',
      });
    }
  };

  // Instant Revert Handler to return an incorrectly dropped molecule back to the pool
  const handleRevert = (moleculeId: string) => {
    setIncorrectMatches((prev) => {
      const updated = { ...prev };
      delete updated[moleculeId];
      return updated;
    });
    setActiveMoleculeId(moleculeId);
    setFeedback(null);
  };

  // Full Game Reset
  const handleResetGame = () => {
    setClueAnswers({ 2: null, 3: null, 4: null, 5: null, 6: null });
    setBoxesUnlocked(false);
    setStep1Collapsed(false);
    setMatchedMolecules({});
    setIncorrectMatches({});
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
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase">
                HYBRIDIZATION &amp; ORBITAL OVERLAP
              </div>

              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> Match Hybridization Boxes &amp; 3D Molecular Geometries
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

          {/* STEP 2: INSTRUCTIONS SCREEN (WITH IMAGES, NO SUBTITLE TEXT, FULLY VISIBLE AT HEIGHT 376) */}
          {introStep === 'instructions' && (
            <div className="max-w-3xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-0.5 animate-in fade-in duration-200 w-full flex-1">
              {/* Header Title */}
              <div className="text-center pt-0.5 pb-1 sm:pb-1.5">
                <h2 className="text-[#1E293B] text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              {/* Horizontal Instruction Cards Grid - side-by-side in landscape */}
              <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-2 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
                {/* 1. Unlock boxes */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Unlock Boxes
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                        Hybridization Types
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                      Select the correct hybridization to unlock the hybridization boxes.
                    </p>
                  </div>

                  <div className="w-full h-18 sm:h-22 md:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-1 sm:mt-1.5">
                    <img
                      src="/images/hybridization/l3_step1_unlock_boxes.svg"
                      alt="Step 1: Unlock boxes"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* 2. Match molecules */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Match Molecules
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                        Drop in Box
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                      Tap or drag each molecule to drop it into its matching hybridization box.
                    </p>
                  </div>

                  <div className="w-full h-18 sm:h-22 md:h-24 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-1 sm:mt-1.5">
                    <img
                      src="/images/hybridization/l3_step2_drop_molecules.svg"
                      alt="Step 2: Drop molecules"
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
        <section className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-1.5 sm:p-2.5 shadow-sm flex flex-col justify-between min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Header Row */}
          <div className="flex items-center gap-1.5 mb-0.5 pb-0.5 border-b border-slate-100 shrink-0">
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h2 className="text-[11px] sm:text-xs font-extrabold text-[#1E293B] leading-tight">
                Unlock the Hybridization Boxes
              </h2>
              <p className="text-[8.5px] sm:text-[9.5px] text-[#64748B] font-medium leading-tight">
                Match the number of hybrid orbitals to the correct hybridization.
              </p>
            </div>
          </div>

          {/* 5 Orbital Cards Grid */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 flex-1 min-h-0 items-stretch py-0.5">
            {[2, 3, 4, 5, 6].map((count) => {
              const assigned = clueAnswers[count];
              const targets: Record<number, string> = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
              const isCorrect = assigned === targets[count];
              const isIncorrect = !!assigned && assigned !== targets[count];

              return (
                <div
                  key={count}
                  className={`border rounded-xl p-1 sm:p-1.5 flex flex-col items-center justify-between text-center transition-all min-h-0 overflow-hidden h-full ${
                    isCorrect
                      ? 'border-emerald-400 bg-emerald-50/60 shadow-xs'
                      : isIncorrect
                        ? 'border-red-400 bg-red-50/60 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                  }`}
                >
                  {/* 3D Mini Canvas Lobe */}
                  <div className="w-full flex-1 min-h-[40px] sm:min-h-[50px] rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner pointer-events-none">
                    <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }}>
                      <ambientLight intensity={1.1} />
                      <directionalLight position={[3, 4, 2]} intensity={1.5} />
                      <OrbitalClueLobe3D count={count} />
                    </Canvas>
                  </div>

                  <span className="text-[9px] sm:text-[10.5px] font-extrabold text-[#1E293B] mt-0.5 shrink-0 leading-tight">
                    {count} hybrid orbitals
                  </span>

                  {/* Dropdown Selector */}
                  <select
                    disabled={boxesUnlocked}
                    value={assigned || ''}
                    onChange={(e) => handleAssignClue(count, e.target.value)}
                    className={`mt-0.5 w-full text-[9px] sm:text-[10.5px] font-mono font-bold rounded-lg px-1 py-0.5 text-center border focus:outline-none transition-all cursor-pointer shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : isIncorrect
                          ? 'bg-red-50 border-red-400 text-red-700'
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

                  {isIncorrect && (
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-red-600 mt-0.5 leading-none shrink-0 truncate max-w-full">
                      ✕ Incorrect
                    </span>
                  )}
                  {isCorrect && (
                    <span className="text-[7.5px] sm:text-[8px] font-bold text-emerald-600 mt-0.5 leading-none shrink-0 truncate max-w-full">
                      ✓ Correct
                    </span>
                  )}
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
                  const isIncorrect = !!incorrectMatches[mol.id];
                  const isSelected = activeMoleculeId === mol.id;
                  const cardStyle = MOLECULE_CARD_STYLES[mol.id] || MOLECULE_CARD_STYLES.BeCl2;

                  return (
                    <div
                      key={mol.id}
                      draggable={!isMatched && !isIncorrect}
                      onDragStart={(e) => handleMoleculeDragStart(e, mol.id)}
                      onTouchStart={(e) => !isIncorrect && handleTouchStart(e, mol.id)}
                      onClick={() => setActiveMoleculeId(mol.id)}
                      className={`border-2 rounded-xl p-1 flex flex-col items-center justify-between text-center cursor-pointer transition-all relative h-full w-full min-h-0 ${cardStyle.bg} ${
                        isMatched
                          ? 'border-emerald-400 bg-emerald-50/50'
                          : isIncorrect
                            ? 'border-red-300 bg-red-50/40 opacity-75'
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

                      {isIncorrect && (
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 text-white font-extrabold flex items-center justify-center text-[8px] shadow-sm z-10" title="Placed incorrectly">
                          ✕
                        </div>
                      )}

                      <div className="w-full flex-1 min-h-[28px] rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner">
                        <Canvas camera={{ position: [0, 0, 4.8], fov: 45 }}>
                          <ambientLight intensity={0.85} />
                          <directionalLight position={[6, 9, 7]} intensity={1.8} />
                          <pointLight position={[0, 2, 5]} intensity={0.9} color="#ffffff" />
                          <Molecule3DRenderer code={mol.id} autoRotate={!isMatched && !isIncorrect} showLabels={false} />
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

                  const incorrectMolId = Object.keys(incorrectMatches).find(
                    (mId) => incorrectMatches[mId] === boxKey
                  );
                  const incorrectMol = MOLECULES.find((m) => m.id === incorrectMolId);

                  return (
                    <div
                      key={boxKey}
                      data-box-key={boxKey}
                      onDrop={(e) => handleBoxDrop(e, boxKey)}
                      onDragOver={handleDragOver}
                      onClick={() => !matchedMol && !incorrectMol && handleMatchToBox(activeMoleculeId, boxKey)}
                      className={`border-2 rounded-xl p-1 flex flex-col items-center justify-between transition-all h-full w-full min-h-0 ${
                        matchedMol
                          ? 'border-emerald-400 bg-emerald-50/50 shadow-sm cursor-default'
                          : incorrectMol
                            ? 'border-red-400 bg-red-50/70 shadow-sm cursor-default'
                            : 'bg-slate-50 border-blue-200 bg-blue-50/30 hover:border-blue-400 hover:scale-[1.01] cursor-pointer'
                      }`}
                    >
                      <div className="text-center shrink-0">
                        <div className="text-xs sm:text-sm font-extrabold text-[#1E293B] leading-none">{boxKey}</div>
                        <div className={`text-[9px] sm:text-[10px] font-mono font-bold mt-0.5 ${
                          matchedMol
                            ? 'text-emerald-700'
                            : incorrectMol
                              ? 'text-red-600'
                              : 'text-blue-700'
                        }`}>
                          {info.hybridization}
                        </div>
                      </div>

                      {/* Drop Zone Box */}
                      <div className={`w-full mt-0.5 flex-1 min-h-[24px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all p-0.5 ${
                        matchedMol
                          ? 'border-emerald-300 bg-white text-emerald-800 font-extrabold text-xs'
                          : incorrectMol
                            ? 'border-red-300 bg-white text-red-800 font-extrabold'
                            : 'border-slate-300 bg-white text-[#64748B]'
                      }`}>
                        {matchedMol ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9.5px] font-extrabold text-emerald-800">{matchedMol.formula}</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white text-[7.5px] flex items-center justify-center font-extrabold">✓</span>
                          </div>
                        ) : incorrectMol ? (
                          <div className="flex flex-col items-center gap-0.5 w-full text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-[9.5px] font-extrabold text-red-700 leading-tight">{incorrectMol.formula}</span>
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 text-white text-[7.5px] flex items-center justify-center font-extrabold shrink-0">✕</span>
                            </div>
                            <span className="text-[7.5px] font-bold text-red-600 leading-none">Incorrect Match</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevert(incorrectMol.id);
                              }}
                              className="mt-0.5 px-1.5 py-0.5 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 text-[8px] font-bold flex items-center gap-0.5 cursor-pointer transition-all active:scale-95 shadow-xs leading-none"
                              title="Revert molecule"
                            >
                              <RotateCcw className="w-2 h-2 shrink-0" />
                              <span>Revert</span>
                            </button>
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
            <div className="relative bg-[#f8fafc] border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-[120px] flex items-center justify-center shadow-inner my-0.5">
              <Canvas camera={{ position: [0, 0, 6.2 / zoomLevel], fov: 45 }}>
                <ambientLight intensity={0.85} />
                <directionalLight position={[6, 9, 7]} intensity={1.8} />
                <directionalLight position={[-6, -4, 4]} intensity={0.6} color="#818cf8" />
                <pointLight position={[0, 2, 5]} intensity={0.9} color="#ffffff" />
                <Sparkles count={24} scale={4} size={2} speed={0.4} color="#38bdf8" />
                <Molecule3DRenderer code={activeMolecule.id} isHighlighted={true} autoRotate={autoRotate} showLabels={true} />
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
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-black animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-300 bg-white shrink-0">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-black tracking-tight">
                Hybridization &amp; Molecular Geometries Guide
              </h2>
              <p className="text-xs text-neutral-600 font-normal">
                Mastering Steric Numbers, Hybrid Orbitals, and 3D Molecular Shapes
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-black font-semibold text-xs transition-all cursor-pointer border border-neutral-300 active:scale-95"
            >
              <X className="w-4 h-4 text-black" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6 sm:space-y-8 text-black text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto w-full">
            
            {/* Section 1: Core Principles */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                1. Principles of Orbital Hybridization
              </h3>
              <p className="text-black leading-relaxed">
                Hybridization is the mathematical and quantum mechanical mixing of atomic orbitals (such as s, p, and d) of comparable energies in the valence shell of an atom. When bonds form, these mixed orbitals produce an equal number of new, degenerate <strong>hybrid orbitals</strong>. These hybrid orbitals feature concentrated directional electron lobes that maximize spatial separation and orbital overlap with neighboring atoms, thereby minimizing electrostatic electron-pair repulsions according to VSEPR theory.
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 pt-1">
                Golden Rule of Orbital Hybridization:
              </h4>
              <p className="text-black leading-relaxed font-semibold">
                Number of Hybrid Orbitals Formed = Number of Pure Atomic Orbitals Mixed.
              </p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>sp Hybridization:</strong> 1s + 1p → <strong>2 sp</strong> orbitals (180° apart)
                </li>
                <li>
                  <strong>sp² Hybridization:</strong> 1s + 2p → <strong>3 sp²</strong> orbitals (120° apart)
                </li>
                <li>
                  <strong>sp³ Hybridization:</strong> 1s + 3p → <strong>4 sp³</strong> orbitals (109.5° apart)
                </li>
                <li>
                  <strong>sp³d Hybridization:</strong> 1s + 3p + 1d → <strong>5 sp³d</strong> orbitals (90° and 120° apart)
                </li>
                <li>
                  <strong>sp³d² Hybridization:</strong> 1s + 3p + 2d → <strong>6 sp³d²</strong> orbitals (all 90° apart)
                </li>
              </ul>
            </div>

            {/* Section 2: Master Quick Reference Table */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                2. Master Quick Reference Table
              </h3>
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left text-xs border border-neutral-300 rounded-lg overflow-hidden">
                  <thead className="bg-neutral-100 text-black font-bold border-b border-neutral-300 text-[11px]">
                    <tr>
                      <th className="p-2.5">Molecule</th>
                      <th className="p-2.5">Central Atom</th>
                      <th className="p-2.5">Steric No.</th>
                      <th className="p-2.5">Hybridization</th>
                      <th className="p-2.5">Geometry</th>
                      <th className="p-2.5">Bond Angles</th>
                      <th className="p-2.5">Net Dipole (μ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-black">
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">BeCl₂</td>
                      <td className="p-2.5">Beryllium (Z=4)</td>
                      <td className="p-2.5 font-mono">2</td>
                      <td className="p-2.5 font-bold font-mono">sp</td>
                      <td className="p-2.5 font-bold">Linear</td>
                      <td className="p-2.5 font-mono">180°</td>
                      <td className="p-2.5 font-mono">0 (Non-polar)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">BF₃</td>
                      <td className="p-2.5">Boron (Z=5)</td>
                      <td className="p-2.5 font-mono">3</td>
                      <td className="p-2.5 font-bold font-mono">sp²</td>
                      <td className="p-2.5 font-bold">Trigonal Planar</td>
                      <td className="p-2.5 font-mono">120°</td>
                      <td className="p-2.5 font-mono">0 (Non-polar)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">CH₄</td>
                      <td className="p-2.5">Carbon (Z=6)</td>
                      <td className="p-2.5 font-mono">4</td>
                      <td className="p-2.5 font-bold font-mono">sp³</td>
                      <td className="p-2.5 font-bold">Tetrahedral</td>
                      <td className="p-2.5 font-mono">109.5°</td>
                      <td className="p-2.5 font-mono">0 (Non-polar)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">PCl₅</td>
                      <td className="p-2.5">Phosphorus (Z=15)</td>
                      <td className="p-2.5 font-mono">5</td>
                      <td className="p-2.5 font-bold font-mono">sp³d</td>
                      <td className="p-2.5 font-bold">Trigonal Bipyramidal</td>
                      <td className="p-2.5 font-mono">90° (ax) &amp; 120° (eq)</td>
                      <td className="p-2.5 font-mono">0 (Non-polar)</td>
                    </tr>
                    <tr className="hover:bg-neutral-50">
                      <td className="p-2.5 font-bold font-mono">SF₆</td>
                      <td className="p-2.5">Sulfur (Z=16)</td>
                      <td className="p-2.5 font-mono">6</td>
                      <td className="p-2.5 font-bold font-mono">sp³d²</td>
                      <td className="p-2.5 font-bold">Octahedral</td>
                      <td className="p-2.5 font-mono">90° (all adjacent)</td>
                      <td className="p-2.5 font-mono">0 (Non-polar)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Detailed Molecule-by-Molecule Theory */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                3. Comprehensive Theory for All 5 Molecules
              </h3>

              {/* 1. BeCl2 */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4">
                  BeCl₂ — Beryllium Dichloride (sp Hybridization, Linear 180°)
                </h4>
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                  <li>
                    <strong>Electronic Configuration:</strong> Ground State Be (Z=4): 1s² 2s² (zero unpaired electrons). Excited State: One 2s electron promotes to 2pₓ → 1s² 2s¹ 2pₓ¹.
                  </li>
                  <li>
                    <strong>Orbital Mixing &amp; Geometry:</strong> 1s + 1p orbital combine to yield 2 sp hybrid orbitals. Collinear at 180° along the internuclear axis.
                  </li>
                  <li>
                    <strong>Bonding &amp; Chemical Details:</strong> Each of the two sp hybrid orbitals on Be overlaps axially (head-on) with a half-filled 3p_z orbital from a Chlorine atom, generating two identical, highly directional σ(Be–Cl) bonds. The two bond dipole vectors are equal in magnitude and point in exactly opposite directions (180°), completely canceling each other (μ = 0 D). Two unhybridized 2p orbitals (2p_y, 2p_z) on Beryllium remain empty.
                  </li>
                </ul>
              </div>

              {/* 2. BF3 */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4">
                  BF₃ — Boron Trifluoride (sp² Hybridization, Trigonal Planar 120°)
                </h4>
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                  <li>
                    <strong>Electronic Configuration:</strong> Ground State B (Z=5): 1s² 2s² 2p¹ (1 unpaired electron). Excited State: 2s electron unpairs and promotes to 2p_y → 1s² 2s¹ 2pₓ¹ 2p_y¹.
                  </li>
                  <li>
                    <strong>Orbital Mixing &amp; Geometry:</strong> One 2s + two 2p (2pₓ, 2p_y) mix to form 3 sp² hybrid orbitals. Planar, directed to vertices of an equilateral triangle at 120°.
                  </li>
                  <li>
                    <strong>Bonding &amp; Chemical Details:</strong> The three sp² hybrid orbitals overlap head-on with singly occupied 2p_z orbitals of 3 Fluorine atoms, forming three strong σ(B–F) bonds. The remaining unhybridized 2p_z orbital lies perpendicular to the triangular plane and stays vacant. Because Boron only possesses 6 valence electrons around it in BF₃, it has an incomplete octet and acts as a quintessential Lewis acid, readily accepting electron pairs from Lewis bases (like NH₃). Symmetrical triangular cancellation gives μ = 0 D.
                  </li>
                </ul>
              </div>

              {/* 3. CH4 */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4">
                  CH₄ — Methane (sp³ Hybridization, Tetrahedral 109.5°)
                </h4>
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                  <li>
                    <strong>Electronic Configuration:</strong> Ground State C (Z=6): 1s² 2s² 2pₓ¹ 2p_y¹ (2 unpaired electrons). Excited State: 2s electron promotes to 2p_z → 1s² 2s¹ 2pₓ¹ 2p_y¹ 2p_z¹ (tetravalent).
                  </li>
                  <li>
                    <strong>Orbital Mixing &amp; Geometry:</strong> One 2s + three 2p orbitals mix to form 4 equivalent sp³ hybrid orbitals. Point toward vertices of a regular tetrahedron at 109.5° (109°28').
                  </li>
                  <li>
                    <strong>Bonding &amp; Chemical Details:</strong> Each sp³ hybrid orbital on Carbon overlaps axially with the spherical 1s orbital of a Hydrogen atom to form 4 equivalent, exceptionally strong σ(C–H) bonds. Each C–H bond length is identical (108.7 pm) with equal bond dissociation energy (435 kJ/mol). The regular tetrahedral geometry distributes the electron density symmetrically in 3D space, meaning all individual bond dipoles cancel completely (μ = 0 D), rendering methane non-polar and chemically stable.
                  </li>
                </ul>
              </div>

              {/* 4. PCl5 */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4">
                  PCl₅ — Phosphorus Pentachloride (sp³d Hybridization, Trigonal Bipyramidal 90° &amp; 120°)
                </h4>
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                  <li>
                    <strong>Electronic Configuration &amp; Expanded Octet:</strong> Ground State P (Z=15): [Ne] 3s² 3pₓ¹ 3p_y¹ 3p_z¹. Excited State: 3s electron promotes to vacant 3d_z² orbital → [Ne] 3s¹ 3p³ 3d_z²¹ (5 unpaired electrons).
                  </li>
                  <li>
                    <strong>Orbital Mixing &amp; Geometry:</strong> 1s + 3p + 1d (d_z²) combine into 5 sp³d hybrid orbitals. Trigonal Bipyramid with 3 equatorial bonds (120°) and 2 axial bonds (90° to equatorial, 180° to each other).
                  </li>
                  <li>
                    <strong>Axial vs Equatorial Bond Asymmetry:</strong> In PCl₅, the 5 bonds are not equivalent! The two axial P–Cl bonds experience greater repulsion (repelled by 3 equatorial electron pairs at 90°) than the equatorial bonds (repelled by only 2 axial pairs at 90°). Consequently, the axial bonds are longer (214 pm) and weaker than the equatorial bonds (202 pm). This explains why PCl₅ is thermally reactive and easily dissociates when heated: PCl₅(g) ⇌ PCl₃(g) + Cl₂(g).
                  </li>
                </ul>
              </div>

              {/* 5. SF6 */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs sm:text-sm font-bold text-black underline underline-offset-4">
                  SF₆ — Sulfur Hexafluoride (sp³d² Hybridization, Octahedral All 90°)
                </h4>
                <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                  <li>
                    <strong>Electronic Configuration &amp; Expanded Octet:</strong> Ground State S (Z=16): [Ne] 3s² 3pₓ² 3p_y¹ 3p_z¹ (2 unpaired electrons). Excited State: 3s and 3p electrons promote to 3d_x²-y² and 3d_z² → [Ne] 3s¹ 3p³ 3d² (6 unpaired electrons).
                  </li>
                  <li>
                    <strong>Orbital Mixing &amp; Geometry:</strong> 1s + 3p + 2d (d_x²-y², d_z²) mix to form 6 equivalent sp³d² hybrid orbitals. Regular Octahedron (square bipyramid); all adjacent bond angles are 90° (trans angles 180°).
                  </li>
                  <li>
                    <strong>Bonding &amp; Chemical Inertness:</strong> All 6 S–F bonds are completely identical in length (156 pm) and strength. The 6 highly electronegative Fluorine atoms form an octahedral steric cage that tightly encloses and shields the central Sulfur atom. This exceptional steric shielding makes SF₆ chemically unreactive, non-flammable, non-toxic, and an extraordinary electrical insulator widely used in high-voltage circuit breakers and power substations. Symmetrical cancellation guarantees μ = 0 D.
                  </li>
                </ul>
              </div>

            </div>

            {/* Section 4: Fast Calculation / Exam Shortcut */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-black">
                4. Quick Steric Number Formula for Competitive Exams
              </h3>
              <p className="text-black leading-relaxed">
                <strong>Steric Number (SN) = (Number of σ-Bonds) + (Number of Lone Pairs on Central Atom)</strong>
              </p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-black leading-relaxed">
                <li>
                  <strong>SN = 2:</strong> sp Hybridization → Linear (180°)
                </li>
                <li>
                  <strong>SN = 3:</strong> sp² Hybridization → Trigonal Planar (120°)
                </li>
                <li>
                  <strong>SN = 4:</strong> sp³ Hybridization → Tetrahedral (109.5°)
                </li>
                <li>
                  <strong>SN = 5:</strong> sp³d Hybridization → Trigonal Bipyramidal (90° &amp; 120°)
                </li>
                <li>
                  <strong>SN = 6:</strong> sp³d² Hybridization → Octahedral (90°)
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Footer */}
          <div className="p-3 border-t border-neutral-300 bg-white shrink-0 flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full max-w-sm py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
            >
              Resume Challenge
            </button>
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
