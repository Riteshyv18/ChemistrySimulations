"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type CubicCellType = "SC" | "BCC" | "FCC";

export interface LatticePosition {
  id: string;
  type: "corner" | "body" | "face";
  pos: [number, number, number];
  label: string;
}

export interface UnitCell3DProps {
  hasCorners: boolean;
  hasBody: boolean;
  hasFaces: boolean;
  atomColor?: string;
  wireframeColor?: string;
  showGhostNodes?: boolean;
  autoRotate?: boolean;
}

// Cubic lattice coordinate constants (Unit cube centered at origin with half-side L)
const L = 1.0; // half length -> edge length = 2.0

export const CORNER_POSITIONS: [number, number, number][] = [
  [-L, -L, -L],
  [L, -L, -L],
  [-L, L, -L],
  [L, L, -L],
  [-L, -L, L],
  [L, -L, L],
  [-L, L, L],
  [L, L, L],
];

export const BODY_POSITION: [number, number, number] = [0, 0, 0];

export const FACE_POSITIONS: [number, number, number][] = [
  [L, 0, 0],  // Right face
  [-L, 0, 0], // Left face
  [0, L, 0],  // Top face
  [0, -L, 0], // Bottom face
  [0, 0, L],  // Front face
  [0, 0, -L], // Back face
];

// Single Atom Component with smooth pop-in animation
function AnimatedAtom({
  position,
  color,
  radius = 0.32,
  pulse = false,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
  pulse?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetScale = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    targetScale.current = THREE.MathUtils.lerp(targetScale.current, 1, delta * 10);
    const pulseFactor = pulse ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 : 1;
    meshRef.current.scale.setScalar(targetScale.current * pulseFactor);
  });

  return (
    <mesh ref={meshRef} position={position} scale={0}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

// Ghost placement node (indicator ring / sphere where atoms can snap)
function GhostNode({ position, label }: { position: [number, number, number]; label?: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#1E293B" wireframe opacity={0.75} transparent />
      </mesh>
      <mesh>
        <ringGeometry args={[0.09, 0.13, 24]} />
        <meshBasicMaterial color="#0F172A" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

export default function UnitCell3D({
  hasCorners,
  hasBody,
  hasFaces,
  atomColor = "#0284C7", // Bright cyan/blue
  wireframeColor = "#0F172A", // Deep dark contrast for unit cell frame
  showGhostNodes = true,
  autoRotate = false,
}: UnitCell3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle slow auto rotation if enabled
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  // Cube frame edges
  const edgeLines = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const addEdge = (p1: [number, number, number], p2: [number, number, number]) => {
      pts.push(new THREE.Vector3(...p1));
      pts.push(new THREE.Vector3(...p2));
    };

    // 4 Bottom edges
    addEdge([-L, -L, -L], [L, -L, -L]);
    addEdge([L, -L, -L], [L, -L, L]);
    addEdge([L, -L, L], [-L, -L, L]);
    addEdge([-L, -L, L], [-L, -L, -L]);

    // 4 Top edges
    addEdge([-L, L, -L], [L, L, -L]);
    addEdge([L, L, -L], [L, L, L]);
    addEdge([L, L, L], [-L, L, L]);
    addEdge([-L, L, L], [-L, L, -L]);

    // 4 Vertical connecting edges
    addEdge([-L, -L, -L], [-L, L, -L]);
    addEdge([L, -L, -L], [L, L, -L]);
    addEdge([L, -L, L], [L, L, L]);
    addEdge([-L, -L, L], [-L, L, L]);

    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return geom;
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── 1. Cube Wireframe Frame ── */}
      <lineSegments geometry={edgeLines}>
        <lineBasicMaterial color={wireframeColor} linewidth={2} />
      </lineSegments>

      {/* ── 2. Subtle Semi-Transparent Unit Cell Box Faces ── */}
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

      {/* ── 3. Coordinate Origin & Axis Grid Guides ── */}
      {/* Dark dotted diagonals or centre guide if body atom placed */}
      {hasBody && (
        <group>
          {CORNER_POSITIONS.map((cp, idx) => {
            const lineGeom = new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(...cp),
              new THREE.Vector3(0, 0, 0),
            ]);
            const line = new THREE.Line(
              lineGeom,
              new THREE.LineDashedMaterial({
                color: "#0F172A",
                dashSize: 0.12,
                gapSize: 0.06,
                transparent: true,
                opacity: 0.75,
              })
            );
            line.computeLineDistances();
            return <primitive key={`body-line-${idx}`} object={line} />;
          })}
        </group>
      )}

      {/* ── 4. Ghost Target Nodes (Visible when position is empty) ── */}
      {showGhostNodes && (
        <group>
          {!hasCorners &&
            CORNER_POSITIONS.map((pos, idx) => (
              <GhostNode key={`ghost-corner-${idx}`} position={pos} label="Corner" />
            ))}
          {!hasBody && <GhostNode position={BODY_POSITION} label="Body Centre" />}
          {!hasFaces &&
            FACE_POSITIONS.map((pos, idx) => (
              <GhostNode key={`ghost-face-${idx}`} position={pos} label="Face Centre" />
            ))}
        </group>
      )}

      {/* ── 5. Placed Atoms (Lustrous PBR Spheres) ── */}
      {/* 8 Corners */}
      {hasCorners && (
        <group>
          {CORNER_POSITIONS.map((pos, idx) => (
            <AnimatedAtom
              key={`atom-corner-${idx}`}
              position={pos}
              color={atomColor}
              radius={0.30}
            />
          ))}
        </group>
      )}

      {/* 1 Body Centre */}
      {hasBody && (
        <AnimatedAtom
          position={BODY_POSITION}
          color="#F59E0B" // Amber/Golden highlight for central body atom
          radius={0.34}
          pulse
        />
      )}

      {/* 6 Face Centres */}
      {hasFaces && (
        <group>
          {FACE_POSITIONS.map((pos, idx) => (
            <AnimatedAtom
              key={`atom-face-${idx}`}
              position={pos}
              color="#10B981" // Emerald green highlight for face-centred atoms
              radius={0.30}
            />
          ))}
        </group>
      )}
    </group>
  );
}
