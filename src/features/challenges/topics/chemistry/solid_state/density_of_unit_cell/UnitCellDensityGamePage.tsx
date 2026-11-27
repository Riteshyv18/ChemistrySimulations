"use client";

import React, { useState, useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BookOpen,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  X,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import UnitCellDensity3D, { DensityCellType } from "./UnitCellDensity3D";

const AVOGADRO = 6.022e23;

interface DensityLevel {
  level: number;
  unknownName: string;
  revealedMetal: string;
  symbol: string;
  cellType: DensityCellType;
  z: number;
  molarMass: number; // g/mol
  edgeLengthPm: number; // pm
  expectedDensity: number; // g/cm^3
}

const DENSITY_LEVELS: DensityLevel[] = [
  {
    level: 1,
    unknownName: "Unknown Metal 1",
    revealedMetal: "Iron",
    symbol: "Fe",
    cellType: "BCC",
    z: 2,
    molarMass: 56.0,
    edgeLengthPm: 287,
    expectedDensity: 7.86,
  },
  {
    level: 2,
    unknownName: "Unknown Metal 2",
    revealedMetal: "Copper",
    symbol: "Cu",
    cellType: "FCC",
    z: 4,
    molarMass: 63.5,
    edgeLengthPm: 361,
    expectedDensity: 8.97,
  },
];

function computeDensity(z: number, molarMass: number, edgeLengthPm: number): number {
  const aCm = edgeLengthPm * 1e-10;
  return (z * molarMass) / (AVOGADRO * Math.pow(aCm, 3));
}

interface UnitCellDensityGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function UnitCellDensityGamePage({
  onExit,
}: UnitCellDensityGamePageProps) {
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  const [levelIndex, setLevelIndex] = useState(0);
  const currentLevel = DENSITY_LEVELS[levelIndex];

  // Student controls: Unit Cell dropdown (BCC/FCC) + 3 steppers (Z, M, a) starting close to target
  const [selectedCellType, setSelectedCellType] = useState<DensityCellType>("FCC");
  const [showCellDropdown, setShowCellDropdown] = useState(false);
  const [hasAdjustedValues, setHasAdjustedValues] = useState(false);
  const [zValue, setZValue] = useState<number>(1);
  const [molarMass, setMolarMass] = useState<number>(54.5);
  const [edgeLengthPm, setEdgeLengthPm] = useState<number>(284);
  const [isDraggingOrbit, setIsDraggingOrbit] = useState(false);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [showFinalCompletionModal, setShowFinalCompletionModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState("");

  const liveDensity = useMemo(
    () => computeDensity(zValue, molarMass, edgeLengthPm),
    [zValue, molarMass, edgeLengthPm]
  );

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const resetInputsForLevel = (nextIndex: number) => {
    setShowCellDropdown(false);
    setHasAdjustedValues(false);
    if (nextIndex === 0) {
      setSelectedCellType("FCC");
      setZValue(1);
      setMolarMass(54.5);
      setEdgeLengthPm(284);
    } else {
      setSelectedCellType("BCC");
      setZValue(2);
      setMolarMass(62.0);
      setEdgeLengthPm(358);
    }
  };

  const handleSubmit = () => {
    if (selectedCellType !== currentLevel.cellType) {
      setFailFeedback(
        `Inspect the 3D crystal carefully and select the right Unit Cell (BCC or FCC) from the dropdown.`
      );
      setShowFailModal(true);
      return;
    }

    if (zValue !== currentLevel.z) {
      setFailFeedback(
        `Target is ${currentLevel.cellType}. Use + / - to set the right number of atoms per unit cell (Z).`
      );
      setShowFailModal(true);
      return;
    }

    if (Math.abs(molarMass - currentLevel.molarMass) > 0.05) {
      setFailFeedback(
        `Use + / - to set Molar Mass (M) to ${currentLevel.molarMass.toFixed(1)} g/mol.`
      );
      setShowFailModal(true);
      return;
    }

    if (edgeLengthPm !== currentLevel.edgeLengthPm) {
      setFailFeedback(
        `Use + / - to set Edge Length (a) to ${currentLevel.edgeLengthPm} pm.`
      );
      setShowFailModal(true);
      return;
    }

    setShowSuccessModal(true);
  };

  const handleNextLevel = () => {
    setShowSuccessModal(false);
    if (levelIndex + 1 < DENSITY_LEVELS.length) {
      const nextIdx = levelIndex + 1;
      setLevelIndex(nextIdx);
      resetInputsForLevel(nextIdx);
    } else {
      setShowFinalCompletionModal(true);
    }
  };

  const handleReplayChallenge = () => {
    setShowFinalCompletionModal(false);
    setLevelIndex(0);
    resetInputsForLevel(0);
    setScreen("lab");
  };

  return (
    <div className="w-full h-full min-h-[100dvh] bg-white text-slate-900 relative overflow-hidden select-none font-sans rounded-3xl sm:rounded-[32px]">
      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 1: MISSION STATEMENT (WHITE BACKGROUND)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
          <div className="w-full flex items-center justify-start z-10 shrink-0 pt-2 sm:pt-2.5">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-md w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-5 space-y-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug text-center">
              <span className="text-blue-600 font-black uppercase">MISSION:</span>{" "}
              Identify the unknown crystal and calculate its density to unlock the target!
            </h1>

            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreen("instructions")}
                className="w-32 sm:w-36 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 2: INSTRUCTIONS SCREEN (PORTRAIT VERTICAL STACK)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden rounded-3xl sm:rounded-[32px]">
          <div className="w-full flex items-center justify-start z-10 shrink-0 pt-2 sm:pt-2.5">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="w-full max-w-sm mx-auto flex flex-col justify-center items-center z-10 px-1 flex-1 my-auto space-y-2.5 py-1.5">
            <div className="mb-4 sm:mb-6 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white bg-slate-900 px-5 py-1.5 rounded-full shadow-sm">
              INSTRUCTIONS TO PLAY
            </div>

            {/* Card 1 */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                  1
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                  Check the Target
                </h3>
              </div>
              <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-1.5">
                Look at the top <strong>Target</strong> to see which metal you need to unlock.
              </p>
              <div className="w-full h-12 sm:h-14 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1">
                <img
                  src="/instructions/density_step1_target.png"
                  alt="Target Metal and Unit Cell"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                  2
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                  Inspect the 3D Crystal
                </h3>
              </div>
              <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-1.5">
                Rotate the 3D crystal to count atoms and check the edge length (<strong>a</strong>) of the unit cell.
              </p>
              <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1">
                <img
                  src="/instructions/density_step2_crystal.png"
                  alt="3D Crystal Unit Cell"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="w-full bg-white rounded-2xl p-2.5 sm:p-3 shadow-sm border border-sky-200/80 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm">
                  3
                </div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                  Set Values &amp; Submit
                </h3>
              </div>
              <p className="text-slate-600 font-medium text-[10.5px] leading-snug mb-1.5">
                Use <strong>&minus;</strong> and <strong>+</strong> to set <strong>Z</strong>, <strong>Mass</strong>, and <strong>Edge</strong>, pick <strong>BCC</strong> or <strong>FCC</strong>, then tap <strong>SUBMIT</strong>!
              </p>
              <div className="w-full h-16 sm:h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/80 flex items-center justify-center shadow-inner p-1">
                <img
                  src="/instructions/density_step3_controls.png"
                  alt="Density Gauge, Steppers and Submit"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-center gap-4 max-w-sm mx-auto pt-2 pb-1 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreen("mission")}
              className="w-28 sm:w-32 flex items-center justify-center gap-1.5 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen("lab")}
              className="w-28 sm:w-32 flex items-center justify-center gap-1.5 py-2 rounded-full font-mono font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN 3: 3D LAB SCREEN (SINGLE FULLSCREEN CANVAS + FLOATING UI)
          ══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full relative overflow-hidden bg-white rounded-3xl sm:rounded-[32px]">
          {/* ── Single Fullscreen 3D Canvas ── */}
          <div className="absolute inset-0 z-0">
            <Canvas gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[3.2, 2.45, 6.4]} fov={38} />
              <ambientLight intensity={0.85} />
              <directionalLight position={[6, 8, 5]} intensity={1.2} />
              <directionalLight position={[-6, -4, -4]} intensity={0.45} color="#94A3B8" />
              <pointLight position={[0, 4, 0]} intensity={0.6} color="#BAE6FD" />

              <OrbitControls
                target={[0, 0.55, 0]}
                enablePan={false}
                minDistance={4.0}
                maxDistance={12.0}
                enableDamping
                dampingFactor={0.06}
                onStart={() => setIsDraggingOrbit(true)}
                onEnd={() => setIsDraggingOrbit(false)}
              />

              <Suspense fallback={null}>
                <group
                  position={[0, levelIndex === 1 ? 0.77 : 0.78, 0]}
                  scale={levelIndex === 1 ? 0.61 : 0.65}
                >
                  <UnitCellDensity3D
                    cellType={selectedCellType}
                    edgeLengthPm={edgeLengthPm}
                    molarMass={molarMass}
                    zValue={zValue}
                    autoRotate
                    isInteracting={isDraggingOrbit}
                  />
                </group>
              </Suspense>
            </Canvas>
          </div>

          {/* ── Floating Top Bar (EXIT, EXPLANATION, Target & Given Data) ── */}
          <div className="absolute top-0 left-0 right-0 p-2.5 sm:p-3 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-full flex items-center justify-between pointer-events-none">
              <button
                type="button"
                onClick={handleExit}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-md cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>EXIT</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>

            {/* Target & Live Density Pills */}
            <div className="pointer-events-auto mt-2 flex flex-col items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-black text-slate-900 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1 whitespace-nowrap">
                <span className="text-blue-600 font-extrabold">Target:</span>
                <span>{currentLevel.revealedMetal} ({currentLevel.symbol})</span>
              </span>

              {hasAdjustedValues && (
                <span className="text-[10.5px] font-mono font-black text-emerald-700 bg-emerald-50/95 backdrop-blur-md px-3 py-0.5 rounded-full border border-emerald-200 shadow-xs whitespace-nowrap animate-in fade-in duration-150">
                  Density (&rho;): {liveDensity.toFixed(2)} g/cm&sup3;
                </span>
              )}
            </div>
          </div>

          {/* ── Floating Bottom Control Dock (3 Interactive Pods + BCC/FCC Dropdown & Submit) ── */}
          <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 px-3 z-30 flex flex-col items-center pointer-events-none">
            <div className="pointer-events-auto w-full max-w-sm space-y-2">
              {/* 3 Interactive Control Pods in 1 Compact Row */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Pod 1: Z */}
                <div className="bg-blue-50/90 backdrop-blur-md border border-blue-200/80 rounded-xl p-2 flex flex-col items-center gap-1.5 shadow-sm">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-blue-700">
                    Atoms (Z)
                  </span>
                  <div className="w-full flex items-center justify-between gap-1">
                    <button
                      type="button"
                      aria-label="Decrease Z"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setZValue((v) => Math.max(1, v - 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="font-mono text-xs font-black text-blue-900">{zValue}</span>
                    <button
                      type="button"
                      aria-label="Increase Z"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setZValue((v) => Math.min(4, v + 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Pod 2: M */}
                <div className="bg-indigo-50/90 backdrop-blur-md border border-indigo-200/80 rounded-xl p-2 flex flex-col items-center gap-1.5 shadow-sm">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-700">
                    Mass (g)
                  </span>
                  <div className="w-full flex items-center justify-between gap-1">
                    <button
                      type="button"
                      aria-label="Decrease Molar Mass"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setMolarMass((v) => Math.max(40, Number((v - 0.5).toFixed(1))));
                      }}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="font-mono text-[11px] font-black text-indigo-900">{molarMass.toFixed(1)}</span>
                    <button
                      type="button"
                      aria-label="Increase Molar Mass"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setMolarMass((v) => Math.min(80, Number((v + 0.5).toFixed(1))));
                      }}
                      className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Pod 3: a */}
                <div className="bg-emerald-50/90 backdrop-blur-md border border-emerald-200/80 rounded-xl p-2 flex flex-col items-center gap-1.5 shadow-sm">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Edge (pm)
                  </span>
                  <div className="w-full flex items-center justify-between gap-1">
                    <button
                      type="button"
                      aria-label="Decrease Edge Length"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setEdgeLengthPm((v) => Math.max(250, v - 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="font-mono text-[11px] font-black text-emerald-900">{edgeLengthPm}</span>
                    <button
                      type="button"
                      aria-label="Increase Edge Length"
                      onClick={() => {
                        setHasAdjustedValues(true);
                        setEdgeLengthPm((v) => Math.min(400, v + 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xs transition cursor-pointer active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Unit Cell Dropdown (BCC/FCC) + Submit Button */}
              <div className="relative">
                {showCellDropdown && (
                  <div className="absolute bottom-full left-0 w-56 mb-2 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/15 p-1.5 z-50 space-y-1 animate-in fade-in duration-150">
                    {(
                      [
                        {
                          id: "BCC",
                          title: "BCC",
                          desc: "Body-Centred",
                          dotColor: "bg-amber-500",
                          badgeBg: "bg-amber-50 border-amber-200 text-amber-700",
                        },
                        {
                          id: "FCC",
                          title: "FCC",
                          desc: "Face-Centred",
                          dotColor: "bg-emerald-500",
                          badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-700",
                        },
                      ] as const
                    ).map((opt) => {
                      const active = selectedCellType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedCellType(opt.id);
                            setShowCellDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                            active
                              ? "bg-blue-50/90 border-blue-400 text-blue-950 shadow-2xs"
                              : "bg-white border-transparent hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${opt.badgeBg}`}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-black leading-tight">{opt.title}</div>
                              <div className="text-[10px] font-medium text-slate-500 truncate">{opt.desc}</div>
                            </div>
                          </div>
                          {active && <Check className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCellDropdown((prev) => !prev)}
                    className="w-full h-11 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs tracking-wide shadow-md shadow-blue-600/20 flex items-center justify-between transition-all cursor-pointer active:scale-95"
                  >
                    <span className="truncate">Unit Cell: {selectedCellType}</span>
                    {showCellDropdown ? (
                      <ChevronDown className="w-4 h-4 shrink-0" />
                    ) : (
                      <ChevronUp className="w-4 h-4 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowCellDropdown(false);
                      handleSubmit();
                    }}
                    className="w-full h-11 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>SUBMIT</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: LEVEL SUCCESS MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[310px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Unlocked: {currentLevel.revealedMetal} ({currentLevel.symbol})!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-2.5">
              You identified the <strong>{currentLevel.cellType}</strong> lattice (Z = {currentLevel.z}) and calculated its density!
            </p>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left font-mono text-[10px] text-slate-700 space-y-1 mb-3">
              <div>
                &rho; = ({currentLevel.z} &times; {currentLevel.molarMass.toFixed(1)}) / (6.022&times;10<sup>23</sup> &times; ({currentLevel.edgeLengthPm}&times;10<sup>-10</sup>)&sup3;)
              </div>
              <div className="font-black text-emerald-700">
                &rho; = {liveDensity.toFixed(2)} g/cm&sup3;
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  resetInputsForLevel(levelIndex);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={handleNextLevel}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
              >
                {levelIndex + 1 < DENSITY_LEVELS.length ? "NEXT LEVEL →" : "COMPLETE →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: FAIL / TRY AGAIN MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center mb-2 text-rose-600 shadow-inner">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Not Quite Right
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              {failFeedback}
            </p>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowFailModal(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RETRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: FINAL COMPLETION MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {showFinalCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl p-4 text-center flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center mb-2 text-emerald-600 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1 leading-tight">
              Unit Cell Density Mastered!
            </h3>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              Great job! You unlocked both unknown metals using crystal structure and the unit cell density formula.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full text-left font-mono text-[10px] text-slate-700 space-y-1 mb-3">
              <div className="flex justify-between font-bold text-emerald-700 border-b border-slate-200 pb-1">
                <span>Summary:</span>
                <span>2 / 2 Complete</span>
              </div>
              <div>&bull; Iron (Fe): BCC, Z = 2, &rho; = 7.86 g/cm&sup3;</div>
              <div>&bull; Copper (Cu): FCC, Z = 4, &rho; = 8.97 g/cm&sup3;</div>
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleReplayChallenge}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFinalCompletionModal(false);
                  setShowExplanation(true);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[11px] uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EXPLANATION MODAL (PORTRAIT OPTIMIZED, WHITE BACKGROUND)
          ══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white rounded-3xl sm:rounded-[32px] flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
          <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Density of a Cubic Unit Cell
                </h2>
                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Solid State Chemistry &bull; &rho; = Z&middot;M / (N<sub>A</sub>&middot;a&sup3;)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto w-full">
            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                1. Unit Cell Density Formula
              </h3>
              <p>
                The density of a crystalline solid equals the mass of one unit cell divided by its volume:
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm font-black text-center text-slate-900">
                &rho; = (Z &times; M) / (N<sub>A</sub> &times; a&sup3;)
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Z</strong> = number of atoms per unit cell</li>
                <li><strong>M</strong> = molar mass (g/mol)</li>
                <li><strong>N<sub>A</sub></strong> = Avogadro&apos;s constant (6.022 &times; 10<sup>23</sup> mol<sup>-1</sup>)</li>
                <li><strong>a</strong> = cubic edge length in cm (1 pm = 10<sup>-10</sup> cm)</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Finding Z from Crystal Structure
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm font-mono">
                  <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-black">Unit Cell</th>
                      <th className="p-2.5 font-black">Atom Sites</th>
                      <th className="p-2.5 font-black">Z</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-bold">Simple Cubic (SC)</td>
                      <td className="p-2.5">8 corners (&times; 1/8)</td>
                      <td className="p-2.5 font-black">1</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Body-Centred (BCC)</td>
                      <td className="p-2.5">8 corners + 1 body</td>
                      <td className="p-2.5 font-black">2</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Face-Centred (FCC)</td>
                      <td className="p-2.5">8 corners + 6 faces (&times; 1/2)</td>
                      <td className="p-2.5 font-black">4</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                3. Unit Conversion Tip
              </h3>
              <p className="text-sm">
                Because edge length <strong>a</strong> is given in picometres (pm), convert to centimetres before cubing:
                <span className="block mt-1 font-mono font-bold text-slate-900">
                  a (cm) = a (pm) &times; 10<sup>-10</sup> &rArr; a&sup3; (cm&sup3;) = a(pm)&sup3; &times; 10<sup>-30</sup>
                </span>
              </p>
            </section>

            <section className="space-y-2.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                4. How to Win This Game (Target Values)
              </h3>
              <p className="text-sm">
                Look at the <strong>Target</strong> metal &amp; lattice type at the top, use the <strong>&minus;</strong> and <strong>+</strong> buttons to set <strong>Z</strong>, <strong>M</strong>, and <strong>a</strong> to the values below, then tap <strong>SUBMIT</strong>:
              </p>
              <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-emerald-50/40">
                <table className="w-full text-left text-xs sm:text-sm font-mono">
                  <thead className="bg-emerald-50 text-emerald-950 border-b border-emerald-200">
                    <tr>
                      <th className="p-2.5 font-black">Level</th>
                      <th className="p-2.5 font-black">Z</th>
                      <th className="p-2.5 font-black">M (g/mol)</th>
                      <th className="p-2.5 font-black">a (pm)</th>
                      <th className="p-2.5 font-black">Density (&rho;)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">1. Iron (Fe &bull; BCC)</td>
                      <td className="p-2.5 font-black text-blue-700">2</td>
                      <td className="p-2.5 font-black text-indigo-700">56.0</td>
                      <td className="p-2.5 font-black text-emerald-700">287</td>
                      <td className="p-2.5 font-black">7.86 g/cm&sup3;</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900">2. Copper (Cu &bull; FCC)</td>
                      <td className="p-2.5 font-black text-blue-700">4</td>
                      <td className="p-2.5 font-black text-indigo-700">63.5</td>
                      <td className="p-2.5 font-black text-emerald-700">361</td>
                      <td className="p-2.5 font-black">8.97 g/cm&sup3;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="w-full px-6 py-3.5 border-t border-slate-100 flex items-center justify-center bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-95"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

