import * as THREE from 'three';

/**
 * Returns 4 unit vectors pointing to the corners of a regular tetrahedron,
 * centered at the origin, achieving the ideal 109.5° angle between any two.
 */
export function getTetrahedralVertices(bondLength: number): THREE.Vector3[] {
  const raw = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(-1, -1, 1),
  ];
  return raw.map(v => v.normalize().multiplyScalar(bondLength));
}

/** Angle in degrees between two vectors from a shared origin. */
export function angleBetween(a: THREE.Vector3, b: THREE.Vector3): number {
  return THREE.MathUtils.radToDeg(a.angleTo(b));
}

/** Returns 3 unit vectors evenly spaced in the XZ plane (120° apart) for trigonal planar geometry. */
export function getTrigonalPlanarVertices(bondLength: number): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3;
    vertices.push(new THREE.Vector3(Math.cos(angle) * bondLength, 0, Math.sin(angle) * bondLength));
  }
  return vertices;
}

export function calculateTetrahedralVectors(): THREE.Vector3[] {
  return [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.9428, -0.3333, 0),
    new THREE.Vector3(-0.4714, -0.3333, 0.8165),
    new THREE.Vector3(-0.4714, -0.3333, -0.8165),
  ];
}

export function calculateTrigonalPlanarVectors(): THREE.Vector3[] {
  return [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0.866, -0.5, 0),
    new THREE.Vector3(-0.866, -0.5, 0),
  ];
}
