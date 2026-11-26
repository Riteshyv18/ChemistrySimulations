"use client";

import React, { useRef, useMemo, useState } from "react";
import { useFrame, ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type LayerType = "A" | "B" | "C";

export interface CrystalPacking3DProps {
  placedLayers: LayerType[];
  canPlaceMore: boolean;
  selectedLayer: LayerType | null;
  isCompleted: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onAttemptPlace: () => void;
}

const LAYER_COLORS: Record<LayerType, string> = {
  A: "#0284C7", // Deep Sky Blue
  B: "#0D9488", // Teal
  C: "#F59E0B", // Amber Gold
};

// 7-atom hexagonal close-packed sheet (1 center + 6 neighbors at distance 1.0)
function getHexOffsets(layer: LayerType): [number, number][] {
  const ring: [number, number][] = [
    [0, 0],
    [1, 0],
    [0.5, 0.866],
    [-0.5, 0.866],
    [-1, 0],
    [-0.5, -0.866],
    [0.5, -0.866],
  ];
  // Lateral shift for A, B, and C close-packed hollows
  const shift: [number, number] =
    layer === "A"
      ? [0, 0]
      : layer === "B"
      ? [0.5, 0.289]
      : [-0.5, -0.289];

  return ring.map(([x, z]) => [x + shift[0], z + shift[1]]);
}

// Single sphere atom with smooth pop-in animation
function LayerAtom({
  position,
  color,
  radius = 0.44,
  opacity = 1,
}: {
  position: [number, number, number];
  color: string;
  radius?: number;
  opacity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, 1, delta * 12);
    meshRef.current.scale.setScalar(scaleRef.current);
  });

  return (
    <mesh ref={meshRef} position={position} scale={0}>
      <sphereGeometry args={[radius, 28, 28]} />
      <meshStandardMaterial
        color={color}
        roughness={0.22}
        metalness={0.5}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

// Pulsing highlighted target ghost layer above the placed stack
function TargetGhostLayer({
  layer,
  y,
  isHovered,
}: {
  layer: LayerType;
  y: number;
  isHovered: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const offsets = useMemo(() => getHexOffsets(layer), [layer]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 4.5) * 0.05;
    groupRef.current.scale.setScalar(isHovered ? 1.07 : pulse);
  });

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      {offsets.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh>
            <sphereGeometry args={[0.42, 20, 20]} />
            <meshBasicMaterial
              color={isHovered ? "#10B981" : "#38BDF8"}
              wireframe
              transparent
              opacity={isHovered ? 0.55 : 0.3}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.42, 24]} />
            <meshBasicMaterial
              color={isHovered ? "#10B981" : "#0284C7"}
              side={THREE.DoubleSide}
              transparent
              opacity={isHovered ? 0.65 : 0.35}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Loose draggable 7-atom sheet
function DraggableLooseLayer({
  layer,
  targetY,
  onDragStateChange,
  onAttemptPlace,
  onHoverTargetChange,
}: {
  layer: LayerType;
  targetY: number;
  onDragStateChange: (dragging: boolean) => void;
  onAttemptPlace: () => void;
  onHoverTargetChange: (hovered: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  const restPos = useMemo(() => new THREE.Vector3(0, targetY + 1.35, 0.65), [targetY]);
  const dragPos = useRef(new THREE.Vector3(0, targetY + 1.35, 0.65));
  const dragPlane = useMemo(() => new THREE.Plane(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  const offsets = useMemo(() => getHexOffsets(layer), [layer]);
  const color = LAYER_COLORS[layer];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!isDragging) {
      dragPos.current.lerp(restPos, delta * 8);
    }
    groupRef.current.position.copy(dragPos.current);
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    (e.target as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    onDragStateChange(true);

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    dragPlane.setFromNormalAndCoplanarPoint(camDir.negate(), dragPos.current);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(dragPlane, intersection)) {
      dragPos.current.copy(intersection);
      const targetCenter = new THREE.Vector3(0, targetY, 0);
      onHoverTargetChange(dragPos.current.distanceTo(targetCenter) < 1.15);
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    onDragStateChange(false);
    onHoverTargetChange(false);

    const targetCenter = new THREE.Vector3(0, targetY, 0);
    if (dragPos.current.distanceTo(targetCenter) < 1.15) {
      onAttemptPlace();
    }
    gl.domElement.style.cursor = "auto";
  };

  return (
    <group
      ref={groupRef}
      position={[restPos.x, restPos.y, restPos.z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerOver={() => {
        gl.domElement.style.cursor = "grab";
      }}
      onPointerOut={() => {
        if (!isDragging) gl.domElement.style.cursor = "auto";
      }}
    >
      {offsets.map(([x, z], idx) => (
        <mesh key={idx} position={[x, 0, z]}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial
            color={color}
            roughness={0.2}
            metalness={0.5}
            emissive={color}
            emissiveIntensity={isDragging ? 0.35 : 0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function CrystalPacking3D({
  placedLayers,
  canPlaceMore,
  selectedLayer,
  isCompleted,
  onDragStateChange,
  onAttemptPlace,
}: CrystalPacking3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const [isHoveringTarget, setIsHoveringTarget] = useState(false);

  const baseY = -1.15;
  const layerSpacing = 0.816;
  const targetY = baseY + placedLayers.length * layerSpacing;

  // Auto-rotate completed crystal to showcase ABAB / ABCABC packing
  useFrame((_, delta) => {
    if (!rootRef.current) return;
    if (isCompleted) {
      rootRef.current.rotation.y += delta * 0.65;
    } else {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, 0, delta * 5);
    }
  });

  return (
    <group ref={rootRef}>
      {/* Placed Close-Packed Layers */}
      {placedLayers.map((layer, layerIdx) => {
        const y = baseY + layerIdx * layerSpacing;
        const offsets = getHexOffsets(layer);
        const color = LAYER_COLORS[layer];
        return (
          <group key={`placed-${layerIdx}-${layer}`} position={[0, y, 0]}>
            {offsets.map(([x, z], atomIdx) => (
              <LayerAtom
                key={`atom-${layerIdx}-${atomIdx}`}
                position={[x, 0, z]}
                color={color}
                radius={0.44}
              />
            ))}
          </group>
        );
      })}

      {/* Highlighted Skeleton Target Zone above current stack */}
      {!isCompleted && canPlaceMore && (
        <TargetGhostLayer
          layer={selectedLayer || "A"}
          y={targetY}
          isHovered={false}
        />
      )}
    </group>
  );
}
