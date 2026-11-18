"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  BookOpen,
  X,
  ArrowRight,
  Plus,
  Trash2,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Layers,
  Scale,
  Flame,
  Zap,
} from "lucide-react";

// ============================================================================
// DATA TYPES FOR THERMOCHEMICAL EQUATIONS
// ============================================================================
interface ChemicalTerm {
  species: string; // e.g. "C(s)", "O2(g)", "CO(g)", "CO2(g)"
  coeff: number; // e.g. 1, 0.5, 2
}

interface ReactionEquation {
  id: string;
  name: string;
  reactants: ChemicalTerm[];
  products: ChemicalTerm[];
  baseDeltaH: number; // in kJ
  description: string;
}

interface PathwayStep {
  instanceId: string;
  reactionId: string;
  multiplier: number; // 0.5, 1, 2
  isReversed: boolean;
}

// Available library of reactions
const REACTION_LIBRARY: ReactionEquation[] = [
  {
    id: "rxn-1",
    name: "Combustion of C to CO",
    reactants: [
      { species: "C(s)", coeff: 1 },
      { species: "O₂(g)", coeff: 0.5 },
    ],
    products: [{ species: "CO(g)", coeff: 1 }],
    baseDeltaH: -110.5,
    description: "Partial oxidation of solid carbon to carbon monoxide",
  },
  {
    id: "rxn-2",
    name: "Oxidation of CO to CO₂",
    reactants: [
      { species: "CO(g)", coeff: 1 },
      { species: "O₂(g)", coeff: 0.5 },
    ],
    products: [{ species: "CO₂(g)", coeff: 1 }],
    baseDeltaH: -283.0,
    description: "Complete oxidation of carbon monoxide to carbon dioxide",
  },
  {
    id: "rxn-3",
    name: "Decomposition of CO₂",
    reactants: [{ species: "CO₂(g)", coeff: 1 }],
    products: [
      { species: "C(s)", coeff: 1 },
      { species: "O₂(g)", coeff: 1 },
    ],
    baseDeltaH: 393.5,
    description: "Thermal decomposition of carbon dioxide into carbon and oxygen",
  },
];

