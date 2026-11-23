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

const ExchangeStabilityLevel3GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/atomic_orbitals/ExchangeStabilityLevel3GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const QuantumNumbersLevel2GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/atomic_orbitals/QuantumNumbersLevel2GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const AufbauSodiumLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/atomic_orbitals/AufbauSodiumLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const DualNatureLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/dual_nature_matter/DualNatureLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const SolutionsWorkshopGamePage = dynamic<{ module?: string; topic?: string; difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/solutions/SolutionsWorkshopGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ConcentrationTermsLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/solutions/concentration_terms/ConcentrationTermsLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const RaoultsLawLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/solutions/raoults_law/RaoultsLawLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ColligativePropertiesLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/solutions/colligative_properties/ColligativePropertiesLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const OsmoticPressureLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/solutions/osmotic_pressure/OsmoticPressureLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const GalvanicCellLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/electrochemistry/galvanic_cells/GalvanicCellLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ElectronIonFlowLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/electrochemistry/electron_ion_flow/ElectronIonFlowLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ElectrolysisLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/electrochemistry/electrolysis/ElectrolysisLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ElectrodePotentialLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/electrochemistry/electrode_potential/ElectrodePotentialLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const CollisionTheoryLevel1GamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/chemical_kinetics/collision_theory/CollisionTheoryLevel1GamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ReactionRateControlRoomGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/chemical_kinetics/reaction_rate_control_room/ReactionRateControlRoomGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ActivationEnergyGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/chemical_kinetics/activation_energy/ActivationEnergyGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const RateLawHalfLifeGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/chemical_kinetics/rate_law_half_life/RateLawHalfLifeGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ChemicalEquilibriumGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/equilibrium/chemical_equilibrium/ChemicalEquilibriumGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const EquilibriumConstantGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/equilibrium/equilibrium_constant/EquilibriumConstantGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const LeChatelierPrincipleGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/equilibrium/le_chatelier_principle/LeChatelierPrincipleGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const IonicEquilibriumPhGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/equilibrium/ionic_equilibrium_ph/IonicEquilibriumPhGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const SolubilityProductGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/equilibrium/solubility_product/SolubilityProductGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const FirstLawThermodynamicsGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/thermodynamics/first_law/FirstLawThermodynamicsGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const EnthalpyHeatCapacityGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/thermodynamics/enthalpy_heat_capacity/EnthalpyHeatCapacityGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const HesssLawGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/thermodynamics/hesss_law/HesssLawGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const EntropyGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/thermodynamics/entropy/EntropyGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const GibbsFreeEnergyGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/thermodynamics/gibbs_free_energy/GibbsFreeEnergyGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const OreConcentrationGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/metallurgy/ore_concentration/OreConcentrationGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const CrushingRoastingCalcinationGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/metallurgy/crushing_roasting_calcination/CrushingRoastingCalcinationGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const ReductionExtractionGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/metallurgy/reduction_extraction/ReductionExtractionGamePage"
    ).then((mod) => mod.default),
  { ssr: false, loading: LoadingFallback }
);

