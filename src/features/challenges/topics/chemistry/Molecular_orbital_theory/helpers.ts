export interface MOTStep {
  id: number;
  title: string;
  badge: string;
  instruction: string;
  detailsTitle: string;
  detailsText: string;
}

export const MOT_EASY_STEPS: MOTStep[] = [
  {
    id: 1,
    title: "Two 1s Atomic Orbitals",
    badge: "1s + 1s",
    instruction: "Bring the two atomic orbitals together.",
    detailsTitle: "Isolated Atomic Orbitals",
    detailsText: "Before bonding, electrons occupy individual 1s atomic orbitals around separate nuclei (Atom A and Atom B)."
  },
  {
    id: 2,
    title: "Combining Atomic Orbitals",
    badge: "2 AO → 2 MO",
    instruction: "Notice that 2 atomic orbitals combine to form 2 molecular orbitals.",
    detailsTitle: "Conservation of Orbitals",
    detailsText: "When two atomic orbitals combine, they MUST produce two molecular orbitals: one Bonding MO and one Antibonding MO."
  },
  {
    id: 3,
    title: "Same-Phase Combination",
    badge: "(+) + (+)",
    instruction: "Observe constructive wave interference between the same phase orbitals.",
    detailsTitle: "Bonding Molecular Orbital (σ₁ₛ)",
    detailsText: "Same-phase constructive combination concentrates electron density BETWEEN the two nuclei, lowering system energy and forming a stabilizing bond."
  },
  {
    id: 4,
    title: "Opposite-Phase Combination",
    badge: "(+) + (-)",
    instruction: "Observe destructive wave interference between opposite phase orbitals.",
    detailsTitle: "Antibonding Molecular Orbital (σ*₁ₛ)",
    detailsText: "Opposite-phase destructive combination creates a region between nuclei where electron probability drops to ZERO (a Node), raising system energy."
  }
];

export const MOT_MEDIUM_STEPS: MOTStep[] = [
  {
    id: 1,
    title: "Choose the Molecule",
    badge: "B₂ Molecule",
    instruction: "Inspect the total 10 electrons of B₂ (Boron molecule).",
    detailsTitle: "Boron Molecule (B₂)",
    detailsText: "Each Boron atom contributes 5 electrons (1s² 2s² 2p¹), bringing the total to 10 electrons in B₂."
  },
  {
    id: 2,
    title: "Understand Electron Count",
    badge: "Core vs Valence",
    instruction: "Distinguish between the 4 core (1s) and 6 valence (2s, 2p) electrons.",
    detailsTitle: "Electron Distribution",
    detailsText: "B₂ has 4 core electrons (σ1s² σ*1s²) and 6 valence electrons (σ2s² σ*2s² π2pₓ¹ π2pᵧ¹)."
  },
  {
    id: 3,
    title: "Empty MO Energy Diagram",
    badge: "Energy Levels",
    instruction: "Observe the molecular orbital hierarchy from lower to higher energy.",
    detailsTitle: "MO Energy Hierarchy",
    detailsText: "Orbitals fill in order: σ1s < σ*1s < σ2s < σ*2s < π2pₓ = π2pᵧ < σ2p < π*2pₓ = π*2pᵧ < σ*2p."
  },
  {
    id: 4,
    title: "Fill Molecular Orbitals",
    badge: "Drag & Drop",
    instruction: "Drag the 10 electron tokens into the correct molecular orbitals.",
    detailsTitle: "Electron Filling Practice",
    detailsText: "Place 10 total electrons into the MO energy diagram following fundamental principles."
  },
  {
    id: 5,
    title: "Aufbau Principle",
    badge: "Aufbau Rule",
    instruction: "Fill lower-energy molecular orbitals before moving to higher-energy orbitals.",
    detailsTitle: "Aufbau Rule in Action",
    detailsText: "Lower energy orbitals must be completely filled before electrons can enter higher energy orbitals."
  },
  {
    id: 6,
    title: "Pauli Exclusion Principle",
    badge: "Pauli Rule",
    instruction: "Ensure electrons in the same orbital have opposite spins (↑↓).",
    detailsTitle: "Pauli Exclusion Rule",
    detailsText: "An orbital holds a maximum of 2 electrons with opposite spins (↑↓)."
  },
  {
    id: 7,
    title: "Hund's Rule",
    badge: "Hund's Rule",
    instruction: "Fill degenerate π2pₓ and π2pᵧ orbitals one by one before pairing.",
    detailsTitle: "Degenerate Orbital Filling",
    detailsText: "Equal-energy orbitals (π2pₓ & π2pᵧ) each receive one electron with parallel spins before any pairing occurs."
  },
  {
    id: 8,
    title: "Complete MO Configuration",
    badge: "Configuration Complete",
    instruction: "Review the full electronic configuration of B₂ (σ1s² σ*1s² σ2s² σ*2s² π2pₓ¹ π2pᵧ¹).",
    detailsTitle: "Final B₂ Configuration",
    detailsText: "Congratulations! You have successfully mastered Aufbau, Pauli, and Hund's rules for B₂."
  }
];

