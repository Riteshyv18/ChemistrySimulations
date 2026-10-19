"use client";

import React, { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

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
const VseprGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/vsepr_Molecular_shape/VseprGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const HybridizationGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/HybridizationGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const OrbitalWorkshopGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/OrbitalWorkshopGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const HybridizationMatchPuzzleGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/hybridization_orbital_overlap/HybridizationMatchPuzzleGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotEasyGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotEasyGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotMediumGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotMediumGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const MotHardGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/Molecular_orbital_theory/MotHardGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const BohrModelLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/bohr_model_spectrum/BohrModelLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const AtomicOrbitalsGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/atomic_orbitals/AtomicOrbitalsGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

export interface ChallengeDispatcherProps {
  module?: string;
  topic: string;
  difficulty?: string;
  showExitButton?: boolean;
  onExit?: () => void;
}

export function ChallengeDispatcher({
  topic,
  difficulty = "level1",
  showExitButton = true,
  onExit,
}: ChallengeDispatcherProps) {
  const normTopic = topic.toLowerCase().replace(/_/g, "-");
  const normDifficulty = (difficulty || "level1").toLowerCase();

  const isLevel2 =
    normDifficulty === "level2" ||
    normDifficulty === "level-2" ||
    normDifficulty === "medium" ||
    normDifficulty === "2";

  const isLevel3 =
    normDifficulty === "level3" ||
    normDifficulty === "level-3" ||
    normDifficulty === "hard" ||
    normDifficulty === "advanced" ||
    normDifficulty === "3";

  const isBohr =
    normTopic === "4" ||
    normTopic.includes("bohr") ||
    normTopic.includes("hydrogen-spectrum");

  const isAtomicOrbitals =
    !isBohr &&
    (normTopic === "5" ||
      normTopic.includes("atomic-orbital") ||
      normTopic.includes("atomic_orbital") ||
      normTopic.includes("atomic-orbitals") ||
      normTopic.includes("atomic_orbitals") ||
      normTopic.includes("quantum-number") ||
      normTopic.includes("quantum_number") ||
      normTopic.includes("electronic-configuration") ||
      (normTopic.includes("orbital") && !normTopic.includes("molecular") && !normTopic.includes("overlap")));

  const isMot =
    !isBohr &&
    !isAtomicOrbitals &&
    (normTopic === "3" ||
      normTopic.includes("mot") ||
      normTopic.includes("molecular-orbital") ||
      normTopic.includes("molecular_orbital"));

  const isHybridization =
    !isBohr &&
    !isAtomicOrbitals &&
    !isMot &&
    (normTopic === "2" ||
      normTopic.includes("hybridization") ||
      normTopic.includes("orbital-overlap") ||
      normTopic.includes("orbital_overlap"));

  const isVsepr =
    !isBohr &&
    !isAtomicOrbitals &&
    !isMot &&
    !isHybridization &&
    (normTopic === "1" ||
      normTopic.includes("vsepr") ||
      normTopic.includes("molecular-shape") ||
      normTopic.includes("molecular_shape"));

  let content: ReactNode = null;

  if (isBohr) {
    content = <BohrModelLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isAtomicOrbitals) {
    content = <AtomicOrbitalsGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isMot) {
    if (isLevel2) {
      content = <MotMediumGamePage difficulty={normDifficulty} onExit={onExit} />;
    } else if (isLevel3) {
      content = <MotHardGamePage difficulty={normDifficulty} onExit={onExit} />;
    } else {
      content = <MotEasyGamePage difficulty={normDifficulty} onExit={onExit} />;
    }
  } else if (isHybridization) {
    if (isLevel2) {
      content = <OrbitalWorkshopGamePage difficulty={normDifficulty} onExit={onExit} />;
    } else if (isLevel3) {
      content = <HybridizationMatchPuzzleGamePage difficulty={normDifficulty} onExit={onExit} />;
    } else {
      content = <HybridizationGamePage difficulty={normDifficulty} onExit={onExit} />;
    }
  } else if (isVsepr) {
    content = <VseprGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else {
    // Default fallback to VSEPR
    content = <VseprGamePage difficulty={normDifficulty} onExit={onExit} />;
  }

  const isHybridizationLevel1 = isHybridization && !isLevel2 && !isLevel3;
  const isHybridizationLevel2 = isHybridization && isLevel2;
  const isHybridizationLevel3 = isHybridization && isLevel3;
  const isMotLevel1 = isMot && !isLevel2 && !isLevel3;
  const isMotLevel2 = isMot && isLevel2;
  const isMotLevel3 = isMot && isLevel3;

  return (
    <CanvasErrorBoundary>
      <div className="w-full h-screen h-[100dvh] overflow-hidden bg-[#070D1E] select-none relative">
        {/* ─── TOP LEFT CANVAS: EXIT BUTTON (For full-screen canvases without integrated header) ─── */}
        {showExitButton && !isAtomicOrbitals && !isBohr && !isVsepr && !isHybridizationLevel1 && !isHybridizationLevel2 && !isHybridizationLevel3 && !isMotLevel1 && !isMotLevel2 && !isMotLevel3 && (
          <div className="absolute top-0.9 sm:top-1.6 left-2 sm:left-3.5 z-[60] pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onExit) {
                  onExit();
                } else {
                  exitSimulation();
                }
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 backdrop-blur-md font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Exit Simulation (Back to App)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>
        )}

        {content}
      </div>
    </CanvasErrorBoundary>
  );
}

export default ChallengeDispatcher;
