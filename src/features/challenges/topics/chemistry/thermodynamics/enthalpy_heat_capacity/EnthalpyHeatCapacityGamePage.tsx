"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  X,
  Flame,
  Snowflake,
  Activity,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Beaker,
  Thermometer,
  Zap,
  Target,
  Plus,
  Minus,
} from "lucide-react";

// ============================================================================
// 3D SOLUTE PARTICLES (Dropping & Dissolving)
// ============================================================================
interface SoluteParticle {
  id: string;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: string;
}

const soluteGeo = new THREE.SphereGeometry(0.07, 12, 12);

function SoluteParticleMesh({
  data,
  isDissolved,
  waterYTop,
}: {
  data: SoluteParticle;
  isDissolved: boolean;
  waterYTop: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.3,
        metalness: 0.2,
      }),
    [data.color]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (isDissolved) {
      meshRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), delta * 4);
    } else {
      // Gentle swirling in liquid
      data.pos.addScaledVector(data.vel, delta * 1.5);
      const r = Math.sqrt(data.pos.x * data.pos.x + data.pos.z * data.pos.z);
      if (r > 0.95) {
        data.vel.x = -data.vel.x * 0.9;
        data.vel.z = -data.vel.z * 0.9;
      }
      if (data.pos.y < -1.35) {
        data.pos.y = -1.35;
        data.vel.y = Math.abs(data.vel.y);
      }
      if (data.pos.y > waterYTop - 0.1) {
        data.pos.y = waterYTop - 0.1;
        data.vel.y = -Math.abs(data.vel.y);
      }
      meshRef.current.position.copy(data.pos);
    }
  });

  return <mesh ref={meshRef} geometry={soluteGeo} material={mat} position={data.pos.toArray()} />;
}

