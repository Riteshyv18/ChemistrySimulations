import { create } from "zustand";

// ============================================================================
// Stage Configurations
// ============================================================================
export interface QualitativeStageConfig {
  stage: 1 | 2 | 3;
  title: string;
  badge: string;
  subtitle: string;
  targetCompound: string;
  reagentName: string;
  targetReaction: string;
  instructionPrompt: string;
  learningGoal: string;
  keyConcepts: string[];
}

export const QUALITATIVE_STAGES: Record<1 | 2 | 3, QualitativeStageConfig> = {
  1: {
    stage: 1,
    title: "Stage 1: Tollens' Silver Mirror Test",
    badge: "Aldehyde vs Ketone",
    subtitle: "Identify which tube contains Acetaldehyde using Ammoniacal Silver Nitrate",
    targetCompound: "Acetaldehyde (CH₃CHO)",
    reagentName: "Tollens' Reagent [Ag(NH₃)₂]⁺",
    targetReaction: "R-CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ ⟶ R-COO⁻ + 2Ag⁰↓ (Silver Mirror) + 4NH₃ + 2H₂O",
    instructionPrompt:
      "Find which mystery tube contains Acetaldehyde. Pour Tollens' reagent into both tubes (sitting in warm 60°C water baths). Click the tube that forms a silver mirror!",
    learningGoal:
      "Aldehydes have an easily oxidizable carbonyl C-H bond that reduces Ag⁺ to metallic silver (Ag⁰), coating the glass tube in a reflective mirror. Ketones lack this C-H bond and resist mild oxidation.",
    keyConcepts: [
      "Tollens' Reagent: Ammoniacal silver nitrate [Ag(NH₃)₂]⁺ OH⁻",
      "Easily oxidizable C-H in aldehydes vs stable C-C in ketones",
      "Preheated water bath (~60°C) accelerates mirror deposition",
      "Positive test: Reflective specular silver mirror",
    ],
  },
  2: {
    stage: 2,
    title: "Stage 2: Fehling's Test (Aliphatic vs Aromatic)",
    badge: "Aliphatic vs Aromatic",
    subtitle: "Identify which tube contains Aliphatic Aldehyde using Alkaline Cu²⁺ Tartrate",
    targetCompound: "Acetaldehyde (Aliphatic)",
    reagentName: "Fehling's Reagent (A + B)",
    targetReaction: "R-CHO + 2Cu²⁺ + 5OH⁻ ⟶ R-COO⁻ + Cu₂O↓ (Brick-Red) + 3H₂O",
    instructionPrompt:
      "Find which mystery tube contains the Aliphatic Aldehyde. Pour Fehling's reagent into both tubes (at 100°C boiling). Click the tube that precipitates brick-red Cu₂O!",
    learningGoal:
      "Aliphatic aldehydes reduce Cu²⁺ to cuprous oxide (Cu₂O), yielding a dense brick-red precipitate. Aromatic aldehydes like Benzaldehyde fail to react because the benzene ring's +R resonance delocalizes electron density and stabilizes the carbonyl carbon.",
    keyConcepts: [
      "Fehling A: Aqueous CuSO₄ • Fehling B: Alkaline Rochelle salt (Tartrate)",
      "Mixed reagent produces deep royal blue bistartratocuprate(II) complex",
      "Aliphatic aldehydes precipitate dense brick-red Cu₂O",
      "Benzaldehyde is unreactive due to phenyl ring resonance stabilization",
    ],
  },
  3: {
    stage: 3,
    title: "Stage 3: Iodoform (Haloform) Reaction",
    badge: "Methyl Carbonyl (CH₃C=O)",
    subtitle: "Identify which tube contains Methyl Ketone (Acetone) using I₂ / NaOH",
    targetCompound: "Propan-2-one (Acetone)",
    reagentName: "Iodine (I₂/KI) + NaOH",
    targetReaction: "CH₃-CO-R + 3I₂ + 4NaOH ⟶ R-COONa + CHI₃↓ (Yellow) + 3NaI + 3H₂O",
    instructionPrompt:
      "Find which mystery tube contains Propan-2-one (Acetone). Pour the I₂/NaOH reagent into both tubes. Click the tube that precipitates canary-yellow iodoform crystals!",
    learningGoal:
      "Compounds containing the methyl carbonyl (CH₃-C=O) group undergo base-promoted trihalogenation followed by hydroxide cleavage to produce canary-yellow iodoform crystals (CHI₃) with a characteristic antiseptic odor.",
    keyConcepts: [
      "Specific for CH₃C=O (methyl ketones) and CH₃CH(OH) (methyl carbinols)",
      "3 acidic α-hydrogens are sequentially replaced by iodine: -COCH₃ ⟶ -COCI₃",
      "Hydroxide ion attacks carbonyl carbon; -CI₃ leaves to form yellow CHI₃",
      "Canary-yellow crystals of Triiodomethane (CHI₃), m.p. 119°C",
    ],
  },
};

