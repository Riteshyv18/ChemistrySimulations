'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

// Phase Colors matching standard physical chemistry conventions (Image 3)
const PHASE_RED = '#EF4444'; // Positive (+) lobe
const PHASE_BLUE = '#2563EB'; // Negative (-) lobe / Torus

interface OrbitalProps {
  autoRotate?: boolean;
}

// ── 3D COORDINATE AXES (x, -x, y, -y, z, -z matching Image 3) ───────────────
export function CoordinateAxes3D({ hideLabels = false }: { hideLabels?: boolean }) {
  const AXIS_LEN = 1.82;
  const ARROW_LEN = 0.24;
  const ARROW_RAD = 0.08;
  const LINE_RAD = 0.022;

  return (
    <group>
      {/* ── Z AXIS (Vertical Up is +z, Down is -z) ── */}
      {/* Positive Z (Up) */}
      <mesh position={[0, (AXIS_LEN - ARROW_LEN) / 2, 0]}>
        <cylinderGeometry args={[LINE_RAD, LINE_RAD, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} />
      </mesh>
      {/* Arrowhead at +z */}
      <mesh position={[0, AXIS_LEN - ARROW_LEN / 2, 0]}>
        <coneGeometry args={[ARROW_RAD, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Negative Z (Down) */}
      <mesh position={[0, -(AXIS_LEN - ARROW_LEN) / 2, 0]}>
        <cylinderGeometry args={[LINE_RAD * 0.9, LINE_RAD * 0.9, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* Arrowhead at -z */}
      <mesh position={[0, -(AXIS_LEN - ARROW_LEN / 2), 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[ARROW_RAD * 0.85, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* ── Y AXIS (Horizontal Right is +y, Left is -y) ── */}
      {/* Positive Y (Right) */}
      <mesh position={[(AXIS_LEN - ARROW_LEN) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[LINE_RAD, LINE_RAD, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} />
      </mesh>
      {/* Arrowhead at +y */}
      <mesh position={[AXIS_LEN - ARROW_LEN / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[ARROW_RAD, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Negative Y (Left) */}
      <mesh position={[-(AXIS_LEN - ARROW_LEN) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[LINE_RAD * 0.9, LINE_RAD * 0.9, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* Arrowhead at -y */}
      <mesh position={[-(AXIS_LEN - ARROW_LEN / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[ARROW_RAD * 0.85, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* ── X AXIS (Perspective Forward is +x, Backward is -x) ── */}
      {/* Positive X (Forward) */}
      <mesh position={[0, 0, (AXIS_LEN - ARROW_LEN) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LINE_RAD, LINE_RAD, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} />
      </mesh>
      {/* Arrowhead at +x */}
      <mesh position={[0, 0, AXIS_LEN - ARROW_LEN / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[ARROW_RAD, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Negative X (Backward) */}
      <mesh position={[0, 0, -(AXIS_LEN - ARROW_LEN) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[LINE_RAD * 0.9, LINE_RAD * 0.9, AXIS_LEN - ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* Arrowhead at -x */}
      <mesh position={[0, 0, -(AXIS_LEN - ARROW_LEN / 2)]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[ARROW_RAD * 0.85, ARROW_LEN, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* ── LABELS: x, -x, y, -y, z, -z (Non-wrapping, crisp badges) ── */}
      {!hideLabels && (
        <>
          {/* +z label (Up) */}
          <Html position={[0, AXIS_LEN + 0.16, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-black text-xs text-slate-900 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              z
            </div>
          </Html>
          {/* -z label (Down) */}
          <Html position={[0, -AXIS_LEN - 0.16, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-bold text-[11px] text-slate-700 bg-white/95 px-1 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              -z
            </div>
          </Html>

          {/* +y label (Right) */}
          <Html position={[AXIS_LEN + 0.16, 0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-black text-xs text-slate-900 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              y
            </div>
          </Html>
          {/* -y label (Left) */}
          <Html position={[-AXIS_LEN - 0.16, 0, 0]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-bold text-[11px] text-slate-700 bg-white/95 px-1 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              -y
            </div>
          </Html>

          {/* +x label (Forward) */}
          <Html position={[0, 0, AXIS_LEN + 0.16]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-black text-xs text-slate-900 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              x
            </div>
          </Html>
          {/* -x label (Backward) */}
          <Html position={[0, 0, -AXIS_LEN - 0.16]} center style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            <div style={{ whiteSpace: 'nowrap' }} className="font-mono font-bold text-[11px] text-slate-700 bg-white/95 px-1 py-0.5 rounded shadow-sm border border-slate-300 select-none">
              -x
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// Helper: Custom teardrop lobe geometry for p and d orbitals
function TeardropLobe({
  color,
  direction = [0, 1, 0],
  scale = 1,
}: {
  color: string;
  direction?: [number, number, number];
  scale?: number;
}) {
  const rotation = useMemo(() => {
    const dir = new THREE.Vector3(...direction).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [direction]);

  return (
    <group rotation={rotation}>
      <mesh position={[0, 0.88 * scale, 0]} scale={[0.54 * scale, 0.94 * scale, 0.54 * scale]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.18}
          metalness={0.12}
          emissive={color}
          emissiveIntensity={0.16}
        />
      </mesh>
    </group>
  );
}

// ── 1. s Orbital (l = 0, m = 0) ──────────────────────────────────────────────
export function OrbitalSMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      {/* 3D Coordinate Axes */}
      <CoordinateAxes3D />

      {/* Outer translucent spherical cloud */}
      <mesh>
        <sphereGeometry args={[1.5, 36, 36]} />
        <meshStandardMaterial
          color="#3B82F6"
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      {/* Inner dense core */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshStandardMaterial
          color="#1D4ED8"
          roughness={0.2}
          metalness={0.3}
          emissive="#1E40AF"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 2. p_x Orbital (Along X axis: Forward +x Red, Backward -x Blue) ──────────
export function OrbitalPxMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* +x Lobe (Red, Forward along X axis) */}
      <TeardropLobe color={PHASE_RED} direction={[0, 0, 1]} scale={0.88} />
      {/* -x Lobe (Blue, Backward along X axis) */}
      <TeardropLobe color={PHASE_BLUE} direction={[0, 0, -1]} scale={0.88} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 3. p_y Orbital (Along Y axis: Right +y Red, Left -y Blue) ────────────────
export function OrbitalPyMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* +y Lobe (Red, Right along Y axis) */}
      <TeardropLobe color={PHASE_RED} direction={[1, 0, 0]} scale={0.88} />
      {/* -y Lobe (Blue, Left along Y axis) */}
      <TeardropLobe color={PHASE_BLUE} direction={[-1, 0, 0]} scale={0.88} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 4. p_z Orbital (Along Z axis: Up +z Red, Down -z Blue) ───────────────────
export function OrbitalPzMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* +z Lobe (Red, Up along Z axis) */}
      <TeardropLobe color={PHASE_RED} direction={[0, 1, 0]} scale={0.88} />
      {/* -z Lobe (Blue, Down along Z axis) */}
      <TeardropLobe color={PHASE_BLUE} direction={[0, -1, 0]} scale={0.88} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 5. d_xy Orbital (Cloverleaf in XY plane between X and Y axes) ─────────────
export function OrbitalDxyMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  const d = Math.SQRT1_2; // 0.7071

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* Four lobes in horizontal XY plane at 45° between X and Y axes */}
      <TeardropLobe color={PHASE_RED} direction={[d, 0, d]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[-d, 0, d]} scale={0.84} />
      <TeardropLobe color={PHASE_RED} direction={[-d, 0, -d]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[d, 0, -d]} scale={0.84} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 6. d_yz Orbital (Cloverleaf in YZ plane between Y and Z axes, Image 3) ───
export function OrbitalDyzMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  const d = Math.SQRT1_2;

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* Four lobes in vertical YZ plane at 45° between Y (right) and Z (up) */}
      <TeardropLobe color={PHASE_RED} direction={[d, d, 0]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[-d, d, 0]} scale={0.84} />
      <TeardropLobe color={PHASE_RED} direction={[-d, -d, 0]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[d, -d, 0]} scale={0.84} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 7. d_zx Orbital (Cloverleaf in XZ plane between X and Z axes, Image 3) ───
export function OrbitalDzxMesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  const d = Math.SQRT1_2;

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* Four lobes in vertical XZ plane at 45° between X (forward) and Z (up) */}
      <TeardropLobe color={PHASE_RED} direction={[0, d, d]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[0, d, -d]} scale={0.84} />
      <TeardropLobe color={PHASE_RED} direction={[0, -d, -d]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[0, -d, d]} scale={0.84} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 8. d_x2-y2 Orbital (Cloverleaf along X and Y axes) ─────────────────────────
export function OrbitalDx2y2Mesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* Lobes along X axis (Forward/Back, Red + phase) */}
      <TeardropLobe color={PHASE_RED} direction={[0, 0, 1]} scale={0.84} />
      <TeardropLobe color={PHASE_RED} direction={[0, 0, -1]} scale={0.84} />

      {/* Lobes along Y axis (Right/Left, Blue - phase) */}
      <TeardropLobe color={PHASE_BLUE} direction={[1, 0, 0]} scale={0.84} />
      <TeardropLobe color={PHASE_BLUE} direction={[-1, 0, 0]} scale={0.84} />

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── 9. d_z2 Orbital (Vertical Z Lobes + Toroidal Doughnut Ring, Image 3) ───────
export function OrbitalDz2Mesh({ autoRotate = false }: OrbitalProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  return (
    <group ref={groupRef} scale={0.7}>
      <CoordinateAxes3D />

      {/* Vertical Upper Lobe (+z, Red) */}
      <TeardropLobe color={PHASE_RED} direction={[0, 1, 0]} scale={0.92} />

      {/* Vertical Lower Lobe (-z, Red) */}
      <TeardropLobe color={PHASE_RED} direction={[0, -1, 0]} scale={0.92} />

      {/* Equatorial Toroidal Doughnut Ring in XY plane (Blue, - phase) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.34, 28, 48]} />
        <meshStandardMaterial
          color={PHASE_BLUE}
          roughness={0.18}
          metalness={0.15}
          emissive={PHASE_BLUE}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

// ── Dispatcher for rendering any orbital by ID ──────────────────────────────
export function OrbitalRenderer({
  orbitalId,
  autoRotate = false,
}: {
  orbitalId: string;
  autoRotate?: boolean;
}) {
  switch (orbitalId) {
    case 's':
      return <OrbitalSMesh autoRotate={autoRotate} />;
    case 'px':
      return <OrbitalPxMesh autoRotate={autoRotate} />;
    case 'py':
      return <OrbitalPyMesh autoRotate={autoRotate} />;
    case 'pz':
      return <OrbitalPzMesh autoRotate={autoRotate} />;
    case 'dxy':
      return <OrbitalDxyMesh autoRotate={autoRotate} />;
    case 'dyz':
      return <OrbitalDyzMesh autoRotate={autoRotate} />;
    case 'dzx':
      return <OrbitalDzxMesh autoRotate={autoRotate} />;
    case 'dx2y2':
      return <OrbitalDx2y2Mesh autoRotate={autoRotate} />;
    case 'dz2':
    default:
      return <OrbitalDz2Mesh autoRotate={autoRotate} />;
  }
}

// ── Unified Orbital 3D Viewport with OrbitControls & Balanced Zoom ──────────
export function Orbital3DCanvas({
  orbitalId,
  autoRotate = false,
}: {
  orbitalId: string;
  autoRotate?: boolean;
}) {
  return (
    <>
      <color attach="background" args={['#FFFFFF']} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-5, -4, -5]} intensity={0.5} />
      <pointLight position={[0, 4, 3]} intensity={0.6} color="#FFFFFF" />

      {/* Render the specific orbital with Coordinate Axes (Zoomed in to fill card nicely) */}
      <group scale={0.99}>
        <OrbitalRenderer orbitalId={orbitalId} autoRotate={autoRotate} />
      </group>

      {/* User can inspect orbital from any angle */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={(7 * Math.PI) / 8}
      />
    </>
  );
}
