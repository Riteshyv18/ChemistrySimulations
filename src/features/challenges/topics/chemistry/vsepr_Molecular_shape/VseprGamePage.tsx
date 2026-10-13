"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Sphere, Cylinder, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import {
  Gamepad2, Trophy, BookOpen, Lock, Star, Target, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, RotateCcw, ZoomIn, Maximize2, X,
  Send, Move, Lightbulb, Package, Eye, Play
} from 'lucide-react';
import { getAtomMaterial } from './materials';
import { getTetrahedralVertices, getTrigonalPlanarVertices } from './helpers';
import { vseprLevel1, vseprLevel2, vseprLevel3, type Level1Question, type Level2Question, type Level3Question } from './vsepr-questions';
import { exitSimulation } from '@/lib/mobileBridge';

const Atom3D = ({
  position,
  element,
  scale = 1,
  showLabel = true,
  labelOverride,
  gameStarted = true,
  hideHtml = false,
  isSelected = false,
  isAngleSelected = false,
  onClick,
}: {
  position: THREE.Vector3;
  element: string;
  scale?: number;
  showLabel?: boolean;
  labelColor?: string;
  labelOverride?: string;
  gameStarted?: boolean;
  hideHtml?: boolean;
  isSelected?: boolean;
  isAngleSelected?: boolean;
  onClick?: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const elemLower = element.toLowerCase();
  const isHydrogen = elemLower === 'hydrogen' || elemLower === 'h';
  const textContent = labelOverride || (elemLower === 'carbon' ? 'C' : elemLower === 'oxygen' ? 'O' : element.substring(0, 1).toUpperCase());

  const baseMaterial = useMemo(() => getAtomMaterial(element), [element]);
  const angleSelectedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.25,
        metalness: 0.2,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.45,
      }),
    []
  );
  const bondSelectedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.25,
        metalness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
      }),
    []
  );

  const activeMaterial = isAngleSelected ? angleSelectedMaterial : isSelected ? bondSelectedMaterial : baseMaterial;

  return (
    <group position={position} scale={scale}>
      <Sphere
        ref={meshRef}
        args={[0.9, 32, 32]}
        material={activeMaterial}
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        onPointerOver={(e) => {
          if (onClick) {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={(e) => {
          if (onClick) {
            e.stopPropagation();
            document.body.style.cursor = 'auto';
          }
        }}
      />
      {showLabel && gameStarted && !hideHtml && (
        <Html center distanceFactor={10} zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`font-black select-none pointer-events-none drop-shadow-md ${isAngleSelected || isSelected
              ? 'text-white text-xs font-black'
              : isHydrogen
                ? 'text-slate-950 text-xs font-black'
                : 'text-white text-base font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
              }`}
          >
            {textContent}
          </div>
        </Html>
      )}
    </group>
  );
};

const AngleArc3D = ({
  v1,
  v2,
  label,
  isCorrect = false,
  isWrong = false,
  hideHtml = false
}: {
  v1: THREE.Vector3;
  v2: THREE.Vector3;
  label?: string;
  isCorrect?: boolean;
  isWrong?: boolean;
  hideHtml?: boolean;
}) => {
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

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const lineColor = isCorrect ? 0x22c55e : isWrong ? 0xef4444 : 0xfacc15;

  const badgeStyle = isCorrect
    ? 'bg-emerald-600 border-2 border-emerald-300 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)] backdrop-blur-sm whitespace-nowrap flex items-center justify-center gap-1 select-none pointer-events-none animate-pulse'
    : isWrong
      ? 'bg-red-600 border-2 border-red-300 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)] backdrop-blur-sm whitespace-nowrap flex items-center justify-center gap-1 select-none pointer-events-none animate-bounce'
      : 'bg-cyan-600 border-2 border-amber-300 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap flex items-center justify-center gap-1 select-none pointer-events-none animate-pulse';

  return (
    <group>
      <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: lineColor, linewidth: 3 }))} />

      {!hideHtml && (
        <Html position={midPoint} center distanceFactor={10} zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }}>
          <div className={badgeStyle}>
            {label ? label : '?'}
          </div>
        </Html>
      )}
    </group>
  );
};

const Bond3D = ({
  start,
  end,
  isDouble = false,
  color = 0x9ca3af,
  isHighlighted = false
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  isDouble?: boolean;
  color?: number | string;
  isHighlighted?: boolean;
}) => {
  const distance = start.distanceTo(end);
  const position = start.clone().lerp(end, 0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize()
  );

  const mat = isHighlighted
    ? new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffaa00, emissiveIntensity: 0.5 })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.8 });

  return (
    <group position={position} quaternion={quaternion}>
      {isDouble ? (
        <>
          <Cylinder args={[0.12, 0.12, distance, 16]} position={[0.15, 0, 0]} material={mat} />
          <Cylinder args={[0.12, 0.12, distance, 16]} position={[-0.15, 0, 0]} material={mat} />
        </>
      ) : (
        <Cylinder args={[0.12, 0.12, distance, 16]} material={mat} />
      )}
    </group>
  );
};

const LonePair3D = ({
  position,
  rotation,
  scale = 1,
  color = 0x3b82f6,
  isRepelling = false
}: {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: number;
  color?: number;
  isRepelling?: boolean;
}) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (isRepelling && meshRef.current) {
      meshRef.current.position.x = position.x + Math.sin(clock.elapsedTime * 20) * 0.1;
      meshRef.current.position.y = position.y + Math.cos(clock.elapsedTime * 20) * 0.1;
    }
  });

  const mat = isRepelling
    ? new THREE.MeshPhongMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 })
    : new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.4 });

  return (
    <group ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <Sphere args={[0.8, 32, 16]} scale={[1, 1.5, 1]} material={mat} />
      <Sphere args={[0.2, 16, 16]} position={[-0.3, 0.8, 0]} material={new THREE.MeshBasicMaterial({ color: 0xffffff })} />
      <Sphere args={[0.2, 16, 16]} position={[0.3, 0.8, 0]} material={new THREE.MeshBasicMaterial({ color: 0xffffff })} />
    </group>
  );
};

const getTargetAngle = (formula: string): number => {
  if (formula === 'CH₄') return 109.5;
  if (formula === 'NH₃') return 107;
  if (formula === 'H₂O') return 104.5;
  if (formula === 'BF₃') return 120;
  if (formula === 'CO₂') return 180;
  return 109.5;
};

const getCentralAtom = (formula: string): string => {
  if (formula === 'CH₄') return 'carbon';
  if (formula === 'NH₃') return 'nitrogen';
  if (formula === 'H₂O') return 'oxygen';
  if (formula === 'BF₃') return 'boron';
  if (formula === 'CO₂') return 'carbon';
  return 'carbon';
};

const getOuterAtom = (formula: string): string => {
  if (formula === 'CH₄') return 'hydrogen';
  if (formula === 'NH₃') return 'hydrogen';
  if (formula === 'H₂O') return 'hydrogen';
  if (formula === 'BF₃') return 'fluorine';
  if (formula === 'CO₂') return 'oxygen';
  return 'hydrogen';
};

const getOuterAtomCount = (formula: string): number => {
  if (formula === 'CH₄') return 4;
  if (formula === 'NH₃') return 3;
  if (formula === 'H₂O') return 2;
  if (formula === 'BF₃') return 3;
  if (formula === 'CO₂') return 2;
  return 4;
};

const getTargetGeometry = (formula: string): THREE.Vector3[] => {
  if (formula === 'CH₄') return getTetrahedralVertices(2.3);
  if (formula === 'NH₃') return [
    new THREE.Vector3(0, 2.1, -0.5),
    new THREE.Vector3(-1.9, -1.0, 0.5),
    new THREE.Vector3(1.9, -1.0, 0.5),
  ];
  if (formula === 'H₂O') return [
    new THREE.Vector3(-1.8, -1.2, 0.4),
    new THREE.Vector3(1.8, -1.2, -0.4),
  ];
  if (formula === 'BF₃') return getTrigonalPlanarVertices(2.3);
  if (formula === 'CO₂') return [new THREE.Vector3(2.3, 0, 0), new THREE.Vector3(-2.3, 0, 0)];
  return getTetrahedralVertices(2.3);
};

const l2_getTargetAngle = (formula: string): number => {
  if (formula === 'CH₄') return 109.5;
  if (formula === 'NH₃') return 107;
  if (formula === 'H₂O') return 104.5;
  if (formula === 'BF₃') return 120;
  if (formula === 'CO₂') return 180;
  return 109.5;
};

const l2_getCentralAtom = (formula: string): string => {
  if (formula === 'CH₄' || formula === 'CO₂') return 'carbon';
  if (formula === 'NH₃') return 'nitrogen';
  if (formula === 'H₂O') return 'oxygen';
  if (formula === 'BF₃') return 'boron';
  return 'carbon';
};

const l2_getOuterAtom = (formula: string): string => {
  if (formula === 'CH₄' || formula === 'NH₃' || formula === 'H₂O') return 'hydrogen';
  if (formula === 'BF₃') return 'fluorine';
  if (formula === 'CO₂') return 'oxygen';
  return 'hydrogen';
};

const l2_getTargetGeometry = (formula: string): THREE.Vector3[] => {
  if (formula === 'CH₄') return getTetrahedralVertices(2.3);
  if (formula === 'NH₃') return [
    new THREE.Vector3(-1.8, -1.0, 0.8),
    new THREE.Vector3(1.8, -1.0, 0.8),
    new THREE.Vector3(0, -1.2, -1.5),
    new THREE.Vector3(0, 2.2, 0),
  ];
  if (formula === 'H₂O') return [
    new THREE.Vector3(-1.74, -1.35, 0),
    new THREE.Vector3(1.74, -1.35, 0),
    new THREE.Vector3(-1.2, 1.8, -0.6),
    new THREE.Vector3(1.2, 1.8, 0.6),
  ];
  if (formula === 'BF₃') return getTrigonalPlanarVertices(2.3);
  if (formula === 'CO₂') return [new THREE.Vector3(2.3, 0, 0), new THREE.Vector3(-2.3, 0, 0)];
  return getTetrahedralVertices(2.3);
};

interface Level1UIProps {
  question: Level1Question;
  inputAngle: string;
  setInputAngle: (val: string) => void;
  handleSubmit: () => void;
  feedback: { isCorrect: boolean; message: string; explanation: string } | null;
  handleNextQuestion: () => void;
  gameStarted?: boolean;
  hideHtml?: boolean;
}

