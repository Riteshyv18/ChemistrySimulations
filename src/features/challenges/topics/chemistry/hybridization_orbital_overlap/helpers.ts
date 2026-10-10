import * as THREE from 'three';

export interface HybridStateInfo {
  code: 'none' | 's' | 'sp' | 'sp2' | 'sp3' | 'sp3d' | 'sp3d2';
  name: string;
  count: number;
  geometryName: string;
  angles: string;
  description: string;
}

export const HYBRID_STATES: Record<string, HybridStateInfo> = {
  none: {
    code: 'none',
    name: 'Unmixed Atomic Orbitals',
    count: 0,
    geometryName: 'Select orbitals to mix',
    angles: 'N/A',
    description: 'Select an s orbital and p/d orbitals to construct hybrid states.',
  },
  s: {
    code: 's',
    name: '1s Orbital Selected',
    count: 1,
    geometryName: 'Spherical Atomic Orbital',
    angles: 'N/A',
    description: '1 s orbital placed in mixing zone. Add p orbitals to begin hybridization.',
  },
  sp: {
    code: 'sp',
    name: 'sp Hybridization Complete',
    count: 2,
    geometryName: 'Linear Geometry',
    angles: '180°',
    description: '1 s + 1 p orbital mix to form 2 equivalent sp hybrid orbitals oriented at 180°.',
  },
  sp2: {
    code: 'sp2',
    name: 'sp² Hybridization Complete',
    count: 3,
    geometryName: 'Trigonal Planar Geometry',
    angles: '120°',
    description: '1 s + 2 p orbitals mix to form 3 equivalent sp² hybrid orbitals at 120° in a plane.',
  },
  sp3: {
    code: 'sp3',
    name: 'sp³ Hybridization Complete',
    count: 4,
    geometryName: 'Tetrahedral Geometry',
    angles: '109.5°',
    description: '1 s + 3 p orbitals mix to form 4 equivalent sp³ hybrid orbitals in 3D tetrahedral symmetry.',
  },
  sp3d: {
    code: 'sp3d',
    name: 'sp³d Hybridization Complete',
    count: 5,
    geometryName: 'Trigonal Bipyramidal Geometry',
    angles: '90° / 120°',
    description: '1 s + 3 p + 1 d orbitals mix to form 5 equivalent sp³d hybrid orbitals.',
  },
  sp3d2: {
    code: 'sp3d2',
    name: 'sp³d² Hybridization Complete',
    count: 6,
    geometryName: 'Octahedral Geometry',
    angles: '90°',
    description: '1 s + 3 p + 2 d orbitals mix to form 6 equivalent sp³d² hybrid orbitals.',
  },
};

// ── Direction Vectors for Hybrid Geometries ──────────────────────────────────
export const getHybridDirections = (code: string): THREE.Vector3[] => {
  switch (code) {
    case 'sp':
      return [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
      ];

    case 'sp2': {
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);
      return [
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(cos30, -sin30, 0),
        new THREE.Vector3(-cos30, -sin30, 0),
      ];
    }

    case 'sp3':
      return [
        new THREE.Vector3(0, 1.15, 0),
        new THREE.Vector3(1.08, -0.38, 0),
        new THREE.Vector3(-0.54, -0.38, 0.93),
        new THREE.Vector3(-0.54, -0.38, -0.93),
      ];

    case 'sp3d': {
      const cos30 = Math.cos(Math.PI / 6);
      const sin30 = Math.sin(Math.PI / 6);
      return [
        // 3 Equatorial (XZ plane)
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-sin30, 0, cos30),
        new THREE.Vector3(-sin30, 0, -cos30),
        // 2 Axial (Y axis)
        new THREE.Vector3(0, 1.1, 0),
        new THREE.Vector3(0, -1.1, 0),
      ];
    }

    case 'sp3d2':
      return [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ];

    default:
      return [];
  }
};

// ── Hybrid Lobe Quaternion Helper ──────────────────────────────────────────
export const getQuaternionFromDirection = (dir: THREE.Vector3): THREE.Quaternion => {
  const norm = dir.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  return new THREE.Quaternion().setFromUnitVectors(up, norm);
};
