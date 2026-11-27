import { create } from "zustand";

export interface NucleophilicStageConfig {
  stage: number;
  title: string;
  subtitle: string;
  substrateName: string;
  substrateFormula: string;
  nucleophileName: string;
  nucleophileFormula: string;
  productName: string;
  productFormula: string;

  // Physical & Chemical parameters
  optimalAngle: number; // 107.0 degrees (Bürgi-Dunitz)
  angleTolerance: number; // e.g. +/- 3.5 deg
  baselineEa: number; // kJ/mol
  catalyzedEa?: number; // kJ/mol when acid is added
  carbonDeltaPlus: number; // partial positive charge on carbonyl carbon (e.g. +0.55)
  catalyzedCarbonDeltaPlus?: number; // surges to +0.85

  // Sliders
  minAngle: number; // 90 deg
  maxAngle: number; // 130 deg
  defaultAngle: number; // e.g. 96 deg
  minEnergy: number; // 10 kJ/mol
  maxEnergy: number; // 100 kJ/mol
  defaultEnergy: number; // 20 kJ/mol

  requiresAcidCatalyst?: boolean;
  targetDescription: string;

  mathDerivation: {
    title: string;
    concept: string;
    conclusion: string;
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
  };
}

export const NUCLEOPHILIC_STAGES: Record<number, NucleophilicStageConfig> = {
  1: {
    stage: 1,
    title: "Stage 1: The Bürgi–Dunitz Sweet Spot (Formaldehyde Addition)",
    subtitle: "Calibrate incoming attack angle θ ≈ 107° to overlap with the empty π* LUMO lobe and rehybridize planar sp² into tetrahedral sp³",
    substrateName: "Formaldehyde",
    substrateFormula: "H₂C=O",
    nucleophileName: "Cyanide Ion",
    nucleophileFormula: ":C≡N⁻",
    productName: "Glycolonitrile (Formaldehyde Cyanohydrin)",
    productFormula: "HO-CH₂-CN",
    optimalAngle: 107.0,
    angleTolerance: 3.5,
    baselineEa: 25.0,
    carbonDeltaPlus: 0.55,
    minAngle: 90.0,
    maxAngle: 130.0,
    defaultAngle: 96.0,
    minEnergy: 10.0,
    maxEnergy: 60.0,
    defaultEnergy: 20.0,
    targetDescription: "Align attack angle θ ≈ 107.0° and provide kinetic energy Ek ≥ 25.0 kJ/mol to initiate nucleophilic addition.",
    mathDerivation: {
      title: "Why 107°? The Bürgi–Dunitz Attack Angle & Tetrahedral Inversion",
      concept:
        "In Formaldehyde (H₂C=O), the carbon-oxygen double bond is strongly polarized: Oxygen (δ⁻) pulls electrons away from Carbon (δ⁺). This makes Carbon an electrophile (electron-lover) that attracts negatively charged nucleophiles like the cyanide ion (:C≡N⁻).\n\n" +
        "Why can't the nucleophile attack straight at 90° or 180°?\n" +
        "• Too Steep (< 98°): Oxygen has two electron-rich lone pairs. Because like charges repel, a negative nucleophile approaching too close to Oxygen gets pushed away (electrostatic repulsion).\n" +
        "• Too Wide (> 116°): The nucleophile misses the empty π* antibonding orbital (LUMO) lobe on Carbon and fails to form a bond.\n" +
        "• The Sweet Spot (θ ≈ 107°): Approaching at 107° to the C=O bond gives maximum overlap with the π* LUMO while staying clear of Oxygen's lone pairs.\n\n" +
        "What happens to the shape (sp² ⟶ sp³)?\n" +
        "Formaldehyde starts flat (trigonal planar, sp², 120° angles). As :C≡N⁻ forms a new C–C bond, the π-electrons shift onto Oxygen (O⁻), and the two H atoms fold backward like an opening umbrella into a 3D tetrahedral (sp³, 109.5°) shape!",
      conclusion:
        "Key Takeaway: Formaldehyde (HCHO) is the fastest-reacting carbonyl compound because its tiny hydrogen atoms create zero steric crowding and zero electron donation—leaving the δ⁺ carbon wide open at 107°!",
      formulas: [
        {
          label: "1. POLARITY & ELECTROPHILICITY",
          formula: "C(δ⁺)=O(δ⁻)  +  :C≡N⁻  ⟶  ⁻O–C–CN",
          explanation: "Oxygen pulls π-electrons, leaving Carbon electron-poor (δ⁺ = +0.55) and ready for nucleophilic attack.",
        },
        {
          label: "2. THE BÜRGI–DUNITZ SWEET SPOT",
          formula: "θ_BD = ∠(O=C···Nu⁻) ≈ 107.0°",
          explanation: "The exact approach angle that maximizes π* LUMO overlap while avoiding Oxygen lone-pair repulsion.",
        },
        {
          label: "3. UMBRELLA REHYBRIDIZATION",
          formula: "sp² (Flat, 120°)  ⟶  sp³ (Tetrahedral, 109.5°)",
          explanation: "Breaking the C=O π-bond converts the flat molecule into a 3D tetrahedral alkoxide intermediate.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Aim Along the 107° Corridor",
          math: "θ = 107.0° ± 3.5°   (103.5° to 110.5°)",
          explanation: "Align the trajectory beam with the green 107° marker so the nucleophile hits the center of the blue π* LUMO lobe.",
        },
        {
          step: 2,
          title: "Supply Activation Energy (Ea)",
          math: "Ek ≥ Ea = 25.0 kJ/mol",
          explanation: "Formaldehyde has tiny H atoms and no electron-donating groups, so its barrier is very low (25 kJ/mol).",
        },
        {
          step: 3,
          title: "Observe Umbrella Inversion",
          math: "H₂C=O + :CN⁻ ⟶ H₂C(O⁻)CN",
          explanation: "Watch the C=O double bond fade into a single bond as the H atoms fold back into a 109.5° tetrahedron.",
        },
      ],
    },
  },
  2: {
    stage: 2,
    title: "Stage 2: Steric & Inductive Resistance (Acetone Addition)",
    subtitle: "Overcome the +I inductive electron-donating effect and rotating methyl van der Waals clouds that constrict the Bürgi-Dunitz corridor",
    substrateName: "Acetone",
    substrateFormula: "CH₃-CO-CH₃",
    nucleophileName: "Cyanide Ion",
    nucleophileFormula: ":C≡N⁻",
    productName: "Acetone Cyanohydrin Intermediate",
    productFormula: "(CH₃)₂C(O⁻)CN",
    optimalAngle: 107.0,
    angleTolerance: 2.0, // Narrower tolerance due to methyl crowding
    baselineEa: 65.0, // Significantly higher activation barrier
    carbonDeltaPlus: 0.30, // Much lower electrophilicity due to dual +I methyl groups
    minAngle: 90.0,
    maxAngle: 130.0,
    defaultAngle: 98.0,
    minEnergy: 20.0,
    maxEnergy: 100.0,
    defaultEnergy: 40.0,
    targetDescription: "Navigate the narrow steric corridor (θ = 107.0° ± 2.0°) with high kinetic energy Ek ≥ 65.0 kJ/mol to overcome +I charge dampening.",
    mathDerivation: {
      title: "Why Are Ketones Slower Than Aldehydes? (Steric + Electronic Effects)",
      concept:
        "Replacing Formaldehyde's two tiny hydrogens with two bulky methyl groups (-CH₃) in Acetone (CH₃COCH₃) slows down nucleophilic addition for two major reasons:\n\n" +
        "1. Electronic Effect (+I Inductive Push)\n" +
        "Methyl groups are electron-donating (+I effect). They push extra electron density into the carbonyl carbon, partially neutralizing its positive charge:\n" +
        "• Formaldehyde (HCHO): δ⁺ = +0.55 (strong pull)\n" +
        "• Acetaldehyde (CH₃CHO): δ⁺ = +0.42 (moderate pull)\n" +
        "• Acetone (CH₃COCH₃): δ⁺ = +0.30 (weak pull)\n" +
        "Because Carbon is less positive, it attracts the negative nucleophile much more weakly.\n\n" +
        "2. Steric Hindrance (Physical Crowding)\n" +
        "Each -CH₃ group has three spinning hydrogen atoms forming a bulky electron cloud (the gray translucent sphere). These clouds physically block sloppy approach angles (shrinking tolerance to ±2.0°), and squeezing them from 120° down to 109.5° creates steric strain that raises the barrier from 25 to 65 kJ/mol!",
      conclusion:
        "Key Takeaway: Aldehydes are always more reactive than ketones in nucleophilic addition because ketones suffer from both +I electron donation (lowering δ⁺) and steric crowding from two alkyl groups.",
      formulas: [
        {
          label: "1. CARBONYL REACTIVITY ORDER",
          formula: "HCHO (Fastest)  >  RCHO (Aldehydes)  >  R₂C=O (Ketones)",
          explanation: "More alkyl (+I) groups mean weaker δ⁺ pull and greater steric crowding, slowing the reaction.",
        },
        {
          label: "2. ACTIVATION ENERGY JUMP",
          formula: "ΔEa = Ea(Acetone) − Ea(Formaldehyde) = 65.0 − 25.0 = +40.0 kJ/mol",
          explanation: "Compressing two bulky -CH₃ groups from 120° to 109.5° requires much higher collision energy.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Thread the Narrow Steric Corridor",
          math: "θ = 107.0° ± 2.0°   (105.0° to 109.0°)",
          explanation: "Stay close to 107.0°; any larger deviation causes the nucleophile to bounce off the bulky -CH₃ electron clouds.",
        },
        {
          step: 2,
          title: "Overcome the Higher Barrier (Ea)",
          math: "Ek ≥ 65.0 kJ/mol",
          explanation: "Raise kinetic energy to at least 65 kJ/mol so :C≡N⁻ has enough energy to overcome +I dampening and steric strain.",
        },
      ],
    },
  },
  3: {
    stage: 3,
    title: "Stage 3: Acid Catalysis & Quantitative Synthesis (Acetone Cyanohydrin)",
    subtitle: "Activate the H⁺ acid catalyst to protonate carbonyl oxygen, surging electrophilicity and slashing activation barrier for quantitative addition",
    substrateName: "Acetone (Acid-Activated)",
    substrateFormula: "CH₃-C(=O⁺H)-CH₃",
    nucleophileName: "Hydrogen Cyanide / Cyanide",
    nucleophileFormula: "HCN / :C≡N⁻",
    productName: "Acetone Cyanohydrin",
    productFormula: "(CH₃)₂C(OH)CN",
    optimalAngle: 107.0,
    angleTolerance: 4.0, // Wider tolerance when activated
    baselineEa: 78.0, // Uncatalyzed weak nucleophile barrier
    catalyzedEa: 28.0, // Slashed by acid catalyst!
    carbonDeltaPlus: 0.30,
    catalyzedCarbonDeltaPlus: 0.85, // Enormous electrophilic surge
    minAngle: 90.0,
    maxAngle: 130.0,
    defaultAngle: 100.0,
    minEnergy: 10.0,
    maxEnergy: 90.0,
    defaultEnergy: 30.0,
    requiresAcidCatalyst: true,
    targetDescription: "Activate the H⁺ Acid Catalyst switch to protonate carbonyl oxygen (Ea drops from 78 → 28 kJ/mol), then fire CN⁻ to complete the synthesis.",
    mathDerivation: {
      title: "How Does an Acid Catalyst (H⁺) Unlock Unreactive Ketones?",
      concept:
        "In real labs, HCN is a weak acid and a poor source of :CN⁻. On a neutral ketone like Acetone, the uncatalyzed energy barrier is 78 kJ/mol—far too high for the reaction to proceed at room temperature!\n\n" +
        "How the H⁺ Catalyst Solves This:\n" +
        "1. Protonating Oxygen: Turning on the H⁺ Acid Catalyst attaches a positively charged proton (H⁺) to Oxygen's lone pair (>C=O + H⁺ ⇌ >C=O⁺–H).\n" +
        "2. Supercharging Carbon (δ⁺: +0.30 ⟶ +0.85): Because Oxygen now carries a positive charge (O⁺), it pulls π-electrons away from Carbon aggressively (resonance: [ >C=O⁺–H ⟷ >C⁺–OH ]). Carbon becomes nearly a full carbocation!\n" +
        "3. Slashing the Energy Barrier (78 ⟶ 28 kJ/mol): This huge positive charge acts like a powerful magnet for the incoming :CN⁻ nucleophile, cutting the activation barrier by 50 kJ/mol and making Acetone Cyanohydrin synthesis effortless!",
      conclusion:
        "Key Takeaway: Acid catalysis doesn't make the nucleophile stronger—it makes the carbonyl electrophile MUCH stronger by protonating oxygen, turning sluggish ketones into fast-reacting targets.",
      formulas: [
        {
          label: "1. ACID ACTIVATION RESONANCE",
          formula: "(CH₃)₂C=O + H⁺  ⇌  [ (CH₃)₂C=O⁺–H  ⟷  (CH₃)₂C⁺–OH ]",
          explanation: "Protonating Oxygen creates a strong carbocation resonance form, boosting Carbon's electrophilicity.",
        },
        {
          label: "2. CATALYTIC BARRIER DROP",
          formula: "Ea: 78.0 kJ/mol (Acid OFF)  ⟶  28.0 kJ/mol (H⁺ ON)",
          explanation: "A 50 kJ/mol drop speeds up the reaction by over 10⁸ times at room temperature (298 K).",
        },
        {
          label: "3. OVERALL CYANOHYDRIN SYNTHESIS",
          formula: "(CH₃)₂C=O  +  HCN  —(H⁺)→  (CH₃)₂C(OH)CN",
          explanation: "Produces Acetone Cyanohydrin, an important building block for α-hydroxy acids and polymers.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Turn ON the H⁺ Acid Catalyst",
          math: "Click [H⁺ OFF] ⟶ [H⁺ ON]   (δ⁺: +0.30 ⟶ +0.85)",
          explanation: "Protonate the carbonyl oxygen to light up Carbon's electrophilic pull and drop Ea to 28 kJ/mol.",
        },
        {
          step: 2,
          title: "Aim & Fire at Moderate Energy",
          math: "θ = 107.0° ± 4.0°,   Ek ≥ 28.0 kJ/mol",
          explanation: "With the barrier lowered, even a gentle 30 kJ/mol collision smoothly produces Acetone Cyanohydrin!",
        },
      ],
    },
  },
};

