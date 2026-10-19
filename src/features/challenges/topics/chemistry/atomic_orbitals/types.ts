export type SubshellType = 's' | 'p' | 'd';

export interface QuantumNumbers {
  n: number;
  l: number;
  ml: number;
}

export interface OrbitalItem {
  id: string; // 's', 'px', 'py', 'pz', 'dxy', 'dyz', 'dzx', 'dx2y2', 'dz2'
  name: string; // e.g. "s", "p_x", "p_y", "p_z", "d_xy", "d_yz", "d_zx", "d_x2-y2", "d_z2"
  displayName: string;
  subshell: SubshellType;
  quantumNumbers: QuantumNumbers;
  shapeDescription: string;
  nodalSurfaces: string;
}

export interface DropBoxSlot {
  id: string;
  targetOrbitalId: string; // matches OrbitalItem.id exactly
  label: string; // e.g. "DROP s", "DROP px", "DROP py"
  subLabel: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  filledWith: OrbitalItem | null;
}

export const INITIAL_DROP_BOXES_9: DropBoxSlot[] = [
  // Row 1: s, px, py
  {
    id: 'box-s',
    targetOrbitalId: 's',
    label: 'DROP s',
    subLabel: 'ORBITAL',
    borderColor: '#EA580C',
    bgColor: '#FFF7ED',
    textColor: '#C2410C',
    filledWith: null,
  },
  {
    id: 'box-px',
    targetOrbitalId: 'px',
    label: 'DROP px',
    subLabel: 'ORBITAL',
    borderColor: '#2563EB',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    filledWith: null,
  },
  {
    id: 'box-py',
    targetOrbitalId: 'py',
    label: 'DROP py',
    subLabel: 'ORBITAL',
    borderColor: '#0284C7',
    bgColor: '#F0F9FF',
    textColor: '#0369A1',
    filledWith: null,
  },
  // Row 2: pz, dxy, dyz
  {
    id: 'box-pz',
    targetOrbitalId: 'pz',
    label: 'DROP pz',
    subLabel: 'ORBITAL',
    borderColor: '#4F46E5',
    bgColor: '#EEF2FF',
    textColor: '#4338CA',
    filledWith: null,
  },
  {
    id: 'box-dxy',
    targetOrbitalId: 'dxy',
    label: 'DROP dxy',
    subLabel: 'ORBITAL',
    borderColor: '#0891B2',
    bgColor: '#ECFEFF',
    textColor: '#0E7490',
    filledWith: null,
  },
  {
    id: 'box-dyz',
    targetOrbitalId: 'dyz',
    label: 'DROP dyz',
    subLabel: 'ORBITAL',
    borderColor: '#7C3AED',
    bgColor: '#F5F3FF',
    textColor: '#6D28D9',
    filledWith: null,
  },
  // Row 3: dzx, dx2-y2, dz2
  {
    id: 'box-dzx',
    targetOrbitalId: 'dzx',
    label: 'DROP dzx',
    subLabel: 'ORBITAL',
    borderColor: '#9333EA',
    bgColor: '#FAF5FF',
    textColor: '#7E22CE',
    filledWith: null,
  },
  {
    id: 'box-dx2y2',
    targetOrbitalId: 'dx2y2',
    label: 'DROP dx²-y²',
    subLabel: 'ORBITAL',
    borderColor: '#D97706',
    bgColor: '#FFFBEB',
    textColor: '#B45309',
    filledWith: null,
  },
  {
    id: 'box-dz2',
    targetOrbitalId: 'dz2',
    label: 'DROP dz²',
    subLabel: 'ORBITAL',
    borderColor: '#3B82F6',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    filledWith: null,
  },
];

export const ORBITAL_DECK_9: OrbitalItem[] = [
  {
    id: 'dz2',
    name: 'd_z2',
    displayName: 'd(z²) Orbital',
    subshell: 'd',
    quantumNumbers: { n: 3, l: 2, ml: 0 },
    shapeDescription: 'Two elongated lobes along the z-axis with an equatorial doughnut torus around the xy waist.',
    nodalSurfaces: '2 conical nodal surfaces with apex at nucleus',
  },
  {
    id: 'px',
    name: 'p_x',
    displayName: 'p(x) Orbital',
    subshell: 'p',
    quantumNumbers: { n: 2, l: 1, ml: 1 },
    shapeDescription: 'Dumbbell-shaped orbital oriented along the x-axis with two opposing lobes (+/- phase).',
    nodalSurfaces: '1 planar node (yz-plane at x = 0)',
  },
  {
    id: 's',
    name: 's',
    displayName: 's Orbital',
    subshell: 's',
    quantumNumbers: { n: 1, l: 0, ml: 0 },
    shapeDescription: 'Spherically symmetric electron density distribution with maximum probability at the nucleus.',
    nodalSurfaces: '0 angular nodes (completely spherical)',
  },
  {
    id: 'dxy',
    name: 'd_xy',
    displayName: 'd(xy) Orbital',
    subshell: 'd',
    quantumNumbers: { n: 3, l: 2, ml: -2 },
    shapeDescription: 'Four-lobed cloverleaf lying in the xy-plane between the x and y axes.',
    nodalSurfaces: '2 planar nodes (xz-plane and yz-plane)',
  },
  {
    id: 'py',
    name: 'p_y',
    displayName: 'p(y) Orbital',
    subshell: 'p',
    quantumNumbers: { n: 2, l: 1, ml: -1 },
    shapeDescription: 'Dumbbell-shaped orbital oriented along the y-axis with two lobes (+/- phase).',
    nodalSurfaces: '1 planar node (xz-plane at y = 0)',
  },
  {
    id: 'dx2y2',
    name: 'd_x2-y2',
    displayName: 'd(x²-y²) Orbital',
    subshell: 'd',
    quantumNumbers: { n: 3, l: 2, ml: 2 },
    shapeDescription: 'Four-lobed cloverleaf lying directly along the x and y axes.',
    nodalSurfaces: '2 diagonal planar nodes at 45° (x = y and x = -y)',
  },
  {
    id: 'pz',
    name: 'p_z',
    displayName: 'p(z) Orbital',
    subshell: 'p',
    quantumNumbers: { n: 2, l: 1, ml: 0 },
    shapeDescription: 'Dumbbell-shaped orbital oriented along the z-axis with two lobes (+/- phase).',
    nodalSurfaces: '1 planar node (xy-plane at z = 0)',
  },
  {
    id: 'dyz',
    name: 'd_yz',
    displayName: 'd(yz) Orbital',
    subshell: 'd',
    quantumNumbers: { n: 3, l: 2, ml: -1 },
    shapeDescription: 'Four-lobed cloverleaf lying in the yz-plane between the y and z axes.',
    nodalSurfaces: '2 planar nodes (xy-plane and xz-plane)',
  },
  {
    id: 'dzx',
    name: 'd_zx',
    displayName: 'd(zx) Orbital',
    subshell: 'd',
    quantumNumbers: { n: 3, l: 2, ml: 1 },
    shapeDescription: 'Four-lobed cloverleaf lying in the xz-plane between the x and z axes.',
    nodalSurfaces: '2 planar nodes (xy-plane and yz-plane)',
  },
];
