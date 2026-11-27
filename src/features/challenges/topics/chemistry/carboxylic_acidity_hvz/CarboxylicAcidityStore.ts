import { create } from "zustand";

export interface StageExplanationData {
  title: string;
  subtitle: string;
  concept: string;
  formulas: Array<{
    label: string;
    formula: string;
    explanation: string;
  }>;
  steps: Array<{
    step: number;
    title: string;
    math?: string;
    explanation: string;
  }>;
  conclusion: string;
}

export const ACID_DATA: Record<
  0 | 1 | 2 | 3,
  {
    name: string;
    formula: string;
    pka: number;
    strengthLabel: string;
  }
> = {
  0: {
    name: "Acetic Acid",
    formula: "CH₃COOH",
    pka: 4.76,
    strengthLabel: "Weak Acid",
  },
  1: {
    name: "Chloroacetic Acid",
    formula: "CH₂ClCOOH",
    pka: 2.86,
    strengthLabel: "Moderate Acid",
  },
  2: {
    name: "Dichloroacetic Acid",
    formula: "CHCl₂COOH",
    pka: 1.29,
    strengthLabel: "Stronger Acid",
  },
  3: {
    name: "Trichloroacetic Acid",
    formula: "CCl₃COOH",
    pka: 0.65,
    strengthLabel: "Very Strong Acid",
  },
};

