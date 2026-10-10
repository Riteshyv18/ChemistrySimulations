"use client";

import React, { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ChallengeDispatcher ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#070d1e] text-center p-6">
          <div className="max-w-md bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-6 shadow-xl">
            <h3 className="text-white font-bold text-lg mb-2">Unable to load 3D Challenge</h3>
            <p className="text-slate-400 text-xs mb-4">
              An unexpected error occurred while initializing the 3D canvas simulation.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
            >
              Reload Simulation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="w-full h-screen flex items-center justify-center bg-[#070d1e]">
    <div className="text-center">
      <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
      <p className="text-cyan-300 font-mono text-sm tracking-wider uppercase">Loading 3D Simulation…</p>
    </div>
  </div>
);

// Dynamic imports with ssr: false (Ensures WebGL / Three.js never runs on the server)
const VseprGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/vsepr_Molecular_shape/VseprGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const HybridizationGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/HybridizationGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const OrbitalWorkshopGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/OrbitalWorkshopGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const HybridizationMatchPuzzleGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/HybridizationMatchPuzzleGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotEasyGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotEasyGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotMediumGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotMediumGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotHardGamePage = dynamic<{ difficulty?: string }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotHardGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

export interface ChallengeDispatcherProps {
  module?: string;
  topic: string;
  difficulty?: string;
}

export function ChallengeDispatcher({
  topic,
  difficulty = "easy",
}: ChallengeDispatcherProps) {
  const normTopic = topic.toLowerCase().replace(/_/g, "-");
  const normDifficulty = (difficulty || "easy").toLowerCase();

  const isMot =
    normTopic === "3" ||
    normTopic.includes("mot") ||
    normTopic.includes("molecular-orbital") ||
    normTopic.includes("molecular_orbital");

  const isHybridization =
    !isMot &&
    (normTopic === "2" ||
      normTopic.includes("hybridization") ||
      normTopic.includes("orbital-overlap") ||
      normTopic.includes("orbital_overlap"));

  const isVsepr =
    !isMot &&
    !isHybridization &&
    (normTopic === "1" ||
      normTopic.includes("vsepr") ||
      normTopic.includes("molecular-shape") ||
      normTopic.includes("molecular_shape"));

  let content: ReactNode = null;

  if (isMot) {
    if (normDifficulty === "medium") {
      content = <MotMediumGamePage difficulty={normDifficulty} />;
    } else if (normDifficulty === "hard" || normDifficulty === "advanced") {
      content = <MotHardGamePage difficulty={normDifficulty} />;
    } else {
      content = <MotEasyGamePage difficulty={normDifficulty} />;
    }
  } else if (isHybridization) {
    if (normDifficulty === "medium") {
      content = <OrbitalWorkshopGamePage difficulty={normDifficulty} />;
    } else if (normDifficulty === "hard" || normDifficulty === "advanced") {
      content = <HybridizationMatchPuzzleGamePage difficulty={normDifficulty} />;
    } else {
      content = <HybridizationGamePage difficulty={normDifficulty} />;
    }
  } else if (isVsepr) {
    content = <VseprGamePage difficulty={normDifficulty} />;
  } else {
    // Default fallback to VSEPR
    content = <VseprGamePage difficulty={normDifficulty} />;
  }

  return (
    <CanvasErrorBoundary>
      <div className="w-full h-screen overflow-hidden bg-[#070D1E] select-none">
        {content}
      </div>
    </CanvasErrorBoundary>
  );
}

export default ChallengeDispatcher;