export type CollisionResult =
  | "none"
  | "hit"
  | "deflected_oxygen_repulsion"
  | "missed_lumo"
  | "insufficient_energy"
  | "steric_rebound";

interface NucleophilicAdditionState {
  currentStage: number;
  attackAngle: number;
  kineticEnergy: number;
  acidCatalystActive: boolean;

  // Animation & simulation progression
  isSimulating: boolean;
  projectileProgress: number; // 0 (at launcher) to 1 (at carbon)
  deflectionProgress: number; // 0 to 1 smooth deflection/rebound after failed collision
  rehybridizationProgress: number; // 0 (sp2 planar) to 1 (sp3 tetrahedral)
  collisionResult: CollisionResult;
  pendingFailureReason: string;

  // Game lifecycle
  isWon: boolean;
  isGameOver: boolean;
  failureReason: string;
  showResultModal: boolean;

  // Actions
  setAttackAngle: (angle: number) => void;
  setKineticEnergy: (energy: number) => void;
  toggleAcidCatalyst: () => void;
  fireNucleophile: () => void;
  tickSimulation: (delta: number) => void;
  resetSimulation: () => void;
  nextStage: () => void;
  setStage: (stageNum: number) => void;
  restartAll: () => void;
}

export const useNucleophilicAdditionStore = create<NucleophilicAdditionState>((set, get) => ({
  currentStage: 1,
  attackAngle: NUCLEOPHILIC_STAGES[1].defaultAngle,
  kineticEnergy: NUCLEOPHILIC_STAGES[1].defaultEnergy,
  acidCatalystActive: false,

  isSimulating: false,
  projectileProgress: 0,
  deflectionProgress: 0,
  rehybridizationProgress: 0,
  collisionResult: "none",
  pendingFailureReason: "",

  isWon: false,
  isGameOver: false,
  failureReason: "",
  showResultModal: false,

  setAttackAngle: (angle: number) => {
    if (get().isSimulating) return;
    const stage = NUCLEOPHILIC_STAGES[get().currentStage];
    const clamped = Math.max(stage.minAngle, Math.min(stage.maxAngle, angle));
    set({ attackAngle: clamped });
  },

  setKineticEnergy: (energy: number) => {
    if (get().isSimulating) return;
    const stage = NUCLEOPHILIC_STAGES[get().currentStage];
    const clamped = Math.max(stage.minEnergy, Math.min(stage.maxEnergy, energy));
    set({ kineticEnergy: clamped });
  },

  toggleAcidCatalyst: () => {
    if (get().isSimulating) return;
    set((s) => ({ acidCatalystActive: !s.acidCatalystActive }));
  },

  fireNucleophile: () => {
    const s = get();
    if (s.isSimulating) return;

    set({
      isSimulating: true,
      projectileProgress: 0,
      deflectionProgress: 0,
      rehybridizationProgress: 0,
      collisionResult: "none",
      pendingFailureReason: "",
      isWon: false,
      isGameOver: false,
      failureReason: "",
      showResultModal: false,
    });
  },

  tickSimulation: (delta: number) => {
    const s = get();
    if (!s.isSimulating) return;

    // If a failed collision is already animating its deflection/rebound, advance deflectionProgress
    if (
      s.collisionResult !== "none" &&
      s.collisionResult !== "hit"
    ) {
      const nextDeflect = Math.min(1.0, s.deflectionProgress + delta * 2.2);
      if (nextDeflect >= 1.0) {
        set({
          deflectionProgress: 1.0,
          isSimulating: false,
          isGameOver: true,
          failureReason: s.pendingFailureReason,
        });
        setTimeout(() => {
          if (get().isGameOver && !get().isSimulating) {
            set({ showResultModal: true });
          }
        }, 1000);
      } else {
        set({ deflectionProgress: nextDeflect });
      }
      return;
    }

    const stage = NUCLEOPHILIC_STAGES[s.currentStage];
    const currentAngle = s.attackAngle;
    const currentEnergy = s.kineticEnergy;
    const isAcidActive = s.acidCatalystActive;

    const effectiveEa = isAcidActive && stage.catalyzedEa ? stage.catalyzedEa : stage.baselineEa;
    const effectiveTolerance = stage.angleTolerance;

    // Projectile speed scales with kinetic energy
    const travelSpeed = 0.95 + (currentEnergy / 60.0) * 0.75;
    const newProgress = Math.min(1.0, s.projectileProgress + delta * travelSpeed);

    if (newProgress < 1.0) {
      set({ projectileProgress: newProgress });
      return;
    }

    // Projectile has reached the reaction collision zone (newProgress = 1.0)
    const angleDiff = Math.abs(currentAngle - stage.optimalAngle);

    // 1. Oxygen Lone Pair Repulsion (attack angle too steep, < 98 deg)
    if (currentAngle < 98.0) {
      set({
        projectileProgress: 1.0,
        collisionResult: "deflected_oxygen_repulsion",
        pendingFailureReason: `Electrostatic Repulsion! At θ = ${currentAngle.toFixed(1)}°, the nucleophile clashes with oxygen's electron-rich lone pairs. Increase attack angle toward 107.0°.`,
      });
      return;
    }

    // 2. Missed π* LUMO Lobe (attack angle too shallow, > 116 deg)
    if (currentAngle > 116.0) {
      set({
        projectileProgress: 1.0,
        collisionResult: "missed_lumo",
        pendingFailureReason: `Glancing Miss! At θ = ${currentAngle.toFixed(1)}°, the incoming trajectory bypasses carbon's π* antibonding orbital. Reduce angle toward 107.0°.`,
      });
      return;
    }

    // 3. Steric Corridor Check (must be within angle tolerance)
    if (angleDiff > effectiveTolerance) {
      set({
        projectileProgress: 1.0,
        collisionResult: "steric_rebound",
        pendingFailureReason: `Steric Collision! In ${stage.substrateName}, angle deviation (Δθ = ${angleDiff.toFixed(1)}°) clashes with substituent atoms. Target the Bürgi-Dunitz sweet spot: 107.0° ± ${effectiveTolerance.toFixed(1)}°.`,
      });
      return;
    }

    // 4. Kinetic Energy Check against Activation Barrier
    if (currentEnergy < effectiveEa) {
      const hint = stage.requiresAcidCatalyst && !isAcidActive
        ? ` (Tip: Activate the H⁺ Acid Catalyst to slash Ea from ${stage.baselineEa} to ${stage.catalyzedEa} kJ/mol!)`
        : "";
      set({
        projectileProgress: 1.0,
        collisionResult: "insufficient_energy",
        pendingFailureReason: `Insufficient Activation Energy! Collision energy (${currentEnergy.toFixed(1)} kJ/mol) is lower than activation barrier Ea = ${effectiveEa.toFixed(1)} kJ/mol.${hint}`,
      });
      return;
    }

    // 5. SUCCESSFUL COLLISION! Run rehybridization animation (sp2 planar -> sp3 tetrahedral)
    const newRehyb = Math.min(1.0, s.rehybridizationProgress + delta * 1.6);
    set({
      projectileProgress: 1.0,
      rehybridizationProgress: newRehyb,
    });

    if (newRehyb >= 1.0) {
      set({
        isSimulating: false,
        collisionResult: "hit",
        isWon: true,
      });
      setTimeout(() => {
        if (get().isWon && !get().isSimulating) {
          set({ showResultModal: true });
        }
      }, 1000);
    }
  },

  resetSimulation: () => {
    const stage = NUCLEOPHILIC_STAGES[get().currentStage];
    set({
      attackAngle: stage.defaultAngle,
      kineticEnergy: stage.defaultEnergy,
      acidCatalystActive: false,
      isSimulating: false,
      projectileProgress: 0,
      deflectionProgress: 0,
      rehybridizationProgress: 0,
      collisionResult: "none",
      pendingFailureReason: "",
      isWon: false,
      isGameOver: false,
      failureReason: "",
      showResultModal: false,
    });
  },

  nextStage: () => {
    const nextNum = Math.min(3, get().currentStage + 1);
    get().setStage(nextNum);
  },

  setStage: (stageNum: number) => {
    const stage = NUCLEOPHILIC_STAGES[stageNum] || NUCLEOPHILIC_STAGES[1];
    set({
      currentStage: stageNum,
      attackAngle: stage.defaultAngle,
      kineticEnergy: stage.defaultEnergy,
      acidCatalystActive: false,
      isSimulating: false,
      projectileProgress: 0,
      deflectionProgress: 0,
      rehybridizationProgress: 0,
      collisionResult: "none",
      pendingFailureReason: "",
      isWon: false,
      isGameOver: false,
      failureReason: "",
      showResultModal: false,
    });
  },

  restartAll: () => {
    get().setStage(1);
  },
}));