// Target Reaction: C(s) + O2(g) -> CO2(g) with ΔH = -393.5 kJ
const TARGET_REACTION = {
  equation: "C(s) + O₂(g) ➔ CO₂(g)",
  deltaH: -393.5,
  requiredSpecies: {
    reactants: { "C(s)": 1, "O₂(g)": 1 },
    products: { "CO₂(g)": 1 },
  },
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function HesssLawGamePage({
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

  // Active pathway steps created by the user (starts empty so step 1 is not default selected)
  const [pathway, setPathway] = useState<PathwayStep[]>([]);

  // Universal Exit Handler
  const handleExitClick = () => {
    if (onExit) {
      onExit();
    } else {
      window.history.back();
    }
  };

  // Add a reaction card into pathway
  const handleAddReaction = (rxnId: string) => {
    const newStep: PathwayStep = {
      instanceId: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reactionId: rxnId,
      multiplier: 1,
      isReversed: false,
    };
    setPathway((prev) => [...prev, newStep]);
    const rxn = REACTION_LIBRARY.find((r) => r.id === rxnId);
    setNotification(`Added "${rxn?.name}" to pathway.`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Remove a step
  const handleRemoveStep = (instanceId: string) => {
    setPathway((prev) => prev.filter((s) => s.instanceId !== instanceId));
  };

  // Toggle Reverse (flip reactants & products, negate ΔH)
  const handleToggleReverse = (instanceId: string) => {
    setPathway((prev) =>
      prev.map((s) => {
        if (s.instanceId === instanceId) {
          const nextReversed = !s.isReversed;
          setNotification(
            nextReversed
              ? "Reversed equation! Enthalpy sign inverted (ΔH × -1)."
              : "Restored forward equation direction."
          );
          setTimeout(() => setNotification(null), 2500);
          return { ...s, isReversed: nextReversed };
        }
        return s;
      })
    );
  };

  // Change Multiplier
  const handleChangeMultiplier = (instanceId: string, mult: number) => {
    setPathway((prev) =>
      prev.map((s) => {
        if (s.instanceId === instanceId) {
          return { ...s, multiplier: mult };
        }
        return s;
      })
    );
  };

  // Reset experiment
  const handleReset = () => {
    setPathway([{ instanceId: "init-1", reactionId: "rxn-1", multiplier: 1, isReversed: false }]);
    setShowVictoryModal(false);
    setShowIncorrectModal(false);
    setNotification("Pathway reset to starting state.");
    setTimeout(() => setNotification(null), 2500);
  };

  // Compute live net thermochemical equation & total ΔH
  const { netReactants, netProducts, totalDeltaH, cancelledSpecies } = useMemo(() => {
    const reactantMap: Record<string, number> = {};
    const productMap: Record<string, number> = {};
    let sumDeltaH = 0;

    pathway.forEach((step) => {
      const base = REACTION_LIBRARY.find((r) => r.id === step.reactionId);
      if (!base) return;

      const factor = step.multiplier * (step.isReversed ? -1 : 1);
      sumDeltaH += base.baseDeltaH * factor;

      const effectiveReactants = step.isReversed ? base.products : base.reactants;
      const effectiveProducts = step.isReversed ? base.reactants : base.products;

      effectiveReactants.forEach((t) => {
        reactantMap[t.species] = (reactantMap[t.species] || 0) + t.coeff * step.multiplier;
      });

      effectiveProducts.forEach((t) => {
        productMap[t.species] = (productMap[t.species] || 0) + t.coeff * step.multiplier;
      });
    });

    // Determine cancellations
    const allSpecies = Array.from(
      new Set([...Object.keys(reactantMap), ...Object.keys(productMap)])
    );
    const finalReactants: Record<string, number> = {};
    const finalProducts: Record<string, number> = {};
    const cancelled: string[] = [];

    allSpecies.forEach((sp) => {
      const rQty = reactantMap[sp] || 0;
      const pQty = productMap[sp] || 0;

      if (rQty > 0 && pQty > 0) {
        cancelled.push(sp);
      }

      if (rQty > pQty) {
        finalReactants[sp] = rQty - pQty;
      } else if (pQty > rQty) {
        finalProducts[sp] = pQty - rQty;
      }
    });

    return {
      netReactants: finalReactants,
      netProducts: finalProducts,
      totalDeltaH: Number(sumDeltaH.toFixed(1)),
      cancelledSpecies: cancelled,
    };
  }, [pathway]);

  // Format chemical equation string
  const formatTerms = (map: Record<string, number>) => {
    const entries = Object.entries(map).filter(([_, qty]) => qty > 0);
    if (entries.length === 0) return "—";
    return entries
      .map(([sp, qty]) => {
        if (qty === 1) return sp;
        if (qty === 0.5) return `½ ${sp}`;
        if (qty === 1.5) return `1½ ${sp}`;
        return `${qty} ${sp}`;
      })
      .join(" + ");
  };

  const netEquationString = `${formatTerms(netReactants)} ➔ ${formatTerms(netProducts)}`;

  // Verification / Submission logic
  const handleCheckAnswer = () => {
    // Check if totalDeltaH matches TARGET_REACTION.deltaH (-393.5 kJ)
    const isDeltaHCorrect = Math.abs(totalDeltaH - TARGET_REACTION.deltaH) < 0.2;

    // Check if net equation matches target
    const hasC = (netReactants["C(s)"] || 0) === 1;
    const hasO2 = (netReactants["O₂(g)"] || 0) === 1;
    const hasCO2 = (netProducts["CO₂(g)"] || 0) === 1;
    const noExtraReactants = Object.keys(netReactants).length === 2;
    const noExtraProducts = Object.keys(netProducts).length === 1;

    const isEquationCorrect = hasC && hasO2 && hasCO2 && noExtraReactants && noExtraProducts;

    if (isDeltaHCorrect && isEquationCorrect) {
      setShowVictoryModal(true);
    } else {
      if (!isEquationCorrect && isDeltaHCorrect) {
        setIncorrectFeedback(
          "Enthalpy value matches -393.5 kJ, but the net equation still has unwanted spectator substances! Ensure all intermediate species cancel out."
        );
      } else if (isEquationCorrect && !isDeltaHCorrect) {
        setIncorrectFeedback(
          `Equation matches target, but calculated ΔH is ${totalDeltaH} kJ instead of -393.5 kJ. Check multipliers or signs!`
        );
      } else {
        setIncorrectFeedback(
          `Current net equation is: ${netEquationString} with ΔH = ${totalDeltaH} kJ. Target requires combining C + ½O₂ ➔ CO and CO + ½O₂ ➔ CO₂ so CO(g) cancels out to yield -393.5 kJ.`
        );
      }
      setShowIncorrectModal(true);
    }
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-[#F8FAFC] text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200 shadow-2xl">

      {/* ─── TOAST NOTIFICATION ─── */}
      {notification && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none text-center max-w-[90%]">
          {notification}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
            SCREEN 1: MISSION SCREEN (LANDSCAPE 956x440)
            ══════════════════════════════════════════════════════════════════ */}
      {screenState === "mission" && (
        <div className="w-full h-full flex flex-col justify-between p-6 sm:p-7 relative bg-white">
          {/* Top Bar with EXIT */}
          <div className="w-full flex items-center justify-start z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Central Mission Statement */}
          <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center flex-1 my-auto z-10 px-4 space-y-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              <span className="text-[#0284C7] font-extrabold uppercase">MISSION:</span> Combine reaction steps to build the target:
            </h2>

            <div className="font-mono text-base sm:text-xl font-extrabold text-slate-800 bg-sky-50/80 border border-sky-200/90 px-5 py-2 rounded-2xl shadow-xs">
              C(s) + O₂(g) ➔ CO₂(g)
            </div>

            <p className="text-sm sm:text-base font-extrabold text-slate-700">
              and reach total energy <span className="text-amber-500 font-black">ΔH = -393.5 kJ</span>!
            </p>

            <div className="pt-2 flex justify-center w-full">
              <button
                type="button"
                onClick={() => setScreenState("instructions")}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom branding logo mark */}
          <div className="w-full flex justify-start z-10 shrink-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-md">
              N
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
            SCREEN 2: INSTRUCTIONS SCREEN (LANDSCAPE 956x440)
            ══════════════════════════════════════════════════════════════════ */}
      {screenState === "instructions" && (
        <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 relative bg-white overflow-hidden">
          {/* Top Bar with EXIT and INSTRUCTIONS TO PLAY badge */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>EXIT</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden sm:block" />
              <div className="px-5 py-1.5 rounded-full bg-[#0B132B] text-white text-xs font-black uppercase tracking-wider shadow-md border border-slate-700/50">
                INSTRUCTIONS TO PLAY
              </div>
              <div className="w-12 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden sm:block" />
            </div>

            <div className="w-16" />
          </div>

          {/* 3 Step Guidance Cards in Landscape Grid */}
          <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 flex-1 my-1">
            <div className="grid grid-cols-3 gap-3.5 w-full items-stretch">

              {/* Card 1: Add Steps from Library */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Select Reaction Steps
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                      + ADD TO PATHWAY
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Click the<strong>+ ADD</strong> button on the reactions you need to build your target pathway.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/hesss_card1_add.png"
                    alt="Click Add to Pathway"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 2: Pathway Deck Controls */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Adjust Equation Deck
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-extrabold text-[9px] uppercase tracking-wider">
                      REVERSE &bull; SCALE &bull; DELETE
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Flip direction with <strong>REVERSE</strong>, adjust coefficients with <strong>&times;1 / &times;2</strong>, or delete using the red trash can.
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/hesss_card2_pathway.png"
                    alt="Active Pathway Deck Controls"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Card 3: Check Net Equation & Total Enthalpy */}
              <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Check Total &Delta;H
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[9px] uppercase tracking-wider">
                      TOTAL &Delta;H = &minus;393.5 kJ
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[11px] leading-tight mt-1.5">
                    Monitor the live net equation and total energy on the dark meter, then click <strong>CHECK ANSWER</strong> to verify!
                  </p>
                </div>
                <div className="w-full h-20 rounded-xl overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center mt-2 shadow-inner p-1">
                  <img
                    src="/images/hesss_card3_net_check.png"
                    alt="Net Equation and Check Answer"
                    className="w-full h-full object-contain rounded-lg bg-white"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Actions: Closely spaced */}
          <div className="w-full flex items-center justify-center gap-4 max-w-md mx-auto pt-2 z-10 shrink-0">
            <button
              type="button"
              onClick={() => setScreenState("mission")}
              className="flex items-center gap-1.5 h-9 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>BACK</span>
            </button>

            <button
              type="button"
              onClick={() => setScreenState("lab")}
              className="flex items-center gap-1.5 h-9 px-7 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>PLAY</span>
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
            SCREEN 3: INTERACTIVE HESS'S LAW LAB (LANDSCAPE 956x440)
            Single seamless white container layout
            ══════════════════════════════════════════════════════════════════ */}
      {screenState === "lab" && (
        <div className="w-full h-full flex flex-col justify-between relative bg-white overflow-hidden p-2.5 sm:p-3">
          {/* Top Bar: EXIT and EXPLANATION */}
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 z-30 shrink-0">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* Seamless 2-Column Workspace */}
          <div className="flex-1 w-full grid grid-cols-12 gap-3.5 pt-2 overflow-hidden">

            {/* LEFT COLUMN (5 cols): Reaction Cards Library (Expands to cover bottom, no scroll, no bottom reset) */}
            <div className="col-span-5 flex flex-col h-full overflow-hidden pr-2 border-r border-slate-100">
              <div className="flex items-center justify-between pb-1.5 shrink-0">
                <span className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  REACTION LIBRARY
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Click to add
                </span>
              </div>

              {/* Reaction cards: evenly expanding to fill entire column height to bottom */}
              <div className="flex-1 flex flex-col justify-between gap-2.5 py-0.5">
                {REACTION_LIBRARY.map((rxn, idx) => {
                  const isAlreadyAdded = pathway.some((p) => p.reactionId === rxn.id);
                  const reactantStr = rxn.reactants
                    .map((r) => (r.coeff === 1 ? r.species : `${r.coeff} ${r.species}`))
                    .join(" + ");
                  const productStr = rxn.products
                    .map((p) => (p.coeff === 1 ? p.species : `${p.coeff} ${p.species}`))
                    .join(" + ");

                  // Distinct vibrant color themes for each card
                  const colorThemes = [
                    {
                      bg: "bg-sky-50/70 hover:bg-sky-50",
                      border: "border-sky-200",
                      activeBorder: "border-sky-400 ring-1 ring-sky-300",
                      title: "text-sky-950",
                      badge: "bg-sky-100/90 text-sky-700 border-sky-300",
                      btn: "bg-sky-600 hover:bg-sky-700",
                    },
                    {
                      bg: "bg-emerald-50/70 hover:bg-emerald-50",
                      border: "border-emerald-200",
                      activeBorder: "border-emerald-400 ring-1 ring-emerald-300",
                      title: "text-emerald-950",
                      badge: "bg-emerald-100/90 text-emerald-700 border-emerald-300",
                      btn: "bg-emerald-600 hover:bg-emerald-700",
                    },
                    {
                      bg: "bg-purple-50/70 hover:bg-purple-50",
                      border: "border-purple-200",
                      activeBorder: "border-purple-400 ring-1 ring-purple-300",
                      title: "text-purple-950",
                      badge: "bg-purple-100/90 text-purple-700 border-purple-300",
                      btn: "bg-purple-600 hover:bg-purple-700",
                    },
                  ];
                  const theme = colorThemes[idx % colorThemes.length];

                  return (
                    <div
                      key={rxn.id}
                      className={`flex-1 p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col justify-between ${theme.bg} ${isAlreadyAdded ? theme.activeBorder : theme.border
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-xs sm:text-[13px] ${theme.title}`}>
                          {rxn.name}
                        </span>
                        <span className={`font-mono font-extrabold text-[11px] px-2 py-0.5 rounded border ${theme.badge}`}>
                          {rxn.baseDeltaH > 0 ? `+${rxn.baseDeltaH}` : rxn.baseDeltaH} kJ
                        </span>
                      </div>

                      <div className="font-mono text-xs sm:text-[13px] text-slate-800 font-extrabold my-1">
                        {reactantStr} ➔ {productStr}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                        <span className="text-[9.5px] text-slate-500 truncate max-w-[180px]">
                          {rxn.description}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddReaction(rxn.id)}
                          className={`px-3.5 py-1 rounded-lg text-white font-bold text-[10.5px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs ${theme.btn}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>ADD</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN (7 cols): Pathway Deck & Live Net Calculation */}
            <div className="col-span-7 flex flex-col justify-between overflow-hidden">

              {/* Active Pathway Header */}
              <div className="flex items-center justify-between pb-1">
                <span className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#0284C7]" />
                  ACTIVE PATHWAY DECK ({pathway.length} STEPS)
                </span>
                {cancelledSpecies.length > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    Intermediates Cancelled: {cancelledSpecies.join(", ")}
                  </span>
                )}
              </div>

              {/* Pathway Steps List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 py-1 pr-1">
                {pathway.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
                    <span>No reactions in pathway yet.</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Add reactions from the left library to begin!
                    </span>
                  </div>
                ) : (
                  pathway.map((step, idx) => {
                    const base = REACTION_LIBRARY.find((r) => r.id === step.reactionId);
                    if (!base) return null;

                    const effReactants = step.isReversed ? base.products : base.reactants;
                    const effProducts = step.isReversed ? base.reactants : base.products;
                    const stepDeltaH = Number(
                      (base.baseDeltaH * step.multiplier * (step.isReversed ? -1 : 1)).toFixed(1)
                    );

                    return (
                      <div
                        key={step.instanceId}
                        className="bg-slate-50 border border-slate-200/90 rounded-xl p-2 transition-all flex flex-col gap-1 hover:border-sky-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-600 uppercase">
                            STEP {idx + 1}: {base.name}
                          </span>
                          <span className="font-mono font-black text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ΔH = {stepDeltaH > 0 ? `+${stepDeltaH}` : stepDeltaH} kJ
                          </span>
                        </div>

                        {/* Equation with live terms & cancellation strike-through */}
                        <div className="font-mono text-xs font-extrabold text-slate-900 flex items-center flex-wrap gap-1.5">
                          {/* Reactants */}
                          {effReactants.map((t, ti) => {
                            const effQty = t.coeff * step.multiplier;
                            const isCancelled = cancelledSpecies.includes(t.species);
                            return (
                              <span
                                key={ti}
                                className={`px-1.5 py-0.5 rounded ${isCancelled
                                    ? "line-through text-rose-500 bg-rose-50 border border-rose-200"
                                    : "text-slate-900"
                                  }`}
                              >
                                {effQty === 1 ? "" : effQty === 0.5 ? "½ " : `${effQty} `}
                                {t.species}
                                {ti < effReactants.length - 1 ? " +" : ""}
                              </span>
                            );
                          })}

                          <span className="text-sky-600 font-black px-1">➔</span>

                          {/* Products */}
                          {effProducts.map((t, ti) => {
                            const effQty = t.coeff * step.multiplier;
                            const isCancelled = cancelledSpecies.includes(t.species);
                            return (
                              <span
                                key={ti}
                                className={`px-1.5 py-0.5 rounded ${isCancelled
                                    ? "line-through text-rose-500 bg-rose-50 border border-rose-200"
                                    : "text-slate-900"
                                  }`}
                              >
                                {effQty === 1 ? "" : effQty === 0.5 ? "½ " : `${effQty} `}
                                {t.species}
                                {ti < effProducts.length - 1 ? " +" : ""}
                              </span>
                            );
                          })}
                        </div>

                        {/* Controls: Reverse, Multipliers, Remove */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <div className="flex items-center gap-1.5">
                            {/* Reverse Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleReverse(step.instanceId)}
                              className={`px-2 py-0.5 rounded-lg font-bold text-[9.5px] transition-all flex items-center gap-1 cursor-pointer ${step.isReversed
                                  ? "bg-purple-600 text-white shadow-xs"
                                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                }`}
                            >
                              <Repeat className="w-3 h-3" />
                              <span>{step.isReversed ? "REVERSED" : "REVERSE"}</span>
                            </button>

                            {/* Multiplier buttons */}
                            <div className="flex items-center bg-slate-200 rounded-lg p-0.5">
                              {[1, 2].map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => handleChangeMultiplier(step.instanceId, m)}
                                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer ${step.multiplier === m
                                      ? "bg-slate-900 text-white"
                                      : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                  &times;{m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Remove Step (Red Trash Button) */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(step.instanceId)}
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-200 shadow-xs"
                            title="Delete reaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Net Equation & Enthalpy Sum HUD */}
              <div className="pt-2 flex items-stretch gap-2.5">
                {/* Digital HUD Box */}
                <div className="flex-1 bg-[#0B132B] rounded-xl px-3 py-1.5 text-white flex items-center justify-between border border-slate-800 shadow-inner">
                  <div className="truncate max-w-[260px]">
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      NET EQUATION
                    </div>
                    <div className="font-mono font-bold text-xs text-sky-300 truncate">
                      {netEquationString}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                      TOTAL ΔH
                    </div>
                    <div className="font-mono font-black text-sm sm:text-base text-amber-400">
                      {totalDeltaH > 0 ? `+${totalDeltaH}` : totalDeltaH} kJ
                    </div>
                  </div>
                </div>

                {/* CHECK ANSWER BUTTON */}
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  className="w-36 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>CHECK ANSWER</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
            VICTORY MODAL (Side-by-side REPLAY & EXPLANATION)
            ══════════════════════════════════════════════════════════════════ */}
      {showVictoryModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-emerald-100 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600 shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-emerald-200/60">
              HESS'S LAW VERIFIED
            </span>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Reaction Pathway Mastered!
            </h3>

            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-5">
              You successfully combined the combustion equations, perfectly cancelled the intermediate{" "}
              <strong className="text-slate-900">CO(g)</strong>, and calculated the net enthalpy change of formation:{" "}
              <strong className="text-emerald-700">ΔH = -393.5 kJ</strong>!
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
          <div className="w-full max-w-md bg-white rounded-3xl p-6 text-center shadow-2xl border border-rose-100 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3 text-rose-600 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider mb-2 border border-rose-200/60">
              PATHWAY INCOMPLETE
            </span>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              Check Your Equations
            </h3>

            <p className="text-slate-600 text-xs font-medium leading-relaxed mb-5">
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
          <div className="w-full flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 tracking-tight">
                  Hess&apos;s Law &amp; Thermochemical Pathways
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Topic Guide &amp; Physical Concepts
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Editorial Content: Beginner-friendly, step-by-step guidance without clutter */}
          <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-5 space-y-6 text-slate-700 text-sm leading-relaxed w-full">

            {/* CONCEPT 1: The Big Picture (What is Hess's Law?) */}
            <section className="space-y-2">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 1: What is Hess&apos;s Law? (The Mountain Analogy)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Imagine hiking up a mountain. Whether you climb directly straight up to the peak or take two slower, winding paths, your <strong>total change in altitude is exactly the same</strong>!
              </p>
              <p className="text-slate-600 leading-relaxed">
                In chemistry, heat energy is called <strong>Enthalpy (&Delta;H)</strong>. Hess&apos;s Law simply says:
              </p>
              <p className="font-bold text-slate-900 pl-3 border-l-2 border-sky-500 py-1">
                &ldquo;The total heat gained or lost in a chemical reaction depends only on where you start and where you finish &mdash; not on the path or number of intermediate steps in between!&rdquo;
              </p>
              
              <div className="py-2 text-center font-mono font-bold text-sm sm:text-base text-slate-800 border-y border-slate-100">
                Total &Delta;H = &Delta;H(Step 1) + &Delta;H(Step 2) + &Delta;H(Step 3) + ...
              </div>

              <p className="text-slate-600 leading-relaxed">
                In this challenge, burning solid Carbon directly into Carbon Dioxide releases <strong>-393.5 kJ</strong> of heat:
              </p>
              <div className="font-mono text-xs sm:text-sm font-bold text-slate-800 pl-3">
                C(s) + O₂(g) ➔ CO₂(g) &nbsp;&bull;&nbsp; &Delta;H = -393.5 kJ
              </div>
              <p className="text-slate-600 text-xs">
                (The minus sign simply means <em>exothermic</em> &mdash; heat is released into the surroundings!)
              </p>
            </section>

            {/* CONCEPT 2: Two Simple Rules to Change Reactions */}
            <section className="space-y-2.5 border-t border-slate-100 pt-4">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 2: Two Simple Rules to Flip and Scale Reactions
              </h4>
              <p className="text-slate-600">
                Just like algebra, you can change thermochemical equations using two simple rules:
              </p>

              <div className="space-y-3 pt-1 pl-1">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Rule 1: If You Flip (Reverse) a Reaction, Invert the Sign (+ to -, or - to +)
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    If making a substance releases 100 kJ of heat, breaking it backwards absorbs 100 kJ of heat.
                  </p>
                  <p className="font-mono text-xs text-slate-800 mt-1 pl-2">
                    Forward: A ➔ B &nbsp;&bull;&nbsp; &Delta;H = -100 kJ<br/>
                    Reversed: B ➔ A &nbsp;&bull;&nbsp; &Delta;H = +100 kJ
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Rule 2: If You Multiply the Reaction, Multiply &Delta;H by the Same Number
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Burning 2 grams produces twice as much heat as burning 1 gram.
                  </p>
                  <p className="font-mono text-xs text-slate-800 mt-1 pl-2">
                    Standard: A ➔ B &nbsp;&bull;&nbsp; &Delta;H = -100 kJ<br/>
                    Doubled (&times;2): 2A ➔ 2B &nbsp;&bull;&nbsp; &Delta;H = -200 kJ
                  </p>
                </div>
              </div>
            </section>

            {/* CONCEPT 3: What is an Intermediate & How Does it Cancel? */}
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-base font-black text-slate-900 tracking-tight">
                Concept 3: What is an Intermediate &amp; Why Does It Cancel Out?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                An <strong>intermediate</strong> is like an temporary stepping stone: it is made in the first step and immediately used up in the second step. Because it is both made and destroyed, it does not appear in your final recipe!
              </p>
              <div className="font-mono text-xs text-slate-800 space-y-1 pl-3 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                <div>Step 1: C(s) + &frac12;O₂(g) ➔ <span className="line-through text-rose-500 font-bold">CO(g)</span> &nbsp;(&Delta;H = -110.5 kJ)</div>
                <div>Step 2: <span className="line-through text-rose-500 font-bold">CO(g)</span> + &frac12;O₂(g) ➔ CO₂(g) &nbsp;(&Delta;H = -283.0 kJ)</div>
                <div className="font-bold text-slate-900 pt-1 border-t border-slate-200">
                  Combined Net: C(s) + O₂(g) ➔ CO₂(g) &nbsp;(&Delta;H = -393.5 kJ)
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Notice: Carbon Monoxide (CO) appears on the right side in Step 1 and the left side in Step 2, so it completely cancels out! Also, &frac12;O₂ + &frac12;O₂ add up to 1 whole O₂.
              </p>
            </section>

            {/* HOW TO PLAY AND WIN */}
            <section className="space-y-2 border-t border-slate-100 pt-4 pb-2">
              <h4 className="text-base font-black text-[#0284C7] tracking-tight">
                How to Play &amp; Win (Step-by-Step)
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-600 pl-1">
                <li>
                  <strong className="text-slate-800">Add Step 1:</strong> On the left side, click <strong>+ ADD</strong> on <em>Combustion of C to CO</em>.
                </li>
                <li>
                  <strong className="text-slate-800">Add Step 2:</strong> Click <strong>+ ADD</strong> on <em>Oxidation of CO to CO₂</em>. Watch the red strike-through cancel the unwanted CO intermediate!
                </li>
                <li>
                  <strong className="text-slate-800">Check the Meter:</strong> Look at the dark box at the bottom &mdash; it now shows <strong>Total &Delta;H: -393.5 kJ</strong>!
                </li>
                <li>
                  <strong className="text-slate-800">Submit:</strong> Click the dark button <strong>CHECK ANSWER</strong> to verify your solution and win!
                </li>
              </ol>
            </section>

          </div>

          {/* Footer with Left 'N' and Centered RESUME CHALLENGE Button */}
          <div className="w-full px-6 py-3 border-t border-slate-100 flex items-center justify-center relative shrink-0 bg-white">
            <div className="absolute left-6 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-md">
              N
            </div>

            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="px-8 py-2 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