const RefiningOfMetalsGamePage = dynamic<{ difficulty?: string; onExit?: () => void }>(
  () =>
    import(
      "@/features/challenges/topics/chemistry/metallurgy/refining_of_metals/RefiningOfMetalsGamePage"
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
  module,
  topic,
  difficulty = "level1",
  showExitButton = true,
  onExit,
}: ChallengeDispatcherProps) {
  const normModule = (module || "").toLowerCase().replace(/_/g, "-");
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

  const isGalvanicCell =
    normTopic === "13" ||
    normTopic.includes("galvanic") ||
    normTopic.includes("cell-component") ||
    normTopic.includes("daniell") ||
    ((normModule.includes("electrochemistry") || normModule === "m4") && (normTopic === "1" || normTopic.includes("galvanic")));

  const isElectronIonFlow =
    normTopic === "14" ||
    normTopic.includes("electron-ion-flow") ||
    normTopic.includes("electron-flow") ||
    normTopic.includes("anode-cathode") ||
    ((normModule.includes("electrochemistry") || normModule === "m4") && (normTopic === "2" || normTopic.includes("anode") || normTopic.includes("flow")));

  const isElectrolysis =
    normTopic === "16" ||
    normTopic.includes("electrolysis") ||
    normTopic.includes("faraday") ||
    ((normModule.includes("electrochemistry") || normModule === "m4") && (normTopic === "4" || normTopic.includes("electrolysis") || normTopic.includes("faraday")));

  const isElectrodePotential =
    normTopic === "15" ||
    normTopic.includes("potential") ||
    normTopic.includes("cell-emf") ||
    normTopic.includes("electrode-potential") ||
    ((normModule.includes("electrochemistry") || normModule === "m4") && (normTopic === "3" || normTopic.includes("potential") || normTopic.includes("emf")));

  const isChemicalEquilibrium =
    normTopic === "21" ||
    normTopic === "chemical-equilibrium" ||
    ((normModule.includes("equilibrium") || normModule === "m6") &&
      (normTopic === "1" ||
        normTopic === "chemical-equilibrium" ||
        normTopic.includes("chemical-equilibrium") ||
        (normTopic.includes("equilibrium") && !normTopic.includes("constant") && !normTopic.includes("le-chatelier") && !normTopic.includes("ionic"))));

  const isEquilibriumConstant =
    normTopic === "22" ||
    normTopic === "equilibrium-constant" ||
    normTopic.includes("equilibrium-constant") ||
    normTopic.includes("kc") ||
    ((normModule.includes("equilibrium") || normModule === "m6") &&
      (normTopic === "2" || normTopic.includes("constant")));

  const isLeChatelier =
    normTopic === "23" ||
    normTopic === "le-chatelier" ||
    normTopic.includes("le-chatelier") ||
    normTopic.includes("lechatelier") ||
    ((normModule.includes("equilibrium") || normModule === "m6") &&
      (normTopic === "3" || normTopic.includes("chatelier")));

  const isIonicEquilibrium =
    normTopic === "24" ||
    normTopic === "ionic-equilibrium" ||
    normTopic.includes("ionic-equilibrium") ||
    normTopic.includes("ph-scale") ||
    ((normModule.includes("equilibrium") || normModule === "m6") &&
      (normTopic === "4" || normTopic.includes("ionic") || normTopic.includes("ph")));

  const isSolubilityProduct =
    normTopic === "25" ||
    normTopic === "solubility-product" ||
    normTopic.includes("solubility-product") ||
    normTopic.includes("solubility") ||
    normTopic.includes("ksp") ||
    normTopic.includes("common-ion") ||
    ((normModule.includes("equilibrium") || normModule === "m6") &&
      (normTopic === "5" || normTopic.includes("solubility") || normTopic.includes("common")));

  const isFirstLawThermodynamics =
    normTopic === "26" ||
    normTopic === "first-law" ||
    normTopic.includes("first-law") ||
    normTopic.includes("first_law") ||
    normTopic.includes("internal-energy") ||
    normTopic.includes("work-heat") ||
    ((normModule.includes("thermodynamics") || normModule === "m7" || normModule.includes("thermo")) &&
      (normTopic === "1" || normTopic.includes("first") || normTopic.includes("law")));

  const isEnthalpyHeatCapacity =
    normTopic === "27" ||
    normTopic === "enthalpy" ||
    normTopic === "heat-capacity" ||
    normTopic.includes("enthalpy") ||
    normTopic.includes("heat-capacity") ||
    normTopic.includes("heat_capacity") ||
    normTopic.includes("calorimetry") ||
    normTopic.includes("specific-heat") ||
    ((normModule.includes("thermodynamics") || normModule === "m7" || normModule.includes("thermo")) &&
      (normTopic === "2" || (normTopic.includes("enthalpy") && !normTopic.includes("hess")) || normTopic.includes("capacity")));

  const isHesssLaw =
    normTopic === "28" ||
    normTopic === "hesss-law" ||
    normTopic === "hess-law" ||
    normTopic.includes("hess") ||
    ((normModule.includes("thermodynamics") || normModule === "m7" || normModule.includes("thermo")) &&
      (normTopic === "3" || normTopic.includes("hess")));

  const isEntropy =
    normTopic === "29" ||
    normTopic === "entropy" ||
    normTopic.includes("entropy") ||
    ((normModule.includes("thermodynamics") || normModule === "m7" || normModule.includes("thermo")) &&
      (normTopic === "4" || normTopic.includes("entropy") || normTopic.includes("disorder")));

  const isGibbsFreeEnergy =
    normTopic === "30" ||
    normTopic === "gibbs" ||
    normTopic === "gibbs-free-energy" ||
    normTopic === "spontaneity" ||
    normTopic.includes("gibbs") ||
    normTopic.includes("spontaneity") ||
    ((normModule.includes("thermodynamics") || normModule === "m7" || normModule.includes("thermo")) &&
      (normTopic === "5" || normTopic.includes("gibbs") || normTopic.includes("spontan")));

  const isRefiningOfMetals =
    normTopic === "34" ||
    normTopic === "refining_of_metals" ||
    normTopic === "refining-of-metals" ||
    normTopic === "refining" ||
    normTopic.includes("refining") ||
    ((normModule.includes("metallurgy") || normModule === "m8") &&
      (normTopic === "4" || normTopic.includes("refin")));

  const isReductionExtraction =
    !isRefiningOfMetals &&
    (normTopic === "33" ||
      normTopic === "reduction_extraction" ||
      normTopic === "reduction-extraction" ||
      normTopic === "reduction_and_extraction" ||
      normTopic === "reduction-and-extraction" ||
      normTopic.includes("reduction") ||
      normTopic.includes("extraction") ||
      ((normModule.includes("metallurgy") || normModule === "m8") &&
        (normTopic === "3" || normTopic.includes("reduct") || normTopic.includes("extract"))));

  const isCrushingRoastingCalcination =
    !isReductionExtraction &&
    (normTopic === "32" ||
      normTopic === "crushing_roasting_calcination" ||
      normTopic === "crushing-roasting-calcination" ||
      normTopic.includes("crushing") ||
      normTopic.includes("roasting") ||
      normTopic.includes("calcination") ||
      normTopic.includes("crush") ||
      normTopic.includes("roast") ||
      normTopic.includes("calcin") ||
      ((normModule.includes("metallurgy") || normModule === "m8") &&
        (normTopic === "2" || normTopic.includes("roast") || normTopic.includes("calcin") || normTopic.includes("crush"))));

  const isOreConcentration =
    !isReductionExtraction &&
    !isCrushingRoastingCalcination &&
    (normTopic === "31" ||
      normTopic === "ore_concentration" ||
      normTopic === "concentration_of_ores" ||
      normTopic === "minerals_and_ores" ||
      normTopic.includes("concentration") ||
      normTopic.includes("metallurgy") ||
      normTopic.includes("gangue") ||
      normTopic.includes("ore") ||
      ((normModule.includes("metallurgy") || normModule === "m8") &&
        (normTopic === "1" || normTopic.includes("ore") || normTopic.includes("mineral") || normTopic.includes("concentrat"))));

  const isRateLawHalfLife =
    normTopic === "20" ||
    normTopic.includes("rate-law") ||
    normTopic.includes("reaction-order") ||
    normTopic.includes("half-life") ||
    ((normModule.includes("kinetics") || normModule === "m5") && (normTopic === "4" || normTopic.includes("order") || normTopic.includes("half")));

  const isCollisionTheory =
    normTopic === "17" ||
    normTopic.includes("collision") ||
    normTopic.includes("effective-collision") ||
    ((normModule.includes("kinetics") || normModule === "m5") && (normTopic === "1" || normTopic.includes("collision")));

  const isReactionRateControl =
    !isRateLawHalfLife &&
    (normTopic === "18" ||
      normTopic.includes("control-room") ||
      normTopic.includes("factors-affecting") ||
      (normTopic.includes("reaction-rate") && !normTopic.includes("order")) ||
      ((normModule.includes("kinetics") || normModule === "m5") && (normTopic === "2" || normTopic === "factors-affecting-reaction-rate" || normTopic.includes("control"))));

  const isActivationEnergy =
    normTopic === "19" ||
    normTopic.includes("activation-energy") ||
    normTopic.includes("break-the-barrier") ||
    normTopic.includes("catalyst") ||
    ((normModule.includes("kinetics") || normModule === "m5") && (normTopic === "3" || normTopic.includes("barrier") || normTopic.includes("activation")));

  const isConcentrationTerms =
    normTopic === "9" ||
    normTopic.includes("concentration");

  const isRaoultsLaw =
    normTopic === "10" ||
    normTopic.includes("raoult");

  const isColligativeProperties =
    normTopic === "11" ||
    normTopic.includes("colligative");

  const isOsmoticPressure =
    normTopic === "12" ||
    normTopic.includes("osmotic") ||
    normTopic.includes("osmosis");

  const isSolutions =
    !isConcentrationTerms &&
    !isRaoultsLaw &&
    !isColligativeProperties &&
    !isOsmoticPressure &&
    (normModule.includes("solution") ||
      normTopic === "11" ||
      normTopic === "12" ||
      normTopic.includes("colligative") ||
      normTopic.includes("osmotic") ||
      normTopic.includes("osmosis"));

  const isDualNature =
    normTopic === "7" ||
    normTopic.includes("dual-nature") ||
    normTopic.includes("matter-wave") ||
    normTopic.includes("de-broglie") ||
    normTopic.includes("double-slit");

  const isBohr =
    !isDualNature &&
    (normTopic === "4" ||
      normTopic.includes("bohr") ||
      normTopic.includes("hydrogen-spectrum"));

  const isElectronicConfig =
    normTopic === "6" ||
    normTopic.includes("electronic-configuration") ||
    normTopic.includes("electronic-configurations") ||
    normTopic.includes("electronic_configuration") ||
    normTopic.includes("electronic_configurations");

  const isQuantumNumbers =
    normTopic === "8" ||
    normTopic.includes("quantum-number") ||
    normTopic.includes("quantum_number") ||
    normTopic.includes("quantum-numbers") ||
    normTopic.includes("orbital-architect");

  const isAtomicOrbitals =
    !isBohr &&
    !isElectronicConfig &&
    !isQuantumNumbers &&
    (normTopic === "5" ||
      normTopic.includes("atomic-orbital") ||
      normTopic.includes("atomic_orbital") ||
      normTopic.includes("atomic-orbitals") ||
      normTopic.includes("atomic_orbitals") ||
      (normTopic.includes("orbital") && !normTopic.includes("molecular") && !normTopic.includes("overlap") && !normTopic.includes("quantum")));

  const isMot =
    !isBohr &&
    !isElectronicConfig &&
    !isAtomicOrbitals &&
    (normTopic === "3" ||
      normTopic.includes("mot") ||
      normTopic.includes("molecular-orbital") ||
      normTopic.includes("molecular_orbital"));

  const isHybridization =
    !isBohr &&
    !isElectronicConfig &&
    !isAtomicOrbitals &&
    !isMot &&
    (normTopic === "2" ||
      normTopic.includes("hybridization") ||
      normTopic.includes("orbital-overlap") ||
      normTopic.includes("orbital_overlap"));

  const isVsepr =
    !isBohr &&
    !isElectronicConfig &&
    !isAtomicOrbitals &&
    !isMot &&
    !isHybridization &&
    (normTopic === "1" ||
      normTopic.includes("vsepr") ||
      normTopic.includes("molecular-shape") ||
      normTopic.includes("molecular_shape"));

  let content: ReactNode = null;

  if (isRefiningOfMetals) {
    content = <RefiningOfMetalsGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isReductionExtraction) {
    content = <ReductionExtractionGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isCrushingRoastingCalcination) {
    content = <CrushingRoastingCalcinationGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isOreConcentration) {
    content = <OreConcentrationGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isGibbsFreeEnergy) {
    content = <GibbsFreeEnergyGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isEntropy) {
    content = <EntropyGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isHesssLaw) {
    content = <HesssLawGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isEnthalpyHeatCapacity) {
    content = <EnthalpyHeatCapacityGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isFirstLawThermodynamics) {
    content = <FirstLawThermodynamicsGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isSolubilityProduct) {
    content = <SolubilityProductGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isIonicEquilibrium) {
    content = <IonicEquilibriumPhGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isLeChatelier) {
    content = <LeChatelierPrincipleGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isEquilibriumConstant) {
    content = <EquilibriumConstantGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isChemicalEquilibrium) {
    content = <ChemicalEquilibriumGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isCollisionTheory) {
    content = <CollisionTheoryLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isReactionRateControl) {
    content = <ReactionRateControlRoomGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isActivationEnergy) {
    content = <ActivationEnergyGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isRateLawHalfLife) {
    content = <RateLawHalfLifeGamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isElectrolysis) {
    content = <ElectrolysisLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else   if (isGalvanicCell) {
    content = <GalvanicCellLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isElectronIonFlow) {
    content = <ElectronIonFlowLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isElectrodePotential) {
    content = <ElectrodePotentialLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isConcentrationTerms) {
    content = <ConcentrationTermsLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isRaoultsLaw) {
    content = <RaoultsLawLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isColligativeProperties) {
    content = <ColligativePropertiesLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isOsmoticPressure) {
    content = <OsmoticPressureLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isSolutions) {
    content = <SolutionsWorkshopGamePage module={module} topic={topic} difficulty={normDifficulty} onExit={onExit} />;
  } else if (isDualNature) {
    content = <DualNatureLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isBohr) {
    content = <BohrModelLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isElectronicConfig) {
    // Put Quantum Anomalies & Exchange Stability inside Level 2 & 3
    if (isLevel2 || isLevel3) {
      content = <ExchangeStabilityLevel3GamePage difficulty={normDifficulty} onExit={onExit} />;
    } else {
      // Level 1 (Easy): Aufbau & Hund Rule Builder for Sodium (Na, Z=11)
      content = <AufbauSodiumLevel1GamePage difficulty={normDifficulty} onExit={onExit} />;
    }
  } else if (isQuantumNumbers) {
    content = <QuantumNumbersLevel2GamePage difficulty={normDifficulty} onExit={onExit} />;
  } else if (isAtomicOrbitals) {
    if (isLevel3) {
      content = <ExchangeStabilityLevel3GamePage difficulty={normDifficulty} onExit={onExit} />;
    } else if (isLevel2) {
      content = <QuantumNumbersLevel2GamePage difficulty={normDifficulty} onExit={onExit} />;
    } else {
      content = <AtomicOrbitalsGamePage difficulty={normDifficulty} onExit={onExit} />;
    }
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
        {showExitButton && !isRefiningOfMetals && !isReductionExtraction && !isCrushingRoastingCalcination && !isOreConcentration && !isGibbsFreeEnergy && !isEntropy && !isHesssLaw && !isEnthalpyHeatCapacity && !isFirstLawThermodynamics && !isSolubilityProduct && !isIonicEquilibrium && !isLeChatelier && !isEquilibriumConstant && !isChemicalEquilibrium && !isCollisionTheory && !isReactionRateControl && !isActivationEnergy && !isRateLawHalfLife && !isConcentrationTerms && !isRaoultsLaw && !isColligativeProperties && !isOsmoticPressure && !isSolutions && !isGalvanicCell && !isElectronIonFlow && !isElectrodePotential && !isElectrolysis && !isDualNature && !isAtomicOrbitals && !isElectronicConfig && !isBohr && !isVsepr && !isQuantumNumbers && !isHybridizationLevel1 && !isHybridizationLevel2 && !isHybridizationLevel3 && !isMotLevel1 && !isMotLevel2 && !isMotLevel3 && (
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
