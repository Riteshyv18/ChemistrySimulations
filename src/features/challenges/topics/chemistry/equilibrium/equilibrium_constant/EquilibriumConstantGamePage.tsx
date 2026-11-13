"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  RotateCcw,
  BookOpen,
  Trophy,
  CheckCircle2,
  X,
  Play,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FlaskConical,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Activity,
  Layers,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ============================================================================
// CONSTANTS & REACTION PARAMETERS
// Reaction: N2(g) + 3H2(g) <=> 2NH3(g)
// Initial concentrations:
// [N2]0 = 0.50 M, [H2]0 = 1.00 M, [NH3]0 = 0.00 M
// At equilibrium:
// [N2]eq = 0.20 M, [H2]eq = 0.30 M, [NH3]eq = 0.40 M
// Kc = [NH3]^2 / ([N2] * [H2]^3) = (0.40)^2 / (0.20 * 0.30^3) = 0.16 / 0.0054 ~= 29.63
// ============================================================================

interface ParticleDef {
  id: number;
  type: "N2" | "H2" | "NH3";
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function EquilibriumConstantGamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // ── SCREEN FLOW STATES ──
  const [introStep, setIntroStep] = useState<"mission" | "instructions" | "playing">("mission");
  // In gameplay: screen 1 = Observation & Chamber, screen 2 = Step 5 & Step 6 (Expression & Kc)
  const [gameplayScreen, setGameplayScreen] = useState<1 | 2>(1);

  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);

  // ── SIMULATION & REACTION STATE ──
  const [initialN2] = useState<number>(0.50);
  const [initialH2] = useState<number>(1.00);
  const [initialNH3] = useState<number>(0.00);

  const [isReactionRunning, setIsReactionRunning] = useState<boolean>(false);
  const [reactionProgress, setReactionProgress] = useState<number>(0); // 0 to 100%
  const [equilibriumReached, setEquilibriumReached] = useState<boolean>(false);

  // Live readings
  const currentN2 = useMemo(() => {
    return Number((initialN2 - (initialN2 - 0.20) * (reactionProgress / 100)).toFixed(2));
  }, [initialN2, reactionProgress]);

  const currentH2 = useMemo(() => {
    return Number((initialH2 - (initialH2 - 0.30) * (reactionProgress / 100)).toFixed(2));
  }, [initialH2, reactionProgress]);

  const currentNH3 = useMemo(() => {
    return Number((initialNH3 + (0.40 - initialNH3) * (reactionProgress / 100)).toFixed(2));
  }, [initialNH3, reactionProgress]);

  // ── STEP 5: FILL THE EQUILIBRIUM EXPRESSION ──
  const [slotNum, setSlotNum] = useState<string | null>(null);
  const [slotDen1, setSlotDen1] = useState<string | null>(null);
  const [slotDen2, setSlotDen2] = useState<string | null>(null);

  const expressionOptions = useMemo(() => [
    { id: "nh3_sq", label: "[NH₃]²" },
    { id: "n2", label: "[N₂]" },
    { id: "h2_cube", label: "[H₂]³" },
    { id: "nh3", label: "[NH₃]" },
    { id: "h2", label: "[H₂]" },
    { id: "n2_sq", label: "[N₂]²" },
  ], []);

  // Dynamic translation of selected slot to its numerical representation
  const getSlotNumericalValue = (slot: string | null): string => {
    if (!slot) return "[ ? ]";
    switch (slot) {
      case "[NH₃]²":
        return "(0.40)²";
      case "[NH₃]":
        return "(0.40)";
      case "[N₂]":
        return "0.20";
      case "[N₂]²":
        return "(0.20)²";
      case "[H₂]³":
        return "(0.30)³";
      case "[H₂]":
        return "0.30";
      default:
        return "[ ? ]";
    }
  };

  const numValStr = useMemo(() => getSlotNumericalValue(slotNum), [slotNum]);
  const den1ValStr = useMemo(() => getSlotNumericalValue(slotDen1), [slotDen1]);
  const den2ValStr = useMemo(() => getSlotNumericalValue(slotDen2), [slotDen2]);

  // Check if expression is fully and correctly filled
  const isExpressionCorrect = useMemo(() => {
    const isNumOk = slotNum === "[NH₃]²";
    const isDenOk =
      (slotDen1 === "[N₂]" && slotDen2 === "[H₂]³") ||
      (slotDen1 === "[H₂]³" && slotDen2 === "[N₂]");
    return isNumOk && isDenOk;
  }, [slotNum, slotDen1, slotDen2]);

  // ── STEP 6: CALCULATE KC & DETERMINE EQUILIBRIUM FAVOURS ──
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [favouredChoice, setFavouredChoice] = useState<"REACTANTS" | "PRODUCTS" | null>(null);

  // Victory condition trigger
  useEffect(() => {
    if (equilibriumReached && isExpressionCorrect && isCalculated && favouredChoice === "PRODUCTS") {
      const timer = setTimeout(() => {
        setShowVictoryModal(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [equilibriumReached, isExpressionCorrect, isCalculated, favouredChoice]);

  // ── CANVAS PARTICLES ANIMATION ──
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ParticleDef[]>([]);

  // Initialize particles
  useEffect(() => {
    const particles: ParticleDef[] = [];
    for (let i = 0; i < 30; i++) {
      const type = i < 8 ? "N2" : "H2";
      particles.push({
        id: i,
        type,
        x: 30 + Math.random() * 460,
        y: 20 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 1.6,
        vy: (Math.random() - 0.5) * 1.6,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Animation frame loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle chamber depth gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, "rgba(224, 242, 254, 0.4)");
      bgGrad.addColorStop(0.5, "rgba(240, 249, 255, 0.15)");
      bgGrad.addColorStop(1, "rgba(186, 230, 253, 0.45)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center reaction flow arrows
      ctx.save();
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.fillStyle = isReactionRunning ? "rgba(16, 185, 129, 0.85)" : "rgba(148, 163, 184, 0.45)";
      ctx.fillText("⇄", cx, cy - 2);
      ctx.restore();

      const particles = particlesRef.current;
      const currentNH3Ratio = reactionProgress / 100;

      particles.forEach((p, idx) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 15) { p.x = 15; p.vx *= -1; }
        if (p.x > canvas.width - 15) { p.x = canvas.width - 15; p.vx *= -1; }
        if (p.y < 15) { p.y = 15; p.vy *= -1; }
        if (p.y > canvas.height - 15) { p.y = canvas.height - 15; p.vy *= -1; }

        // Dynamic type transition as reaction proceeds
        let effectiveType = p.type;
        if (idx < 14 && idx < Math.floor(currentNH3Ratio * 16)) {
          effectiveType = "NH3";
        }

        // Render molecule
        if (effectiveType === "N2") {
          // Dark Blue Diatomic (N#N)
          ctx.beginPath();
          ctx.arc(p.x - 4, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#1e40af";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x + 4, p.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = "#2563eb";
          ctx.fill();
        } else if (effectiveType === "H2") {
          // Small Grey Diatomic (H-H)
          ctx.beginPath();
          ctx.arc(p.x - 3, p.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = "#94a3b8";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x + 3, p.y, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = "#cbd5e1";
          ctx.fill();
        } else {
          // NH3: Cyan center + 3 small hydrogens
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = "#0284c7";
          ctx.fill();

          const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
          angles.forEach((ang) => {
            const hx = p.x + Math.cos(ang) * 6.5;
            const hy = p.y + Math.sin(ang) * 6.5;
            ctx.beginPath();
            ctx.arc(hx, hy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = "#e0f2fe";
            ctx.fill();
          });
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isReactionRunning, reactionProgress]);

  // Reaction timer effect
  useEffect(() => {
    if (!isReactionRunning || equilibriumReached) return;

    const interval = setInterval(() => {
      setReactionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setEquilibriumReached(true);
          setIsReactionRunning(false);
          return 100;
        }
        return prev + 2.5; // reaches 100% in ~4 seconds
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isReactionRunning, equilibriumReached]);

  // ── RESET GAMEPLAY ──
  const handleReset = () => {
    setIsReactionRunning(false);
    setReactionProgress(0);
    setEquilibriumReached(false);
    setSlotNum(null);
    setSlotDen1(null);
    setSlotDen2(null);
    setIsCalculated(false);
    setFavouredChoice(null);
    setShowVictoryModal(false);
    setGameplayScreen(1);
  };

  // Exit trigger
  const handleExitClick = () => {
    if (onExit) onExit();
    else exitSimulation();
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl p-3 sm:p-4">
      
      {/* ──────────────────────────────────────────────────────────────────
          TOP BAR HEADER (Exit Button & Explanation Button)
          ────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between pb-1 z-30 shrink-0">
        {/* Left Exit Button */}
        <button
          type="button"
          onClick={handleExitClick}
          className="flex items-center gap-1.5 h-7 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95"
          title="Exit Challenge"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>EXIT</span>
        </button>

        {/* Right Explanation Button */}
        <button
          type="button"
          onClick={() => setShowExplanationModal(true)}
          className="flex items-center gap-1.5 h-7 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
          title="View Chemistry Guide"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>EXPLANATION</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          SCREEN 1 (GAMEPLAY): SINGLE ROUNDED CONTAINER HOUSING EVERYTHING
          ────────────────────────────────────────────────────────────────── */}
      {introStep === "playing" && gameplayScreen === 1 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Top Chamber Header Title */}
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-700 text-center py-1.5 bg-sky-50/80 rounded-2xl border border-sky-100 flex items-center justify-center gap-2 shrink-0 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>REACTION CHAMBER &nbsp;•&nbsp; HOMOGENEOUS GAS PHASE (N₂ + 3H₂ ⇌ 2NH₃)</span>
          </div>

          {/* Middle Split: Left Initial Inputs, Center 2D Canvas, Right Equilibrium Sensor */}
          <div className="grid grid-cols-12 gap-3 flex-1 items-stretch overflow-hidden">
              
              {/* Left Column: Initial Concentration Readouts & Start Button */}
              <div className="col-span-3 flex flex-col justify-between py-1">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-sky-600" />
                    INITIAL CONCENTRATIONS
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] sm:text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-700">[N₂]₀ =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {initialN2.toFixed(2)} M
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">[H₂]₀ =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {initialH2.toFixed(2)} M
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-cyan-700">[NH₃]₀ =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {initialNH3.toFixed(2)} M
                      </span>
                    </div>
                  </div>
                </div>

                {/* Start Reaction Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isReactionRunning && !equilibriumReached) {
                      setIsReactionRunning(true);
                    }
                  }}
                  disabled={isReactionRunning || equilibriumReached}
                  className={`w-full py-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 ${
                    equilibriumReached
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                      : isReactionRunning
                      ? "bg-amber-500 text-white animate-pulse cursor-wait"
                      : "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-600/30 cursor-pointer active:scale-95"
                  }`}
                >
                  {equilibriumReached ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>EQUILIBRIUM REACHED</span>
                    </>
                  ) : isReactionRunning ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>REACTING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>START REACTION</span>
                    </>
                  )}
                </button>
              </div>

              {/* Center Column: Cylindrical Chamber Canvas with Progress Bar */}
              <div className="col-span-6 flex flex-col justify-between relative">
                <div className="relative flex-1 w-full rounded-2xl overflow-hidden bg-sky-50/50 border border-sky-200 shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                  {/* Chamber Metal End Flanges */}
                  <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200 border-r border-slate-400 shadow-sm" />
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-slate-400 via-slate-300 to-slate-200 border-l border-slate-400 shadow-sm" />
                </div>

                {/* Progress bar below chamber */}
                <div className="px-2 pt-1 pb-0.5">
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mb-0.5">
                    <span>PROGRESS TOWARD EQUILIBRIUM</span>
                    <span className="font-mono">{Math.round(reactionProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-150 rounded-full"
                      style={{ width: `${reactionProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Measured Readings & Stability Callout */}
              <div className="col-span-3 flex flex-col justify-between py-1">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-600" />
                    MEASURED READINGS
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] sm:text-xs">
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-blue-700">[N₂] =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {currentN2.toFixed(2)} M
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">[H₂] =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {currentH2.toFixed(2)} M
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 p-1 rounded-lg border border-slate-100">
                      <span className="font-bold text-cyan-700">[NH₃] =</span>
                      <span className="bg-white px-2 py-0.5 rounded font-bold border border-slate-200 text-slate-800">
                        {currentNH3.toFixed(2)} M
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className={`p-1.5 rounded-xl text-center text-[10px] font-bold border ${
                  equilibriumReached
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
                }`}>
                  {equilibriumReached ? "Rates Equal & Concentrations Constant!" : "Waiting for equilibrium plateau..."}
                </div>
              </div>

            </div>

            {/* Bottom Action: PROCEED TO CALCULATE KC */}
            <div className="pt-2 flex justify-center shrink-0">
              <button
                type="button"
                disabled={!equilibriumReached}
                onClick={() => setGameplayScreen(2)}
                className={`px-8 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 ${
                  equilibriumReached
                    ? "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sky-600/30 cursor-pointer transform hover:scale-105 active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>PROCEED TO CALCULATE KC</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

          </div>
        )}

      {/* ──────────────────────────────────────────────────────────────────
          SCREEN 2 (GAMEPLAY): FORMULA & KC
          ────────────────────────────────────────────────────────────────── */}
      {introStep === "playing" && gameplayScreen === 2 && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          
          {/* Top Measured Values Banner Inside the Box */}
          <div className="bg-sky-50/70 rounded-2xl px-4 py-1.5 border border-sky-100 flex items-center justify-between shadow-xs shrink-0 mb-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-sky-600" />
                <span>MEASURED EQUILIBRIUM READINGS:</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs sm:text-sm font-bold">
                <span className="text-blue-700">[N₂] = 0.20 M</span>
                <span className="text-slate-700">[H₂] = 0.30 M</span>
                <span className="text-cyan-700">[NH₃] = 0.40 M</span>
              </div>
            </div>

            {/* Two Column Grid for Step 5 & Step 6 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-stretch overflow-hidden">
              
              {/* STEP 5: FILL THE EQUILIBRIUM EXPRESSION */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    STEP 5: FILL EQUILIBRIUM EXPRESSION
                  </span>
                  {isExpressionCorrect && (
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> CORRECT FORMULA
                    </span>
                  )}
                </div>

                {/* Formula Slots */}
                <div className="flex items-center justify-center gap-3 py-1">
                  <span className="font-serif italic font-black text-2xl text-slate-900">
                    K<sub>c</sub> =
                  </span>

                  <div className="flex flex-col items-center">
                    {/* Numerator Slot */}
                    <button
                      type="button"
                      onClick={() => setSlotNum(null)}
                      className={`min-w-[80px] h-8 px-2 rounded-xl font-mono font-bold text-xs border-2 flex items-center justify-center transition-all cursor-pointer ${
                        slotNum
                          ? slotNum === "[NH₃]²"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-white text-slate-400 border-dashed border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {slotNum || "[ ? ]"}
                    </button>

                    {/* Fraction Line */}
                    <div className="w-full min-w-[150px] h-0.5 bg-slate-800 my-1 rounded-full" />

                    {/* Denominator Slots */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSlotDen1(null)}
                        className={`min-w-[65px] h-8 px-1.5 rounded-xl font-mono font-bold text-xs border-2 flex items-center justify-center transition-all cursor-pointer ${
                          slotDen1
                            ? slotDen1 === "[N₂]" || slotDen1 === "[H₂]³"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-white text-slate-400 border-dashed border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {slotDen1 || "[ ? ]"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSlotDen2(null)}
                        className={`min-w-[65px] h-8 px-1.5 rounded-xl font-mono font-bold text-xs border-2 flex items-center justify-center transition-all cursor-pointer ${
                          slotDen2
                            ? slotDen2 === "[N₂]" || slotDen2 === "[H₂]³"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                            : "bg-white text-slate-400 border-dashed border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {slotDen2 || "[ ? ]"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option Cards Bank to click & slot */}
                <div className="flex items-center justify-center gap-1.5 pt-1 overflow-x-auto">
                  {expressionOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (!slotNum) {
                          setSlotNum(opt.label);
                        } else if (!slotDen1) {
                          setSlotDen1(opt.label);
                        } else if (!slotDen2) {
                          setSlotDen2(opt.label);
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 6: CALCULATE KC & FAVOURED SIDE */}
              <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    STEP 6: CALCULATE K<sub>c</sub> &amp; DEDUCE FAVOURED SIDE
                  </span>
                  {isCalculated && favouredChoice === "PRODUCTS" && (
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> COMPLETED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 py-1 items-stretch flex-1">
                  {/* Math Calculation Card */}
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 text-center font-mono text-xs flex flex-col justify-between shadow-xs">
                    <div className="text-[10px] text-slate-500 font-sans font-bold">PLUG IN READINGS:</div>
                    <div className="text-slate-800 font-bold py-2 text-xs sm:text-[13px]">
                      K<sub>c</sub> = {numValStr} / [{den1ValStr} × {den2ValStr}]
                    </div>

                    {isCalculated ? (
                      <div className="text-sm sm:text-base font-black text-emerald-700 bg-emerald-100/70 py-2 rounded-lg border border-emerald-300">
                        K<sub>c</sub> ≈ 29.63
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCalculated(true)}
                        disabled={!isExpressionCorrect}
                        className={`w-full py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                          !isExpressionCorrect
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer active:scale-95"
                        }`}
                      >
                        CALCULATE
                      </button>
                    )}
                  </div>

                  {/* Equilibrium Favours Selector */}
                  <div className="flex flex-col justify-between gap-2 text-center bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700">
                      EQUILIBRIUM FAVOURS?
                    </span>
                    <div className="flex flex-col gap-2 flex-1 justify-center">
                      <button
                        type="button"
                        onClick={() => setFavouredChoice("REACTANTS")}
                        disabled={!isCalculated}
                        className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider border transition-all cursor-pointer shadow-md ${
                          favouredChoice === "REACTANTS"
                            ? "bg-rose-800 text-white border-rose-900 shadow-rose-900/40 ring-4 ring-rose-400/50 scale-[1.02]"
                            : "bg-rose-600 hover:bg-rose-700 text-white border-rose-700 hover:border-rose-800"
                        } ${!isCalculated ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
                      >
                        REACTANTS
                      </button>

                      <button
                        type="button"
                        onClick={() => setFavouredChoice("PRODUCTS")}
                        disabled={!isCalculated}
                        className={`w-full py-2.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider border transition-all cursor-pointer shadow-md ${
                          favouredChoice === "PRODUCTS"
                            ? "bg-emerald-900 text-white border-emerald-950 shadow-emerald-950/40 ring-4 ring-emerald-400/50 scale-[1.02]"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800 hover:border-emerald-900"
                        } ${!isCalculated ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
                      >
                        PRODUCTS
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Back Button */}
            <div className="pt-2.5 flex justify-center shrink-0">
              <button
                type="button"
                onClick={() => setGameplayScreen(1)}
                className="px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK TO CHAMBER</span>
              </button>
            </div>

          </div>
        )}

      {/* ──────────────────────────────────────────────────────────────────
          SCREEN 0: MISSION INTRO (Clean Rounded Container)
          ────────────────────────────────────────────────────────────────── */}
      {introStep === "mission" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>
            <div className="w-16" />
          </div>

          {/* Centered Single-Liner Mission Statement */}
          <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#0284C7]">MISSION:</span> Investigate an equilibrium mixture and calculate its equilibrium constant!
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

      {/* ──────────────────────────────────────────────────────────────────
          SCREEN 0B: INSTRUCTIONS TO PLAY (3 Guidance Cards)
          ────────────────────────────────────────────────────────────────── */}
      {introStep === "instructions" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
          {/* Top Header */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>

            {/* Title Pill */}
            <div className="flex items-center gap-2">
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                <span>INSTRUCTIONS TO PLAY</span>
              </div>
              <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Step Guidance Cards */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">
              
              {/* Card 1: Reaction Chamber */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Reaction Chamber
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase tracking-wider">
                      Dynamic Equilibrium
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Start the reaction and observe molecules colliding until concentrations stabilize at equilibrium.
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kc_step1_chamber.png"
                    alt="Reaction Chamber at Equilibrium"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Card 2: Fill Expression */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Fill Expression
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-extrabold text-[9px] uppercase tracking-wider">
                      Law of Mass Action
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Select correct species terms raised to their stoichiometric powers for numerator and denominator.
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kc_step2_expression.png"
                    alt="Kc Formula Builder"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Card 3: Calculate & Deduce */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Calculate &amp; Deduce
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                      Position of Equilibrium
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                    Substitute the equilibrium readings to compute Kc, then deduce whether reactants or products are favoured.
                  </p>
                </div>
                <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50/80 flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/instructions/kc_step3_favours.png"
                    alt="Equilibrium Favours Selector"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 pb-5 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-10">
            <button
              type="button"
              onClick={() => setIntroStep("mission")}
              className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
              <span>BACK</span>
            </button>
            <button
              type="button"
              onClick={() => setIntroStep("playing")}
              className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5 text-sky-200 fill-current" />
              <span>PLAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          LAYER 3: VICTORY MODAL (Compact 300 Pts, REPLAY & EXPLANATION)
          ────────────────────────────────────────────────────────────────── */}
      {showVictoryModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-center space-y-2.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-md">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
                MISSION COMPLETE • 300 PTS
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Equilibrium Constant Master!
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                You successfully constructed the equilibrium expression, calculated Kc ≈ 29.63, and correctly identified that products are favoured!
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-left font-mono text-[10px] sm:text-[11px] space-y-0.5 text-slate-800">
              <div className="font-sans font-bold text-slate-700">Equilibrium Constant Summary:</div>
              <div>• [N₂] = <strong>0.20 M</strong> &nbsp;|&nbsp; [H₂] = <strong>0.30 M</strong> &nbsp;|&nbsp; [NH₃] = <strong>0.40 M</strong></div>
              <div>• Expression: <strong>Kc = [NH₃]² / ([N₂][H₂]³)</strong></div>
              <div>• Calculated Kc = (0.40)² / [0.20 × (0.30)³] = <strong>29.63</strong></div>
              <div className="text-[9px] sm:text-[10px] text-emerald-700 font-sans font-semibold pt-0.5">
                Kc &gt; 1: Equilibrium strongly favours Products at this temperature.
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowVictoryModal(false);
                  handleReset();
                }}
                className="flex-1 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVictoryModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex-1 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────
          LAYER 4: EXPLANATION MODAL (Comprehensive Chemistry Theory Guide)
          ────────────────────────────────────────────────────────────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-white">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Equilibrium Constant (Kc) &amp; Law of Mass Action Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">
                Module 06: Chemical Equilibrium • Topic 02: Equilibrium Constant
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Explanation Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-5 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm max-w-4xl mx-auto w-full">
            
            {/* Section 1: The Big Picture */}
            <div className="space-y-2 bg-sky-50/70 p-4 rounded-2xl border border-sky-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 bg-sky-200/60 px-2.5 py-0.5 rounded-full inline-block">
                1. THE BIG PICTURE
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                What is Chemical Equilibrium?
              </h3>
              <p className="text-slate-600">
                Imagine a busy store where people enter through the front door (Reactants turning into Products — <strong>Forward reaction</strong>) and leave through the exit at the exact same rate (Products breaking back down into Reactants — <strong>Reverse reaction</strong>).
              </p>
              <p className="text-slate-600">
                Even though molecules never stop reacting, the <strong>total concentrations on both sides stay completely constant</strong>. That state is called <strong>Dynamic Equilibrium</strong>:
              </p>
              <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-2.5 rounded-xl border border-sky-200">
                N₂ (g) + 3 H₂ (g) ⇌ 2 NH₃ (g)
              </div>
            </div>

            {/* Section 2: What is Kc? Scorecard */}
            <div className="space-y-2 border-l-4 border-sky-500 pl-3.5 sm:pl-4 py-1">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                2. What is Kc (The Equilibrium Constant)?
              </h4>
              <p className="text-slate-700">
                Think of <strong>Kc</strong> as a <strong>scorecard</strong> or a <strong>tug-of-war meter</strong> between the two sides:
              </p>
              <div className="my-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono font-bold text-xs sm:text-sm text-slate-800">
                Score (Kc) = Amount of Products / Amount of Reactants
              </div>
              <p className="text-slate-600 italic">
                It tells us: <em>&quot;When the reaction settles down, who won the game? Are there more products or more reactants in the container?&quot;</em>
              </p>
            </div>

            {/* Section 3: Why Powers / Exponents? */}
            <div className="space-y-2 border-l-4 border-amber-500 pl-3.5 sm:pl-4 py-1">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                3. Why are there Powers/Exponents in the Formula?
              </h4>
              <p className="text-slate-700">
                Look at the balanced chemical recipe for Ammonia:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 font-medium">
                <li>You need <strong>1</strong> N₂ molecule.</li>
                <li>You need <strong>3</strong> H₂ molecules.</li>
                <li>You produce <strong>2</strong> NH₃ molecules.</li>
              </ul>
              <p className="text-slate-700 pt-1">
                According to the <strong>Law of Mass Action</strong>, whatever balancing number (coefficient) is in the recipe becomes a <strong>power (exponent)</strong> in the math:
              </p>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-slate-800 space-y-1 text-xs sm:text-sm">
                <div>• <strong>Products go on top (Numerator):</strong> [NH₃]² (because of the <strong>2</strong>).</div>
                <div>• <strong>Reactants go on the bottom (Denominator):</strong> [N₂]¹ × [H₂]³ (because of the <strong>3</strong>).</div>
              </div>
              <div className="text-center font-mono font-black text-xs sm:text-sm text-amber-950 bg-white p-2.5 rounded-xl border border-amber-200 mt-2">
                Kc = [NH₃]² / ([N₂] × [H₂]³)
              </div>
            </div>

            {/* Section 4: What Does the Final Number Tell Us? */}
            <div className="space-y-3 border-l-4 border-emerald-500 pl-3.5 sm:pl-4 py-1">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                4. What Does the Final Number Tell Us?
              </h4>
              <p className="text-slate-700">
                After plugging in our measured equilibrium readings:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div>[NH₃] = <strong>0.40 M</strong></div>
                <div>[N₂] = <strong>0.20 M</strong></div>
                <div>[H₂] = <strong>0.30 M</strong></div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-1">
                <div>• Numerator: (0.40)² = <strong>0.16</strong></div>
                <div>• Denominator: 0.20 × (0.30)³ = 0.20 × 0.027 = <strong>0.0054</strong></div>
                <div className="text-emerald-700 font-bold font-sans pt-1 text-xs sm:text-sm">
                  Kc = 0.16 / 0.0054 ≈ 29.63
                </div>
              </div>

              {/* Interpretation Table */}
              <div className="pt-2">
                <span className="font-extrabold text-xs text-slate-800 block mb-1.5 uppercase tracking-wide">
                  How to Read This Answer:
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">If Kc is...</th>
                        <th className="p-2.5">Meaning in Plain English</th>
                        <th className="p-2.5">Who is Favoured?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr className="bg-emerald-50/50 font-semibold text-emerald-950">
                        <td className="p-2.5 font-mono font-bold text-emerald-700">Kc &gt; 1 (like 29.63)</td>
                        <td className="p-2.5">The top number (Products) is much bigger than the bottom number (Reactants). Most ingredients converted to Ammonia!</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] uppercase font-black">
                            PRODUCTS
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-rose-700">Kc &lt; 1 (e.g. 0.005)</td>
                        <td className="p-2.5">The bottom number (Reactants) is huge. Very little product was formed.</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] uppercase font-black">
                            REACTANTS
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-mono font-bold text-slate-700">Kc ≈ 1</td>
                        <td className="p-2.5">Both sides are roughly equal in concentration at equilibrium.</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-600 text-white text-[10px] uppercase font-black">
                            NEITHER (Balanced)
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Button */}
          <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-center">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default EquilibriumConstantGamePage;
