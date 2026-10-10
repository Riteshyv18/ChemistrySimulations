import React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Sparkles, Layers, ShieldCheck, Flame } from "lucide-react";

interface PageProps {
  params: Promise<{
    module: string;
    topic: string;
  }>;
}

const TOPIC_DETAILS: Record<
  string,
  {
    title: string;
    description: string;
    easyTitle: string;
    easyDesc: string;
    medTitle: string;
    medDesc: string;
    hardTitle: string;
    hardDesc: string;
  }
> = {
  "vsepr-molecular-shapes": {
    title: "VSEPR Theory & Molecular Shapes",
    description: "Explore electron domain repulsion, lone pair distortion, and 3D molecular geometry.",
    easyTitle: "Level 1: Shape Identifier & Bond Angles",
    easyDesc: "Rotate 3D models of CH₄, NH₃, H₂O, and BF₃ to match each molecule to its correct geometry and bond angle.",
    medTitle: "Level 2: Lone Pair Balancer",
    medDesc: "Place lone pairs and bonded atoms onto a 5-coordinate central atom to find the lowest energy Seesaw or T-shaped configuration.",
    hardTitle: "Level 3: Steric Number Mastery",
    hardDesc: "Predict the molecular geometries and bond angles of complex noble gas halides and interhalogen ions (XeF₄, ClF₃, I₃⁻, SF₄).",
  },
  "hybridization-orbital-overlap": {
    title: "Hybridization & Orbital Overlap",
    description: "Understand atomic orbital mixing (sp, sp², sp³, sp³d, sp³d²) and directional bonding.",
    easyTitle: "Level 1: Basic Hybridization",
    easyDesc: "Interactive 3D orbital lobes exploration, orientation, and angle verification.",
    medTitle: "Level 2: Orbital Workshop",
    medDesc: "Mix atomic s and p orbitals step-by-step to construct hybrid lobes in 3D.",
    hardTitle: "Level 3: Hybridization Match Puzzle",
    hardDesc: "Match 3D molecules to their steric number, hybrid orbitals, and bonding characteristics.",
  },
  "molecular-orbital-theory": {
    title: "Molecular Orbital Theory (MOT)",
    description: "Linear combination of atomic orbitals (LCAO), bonding vs antibonding orbitals, and electronic configurations.",
    easyTitle: "Level 1: MOT Orbital Builder",
    easyDesc: "Combine 1s and 2s atomic orbitals in-phase (bonding σ) and out-of-phase (antibonding σ*).",
    medTitle: "Level 2: Diatomic Filling & Energy Diagram",
    medDesc: "Fill electrons into molecular orbitals (B₂, C₂, N₂, O₂, F₂) following Aufbau, Pauli, and Hund's rules.",
    hardTitle: "Level 3: MOT Mastery",
    hardDesc: "Calculate bond orders, predict bond lengths, and deduce magnetic properties (paramagnetic vs diamagnetic).",
  },
};

export default async function TopicOverviewPage({ params }: PageProps) {
  const { module, topic } = await params;
  const normTopic = topic.toLowerCase().replace(/_/g, "-");
  const details = TOPIC_DETAILS[normTopic] || {
    title: topic.replace(/-/g, " ").toUpperCase(),
    description: "Interactive 3D Chemistry Challenge Simulation",
    easyTitle: "Level 1: Foundation (Easy)",
    easyDesc: "Core concepts and basic interactive 3D mechanics.",
    medTitle: "Level 2: Intermediate (Medium)",
    medDesc: "Advanced application and multi-step orbital interactions.",
    hardTitle: "Level 3: Mastery (Hard)",
    hardDesc: "Complex problem solving and exam-level challenge scenarios.",
  };

  const getChallengeUrl = (difficulty: string) =>
    `/${module}/${topic}/challenge/${difficulty}`;

  return (
    <main className="min-h-screen bg-[#040712] text-slate-100 p-6 md:p-12 max-w-5xl mx-auto flex flex-col justify-center">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Chemistry Simulations</span>
      </Link>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full text-xs font-semibold text-cyan-300 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D Simulation Challenge</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {details.title}
        </h1>
        <p className="text-slate-400 text-base max-w-2xl">
          {details.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Easy */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/20 flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                Easy
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{details.easyTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.easyDesc}</p>
          </div>
          <Link
            href={getChallengeUrl("easy")}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Easy Challenge</span>
          </Link>
        </div>

        {/* Medium */}
        <div className="glass-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between hover:border-cyan-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-extrabold uppercase tracking-wider">
                Medium
              </span>
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{details.medTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.medDesc}</p>
          </div>
          <Link
            href={getChallengeUrl("medium")}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Medium Challenge</span>
          </Link>
        </div>

        {/* Hard */}
        <div className="glass-card rounded-2xl p-6 border border-purple-500/20 flex flex-col justify-between hover:border-purple-500/50 transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-extrabold uppercase tracking-wider">
                Hard / Advanced
              </span>
              <Flame className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{details.hardTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.hardDesc}</p>
          </div>
          <Link
            href={getChallengeUrl("hard")}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Hard Challenge</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
