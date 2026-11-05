"use client";

import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  Zap,
  X,
  Play,
  Trophy,
  Sparkles,
  Info,
  Check,
  Target,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ── ELECTROCHEMICAL SERIES DATA ──────────────────────────────────────────────
export interface MetalElectrodeData {
  id: "mg" | "zn" | "cu" | "ag";
  name: string;
  symbol: string;
  ionSymbol: string;
  reductionEquation: string;
  e0: number; // Volts vs SHE
  e0Label: string;
  color: string;
  liquidColor: string;
  liquidFormula: string;
  bgGradient: string;
  borderColor: string;
  textCol: string;
  subCol: string;
}

export const METALS: Record<"mg" | "zn" | "cu" | "ag", MetalElectrodeData> = {
  mg: {
    id: "mg",
    name: "Magnesium",
    symbol: "Mg",
    ionSymbol: "Mg²⁺/Mg",
    reductionEquation: "Mg²⁺ + 2e⁻ → Mg",
    e0: -2.37,
    e0Label: "-2.37 V",
    color: "#CBD5E1",
    liquidColor: "#38BDF8", // Vibrant clear blue electrolyte
    liquidFormula: "MgSO₄(aq)",
    bgGradient: "bg-gradient-to-b from-slate-100 to-slate-200",
    borderColor: "border-slate-300",
    textCol: "text-slate-900",
    subCol: "text-slate-600",
  },
  zn: {
    id: "zn",
    name: "Zinc",
    symbol: "Zn",
    ionSymbol: "Zn²⁺/Zn",
    reductionEquation: "Zn²⁺ + 2e⁻ → Zn",
    e0: -0.76,
    e0Label: "-0.76 V",
    color: "#93C5FD",
    liquidColor: "#0EA5E9", // Bright aqua solution
    liquidFormula: "ZnSO₄(aq)",
    bgGradient: "bg-gradient-to-b from-sky-50 to-sky-200",
    borderColor: "border-sky-300",
    textCol: "text-sky-950",
    subCol: "text-sky-700",
  },
  cu: {
    id: "cu",
    name: "Copper",
    symbol: "Cu",
    ionSymbol: "Cu²⁺/Cu",
    reductionEquation: "Cu²⁺ + 2e⁻ → Cu",
    e0: 0.34,
    e0Label: "+0.34 V",
    color: "#FDBA74",
    liquidColor: "#1D4ED8", // Deep rich copper(II) sulfate blue
    liquidFormula: "CuSO₄(aq)",
    bgGradient: "bg-gradient-to-b from-amber-50 to-orange-200",
    borderColor: "border-orange-300",
    textCol: "text-amber-950",
    subCol: "text-amber-800",
  },
  ag: {
    id: "ag",
    name: "Silver",
    symbol: "Ag",
    ionSymbol: "Ag⁺/Ag",
    reductionEquation: "Ag⁺ + e⁻ → Ag",
    e0: 0.8,
    e0Label: "+0.80 V",
    color: "#E2E8F0",
    liquidColor: "#0284C7", // Clean crystal blue silver nitrate
    liquidFormula: "AgNO₃(aq)",
    bgGradient: "bg-gradient-to-b from-blue-50 to-indigo-100",
    borderColor: "border-indigo-200",
    textCol: "text-indigo-950",
    subCol: "text-indigo-700",
  },
};

// ── AUDIO SYNTHESIZER ────────────────────────────────────────────────────────
function playAudioTone(type: "click" | "correct" | "wrong" | "hum" | "win") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.1);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {
    // Audio context not supported
  }
}

// ── 3D GLASS BEAKER ──────────────────────────────────────────────────────────
function Beaker3D({
  position,
  liquidColor,
  liquidOpacity = 0.88,
  solutionFormula,
}: {
  position: [number, number, number];
  liquidColor: string;
  liquidOpacity?: number;
  solutionFormula: string;
}) {
  return (
    <group position={position}>
      {/* Outer Glass Wall */}
      <mesh position={[0, 1.25, 0]} renderOrder={2}>
        <cylinderGeometry args={[1.18, 1.15, 2.5, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.05}
          transmission={0.92}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beaker Glass Base */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 36]} />
        <meshStandardMaterial color="#CBD5E1" transparent opacity={0.5} roughness={0.1} />
      </mesh>

      {/* Glass Rim Top Ring */}
      <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.18, 0.04, 16, 36]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.1} />
      </mesh>

      {/* Aqueous Electrolyte Solution Volume */}
      <mesh position={[0, 1.0, 0]} renderOrder={1}>
        <cylinderGeometry args={[1.14, 1.12, 1.9, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={liquidOpacity}
        />
      </mesh>

      {/* Solution Meniscus / Top Surface */}
      <mesh position={[0, 1.95, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[1.14, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.15}
          metalness={0.15}
          transparent
          opacity={Math.min(0.96, liquidOpacity + 0.1)}
        />
      </mesh>

      {/* Beaker Measurement Ticks */}
      {[-0.3, 0.0, 0.3, 0.6].map((yOff, idx) => (
        <mesh key={idx} position={[1.16, 1.0 + yOff, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.16, 8]} />
          <meshBasicMaterial color="#94A3B8" />
        </mesh>
      ))}

      {/* Formula label below beaker */}
      <Html position={[0, -0.25, 0.8]} center distanceFactor={8} zIndexRange={[10, 0]}>
        <div className="bg-slate-900/85 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-700/60 text-slate-100 font-mono text-[10px] font-bold shadow-md pointer-events-none whitespace-nowrap flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block shadow-sm" style={{ backgroundColor: liquidColor }} />
          <span>{solutionFormula}</span>
        </div>
      </Html>
    </group>
  );
}

// ── 3D ELECTRODE STRIP ───────────────────────────────────────────────────────
function DynamicElectrode3D({
  metal,
  isAnode,
}: {
  metal: MetalElectrodeData | null;
  isAnode: boolean;
}) {
  const x = isAnode ? -2.2 : 2.2;
  const rotZ = isAnode ? 0.08 : -0.08;

  if (!metal) {
    return (
      <group position={[x, 1.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.03, 16, 32]} />
          <meshBasicMaterial color="#94A3B8" transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={[x, 1.35, 0]} rotation={[0, 0, rotZ]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.42, 2.5, 0.08]} />
        <meshStandardMaterial
          color={metal.color}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.32, 0]}>
        <boxGeometry args={[0.22, 0.2, 0.16]} />
        <meshStandardMaterial color={isAnode ? "#1E293B" : "#DC2626"} roughness={0.3} />
      </mesh>
      <Html position={[0, 1.7, 0]} center distanceFactor={8} zIndexRange={[12, 0]}>
        <div className="bg-slate-900/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700 shadow-md whitespace-nowrap flex items-center gap-1 pointer-events-none">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: metal.color }}
          />
          <span>{metal.symbol}</span>
          <span className="text-[9px] text-slate-400">({metal.e0Label})</span>
        </div>
      </Html>
    </group>
  );
}

