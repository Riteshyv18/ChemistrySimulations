import React from "react";
import Link from "next/link";
import { Gamepad2, ArrowRight, Sparkles, Layers } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { findModule } from "@/lib/content";
import { ACCENT } from "@/lib/theme";

interface PageProps {
  params: Promise<{ module: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { module: moduleParam } = await params;
  const mod = findModule(moduleParam);

  if (!mod) {
    return (
      <PageShell accent="emerald">
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">Module not found</h2>
          <Link href="/" className="sim-btn-primary mt-4">
            Return to Modules
          </Link>
        </div>
      </PageShell>
    );
  }

  const topics = mod.topics;
  const accent = ACCENT.emerald;

  return (
    <PageShell accent="emerald">
      <Breadcrumbs
        items={[
          { label: "Modules", href: "/" },
          { label: mod.moduleName },
        ]}
      />

      <PageHeader
        accent="emerald"
        badge={mod.moduleId}
        badgeIcon={Sparkles}
        title={mod.moduleName}
        description="Move through 3D simulations. Each topic tracks its own spatial mastery."
        actions={
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300">
            <span className="text-emerald-400">Module progress: </span>
            <span className="text-white font-bold">{mod.moduleId === 'M1' ? '100%' : mod.moduleId === 'M2' ? '40%' : '0%'}</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-10">
        {topics.map((topic, index) => {
          const progress = mod.moduleId === 'M3' ? 0 : [100, 80, 60][index % 3];
          const topicHref = `/challenge/${mod.slug}/${topic.slug}`;

          return (
            <Link key={topic.topicId} href={topicHref} className="group block">
              <div
                className={`glass-card ${accent.glow} h-full rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between border ${accent.border} hover:border-emerald-500/50 transition-all duration-300 shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      Topic {topic.topicId.length === 1 ? `0${topic.topicId}` : topic.topicId}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <Gamepad2 className="w-4 h-4" />
                      <span className="text-xs font-medium">3D Challenge</span>
                    </div>
                  </div>

                  <h3
                    className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors"
                  >
                    {topic.topicName}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {topic.coreConcept}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5 text-xs font-bold">
                    <span className="text-slate-500">Mastery Progress</span>
                    <span className="text-emerald-400">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} accentClass={accent.progress} size="sm" />

                  <div className="flex items-center justify-between mt-5 pt-3 border-t border-white/10 text-xs font-semibold text-slate-300">
                    <span className="text-slate-400 group-hover:text-white transition-colors">
                      Launch 3D Challenges
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-400 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
