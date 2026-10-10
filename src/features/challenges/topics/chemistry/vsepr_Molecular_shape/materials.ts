import * as THREE from 'three';

export const elementColors: Record<string, number> = {
  carbon: 0x2b2b2b,
  c: 0x2b2b2b,
  hydrogen: 0xf5f5f5,
  h: 0xf5f5f5,
  nitrogen: 0x3050f8,
  n: 0x3050f8,
  oxygen: 0xff0d0d,
  o: 0xff0d0d,
  fluorine: 0x90e050,
  f: 0x90e050,
  boron: 0xffb5b5,
  b: 0xffb5b5,
};

export function getAtomMaterial(element: string): THREE.MeshStandardMaterial {
  const key = element.toLowerCase();
  const color = elementColors[key] ?? 0x9ca3af;
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.1,
  });
}

export const electronCloudMaterial = new THREE.MeshPhongMaterial({
  color: 0x3b82f6,
  transparent: true,
  opacity: 0.4,
  wireframe: false,
});

export const bondCylinderMaterial = new THREE.MeshStandardMaterial({
  color: 0x9ca3af,
  roughness: 0.3,
  metalness: 0.8,
});

export const hydrogenAtomMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f5f5,
  roughness: 0.2,
});

export const carbonAtomMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b,
  roughness: 0.4,
});

export const oxygenAtomMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0d0d,
  roughness: 0.3,
});

export const nitrogenAtomMaterial = new THREE.MeshStandardMaterial({
  color: 0x3050f8,
  roughness: 0.3,
});

export const boronAtomMaterial = new THREE.MeshStandardMaterial({
  color: 0xffb5b5,
  roughness: 0.3,
});