// ============================================================================
// 3D INSULATED CALORIMETER WITH TRANSPARENT CUTAWAY FRONT & LIVE WATER LEVEL
// ============================================================================
function InsulatedCalorimeter({
  temp,
  waterMass,
  isStirring,
  soluteActive,
  soluteType,
}: {
  temp: number;
  waterMass: number; // 50 to 250 g
  isStirring: boolean;
  soluteActive: boolean;
  soluteType: "naoh" | "nh4no3";
}) {
  const radius = 1.35;
  const cupHeight = 3.2;
  const cupBottom = -1.5;
  const lidY = cupBottom + cupHeight;

  // Water level scales dynamically with mass: 50 g -> 1.0, 100 g -> 1.8, 250 g -> 2.5
  const waterDepth = useMemo(() => {
    return 0.8 + ((waterMass - 50) / 200) * 1.5;
  }, [waterMass]);

  const waterCenterY = cupBottom + waterDepth / 2;
  const waterTopY = cupBottom + waterDepth;

  // Stirrer animation
  const stirrerRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!stirrerRef.current) return;
    if (isStirring) {
      const t = clock.getElapsedTime();
      stirrerRef.current.position.y = Math.sin(t * 8) * 0.14;
      stirrerRef.current.rotation.y = t * 4.5;
    } else {
      stirrerRef.current.position.y = 0;
    }
  });

  // Dynamic thermal hue: Normal -> Sky Blue; Hot -> Warm Amber-Orange; Cold -> Crisp Icy Blue
  const waterColor = useMemo(() => {
    if (temp > 25.5) {
      const factor = Math.min(1.0, (temp - 25) / 12);
      return new THREE.Color("#0284C7").lerp(new THREE.Color("#FB923C"), factor * 0.85);
    } else if (temp < 24.5) {
      const factor = Math.min(1.0, (25 - temp) / 10);
      return new THREE.Color("#0284C7").lerp(new THREE.Color("#38BDF8"), factor * 0.85);
    }
    return new THREE.Color("#0284C7");
  }, [temp]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Heavy Insulated Calorimeter Base */}
      <mesh position={[0, cupBottom - 0.22, 0]}>
        <cylinderGeometry args={[1.75, 1.95, 0.32, 64]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* 2. Top & Bottom Solid Blue Collar Rings */}
      <mesh position={[0, lidY, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.12, 48]} />
        <meshStandardMaterial color="#0284C7" roughness={0.2} metalness={0.5} />
      </mesh>
      <mesh position={[0, cupBottom, 0]}>
        <cylinderGeometry args={[radius * 1.05, radius * 1.05, 0.12, 48]} />
        <meshStandardMaterial color="#0284C7" roughness={0.2} metalness={0.5} />
      </mesh>

      {/* 3. Fully Transparent Glass Chamber Cylinder (No white cover blocking water) */}
      <mesh position={[0, cupBottom + cupHeight / 2, 0]}>
        <cylinderGeometry args={[radius, radius, cupHeight * 0.98, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#E0F2FE"
          transparent
          opacity={0.25}
          roughness={0.05}
          transmission={0.94}
          ior={1.48}
          thickness={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Subtle Rear Glass Reflection Arc (for realistic glass depth without blocking) */}
      <mesh position={[0, cupBottom + cupHeight / 2, 0]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry
          args={[radius * 1.01, radius * 1.01, cupHeight * 0.98, 48, 1, true, -Math.PI * 0.4, Math.PI * 0.8]}
        />
        <meshPhysicalMaterial
          color="#BAE6FD"
          transparent
          opacity={0.15}
          roughness={0.1}
          transmission={0.85}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 5. Dynamic Water Liquid Body (Responds live to 'waterMass' slider) */}
      <mesh position={[0, waterCenterY, 0]}>
        <cylinderGeometry args={[radius * 0.97, radius * 0.97, waterDepth, 36]} />
        <meshStandardMaterial
          color={waterColor}
          transparent
          opacity={0.75}
          roughness={0.15}
        />
      </mesh>

      {/* Liquid Top Surface / Meniscus */}
      <mesh position={[0, waterTopY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.96, 36]} />
        <meshStandardMaterial color={waterColor} transparent opacity={0.88} roughness={0.1} />
      </mesh>

      {/* Engraved Volume / Mass Label on Glass Front */}
      <group position={[0, waterTopY, radius * 0.98]}>
        <Text fontSize={0.10} color="#0F172A" anchorX="center" fontWeight="bold">
          — {waterMass} g H₂O —
        </Text>
      </group>

      {/* 6. Top Insulated Calorimeter Lid (Cover) */}
      <mesh position={[0, lidY + 0.08, 0]}>
        <cylinderGeometry args={[radius * 1.04, radius * 1.04, 0.16, 48]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Central Handle / Port on Lid */}
      <mesh position={[0, lidY + 0.22, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.14, 24]} />
        <meshStandardMaterial color="#0284C7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* 7. Stirring Rod Assembly (Centered shaft with bottom disc/impeller) */}
      <group position={[0, lidY, 0]}>
        {/* Animated Stirrer Rod & Disc */}
        <group ref={stirrerRef}>
          {/* Vertical Shaft */}
          <mesh position={[0, -1.2, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 2.7, 16]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Bottom Stirrer Plate/Disc */}
          <mesh position={[0, -2.45, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
            <meshStandardMaterial color="#0284C7" metalness={0.7} roughness={0.2} />
          </mesh>
          {/* Top Blue Knob */}
          <mesh position={[0, 0.40, 0]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#0284C7" roughness={0.2} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* 8. Digital Thermometer Probe (Passes through left port in lid) */}
      <group position={[-0.65, lidY, 0.2]}>
        {/* Rubber Collar Port */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.14, 16]} />
          <meshStandardMaterial color="#0F172A" roughness={0.7} />
        </mesh>

        {/* Stainless Steel Sensor Probe immersed in liquid */}
        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 2.4, 16]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Digital Thermometer Head / LCD Display Box */}
        <group position={[0, 0.65, 0]}>
          {/* Outer Housing */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.82, 0.58, 0.24]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.5} />
          </mesh>

          {/* LCD Screen Glass */}
          <mesh position={[0, 0.04, 0.125]}>
            <planeGeometry args={[0.70, 0.38]} />
            <meshBasicMaterial color="#0B132B" />
          </mesh>

          {/* LCD Temperature Readout */}
          <Text position={[0, 0.08, 0.13]} fontSize={0.16} color="#38BDF8" anchorX="center" fontWeight="bold">
            {temp.toFixed(1)}°C
          </Text>
          <Text position={[0, -0.08, 0.13]} fontSize={0.065} color="#94A3B8" anchorX="center">
            DIGITAL PROBE
          </Text>

          {/* Subtle status LED indicator */}
          <mesh position={[0.28, 0.18, 0.13]}>
            <circleGeometry args={[0.025, 16]} />
            <meshBasicMaterial color={temp > 25.5 ? "#F97316" : temp < 24.5 ? "#38BDF8" : "#22C55E"} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function EnthalpyHeatCapacityGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen state navigation: "mission" -> "instructions" -> "lab"
  const [screenState, setScreenState] = useState<"mission" | "instructions" | "lab">("mission");

  // Modals
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showIncorrectModal, setShowIncorrectModal] = useState<boolean>(false);
  const [incorrectFeedback, setIncorrectFeedback] = useState<string>("");

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);
  const victoryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------------------------------------------------------------------
  // Calorimetry Game State (Option A: Target Heat Challenge)
  // Target: q = +4180 J (Exothermic). Formula: q = m * c * ΔT
  // --------------------------------------------------------------------------
  const TARGET_Q = 4180; // J (Standard textbook mission)
  const specificHeat = 4.18; // J/g°C
  const tempInitial = 25.0; // °C

  // User interactive variables
  const [waterMass, setWaterMass] = useState<number>(125); // 50 g to 200 g (default 125 g)
  const [soluteType, setSoluteType] = useState<"naoh" | "nh4no3">("naoh");
  const [soluteDose, setSoluteDose] = useState<number>(2); // Default 2g

  // Physical simulation state
  const [currentTemp, setCurrentTemp] = useState<number>(25.0);
  const [isReacting, setIsReacting] = useState<boolean>(false);
  const [isStirring, setIsStirring] = useState<boolean>(false);
  const [soluteActive, setSoluteActive] = useState<boolean>(false);

  // User classification selection (default ENDO as requested)
  const [selectedType, setSelectedType] = useState<"exothermic" | "endothermic">("endothermic");

  // Physics calculation:
  // Solid NaOH ΔH_sol ≈ -41.8 kJ/mol (Mw = 40 g/mol -> -1045 J per gram of NaOH)
  // Heat released into water Q_water = +1045 J * dose
  // ΔT = Q_water / (m * c)
  // For NaOH with dose=4g and m=100g: Q = +4180 J, ΔT = 4180 / (100 * 4.18) = +10.0 °C -> Tf = 35.0 °C (Exact match!)
  // For NH4NO3: absorbs 320 J/g (Endothermic)
  const theoreticalQ = useMemo(() => {
    if (soluteType === "naoh") {
      return Math.round(soluteDose * 1045);
    } else {
      return Math.round(-soluteDose * 731.5);
    }
  }, [soluteType, soluteDose]);

  const targetTf = useMemo(() => {
    const deltaT = theoreticalQ / (waterMass * specificHeat);
    return Number((tempInitial + deltaT).toFixed(1));
  }, [theoreticalQ, waterMass, specificHeat, tempInitial]);

  // Delta T based on current measured temperature
  const deltaT = useMemo(() => {
    return Number((currentTemp - tempInitial).toFixed(1));
  }, [currentTemp, tempInitial]);

  // Live measured heat transferred: q = m * c * ΔT
  const measuredQ = useMemo(() => {
    return Math.round(waterMass * specificHeat * deltaT);
  }, [waterMass, specificHeat, deltaT]);

  // Water top level for particle boundaries
  const waterYTop = useMemo(() => {
    return -1.5 + (0.8 + ((waterMass - 50) / 200) * 1.5);
  }, [waterMass]);

  // Generate particles based on solute type and dose
  const particles = useMemo<SoluteParticle[]>(() => {
    const count = Math.min(32, Math.max(12, soluteDose * 5));
    return Array.from({ length: count }).map((_, i) => ({
      id: `sp-${i}`,
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        waterYTop - 0.2 - Math.random() * 0.8,
        (Math.random() - 0.5) * 1.4
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7
      ).normalize(),
      color: soluteType === "naoh" ? "#F8FAFC" : "#E0F2FE",
    }));
  }, [soluteType, soluteDose, waterYTop]);

  // Universal Exit Handler
  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      window.history.back();
    }
  };

  // Smooth temperature ramp when reaction is triggered
  useEffect(() => {
    if (!isReacting) return;
    const interval = setInterval(() => {
      setCurrentTemp((prev) => {
        const diff = targetTf - prev;
        if (Math.abs(diff) <= 0.15) {
          clearInterval(interval);
          setIsReacting(false);
          setIsStirring(false);
          setNotification(`Reaction reached thermal equilibrium: T_f = ${targetTf.toFixed(1)}°C.`);

          // Check if J reached target (+4180 J); if so, show victory popup after 1 second
          const finalDeltaT = Number((targetTf - tempInitial).toFixed(1));
          const finalQ = Math.round(waterMass * specificHeat * finalDeltaT);
          if (Math.abs(finalQ - TARGET_Q) < 30) {
            if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
            victoryTimerRef.current = setTimeout(() => {
              setShowVictoryModal(true);
            }, 1000);
          }

          return targetTf;
        }
        const step = diff > 0 ? 0.25 : -0.25;
        return Number((prev + step).toFixed(1));
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isReacting, targetTf, waterMass, specificHeat, tempInitial, TARGET_Q]);

  // Trigger Stir & Reaction
  const handleStirAndReact = () => {
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    setSoluteActive(true);
    setIsStirring(true);
    setIsReacting(true);
    setNotification(
      soluteType === "naoh"
        ? `Stirring ${soluteDose}g NaOH into ${waterMass}g H₂O... Exothermic dissolution releasing heat!`
        : `Stirring ${soluteDose}g NH₄NO₃ into ${waterMass}g H₂O... Endothermic dissolution absorbing heat!`
    );
  };

  // Reset Experiment
  const handleReset = () => {
    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
    setWaterMass(125);
    setCurrentTemp(25.0);
    setIsReacting(false);
    setIsStirring(false);
    setSoluteActive(false);
    setSelectedType("endothermic");
    setSoluteDose(2);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
    setNotification(`Calorimeter reset to initial state (125 g H₂O at 25.0°C).`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Verify Answer for Target Goal
  const handleCheckAnswer = () => {
    const isQMatched = Math.abs(measuredQ - TARGET_Q) < 30;
    const isTypeCorrect = selectedType === "exothermic";

    if (isQMatched && isTypeCorrect) {
      setShowVictoryModal(true);
    } else {
      if (!isQMatched && !isTypeCorrect) {
        setIncorrectFeedback(
          `Target is +${TARGET_Q} J (Exothermic). Currently measured q = ${measuredQ} J. Select NaOH, tune water mass m = 100 g and dose = 4 g, then verify reaction type as EXOTHERMIC!`
        );
      } else if (!isQMatched) {
        setIncorrectFeedback(
          `Heat transferred is ${measuredQ} J, but target is +${TARGET_Q} J! Hint: q = m · c · ΔT. Try setting water mass m = 100 g with 4 g of NaOH, then stir to dissolve.`
        );
      } else {
        setIncorrectFeedback(
          `Heat transferred of +${TARGET_Q} J is correct, but check your reaction type! When heat is released into the water (temperature increases), the reaction is EXOTHERMIC.`
        );
      }
      setShowIncorrectModal(true);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#070D1E] p-0 sm:p-2 select-none overflow-hidden font-sans">
      <div className="w-full h-full max-w-[440px] max-h-[956px] bg-white rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-2xl flex flex-col justify-between overflow-hidden relative">

        {/* ─── TOAST NOTIFICATION ─── */}
        {notification && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-lg border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none text-center max-w-[90%]">
            {notification}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 1: MISSION SCREEN
            ══════════════════════════════════════════════════════════════════ */}
        {screenState === "mission" && (
          <div className="w-full h-full flex flex-col justify-between items-center p-6 relative bg-white">
            {/* Top Bar with EXIT button */}
            <div className="w-full flex items-center justify-start z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>EXIT</span>
              </button>
            </div>

            {/* Central Mission Statement */}
            <div className="max-w-md w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                <span className="text-[#0284C7] font-extrabold uppercase">MISSION:</span> Adjust water and chemical dose to reach target heat energy{" "}
                <span className="text-amber-500 font-extrabold">q = +{TARGET_Q} J</span>!
              </h2>

              <div className="mt-8 flex justify-center w-full">
                <button
                  type="button"
                  onClick={() => setScreenState("instructions")}
                  className="flex items-center justify-center gap-1.5 w-44 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom branding logo mark */}
            <div className="w-full flex justify-start z-10 shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-black text-sm shadow-md">
                N
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 2: INSTRUCTIONS SCREEN
            ══════════════════════════════════════════════════════════════════ */}
        {screenState === "instructions" && (
          <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden">
            {/* Top Bar with EXIT and INSTRUCTIONS TO PLAY below it */}
            <div className="w-full flex flex-col items-center z-10 shrink-0">
              <div className="w-full flex items-center justify-start">
                <button
                  type="button"
                  onClick={handleExitClick}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>EXIT</span>
                </button>
              </div>
              <div className="mt-2 sm:mt-2.5 px-4 py-1.5 rounded-full bg-[#0B132B] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-md border border-slate-700/50">
                INSTRUCTIONS TO PLAY
              </div>
            </div>

            {/* 3 Step Guidance Cards */}
            <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1 mt-1 sm:mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">

                {/* Card 1: Adjust Water Mass & Chemical Solute */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Set Mass &amp; Substance
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Adjust the water mass and NaOH mass sliders for your experiment.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/calorimetry_step1_controls.png"
                      alt="Calorimeter Dock Controls"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Stir & Observe Temperature Change */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Stir &amp; Observe Chamber
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Tap Stir &amp; Dissolve to mix. Watch the crystals dissolve and read the final temperature on the digital probe.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/calorimetry_step2_chamber.png"
                      alt="Calorimeter 3D Chamber"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Match Heat Target & Verify */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Check Heat &amp; Verify
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Track your heat energy in the HUD and tap Stir &amp; Dissolve to verify!
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/calorimetry_step3_hud.png"
                      alt="Calorimetry HUD"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions: Closely spaced */}
            <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-3 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setScreenState("mission")}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-5 sm:px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenState("lab")}
                className="flex items-center gap-1.5 h-8 sm:h-9 px-6 sm:px-7 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 3: INTERACTIVE 3D CALORIMETRY SIMULATION LAB
            ══════════════════════════════════════════════════════════════════ */}
        {screenState === "lab" && (
          <div className="w-full h-full flex flex-col justify-between relative bg-white overflow-hidden">
            {/* Top Integrated Header Bar */}
            <div className="w-full flex items-center justify-between px-3 sm:px-5 py-2.5 z-30 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>EXIT</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>

            {/* 3D Canvas Area */}
            <div className="w-full flex-1 relative flex items-center justify-center overflow-hidden">
              <Canvas
                camera={{ position: [0, 1.35, 12.8], fov: 32 }}
                className="w-full h-full"
                gl={{ antialias: true, alpha: true }}
                shadows
              >
                <ambientLight intensity={1.15} />
                <directionalLight position={[4, 8, 4]} intensity={1.6} castShadow />
                <directionalLight position={[-4, -3, -3]} intensity={0.6} color="#BAE6FD" />

                <Suspense fallback={null}>
                  <group position={[0, 0.40, 0]}>
                    <InsulatedCalorimeter
                      temp={currentTemp}
                      waterMass={waterMass}
                      isStirring={isStirring}
                      soluteActive={soluteActive}
                      soluteType={soluteType}
                    />
                    {soluteActive &&
                      particles.map((p) => (
                        <SoluteParticleMesh
                          key={p.id}
                          data={p}
                          isDissolved={!isReacting && currentTemp !== 25.0}
                          waterYTop={waterYTop}
                        />
                      ))}
                  </group>
                </Suspense>

                <OrbitControls
                  target={[0, 0.40, 0]}
                  enablePan={false}
                  minDistance={6.0}
                  maxDistance={18.0}
                  maxPolarAngle={Math.PI / 2 + 0.1}
                  minPolarAngle={Math.PI / 4}
                />
              </Canvas>

              {/* Digital Calorimetry HUD Box - Horizontal Layout */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-[420px] bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-xl space-y-1.5 animate-in fade-in duration-200">
                
                <div className="flex justify-start items-center border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-extrabold text-[9px] sm:text-[10px] text-slate-800 tracking-wider uppercase">
                      CALORIMETRY HUD
                    </span>
                  </div>
                </div>

                {/* Horizontal Row: Digital Display on Left, Check Answer Button on Right */}
                <div className="flex items-stretch gap-2">
                  {/* Digital Display Box */}
                  <div className="flex-1 bg-[#0B132B] rounded-xl px-3 py-1 text-center text-white border border-slate-800 shadow-inner flex flex-col justify-center">
                    <div className="font-mono font-black text-base sm:text-lg text-amber-400 tracking-tight leading-none py-0.5">
                      {measuredQ >= 0 ? `+${measuredQ}` : measuredQ} J
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      m: {waterMass}g • ΔT: {deltaT >= 0 ? `+${deltaT}` : deltaT}°C
                    </div>
                  </div>

                  {/* STIR & DISSOLVE BUTTON (Replaces CHECK ANSWER) */}
                  <button
                    type="button"
                    disabled={isReacting}
                    onClick={handleStirAndReact}
                    className={`w-36 sm:w-40 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-[0.98] shrink-0 ${
                      isReacting
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-[#0284C7] hover:bg-[#0369A1] shadow-sky-600/30"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{isReacting ? "STIRRING..." : "STIR & DISSOLVE"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                BOTTOM CONTROL DOCK (Water Mass Slider, Solute & Dose)
                ══════════════════════════════════════════════════════════════ */}
            <div className="w-full bg-white border-t border-slate-100 px-3 sm:px-4 pt-2.5 pb-4 sm:pb-5 z-30 shrink-0 flex flex-col gap-2.5">
              
              {/* Row 1: Water Mass Slider (m) */}
              <div className="flex items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  <Beaker className="w-3.5 h-3.5 text-sky-600" />
                  WATER MASS (M):
                </span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="25"
                  disabled={isReacting}
                  value={waterMass}
                  onChange={(e) => {
                    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
                    setWaterMass(Number(e.target.value));
                    if (soluteActive) setSoluteActive(false);
                    setCurrentTemp(25.0);
                  }}
                  className="w-full accent-sky-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-xs font-mono font-black text-sky-700 bg-sky-100 px-2.5 py-1 rounded-md shrink-0">
                  {waterMass} g
                </span>
              </div>

              {/* Row 2: NaOH Mass Slider (g) */}
              <div className="flex items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  NaOH MASS (g):
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  disabled={isReacting}
                  value={soluteDose}
                  onChange={(e) => {
                    if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current);
                    setSoluteType("naoh");
                    setSoluteDose(Number(e.target.value));
                    if (soluteActive) setSoluteActive(false);
                    setCurrentTemp(25.0);
                  }}
                  className="w-full accent-orange-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-xs font-mono font-black text-orange-700 bg-orange-100 px-2.5 py-1 rounded-md shrink-0">
                  {soluteDose} g
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VICTORY MODAL (Side-by-side REPLAY & EXPLANATION)
            ══════════════════════════════════════════════════════════════════ */}
        {showVictoryModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-emerald-100 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                <Trophy className="w-7 h-7" />
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-emerald-200/60">
                MISSION ACCOMPLISHED
              </span>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                Enthalpy Mastered!
              </h3>

              <p className="text-slate-600 text-xs font-medium leading-relaxed mb-6">
                You successfully dissolved 4g of NaOH in 100g of water, producing exactly{" "}
                <strong className="text-emerald-700">+{TARGET_Q} J</strong> of heat transfer and correctly identifying the process as an{" "}
                <strong className="text-emerald-700">Exothermic</strong> reaction!
              </p>

              {/* Side-by-side REPLAY and EXPLANATION buttons */}
              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>REPLAY</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowVictoryModal(false);
                    setShowExplanationModal(true);
                  }}
                  className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 fill-current" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            INCORRECT MODAL (Side-by-side TRY AGAIN & EXPLANATION)
            ══════════════════════════════════════════════════════════════════ */}
        {showIncorrectModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl border border-rose-100 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-4 text-rose-600 shadow-inner">
                <AlertCircle className="w-7 h-7" />
              </div>

              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-rose-200/60">
                NOT QUITE RIGHT
              </span>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                Check Your Values
              </h3>

              <p className="text-slate-600 text-xs font-medium leading-relaxed mb-6">
                {incorrectFeedback}
              </p>

              {/* Side-by-side TRY AGAIN and EXPLANATION buttons */}
              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowIncorrectModal(false)}
                  className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>TRY AGAIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowIncorrectModal(false);
                    setShowExplanationModal(true);
                  }}
                  className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <BookOpen className="w-3.5 h-3.5 fill-current" />
                  <span>EXPLANATION</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NON-BOXED EDITORIAL EXPLANATION VIEW
            ══════════════════════════════════════════════════════════════════ */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    Calorimetry &amp; Enthalpy Change
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    Topic Guide &amp; Physical Concepts
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editorial Content (Increased Font Size for Enhanced Readability) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7 text-slate-700 text-sm leading-relaxed max-w-xl mx-auto">
              
              {/* CONCEPT 1 */}
              <section className="space-y-2.5">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Concept 1: The Golden Calorimetry Formula
                </h4>
                <p className="text-sm text-slate-600">
                  Whenever you want to know how much heat (<strong>q</strong>) entered or left the water, you multiply three numbers:
                </p>
                <div className="py-3 text-center text-slate-900 font-mono font-black text-base sm:text-lg bg-slate-50 border-y border-slate-200/80 tracking-wider rounded-lg">
                  q = m &times; c &times; &Delta;T
                </div>
                <ul className="list-disc list-inside space-y-2 pl-1 pt-1 text-sm text-slate-700">
                  <li>
                    <strong>m (Mass of water):</strong> How heavy the water is in grams (e.g., 100 g).
                  </li>
                  <li>
                    <strong>c (Specific Heat Capacity):</strong> For water, this is always <strong>4.18 J/g&middot;&deg;C</strong>. It means: water needs 4.18 Joules of heat to raise 1 gram by 1&deg;C.
                  </li>
                  <li>
                    <strong>&Delta;T (Temperature Change):</strong> Calculated as <strong>&Delta;T = T<sub>final</sub> &minus; T<sub>initial</sub></strong> (final temperature measured on the probe minus the initial 25.0&deg;C room temperature).
                  </li>
                </ul>
              </section>

              {/* CONCEPT 2 */}
              <section className="space-y-2.5">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Concept 2: Exothermic Dissolution (NaOH)
                </h4>
                <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200/70 text-sm">
                  <strong className="text-orange-700 font-extrabold text-sm block mb-1">
                    Exothermic &mdash; Heat Released into Water:
                  </strong>
                  Dissolving solid <strong>NaOH</strong> in water releases thermal energy. The solution warms up (25.0&deg;C &rarr; 35.0&deg;C), the temperature change is positive (&Delta;T &gt; 0), and heat transferred is positive (<strong>q &gt; 0</strong>).
                </div>
              </section>

              {/* CONCEPT 3 */}
              <section className="space-y-2.5">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">
                  Concept 3: How NaOH Mass and Water Mass Affect q
                </h4>
                <p className="text-sm font-semibold text-slate-800">
                  More grams of NaOH = More heat produced:
                </p>
                <div className="font-mono text-xs sm:text-sm bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-slate-800">
                  <div>&bull; 1 g NaOH = +1045 J</div>
                  <div>&bull; 2 g NaOH = +2090 J</div>
                  <div className="text-emerald-700 font-black">&bull; 4 g NaOH = +4180 J (Target to reach!)</div>
                </div>
                <p className="pt-1 text-sm text-slate-700">
                  <strong>Water Mass (m):</strong> Keeping water at <strong>100 g</strong> causes &Delta;T to rise by exactly <strong>+10.0&deg;C</strong> when 4 g of NaOH is dissolved.
                </p>
              </section>

              {/* HOW TO PLAY */}
              <section className="space-y-3 border-t border-slate-200/80 pt-5">
                <h4 className="text-lg font-black text-[#0284C7] tracking-tight">
                  How to Play &amp; Win
                </h4>
                <p className="font-bold text-sm text-slate-900">
                  Your mission goal is: <span className="text-amber-600 font-black">TARGET q = +4180 J</span>. Follow these 3 steps in the lab:
                </p>
                <ol className="list-decimal list-inside space-y-2.5 pl-1 text-sm text-slate-700">
                  <li>
                    <strong>Set Water Mass (m):</strong> Drag the <strong>WATER MASS (M)</strong> slider to <strong>100 g</strong>. The 3D water level adjusts dynamically.
                  </li>
                  <li>
                    <strong>Set NaOH Mass (g):</strong> Drag the <strong>NaOH MASS (g)</strong> slider to <strong>4 g</strong> (1 g yields ~1045 J, so 4 g produces +4180 J).
                  </li>
                  <li>
                    <strong>Stir &amp; Dissolve:</strong> Tap <strong>STIR &amp; DISSOLVE</strong> in the Calorimetry HUD. As soon as thermal equilibrium reaches <strong>+4180 J</strong>, your answer is verified automatically!
                  </li>
                </ol>
              </section>

            </div>

            {/* Footer */}
            <div className="w-full px-5 py-3.5 border-t border-slate-100 flex items-center justify-center relative shrink-0 bg-white">
              {/* Left branding logo mark */}
              <div className="absolute left-5 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md">
                N
              </div>

              {/* Blue Pill: RESUME CHALLENGE (Centered) */}
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-7 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <span>RESUME CHALLENGE</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
