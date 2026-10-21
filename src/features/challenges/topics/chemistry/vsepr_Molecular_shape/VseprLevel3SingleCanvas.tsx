'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Cylinder, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Trophy,
  X,
  HelpCircle,
  Sparkles,
  Send,
  Eye,
} from 'lucide-react';
import { getAtomMaterial } from './materials';
import { getTetrahedralVertices, getTrigonalPlanarVertices } from './helpers';

// ── MOLECULE DATA DEFINITION (5 Molecules for Level 3) ────────────────────────
export interface VseprMolecule {
  id: string;
  formula: string;
  name: string;
  geometry: string;
  bondAngle: number;
  acceptableAngles: number[];
  centralElement: string;
  outerElement: string;
  numBonds: number;
  numLonePairs: number;
  isDoubleBond?: boolean;
  explanation: string;
  badgeColor: string;
}

export const LEVEL3_5_MOLECULES: VseprMolecule[] = [
  {
    id: 'CH4',
    formula: 'CH₄',
    name: 'Methane',
    geometry: 'Tetrahedral',
    bondAngle: 109.5,
    acceptableAngles: [109.5, 109, 110],
    centralElement: 'carbon',
    outerElement: 'hydrogen',
    numBonds: 4,
    numLonePairs: 0,
    explanation: 'Carbon has 4 bonding pairs and 0 lone pairs. Equal repulsion yields a regular tetrahedral angle of 109.5°.',
    badgeColor: 'bg-indigo-600',
  },
  {
    id: 'NH3',
    formula: 'NH₃',
    name: 'Ammonia',
    geometry: 'Trigonal Pyramidal',
    bondAngle: 107.0,
    acceptableAngles: [107, 107.0],
    centralElement: 'nitrogen',
    outerElement: 'hydrogen',
    numBonds: 3,
    numLonePairs: 1,
    explanation: 'Nitrogen has 3 bonds and 1 lone pair. The lone pair repels bonding electrons more strongly, reducing the angle to 107°.',
    badgeColor: 'bg-blue-600',
  },
  {
    id: 'H2O',
    formula: 'H₂O',
    name: 'Water',
    geometry: 'Bent',
    bondAngle: 104.5,
    acceptableAngles: [104.5, 104, 105],
    centralElement: 'oxygen',
    outerElement: 'hydrogen',
    numBonds: 2,
    numLonePairs: 2,
    explanation: 'Oxygen has 2 bonds and 2 lone pairs. The two lone pairs exert maximum repulsion, compressing the bond angle to 104.5°.',
    badgeColor: 'bg-rose-600',
  },
  {
    id: 'BF3',
    formula: 'BF₃',
    name: 'Boron Trifluoride',
    geometry: 'Trigonal Planar',
    bondAngle: 120.0,
    acceptableAngles: [120, 120.0],
    centralElement: 'boron',
    outerElement: 'fluorine',
    numBonds: 3,
    numLonePairs: 0,
    explanation: 'Boron has 3 bonding pairs and 0 lone pairs. Mutual repulsion spreads them evenly in a plane at 120°.',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'CO2',
    formula: 'CO₂',
    name: 'Carbon Dioxide',
    geometry: 'Linear',
    bondAngle: 180.0,
    acceptableAngles: [180, 180.0],
    centralElement: 'carbon',
    outerElement: 'oxygen',
    numBonds: 2,
    numLonePairs: 0,
    isDoubleBond: true,
    explanation: 'Carbon forms 2 double bonds with 0 central lone pairs. The two electron domains push opposite to 180° in a linear shape.',
    badgeColor: 'bg-amber-600',
  },
];

