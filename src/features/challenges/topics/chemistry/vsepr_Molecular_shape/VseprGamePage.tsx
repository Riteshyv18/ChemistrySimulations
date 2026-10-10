"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sphere, Cylinder, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import {
  Gamepad2, Trophy, BookOpen, Lock, Star, Target, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, RotateCcw, ZoomIn, Maximize2, X,
  Send, Move, Lightbulb, Package, Eye
} from 'lucide-react';
import { getAtomMaterial } from './materials';
import { getTetrahedralVertices, getTrigonalPlanarVertices } from './helpers';
import { vseprLevel1, vseprLevel2, vseprLevel3, type Level1Question, type Level2Question, type Level3Question } from './vsepr-questions';

const Atom3D = ({
  position,
  element,
  scale = 1,
  showLabel = true,
  labelOverride,
  gameStarted = true
}: {
  position: THREE.Vector3;
  element: string;
  scale?: number;
  showLabel?: boolean;
  labelColor?: string;
  labelOverride?: string;
  gameStarted?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const elemLower = element.toLowerCase();
  const isHydrogen = elemLower === 'hydrogen' || elemLower === 'h';
  const textContent = labelOverride || (elemLower === 'carbon' ? 'C' : elemLower === 'oxygen' ? 'O' : element.substring(0, 1).toUpperCase());

  return (
    <group position={position} scale={scale}>
      <Sphere ref={meshRef} args={[0.9, 32, 32]} material={getAtomMaterial(element)} />
      {showLabel && gameStarted && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className={`font-black select-none pointer-events-none drop-shadow-md ${isHydrogen
            ? 'text-slate-950 text-xs font-black'
            : 'text-white text-base font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
            }`}>
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
  isWrong = false
}: {
  v1: THREE.Vector3;
  v2: THREE.Vector3;
  label?: string;
  isCorrect?: boolean;
  isWrong?: boolean;
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

      <Html position={midPoint} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className={badgeStyle}>
          {label || '109.5°'}
        </div>
      </Html>
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
    new THREE.Vector3(-1.8, -1.2, 0.4),
    new THREE.Vector3(1.8, -1.2, -0.4),
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
}

function Level1UI({
  question,
  inputAngle,
  setInputAngle,
  handleSubmit,
  feedback,
  handleNextQuestion,
  gameStarted = true
}: Level1UIProps) {
  const [centralPlaced, setCentralPlaced] = useState(false);
  const [placedAtoms, setPlacedAtoms] = useState<THREE.Vector3[]>([]);
  const [placedBonds, setPlacedBonds] = useState<{ index: number; type: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragItem, setActiveDragItem] = useState<string | null>(null);
  const [selectedBond1, setSelectedBond1] = useState<number>(-1);
  const [selectedBond2, setSelectedBond2] = useState<number>(-1);

  const formula = question.formula;
  const centralElement = getCentralAtom(formula);
  const outerElement = getOuterAtom(formula);
  const outerCount = getOuterAtomCount(formula);
  const idealVertices = useMemo(() => getTargetGeometry(formula), [formula]);

  const resetBuild = () => {
    setCentralPlaced(false);
    setPlacedAtoms([]);
    setPlacedBonds([]);
    setSelectedBond1(-1);
    setSelectedBond2(-1);
    setInputAngle("");
    setActiveDragItem(null);
  };

  const placeItem = (itemType: string) => {
    if (itemType === 'central') {
      setCentralPlaced(true);
    } else if (itemType === 'outer') {
      if (!centralPlaced) {
        alert("Place the central atom first!");
        return;
      }
      setPlacedAtoms(prev => {
        if (prev.length < idealVertices.length) {
          return [...prev, idealVertices[prev.length]];
        }
        return prev;
      });
    } else if (itemType.startsWith('bond-')) {
      const type = itemType.split('-')[1] || 'single';
      if (!centralPlaced || placedAtoms.length === 0) {
        alert("Place atoms before adding bonds!");
        return;
      }
      if (placedBonds.length < placedAtoms.length) {
        setPlacedBonds(prev => [...prev, { index: prev.length, type }]);
      }
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
  const hasInputAngle = !isNaN(parsedAngle) && inputAngle.trim() !== "";
  const isCorrectAngle = feedback
    ? feedback.isCorrect
    : (hasInputAngle && Math.abs(parsedAngle - targetAngle) < 0.01);
  const isWrongAngle = feedback
    ? !feedback.isCorrect
    : (hasInputAngle && !isCorrectAngle);

  return (
    <div className="flex flex-col gap-3 w-full h-full flex-1 min-h-0 text-sm">
      {/* ── MAIN 3D CANVAS AREA (SINGLE CANVAS WORKSHOP) ───────────────────── */}
      <div
        className="flex-1 w-full relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-inner flex flex-col justify-between min-h-[360px]"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Floating Top Info Bar inside canvas */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-3 pointer-events-auto shrink-0">
            <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wide">Target:</span>
            <span className="text-xs font-extrabold text-[#1E293B]">{question.formula} ({question.molecule})</span>
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Shape: <strong className="text-slate-800">{question.targetShape || 'Tetrahedral'}</strong></span>
            <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">Ideal Angle: <strong className="text-blue-600">{targetAngle}°</strong></span>
          </div>

          {/* Reset Control Floating Top Right */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={resetBuild}
              className="px-3 py-1.5 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
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

        {/* 3D Canvas */}
        <div className="w-full h-full flex-1 relative">
          <Canvas camera={{ position: [0, 0, 10.5], fov: 45 }} className="w-full h-full">
            <ambientLight intensity={1.1} />
            <directionalLight position={[10, 10, 10]} intensity={1.4} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            <pointLight position={[0, 0, 4]} intensity={0.6} color="#3b82f6" />
            <OrbitControls makeDefault enableZoom={true} target={[0, -0.3, 0]} />

            {/* Round Pedestal 3D Base (Positioned lower to leave spacious clearance) */}
            <group position={[0, -2.1, 0]}>
              <Cylinder args={[2.5, 2.8, 0.35, 64]}>
                <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
              </Cylinder>
              <Cylinder args={[2.3, 2.5, 0.08, 64]} position={[0, 0.18, 0]}>
                <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.2} />
              </Cylinder>
            </group>

            {/* Floating 3D Molecule Group (Elevated with clear air gap above pedestal) */}
            <group position={[0, 0.8, 0]}>
              {/* Central Atom */}
              {centralPlaced && (
                <Atom3D position={new THREE.Vector3(0, 0, 0)} element={centralElement} scale={0.95} labelOverride={centralElement[0].toUpperCase()} gameStarted={gameStarted} />
              )}

              {/* Outer Atoms & Bonds */}
              {placedAtoms.map((pos, idx) => {
                const bond = placedBonds.find((b) => b.index === idx);
                const atomLabel = `${outerElement[0].toUpperCase()}${idx + 1}`;
                return (
                  <React.Fragment key={idx}>
                    <Atom3D position={pos} element={outerElement} scale={0.68} labelOverride={atomLabel} gameStarted={gameStarted} />
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

              {/* Angle Arc 3D */}
              {selectedBond1 >= 0 &&
                selectedBond2 >= 0 &&
                selectedBond1 !== selectedBond2 &&
                selectedBond1 < placedAtoms.length &&
                selectedBond2 < placedAtoms.length && (
                  <AngleArc3D
                    v1={placedAtoms[selectedBond1]}
                    v2={placedAtoms[selectedBond2]}
                    label={inputAngle ? `${inputAngle}°` : `${targetAngle}°`}
                    isCorrect={isCorrectAngle}
                    isWrong={isWrongAngle}
                  />
                )}
            </group>
          </Canvas>
        </div>

        {/* ── FLOATING BOTTOM INSTRUCTION DOCK / TOOLBAR ───────────────────── */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg">
          {/* Atom & Bond Tools Tray */}
          <div className="flex items-center gap-2">
            {/* Central Atom Tool */}
            {!centralPlaced ? (
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'central')}
                onDragEnd={handleDragEnd}
                onClick={() => placeItem('central')}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 font-extrabold text-xs flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">{centralElement[0].toUpperCase()}</span>
                <span>+ Central Atom</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Central Placed</span>
              </div>
            )}

            {/* Outer Atom Tool */}
            {availableAtoms > 0 ? (
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'outer')}
                onDragEnd={handleDragEnd}
                onClick={() => placeItem('outer')}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5 cursor-grab active:cursor-grabbing transition-all shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">{outerElement[0].toUpperCase()}</span>
                <span>+ Outer Atom ({availableAtoms})</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs flex items-center gap-1.5 opacity-60 cursor-not-allowed">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                <span>Atoms Placed</span>
              </div>
            )}

            {/* Bond Tools */}
            <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'bond-single')}
                onDragEnd={handleDragEnd}
                onClick={() => placeItem('bond-single')}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-grab"
              >
                <div className="w-3.5 h-1 bg-blue-500 rounded-full" />
                <span>Single Bond</span>
              </button>
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, 'bond-double')}
                onDragEnd={handleDragEnd}
                onClick={() => placeItem('bond-double')}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-grab"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="w-3.5 h-0.5 bg-purple-500 rounded-full" />
                  <div className="w-3.5 h-0.5 bg-purple-500 rounded-full" />
                </div>
                <span>Double Bond</span>
              </button>
            </div>
          </div>

          {/* Angle Selection & Verification Controls */}
          <div className="flex items-center gap-2">
            {/* Bond Pair Selectors */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500">Pair:</span>
              <select
                value={selectedBond1}
                onChange={(e) => setSelectedBond1(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-[#1E293B] focus:outline-none"
              >
                <option value="-1">Atom A</option>
                {placedAtoms.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {outerElement[0].toUpperCase()}{idx + 1}
                  </option>
                ))}
              </select>
              <span className="text-slate-300">-</span>
              <select
                value={selectedBond2}
                onChange={(e) => setSelectedBond2(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs font-bold text-[#1E293B] focus:outline-none"
              >
                <option value="-1">Atom B</option>
                {placedAtoms.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {outerElement[0].toUpperCase()}{idx + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Angle */}
            <input
              type="number"
              placeholder="Angle (°)"
              value={inputAngle}
              onChange={(e) => setInputAngle(e.target.value)}
              disabled={feedback !== null || !isBuildComplete}
              className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-center text-[#1E293B] bg-white focus:outline-none focus:border-blue-500 shadow-inner"
            />

            {/* Submit / Next Button */}
            {!feedback ? (
              <button
                onClick={handleSubmit}
                disabled={!isBuildComplete}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer"
              >
                Check Angle
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
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

  const getInstructionsText = () => {
    const elemSymbol = outerElement[0].toUpperCase();
    const bondNames = Array.from({ length: numBonds }, (_, i) => `${elemSymbol}${i + 1}`).join(', ');
    const lpNames = Array.from({ length: numLonePairs }, (_, i) => `LP${i + 1}`).join(', ');

    if (numBonds > 0 && numLonePairs > 0) {
      return (
        <>
          Drag <strong className="text-cyan-600 font-extrabold">{bondNames}</strong> & <strong className="text-purple-600 font-extrabold">{lpNames}</strong> to target slots.
        </>
      );
    } else if (numLonePairs > 0) {
      return (
        <>
          Drag <strong className="text-purple-600 font-extrabold">{lpNames}</strong> to target slots.
        </>
      );
    } else {
      return (
        <>
          Drag <strong className="text-cyan-600 font-extrabold">{bondNames}</strong> to target slots.
        </>
      );
    }
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
            <OrbitControls makeDefault enablePan={false} enableZoom={true} target={[0, 0, 0]} />

            {/* Round Pedestal 3D Base */}
            <group position={[0, -2.1, 0]}>
              <Cylinder args={[2.5, 2.8, 0.35, 64]}>
                <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
              </Cylinder>
              <Cylinder args={[2.3, 2.5, 0.08, 64]} position={[0, 0.18, 0]}>
                <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.2} />
              </Cylinder>
            </group>

            {/* Elevated 3D Molecule & Target Slots Group (Spacious clearance, no top clipping) */}
            <group position={[0, 0.35, 0]}>
              {/* Target slot hole rings & labels */}
              {idealVertices.map((v, i) => {
                const isLoneSlot = i >= numBonds;
                const slotLabel = isLoneSlot
                  ? `LP${i - numBonds + 1} Hole`
                  : `${outerElement[0].toUpperCase()}${i + 1} Hole`;
                return (
                  <group key={`slot-ring-${i}`} position={v}>
                    <mesh>
                      <ringGeometry args={[0.7, 0.85, 32]} />
                      <meshBasicMaterial
                        color={isSnapped[i] ? "#22c55e" : isLoneSlot ? "#a855f7" : "#0284c7"}
                        transparent
                        opacity={0.45}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                    {gameStarted && (
                      <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-black select-none whitespace-nowrap shadow-md border ${isSnapped[i]
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : isLoneSlot
                            ? 'bg-purple-900/90 text-purple-200 border-purple-400/60'
                            : 'bg-blue-900/90 text-blue-200 border-blue-400/60'
                          }`}>
                          {slotLabel}
                        </div>
                      </Html>
                    )}
                  </group>
                );
              })}

              {/* Central Atom */}
              <Atom3D position={new THREE.Vector3(0, 0, 0)} element={centralElement} scale={1.2} gameStarted={gameStarted} />

              {/* Draggable Outer Atoms & Lone Pairs */}
              {positions.map((pos, idx) => {
                const isLone = idx >= numBonds;
                const pairLabel = isLone
                  ? `LP${idx - numBonds + 1}`
                  : `${outerElement[0].toUpperCase()}${idx + 1}`;
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

      {/* ── COMPLETED SUCCESS CARD OVERLAY ───────────────────────────────── */}
      {completed && (
        <div className="absolute top-4 right-4 z-20 max-w-xs w-full bg-white/95 backdrop-blur-md border border-emerald-200 p-4 rounded-2xl shadow-xl animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Geometry Unlocked!</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Shape</div>
              <div className="text-xs font-black text-slate-800">{question.targetShape}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Lone Pairs</div>
              <div className="text-xs font-black text-blue-600">{question.targetLonePairs}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-center col-span-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Bond Angle</div>
              <div className="text-sm font-black text-purple-700">{l2_getTargetAngle(formula)}°</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 mb-3 leading-relaxed bg-blue-50/50 p-2 rounded-xl border border-blue-100">
            {question.explanation}
          </p>

          <button
            onClick={handleNextQuestion}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── FLOATING BOTTOM INSTRUCTION DOCK / TOOLBAR (CENTERED & SINGLE LINE) ───────────────────── */}
      {gameStarted && !completed && (
        <div className="absolute bottom-1 sm:bottom-3 inset-x-0 z-30 flex items-center justify-center pointer-events-none px-2">
          <div className="pointer-events-auto flex flex-nowrap items-center justify-between gap-1.5 sm:gap-4 p-1.5 px-2 sm:p-2.5 sm:px-4 bg-white/98 backdrop-blur-xl border-2 border-slate-200/90 rounded-2xl shadow-2xl max-w-[92vw] w-max whitespace-nowrap text-slate-800 vsepr-bottom-dock">
            {/* Instruction Badge & Text */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-xl bg-blue-100 border border-blue-300 text-blue-600 flex items-center justify-center font-black text-[10px] sm:text-sm shrink-0 shadow-sm">
                ⚡
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-600 truncate">
                  {question.molecule} ({formula})
                </span>
                <span className="text-[9px] sm:text-xs font-extrabold text-slate-800 drop-shadow-none">
                  {getInstructionsText()}
                </span>
              </div>
            </div>

            {/* Control Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={resetBuild}
                className="px-2 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-extrabold text-[9px] sm:text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-700" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleAutoSolve}
                className="px-2.5 py-1 sm:px-4 sm:py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-[9px] sm:text-xs uppercase tracking-wider rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95"
              >
                <span>⚡ Auto-Arrange</span>
              </button>
            </div>
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
      <svg viewBox="0 0 160 120" className="w-full h-14 sm:h-20 md:h-24 drop-shadow-md shrink vsepr-svg-preview">
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
      <svg viewBox="0 0 160 120" className="w-full h-14 sm:h-20 md:h-24 drop-shadow-md shrink vsepr-svg-preview">
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
      <svg viewBox="0 0 160 120" className="w-full h-14 sm:h-20 md:h-24 drop-shadow-md shrink vsepr-svg-preview">
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
      <svg viewBox="0 0 160 120" className="w-full h-14 sm:h-20 md:h-24 drop-shadow-md shrink vsepr-svg-preview">
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
        @media (max-height: 720px) {
          .vsepr-slot-card {
            height: 5.75rem !important;
            padding: 0.25rem !important;
          }
          .vsepr-drag-card {
            height: 4.85rem !important;
            padding: 0.25rem !important;
          }
          .vsepr-svg-preview {
            height: 2.1rem !important;
          }
          .vsepr-top-row {
            margin-bottom: 0.15rem !important;
          }
          .vsepr-bottom-row {
            margin-bottom: 3.5rem !important;
          }
          .vsepr-bottom-dock {
            padding: 0.2rem 0.5rem !important;
            max-width: 96vw !important;
            width: max-content !important;
            flex-wrap: nowrap !important;
            white-space: nowrap !important;
          }
        }
        @media (max-height: 580px) {
          .vsepr-slot-card {
            height: 4.75rem !important;
          }
          .vsepr-drag-card {
            height: 4.1rem !important;
          }
          .vsepr-svg-preview {
            height: 1.75rem !important;
          }
          .vsepr-bottom-row {
            margin-bottom: 3rem !important;
          }
          .vsepr-bottom-dock {
            padding: 0.15rem 0.4rem !important;
            max-width: 96vw !important;
            width: max-content !important;
            flex-wrap: nowrap !important;
            white-space: nowrap !important;
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
      <div className={`relative z-10 w-full h-full flex flex-col items-center justify-start p-3 sm:p-5 overflow-hidden min-h-0 transition-all duration-500 ${!gameStarted ? 'filter blur-[5px] opacity-70 pointer-events-none select-none' : 'pointer-events-auto opacity-100'
        }`}>

        <div className="w-full max-w-5xl mx-auto flex flex-col justify-between my-auto py-1 sm:py-3 md:py-4 h-full min-h-0">
          {/* Top Drop Slot Cards Row */}
          <div className="w-full z-10 mb-2 sm:mb-4 md:mb-6 vsepr-top-row">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 relative">
              {slots.map((formula, idx) => {
                const mol = formula ? LEVEL3_MOLECULES[formula] : null;
                const isSlotCorrect = submitted && formula === CORRECT_DECREASING_ORDER[idx];

                return (
                  <div key={idx} className="relative flex flex-col items-center">
                    {/* Number Badge above slot */}
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full font-black text-[11px] sm:text-xs flex items-center justify-center mb-1 z-10 ${slotBadgeStyles[idx]}`}>
                      {idx + 1}
                    </div>

                    {/* Slot Box Container */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnSlot(e, idx)}
                      onClick={() => handleSlotClick(idx)}
                      className={`w-full h-28 sm:h-36 md:h-40 rounded-2xl transition-all duration-300 flex flex-col items-center justify-between p-1.5 sm:p-2.5 relative vsepr-slot-card ${!formula
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
                          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500 mb-1 sm:mb-2 shadow-inner">
                            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-60" />
                          </div>
                          <span className="text-slate-600 text-[11px] sm:text-xs font-bold">Drop molecule here</span>
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
                            <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 opacity-60" />
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

          {/* Bottom Molecule Tray (Drag from here) - Compact landscape spacing */}
          <div className="w-full z-10 mb-14 sm:mb-16 md:mb-20 vsepr-bottom-row">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 bg-white/90 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-xl border border-slate-200 shadow-sm max-w-max">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-100 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <h4 className="text-slate-800 font-black text-[11px] sm:text-xs">Drag from here</h4>
              <span className="text-slate-500 text-[10px] sm:text-[11px] font-semibold">— Drag molecules into the slots above</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {['CH₄', 'NH₃', 'H₂O', 'BF₃'].map((f) => {
                const mol = LEVEL3_MOLECULES[f];
                const isAvailable = available.includes(f);

                return (
                  <div
                    key={f}
                    draggable={isAvailable && !submitted}
                    onDragStart={(e) => isAvailable && handleDragStart(e, f)}
                    onClick={() => isAvailable && handleCardClick(f)}
                    className={`rounded-2xl p-1.5 sm:p-3 transition-all duration-300 border-2 flex flex-col items-center justify-between h-24 sm:h-32 md:h-36 relative vsepr-drag-card ${isAvailable && !submitted
                        ? `${mol.cardBg} ${mol.borderColor} ${mol.glowColor} cursor-grab active:cursor-grabbing hover:scale-[1.03] shadow-md`
                        : 'bg-slate-100/60 border-slate-200 opacity-35 cursor-not-allowed grayscale'
                      }`}
                  >
                    <div className="w-full flex items-center justify-between px-0.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold ${mol.badgeBg}`}>
                        {mol.formula}
                      </span>
                      <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 opacity-60" />
                    </div>

                    <MoleculeSvgPreview formula={f} />

                    <div className="text-center mt-0.5">
                      <div className={`font-black text-xs sm:text-sm ${mol.textColor}`}>{mol.formula}</div>
                      <div className={`text-[10px] sm:text-[11px] font-bold ${mol.subTextColor}`}>({mol.name})</div>
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

      {/* ── FLOATING BOTTOM INSTRUCTION DOCK / TOOLBAR (CENTERED, BIGGER & BOLDER) ───── */}
      {!submitted && gameStarted && (
        <div className="absolute bottom-1 sm:bottom-3 inset-x-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-nowrap items-center justify-between gap-2 sm:gap-4 p-1.5 px-2.5 sm:p-3 bg-white/98 backdrop-blur-xl border-2 border-slate-200/90 rounded-2xl shadow-2xl max-w-[96vw] w-max whitespace-nowrap text-slate-800 vsepr-bottom-dock">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-xl bg-blue-100 border border-blue-300 text-blue-600 flex items-center justify-center font-black text-xs sm:text-base shrink-0 shadow-sm">
                ⚡
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-blue-600">TASK: DECREASING BOND ANGLE</span>
                <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-slate-800 drop-shadow-none">
                  Order molecules from largest (120°) to smallest (104.5°)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={resetAll}
                className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-800 font-extrabold text-[10px] sm:text-sm flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 text-slate-700" />
                <span>Reset</span>
              </button>

              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!allFilled}
                  className="px-3 py-1 sm:px-6 sm:py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-black text-[10px] sm:text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Submit Order</span>
                </button>
              ) : isCorrect ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-3 py-1 sm:px-6 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] sm:text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1 sm:gap-2 cursor-pointer animate-bounce active:scale-95"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <button
                  onClick={resetAll}
                  className="px-3 py-1 sm:px-6 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] sm:text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1 sm:gap-2 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VseprGamePage({
  difficulty = "easy"
}: {
  difficulty?: string;
}) {
  const router = useRouter();

  const getLevelFromDifficulty = (diff: string): 1 | 2 | 3 => {
    const d = (diff || "").toLowerCase();
    if (d === "medium") return 2;
    if (d === "advanced" || d === "hard") return 3;
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
    const val = parseFloat(inputAngle);
    if (isNaN(val)) {
      alert("Please enter a valid number for the bond angle.");
      return;
    }

    const isCorrect = Math.abs(val - q.targetAngle) < 0.01;

    if (isCorrect) {
      setScores(s => ({ ...s, 1: s[1] + 1 }));
    }

    setFeedback({
      isCorrect,
      message: isCorrect ? "Correct!" : `Incorrect. The correct angle is ${q.targetAngle}°.`,
      explanation: q.explanation
    });
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
    return <Level1UI question={q} inputAngle={inputAngle} setInputAngle={setInputAngle} handleSubmit={handleSubmit} feedback={feedback} handleNextQuestion={handleNextQuestion} gameStarted={gameStarted} />;
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
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleResetChallenge = () => {
    resetInputs();
    setCurrentQIndex(0);
    setGameStatus('playing');
    setScores({ 1: 0, 2: 0, 3: 0 });
  };

  return (
    <div className="w-full h-full min-h-0 bg-[#F8FAFC] text-[#1E293B] relative overflow-hidden select-none font-sans rounded-3xl border border-slate-200 shadow-xl flex flex-col p-3.5 sm:p-4 gap-2.5">
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
              VSEPR THEORY & MOLECULAR GEOMETRIES
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-extrabold text-[#1E293B] tracking-tight leading-tight drop-shadow-sm">
              <span className="text-[#2563EB]">TARGET:</span> {currentLevel === 1 ? 'Predict Bond Angles & Build 3D Geometries' : currentLevel === 2 ? 'Fill Target Holes & Predict Lone Pair Repulsions' : 'Order Molecules by Decreasing Bond Angle'}
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
            Click Start Mission to launch the single canvas VSEPR workshop
          </div>
        </div>
      )}

      {/* ── TOP TOOLBAR HEADER ────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Top Left: Back Button & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="h-10 px-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 text-[#1E293B] font-extrabold text-xs transition-all shadow-md backdrop-blur-md cursor-pointer"
            title="Back to Topics"
          >
            <ChevronLeft className="w-5 h-5 text-[#2563EB]" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-center text-[#1E293B] transition-all shadow-md backdrop-blur-md cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>



        {/* Action Controls Top Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
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
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-xl border-4 bg-emerald-50 text-emerald-600 border-emerald-200">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1E293B] mb-1">
              🎉 Easy Level Complete!
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              You have successfully predicted the bond angles and built the 3D geometries!
            </p>

            <button
              onClick={handleNextLevel}
              className="px-8 py-3 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105"
            >
              Proceed to Medium Level
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {gameStatus === 'game-complete' && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-12 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 border-4 border-amber-200 flex items-center justify-center mb-4 shadow-xl">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#1E293B] mb-2">Master Chemist!</h2>
            <p className="text-slate-500 mb-6 text-sm">You have successfully completed all VSEPR Theory levels!</p>

            <button
              onClick={() => router.back()}
              className="px-8 py-3 bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-full font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
            >
              Back to Topic
            </button>
          </div>
        )}
      </div>

      {/* ── THEORY / EXPLANATION MODAL ─────────────────────────────────────── */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-center animate-in fade-in zoom-in-95 my-auto text-[#1E293B]">
            <button
              onClick={() => setShowExplanationModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-[#64748B] hover:text-[#1E293B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mx-auto mb-3 shadow-sm">
              <BookOpen className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-extrabold text-[#1E293B] tracking-tight mb-1">
              VSEPR Theory Explanation
            </h2>
            <p className="text-xs text-[#64748B] font-medium mb-4">
              Valence Shell Electron Pair Repulsion Theory & Geometries
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-3 mb-5 text-xs text-slate-700">
              <div>
                <h4 className="font-extrabold text-blue-700 mb-1">1. Bond Angle Rules</h4>
                <p className="leading-relaxed">Electron pairs in the valence shell repel each other and take positions as far apart as possible to minimize repulsion.</p>
              </div>
              <div>
                <h4 className="font-extrabold text-purple-700 mb-1">2. Lone Pair Repulsion</h4>
                <p className="leading-relaxed">Lone pairs exert greater repulsion than bonding pairs: <br /><strong>Lone Pair - Lone Pair &gt; Lone Pair - Bond Pair &gt; Bond Pair - Bond Pair</strong>.</p>
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-700 mb-1">3. Common Geometries</h4>
                <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                  <li>AX₂ (Linear): 180°</li>
                  <li>AX₃ (Trigonal Planar): 120°</li>
                  <li>AX₄ (Tetrahedral): 109.5° (e.g. CH₄)</li>
                  <li>AX₃E (Trigonal Pyramidal): 107° (e.g. NH₃)</li>
                  <li>AX₂E₂ (Bent): 104.5° (e.g. H₂O)</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowExplanationModal(false)}
              className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Got It! Back to Workshop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
