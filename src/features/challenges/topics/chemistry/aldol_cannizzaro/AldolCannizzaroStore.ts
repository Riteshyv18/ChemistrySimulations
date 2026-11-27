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

export const ALDOL_EXPLANATIONS: Record<1 | 2 | 3, StageExplanationData> = {
  1: {
    title: "The α-Hydrogen Rule: How to Tell Aldol vs. Cannizzaro Apart",
    subtitle: "Module 11 • Aldol & Cannizzaro Reactions • Stage 1 of 3",
    concept:
      "When you put an aldehyde into a basic solution (like NaOH or KOH), it can take one of two completely different paths: Aldol or Cannizzaro. How do you know which one happens? Just check for an α-hydrogen!\n\n" +
      "1. What is an α-Hydrogen (and why is it acidic)?\n" +
      "• The carbon atom sitting right next to the C=O group is called the α-carbon (alpha carbon).\n" +
      "• Any hydrogen attached to that α-carbon is an α-hydrogen.\n" +
      "• Because the C=O oxygen pulls electrons away strongly, α-hydrogens are unusually acidic (pKa ≈ 17–20) and can be plucked off easily by a base (OH⁻).\n\n" +
      "2. Case A — α-Hydrogen is PRESENT (Acetaldehyde, CH₃CHO):\n" +
      "Acetaldehyde has 3 α-hydrogens on its –CH₃ group. OH⁻ plucks one α-H off, leaving behind a negatively charged Enolate ion (⁻CH₂–CHO ⟷ CH₂=CH–O⁻). Because the negative charge is shared with Oxygen (resonance), the enolate is stable and triggers the Aldol reaction.\n\n" +
      "3. Case B — α-Hydrogen is ABSENT (Benzaldehyde, C₆H₅CHO):\n" +
      "In Benzaldehyde, the carbon attached to C=O is part of the benzene ring and already has 4 bonds to other carbons—it has ZERO hydrogens! Since OH⁻ cannot pluck any α-H, it attacks the C=O carbon directly instead, triggering the Cannizzaro reaction.",
    formulas: [
      {
        label: "1. ENOLATE FORMATION (HAS α-H → ALDOL)",
        formula: "CH₃–CHO  +  OH⁻  ⇌  [ ⁻CH₂–CHO  ⟷  CH₂=CH–O⁻ ]  +  H₂O",
        explanation: "Acetaldehyde loses an acidic α-H to form a resonance-stabilized enolate nucleophile.",
      },
      {
        label: "2. NO α-H PRESENT (0 α-H → CANNIZZARO)",
        formula: "C₆H₅–CHO  +  OH⁻  ⟶  C₆H₅–CH(OH)O⁻  (Direct Addition)",
        explanation: "Without an α-H, OH⁻ has no choice but to add directly to the electrophilic carbonyl carbon.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Find the α-Carbon Next to C=O",
        math: "Acetaldehyde: –CH₃ (3 α-H)   |   Benzaldehyde: Ring Carbon (0 α-H)",
        explanation: "Always look at the carbon directly bonded to the carbonyl carbon.",
      },
      {
        step: 2,
        title: "Choose the Matching Pathway",
        math: "Has α-H ⟶ Aldol Pathway   |   No α-H ⟶ Cannizzaro Pathway",
        explanation: "Enolizable aldehydes (with α-H) do Aldol; non-enolizable aldehydes (no α-H) do Cannizzaro.",
      },
    ],
    conclusion:
      "Key Takeaway: Always check the α-carbon first! Even one α-hydrogen gives the Aldol reaction; zero α-hydrogens (like Formaldehyde HCHO or Benzaldehyde C₆H₅CHO) gives the Cannizzaro reaction.",
  },
  2: {
    title: "Aldol Coupling & Heat Dehydration (Δ): Step-by-Step",
    subtitle: "Module 11 • Aldol & Cannizzaro Reactions • Stage 2 of 3",
    concept:
      "In the Aldol Condensation, two molecules of Acetaldehyde join together to build a larger 4-carbon molecule. It happens in two clear stages:\n\n" +
      "1. Step 1 — Aldol Addition (Joining the Two Molecules):\n" +
      "• The Enolate ion (⁻CH₂–CHO) has a negatively charged α-carbon, making it a strong nucleophile.\n" +
      "• The second Acetaldehyde molecule has a partially positive (δ⁺) carbonyl carbon, making it an electrophile.\n" +
      "• When you rotate the Enolate into alignment and click APPROACH, the two carbons snap together to form a brand-new C–C single bond! After picking up H⁺ from water, this forms 3-hydroxybutanal—nicknamed 'Aldol' because it contains both an Aldehyde (–CHO) and an Alcohol (–OH).\n\n" +
      "2. Step 2 — Heat Dehydration (Δ ≥ 80°C):\n" +
      "• Heating the Aldol supplies energy to kick out the –OH group along with a neighboring α-H as a water molecule (H₂O ↑).\n" +
      "• Losing H₂O creates a new C=C double bond right next to C=O, forming Crotonaldehyde (CH₃–CH=CH–CHO). Because the C=C and C=O double bonds are conjugated (alternating), Crotonaldehyde is extra stable!",
    formulas: [
      {
        label: "1. ALDOL ADDITION (C–C BOND FORMATION)",
        formula: "CH₃–CHO  +  ⁻CH₂–CHO  —(H₂O)→  CH₃–CH(OH)–CH₂–CHO  (Aldol)",
        explanation: "The enolate α-carbon bonds to the carbonyl carbon of the second acetaldehyde, forming a 4-carbon β-hydroxy aldehyde.",
      },
      {
        label: "2. HEAT DEHYDRATION (CONDENSATION, Δ ≥ 80°C)",
        formula: "CH₃–CH(OH)–CH₂–CHO  —(Δ ≥ 80°C)→  CH₃–CH=CH–CHO  +  H₂O↑",
        explanation: "Heating eliminates H₂O to form Crotonaldehyde (an α,β-unsaturated aldehyde stabilized by π-conjugation).",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Rotate & Couple the Enolate",
        math: "Rotate Enolate to 0° ⟶ Click [APPROACH ✓] ⟶ New Cα–Cβ Bond",
        explanation: "Align the nucleophilic α-carbon with the electrophilic carbonyl carbon to snap them into 3-hydroxybutanal.",
      },
      {
        step: 2,
        title: "Heat to Eliminate Water (Δ ≥ 80°C)",
        math: "Raise Heat ≥ 80°C ⟶ H₂O Leaves & Conjugated C=C Forms",
        explanation: "Thermal energy drives out H₂O, locking in the flat, conjugated Crotonaldehyde product.",
      },
    ],
    conclusion:
      "Key Takeaway: Aldol Addition joins two molecules into a β-hydroxy aldehyde; heating (Δ) removes H₂O to lock in a stable conjugated C=C–C=O double bond!",
  },
  3: {
    title: "Cannizzaro Reaction: Self-Redox via Hydride (:H⁻) Transfer",
    subtitle: "Module 11 • Aldol & Cannizzaro Reactions • Stage 3 of 3",
    concept:
      "What happens when an aldehyde has ZERO α-hydrogens (like Formaldehyde, HCHO) and is treated with concentrated alkali (conc. KOH or NaOH)? It undergoes Disproportionation—meaning one molecule is oxidized while an identical second molecule is reduced!\n\n" +
      "1. Step 1 — Base Attack (Forming the Oxyanion):\n" +
      "• Concentrated OH⁻ attacks Formaldehyde #1 at its carbonyl carbon.\n" +
      "• This breaks the C=O π-bond and turns the flat molecule into a crowded tetrahedral intermediate: H₂C(OH)O⁻.\n\n" +
      "2. Step 2 — The Hydride Shift (:H⁻ Transfer):\n" +
      "• The negatively charged O⁻ pushes its electrons back down to reform a C=O double bond.\n" +
      "• To make room, it kicks out a hydrogen atom carrying two electrons—a Hydride ion (:H⁻)!\n" +
      "• This :H⁻ ion jumps directly onto Formaldehyde #2's carbonyl carbon.\n" +
      "• Result: Molecule #1 (lost H⁻) is OXIDIZED to Formate ion (HCOO⁻), while Molecule #2 (gained H⁻) is REDUCED to Methanol (CH₃OH)!",
    formulas: [
      {
        label: "1. OVERALL CANNIZZARO REACTION",
        formula: "2 HCHO  +  conc. KOH  ⟶  HCOO⁻K⁺ (Oxidized)  +  CH₃OH (Reduced)",
        explanation: "One formaldehyde molecule oxidizes into potassium formate while the other reduces into methanol.",
      },
      {
        label: "2. RATE-DETERMINING HYDRIDE SHIFT",
        formula: "H₂C(OH)O⁻  +  HCHO  ⟶  HCOOH  +  CH₃O⁻  ⇌  HCOO⁻  +  CH₃OH",
        explanation: "The :H⁻ ion transfers directly from carbon to carbon, followed by fast proton exchange.",
      },
    ],
    steps: [
      {
        step: 1,
        title: "Add Concentrated OH⁻ Base",
        math: "HCHO + OH⁻ ⟶ H₂C(OH)O⁻  (Tetrahedral Intermediate)",
        explanation: "Hydroxide adds to Molecule #1, setting up an electron-rich intermediate ready to donate a hydride.",
      },
      {
        step: 2,
        title: "Transfer the Hydride (:H⁻) Ion",
        math: "Molecule #1 ⟶ HCOO⁻ (Oxidized)   |   Molecule #2 ⟶ CH₃OH (Reduced)",
        explanation: "Watch the glowing :H⁻ ion jump across to Molecule #2, simultaneously creating an acid salt and an alcohol.",
      },
    ],
    conclusion:
      "Key Takeaway: Without α-hydrogens, aldehydes in concentrated base undergo Cannizzaro self-redox: one molecule oxidizes to a carboxylate salt (HCOO⁻) and the other reduces to an alcohol (CH₃OH).",
  },
};

