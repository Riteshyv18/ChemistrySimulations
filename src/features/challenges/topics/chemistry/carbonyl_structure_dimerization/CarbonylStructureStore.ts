import { create } from "zustand";

// ============================================================================
// Stage Configurations
// ============================================================================
export interface StageConfig {
  stage: 1 | 2 | 3;
  title: string;
  substrate: string;
  subtitle: string;
  badge: string;
  learningGoal: string;
  prompt: string;
  keyConcepts: string[];
}

export const CARBONYL_STAGES: Record<1 | 2 | 3, StageConfig> = {
  1: {
    stage: 1,
    title: "Stage 1: Carbonyl sp² Planarity & π-Orbital Frame",
    substrate: "Formaldehyde (HCHO)",
    subtitle: "Trigonal Planar Skeleton & Perpendicular π-Lobe Polarization",
    badge: "sp² Geometry & Orbitals",
    learningGoal:
      "Explore the strict planar 120° geometry of the carbonyl group, toggle σ-bonds vs perpendicular π-electron clouds, and observe partial charge separation (δ+ on C, δ- on O).",
    prompt:
      "Rotate the molecule to verify coplanarity across the three attached groups, toggle the π-orbital lobes, and measure the bond angle.",
    keyConcepts: [
      "sp² Hybridization (Trigonal Planar, ~120°)",
      "Perpendicular C(2pz) - O(2pz) π-overlap",
      "Electronegativity Difference: χ(O)=3.44 vs χ(C)=2.55",
      "Polar C=O Double Bond with Electrophilic Carbon",
    ],
  },
  2: {
    stage: 2,
    title: "Stage 2: Electric Dipole Vector & Polarity Hierarchy",
    substrate: "Propane vs Acetone vs Acetic Acid",
    subtitle: "Permanent Dipole Moment & Intermolecular Keesom Forces",
    badge: "Dipole Vectors & Boiling Points",
    learningGoal:
      "Compare permanent dipole moments (μ) between non-polar alkanes, polar carbonyls, and carboxylic acids, and observe molecular orientation under an external electric field.",
    prompt:
      "Select substrates to compare their dipole vectors (μ), increase the electric field (E) to align polar moments, and rank their boiling points.",
    keyConcepts: [
      "Permanent Dipole Vector: μ = q × d",
      "Acetone Dipole: μ = 2.88 D (strong dipole-dipole attractions)",
      "Propane Dipole: μ ≈ 0.08 D (weak London dispersion only)",
      "Boiling Point Hierarchy: RCOOH > RCOR' > RCHO > R-H",
    ],
  },
  3: {
    stage: 3,
    title: "Stage 3: Carboxylic Acid 8-Membered Cyclic Dimerization",
    substrate: "2× Acetic Acid (CH₃COOH)",
    subtitle: "Centrosymmetric Dual Hydrogen-Bond Ring & van 't Hoff Anomaly",
    badge: "Cyclic H-Bond Dimerization",
    learningGoal:
      "Align two acetic acid monomers into the centrosymmetric 8-membered cyclic dimer sweet spot (d ≈ 1.76 Å, 180° orientation), lock dual H-bonds (-60 kJ/mol), and observe dimer thermal breakdown.",
    prompt:
      "Rotate Monomer 2 to 180° (head-to-tail), translate distance to ~1.76 Å, and lock the dual O-H···O=C hydrogen bonds. Test temperature and solvent effects on the van 't Hoff factor (i).",
    keyConcepts: [
      "Pair of Complementary H-bonds: C=O···H-O & O-H···O=C",
      "8-Membered Planar Centrosymmetric Cyclic Dimer Ring",
      "Binding Enthalpy: ΔH_dimer ≈ -60 kJ/mol in non-polar media",
      "van 't Hoff Factor: i ≈ 0.5 in benzene; rises to i → 1.0 upon heating or in water",
    ],
  },
};

// ============================================================================
// Molecule Data for Stage 2
// ============================================================================
export interface MoleculePolarityData {
  id: "propane" | "acetone" | "acetic_acid";
  name: string;
  formula: string;
  molarMass: number; // g/mol
  dipoleMoment: number; // Debye (D)
  boilingPoint: number; // °C
  dominantForce: string;
  description: string;
}

export const STAGE_2_QUEUE = ["acetone", "propane", "acetic_acid"] as const;
export type Stage2OptionId = "nonpolar" | "polar_carbonyl" | "h_bonding";

export interface Stage2Option {
  id: Stage2OptionId;
  label: string;
  sublabel: string;
}