export const CARBOXYLIC_EXPLANATIONS: Record<1 | 2 | 3, StageExplanationData> = {
  1: {
    title: "Carboxylic Acid Acidity & The Inductive (−I) Effect",
    subtitle: "Module 11 • Carboxylic Acid Acidity & HVZ • Stage 1 of 3",
    concept:
      "Why are carboxylic acids (R–COOH) millions of times more acidic than alcohols (R–OH)? And why does adding Chlorine atoms make them even stronger?\n\n" +
      "1. Resonance Stabilization of Carboxylate (RCOO⁻):\n" +
      "• When a carboxylic acid loses H⁺, it forms a carboxylate ion (R–COO⁻).\n" +
      "• The negative charge is not stuck on one oxygen—it is shared equally across BOTH electronegative oxygen atoms via resonance (two equivalent C⋯O bonds).\n\n" +
      "2. How the −I (Inductive) Effect Supercharges Acidity:\n" +
      "• Chlorine (Cl) is strongly electronegative and pulls electron density toward itself through single bonds (the −I effect).\n" +
      "• Each Cl atom you attach to the α-carbon pulls negative charge away from the –COO⁻ head, spreading the charge over a larger area and stabilizing the conjugate base.\n" +
      "• More stability in RCOO⁻ = easier to lose H⁺ = much lower pKa!",
    formulas: [
      {
        label: "1. CARBOXYLATE RESONANCE STABILIZATION",
        formula: "R–COOH  +  H₂O  ⇌  [ R–C(=O)O⁻  ⟷  R–C(O⁻)=O ]  +  H₃O⁺",
        explanation:
          "Both oxygen atoms share the negative charge equally, making RCOO⁻ far more stable than an alkoxide (RO⁻).",
      },
      {
        label: "2. −I INDUCTIVE ACIDITY LADDER (pKa)",
        formula: "CH₃COOH (4.76) < CH₂ClCOOH (2.86) < CHCl₂COOH (1.29) < CCl₃COOH (0.65)",
        explanation:
          "Each added –Cl atom pulls electrons away (−I), lowering pKa and boosting acid strength.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Attach −I Chlorine Substituents",
        math: "0 Cl (4.76) ⟶ 1 Cl (2.86) ⟶ 2 Cl (1.29) ⟶ 3 Cl (0.65)",
        explanation:
          "Replace α-hydrogens with electronegative Cl atoms to disperse the negative charge on the carboxylate group.",
      },
      {
        step: 2,
        title: "Dissociate the Acidic Proton (H⁺)",
        math: "CCl₃COOH ⟶ CCl₃COO⁻ + H⁺",
        explanation:
          "Once pKa drops below 1.0, the O–H bond breaks readily, leaving a resonance-stabilized trichloroacetate ion.",
      },
    ],
    conclusion:
      "Key Takeaway: Electron-withdrawing groups (−I, like –Cl, –F, –NO₂) stabilize the carboxylate conjugate base and dramatically increase acidity (lower pKa).",
  },
  2: {
    title: "Hell-Volhard-Zelinsky (HVZ) α-Bromination",
    subtitle: "Module 11 • Carboxylic Acid Acidity & HVZ • Stage 2 of 3",
    concept:
      "Carboxylic acids normally do not react at their α-carbon with Br₂ alone. The Hell-Volhard-Zelinsky (HVZ) reaction solves this using a catalytic amount of Red Phosphorus (Red P)!\n\n" +
      "1. Why Do We Need Red Phosphorus (Red P)?\n" +
      "• Red P reacts with Br₂ to form PBr₃, which converts a tiny portion of the carboxylic acid into an Acyl Bromide (R–CH₂–COBr).\n" +
      "• Unlike carboxylic acids, acyl bromides easily tautomerize into an enol, making the α-carbon nucleophilic so it can attack Br₂!\n\n" +
      "2. Strict α-Hydrogen Requirement:\n" +
      "• Substitution happens ONLY at the α-carbon (the carbon right next to –COOH).\n" +
      "• In Propanoic Acid (CH₃–CH₂–COOH), the –CH₂– group is the α-carbon and loses one α-H as HBr↑ while gaining a –Br atom to form 2-bromopropanoic acid.",
    formulas: [
      {
        label: "1. HELL-VOLHARD-ZELINSKY (HVZ) REACTION",
        formula: "CH₃–CH₂–COOH  +  Br₂  —(Red P)→  CH₃–CH(Br)–COOH  +  HBr↑",
        explanation:
          "Propanoic acid is selectively brominated at the α-position to yield 2-bromopropanoic acid.",
      },
      {
        label: "2. KEY REQUIREMENT",
        formula: "α-Hydrogen Present ⟶ HVZ Works   |   0 α-H ⟶ No HVZ Reaction",
        explanation:
          "Acids without α-hydrogens (like Benzoic acid or Formic acid) cannot undergo the HVZ reaction.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Choose the HVZ Reagent Pair",
        math: "Br₂ + Red P  (Forms catalytic PBr₃ / Acyl Bromide)",
        explanation:
          "FeBr₃ is for benzene rings; Red P is essential to activate the α-position of carboxylic acids.",
      },
      {
        step: 2,
        title: "Target the α-Carbon & Substitute",
        math: "Align Br₂ over α-C ⟶ Click [REACT ✓] ⟶ 2-Bromopropanoic Acid",
        explanation:
          "One Br atom replaces the α-H, while the displaced H pairs with the second Br to leave as HBr gas.",
      },
    ],
    conclusion:
      "Key Takeaway: Br₂ + Red P selectively replaces an α-hydrogen of a carboxylic acid with a bromine atom—never at the β-carbon or carbonyl carbon.",
  },
  3: {
    title: "Fischer Esterification: Acid-Catalyzed Acyl Substitution",
    subtitle: "Module 11 • Carboxylic Acid Acidity & HVZ • Stage 3 of 3",
    concept:
      "When a carboxylic acid (Acetic Acid) is heated with an alcohol (Ethanol) in the presence of an acid catalyst (H⁺), they combine in a reversible condensation to form a sweet-smelling Ester (Ethyl Acetate) and water!\n\n" +
      "1. Step 1 — Protonation (H⁺ Catalyst):\n" +
      "• The H⁺ catalyst protonates the carbonyl oxygen (C=O → C=OH⁺), making the carbonyl carbon much more electrophilic (δ⁺) so a weak nucleophile like Ethanol can attack it.\n\n" +
      "2. Step 2 — Nucleophilic Attack (Tetrahedral Intermediate):\n" +
      "• Rotating Ethanol brings its oxygen lone pair directly toward the activated carbonyl carbon.\n" +
      "• Clicking APPROACH forms a new C–O bond and breaks the C=O π-bond into a tetrahedral intermediate.\n\n" +
      "3. Step 3 — Heat Dehydration (Δ ≥ 80°C):\n" +
      "• Applying heat eliminates a water molecule (H₂O↑) made from the acid's –OH and the alcohol's –H, reforming the C=O double bond to lock in Ethyl Acetate.",
    formulas: [
      {
        label: "1. FISCHER ESTERIFICATION EQUILIBRIUM",
        formula: "CH₃COOH  +  CH₃CH₂OH  ⇌(H⁺, Δ)  CH₃COOCH₂CH₃  +  H₂O↑",
        explanation:
          "Acetic acid and ethanol condense under acid catalysis and heat to form Ethyl Acetate + water.",
      },
      {
        label: "2. BOND ORIGIN RULE (ISOTOPIC PROOF)",
        formula: "R–C(=O)–[OH]  +  [H]–OR'  ⟶  R–C(=O)–OR'  +  H₂O",
        explanation:
          "The –OH leaves from the carboxylic acid while –H leaves from the alcohol to form H₂O.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Activate Carbonyl with H⁺ Catalyst",
        math: "Add H⁺ ⟶ Protonates C=O Oxygen (Boosts δ⁺ on Carbon)",
        explanation:
          "Acid catalysis makes the carbonyl carbon reactive enough for Ethanol's oxygen to attack.",
      },
      {
        step: 2,
        title: "Align Ethanol & Couple (APPROACH ✓)",
        math: "Rotate Ethanol to 0° ⟶ Click [APPROACH ✓] ⟶ Tetrahedral Intermediate",
        explanation:
          "Form the new C–O single bond between Ethanol and Acetic Acid.",
      },
      {
        step: 3,
        title: "Apply Heat (Δ ≥ 80°C) to Eliminate H₂O",
        math: "Heat ≥ 80°C ⟶ H₂O↑ Leaves & Ethyl Acetate Forms",
        explanation:
          "Heating drives off water and restores the C=O double bond, completing the esterification.",
      },
    ],
    conclusion:
      "Key Takeaway: Fischer Esterification is an acid-catalyzed nucleophilic acyl substitution: H⁺ activates C=O, the alcohol attacks, and heat removes H₂O to yield an ester.",
  },
};

