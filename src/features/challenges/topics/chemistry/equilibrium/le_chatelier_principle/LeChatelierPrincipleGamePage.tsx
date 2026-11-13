"use client";

import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Text,
} from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Flame,
  BookOpen,
  X,
  Gauge,
  PlusCircle,
  MinusCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Maximize2,
} from "lucide-react";

// ============================================================================
// TYPES & MOLECULAR STRUCTURES
// ============================================================================

interface Molecule3DData {
  id: string;
  type: "N2O4" | "NO2";
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Euler;
}

// ----------------------------------------------------------------------------
// 3D MOLECULAR COMPONENTS (Ball-and-Stick) - Reusable Shared Geometries & Materials
// Color Scheme: Nitrogen (Blue: #2563EB), Oxygen (Red: #DC2626), Bond (Grey: #94A3B8)
// ----------------------------------------------------------------------------

const sphereGeoNitrogen = new THREE.SphereGeometry(0.26, 20, 20);
const sphereGeoOxygen = new THREE.SphereGeometry(0.21, 20, 20);
const cylGeoBond = new THREE.CylinderGeometry(0.06, 0.06, 0.46, 12);
const cylGeoNNBond = new THREE.CylinderGeometry(0.07, 0.07, 0.56, 12);

const matNitrogen = new THREE.MeshStandardMaterial({
  color: "#2563EB",
  roughness: 0.25,
  metalness: 0.15,
});
const matOxygen = new THREE.MeshStandardMaterial({
  color: "#DC2626",
  roughness: 0.25,
  metalness: 0.15,
});
const matBond = new THREE.MeshStandardMaterial({
  color: "#94A3B8",
  roughness: 0.3,
});
const matNNBond = new THREE.MeshStandardMaterial({
  color: "#64748B",
  roughness: 0.25,
});

// NO2: Bent geometry (~134 degrees) with central Nitrogen and 2 Oxygens
function MoleculeNO2() {
  const bondDist = 0.46;
  const o1X = bondDist * Math.sin(1.17);
  const o1Y = -bondDist * Math.cos(1.17);
  const o2X = -bondDist * Math.sin(1.17);
  const o2Y = -bondDist * Math.cos(1.17);

  return (
    <group>
      {/* Central Nitrogen (Blue) */}
      <mesh geometry={sphereGeoNitrogen} material={matNitrogen} position={[0, 0, 0]} />

      {/* Bond 1 */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[o1X / 2, o1Y / 2, 0]}
        rotation={[0, 0, -1.17 / 2 - Math.PI / 4]}
      />
      {/* Oxygen 1 (Red) */}
      <mesh geometry={sphereGeoOxygen} material={matOxygen} position={[o1X, o1Y, 0]} />

      {/* Bond 2 */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[o2X / 2, o2Y / 2, 0]}
        rotation={[0, 0, 1.17 / 2 + Math.PI / 4]}
      />
      {/* Oxygen 2 (Red) */}
      <mesh geometry={sphereGeoOxygen} material={matOxygen} position={[o2X, o2Y, 0]} />
    </group>
  );
}

// N2O4: Planar dinitrogen tetroxide with central N-N bond and 4 Oxygens
function MoleculeN2O4() {
  const nnDist = 0.56;
  const noDist = 0.44;
  const oAngle = Math.PI / 3;

  return (
    <group>
      {/* Central N-N Bond */}
      <mesh
        geometry={cylGeoNNBond}
        material={matNNBond}
        rotation={[0, 0, Math.PI / 2]}
      />

      {/* Nitrogen 1 (Left) */}
      <mesh geometry={sphereGeoNitrogen} material={matNitrogen} position={[-nnDist / 2, 0, 0]} />
      {/* Oxygen 1A (Top Left) */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[
          -nnDist / 2 - noDist * Math.cos(oAngle) / 2,
          (noDist * Math.sin(oAngle)) / 2,
          0,
        ]}
        rotation={[0, 0, -oAngle]}
      />
      <mesh
        geometry={sphereGeoOxygen}
        material={matOxygen}
        position={[-nnDist / 2 - noDist * Math.cos(oAngle), noDist * Math.sin(oAngle), 0]}
      />
      {/* Oxygen 1B (Bottom Left) */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[
          -nnDist / 2 - noDist * Math.cos(oAngle) / 2,
          (-noDist * Math.sin(oAngle)) / 2,
          0,
        ]}
        rotation={[0, 0, oAngle]}
      />
      <mesh
        geometry={sphereGeoOxygen}
        material={matOxygen}
        position={[-nnDist / 2 - noDist * Math.cos(oAngle), -noDist * Math.sin(oAngle), 0]}
      />

      {/* Nitrogen 2 (Right) */}
      <mesh geometry={sphereGeoNitrogen} material={matNitrogen} position={[nnDist / 2, 0, 0]} />
      {/* Oxygen 2A (Top Right) */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[
          nnDist / 2 + noDist * Math.cos(oAngle) / 2,
          (noDist * Math.sin(oAngle)) / 2,
          0,
        ]}
        rotation={[0, 0, oAngle]}
      />
      <mesh
        geometry={sphereGeoOxygen}
        material={matOxygen}
        position={[nnDist / 2 + noDist * Math.cos(oAngle), noDist * Math.sin(oAngle), 0]}
      />
      {/* Oxygen 2B (Bottom Right) */}
      <mesh
        geometry={cylGeoBond}
        material={matBond}
        position={[
          nnDist / 2 + noDist * Math.cos(oAngle) / 2,
          (-noDist * Math.sin(oAngle)) / 2,
          0,
        ]}
        rotation={[0, 0, -oAngle]}
      />
      <mesh
        geometry={sphereGeoOxygen}
        material={matOxygen}
        position={[nnDist / 2 + noDist * Math.cos(oAngle), -noDist * Math.sin(oAngle), 0]}
      />
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D REACTOR VESSEL & PISTON
// ----------------------------------------------------------------------------

interface ReactorVesselProps {
  pistonY: number; // Current height of piston (e.g., 0.5 to 2.2)
  brownIntensity: number; // 0 to 1 based on [NO2]
  temperature: number; // Kelvin
}

function ReactorVessel({ pistonY, brownIntensity, temperature }: ReactorVesselProps) {
  // Rectangular chamber dimensions (Expanded horizontally)
  const chamberWidth = 5.2; // X span: [-2.6, 2.6]
  const chamberDepth = 2.4; // Z span: [-1.2, 1.2]
  const chamberBottom = -2.0;
  const currentChamberHeight = pistonY - chamberBottom;
  const currentChamberCenter = chamberBottom + currentChamberHeight / 2;

  // Brown gas tint calculation: transparent clear (pale) to rich amber-reddish brown
  const gasColor = useMemo(() => {
    const color = new THREE.Color();
    // Pure pale clear when no NO2, deep reddish amber when NO2 is present
    color.setRGB(0.78, 0.28, 0.05);
    return color;
  }, []);

  // When count of NO2 is 0, opacity is 0 (completely colorless!)
  const gasOpacity = Math.max(0, Math.min(0.85, brownIntensity * 0.8));

  return (
    <group>
      {/* Heavy Rectangular Base Stand */}
      <mesh position={[0, chamberBottom - 0.25, 0]}>
        <boxGeometry args={[chamberWidth + 0.6, 0.45, chamberDepth + 0.6]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, chamberBottom - 0.04, 0]}>
        <boxGeometry args={[chamberWidth + 0.2, 0.08, chamberDepth + 0.2]} />
        <meshStandardMaterial color="#0284C7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Transparent Rectangular Glass Vessel Outer Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[chamberWidth, 4.4, chamberDepth]} />
        <meshStandardMaterial
          color="#BAE6FD"
          transparent
          opacity={0.2}
          roughness={0.08}
          metalness={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Rectangular Metallic Frame Edges */}
      <group>
        {/* 4 Vertical corner pillars */}
        {[-chamberWidth / 2, chamberWidth / 2].map((x) =>
          [-chamberDepth / 2, chamberDepth / 2].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.2, z]}>
              <boxGeometry args={[0.08, 4.4, 0.08]} />
              <meshStandardMaterial color="#64748B" roughness={0.3} metalness={0.7} />
            </mesh>
          ))
        )}
      </group>

      {/* Volumetric Gas Color Core (Internal gas volume between bottom and piston) */}
      <mesh position={[0, currentChamberCenter, 0]}>
        <boxGeometry
          args={[chamberWidth - 0.08, Math.max(0.1, currentChamberHeight), chamberDepth - 0.08]}
        />
        <meshBasicMaterial
          color={gasColor}
          transparent
          opacity={gasOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Movable Rectangular Piston Head */}
      <group position={[0, pistonY, 0]}>
        {/* Piston Plate */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[chamberWidth - 0.06, 0.2, chamberDepth - 0.06]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Piston Seal Border */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[chamberWidth - 0.02, 0.05, chamberDepth - 0.02]} />
          <meshStandardMaterial color="#0284C7" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Piston Vertical Shaft */}
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 2.2, 20]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Top Handle Disc */}
        <mesh position={[0, 2.4, 0]}>
          <boxGeometry args={[1.3, 0.12, 0.5]} />
          <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* Graduation Marks on the glass side */}
      {[-1.2, -0.4, 0.4, 1.2, 2.0].map((yVal, i) => (
        <group key={i} position={[chamberWidth / 2 + 0.02, yVal, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
            <meshBasicMaterial color="#94A3B8" />
          </mesh>
        </group>
      ))}

      {/* Chamber Ambient Thermal / Cryo Glow based on temperature */}
      {temperature > 350 && (
        <pointLight
          position={[0, currentChamberCenter, 0]}
          color="#F97316"
          intensity={((temperature - 350) / 100) * 1.5}
          distance={5}
        />
      )}
      {temperature < 290 && (
        <pointLight
          position={[0, currentChamberCenter, 0]}
          color="#38BDF8"
          intensity={((290 - temperature) / 50) * 1.5}
          distance={5}
        />
      )}
    </group>
  );
}