// Helper to shuffle an array
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── 3D ATOM COMPONENT ────────────────────────────────────────────────────────
function AtomSphere({
  position,
  element,
  scale = 1,
  label,
}: {
  position: THREE.Vector3;
  element: string;
  scale?: number;
  label?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => getAtomMaterial(element), [element]);
  const isHydrogen = element.toLowerCase() === 'hydrogen' || element.toLowerCase() === 'h';

  return (
    <group position={position} scale={scale}>
      <Sphere ref={meshRef} args={[0.9, 32, 32]} material={material} />
      {label && (
        <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div
            className={`font-black select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${isHydrogen ? 'text-slate-900 text-xs' : 'text-white text-sm'
              }`}
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── 3D BOND COMPONENT ────────────────────────────────────────────────────────
function BondCylinder({
  start,
  end,
  isDouble = false,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  isDouble?: boolean;
}) {
  const distance = start.distanceTo(end);
  const position = start.clone().lerp(end, 0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize()
  );

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.25,
        metalness: 0.85,
      }),
    []
  );

  return (
    <group position={position} quaternion={quaternion}>
      {isDouble ? (
        <>
          <Cylinder args={[0.11, 0.11, distance, 16]} position={[0.16, 0, 0]} material={mat} />
          <Cylinder args={[0.11, 0.11, distance, 16]} position={[-0.16, 0, 0]} material={mat} />
        </>
      ) : (
        <Cylinder args={[0.13, 0.13, distance, 16]} material={mat} />
      )}
    </group>
  );
}

// ── 3D LONE PAIR LOBE COMPONENT ──────────────────────────────────────────────
function LonePairLobe({
  position,
  rotation,
  scale = 1,
}: {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number;
}) {
  const lobeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.4,
        shininess: 90,
      }),
    []
  );

  const electronMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.3,
      }),
    []
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Translucent tear-drop cloud */}
      <Sphere args={[0.78, 32, 16]} scale={[0.95, 1.45, 0.95]} material={lobeMaterial} />
      {/* Dual electron dots */}
      <Sphere args={[0.18, 16, 16]} position={[-0.26, 0.65, 0]} material={electronMaterial} />
      <Sphere args={[0.18, 16, 16]} position={[0.26, 0.65, 0]} material={electronMaterial} />
      {/* HTML label */}
      <Html center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="text-[9px] font-black text-sky-800 bg-sky-100/90 px-1.5 py-0.5 rounded shadow-xs border border-sky-300 mt-4 whitespace-nowrap">
          Lone Pair (:)
        </div>
      </Html>
    </group>
  );
}

// ── 3D ANGLE ARC COMPONENT ───────────────────────────────────────────────────
function AngleArc({
  v1,
  v2,
  label,
  isSolved,
}: {
  v1: THREE.Vector3;
  v2: THREE.Vector3;
  label?: string;
  isSolved: boolean;
}) {
  const n1 = useMemo(() => v1.clone().normalize(), [v1]);
  const n2 = useMemo(() => v2.clone().normalize(), [v2]);

  const { points, midPoint } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 30;
    const r = 1.35;
    const angle = n1.angleTo(n2);

    let axis = n1.clone().cross(n2).normalize();
    if (axis.lengthSq() < 0.001) {
      axis = new THREE.Vector3(0, 0, 1);
    }

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle * t);
      const p = n1.clone().applyQuaternion(q).multiplyScalar(r);
      pts.push(p);
    }

    const midQ = new THREE.Quaternion().setFromAxisAngle(axis, angle * 0.5);
    const midP = n1.clone().applyQuaternion(midQ).multiplyScalar(1.6);

    return { points: pts, midPoint: midP };
  }, [n1, n2]);

  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const lineColor = isSolved ? 0x16a34a : 0xd97706;

  return (
    <group>
      <primitive
        object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 3 }))}
      />
      <Html position={midPoint} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div
          className={`font-black text-xs px-2.5 py-1 rounded-full shadow-sm border backdrop-blur-md whitespace-nowrap transition-all ${isSolved
            ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
            : 'bg-amber-100 border-amber-300 text-amber-900 shadow-amber-500/10'
            }`}
        >
          {isSolved ? `${label}° ✓` : '?°'}
        </div>
      </Html>
    </group>
  );
}