// ── 3D U-SHAPED SALT BRIDGE ──────────────────────────────────────────────────
function SaltBridge3D() {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1.8, 1.1, 0),
        new THREE.Vector3(-1.8, 2.45, 0),
        new THREE.Vector3(-1.0, 2.65, 0),
        new THREE.Vector3(0, 2.68, 0),
        new THREE.Vector3(1.0, 2.65, 0),
        new THREE.Vector3(1.8, 2.45, 0),
        new THREE.Vector3(1.8, 1.1, 0),
      ],
      false,
      "catmullrom",
      0.15
    );
  }, []);

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.16, 20, false), [curve]);
  const innerGeo = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.13, 16, false), [curve]);

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshPhysicalMaterial
          color="#F0FDF4"
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.88}
          thickness={0.15}
        />
      </mesh>
      <mesh geometry={innerGeo}>
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── 3D DIGITAL VOLTMETER ─────────────────────────────────────────────────────
function Voltmeter3D({
  voltage,
  isActive,
}: {
  voltage: number;
  isActive: boolean;
}) {
  return (
    <group position={[0, 1.5, 1.4]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 1.6, 0.42]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.45, -0.02]}>
        <boxGeometry args={[1.56, 1.66, 0.4]} />
        <meshStandardMaterial color="#0284C7" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, 0.22]}>
        <boxGeometry args={[1.15, 0.5, 0.04]} />
        <meshStandardMaterial color="#0F172A" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.82, 0.242]}>
        <planeGeometry args={[1.05, 0.42]} />
        <meshBasicMaterial color={isActive ? "#022C22" : "#022C22"} />
      </mesh>
      <Html position={[0, 0.82, 0.26]} center distanceFactor={7.5} zIndexRange={[15, 0]}>
        <div className="font-mono font-black text-emerald-400 text-base sm:text-lg tracking-widest pointer-events-none select-none drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
          {voltage.toFixed(2)}
          <span className="text-xs font-bold ml-1 text-emerald-500">V</span>
        </div>
      </Html>
      <mesh position={[-0.35, 0.25, 0.22]}>
        <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 0.25, 0.22]}>
        <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, -0.15, 0.2]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} />
      </mesh>
      <mesh position={[0.3, -0.15, 0.2]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── 3D WIRES & ELECTRON ANIMATION ────────────────────────────────────────────
function ConnectingWires3D({
  isActive,
  voltage,
}: {
  isActive: boolean;
  voltage: number;
}) {
  const curveLeft = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.2, 2.7, 0),
        new THREE.Vector3(-1.9, 3.1, 0.3),
        new THREE.Vector3(-0.9, 2.2, 0.9),
        new THREE.Vector3(-0.3, 1.35, 1.55),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const curveRight = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.3, 1.35, 1.55),
        new THREE.Vector3(0.9, 2.2, 0.9),
        new THREE.Vector3(1.9, 3.1, 0.3),
        new THREE.Vector3(2.2, 2.7, 0),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const tubeGeoLeft = useMemo(() => new THREE.TubeGeometry(curveLeft, 32, 0.035, 12, false), [curveLeft]);
  const tubeGeoRight = useMemo(() => new THREE.TubeGeometry(curveRight, 32, 0.035, 12, false), [curveRight]);

  const electronCount = 14;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const electronInstRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (!electronInstRef.current || !isActive || voltage <= 0) return;
    const time = clock.getElapsedTime();
    const speed = 0.3 + (voltage / 3.17) * 0.45;

    for (let i = 0; i < electronCount; i++) {
      const progress = (time * speed + i / electronCount) % 1;
      let pos: THREE.Vector3;
      if (progress < 0.5) {
        pos = curveLeft.getPointAt(progress * 2);
      } else {
        pos = curveRight.getPointAt((progress - 0.5) * 2);
      }
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.065 + Math.sin(time * 8 + i) * 0.015);
      dummy.updateMatrix();
      electronInstRef.current.setMatrixAt(i, dummy.matrix);
    }
    electronInstRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={tubeGeoLeft}>
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh geometry={tubeGeoRight}>
        <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
      </mesh>

      {isActive && voltage > 0 && (
        <instancedMesh ref={electronInstRef} args={[undefined, undefined, electronCount]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color="#38BDF8" toneMapped={false} />
        </instancedMesh>
      )}
    </group>
  );
}

