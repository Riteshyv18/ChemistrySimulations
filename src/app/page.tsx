import React from "react";
import Link from "next/link";
import {
  Atom,
  FlaskConical,
  Sparkles,
  Play,
  Layers,
  ChevronRight,
  ShieldCheck,
  Flame,
  Binary,
  Compass,
} from "lucide-react";

interface ChallengeCardInfo {
  id: string;
  module: string;
  topicSlug: string;
  topicNumber: number;
  title: string;
  concept: string;
  description: string;
  badgeColor: string;
  levels: {
    difficulty: "easy" | "medium" | "hard";
    label: string;
    sublabel: string;
    color: string;
  }[];
}

const CHEMISTRY_CHALLENGES: ChallengeCardInfo[] = [
  {
    id: "vsepr",
    module: "chemical-bonding-molecular-structure",
    topicSlug: "vsepr-molecular-shapes",
    topicNumber: 1,
    title: "VSEPR Theory & Molecular Shapes",
    concept: "Electron Domain Repulsion & Lone Pair Geometry Distortion",
    description:
      "Rotate, measure, and assemble real 3D molecules. Experience how unshared valence electron pairs compress bond angles across linear, trigonal planar, tetrahedral, and expanded octets.",
    badgeColor: "from-cyan-500 to-blue-600",
    levels: [
      {
        difficulty: "easy",
        label: "Easy — Shape Identifier",
        sublabel: "CH₄ (109.5°), NH₃ (107°), H₂O (104.5°), BF₃ (120°)",
        color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
      },
      {
        difficulty: "medium",
        label: "Medium — Lone Pair Balancer",
        sublabel: "5-Coordinate TBP: Seesaw, T-Shaped, Linear Equatorial Placement",
        color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20",
      },
      {
        difficulty: "hard",
        label: "Hard — Steric Number Mastery",
        sublabel: "XeF₄, ClF₃, SF₄, I₃⁻: Non-ideal repulsion & complex geometry",
        color: "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20",
      },
    ],
  },
  {
    id: "hybridization",
    module: "chemical-bonding-molecular-structure",
    topicSlug: "hybridization-orbital-overlap",
    topicNumber: 2,
    title: "Hybridization & Orbital Overlap",
    concept: "Atomic Orbital Mixing, LCAO & Directional Covalent Bonding",
    description:
      "Step inside the atomic cloud to mix s, p, and d orbitals into directional hybrid lobes. Visualize coaxial sigma (σ) and lateral pi (π) bonds in real-time 3D.",
    badgeColor: "from-purple-500 to-pink-600",
    levels: [
      {
        difficulty: "easy",
        label: "Easy — Basic Hybridization",
        sublabel: "sp (180°), sp² (120°), sp³ (109.5°) 3D Orbital Lobes",
        color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
      },
      {
        difficulty: "medium",
        label: "Medium — Orbital Workshop",
        sublabel: "Step-by-step interactive mixing of s, px, py, and pz orbitals",
        color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20",
      },
      {
        difficulty: "hard",
        label: "Hard — Match Puzzle Challenge",
        sublabel: "Match molecules to steric numbers, hybrid orbitals & bond angles",
        color: "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20",
      },
    ],
  },
  {
    id: "mot",
    module: "chemical-bonding-molecular-structure",
    topicSlug: "molecular-orbital-theory",
    topicNumber: 3,
    title: "Molecular Orbital Theory (MOT)",
    concept: "Linear Combination of Atomic Orbitals & Electronic Hierarchy",
    description:
      "Construct molecular orbital energy level diagrams for homonuclear and heteronuclear diatomics. Determine bond order, bond length stability, and magnetic characteristics.",
    badgeColor: "from-amber-500 to-orange-600",
    levels: [
      {
        difficulty: "easy",
        label: "Easy — MOT Orbital Builder",
        sublabel: "1s & 2s In-Phase (Bonding σ) vs Out-of-Phase (Antibonding σ*)",
        color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
      },
      {
        difficulty: "medium",
        label: "Medium — Diatomic Filling & Energy",
        sublabel: "B₂, C₂, N₂, O₂, F₂ Electron Filling following Aufbau & Hund's Rules",
        color: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20",
      },
      {
        difficulty: "hard",
        label: "Hard — MOT Mastery",
        sublabel: "Calculate Bond Order, predict bond length and deduce Paramagnetism",
        color: "border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20",
      },
    ],
  },
];

export default function ChemistryHomePage() {
  return (
    <div className="min-h-screen bg-[#040712] text-slate-100 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#070c1a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)]">
              <Atom className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Chemistry Simulations</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              </h1>
              <p className="text-xs text-slate-400">Interactive 3D STEM Challenges</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-6 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>3 Core Topics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>9 Interactive 3D Simulations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>Real-Time WebGL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] mb-5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Interactive 3D Chemistry Workbench</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Master Chemistry Through{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">
              3D Spatial Simulation
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Select any topic below and choose between Easy, Medium, or Hard interactive challenges.
            Manipulate electron clouds, test bond angles, and construct molecular orbitals in real time.
          </p>
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {CHEMISTRY_CHALLENGES.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300 group shadow-xl"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
                    Topic 0{item.topicNumber}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                    <FlaskConical className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs font-semibold text-cyan-400/90 mb-3">
                  {item.concept}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              {/* Challenge Difficulties (3 Interactive Levels) */}
              <div className="space-y-2.5 pt-4 border-t border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Select Challenge Level:</span>
                </div>

                {item.levels.map((lvl) => {
                  const challengeUrl = `/challenge/${item.module}/${item.topicSlug}/${lvl.difficulty}`;
                  return (
                    <Link
                      key={lvl.difficulty}
                      href={challengeUrl}
                      className={`block p-3 rounded-xl border transition-all duration-200 group/lvl ${lvl.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs flex items-center gap-2">
                          <Play className="w-3 h-3 fill-current opacity-80 group-hover/lvl:opacity-100" />
                          <span>{lvl.label}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover/lvl:opacity-100 group-hover/lvl:translate-x-1 transition-transform" />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pl-5">
                        {lvl.sublabel}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#070c1a]/50 py-6 px-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Chemistry 3D Simulation Challenges — Pure Interactive WebGL Engine</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>VSEPR Theory</span>
            <span>•</span>
            <span>Hybridization</span>
            <span>•</span>
            <span>Molecular Orbital Theory</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
