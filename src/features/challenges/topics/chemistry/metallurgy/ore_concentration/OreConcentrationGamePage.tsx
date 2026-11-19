"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import SeparationPlant3D from "./SeparationPlant3D";
import {
  ArrowLeft,
  BookOpen,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  ChevronRight,
  Play,
  Waves,
  Magnet,
  Sparkles,
  FlaskConical,
  Layers,
  Award,
  Target,
  Lock,
  Unlock
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

interface OreConcentrationGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

// Concentration Methods
type SeparationMethod = "hydraulic" | "magnetic" | "froth" | "leaching";

interface OreSample {
  id: string;
  name: string;
  formula: string;
  gangueType: string;
  metal: string;
  color: string;
  densityDesc: string; // e.g. "Heavy (5.2 g/cm³)" vs gangue "Light (2.6 g/cm³)"
  magneticDesc: string; // e.g. "Ferromagnetic" vs "Non-magnetic"
  wettingDesc: string; // e.g. "Wetted preferentially by Pine Oil" vs "Wetted by Water"
  solubilityDesc: string; // e.g. "Soluble in hot NaOH" vs "Insoluble"
  correctMethod: SeparationMethod;
  explanation: string;
  realLifeAnalogy: string;
}

const ORE_SAMPLES: OreSample[] = [
  {
    id: "cassiterite",
    name: "Tin Stone (Cassiterite)",
    formula: "SnO₂",
    gangueType: "Lighter Quartz Sand (SiO₂)",
    metal: "Tin (Sn)",
    color: "#475569", // Dark dense metallic cassiterite
    densityDesc: "Very Heavy (7.0 g/cm³) vs Light Gangue (2.4 g/cm³)",
    magneticDesc: "Non-Magnetic (Diamagnetic)",
    wettingDesc: "Wetted by water",
    solubilityDesc: "Resistant to cold reagents",
    correctMethod: "hydraulic",
    explanation: "Tin stone (SnO₂) is an oxide ore with a very high specific gravity (~7.0). An upward or cascading stream of running water washes away the much lighter gangue particles while heavy tin ore settles into riffles on the grooved Wilfley table.",
    realLifeAnalogy: "Like an old-time gold prospector swirling a pan in a mountain stream: heavy gold stays seated in the pan ridges while light gravel is washed away by the current."
  },
  {
    id: "galena",
    name: "Galena",
    formula: "PbS",
    gangueType: "Silica / Rock Sand (SiO₂)",
    metal: "Lead (Pb)",
    color: "#334155",
    densityDesc: "Dense (7.5 g/cm³)",
    magneticDesc: "Non-Magnetic",
    wettingDesc: "Hydrophobic: preferentially wetted by Pine Oil / Collector",
    solubilityDesc: "Insoluble in dilute bases/water",
    correctMethod: "froth",
    explanation: "Galena is a sulfide ore (PbS). Sulfide ores are wetted preferentially by pine oil collectors, hitching a ride on air bubbles to the surface froth, leaving rocky gangue behind!",
    realLifeAnalogy: "Like blowing dish soap bubbles that selectively attach to greasy food particles while clean water rinses dirt down the drain."
  },
  {
    id: "magnetite",
    name: "Magnetite",
    formula: "Fe₃O₄",
    gangueType: "Siliceous Gangue (Quartz / Clay)",
    metal: "Iron (Fe)",
    color: "#0F172A",
    densityDesc: "Dense (5.18 g/cm³)",
    magneticDesc: "Strongly Magnetic (Ferromagnetic)",
    wettingDesc: "Wetted by water (hydrophilic)",
    solubilityDesc: "Insoluble in neutral water",
    correctMethod: "magnetic",
    explanation: "Magnetite is strongly magnetic! When fed onto a conveyor belt equipped with a magnetic roller, magnetic Fe₃O₄ clings to the roller and drops into a near-side hopper while non-magnetic rocky gangue flies off tangentially.",
    realLifeAnalogy: "Like using a handheld magnet or junkyard electromagnet to swiftly pluck steel paperclips or car parts out of sawdust."
  },
  {
    id: "bauxite",
    name: "Bauxite",
    formula: "Al₂O₃ · 2H₂O",
    gangueType: "Iron Oxides (Fe₂O₃), Silica (SiO₂), TiO₂",
    metal: "Aluminium (Al)",
    color: "#EA580C",
    densityDesc: "Similar density to gangue (~2.6 g/cm³)",
    magneticDesc: "Non-Magnetic (gangue has slight impurities)",
    wettingDesc: "Similar surface wettability to gangue",
    solubilityDesc: "Amphoteric: dissolves in hot conc. NaOH to form soluble Sodium Aluminate [NaAl(OH)₄]",
    correctMethod: "leaching",
    explanation: "Physical methods fail because Bauxite and its gangue have similar densities and magnetic properties. Chemical leaching (Bayer's process) selectively dissolves Al₂O₃ in hot concentrated NaOH, leaving insoluble red mud gangue behind to be filtered off!",
    realLifeAnalogy: "Like making brewed coffee or tea: hot water selectively dissolves rich aromatic coffee compounds from the crushed beans, leaving behind the solid spent coffee grounds."
  }
];

export default function OreConcentrationGamePage({
  difficulty = "easy",
  onExit,
}: OreConcentrationGamePageProps) {
  // Navigation Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Current Challenge Sample Index
  const [sampleIndex, setSampleIndex] = useState<number>(0);
  const currentOre = ORE_SAMPLES[sampleIndex];

  // Highest Unlocked Level Index (0: L1 unlocked, 1: L2 unlocked, 2: L3 unlocked, 3: L4 unlocked)
  const [unlockedLevel, setUnlockedLevel] = useState<number>(0);

  // Selected Method
  const [selectedMethod, setSelectedMethod] = useState<SeparationMethod | null>(null);

  // Sliders for Hydraulic Washing (Water Flow & Pulse Speed)
  const [waterFlow, setWaterFlow] = useState<number>(70); // 10 to 100
  const [pulseSpeed, setPulseSpeed] = useState<number>(65); // 10 to 100

  // Simulation Running State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0); // 0 to 100
  const [isSeparated, setIsSeparated] = useState<boolean>(false);
  const [separationQuality, setSeparationQuality] = useState<"none" | "success" | "fail">("none");

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState<string>("");

  // Canvas ref for dynamic particle physics
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Particles for 3D/dynamic separation animation
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      isOre: boolean;
      size: number;
      color: string;
      phase: number;
    }>
  >([]);

  // Exit Handler
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Initialize Particles whenever ore changes or reset
  const initParticles = () => {
    const list: typeof particlesRef.current = [];
    // 35 Ore particles + 35 Gangue particles
    for (let i = 0; i < 35; i++) {
      list.push({
        x: 45 + Math.random() * 50,
        y: 35 + Math.random() * 30,
        vx: 0,
        vy: 0,
        isOre: true,
        size: 3.5 + Math.random() * 2,
        color: currentOre.color,
        phase: Math.random() * Math.PI * 2
      });
    }
    for (let i = 0; i < 35; i++) {
      list.push({
        x: 45 + Math.random() * 50,
        y: 35 + Math.random() * 30,
        vx: 0,
        vy: 0,
        isOre: false,
        size: 2.5 + Math.random() * 2,
        color: "#94A3B8", // gray rocky gangue
        phase: Math.random() * Math.PI * 2
      });
    }
    particlesRef.current = list;
  };

  useEffect(() => {
    initParticles();
    setSelectedMethod(null);
    setIsSimulating(false);
    setSimProgress(0);
    setIsSeparated(false);
    setSeparationQuality("none");
  }, [sampleIndex]);

  // Canvas dynamic renderer based on current method and progress
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localFrame = 0;

    // Preload method images for 3D simulation
    const images: Record<SeparationMethod, HTMLImageElement> = {
      hydraulic: new Image(),
      magnetic: new Image(),
      froth: new Image(),
      leaching: new Image()
    };
    images.hydraulic.src = "/images/3d_hydraulic_plant.jpg";
    images.magnetic.src = "/images/3d_magnetic_roller.jpg";
    images.froth.src = "/images/3d_froth_cell.jpg";
    images.leaching.src = "/images/3d_chemical_leaching.jpg";

    const render = () => {
      localFrame++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const activeMethod = selectedMethod || "hydraulic";
      const bgImg = images[activeMethod];

      // Render high-definition 3D Plant visual
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, w, h);
      } else {
        // Subtle futuristic grid backdrop fallback
        ctx.fillStyle = "#0F172A";
        ctx.fillRect(0, 0, w, h);
      }

      // ── PARTICLE PHYSICS SIMULATION ──
      const particles = particlesRef.current;
      const isCorrectMethod = selectedMethod === currentOre.correctMethod;

      particles.forEach((p) => {
        if (!isSimulating && !isSeparated) {
          // Pre-separation: Floating feed pile over the intake
          if (activeMethod === "hydraulic") {
            p.x = w * 0.45 + Math.sin(p.phase + localFrame * 0.03) * 35;
            p.y = h * 0.32 + Math.cos(p.phase * 1.5 + localFrame * 0.02) * 18;
          } else if (activeMethod === "magnetic") {
            p.x = w * 0.28 + Math.sin(p.phase + localFrame * 0.03) * 35;
            p.y = h * 0.32 + Math.cos(p.phase * 1.5 + localFrame * 0.02) * 15;
          } else if (activeMethod === "froth") {
            p.x = w * 0.45 + Math.sin(p.phase + localFrame * 0.03) * 45;
            p.y = h * 0.55 + Math.cos(p.phase * 1.5 + localFrame * 0.02) * 20;
          } else {
            // Leaching
            p.x = w * 0.50 + Math.sin(p.phase + localFrame * 0.03) * 35;
            p.y = h * 0.55 + Math.cos(p.phase * 1.5 + localFrame * 0.02) * 20;
          }
        } else {
          // Simulating or Separated
          if (activeMethod === "hydraulic") {
            if (isCorrectMethod) {
              if (p.isOre) {
                // Heavy ore stays in upper grooved deck
                const targetX = w * 0.38 + ((p.phase * 50) % (w * 0.22));
                const targetY = h * 0.42 + Math.sin(p.phase * 3) * 12;
                p.x += (targetX - p.x) * 0.08;
                p.y += (targetY - p.y) * 0.08;
              } else {
                // Light gangue washed down into water basin below
                const targetX = w * 0.32 + Math.sin(p.phase * 2) * 50;
                const targetY = h * 0.68 + Math.cos(p.phase * 2) * 14;
                p.x += (targetX - p.x) * 0.06;
                p.y += (targetY - p.y) * 0.06;
              }
            } else {
              // Mismatch: All wash into bottom water pool
              const targetX = w * 0.40 + Math.sin(p.phase) * 60;
              const targetY = h * 0.68 + Math.cos(p.phase) * 15;
              p.x += (targetX - p.x) * 0.05;
              p.y += (targetY - p.y) * 0.05;
            }
          } else if (activeMethod === "magnetic") {
            if (isCorrectMethod) {
              if (p.isOre) {
                // Magnetic concentrate chute (clings around roller into near chute)
                const targetX = w * 0.58 + Math.sin(p.phase) * 20;
                const targetY = h * 0.65 + Math.cos(p.phase) * 12;
                p.x += (targetX - p.x) * 0.08;
                p.y += (targetY - p.y) * 0.08;
              } else {
                // Non-magnetic tailings chute (thrown forward into right chute)
                const targetX = w * 0.72 + Math.sin(p.phase) * 18;
                const targetY = h * 0.55 + Math.cos(p.phase) * 14;
                p.x += (targetX - p.x) * 0.08;
                p.y += (targetY - p.y) * 0.08;
              }
            } else {
              // Mismatch: Both fall in the same chute together
              const targetX = w * 0.70 + Math.sin(p.phase) * 25;
              const targetY = h * 0.58;
              p.x += (targetX - p.x) * 0.05;
              p.y += (targetY - p.y) * 0.05;
            }
          } else if (activeMethod === "froth") {
            if (isCorrectMethod) {
              if (p.isOre) {
                // Ore wetted by oil rises with bubbles to the top froth layer
                const targetX = w * 0.35 + ((p.phase * 60) % (w * 0.32));
                const targetY = h * 0.28 + Math.sin(localFrame * 0.05 + p.phase) * 8;
                p.x += (targetX - p.x) * 0.08;
                p.y += (targetY - p.y) * 0.08;
              } else {
                // Gangue wetted by water sinks to the tank floor
                const targetX = w * 0.36 + ((p.phase * 55) % (w * 0.30));
                const targetY = h * 0.68 + Math.sin(p.phase * 4) * 6;
                p.x += (targetX - p.x) * 0.06;
                p.y += (targetY - p.y) * 0.06;
              }
            } else {
              // Mismatch: Everything sinks to bottom
              const targetX = w * 0.38 + ((p.phase * 50) % (w * 0.28));
              const targetY = h * 0.68;
              p.x += (targetX - p.x) * 0.05;
              p.y += (targetY - p.y) * 0.05;
            }
          } else if (activeMethod === "leaching") {
            if (isCorrectMethod) {
              if (p.isOre) {
                // Ore chemically dissolves into ions in supernatant solution!
                const targetX = w * 0.44 + ((p.phase * 60) % (w * 0.22));
                const targetY = h * 0.45 + Math.sin(localFrame * 0.04 + p.phase) * 16;
                p.x += (targetX - p.x) * 0.06;
                p.y += (targetY - p.y) * 0.06;
              } else {
                // Insoluble gangue residues settle at bottom filter bed
                const targetX = w * 0.43 + ((p.phase * 50) % (w * 0.22));
                const targetY = h * 0.65 + Math.sin(p.phase * 3) * 5;
                p.x += (targetX - p.x) * 0.06;
                p.y += (targetY - p.y) * 0.06;
              }
            } else {
              // Insoluble mismatch
              const targetX = w * 0.45 + ((p.phase * 50) % (w * 0.20));
              const targetY = h * 0.65;
              p.x += (targetX - p.x) * 0.05;
              p.y += (targetY - p.y) * 0.05;
            }
          }
        }

        // Draw 3D-styled Particle with depth lighting
        ctx.beginPath();
        if (activeMethod === "leaching" && p.isOre && (isSimulating || isSeparated) && isCorrectMethod) {
          // Glowing dissolved ion appearance
          ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(52, 211, 153, 0.85)";
          ctx.fill();
        } else {
          // Solid ore or gangue bead
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();

          // 3D highlight gleam on top-left of each particle
          ctx.beginPath();
          ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
          ctx.fill();
        }
      });

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [selectedMethod, isSimulating, isSeparated, sampleIndex, simProgress]);

  // Run Simulation Handler - runs smoothly over ~3.5 seconds
  const handleRunSimulation = () => {
    if (!selectedMethod) return;

    setIsSimulating(true);
    setSimProgress(0);
    setIsSeparated(false);
    setSeparationQuality("none");

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setSimProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        setIsSimulating(false);
        setIsSeparated(true);

        const isMatch = selectedMethod === currentOre.correctMethod;
        if (isMatch) {
          setSeparationQuality("success");
        } else {
          setSeparationQuality("fail");
        }
      }
    }, 35);
  };

  // Check Result / Claim Victory Handler
  const handleCheckResult = () => {
    if (!isSeparated) return;

    if (selectedMethod === currentOre.correctMethod) {
      // Unlock the next level
      setUnlockedLevel((prev) => Math.max(prev, sampleIndex + 1));
      setShowSuccessModal(true);
    } else {
      setFailFeedback(
        `Selected method (${selectedMethod?.toUpperCase()}) does not match ${currentOre.name}'s properties! ${currentOre.explanation}`
      );
      setShowFailModal(true);
    }
  };

  // Next Sample / Advance Target Level
  const handleNextSample = () => {
    setShowSuccessModal(false);
    if (sampleIndex < ORE_SAMPLES.length - 1) {
      setSampleIndex((prev) => prev + 1);
    } else {
      setSampleIndex(0); // Replay from level 1
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl p-2.5 sm:p-3.5">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: MISSION SCREEN                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 text-center relative z-10 bg-white">
          {/* Top Bar: EXIT ONLY */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Center Mission Card */}
          <div className="max-w-2xl flex flex-col items-center space-y-3 px-2">


            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-blue-600">MISSION:</span> Concentrate the raw mined ore and remove rocky gangue to reach &ge;90% purity!
            </h1>


          </div>

          {/* Action Button: NEXT > */}
          <div className="pb-3">
            <button
              onClick={() => setScreen("instructions")}
              className="w-36 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide rounded-full shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: INSTRUCTIONS SCREEN (3 Cards with Easy Language)          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-4 text-center relative z-10 bg-white">
          {/* Top Bar: EXIT & INSTRUCTIONS Title Badge */}
          <div className="w-full flex items-center justify-between pb-1.5 shrink-0">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-6 sm:w-10 h-0.5 bg-blue-400 rounded-full" />
              <div className="px-4 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-sm">
                INSTRUCTIONS TO PLAY
              </div>
              <span className="w-6 sm:w-10 h-0.5 bg-blue-400 rounded-full" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Instruction Cards with User-Provided Images (Text/Heading on Top, Image on Bottom) */}
          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 flex-1 my-2 min-h-0">
            {/* Card 1: 3D Plant Simulation */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between text-left shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">Observe 3D Separation Plant</h3>
                </div>

                <div className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase mb-1 w-fit">
                  INTERACTIVE 3D SIMULATION
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mb-1.5">
                  Inspect the physical setup and powdered ore feed. Watch the mechanical working of sluice riffles, magnetic rollers, and flotation tanks.
                </p>
              </div>

              {/* Image 1: 3D Simulation Model placed at the bottom */}
              <div className="w-full h-24 sm:h-26 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative mt-auto">
                <img
                  src="/images/instructions_step1_model.png"
                  alt="3D Plant Simulation Model"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Card 2: 4 Concentration Methods */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between text-left shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">Select Matching Method</h3>
                </div>

                <div className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase mb-1 w-fit">
                  MATCH METHOD TO ORE
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mb-1.5">
                  Choose the correct technique based on ore properties: <strong>Hydraulic</strong> (gravity), <strong>Magnetic</strong>, <strong>Froth Flotation</strong>, or <strong>Leaching</strong>.
                </p>
              </div>

              {/* Image 2: 4 Method Selector Buttons placed at the bottom */}
              <div className="w-full h-24 sm:h-26 rounded-xl overflow-hidden border border-slate-200 bg-white relative p-1 flex items-center justify-center mt-auto">
                <img
                  src="/images/instructions_step2_methods.jpg"
                  alt="Concentration Methods Options"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 3: Controls - Re-run and Check Answer */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between text-left shadow-sm overflow-hidden">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 truncate">Run & Verify Answer</h3>
                </div>

                <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase mb-1 w-fit">
                  TEST & ADVANCE LEVEL
                </div>
                <p className="text-[11px] text-slate-600 leading-snug mb-1.5">
                  Run the plant, inspect particle separation, test different settings with <strong>Re-Run</strong>, and click <strong>Check Answer</strong> to unlock the next level!
                </p>
              </div>

              {/* Image 3: Re-Run and Check Answer Buttons placed at the bottom */}
              <div className="w-full h-24 sm:h-26 rounded-xl overflow-hidden border border-slate-200 bg-white relative p-1 flex items-center justify-center mt-auto">
                <img
                  src="/images/instructions_step3_controls.jpg"
                  alt="Re-Run and Check Answer Controls"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Bottom Navigation Buttons: Distinct vertical spacing from middle cards */}
          <div className="flex items-center justify-center gap-3.5 pt-2 pb-1 shrink-0">
            <button
              onClick={() => setScreen("mission")}
              className="w-32 py-2 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              &lt; BACK
            </button>
            <button
              onClick={() => setScreen("lab")}
              className="w-32 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>PLAY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: INTERACTIVE LAB & CONCENTRATION PLANT SIMULATION          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          {/* Top Bar: Minimalist Clean Header */}
          <div className="w-full flex items-center justify-between pb-1 shrink-0">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Clean Single Target Badge: L1, L2, L3 or L4 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-blue-900 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200 shadow-sm">
                L{sampleIndex + 1}: Target: {currentOre.name} ({currentOre.formula}) &bull; &ge;90% Purity
              </span>
            </div>

            <button
              onClick={() => setShowExplanation(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Full Screen 3D / Dynamic Separation Plant with Bottom Controls in Single Row */}
          <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden relative">

            {/* FULL CANVAS VIEWPORT: Directly rendered on outer screen, NO nested border boxes */}
            <div className="w-full flex-1 relative overflow-hidden min-h-0 flex flex-col">
              {/* Real 3D Three.js Simulation Canvas: Clean Crisp White Studio Background with Closer Zoom */}
              <div className="w-full flex-1 relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 rounded-2xl border border-slate-100 shadow-inner">
                <Canvas shadows gl={{ antialias: true, alpha: true }}>
                  <PerspectiveCamera makeDefault position={[0.1, 1.25, 4.3]} fov={41} />
                  <OrbitControls
                    enablePan={false}
                    minDistance={2.8}
                    maxDistance={6.5}
                    maxPolarAngle={Math.PI / 2.05}
                  />
                  <Suspense fallback={null}>
                    <SeparationPlant3D
                      method={selectedMethod || "hydraulic"}
                      isSimulating={isSimulating}
                      isSeparated={isSeparated}
                      isCorrect={selectedMethod === currentOre.correctMethod}
                      oreColor={currentOre.color}
                      simProgress={simProgress}
                      waterFlow={waterFlow}
                      pulseSpeed={pulseSpeed}
                    />
                  </Suspense>
                </Canvas>

                {/* Bottom Simple Progress Bar (Only during/after simulation) */}
                {isSimulating && (
                  <div className="absolute bottom-2.5 left-4 right-4 bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 shadow-md flex items-center justify-between gap-3 z-20 text-white text-[11px] font-bold">
                    <span className="shrink-0 text-cyan-300">Separating...</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full"
                        style={{ width: `${simProgress}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-cyan-300">{simProgress}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM CONTROLS: SINGLE ROW (Minimalist compact buttons) */}
            <div className="w-full pt-1.5 flex items-center justify-between gap-2 z-10 shrink-0">
              {/* 4 Method Selection Buttons */}
              <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                {/* 1. Hydraulic Washing */}
                <button
                  onClick={() => {
                    setSelectedMethod("hydraulic");
                    setIsSeparated(false);
                    setSeparationQuality("none");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${selectedMethod === "hydraulic"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <span className="text-base shrink-0 leading-none">🌊</span>
                  <span className="font-bold text-xs truncate">Hydraulic Washing</span>
                </button>

                {/* 2. Magnetic Roller */}
                <button
                  onClick={() => {
                    setSelectedMethod("magnetic");
                    setIsSeparated(false);
                    setSeparationQuality("none");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${selectedMethod === "magnetic"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <span className="text-base shrink-0 leading-none">🧲</span>
                  <span className="font-bold text-xs truncate">Magnetic Roller</span>
                </button>

                {/* 3. Froth Flotation */}
                <button
                  onClick={() => {
                    setSelectedMethod("froth");
                    setIsSeparated(false);
                    setSeparationQuality("none");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${selectedMethod === "froth"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <span className="text-base shrink-0 leading-none">🫧</span>
                  <span className="font-bold text-xs truncate">Froth Flotation</span>
                </button>

                {/* 4. Chemical Leaching */}
                <button
                  onClick={() => {
                    setSelectedMethod("leaching");
                    setIsSeparated(false);
                    setSeparationQuality("none");
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-center transition flex items-center justify-center gap-1.5 ${selectedMethod === "leaching"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                >
                  <span className="text-base shrink-0 leading-none">🧪</span>
                  <span className="font-bold text-xs truncate">Chemical Leaching</span>
                </button>
              </div>

              {/* Action Trigger Button */}
              <div className="shrink-0">
                {!isSeparated ? (
                  <button
                    onClick={handleRunSimulation}
                    disabled={!selectedMethod || isSimulating}
                    className={`h-9 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-md ${!selectedMethod || isSimulating
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                      }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>RUN SEPARATION</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunSimulation}
                      className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase transition active:scale-95"
                    >
                      RE-RUN
                    </button>
                    <button
                      onClick={handleCheckResult}
                      className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CHECK ANSWER</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: FULL SCREEN EXPLANATION SCREEN                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  Minerals, Ores & Concentration Methods
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
                  TOPIC GUIDE • CHEMICAL METALLURGY CONCEPTS
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body: Clean, Editorial Book-Like Typography Without Cluttered Boxes */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm sm:text-base text-slate-800 leading-relaxed flex-1">
            {/* 1. Minerals vs Ores */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mb-2">
                1. What is a Mineral vs an Ore?
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                A <strong>mineral</strong> is any naturally occurring, inorganic chemical substance found in the earth&apos;s crust with a definite chemical composition.
              </p>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base mt-1.5">
                An <strong>ore</strong> is a mineral from which a metal can be extracted <em>conveniently, safely, and economically profitably</em>.
              </p>
              <p className="mt-2 text-sm sm:text-base font-semibold text-blue-800">
                💡 Golden Rule: &ldquo;All ores are minerals, but not all minerals are ores!&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                For example, ordinary clay contains aluminium, but extracting metal from clay is too difficult and expensive. In contrast, <strong>Bauxite</strong> is the primary economic ore of aluminium.
              </p>
            </div>

            {/* 2. Why Concentrate Ores? */}
            <div className="border-b border-slate-100 pb-5">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg mb-2">
                2. Why do we Concentrate Ores? (Beneficiation / Dressing)
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                Mined rock directly from the earth contains huge amounts of unwanted earthy impurities like sand (SiO₂), clay, and limestone, collectively called <strong>gangue</strong> or <strong>matrix</strong>.
              </p>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base mt-1.5">
                Smelting raw ore directly without concentration would waste massive amounts of furnace fuel and chemicals just heating worthless rock. Concentration increases metal purity from 20-30% up to &gt;90%, cutting blast furnace fuel costs dramatically.
              </p>
            </div>

            {/* 3. The 4 Major Concentration Methods */}
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                3. The 4 Major Concentration Methods
              </h3>

              {/* Method A */}
              <div className="border-b border-slate-100 pb-5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>A. Hydraulic Washing (Gravity Separation)</span>
                  <span className="text-xs font-normal text-slate-500">— Property: Density Difference</span>
                </h4>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  <strong>Principle:</strong> Based on the difference in specific gravities (densities). Powdered ore is washed over a vibrating, sloped Wilfley table with grooved riffles. Heavy, dense ore grains settle into the riffles, while lighter gangue particles are washed away by running water.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  <strong>NCERT Examples:</strong> Tin Stone / Cassiterite (SnO₂, density ~7.0) and Hematite (Fe₂O₃, density ~5.2) separated from light quartz sand (~2.6 g/cm³).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
                  🏞️ <strong>Real-Life Analogy:</strong> Gold panning in river streams! Heavy gold flakes stay locked against ridges at the bottom of the pan while light sand and gravel wash away with the stream.
                </p>
              </div>

              {/* Method B */}
              <div className="border-b border-slate-100 pb-5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                  <Magnet className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>B. Magnetic Separation</span>
                  <span className="text-xs font-normal text-slate-500">— Property: Magnetic Attraction</span>
                </h4>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  <strong>Principle:</strong> Based on differences in magnetic properties. Powdered ore is carried along a conveyor belt running over a magnetic roller. Magnetic particles are attracted and cling to the belt around the drum, dropping into the near bin. Non-magnetic particles fly off by inertia into the far bin.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  <strong>NCERT Examples:</strong> Magnetic Magnetite (Fe₃O₄) separated from non-magnetic silica sand; or separating magnetic Wolframite (FeWO₄) impurities from non-magnetic Cassiterite (SnO₂).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
                  🏗️ <strong>Real-Life Analogy:</strong> Junkyard electromagnets! Heavy scrap yard magnets instantly pluck steel car frames and iron parts out of mixed non-magnetic trash piles like plastic, wood, and concrete.
                </p>
              </div>

              {/* Method C */}
              <div className="border-b border-slate-100 pb-5">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>C. Froth Flotation Process</span>
                  <span className="text-xs font-normal text-slate-500">— Property: Surface Wettability</span>
                </h4>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  <strong>Principle:</strong> Based on preferential wetting. Sulfide ores are hydrophobic and preferentially wetted by pine oil, while gangue is hydrophilic and wetted by water. Pressurized air creates a stable froth; oil-wetted sulfide particles attach to air bubbles and float to the top, while gangue sinks to the bottom.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  <strong>NCERT Examples:</strong> Sulfide ores such as Galena (PbS), Zinc Blende (ZnS), and Copper Pyrites (CuFeS₂).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
                  🧼 <strong>Real-Life Analogy:</strong> Washing oily dinner plates with soap! Soap suds cling to greasy cooking oils and float them to the surface foam, while running water rinses food crumbs down the drain.
                </p>
              </div>

              {/* Method D */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1.5 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>D. Chemical Leaching</span>
                  <span className="text-xs font-normal text-slate-500">— Property: Chemical Solubility</span>
                </h4>
                <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                  <strong>Principle:</strong> Used when physical properties of ore and gangue are too similar. The powdered ore is treated with a chemical reagent in which the valuable metal selectively dissolves into a clear solution, while insoluble impurities remain solid and are filtered out.
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-2">
                  <strong>NCERT Examples:</strong> Bayer&apos;s process for Bauxite (Al₂O₃ · 2H₂O): digested with hot conc. NaOH to form soluble Sodium Aluminate [NaAl(OH)₄], filtering away insoluble Red Mud (Fe₂O₃, SiO₂, TiO₂).
                </p>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium">
                  ☕ <strong>Real-Life Analogy:</strong> Brewing fresh coffee in a drip filter! Hot water selectively dissolves coffee flavor and caffeine into a clear liquid drink, leaving all solid, insoluble coffee grounds behind in the paper filter.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
            <button
              onClick={() => setShowExplanation(false)}
              className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition active:scale-95 cursor-pointer"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: TARGET ACHIEVED / LEVEL CLEARED MODAL (Clean & Spacious)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-center flex flex-col items-center max-h-[94vh] overflow-y-auto">
            {/* Header Badge */}
            <div className="flex items-center justify-between w-full mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>LEVEL {sampleIndex + 1} CLEARED</span>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Purity: 94.8%
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900 leading-snug mb-3">
              {currentOre.name} Concentrated!
            </h3>

            {/* Next Target Preview Card */}
            {sampleIndex < ORE_SAMPLES.length - 1 ? (
              <div className="w-full bg-blue-50/80 border border-blue-200 rounded-xl px-3 py-2 mb-3 text-left flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 text-blue-900 font-bold text-xs">
                    <Unlock className="w-3.5 h-3.5 text-blue-600" />
                    <span>NEXT: LEVEL {sampleIndex + 2} &bull; {ORE_SAMPLES[sampleIndex + 1].name} ({ORE_SAMPLES[sampleIndex + 1].formula})</span>
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5">
                    Extract {ORE_SAMPLES[sampleIndex + 1].metal} &bull; Target: &ge;90% Purity
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                  UNLOCKED
                </span>
              </div>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 mb-3 text-center">
                <div className="text-xs font-black text-emerald-900">
                  🏆 MASTER METALLURGIST AWARD!
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  You successfully concentrated all 4 major ore types!
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="w-full">
              <button
                onClick={handleNextSample}
                className="w-full h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {sampleIndex < ORE_SAMPLES.length - 1 ? (
                  <>
                    <span>PROCEED TO LEVEL {sampleIndex + 2}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <span>REPLAY ALL LEVELS</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: RETRY / FAIL MODAL (Clean & Spacious)                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-center flex flex-col items-center max-h-[94vh] overflow-y-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider mb-2">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>SEPARATION INEFFECTIVE</span>
            </div>

            <h3 className="text-base font-black text-slate-800 mb-1.5">
              Low Concentration
            </h3>
            <div className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 mb-4">
              Purity: 38.2% • Gangue Remained
            </div>

            <div className="w-full">
              <button
                onClick={() => {
                  setShowFailModal(false);
                  setIsSeparated(false);
                  setSeparationQuality("none");
                }}
                className="w-full h-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow-md active:scale-95 cursor-pointer"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

