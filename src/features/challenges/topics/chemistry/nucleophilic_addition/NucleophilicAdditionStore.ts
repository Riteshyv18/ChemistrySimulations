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
      title: "Stage 1: Bürgi–Dunitz Trajectory & Frontier Molecular Orbital Theory",
      concept:
        "When an incoming nucleophile (:Nu⁻) attacks a carbonyl group (>C=O), why does it not attack perpendicularly at 90°, nor along the bond axis at 180°?\n\n" +
        "1. The Bürgi–Dunitz Trajectory (θ ≈ 107°)\n" +
        "In carbonyls, the empty antibonding π* orbital (Lowest Unoccupied Molecular Orbital, LUMO) has a larger lobe on the less electronegative carbon atom, tilted away from oxygen at an angle of roughly 105°–110°.\n" +
        "• At 90°: The nucleophile is pushed away by electrostatic and Pauli repulsion from oxygen's electron-rich non-bonding lone pairs.\n" +
        "• At > 120°: The nucleophile has poor spatial overlap with the π* LUMO.\n" +
        "• At 107°: Maximum constructive orbital overlap is achieved with minimal electron-electron repulsion!\n\n" +
        "2. The sp² → sp³ Rehybridization\n" +
        "As the nucleophile approaches, two electrons from the C=O π-bond shift entirely to the more electronegative oxygen atom. The planar 120° H-C-H geometry flexes backward (umbrella pyramidalization) into a 109.5° tetrahedral alkoxide intermediate.",
      conclusion:
        "Key Chemistry Takeaway: The Bürgi-Dunitz angle (107°) represents the path of least resistance on the potential energy surface. HCHO is the most reactive aliphatic carbonyl because hydrogen atoms impose zero steric obstruction and zero electron donation.",
      formulas: [
        {
          label: "1. BÜRGI-DUNITZ ATTACK ANGLE",
          formula: "\\theta_{\\text{BD}} = \\angle(\\text{O}=\\text{C}\\cdots\\text{Nu}^-) \\approx 107.0^\\circ",
          explanation: "Angle between carbonyl C=O axis and incoming nucleophile trajectory yielding maximum π* LUMO overlap.",
        },
        {
          label: "2. PLANAR TO TETRAHEDRAL PYRAMIDALIZATION",
          formula: "sp^2\\text{ (Planar, } 120^\\circ\\text{)} \\longrightarrow sp^3\\text{ (Tetrahedral, } 109.5^\\circ\\text{)}",
          explanation: "Transition state geometry relief as π-bond breaks and 4 equivalent σ-bonds form.",
        },
        {
          label: "3. ACTIVATION BARRIER ENVELOPE",
          formula: "E_a(\\theta) = E_{a0} + k_\\theta(\\theta - 107.0^\\circ)^2",
          explanation: "Deviating from 107° dramatically spikes activation energy due to Pauli repulsion or orbital misalignment.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Identify Substrate & Orbital Geometry",
          math: "\\text{HCHO: } sp^2\\text{ hybridized C, bond angles } 120^\\circ, \\text{ electrophilic center } \\delta^+ = +0.55",
          explanation: "Formaldehyde has two tiny hydrogen atoms, offering an unshielded approach vector for the cyanide ion.",
        },
        {
          step: 2,
          title: "Determine Optimal Attack Vector",
          math: "\\theta_{\\text{target}} = 107.0^\\circ \\quad (\\text{Tolerance: } 103.5^\\circ \\le \\theta \\le 110.5^\\circ)",
          explanation: "Attacking at 107° channels the nucleophile directly into the carbon π* lobe.",
        },
        {
          step: 3,
          title: "Supply Sufficient Kinetic Energy",
          math: "E_k \\ge E_a = 25.0\\text{ kJ/mol}",
          explanation: "Kinetic energy of collision must exceed the 25.0 kJ/mol activation barrier to cleave the π-bond.",
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
      title: "Stage 2: Electronic (+I) and Steric Shielding in Ketones vs Aldehydes",
      concept:
        "Why are ketones significantly less reactive toward nucleophilic addition than aldehydes (JEE Mains Golden Rule)?\n\n" +
        "1. Electronic Effect (+I Inductive Effect)\n" +
        "Each methyl group (-CH₃) is electron-donating (+I). In acetone, two methyl groups push electron density toward the carbonyl carbon:\n" +
        "• Formaldehyde (HCHO): δ+ = +0.55\n" +
        "• Acetaldehyde (CH₃CHO): δ+ = +0.42\n" +
        "• Acetone (CH₃COCH₃): δ+ = +0.30\n" +
        "The reduced positive charge weakens the electrostatic Coulomb pull on the incoming nucleophile.\n\n" +
        "2. Steric Hindrance (Angle Compression Strain)\n" +
        "In the planar sp² state, the methyl groups are spread out at 120°. In the tetrahedral sp³ transition state, all four bonds crowd together at 109.5°. The bulky rotating hydrogen clouds of the two methyl groups clash, generating significant steric strain and raising activation energy from 25 kJ/mol to 65 kJ/mol!",
      conclusion:
        "Key Chemistry Takeaway: Reactivity order of carbonyl addition is governed by both electronic (+I) and steric factors: HCHO > RCHO > RCOR. Higher collision energy and precision alignment are required to penetrate acetone's hindered corridor.",
      formulas: [
        {
          label: "1. CARBONYL REACTIVITY HIERARCHY",
          formula: "\\text{HCHO} > \\text{RCHO} > \\text{RCOR} > \\text{ArCHO} > \\text{ArCOAr}",
          explanation: "Universal rate hierarchy dictated by combined electronic (+I) and steric crowding penalties.",
        },
        {
          label: "2. ACTIVATION ENERGY ELEVATION",
          formula: "\\Delta E_a = E_{a,\\text{ketone}} - E_{a,\\text{aldehyde}} = 65.0 - 25.0 = 40.0\\text{ kJ/mol}",
          explanation: "Steric angle compression (120° → 109.5°) of two bulky methyl groups creates severe transition-state strain.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Assess Steric Corridor Constriction",
          math: "\\text{Tolerance shrinks from } \\pm 3.5^\\circ \\longrightarrow \\pm 2.0^\\circ \\quad (105.0^\\circ \\le \\theta \\le 109.0^\\circ)",
          explanation: "Rotating methyl hydrogen atoms block glancing attacks; nucleophile must hit with exact precision.",
        },
        {
          step: 2,
          title: "Compensate for Reduced Electrophilic Pull",
          math: "\\delta^+ = +0.30 \\implies E_k \\ge 65.0\\text{ kJ/mol}",
          explanation: "Because attractive Coulomb force is weakened, the projectile requires higher kinetic energy to pierce the electron cloud.",
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
      title: "Stage 3: Acid-Catalyzed Nucleophilic Addition Mechanism",
      concept:
        "Weak nucleophiles (like HCN, H₂O, or ROH) cannot attack neutral ketones effectively because the uncatalyzed barrier is over 78 kJ/mol.\n\n" +
        "1. The Magic of Acid Protonation\n" +
        "When an acid catalyst (H⁺) is introduced:\n" +
        "• H⁺ selectively protonates the lone pair of the carbonyl oxygen atom: >C=O + H⁺ ⇌ >C=O⁺-H\n" +
        "• This sets up an immense resonance contributor: [ >C=O⁺-H  ⟷  >C⁺-OH ]\n" +
        "• The carbon atom is transformed into a full carbocation-like electrophile! Its partial positive charge surges from +0.30 to +0.85.\n\n" +
        "2. Dramatic Barrier Reduction\n" +
        "Because carbon is now intensely electron-deficient, the incoming :CN⁻ nucleophile experiences an overwhelming electrostatic attraction, slashing the activation energy from 78.0 kJ/mol down to 28.0 kJ/mol.\n" +
        "Attack occurs with rapid 100% conversion, yielding Acetone Cyanohydrin.",
      conclusion:
        "Key Chemistry Takeaway: Acid catalysis protonates oxygen to intensify the electrophilicity of carbonyl carbon, rendering even sluggish ketones receptive to addition by weak nucleophiles.",
      formulas: [
        {
          label: "1. OXYGEN PROTONATION RESONANCE",
          formula: "\\text{R}_2\\text{C}=\\text{O} + \\text{H}^+ \\rightleftharpoons \\left[ \\text{R}_2\\text{C}=\\text{O}^+-\\text{H} \\longleftrightarrow \\text{R}_2\\text{C}^+-\\text{OH} \\right]",
          explanation: "Carbocation resonance contributor endows carbon with powerful electrophilic reactivity.",
        },
        {
          label: "2. CATALYTIC BARRIER REDUCTION",
          formula: "E_{a,\\text{catalyzed}} = 28.0\\text{ kJ/mol} \\quad (\\text{vs } 78.0\\text{ kJ/mol Uncatalyzed})",
          explanation: "Activation energy drops by 50 kJ/mol (64% reduction), boosting reaction rate by over 10^8 times at 298 K.",
        },
        {
          label: "3. ARRHENIUS RATE ENHANCEMENT",
          formula: "\\dfrac{k_{\\text{cat}}}{k_{\\text{uncat}}} = \\exp\\left(\\dfrac{\\Delta E_a}{RT}\\right) \\approx \\exp(20.2) \\approx 5.8 \\times 10^8",
          explanation: "Quantitative demonstration of why acid catalysts are essential in industrial cyanohydrin production.",
        },
      ],
      steps: [
        {
          step: 1,
          title: "Engage Acid Catalyst (H⁺ Protonation)",
          math: "\\text{Toggle Acid Switch: } E_a: 78.0 \\longrightarrow 28.0\\text{ kJ/mol}, \\quad \\delta^+: +0.30 \\longrightarrow +0.85",
          explanation: "Protonating oxygen creates a powerful electrostatic funnel pulling the nucleophile in.",
        },
        {
          step: 2,
          title: "Deliver Nucleophile with Moderate Energy",
          math: "E_k \\ge 28.0\\text{ kJ/mol}, \\quad \\theta \\approx 107.0^\\circ \\pm 4.0^\\circ",
          explanation: "Cyanide ion attacks smoothly along the Bürgi-Dunitz trajectory, yielding quantitative Acetone Cyanohydrin.",
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
  rehybridizationProgress: number; // 0 (sp2 planar) to 1 (sp3 tetrahedral)
  collisionResult: CollisionResult;

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
}

export const useNucleophilicAdditionStore = create<NucleophilicAdditionState>((set, get) => ({
  currentStage: 1,
  attackAngle: NUCLEOPHILIC_STAGES[1].defaultAngle,
  kineticEnergy: NUCLEOPHILIC_STAGES[1].defaultEnergy,
  acidCatalystActive: false,

  isSimulating: false,
  projectileProgress: 0,
  rehybridizationProgress: 0,
  collisionResult: "none",

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
      rehybridizationProgress: 0,
      collisionResult: "none",
      isWon: false,
      isGameOver: false,
      failureReason: "",
      showResultModal: false,
    });
  },

  tickSimulation: (delta: number) => {
    const s = get();
    if (!s.isSimulating) return;

    const stage = NUCLEOPHILIC_STAGES[s.currentStage];
    const currentAngle = s.attackAngle;
    const currentEnergy = s.kineticEnergy;
    const isAcidActive = s.acidCatalystActive;

    // Evaluate effective activation energy and tolerance
    const effectiveEa = isAcidActive && stage.catalyzedEa ? stage.catalyzedEa : stage.baselineEa;
    const effectiveTolerance = isAcidActive && stage.catalyzedEa ? stage.angleTolerance : stage.angleTolerance;

    // Projectile speed scales with kinetic energy
    const travelSpeed = 0.95 + (currentEnergy / 60.0) * 0.75;
    const newProgress = Math.min(1.0, s.projectileProgress + delta * travelSpeed);

    if (newProgress < 1.0) {
      set({ projectileProgress: newProgress });
      return;
    }

    // Projectile has reached the reaction collision zone (newProgress = 1.0)
    // Evaluate collision mechanics:
    const angleDiff = Math.abs(currentAngle - stage.optimalAngle);

    // 1. Oxygen Lone Pair Repulsion (attack angle too steep, < 98 deg)
    if (currentAngle < 98.0) {
      set({
        projectileProgress: 1.0,
        isSimulating: false,
        collisionResult: "deflected_oxygen_repulsion",
        isGameOver: true,
        failureReason: `Electrostatic Repulsion! At θ = ${currentAngle.toFixed(1)}°, the nucleophile clashes with oxygen's electron-rich lone pairs. Increase attack angle toward 107.0°.`,
        showResultModal: true,
      });
      return;
    }

    // 2. Missed π* LUMO Lobe (attack angle too shallow, > 116 deg)
    if (currentAngle > 116.0) {
      set({
        projectileProgress: 1.0,
        isSimulating: false,
        collisionResult: "missed_lumo",
        isGameOver: true,
        failureReason: `Glancing Miss! At θ = ${currentAngle.toFixed(1)}°, the incoming trajectory completely bypasses carbon's π* antibonding orbital. Reduce angle toward 107.0°.`,
        showResultModal: true,
      });
      return;
    }

    // 3. Steric Corridor Check (must be within angle tolerance)
    if (angleDiff > effectiveTolerance) {
      set({
        projectileProgress: 1.0,
        isSimulating: false,
        collisionResult: "steric_rebound",
        isGameOver: true,
        failureReason: `Steric Collision! In ${stage.substrateName}, angle deviation (Δθ = ${angleDiff.toFixed(1)}°) clashes with substituent atoms. Target the Bürgi-Dunitz sweet spot: 107.0° ± ${effectiveTolerance.toFixed(1)}°.`,
        showResultModal: true,
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
        isSimulating: false,
        collisionResult: "insufficient_energy",
        isGameOver: true,
        failureReason: `Insufficient Activation Energy! Collision energy (${currentEnergy.toFixed(1)} kJ/mol) is lower than activation barrier Ea = ${effectiveEa.toFixed(1)} kJ/mol.${hint}`,
        showResultModal: true,
      });
      return;
    }

    // 5. SUCCESSFUL COLLISION! Run rehybridization animation (sp2 planar -> sp3 tetrahedral)
    const newRehyb = Math.min(1.0, s.rehybridizationProgress + delta * 1.8);
    set({
      projectileProgress: 1.0,
      rehybridizationProgress: newRehyb,
    });

    if (newRehyb >= 1.0) {
      set({
        isSimulating: false,
        collisionResult: "hit",
        isWon: true,
        showResultModal: true,
      });
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
      rehybridizationProgress: 0,
      collisionResult: "none",
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
      rehybridizationProgress: 0,
      collisionResult: "none",
      isWon: false,
      isGameOver: false,
      failureReason: "",
      showResultModal: false,
    });
  },
}));
