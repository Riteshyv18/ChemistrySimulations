"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  useCarbonylStructureStore,
  MOLECULE_POLARITY_LIST,
} from "./CarbonylStructureStore";

// ============================================================================
// Helper: 3D Bond Cylinder Between Two Vectors
// ============================================================================
function SimpleBond({
  from,
  to,
  radius = 0.05,
  color = "#94a3b8",
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const len = dir.length();

    // Three.js CylinderGeometry is aligned with Y axis by default [0, 1, 0]
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );

    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
    </mesh>
  );
}

// Double bond representation with offset parallel cylinders
function DoubleBond({
  from,
  to,
  radius = 0.04,
  offset = 0.08,
  color = "#94a3b8",
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  offset?: number;
  color?: string;
}) {
  const { position, quaternion, length, offsetDir } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const bondAxis = new THREE.Vector3().subVectors(vTo, vFrom).normalize();
    const len = vFrom.distanceTo(vTo);

    // Default cylinder points along Y [0, 1, 0]
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      bondAxis
    );

    // Compute perpendicular in-plane vector for parallel bond offset
    // Since molecules are in the XY plane, Z=[0,0,1] is normal to plane
    const normal = new THREE.Vector3(0, 0, 1);
    let perp = new THREE.Vector3().crossVectors(bondAxis, normal).normalize();
    if (perp.lengthSq() < 0.01) {
      perp = new THREE.Vector3(1, 0, 0);
    }

    return { position: mid, quaternion: quat, length: len, offsetDir: perp };
  }, [from, to]);

  const p1 = new THREE.Vector3().addScaledVector(offsetDir, -offset);
  const p2 = new THREE.Vector3().addScaledVector(offsetDir, offset);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[p1.x, 0, p1.z]}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[p2.x, 0, p2.z]}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Helper: Atom Sphere with Clean Centered Letter & Subtle Halo
