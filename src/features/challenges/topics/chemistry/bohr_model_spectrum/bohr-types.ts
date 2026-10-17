export interface QuantumLevel {
  n: number;
  energy: number; // in eV, e.g. -13.60, -3.40, -1.51, -0.85
  radius: number; // 3D radius for rendering
  label: string;
}

export interface PhotonOption {
  id: string;
  energy: number; // in eV
  wavelength?: number; // in nm
  label: string;
  color: string; // Hex color for photon particle/wave
  glowColor: string;
  series?: 'Lyman (UV)' | 'Balmer (Visible)' | 'Paschen (IR)' | 'Non-resonant';
  isDistractor?: boolean;
  description?: string;
}

export interface BohrMissionStage {
  id: number;
  title: string;
  subtitle: string;
  initialN: number;
  targetN: number;
  requiredAbsorptionEnergy: number; // in eV
  deExciteTargetN?: number; // target n when returning
  expectedEmissionWavelength?: number; // in nm
  expectedEmissionSeries?: string;
  expectedEmissionColor?: string;
  hint: string;
  photons: PhotonOption[];
}
