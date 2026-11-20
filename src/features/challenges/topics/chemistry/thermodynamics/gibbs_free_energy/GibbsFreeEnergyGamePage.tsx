"use client";

import React, { useState, useId } from "react";
import { ArrowLeft, BookOpen, RotateCcw, CheckCircle2, XCircle, X, ChevronRight, Thermometer, Flame } from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

interface GibbsFreeEnergyGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function GibbsFreeEnergyGamePage({
  difficulty = "easy",
  onExit,
}: GibbsFreeEnergyGamePageProps) {
  // Screens: "mission" | "instructions" | "lab"
  const [screen, setScreen] = useState<"mission" | "instructions" | "lab">("mission");

  // Constant Given Parameters
  const deltaH = 40.0; // kJ/mol (+40)
  const deltaS = 0.15; // kJ/(mol K) = +150 J/(mol K)

  // Interactive State
  const [temp, setTemp] = useState<number>(200); // 100K - 500K
  const [userSpontaneous, setUserSpontaneous] = useState<boolean | null>(null);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  // Modals
  const [showExplanation, setShowExplanation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failFeedback, setFailFeedback] = useState<string>("");

  // Unique IDs for SVG gradients and clip paths
  const gradientId = useId();

  // Thermodynamic Calculations
  // Delta G = Delta H - T * Delta S
  const deltaG = deltaH - temp * deltaS; // in kJ/mol
  const isActualSpontaneous = deltaG < 0; // Spontaneous when Delta G is negative

  // Reaction Profile Coordinate Calculations (Reaction Coordinate SVG)
  // ViewBox: 0 0 680 230
  // Y axis: baseline reactantY = 145. TS tsY = 32.
  // E_prod productY = reactantY - deltaG * 2.0
  const reactantY = 145;
  const tsY = 32;
  const productY = Math.max(24, Math.min(210, reactantY - deltaG * 2.0));

  // Handle Exit
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  // Reset Challenge
  const handleReset = () => {
    setTemp(200);
    setUserSpontaneous(null);
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (userSpontaneous === null) {
      setFailFeedback("Please select whether the reaction is SPONTANEOUS or NON-SPONTANEOUS at the current temperature!");
      setShowFailModal(true);
      return;
    }

    if (userSpontaneous === isActualSpontaneous) {
      setShowSuccessModal(true);
    } else {
      if (deltaG > 0) {
        setFailFeedback(`At T = ${temp} K, ΔG = +${deltaG.toFixed(1)} kJ/mol (> 0). Because ΔG is positive, the process is uphill and NON-SPONTANEOUS!`);
      } else if (deltaG === 0) {
        setFailFeedback(`At T = ${temp} K, ΔG = 0.0 kJ/mol. The reaction is at dynamic equilibrium!`);
      } else {
        setFailFeedback(`At T = ${temp} K, ΔG = ${deltaG.toFixed(1)} kJ/mol (< 0). Because ΔG is negative, the forward process is downhill and SPONTANEOUS!`);
      }
      setShowFailModal(true);
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 1: MISSION SCREEN                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "mission" && (
        <div className="w-full h-full flex flex-col items-center justify-between p-6 sm:p-8 text-center relative z-10 bg-white">
          {/* Top Bar: EXIT ONLY */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div className="w-16" />
          </div>

          {/* Mission Body */}
          <div className="max-w-2xl flex flex-col items-center gap-4 my-auto">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-blue-600">MISSION:</span>  Adjust the temperature to discover when the reaction happens naturally without any external push!
            </h1>


            <button
              onClick={() => setScreen("instructions")}
              className="mt-2 flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>NEXT</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Clean bottom spacer */}
          <div className="h-8 shrink-0" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 2: INSTRUCTIONS SCREEN                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-5 sm:p-6 text-slate-800 relative z-10 bg-white">
          {/* Top Bar: EXIT ONLY + CENTER TITLE */}
          <div className="w-full flex items-center justify-between">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
            <div className="px-5 py-1.5 rounded-full bg-slate-900 text-white font-black text-xs uppercase tracking-wider shadow-sm">
              INSTRUCTIONS TO PLAY
            </div>
            <div className="w-16" />
          </div>

          {/* Instruction 3-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full my-auto">
            {/* Card 1: Free Energy Profile Image */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Watch the Energy Curve</h3>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Reaction Graph
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Look at the curve. If the product level is downhill, the reaction flows naturally. If it is uphill, it needs extra energy!
                </p>
              </div>
              <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex items-center justify-center h-20 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/gibbs_card1.png"
                  alt="Reaction Free Energy Profile"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 2: Temperature Slider Image */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Change Temperature</h3>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Heat Slider
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Drag the slider to make it hotter or colder. Notice how heating shifts the energy and helps the reaction occur on its own!
                </p>
              </div>
              <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex items-center justify-center h-20 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/gibbs_card2.png"
                  alt="Temperature Slider"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Card 3: Live Meter & Check Answer Image */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <h3 className="font-black text-slate-900 text-sm">Select Your Answer</h3>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-2">
                  Check Prediction
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Based on the value of ΔG, decide whether the reaction is Spontaneous or Non-Spontaneous, then click CHECK ANSWER to test your choice!
                </p>
              </div>
              <div className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex items-center justify-center h-20 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/gibbs_card3.png"
                  alt="Gibbs Meter & Answer"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Back & Play buttons (Identical dimensions & padding) */}
          <div className="w-full flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setScreen("mission")}
              className="w-32 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center justify-center"
            >
              &lt; BACK
            </button>
            <button
              onClick={() => setScreen("lab")}
              className="w-32 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>PLAY</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SCREEN 3: INTERACTIVE LAB (Single Canvas Div: Exit + Content + All) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {screen === "lab" && (
        <div className="w-full h-full flex flex-col justify-between p-2 sm:p-2.5 text-slate-800 relative z-10 bg-white">

          {/* Top Bar: EXIT on Left, EXPLANATION on Right */}
          <div className="w-full flex items-center justify-between mb-1 shrink-0">
            <button
              onClick={handleExit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition active:scale-95 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            <button
              onClick={() => setShowExplanation(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-sm cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Main Content Area: Visual Graph takes full width, bottom controls in 2 clean compact rows */}
          <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden gap-1.5 pt-0.5">

            {/* ───────────────────────────────────────────────────────────── */}
            {/* TOP: Full Width Free Energy Reaction Coordinate Profile Graph */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="flex-1 w-full flex flex-col justify-between min-h-0 relative">

              {/* Reaction Coordinate SVG Diagram - Expanded ViewBox for Full Screen Breadth */}
              <div className="w-full flex-1 flex items-center justify-center relative min-h-0">
                <svg
                  viewBox="0 0 680 230"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`${gradientId}-blueGrad`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id={`${gradientId}-roseGrad`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id={`${gradientId}-emeraldGrad`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                    </linearGradient>
                    <marker
                      id={`${gradientId}-arrow`}
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#0F172A" />
                    </marker>
                  </defs>

                  {/* Y Axis Arrow (Free Energy G°) */}
                  <line
                    x1="45"
                    y1="210"
                    x2="45"
                    y2="12"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    markerEnd={`url(#${gradientId}-arrow)`}
                  />
                  <text x="16" y={reactantY + 5} fill="#0F172A" fontWeight="900" fontSize="16" fontFamily="sans-serif">
                    G°
                  </text>

                  {/* X Axis Arrow (Course of reaction / Reaction coordinate) */}
                  <line
                    x1="45"
                    y1="210"
                    x2="655"
                    y2="210"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    markerEnd={`url(#${gradientId}-arrow)`}
                  />
                  <text
                    x="350"
                    y="224"
                    textAnchor="middle"
                    fill="#334155"
                    fontWeight="700"
                    fontSize="11.5"
                    fontFamily="sans-serif"
                  >
                    Course of reaction (reaction coordinate)
                  </text>

                  {/* Reactant Baseline Dashed Line */}
                  <line
                    x1="45"
                    y1={reactantY}
                    x2="630"
                    y2={reactantY}
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Transition State Horizontal Guide */}
                  <line
                    x1="330"
                    y1={tsY}
                    x2="630"
                    y2={tsY}
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Activation Barrier Shaded Region (Reactant baseline to TS) */}
                  <path
                    d={`M 330 ${tsY} C 430 ${tsY}, 520 ${productY}, 580 ${productY} L 630 ${productY} L 630 ${tsY} Z`}
                    fill={`url(#${gradientId}-blueGrad)`}
                  />

                  {/* Delta G Net Shaded Region (Between Reactant baseline and Product level) */}
                  {deltaG < 0 ? (
                    // Exergonic / Downhill: Product is below reactant baseline
                    <path
                      d={`M 330 ${reactantY} C 450 ${reactantY}, 530 ${productY}, 580 ${productY} L 630 ${productY} L 630 ${reactantY} Z`}
                      fill={`url(#${gradientId}-emeraldGrad)`}
                    />
                  ) : (
                    // Endergonic / Uphill: Product is above reactant baseline
                    <path
                      d={`M 330 ${reactantY} C 450 ${reactantY}, 530 ${productY}, 580 ${productY} L 630 ${productY} L 630 ${reactantY} Z`}
                      fill={`url(#${gradientId}-roseGrad)`}
                    />
                  )}

                  {/* Free Energy Curve Path */}
                  <path
                    d={`M 45 ${reactantY} L 120 ${reactantY} C 200 ${reactantY}, 260 ${tsY}, 330 ${tsY} C 400 ${tsY}, 500 ${productY}, 580 ${productY} L 630 ${productY}`}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Reactants Label */}
                  <text
                    x="120"
                    y={reactantY - 9}
                    textAnchor="start"
                    fill="#0F172A"
                    fontWeight="800"
                    fontSize="13"
                    fontFamily="sans-serif"
                  >
                    Reactants
                  </text>

                  {/* Transition State Label */}
                  <text
                    x="330"
                    y={tsY - 10}
                    textAnchor="middle"
                    fill="#0F172A"
                    fontWeight="800"
                    fontSize="13"
                    fontFamily="sans-serif"
                  >
                    Transition state
                  </text>
                  <circle cx="330" cy={tsY} r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                  {/* Products Label */}
                  <text
                    x="580"
                    y={productY + (deltaG < 0 ? 18 : -10)}
                    textAnchor="middle"
                    fill="#0F172A"
                    fontWeight="800"
                    fontSize="13"
                    fontFamily="sans-serif"
                  >
                    Products
                  </text>
                  <circle cx="580" cy={productY} r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                  {/* Bracket 1: Delta G_double_dagger (Activation Energy Barrier) */}
                  <path
                    d={`M 633 ${tsY} h 6 v ${(reactantY - tsY) / 2 - 4} l 4 4 l -4 4 v ${(reactantY - tsY) / 2 - 4} h -6`}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                  <text
                    x="647"
                    y={(tsY + reactantY) / 2 + 4}
                    fill="#2563EB"
                    fontWeight="800"
                    fontSize="12"
                    fontFamily="sans-serif"
                  >
                    ΔG‡
                  </text>

                  {/* Bracket 2: Delta G_rxn (Net Gibbs Free Energy Change) */}
                  {Math.abs(productY - reactantY) > 6 && (
                    <>
                      <path
                        d={`M 633 ${reactantY} h 6 v ${(productY - reactantY) / 2 - (productY > reactantY ? 4 : -4)} l 4 ${(productY > reactantY ? 4 : -4)} l -4 ${(productY > reactantY ? 4 : -4)} v ${(productY - reactantY) / 2 - (productY > reactantY ? 4 : -4)} h -6`}
                        fill="none"
                        stroke={deltaG < 0 ? "#059669" : "#DC2626"}
                        strokeWidth="2"
                      />
                      <text
                        x="647"
                        y={(reactantY + productY) / 2 + 4}
                        fill={deltaG < 0 ? "#059669" : "#DC2626"}
                        fontWeight="800"
                        fontSize="12"
                        fontFamily="sans-serif"
                      >
                        ΔG°
                      </text>
                    </>
                  )}
                </svg>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* BOTTOM: All controls combined in a single clean compact row   */}
            {/* ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center gap-2 shrink-0 z-10 pt-0.5 border-t border-slate-100">

              {/* Temperature Slider Box with floating popup on slide */}
              <div className="flex-1 relative py-1 px-2 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs flex flex-col justify-between">
                
                {/* Floating dynamic popup when sliding / hovering */}
                {isSliding && (
                  <div
                    className="absolute -top-10 z-30 transform -translate-x-1/2 px-2.5 py-1 rounded-xl bg-slate-900 text-white shadow-xl pointer-events-none flex items-center gap-1.5 font-mono transition-all animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      left: `${Math.max(12, Math.min(88, ((temp - 100) / 400) * 100))}%`
                    }}
                  >
                    <span className="text-[10.5px] font-bold text-amber-300">T = {temp} K</span>
                    <span className="text-slate-500 font-sans">|</span>
                    <span className={`text-[10.5px] font-black ${deltaG < 0 ? "text-emerald-400" : deltaG === 0 ? "text-amber-400" : "text-rose-400"}`}>
                      ΔG = {deltaG > 0 ? `+${deltaG.toFixed(1)}` : deltaG.toFixed(1)} kJ/mol
                    </span>
                    {/* Downward triangle arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                )}

                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-900">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span className="uppercase tracking-wider">Temperature</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 font-mono font-black text-[11px] text-amber-800">
                    <Thermometer className="w-3 h-3 text-amber-600" />
                    <span>{temp} K</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="100"
                  max="500"
                  step="5"
                  value={temp}
                  onMouseDown={() => setIsSliding(true)}
                  onMouseUp={() => setIsSliding(false)}
                  onTouchStart={() => setIsSliding(true)}
                  onTouchEnd={() => setIsSliding(false)}
                  onChange={(e) => {
                    setTemp(Number(e.target.value));
                    setIsSliding(true);
                  }}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />

                {/* Milestone Labels */}
                <div className="flex justify-between font-mono font-bold text-[9.5px] text-slate-800 pt-0.5 px-0.5">
                  <button onClick={() => setTemp(100)} className="hover:text-blue-600 cursor-pointer">100K</button>
                  <button onClick={() => setTemp(200)} className="hover:text-blue-600 cursor-pointer">200K</button>
                  <button onClick={() => setTemp(267)} className="text-blue-600 font-black cursor-pointer underline decoration-blue-400">267K (T_eq)</button>
                  <button onClick={() => setTemp(400)} className="hover:text-blue-600 cursor-pointer">400K</button>
                  <button onClick={() => setTemp(500)} className="hover:text-blue-600 cursor-pointer">500K</button>
                </div>
              </div>

              {/* Spontaneous vs Non-Spontaneous Choice Buttons */}
              <div className="flex-1 grid grid-cols-2 gap-2 h-full">
                <button
                  onClick={() => setUserSpontaneous(true)}
                  className={`py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${userSpontaneous === true
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 scale-[1.01]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  Spontaneous
                </button>

                <button
                  onClick={() => setUserSpontaneous(false)}
                  className={`py-1.5 px-2.5 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${userSpontaneous === false
                      ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 scale-[1.01]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  Non-Spontaneous
                </button>
              </div>

              {/* Check Answer Button */}
              <button
                onClick={handleCheckAnswer}
                className="w-36 sm:w-44 py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer shrink-0 whitespace-nowrap h-full"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">CHECK ANSWER</span>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: EXPLANATION SCREEN (Full-Screen View)                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showExplanation && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Gibbs Free Energy &amp; Spontaneity
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Topic Guide &bull; Thermodynamic Concepts
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Full Screen Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 text-slate-800 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
            <div>
              <h4 className="font-black text-slate-900 text-sm mb-1">
                1. What is Gibbs Free Energy (ΔG)? (The Big Picture)
              </h4>
              <p className="text-slate-700">
                In nature, chemical reactions happen because molecules want to reach a state of lowest possible energy and greatest stability. Gibbs Free Energy (G) measures the usable energy of a system.
              </p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-700 font-medium">
                <li><strong className="text-emerald-700">ΔG &lt; 0 (Negative):</strong> <em>Spontaneous!</em> The reaction happens naturally without needing continuous outside help.</li>
                <li><strong className="text-amber-700">ΔG = 0:</strong> <em>Equilibrium!</em> The forward and reverse reaction rates are perfectly balanced.</li>
                <li><strong className="text-rose-700">ΔG &gt; 0 (Positive):</strong> <em>Non-Spontaneous!</em> The reaction will not happen on its own (it needs constant energy pumped in).</li>
              </ul>
            </div>

            {/* Beginner-friendly Real-life Example */}
            <div className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5">
              <h4 className="font-black text-blue-900 text-sm mb-1">
                2. Real-Life Example: Melting Ice Cubes
              </h4>
              <p className="text-slate-700">
                Think about an ice cube melting into liquid water:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-700">
                <li><strong>Inside a Freezer (-10°C / 263 K):</strong> The ice refuses to melt on its own (ΔG &gt; 0, <em>non-spontaneous</em>).</li>
                <li><strong>On a Warm Kitchen Counter (+25°C / 298 K):</strong> The ice melts completely on its own without anyone touching it (ΔG &lt; 0, <em>spontaneous</em>)!</li>
                <li><strong>At Exactly 0°C (273 K):</strong> Solid ice and liquid water stay in perfect dynamic balance (ΔG = 0, <em>equilibrium</em>).</li>
              </ul>
              <p className="text-blue-950 font-semibold text-[11px] mt-2">
                &rarr; The exact same substance changes from non-spontaneous to spontaneous simply because the temperature crossed its tipping point!
              </p>
            </div>

            <div>
              <h4 className="font-black text-slate-900 text-sm mb-1">
                3. The Fundamental Equation: The Tug-of-War
              </h4>
              <p className="font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-center">
                ΔG = ΔH − T&middot;ΔS
              </p>
              <p className="mt-1.5 text-slate-700">
                Two opposing forces decide if a reaction happens:
                <br />• <strong>Enthalpy (ΔH):</strong> The heat cost. Positive (+40 kJ/mol) means the reaction absorbs heat (costs energy).
                <br />• <strong>Entropy (ΔS):</strong> Molecular freedom/disorder. Positive (+0.150 kJ/mol&middot;K) means particles get more chaotic.
                <br />• <strong>Temperature (T):</strong> Acts as a multiplier for entropy. Higher temperature gives the disorder term (−T·ΔS) massive power to beat enthalpy!
              </p>
            </div>

            <div>
              <h4 className="font-black text-slate-900 text-sm mb-1">
                4. The "Ball on a Hill" Analogy (The Reaction Curve)
              </h4>
              <p className="text-slate-700">
                Think of the curve like rolling a ball:
                <br />• <strong>When ΔG &lt; 0 (Downhill):</strong> The product valley sits below the reactants. Once the ball gets a tiny push over the transition bump (ΔG‡), it rolls down into products completely on its own!
                <br />• <strong>When ΔG &gt; 0 (Uphill):</strong> The product valley sits above the reactants. You have to continuously push the ball uphill, so it won&apos;t happen by itself.
              </p>
            </div>

            <div>
              <h4 className="font-black text-slate-900 text-sm mb-1">
                5. Calculating the Spontaneity Threshold (T_eq)
              </h4>
              <p className="text-slate-700">
                At what exact temperature does the reaction switch from non-spontaneous to spontaneous? Set ΔG = 0:
              </p>
              <div className="font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-900 text-[11px] font-bold mt-1.5 text-center">
                0 = ΔH − T&middot;ΔS &implies; T_eq = ΔH / ΔS = 40.0 / 0.150 = 266.7 K &approx; 267 K
              </div>
              <p className="text-slate-700 mt-1">
                • <strong>Below 267 K:</strong> Enthalpy wins &rarr; ΔG &gt; 0 (Non-spontaneous, uphill)
                <br />• <strong>Above 267 K:</strong> Entropy wins &rarr; ΔG &lt; 0 (Spontaneous, downhill!)
              </p>
            </div>
          </div>

          {/* Footer with Centered Button */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-center bg-slate-50 shrink-0">
            <button
              onClick={() => setShowExplanation(false)}
              className="px-8 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: SUCCESS MODAL                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Thermodynamic Mastery Achieved!
            </h3>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 w-full text-xs font-mono font-bold text-emerald-800">
              At T = {temp} K: ΔG = {deltaG > 0 ? `+${deltaG.toFixed(1)}` : deltaG.toFixed(1)} kJ/mol
              <br />
              {isActualSpontaneous ? "Process is Spontaneous (ΔG < 0)" : "Process is Non-Spontaneous (ΔG > 0)"}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {temp >= 267
                ? `You correctly identified that at ${temp} K (above 267 K), −T·ΔS outweighs +ΔH, making ΔG negative and driving the forward reaction downhill spontaneously!`
                : `You correctly identified that at ${temp} K (below 267 K), thermal energy is insufficient to overcome the positive enthalpy (+40 kJ/mol), keeping ΔG positive and non-spontaneous!`}
            </p>

            {/* Success Action Buttons: REPLAY and EXPLANATION */}
            <div className="w-full grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  handleReset();
                }}
                className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>REPLAY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExplanation(true);
                }}
                className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 fill-current" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: INCORRECT MODAL                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showFailModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Check Your Signs!
            </h3>

            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              {failFeedback}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 w-full text-xs text-slate-600 font-mono text-left space-y-1">
              <div>&bull; ΔG &lt; 0 &rarr; <strong>Spontaneous</strong> (Downhill)</div>
              <div>&bull; ΔG &gt; 0 &rarr; <strong>Non-Spontaneous</strong> (Uphill)</div>
              <div>&bull; Equil Threshold: T = 40.0 / 0.150 = <strong>267 K</strong></div>
            </div>

            {/* Incorrect Action Buttons: RETRY and EXPLANATION */}
            <div className="w-full grid grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowFailModal(false)}
                className="w-full py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>RETRY</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowFailModal(false);
                  setShowExplanation(true);
                }}
                className="w-full py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <BookOpen className="w-3.5 h-3.5 fill-current" />
                <span>EXPLANATION</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
