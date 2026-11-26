"use client";

import React from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";
import {
  useQualitativeTestsStore,
  QUALITATIVE_STAGES,
} from "./QualitativeTestsStore";
import QualitativeTests3D from "./QualitativeTests3D";

// ============================================================================
// Standard Chemistry Explanation Data (Per Stage, matching project template)
// ============================================================================
interface StageExplanationData {
  title: string;
  subtitle: string;
  concept: string;
  formulas: {
    label: string;
    formula: string;
    explanation: string;
  }[];
  steps: {
    step: number;
    title: string;
    math?: string;
    explanation: string;
  }[];
  conclusion: string;
}

const STAGE_EXPLANATIONS: Record<number, StageExplanationData> = {
  1: {
    title: "Tollens' Test: Aldehyde vs. Ketone Differentiation",
    subtitle: "Module 11 • Carbonyl Compounds • Stage 1 of 3",
    concept:
      "Aldehydes and ketones both possess a carbonyl group (>C=O), but they differ drastically in their chemical oxidizability.\n\nIn an aldehyde (R-CHO), the carbonyl carbon is directly bonded to a hydrogen atom (formyl hydrogen). This C-H bond has significant hydridic character and is easily broken, allowing aldehydes to be oxidized into carboxylic acids under very mild conditions.\n\nIn contrast, ketones (R-CO-R') have two carbon groups attached to the carbonyl carbon. Because they lack a hydrogen on the carbonyl carbon, oxidizing a ketone requires breaking strong carbon-carbon (C-C) bonds, which only occurs under extreme heat with powerful oxidizers (like hot acidified KMnO₄).\n\nTollens' reagent (ammoniacal silver nitrate, [Ag(NH₃)₂]⁺) is a mild oxidizing agent. When warmed gently with an aldehyde, Ag⁺ ions are reduced to elemental metallic silver (Ag⁰), which coats the inner glass wall of the test tube as a brilliant specular 'silver mirror'. Ketones do not react.",
    formulas: [
      {
        label: "1. Reagent Preparation (Diamminesilver(I) Complex)",
        formula: "AgNO₃ + 2NH₄OH → [Ag(NH₃)₂]⁺ + NO₃⁻ + 2H₂O",
        explanation:
          "Silver nitrate is treated with dilute ammonia. An initial precipitate of silver oxide (Ag₂O) redissolves in excess ammonia to yield the linear, water-soluble coordination complex [H₃N-Ag-NH₃]⁺.",
      },
      {
        label: "2. Aldehyde Oxidation & Silver Deposition (Positive Test)",
        formula: "CH₃CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ ──(Δ, ~60°C)──> CH₃COO⁻ + 2Ag⁰↓ (Silver Mirror) + 4NH₃ + 2H₂O",
        explanation:
          "Acetaldehyde reduces silver ions (oxidation state +1) to metallic silver atoms (0), which deposit as a mirror coating on clean glass. Acetaldehyde is oxidized to the acetate ion (CH₃COO⁻).",
      },
      {
        label: "3. Ketone Non-Reactivity (Negative Test)",
        formula: "CH₃COCH₃ + [Ag(NH₃)₂]⁺ + OH⁻ ──(Δ)──> No Reaction (Remains Clear)",
        explanation:
          "Acetone lacks an easily cleavable formyl C-H bond. Tollens' reagent is far too mild to cleave carbon-carbon bonds, so the solution remains unchanged and clear.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Analyze Carbonyl Molecular Structure",
        math: "CH₃-CH(=O) [Aldehyde with formyl H] vs. CH₃-C(=O)-CH₃ [Ketone with no formyl H]",
        explanation:
          "Check whether the sample has a hydrogen atom directly bonded to the carbonyl group. Acetaldehyde has one formyl H, whereas Acetone has two alkyl methyl groups.",
      },
      {
        step: 2,
        title: "Dispense Tollens' Reagent & Apply Gentle Heat",
        math: "T = 25°C ──(Heating Bath)──> 60°C",
        explanation:
          "Dispense freshly prepared [Ag(NH₃)₂]⁺ into both test tubes. Mild heating in a water bath (~60°C) provides the necessary activation energy for electron transfer from the aldehyde to the silver complex.",
      },
      {
        step: 3,
        title: "Observe Diagnostic Silver Mirror Formation",
        math: "2Ag⁺ + 2e⁻ → 2Ag⁰ (Mirror deposit on inner glass wall)",
        explanation:
          "Tube A rapidly precipitates metallic silver onto the inner glass wall, creating a reflective silver mirror. Tube B remains completely transparent. Tube A is uniquely identified as Acetaldehyde.",
      },
    ],
    conclusion:
      "Key NCERT / JEE Takeaway: Tollens' reagent gives a positive silver mirror test with ALL aldehydes (both aliphatic and aromatic) and reducing sugars (such as glucose and fructose via Lobry de Bruyn–van Ekenstein transformation). Simple ketones give a negative test.",
  },
  2: {
    title: "Fehling's Test: Aliphatic vs. Aromatic Aldehyde Differentiation",
    subtitle: "Module 11 • Carbonyl Compounds • Stage 2 of 3",
    concept:
      "Tollens' test proves that a sample is an aldehyde, but it cannot differentiate between aliphatic and aromatic aldehydes because both give a positive silver mirror.\n\nFehling's test provides this critical distinction: it oxidizes ALIPHATIC aldehydes (like Acetaldehyde), but FAILS to oxidize AROMATIC aldehydes (like Benzaldehyde).\n\nFehling's reagent consists of two components mixed in equal parts before use:\n• Fehling's A: Aqueous copper(II) sulfate (CuSO₄·5H₂O), providing Cu²⁺ ions (blue).\n• Fehling's B: Alkaline sodium potassium tartrate (Rochelle salt) + NaOH. The tartrate dianions act as chelating ligands to keep Cu²⁺ dissolved in strongly alkaline solution without precipitating as Cu(OH)₂.\n\nWhen heated with an aliphatic aldehyde, Cu²⁺ is reduced to Cu⁺, which precipitates as a dense, insoluble brick-red solid of cuprous oxide (Cu₂O). In benzaldehyde, conjugation with the benzene ring stabilizes the carbonyl group, making it resistant to Fehling's mild oxidizing power.",
    formulas: [
      {
        label: "1. Bistartratocuprate(II) Complex (Fehling's Reagent)",
        formula: "CuSO₄ (Fehling A) + Rochelle Salt (Fehling B) → [Cu(C₄H₄O₆)₂]⁴⁻ (Deep Blue Complex)",
        explanation:
          "Tartrate chelation prevents premature precipitation of insoluble cupric hydroxide in alkaline medium while maintaining a reservoir of reactive Cu²⁺.",
      },
      {
        label: "2. Aliphatic Aldehyde Oxidation (Positive Test)",
        formula: "CH₃CHO + 2Cu²⁺ + 5OH⁻ ──(Δ, ~60-80°C)──> CH₃COO⁻ + Cu₂O↓ (Brick-Red Precipitate) + 3H₂O",
        explanation:
          "Acetaldehyde reduces Cu²⁺ (oxidation state +2, blue) to Cu⁺ (+1), which precipitates as insoluble cuprous oxide (Cu₂O) with a distinctive brick-red color.",
      },
      {
        label: "3. Aromatic Aldehyde Resistance (+R Resonance)",
        formula: "C₆H₅-CHO + Cu²⁺ (Fehling's) ──(Δ)──> No Reaction (Remains Royal Blue)",
        explanation:
          "The phenyl ring donates electron density into the carbonyl group via resonance (+M / +R effect). This reduces the partial positive charge on the carbonyl carbon and stabilizes the molecule against the weaker oxidizing power of Fehling's reagent.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Identify Aliphatic vs. Aromatic Structure",
        math: "CH₃-CHO (Aliphatic, alkyl donor) vs. C₆H₅-CHO (Aromatic, resonance delocalized)",
        explanation:
          "Acetaldehyde has an sp³ methyl substituent, whereas Benzaldehyde has a carbonyl group directly conjugated with an aromatic benzene ring.",
      },
      {
        step: 2,
        title: "Add Fehling's (A + B) Solution & Heat to 60°C",
        math: "T = 25°C ──(Heating Bath)──> 60°C",
        explanation:
          "Dispense the deep royal blue Fehling's mixture into both tubes. Warm the bath to ~60°C to activate the one-electron reduction cycle of the copper complex.",
      },
      {
        step: 3,
        title: "Observe Differential Brick-Red Precipitation",
        math: "2Cu²⁺ (Blue, aq) + 2e⁻ → Cu₂O↓ (Brick-Red Solid)",
        explanation:
          "Tube A (Acetaldehyde) turns opaque and deposits dense brick-red Cu₂O sediment. Tube B (Benzaldehyde) remains brilliant royal blue with zero precipitate. Tube A is confirmed as the aliphatic aldehyde.",
      },
    ],
    conclusion:
      "Key NCERT / JEE Takeaway: Fehling's and Benedict's reagents oxidize ALIPHATIC aldehydes, but DO NOT oxidize aromatic aldehydes (e.g., benzaldehyde, salicylaldehyde) or simple ketones. Use Tollens' to detect all aldehydes, and Fehling's to distinguish aliphatic from aromatic aldehydes.",
  },
  3: {
    title: "Iodoform (Haloform) Test: Detection of CH₃-C=O Groups",
    subtitle: "Module 11 • Carbonyl Compounds • Stage 3 of 3",
    concept:
      "The Iodoform (Haloform) reaction is a highly diagnostic qualitative test used to identify compounds containing either:\n1. A methyl carbonyl group (CH₃-C=O, as in acetaldehyde and methyl ketones).\n2. A secondary methyl carbinol group (CH₃-CH(OH)-), which is oxidized in situ by the halogen/base mixture into a methyl carbonyl group.\n\nWhen a methyl ketone is treated with iodine (I₂) in dilute aqueous sodium hydroxide (NaOH), the active reagent sodium hypoiodite (NaOI) successively iodinates the alpha-methyl group. Because each introduced iodine atom exerts a strong electron-withdrawing (-I) inductive effect, the remaining alpha-hydrogens become progressively more acidic and react even faster.\n\nOnce the triiodomethyl intermediate (R-CO-CI₃) forms, the -CI₃ group acts as a good leaving group. Hydroxide ion attacks the carbonyl carbon, cleaving the carbon-carbon bond to release triiodomethane (Iodoform, CHI₃). Iodoform precipitates as bright canary-yellow crystals with a characteristic sweet, medicinal (antiseptic hospital) odor.",
    formulas: [
      {
        label: "1. In Situ Generation of Hypoiodite",
        formula: "I₂ + 2NaOH → NaOI (Sodium Hypoiodite) + NaI + H₂O",
        explanation:
          "Iodine disproportionates in alkaline medium into iodide (I⁻) and hypoiodite (OI⁻), which serves as both the halogenating agent and mild oxidant.",
      },
      {
        label: "2. Exhaustive Alpha-Iodination (Triiodo Intermediate)",
        formula: "R-CO-CH₃ + 3I₂ + 3OH⁻ → R-CO-CI₃ + 3I⁻ + 3H₂O",
        explanation:
          "Base abstracts alpha-protons sequentially to form enolates that attack iodine. The final product is a triiodomethyl ketone (R-CO-CI₃).",
      },
      {
        label: "3. Nucleophilic Cleavage & Iodoform Precipitation",
        formula: "R-CO-CI₃ + OH⁻ → R-COO⁻ + CHI₃↓ (Canary-Yellow Crystals, m.p. 119°C)",
        explanation:
          "Hydroxide attacks the carbonyl carbon in a tetrahedral addition-elimination step. The -CI₃ carbanion is expelled and quickly protonated to yield canary-yellow iodoform crystals.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Count Alpha-Methyl Carbonyl Groups",
        math: "CH₃-C(=O)-CH₃ (Two CH₃-C=O groups) vs. CH₃-CH₂-C(=O)-CH₂-CH₃ (Zero CH₃-C=O groups)",
        explanation:
          "Acetone (Tube A) is a methyl ketone with two alpha-methyl groups adjacent to the carbonyl. 3-Pentanone (Tube B) has alpha-methylene (-CH₂-) groups but no alpha-methyl groups.",
      },
      {
        step: 2,
        title: "Dispense I₂ / NaOH & Warm Bath",
        math: "I₂ + NaOH ──(Heat Bath ~60°C)──> Active Haloform Cleavage",
        explanation:
          "Pour the amber iodine/alkali solution into both tubes and gently warm to ~60°C to accelerate the carbon-carbon cleavage step.",
      },
      {
        step: 3,
        title: "Observe Canary-Yellow Iodoform Crystals",
        math: "CHI₃↓ (Canary-Yellow Octahedral Crystals, Insoluble in water)",
        explanation:
          "Tube A rapidly precipitates crystalline canary-yellow iodoform (CHI₃) with a medicinal antiseptic odor. Tube B remains a clear pale-amber solution without precipitate. Tube A is confirmed as Acetone.",
      },
    ],
    conclusion:
      "Key NCERT / JEE Takeaway: A positive iodoform test is given by: (a) Acetaldehyde (the ONLY aldehyde that gives this test), (b) All methyl ketones (R-CO-CH₃), (c) Ethanol (the only primary alcohol that gives this test), and (d) Secondary alcohols of the form R-CH(OH)-CH₃.",
  },
};

