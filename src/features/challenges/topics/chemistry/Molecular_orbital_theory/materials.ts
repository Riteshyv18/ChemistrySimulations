import * as THREE from 'three';

export const ORBITAL_COLORS = {
  s: '#3b82f6', // Glowing Electric Blue
  px: '#a855f7', // Purple
  py: '#22c55e', // Emerald Green
  pz: '#ef4444', // Red
  phasePositive: '#3b82f6', // Blue (+)
  phaseNegative: '#ef4444', // Red (-)
  bonding: '#38bdf8', // Cyan / Light Blue
  antibonding: '#f43f5e', // Rose / Red
  nodePlane: '#ec4899', // Pink Nodal Plane
  nucleus: '#ec4899', // Magenta Nucleus
  glow: '#60a5fa'
};

export const getNucleusMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f472b6'),
    emissive: new THREE.Color('#ec4899'),
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8
  });
};

export const getAO1sMaterial = (phase: '+' | '-' = '+', opacity = 0.55) => {
  const isPos = phase === '+';
  const color = isPos ? ORBITAL_COLORS.phasePositive : ORBITAL_COLORS.phaseNegative;
  
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: opacity,
    roughness: 0.1,
    transmission: 0.4,
    thickness: 0.8,
    side: THREE.DoubleSide,
    depthWrite: false
  });
};

export const getBondingMOMaterial = (opacity = 0.65) => {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#38bdf8'),
    emissive: new THREE.Color('#0284c7'),
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: opacity,
    roughness: 0.15,
    clearcoat: 0.5,
    transmission: 0.3,
    side: THREE.DoubleSide,
    depthWrite: false
  });
};

export const getAntibondingMOMaterial = (phase: '+' | '-' = '+', opacity = 0.65) => {
  const isPos = phase === '+';
  const color = isPos ? ORBITAL_COLORS.phasePositive : ORBITAL_COLORS.phaseNegative;
  
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.45,
    transparent: true,
    opacity: opacity,
    roughness: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false
  });
};

export const getNodalPlaneMaterial = () => {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(ORBITAL_COLORS.nodePlane),
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    wireframe: false
  });
};