// ----------------------------------------------------------------------------
// 3D MOLECULE PARTICLE FIELD (PHYSICS + DISSOCIATION / RECOMBINATION)
// ----------------------------------------------------------------------------

interface MolecularFieldProps {
  molecules: Molecule3DData[];
  pistonY: number;
  temperature: number;
}

function MolecularField({ molecules, pistonY, temperature }: MolecularFieldProps) {
  // Rectangular inner boundaries accounting for enlarged molecule collision radius (~0.65)
  // chamberWidth is 5.2 ([-2.6, 2.6]) -> halfWidth safe margin = 1.95
  // chamberDepth is 2.4 ([-1.2, 1.2]) -> halfDepth safe margin = 0.65
  // chamberBottom is -2.0 -> bottom safe margin = -1.35
  const halfWidth = 1.95;
  const halfDepth = 0.65;
  const chamberBottom = -1.35;
  const itemRefs = useRef<Map<string, THREE.Group>>(new Map());

  // Animate molecules directly via object3D refs in useFrame (bypasses React reconciliation)
  useFrame((_, delta) => {
    const thermalSpeed = Math.sqrt(temperature / 298.15);
    const dt = Math.min(delta, 0.033);
    // Piston bottom is at pistonY; safe collision buffer below piston is 0.65
    const topBound = pistonY - 0.65;

    for (let i = 0; i < molecules.length; i++) {
      const m = molecules[i];
      const grp = itemRefs.current.get(m.id);

      // Physics integration
      m.pos.x += m.vel.x * thermalSpeed * dt;
      m.pos.y += m.vel.y * thermalSpeed * dt;
      m.pos.z += m.vel.z * thermalSpeed * dt;

      m.rot.x += m.rotSpeed.x * thermalSpeed * dt;
      m.rot.y += m.rotSpeed.y * thermalSpeed * dt;
      m.rot.z += m.rotSpeed.z * thermalSpeed * dt;

      // Rectangular box collisions on X and Z with strict bounds clamping
      if (m.pos.x < -halfWidth) {
        m.pos.x = -halfWidth;
        m.vel.x = Math.abs(m.vel.x);
      } else if (m.pos.x > halfWidth) {
        m.pos.x = halfWidth;
        m.vel.x = -Math.abs(m.vel.x);
      }

      if (m.pos.z < -halfDepth) {
        m.pos.z = -halfDepth;
        m.vel.z = Math.abs(m.vel.z);
      } else if (m.pos.z > halfDepth) {
        m.pos.z = halfDepth;
        m.vel.z = -Math.abs(m.vel.z);
      }

      // Vertical piston & bottom bounds collision with strict bounds clamping
      if (m.pos.y < chamberBottom) {
        m.pos.y = chamberBottom;
        m.vel.y = Math.abs(m.vel.y);
      } else if (m.pos.y > topBound) {
        m.pos.y = topBound;
        m.vel.y = -Math.abs(m.vel.y);
      }

      // Direct matrix/position sync without React state rerenders
      if (grp) {
        grp.position.set(m.pos.x, m.pos.y, m.pos.z);
        grp.rotation.set(m.rot.x, m.rot.y, m.rot.z);
      }
    }
  });

  return (
    <group>
      {molecules.map((m) => (
        <group
          key={m.id}
          ref={(el) => {
            if (el) itemRefs.current.set(m.id, el);
            else itemRefs.current.delete(m.id);
          }}
          position={[m.pos.x, m.pos.y, m.pos.z]}
          rotation={[m.rot.x, m.rot.y, m.rot.z]}
        >
          {/* 3D Molecule Model */}
          {m.type === "N2O4" ? <MoleculeN2O4 /> : <MoleculeNO2 />}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export interface LeChatelierPrincipleGamePageProps {
  difficulty?: string;
  onExit?: () => void;
}

export function LeChatelierPrincipleGamePage({
  difficulty = "level1",
  onExit,
}: LeChatelierPrincipleGamePageProps) {
  // Navigation: "mission" -> "instructions" -> "lab"
  const [introStep, setIntroStep] = useState<"mission" | "instructions" | "lab">("mission");
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // --------------------------------------------------------------------------
  // THERMODYNAMIC STATE & PARAMETERS
  // Reaction: N2O4(g) <=> 2NO2(g), Delta H = +57.2 kJ/mol
  // --------------------------------------------------------------------------
  // Temperature (Kelvin): range 273K (ice bath) to 420K (boiling), start at 273K
  const [temperature, setTemperature] = useState<number>(273);
  const [tempSliderVal, setTempSliderVal] = useState<number>(273);

  // Pressure (atm): range 0.5 to 3.5 atm, standard 1.0 atm
  const [pressure, setPressure] = useState<number>(1.0);
  const [pressureSliderVal, setPressureSliderVal] = useState<number>(1.0);

  // Bottom dock active tab: "temperature" | "pressure" | "concentration"
  const [activeTab, setActiveTab] = useState<"temperature" | "pressure" | "concentration">("temperature");

  // Dynamic Piston Height Y (animates between 0.2 for 3.5 atm compressed and 2.1 for 0.5 atm expanded)
  const targetPistonY = useMemo(() => {
    // Direct interactive tracking with pressureSliderVal so the piston moves live as you slide
    const norm = (pressureSliderVal - 0.5) / (3.5 - 0.5);
    return 2.1 - norm * 1.8;
  }, [pressureSliderVal]);

  const [currentPistonY, setCurrentPistonY] = useState<number>(targetPistonY);

  // Smooth piston animation towards target height
  useEffect(() => {
    let animId: number;
    const animatePiston = () => {
      setCurrentPistonY((prev) => {
        const diff = targetPistonY - prev;
        if (Math.abs(diff) < 0.005) return targetPistonY;
        return prev + diff * 0.2; // Quick responsive follow
      });
      if (Math.abs(currentPistonY - targetPistonY) > 0.005) {
        animId = requestAnimationFrame(animatePiston);
      }
    };
    animId = requestAnimationFrame(animatePiston);
    return () => cancelAnimationFrame(animId);
  }, [targetPistonY, currentPistonY]);

  // --------------------------------------------------------------------------
  // MOLECULE POPULATION IN 3D SCENE
  // Starts at 273K with exactly 4 N2O4 molecules and 0 NO2 molecules (Colorless)
  // --------------------------------------------------------------------------
  const [molecules, setMolecules] = useState<Molecule3DData[]>([
    {
      id: `N2O4-init-1`,
      type: "N2O4",
      pos: new THREE.Vector3(-1.3, -0.4, -0.2),
      vel: new THREE.Vector3(0.5, 0.4, 0.2),
      rot: new THREE.Euler(0.3, 0.5, 0),
      rotSpeed: new THREE.Euler(0.4, 0.6, 0.2),
    },
    {
      id: `N2O4-init-2`,
      type: "N2O4",
      pos: new THREE.Vector3(1.3, 0.4, 0.2),
      vel: new THREE.Vector3(-0.5, -0.3, -0.2),
      rot: new THREE.Euler(-0.4, 0.8, 0),
      rotSpeed: new THREE.Euler(-0.5, 0.3, 0.4),
    },
    {
      id: `N2O4-init-3`,
      type: "N2O4",
      pos: new THREE.Vector3(-0.5, 0.5, 0.1),
      vel: new THREE.Vector3(0.4, -0.5, 0.3),
      rot: new THREE.Euler(0.6, -0.2, 0.1),
      rotSpeed: new THREE.Euler(0.3, 0.4, 0.5),
    },
    {
      id: `N2O4-init-4`,
      type: "N2O4",
      pos: new THREE.Vector3(0.6, -0.5, -0.1),
      vel: new THREE.Vector3(-0.4, 0.5, -0.3),
      rot: new THREE.Euler(-0.5, 0.3, 0.2),
      rotSpeed: new THREE.Euler(-0.4, 0.3, -0.3),
    },
  ]);

  // Exact stoichiometric Target Counts:
  // 1 N2O4 <=> 2 NO2  (Strict Conservation of Nitrogen: 2 * nN2O4 + nNO2)
  //
  // In Temperature mode:
  // - Starts at 273K with 2 N2O4 and 0 NO2 (colorless)
  // - Increasing temperature dissociates into NO2 (up to 4 NO2 at 420K)
  //
  // In Pressure mode:
  // - At 0.5 atm (expanded): favors 2 NO2
  // - When pressure increases (pushed down >= 1.8 atm): favors 1 N2O4 and 0 NO2
  //
  // In Concentration mode:
  // - Target reflects the exact stoichiometric balance of the current nitrogen atoms.
  // - Association ONLY happens if there are AT LEAST 2 NO2 molecules! (2 NO2 -> 1 N2O4)
  const { targetN2O4, targetNO2 } = useMemo(() => {
    const countN2O4 = molecules.filter((m) => m.type === "N2O4").length;
    const countNO2 = molecules.filter((m) => m.type === "NO2").length;

    if (activeTab === "pressure") {
      if (pressure >= 1.8) {
        return { targetN2O4: 1, targetNO2: 0 };
      } else {
        return { targetN2O4: 0, targetNO2: 2 };
      }
    }

    if (activeTab === "concentration") {
      // In Concentration mode:
      // Initially, chamber is completely empty: both NO2 and N2O4 are 0.
      // When user adds NO2, once there are at least 2 NO2 molecules, they associate into 1 N2O4!
      // (e.g. 2 NO2 -> 1 N2O4; adding 2 more NO2 -> converts into another N2O4).
      const possibleN2O4Pairs = Math.floor(countNO2 / 2);
      if (possibleN2O4Pairs >= 1) {
        return {
          targetN2O4: countN2O4 + possibleN2O4Pairs,
          targetNO2: countNO2 % 2,
        };
      } else {
        // Less than 2 NO2 (0 or 1 NO2): no association possible
        return { targetN2O4: countN2O4, targetNO2: countNO2 };
      }
    }

    // Default: Temperature mode (Starts at 273K with 4 N2O4, converts up to 8 NO2)
    if (temperature <= 273) {
      return { targetN2O4: 4, targetNO2: 0 };
    }
    if (temperature >= 390) {
      return { targetN2O4: 0, targetNO2: 8 };
    }
    if (temperature > 350) {
      return { targetN2O4: 1, targetNO2: 6 };
    }
    if (temperature > 310) {
      return { targetN2O4: 2, targetNO2: 4 };
    } else {
      return { targetN2O4: 3, targetNO2: 2 };
    }
  }, [activeTab, pressure, temperature, molecules]);

  // --------------------------------------------------------------------------
  // LE CHATELIER DISSOCIATION & ASSOCIATION ENGINE
  // Real-time conversion: 1 N2O4 <=> 2 NO2 strictly conserving matter!
  // Dissociation: 1 N2O4 -> 2 NO2
  // Association:  2 NO2 -> 1 N2O4
  // --------------------------------------------------------------------------
  const [shiftNotice, setShiftNotice] = useState<string | null>(null);

  useEffect(() => {
    if (introStep !== "lab") return;

    const interval = setInterval(() => {
      setMolecules((prevList) => {
        const countN2O4 = prevList.filter((m) => m.type === "N2O4").length;
        const countNO2 = prevList.filter((m) => m.type === "NO2").length;

        // Case A: System needs to dissociate (N2O4 -> 2 NO2)
        // Only split if we have N2O4 available and NO2 is below target
        if (countNO2 < targetNO2 && countN2O4 > targetN2O4) {
          const n2o4Index = prevList.findIndex((m) => m.type === "N2O4");
          if (n2o4Index !== -1) {
            const parent = prevList[n2o4Index];
            const newList = [...prevList];
            newList.splice(n2o4Index, 1);

            // Cleave 1 N2O4 into exactly 2 NO2 molecules
            newList.push({
              id: `NO2-gen-${Date.now()}-A`,
              type: "NO2",
              pos: parent.pos.clone().add(new THREE.Vector3(0.2, 0.1, 0.1)),
              vel: parent.vel.clone().add(new THREE.Vector3(0.5, 0.3, 0.2)),
              rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
              rotSpeed: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
            });
            newList.push({
              id: `NO2-gen-${Date.now()}-B`,
              type: "NO2",
              pos: parent.pos.clone().add(new THREE.Vector3(-0.2, -0.1, -0.1)),
              vel: parent.vel.clone().add(new THREE.Vector3(-0.5, -0.3, -0.2)),
              rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
              rotSpeed: new THREE.Euler(Math.random() * 2, Math.random() * 2, 0),
            });
            return newList;
          }
        }

        // Case B: System needs to associate (2 NO2 -> 1 N2O4)
        // Combine exactly 2 NO2 into 1 N2O4
        if (countN2O4 < targetN2O4 && countNO2 >= 2) {
          const no2Indices: number[] = [];
          for (let i = 0; i < prevList.length; i++) {
            if (prevList[i].type === "NO2") no2Indices.push(i);
            if (no2Indices.length === 2) break;
          }

          if (no2Indices.length === 2) {
            const m1 = prevList[no2Indices[0]];
            const newList = prevList.filter((_, idx) => !no2Indices.includes(idx));

            // Merge 2 NO2 into 1 N2O4
            newList.push({
              id: `N2O4-gen-${Date.now()}`,
              type: "N2O4",
              pos: m1.pos.clone(),
              vel: m1.vel.clone().multiplyScalar(0.7),
              rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
              rotSpeed: new THREE.Euler(Math.random(), Math.random(), 0),
            });
            return newList;
          }
        }

        return prevList;
      });
    }, 1000); // 1000ms stable step

    return () => clearInterval(interval);
  }, [targetN2O4, targetNO2, introStep]);

  // Macroscopic brown color intensity [0, 1] derived purely from NO2 molecules
  // If count of NO2 is 0 -> brownIntensity is strictly 0 (completely clear and colorless)
  // Max 8 NO2 gives full visible brown tint
  const currentCountNO2 = molecules.filter((m) => m.type === "NO2").length;
  const currentCountN2O4 = molecules.filter((m) => m.type === "N2O4").length;
  const brownIntensity = currentCountNO2 === 0 ? 0 : Math.min(1.0, currentCountNO2 / 8);

  // --------------------------------------------------------------------------
  // USER ACTIONS & DISTURBANCES
  // --------------------------------------------------------------------------
  // Tab Selection
  const handleSelectTab = (tab: "temperature" | "pressure" | "concentration") => {
    setActiveTab(tab);
    if (tab === "pressure") {
      setPressure(0.5);
      setPressureSliderVal(0.5);
      setMolecules([
        {
          id: `NO2-p-start-1`,
          type: "NO2",
          pos: new THREE.Vector3(-0.9, 0.4, 0),
          vel: new THREE.Vector3(0.5, 0.4, 0.2),
          rot: new THREE.Euler(0.3, 0.5, 0),
          rotSpeed: new THREE.Euler(0.4, 0.5, 0.2),
        },
        {
          id: `NO2-p-start-2`,
          type: "NO2",
          pos: new THREE.Vector3(0.9, 0.1, 0),
          vel: new THREE.Vector3(-0.5, -0.3, -0.2),
          rot: new THREE.Euler(-0.3, 0.7, 0),
          rotSpeed: new THREE.Euler(-0.4, 0.4, 0.3),
        },
      ]);
      setShiftNotice("Pressure mode: Starts at 0.5 atm with 2 NO₂ molecules. Compress to 1 N₂O₄!");
      setTimeout(() => setShiftNotice(null), 4000);
    } else if (tab === "concentration") {
      // In Concentration mode, starts with both molecules at 0!
      setTemperature(298);
      setTempSliderVal(298);
      setPressure(1.0);
      setPressureSliderVal(1.0);
      setMolecules([]); // Both N2O4 and NO2 start at 0
      setShiftNotice("Concentration Lab: Initially both molecules are 0. Click '+ NO₂' to add molecules and watch them convert into N₂O₄!");
      setTimeout(() => setShiftNotice(null), 4000);
    } else if (tab === "temperature") {
      setTemperature(273);
      setTempSliderVal(273);
      setPressure(1.0);
      setPressureSliderVal(1.0);
      setMolecules([
        {
          id: `N2O4-init-1`,
          type: "N2O4",
          pos: new THREE.Vector3(-1.3, -0.4, -0.2),
          vel: new THREE.Vector3(0.5, 0.4, 0.2),
          rot: new THREE.Euler(0.3, 0.5, 0),
          rotSpeed: new THREE.Euler(0.4, 0.6, 0.2),
        },
        {
          id: `N2O4-init-2`,
          type: "N2O4",
          pos: new THREE.Vector3(1.3, 0.4, 0.2),
          vel: new THREE.Vector3(-0.5, -0.3, -0.2),
          rot: new THREE.Euler(-0.4, 0.8, 0),
          rotSpeed: new THREE.Euler(-0.5, 0.3, 0.4),
        },
        {
          id: `N2O4-init-3`,
          type: "N2O4",
          pos: new THREE.Vector3(-0.5, 0.5, 0.1),
          vel: new THREE.Vector3(0.4, -0.5, 0.3),
          rot: new THREE.Euler(0.6, -0.2, 0.1),
          rotSpeed: new THREE.Euler(0.3, 0.4, 0.5),
        },
        {
          id: `N2O4-init-4`,
          type: "N2O4",
          pos: new THREE.Vector3(0.6, -0.5, -0.1),
          vel: new THREE.Vector3(-0.4, 0.5, -0.3),
          rot: new THREE.Euler(-0.5, 0.3, 0.2),
          rotSpeed: new THREE.Euler(-0.4, 0.3, -0.3),
        },
      ]);
      setShiftNotice("Temperature mode: Starts at 273 K with 4 N₂O₄ molecules (colorless).");
      setTimeout(() => setShiftNotice(null), 3500);
    }
  };

  const handleApplyChange = () => {
    if (activeTab === "temperature") {
      setTemperature(tempSliderVal);
      const isHeating = tempSliderVal > temperature;
      setShiftNotice(
        isHeating
          ? "🔥 Temperature increased! Endothermic forward shift (N₂O₄ → 2NO₂) darkens the brown color."
          : "❄️ Temperature decreased! Exothermic reverse shift (2NO₂ → N₂O₄) clears the color."
      );
    } else if (activeTab === "pressure") {
      setPressure(pressureSliderVal);
      const isComp = pressureSliderVal > pressure;
      setShiftNotice(
        isComp
          ? "⬆️ Piston compressed! Higher pressure shifts to fewer gas moles (2NO₂ → N₂O₄)."
          : "⬇️ Piston expanded! Lower pressure shifts to more gas moles (N₂O₄ → 2NO₂)."
      );
    }
    setTimeout(() => setShiftNotice(null), 4000);
  };

  const handleAddNO2 = () => {
    // Inject 1 NO2 molecule each time user clicks + NO2
    setMolecules((prev) => [
      ...prev,
      {
        id: `NO2-added-${Date.now()}-${Math.random()}`,
        type: "NO2",
        pos: new THREE.Vector3((Math.random() - 0.5) * 1.5, targetPistonY - 0.4, (Math.random() - 0.5) * 0.8),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, -0.6, (Math.random() - 0.5) * 0.4),
        rot: new THREE.Euler(Math.random(), Math.random(), 0),
        rotSpeed: new THREE.Euler(1, 1, 0),
      },
    ]);
    setShiftNotice("➕ Added 1 NO₂ molecule! When at least 2 NO₂ exist, they associate into 1 N₂O₄.");
    setTimeout(() => setShiftNotice(null), 4000);
  };

  const handleRemoveNO2 = () => {
    setMolecules((prev) => {
      const idx = prev.findIndex((m) => m.type === "NO2");
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
    setShiftNotice("➖ Removed NO₂! System shifts right (N₂O₄ → 2NO₂) to replace lost product.");
    setTimeout(() => setShiftNotice(null), 4000);
  };

  const handleAddN2O4 = () => {
    setMolecules((prev) => [
      ...prev,
      {
        id: `N2O4-added-${Date.now()}`,
        type: "N2O4",
        pos: new THREE.Vector3(0, targetPistonY - 0.4, 0),
        vel: new THREE.Vector3(0.2, -0.9, 0),
        rot: new THREE.Euler(0, 0, 0),
        rotSpeed: new THREE.Euler(0.5, 0.5, 0),
      },
    ]);
    setShiftNotice("➕ Added N₂O₄! System shifts right (N₂O₄ → 2NO₂) to consume added reactant.");
    setTimeout(() => setShiftNotice(null), 4000);
  };

  const handleRemoveN2O4 = () => {
    setMolecules((prev) => {
      const idx = prev.findIndex((m) => m.type === "N2O4");
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
    setShiftNotice("➖ Removed N₂O₄! System shifts left (2NO₂ → N₂O₄) to replenish lost reactant.");
    setTimeout(() => setShiftNotice(null), 4000);
  };

  const handleReset = () => {
    setTemperature(273);
    setTempSliderVal(273);
    setPressure(1.0);
    setPressureSliderVal(1.0);
    setMolecules([
      {
        id: `N2O4-reset-1`,
        type: "N2O4",
        pos: new THREE.Vector3(-1.3, -0.4, -0.2),
        vel: new THREE.Vector3(0.5, 0.4, 0.2),
        rot: new THREE.Euler(0.3, 0.5, 0),
        rotSpeed: new THREE.Euler(0.4, 0.6, 0.2),
      },
      {
        id: `N2O4-reset-2`,
        type: "N2O4",
        pos: new THREE.Vector3(1.3, 0.4, 0.2),
        vel: new THREE.Vector3(-0.5, -0.3, -0.2),
        rot: new THREE.Euler(-0.4, 0.8, 0),
        rotSpeed: new THREE.Euler(-0.5, 0.3, 0.4),
      },
      {
        id: `N2O4-reset-3`,
        type: "N2O4",
        pos: new THREE.Vector3(-0.5, 0.5, 0.1),
        vel: new THREE.Vector3(0.4, -0.5, 0.3),
        rot: new THREE.Euler(0.6, -0.2, 0.1),
        rotSpeed: new THREE.Euler(0.3, 0.4, 0.5),
      },
      {
        id: `N2O4-reset-4`,
        type: "N2O4",
        pos: new THREE.Vector3(0.6, -0.5, -0.1),
        vel: new THREE.Vector3(-0.4, 0.5, -0.3),
        rot: new THREE.Euler(-0.5, 0.3, 0.2),
        rotSpeed: new THREE.Euler(-0.4, 0.3, -0.3),
      },
    ]);
    setShiftNotice("System reset to 273 K (Ice bath, 4 N₂O₄ molecules, colorless).");
    setTimeout(() => setShiftNotice(null), 3500);
  };

  const handleExitClick = () => {
    if (onExit) onExit();
    else window.history.back();
  };

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-slate-800 relative overflow-hidden select-none font-sans flex flex-col rounded-3xl sm:rounded-[32px] border border-slate-200/80 shadow-2xl">
      {/* ──────────────────────────────────────────────────────────────────
          MAIN CONTAINER: Matching Topic 1 and 2
          ────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 0A: MISSION STATEMENT
            ══════════════════════════════════════════════════════════════════ */}
        {introStep === "mission" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            {/* Top Bar: Exit */}
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
                title="Exit"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>EXIT</span>
              </button>
            </div>

            {/* Centered Single-Liner Mission Statement */}
            <div className="max-w-2xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
                <span className="text-[#0284C7]">MISSION:</span> Explore Le Chatelier&apos;s Principle by shifting the reaction between colorless N₂O₄ and brown NO₂!
              </h1>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIntroStep("instructions")}
                  className="px-8 sm:px-10 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 inline-flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105 active:scale-95"
                >
                  <span>NEXT</span>
                  <ChevronRight className="w-4 h-4 text-sky-200" />
                </button>
              </div>
            </div>

            <div className="h-8 shrink-0" />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SCREEN 0B: INSTRUCTIONS SCREEN (3 Guidance Cards)
            ══════════════════════════════════════════════════════════════════ */}
        {introStep === "instructions" && (
          <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-white overflow-y-auto rounded-3xl sm:rounded-[32px]">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between z-10 shrink-0">
              <button
                type="button"
                onClick={handleExitClick}
                className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>EXIT</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-r from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
                <div className="px-4 py-1.5 rounded-full bg-slate-900 text-white font-extrabold text-[11px] sm:text-xs tracking-wider flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                  <span>INSTRUCTIONS TO PLAY</span>
                </div>
                <div className="w-8 sm:w-16 h-[2px] bg-gradient-to-l from-transparent via-[#0284C7] to-[#0284C7] rounded-full hidden xs:block" />
              </div>

              <div className="w-16" />
            </div>

            {/* 3 Step Guidance Cards */}
            <div className="max-w-4xl w-full mx-auto flex flex-col justify-center items-center z-10 px-2 sm:px-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full items-stretch">

                {/* Card 1: Adjust Conditions */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        1
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Adjust Lab Conditions
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[9px] uppercase tracking-wider">
                        Temp • Pressure • Moles
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Select a tab at the bottom to alter Temperature (K), move the Pressure slider, or inject molecules, then tap <strong>APPLY</strong>.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/le_chatelier_step1_controls.png"
                      alt="Control Dock & Sliders"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 2: Observe 3D Chamber Reaction */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        2
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Watch Molecular Shifts
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[9px] uppercase tracking-wider">
                        N₂O₄ ⇌ 2 NO₂
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Watch bonds split or form inside the reaction chamber. Colorless N₂O₄ dissociates into brown NO₂, or combines back.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/le_chatelier_step2_chamber.png"
                      alt="3D Reaction Chamber"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

                {/* Card 3: Track Live Equilibrium Monitor */}
                <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 shadow-md shadow-sky-900/5 border border-sky-200/80 hover:border-sky-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                        3
                      </div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                        Track Live Equilibrium
                      </h3>
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px] uppercase tracking-wider">
                        Live Composition
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-1.5">
                      Check real-time mole counts on the monitor to see whether the system is associating, dissociating, or balanced.
                    </p>
                  </div>
                  <div className="w-full h-20 sm:h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50 flex items-center justify-center mt-2 shadow-inner p-1">
                    <img
                      src="/instructions/le_chatelier_step3_monitor.png"
                      alt="Live Equilibrium Monitor"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 pb-5 flex items-center justify-center gap-3 sm:gap-4 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIntroStep("mission")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 stroke-[3]" />
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setIntroStep("lab")}
                className="w-28 sm:w-32 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5 text-sky-200 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LAB TOP HEADER (Minimalist & Clean)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 pt-3 pb-1 shrink-0 z-20 bg-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExitClick}
              className="flex items-center gap-1 h-7 sm:h-8 px-3 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>EXIT</span>
            </button>


          </div>

          {/* Explanation Button */}
          <button
            type="button"
            onClick={() => setShowExplanationModal(true)}
            className="flex items-center gap-1.5 h-7 sm:h-8 px-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-200" />
            <span className="hidden sm:inline">EXPLANATION</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MAIN 3D CANVAS VIEW (Clean, No Overlay Boxes)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="relative flex-1 w-full overflow-hidden bg-white">

          {/* Active Shift Notification Banner */}
          {shiftNotice && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 text-white font-semibold text-xs py-1 px-3.5 rounded-full shadow-md border border-slate-700 animate-in fade-in duration-150 max-w-lg text-center">
              {shiftNotice}
            </div>
          )}

          {/* Right Side Equilibrium Composition & Conversion Monitor */}
          <div className="absolute top-3 right-3 z-20 w-44 sm:w-48 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-xl space-y-2.5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                Live Equilibrium
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {pressure.toFixed(1)} atm
              </span>
            </div>

            {/* N2O4 Level Gauge */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 font-bold text-blue-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8] inline-block shadow-xs" />
                  N₂O₄
                </span>
                <span className="font-black text-blue-900">{currentCountN2O4} mol</span>
              </div>
              <div className="w-full h-2 bg-blue-50 rounded-full overflow-hidden border border-blue-200/60 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(8, (currentCountN2O4 / 16) * 100))}%` }}
                />
              </div>
            </div>

            {/* NO2 Level Gauge */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block shadow-xs" />
                  NO₂
                </span>
                <span className="font-black text-amber-950">{currentCountNO2} mol</span>
              </div>
              <div className="w-full h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-200/60 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(8, (currentCountNO2 / 24) * 100))}%` }}
                />
              </div>
            </div>

            {/* Dynamic Conversion & Equilibrium Shift Arrow */}
            <div className="pt-1 border-t border-slate-100">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Dynamic Shift
              </div>
              <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-[10px] font-black">
                {currentCountNO2 < targetNO2 ? (
                  <span className="text-rose-600 flex items-center gap-1 animate-pulse">
                    <span>N₂O₄</span>
                    <ArrowRight className="w-3 h-3 stroke-[3]" />
                    <span>2 NO₂</span>
                    <span className="text-[9px] font-bold text-rose-500">(Dissociating)</span>
                  </span>
                ) : currentCountN2O4 < targetN2O4 ? (
                  <span className="text-blue-700 flex items-center gap-1 animate-pulse">
                    <span>2 NO₂</span>
                    <ArrowLeft className="w-3 h-3 stroke-[3]" />
                    <span>N₂O₄</span>
                    <span className="text-[9px] font-bold text-blue-600">(Associating)</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1 font-mono">
                    <span>N₂O₄ ⇌ 2 NO₂</span>
                    <span className="text-[9px] font-sans font-bold text-emerald-600">(Balanced)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Three.js Canvas */}
          <Canvas
            className="w-full h-full"
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0.2, 7.8], fov: 45 }}
          >
            <ambientLight intensity={1.1} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
            <directionalLight position={[-5, -4, -3]} intensity={0.5} color="#93C5FD" />

            <Suspense fallback={null}>
              {/* Reactor Cylinder & Movable Piston */}
              <ReactorVessel
                pistonY={currentPistonY}
                brownIntensity={brownIntensity}
                temperature={temperature}
              />

              {/* Real-time Bouncing Molecules */}
              <MolecularField
                molecules={molecules}
                pistonY={currentPistonY}
                temperature={temperature}
              />
            </Suspense>

            <OrbitControls
              enablePan={false}
              minDistance={4.5}
              maxDistance={8.5}
              maxPolarAngle={Math.PI / 2 + 0.15}
              minPolarAngle={Math.PI / 4}
            />
          </Canvas>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BOTTOM CONTROL DOCK (Clean, Balanced & Responsive)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="w-full bg-white border-t border-slate-100 px-3 sm:px-6 py-3.5 z-30 shrink-0 flex justify-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl w-full">

            {/* Mode Selection Tabs (Compact Pills) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => handleSelectTab("temperature")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === "temperature"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Temperature
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("pressure")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === "pressure"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Pressure
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab("concentration")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${activeTab === "concentration"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Concentration
              </button>
            </div>

            {/* Dynamic Input Controls (Increased Slider Length) */}
            <div className="flex-1 w-full max-w-md px-1 sm:px-3">
              {/* Tab 1: Temperature Slider */}
              {activeTab === "temperature" && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">273 K</span>
                  <input
                    type="range"
                    min={273}
                    max={420}
                    step={5}
                    value={tempSliderVal}
                    onChange={(e) => setTempSliderVal(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">420 K</span>
                  <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                    {tempSliderVal} K
                  </span>
                </div>
              )}

              {/* Tab 2: Pressure Slider */}
              {activeTab === "pressure" && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">0.5 atm</span>
                  <input
                    type="range"
                    min={0.5}
                    max={3.5}
                    step={0.1}
                    value={pressureSliderVal}
                    onChange={(e) => setPressureSliderVal(Number(e.target.value))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0">3.5 atm</span>
                  <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0">
                    {pressureSliderVal.toFixed(1)} atm
                  </span>
                </div>
              )}

              {/* Tab 3: Concentration Injections */}
              {activeTab === "concentration" && (
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddNO2}
                    className="py-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    + NO₂
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveNO2}
                    className="py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    - NO₂
                  </button>

                  <button
                    type="button"
                    onClick={handleAddN2O4}
                    className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    + N₂O₄
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveN2O4}
                    className="py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    - N₂O₄
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {activeTab !== "concentration" && (
                <button
                  type="button"
                  onClick={handleApplyChange}
                  className="px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                >
                  <span>Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LAYER 4: COMPREHENSIVE EXPLANATION MODAL (JEE Main Level)
            ══════════════════════════════════════════════════════════════════ */}
        {showExplanationModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150 rounded-3xl sm:rounded-[32px]">
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-white">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  Le Chatelier&apos;s Principle • Equilibrium Shift Guide
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold font-mono">
                  N₂O₄(g) ⇌ 2 NO₂(g) • ΔH° = +57.2 kJ/mol (Endothermic)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-8 space-y-6 text-slate-700 leading-relaxed font-sans text-xs sm:text-sm max-w-4xl mx-auto w-full">

              {/* Core Principle Statement */}
              <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 p-5 rounded-2xl border-2 border-sky-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-800 bg-sky-200/80 px-2.5 py-0.5 rounded-full inline-block">
                    Fundamental Law
                  </span>
                  <h3 className="font-black text-base text-slate-900">
                    Le Chatelier&apos;s Principle
                  </h3>
                </div>
                <blockquote className="italic font-serif text-slate-800 text-sm sm:text-base border-l-4 border-sky-600 pl-3 py-1 bg-white/70 rounded-r-xl">
                  &ldquo;If a dynamic equilibrium is subjected to any disturbance in temperature, pressure, or concentration of the components, the system shifts in a direction that opposes or counteracts that disturbance to establish a new equilibrium state.&rdquo;
                </blockquote>
                <div className="text-center font-mono font-black text-xs sm:text-sm text-sky-950 bg-white p-3 rounded-xl border border-sky-200 shadow-inner mt-2">
                  N₂O₄ (g, colorless, 1 mol) ⇌ 2 NO₂ (g, reddish-brown, 2 mol) &nbsp;•&nbsp; ΔH° = +57.2 kJ/mol (Δn_g = +1)
                </div>
              </div>

              {/* 1. TEMPERATURE EFFECT */}
              <div className="space-y-3 border-l-4 border-rose-500 pl-4 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    Parameter 1
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Temperature Changes (Endothermic vs Exothermic)
                  </h4>
                </div>
                <p className="text-slate-700">
                  Because the forward reaction absorbs heat (<strong>ΔH° = +57.2 kJ/mol &gt; 0, Endothermic</strong>), heat can be viewed as a reactant:
                </p>
                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 font-mono text-xs sm:text-sm text-rose-950 font-bold text-center">
                  N₂O₄ (colorless) + Heat ⇌ 2 NO₂ (brown)
                </div>

                <div className="space-y-2 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">
                      • Heating (T ↑ towards 420 K / Boiling Bath):
                    </p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      The system absorbs added heat by shifting <strong>FORWARD (→)</strong>. N–N bonds break, converting colorless N₂O₄ into reddish-brown NO₂ radicals. The gas turns dark brown.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">
                      • Cooling (T ↓ towards 273 K / Ice Bath):
                    </p>
                    <p className="text-slate-600 text-xs mt-0.5">
                      The system releases heat by shifting <strong>REVERSE (←, Exothermic)</strong>:
                    </p>
                    <div className="font-mono text-xs text-indigo-900 font-semibold bg-white p-2 rounded-lg border border-slate-200 my-1 text-center">
                      2 NO₂ (g, brown) ⟶ N₂O₄ (g, colorless) + 57.2 kJ/mol
                    </div>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1">
                      <li><strong>Molecular Association (2 NO₂ → N₂O₄):</strong> Pairs of brown NO₂ molecules collide and fuse a central N–N covalent bond to form planar N₂O₄ dimer molecules.</li>
                      <li><strong>Color Transition (Brown → Colorless):</strong> NO₂ is the only brown species. As NO₂ count drops toward 0, the chamber becomes 100% crystal-clear and colorless.</li>
                      <li><strong>Live Gauge:</strong> Updates to <span className="font-mono text-rose-600 font-bold">2 NO₂ → N₂O₄ (Associating)</span>; NO₂ level drops while N₂O₄ fills.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 2. PRESSURE & VOLUME EFFECT */}
              <div className="space-y-3 border-l-4 border-indigo-500 pl-4 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Parameter 2
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Pressure Changes (Compressing vs Expanding the Chamber)
                  </h4>
                </div>
                <p className="text-slate-700">
                  The key factor is the stoichiometric number of gas moles:
                </p>
                <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 font-mono text-xs text-indigo-950 font-semibold text-center">
                  Reactants: 1 mol gas (N₂O₄) &nbsp;•&nbsp; Products: 2 mol gas (2 NO₂) &nbsp;•&nbsp; Δn_g = +1
                </div>

                <div className="space-y-2 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">
                      • Increasing Pressure (P ↑ / Piston Pushed Down, Volume ↓):
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1 mt-1">
                      <li><strong>Le Chatelier&apos;s Response:</strong> The system opposes high pressure by shifting toward the side with <strong>fewer moles of gas (2 → 1)</strong>.</li>
                      <li><strong>Molecular Reaction:</strong> <span className="font-mono font-bold text-indigo-900">2 NO₂ ⟶ N₂O₄ (Reverse shift)</span>. Two NO₂ molecules fuse into one N₂O₄.</li>
                      <li><strong>Color Observation:</strong> Instantly, gas darkens momentarily because particles are compressed into a smaller volume. Then at equilibrium, the brown color <strong>fades significantly</strong> as NO₂ converts into colorless N₂O₄.</li>
                      <li><strong>Live Panel:</strong> Shifts to <span className="font-mono text-indigo-600 font-bold">2 NO₂ → N₂O₄ (Associating)</span>, N₂O₄ level rises.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">
                      • Decreasing Pressure (P ↓ / Piston Pulled Up, Volume ↑):
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-1 mt-1">
                      <li><strong>Le Chatelier&apos;s Response:</strong> The system counters low pressure by shifting toward the side with <strong>more moles of gas (1 → 2)</strong>.</li>
                      <li><strong>Molecular Reaction:</strong> <span className="font-mono font-bold text-indigo-900">N₂O₄ ⟶ 2 NO₂ (Forward shift)</span>. N₂O₄ splits into two NO₂ radicals.</li>
                      <li><strong>Color Observation:</strong> More reddish-brown NO₂ gas forms.</li>
                      <li><strong>Live Panel:</strong> Shifts to <span className="font-mono text-rose-600 font-bold">N₂O₄ → 2 NO₂ (Dissociating)</span>, NO₂ level rises.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. CONCENTRATION EFFECT */}
              <div className="space-y-3 border-l-4 border-emerald-500 pl-4 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Parameter 3
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Concentration Changes (Injecting or Removing Molecules)
                  </h4>
                </div>
                <p className="text-slate-700">
                  Perturbing concentrations changes the Reaction Quotient <strong>Q_c = [NO₂]² / [N₂O₄]</strong> relative to <strong>K_c</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      • Adding NO₂ (+ NO₂)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Condition:</strong> Q &gt; K_eq (excess product).<br />
                      <strong>Response:</strong> Shifts <strong>backward (reverse)</strong> to consume excess NO₂. Added NO₂ pair up into N₂O₄ (<span className="font-mono">2 NO₂ → N₂O₄</span>).
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      • Adding N₂O₄ (+ N₂O₄)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Condition:</strong> Q &lt; K_eq (excess reactant).<br />
                      <strong>Response:</strong> Shifts <strong>forward</strong> to consume added reactant. N₂O₄ dissociates into brown NO₂ (<span className="font-mono">N₂O₄ → 2 NO₂</span>). Gas turns browner.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      • Removing NO₂ (− NO₂)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Condition:</strong> Q &lt; K_eq (depleted product).<br />
                      <strong>Response:</strong> Shifts <strong>forward</strong> to replenish lost NO₂ by dissociating more N₂O₄ (<span className="font-mono">N₂O₄ → 2 NO₂</span>).
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      • Removing N₂O₄ (− N₂O₄)
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Condition:</strong> Q &gt; K_eq (depleted reactant).<br />
                      <strong>Response:</strong> Shifts <strong>backward (reverse)</strong> to replace lost N₂O₄ by combining NO₂ (<span className="font-mono">2 NO₂ → N₂O₄</span>). Brown color fades.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. SUMMARY TABLE */}
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>📊</span> Summary Table of Le Chatelier Shifts
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Action</th>
                        <th className="px-3 py-2.5">Stressed Parameter</th>
                        <th className="px-3 py-2.5">System Shift</th>
                        <th className="px-3 py-2.5">Molecular Event</th>
                        <th className="px-3 py-2.5">Visual Color Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Increase Temperature</td>
                        <td className="px-3 py-2">T ↑ (Heat added)</td>
                        <td className="px-3 py-2 text-rose-700 font-semibold">Forward (Endothermic)</td>
                        <td className="px-3 py-2 font-mono">N₂O₄ → 2 NO₂</td>
                        <td className="px-3 py-2 text-amber-800">Turns reddish-brown</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Decrease Temperature</td>
                        <td className="px-3 py-2">T ↓ (Heat removed)</td>
                        <td className="px-3 py-2 text-indigo-700 font-semibold">Reverse (Exothermic)</td>
                        <td className="px-3 py-2 font-mono">2 NO₂ → N₂O₄</td>
                        <td className="px-3 py-2 text-sky-800">Brown fades (turns colorless)</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Increase Pressure</td>
                        <td className="px-3 py-2">P ↑ (Vol ↓)</td>
                        <td className="px-3 py-2 text-indigo-700 font-semibold">Toward fewer moles (1 mol)</td>
                        <td className="px-3 py-2 font-mono">2 NO₂ → N₂O₄</td>
                        <td className="px-3 py-2 text-sky-800">Brown color fades (turns paler)</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Decrease Pressure</td>
                        <td className="px-3 py-2">P ↓ (Vol ↑)</td>
                        <td className="px-3 py-2 text-rose-700 font-semibold">Toward more moles (2 mol)</td>
                        <td className="px-3 py-2 font-mono">N₂O₄ → 2 NO₂</td>
                        <td className="px-3 py-2 text-amber-800">More brown NO₂ forms</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Add NO₂</td>
                        <td className="px-3 py-2">[NO₂] ↑</td>
                        <td className="px-3 py-2 text-indigo-700 font-semibold">Away from product (Reverse)</td>
                        <td className="px-3 py-2 font-mono">2 NO₂ → N₂O₄</td>
                        <td className="px-3 py-2 text-slate-600">Consumes excess NO₂ into N₂O₄</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">Add N₂O₄</td>
                        <td className="px-3 py-2">[N₂O₄] ↑</td>
                        <td className="px-3 py-2 text-rose-700 font-semibold">Away from reactant (Forward)</td>
                        <td className="px-3 py-2 font-mono">N₂O₄ → 2 NO₂</td>
                        <td className="px-3 py-2 text-amber-800">Splits into brown NO₂</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Bottom Button */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex justify-center">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-8 py-2.5 rounded-full font-black text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                RESUME SIMULATION
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default LeChatelierPrincipleGamePage;