export interface KeyConceptItem {
  title: string;
  description: string;
  symbol?: string;
  tag: string;
}

export const KEY_CONCEPTS_DATA: KeyConceptItem[] = [
  {
    title: "Atomic Orbital (AO)",
    description: "A 3D probability region around an isolated atomic nucleus where an electron is likely to be found (e.g., 1s, 2p).",
    tag: "Foundation"
  },
  {
    title: "Molecular Orbital (MO)",
    description: "A wave function delocalized over the entire molecule formed by the linear combination of atomic orbitals (LCAO).",
    tag: "Foundation"
  },
  {
    title: "Bonding Molecular Orbital",
    symbol: "σ₁ₛ",
    description: "Formed by same-phase (+ / +) constructive interference. Has high electron density between nuclei, lower energy, and stabilizes the molecule.",
    tag: "Stabilizing"
  },
  {
    title: "Antibonding Molecular Orbital",
    symbol: "σ*₁ₛ",
    description: "Formed by opposite-phase (+ / -) destructive interference. Features a node between nuclei, higher energy, and destabilizes the molecule.",
    tag: "Destabilizing"
  },
  {
    title: "Node",
    symbol: "|Ψ|² = 0",
    description: "A plane or region between nuclei where the probability of finding an electron is zero.",
    tag: "Nodal Plane"
  },
  {
    title: "Energy Hierarchy",
    description: "Bonding MO < Atomic Orbitals < Antibonding MO. Bonding MOs release energy, whereas antibonding MOs require energy.",
    tag: "Energy"
  }
];

export interface MatchingCard {
  id: string;
  term: string;
  definition: string;
}

export const INITIAL_MATCH_CARDS: MatchingCard[] = [
  {
    id: "m1",
    term: "Same-Phase Combination",
    definition: "Forms Bonding MO with high electron density between nuclei"
  },
  {
    id: "m2",
    term: "Opposite-Phase Combination",
    definition: "Forms Antibonding MO with a central node between nuclei"
  },
  {
    id: "m3",
    term: "Node",
    definition: "A region where electron finding probability is exactly ZERO"
  },
  {
    id: "m4",
    term: "Bonding MO Energy",
    definition: "Lower energy than the parent atomic orbitals (Stabilizing)"
  },
  {
    id: "m5",
    term: "Antibonding MO Energy",
    definition: "Higher energy than the parent atomic orbitals (Destabilizing)"
  }
];

export const MOT_HARD_STEPS: MOTStep[] = [
  {
    id: 1,
    title: "O₂ MO Configuration & Bond Order",
    badge: "Step 1/2",
    instruction: "Observe the molecular orbital diagram for O₂ (16 electrons). Then calculate the bond order for O₂, O₂⁺ and O₂⁻.",
    detailsTitle: "O₂ MO Configuration",
    detailsText: "Calculate bond order using formula: Bond Order = 1/2 (Bonding electrons - Antibonding electrons)."
  },
  {
    id: 2,
    title: "Drag and Drop to Arrange",
    badge: "Step 2/2",
    instruction: "Arrange the molecules in the correct order for each property.",
    detailsTitle: "Ordering Properties",
    detailsText: "Arrange O₂, O₂⁺ and O₂⁻ from lowest to highest bond order, longest to shortest bond length, and weakest to strongest bond strength."
  }
];
