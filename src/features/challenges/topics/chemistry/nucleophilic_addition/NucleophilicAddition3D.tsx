"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  useNucleophilicAdditionStore,
  NUCLEOPHILIC_STAGES,
} from "./NucleophilicAdditionStore";

// ============================================================================
// Helper: 3D Bond Cylinder Between Two Vectors (Aligned via Quaternion from +Y)
// ============================================================================
function SimpleBond({
  from,
  to,
  radius = 0.055,
  color = "#cbd5e1",
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

    const quat = new THREE.Quaternion();
    if (len > 0.0001) {
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }

    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
    </mesh>
  );
}

// ============================================================================
// Helper: Triple Bond representation (3 parallel cylinders for :C≡N⁻)
// ============================================================================
function TripleBond({
  from,
  to,
  radius = 0.024,
  offset = 0.06,
  color = "#94a3b8",
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  offset?: number;
  color?: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const len = dir.length();

    const quat = new THREE.Quaternion();
    if (len > 0.0001) {
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }

    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[-offset, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[offset, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Helper: Smooth Double Bond (fades π-bond cleanly during sp2 -> sp3)
// ============================================================================
function CarbonylDoubleBond({
  from,
  to,
  piOpacity,
}: {
  from: [number, number, number];
  to: [number, number, number];
  piOpacity: number;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const len = dir.length();

    const quat = new THREE.Quaternion();
    if (len > 0.0001) {
      quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }

    return { position: mid, quaternion: quat, length: len };
  }, [from, to]);

  return (
    <group position={position} quaternion={quaternion}>
      {/* Central σ-bond (always solid) */}
      <mesh position={[-0.04 * piOpacity, 0, 0]}>
        <cylinderGeometry args={[0.052, 0.052, length, 16]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* π-bond (smoothly fades out as π electrons shift to oxygen) */}
      {piOpacity > 0.02 && (
        <mesh position={[0.065, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, length, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.3}
            metalness={0.15}
            transparent
            opacity={piOpacity}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 3D Orbital Lobe Mesh (π* Antibonding LUMO aligned along 107° Bürgi-Dunitz)
// ============================================================================
function PiStarLumoLobe({ angleDeg, isModalOpen }: { angleDeg: number; isModalOpen: boolean }) {
  // Rotating +Y (0,1,0) by +rad around +X gives (0, cos(rad), sin(rad)),
  // pointing directly along the 107° Bürgi-Dunitz trajectory toward +Z / -Y.
  const lobeRotation = useMemo(() => {
    const rad = (angleDeg * Math.PI) / 180.0;
    return [rad, 0, 0] as [number, number, number];
  }, [angleDeg]);

  return (
    <group position={[0, 0, 0]} rotation={lobeRotation}>
      {/* Upper LUMO Lobe (Main lobe targeted by incoming nucleophile) */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.65}
          transparent
          opacity={0.34}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Opposing smaller back lobe */}
      <mesh position={[0, -0.45, 0]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#4f46e5"
          emissiveIntensity={0.4}
          transparent
          opacity={0.2}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {!isModalOpen && (
        <Html position={[0, 1.05, 0]} center className="pointer-events-none select-none">
          <div className="bg-sky-50/90 backdrop-blur-xs border border-sky-300 text-sky-700 px-2 py-0.5 rounded-full font-sans text-[10px] font-bold shadow-xs whitespace-nowrap">
            π* LUMO
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 3D Trajectory Aiming Arc & Launcher Reticle
// ============================================================================
function TrajectoryArc({
  attackAngle,
  optimalAngle,
  isModalOpen,
}: {
  attackAngle: number;
  optimalAngle: number;
  isModalOpen: boolean;
}) {
  const arcPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const radius = 2.1;
    // Generate arc from 90° to 122° in YZ plane relative to +Y (C=O axis)
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const a = 90.0 + (i / steps) * 32.0;
      const rad = (a * Math.PI) / 180.0;
      const y = radius * Math.cos(rad);
      const z = radius * Math.sin(rad);
      pts.push(new THREE.Vector3(0, y, z));
    }
    return pts;
  }, []);

  // Current attack aim direction vector
  const aimVector = useMemo(() => {
    const rad = (attackAngle * Math.PI) / 180.0;
    const y = 3.5 * Math.cos(rad);
    const z = 3.5 * Math.sin(rad);
    return new THREE.Vector3(0, y, z);
  }, [attackAngle]);

  const sweetSpotPos: [number, number, number] = useMemo(() => {
    const rad = (optimalAngle * Math.PI) / 180.0;
    return [0, 2.1 * Math.cos(rad), 2.1 * Math.sin(rad)];
  }, [optimalAngle]);

  const isSweetSpot = Math.abs(attackAngle - optimalAngle) <= 2.5;

  return (
    <group>
      {/* Reference Guideline Arc (Dotted Indicator Markers) */}
      {arcPoints.map((pt, idx) =>
        idx % 2 === 0 ? (
          <mesh key={idx} position={pt}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.5} />
          </mesh>
        ) : null
      )}

      {/* Trajectory Guide Beam Line */}
      <SimpleBond
        from={[0, 0, 0]}
        to={[aimVector.x, aimVector.y, aimVector.z]}
        radius={0.014}
        color={isSweetSpot ? "#10b981" : "#f59e0b"}
      />

      {/* Target Sweet Spot Marker on Arc (107°) */}
      <group position={sweetSpotPos}>
        <mesh>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        {!isModalOpen && !isSweetSpot && (
          <Html position={[0, -0.22, 0]} center className="pointer-events-none select-none">
            <div className="bg-emerald-50/95 border border-emerald-400 text-emerald-700 px-1.5 py-0.5 rounded-full font-mono text-[9.5px] font-bold shadow-xs whitespace-nowrap">
              107°
            </div>
          </Html>
        )}
      </group>

      {/* Launcher Reticle Ring */}
      <group position={aimVector} rotation={[((attackAngle - 90) * Math.PI) / 180, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial color={isSweetSpot ? "#10b981" : "#f59e0b"} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// Helper: Tetrahedral Methyl Group (-CH₃) with proper C–H bonds
// ============================================================================
function MethylGroup({
  position,
  side,
  isModalOpen,
}: {
  position: [number, number, number];
  side: "left" | "right";
  isModalOpen: boolean;
}) {
  const s = side === "left" ? -1 : 1;
  // 3 tetrahedral H positions pointing outward away from the C–C bond
  const hPositions: [number, number, number][] = [
    [s * 0.22, -0.36, 0.26],
    [s * 0.22, -0.36, -0.26],
    [s * 0.44, 0.16, 0],
  ];

  return (
    <group position={position}>
      {/* Methyl Carbon */}
      <mesh>
        <sphereGeometry args={[0.24, 28, 28]} />
        <meshStandardMaterial color="#475569" roughness={0.35} />
      </mesh>
      {/* Translucent van der Waals steric envelope */}
      <mesh>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.15} roughness={0.5} depthWrite={false} />
      </mesh>
      {/* Three C–H bonds + Hydrogen spheres */}
      {hPositions.map((hp, idx) => (
        <group key={idx}>
          <SimpleBond from={[0, 0, 0]} to={hp} radius={0.032} color="#cbd5e1" />
          <mesh position={hp}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
          </mesh>
        </group>
      ))}
      {!isModalOpen && (
        <Html position={[s * 0.55, -0.32, 0]} center className="pointer-events-none select-none">
          <div className="bg-slate-100/90 backdrop-blur-xs border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded-full font-mono text-[9.5px] font-bold shadow-xs whitespace-nowrap">
            CH₃
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 3D Carbonyl Substrate Molecule (With Rehybridization Umbrella Pyramidalization)
// ============================================================================
function CarbonylSubstrateMolecule({
  stageNum,
  rehybProgress,
  acidActive,
  electrophilicity,
  isModalOpen,
}: {
  stageNum: number;
  rehybProgress: number; // 0 (sp2 planar) to 1 (sp3 tetrahedral)
  acidActive: boolean;
  electrophilicity: number;
  isModalOpen: boolean;
}) {
  // Carbonyl bond length stretching: 1.25 -> 1.44 as pi-bond breaks
  const cToOxygenDist = 1.25 + 0.19 * rehybProgress;
  const oxygenPos: [number, number, number] = [0, cToOxygenDist, 0];

  // Exact sp2 (120° trigonal planar) -> sp3 (109.5° tetrahedral) interpolation
  const subBondLen = stageNum === 1 ? 1.15 : 1.38;
  const { r1Pos, r2Pos } = useMemo(() => {
    const dir1 = new THREE.Vector3(
      -0.866 * (1 - rehybProgress) + -0.8165 * rehybProgress,
      -0.5 * (1 - rehybProgress) + -0.3333 * rehybProgress,
      -0.4714 * rehybProgress
    ).normalize().multiplyScalar(subBondLen);

    const dir2 = new THREE.Vector3(
      0.866 * (1 - rehybProgress) + 0.8165 * rehybProgress,
      -0.5 * (1 - rehybProgress) + -0.3333 * rehybProgress,
      -0.4714 * rehybProgress
    ).normalize().multiplyScalar(subBondLen);

    return {
      r1Pos: [dir1.x, dir1.y, dir1.z] as [number, number, number],
      r2Pos: [dir2.x, dir2.y, dir2.z] as [number, number, number],
    };
  }, [rehybProgress, subBondLen]);

  // Pulse halo scale for electrophilicity
  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1.0 + Math.sin(t * 4.0) * (0.08 * electrophilicity);
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ── Central Carbonyl Carbon ── */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Electrophilic Positive Charge Halo (Glows brighter with higher delta+) */}
      <mesh ref={pulseRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.33, 24, 24]} />
        <meshStandardMaterial
          color={acidActive ? "#38bdf8" : "#60a5fa"}
          emissive={acidActive ? "#0284c7" : "#2563eb"}
          emissiveIntensity={acidActive ? 1.4 : 0.4}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      {/* ── Carbonyl Oxygen & Smooth Double-to-Single Bond ── */}
      <CarbonylDoubleBond
        from={[0, 0, 0]}
        to={oxygenPos}
        piOpacity={Math.max(0, 1 - rehybProgress * 1.15)}
      />

      <mesh position={oxygenPos}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color={rehybProgress > 0.8 ? "#f87171" : "#ef4444"}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Oxygen Delta Negative Label */}
      {!isModalOpen && (
        <Html position={[0, cToOxygenDist + 0.45, 0]} center className="pointer-events-none select-none">
          <div className="bg-red-50/95 backdrop-blur-xs border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
            {acidActive
              ? rehybProgress > 0.8
                ? "OH"
                : "O⁺-H"
              : rehybProgress > 0.8
                ? "O⁻"
                : "O (δ⁻)"}
          </div>
        </Html>
      )}

      {/* ── Stage 3: Acid Protonation on Oxygen (H⁺) ── */}
      {acidActive && (
        <group position={[0.36, cToOxygenDist + 0.28, 0]}>
          <SimpleBond from={[0, 0, 0]} to={[-0.36, -0.28, 0]} radius={0.04} color="#38bdf8" />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
          {!isModalOpen && (
            <Html position={[0.24, 0.16, 0]} center className="pointer-events-none select-none">
              <div className="bg-sky-50/95 border border-sky-400 text-sky-800 px-1.5 py-0.5 rounded-full font-mono text-[9.5px] font-bold shadow-xs whitespace-nowrap">
                H⁺
              </div>
            </Html>
          )}
        </group>
      )}

      {/* ── Substituent 1 (Left) ── */}
      <SimpleBond from={[0, 0, 0]} to={r1Pos} radius={0.055} color="#cbd5e1" />
      {stageNum === 1 ? (
        <mesh position={r1Pos}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
      ) : (
        <MethylGroup position={r1Pos} side="left" isModalOpen={isModalOpen} />
      )}

      {/* ── Substituent 2 (Right) ── */}
      <SimpleBond from={[0, 0, 0]} to={r2Pos} radius={0.055} color="#cbd5e1" />
      {stageNum === 1 ? (
        <mesh position={r2Pos}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
      ) : (
        <MethylGroup position={r2Pos} side="right" isModalOpen={isModalOpen} />
      )}
    </group>
  );
}

// ============================================================================
// Dynamic Projectile Nucleophile (Cyanide Ion :C≡N⁻)
// ============================================================================
function ProjectileNucleophile({
  attackAngle,
  progress,
  deflectionProgress,
  collisionResult,
  rehybProgress,
  isModalOpen,
}: {
  attackAngle: number;
  progress: number;
  deflectionProgress: number;
  collisionResult: string;
  rehybProgress: number;
  isModalOpen: boolean;
}) {
  const rad = (attackAngle * Math.PI) / 180.0;

  const { currentPos, currentRot } = useMemo(() => {
    const startDist = 3.5;
    const endDist = 1.15; // C-CN covalent bond distance (sum of C radii + bond)

    // Approach vector from carbonyl carbon outward along angle θ from +Y toward +Z
    const dirY = Math.cos(rad);
    const dirZ = Math.sin(rad);

    const startY = startDist * dirY;
    const startZ = startDist * dirZ;
    const endY = endDist * dirY;
    const endZ = endDist * dirZ;

    // Base orientation: local +Y (carbon lone pair) points inward (-dirY, -dirZ) toward C(0,0,0)
    const baseRotX = rad - Math.PI;

    if (deflectionProgress > 0) {
      if (collisionResult === "deflected_oxygen_repulsion") {
        // Deflect sideways and downward away from oxygen's lone pairs
        const pos = new THREE.Vector3(
          1.35 * deflectionProgress,
          endY - 0.9 * deflectionProgress,
          endZ + 0.65 * deflectionProgress
        );
        return {
          currentPos: pos,
          currentRot: [baseRotX + 0.6 * deflectionProgress, 0, -0.8 * deflectionProgress] as [number, number, number],
        };
      }

      if (collisionResult === "missed_lumo") {
        // Glancing overshoot past the carbonyl carbon into -Z
        const pos = new THREE.Vector3(
          0,
          endY + 1.1 * dirY * deflectionProgress,
          endZ - 1.9 * deflectionProgress
        );
        return {
          currentPos: pos,
          currentRot: [baseRotX - 0.35 * deflectionProgress, 0, 0] as [number, number, number],
        };
      }

      if (collisionResult === "steric_rebound" || collisionResult === "insufficient_energy") {
        // Elastic bounce-back along the approach trajectory
        const bounceDist = 1.25 * Math.sin(deflectionProgress * Math.PI * 0.5);
        const pos = new THREE.Vector3(
          0,
          endY + bounceDist * dirY,
          endZ + bounceDist * dirZ
        );
        return {
          currentPos: pos,
          currentRot: [baseRotX, 0, 0] as [number, number, number],
        };
      }
    }

    // Normal linear approach (or docked after successful hit)
    const currY = (1 - progress) * startY + progress * endY;
    const currZ = (1 - progress) * startZ + progress * endZ;
    return {
      currentPos: new THREE.Vector3(0, currY, currZ),
      currentRot: [baseRotX, 0, 0] as [number, number, number],
    };
  }, [rad, progress, deflectionProgress, collisionResult]);

  return (
    <group position={currentPos}>
      <group rotation={currentRot}>
        {/* Newly formed C–CN bond (visible once docked during rehybridization) */}
        {rehybProgress > 0.1 && (
          <SimpleBond
            from={[0, 0, 0]}
            to={[0, 0.72, 0]}
            radius={0.052}
            color="#10b981"
          />
        )}

        {/* Carbon atom of cyanide (front tip) */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.45} roughness={0.2} />
        </mesh>

        {/* Nitrogen atom of cyanide (trailing behind) */}
        <mesh position={[0, -0.34, 0]}>
          <sphereGeometry args={[0.20, 24, 24]} />
          <meshStandardMaterial color="#2563eb" roughness={0.25} />
        </mesh>

        {/* C≡N Triple Bond */}
        <TripleBond from={[0, 0, 0]} to={[0, -0.34, 0]} radius={0.022} offset={0.055} color="#94a3b8" />

        {/* Glowing Lone Pair Electron Aura at Carbon Tip */}
        {rehybProgress < 0.5 && (
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} />
          </mesh>
        )}
      </group>

      {/* Nucleophile Label cleanly below the ion */}
      {!isModalOpen && (
        <Html position={[0, -0.46, 0]} center className="pointer-events-none select-none">
          <div className="bg-sky-600/95 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            :C≡N⁻
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Main Scene Content Canvas Inner
// ============================================================================
function SceneContent({ isModalOpen }: { isModalOpen: boolean }) {
  const currentStage = useNucleophilicAdditionStore((s) => s.currentStage);
  const attackAngle = useNucleophilicAdditionStore((s) => s.attackAngle);
  const acidCatalystActive = useNucleophilicAdditionStore((s) => s.acidCatalystActive);
  const isSimulating = useNucleophilicAdditionStore((s) => s.isSimulating);
  const projectileProgress = useNucleophilicAdditionStore((s) => s.projectileProgress);
  const deflectionProgress = useNucleophilicAdditionStore((s) => s.deflectionProgress);
  const rehybridizationProgress = useNucleophilicAdditionStore((s) => s.rehybridizationProgress);
  const collisionResult = useNucleophilicAdditionStore((s) => s.collisionResult);
  const tickSimulation = useNucleophilicAdditionStore((s) => s.tickSimulation);

  const stage = NUCLEOPHILIC_STAGES[currentStage] || NUCLEOPHILIC_STAGES[1];

  const electrophilicity = acidCatalystActive && stage.catalyzedCarbonDeltaPlus
    ? stage.catalyzedCarbonDeltaPlus
    : stage.carbonDeltaPlus;

  useFrame((_, delta) => {
    if (isSimulating) {
      tickSimulation(delta);
    }
  });

  return (
    <>
      <color attach="background" args={["#f8fafc"]} />
      <ambientLight intensity={1.15} />

      {/* Key Sunlight */}
      <directionalLight position={[4, 8, 6]} intensity={1.3} color="#ffffff" castShadow />
      {/* Fill Warm Rim Light */}
      <directionalLight position={[-6, 4, -4]} intensity={0.7} color="#fed7aa" />
      {/* Top Cool Light */}
      <directionalLight position={[0, 10, 0]} intensity={0.8} color="#e0f2fe" />

      {/* Orbit Controls centered between the molecule and incoming nucleophile */}
      <OrbitControls
        enablePan={false}
        target={[0, 0.0, 1.25]}
        minDistance={3.0}
        maxDistance={10.5}
        maxPolarAngle={Math.PI / 1.85}
      />

      {/* ── 3D Substrate Carbonyl Molecule ── */}
      <CarbonylSubstrateMolecule
        stageNum={currentStage}
        rehybProgress={rehybridizationProgress}
        acidActive={acidCatalystActive}
        electrophilicity={electrophilicity}
        isModalOpen={isModalOpen}
      />

      {/* ── π* LUMO Antibonding Orbital (Visible during sp2 ground state) ── */}
      {rehybridizationProgress < 0.85 && (
        <PiStarLumoLobe angleDeg={stage.optimalAngle} isModalOpen={isModalOpen} />
      )}

      {/* ── Trajectory Arc & Aiming Guide ── */}
      <TrajectoryArc
        attackAngle={attackAngle}
        optimalAngle={stage.optimalAngle}
        isModalOpen={isModalOpen}
      />

      {/* ── Projectile Nucleophile (Incoming or Docked) ── */}
      <ProjectileNucleophile
        attackAngle={attackAngle}
        progress={projectileProgress}
        deflectionProgress={deflectionProgress}
        collisionResult={collisionResult}
        rehybProgress={rehybridizationProgress}
        isModalOpen={isModalOpen}
      />
    </>
  );
}

// ============================================================================
// Exported Component: NucleophilicAddition3D (Rendered inside R3F Canvas)
// ============================================================================
export default function NucleophilicAddition3D({
  isModalOpen = false,
}: {
  isModalOpen?: boolean;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[5.5, -1.5, 6]} fov={40} />
      <SceneContent isModalOpen={isModalOpen} />
    </>
  );
}
