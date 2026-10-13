import React from "react";
import Link from "next/link";
import { Gamepad2, Play, Target, Sparkles, Star, ClipboardList } from "lucide-react";
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
          Apply your knowledge in an interactive real-time 3D simulation. Select a challenge level below to begin.
        </p>

        {/* Launch Challenge Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 justify-center w-full max-w-3xl mt-2 mb-2">
          <Link
            href={`${base}/level1`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Level 1 Challenge</span>
          </Link>
          <Link
            href={`${base}/level2`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Level 2 Challenge</span>
          </Link>
          <Link
            href={`${base}/level3`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:brightness-110 text-white font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Level 3 Challenge</span>
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
