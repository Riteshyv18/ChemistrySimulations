'use client';

import React from 'react';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { exitSimulation } from '@/lib/mobileBridge';

export interface SolutionsWorkshopGamePageProps {
  module?: string;
  topic?: string;
  difficulty?: string;
  onExit?: () => void;
}

export default function SolutionsWorkshopGamePage({
  topic = 'solutions',
  difficulty = 'level1',
  onExit,
}: SolutionsWorkshopGamePageProps) {
  // Format readable topic name
  const formattedTopic = (topic || 'Solutions')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Format readable level
  const formattedLevel = (difficulty || 'Level 1')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      exitSimulation();
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#070D1E] text-slate-100 flex flex-col justify-between overflow-hidden relative select-none font-sans p-3 sm:p-5">
      {/* Background Soft Accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* ── TOP TOOLBAR: EXIT BUTTON ONLY ── */}
      <header className="w-full flex items-center justify-between z-20 shrink-0 py-1">
        <button
          type="button"
          onClick={handleExit}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          title="Exit to Topic"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>EXIT</span>
        </button>

        <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-white/10 text-slate-400 font-mono text-[11px] font-semibold">
          M3: Solutions
        </span>
      </header>

      {/* ── CENTER: CLEAN PLACEHOLDER MESSAGE (NO SIMULATION GAMEPLAY) ── */}
      <main className="flex-1 w-full flex items-center justify-center p-4 z-10">
        <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-md shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <Clock className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{formattedLevel}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            {formattedTopic}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-xs">
            Simulation for this level is under development and will be added step-by-step.
          </p>

          <button
            type="button"
            onClick={handleExit}
            className="w-full py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
          >
            Back to Topics
          </button>
        </div>
      </main>

      {/* ── FOOTER SPACER ── */}
      <footer className="w-full h-4 shrink-0" />
    </div>
  );
}
