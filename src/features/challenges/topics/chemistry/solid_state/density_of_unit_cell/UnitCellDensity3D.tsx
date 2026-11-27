"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type DensityCellType = "SC" | "BCC" | "FCC";

export interface UnitCellDensity3DProps {
  cellType: DensityCellType;
  edgeLengthPm: number;
  molarMass: number;
  zValue: number;
  autoRotate?: boolean;
  isInteracting?: boolean;
}

const L = 1.0;

const CORNER_POSITIONS: [number, number, number][] = [
  [-L, -L, -L],
  [L, -L, -L],
  [-L, L, -L],
  [L, L, -L],
  [-L, -L, L],
  [L, -L, L],
  [-L, L, L],
  [L, L, L],
];

const BODY_POSITION: [number, number, number] = [0, 0, 0];

const FACE_POSITIONS: [number, number, number][] = [
  [L, 0, 0],
  [-L, 0, 0],
  [0, L, 0],
  [0, -L, 0],
  [0, 0, L],
  [0, 0, -L],
];

function LatticeAtom({
  position,
  color,
  radius = 0.28,
  pulse = false,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
  pulse?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current || !pulse) return;
    const factor = 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.055;
    meshRef.current.scale.setScalar(factor);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.22} metalness={0.68} />
    </mesh>
  );
}

export default function UnitCellDensity3D({
  cellType,
  edgeLengthPm,
  molarMass,
  zValue,
  autoRotate = true,
  isInteracting = false,
}: UnitCellDensity3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle proportional scale based on edge length (a) and atom radius based on molar mass (M)
  const dynamicScale = 0.88 + ((edgeLengthPm - 250) / 150) * 0.24;
  const cornerRadius = 0.24 + ((molarMass - 40) / 40) * 0.08;
  const highlightExtra = zValue > 1;

  useFrame((_, delta) => {
    if (autoRotate && !isInteracting && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
    }
  });

  const edgeLines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const addEdge = (p1: [number, number, number], p2: [number, number, number]) => {
      pts.push(new THREE.Vector3(...p1));
      pts.push(new THREE.Vector3(...p2));
    };

    // Bottom 4 edges
    addEdge([-L, -L, -L], [L, -L, -L]);
    addEdge([L, -L, -L], [L, -L, L]);
    addEdge([L, -L, L], [-L, -L, L]);
    addEdge([-L, -L, L], [-L, -L, -L]);

    // Top 4 edges
    addEdge([-L, L, -L], [L, L, -L]);
    addEdge([L, L, -L], [L, L, L]);
    addEdge([L, L, L], [-L, L, L]);
    addEdge([-L, L, L], [-L, L, -L]);

    // Vertical 4 edges
    addEdge([-L, -L, -L], [-L, L, -L]);
    addEdge([L, -L, -L], [L, L, -L]);
    addEdge([L, -L, L], [L, L, L]);
    addEdge([-L, -L, L], [-L, L, L]);

    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  // Dimension bar geometry (front-bottom edge + end ticks)
  const dimensionLines = useMemo(() => {
    const y = -L - 0.22;
    const z = L + 0.12;
    const pts: THREE.Vector3[] = [
      new THREE.Vector3(-L, y, z),
      new THREE.Vector3(L, y, z),
      new THREE.Vector3(-L, y - 0.08, z),
      new THREE.Vector3(-L, y + 0.08, z),
      new THREE.Vector3(L, y - 0.08, z),
      new THREE.Vector3(L, y + 0.08, z),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const bodyDiagonals = useMemo(() => {
    const lines: THREE.Line[] = [];
    CORNER_POSITIONS.forEach((cp) => {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...cp),
        new THREE.Vector3(0, 0, 0),
      ]);
      const line = new THREE.Line(
        geom,
        new THREE.LineDashedMaterial({
          color: "#64748B",
          dashSize: 0.1,
          gapSize: 0.06,
          transparent: true,
          opacity: 0.55,
        })
      );
      line.computeLineDistances();
      lines.push(line);
    });
    return lines;
  }, []);

  const showBody = cellType === "BCC";
  const showFaces = cellType === "FCC";

  return (
    <group ref={groupRef} scale={dynamicScale}>
      {/* Cube wireframe */}
      <lineSegments geometry={edgeLines}>
        <lineBasicMaterial color="#0F172A" />
      </lineSegments>

      {/* Subtle translucent cube volume */}
      <mesh>
        <boxGeometry args={[2 * L, 2 * L, 2 * L]} />
        <meshStandardMaterial
          color="#E2E8F0"
          transparent
          opacity={0.08}
          roughness={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* BCC body-diagonal guides */}
      {showBody && (
        <group>
          {bodyDiagonals.map((lineObj, idx) => (
            <primitive key={`diag-${idx}`} object={lineObj} />
          ))}
        </group>
      )}

      {/* 8 Corner Atoms */}
      {CORNER_POSITIONS.map((pos, idx) => (
        <LatticeAtom key={`corner-${idx}`} position={pos} color="#0284C7" radius={cornerRadius} />
      ))}

      {/* Body-Center Atom (BCC) */}
      {showBody && (
        <LatticeAtom
          position={BODY_POSITION}
          color="#F59E0B"
          radius={cornerRadius + 0.05}
          pulse={highlightExtra}
        />
      )}

      {/* 6 Face-Center Atoms (FCC) */}
      {showFaces &&
        FACE_POSITIONS.map((pos, idx) => (
          <LatticeAtom
            key={`face-${idx}`}
            position={pos}
            color="#10B981"
            radius={cornerRadius}
            pulse={highlightExtra}
          />
        ))}

      {/* Edge-Length Dimension Callout */}
      <lineSegments geometry={dimensionLines}>
        <lineBasicMaterial color="#0284C7" />
      </lineSegments>
      <Html position={[0, -L - 0.4, L + 0.12]} center distanceFactor={6}>
        <div className="px-2 py-0.5 rounded-full bg-white/95 border border-sky-200 shadow-xs text-[10px] font-mono font-black text-sky-700 whitespace-nowrap select-none pointer-events-none">
          a = {edgeLengthPm} pm
        </div>
      </Html>
    </group>
  );
}