// ============================================================================
// Mystery Tube Data Structure
// ============================================================================
export interface MysteryTubeState {
  tubeA: {
    compoundName: string;
    compoundFormula: string;
    isPositiveTarget: boolean;
    poured: boolean;
    reactionProgress: number; // 0 to 1
  };
  tubeB: {
    compoundName: string;
    compoundFormula: string;
    isPositiveTarget: boolean;
    poured: boolean;
    reactionProgress: number; // 0 to 1
  };
}

// ============================================================================
// Store Interface
// ============================================================================
export interface QualitativeTestsState {
  stage: 1 | 2 | 3;
  introStep: "mission" | "instructions";
  gameStarted: boolean;
  showExplanationModal: boolean;
  showSuccessModal: boolean;
  showWrongModal: boolean;
  feedbackMessage: string | null;

  // Temperature state controlled by the heat nozzle (in °C)
  temperature: number;
  targetTemp: number; // e.g., 60 for stage 1, 100 for stage 2, 55 for stage 3

  // Mystery tubes state for active stage
  tubes: MysteryTubeState;
  selectedAnswer: "tubeA" | "tubeB" | null;

  // Core Navigation Actions
  setStage: (stage: 1 | 2 | 3) => void;
  setIntroStep: (step: "mission" | "instructions") => void;
  setGameStarted: (started: boolean) => void;
  setShowExplanationModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowWrongModal: (show: boolean) => void;
  setFeedbackMessage: (msg: string | null) => void;
  resetCurrentStage: () => void;

  // Gameplay Actions (Zero Dock)
  setTemperature: (temp: number) => void;
  incrementTemperature: (step?: number) => void;
  decrementTemperature: (step?: number) => void;
  pourReagent: (tube: "tubeA" | "tubeB") => void;
  pourBothTubes: () => void;
  selectTubeAnswer: (tube: "tubeA" | "tubeB") => boolean;
}

const getTargetTempForStage = (stage: 1 | 2 | 3): number => {
  if (stage === 1) return 60; // Tollens' warm water bath
  if (stage === 2) return 100; // Fehling's boiling water bath
  return 55; // Iodoform mild warming
};

const getTempThresholdForStage = (stage: 1 | 2 | 3): number => {
  if (stage === 1) return 55;
  if (stage === 2) return 90;
  return 50;
};

const getInitialTubesForStage = (stage: 1 | 2 | 3): MysteryTubeState => {
  if (stage === 1) {
    return {
      tubeA: {
        compoundName: "Acetaldehyde",
        compoundFormula: "CH₃CHO",
        isPositiveTarget: true,
        poured: false,
        reactionProgress: 0,
      },
      tubeB: {
        compoundName: "Acetone",
        compoundFormula: "CH₃COCH₃",
        isPositiveTarget: false,
        poured: false,
        reactionProgress: 0,
      },
    };
  } else if (stage === 2) {
    return {
      tubeA: {
        compoundName: "Acetaldehyde",
        compoundFormula: "Aliphatic (CH₃CHO)",
        isPositiveTarget: true,
        poured: false,
        reactionProgress: 0,
      },
      tubeB: {
        compoundName: "Benzaldehyde",
        compoundFormula: "Aromatic (Ph-CHO)",
        isPositiveTarget: false,
        poured: false,
        reactionProgress: 0,
      },
    };
  } else {
    return {
      tubeA: {
        compoundName: "Propan-2-one (Acetone)",
        compoundFormula: "CH₃COCH₃ (Methyl Ketone)",
        isPositiveTarget: true,
        poured: false,
        reactionProgress: 0,
      },
      tubeB: {
        compoundName: "Pentan-3-one",
        compoundFormula: "CH₃CH₂COCH₂CH₃",
        isPositiveTarget: false,
        poured: false,
        reactionProgress: 0,
      },
    };
  }
};

