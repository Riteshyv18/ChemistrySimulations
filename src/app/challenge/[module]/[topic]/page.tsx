import React from "react";
import Link from "next/link";
import { Gamepad2, Play, Target, ShieldCheck, Flame, Layers, Sparkles, Star, ClipboardList } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { StatStrip } from "@/components/ui/StatStrip";
import { findTopic } from "@/lib/content";

interface PageProps {
  params: Promise<{
    module: string;
    topic: string;
  }>;
}

const TOPIC_CHALLENGE_DESCRIPTIONS: Record<
  string,
  {
    easy: { title: string; subtitle: string; desc: string };
    medium: { title: string; subtitle: string; desc: string };
    hard: { title: string; subtitle: string; desc: string };
  }
> = {
  "vsepr-molecular-shapes": {
    easy: {
      title: "Shape Identifier & Bond Angles",
      subtitle: "CH₄ (109.5°), NH₃ (107°), H₂O (104.5°), BF₃ (120°)",
      desc: "Rotate 3D models and enter precise bond angles to understand electron domain repulsion.",
    },
    medium: {
      title: "Lone Pair Balancer",
      subtitle: "5-Coordinate TBP: Seesaw, T-Shaped & Linear",
      desc: "Distribute lone pairs across equatorial vs axial positions to minimize 90° repulsion.",
    },
    hard: {
      title: "Steric Number Mastery",
      subtitle: "XeF₄, ClF₃, SF₄, I₃⁻ & Interhalogens",
      desc: "Predict 3D geometries and lone pair deviations in advanced noble gas compounds.",
    },
  },
  "hybridization-orbital-overlap": {
    easy: {
      title: "Basic Hybridization",
      subtitle: "sp (180°), sp² (120°), sp³ (109.5°)",
      desc: "Explore directional 3D hybrid orbital lobes and spatial orientations.",
    },
    medium: {
      title: "Orbital Workshop",
      subtitle: "Interactive 3D Orbital Mixer",
      desc: "Combine spherical s and directional p orbitals step-by-step to synthesize hybrid orbitals.",
    },
    hard: {
      title: "Hybridization Match Puzzle",
      subtitle: "Molecules & Overlap Matching",
      desc: "Solve 3D match puzzles linking molecular geometry, hybridization, and steric numbers.",
    },
  },
  "molecular-orbital-theory": {
    easy: {
      title: "MOT Orbital Builder",
      subtitle: "1s & 2s In-Phase vs Out-of-Phase",
      desc: "Synthesize bonding σ and antibonding σ* molecular orbital clouds in 3D.",
    },
    medium: {
      title: "Diatomic Filling & Energy Diagram",
      subtitle: "B₂, C₂, N₂, O₂, F₂ Electron Filling",
      desc: "Fill molecular orbitals in order of increasing energy according to Hund's and Aufbau rules.",
    },
    hard: {
      title: "MOT Mastery",
      subtitle: "Bond Order, Bond Length & Magnetism",
      desc: "Calculate bond orders and deduce paramagnetism vs diamagnetism from MO configurations.",
    },
  },
};

