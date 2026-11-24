"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type SolidSampleType = "crystalline" | "amorphous";

export interface SolidSampleConfig {
  id: string;
  name: string;
  category: SolidSampleType;
  description: string;
  chemicalFormula: string;
  atomicSystem: "fcc" | "hexagonal" | "simple_cubic" | "amorphous_glass" | "amorphous_cluster";
  primaryColor: string;
  secondaryColor?: string;
  particleRadius: number;
  hint: string;
  modelScale?: number;
  modelOffset?: [number, number, number];
}

interface CrystalSolid3DProps {
  sample: SolidSampleConfig;
}

interface BondData {
  mid: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
}

export default function CrystalSolid3D({ sample }: CrystalSolid3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate particle positions and inter-atomic coordinate bonds
  const { particlesA, particlesB, bonds } = useMemo(() => {
    const pA: THREE.Vector3[] = [];
    const pB: THREE.Vector3[] = [];
    const rawPairs: [THREE.Vector3, THREE.Vector3][] = [];

    if (sample.atomicSystem === "hexagonal") {
      // Quartz Crystalline: 3 hexagonal layers stacked with connecting prismatic bonds
      const layers = 3;
      const layerHeight = 0.85;
      const ringRadius = 0.95;

      for (let l = 0; l < layers; l++) {
        const y = (l - 1) * layerHeight;
        const center = new THREE.Vector3(0, y, 0);
        pA.push(center);

        const ringPoints: THREE.Vector3[] = [];
        for (let i = 0; i < 6; i++) {
          const theta = (i * Math.PI) / 3;
          const pos = new THREE.Vector3(
            Math.cos(theta) * ringRadius,
            y,
            Math.sin(theta) * ringRadius
          );
          pB.push(pos);
          ringPoints.push(pos);
          rawPairs.push([center, pos]);
        }

        // Perimeter bonds within layer
        for (let i = 0; i < 6; i++) {
          rawPairs.push([ringPoints[i], ringPoints[(i + 1) % 6]]);
        }
      }

      // Vertical prismatic bonds between layers
      for (let l = 0; l < layers - 1; l++) {
        const center1 = pA[l];
        const center2 = pA[l + 1];
        rawPairs.push([center1, center2]);

        const startIdx = l * 6;
        for (let i = 0; i < 6; i++) {
          rawPairs.push([pB[startIdx + i], pB[startIdx + 6 + i]]);
        }
      }
    } else if (sample.atomicSystem === "fcc") {
      // Sodium Chloride (Rock Salt FCC): 3x3x3 alternating Na+ and Cl-
      const size = 3;
      const spacing = 0.82;
      const offset = ((size - 1) * spacing) / 2;
      const grid: (THREE.Vector3 | null)[][][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Array(size).fill(null))
      );

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const pos = new THREE.Vector3(
              x * spacing - offset,
              y * spacing - offset,
              z * spacing - offset
            );
            grid[x][y][z] = pos;
            if ((x + y + z) % 2 === 0) {
              pA.push(pos);
            } else {
              pB.push(pos);
            }
          }
        }
      }

      // Orthogonal lattice coordinate bonds along all 3 axes
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const cur = grid[x][y][z]!;
            if (x + 1 < size) rawPairs.push([cur, grid[x + 1][y][z]!]);
            if (y + 1 < size) rawPairs.push([cur, grid[x][y + 1][z]!]);
            if (z + 1 < size) rawPairs.push([cur, grid[x][y][z + 1]!]);
          }
        }
      }
    } else if (sample.atomicSystem === "simple_cubic") {
      // Metallic Crystal: 3x3x3 uniform cubic lattice
      const size = 3;
      const spacing = 0.85;
      const offset = ((size - 1) * spacing) / 2;
      const grid: (THREE.Vector3 | null)[][][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Array(size).fill(null))
      );

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const pos = new THREE.Vector3(
              x * spacing - offset,
              y * spacing - offset,
              z * spacing - offset
            );
            grid[x][y][z] = pos;
            pA.push(pos);
          }
        }
      }

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const cur = grid[x][y][z]!;
            if (x + 1 < size) rawPairs.push([cur, grid[x + 1][y][z]!]);
            if (y + 1 < size) rawPairs.push([cur, grid[x][y + 1][z]!]);
            if (z + 1 < size) rawPairs.push([cur, grid[x][y][z + 1]!]);
          }
        }
      }
    } else if (sample.atomicSystem === "amorphous_glass") {
      // Amorphous Silica Glass: Disordered 3D network with random bond angles
      const size = 3;
      const spacing = 0.82;
      const offset = ((size - 1) * spacing) / 2;

      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          for (let z = 0; z < size; z++) {
            const jx = Math.sin(x * 9.1 + y * 4.3 + z * 2.7) * 0.32;
            const jy = Math.cos(y * 7.5 + z * 5.1 + x * 3.3) * 0.32;
            const jz = Math.sin(z * 6.7 + x * 4.9 + y * 8.1) * 0.32;

            const pos = new THREE.Vector3(
              x * spacing - offset + jx,
              y * spacing - offset + jy,
              z * spacing - offset + jz
            );

            if ((x + y + z) % 2 === 0) {
              pA.push(pos);
            } else {
              pB.push(pos);
            }
          }
        }
      }

      const all = [...pA, ...pB];
      // Step 1: Distance-based neighbor bonds
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const d = all[i].distanceTo(all[j]);
          if (d > 0.62 && d < 1.15) {
            rawPairs.push([all[i], all[j]]);
          }
        }
      }

      // Step 2: Ensure EVERY single atom has at least 1-2 connections (no disconnected floating orphan atoms)
      for (let i = 0; i < all.length; i++) {
        const hasBond = rawPairs.some(([start, end]) => start === all[i] || end === all[i]);
        if (!hasBond) {
          // Find closest neighbor and connect
          let closestIdx = -1;
          let minDist = Infinity;
          for (let j = 0; j < all.length; j++) {
            if (i === j) continue;
            const d = all[i].distanceTo(all[j]);
            if (d < minDist) {
              minDist = d;
              closestIdx = j;
            }
          }
          if (closestIdx !== -1) {
            rawPairs.push([all[i], all[closestIdx]]);
          }
        }
      }
    } else {
      // Amorphous cluster (Rubber / Polymer glass)
      const count = 28;
      const radius = 1.15;

      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
        const theta = Math.PI * (1 + 5 ** 0.5) * i;
        const r = radius * (0.55 + 0.45 * Math.sin(i * 3.3) ** 2);

        const pos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );

        if (i % 2 === 0) {
          pA.push(pos);
        } else {
          pB.push(pos);
        }
      }

      const all = [...pA, ...pB];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const d = all[i].distanceTo(all[j]);
          if (d > 0.58 && d < 1.05) {
            rawPairs.push([all[i], all[j]]);
          }
        }
      }

      // Ensure every cluster atom is connected
      for (let i = 0; i < all.length; i++) {
        const hasBond = rawPairs.some(([start, end]) => start === all[i] || end === all[i]);
        if (!hasBond) {
          let closestIdx = -1;
          let minDist = Infinity;
          for (let j = 0; j < all.length; j++) {
            if (i === j) continue;
            const d = all[i].distanceTo(all[j]);
            if (d < minDist) {
              minDist = d;
              closestIdx = j;
            }
          }
          if (closestIdx !== -1) {
            rawPairs.push([all[i], all[closestIdx]]);
          }
        }
      }
    }

    // Convert pairs to properly aligned cylinder transformations (Y-axis aligned)
    const yAxis = new THREE.Vector3(0, 1, 0);
    const computedBonds: BondData[] = rawPairs.map(([start, end]) => {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const dir = new THREE.Vector3().subVectors(end, start);
      const length = dir.length();
      dir.normalize();

      const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, dir);
      return { mid, quaternion, length };
    });

    return { particlesA: pA, particlesB: pB, bonds: computedBonds };
  }, [sample.atomicSystem]);

  // Gentle auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      scale={sample.modelScale ?? 1.0}
      position={sample.modelOffset ?? [0, 0, 0]}
    >
      {/* Primary Atoms */}
      {particlesA.map((pos, idx) => (
        <mesh key={`pA-${idx}`} position={pos} castShadow receiveShadow>
          <sphereGeometry args={[sample.particleRadius, 24, 24]} />
          <meshStandardMaterial
            color={sample.primaryColor}
            roughness={0.22}
            metalness={0.3}
            emissive={sample.primaryColor}
            emissiveIntensity={0.16}
          />
        </mesh>
      ))}

      {/* Secondary Atoms */}
      {particlesB.map((pos, idx) => (
        <mesh key={`pB-${idx}`} position={pos} castShadow receiveShadow>
          <sphereGeometry args={[sample.particleRadius * 0.9, 24, 24]} />
          <meshStandardMaterial
            color={sample.secondaryColor || sample.primaryColor}
            roughness={0.22}
            metalness={0.35}
            emissive={sample.secondaryColor || sample.primaryColor}
            emissiveIntensity={0.18}
          />
        </mesh>
      ))}

      {/* Coordinate Lattice Bonds (Accurately Oriented Connecting Rods) */}
      {bonds.map((b, idx) => (
        <mesh
          key={`bond-${idx}`}
          position={b.mid}
          quaternion={b.quaternion}
        >
          <cylinderGeometry args={[0.024, 0.024, b.length, 10]} />
          <meshStandardMaterial
            color="#94A3B8"
            metalness={0.4}
            roughness={0.35}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
