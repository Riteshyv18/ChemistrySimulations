import * as THREE from 'three';

// ── Orbital Color Palette ──────────────────────────────────────────────────
export const ORBITAL_COLORS = {
  s: { main: '#a855f7', emissive: '#7e22ce', label: 's orbital', glow: 'rgba(168,85,247,0.4)' },
  px: { main: '#f43f5e', emissive: '#be185d', label: 'pₓ orbital', glow: 'rgba(244,63,94,0.4)' },
  py: { main: '#22c55e', emissive: '#15803d', label: 'pᵧ orbital', glow: 'rgba(34,197,94,0.4)' },
  pz: { main: '#3b82f6', emissive: '#1d4ed8', label: 'p𝓏 orbital', glow: 'rgba(59,130,246,0.4)' },
  d: { main: '#f97316', emissive: '#c2410c', label: 'd orbital', glow: 'rgba(249,115,22,0.4)' },
};

// ── Atomic Orbital Materials ────────────────────────────────────────────────
export const getOrbitalMaterial = (type: 's' | 'px' | 'py' | 'pz' | 'd') => {
  const conf = ORBITAL_COLORS[type];
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(conf.main),
    emissive: new THREE.Color(conf.emissive),
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
};

export const getHybridLobeMaterial = (colorHex: string = '#06b6d4', emissiveHex: string = '#0891b2') => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    emissive: new THREE.Color(emissiveHex),
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
};

export const getBackLobeMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.6,
  });
};

// ── Nucleus Material ───────────────────────────────────────────────────────
export const getNucleusMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#e0e7ff'),
    emissive: new THREE.Color('#818cf8'),
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.9,
  });
};