// ── 3D MOLECULE MODEL RENDERER ───────────────────────────────────────────────
function Molecule3DScene({
  molecule,
  isSolved,
}: {
  molecule: VseprMolecule;
  isSolved: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  // Molecule Geometry calculations
  const { centralElem, outerElem, outerPositions, lonePairPositions, isDouble, arcV1, arcV2 } = useMemo(() => {
    const f = molecule.id;
    let outerPositions: THREE.Vector3[] = [];
    let lonePairPositions: THREE.Vector3[] = [];
    let arcV1 = new THREE.Vector3(1, 0, 0);
    let arcV2 = new THREE.Vector3(0, 1, 0);

    if (f === 'CH4') {
      const v = getTetrahedralVertices(2.3);
      outerPositions = v;
      arcV1 = v[0];
      arcV2 = v[1];
    } else if (f === 'NH3') {
      outerPositions = [
        new THREE.Vector3(-1.8, -1.0, 0.8),
        new THREE.Vector3(1.8, -1.0, 0.8),
        new THREE.Vector3(0, -1.2, -1.6),
      ];
      lonePairPositions = [new THREE.Vector3(0, 2.1, 0)];
      arcV1 = outerPositions[0];
      arcV2 = outerPositions[1];
    } else if (f === 'H2O') {
      outerPositions = [
        new THREE.Vector3(-1.75, -1.25, 0),
        new THREE.Vector3(1.75, -1.25, 0),
      ];
      lonePairPositions = [
        new THREE.Vector3(-1.15, 1.8, -0.65),
        new THREE.Vector3(1.15, 1.8, 0.65),
      ];
      arcV1 = outerPositions[0];
      arcV2 = outerPositions[1];
    } else if (f === 'BF3') {
      outerPositions = [
        new THREE.Vector3(0, 2.3, 0),
        new THREE.Vector3(1.99, -1.15, 0),
        new THREE.Vector3(-1.99, -1.15, 0),
      ];
      arcV1 = outerPositions[0];
      arcV2 = outerPositions[1];
    } else if (f === 'CO2') {
      outerPositions = [
        new THREE.Vector3(2.35, 0, 0),
        new THREE.Vector3(-2.35, 0, 0),
      ];
      arcV1 = outerPositions[0];
      arcV2 = outerPositions[1];
    }

    return {
      centralElem: molecule.centralElement,
      outerElem: molecule.outerElement,
      outerPositions,
      lonePairPositions,
      isDouble: molecule.isDoubleBond || false,
      arcV1,
      arcV2,
    };
  }, [molecule]);

  const centralLabel = molecule.formula === 'CH₄' || molecule.formula === 'CO₂'
    ? 'C'
    : molecule.formula === 'NH₃'
      ? 'N'
      : molecule.formula === 'H₂O'
        ? 'O'
        : 'B';

  const outerLabel = molecule.formula === 'BF₃' ? 'F' : molecule.formula === 'CO₂' ? 'O' : 'H';

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={0.88}>
      {/* Central Atom */}
      <AtomSphere
        position={new THREE.Vector3(0, 0, 0)}
        element={centralElem}
        scale={1.25}
        label={centralLabel}
      />

      {/* Outer Atoms & Bonds */}
      {outerPositions.map((pos, idx) => (
        <React.Fragment key={`outer-${idx}`}>
          <AtomSphere
            position={pos}
            element={outerElem}
            scale={outerLabel === 'H' ? 0.75 : 0.95}
            label={outerLabel}
          />
          <BondCylinder
            start={new THREE.Vector3(0, 0, 0)}
            end={pos}
            isDouble={isDouble}
          />
        </React.Fragment>
      ))}

      {/* Lone Pair Clouds */}
      {lonePairPositions.map((pos, idx) => (
        <LonePairLobe
          key={`lp-${idx}`}
          position={pos}
          scale={0.9}
        />
      ))}

      {/* Bond Angle Arc */}
      <AngleArc
        v1={arcV1}
        v2={arcV2}
        label={String(molecule.bondAngle)}
        isSolved={isSolved}
      />
    </group>
  );
}

// ── PROPS FOR LEVEL 3 SINGLE CANVAS ──────────────────────────────────────────
export interface VseprLevel3SingleCanvasProps {
  onExit?: () => void;
  difficulty?: string;
}

