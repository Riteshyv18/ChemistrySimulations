import * as THREE from 'three';

export function getNucleusMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.1,
  });
}

export function getNucleusGlowMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0xf87171,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
  });
}

export function getOrbitRingMaterial(isActive = false, isTarget = false) {
  if (isTarget) {
    return new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald target
      transparent: true,
      opacity: 0.95,
    });
  }
  if (isActive) {
    return new THREE.MeshBasicMaterial({
      color: 0x0284c7, // Sky 600 active
      transparent: true,
      opacity: 0.9,
    });
  }
  return new THREE.MeshBasicMaterial({
    color: 0x94a3b8, // Slate 400 default
    transparent: true,
    opacity: 0.55,
  });
}

export function getElectronMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.2,
  });
}

export function getPhotonPacketMaterial(hexColor: string) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(hexColor),
    transparent: true,
    opacity: 0.9,
  });
}
