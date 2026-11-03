import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, BookOpen, Layers, Atom, Gamepad2 } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getModules } from "@/lib/content";

const MODULE_DESCRIPTIONS: Record<string, string> = {
  M1: "Interactive 3D VSEPR shapes, orbital hybridization workshops, and molecular orbital energy diagrams.",
  M2: "Fundamental atomic structure, quantum numbers, and subatomic orbital configurations.",
  M3: "Thermodynamics of liquid solutions, concentration terms, Raoult's law vapor pressure, colligative properties, and osmotic pressure.",
  M4: "Galvanic and electrolytic cells, electrode potentials, Nernst equation, and Faraday's laws of electrolysis.",
  M5: "Collision theory, factors influencing reaction rates, activation energy, catalysts, and rate laws.",
  M6: "Dynamic chemical equilibrium, equilibrium constants, Le Chatelier's principle, ionic equilibrium, and pH.",
  M7: "Laws of thermodynamics, enthalpy, Hess's law, entropy, and Gibbs free energy spontaneity.",
  M8: "Extraction and refining of metals, metallurgy principles, roasting, calcination, and reduction processes.",
  M9: "Crystalline and amorphous solids, unit cell lattices, packing efficiency, coordination number, and crystal density.",
  M10: "Structure, nomenclature, physical properties, and characteristic reaction mechanisms of hydrocarbons.",
  M11: "Carbonyl chemistry, nucleophilic additions, aldol and Cannizzaro reactions, and carboxylic acid derivatives.",
};

const THEMES = [
  {
    glow: "glass-card-glow-green",
    border: "border-emerald-500/20",
    iconBorder: "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    tag: "border-emerald-500/30 text-emerald-300",
    titleHover: "group-hover:text-emerald-300",
    progressText: "text-emerald-400",
    progressBg: "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    btn: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-400 hover:text-slate-950",
  },
  {
    glow: "glass-card-glow-cyan",
    border: "border-cyan-500/20",
    iconBorder: "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.35)]",
    tag: "border-cyan-500/30 text-cyan-300",
    titleHover: "group-hover:text-cyan-300",
    progressText: "text-cyan-400",
    progressBg: "bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]",
    btn: "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950",
  },
  {
    glow: "glass-card-glow-purple",
    border: "border-purple-500/20",
    iconBorder: "bg-purple-500/10 border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.35)]",
    tag: "border-fuchsia-500/30 text-fuchsia-300",
    titleHover: "group-hover:text-fuchsia-300",
    progressText: "text-fuchsia-400",
    progressBg: "bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.8)]",
    btn: "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-400 hover:text-slate-950",
  },
];

export default function ModulesPage() {
  const modules = getModules();

  return (
    <PageShell accent="emerald">
      <PageHeader
        accent="emerald"
        badge="Chemistry Modules"
        badgeIcon={Sparkles}
        title="Chemistry modules"
        description="Select a specialization to explore 3D simulations, formula visualizations, and adaptive challenges."
        actions={
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400">Catalog progress: </span>
            <span className="text-white font-bold">100%</span>
          </div>
        }
      />

      <section className="mb-8 sm:mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {modules.map((mod, index) => {
            const theme = THEMES[index % THEMES.length];
            const isM1 = mod.moduleId === "M1";
            const isM2 = mod.moduleId === "M2";
            const progressPct = isM1 ? 100 : isM2 ? 40 : 0;
            const targetUrl = `/challenge/${mod.slug}`;

            return (
              <Link
                key={mod.moduleId}
                href={targetUrl}
                className={`block glass-card ${theme.glow} rounded-2xl sm:rounded-3xl p-5 sm:p-6 border ${theme.border} relative overflow-hidden flex flex-col justify-between group min-h-[260px] sm:min-h-[290px] shadow-xl`}
              >
                {/* Background Molecule Wireframe Accent */}
                <div className="absolute inset-0 opacity-10 pointer-events-none p-4 flex items-center justify-center">
                  <svg
                    className="w-full h-full text-emerald-400"
                    viewBox="0 0 200 200"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <circle cx="100" cy="100" r="40" strokeDasharray="3 3" />
                    <line x1="40" y1="100" x2="160" y2="100" />
                    <line x1="100" y1="40" x2="100" y2="160" />
                    <circle cx="100" cy="100" r="16" fill="currentColor" fillOpacity="0.2" />
                    <circle cx="40" cy="100" r="10" fill="currentColor" fillOpacity="0.2" />
                    <circle cx="160" cy="100" r="10" fill="currentColor" fillOpacity="0.2" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border ${theme.tag} bg-slate-950/40`}
                    >
                      {mod.moduleId}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{mod.topics.length} Topics</span>
                    </div>
                  </div>

                  <h3
                    className={`text-xl sm:text-2xl font-bold text-white mb-2 transition-colors ${theme.titleHover}`}
                  >
                    {mod.moduleName}
                  </h3>

                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {MODULE_DESCRIPTIONS[mod.moduleId] || "Interactive 3D chemistry simulations, concepts, formulas, and progressive challenge mastery."}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 text-xs font-bold">
                    <span className="text-slate-500">Module Progress</span>
                    <span className={theme.progressText}>{progressPct}%</span>
                  </div>
                  <ProgressBar value={progressPct} accentClass={theme.progressBg} size="sm" />

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10 text-xs font-semibold text-slate-300">
                    <span className="text-slate-400 group-hover:text-white transition-colors">
                      View Topics & 3D Challenges
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-400 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