export default function VseprLevel3SingleCanvas({
  onExit,
}: VseprLevel3SingleCanvasProps) {
  // Screen flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [gameStarted, setGameStarted] = useState(false);

  // Deck of 5 molecules, randomized
  const [deck, setDeck] = useState<VseprMolecule[]>(() => shuffleArray(LEVEL3_5_MOLECULES));
  const [currentIndex, setCurrentIndex] = useState(0);

  // User input & feedback
  const [enteredAngle, setEnteredAngle] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sliding transition state: 'idle' | 'sliding-out' | 'sliding-in'
  const [slideState, setSlideState] = useState<'idle' | 'sliding-out' | 'sliding-in'>('idle');

  // History stack for Revert functionality
  const [history, setHistory] = useState<
    Array<{
      deck: VseprMolecule[];
      currentIndex: number;
    }>
  >([]);

  // Modals & Completion
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentMolecule = deck[currentIndex] || deck[0];

  // Keypad keys: 3 columns vertical layout (1 2 3, 4 5 6, 7 8 9, . 0 ✕)
  const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '✕'];

  const handleKeypadPress = (key: string) => {
    if (isSuccess || slideState !== 'idle') return;
    if (key === '⌫' || key === '✕') {
      setEnteredAngle((prev) => prev.slice(0, -1));
    } else {
      if (enteredAngle.length >= 5) return;
      if (key === '.' && enteredAngle.includes('.')) return;
      setEnteredAngle((prev) => prev + key);
    }
  };

  // Check Angle Submission
  const handleSubmitAngle = (submittedVal?: string) => {
    if (isSuccess || slideState !== 'idle') return;
    const valueStr = submittedVal !== undefined ? submittedVal : enteredAngle;
    const num = parseFloat(valueStr);

    if (isNaN(num)) {
      setFeedback({
        type: 'info',
        message: 'Please enter a valid bond angle (e.g. 109.5°).',
      });
      return;
    }

    // Check tolerance
    const target = currentMolecule.bondAngle;
    const isCorrect =
      currentMolecule.acceptableAngles.includes(num) ||
      Math.abs(num - target) <= 0.6 ||
      (target === 109.5 && (num === 109 || num === 110));

    if (isCorrect) {
      setIsSuccess(true);
      setFeedback({
        type: 'success',
        message: `🎉 Correct! ${currentMolecule.name} has a bond angle of ${currentMolecule.bondAngle}°.`,
      });

      // Save to history before sliding out
      setHistory((prev) => [
        ...prev,
        {
          deck: [...deck],
          currentIndex,
        },
      ]);

      // Trigger slide out after 750ms
      setTimeout(() => {
        setSlideState('sliding-out');

        // After slide out completes, advance to next molecule
        setTimeout(() => {
          if (currentIndex < deck.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setEnteredAngle('');
            setIsSuccess(false);
            setFeedback(null);
            setSlideState('sliding-in');

            // Slide in transition
            setTimeout(() => {
              setSlideState('idle');
            }, 300);
          } else {
            // Completed all 5 molecules!
            setIsCompleted(true);
            setSlideState('idle');
          }
        }, 300);
      }, 750);
    } else {
      setIsShaking(true);
      setFeedback({
        type: 'error',
        message: `Incorrect angle. Hint: Check electron domain geometry and lone pairs for ${currentMolecule.formula}!`,
      });
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  // Revert Functionality
  const handleRevert = () => {
    if (history.length > 0) {
      const prevRecord = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentIndex(prevRecord.currentIndex);
      setDeck(prevRecord.deck);
      setEnteredAngle('');
      setIsSuccess(false);
      setSlideState('idle');
      setFeedback({
        type: 'info',
        message: 'Reverted to previous molecule.',
      });
    } else {
      setEnteredAngle('');
      setFeedback({
        type: 'info',
        message: 'Cleared input.',
      });
    }
  };

  // Reset Challenge
  const handleReset = () => {
    setDeck(shuffleArray(LEVEL3_5_MOLECULES));
    setCurrentIndex(0);
    setEnteredAngle('');
    setIsSuccess(false);
    setIsCompleted(false);
    setFeedback(null);
    setHistory([]);
    setSlideState('idle');
  };

  return (
    <div className="w-full h-full min-h-0 bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-2 sm:p-2.5 max-w-[440px] mx-auto">
      {/* ── INTRO MISSION & INSTRUCTIONS VIEW OVERLAY ────────────────────────── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => onExit?.()}
              className="px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION SCREEN */}
          {introStep === 'mission' && (
            <div className="max-w-xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                VSEPR THEORY • LEVEL 3
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Predict 3D Molecular Bond Angles
              </h1>



              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep('instructions')}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS SCREEN */}
          {introStep === 'instructions' && (
            <div className="max-w-md mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-4 py-1 animate-in fade-in duration-200 w-full flex-1">
              <div className="text-center pt-1 pb-3">
                <h2 className="text-[#1E293B] text-base sm:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
              </div>

              <div className="flex flex-col gap-2.5 sm:gap-3 w-full mx-auto my-auto">
                {/* Instruction 1: Observe & Rotate 3D Molecule */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Observe &amp; Rotate 3D Molecule
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-bold text-[9.5px] tracking-wide">
                        3D Geometry &amp; Lone Pairs
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                      Inspect the 3D molecular shape. Drag to rotate 360° and observe central bonds, angles, and lone pairs.
                    </p>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-2">
                    <img
                      src="/images/vsepr/l3_step1_rotate_molecule.svg"
                      alt="Step 1: Rotate and inspect 3D molecule preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Instruction 2: Enter Bond Angle & Submit */}
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Enter Bond Angle &amp; Submit
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9.5px] tracking-wide">
                        Keypad Prediction &amp; Auto-Slide
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[11px] leading-snug mt-1">
                      Use the keypad to enter the predicted bond angle in degrees and click Submit. The next molecule automatically slides from right!
                    </p>
                  </div>

                  {/* Visual Preview Box */}
                  <div className="w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center p-1 mt-2">
                    <img
                      src="/images/vsepr/l3_step2_enter_angle.svg"
                      alt="Step 2: Enter angle and submit preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-2 sm:pt-3 pb-1 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep('mission')}
                  className="px-5 sm:px-6 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-7 sm:px-9 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN 3: ACTIVE GAMEPLAY (SINGLE CANVAS) ────────────────────────── */}
      {gameStarted && !isCompleted && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden relative">
          {/* ── 1. TOP TOOLBAR HEADER (ONLY EXIT & EXPLANATION) ── */}
          <header className="w-full flex items-center justify-between z-20 gap-2 shrink-0 py-0.5 mb-1 px-1">
            {/* Top Left: Exit Button */}
            <button
              type="button"
              onClick={() => onExit?.()}
              className="px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Top Right: Explanation Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="px-4 sm:px-5 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95 shrink-0"
                title="View Theory & Explanation"
              >
                <BookOpen className="w-3.5 h-3.5 text-white shrink-0" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </header>

          {/* ── 2. TOP AREA: 3D MOLECULE VIEWER (SEAMLESS IN SINGLE CANVAS) ── */}
          <div className="w-full h-[55%] min-h-0 relative overflow-hidden bg-white flex flex-col shrink-0">
            {/* 3D Canvas with Slide Animation */}
            <div
              className={`w-full h-full relative transition-all duration-300 ease-out ${slideState === 'sliding-out'
                ? 'transform -translate-x-full opacity-0'
                : slideState === 'sliding-in'
                  ? 'transform translate-x-full opacity-0'
                  : 'transform translate-x-0 opacity-100'
                }`}
            >
              <Canvas camera={{ position: [0, 0, 9.4], fov: 42 }} className="w-full h-full touch-none cursor-grab active:cursor-grabbing">
                <color attach="background" args={['#FFFFFF']} />
                <ambientLight intensity={1.25} />
                <directionalLight position={[8, 10, 8]} intensity={1.4} />
                <directionalLight position={[-8, -6, -8]} intensity={0.5} />
                <pointLight position={[0, 4, 4]} intensity={0.5} color="#FFFFFF" />

                <Molecule3DScene molecule={currentMolecule} isSolved={isSuccess} />

                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  minPolarAngle={Math.PI / 10}
                  maxPolarAngle={(9 * Math.PI) / 10}
                />
              </Canvas>
            </div>
          </div>

          {/* ── 3. BOTTOM AREA: BOND ANGLE INPUT & KEYPAD (SEAMLESS IN SINGLE CANVAS) ── */}
          <div className="w-full flex-1 min-h-0 flex flex-col justify-between pt-1 pb-0.5 px-0.5 gap-1 border-t border-slate-100">
            {/* Feedback / Instructions banner */}
            <div className="w-full text-center shrink-0">
              {feedback ? (
                <div
                  className={`text-[11px] sm:text-xs font-bold py-1 px-2 rounded-xl transition-all ${feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in zoom-in-95'
                    : feedback.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200 animate-shake'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                >
                  {feedback.message}
                </div>
              ) : (
                <div className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center justify-center gap-1.5">

                </div>
              )}
            </div>

            {/* Angle Input Display Box */}
            <div className="flex items-center justify-center gap-2 shrink-0">
              <div
                className={`relative flex items-center justify-center h-9 sm:h-10 px-4 rounded-xl border-2 transition-all w-48 text-center ${isSuccess
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : isShaking
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-400 text-red-800 animate-shake'
                    : 'bg-slate-50 border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100'
                  }`}
              >
                <span className="font-mono font-black text-lg sm:text-xl tracking-wider text-slate-800">
                  {enteredAngle ? `${enteredAngle}°` : <span className="text-slate-400 text-xs font-normal">Enter angle...</span>}
                </span>
              </div>
            </div>

            {/* Vertical Keypad: 3 columns x 4 rows (1 2 3, 4 5 6, 7 8 9, . 0 ✕) with larger numbers */}
            <div className="grid grid-cols-3 gap-2 shrink-0 w-full max-w-[240px] sm:max-w-[260px] mx-auto py-1">
              {KEYPAD_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className={`h-10 sm:h-11 rounded-xl text-slate-800 font-bold font-mono text-base sm:text-lg flex items-center justify-center border shadow-2xs transition-all cursor-pointer active:scale-95 ${k === '✕'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200'
                    }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Action Buttons: Revert & Submit Angle */}
            <div className="flex items-center justify-center gap-2 pt-0.5 shrink-0">
              {/* Revert Button (Single Canvas Revert per User Prompt) */}
              <button
                type="button"
                onClick={handleRevert}
                className="h-8 sm:h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Revert to previous molecule"
              >
                <Undo2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Revert</span>
              </button>

              {/* Submit Angle Button */}
              <button
                type="button"
                onClick={() => handleSubmitAngle()}
                disabled={!enteredAngle || isSuccess}
                className="flex-1 max-w-[200px] h-8 sm:h-9 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>Submit Angle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 4: LEVEL COMPLETE MODAL (INSIDE SINGLE CANVAS) ────────────── */}
      {isCompleted && (
        <div className="absolute inset-0 z-40 bg-white/98 backdrop-blur-md flex flex-col items-center justify-center text-center p-4 animate-in zoom-in-95 duration-400">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-200 flex items-center justify-center mb-3 shadow-xl">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-1">
            🎉 Level 3 Completed!
          </h2>
          <p className="text-slate-500 mb-5 text-xs sm:text-sm max-w-xs">
            You successfully analyzed all 5 molecules and predicted their accurate 3D VSEPR bond angles!
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onExit?.()}
              className="px-6 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-lg cursor-pointer transition-all"
            >
              Exit to Topics
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      )}

      {/* ── EXPLANATION MODAL (INSIDE SINGLE CANVAS) ─────────────────────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col overflow-hidden text-slate-800 animate-in fade-in duration-200 select-text">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                VSEPR Theory &amp; Bond Angles Guide
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-purple-900">
              <span className="font-bold">Core Principle:</span> Valence electron pairs (bonding pairs and lone pairs) repel each other and arrange themselves as far apart as possible to minimize repulsive forces.
            </div>

            <div className="space-y-2">
              {LEVEL3_5_MOLECULES.map((mol) => (
                <div
                  key={mol.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900 font-mono text-sm">
                      {mol.formula} ({mol.name})
                    </span>
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-[11px]">
                      {mol.bondAngle}°
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-700">Geometry:</span> {mol.geometry}
                    <span>•</span>
                    <span className="font-semibold text-slate-700">Lone Pairs:</span> {mol.numLonePairs}
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    {mol.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Close Button */}
          <div className="p-2.5 border-t border-slate-200 bg-slate-50 shrink-0 text-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="px-6 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