export interface AldolCannizzaroState {
  stage: 1 | 2 | 3;
  introStep: "mission" | "instructions";
  gameStarted: boolean;
  showExplanationModal: boolean;
  showSuccessModal: boolean;
  showWrongModal: boolean;
  feedbackMessage: string | null;

  // Stage 1: α-H Gatekeeper (Sequential: Acetaldehyde 1/2 -> Benzaldehyde 2/2)
  stage1Molecule: "acetaldehyde" | "benzaldehyde";
  stage1ChosenPathway: "aldol" | "cannizzaro" | null;
  stage1Animating: boolean;
  stage1Progress: number; // 0 -> 1
  stage1SlideState: "idle" | "sliding-out" | "sliding-in";

  // Stage 2: Aldol Coupling & Heat Dehydration
  stage2RotationDeg: number; // -180 to +180 (0° = aligned)
  stage2Coupled: boolean;
  stage2CouplingAnimating: boolean;
  stage2CouplingProgress: number; // 0 -> 1
  stage2Temp: number; // 25 -> 100°C
  stage2Dehydrated: boolean;
  stage2Dehydrating: boolean;
  stage2DehydrationProgress: number; // 0 -> 1

  // Stage 3: Cannizzaro Hydride Shift
  stage3BaseAdded: boolean;
  stage3HydrateAnimating: boolean;
  stage3HydrateProgress: number; // 0 -> 1
  stage3HydrideShifted: boolean;
  stage3HydrideAnimating: boolean;
  stage3HydrideProgress: number; // 0 -> 1