interface QualitativeTestsGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export default function QualitativeTestsGamePage({
  difficulty = "level1",
  onExit,
}: QualitativeTestsGamePageProps) {
  const {
    stage,
    introStep,
    gameStarted,
    showExplanationModal,
    showSuccessModal,
    showWrongModal,
    feedbackMessage,
    tubes,
    setStage,
    setIntroStep,
    setGameStarted,
    setShowExplanationModal,
    setShowSuccessModal,
    setShowWrongModal,
    resetCurrentStage,
  } = useQualitativeTestsStore();

  const currentStageConfig = QUALITATIVE_STAGES[stage];

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  const handleNextStage = () => {
    setShowSuccessModal(false);
    if (stage === 1) {
      setStage(2);
    } else if (stage === 2) {
      setStage(3);
    } else {
      handleExit();
    }
  };

  return (
    <div className="w-full h-full h-[100dvh] relative overflow-hidden bg-[#F8FAFC] select-none font-sans">
      {/* ══════════════════════════════════════════════════════════════════════
          INTRO MISSION & INSTRUCTIONS VIEW OVERLAY (Matching Chemistry Template)
          ══════════════════════════════════════════════════════════════════════ */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Header Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* ── STEP 1: MISSION SCREEN ── */}
          {introStep === "mission" && (
            <div className="max-w-2xl mx-auto my-auto text-center space-y-3 sm:space-y-4 z-10 px-2 sm:px-4 py-2 animate-in fade-in duration-200">
              <div className="text-[#2563EB] text-[10px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase">
                MODULE 11 • CARBONYL COMPOUNDS
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-snug">
                <span className="text-[#2563EB]">MISSION:</span> Find the Correct Compound from the Two Test Tubes
              </h1>

              <div className="pt-2 sm:pt-4">
                <button
                  type="button"
                  onClick={() => setIntroStep("instructions")}
                  className="px-6 sm:px-8 py-2 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-2 mx-auto cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: INSTRUCTIONS SCREEN (3 CARDS IN LANDSCAPE GRID) ── */}
          {introStep === "instructions" && (
            <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-1 w-full animate-in fade-in duration-200 flex-1">
              <div className="text-center pt-0.5 pb-2">
                <h2 className="text-[#1E293B] text-sm sm:text-base md:text-lg font-black tracking-wide uppercase">
                  INSTRUCTIONS TO PLAY
                </h2>
                <p className="text-slate-500 font-medium text-xs mt-0.5">
                  Follow the 3 simple steps to find the target compound:
                </p>
              </div>

              {/* 3 Instruction Cards Side-by-Side in Landscape Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2.5 sm:gap-3.5 w-full mx-auto my-auto items-stretch">
                {/* Card 1: Pour Reagent */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Pour Reagent
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Click the "Pour Reagent" button to dispense the chemical testing solution into both mystery tubes.
                    </p>
                  </div>

                  {/* Image Illustration 1 */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/qualitative_step1_pour.svg"
                      alt="Pour reagent illustration"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 2: Heat Up */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Heat Up
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Use the digital temperature controller (+) to warm the water bath and trigger the chemical reaction.
                    </p>
                  </div>

                  {/* Image Illustration 2 */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/qualitative_step2_heat.svg"
                      alt="Heat up water bath illustration"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>

                {/* Card 3: Choose Correct from Two */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Choose Correct from Two
                      </h3>
                    </div>
                    <p className="text-slate-600 font-medium text-xs leading-relaxed mt-2">
                      Observe which tube shows the positive reaction, then click the correct test tube to select your answer.
                    </p>
                  </div>

                  {/* Image Illustration 3 */}
                  <div className="w-full h-14 sm:h-16 rounded-xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-center p-1.5 mt-2.5 overflow-hidden">
                    <img
                      src="/instructions/qualitative_step3_choose.svg"
                      alt="Choose correct from two illustration"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons: Back and Play */}
              <div className="pt-2 pb-0.5 flex items-center justify-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIntroStep("mission")}
                  className="px-5 sm:px-6 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGameStarted(true)}
                  className="px-6 sm:px-8 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>PLAY</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ACTIVE 3D SIMULATION SCREEN (Zero Bottom Dock Architecture)
          ══════════════════════════════════════════════════════════════════════ */}
      {gameStarted && (
        <div className="w-full h-full relative">
          {/* ── TOP HEADER BAR: STANDARD CHEMISTRY TEMPLATE ── */}
          <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20 flex items-center justify-between pointer-events-none">
            {/* Top-Left Exit Button */}
            <button
              type="button"
              onClick={handleExit}
              className="pointer-events-auto px-3 sm:px-4 py-1 sm:py-1.5 rounded-full font-extrabold text-[11px] sm:text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Central Target & Parameter HUD */}
            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-sm backdrop-blur-md">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-[10px] sm:text-xs font-black uppercase">
                Stage {stage}/3
              </span>
              <span className="text-slate-400 font-mono text-xs">•</span>
              <span className="text-emerald-700 font-mono text-[11px] sm:text-xs font-bold truncate max-w-[180px] sm:max-w-none">
                Target: {currentStageConfig.targetCompound}
              </span>
            </div>

            {/* Top-Right Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="pointer-events-auto flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-100" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── FULLSCREEN 3D WET-LAB CANVAS (Unobstructed & Interactive) ── */}
          <div className="w-full h-full">
            <QualitativeTests3D />
          </div>

          {/* ── EXPLANATION MODAL (Standard Chemistry Simulation Template - Stage Specific) ── */}
          {showExplanationModal && (
            <div className="absolute inset-0 z-[100] bg-white/98 backdrop-blur-md flex flex-col overflow-hidden animate-in fade-in duration-200 rounded-3xl sm:rounded-[32px]">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100 shrink-0 bg-white/90">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      {STAGE_EXPLANATIONS[stage]?.title || "Theory & Chemical Mechanisms"}
                    </h2>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold tracking-wider uppercase font-mono">
                      {STAGE_EXPLANATIONS[stage]?.subtitle || `Stage ${stage} of 3`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExplanationModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center justify-center cursor-pointer active:scale-90 shrink-0"
                  title="Close Explanation"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content - Maximizing full vertical height with no bottom footer */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-8 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto w-full">
                {/* Concept Overview */}
                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    Physical &amp; Reaction Mechanism
                  </h3>
                  <p className="whitespace-pre-line leading-relaxed text-slate-600">
                    {STAGE_EXPLANATIONS[stage]?.concept}
                  </p>
                </div>

                {/* Formulas Box */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Fundamental Equations &amp; Principles
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {STAGE_EXPLANATIONS[stage]?.formulas.map((f, fIdx) => (
                      <div key={`formula-${fIdx}`} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div className="font-mono font-bold text-sky-800 text-xs mb-1">
                          {f.label}
                        </div>
                        <div className="font-mono font-black text-slate-900 text-sm sm:text-base mb-1 overflow-x-auto whitespace-pre-wrap">
                          {f.formula}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
                          {f.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Derivation */}
                <div className="space-y-3">
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Step-by-Step Solution Analysis
                  </h3>
                  <div className="space-y-2.5">
                    {STAGE_EXPLANATIONS[stage]?.steps.map((st) => (
                      <div key={`step-${st.step}`} className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-sky-500">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm mb-1">
                          Step {st.step}: {st.title}
                        </div>
                        {st.math && (
                          <div className="font-mono text-xs font-black text-sky-700 mb-1 overflow-x-auto">
                            {st.math}
                          </div>
                        )}
                        <p className="text-[11px] sm:text-xs text-slate-600">
                          {st.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conclusion */}
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-medium leading-relaxed">
                  {STAGE_EXPLANATIONS[stage]?.conclusion}
                </div>
              </div>
            </div>
          )}

          {/* ── SUCCESS COMPLETION MODAL (Matching Chemistry Dialog Template) ── */}
          {showSuccessModal && (
            <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-emerald-300">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  STAGE {stage} COMPLETE
                </span>

                <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
                  Target Achieved!
                </h3>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                  {feedbackMessage}
                </p>

                <div className="flex gap-2 w-full pt-1">
                  {/* Retry Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      resetCurrentStage();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    title="Retry this stage"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>

                  {/* Explanation Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    title="View Detailed Explanation"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Theory</span>
                  </button>

                  {/* Next Stage Button */}
                  <button
                    type="button"
                    onClick={handleNextStage}
                    className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                  >
                    {stage === 3 ? "Finish" : "Next →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── WRONG ANSWER MODAL (Matching Chemistry Dialog Template) ── */}
          {showWrongModal && (
            <div className="pointer-events-auto bg-slate-900/60 backdrop-blur-xs fixed inset-0 flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl p-5 text-center max-w-sm w-full shadow-2xl border border-rose-300">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                  <XCircle className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200">
                  STAGE {stage} • INCORRECT TUBE
                </span>

                <h3 className="text-base font-black text-slate-800 mt-2 mb-1">
                  Incorrect Sample Selected!
                </h3>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">
                  {feedbackMessage}
                </p>

                <div className="flex gap-2 w-full pt-1">
                  {/* Try Again Button: Restarts the simulation stage so user performs the process again */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowWrongModal(false);
                      resetCurrentStage();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="Restart stage and try again"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>

                  {/* View Theory Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowWrongModal(false);
                      setShowExplanationModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-sky-300 text-sky-700 font-extrabold text-xs hover:bg-sky-50 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="View Detailed Explanation"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Theory</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