export const STAGE_2_OPTIONS: Stage2Option[] = [
  {
    id: "nonpolar",
    label: "Non-polar",
    sublabel: "London Dispersion",
  },
  {
    id: "polar_carbonyl",
    label: "Polar Dipole",
    sublabel: "Dipole-Dipole Keesom",
  },
  {
    id: "h_bonding",
    label: "H-Bonding",
    sublabel: "Carboxylic Dimer",
  },
];

export const MOLECULE_POLARITY_LIST: Record<"propane" | "acetone" | "acetic_acid", MoleculePolarityData> = {
  propane: {
    id: "propane",
    name: "Propane",
    formula: "CH₃CH₂CH₃",
    molarMass: 44.1,
    dipoleMoment: 0.08,
    boilingPoint: -42.1,
    dominantForce: "Weak London Dispersion Forces",
    description: "Symmetric non-polar hydrocarbon with virtually zero permanent dipole moment.",
  },
  acetone: {
    id: "acetone",
    name: "Acetone",
    formula: "CH₃COCH₃",
    molarMass: 58.1,
    dipoleMoment: 2.88,
    boilingPoint: 56.1,
    dominantForce: "Strong Dipole-Dipole (Keesom) Attractions",
    description: "Highly polarized carbonyl bond (C=O) produces a strong permanent dipole vector (μ = 2.88 D).",
  },
  acetic_acid: {
    id: "acetic_acid",
    name: "Acetic Acid (Monomer)",
    formula: "CH₃COOH",
    molarMass: 60.1,
    dipoleMoment: 1.74,
    boilingPoint: 118.1,
    dominantForce: "Dual Intermolecular Hydrogen Bonding (Dimer)",
    description: "Contains both hydrogen bond donor (-OH) and acceptor (C=O), capable of strong cyclic dimerization.",
  },
};

// ============================================================================
// State Definition
// ============================================================================
export interface CarbonylStructureState {
  // Navigation & Screen Progression
  screen: "mission" | "instructions" | "lab";
  stage: 1 | 2 | 3;
  showExplanationModal: boolean;
  showSuccessModal: boolean;

  // Stage 1: Planarity & Orbital Frame
  showPiOrbitals: boolean;
  showDipoleVector: boolean;
  stage1TargetAngle: number; // 120.0
  stage1MeasuredAngle: number;
  stage1AngleAligned: boolean;
  stage1CoplanarVerified: boolean;

  // Stage 2: Dipole & Field Orientation
  selectedMolecule: "propane" | "acetone" | "acetic_acid";
  electricFieldStrength: number; // 0 to 100 kV/cm
  fieldPolarizationActive: boolean;
  dipoleAlignedDegrees: number; // current alignment angle
  stage2QueueIndex: number;
  stage2SlideState: "idle" | "sliding-out" | "sliding-in";
  stage2SlideDirection: "left" | "right";
  stage2SelectedOption: Stage2OptionId | null;
  stage2Feedback: { type: "success" | "error"; message: string } | null;

  // Stage 3: Carboxylic Dimerization
  monomer2Distance: number; // 1.2 to 5.0 Angstroms
  monomer2Rotation: number; // 0 to 360 degrees
  temperature: number; // 273 to 450 Kelvin
  solvent: "benzene" | "water";
  dimerLocked: boolean;
  bindingEnergy: number; // kJ/mol (up to -60)
  vanTHoffFactor: number; // 0.50 to 1.00
  dimerAttempts: number;
  lastFailureReason: string | null;

  // Actions
  setScreen: (screen: "mission" | "instructions" | "lab") => void;
  setStage: (stage: 1 | 2 | 3) => void;
  setShowExplanationModal: (show: boolean) => void;
  setShowSuccessModal: (show: boolean) => void;

  // Stage 1 Actions
  togglePiOrbitals: () => void;
  toggleDipoleVector: () => void;
  setStage1MeasuredAngle: (angle: number) => void;
  verifyStage1Planarity: () => void;

  // Stage 2 Actions
  setSelectedMolecule: (mol: "propane" | "acetone" | "acetic_acid") => void;
  setElectricFieldStrength: (strength: number) => void;
  verifyStage2Alignment: () => void;
  toggleFieldPolarization: () => void;
  setStage2QueueIndex: (index: number) => void;
  setStage2SlideState: (state: "idle" | "sliding-out" | "sliding-in") => void;
  setStage2SlideDirection: (dir: "left" | "right") => void;
  setStage2SelectedOption: (opt: Stage2OptionId | null) => void;
  submitStage2Answer: () => void;