export type Stage2Reagent = "br2_redp" | "br2_febr3" | "hbr";

interface CarboxylicAcidityState {
  stage: 1 | 2 | 3;
  introStep: "mission" | "instructions";
  gameStarted: boolean;
  showExplanationModal: boolean;
  showSuccessModal: boolean;
  showWrongModal: boolean;
  feedbackMessage: string;

  // Stage 1: Inductive (-I) Acidity Ladder
  clCount: 0 | 1 | 2 | 3;
  stage1Dissociated: boolean;
  stage1Animating: boolean;
  stage1Progress: number; // 0.0 to 1.0 (H+ departure)
  stage1Failed: boolean;
  stage1FailProgress: number; // 0.0 to 1.0 (snap-back rebound)

  // Stage 2: HVZ α-Bromination
  stage2Reagent: Stage2Reagent | null;
  stage2PosOffset: number; // -1.45 (β-C) to +1.45 (C=O); 0.00 is α-C
  stage2Substituted: boolean;
  stage2Animating: boolean;
  stage2Progress: number; // 0.0 to 1.0 (Br substitution & HBr departure)
  stage2Failed: boolean;
  stage2FailProgress: number; // 0.0 to 1.0 (deflection/rebound)

  // Stage 3: Fischer Esterification
  stage3CatalystAdded: boolean;
  stage3RotationDeg: number; // -180 to 180; 0 is aligned
  stage3Coupled: boolean;
  stage3CouplingAnimating: boolean;
  stage3CouplingProgress: number; // 0.0 to 1.0
  stage3Temp: number; // 25 to 110
  stage3Esterified: boolean;
  stage3Esterifying: boolean;
  stage3EsterProgress: number; // 0.0 to 1.0 (H2O departure & C=O restore)
  stage3Failed: boolean;
  stage3FailProgress: number; // 0.0 to 1.0

  // Frame tick
  tickSimulation: (delta: number) => void;

  // Actions
  setStage: (stage: 1 | 2 | 3) => void;
  setIntroStep: (step: "mission" | "instructions") => void;
  setGameStarted: (started: boolean) => void;
  setShowExplanationModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowWrongModal: (show: boolean) => void;
  resetCurrentStage: () => void;

  // Stage 1 actions
  setClCount: (count: 0 | 1 | 2 | 3) => void;
  testStage1Dissociation: () => void;

