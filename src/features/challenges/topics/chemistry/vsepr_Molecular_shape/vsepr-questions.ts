export type Level1Question = {
  id: string;
  molecule: string;
  formula: string;
  targetAngle: number;
  explanation: string;
  targetShape?: string;
};

export type Level2Question = {
  id: string;
  molecule: string;
  formula: string;
  targetShape: string;
  targetLonePairs: number;
  targetAngle: number;
  explanation: string;
};

export type Level3Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export const vseprLevel1: Level1Question[] = [
  {
    id: "l1-q1",
    molecule: "Methane",
    formula: "CH₄",
    targetAngle: 109.5,
    targetShape: "Tetrahedral",
    explanation: "CH₄ has 4 bonding pairs and 0 lone pairs. They repel equally, forming a Tetrahedral shape with 109.5° bond angles."
  },
  {
    id: "l1-q2",
    molecule: "Ammonia",
    formula: "NH₃",
    targetAngle: 107,
    targetShape: "Trigonal Pyramidal",
    explanation: "NH₃ has 3 bonding pairs and 1 lone pair. The lone pair repels more strongly, compressing the angle to 107°."
  },
  {
    id: "l1-q3",
    molecule: "Water",
    formula: "H₂O",
    targetAngle: 104.5,
    targetShape: "Bent",
    explanation: "H₂O has 2 bonding pairs and 2 lone pairs. The two lone pairs cause even more repulsion, squeezing the angle down to 104.5°."
  },
  {
    id: "l1-q4",
    molecule: "Boron Trifluoride",
    formula: "BF₃",
    targetAngle: 120,
    targetShape: "Trigonal Planar",
    explanation: "BF₃ has 3 bonding groups and 0 lone pairs around the central Boron, forming a flat Trigonal Planar shape with 120° angles."
  },
  {
    id: "l1-q5",
    molecule: "Carbon Dioxide",
    formula: "CO₂",
    targetAngle: 180,
    targetShape: "Linear",
    explanation: "CO₂ has 2 double bonds acting as 2 electron groups and 0 lone pairs, maximizing their distance in a Linear shape at 180°."
  }
];

export const vseprLevel2: Level2Question[] = [
  {
    id: "l2-q1",
    molecule: "Water",
    formula: "H₂O",
    targetShape: "Bent",
    targetLonePairs: 2,
    targetAngle: 104.5,
    explanation: "Oxygen has 6 valence electrons, 2 are shared with H, leaving 4 (2 lone pairs). 2 bonds + 2 lone pairs = Bent shape."
  },
  {
    id: "l2-q2",
    molecule: "Methane",
    formula: "CH₄",
    targetShape: "Tetrahedral",
    targetLonePairs: 0,
    targetAngle: 109.5,
    explanation: "Carbon shares all 4 of its valence electrons with Hydrogen. 4 bonds + 0 lone pairs = Tetrahedral shape."
  },
  {
    id: "l2-q3",
    molecule: "Ammonia",
    formula: "NH₃",
    targetShape: "Trigonal Pyramidal",
    targetLonePairs: 1,
    targetAngle: 107,
    explanation: "Nitrogen has 5 valence electrons, 3 are shared with H, leaving 2 (1 lone pair). 3 bonds + 1 lone pair = Trigonal Pyramidal."
  },
  {
    id: "l2-q4",
    molecule: "Boron Trifluoride",
    formula: "BF₃",
    targetShape: "Trigonal Planar",
    targetLonePairs: 0,
    targetAngle: 120,
    explanation: "Boron has 3 valence electrons and shares them all. 3 bonds + 0 lone pairs = Trigonal Planar."
  },
  {
    id: "l2-q5",
    molecule: "Carbon Dioxide",
    formula: "CO₂",
    targetShape: "Linear",
    targetLonePairs: 0,
    targetAngle: 180,
    explanation: "Carbon forms two double bonds (2 electron domains) and has 0 lone pairs, resulting in a Linear shape."
  }
];

export const vseprLevel3: Level3Question[] = [
  {
    id: "l3-q1",
    question: "Why does H₂O (104.5°) have a smaller bond angle than NH₃ (107°)?",
    options: [
      "H₂O has larger atoms than NH₃.",
      "H₂O has two lone pairs which repel more strongly than the single lone pair in NH₃.",
      "Oxygen is more electronegative than Nitrogen.",
      "H₂O is a smaller molecule."
    ],
    correctIndex: 1,
    explanation: "Lone pairs occupy more space around the central atom. H₂O has two lone pairs, which squeeze the bonding pairs closer together than the single lone pair in NH₃."
  },
  {
    id: "l3-q2",
    question: "Which of the following molecules has a perfect tetrahedral geometry?",
    options: [
      "NH₃",
      "H₂O",
      "CH₄",
      "BF₃"
    ],
    correctIndex: 2,
    explanation: "CH₄ has 4 identical bonding groups and 0 lone pairs, making it perfectly symmetrical."
  },
  {
    id: "l3-q3",
    question: "If a central atom has 3 bonding pairs and 1 lone pair, what is its electron domain geometry vs its molecular shape?",
    options: [
      "Tetrahedral / Trigonal Pyramidal",
      "Trigonal Planar / Bent",
      "Tetrahedral / Bent",
      "Trigonal Bipyramidal / Seesaw"
    ],
    correctIndex: 0,
    explanation: "4 total domains = Tetrahedral electron geometry. The 1 lone pair makes the visible molecular shape Trigonal Pyramidal."
  },
  {
    id: "l3-q4",
    question: "Compare the C-H bond angle in CH₄ to the H-N-H angle in NH₃. What causes the difference?",
    options: [
      "Carbon is larger than Nitrogen.",
      "The lone pair on Nitrogen repels the bonding pairs, decreasing the angle.",
      "Hydrogen bonds differently to Carbon.",
      "NH₃ forms double bonds."
    ],
    correctIndex: 1,
    explanation: "The lone pair on Nitrogen pushes the N-H bonds closer together, making the angle 107° instead of the perfect 109.5° seen in CH₄."
  },
  {
    id: "l3-q5",
    question: "BF₃ and NH₃ both have 3 atoms attached to the central atom. Why is BF₃ flat (planar) while NH₃ is pyramidal?",
    options: [
      "Boron has a lone pair, Nitrogen does not.",
      "Nitrogen has a lone pair that repels the bonds downward, Boron has no lone pairs.",
      "Fluorine is heavier than Hydrogen.",
      "BF₃ has double bonds."
    ],
    correctIndex: 1,
    explanation: "BF₃ has 3 bonding pairs and 0 lone pairs (Trigonal Planar). NH₃ has 3 bonding pairs and 1 lone pair, pushing the bonds out of the plane (Trigonal Pyramidal)."
  }
];

export const shapeOptions = [
  "Linear",
  "Bent",
  "Trigonal Planar",
  "Trigonal Pyramidal",
  "Tetrahedral"
];