// ── MAIN EXPORT COMPONENT ────────────────────────────────────────────────────
export default function ElectrodePotentialLevel1GamePage({
  onExit,
}: {
  onExit?: () => void;
}) {
  // Navigation & Intro Flow
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameScreen, setGameScreen] = useState<"screen1" | "screen2">("screen1");

  // Global Score (0 to 100)
  const [score, setScore] = useState(0);

  // ── SCREEN 1 STATE: ELECTRODE POTENTIAL ANALYZER ───────────────────────────
  // Selected metal
  const [selectedElectrode, setSelectedElectrode] = useState<"mg" | "zn" | "cu" | "ag" | null>(null);

  // 4 Empty Slots for Vertical Potential Ordering Scale (Top to Bottom: Highest to Lowest)
  // Correct order from Top (+0.80) to Bottom (-2.37): Slot 0 = Ag, Slot 1 = Cu, Slot 2 = Zn, Slot 3 = Mg
  const [scaleSlots, setScaleSlots] = useState<Array<"mg" | "zn" | "cu" | "ag" | null>>([null, null, null, null]);

  // Cathode & Anode Role Slots
  const [slotCathode, setSlotCathode] = useState<"mg" | "zn" | "cu" | "ag" | null>(null);
  const [slotAnode, setSlotAnode] = useState<"mg" | "zn" | "cu" | "ag" | null>(null);
  const [, setScreen1Checked] = useState(false);

  // ── SCREEN 2 STATE: BUILD THE HIGHEST VOLTAGE ──────────────────────────────
  const [compAnode, setCompAnode] = useState<"mg" | "zn" | "cu" | "ag" | null>(null);
  const [compCathode, setCompCathode] = useState<"mg" | "zn" | "cu" | "ag" | null>(null);
  const [inputEmf, setInputEmf] = useState("");
  const [isCellActive, setIsCellActive] = useState(false);
  const [activeMeterVoltage, setActiveMeterVoltage] = useState(0.0);

  // Modals & Feedback
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [showStage2TargetModal, setShowStage2TargetModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Calculate Cell Potential for Screen 1
  const screen1Emf = useMemo(() => {
    if (!slotCathode || !slotAnode) return null;
    return Number((METALS[slotCathode].e0 - METALS[slotAnode].e0).toFixed(2));
  }, [slotCathode, slotAnode]);

  // Calculate Cell Potential for Screen 2
  const screen2ActualEmf = useMemo(() => {
    if (!compCathode || !compAnode) return 0.0;
    return Number((METALS[compCathode].e0 - METALS[compAnode].e0).toFixed(2));
  }, [compCathode, compAnode]);

  // Handle assigning an electrode to Scale Slot (0=top/highest, 3=bottom/lowest)
  const handleAssignScaleSlot = (slotIdx: number, metalId: "mg" | "zn" | "cu" | "ag") => {
    playAudioTone("click");
    setScaleSlots((prev) => {
      const next = [...prev];
      // If metal already in another slot, remove it from there
      for (let i = 0; i < next.length; i++) {
        if (next[i] === metalId) next[i] = null;
      }
      next[slotIdx] = metalId;
      return next;
    });
  };

  // Handle assigning an electrode to Cathode or Anode in Screen 1
  const handleAssignRoleSlot = (targetSlot: "cathode" | "anode", metalId: "mg" | "zn" | "cu" | "ag") => {
    playAudioTone("click");
    if (targetSlot === "cathode") {
      if (slotAnode === metalId) setSlotAnode(null);
      setSlotCathode(metalId);
    } else {
      if (slotCathode === metalId) setSlotCathode(null);
      setSlotAnode(metalId);
    }
  };

  // Check Screen 1 Answer
  const handleCheckScreen1 = () => {
    // 1. Check if all 4 slots in the vertical scale are arranged
    const allScaleFilled = scaleSlots.every((s) => s !== null);
    if (!allScaleFilled) {
      playAudioTone("wrong");
      setFeedbackError("Please place all 4 electrodes into the vertical potential boxes from top to bottom!");
      setTimeout(() => setFeedbackError(null), 3000);
      return;
    }

    // Correct scale order: Top to Bottom = Ag (+0.80), Cu (+0.34), Zn (-0.76), Mg (-2.37)
    const isScaleCorrect =
      scaleSlots[0] === "ag" &&
      scaleSlots[1] === "cu" &&
      scaleSlots[2] === "zn" &&
      scaleSlots[3] === "mg";

    if (!isScaleCorrect) {
      playAudioTone("wrong");
      setFeedbackError("Vertical potential order is incorrect! Arrange from highest potential at top (+0.80 Ag) down to lowest (-2.37 Mg).");
      setTimeout(() => setFeedbackError(null), 3500);
      return;
    }

    // 2. Check Cathode and Anode slots
    if (!slotCathode || !slotAnode) {
      playAudioTone("wrong");
      setFeedbackError("Please assign an electrode to both the Cathode and Anode slots!");
      setTimeout(() => setFeedbackError(null), 2500);
      return;
    }

    if (slotCathode === slotAnode) {
      playAudioTone("wrong");
      setFeedbackError("A galvanic cell requires two different electrodes!");
      setTimeout(() => setFeedbackError(null), 2500);
      return;
    }

    const eCathode = METALS[slotCathode].e0;
    const eAnode = METALS[slotAnode].e0;

    if (eCathode > eAnode) {
      setScreen1Checked(true);
      setScore((prev) => Math.max(prev, 50));
      playAudioTone("correct");
      setFeedbackSuccess(
        "Correct! E°cell = " +
        eCathode.toFixed(2) +
        " - (" +
        eAnode.toFixed(2) +
        ") = +" +
        (eCathode - eAnode).toFixed(2) +
        " V."
      );
      setTimeout(() => {
        setFeedbackSuccess(null);
        setShowStage2TargetModal(true);
      }, 1500);
    } else {
      playAudioTone("wrong");
      setFeedbackError(
        "Incorrect! E°cell = " +
        (eCathode - eAnode).toFixed(2) +
        " V (< 0). Higher E° must be Cathode (reduction), Lower E° must be Anode (oxidation)!"
      );
      setTimeout(() => setFeedbackError(null), 3500);
    }
  };

  // Screen 2: Submit Tested Pair / Calculate EMF
  const handleSubmitScreen2 = () => {
    if (!compAnode || !compCathode) {
      playAudioTone("wrong");
      setFeedbackError("Please place both electrodes into the Anode and Cathode beakers!");
      setTimeout(() => setFeedbackError(null), 2500);
      return;
    }

    if (compAnode === compCathode) {
      playAudioTone("wrong");
      setFeedbackError("Identical electrodes produce 0.00 V! Choose two different metals.");
      setTimeout(() => setFeedbackError(null), 2500);
      return;
    }

    const calculatedEmf = screen2ActualEmf;

    if (calculatedEmf <= 0) {
      playAudioTone("wrong");
      setFeedbackError(
        "Negative EMF (" +
        calculatedEmf.toFixed(2) +
        " V)! Non-spontaneous. Anode must have LOWER potential than Cathode!"
      );
      setTimeout(() => setFeedbackError(null), 3000);
      return;
    }

    setIsCellActive(true);
    playAudioTone("hum");

    let v = 0.0;
    const interval = setInterval(() => {
      v += calculatedEmf / 10;
      if (v >= calculatedEmf) {
        setActiveMeterVoltage(calculatedEmf);
        clearInterval(interval);
      } else {
        setActiveMeterVoltage(Number(v.toFixed(2)));
      }
    }, 40);

    if (compAnode === "mg" && compCathode === "ag") {
      setScore(100);
      playAudioTone("win");
      setFeedbackSuccess("🎯 TARGET ACHIEVED! 3.17 V is the Maximum Standard Cell EMF!");
      setTimeout(() => {
        setFeedbackSuccess(null);
        setShowVictoryModal(true);
      }, 1500);
    } else {
      playAudioTone("wrong");
      setFeedbackError(
        "Generated +" +
        calculatedEmf.toFixed(2) +
        " V (Not Maximum). Try another pair to reach the 3.17 V target!"
      );
      setTimeout(() => setFeedbackError(null), 3000);
    }
  };

  const handleResetChallenge = () => {
    setSelectedElectrode(null);
    setScaleSlots([null, null, null, null]);
    setSlotCathode(null);
    setSlotAnode(null);
    setScreen1Checked(false);
    setCompAnode(null);
    setCompCathode(null);
    setInputEmf("");
    setIsCellActive(false);
    setActiveMeterVoltage(0.0);
    setScore(0);
    setShowVictoryModal(false);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    playAudioTone("click");
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">
      {/* ── SCREEN 1: MISSION SCREEN ───────────────────────────────────────── */}
      {!gameStarted && introStep === "mission" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#0284C7]">MISSION:</span> Arrange metals by their voltage, then connect the best pair to build the highest power cell!
            </h1>






            <div>
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

      {/* ── SCREEN 2: INSTRUCTIONS SCREEN ──────────────────────────────────── */}
      {!gameStarted && introStep === "instructions" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-2.5 sm:p-4 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-0.5 w-full animate-in fade-in duration-200 flex-1">
            <div className="text-center pt-0.5 pb-1 sm:pb-2">
              <h2 className="text-[#1E293B] text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
                INSTRUCTIONS TO PLAY
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2 sm:gap-3 w-full mx-auto my-auto items-stretch">
              {/* Card 1 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Order Potentials
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[9px] sm:text-[10px]">
                      Stage 1 • Scale
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Match all 4 electrode metals into the reduction potential scale from highest to lowest.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center mt-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/step1_order_potentials.png"
                    alt="Order Potentials"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Assign Cathode &amp; Anode
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] sm:text-[10px]">
                      Stage 1 • Test Pair
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Assign which metal acts as Cathode (reduction) and Anode (oxidation) to check spontaneity.
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center mt-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/step2_assign_cathode_anode.png"
                    alt="Assign Cathode and Anode"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-md border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Build 3.17 V Cell
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] sm:text-[10px]">
                      Stage 2 • 3D Cell
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1">
                    Select electrodes and place them into the beakers to find the pair with highest EMF (3.17 V)!
                  </p>
                </div>
                <div className="w-full h-24 sm:h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center mt-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/instructions/step3_win_target.png"
                    alt="Build 3.17 V Cell"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>
            </div>

            {/* Equal-sized BACK and PLAY Buttons */}
            <div className="pt-2 sm:pt-2.5 pb-0.5 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIntroStep("mission")}
                className="w-28 sm:w-32 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="w-28 sm:w-32 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP-LEVEL CORNER CONTROLS ONLY (Exit top-left, Explanation top-right) ── */}
      {gameStarted && (
        <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 z-30 shrink-0">
          {/* Top-Left Exit Button */}
          <button
            type="button"
            onClick={() => (onExit ? onExit() : exitSimulation())}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer active:scale-95"
            title="Exit Simulation"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>EXIT</span>
          </button>

          {/* Top-Right Explanation Button */}
          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
            title="Explanation Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span>EXPLANATION</span>
          </button>
        </div>
      )}

      {/* ── FEEDBACK ALERTS ─────────────────────────────────────────────────── */}
      {gameStarted && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-lg px-4 flex flex-col items-center">
          {feedbackError && (
            <div className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-red-400 flex items-center gap-2 pointer-events-auto animate-bounce">
              <span>⚠️</span>
              <span>{feedbackError}</span>
            </div>
          )}
          {feedbackSuccess && (
            <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{feedbackSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 1: ELECTRODE POTENTIAL ANALYZER
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && gameScreen === "screen1" && (
        <div className="flex-1 w-full p-2 sm:p-3 overflow-hidden flex items-center justify-center min-h-0">
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4 items-stretch h-full max-h-[84vh]">
            {/* ── LEFT PANEL (2x2 Distinct-Colored Large Electrode Tabs) ── */}
            <div className="md:col-span-4 flex flex-col justify-between gap-2 h-full">
              {/* 2x2 Distinct-Colored Larger Electrode Cards */}
              <div className="grid grid-cols-2 gap-2.5 flex-1">
                {(["mg", "zn", "cu", "ag"] as const).map((id) => {
                  const m = METALS[id];
                  const isAssignedCathode = slotCathode === id;
                  const isAssignedAnode = slotAnode === id;
                  const isSelected = selectedElectrode === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", id);
                        setSelectedElectrode(id);
                      }}
                      onClick={() => {
                        setSelectedElectrode(id);
                        playAudioTone("click");
                      }}
                      className={`relative min-h-[90px] sm:min-h-[110px] p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs text-center transform hover:scale-[1.02] active:scale-95 ${m.bgGradient} ${m.borderColor} ${isSelected ? "ring-4 ring-[#0284C7] ring-offset-1" : ""
                        }`}
                    >
                      {/* Active Slot Indicators */}
                      {isAssignedCathode && (
                        <span className="absolute -top-1.5 -right-1 px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] shadow-xs">
                          Cathode
                        </span>
                      )}
                      {isAssignedAnode && (
                        <span className="absolute -top-1.5 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] shadow-xs">
                          Anode
                        </span>
                      )}

                      <span className={`font-mono font-black text-lg sm:text-xl ${m.textCol}`}>
                        {m.ionSymbol}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Reserved height for Assign container so layout NEVER shifts or resizes */}
              <div className="h-10 shrink-0 flex items-center">
                {selectedElectrode ? (
                  <div className="w-full bg-sky-50 rounded-xl px-2.5 py-1.5 border border-sky-200 text-center flex items-center justify-between text-xs shadow-xs">
                    <span className="font-bold text-sky-950 text-[11px] sm:text-xs">
                      Assign <strong className="uppercase">{METALS[selectedElectrode].symbol}</strong> to:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAssignRoleSlot("cathode", selectedElectrode)}
                        className="px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] sm:text-xs cursor-pointer active:scale-95 transition-transform"
                      >
                        Cathode
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignRoleSlot("anode", selectedElectrode)}
                        className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] sm:text-xs cursor-pointer active:scale-95 transition-transform"
                      >
                        Anode
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full text-center text-[10px] text-slate-400 font-medium italic">
                    Select an electrode to assign role or drop into scale
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER PANEL (Standard Reduction Potential Scale with 4 Empty Slots Top-to-Bottom) ── */}
            <div className="md:col-span-4 bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200 shadow-sm flex flex-col items-center justify-between h-full">
              <h3 className="font-black text-xs sm:text-sm text-slate-800 tracking-tight text-center">
                Standard Reduction Potential (V)
              </h3>

              {/* 4 Ordered Scale Drop Boxes Top to Bottom */}
              <div className="w-full flex-1 flex flex-col justify-between my-1.5 gap-1.5 max-w-xs">
                {[
                  { idx: 0, label: "+0.80 V", targetMeta: "ag" },
                  { idx: 1, label: "+0.34 V", targetMeta: "cu" },
                  { idx: 2, label: "-0.76 V", targetMeta: "zn" },
                  { idx: 3, label: "-2.37 V", targetMeta: "mg" },
                ].map(({ idx, label }) => {
                  const filledMetal = scaleSlots[idx];
                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const metalId = e.dataTransfer.getData("text/plain") as "mg" | "zn" | "cu" | "ag";
                        if (metalId) handleAssignScaleSlot(idx, metalId);
                      }}
                      onClick={() => {
                        if (selectedElectrode) handleAssignScaleSlot(idx, selectedElectrode);
                      }}
                      className={`w-full h-10 sm:h-11 rounded-xl border-2 border-dashed flex items-center justify-between px-3 transition-all cursor-pointer ${filledMetal
                        ? `${METALS[filledMetal].bgGradient} ${METALS[filledMetal].borderColor} border-solid shadow-xs`
                        : "border-slate-300 hover:border-sky-400 bg-slate-50/60"
                        }`}
                    >
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {label}
                      </span>
                      {filledMetal ? (
                        <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-slate-800">
                          <span>{METALS[filledMetal].ionSymbol}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">Drop here</span>
                      )}
                    </div>
                  );
                })}
              </div>


            </div>

            {/* ── RIGHT PANEL (Cathode & Anode Drop Slots + E°cell + Check) ───── */}
            <div className="md:col-span-4 flex flex-col justify-between gap-2 h-full">
              {/* Cathode Slot */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const metalId = e.dataTransfer.getData("text/plain") as "mg" | "zn" | "cu" | "ag";
                  if (metalId) handleAssignRoleSlot("cathode", metalId);
                }}
                className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex items-center justify-between gap-2.5"
              >
                <div className="px-3 py-1 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-xs text-center shrink-0">
                  <div>Cathode</div>
                  <div className="text-[8.5px] font-normal opacity-90">(reduction)</div>
                </div>

                <div
                  onClick={() => {
                    if (selectedElectrode) handleAssignRoleSlot("cathode", selectedElectrode);
                  }}
                  className={`flex-1 h-11 rounded-xl border-2 border-dashed flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${slotCathode
                    ? "border-purple-400 bg-purple-50 text-purple-950 font-black text-sm"
                    : "border-slate-300 text-slate-400 hover:border-purple-300 hover:bg-slate-50"
                    }`}
                >
                  {slotCathode ? (
                    <div className="flex items-center gap-2">
                      <span>{METALS[slotCathode].ionSymbol}</span>
                    </div>
                  ) : (
                    "Drop here"
                  )}
                </div>
              </div>

              {/* Anode Slot */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const metalId = e.dataTransfer.getData("text/plain") as "mg" | "zn" | "cu" | "ag";
                  if (metalId) handleAssignRoleSlot("anode", metalId);
                }}
                className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex items-center justify-between gap-2.5"
              >
                <div className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-xs text-center shrink-0">
                  <div>Anode</div>
                  <div className="text-[8.5px] font-normal opacity-90">(oxidation)</div>
                </div>

                <div
                  onClick={() => {
                    if (selectedElectrode) handleAssignRoleSlot("anode", selectedElectrode);
                  }}
                  className={`flex-1 h-11 rounded-xl border-2 border-dashed flex items-center justify-center font-mono font-bold text-xs transition-all cursor-pointer ${slotAnode
                    ? "border-emerald-400 bg-emerald-50 text-emerald-950 font-black text-sm"
                    : "border-slate-300 text-slate-400 hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                >
                  {slotAnode ? (
                    <div className="flex items-center gap-2">
                      <span>{METALS[slotAnode].ionSymbol}</span>
                    </div>
                  ) : (
                    "Drop here"
                  )}
                </div>
              </div>

              {/* Cell Potential (E°cell) Display */}
              <div className="bg-slate-900 rounded-2xl p-2.5 border border-slate-800 shadow-md text-center space-y-0.5">
                <span className="text-[10.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Cell Potential (E°cell)
                </span>
                <div className="font-mono font-black text-2xl sm:text-3xl tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
                  {screen1Emf !== null
                    ? `${screen1Emf >= 0 ? `+${screen1Emf.toFixed(2)}` : screen1Emf.toFixed(2)} V`
                    : "--- V"}
                </div>
                {screen1Emf !== null && (
                  <div className="text-[9.5px] font-mono text-slate-400">
                    {METALS[slotCathode!].e0.toFixed(2)} - ({METALS[slotAnode!].e0.toFixed(2)})
                  </div>
                )}
              </div>

              {/* Check Action Button */}
              <button
                type="button"
                onClick={handleCheckScreen1}
                className="w-full py-2.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Check</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 2: BUILD THE HIGHEST VOLTAGE
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && gameScreen === "screen2" && (
        <div className="flex-1 w-full relative flex flex-col overflow-hidden">
          {/* 3D WebGL Canvas for the Galvanic Cell */}
          <div className="absolute inset-0 w-full h-full">
            <Canvas
              camera={{ position: [0, 2.6, 9.8], fov: 38 }}
              gl={{ antialias: true, alpha: false }}
              className="w-full h-full touch-none"
            >
              <color attach="background" args={["#F8FAFC"]} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[6, 9, 6]} intensity={1.4} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.5} />

              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[22, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.05} />
              </mesh>
              <gridHelper args={[20, 40, "#E2E8F0", "#F1F5F9"]} position={[0, -0.04, 0]} />

              <Beaker3D
                position={[-2.2, 0, 0]}
                liquidColor={compAnode ? METALS[compAnode].liquidColor : "#94A3B8"}
                liquidOpacity={0.82}
                solutionFormula={compAnode ? METALS[compAnode].liquidFormula : "Anode Solution"}
              />

              <Beaker3D
                position={[2.2, 0, 0]}
                liquidColor={compCathode ? METALS[compCathode].liquidColor : "#94A3B8"}
                liquidOpacity={0.82}
                solutionFormula={compCathode ? METALS[compCathode].liquidFormula : "Cathode Solution"}
              />

              <DynamicElectrode3D
                metal={compAnode ? METALS[compAnode] : null}
                isAnode={true}
              />

              <DynamicElectrode3D
                metal={compCathode ? METALS[compCathode] : null}
                isAnode={false}
              />

              <SaltBridge3D />

              <Voltmeter3D
                voltage={isCellActive ? activeMeterVoltage : 0.0}
                isActive={isCellActive}
              />

              <ConnectingWires3D
                isActive={isCellActive}
                voltage={activeMeterVoltage}
              />

              <OrbitControls
                enablePan={false}
                minDistance={5}
                maxDistance={11}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={Math.PI / 4.5}
              />
            </Canvas>
          </div>

          {/* ── 3D OVERLAYS: ANODE & CATHODE DROP TARGETS OVER BEAKERS ────────── */}
          <div className="absolute inset-x-0 top-3 pointer-events-none flex justify-center items-center gap-32 sm:gap-52 z-20">
            {/* Left Beaker Overlay (Anode) */}
            <div className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0284C7] text-white font-extrabold text-[9px] sm:text-[10px] shadow-sm">
                Anode (lower potential)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElectrode) {
                    setCompAnode(selectedElectrode);
                    setIsCellActive(false);
                    playAudioTone("click");
                  }
                }}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all cursor-pointer shadow-sm ${compAnode
                  ? "border-sky-400 bg-sky-500/20 text-sky-900 font-black text-xs backdrop-blur-xs"
                  : "border-sky-300 bg-white/70 text-sky-600 hover:bg-sky-50"
                  }`}
              >
                {compAnode ? (
                  <div className="font-mono font-black text-xs sm:text-sm">{METALS[compAnode].symbol}</div>
                ) : (
                  <span className="text-base font-black">+</span>
                )}
              </button>
            </div>

            {/* Right Beaker Overlay (Cathode) */}
            <div className="flex flex-col items-center gap-0.5 pointer-events-auto">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[9px] sm:text-[10px] shadow-sm">
                Cathode (higher potential)
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedElectrode) {
                    setCompCathode(selectedElectrode);
                    setIsCellActive(false);
                    playAudioTone("click");
                  }
                }}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 border-dashed flex items-center justify-center transition-all cursor-pointer shadow-sm ${compCathode
                  ? "border-purple-400 bg-purple-500/20 text-purple-950 font-black text-xs backdrop-blur-xs"
                  : "border-purple-300 bg-white/70 text-purple-600 hover:bg-purple-50"
                  }`}
              >
                {compCathode ? (
                  <div className="font-mono font-black text-xs sm:text-sm">{METALS[compCathode].symbol}</div>
                ) : (
                  <span className="text-base font-black">+</span>
                )}
              </button>
            </div>
          </div>

          {/* ── BOTTOM CENTER DOCK: ALL 4 ELECTRODES IN A SINGLE LINE ────────── */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 border border-slate-200 shadow-xl pointer-events-auto flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-wider pr-1 border-r border-slate-200">
                Electrodes:
              </span>
              <div className="flex items-center gap-2">
                {(["mg", "zn", "cu", "ag"] as const).map((id) => {
                  const m = METALS[id];
                  const isSelected = selectedElectrode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelectedElectrode(id);
                        playAudioTone("click");
                      }}
                      className={`w-12 h-10 sm:w-14 sm:h-11 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${m.bgGradient} ${m.borderColor} ${isSelected ? "ring-4 ring-[#0284C7] ring-offset-1 scale-105" : "hover:scale-105"
                        }`}
                      title={m.name}
                    >
                      <span className={`font-mono font-black text-xs sm:text-sm ${m.textCol}`}>
                        {m.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL OVERLAY: Target + Submit ─────────────────────────── */}
          <div className="absolute bottom-3 right-3 sm:right-5 z-20 w-44 sm:w-48 flex flex-col gap-1.5 pointer-events-none">
            <div className={`bg-white/95 backdrop-blur-md rounded-2xl p-2.5 border shadow-md pointer-events-auto flex items-center justify-between transition-all duration-300 ${activeMeterVoltage === 3.17
              ? "border-emerald-300 ring-2 ring-emerald-400 bg-emerald-50/90"
              : "border-slate-200"
              }`}>
              <div className="flex items-center gap-1.5">
                <Target className={`w-3.5 h-3.5 ${activeMeterVoltage === 3.17 ? "text-emerald-600" : "text-slate-400"}`} />
                <span className="font-extrabold text-[10px] text-slate-600 uppercase tracking-wider">
                  Target:
                </span>
              </div>
              <span
                className={`font-mono font-black text-sm sm:text-base transition-colors duration-300 ${activeMeterVoltage === 3.17
                  ? "text-emerald-600 animate-pulse"
                  : "text-slate-700"
                  }`}
              >
                3.17 V
              </span>
            </div>

            <button
              type="button"
              onClick={handleSubmitScreen2}
              className="w-full py-2 rounded-2xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer pointer-events-auto flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 2 TARGET POPUP MODAL ────────────────────────────────────── */}
      {showStage2TargetModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0284C7] flex items-center justify-center mx-auto shadow-inner">
              <Target className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                STAGE 2 MISSION
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Find the electrode pair that produces the <strong className="text-slate-900">highest standard cell EMF</strong>.
              </p>
            </div>

            <div className="bg-sky-50 rounded-2xl p-3 border border-sky-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                TARGET VOLTAGE:
              </span>
              <span className="font-mono font-black text-lg sm:text-xl text-emerald-600">
                3.17 V
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowStage2TargetModal(false);
                setGameScreen("screen2");
                playAudioTone("click");
              }}
              className="w-full py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
            >
              START STAGE 2
            </button>
          </div>
        </div>
      )}

      {/* ── VICTORY MODAL ────────────────────────────────────────────────────── */}
      {showVictoryModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-w-md w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                <span>VOLTAGE MASTER!</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-emerald-700 font-bold text-xs sm:text-sm">
                &ldquo;You successfully built the highest voltage galvanic cell (3.17 V)!&rdquo;
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-left space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                <span>Maximum Standard EMF:</span>
                <span className="text-emerald-600 font-mono text-base font-black">+3.17 V</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Winning Combination:</span>
                <span className="font-extrabold text-slate-900">Mg (Anode) + Ag (Cathode)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reaction:</span>
                <span className="font-mono text-[11px] text-sky-800">Mg(s) + 2Ag⁺(aq) → Mg²⁺ + 2Ag(s)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Your Total Score:</span>
                <span className="font-bold text-amber-700 font-mono">{score} / 100 PTS</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleResetChallenge();
                  setShowVictoryModal(false);
                }}
                className="flex-1 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVictoryModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex-1 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLANATION MODAL (Clean 2-Box Format) ─────────────────────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Voltage Master &amp; Electrode Potential Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Topic 03: Electrochemistry • Standard Potentials &amp; Voltage Optimization
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {/* BOX 1 */}
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  1
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-sky-950">
                  The Core Scientific Concept
                </h3>
              </div>
              <p className="text-slate-700">
                Every metal electrode has an intrinsic pull for electrons called its <strong>Standard Reduction Potential (E°)</strong>, measured against the Standard Hydrogen Electrode (SHE = 0.00 V).
              </p>
              <p className="text-sky-950 font-semibold bg-white p-3 rounded-xl border border-sky-100">
                💡 <strong>What this game teaches:</strong> The voltage (EMF) generated by a galvanic cell is simply the gap between the two reduction potentials: <em>E°cell = E°cathode - E°anode</em>. To produce the maximum possible voltage, you must pair the metal with the lowest E° (strongest oxidizer/anode) with the metal with the highest E° (strongest reducer/cathode)!
              </p>
            </div>

            {/* Step-by-Step Learning */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  2
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  What Students Do &amp; Learn Step-by-Step
                </h3>
              </div>

              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 1: The Electrochemical Scale <span className="font-semibold text-slate-500">— Ordering Potentials</span>
                </div>
                <div className="font-mono font-bold text-slate-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-slate-400">
                  Mg²⁺/Mg (-2.37 V) &lt; Zn²⁺/Zn (-0.76 V) &lt; Cu²⁺/Cu (+0.34 V) &lt; Ag⁺/Ag (+0.80 V)
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  • Negative E° means the metal oxidizes more readily than hydrogen (strong reducing agents).<br />
                  • Positive E° means the metal ions pull electrons more strongly than hydrogen (strong oxidizing agents).
                </p>
              </div>

              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 2: Assigning Cathode vs. Anode <span className="font-semibold text-slate-500">— Spontaneity Rule</span>
                </div>
                <div className="font-mono font-bold text-sky-900 text-[11.5px] sm:text-xs pl-2 border-l-2 border-sky-500">
                  Cathode = Higher E° (Reduction) | Anode = Lower E° (Oxidation)
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  For any reaction to produce power spontaneously, <strong>E°cell must be positive (&gt; 0 V)</strong>. If you accidentally reverse the electrodes, E°cell becomes negative, meaning the reaction will not happen on its own!
                </p>
              </div>

              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 3: Calculating Standard EMF for Tested Combinations <span className="font-semibold text-slate-500">— Comparison</span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11.5px] sm:text-xs pl-2 border-l-2 border-slate-300">
                  <div>• <strong>Zn / Cu:</strong> E°cell = +0.34 - (-0.76) = <strong>+1.10 V</strong> (Standard Daniell Cell)</div>
                  <div>• <strong>Cu / Ag:</strong> E°cell = +0.80 - (+0.34) = <strong>+0.46 V</strong></div>
                  <div>• <strong>Mg / Cu:</strong> E°cell = +0.34 - (-2.37) = <strong>+2.71 V</strong></div>
                  <div>• <strong>Mg / Ag (Winner):</strong> E°cell = +0.80 - (-2.37) = <strong>+3.17 V</strong></div>
                </div>
              </div>

              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 4: The Winning Mg / Ag Battery <span className="font-semibold text-slate-500">— Overall Cell Chemistry</span>
                </div>
                <div className="font-mono font-bold text-emerald-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-emerald-500">
                  Mg(s) + 2Ag⁺(aq) → Mg²⁺(aq) + 2Ag(s) &nbsp;&nbsp;(E°cell = +3.17 V)
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Magnesium actively oxidizes at the anode releasing 2 electrons, while two silver ions reduce at the cathode. This enormous potential difference delivers 3.17 V to power high-voltage circuits!
                </p>
              </div>
            </div>

            {/* BOX 2 */}
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  3
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  Key Takeaways for Students
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  <strong>• Fundamental Formula:</strong>{" "}
                  <code className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    E°cell = E°cathode - E°anode
                  </code>
                </p>
                <p>
                  <strong>• Maximum Voltage Rule:</strong> Pair the metal with the lowest reduction potential (most negative) as Anode with the metal with the highest reduction potential (most positive) as Cathode.
                </p>
                <p>
                  <strong>• Spontaneous Criterion:</strong> A galvanic cell generates electrical energy only if E°cell &gt; 0 (which corresponds to ΔG° &lt; 0).
                </p>
                <p>
                  <strong>• IUPAC Cell Notation:</strong>{" "}
                  <code className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Mg(s) | Mg²⁺(aq) || Ag⁺(aq) | Ag(s)
                  </code>
                </p>
              </div>
            </div>
          </div>

          <div className="p-2 border-t border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer text-center block"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