// ============================================================================
function AtomSphere({
  position,
  radius,
  color,
  label,
  chargeLabel,
  chargeType,
  hideHtml = false,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  label?: string;
  chargeLabel?: string;
  chargeType?: "pos" | "neg";
  hideHtml?: boolean;
}) {
  const isHydrogen = label === "H" || label === "H₁" || label === "H₂";

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.1} />
      </mesh>

      {/* Partial charge halo glow */}
      {chargeType && (
        <mesh>
          <sphereGeometry args={[radius * 1.3, 16, 16]} />
          <meshBasicMaterial
            color={chargeType === "pos" ? "#38bdf8" : "#f87171"}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Element Symbol directly inside the atom sphere center (matching standard chemistry style) */}
      {label && !hideHtml && (
        <Html center distanceFactor={8} zIndexRange={[10, 0]} className="pointer-events-none select-none">
          <span
            className={`font-black text-xs tracking-wider select-none pointer-events-none ${
              isHydrogen
                ? "text-slate-900"
                : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            }`}
          >
            {label}
          </span>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Helper: 3D Dipole Vector Arrow (Pointing from + to -)
// ============================================================================
function DipoleVectorArrow({
  from,
  to,
  magnitude,
  label = "μ",
  hideHtml = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  magnitude: number;
  label?: string;
  hideHtml?: boolean;
}) {
  const vFrom = useMemo(() => new THREE.Vector3(...from), [from]);
  const vTo = useMemo(() => new THREE.Vector3(...to), [to]);
  const dir = useMemo(() => new THREE.Vector3().subVectors(vTo, vFrom).normalize(), [vFrom, vTo]);

  const arrowRot = useMemo(() => {
    const m = new THREE.Matrix4();
    m.lookAt(vFrom, vTo, new THREE.Vector3(0, 0, 1));
    return new THREE.Euler().setFromRotationMatrix(m);
  }, [vFrom, vTo]);

  if (magnitude < 0.1) return null;

  return (
    <group>
      {/* Shaft */}
      <SimpleBond from={from} to={to} radius={0.035} color="#0284c7" />

      {/* Arrowhead at target */}
      <mesh position={to} rotation={arrowRot}>
        <coneGeometry args={[0.12, 0.28, 16]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>

      {/* Crossbar at positive tail (standard IUPAC dipole convention ↦) */}
      <mesh position={[from[0] + dir.x * 0.15, from[1] + dir.y * 0.15, from[2] + dir.z * 0.15]} rotation={arrowRot}>
        <boxGeometry args={[0.22, 0.035, 0.035]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>

      {!hideHtml && (
        <Html position={[to[0] + 0.1, to[1] + 0.35, 0]} center distanceFactor={7} zIndexRange={[10, 0]} className="pointer-events-none select-none">
          <div className="bg-sky-50 border border-sky-300 text-sky-800 px-2 py-0.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap shadow-xs">
            {label} = {magnitude.toFixed(2)} D
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Helper: Translucent Perpendicular π-Orbital Lobes
// ============================================================================
function PiOrbitalLobes({
  position,
  colorTop = "#3b82f6",
  colorBottom = "#ef4444",
  scale = 1.0,
}: {
  position: [number, number, number];
  colorTop?: string;
  colorBottom?: string;
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Top Lobe (+z, positive phase): oriented along Z axis (perpendicular to molecule in XY plane) */}
      <group position={[0, 0, 0.45]} scale={[0.22, 0.22, 0.42]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={colorTop} transparent opacity={0.45} roughness={0.1} />
      </group>

      {/* Bottom Lobe (-z, negative phase): oriented along -Z axis */}
      <group position={[0, 0, -0.45]} scale={[0.22, 0.22, 0.42]}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={colorBottom} transparent opacity={0.45} roughness={0.1} />
      </group>
    </group>
  );
}

// ============================================================================
// Helper: Dashed Hydrogen Bond Beam
// ============================================================================
function DashedHBond({
  from,
  to,
  isLocked,
}: {
  from: [number, number, number];
  to: [number, number, number];
  isLocked: boolean;
  distance?: number;
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const count = 12;
    for (let i = 0; i <= count; i++) {
      pts.push(new THREE.Vector3().lerpVectors(vFrom, vTo, i / count));
    }
    return pts;
  }, [from, to]);

  return (
    <group>
      {/* Dotted indicator segments */}
      {points.map((pt, idx) =>
        idx % 2 === 0 ? (
          <mesh key={idx} position={pt}>
            <sphereGeometry args={[isLocked ? 0.03 : 0.02, 8, 8]} />
            <meshBasicMaterial color={isLocked ? "#10b981" : "#38bdf8"} transparent opacity={0.85} />
          </mesh>
        ) : null
      )}
    </group>
  );
}

// ============================================================================
// Helper: 3D Angle Arc with Clean Degree Label
// ============================================================================
function AngleArcBetweenBonds({
  center,
  v1,
  v2,
  angleDeg,
  radius = 0.55,
  hideHtml = false,
}: {
  center: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  angleDeg: number;
  radius?: number;
  hideHtml?: boolean;
}) {
  const { linePoints, labelPos } = useMemo(() => {
    const c = new THREE.Vector3(...center);
    const d1 = new THREE.Vector3(...v1).sub(c).normalize();
    const d2 = new THREE.Vector3(...v2).sub(c).normalize();

    // Generate arc curve between d1 and d2
    const pts: THREE.Vector3[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const v = new THREE.Vector3().lerpVectors(d1, d2, t).normalize().multiplyScalar(radius).add(c);
      pts.push(v);
    }

    // Midpoint for the clean small label
    const mid = new THREE.Vector3().lerpVectors(d1, d2, 0.5).normalize().multiplyScalar(radius + 0.22).add(c);

    return { linePoints: pts, labelPos: mid };
  }, [center, v1, v2, radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(linePoints);
  }, [linePoints]);

  return (
    <group>
      {/* Smooth 3D curved arc line using primitive */}
      <primitive
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 })
          )
        }
      />

      {/* Tiny clean circular angle tag */}
      {!hideHtml && (
        <Html position={[labelPos.x, labelPos.y, labelPos.z]} center distanceFactor={6} zIndexRange={[10, 0]} className="pointer-events-none select-none">
          <span className="font-mono font-black text-[11px] text-sky-800 bg-white/95 px-1.5 py-0.5 rounded-full border border-sky-300 shadow-xs whitespace-nowrap">
            {angleDeg.toFixed(1)}°
          </span>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Stage 1: Carbonyl sp² Planarity & π-Orbital Frame
// ============================================================================
function Stage1CarbonylPlanarScene({ hideHtml = false }: { hideHtml?: boolean }) {
  const { stage1MeasuredAngle } = useCarbonylStructureStore();

  // Formaldehyde (HCHO) coordinates in XY plane (coplanar, Z = 0)
  const posC: [number, number, number] = [0, 0, 0];
  const posO: [number, number, number] = [0, 1.45, 0];
  // Calculate H positions from measured angle
  const rad = (stage1MeasuredAngle * Math.PI) / 180.0 / 2.0;
  const posH1: [number, number, number] = [-1.15 * Math.sin(rad), -1.15 * Math.cos(rad), 0];
  const posH2: [number, number, number] = [1.15 * Math.sin(rad), -1.15 * Math.cos(rad), 0];

  return (
    <group>
      {/* Atoms */}
      <AtomSphere position={posC} radius={0.34} color="#334155" label="C" chargeLabel="δ+" chargeType="pos" hideHtml={hideHtml} />
      <AtomSphere position={posO} radius={0.38} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={hideHtml} />
      <AtomSphere position={posH1} radius={0.22} color="#f8fafc" label="H" hideHtml={hideHtml} />
      <AtomSphere position={posH2} radius={0.22} color="#f8fafc" label="H" hideHtml={hideHtml} />

      {/* Bonds */}
      <DoubleBond from={posC} to={posO} radius={0.045} offset={0.075} color="#94a3b8" />
      <SimpleBond from={posC} to={posH1} radius={0.038} color="#cbd5e1" />
      <SimpleBond from={posC} to={posH2} radius={0.038} color="#cbd5e1" />

      {/* Planar Reference Grid / Ring Plane */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 2.3, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* 3D Arc between the two C-H bonds */}
      <AngleArcBetweenBonds
        center={posC}
        v1={posH1}
        v2={posH2}
        angleDeg={stage1MeasuredAngle}
        radius={0.55}
        hideHtml={hideHtml}
      />
    </group>
  );
}

// ============================================================================
// Stage 2: Carbonyl Dipole Vector & Polarity Hierarchy
// ============================================================================
function Stage2DipolePolarityScene({ modalActive = false }: { modalActive?: boolean }) {
  const { selectedMolecule } = useCarbonylStructureStore();

  return (
    <group position={[0, -0.1, 0]}>
      {selectedMolecule === "propane" && (
        <group>
          {/* Propane: Symmetrical Non-polar Alkane CH3-CH2-CH3 */}
          <AtomSphere position={[-1.25, -0.45, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />
          <AtomSphere position={[0, 0.35, 0]} radius={0.34} color="#334155" label="CH₂" hideHtml={modalActive} />
          <AtomSphere position={[1.25, -0.45, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />

          <SimpleBond from={[-1.25, -0.45, 0]} to={[0, 0.35, 0]} radius={0.045} />
          <SimpleBond from={[0, 0.35, 0]} to={[1.25, -0.45, 0]} radius={0.045} />
        </group>
      )}

      {selectedMolecule === "acetone" && (
        <group>
          {/* Acetone: Polar Carbonyl CH3-COCH3 */}
          <AtomSphere position={[0, 0, 0]} radius={0.34} color="#334155" label="C" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />
          <AtomSphere position={[0, 1.45, 0]} radius={0.38} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[-1.25, -0.72, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />
          <AtomSphere position={[1.25, -0.72, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />

          <DoubleBond from={[0, 0, 0]} to={[0, 1.45, 0]} radius={0.045} offset={0.075} />
          <SimpleBond from={[0, 0, 0]} to={[-1.25, -0.72, 0]} radius={0.045} />
          <SimpleBond from={[0, 0, 0]} to={[1.25, -0.72, 0]} radius={0.045} />
        </group>
      )}

      {selectedMolecule === "acetic_acid" && (
        <group>
          {/* Acetic Acid monomer: CH3-COOH */}
          <AtomSphere position={[0, 0, 0]} radius={0.34} color="#334155" label="C" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />
          <AtomSphere position={[0, 1.45, 0]} radius={0.38} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[-1.25, -0.72, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />
          <AtomSphere position={[1.15, -0.72, 0]} radius={0.34} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[1.85, -0.35, 0]} radius={0.22} color="#f8fafc" label="H" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />

          <DoubleBond from={[0, 0, 0]} to={[0, 1.45, 0]} radius={0.045} offset={0.075} />
          <SimpleBond from={[0, 0, 0]} to={[-1.25, -0.72, 0]} radius={0.045} />
          <SimpleBond from={[0, 0, 0]} to={[1.15, -0.72, 0]} radius={0.045} />
          <SimpleBond from={[1.15, -0.72, 0]} to={[1.85, -0.35, 0]} radius={0.038} color="#cbd5e1" />
        </group>
      )}
    </group>
  );
}

// ============================================================================
// Stage 3: Carboxylic Acid 8-Membered Cyclic Dimerization
// ============================================================================
function Stage3CarboxylicDimerScene({ modalActive = false }: { modalActive?: boolean }) {
  const {
    monomer2Distance,
    monomer2Rotation,
    dimerLocked,
    dimerJoining,
    dimerDissociating,
    dimerDissociated,
    temperature,
    solvent,
    setMonomer2Distance,
    triggerJoinDimer,
    completeDimerJoin,
    completeDimerDissociation,
  } = useCarbonylStructureStore();

  const monomer1Ref = useRef<THREE.Group>(null);
  const monomer2Ref = useRef<THREE.Group>(null);

  // Smoothly animate joining (3.5 -> 1.76) and thermal dissociation (1.76 -> 3.5) + thermal jitter
  useFrame(({ clock }, delta) => {
    if (dimerJoining) {
      const next = THREE.MathUtils.lerp(monomer2Distance, 1.76, Math.min(1, delta * 5.0));
      if (Math.abs(next - 1.76) <= 0.03) {
        completeDimerJoin();
      } else {
        setMonomer2Distance(next);
      }
    } else if (dimerDissociating) {
      const next = THREE.MathUtils.lerp(monomer2Distance, 3.5, Math.min(1, delta * 3.5));
      if (Math.abs(next - 3.5) <= 0.04) {
        completeDimerDissociation();
      } else {
        setMonomer2Distance(next);
      }
    }

    const isJittering = temperature >= 120 || dimerDissociating || solvent === "water";
    if (isJittering) {
      const t = clock.getElapsedTime() * 18;
      const intensity = Math.max(0.6, (temperature - 50) / 80);
      const jitterX = Math.sin(t) * 0.045 * intensity;
      const jitterY = Math.cos(t * 1.3) * 0.045 * intensity;

      if (monomer1Ref.current) {
        monomer1Ref.current.position.y = -jitterY;
        monomer1Ref.current.position.z = -jitterX;
      }
      if (monomer2Ref.current) {
        monomer2Ref.current.position.y = jitterY;
        monomer2Ref.current.position.z = jitterX;
      }
    } else {
      if (monomer1Ref.current) {
        monomer1Ref.current.position.y = 0;
        monomer1Ref.current.position.z = 0;
      }
      if (monomer2Ref.current) {
        monomer2Ref.current.position.y = 0;
        monomer2Ref.current.position.z = 0;
      }
    }
  });

  // Calculate symmetric separation distance:
  // At sweet spot (monomer2Distance = 1.76), separation = 3.10 units
  // Both monomers move symmetrically towards each other as distance decreases
  const separation = 3.10 + (monomer2Distance - 1.76) * 1.0;
  const m1BaseX = -separation / 2;
  const m2BaseX = +separation / 2;
  const rotRad = (monomer2Rotation * Math.PI) / 180.0;

  // Donor & Acceptor coordinate positions for H-bonds:
  // Monomer 1 (Left):
  const m1_O_carbonyl: [number, number, number] = [m1BaseX + 0.8, 1.05, 0];
  const m1_H_hydroxyl: [number, number, number] = [m1BaseX + 1.55, -1.05, 0];

  // Monomer 2 (Right, rotated by rotRad around [m2BaseX, 0, 0]):
  // Local H is at [1.55, -1.05, 0], local C=O is at [0.8, 1.05, 0]
  const m2_H_hydroxyl: [number, number, number] = [
    m2BaseX + 1.55 * Math.cos(rotRad) - (-1.05) * Math.sin(rotRad),
    1.55 * Math.sin(rotRad) + (-1.05) * Math.cos(rotRad),
    0,
  ];
  const m2_O_carbonyl: [number, number, number] = [
    m2BaseX + 0.8 * Math.cos(rotRad) - 1.05 * Math.sin(rotRad),
    0.8 * Math.sin(rotRad) + 1.05 * Math.cos(rotRad),
    0,
  ];

  return (
    <group>
      {/* ── Monomer 1 (Left - Moves toward center as distance reduces) ── */}
      <group position={[m1BaseX, 0, 0]}>
        <group ref={monomer1Ref}>
          <AtomSphere position={[0, 0, 0]} radius={0.32} color="#334155" label="C" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />
          <AtomSphere position={[-1.2, -0.2, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />
          <AtomSphere position={[0.8, 1.05, 0]} radius={0.36} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[0.8, -1.05, 0]} radius={0.34} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[1.55, -1.05, 0]} radius={0.2} color="#f8fafc" label="H" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />

          <SimpleBond from={[-1.2, -0.2, 0]} to={[0, 0, 0]} radius={0.045} />
          <DoubleBond from={[0, 0, 0]} to={[0.8, 1.05, 0]} radius={0.042} />
          <SimpleBond from={[0, 0, 0]} to={[0.8, -1.05, 0]} radius={0.045} />
          <SimpleBond from={[0.8, -1.05, 0]} to={[1.55, -1.05, 0]} radius={0.038} color="#cbd5e1" />
        </group>
      </group>

      {/* ── Monomer 2 (Right - Moves toward center as distance reduces & rotates) ── */}
      <group position={[m2BaseX, 0, 0]} rotation={[0, 0, rotRad]}>
        <group ref={monomer2Ref}>
          <AtomSphere position={[0, 0, 0]} radius={0.32} color="#334155" label="C" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />
          <AtomSphere position={[-1.2, -0.2, 0]} radius={0.34} color="#334155" label="CH₃" hideHtml={modalActive} />
          <AtomSphere position={[0.8, 1.05, 0]} radius={0.36} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[0.8, -1.05, 0]} radius={0.34} color="#ef4444" label="O" chargeLabel="δ-" chargeType="neg" hideHtml={modalActive} />
          <AtomSphere position={[1.55, -1.05, 0]} radius={0.2} color="#f8fafc" label="H" chargeLabel="δ+" chargeType="pos" hideHtml={modalActive} />

          <SimpleBond from={[-1.2, -0.2, 0]} to={[0, 0, 0]} radius={0.045} />
          <DoubleBond from={[0, 0, 0]} to={[0.8, 1.05, 0]} radius={0.042} />
          <SimpleBond from={[0, 0, 0]} to={[0.8, -1.05, 0]} radius={0.045} />
          <SimpleBond from={[0.8, -1.05, 0]} to={[1.55, -1.05, 0]} radius={0.038} color="#cbd5e1" />
        </group>
      </group>

      {/* ── Hydrogen Bonds (When reasonably aligned) ── */}
      {Math.abs(monomer2Rotation - 180) <= 45 && (
        <group>
          {/* Top H-bond: Monomer 1 C=O ··· Monomer 2 H-O */}
          <DashedHBond
            from={m1_O_carbonyl}
            to={m2_H_hydroxyl}
            isLocked={dimerLocked}
          />

          {/* Bottom H-bond: Monomer 1 O-H ··· Monomer 2 O=C */}
          <DashedHBond
            from={m1_H_hydroxyl}
            to={m2_O_carbonyl}
            isLocked={dimerLocked}
          />

          {/* Emerald 8-Membered Centrosymmetric Cyclic Ring Glow when Locked */}
          {dimerLocked && !dimerDissociating && !dimerDissociated && (
            <mesh position={[0, 0, 0]}>
              <ringGeometry args={[0.65, 1.35, 8]} />
              <meshBasicMaterial color="#10b981" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      )}

      {/* Interactive Center JOIN DIMER ✓ Button when aligned within ±15° */}
      {Math.abs(monomer2Rotation - 180) <= 15 &&
        !dimerLocked &&
        !dimerJoining &&
        !dimerDissociated &&
        !modalActive && (
          <Html position={[0, 0.15, 0]} center>
            <button
              type="button"
              onClick={triggerJoinDimer}
              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold tracking-wider shadow-lg shadow-emerald-600/30 border border-emerald-400 cursor-pointer transition-transform hover:scale-105 active:scale-95 whitespace-nowrap animate-bounce"
            >
              JOIN DIMER ✓
            </button>
          </Html>
        )}
    </group>
  );
}

// ============================================================================
// Main 3D Canvas Scene
// ============================================================================
function SceneContent() {
  const { stage, showSuccessModal, showExplanationModal } = useCarbonylStructureStore();
  const modalActive = showSuccessModal || showExplanationModal;

  return (
    <>
      <color attach="background" args={["#F8FAFC"]} />
      <OrbitControls
        enablePan={false}
        enableRotate={!modalActive}
        enableZoom={!modalActive}
        target={[0, 0.75, 0]}
        minDistance={3.5}
        maxDistance={9.5}
        maxPolarAngle={Math.PI / 1.7}
        minPolarAngle={Math.PI / 4}
      />

      {/* Ambient & Directional Lighting */}
      <ambientLight intensity={1.3} />
      <directionalLight position={[6, 8, 8]} intensity={1.5} />
      <directionalLight position={[-6, -6, -4]} intensity={0.6} color="#38bdf8" />
      <pointLight position={[0, 0, 4]} intensity={0.7} />

      {/* Stage Specific 3D Content elevated and scaled so bottom dock never touches atoms */}
      <group position={[0, 0.75, 0]}>
        {stage === 1 && <Stage1CarbonylPlanarScene hideHtml={modalActive} />}
        {stage === 2 && <Stage2DipolePolarityScene modalActive={modalActive} />}
        {stage === 3 && (
          <group scale={0.86} position={[0, 0.25, 0]}>
            <Stage3CarboxylicDimerScene modalActive={modalActive} />
          </group>
        )}
      </group>
    </>
  );
}

export default function CarbonylStructure3D() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.75, 7.0]} fov={42} />
      <SceneContent />
    </>
  );
}