function Level1UI({
  question,
  inputAngle,
  setInputAngle,
  handleSubmit,
  feedback,
  handleNextQuestion,
  gameStarted = true,
  hideHtml = false
}: Level1UIProps) {
  const router = useRouter();
  const [centralPlaced, setCentralPlaced] = useState(false);
  const [placedAtoms, setPlacedAtoms] = useState<THREE.Vector3[]>([]);
  const [placedBonds, setPlacedBonds] = useState<{ index: number; type: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<string | null>(null);
  const [selectedBond1, setSelectedBond1] = useState<number>(-1);
  const [selectedBond2, setSelectedBond2] = useState<number>(-1);

  // Atom selection states for bonding & angle measurement
  const [selectedCForBond, setSelectedCForBond] = useState(false);
  const [selectedHIndexForBond, setSelectedHIndexForBond] = useState<number | null>(null);
  const [selectedHForAngle, setSelectedHForAngle] = useState<number[]>([]);
  const [alignedAtomIndices, setAlignedAtomIndices] = useState<number[]>([]);
  const [completedAngleArcs, setCompletedAngleArcs] = useState<{ v1Index: number; v2Index: number; angle: number }[]>([]);
  const [localAngleFeedback, setLocalAngleFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  const formula = question.formula;
  const centralElement = getCentralAtom(formula);
  const outerElement = getOuterAtom(formula);
  const outerCount = getOuterAtomCount(formula);
  const idealVertices = useMemo(() => getTargetGeometry(formula), [formula]);

  // Distorted initial positions for Hydrogen atoms around Carbon (noticeably distorted/random, NOT 109.5°)
  const distortedVertices = useMemo(() => {
    const rawOffsets = [
      new THREE.Vector3(0.6, 2.1, 0.7),
      new THREE.Vector3(2.0, 0.9, -0.7),
      new THREE.Vector3(-2.1, -0.6, 0.8),
      new THREE.Vector3(-0.4, -2.1, -0.7),
    ];
    return idealVertices.map((_, i) =>
      (rawOffsets[i % rawOffsets.length] || new THREE.Vector3(1, 1, 1))
        .clone()
        .normalize()
        .multiplyScalar(2.3)
    );
  }, [idealVertices]);

  const resetBuild = () => {
    setCentralPlaced(false);
    setPlacedAtoms([]);
    setPlacedBonds([]);
    setSelectedBond1(-1);
    setSelectedBond2(-1);
    setSelectedCForBond(false);
    setSelectedHIndexForBond(null);
    setSelectedHForAngle([]);
    setAlignedAtomIndices([]);
    setCompletedAngleArcs([]);
    setLocalAngleFeedback(null);
    setInputAngle("");
    setActiveDragItem(null);
  };

  const handleTapC = () => {
    if (!centralPlaced) {
      setCentralPlaced(true);
      return;
    }
    setSelectedCForBond(prev => !prev);
  };

  const handleTapH = (idx: number) => {
    // If still in bonding phase (not all bonds connected yet)
    if (placedBonds.length < outerCount) {
      const isBonded = placedBonds.some(b => b.index === idx);

      // If this H atom is not bonded yet, select/unselect it for forming a bond with Carbon
      if (!isBonded) {
        setSelectedHIndexForBond(prev => (prev === idx ? null : idx));
        setSelectedHForAngle([]);
        return;
      }

      // If Carbon is explicitly selected, allow selecting this bonded H to modify bond type
      if (selectedCForBond) {
        setSelectedHIndexForBond(prev => (prev === idx ? null : idx));
        setSelectedHForAngle([]);
        return;
      }
    }

    // Angle phase (all bonds created): Select any 2 H atoms to measure & align angle
    setSelectedHIndexForBond(null);
    setSelectedCForBond(false);
    setSelectedHForAngle(prev => {
      let next: number[];
      if (prev.includes(idx)) {
        next = prev.filter(i => i !== idx);
      } else if (prev.length < 2) {
        next = [...prev, idx];
      } else {
        next = [prev[1], idx];
      }

      if (next.length === 2) {
        setSelectedBond1(next[0]);
        setSelectedBond2(next[1]);
      } else if (next.length === 1) {
        setSelectedBond1(next[0]);
        setSelectedBond2(-1);
      } else {
        setSelectedBond1(-1);
        setSelectedBond2(-1);
      }
      return next;
    });
  };

  // Smoothly glide selected H atoms to their ideal tetrahedral positions
  const animateAtomsToIdeal = (indices: number[]) => {
    const startPositions = placedAtoms.map(p => p.clone());
    const targetPositions = idealVertices.map(v => v.clone());
    const startTime = performance.now();
    const duration = 450;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // Cubic ease out

      setPlacedAtoms(prev => {
        const next = [...prev];
        indices.forEach(idx => {
          if (next[idx] && targetPositions[idx]) {
            next[idx] = startPositions[idx].clone().lerp(targetPositions[idx], ease);
          }
        });
        return next;
      });

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleCheckAndAlign = () => {
    if (selectedHForAngle.length < 2) {
      setLocalAngleFeedback({
        isCorrect: false,
        message: "Select any 2 H atoms in 3D first!"
      });
      return;
    }

    const val = parseFloat(inputAngle);
    if (isNaN(val)) {
      setLocalAngleFeedback({
        isCorrect: false,
        message: "Enter the bond angle in degrees!"
      });
      return;
    }

    const isMatch = Math.abs(val - targetAngle) < 0.2;
    if (!isMatch) {
      setLocalAngleFeedback({
        isCorrect: false,
        message: `Incorrect angle (${val}°). Set to ${targetAngle}°!`
      });
      setTimeout(() => {
        setLocalAngleFeedback(null);
      }, 2500);
      return;
    }

    // Angle is 109.5° (correct!)
    const [a, b] = selectedHForAngle;
    if (a !== undefined && b !== undefined) {
      animateAtomsToIdeal([a, b]);
      // Store this angle so set angles are always shown and never removed!
      setCompletedAngleArcs(prev => {
        const exists = prev.some(arc =>
          (arc.v1Index === a && arc.v2Index === b) || (arc.v1Index === b && arc.v2Index === a)
        );
        if (!exists) {
          return [...prev, { v1Index: a, v2Index: b, angle: targetAngle }];
        }
        return prev;
      });
    }

    const updatedAligned = Array.from(new Set([...alignedAtomIndices, a, b]));
    setAlignedAtomIndices(updatedAligned);

    const isAllComplete = updatedAligned.length >= outerCount;

    if (isAllComplete) {
      setLocalAngleFeedback({
        isCorrect: true,
        message: `All bond angles aligned to ${targetAngle}°! Target Completed!`
      });
      setInputAngle(targetAngle.toString());
      handleSubmit();
    } else {
      setLocalAngleFeedback({
        isCorrect: true,
        message: `✓ 2 H atoms placed at ${targetAngle}°! Select remaining H atoms.`
      });
      setTimeout(() => {
        setSelectedHForAngle([]);
        setSelectedBond1(-1);
        setSelectedBond2(-1);
        setInputAngle("");
        setLocalAngleFeedback(null);
      }, 1200);
    }
  };

  const createBond = (type: string) => {
    if (!centralPlaced) {
      setCentralPlaced(true);
    }
    if (placedAtoms.length === 0) {
      alert("Place Hydrogen atoms first!");
      return;
    }

    if (selectedHIndexForBond !== null) {
      setPlacedBonds(prev => {
        const filtered = prev.filter(b => b.index !== selectedHIndexForBond);
        return [...filtered, { index: selectedHIndexForBond, type }];
      });
    } else {
      const nextUnbondedIdx = placedAtoms.findIndex((_, idx) => !placedBonds.some(b => b.index === idx));
      if (nextUnbondedIdx !== -1) {
        setPlacedBonds(prev => [...prev, { index: nextUnbondedIdx, type }]);
      } else if (placedBonds.length < placedAtoms.length) {
        setPlacedBonds(prev => [...prev, { index: prev.length, type }]);
      }
    }

    // After making a bond: remove blue color from all H atoms and unselect Carbon
    setSelectedHIndexForBond(null);
    setSelectedCForBond(false);
    setSelectedHForAngle([]);
    setSelectedBond1(-1);
    setSelectedBond2(-1);
  };

  const placeItem = (itemType: string) => {
    if (itemType === 'central') {
      setCentralPlaced(true);
    } else if (itemType === 'outer') {
      if (!centralPlaced) {
        setCentralPlaced(true);
      }
      setPlacedAtoms(prev => {
        if (prev.length < distortedVertices.length) {
          return [...prev, distortedVertices[prev.length]];
        }
        return prev;
      });
    } else if (itemType.startsWith('bond-')) {
      const type = itemType.split('-')[1] || 'single';
      createBond(type);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    try {
      e.dataTransfer.setData('text/plain', item);
    } catch { }
    setActiveDragItem(item);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const item = activeDragItem || e.dataTransfer.getData('text/plain');
    if (item) {
      placeItem(item);
    }
    setActiveDragItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const availableAtoms = outerCount - placedAtoms.length;
  const isBuildComplete = centralPlaced && placedAtoms.length === outerCount && placedBonds.length === outerCount;

  const targetAngle = getTargetAngle(formula);
  const parsedAngle = parseFloat(inputAngle);
  const hasTypedAngle = inputAngle.trim() !== "" && !isNaN(parsedAngle);
  const isCorrectAngle = feedback?.isCorrect || localAngleFeedback?.isCorrect || (hasTypedAngle && Math.abs(parsedAngle - targetAngle) < 0.2);
  const isWrongAngle = (localAngleFeedback && !localAngleFeedback.isCorrect) || (hasTypedAngle && !isCorrectAngle);

  return (
    <div className="flex flex-col gap-1.5 sm:gap-3 w-full h-full flex-1 min-h-0 text-sm">
      {/* ── MAIN 3D CANVAS AREA (SINGLE CANVAS WORKSHOP) ───────────────────── */}
      <div
        className="flex-1 w-full relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-inner flex flex-col justify-between min-h-0"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Floating Top Info Bar inside canvas (Target completely removed, only Reset preserved) */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={resetBuild}
            className="vsepr-top-bar px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>

        {/* Drag Drop Overlay */}
        {isDragging && (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto bg-blue-50/40 backdrop-blur-[2px]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="w-44 h-44 rounded-full border-4 border-dashed border-blue-400 bg-blue-500/10 flex items-center justify-center animate-pulse pointer-events-none">
              <span className="text-blue-900 font-extrabold bg-white px-4 py-2 rounded-xl shadow-lg text-xs text-center border border-blue-200">
                Drop anywhere to place<br />
                <span className="text-blue-600 font-bold capitalize">
                  {!centralPlaced ? centralElement : availableAtoms > 0 ? outerElement : 'Bond'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* 3D Canvas (Bounded directly above the C & H dock and left of the right panel, shifted upward) */}
        <div className="absolute top-1 sm:top-2 bottom-24 sm:bottom-28 left-2 sm:left-4 right-48 sm:right-56 overflow-hidden">
          <Canvas camera={{ position: [0, 0, 7.4], fov: 45 }} className="w-full h-full">
            <ambientLight intensity={1.1} />
            <directionalLight position={[10, 10, 10]} intensity={1.4} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            <pointLight position={[0, 0, 4]} intensity={0.6} color="#3b82f6" />
            <OrbitControls makeDefault enableZoom={true} target={[0, 0, 0]} />

            {/* Pedestal Plate completely removed */}

            {/* Floating 3D Molecule Group centered directly above the C and H atoms */}
            <group position={[0, 0, 0]}>
              {/* Central Atom */}
              {centralPlaced && (
                <Atom3D
                  position={new THREE.Vector3(0, 0, 0)}
                  element={centralElement}
                  scale={1.05}
                  labelOverride="C"
                  gameStarted={gameStarted}
                  hideHtml={hideHtml}
                  isSelected={selectedCForBond}
                  onClick={handleTapC}
                />
              )}

              {/* Outer Atoms & Bonds */}
              {placedAtoms.map((pos, idx) => {
                const bond = placedBonds.find((b) => b.index === idx);
                const isAngleMarked = selectedHForAngle.includes(idx);
                const isBondMarked = selectedHIndexForBond === idx;

                return (
                  <React.Fragment key={idx}>
                    <Atom3D
                      position={pos}
                      element={outerElement}
                      scale={0.75}
                      labelOverride="H"
                      gameStarted={gameStarted}
                      hideHtml={hideHtml}
                      isAngleSelected={isAngleMarked}
                      isSelected={isBondMarked}
                      onClick={() => handleTapH(idx)}
                    />
                    {bond && (
                      <Bond3D
                        start={new THREE.Vector3(0, 0, 0)}
                        end={pos}
                        isDouble={bond.type === 'double' || bond.type === 'triple'}
                        isHighlighted={selectedBond1 === idx || selectedBond2 === idx}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Permanent Completed Angle Arcs (Always shown, never removed!) */}
              {completedAngleArcs.map((arc, i) => (
                arc.v1Index < placedAtoms.length &&
                arc.v2Index < placedAtoms.length && (
                  <AngleArc3D
                    key={`completed-arc-${arc.v1Index}-${arc.v2Index}-${i}`}
                    v1={placedAtoms[arc.v1Index]}
                    v2={placedAtoms[arc.v2Index]}
                    label={`${arc.angle}°`}
                    isCorrect={true}
                    isWrong={false}
                    hideHtml={hideHtml}
                  />
                )
              ))}

              {/* Angle Arc 3D for currently selected pair (if not already completed) */}
              {selectedBond1 >= 0 &&
                selectedBond2 >= 0 &&
                selectedBond1 !== selectedBond2 &&
                !completedAngleArcs.some(arc =>
                  (arc.v1Index === selectedBond1 && arc.v2Index === selectedBond2) ||
                  (arc.v1Index === selectedBond2 && arc.v2Index === selectedBond1)
                ) &&
                selectedBond1 < placedAtoms.length &&
                selectedBond2 < placedAtoms.length && (
                  <AngleArc3D
                    v1={placedAtoms[selectedBond1]}
                    v2={placedAtoms[selectedBond2]}
                    label={hasTypedAngle ? `${inputAngle}°` : '?'}
                    isCorrect={isCorrectAngle}
                    isWrong={isWrongAngle}
                    hideHtml={hideHtml}
                  />
                )}
            </group>
          </Canvas>
        </div>

        {/* ── RIGHT SIDE PANEL (BONDS & ANGLE CONTROLS INSIDE MIDDLE SCREEN) ─── */}
        <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-44 sm:w-52 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-2">
          {alignedAtomIndices.length >= outerCount ? (
            /* Compact Target Completed View (fits comfortably on screen, no scroll) */
            <div className="space-y-2 animate-in zoom-in-95 duration-200 text-center">
              <div className="w-full py-2 px-2.5 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-sm flex items-center justify-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Target Completed!</span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center leading-tight">
                All bond angles aligned to 109.5°! Tetrahedral shape complete!
              </div>
              <div className="flex flex-col gap-1.5 pt-0.5">
                <button
                  onClick={() => exitSimulation()}
                  className="w-full py-1.5 px-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Back to Topics</span>
                </button>
                <button
                  onClick={resetBuild}
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Replay Challenge</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Bonds Section */}
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-800 tracking-wider uppercase font-mono">Create Bonds</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 font-mono">{placedBonds.length} / {outerCount}</span>
                </div>

                {/* Helper status */}
                {selectedCForBond && selectedHIndexForBond !== null ? (
                  <div className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-50/90 py-1 px-1.5 rounded-lg border border-blue-200 text-center">
                    C + H Selected (Choose Bond)
                  </div>
                ) : selectedCForBond ? (
                  <div className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50/90 py-1 px-1.5 rounded-lg border border-amber-200 text-center">
                    C Selected → Tap an H
                  </div>
                ) : selectedHIndexForBond !== null ? (
                  <div className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-50/90 py-1 px-1.5 rounded-lg border border-amber-200 text-center">
                    H Selected → Tap C
                  </div>
                ) : placedBonds.length < outerCount ? (
                  <div className="text-[9px] text-slate-500 text-center py-0.5 font-medium">
                    Tap C & H in 3D:
                  </div>
                ) : (
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50/90 py-1 px-1.5 rounded-lg border border-emerald-200 text-center">
                    ✓ All Bonds Connected
                  </div>
                )}

                {/* Bond Buttons */}
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <button
                    onClick={() => createBond('single')}
                    disabled={!centralPlaced || placedAtoms.length === 0}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40"
                  >
                    <div className="w-3 h-1 bg-blue-600 rounded-full" />
                    <span>Single Bond</span>
                  </button>
                  <button
                    onClick={() => createBond('double')}
                    disabled={!centralPlaced || placedAtoms.length === 0}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 active:bg-purple-200 border-2 border-purple-200 hover:border-purple-300 text-purple-700 font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="w-3 h-0.5 bg-purple-600 rounded-full" />
                      <div className="w-3 h-0.5 bg-purple-600 rounded-full" />
                    </div>
                    <span>Double Bond</span>
                  </button>
                </div>
              </div>

              <hr className="border-slate-200 my-0.5" />

              {/* Angle Section */}
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-black text-slate-800 tracking-wider uppercase font-mono">Set Bond Angle</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200">
                    {alignedAtomIndices.length} / {outerCount} Aligned
                  </span>
                </div>

                {placedBonds.length < outerCount ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2 text-center shadow-xs">
                    <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold leading-tight">
                      Connect all {outerCount} bonds first
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedHForAngle.length < 2 ? (
                      <div className="bg-blue-50/60 border border-blue-200 rounded-xl py-2 px-2 text-center shadow-xs">
                        <div className="text-[9px] sm:text-[10px] text-blue-900 font-bold leading-tight">
                          {alignedAtomIndices.length === 0
                            ? "Tap any 2 H in 3D (marked in blue) to set angle"
                            : `Tap next H in 3D (${alignedAtomIndices.length}/${outerCount} done)`
                          }
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 sm:space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse"></span>
                            2 H Selected in 3D (Blue)
                          </span>
                        </div>

                        <input
                          type="number"
                          step="0.5"
                          placeholder="Enter Angle (°)"
                          value={inputAngle}
                          onChange={(e) => setInputAngle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCheckAndAlign();
                          }}
                          className={`w-full px-2 py-1 sm:py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-black text-center focus:outline-none transition-all shadow-inner ${isCorrectAngle
                            ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800'
                            : isWrongAngle
                              ? 'border-2 border-rose-400 bg-rose-50 text-rose-800'
                              : 'border-slate-300 bg-white text-[#1E293B] focus:border-blue-500'
                            }`}
                          autoFocus
                        />

                        {localAngleFeedback && !localAngleFeedback.isCorrect && (
                          <div className="text-[9px] font-bold text-rose-600 bg-rose-50 py-0.5 px-1 rounded-lg border border-rose-200 text-center">
                            {localAngleFeedback.message}
                          </div>
                        )}

                        <button
                          onClick={handleCheckAndAlign}
                          disabled={!hasTypedAngle || placedBonds.length < outerCount}
                          className={`w-full py-1.5 px-2.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer ${isCorrectAngle
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white disabled:opacity-40'
                            }`}
                        >
                          Set Angle
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── BOTTOM DOCK: DIRECTLY BELOW THE 3D MOLECULE ───────────────────── */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-4 right-48 sm:right-56 flex justify-center pointer-events-none z-20">
          <div className="pointer-events-auto flex items-center gap-5 sm:gap-7 px-5 sm:px-7 py-2 sm:py-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl">
            {/* Carbon Atom (Big atom, exact 3D color #2b2b2b) */}
            <button
              onClick={() => {
                if (!centralPlaced) {
                  setCentralPlaced(true);
                } else {
                  setSelectedCForBond(prev => !prev);
                }
              }}
              className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all border-2 ${selectedCForBond ? 'border-sky-400 ring-4 ring-sky-300' : 'border-slate-700'
                }`}
              style={{ backgroundColor: '#2b2b2b' }}
              title="Carbon (C)"
            >
              <span>C</span>
            </button>

            {/* Hydrogen Atom (Big atom, exact 3D color #f5f5f5) */}
            <button
              onClick={() => {
                if (!centralPlaced) {
                  setCentralPlaced(true);
                  setPlacedAtoms([distortedVertices[0]]);
                } else if (placedAtoms.length < distortedVertices.length) {
                  setPlacedAtoms(prev => [...prev, distortedVertices[prev.length]]);
                }
              }}
              className="w-13 h-13 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl text-slate-800 shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all border-2 border-slate-300"
              style={{ backgroundColor: '#f5f5f5' }}
              title="Hydrogen (H)"
            >
              <span>H</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DraggablePairProps {
  initialPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  isLonePair: boolean;
  onDrag: (newPos: THREE.Vector3) => void;
  isRepelling: boolean;
  isSnapped: boolean;
  outerElement: string;
  centralElement?: string;
  pairLabel: string;
  gameStarted?: boolean;
}

const DraggablePair = ({
  initialPos,
  targetPos,
  isLonePair,
  onDrag,
  isRepelling,
  isSnapped,
  outerElement,
  pairLabel,
  gameStarted = true
}: DraggablePairProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState(initialPos);

  const bind = useDrag(({ active, event }) => {
    if (isSnapped) return;

    if (active) {
      document.body.style.cursor = 'grabbing';
      if (event && (event as any).stopPropagation) (event as any).stopPropagation();
    } else {
      document.body.style.cursor = 'auto';
    }

    if (active && event) {
      const point = (event as any).point;
      if (point) {
        const newPos = new THREE.Vector3(point.x, point.y, point.z).normalize().multiplyScalar(2.5);
        setPos(newPos);
        onDrag(newPos);
      }
    }
  }, { pointerEvents: true } as any);

  useEffect(() => {
    if (isSnapped) setPos(targetPos);
  }, [isSnapped, targetPos]);

  return (
    <group
      ref={meshRef}
      position={pos}
      {...((bind as any)())}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => { setHovered(false); }}
    >
      {isLonePair ? (
        <group>
          <LonePair3D position={new THREE.Vector3(0, 0, 0)} isRepelling={isRepelling} />
          {gameStarted && (
            <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div className="text-[10px] font-black text-blue-200 bg-blue-950/80 px-1.5 py-0.5 rounded shadow border border-blue-400/40 select-none pointer-events-none mt-6">
                {pairLabel || 'LP'}
              </div>
            </Html>
          )}
        </group>
      ) : (
        <>
          <Atom3D position={new THREE.Vector3(0, 0, 0)} element={outerElement} scale={0.8} labelOverride={pairLabel} gameStarted={gameStarted} />
          {hovered && !isSnapped && (
            <mesh scale={1.2}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color={isRepelling ? "red" : "white"} wireframe transparent opacity={0.3} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
};

// ── 3D HOLLOW SPHERE TARGET HOLE (Clean, no text badges, true 3D spherical cage & shell) ──
const HollowSphereHole3D = ({
  position,
  isLoneSlot,
  isSnapped,
}: {
  position: THREE.Vector3;
  isLoneSlot: boolean;
  isSnapped: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const radius = isLoneSlot ? 0.85 : 0.72;

  useFrame(({ clock }) => {
    if (!isSnapped && groupRef.current) {
      // Gentle subtle breathing pulse to indicate an interactive hollow socket
      const t = clock.getElapsedTime();
      const pulse = 1 + Math.sin(t * 2.5) * 0.025;
      groupRef.current.scale.set(
        pulse * (isLoneSlot ? 0.9 : 1),
        pulse * (isLoneSlot ? 1.2 : 1),
        pulse * (isLoneSlot ? 0.9 : 1)
      );
    }
  });

  const shellColor = isSnapped ? "#10b981" : isLoneSlot ? "#a855f7" : "#0284c7";
  const wireColor = isSnapped ? "#34d399" : isLoneSlot ? "#c084fc" : "#38bdf8";

  return (
    <group ref={groupRef} position={position} scale={isLoneSlot ? [0.9, 1.2, 0.9] : [1, 1, 1]}>
      {/* 1. Translucent hollow spherical shell (double-sided, depth-write false for hollow glass effect) */}
      <mesh>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshStandardMaterial
          color={shellColor}
          transparent
          opacity={isSnapped ? 0.22 : 0.32}
          roughness={0.15}
          metalness={0.15}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. 3D Longitude & Latitude spherical wireframe lattice to visually emphasize hollow sphere curvature */}
      <mesh>
        <sphereGeometry args={[radius * 1.008, 16, 12]} />
        <meshBasicMaterial
          color={wireColor}
          wireframe
          transparent
          opacity={isSnapped ? 0.35 : 0.55}
        />
      </mesh>

      {/* 3. Equatorial rim ring for crisp 3D aperture rim definition */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.022, 16, 64]} />
        <meshBasicMaterial
          color={shellColor}
          transparent
          opacity={isSnapped ? 0.45 : 0.7}
        />
      </mesh>

      {/* 4. Meridian rim ring to reinforce 3D hollow depth from all view angles */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[radius, 0.018, 16, 64]} />
        <meshBasicMaterial
          color={shellColor}
          transparent
          opacity={isSnapped ? 0.35 : 0.55}
        />
      </mesh>
    </group>
  );
};

// ── CAMERA & ORBIT SYNC: Locks rotation pivot & orientation directly on Central Oxygen (O) Atom ──
const Level2CameraAndOrbit = ({
  completed,
}: {
  completed: boolean;
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  const targetX = completed ? -3.0 : 0;
  const targetY = completed ? 0.25 : 0.35;

  useEffect(() => {
    // When completed, focus the orientation directly on the central Oxygen (O) atom
    if (controlsRef.current) {
      controlsRef.current.target.set(targetX, targetY, 0);
      controlsRef.current.update();
    }
    camera.position.set(targetX, targetY, 12);
    camera.lookAt(targetX, targetY, 0);
  }, [completed, targetX, targetY, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom={true}
      target={[targetX, targetY, 0]}
    />
  );
};

interface Level2UIProps {
  question: Level2Question;
  handleNextQuestion: () => void;
  gameStarted?: boolean;
}

function Level2UI({
  question,
  handleNextQuestion,
  gameStarted = true
}: Level2UIProps) {
  const formula = question.formula;
  const centralElement = l2_getCentralAtom(formula);
  const outerElement = l2_getOuterAtom(formula);
  const idealVertices = useMemo(() => l2_getTargetGeometry(formula), [formula]);
  const numLonePairs = question.targetLonePairs;
  const numBonds = idealVertices.length - numLonePairs;

  // Start all items bunched up at top
  const [positions, setPositions] = useState<THREE.Vector3[]>(() =>
    idealVertices.map((_, i) => new THREE.Vector3(
      (i - (idealVertices.length - 1) / 2) * 1.0,
      2.6,
      (i % 2 === 0 ? 0.3 : -0.3)
    ).normalize().multiplyScalar(2.6))
  );

  const [isSnapped, setIsSnapped] = useState<boolean[]>(idealVertices.map(() => false));
  const [isRepelling, setIsRepelling] = useState<boolean[]>(idealVertices.map(() => false));
  const [completed, setCompleted] = useState(false);

  const resetBuild = () => {
    setPositions(
      idealVertices.map((_, i) => new THREE.Vector3(
        (i - (idealVertices.length - 1) / 2) * 1.0,
        2.6,
        (i % 2 === 0 ? 0.3 : -0.3)
      ).normalize().multiplyScalar(2.6))
    );
    setIsSnapped(idealVertices.map(() => false));
    setIsRepelling(idealVertices.map(() => false));
    setCompleted(false);
  };

  useEffect(() => {
    resetBuild();
  }, [formula]);

  const handleAutoSolve = () => {
    setPositions(idealVertices.map(v => v.clone()));
    setIsSnapped(idealVertices.map(() => true));
    setIsRepelling(idealVertices.map(() => false));
    setCompleted(true);
  };

  // Check distances on every update
  useEffect(() => {
    const newRepelling = positions.map(() => false);
    const newSnapped = positions.map(() => false);
    let allSnapped = true;

    for (let i = 0; i < positions.length; i++) {
      let tooClose = false;
      for (let j = 0; j < positions.length; j++) {
        if (i !== j) {
          if (positions[i].distanceTo(positions[j]) < 1.8) {
            tooClose = true;
          }
        }
      }
      newRepelling[i] = tooClose;

      let closestIdeal = -1;
      let minDistance = 1.6;
      const isItemLone = i >= numBonds;
      for (let k = 0; k < idealVertices.length; k++) {
        const isSlotLone = k >= numBonds;
        if (isItemLone === isSlotLone) {
          const d = positions[i].distanceTo(idealVertices[k]);
          if (d < minDistance) {
            minDistance = d;
            closestIdeal = k;
          }
        }
      }

      if (closestIdeal !== -1 && !tooClose) {
        newSnapped[i] = true;
      } else {
        newSnapped[i] = false;
        allSnapped = false;
      }
    }

    if (allSnapped && !completed) {
      setCompleted(true);
    }

    setIsRepelling(prev => {
      if (prev.some((val, idx) => val !== newRepelling[idx])) return newRepelling;
      return prev;
    });
    setIsSnapped(prev => {
      if (prev.some((val, idx) => val !== newSnapped[idx])) return newSnapped;
      return prev;
    });

  }, [positions, idealVertices, completed, numBonds]);

  const handleDrag = (idx: number, newPos: THREE.Vector3) => {
    const newPositions = [...positions];
    newPositions[idx] = newPos;
    setPositions(newPositions);
  };


  return (
    <div className="w-full h-full flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC]">
      {/* 3D Canvas */}
      <div className="w-full h-full flex-1 relative">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }} className="w-full h-full touch-none">
          <React.Suspense fallback={null}>
            <ambientLight intensity={1.1} />
            <directionalLight position={[10, 10, 10]} intensity={1.4} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            <pointLight position={[0, 0, 4]} intensity={0.6} color="#3b82f6" />
            <Level2CameraAndOrbit completed={completed} />

            {/* Molecule Group: shifted comfortably left (x: -3.0) when completed to provide ample distance from the box */}
            <group position={[completed ? -3.0 : 0, 0.25, 0]}>
              {/* Target slot hollow 3D spheres (True 3D hollow spheres, clean, no text badges) */}
              {idealVertices.map((v, i) => (
                <HollowSphereHole3D
                  key={`slot-hollow-sphere-${i}`}
                  position={v}
                  isLoneSlot={i >= numBonds}
                  isSnapped={isSnapped[i]}
                />
              ))}

              {/* Central Atom */}
              <Atom3D position={new THREE.Vector3(0, 0, 0)} element={centralElement} scale={1.2} gameStarted={gameStarted} />

              {/* Angle Arc between 2 bonds when all target holes are correctly completed */}
              {completed && numBonds >= 2 && (
                <AngleArc3D
                  v1={idealVertices[0]}
                  v2={idealVertices[1]}
                  label={`${l2_getTargetAngle(formula)}°`}
                  isCorrect={true}
                />
              )}

              {/* Draggable Outer Atoms & Lone Pairs */}
              {positions.map((pos, idx) => {
                const isLone = idx >= numBonds;
                const pairLabel = isLone
                  ? `LP${idx - numBonds + 1}`
                  : `${outerElement[0].toUpperCase()}`;
                return (
                  <React.Fragment key={idx}>
                    <DraggablePair
                      initialPos={pos}
                      targetPos={idealVertices[idx]}
                      isLonePair={isLone}
                      isRepelling={isRepelling[idx]}
                      isSnapped={isSnapped[idx]}
                      onDrag={(p: THREE.Vector3) => handleDrag(idx, p)}
                      outerElement={outerElement}
                      centralElement={centralElement}
                      pairLabel={pairLabel}
                      gameStarted={gameStarted}
                    />
                    {!isLone && (
                      <Bond3D
                        start={new THREE.Vector3(0, 0, 0)}
                        end={isSnapped[idx] ? idealVertices[idx] : pos}
                        isDouble={formula === 'CO₂'}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </group>
          </React.Suspense>
        </Canvas>
      </div>

      {/* ── COMPLETED SUCCESS CARD (COMPACT, ADJUSTABLE, AMPLE DISTANCE FROM MOLECULE) ── */}
      {completed && (
        <div className="absolute right-3 sm:right-5 md:right-7 top-1/2 -translate-y-1/2 z-20 w-[240px] sm:w-[260px] md:w-[275px] max-w-[calc(100vw-2rem)] max-h-[80vh] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
          {/* Card Header (Pinned at top) */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Geometry Unlocked!</span>
            </div>
            <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {formula}
            </span>
          </div>

          {/* Scrollable Content Area */}
          <div className="overflow-y-auto pr-1 my-2 space-y-2 flex-1 min-h-0 text-left select-text max-h-[48vh] sm:max-h-[50vh]">
            {/* Quick Properties Badges */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center shadow-xs">
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Shape</div>
                <div className="text-[11px] sm:text-xs font-black text-slate-800">{question.targetShape}</div>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center shadow-xs">
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Lone Pairs</div>
                <div className="text-[11px] sm:text-xs font-black text-blue-600">{question.targetLonePairs}</div>
              </div>
              <div className="bg-purple-50/80 p-1.5 rounded-lg border border-purple-200/80 text-center shadow-xs">
                <div className="text-[8px] text-purple-600 font-bold uppercase tracking-wider">Bond Angle</div>
                <div className="text-[11px] sm:text-xs font-black text-purple-700">{l2_getTargetAngle(formula)}°</div>
              </div>
              <div className="bg-blue-50/80 p-1.5 rounded-lg border border-blue-200/80 text-center shadow-xs">
                <div className="text-[8px] text-blue-600 font-bold uppercase tracking-wider">Domains</div>
                <div className="text-[11px] sm:text-xs font-black text-blue-700">4 (Tetrahedral)</div>
              </div>
            </div>

            {/* Theory of Water (H₂O) Section */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-lg p-2 space-y-0.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-sky-900 font-extrabold text-[10.5px]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span>Theory of Water (H₂O)</span>
              </div>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                Oxygen has <strong>6 valence electrons</strong>. It shares 2 electrons with two Hydrogen atoms (forming 2 single covalent O–H bonds) and retains <strong>4 non-bonding electrons</strong> as <strong>2 lone pairs</strong>.
              </p>
            </div>

            {/* Why 104.5° Repulsion Theory */}
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-2 space-y-0.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-[10.5px]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>Why is the Angle 104.5°?</span>
              </div>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                Ideal tetrahedral geometry has a <strong>109.5°</strong> angle. According to VSEPR theory, lone pairs occupy more space than bond pairs:
              </p>
              <div className="bg-white/90 py-0.5 px-1 rounded border border-indigo-100 text-center font-mono text-[9px] font-bold text-indigo-700">
                LP–LP &gt; LP–BP &gt; BP–BP Repulsion
              </div>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                The 2 lone pairs exert strong electrostatic repulsion, compressing the H–O–H angle down from 109.5° to <strong>104.5°</strong>.
              </p>
            </div>

            {/* Molecular Geometry & Polarity */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2 space-y-0.5 shadow-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[10.5px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Bent Shape & Polarity</span>
              </div>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                Because lone pairs are invisible in structural shape definitions, the observed molecular geometry is <strong>Bent / V-Shaped</strong>.
              </p>
              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                The asymmetric bent shape gives water a strong net dipole moment (<strong>μ = 1.85 D</strong>), making it a polar molecule capable of hydrogen bonding.
              </p>
            </div>
          </div>

          {/* Action Button (Pinned at bottom) */}
          <div className="pt-2 border-t border-slate-100 shrink-0">
            <button
              onClick={handleNextQuestion}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:shadow-lg"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}


    </div>
  );
}

const LEVEL3_MOLECULES: Record<string, {
  formula: string;
  name: string;
  angle: number;
  angleStr: string;
  lonePairs: number;
  borderColor: string;
  glowColor: string;
  cardBg: string;
  badgeBg: string;
  textColor: string;
  subTextColor: string;
  elementSymbol: string;
}> = {
  'CH₄': {
    formula: 'CH₄',
    name: 'Methane',
    angle: 109.5,
    angleStr: '109.5°',
    lonePairs: 0,
    borderColor: 'border-indigo-400 hover:border-indigo-600',
    glowColor: 'shadow-lg shadow-indigo-500/20',
    cardBg: 'bg-gradient-to-br from-indigo-50/95 via-purple-50/70 to-white',
    badgeBg: 'bg-indigo-600 text-white',
    textColor: 'text-indigo-950',
    subTextColor: 'text-indigo-600',
    elementSymbol: 'C',
  },
  'NH₃': {
    formula: 'NH₃',
    name: 'Ammonia',
    angle: 107,
    angleStr: '107°',
    lonePairs: 1,
    borderColor: 'border-blue-400 hover:border-blue-600',
    glowColor: 'shadow-lg shadow-blue-500/20',
    cardBg: 'bg-gradient-to-br from-blue-50/95 via-sky-50/70 to-white',
    badgeBg: 'bg-blue-600 text-white',
    textColor: 'text-blue-950',
    subTextColor: 'text-blue-600',
    elementSymbol: 'N',
  },
  'H₂O': {
    formula: 'H₂O',
    name: 'Water',
    angle: 104.5,
    angleStr: '104.5°',
    lonePairs: 2,
    borderColor: 'border-rose-400 hover:border-rose-600',
    glowColor: 'shadow-lg shadow-rose-500/20',
    cardBg: 'bg-gradient-to-br from-rose-50/95 via-pink-50/70 to-white',
    badgeBg: 'bg-rose-600 text-white',
    textColor: 'text-rose-950',
    subTextColor: 'text-rose-600',
    elementSymbol: 'O',
  },
  'BF₃': {
    formula: 'BF₃',
    name: 'Boron Trifluoride',
    angle: 120,
    angleStr: '120°',
    lonePairs: 0,
    borderColor: 'border-emerald-400 hover:border-emerald-600',
    glowColor: 'shadow-lg shadow-emerald-500/20',
    cardBg: 'bg-gradient-to-br from-emerald-50/95 via-teal-50/70 to-white',
    badgeBg: 'bg-emerald-600 text-white',
    textColor: 'text-emerald-950',
    subTextColor: 'text-emerald-600',
    elementSymbol: 'B',
  },
};

const CORRECT_DECREASING_ORDER = ['BF₃', 'CH₄', 'NH₃', 'H₂O'];

const MoleculeSvgPreview = ({ formula }: { formula: string }) => {
  if (formula === 'CH₄') {
    return (
      <svg viewBox="0 0 160 120" className="w-full h-10 sm:h-12 md:h-14 drop-shadow-sm shrink vsepr-svg-preview">
        <line x1="80" y1="60" x2="80" y2="22" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="60" x2="80" y2="98" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="60" x2="35" y2="74" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="60" x2="125" y2="74" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="80" cy="60" r="18" fill="url(#cGrad)" stroke="#475569" strokeWidth="2" />
        <text x="80" y="65" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">C</text>
        <circle cx="80" cy="22" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="80" y="26" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="80" cy="98" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="80" y="102" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="35" cy="74" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="35" y="78" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="125" cy="74" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="125" y="78" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <defs>
          <radialGradient id="cGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (formula === 'NH₃') {
    return (
      <svg viewBox="0 0 160 120" className="w-full h-10 sm:h-12 md:h-14 drop-shadow-sm shrink vsepr-svg-preview">
        <circle cx="73" cy="22" r="3.5" fill="#93c5fd" />
        <circle cx="87" cy="22" r="3.5" fill="#93c5fd" />
        <line x1="80" y1="58" x2="38" y2="88" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="58" x2="80" y2="96" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="58" x2="122" y2="88" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="80" cy="58" r="18" fill="url(#nGrad)" stroke="#2563eb" strokeWidth="2" />
        <text x="80" y="63" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">N</text>
        <circle cx="38" cy="88" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="38" y="92" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="80" cy="96" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="80" y="100" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="122" cy="88" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="122" y="92" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <defs>
          <radialGradient id="nGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (formula === 'H₂O') {
    return (
      <svg viewBox="0 0 160 120" className="w-full h-10 sm:h-12 md:h-14 drop-shadow-sm shrink vsepr-svg-preview">
        <circle cx="64" cy="22" r="3.5" fill="#fca5a5" />
        <circle cx="74" cy="18" r="3.5" fill="#fca5a5" />
        <circle cx="86" cy="18" r="3.5" fill="#fca5a5" />
        <circle cx="96" cy="22" r="3.5" fill="#fca5a5" />
        <line x1="80" y1="58" x2="42" y2="88" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="58" x2="118" y2="88" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="80" cy="58" r="18" fill="url(#oGrad)" stroke="#dc2626" strokeWidth="2" />
        <text x="80" y="63" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">O</text>
        <circle cx="42" cy="88" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="42" y="92" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <circle cx="118" cy="88" r="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <text x="118" y="92" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="extrabold">H</text>
        <defs>
          <radialGradient id="oGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#b91c1c" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  if (formula === 'BF₃') {
    return (
      <svg viewBox="0 0 160 120" className="w-full h-10 sm:h-12 md:h-14 drop-shadow-sm shrink vsepr-svg-preview">
        <line x1="80" y1="60" x2="80" y2="20" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="60" x2="42" y2="90" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="80" y1="60" x2="118" y2="90" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="80" cy="60" r="18" fill="url(#bGrad)" stroke="#059669" strokeWidth="2" />
        <text x="80" y="65" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">B</text>
        <circle cx="80" cy="20" r="12" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
        <text x="80" y="24" textAnchor="middle" fill="#064e3b" fontSize="10" fontWeight="extrabold">F</text>
        <circle cx="42" cy="90" r="12" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
        <text x="42" y="94" textAnchor="middle" fill="#064e3b" fontSize="10" fontWeight="extrabold">F</text>
        <circle cx="118" cy="90" r="12" fill="#34d399" stroke="#059669" strokeWidth="1.5" />
        <text x="118" y="94" textAnchor="middle" fill="#064e3b" fontSize="10" fontWeight="extrabold">F</text>
        <defs>
          <radialGradient id="bGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
        </defs>
      </svg>
    );
  }

  return null;
};

interface Level3UIProps {
  handleNextQuestion: () => void;
  setLevelScore: (score: number) => void;
  gameStarted?: boolean;
}

function Level3UI({
  handleNextQuestion,
  setLevelScore,
  gameStarted = true
}: Level3UIProps) {
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [available, setAvailable] = useState<string[]>(['CH₄', 'NH₃', 'H₂O', 'BF₃']);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const resetAll = () => {
    setSlots([null, null, null, null]);
    setAvailable(['CH₄', 'NH₃', 'H₂O', 'BF₃']);
    setSubmitted(false);
    setIsCorrect(null);
  };

  const handleCardClick = (formula: string) => {
    if (submitted) return;
    const firstEmpty = slots.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      const newSlots = [...slots];
      newSlots[firstEmpty] = formula;
      setSlots(newSlots);
      setAvailable(prev => prev.filter(m => m !== formula));
    }
  };

  const handleSlotClick = (index: number) => {
    if (submitted) return;
    const formula = slots[index];
    if (formula) {
      const newSlots = [...slots];
      newSlots[index] = null;
      setSlots(newSlots);
      setAvailable(prev => [...prev, formula]);
    }
  };

  const handleDragStart = (e: React.DragEvent, formula: string, fromSlotIndex?: number) => {
    e.dataTransfer.setData('formula', formula);
    if (fromSlotIndex !== undefined) {
      e.dataTransfer.setData('fromSlot', String(fromSlotIndex));
    }
  };

  const handleDropOnSlot = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (submitted) return;
    const formula = e.dataTransfer.getData('formula');
    const fromSlotStr = e.dataTransfer.getData('fromSlot');

    if (!formula) return;

    if (fromSlotStr !== '') {
      const fromSlot = Number(fromSlotStr);
      if (fromSlot === targetIndex) return;
      const newSlots = [...slots];
      const targetFormula = newSlots[targetIndex];
      newSlots[targetIndex] = formula;
      newSlots[fromSlot] = targetFormula;
      setSlots(newSlots);
    } else {
      const newSlots = [...slots];
      const existingInTarget = newSlots[targetIndex];
      newSlots[targetIndex] = formula;
      setSlots(newSlots);

      setAvailable(prev => {
        const nextAvailable = prev.filter(m => m !== formula);
        if (existingInTarget) {
          nextAvailable.push(existingInTarget);
        }
        return nextAvailable;
      });
    }
  };

  const handleSubmit = () => {
    if (slots.some(s => s === null)) return;

    const correct = slots.every((f, idx) => f === CORRECT_DECREASING_ORDER[idx]);
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct && setLevelScore) {
      setLevelScore(50);
    }
  };

  const allFilled = slots.every(s => s !== null);

  const slotBadgeStyles = [
    'bg-[#059669] text-white shadow-md shadow-emerald-600/30',
    'bg-[#4F46E5] text-white shadow-md shadow-indigo-600/30',
    'bg-[#2563EB] text-white shadow-md shadow-blue-600/30',
    'bg-[#E11D48] text-white shadow-md shadow-rose-600/30',
  ];

  return (
    <div className="w-full h-full flex-1 flex flex-col relative overflow-hidden bg-[#F8FAFC] rounded-2xl border border-slate-200 shadow-sm min-h-0 min-w-0 select-none">
      <style>{`
        @media (max-height: 560px) {
          .vsepr-slot-card {
            height: 6.25rem !important;
            padding: 0.25rem !important;
          }
          .vsepr-drag-card {
            height: 5.5rem !important;
            padding: 0.25rem !important;
          }
          .vsepr-svg-preview {
            height: 2.2rem !important;
          }
        }
        @media (max-height: 460px) {
          .vsepr-slot-card {
            height: 5.25rem !important;
            padding: 0.2rem !important;
          }
          .vsepr-drag-card {
            height: 4.6rem !important;
            padding: 0.2rem !important;
          }
          .vsepr-svg-preview {
            height: 1.8rem !important;
          }
        }
      `}</style>
      {/* ── 3D BACKGROUND CANVAS (CLEAN AMBIENT BACKDROP) ────────────────────── */}
      <div className="w-full h-full absolute inset-0 z-0 pointer-events-auto">
        <Canvas className="w-full h-full bg-transparent" camera={{ position: [0, 1.5, 9], fov: 45 }}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          <pointLight position={[0, 5, 5]} intensity={0.8} />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>
      {/* ── SINGLE CANVAS WORKSHOP OVERLAY (Renders blurred behind intro overlay when !gameStarted) ──────────────── */}
      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 overflow-hidden min-h-0 transition-all duration-500 ${!gameStarted ? 'filter blur-[5px] opacity-70 pointer-events-none select-none' : 'pointer-events-auto opacity-100'
        }`}>

        <div className="w-full max-w-4xl mx-auto flex flex-col justify-between flex-1 min-h-0 pt-0.5 sm:pt-1 pb-12 sm:pb-14">
          {/* Top Drop Slot Cards Row */}
          <div className="w-full z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-3.5 relative">
              {slots.map((formula, idx) => {
                const mol = formula ? LEVEL3_MOLECULES[formula] : null;
                const isSlotCorrect = submitted && formula === CORRECT_DECREASING_ORDER[idx];

                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    {/* Number Badge above slot */}
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full font-black text-[10px] sm:text-xs flex items-center justify-center mb-0.5 sm:mb-1 z-10 ${slotBadgeStyles[idx]}`}>
                      {idx + 1}
                    </div>

                    {/* Slot Box Container */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnSlot(e, idx)}
                      onClick={() => handleSlotClick(idx)}
                      className={`w-full h-28 sm:h-32 md:h-36 rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col items-center justify-between p-1.5 sm:p-2.5 relative vsepr-slot-card ${!formula
                        ? 'border-2 border-dashed border-blue-300/80 bg-white/95 backdrop-blur-md hover:border-blue-500 hover:bg-blue-50/40 shadow-sm cursor-pointer'
                        : submitted
                          ? isSlotCorrect
                            ? 'border-2 border-emerald-500 bg-emerald-50/95 shadow-md shadow-emerald-500/10'
                            : 'border-2 border-red-500 bg-red-50/95 shadow-md shadow-red-500/10'
                          : `${mol?.cardBg} ${mol?.borderColor} ${mol?.glowColor} border-2 shadow-md cursor-pointer hover:scale-[1.02]`
                        }`}
                    >
                      {!formula ? (
                        <div className="flex flex-col items-center justify-center text-center my-auto p-1">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 mb-1 shadow-inner">
                            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
                          </div>
                          <span className="text-slate-600 text-[10px] sm:text-xs font-bold">Drop molecule here</span>
                        </div>
                      ) : (
                        <div
                          draggable={!submitted}
                          onDragStart={(e) => handleDragStart(e, formula, idx)}
                          className="w-full h-full flex flex-col items-center justify-between py-0.5 sm:py-1"
                        >
                          <div className="w-full flex items-center justify-between px-1">
                            {submitted && (
                              isSlotCorrect ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">✓</div>
                              ) : (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">✕</div>
                              )
                            )}
                            {!submitted && <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold">Click to remove</div>}
                            <Move className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                          </div>

                          <MoleculeSvgPreview formula={formula} />

                          <div className="text-center">
                            <div className={`font-black text-xs sm:text-sm ${mol?.textColor}`}>{mol?.formula}</div>
                            <div className={`text-[10px] sm:text-[11px] font-bold ${mol?.subTextColor}`}>({mol?.name})</div>

                            {/* Bond Angle Badge shown after submission */}
                            {submitted && (
                              <div className="mt-0.5 px-2 py-0.5 rounded-full bg-white/90 border border-slate-200 font-extrabold text-[10px] sm:text-[11px] shadow-sm text-slate-800">
                                Angle: {mol?.angleStr}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Arrow separator between slots */}
                      {idx < 3 && (
                        <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 items-center justify-center text-blue-400 pointer-events-none drop-shadow-sm">
                          <ChevronRight className="w-5 h-5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Molecule Tray */}
          <div className="w-full z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-3.5">
              {['CH₄', 'NH₃', 'H₂O', 'BF₃'].map((f) => {
                const mol = LEVEL3_MOLECULES[f];
                const isAvailable = available.includes(f);

                return (
                  <div
                    key={f}
                    draggable={isAvailable && !submitted}
                    onDragStart={(e) => isAvailable && handleDragStart(e, f)}
                    onClick={() => isAvailable && handleCardClick(f)}
                    className={`rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 transition-all duration-300 border-2 flex flex-col items-center justify-between h-25 sm:h-28 md:h-31 relative vsepr-drag-card ${isAvailable && !submitted
                      ? `${mol.cardBg} ${mol.borderColor} ${mol.glowColor} cursor-grab active:cursor-grabbing hover:scale-[1.03] shadow-md`
                      : 'bg-slate-100/60 border-slate-200 opacity-35 cursor-not-allowed grayscale'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold ${mol.badgeBg}`}>
                        {mol.formula}
                      </span>
                      <Move className="w-3 h-3 text-slate-400 opacity-60" />
                    </div>

                    <MoleculeSvgPreview formula={f} />

                    <div className="text-center mt-0.5">
                      <div className={`font-black text-xs sm:text-sm ${mol.textColor}`}>{mol.formula}</div>
                      <div className={`text-[9px] sm:text-[10px] font-bold ${mol.subTextColor}`}>({mol.name})</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submitted Feedback Overlay Banner / Card */}
        {submitted && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/30 backdrop-blur-xs">
            <div className="w-full max-w-2xl bg-white/98 backdrop-blur-xl border border-slate-200 p-4 sm:p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'
                    }`}>
                    {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">
                      {isCorrect ? "Correct Order!" : "Incorrect Order"}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {isCorrect
                        ? "You correctly ordered molecules by decreasing bond angle."
                        : "Review the correct angles and try again!"}
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-black text-slate-700">
                  Score: {isCorrect ? "50 / 50" : "0 / 50"}
                </div>
              </div>

              {/* Angle Breakdown List */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-4">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">1. BF₃</div>
                  <div className="text-xs font-black text-slate-800">120°</div>
                  <div className="text-[10px] text-slate-500">0 Lone Pairs</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase">2. CH₄</div>
                  <div className="text-xs font-black text-slate-800">109.5°</div>
                  <div className="text-[10px] text-slate-500">0 Lone Pairs</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-center">
                  <div className="text-[10px] font-bold text-purple-600 uppercase">3. NH₃</div>
                  <div className="text-xs font-black text-slate-800">107°</div>
                  <div className="text-[10px] text-slate-500">1 Lone Pair</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-pink-50 border border-pink-200 text-center">
                  <div className="text-[10px] font-bold text-pink-600 uppercase">4. H₂O</div>
                  <div className="text-xs font-black text-slate-800">104.5°</div>
                  <div className="text-[10px] text-slate-500">2 Lone Pairs</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 sm:mb-5 leading-relaxed bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200">
                <strong>Concept:</strong> More lone pairs cause greater electron repulsion, pushing bonding pairs closer together and decreasing the bond angle (BF₃ &gt; CH₄ &gt; NH₃ &gt; H₂O).
              </p>

              <div className="flex items-center justify-end gap-3">
                {!isCorrect && (
                  <button
                    onClick={resetAll}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                )}
                <button
                  onClick={isCorrect ? handleNextQuestion : resetAll}
                  className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer ${isCorrect
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                  <span>{isCorrect ? "Finish Challenge" : "Reset & Retry"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING BOTTOM ACTIONS (RESET & SUBMIT ONLY) ───── */}
      {!submitted && gameStarted && (
        <div className="absolute bottom-1.5 sm:bottom-2 inset-x-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 p-1 px-3 sm:px-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-xl sm:rounded-2xl shadow-lg text-slate-800">
            <button
              onClick={resetAll}
              className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-extrabold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className="px-4 py-1 sm:px-6 sm:py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-lg sm:rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Submit Order</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VseprGamePage({
  difficulty = "level1",
  onExit
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  const router = useRouter();

  const getLevelFromDifficulty = (diff: string): 1 | 2 | 3 => {
    const d = (diff || "").toLowerCase();
    if (d === "medium" || d === "level2" || d === "level-2" || d === "2") return 2;
    if (d === "advanced" || d === "hard" || d === "level3" || d === "level-3" || d === "3") return 3;
    return 1;
  };

  // Quiz State
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(() => getLevelFromDifficulty(difficulty));
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'level-complete' | 'game-complete'>('playing');
  const [scores, setScores] = useState({ 1: 0, 2: 0, 3: 0 });
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; explanation: string } | null>(null);

  // Inputs
  const [inputAngle, setInputAngle] = useState("");

  const resetInputs = () => {
    setInputAngle("");
    setFeedback(null);
  };

  useEffect(() => {
    setCurrentLevel(getLevelFromDifficulty(difficulty));
    resetInputs();
    setGameStatus('playing');
  }, [difficulty]);

  const getActiveQuestion = () => {
    if (currentLevel === 1) return vseprLevel1[currentQIndex];
    if (currentLevel === 2) return vseprLevel2[currentQIndex];
    if (currentLevel === 3) return vseprLevel3[currentQIndex];
    return null;
  };

  const checkLevel1 = () => {
    const q = getActiveQuestion() as Level1Question;
    const val = parseFloat(inputAngle || (q ? q.targetAngle.toString() : "109.5"));
    if (isNaN(val)) {
      alert("Please enter a valid number for the bond angle.");
      return;
    }

    const isCorrect = Math.abs(val - q.targetAngle) < 0.2;

    if (isCorrect) {
      setScores(s => ({ ...s, 1: s[1] + 1 }));
      setFeedback({
        isCorrect: true,
        message: "Target Completed!",
        explanation: q.explanation
      });
    } else {
      setFeedback({
        isCorrect: false,
        message: `Incorrect angle. Try again!`,
        explanation: q.explanation
      });
      setTimeout(() => {
        setFeedback(null);
      }, 2000);
    }
  };

  const handleSubmit = () => {
    if (currentLevel === 1) checkLevel1();
  };

  const handleNextQuestion = () => {
    const isLastQuestion = currentQIndex === 0;

    setCompletedLevels(prev => (prev.includes(currentLevel) ? prev : [...prev, currentLevel]));

    if (isLastQuestion) {
      if (currentLevel === 3) {
        setGameStatus('game-complete');
      } else {
        setGameStatus('level-complete');
      }
    } else {
      setCurrentQIndex(currentQIndex + 1);
      resetInputs();
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < 3) {
      const nextLevel = (currentLevel + 1) as 1 | 2 | 3;
      setCurrentLevel(nextLevel);
      setCurrentQIndex(0);
      setGameStatus('playing');
      resetInputs();
    }
  };

  const setLevelTab = (level: 1 | 2 | 3) => {
    setCurrentLevel(level);
    setCurrentQIndex(0);
    setGameStatus('playing');
    resetInputs();
  };

  const renderLevel1UI = () => {
    const q = getActiveQuestion() as Level1Question | null;
    if (!q) return null;
    return <Level1UI question={q} inputAngle={inputAngle} setInputAngle={setInputAngle} handleSubmit={handleSubmit} feedback={feedback} handleNextQuestion={handleNextQuestion} gameStarted={gameStarted} hideHtml={showExplanationModal} />;
  };

  const renderLevel2UI = () => {
    const q = getActiveQuestion() as Level2Question | null;
    if (!q) return null;
    return <Level2UI question={q} gameStarted={gameStarted} handleNextQuestion={() => {
      setScores(s => ({ ...s, 2: s[2] + 1 }));
      handleNextQuestion();
    }} />;
  };

  const renderLevel3UI = () => {
    return <Level3UI handleNextQuestion={handleNextQuestion} setLevelScore={(s: number) => setScores(prev => ({ ...prev, 3: s }))} gameStarted={gameStarted} />;
  };

  // Intro Target Overlay State
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [introStep, setIntroStep] = useState<'mission' | 'instructions'>('mission');
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const handleResetChallenge = () => {
    resetInputs();
    setCurrentQIndex(0);
    setGameStatus('playing');
    setIntroStep('mission');
    setScores({ 1: 0, 2: 0, 3: 0 });
  };

  return (
    <div className="vsepr-page-container w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl flex flex-col p-1.5 sm:p-4 gap-1 sm:gap-2.5">
      <style>{`
        @media (max-height: 450px) {
          .vsepr-page-container {
            padding: 4px 8px !important;
            gap: 3px !important;
          }
          .vsepr-header-btn {
            height: 28px !important;
            min-height: 28px !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            font-size: 11px !important;
          }
          .vsepr-top-bar {
            top: 4px !important;
            padding: 2px 8px !important;
            font-size: 11px !important;
          }
          .vsepr-bottom-dock {
            bottom: 4px !important;
            left: 4px !important;
            right: 4px !important;
            padding: 3px 8px !important;
            gap: 4px !important;
          }
          .vsepr-dock-btn {
            padding: 2px 7px !important;
            font-size: 10px !important;
          }
          .vsepr-dock-input {
            height: 26px !important;
            padding: 1px 6px !important;
            font-size: 11px !important;
          }
        }
      `}</style>
      {/* ── INTRO MISSION TARGET & INSTRUCTIONS OVERLAY VIEW (COVERS FULL PAGE CONTAINER WITH BLUR) ───── */}
      {!gameStarted && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-1 sm:px-3 sm:py-1.5 md:p-6 bg-white/40 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="vsepr-header-btn flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* STEP 1: MISSION TARGET OVERVIEW (WITH PREVIEW SCREENSHOT REMOVED & NEXT BUTTON) */}
          {introStep === 'mission' && (
            <div className="max-w-3xl mx-auto my-auto text-center space-y-2 sm:space-y-4 z-10 px-2 sm:px-4 py-2 w-full">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                VSEPR THEORY & MOLECULAR GEOMETRIES
              </div>

              <h1 className="text-lg sm:text-2xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
                <span className="text-[#2563EB]">MISSION:</span> {currentLevel === 1 ? 'Create Methane molecule Structure' : currentLevel === 2 ? 'Fill the target Holes & Unlock the Molecules properties' : 'Order Molecules by Decreasing Bond Angle'}
              </h1>

              {/* Next Button */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={() => {
                    setIntroStep('instructions');
                  }}
                  className="px-8 sm:px-10 py-2.5 sm:py-3 bg-gradient-to-r from-teal-800 to-cyan-900 hover:from-teal-700 hover:to-cyan-800 text-teal-200 hover:text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-full shadow-lg border border-teal-400/50 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INSTRUCTIONS TO PLAY (WITH BACK AND PLAY BUTTONS) */}
          {introStep === 'instructions' && (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-1 sm:space-y-2 z-10 px-2 sm:px-4 py-0.5 w-full animate-in fade-in duration-200">
              <div className="text-black text-base sm:text-lg md:text-xl font-black tracking-wide">
                Instructions
              </div>

              {/* Level 1: 3 Instruction Points */}
              {currentLevel === 1 && (
                <div className="space-y-1 sm:space-y-1.5 text-left max-w-xl mx-auto w-full">
                  {/* Point 1 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Tap the atoms (at the bottom) to create molecule
                      </p>
                    </div>
                    <div className="w-14 sm:w-20 md:w-24 h-7 sm:h-8 md:h-9 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/step1_tap_atoms.svg"
                        alt="Step 1: Tap atoms preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Tap two atoms and click bond type to create bonds.
                      </p>
                    </div>
                    <div className="w-14 sm:w-20 md:w-24 h-7 sm:h-8 md:h-9 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/step2_create_bonds.svg"
                        alt="Step 2: Create bonds preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1 sm:py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Tap on two bonds and enter the angle to align
                      </p>
                    </div>
                    <div className="w-14 sm:w-20 md:w-24 h-7 sm:h-8 md:h-9 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/step3_set_angle.svg"
                        alt="Step 3: Set angle preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Level 2: 2 Instruction Points */}
              {currentLevel === 2 && (
                <div className="space-y-1.5 sm:space-y-2 text-left max-w-xl mx-auto w-full">
                  {/* Point 1 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:py-2 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Tap on Hydrogen atoms (H) and Lone Pairs (LP) to their matching target holes.
                      </p>
                    </div>
                    <div className="w-16 sm:w-24 md:w-28 h-8 sm:h-10 md:h-11 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/l2_step1_drag_holes.svg"
                        alt="Step 1: Drag to holes preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:py-2 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Fill all target holes correctly to unlock the molecular geometry, bond angles, and properties.
                      </p>
                    </div>
                    <div className="w-16 sm:w-24 md:w-28 h-8 sm:h-10 md:h-11 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/l2_step2_unlock_properties.svg"
                        alt="Step 2: Unlock properties preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Level 3: 1 Instruction Point */}
              {currentLevel === 3 && (
                <div className="space-y-1.5 sm:space-y-2 text-left max-w-xl mx-auto w-full">
                  {/* Point 1 */}
                  <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 py-1.5 sm:py-2 shadow-sm border border-slate-200/90 flex items-center justify-between gap-2 sm:gap-2.5 transition-all hover:border-blue-300">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-[10px] sm:text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <p className="font-extrabold text-[11px] sm:text-xs text-[#1E293B] leading-tight">
                        Tap the molecules to place them in the correct slots in order of decreasing bond angle.
                      </p>
                    </div>
                    <div className="w-16 sm:w-24 md:w-28 h-8 sm:h-10 md:h-11 rounded-lg overflow-hidden border border-slate-200/90 bg-slate-50/80 shadow-inner shrink-0 flex items-center justify-center">
                      <img
                        src="/images/vsepr/l3_step1_order_molecules.svg"
                        alt="Step 1: Order molecules preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Back and Play */}
              <div className="pt-1 sm:pt-1.5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIntroStep('mission')}
                  className="px-5 sm:px-7 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>BACK</span>
                </button>

                <button
                  onClick={() => setGameStarted(true)}
                  className="px-7 sm:px-9 py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Footer Note (Only on mission step to preserve space) */}
          {introStep === 'mission' && (
            <div className="w-full text-center text-[10px] sm:text-xs text-[#64748B] font-mono z-10 shrink-0">
              Click NEXT to view challenge instructions
            </div>
          )}
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER ────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Top Left: Exit Simulation Button (Exact same margin, height, and alignment as Explanation button) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (onExit ? onExit() : exitSimulation())}
            className="vsepr-header-btn flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
            title="Exit Simulation"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
            <span>EXIT</span>
          </button>
        </div>

        {/* Top Center removed completely per user request */}

        {/* Action Controls Top Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanationModal(true)}
            className="vsepr-header-btn flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
            <span>Explanation</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSHOP CANVAS INTERFACE ─────────────────────────────────── */}
      <div className="flex-1 w-full min-h-0 flex flex-col relative">
        {gameStatus === 'playing' && currentLevel === 1 && renderLevel1UI()}
        {gameStatus === 'playing' && currentLevel === 2 && renderLevel2UI()}
        {gameStatus === 'playing' && currentLevel === 3 && renderLevel3UI()}

        {gameStatus === 'level-complete' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-6 sm:py-12 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-xl border-4 bg-emerald-50 text-emerald-600 border-emerald-200">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E293B] mb-1">
              🎉 Target Completed!
            </h2>
            <p className="text-slate-500 mb-5 sm:mb-6 text-xs sm:text-sm">
              Level {currentLevel} Complete! You have successfully predicted the bond angle and built the 3D geometry!
            </p>

            {/* Back to Topic / Replay - Next level / Medium challenge button removed per user request */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => exitSimulation()}
                className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105"
              >
                Back to Topics
              </button>
              <button
                onClick={handleResetChallenge}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full font-extrabold text-xs uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Replay Challenge
              </button>
            </div>
          </div>
        )}

        {gameStatus === 'game-complete' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-6 sm:py-12 animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 border-4 border-amber-200 flex items-center justify-center mb-3 sm:mb-4 shadow-xl">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] mb-2">Master Chemist!</h2>
            <p className="text-slate-500 mb-4 sm:mb-6 text-xs sm:text-sm">You have successfully completed all VSEPR Theory levels!</p>

            <button
              onClick={() => exitSimulation()}
              className="px-6 py-2.5 sm:px-8 sm:py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-full font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              Back to Topic
            </button>
          </div>
        )}
      </div>

      {/* ── THEORY / EXPLANATION MODAL (ENCLOSED BOX WITH BACKDROP AND PROPER MARGINS/PADDING) ── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 select-text">
          {/* Modal Container Box */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-[#1E293B] animate-in zoom-in-95 duration-200">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 bg-white shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm shrink-0">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-lg font-black text-[#1E293B] tracking-tight">
                    VSEPR Theory & Molecular Geometry Guide
                  </h2>
                  <p className="text-[11px] sm:text-xs text-[#64748B] font-medium hidden sm:block">
                    Valence Shell Electron Pair Repulsion: Principles, Geometries, Angles & Repulsions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#475569] hover:text-[#0F172A] transition-all cursor-pointer shadow-sm"
                title="Close Explanation"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-8 py-3.5 sm:py-5 space-y-4 sm:space-y-6 w-full text-slate-800">
              {/* Section 1: Core Principle */}
              <div className="space-y-2 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">1</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-blue-900 tracking-tight">
                    Core Principle of VSEPR Theory
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                  <strong>VSEPR</strong> stands for <strong>Valence Shell Electron Pair Repulsion</strong>. It is a fundamental model used in chemistry to predict the three-dimensional geometry of individual molecules based upon the extent of electron-pair electrostatic repulsion.
                </p>
                <div className="pl-8 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                    <h5 className="font-bold text-blue-800 mb-1">Electrostatic Minimization</h5>
                    <p className="text-slate-600 leading-normal">
                      Electrons have negative charges and naturally repel each other. They position themselves in space as far apart as possible to minimize potential energy and achieve the most stable geometric arrangement.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <h5 className="font-bold text-slate-800 mb-1">Electron Pairs Form Domains</h5>
                    <p className="text-slate-600 leading-normal">
                      Single bonds, double bonds, triple bonds, and unshared non-bonding lone pairs each count as a single <strong>electron domain</strong> around the central atom when determining the basic geometry.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Repulsion Hierarchy */}
              <div className="space-y-2 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center">2</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-purple-900 tracking-tight">
                    The Electron Repulsion Magnitude Hierarchy
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                  Not all electron pairs repel with equal force. Non-bonding lone pairs take up significantly more space than bonding pairs because they are attracted to only <strong>one</strong> atomic nucleus (the central atom), whereas bonding pairs are held tightly between <strong>two</strong> positive nuclei.
                </p>
                <div className="pl-8 pt-2">
                  <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <div>
                      <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">Repulsion Strength Order</span>
                      <span className="text-xs sm:text-sm font-black text-purple-950">
                        Lone Pair – Lone Pair &gt; Lone Pair – Bond Pair &gt; Bond Pair – Bond Pair
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-700 font-semibold bg-white/80 px-3 py-1.5 rounded-lg border border-purple-200 shrink-0">
                      LP–LP &gt; LP–BP &gt; BP–BP
                    </div>
                  </div>

                  {/* Example Comparison Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="font-extrabold text-[#1E293B] block text-sm">CH₄ (Methane)</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">4 Bond Pairs, 0 Lone Pairs</span>
                      <div className="mt-2 text-blue-600 font-mono font-black text-base">109.5°</div>
                      <span className="text-[11px] text-slate-500">Ideal Tetrahedral</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="font-extrabold text-[#1E293B] block text-sm">NH₃ (Ammonia)</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">3 Bond Pairs, 1 Lone Pair</span>
                      <div className="mt-2 text-purple-600 font-mono font-black text-base">107.0°</div>
                      <span className="text-[11px] text-slate-500">Compressed by ~2.5°</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="font-extrabold text-[#1E293B] block text-sm">H₂O (Water)</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">2 Bond Pairs, 2 Lone Pairs</span>
                      <div className="mt-2 text-rose-600 font-mono font-black text-base">104.5°</div>
                      <span className="text-[11px] text-slate-500">Compressed by ~5.0°</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Steric Number & Formula Notation */}
              <div className="space-y-2 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">3</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-emerald-900 tracking-tight">
                    Steric Number (SN) & Formula Notation (AXₘEₙ)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                  In VSEPR notation: <strong>A</strong> represents the central atom, <strong>X</strong> represents bonded atoms (ligands), and <strong>E</strong> represents non-bonding lone pairs on the central atom.
                </p>
                <div className="pl-8 pt-1 text-xs text-slate-700 space-y-1">
                  <p>• <strong>Steric Number (SN) = m + n</strong> (Total electron domains around the central atom).</p>
                  <p>• <strong>Electron Geometry</strong>: Spatial arrangement of ALL electron domains (both bonded atoms and lone pairs).</p>
                  <p>• <strong>Molecular Geometry</strong>: Actual observable spatial arrangement of ATOMS only (ignoring lone pairs in the final shape description).</p>
                </div>
              </div>

              {/* Section 4: Full Geometries Table */}
              <div className="space-y-3 border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center">4</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-amber-900 tracking-tight">
                    Comprehensive Molecular Geometries & Ideal Angles Reference
                  </h3>
                </div>
                <div className="pl-8 overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Steric No.</th>
                        <th className="p-2.5">Formula</th>
                        <th className="p-2.5">Bond Pairs</th>
                        <th className="p-2.5">Lone Pairs</th>
                        <th className="p-2.5">Molecular Geometry</th>
                        <th className="p-2.5">Ideal Bond Angle</th>
                        <th className="p-2.5">Real Examples</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">2</td>
                        <td className="p-2.5 font-mono font-bold">AX₂</td>
                        <td className="p-2.5">2</td>
                        <td className="p-2.5">0</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Linear</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">180°</td>
                        <td className="p-2.5 font-mono text-slate-600">CO₂, BeCl₂, HCN</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">3</td>
                        <td className="p-2.5 font-mono font-bold">AX₃</td>
                        <td className="p-2.5">3</td>
                        <td className="p-2.5">0</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Trigonal Planar</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">120°</td>
                        <td className="p-2.5 font-mono text-slate-600">BF₃, SO₃, AlCl₃</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">3</td>
                        <td className="p-2.5 font-mono font-bold">AX₂E</td>
                        <td className="p-2.5">2</td>
                        <td className="p-2.5">1</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Bent / Angular</td>
                        <td className="p-2.5 font-mono font-bold text-purple-600">&lt; 120° (~119°)</td>
                        <td className="p-2.5 font-mono text-slate-600">SO₂, O₃, NO₂⁻</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">4</td>
                        <td className="p-2.5 font-mono font-bold">AX₄</td>
                        <td className="p-2.5">4</td>
                        <td className="p-2.5">0</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Tetrahedral</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">109.5°</td>
                        <td className="p-2.5 font-mono text-slate-600">CH₄, CCl₄, SiH₄, NH₄⁺</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">4</td>
                        <td className="p-2.5 font-mono font-bold">AX₃E</td>
                        <td className="p-2.5">3</td>
                        <td className="p-2.5">1</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Trigonal Pyramidal</td>
                        <td className="p-2.5 font-mono font-bold text-purple-600">107.0°</td>
                        <td className="p-2.5 font-mono text-slate-600">NH₃, PCl₃, H₃O⁺</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">4</td>
                        <td className="p-2.5 font-mono font-bold">AX₂E₂</td>
                        <td className="p-2.5">2</td>
                        <td className="p-2.5">2</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Bent / V-Shaped</td>
                        <td className="p-2.5 font-mono font-bold text-rose-600">104.5°</td>
                        <td className="p-2.5 font-mono text-slate-600">H₂O, OF₂, SCl₂</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">5</td>
                        <td className="p-2.5 font-mono font-bold">AX₅</td>
                        <td className="p-2.5">5</td>
                        <td className="p-2.5">0</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Trigonal Bipyramidal</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">90° & 120°</td>
                        <td className="p-2.5 font-mono text-slate-600">PCl₅, PF₅</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">5</td>
                        <td className="p-2.5 font-mono font-bold">AX₄E</td>
                        <td className="p-2.5">4</td>
                        <td className="p-2.5">1</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Seesaw</td>
                        <td className="p-2.5 font-mono font-bold text-purple-600">&lt; 90° & &lt; 120°</td>
                        <td className="p-2.5 font-mono text-slate-600">SF₄, TeCl₄</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">6</td>
                        <td className="p-2.5 font-mono font-bold">AX₆</td>
                        <td className="p-2.5">6</td>
                        <td className="p-2.5">0</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Octahedral</td>
                        <td className="p-2.5 font-mono font-bold text-blue-600">90°</td>
                        <td className="p-2.5 font-mono text-slate-600">SF₆, [PCl₆]⁻</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-blue-600">6</td>
                        <td className="p-2.5 font-mono font-bold">AX₄E₂</td>
                        <td className="p-2.5">4</td>
                        <td className="p-2.5">2</td>
                        <td className="p-2.5 font-extrabold text-slate-800">Square Planar</td>
                        <td className="p-2.5 font-mono font-bold text-purple-600">90°</td>
                        <td className="p-2.5 font-mono text-slate-600">XeF₄, [ICl₄]⁻</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Step-by-Step Guide for the Easy Challenge */}
              <div className="space-y-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">5</span>
                  <h3 className="text-sm sm:text-base font-extrabold text-indigo-900 tracking-tight">
                    How to Complete the Level 1 Challenge Workshop
                  </h3>
                </div>
                <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-extrabold text-blue-600 block mb-1">Step 1: Place Central</span>
                    <p className="text-slate-600">Click or drag the central atom (e.g. Carbon <strong>C</strong>) onto the 3D pedestal.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-extrabold text-emerald-600 block mb-1">Step 2: Add Outer Atoms</span>
                    <p className="text-slate-600">Add all outer atoms (e.g. 4 Hydrogen <strong>H</strong> atoms) around the central core.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-extrabold text-purple-600 block mb-1">Step 3: Connect Bonds</span>
                    <p className="text-slate-600">Click single or double bonds to bridge each outer atom to the central atom.</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="font-extrabold text-amber-600 block mb-1">Step 4: Check Bond Angle</span>
                    <p className="text-slate-600">Select any atom pair, enter the ideal bond angle (e.g. 109.5° for CH₄), and click Check Angle!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Fixed Action Bar */}
            <div className="px-3.5 sm:px-6 py-2 sm:py-2.5 border-t border-slate-200 bg-slate-50/90 shrink-0 flex justify-center">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="w-full max-w-md bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-[0.99]"
              >
                Got It! Back to Workshop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