  // Stage 2 actions
  selectStage2Reagent: (reagent: Stage2Reagent) => void;
  setStage2PosOffset: (offset: number) => void;
  triggerStage2Substitution: () => void;

  // Stage 3 actions
  addStage3Catalyst: () => void;
  setStage3Rotation: (deg: number) => void;
  triggerStage3Approach: () => void;
  setStage3Temp: (temp: number) => void;
}

export const useCarboxylicAcidityStore = create<CarboxylicAcidityState>((set, get) => ({
  stage: 1,
  introStep: "mission",
  gameStarted: false,
  showExplanationModal: false,
  showSuccessModal: false,
  showWrongModal: false,
  feedbackMessage: "",

  // Stage 1 defaults
  clCount: 0,
  stage1Dissociated: false,
  stage1Animating: false,
  stage1Progress: 0,
  stage1Failed: false,
  stage1FailProgress: 0,

  // Stage 2 defaults
  stage2Reagent: null,
  stage2PosOffset: -1.35,
  stage2Substituted: false,
  stage2Animating: false,
  stage2Progress: 0,
  stage2Failed: false,
  stage2FailProgress: 0,

  // Stage 3 defaults
  stage3CatalystAdded: false,
  stage3RotationDeg: 120,
  stage3Coupled: false,
  stage3CouplingAnimating: false,
  stage3CouplingProgress: 0,
  stage3Temp: 25,
  stage3Esterified: false,
  stage3Esterifying: false,
  stage3EsterProgress: 0,
  stage3Failed: false,
  stage3FailProgress: 0,

  setStage: (stage) => {
    set({
      stage,
      showSuccessModal: false,
      showWrongModal: false,
      feedbackMessage: "",
      clCount: 0,
      stage1Dissociated: false,
      stage1Animating: false,
      stage1Progress: 0,
      stage1Failed: false,
      stage1FailProgress: 0,
      stage2Reagent: null,
      stage2PosOffset: -1.35,
      stage2Substituted: false,
      stage2Animating: false,
      stage2Progress: 0,
      stage2Failed: false,
      stage2FailProgress: 0,
      stage3CatalystAdded: false,
      stage3RotationDeg: 120,
      stage3Coupled: false,
      stage3CouplingAnimating: false,
      stage3CouplingProgress: 0,
      stage3Temp: 25,
      stage3Esterified: false,
      stage3Esterifying: false,
      stage3EsterProgress: 0,
      stage3Failed: false,
      stage3FailProgress: 0,
    });
  },

  setIntroStep: (introStep) => set({ introStep }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setShowExplanationModal: (showExplanationModal) => set({ showExplanationModal }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
  setShowWrongModal: (showWrongModal) => set({ showWrongModal }),

  resetCurrentStage: () => {
    const { stage, setStage } = get();
    setStage(stage);
  },

  // ── FRAME ANIMATION ENGINE ──
  tickSimulation: (delta: number) => {
    const s = get();

    // ──────────────── STAGE 1 ANIMATIONS ────────────────
    if (s.stage === 1) {
      // Success: H+ dissociation
      if (s.stage1Animating && !s.stage1Failed) {
        const next = Math.min(1.0, s.stage1Progress + delta * 0.95);
        if (next >= 1.0) {
          set({
            stage1Progress: 1.0,
            stage1Animating: false,
            stage1Dissociated: true,
          });
          // Wait 1.0 full second AFTER animation completes before showing Success Modal
          setTimeout(() => {
            if (get().stage === 1 && get().stage1Dissociated) {
              set({ showSuccessModal: true });
            }
          }, 1000);
        } else {
          set({ stage1Progress: next });
        }
      }

      // Failure: H+ stretch & snap-back rebound
      if (s.stage1Animating && s.stage1Failed) {
        const next = Math.min(1.0, s.stage1FailProgress + delta * 1.6);
        if (next >= 1.0) {
          set({
            stage1FailProgress: 1.0,
            stage1Animating: false,
          });
          // Wait 1.0 full second AFTER rebound completes before showing Wrong Modal
          setTimeout(() => {
            if (get().stage === 1 && get().stage1Failed) {
              set({ showWrongModal: true });
            }
          }, 1000);
        } else {
          set({ stage1FailProgress: next });
        }
      }
    }

    // ──────────────── STAGE 2 ANIMATIONS ────────────────
    if (s.stage === 2) {
      // Success: Br2 replaces alpha-H, HBr departs
      if (s.stage2Animating && !s.stage2Failed) {
        const next = Math.min(1.0, s.stage2Progress + delta * 0.85);
        if (next >= 1.0) {
          set({
            stage2Progress: 1.0,
            stage2Animating: false,
            stage2Substituted: true,
          });
          // Wait 1.0 full second AFTER substitution animation completes
          setTimeout(() => {
            if (get().stage === 2 && get().stage2Substituted) {
              set({ showSuccessModal: true });
            }
          }, 1000);
        } else {
          set({ stage2Progress: next });
        }
      }

      // Failure: Br2 approaches wrong site and deflects/rebounds
      if (s.stage2Animating && s.stage2Failed) {
        const next = Math.min(1.0, s.stage2FailProgress + delta * 1.4);
        if (next >= 1.0) {
          set({
            stage2FailProgress: 1.0,
            stage2Animating: false,
          });
          // Wait 1.0 full second AFTER deflection completes before showing Wrong Modal
          setTimeout(() => {
            if (get().stage === 2 && get().stage2Failed) {
              set({ showWrongModal: true });
            }
          }, 1000);
        } else {
          set({ stage2FailProgress: next });
        }
      }
    }

    // ──────────────── STAGE 3 ANIMATIONS ────────────────
    if (s.stage === 3) {
      // Coupling approach animation
      if (s.stage3CouplingAnimating) {
        const next = Math.min(1.0, s.stage3CouplingProgress + delta * 1.35);
        if (next >= 1.0) {
          set({
            stage3CouplingProgress: 1.0,
            stage3CouplingAnimating: false,
            stage3Coupled: true,
          });
        } else {
          set({ stage3CouplingProgress: next });
        }
      }

      // Dehydration & Esterification animation
      if (s.stage3Esterifying) {
        const next = Math.min(1.0, s.stage3EsterProgress + delta * 0.85);
        if (next >= 1.0) {
          set({
            stage3EsterProgress: 1.0,
            stage3Esterifying: false,
            stage3Esterified: true,
          });
          // Wait 1.0 full second AFTER water elimination completes
          setTimeout(() => {
            if (get().stage === 3 && get().stage3Esterified) {
              set({ showSuccessModal: true });
            }
          }, 1000);
        } else {
          set({ stage3EsterProgress: next });
        }
      }

      // Failure shake/deflection
      if (s.stage3Failed && s.stage3FailProgress < 1.0) {
        const next = Math.min(1.0, s.stage3FailProgress + delta * 1.5);
        if (next >= 1.0) {
          set({ stage3FailProgress: 1.0 });
          // Wait 1.0 full second AFTER animation completes
          setTimeout(() => {
            if (get().stage === 3 && get().stage3Failed) {
              set({ showWrongModal: true });
            }
          }, 1000);
        } else {
          set({ stage3FailProgress: next });
        }
      }
    }
  },

  // ── STAGE 1 ACTIONS ──
  setClCount: (count) => {
    if (get().stage1Dissociated || get().stage1Animating) return;
    set({ clCount: count, stage1Failed: false, stage1FailProgress: 0 });
  },

  testStage1Dissociation: () => {
    const { clCount, stage1Animating, stage1Dissociated } = get();
    if (stage1Animating || stage1Dissociated) return;

    if (clCount < 3) {
      const current = ACID_DATA[clCount];
      set({
        stage1Animating: true,
        stage1Failed: true,
        stage1FailProgress: 0,
        feedbackMessage: `${current.name} (${current.formula}) has pKa = ${current.pka}. Add all 3 −I Chlorine atoms to maximize charge dispersal (pKa < 1.0) and trigger full dissociation!`,
      });
      return;
    }

    // clCount === 3 (Trichloroacetic Acid, pKa = 0.65)
    set({
      stage1Animating: true,
      stage1Failed: false,
      stage1Progress: 0,
      feedbackMessage:
        "Trichloroacetic Acid (CCl₃COOH, pKa = 0.65) readily loses H⁺! Three −I Chlorine atoms pull electron density away from –COO⁻, stabilizing the resonance-delocalized conjugate base.",
    });
  },

  // ── STAGE 2 ACTIONS ──
  selectStage2Reagent: (reagent) => {
    const { stage2Animating, stage2Substituted } = get();
    if (stage2Animating || stage2Substituted) return;

    if (reagent !== "br2_redp") {
      const msg =
        reagent === "br2_febr3"
          ? "Br₂ + FeBr₃ is used for electrophilic aromatic substitution on benzene rings—not aliphatic carboxylic acids! Select Br₂ + Red P for the HVZ reaction."
          : "HBr alone cannot substitute an α-hydrogen on a carboxylic acid. You need Br₂ + Red P to form the reactive acyl bromide intermediate!";
      set({
        stage2Reagent: reagent,
        stage2Animating: true,
        stage2Failed: true,
        stage2FailProgress: 0,
        feedbackMessage: msg,
      });
      return;
    }

    set({ stage2Reagent: "br2_redp", stage2Failed: false, stage2FailProgress: 0 });
  },

  setStage2PosOffset: (offset) => {
    if (get().stage2Substituted || get().stage2Animating) return;
    set({ stage2PosOffset: offset });
  },

  triggerStage2Substitution: () => {
    const { stage2Reagent, stage2PosOffset, stage2Substituted, stage2Animating } = get();
    if (stage2Substituted || stage2Animating || stage2Reagent !== "br2_redp") return;

    if (Math.abs(stage2PosOffset) > 0.22) {
      set({
        stage2Animating: true,
        stage2Failed: true,
        stage2FailProgress: 0,
        feedbackMessage:
          "HVZ bromination only happens at the α-carbon (next to –COOH)! Slide Br₂ directly over the α-C before reacting.",
      });
      return;
    }

    set({
      stage2Animating: true,
      stage2Failed: false,
      stage2Progress: 0,
      feedbackMessage:
        "2-Bromopropanoic Acid synthesized! Br₂ + Red P selectively replaced one α-hydrogen on propanoic acid, releasing HBr gas.",
    });
  },

  // ── STAGE 3 ACTIONS ──
  addStage3Catalyst: () => {
    if (get().stage3Coupled || get().stage3CouplingAnimating) return;
    set({ stage3CatalystAdded: true });
  },

  setStage3Rotation: (deg) => {
    if (get().stage3Coupled || get().stage3CouplingAnimating) return;
    set({ stage3RotationDeg: deg });
  },

  triggerStage3Approach: () => {
    const { stage3CatalystAdded, stage3RotationDeg, stage3Coupled, stage3CouplingAnimating } =
      get();
    if (stage3Coupled || stage3CouplingAnimating) return;

    if (!stage3CatalystAdded) {
      set({
        stage3Failed: true,
        stage3FailProgress: 0,
        feedbackMessage:
          "Add the H⁺ acid catalyst first to protonate the carbonyl oxygen and activate Acetic Acid for nucleophilic attack!",
      });
      return;
    }

    if (Math.abs(stage3RotationDeg) > 15) return;

    set({
      stage3CouplingAnimating: true,
      stage3CouplingProgress: 0,
    });
  },

  setStage3Temp: (temp) => {
    const { stage3Coupled, stage3Esterified, stage3Esterifying } = get();
    if (!stage3Coupled) {
      set({ stage3Temp: temp });
      if (temp >= 80) {
        set({
          stage3Failed: true,
          stage3FailProgress: 0,
          feedbackMessage:
            "Couple Acetic Acid with Ethanol first! Align Ethanol's oxygen with the carbonyl carbon and click APPROACH before heating.",
        });
      }
      return;
    }

    if (stage3Esterified || stage3Esterifying) {
      set({ stage3Temp: temp });
      return;
    }

    set({ stage3Temp: temp });
    if (temp >= 80) {
      set({
        stage3Esterifying: true,
        stage3EsterProgress: 0,
        feedbackMessage:
          "Fischer Esterification complete! Heating (Δ ≥ 80°C) eliminated H₂O↑ from the tetrahedral intermediate, yielding fragrant Ethyl Acetate (CH₃COOCH₂CH₃).",
      });
    }
  },
}));