  // Actions
  setStage: (stage: 1 | 2 | 3) => void;
  setIntroStep: (step: "mission" | "instructions") => void;
  setGameStarted: (started: boolean) => void;
  setShowExplanationModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowWrongModal: (show: boolean) => void;
  resetCurrentStage: () => void;

  // Gameplay Actions
  chooseStage1Pathway: (pathway: "aldol" | "cannizzaro") => void;

  setStage2Rotation: (deg: number) => void;
  triggerStage2Coupling: () => void;
  setStage2Temp: (temp: number) => void;

  triggerStage3Base: () => void;
  triggerStage3Hydride: () => void;

  tickSimulation: (delta: number) => void;
}

export const useAldolCannizzaroStore = create<AldolCannizzaroState>((set, get) => ({
  stage: 1,
  introStep: "mission",
  gameStarted: false,
  showExplanationModal: false,
  showSuccessModal: false,
  showWrongModal: false,
  feedbackMessage: null,

  // Stage 1
  stage1Molecule: "acetaldehyde",
  stage1ChosenPathway: null,
  stage1Animating: false,
  stage1Progress: 0,
  stage1SlideState: "idle",

  // Stage 2
  stage2RotationDeg: 135,
  stage2Coupled: false,
  stage2CouplingAnimating: false,
  stage2CouplingProgress: 0,
  stage2Temp: 25,
  stage2Dehydrated: false,
  stage2Dehydrating: false,
  stage2DehydrationProgress: 0,

  // Stage 3
  stage3BaseAdded: false,
  stage3HydrateAnimating: false,
  stage3HydrateProgress: 0,
  stage3HydrideShifted: false,
  stage3HydrideAnimating: false,
  stage3HydrideProgress: 0,

  setStage: (stage) =>
    set({
      stage,
      showExplanationModal: false,
      showSuccessModal: false,
      showWrongModal: false,
      feedbackMessage: null,
      stage1Molecule: "acetaldehyde",
      stage1ChosenPathway: null,
      stage1Animating: false,
      stage1Progress: 0,
      stage1SlideState: "idle",
      stage2RotationDeg: 135,
      stage2Coupled: false,
      stage2CouplingAnimating: false,
      stage2CouplingProgress: 0,
      stage2Temp: 25,
      stage2Dehydrated: false,
      stage2Dehydrating: false,
      stage2DehydrationProgress: 0,
      stage3BaseAdded: false,
      stage3HydrateAnimating: false,
      stage3HydrateProgress: 0,
      stage3HydrideShifted: false,
      stage3HydrideAnimating: false,
      stage3HydrideProgress: 0,
    }),

  setIntroStep: (introStep) => set({ introStep }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setShowExplanationModal: (showExplanationModal) => set({ showExplanationModal }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
  setShowWrongModal: (showWrongModal) => set({ showWrongModal }),

  resetCurrentStage: () => {
    const current = get().stage;
    get().setStage(current);
  },

  chooseStage1Pathway: (pathway) => {
    const { stage1Molecule, stage1Animating, stage1SlideState } = get();
    if (stage1Animating || stage1SlideState !== "idle") return;

    const isAcetaldehyde = stage1Molecule === "acetaldehyde";
    const isCorrect =
      (isAcetaldehyde && pathway === "aldol") ||
      (!isAcetaldehyde && pathway === "cannizzaro");

    if (!isCorrect) {
      const msg = isAcetaldehyde
        ? "Incorrect! Acetaldehyde (CH₃CHO) has 3 acidic α-hydrogens on its methyl carbon. Because OH⁻ easily removes an α-H to form an enolate, it undergoes the Aldol reaction—not Cannizzaro!"
        : "Incorrect! Benzaldehyde (C₆H₅CHO) has NO α-hydrogens on the ipso ring carbon attached to C=O. Without an α-H, it cannot form an enolate for Aldol and instead undergoes the Cannizzaro reaction!";
      set({
        stage1ChosenPathway: pathway,
        showWrongModal: true,
        showSuccessModal: false,
        feedbackMessage: msg,
      });
      return;
    }

    const successMsg = isAcetaldehyde
      ? "Correct! Acetaldehyde has 3 acidic α-hydrogens. OH⁻ plucks one α-H to form a resonance-stabilized enolate ion, initiating the Aldol reaction!"
      : "Correct! Benzaldehyde lacks α-hydrogens, so OH⁻ attacks the carbonyl carbon directly to form the tetrahedral intermediate for the Cannizzaro reaction!";

    set({
      stage1ChosenPathway: pathway,
      stage1Animating: true,
      stage1Progress: 0,
      feedbackMessage: successMsg,
    });
  },

  setStage2Rotation: (deg) => {
    const s = get();
    if (s.stage2Coupled || s.stage2CouplingAnimating) return;
    const clamped = Math.max(-180, Math.min(180, deg));
    set({ stage2RotationDeg: clamped });
  },

  triggerStage2Coupling: () => {
    const s = get();
    if (s.stage2Coupled || s.stage2CouplingAnimating) return;
    if (Math.abs(s.stage2RotationDeg) > 15) return;
    set({
      stage2RotationDeg: 0,
      stage2CouplingAnimating: true,
      stage2CouplingProgress: 0,
    });
  },

  setStage2Temp: (temp) => {
    const s = get();
    const clamped = Math.max(25, Math.min(100, temp));
    if (!s.stage2Coupled) {
      if (clamped >= 80) {
        set({
          stage2Temp: 25,
          showWrongModal: true,
          feedbackMessage: "Align and join the Enolate and Acetaldehyde first! Rotate the Enolate to 0° and click APPROACH before heating.",
        });
      }
      return;
    }

    if (clamped >= 80 && !s.stage2Dehydrated && !s.stage2Dehydrating) {
      set({
        stage2Temp: clamped,
        stage2Dehydrating: true,
        stage2DehydrationProgress: 0,
        feedbackMessage: "Aldol Condensation complete! Heating (Δ ≥ 80°C) eliminated H₂O to form conjugated Crotonaldehyde (CH₃–CH=CH–CHO).",
      });
    } else {
      set({ stage2Temp: clamped });
    }
  },

  triggerStage3Base: () => {
    const s = get();
    if (s.stage3BaseAdded || s.stage3HydrateAnimating) return;
    set({
      stage3HydrateAnimating: true,
      stage3HydrateProgress: 0,
    });
  },

  triggerStage3Hydride: () => {
    const s = get();
    if (!s.stage3BaseAdded) {
      set({
        showWrongModal: true,
        feedbackMessage: "Add concentrated OH⁻ first! Hydroxide must attack Formaldehyde #1 to create the tetrahedral intermediate before hydride (:H⁻) transfer can occur.",
      });
      return;
    }
    if (s.stage3HydrideShifted || s.stage3HydrideAnimating) return;
    set({
      stage3HydrideAnimating: true,
      stage3HydrideProgress: 0,
      feedbackMessage: "Cannizzaro Disproportionation complete! Direct :H⁻ transfer oxidized Molecule 1 to Formate (HCOO⁻) and reduced Molecule 2 to Methanol (CH₃OH).",
    });
  },

  tickSimulation: (delta) => {
    const s = get();

    // Stage 1 animation
    if (s.stage === 1 && s.stage1Animating) {
      const next = Math.min(1.0, s.stage1Progress + delta * 1.15);
      if (next >= 1.0) {
        if (s.stage1Molecule === "acetaldehyde") {
          set({ stage1Progress: 1.0, stage1Animating: false });
          // Pause briefly to show completed enolate, then slide out -> Benzaldehyde slides in
          setTimeout(() => {
            if (get().stage !== 1) return;
            set({ stage1SlideState: "sliding-out" });
            setTimeout(() => {
              if (get().stage !== 1) return;
              set({
                stage1Molecule: "benzaldehyde",
                stage1Progress: 0,
                stage1ChosenPathway: null,
                feedbackMessage: null,
                stage1SlideState: "sliding-in",
              });
              setTimeout(() => {
                set({ stage1SlideState: "idle" });
              }, 50);
            }, 320);
          }, 450);
        } else {
          set({
            stage1Progress: 1.0,
            stage1Animating: false,
            feedbackMessage:
              "Both molecules verified! Acetaldehyde (3 α-H) forms an enolate for Aldol, while Benzaldehyde (0 α-H) undergoes direct OH⁻ attack for Cannizzaro.",
          });
          setTimeout(() => {
            if (get().stage === 1 && get().stage1Molecule === "benzaldehyde" && get().stage1Progress >= 1.0) {
              set({ showSuccessModal: true });
            }
          }, 1000);
        }
      } else {
        set({ stage1Progress: next });
      }
    }

    // Stage 2 Coupling animation
    if (s.stage === 2 && s.stage2CouplingAnimating) {
      const next = Math.min(1.0, s.stage2CouplingProgress + delta * 1.15);
      if (next >= 1.0) {
        set({
          stage2CouplingProgress: 1.0,
          stage2CouplingAnimating: false,
          stage2Coupled: true,
        });
      } else {
        set({ stage2CouplingProgress: next });
      }
    }

    // Stage 2 Dehydration animation
    if (s.stage === 2 && s.stage2Dehydrating) {
      const next = Math.min(1.0, s.stage2DehydrationProgress + delta * 0.95);
      if (next >= 1.0) {
        set({
          stage2DehydrationProgress: 1.0,
          stage2Dehydrating: false,
          stage2Dehydrated: true,
        });
        setTimeout(() => {
          if (get().stage === 2 && get().stage2Dehydrated) {
            set({ showSuccessModal: true });
          }
        }, 1000);
      } else {
        set({ stage2DehydrationProgress: next });
      }
    }

    // Stage 3 Hydrate animation
    if (s.stage === 3 && s.stage3HydrateAnimating) {
      const next = Math.min(1.0, s.stage3HydrateProgress + delta * 1.15);
      if (next >= 1.0) {
        set({
          stage3HydrateProgress: 1.0,
          stage3HydrateAnimating: false,
          stage3BaseAdded: true,
        });
      } else {
        set({ stage3HydrateProgress: next });
      }
    }

    // Stage 3 Hydride Shift animation
    if (s.stage === 3 && s.stage3HydrideAnimating) {
      const next = Math.min(1.0, s.stage3HydrideProgress + delta * 0.95);
      if (next >= 1.0) {
        set({
          stage3HydrideProgress: 1.0,
          stage3HydrideAnimating: false,
          stage3HydrideShifted: true,
        });
        setTimeout(() => {
          if (get().stage === 3 && get().stage3HydrideShifted) {
            set({ showSuccessModal: true });
          }
        }, 1000);
      } else {
        set({ stage3HydrideProgress: next });
      }
    }
  },
}));