export const useQualitativeTestsStore = create<QualitativeTestsState>((set, get) => ({
  stage: 1,
  introStep: "mission",
  gameStarted: false,
  showExplanationModal: false,
  showSuccessModal: false,
  showWrongModal: false,
  feedbackMessage: null,
  temperature: 25,
  targetTemp: getTargetTempForStage(1),
  tubes: getInitialTubesForStage(1),
  selectedAnswer: null,

  setStage: (stage) =>
    set({
      stage,
      temperature: 25,
      targetTemp: getTargetTempForStage(stage),
      tubes: getInitialTubesForStage(stage),
      selectedAnswer: null,
      feedbackMessage: null,
      showSuccessModal: false,
      showWrongModal: false,
      showExplanationModal: false,
    }),

  setIntroStep: (introStep) => set({ introStep }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setShowExplanationModal: (showExplanationModal) => set({ showExplanationModal }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
  setShowWrongModal: (showWrongModal) => set({ showWrongModal }),
  setFeedbackMessage: (feedbackMessage) => set({ feedbackMessage }),

  resetCurrentStage: () => {
    const s = get().stage;
    set({
      temperature: 25,
      targetTemp: getTargetTempForStage(s),
      tubes: getInitialTubesForStage(s),
      selectedAnswer: null,
      feedbackMessage: null,
      showSuccessModal: false,
      showWrongModal: false,
    });
  },

  setTemperature: (temp: number) => {
    const { stage, tubes } = get();
    const threshold = getTempThresholdForStage(stage);
    const isHotEnough = temp >= threshold;

    // If tubes have been poured and heat reaches threshold, trigger reaction!
    const bothOrEitherPoured = tubes.tubeA.poured || tubes.tubeB.poured;

    const nextTubes: MysteryTubeState = {
      tubeA: {
        ...tubes.tubeA,
        reactionProgress:
          tubes.tubeA.poured && isHotEnough && tubes.tubeA.isPositiveTarget
            ? 1.0
            : tubes.tubeA.reactionProgress,
      },
      tubeB: {
        ...tubes.tubeB,
        reactionProgress:
          tubes.tubeB.poured && isHotEnough && tubes.tubeB.isPositiveTarget
            ? 1.0
            : tubes.tubeB.reactionProgress,
      },
    };

    set({
      temperature: temp,
      tubes: nextTubes,
      feedbackMessage: null,
    });
  },

  incrementTemperature: (step = 5) => {
    const current = get().temperature;
    const next = Math.min(100, current + step);
    get().setTemperature(next);
  },

  decrementTemperature: (step = 5) => {
    const current = get().temperature;
    const next = Math.max(25, current - step);
    get().setTemperature(next);
  },

  pourReagent: (tube) => {
    const { stage, tubes, temperature } = get();
    const currentTube = tubes[tube];
    if (currentTube.poured) return;

    const threshold = getTempThresholdForStage(stage);
    const isHotEnough = temperature >= threshold;
    const isPositive = currentTube.isPositiveTarget;

    const nextTubes = {
      ...tubes,
      [tube]: {
        ...currentTube,
        poured: true,
        reactionProgress: isHotEnough && isPositive ? 1.0 : 0.0,
      },
    };

    let msg = "";
    if (isHotEnough) {
      if (stage === 1) {
        msg = isPositive
          ? `Tollens' reagent added at ${Math.round(temperature)}°C! Metallic silver mirror formed!`
          : `Tollens' reagent added at ${Math.round(temperature)}°C. No mirror (ketone resists oxidation).`;
      } else if (stage === 2) {
        msg = isPositive
          ? `Fehling's reagent added at ${Math.round(temperature)}°C! Brick-red Cu₂O precipitate formed!`
          : `Fehling's reagent added at ${Math.round(temperature)}°C. Stays blue (aromatic aldehyde).`;
      } else {
        msg = isPositive
          ? `I₂/NaOH added at ${Math.round(temperature)}°C! Canary-yellow CHI₃ crystals precipitated!`
          : `I₂/NaOH added at ${Math.round(temperature)}°C. No yellow crystals.`;
      }
    } else {
      const targetT = getTargetTempForStage(stage);
      msg = `Reagents mixed in tubes at room temp (${Math.round(temperature)}°C). Adjust the heat nozzle to warm the bath to ${targetT}°C to start the reaction!`;
    }

    set({
      tubes: nextTubes,
      feedbackMessage: msg,
    });
  },

  pourBothTubes: () => {
    const { stage, tubes, temperature } = get();
    const threshold = getTempThresholdForStage(stage);
    const isHotEnough = temperature >= threshold;

    const nextTubes: MysteryTubeState = {
      tubeA: {
        ...tubes.tubeA,
        poured: true,
        reactionProgress: isHotEnough && tubes.tubeA.isPositiveTarget ? 1.0 : 0.0,
      },
      tubeB: {
        ...tubes.tubeB,
        poured: true,
        reactionProgress: isHotEnough && tubes.tubeB.isPositiveTarget ? 1.0 : 0.0,
      },
    };

    set({
      tubes: nextTubes,
      feedbackMessage: null,
    });
  },

  selectTubeAnswer: (tube) => {
    const { stage, tubes, temperature } = get();
    const selected = tubes[tube];
    const threshold = getTempThresholdForStage(stage);

    if (!selected.poured) {
      set({
        feedbackMessage: "Pour the reagent into the tubes first to observe the chemical reaction!",
      });
      return false;
    }

    if (temperature < threshold) {
      const targetT = getTargetTempForStage(stage);
      set({
        feedbackMessage: `The water bath is too cold (${Math.round(temperature)}°C)! Adjust the heat nozzle to reach ${targetT}°C so the reaction can proceed.`,
      });
      return false;
    }

    set({ selectedAnswer: tube });

    if (selected.isPositiveTarget) {
      let successMsg = "";
      if (stage === 1) {
        successMsg = `Correct! ${selected.compoundName} is the aldehyde. It reduces Ag⁺ to deposit a metallic silver mirror!`;
      } else if (stage === 2) {
        successMsg = `Correct! ${selected.compoundName} is the aliphatic aldehyde. It reduces Cu²⁺ to brick-red Cu₂O!`;
      } else {
        successMsg = `Correct! ${selected.compoundName} has the methyl carbonyl (CH₃C=O) group that forms canary-yellow CHI₃ crystals!`;
      }

      set({
        showSuccessModal: true,
        showWrongModal: false,
        feedbackMessage: successMsg,
      });
      return true;
    } else {
      let failMsg = "";
      if (stage === 1) {
        failMsg = `Incorrect sample! ${selected.compoundName} is a ketone (${selected.compoundFormula}). Because ketones lack a formyl hydrogen (H-C=O), they cannot reduce mild Tollens' reagent [Ag(NH₃)₂]⁺. Only the aldehyde in the other tube gives the silver mirror!`;
      } else if (stage === 2) {
        failMsg = `Incorrect sample! ${selected.compoundName} is an aromatic aldehyde (${selected.compoundFormula}). Phenyl ring resonance delocalization stabilizes the carbonyl group, making Fehling's reagent (Cu²⁺) too weak to oxidize it. Only aliphatic aldehydes give the brick-red Cu₂O precipitate!`;
      } else {
        failMsg = `Incorrect sample! ${selected.compoundName} (${selected.compoundFormula}) lacks the crucial methyl carbonyl group (CH₃-C=O) or CH₃-CH(OH)- moiety. Thus, it cannot undergo halogenation-cleavage to produce canary-yellow iodoform (CHI₃) crystals!`;
      }

      set({
        showWrongModal: true,
        showSuccessModal: false,
        feedbackMessage: failMsg,
      });
      return false;
    }
  },
}));
