"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface SeparationPlant3DProps {
  method: "hydraulic" | "magnetic" | "froth" | "leaching";
  isSimulating: boolean;
  isSeparated: boolean;
  isCorrect: boolean;
  oreColor: string;
  simProgress?: number;
  waterFlow?: number;
  pulseSpeed?: number;
}

interface Particle3D {
  id: number;
  isOre: boolean;
  pos: THREE.Vector3;
  targetPos: THREE.Vector3;
  phase: number;
}

export default function SeparationPlant3D({
  method,
  isSimulating,
  isSeparated,
  isCorrect,
  oreColor,
  simProgress = 0,
  waterFlow = 70,
  pulseSpeed = 65,
}: SeparationPlant3DProps) {
  const oreMeshRef = useRef<THREE.InstancedMesh>(null);
  const gangueMeshRef = useRef<THREE.InstancedMesh>(null);
  const magneticDrumRef = useRef<THREE.Group>(null);
  const impellerRef = useRef<THREE.Group>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 36 Ore + 36 Gangue realistic crushed mineral beads
  const { oreParticles, gangueParticles } = useMemo(() => {
    const ores: Particle3D[] = [];
    const gangues: Particle3D[] = [];

    for (let i = 0; i < 36; i++) {
      ores.push({
        id: i,
        isOre: true,
        pos: new THREE.Vector3(-1.15, 0.75, 0),
        targetPos: new THREE.Vector3(),
        phase: (i / 36) * Math.PI * 2,
      });
      gangues.push({
        id: i,
        isOre: false,
        pos: new THREE.Vector3(-1.15, 0.75, 0),
        targetPos: new THREE.Vector3(),
        phase: (i / 36) * Math.PI * 2 + 0.35, // Staggered phase so gangue sits alongside ore!
      });
    }

    return { oreParticles: ores, gangueParticles: gangues };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // Subtle continuous mechanical animations
    if (magneticDrumRef.current) {
      magneticDrumRef.current.rotation.z -= (isSimulating ? 3 : 0.8) * dt;
    }
    if (impellerRef.current) {
      impellerRef.current.rotation.y += (isSimulating ? 8 : 1.5) * dt;
    }

    const updateParticles = (list: Particle3D[], isOre: boolean, mesh: THREE.InstancedMesh | null) => {
      if (!mesh) return;

      list.forEach((p, i) => {
        let currentScale = 0; // invisible by default when not running in hydraulic mode

        if (!isSimulating && !isSeparated) {
          if (method === "hydraulic") {
            // Mixed raw ore & sandy gangue held inside the elevated feed hopper at [-1.55, 1.20, 0]
            p.targetPos.set(
              -1.55 + Math.sin(p.phase + time * 0.8) * 0.12,
              1.22 + Math.cos(p.phase * 1.2 + time * 0.7) * 0.08,
              Math.sin(p.phase * 0.9 + time * 0.6) * 0.12
            );
            p.pos.lerp(p.targetPos, 0.08);
            currentScale = isOre ? 0.085 : 0.075;
          } else if (method === "magnetic") {
            // Realistic crushed mineral granule size
            currentScale = isOre ? 0.052 : 0.048;

            // Separate lateral distribution for Ore vs Gangue across the belt width
            const lateralOffset = isOre
              ? (((i * 7) % 11) / 10 - 0.5) * 0.40 - 0.03
              : (((i * 13) % 11) / 10 - 0.5) * 0.40 + 0.03;

            // ── IDLE / PRE-SIMULATION: Visible Mixed Bed in Hopper, Spout & Belt Entrance ──
            if (p.id < 18) {
              // Group 1: Clustered strictly inside the conical hopper volume
              const normH = p.id / 18;
              const curY = 0.62 + normH * 0.22; // world Y: 0.62 to 0.84 (inside hopper cone)
              const maxR = 0.07 + normH * 0.09; // strictly inside cone boundary
              const angle = p.phase + (isOre ? 0 : Math.PI);
              const r = 0.02 + ((p.id % 4) / 3) * maxR;

              p.targetPos.set(
                -1.15 + Math.cos(angle + time * 0.3) * r,
                curY + Math.sin(time * 0.6 + p.phase) * 0.008,
                Math.sin(angle + time * 0.3) * r * 0.85
              );
            } else if (p.id < 27) {
              // Group 2: Cascading down the discharge chute toward the belt
              const frac = (p.id - 18) / 9;
              p.targetPos.set(
                -1.12 + frac * 0.18 + Math.sin(p.phase) * 0.02,
                0.50 - frac * 0.21,
                lateralOffset * 0.6
              );
            } else {
              // Group 3: Layer of mixed feed resting on the top belt entrance
              const frac = (p.id - 27) / 9;
              p.targetPos.set(
                -0.92 + frac * 0.35,
                0.265,
                lateralOffset
              );
            }
            p.pos.lerp(p.targetPos, 0.15);
          } else if (method === "froth") {
            // Suspended mixed pulp (Galena PbS Ore + Gangue) inside glass tank before air aeration
            const r = 0.3 + ((p.id % 6) / 5) * 0.7;
            const angle = p.phase * 2 + (isOre ? 0 : Math.PI);
            p.targetPos.set(
              Math.sin(angle) * r,
              -0.25 + Math.sin(time + p.phase) * 0.08 + (p.id % 5) * 0.08,
              Math.cos(angle) * r * 0.65
            );
            p.pos.lerp(p.targetPos, 0.08);
            currentScale = isOre ? 0.075 : 0.068;
          } else if (method === "leaching") {
            // Crushed raw mineral mixture (Bauxite Ore + Red Mud Gangue) in bottom of digester beaker
            const r = 0.2 + ((p.id % 6) / 5) * 0.75;
            const angle = p.phase * 2 + (isOre ? 0 : Math.PI);
            p.targetPos.set(
              Math.sin(angle) * r,
              -0.65 + ((p.id % 4) / 3) * 0.12 + Math.sin(time * 0.8 + p.phase) * 0.03,
              Math.cos(angle) * r * 0.7
            );
            p.pos.lerp(p.targetPos, 0.08);
            currentScale = isOre ? 0.075 : 0.068;
          }
        } else {
          // ── 2. SEPARATING / SEPARATED: Running the plant process ──
          currentScale = isOre ? 0.075 : 0.068;

          // === METHOD 1: HYDRAULIC WASHING ===
          // Mixed powdered feed emerges from the Feed Hopper at [-1.55, 0.72, 0]
          // The water stream washes over the sloped riffled table
          if (method === "hydraulic") {
            const spawnThreshold = (p.id / 30) * 75;
            const isReleased = isSeparated || simProgress >= spawnThreshold;

            if (!isReleased) {
              p.targetPos.set(
                -1.55 + Math.sin(p.phase) * 0.1,
                1.20 + Math.cos(p.phase) * 0.06,
                Math.sin(p.phase * 0.8) * 0.1
              );
              p.pos.lerp(p.targetPos, 0.08);
              currentScale = isOre ? 0.085 : 0.075;
            } else {
              const localProgress = isSeparated
                ? 1.0
                : Math.min(1.0, (simProgress - spawnThreshold) / (100 - spawnThreshold));

              currentScale = isOre ? 0.085 : 0.075;

              // Exact deck surface Y so ore and gangue beads touch the plate precisely:
              const getDeckSurfaceY = (xPos: number) => 0.31 - (xPos + 0.4) * 0.161;

              if (isCorrect) {
                if (isOre) {
                  // Heavy Ore: drops from elevated hopper mouth [-1.55, 0.95, 0] onto table top,
                  // resists the water current, settles firmly, and gets locked into the transverse riffles!
                  const finalX = -1.1 + (p.id % 5) * 0.45;
                  const targetZ = (p.phase % 1 - 0.5) * 0.65;

                  const currentX = THREE.MathUtils.lerp(-1.55, finalX, localProgress);
                  const currentY = localProgress < 0.25
                    ? THREE.MathUtils.lerp(0.95, getDeckSurfaceY(currentX), localProgress / 0.25)
                    : getDeckSurfaceY(currentX);
                  const currentZ = THREE.MathUtils.lerp(0, targetZ, localProgress);

                  p.targetPos.set(currentX, currentY, currentZ);
                } else {
                  // Light Gangue: drops from elevated hopper onto the table, but because it is light,
                  // the running water sweeps it over the riffles all the way to the end (x=1.05)
                  // and washes it down into the tailings/waste collection pool!
                  const tableEndX = 1.05;
                  const finalPoolX = 1.45 + Math.sin(p.phase * 2) * 0.35;
                  const finalPoolY = -0.55 + Math.cos(p.phase) * 0.06;
                  const finalPoolZ = Math.sin(p.phase * 3) * 0.5;

                  if (localProgress < 0.65) {
                    const normP = localProgress / 0.65;
                    const curX = THREE.MathUtils.lerp(-1.55, tableEndX, normP);
                    const curY = normP < 0.22
                      ? THREE.MathUtils.lerp(0.95, getDeckSurfaceY(curX), normP / 0.22)
                      : getDeckSurfaceY(curX);
                    p.targetPos.set(curX, curY, (p.phase % 1 - 0.5) * 0.5);
                  } else {
                    const normP = (localProgress - 0.65) / 0.35;
                    const curX = THREE.MathUtils.lerp(tableEndX, finalPoolX, normP);
                    const curY = THREE.MathUtils.lerp(getDeckSurfaceY(tableEndX), finalPoolY, normP);
                    p.targetPos.set(curX, curY, finalPoolZ);
                  }
                }
              } else {
                // Incorrect method: all particles wash off the table into the pool
                const tableEndX = 1.05;
                const finalPoolX = 1.35 + Math.sin(p.phase) * 0.4;
                if (localProgress < 0.65) {
                  const normP = localProgress / 0.65;
                  const curX = THREE.MathUtils.lerp(-1.55, tableEndX, normP);
                  const curY = normP < 0.22
                    ? THREE.MathUtils.lerp(0.72, getDeckSurfaceY(curX), normP / 0.22)
                    : getDeckSurfaceY(curX);
                  p.targetPos.set(curX, curY, (p.phase % 1 - 0.5) * 0.5);
                } else {
                  const normP = (localProgress - 0.65) / 0.35;
                  const curX = THREE.MathUtils.lerp(tableEndX, finalPoolX, normP);
                  const curY = THREE.MathUtils.lerp(getDeckSurfaceY(tableEndX), -0.55, normP);
                  p.targetPos.set(curX, curY, (p.phase % 1 - 0.5) * 0.5);
                }
              }
            }
          }

          // === METHOD 2: MAGNETIC SEPARATION ===
          // Conveyor belt runs horizontally from x = -0.92 to x = 0.90 at top surface y = 0.265
          // Raw feed is an intimate mixture of Magnetic Ore (Dark) and Non-Magnetic Gangue (Light Sand)
          else if (method === "magnetic") {
            currentScale = isOre ? 0.052 : 0.048;

            const lateralOffset = isOre
              ? (((i * 7) % 11) / 10 - 0.5) * 0.40 - 0.03
              : (((i * 13) % 11) / 10 - 0.5) * 0.40 + 0.03;

            const stagger = (p.id / 36) * 45; // Staggered feed over 0..45% of simulation
            const isReleased = isSeparated || simProgress >= stagger;

            if (!isReleased) {
              // Waiting in feed hopper queue during active simulation
              const normH = (p.id % 18) / 18;
              const curY = 0.64 + normH * 0.20;
              const r = 0.04 + ((p.id % 4) / 3) * 0.07;
              p.targetPos.set(
                -1.15 + Math.cos(p.phase) * r,
                curY + Math.sin(time * 0.8 + p.phase) * 0.008,
                Math.sin(p.phase) * r
              );
            } else {
              // ── ACTIVE SEPARATION OR FULLY SEPARATED ──
              const travel = isSeparated
                ? 1.0
                : Math.min(1.0, (simProgress - stagger) / (100 - stagger));

              const beltStartX = -0.92;
              const drumCenterX = 0.90;
              const drumCenterY = 0.00;
              const drumRadius = 0.265;

              if (travel < 0.60) {
                // STAGE A: RIDE CONVEYOR BELT TOGETHER AS UNIFORM INTIMATE MIXTURE (0.0 -> 0.60)
                const u = travel / 0.60;
                const curX = beltStartX + u * (drumCenterX - beltStartX);
                // Drop from chute mouth onto belt top during first 12%
                const curY = u < 0.12
                  ? THREE.MathUtils.lerp(0.38, 0.265, u / 0.12)
                  : 0.265;

                p.targetPos.set(curX, curY, lateralOffset);
              } else {
                // STAGE B: DIVERGENCE AT ROTATING MAGNETIC ROLLER (0.60 -> 1.0)
                const v = (travel - 0.60) / 0.40;

                if (isCorrect) {
                  // === LEVEL 3: MAGNETITE (Fe3O4) - SUCCESSFUL SEPARATION ===
                  if (isOre) {
                    // 🌑 FERROMAGNETIC ORE (Fe3O4):
                    // Strongly pulled by magnetic core! Clings around drum from 90° down to -90°
                    if (v < 0.62) {
                      const angle = Math.PI / 2 - (v / 0.62) * Math.PI; // 90° -> -90°
                      const drumX = drumCenterX + Math.cos(angle) * drumRadius;
                      const drumY = drumCenterY + Math.sin(angle) * drumRadius;
                      p.targetPos.set(drumX, drumY, lateralOffset * 0.7);
                    } else {
                      // Leaves magnetic field at bottom and drops into Near Bin (Left)
                      const w = (v - 0.62) / 0.38;
                      const heapX = 0.65 + (((p.id * 5) % 9) / 8 - 0.5) * 0.26;
                      const heapY = -0.76 + ((p.id % 4) / 3) * 0.08;
                      const heapZ = (((p.id * 7) % 9) / 8 - 0.5) * 0.35;

                      const dropX = THREE.MathUtils.lerp(drumCenterX - 0.05, heapX, w);
                      const dropY = THREE.MathUtils.lerp(-0.265, heapY, w);
                      p.targetPos.set(dropX, dropY, heapZ);
                    }
                  } else {
                    // ⚪ NON-MAGNETIC GANGUE (Silica Sand):
                    // Has NO magnetic attraction! Carried by forward velocity in a parabolic arc
                    // over the splitter at x=1.05 and into the Far Bin at x=1.50
                    const heapX = 1.50 + (((p.id * 5) % 9) / 8 - 0.5) * 0.30;
                    const heapY = -0.76 + ((p.id % 4) / 3) * 0.08;
                    const heapZ = (((p.id * 11) % 9) / 8 - 0.5) * 0.35;

                    const arcX = THREE.MathUtils.lerp(drumCenterX, heapX, v);
                    const arcY = 0.265 + 0.10 * Math.sin(v * Math.PI * 0.45) - 1.15 * Math.pow(v, 1.55);
                    p.targetPos.set(arcX, Math.max(heapY, arcY), heapZ);
                  }
                } else {
                  // === INCORRECT SELECTION (e.g. Tin Stone SnO2, Galena PbS, Bauxite Al2O3) ===
                  // Both the Ore AND the Gangue are NON-MAGNETIC! Neither has magnetic attraction!
                  // Both fly off tangentially over the splitter into the SAME far bin (x=1.50) as an unseparated mixture!
                  const heapX = 1.50 + (((p.id * 7 + (isOre ? 2 : 5)) % 11) / 10 - 0.5) * 0.38;
                  const heapY = -0.76 + ((p.id % 4) / 3) * 0.08;
                  const heapZ = (((p.id * 13 + (isOre ? 3 : 7)) % 11) / 10 - 0.5) * 0.38;

                  const arcX = THREE.MathUtils.lerp(drumCenterX, heapX, v);
                  const arcY = 0.265 + 0.10 * Math.sin(v * Math.PI * 0.45) - 1.15 * Math.pow(v, 1.55);
                  p.targetPos.set(arcX, Math.max(heapY, arcY), heapZ);
                }
              }
            }
          }

          // === METHOD 3: FROTH FLOTATION ===
          // Hydrophobic Ore (PbS) attaches to oil froth and floats to the top foam layer (y = +0.65 to +0.80)!
          // Hydrophilic Gangue (SiO2) is wetted by water and sinks to tank floor (y = -0.75 to -0.85)!
          else if (method === "froth") {
            const prog = isSeparated ? 1.0 : simProgress / 100;
            const r = 0.25 + ((p.id % 6) / 5) * 0.75;
            const swirlAngle = p.phase * 2 + time * 1.5;

            if (isCorrect) {
              if (isOre) {
                // Hydrophobic Ore floats UPWARD into top golden froth layer!
                const startY = -0.25 + (p.id % 5) * 0.08;
                const topFoamY = 0.68 + ((p.id % 4) / 3) * 0.12 + Math.sin(time * 2 + p.phase) * 0.03;
                const currentY = THREE.MathUtils.lerp(startY, topFoamY, Math.min(1.0, prog * 1.25));

                p.targetPos.set(
                  Math.sin(swirlAngle) * r * 1.15,
                  currentY,
                  Math.cos(swirlAngle) * r * 0.75
                );
                currentScale = 0.075;
              } else {
                // Water-wetted gangue sinks DOWNWARD to tank floor!
                const startY = -0.25 + (p.id % 5) * 0.08;
                const floorY = -0.78 - ((p.id % 3) / 2) * 0.06;
                const currentY = THREE.MathUtils.lerp(startY, floorY, Math.min(1.0, prog * 1.3));

                p.targetPos.set(
                  Math.sin(p.phase * 3 + time * 0.2) * r * 1.05,
                  currentY,
                  Math.cos(p.phase * 3 + time * 0.2) * r * 0.75
                );
                currentScale = 0.068;
              }
            } else {
              // Mismatch: both sink to floor without foam attachment
              p.targetPos.set(
                Math.sin(p.phase * 2) * r,
                -0.80 + ((p.id % 3) / 2) * 0.05,
                Math.cos(p.phase * 2) * r * 0.7
              );
              currentScale = 0.065;
            }
          }

          // === METHOD 4: CHEMICAL LEACHING ===
          // Bayer's Process: Bauxite (Al2O3) dissolves into hot NaOH forming clear Sodium Aluminate solution!
          // Dense Insoluble Red Mud Gangue (Fe2O3, SiO2, TiO2) stays solid and settles at bottom filter!
          else if (method === "leaching") {
            const prog = isSeparated ? 1.0 : simProgress / 100;
            const r = 0.2 + ((p.id % 6) / 5) * 0.75;
            const swirlAngle = p.phase * 2 + time * 2.2;

            if (isCorrect) {
              if (isOre) {
                // Ore dissolves into the solution:
                // During simulation, it lifts, swirls vigorously, and shrinks/dissolves (scale decreases to microscopic/zero as it forms soluble ions)
                const startY = -0.65 + ((p.id % 4) / 3) * 0.12;
                const dissolvedY = 0.10 + Math.sin(time * 1.8 + p.phase) * 0.35;
                const curY = THREE.MathUtils.lerp(startY, dissolvedY, Math.min(1.0, prog * 1.2));

                p.targetPos.set(
                  Math.sin(swirlAngle) * r * 0.9,
                  curY,
                  Math.cos(swirlAngle) * r * 0.75
                );
                // Dissolution effect: particles dissolve into soluble ions [NaAl(OH)4]
                currentScale = THREE.MathUtils.lerp(0.075, 0.015, prog);
              } else {
                // Insoluble Gangue (Red Mud):
                // Agitated slightly by stirring but remains solid and settles completely onto the bottom base filter!
                const filterY = -0.78 - ((p.id % 4) / 3) * 0.06;
                p.targetPos.set(
                  Math.sin(p.phase * 2 + (isSimulating ? time * 0.4 : 0)) * r * 0.85,
                  filterY,
                  Math.cos(p.phase * 2 + (isSimulating ? time * 0.4 : 0)) * r * 0.7
                );
                currentScale = 0.070;
              }
            } else {
              // Mismatch: no reaction, undissolved sludge sits at base
              p.targetPos.set(
                Math.sin(p.phase * 2) * r * 0.85,
                -0.78,
                Math.cos(p.phase * 2) * r * 0.7
              );
              currentScale = 0.070;
            }
          }

          // Smooth gradual movement across the machine (slower for hydraulic table, responsive for conveyor)
          const moveSpeed = method === "hydraulic" ? 0.04 : 0.16;
          p.pos.lerp(p.targetPos, moveSpeed);
        }

        dummy.position.copy(p.pos);
        dummy.scale.setScalar(currentScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    };

    updateParticles(oreParticles, true, oreMeshRef.current);
    updateParticles(gangueParticles, false, gangueMeshRef.current);
  });

  return (
    <group position={[0, -0.1, 0]}>
      {/* ── BRIGHT STUDIO LIGHTING ── */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[6, 8, 7]} intensity={2.0} castShadow />
      <directionalLight position={[-6, 5, -4]} intensity={1.0} color="#BAE6FD" />
      <pointLight position={[0, 4, 3]} intensity={1.0} />

      {/* ── INDUSTRIAL CONTRAST PLATFORM (Matching Crushing / Roasting / Calcination) ── */}
      {/* Heavy Steel Floor Plate - Industrial Slate Navy contrast stage directly under system */}
      <mesh position={[0, -1.15, 0]}>
        <boxGeometry args={[7.8, 0.12, 3.6]} />
        <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Floor Guide Accent Line - Cyan glow runner */}
      <mesh position={[0, -1.08, 0]}>
        <boxGeometry args={[7.6, 0.01, 0.05]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.5} />
      </mesh>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. CLEAN 3D CUTAWAY HYDRAULIC WASHING TANK (Gravity Separation)     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {method === "hydraulic" && (
        <group position={[0, -0.2, 0]}>
          {/* Main 3D Metallic Cutaway Outer Enclosure Chamber */}
          <group position={[0, 0, 0]}>
            {/* Back Wall */}
            <mesh position={[0, 0.4, -1.05]}>
              <boxGeometry args={[4.6, 2.2, 0.15]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-2.25, 0.4, 0]}>
              <boxGeometry args={[0.15, 2.2, 2.1]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[2.25, 0.4, 0]}>
              <boxGeometry args={[0.15, 2.2, 2.1]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Floor Base */}
            <mesh position={[0, -0.7, 0]}>
              <boxGeometry args={[4.6, 0.2, 2.1]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Bottom Front Lip */}
            <mesh position={[0, -0.5, 1.0]}>
              <boxGeometry args={[4.6, 0.25, 0.1]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>

          {/* Clean Sloped 3D Inner Sluice Tray with Metallic Riffles */}
          <group position={[-0.4, 0.35, 0]} rotation={[0, 0, -0.16]}>
            {/* Sluice Tray Body */}
            <mesh>
              <boxGeometry args={[3.2, 0.14, 1.7]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.6} roughness={0.2} />
            </mesh>

            {/* Pulsing Clean Blue Water Layer */}
            <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3.15, 1.64]} />
              <meshStandardMaterial
                color="#0EA5E9"
                transparent
                opacity={0.6 + (pulseSpeed / 400)}
                roughness={0.08}
              />
            </mesh>

            {/* Grooved Transverse Riffles (Catch dense heavy ore) */}
            {[-1.1, -0.6, -0.1, 0.4, 0.9].map((rx, idx) => (
              <mesh key={idx} position={[rx, 0.09, 0]}>
                <boxGeometry args={[0.08, 0.08, 1.64]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
              </mesh>
            ))}

            {/* Sturdy Angled Support Leg */}
            <mesh position={[0.7, -0.55, 0]}>
              <boxGeometry args={[0.15, 0.9, 1.7]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} />
            </mesh>
          </group>

          {/* Flowing Water Cascade & Lower Collection Pool (Right) */}
          <group position={[1.4, -0.3, 0]}>
            {/* Water Pool filling cutaway right */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.5, 0.65, 1.9]} />
              <meshStandardMaterial color="#0284C7" transparent opacity={0.65} roughness={0.05} />
            </mesh>
            {/* Settled Sand / Gangue Bed under pool */}
            <mesh position={[0, -0.3, 0]}>
              <boxGeometry args={[1.45, 0.12, 1.85]} />
              <meshStandardMaterial color="#A8A29E" roughness={0.9} />
            </mesh>
          </group>

          {/* Powdered Ore & Gangue Feed Hopper (Elevated funnel above plate at x=-1.55, y=1.20) */}
          <group position={[-1.55, 1.20, 0]}>
            <mesh>
              <cylinderGeometry args={[0.32, 0.12, 0.50, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Top rim of hopper */}
            <mesh position={[0, 0.25, 0]}>
              <torusGeometry args={[0.32, 0.02, 16, 24]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </group>

          {/* Water Inflow Pipe Mounted on Back Wall (Supplying Washing Stream down table) */}
          <group position={[-1.9, 0.65, -0.6]} rotation={[0, 0, -Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 0.7, 24]} />
              <meshStandardMaterial color="#0284C7" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Water pipe nozzle pointing towards table start */}
            <mesh position={[0, 0.351, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.06, 0.12, 24]} />
              <meshStandardMaterial color="#0369A1" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        </group>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. REALISTIC 3D INDUSTRIAL MAGNETIC SEPARATION PLANT                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {method === "magnetic" && (
        <group position={[0, -0.05, 0]}>
          {/* ── A. FEED HOPPER ASSEMBLY (Firmly mounted over conveyor start) ── */}
          <group position={[-1.15, 0.75, 0]}>
            {/* Open Conical Hopper Body (Open-ended so mixed feed inside is visible!) */}
            <mesh>
              <cylinderGeometry args={[0.32, 0.13, 0.45, 24, 1, true]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Polished Top Rim (Rotated horizontally) */}
            <mesh position={[0, 0.225, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.32, 0.018, 16, 32]} />
              <meshStandardMaterial color="#0EA5E9" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Angled Discharge Spout feeding directly onto the belt surface */}
            <mesh position={[0.07, -0.28, 0]} rotation={[0, 0, -0.32]}>
              <cylinderGeometry args={[0.12, 0.10, 0.20, 24, 1, true]} />
              <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Structural Mounting Struts connected to Conveyor Chassis */}
            <mesh position={[-0.12, -0.42, 0.45]} rotation={[0.4, 0, -0.25]}>
              <cylinderGeometry args={[0.02, 0.02, 0.65, 12]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
            <mesh position={[-0.12, -0.42, -0.45]} rotation={[-0.4, 0, -0.25]}>
              <cylinderGeometry args={[0.02, 0.02, 0.65, 12]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
          </group>

          {/* ── B. INDUSTRIAL CONVEYOR BELT ASSEMBLY ── */}
          <group position={[0, 0, 0]}>
            {/* Top Belt Surface (Moving from Left to Right at y = 0.245) */}
            <mesh position={[-0.20, 0.245, 0]}>
              <boxGeometry args={[2.22, 0.012, 1.08]} />
              <meshStandardMaterial color="#1E293B" roughness={0.85} />
            </mesh>

            {/* Bottom Return Belt Surface (Returning from Right to Left at y = -0.245) */}
            <mesh position={[-0.20, -0.245, 0]}>
              <boxGeometry args={[2.22, 0.012, 1.08]} />
              <meshStandardMaterial color="#1E293B" roughness={0.85} />
            </mesh>

            {/* Left Pulley (Idler Roller) at x = -1.30 */}
            <mesh position={[-1.30, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.24, 1.10, 28]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Left Bearing Pillow Blocks */}
            <mesh position={[-1.30, 0, 0.58]}>
              <boxGeometry args={[0.10, 0.12, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[-1.30, 0, -0.58]}>
              <boxGeometry args={[0.10, 0.12, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>

            {/* Right Pulley: ROTATING RED MAGNETIC ROLLER DRUM at x = 0.90 */}
            <group position={[0.90, 0, 0]} ref={magneticDrumRef}>
              {/* Main Drum Body */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.24, 0.24, 1.10, 32]} />
                <meshStandardMaterial color="#B91C1C" metalness={0.7} roughness={0.25} />
              </mesh>

              {/* Polished Steel Magnetic Pole Rings */}
              <mesh position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.245, 0.015, 16, 32]} />
                <meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.245, 0.015, 16, 32]} />
                <meshStandardMaterial color="#F8FAFC" metalness={0.95} roughness={0.1} />
              </mesh>

              {/* Rotating Axial Indicator Stripe */}
              <mesh position={[0.242, 0, 0]}>
                <boxGeometry args={[0.01, 0.03, 1.08]} />
                <meshStandardMaterial color="#FFFFFF" metalness={0.9} />
              </mesh>
            </group>

            {/* Subtle Magnetic Field Glow Visualizer (Arc around outer front of drum) */}
            <mesh position={[0.90, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <torusGeometry args={[0.29, 0.018, 16, 32, Math.PI]} />
              <meshStandardMaterial
                color="#38BDF8"
                transparent
                opacity={0.35}
                emissive="#0284C7"
                emissiveIntensity={0.8}
              />
            </mesh>

            {/* Right Bearing Pillow Blocks */}
            <mesh position={[0.90, 0, 0.58]}>
              <boxGeometry args={[0.10, 0.12, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            <mesh position={[0.90, 0, -0.58]}>
              <boxGeometry args={[0.10, 0.12, 0.05]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>

            {/* Conveyor Chassis Side Rails (C-Channels at z = ±0.58) */}
            <mesh position={[-0.20, 0, 0.58]}>
              <boxGeometry args={[2.50, 0.08, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-0.20, 0, -0.58]}>
              <boxGeometry args={[2.50, 0.08, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Conveyor Support Legs (4 Sturdy Steel Posts down to floor y = -1.05) */}
            <mesh position={[-1.15, -0.525, 0.58]}>
              <boxGeometry args={[0.06, 0.97, 0.06]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[-1.15, -0.525, -0.58]}>
              <boxGeometry args={[0.06, 0.97, 0.06]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[0.05, -0.525, 0.58]}>
              <boxGeometry args={[0.06, 0.97, 0.06]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            <mesh position={[0.05, -0.525, -0.58]}>
              <boxGeometry args={[0.06, 0.97, 0.06]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
          </group>

          {/* ── C. VERTICAL SPLITTER PLATE (Between Bins at x = 1.05) ── */}
          <group position={[1.05, -0.56, 0]}>
            <mesh>
              <boxGeometry args={[0.03, 0.90, 1.25]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Knife-edge apex on splitter */}
            <mesh position={[0, 0.46, 0]}>
              <boxGeometry args={[0.04, 0.02, 1.25]} />
              <meshStandardMaterial color="#0284C7" metalness={0.9} />
            </mesh>
          </group>

          {/* ── D. OPEN COLLECTION BIN 1 (Near / Left: Magnetic Ore) ── */}
          <group position={[0.65, -0.75, 0]}>
            {/* Front Wall */}
            <mesh position={[0, 0, 0.58]}>
              <boxGeometry args={[0.70, 0.52, 0.03]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Back Wall */}
            <mesh position={[0, 0, -0.58]}>
              <boxGeometry args={[0.70, 0.52, 0.03]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Left Wall */}
            <mesh position={[-0.34, 0, 0]}>
              <boxGeometry args={[0.03, 0.52, 1.18]} />
              <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Floor */}
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.70, 0.03, 1.18]} />
              <meshStandardMaterial color="#0F172A" metalness={0.6} />
            </mesh>

            {/* Settled Mound of Concentrated Magnetic Ore inside bin (ONLY when method is correct and separated) */}
            {isCorrect && isSeparated && (
              <mesh position={[0, -0.16, 0]}>
                <coneGeometry args={[0.26, 0.16, 16]} />
                <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
              </mesh>
            )}

            {/* Crisp Clean Industrial Plaque Badge */}
            <Html position={[0, -0.05, 0.62]} center zIndexRange={[10, 0]}>
              <div className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-emerald-500/70 text-center shadow-md whitespace-nowrap pointer-events-none select-none">
                <div className="text-[8.5px] font-black text-emerald-400 uppercase tracking-tight">NEAR BIN</div>
                <div className="text-[7.5px] font-bold text-slate-300">
                  {isCorrect ? "Magnetic Concentrate" : "Empty"}
                </div>
              </div>
            </Html>
          </group>

          {/* ── E. OPEN COLLECTION BIN 2 (Far / Right: Non-Magnetic Gangue / Mixed Tailings) ── */}
          <group position={[1.50, -0.75, 0]}>
            {/* Front Wall */}
            <mesh position={[0, 0, 0.58]}>
              <boxGeometry args={[0.80, 0.52, 0.03]} />
              <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Back Wall */}
            <mesh position={[0, 0, -0.58]}>
              <boxGeometry args={[0.80, 0.52, 0.03]} />
              <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Right Wall */}
            <mesh position={[0.39, 0, 0]}>
              <boxGeometry args={[0.03, 0.52, 1.18]} />
              <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Floor */}
            <mesh position={[0, -0.25, 0]}>
              <boxGeometry args={[0.80, 0.03, 1.18]} />
              <meshStandardMaterial color="#1E293B" metalness={0.5} />
            </mesh>

            {/* Settled Mound inside bin */}
            {isSeparated && (
              <mesh position={[0, -0.16, 0]}>
                <coneGeometry args={[0.28, 0.16, 16]} />
                <meshStandardMaterial color={isCorrect ? "#E2E8F0" : "#64748B"} roughness={0.85} />
              </mesh>
            )}

            {/* Crisp Clean Industrial Plaque Badge */}
            <Html position={[0, -0.05, 0.62]} center zIndexRange={[10, 0]}>
              <div className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-amber-500/70 text-center shadow-md whitespace-nowrap pointer-events-none select-none">
                <div className="text-[8.5px] font-black text-amber-400 uppercase tracking-tight">FAR BIN</div>
                <div className="text-[7.5px] font-bold text-slate-300">
                  {isCorrect ? "Non-Magnetic Sand" : "Tailings"}
                </div>
              </div>
            </Html>
          </group>
        </group>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. EASY 3D FROTH FLOTATION (Glass Tank + Yellow Foam + Agitator)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {method === "froth" && (
        <group>
          {/* Glass Flotation Tank - Transparent walls */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[3.2, 1.9, 2.0]} />
            <meshStandardMaterial color="#E0F2FE" transparent opacity={0.35} roughness={0.1} />
          </mesh>

          {/* Solid Tank Bottom Base (Not transparent) */}
          <mesh position={[0, -0.96, 0]}>
            <boxGeometry args={[3.24, 0.12, 2.04]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Blue Water Pulp Solution inside Tank */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[3.1, 1.5, 1.9]} />
            <meshStandardMaterial color="#0284C7" transparent opacity={0.55} roughness={0.1} />
          </mesh>

          {/* Golden/Yellow Froth Foam on Top */}
          <mesh position={[0, 0.72, 0]}>
            <boxGeometry args={[3.1, 0.35, 1.9]} />
            <meshStandardMaterial color="#FDE047" transparent opacity={0.85} roughness={0.8} />
          </mesh>

          {/* Floating Top Badge: Froth Layer */}
          <Html position={[0, 1.25, 0]} center zIndexRange={[10, 0]}>
            <div className="px-3 py-1 rounded-md bg-slate-900/90 border border-amber-500/60 text-amber-300 font-mono text-[11px] font-bold tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
              <span>🫧</span>
              <span>FROTH LAYER: Sulfide ore floats with oil bubbles</span>
            </div>
          </Html>

          {/* Rotating Agitator Impeller in Center */}
          <group position={[0, 0, 0]} ref={impellerRef}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.6, 16]} />
              <meshStandardMaterial color="#1E293B" metalness={0.9} />
            </mesh>
            <mesh position={[0, -0.55, 0]}>
              <boxGeometry args={[1.3, 0.16, 0.08]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} />
            </mesh>
            <mesh position={[0, -0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[1.3, 0.16, 0.08]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} />
            </mesh>
          </group>

          {/* Floating Bottom Badge: Gangue */}
          <Html position={[0, -0.68, 1.05]} center zIndexRange={[10, 0]}>
            <div className="px-2.5 py-0.5 rounded-md bg-slate-800/95 border border-slate-600 text-slate-300 font-mono text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none flex items-center gap-1">
              <span>⬇</span>
              <span>Water-wetted gangue sinks to bottom</span>
            </div>
          </Html>
        </group>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. EASY 3D CHEMICAL LEACHING (Reaction Beaker + Heater + Stirrer)   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {method === "leaching" && (
        <group>
          {/* Reaction Glass Beaker / Vessel - Transparent walls */}
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[1.3, 1.3, 1.9, 32]} />
            <meshStandardMaterial color="#E2E8F0" transparent opacity={0.35} roughness={0.1} />
          </mesh>

          {/* Solid Beaker Bottom Base (Not transparent) */}
          <mesh position={[0, -1.02, 0]}>
            <cylinderGeometry args={[1.34, 1.34, 0.12, 32]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Chemical Reagent Solution (Green/Cyan NaOH) */}
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[1.25, 1.25, 1.6, 32]} />
            <meshStandardMaterial
              color={isSimulating || isSeparated ? "#10B981" : "#38BDF8"}
              transparent
              opacity={0.6}
              roughness={0.1}
            />
          </mesh>

          {/* Floating Top Badge: Hot Concentrated Reagent */}
          <Html position={[0, 1.25, 0]} center zIndexRange={[10, 0]}>
            <div className="px-3 py-1 rounded-md bg-slate-900/90 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
              <span>🧪</span>
              <span>HOT CONCENTRATED NaOH REAGENT</span>
            </div>
          </Html>

          {/* Central Motorized Stirrer */}
          <group position={[0, 0, 0]} ref={impellerRef}>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.7, 16]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[0.9, 0.15, 0.06]} />
              <meshStandardMaterial color="#0F172A" metalness={0.9} />
            </mesh>
          </group>

          {/* Copper Heating Coils (submerged horizontally around the stirrer shaft) */}
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.05, 16, 48]} />
            <meshStandardMaterial color="#B45309" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.05, 16, 48]} />
            <meshStandardMaterial color="#B45309" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Floating Bottom Badge: Insoluble Gangue Filter */}
          <Html position={[0, -0.72, 0.95]} center zIndexRange={[10, 0]}>
            <div className="px-2.5 py-0.5 rounded-md bg-slate-800/95 border border-slate-600 text-slate-300 font-mono text-[10px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none flex items-center gap-1">
              <span>⬇</span>
              <span>Insoluble Gangue (Red Mud) trapped at base filter</span>
            </div>
          </Html>
        </group>
      )}

      {/* ── 3D INSTANCED ORE PARTICLES (Dense Metallic Beads) ── */}
      <instancedMesh ref={oreMeshRef} args={[undefined, undefined, 36]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={oreColor} metalness={0.9} roughness={0.15} />
      </instancedMesh>

      {/* ── 3D INSTANCED GANGUE PARTICLES (Light Sandy Quartz Beads) ── */}
      <instancedMesh ref={gangueMeshRef} args={[undefined, undefined, 36]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshStandardMaterial color="#F5F5F4" metalness={0.05} roughness={0.85} />
      </instancedMesh>
    </group>
  );
}
