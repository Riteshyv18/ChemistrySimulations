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
// Helper: 3D Bond Cylinder Between Two Vectors
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
  const { position, rotation, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const len = dir.length();

    const orientation = new THREE.Matrix4();
    orientation.lookAt(vFrom, vTo, new THREE.Vector3(0, 1, 0));
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);

    return { position: mid, rotation: rot, length: len };
  }, [from, to]);

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
    </mesh>
  );
}

// ============================================================================
// Helper: Double Bond representation
// ============================================================================
function DoubleBond({
  from,
  to,
  radius = 0.042,
  offset = 0.08,
  color = "#cbd5e1",
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  offset?: number;
  color?: string;
}) {
  const { position, rotation, length } = useMemo(() => {
    const vFrom = new THREE.Vector3(...from);
    const vTo = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(vTo, vFrom);
    const len = dir.length();

    const orientation = new THREE.Matrix4();
    orientation.lookAt(vFrom, vTo, new THREE.Vector3(0, 1, 0));
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);

    return { position: mid, rotation: rot, length: len };
  }, [from, to]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-offset, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[offset, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 3D Orbital Lobe Mesh (π* Antibonding LUMO)
// ============================================================================
function PiStarLumoLobe({ angleDeg }: { angleDeg: number }) {
  // Optimal angle 107° relative to +Y axis in YZ plane
  const lobeRotation = useMemo(() => {
    const rad = (107.0 * Math.PI) / 180.0;
    // Rotate around X axis so lobe points along Bürgi-Dunitz trajectory
    return [-(Math.PI - rad), 0, 0] as [number, number, number];
  }, []);

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
          opacity={0.32}
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

      <Html position={[0, 1.15, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
        <div className="bg-sky-50/90 backdrop-blur-xs border border-sky-300 text-sky-800 px-2 py-0.5 rounded-full font-sans text-[2.6px] font-bold shadow-xs whitespace-nowrap">
          π* LUMO Lobe (107°)
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// 3D Trajectory Aiming Arc & Launcher Reticle
// ============================================================================
function TrajectoryArc({
  attackAngle,
  optimalAngle,
}: {
  attackAngle: number;
  optimalAngle: number;
}) {
  const arcPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const radius = 2.4;
    // Generate arc from 90° to 130° in YZ plane
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const a = 90.0 + (i / steps) * 40.0;
      const rad = (a * Math.PI) / 180.0;
      const y = radius * Math.cos(Math.PI - rad);
      const z = radius * Math.sin(Math.PI - rad);
      pts.push(new THREE.Vector3(0, -y, z));
    }
    return pts;
  }, []);

  // Current attack aim direction vector
  const aimVector = useMemo(() => {
    const rad = (attackAngle * Math.PI) / 180.0;
    const y = 3.6 * Math.cos(Math.PI - rad);
    const z = 3.6 * Math.sin(Math.PI - rad);
    return new THREE.Vector3(0, -y, z);
  }, [attackAngle]);

  const isSweetSpot = Math.abs(attackAngle - optimalAngle) <= 2.5;

  return (
    <group>
      {/* Reference Guideline Arc (Dotted Indicator Markers) */}
      {arcPoints.map((pt, idx) => (
        idx % 2 === 0 ? (
          <mesh key={idx} position={pt}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.45} />
          </mesh>
        ) : null
      ))}

      {/* Trajectory Guide Beam Line */}
      <SimpleBond
        from={[0, 0, 0]}
        to={[aimVector.x, aimVector.y, aimVector.z]}
        radius={0.014}
        color={isSweetSpot ? "#10b981" : "#f59e0b"}
      />

      {/* Target Sweet Spot Marker on Arc (107°) */}
      <group position={[0, -2.4 * Math.cos(Math.PI - (107 * Math.PI) / 180), 2.4 * Math.sin(Math.PI - (107 * Math.PI) / 180)]}>
        <mesh>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* Launcher Reticle Ring */}
      <group position={aimVector}>
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial color={isSweetSpot ? "#10b981" : "#f59e0b"} side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.35, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
          <div
            className={`px-2 py-0.5 rounded-full font-sans text-[2.6px] font-bold shadow-xs whitespace-nowrap border ${
              isSweetSpot
                ? "bg-emerald-50/95 border-emerald-400 text-emerald-700"
                : "bg-amber-50/95 border-amber-400 text-amber-700"
            }`}
          >
            θ = {attackAngle.toFixed(1)}° {isSweetSpot ? "✓ Optimal" : ""}
          </div>
        </Html>
      </group>
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
}: {
  stageNum: number;
  rehybProgress: number; // 0 (sp2 planar) to 1 (sp3 tetrahedral)
  acidActive: boolean;
  electrophilicity: number;
}) {
  // Carbonyl bond length stretching: 1.22 Å -> 1.43 Å as pi-bond breaks
  const cToOxygenDist = 1.35 + 0.18 * rehybProgress;
  const oxygenPos: [number, number, number] = [0, cToOxygenDist, 0];

  // Umbrella inversion: substituents fold backwards into -Z direction
  const zBend = -0.58 * rehybProgress;
  const yShift = -0.66 + 0.12 * rehybProgress;

  // Substituent coordinates
  const r1Pos: [number, number, number] = [-1.18, yShift, zBend];
  const r2Pos: [number, number, number] = [1.18, yShift, zBend];

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

      {/* Carbon Label */}
      <Html position={[0, -0.42, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
        <div className="bg-white/90 backdrop-blur-xs border border-slate-200/80 text-slate-800 px-2 py-0.5 rounded-full font-sans text-[2.6px] font-bold shadow-xs whitespace-nowrap">
          C (δ⁺ = +{electrophilicity.toFixed(2)})
        </div>
      </Html>

      {/* ── Carbonyl Oxygen & C=O Bond ── */}
      {rehybProgress < 0.65 ? (
        <DoubleBond from={[0, 0, 0]} to={oxygenPos} color="#cbd5e1" radius={0.045} offset={0.08} />
      ) : (
        <SimpleBond from={[0, 0, 0]} to={oxygenPos} color="#cbd5e1" radius={0.065} />
      )}

      <mesh position={oxygenPos}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color={rehybProgress > 0.8 ? "#f87171" : "#ef4444"}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>

      {/* Oxygen Delta Negative Label */}
      <Html position={[0, cToOxygenDist + 0.42, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
        <div className="bg-red-50/90 backdrop-blur-xs border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-sans text-[2.6px] font-bold shadow-xs whitespace-nowrap">
          {rehybProgress > 0.8 ? "O⁻ (Alkoxide)" : "O (δ⁻)"}
        </div>
      </Html>

      {/* ── Stage 3: Acid Protonation on Oxygen (H⁺) ── */}
      {acidActive && (
        <group position={[0.36, cToOxygenDist + 0.28, 0]}>
          <SimpleBond from={[0, 0, 0]} to={[-0.36, -0.28, 0]} radius={0.04} color="#38bdf8" />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
          <Html position={[0.22, 0.15, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
            <div className="bg-sky-50/95 border border-sky-400 text-sky-800 px-1.5 py-0.5 rounded-full font-mono text-[2.4px] font-bold shadow-xs whitespace-nowrap">
              H⁺ Proton
            </div>
          </Html>
        </group>
      )}

      {/* ── Substituent 1 (Left) ── */}
      <SimpleBond from={[0, 0, 0]} to={r1Pos} radius={0.055} color="#cbd5e1" />
      {stageNum === 1 ? (
        // Formaldehyde: Hydrogen
        <group position={r1Pos}>
          <mesh>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
          </mesh>
          <Html position={[-0.22, -0.22, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono text-[2.4px] font-bold shadow-xs">
              H
            </div>
          </Html>
        </group>
      ) : (
        // Acetone: Methyl group (-CH₃)
        <group position={r1Pos}>
          <mesh>
            <sphereGeometry args={[0.25, 28, 28]} />
            <meshStandardMaterial color="#475569" roughness={0.35} />
          </mesh>
          {/* Faint translucent van der Waals steric envelope */}
          <mesh>
            <sphereGeometry args={[0.42, 20, 20]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.16} roughness={0.5} depthWrite={false} />
          </mesh>
          {/* Three hydrogen satellites */}
          {[-0.28, 0, 0.28].map((hx, hIdx) => (
            <mesh key={`m1-h-${hIdx}`} position={[hx - 0.15, -0.22, hIdx === 1 ? 0.2 : -0.2]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#f1f5f9" />
            </mesh>
          ))}
          <Html position={[-0.45, -0.22, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
            <div className="bg-slate-100/90 backdrop-blur-xs border border-slate-300 text-slate-800 px-1.5 py-0.2 rounded-full font-mono text-[2.4px] font-bold shadow-xs whitespace-nowrap">
              -CH₃ (Steric +I)
            </div>
          </Html>
        </group>
      )}

      {/* ── Substituent 2 (Right) ── */}
      <SimpleBond from={[0, 0, 0]} to={r2Pos} radius={0.055} color="#cbd5e1" />
      {stageNum === 1 ? (
        // Formaldehyde: Hydrogen
        <group position={r2Pos}>
          <mesh>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
          </mesh>
          <Html position={[0.22, -0.22, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
            <div className="bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono text-[2.4px] font-bold shadow-xs">
              H
            </div>
          </Html>
        </group>
      ) : (
        // Acetone: Methyl group (-CH₃)
        <group position={r2Pos}>
          <mesh>
            <sphereGeometry args={[0.25, 28, 28]} />
            <meshStandardMaterial color="#475569" roughness={0.35} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.42, 20, 20]} />
            <meshStandardMaterial color="#94a3b8" transparent opacity={0.16} roughness={0.5} depthWrite={false} />
          </mesh>
          {[-0.28, 0, 0.28].map((hx, hIdx) => (
            <mesh key={`m2-h-${hIdx}`} position={[hx + 0.15, -0.22, hIdx === 1 ? 0.2 : -0.2]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#f1f5f9" />
            </mesh>
          ))}
          <Html position={[0.45, -0.22, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
            <div className="bg-slate-100/90 backdrop-blur-xs border border-slate-300 text-slate-800 px-1.5 py-0.2 rounded-full font-mono text-[2.4px] font-bold shadow-xs whitespace-nowrap">
              -CH₃ (Steric +I)
            </div>
          </Html>
        </group>
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
  collisionResult,
  rehybProgress,
}: {
  attackAngle: number;
  progress: number;
  collisionResult: string;
  rehybProgress: number;
}) {
  const currentPos = useMemo(() => {
    const rad = (attackAngle * Math.PI) / 180.0;
    const startDist = 3.6;
    const endDist = 0.52; // C-CN covalent bond distance

    // Start position vector at launcher
    const startY = -startDist * Math.cos(Math.PI - rad);
    const startZ = startDist * Math.sin(Math.PI - rad);

    // End position vector at target carbon
    const endY = -endDist * Math.cos(Math.PI - rad);
    const endZ = endDist * Math.sin(Math.PI - rad);

    if (collisionResult === "deflected_oxygen_repulsion" && progress >= 0.9) {
      // Deflect sideways away from oxygen
      const tDeflect = (progress - 0.9) / 0.1;
      return new THREE.Vector3(1.2 * tDeflect, endY - 0.8 * tDeflect, endZ + 0.5 * tDeflect);
    }

    if (collisionResult === "missed_lumo" && progress >= 0.9) {
      // Overshoot past carbon into background
      const tMiss = (progress - 0.9) / 0.1;
      return new THREE.Vector3(0, endY - 1.5 * tMiss, endZ - 1.8 * tMiss);
    }

    if (collisionResult === "steric_rebound" && progress >= 0.95) {
      // Bounce back
      return new THREE.Vector3(0, endY + 0.4, endZ + 0.5);
    }

    // Normal linear approach
    const currY = (1 - progress) * startY + progress * endY;
    const currZ = (1 - progress) * startZ + progress * endZ;
    return new THREE.Vector3(0, currY, currZ);
  }, [attackAngle, progress, collisionResult]);

  return (
    <group position={currentPos}>
      {/* Carbon atom of cyanide */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>

      {/* Nitrogen atom of cyanide */}
      <mesh position={[0, -0.28, 0]}>
        <sphereGeometry args={[0.20, 24, 24]} />
        <meshStandardMaterial color="#2563eb" roughness={0.25} />
      </mesh>

      {/* C≡N Triple Bond */}
      <DoubleBond from={[0, 0, 0]} to={[0, -0.28, 0]} radius={0.032} offset={0.045} color="#94a3b8" />

      {/* Glowing Electron Pair Aura */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* Nucleophile Label */}
      <Html position={[0, 0.38, 0]} center distanceFactor={1.35} className="pointer-events-none select-none">
        <div className="bg-sky-600/95 text-white font-mono text-[2.4px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          :C≡N⁻
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// Main Scene Content Canvas Inner
// ============================================================================
function SceneContent() {
  const currentStage = useNucleophilicAdditionStore((s) => s.currentStage);
  const attackAngle = useNucleophilicAdditionStore((s) => s.attackAngle);
  const acidCatalystActive = useNucleophilicAdditionStore((s) => s.acidCatalystActive);
  const isSimulating = useNucleophilicAdditionStore((s) => s.isSimulating);
  const projectileProgress = useNucleophilicAdditionStore((s) => s.projectileProgress);
  const rehybridizationProgress = useNucleophilicAdditionStore((s) => s.rehybridizationProgress);
  const collisionResult = useNucleophilicAdditionStore((s) => s.collisionResult);
  const tickSimulation = useNucleophilicAdditionStore((s) => s.tickSimulation);

  const stage = NUCLEOPHILIC_STAGES[currentStage] || NUCLEOPHILIC_STAGES[1];

  // Dynamic electrophilicity based on stage and acid state
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

      {/* Orbit Controls with bounded angles */}
      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={8.5}
        maxPolarAngle={Math.PI / 1.85}
      />

      {/* ── 3D Substrate Carbonyl Molecule ── */}
      <CarbonylSubstrateMolecule
        stageNum={currentStage}
        rehybProgress={rehybridizationProgress}
        acidActive={acidCatalystActive}
        electrophilicity={electrophilicity}
      />

      {/* ── π* LUMO Antibonding Orbital (Visible during sp2 ground state) ── */}
      {rehybridizationProgress < 0.85 && <PiStarLumoLobe angleDeg={stage.optimalAngle} />}

      {/* ── Trajectory Arc & Aiming Guide ── */}
      <TrajectoryArc attackAngle={attackAngle} optimalAngle={stage.optimalAngle} />

      {/* ── Projectile Nucleophile (Incoming or Docked) ── */}
      <ProjectileNucleophile
        attackAngle={attackAngle}
        progress={projectileProgress}
        collisionResult={collisionResult}
        rehybProgress={rehybridizationProgress}
      />
    </>
  );
}

// ============================================================================
// Exported Component: NucleophilicAddition3D
// ============================================================================
export default function NucleophilicAddition3D() {
  return (
    <div className="w-full h-full relative">
      <PerspectiveCamera makeDefault position={[0, 0.45, 5.2]} fov={38} />
      <SceneContent />
    </div>
  );
}