  // Stage 3 Actions
  setMonomer2Distance: (dist: number) => void;
  setMonomer2Rotation: (rot: number) => void;
  setTemperature: (temp: number) => void;
  setSolvent: (solv: "benzene" | "water") => void;
  attemptDimerLock: () => boolean;
  unlockDimer: () => void;
  finishStage3Experiment: () => void;
  resetCurrentStage: () => void;
}

export const useCarbonylStructureStore = create<CarbonylStructureState>((set, get) => ({
  screen: "mission",
  stage: 1,
  showExplanationModal: false,
  showSuccessModal: false,

  // Stage 1 defaults
  showPiOrbitals: true,
  showDipoleVector: true,
  stage1TargetAngle: 120.0,
  stage1MeasuredAngle: 115.0, // starts off at non-ideal angle so user must actively adjust to 120.0°
  stage1AngleAligned: false,
  stage1CoplanarVerified: false,

  // Stage 2 defaults
  selectedMolecule: "acetone",
  electricFieldStrength: 0,
  fieldPolarizationActive: false,
  dipoleAlignedDegrees: 0,
  stage2QueueIndex: 0,
  stage2SlideState: "idle",
  stage2SlideDirection: "left",
  stage2SelectedOption: null,
  stage2Feedback: null,

  // Stage 3 defaults
  monomer2Distance: 3.5, // initial separated distance (Å)
  monomer2Rotation: 45, // initial misaligned orientation (deg)
  temperature: 298, // 25°C
  solvent: "benzene",
  dimerLocked: false,
  bindingEnergy: 0,
  vanTHoffFactor: 1.0,
  dimerAttempts: 0,
  lastFailureReason: null,

  setScreen: (screen) => set({ screen }),
  setStage: (stage) => {
    set({
      stage,
      showSuccessModal: false,
      lastFailureReason: null,
    });
    get().resetCurrentStage();
  },
  setShowExplanationModal: (show) => set({ showExplanationModal: show }),
  setShowSuccessModal: (show) => set({ showSuccessModal: show }),

  // Stage 1 Actions
  togglePiOrbitals: () => set((s) => ({ showPiOrbitals: !s.showPiOrbitals })),
  toggleDipoleVector: () => set((s) => ({ showDipoleVector: !s.showDipoleVector })),
  setStage1MeasuredAngle: (angle) => {
    // Must be EXACTLY 120.0° (slider steps by 0.5)
    const isExact = Number(angle.toFixed(1)) === 120.0;
    set({
      stage1MeasuredAngle: angle,
      stage1AngleAligned: isExact,
      lastFailureReason: null,
    });
  },
  verifyStage1Planarity: () => {
    const { stage1MeasuredAngle } = get();
    const isExact = Number(stage1MeasuredAngle.toFixed(1)) === 120.0;

    if (isExact) {
      set({
        stage1CoplanarVerified: true,
        stage1AngleAligned: true,
        lastFailureReason: null,
      });
      setTimeout(() => {
        set({ showSuccessModal: true });
      }, 300);
    } else {
      set({
        stage1CoplanarVerified: false,
        stage1AngleAligned: false,
        lastFailureReason: `Incorrect angle (${stage1MeasuredAngle.toFixed(1)}°)! Formaldehyde has an sp² trigonal planar geometry which requires exactly 120.0°.`,
      });
    }
  },

  // Stage 2 Actions
  setSelectedMolecule: (mol) => {
    set({ selectedMolecule: mol, lastFailureReason: null });
    // Recalculate torque with newly selected molecule
    const currentMol = MOLECULE_POLARITY_LIST[mol];
    const strength = get().electricFieldStrength;
    const maxTorque = (currentMol.dipoleMoment / 2.88) * (strength / 100);
    const alignmentDeg = Math.min(90, maxTorque * 90);
    set({ dipoleAlignedDegrees: alignmentDeg });
  },
  setElectricFieldStrength: (strength) => {
    const currentMol = MOLECULE_POLARITY_LIST[get().selectedMolecule];
    // Torque τ = μ × E. Alignment angle depends on dipole and field
    const maxTorque = (currentMol.dipoleMoment / 2.88) * (strength / 100);
    const alignmentDeg = Math.min(90, maxTorque * 90);
    set({
      electricFieldStrength: strength,
      dipoleAlignedDegrees: alignmentDeg,
      lastFailureReason: null,
    });
  },
  setStage2QueueIndex: (index) => set({ stage2QueueIndex: index }),
  setStage2SlideState: (state) => set({ stage2SlideState: state }),
  setStage2SlideDirection: (dir) => set({ stage2SlideDirection: dir }),
  setStage2SelectedOption: (opt) => set({ stage2SelectedOption: opt, stage2Feedback: null }),
  submitStage2Answer: () => {
    const { stage2QueueIndex, stage2SelectedOption, stage2SlideState, showSuccessModal } = get();
    if (stage2SlideState !== "idle" || showSuccessModal) return;

    if (!stage2SelectedOption) {
      set({
        stage2Feedback: {
          type: "error",
          message: "Please select an intermolecular polarity classification before submitting.",
        },
      });
      return;
    }

    const currentKey = STAGE_2_QUEUE[stage2QueueIndex];
    const correctMap: Record<typeof currentKey, Stage2OptionId> = {
      acetone: "polar_carbonyl",
      propane: "nonpolar",
      acetic_acid: "h_bonding",
    };

    const isCorrect = stage2SelectedOption === correctMap[currentKey];

    if (isCorrect) {
      const isLast = stage2QueueIndex >= STAGE_2_QUEUE.length - 1;
      const successMsgs: Record<typeof currentKey, string> = {
        acetone: "✓ Correct! Polar C=O bond produces a strong permanent dipole (μ = 2.88 D) which aligns with the electric field.",
        propane: "✓ Correct! Propane is a non-polar hydrocarbon (μ ≈ 0.08 D) with weak London dispersion and zero field torque.",
        acetic_acid: "✓ Correct! Acetic acid features strong dual hydrogen bonding, yielding highest boiling point (118°C) and cyclic dimerization.",
      };

      set({
        stage2Feedback: {
          type: "success",
          message: successMsgs[currentKey],
        },
      });

      // Slide out after 700ms, then advance and slide in (matching HybridizationGamePage)
      setTimeout(() => {
        set({
          stage2SlideDirection: "left",
          stage2SlideState: "sliding-out",
        });

        setTimeout(() => {
          if (isLast) {
            set({
              stage2SlideState: "idle",
              showSuccessModal: true,
            });
          } else {
            const nextIdx = stage2QueueIndex + 1;
            const nextMol = STAGE_2_QUEUE[nextIdx];
            const nextMolData = MOLECULE_POLARITY_LIST[nextMol];
            const strength = get().electricFieldStrength;
            const maxTorque = (nextMolData.dipoleMoment / 2.88) * (strength / 100);
            const alignmentDeg = Math.min(90, maxTorque * 90);

            set({
              stage2QueueIndex: nextIdx,
              selectedMolecule: nextMol,
              dipoleAlignedDegrees: alignmentDeg,
              stage2SelectedOption: null,
              stage2Feedback: null,
              stage2SlideDirection: "right",
              stage2SlideState: "sliding-in",
            });

            // Smoothly slide in to center
            setTimeout(() => {
              set({ stage2SlideState: "idle" });
            }, 40);
          }
        }, 320);
      }, 700);
    } else {
      const errMsgs: Record<typeof currentKey, string> = {
        acetone: "Not quite. Acetone contains a strongly polarized carbonyl C=O group with a permanent dipole of 2.88 D.",
        propane: "Not quite. Propane is a non-polar hydrocarbon (μ ≈ 0.08 D) held together only by weak London dispersion forces.",
        acetic_acid: "Not quite. Acetic acid contains both a C=O acceptor and an O-H donor, giving extensive intermolecular hydrogen bonding.",
      };

      set({
        stage2Feedback: {
          type: "error",
          message: errMsgs[currentKey],
        },
      });
    }
  },
  verifyStage2Alignment: () => {
    get().submitStage2Answer();
  },
  toggleFieldPolarization: () =>
    set((s) => ({ fieldPolarizationActive: !s.fieldPolarizationActive })),

  // Stage 3 Actions
  setMonomer2Distance: (dist) => {
    set({ monomer2Distance: dist });
    if (get().dimerLocked) {
      // Re-evaluate lock if moved out of sweet spot
      if (Math.abs(dist - 1.76) > 0.4) {
        get().unlockDimer();
      }
    }
  },
  setMonomer2Rotation: (rot) => {
    set({ monomer2Rotation: rot });
    if (get().dimerLocked) {
      if (Math.abs(rot - 180) > 15) {
        get().unlockDimer();
      }
    }
  },
  setTemperature: (temp) => {
    set({ temperature: temp });
    // Thermal breakdown: Dimer dissociates at higher temperatures
    // ΔG = ΔH - TΔS. At T > 393 K (120°C), dimer dissociates!
    if (get().dimerLocked) {
      if (temp > 393 || get().solvent === "water") {
        const factor = Math.min(1.0, 0.5 + ((temp - 298) / (450 - 298)) * 0.5);
        const energy = -60 * (1 - (factor - 0.5) * 2);
        set({
          vanTHoffFactor: Number(factor.toFixed(2)),
          bindingEnergy: Number(energy.toFixed(1)),
        });
      } else {
        set({ vanTHoffFactor: 0.5, bindingEnergy: -60.0 });
      }
    }
  },
  setSolvent: (solv) => {
    set({ solvent: solv });
    if (solv === "water") {
      // Water is polar protic and breaks the cyclic dimer via competing solvation
      set({
        vanTHoffFactor: 1.0,
        bindingEnergy: -12.0,
      });
    } else if (get().dimerLocked) {
      const temp = get().temperature;
      const factor = temp > 393 ? Math.min(1.0, 0.5 + ((temp - 298) / (450 - 298)) * 0.5) : 0.5;
      set({
        vanTHoffFactor: Number(factor.toFixed(2)),
        bindingEnergy: temp > 393 ? -35.0 : -60.0,
      });
    }
  },

  attemptDimerLock: () => {
    const { monomer2Distance, monomer2Rotation, solvent, temperature } = get();
    set((s) => ({ dimerAttempts: s.dimerAttempts + 1 }));

    // Check distance sweet spot: 1.76 Å ± 0.35 Å
    const distDiff = Math.abs(monomer2Distance - 1.76);
    if (distDiff > 0.35) {
      set({
        lastFailureReason:
          distDiff > 0.8
            ? "Monomers too far apart (d > 2.5 Å). Hydrogen bonds require d(O···H) ≈ 1.76 Å."
            : "H-bond distance sub-optimal. Adjust distance closer to 1.76 Å for electrostatic resonance.",
      });
      return false;
    }

    // Check relative orientation sweet spot: 180° ± 15° (Centrosymmetric head-to-tail alignment)
    const rotDiff = Math.abs(monomer2Rotation - 180);
    if (rotDiff > 15) {
      set({
        lastFailureReason:
          "Orientation misaligned. Dual complementary H-bonds require a centrosymmetric 180° head-to-tail arrangement.",
      });
      return false;
    }

    // Check solvent interference
    if (solvent === "water") {
      set({
        lastFailureReason:
          "Solvent interference! Polar protic water molecules form strong competing H-bonds with carboxylic groups, preventing cyclic dimerization.",
      });
      return false;
    }

    // Success: Lock 8-membered cyclic dimer!
    const effectiveFactor = temperature > 393 ? 0.75 : 0.5;
    const effectiveEnergy = temperature > 393 ? -36.0 : -60.0;

    set({
      dimerLocked: true,
      bindingEnergy: effectiveEnergy,
      vanTHoffFactor: effectiveFactor,
      lastFailureReason: null,
    });

    return true;
  },

  unlockDimer: () => {
    set({
      dimerLocked: false,
      bindingEnergy: 0,
      vanTHoffFactor: 1.0,
    });
  },

  finishStage3Experiment: () => {
    set({
      showSuccessModal: true,
      lastFailureReason: null,
    });
  },

  resetCurrentStage: () => {
    const { stage } = get();
    if (stage === 1) {
      set({
        showPiOrbitals: true,
        showDipoleVector: true,
        stage1MeasuredAngle: 115.0,
        stage1AngleAligned: false,
        stage1CoplanarVerified: false,
        lastFailureReason: null,
      });
    } else if (stage === 2) {
      set({
        stage2QueueIndex: 0,
        selectedMolecule: "acetone",
        electricFieldStrength: 0,
        fieldPolarizationActive: false,
        dipoleAlignedDegrees: 0,
        stage2SlideState: "idle",
        stage2SlideDirection: "left",
        stage2SelectedOption: null,
        stage2Feedback: null,
        lastFailureReason: null,
      });
    } else {
      set({
        monomer2Distance: 3.5,
        monomer2Rotation: 45,
        temperature: 298,
        solvent: "benzene",
        dimerLocked: false,
        bindingEnergy: 0,
        vanTHoffFactor: 1.0,
        lastFailureReason: null,
      });
    }
  },
}));