export default async function TopicPage({ params }: PageProps) {
  const { module: moduleParam, topic: topicParam } = await params;
  const result = findTopic(moduleParam, topicParam);

  if (!result) {
    return (
      <PageShell accent="emerald">
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Topic not found</h2>
          <Link href="/" className="sim-btn-primary mt-4">
            Return to Modules
          </Link>
        </div>
      </PageShell>
    );
  }

  const { module: mod, topic } = result;
  const base = `/challenge/${mod.slug}/${topic.slug}`;

  const details = TOPIC_CHALLENGE_DESCRIPTIONS[topic.slug] || {
    easy: {
      title: "Easy Challenge",
      subtitle: "Foundational 3D Simulation",
      desc: "Core concepts and basic interactive 3D mechanics.",
    },
    medium: {
      title: "Medium Challenge",
      subtitle: "Intermediate 3D Interaction",
      desc: "Multi-step orbital placement and angle manipulation.",
    },
    hard: {
      title: "Hard Challenge",
      subtitle: "Advanced Mastery Simulation",
      desc: "Complex scenarios and exam-level challenge problems.",
    },
  };

  return (
    <PageShell accent="emerald">
      <Breadcrumbs
        items={[
          { label: "Modules", href: "/" },
          { label: mod.moduleName, href: `/challenge/${mod.slug}` },
          { label: topic.topicName },
        ]}
      />

      <PageHeader
        accent="emerald"
        badge={`Topic 0${topic.topicId}`}
        badgeIcon={Sparkles}
        title={topic.topicName}
        description={topic.coreConcept}
        actions={
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400">Topic mastery: </span>
            <span className="text-white font-bold">100%</span>
          </div>
        }
      />

      {/* Main 3D Challenge Card (Topcoaching Aesthetic) */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(0,240,255,0.18)] mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-300 shadow-[0_0_25px_rgba(0,240,255,0.4)]">
          <Gamepad2 className="w-9 h-9 sm:w-12 sm:h-12" strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2">
          3D Simulation Challenge
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mb-6">
          Apply your knowledge in an interactive real-time 3D simulation. Select a difficulty level below to begin.
        </p>

        {/* Quick Launch Pills (Exact Topcoaching Styling) */}
        <div className="flex items-center gap-3 justify-center flex-wrap mb-4">
          <Link
            href={`${base}/easy`}
            className="px-5 py-2.5 rounded-full border border-emerald-500 text-emerald-400 text-xs sm:text-sm font-bold bg-emerald-500/10 hover:bg-emerald-500/25 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105"
          >
            Launch Easy
          </Link>
          <Link
            href={`${base}/medium`}
            className="px-5 py-2.5 rounded-full border border-orange-500/50 text-orange-400/90 text-xs sm:text-sm font-bold bg-orange-500/10 hover:bg-orange-500/25 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:scale-105"
          >
            Launch Medium
          </Link>
          <Link
            href={`${base}/hard`}
            className="px-5 py-2.5 rounded-full border border-red-500/50 text-red-400/90 text-xs sm:text-sm font-bold bg-red-500/10 hover:bg-red-500/25 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105"
          >
            Launch Hard
          </Link>
        </div>
      </div>

      {/* 3 Difficulty Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-10">
        {/* Easy */}
        <div className="glass-card glass-card-glow-green rounded-2xl p-6 border border-emerald-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                Level 1 — Easy
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{details.easy.title}</h3>
            <p className="text-xs text-emerald-400/90 font-medium mb-3">{details.easy.subtitle}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.easy.desc}</p>
          </div>
          <Link
            href={`${base}/easy`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Easy Challenge</span>
          </Link>
        </div>

        {/* Medium */}
        <div className="glass-card glass-card-glow-cyan rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-black uppercase tracking-wider">
                Level 2 — Medium
              </span>
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{details.medium.title}</h3>
            <p className="text-xs text-cyan-400/90 font-medium mb-3">{details.medium.subtitle}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.medium.desc}</p>
          </div>
          <Link
            href={`${base}/medium`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Medium Challenge</span>
          </Link>
        </div>

        {/* Hard */}
        <div className="glass-card glass-card-glow-purple rounded-2xl p-6 border border-purple-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-black uppercase tracking-wider">
                Level 3 — Hard
              </span>
              <Flame className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{details.hard.title}</h3>
            <p className="text-xs text-purple-400/90 font-medium mb-3">{details.hard.subtitle}</p>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">{details.hard.desc}</p>
          </div>
          <Link
            href={`${base}/hard`}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:brightness-110 text-white font-black text-xs shadow-lg transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Hard Challenge</span>
          </Link>
        </div>
      </div>

      <StatStrip
        items={[
          { icon: Target, label: "Interactive 3D", value: "Ready", accent: "emerald" },
          { icon: ClipboardList, label: "Tiers", value: "3 Levels", accent: "cyan" },
          { icon: Star, label: "Simulation Engine", value: "WebGL", accent: "yellow" },
        ]}
      />
    </PageShell>
  );
}
