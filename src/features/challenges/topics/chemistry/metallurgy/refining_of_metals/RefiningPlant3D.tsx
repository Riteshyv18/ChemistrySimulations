"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type RefiningMethod = "electrolytic" | "distillation" | "liquation" | "zone";

export interface RefiningPlant3DProps {
  stage: "idle" | "refining" | "refined";
  metalName: string;
  metalSymbol: string;
  crudeColor: string;
  pureColor: string;
  selectedMethod: RefiningMethod | null;
  isCorrectMethod: boolean;
  electrolyteName?: string;
  anodeMudContent?: string;
}

export default function RefiningPlant3D({
  stage,
  metalName,
  metalSymbol,
  crudeColor,
  pureColor,
  selectedMethod,
  isCorrectMethod,
  electrolyteName = "Acidified Metal Salt Solution",
  anodeMudContent = "Noble Impurities (Ag, Au, Pt)",
}: RefiningPlant3DProps) {
  // Mechanical and particle animation refs
  const anodeRef = useRef<THREE.Mesh>(null);
  const cathodeRef = useRef<THREE.Mesh>(null);
  const ionsPointsRef = useRef<THREE.Points>(null);
  const anodeMudRef = useRef<THREE.Mesh>(null);
  const inductionHeaterRef = useRef<THREE.Group>(null);
  const pureZoneMeshRef = useRef<THREE.Mesh>(null);
  const liquationIngotRef = useRef<THREE.Mesh>(null);
  const liquationPoolRef = useRef<THREE.Mesh>(null);
  const distillationPoolRef = useRef<THREE.Mesh>(null);
  const distillationVaporMeshRef = useRef<THREE.Mesh>(null);
  const distillationDropletsRef = useRef<THREE.Points>(null);
  const liquationDropletsRef = useRef<THREE.Points>(null);
  const electrolyteGlowRef = useRef<THREE.Mesh>(null);

  // Default apparatus shown on screen is electrolytic; user still must select a method in the dropdown
  const activeMethod = selectedMethod || "electrolytic";

  // 1. Migrating metal ions between Anode and Cathode (Electrolytic mode)
  const ionCount = 42;
  const ionParticles = useMemo(() => {
    const pos = new Float32Array(ionCount * 3);
    for (let i = 0; i < ionCount; i++) {
      pos[i * 3] = -0.8 + Math.random() * 1.6; // X: from anode (-0.9) to cathode (+0.9)
      pos[i * 3 + 1] = -0.3 + (Math.random() - 0.5) * 0.7; // Y: inside bath
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Z
    }
    return pos;
  }, []);

  // 2. Distillation condensed droplets flowing along the lower inside conduit
  const distilDropCount = 65;
  const distilDropParticles = useMemo(() => {
    const pos = new Float32Array(distilDropCount * 3);
    for (let i = 0; i < distilDropCount; i++) {
      // Confined strictly inside inner tube radius (< 0.04)
      const r = Math.random() * 0.032;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = 0.9 - (i / distilDropCount) * 2.3; // distributed along the entire length of the tube Y
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return pos;
  }, []);

  // 3. Liquation run-down droplets (flowing down inside the hearth channel)
  const dropletCount = 42;
  const dropletParticles = useMemo(() => {
    const pos = new Float32Array(dropletCount * 3);
    for (let i = 0; i < dropletCount; i++) {
      // Confined in local hearth channel: X spans [-1.1, 1.25], Y = 0.082 (raised cleanly above hearth firebrick), Z within [-0.25, 0.25]
      pos[i * 3] = -1.1 + (i / dropletCount) * 2.35;
      pos[i * 3 + 1] = 0.082;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // ─────────────────────────────────────────────────────────────
    // Animation 1: Electrolytic Ion Migration & Electrode Dynamics
    // ─────────────────────────────────────────────────────────────
    if (activeMethod === "electrolytic") {
      if (ionsPointsRef.current) {
        if (stage === "refining") {
          ionsPointsRef.current.visible = true;
          const posAttr = ionsPointsRef.current.geometry.attributes.position;
          for (let i = 0; i < ionCount; i++) {
            let x = posAttr.getX(i) + delta * 0.75;
            let y = posAttr.getY(i) + Math.sin(time * 6 + i) * 0.002;
            // Respawn at anode surface when reaching cathode
            if (x > 0.8) {
              x = -0.8 + (Math.random() - 0.5) * 0.08;
              y = -0.3 + (Math.random() - 0.5) * 0.7;
            }
            posAttr.setX(i, x);
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
        } else {
          ionsPointsRef.current.visible = false;
        }
      }

      // Anode Dissolution (Thick slab shrinks in Z & X) & Cathode Plating (Thin sheet thickens in Z)
      if (anodeRef.current && cathodeRef.current) {
        if (stage === "refined" && isCorrectMethod) {
          anodeRef.current.scale.lerp(new THREE.Vector3(0.5, 0.75, 0.3), 0.05); // Dissolved/shrunken anode
          cathodeRef.current.scale.lerp(new THREE.Vector3(1.05, 1.0, 2.8), 0.05); // Thickened cathode (deposited copper)
        } else if (stage === "refining") {
          const t = Math.min(1, Math.sin(time * 2) * 0.5 + 0.5);
          anodeRef.current.scale.lerp(new THREE.Vector3(1 - t * 0.4, 1 - t * 0.2, 1 - t * 0.6), 0.04);
          cathodeRef.current.scale.lerp(new THREE.Vector3(1 + t * 0.05, 1, 1 + t * 1.6), 0.04);
        } else {
          anodeRef.current.scale.set(1, 1, 1);
          cathodeRef.current.scale.set(1, 1, 1);
        }
      }

      // Anode Mud Sediment Pile Growth under Anode
      if (anodeMudRef.current) {
        if (stage === "refined" && isCorrectMethod) {
          anodeMudRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.05);
        } else if (stage === "refining") {
          anodeMudRef.current.scale.lerp(new THREE.Vector3(0.7, 0.7, 0.7), 0.03);
        } else {
          anodeMudRef.current.scale.set(0.05, 0.05, 0.05);
        }
      }


    }

    // ─────────────────────────────────────────────────────────────
    // Animation 2: Zone Refining Induction Heater Traverse
    // (Smooth continuous unidirectional sweep along the rod)
    // ─────────────────────────────────────────────────────────────
    if (activeMethod === "zone" && inductionHeaterRef.current) {
      if (stage === "refining") {
        // Continuous smooth one-way sweep from left start of rod (x = -1.15) to end before cutoff (x = +0.65)
        // Sweeps smoothly over 3.6 seconds from 0 to 1
        const period = 3.6;
        const progress = Math.min(1.0, (time % period) / period); // 0.0 -> 1.0
        // Left limit -1.15, right limit +0.65 (distance 1.80)
        const sweep = -1.15 + progress * 1.80;
        inductionHeaterRef.current.position.x = sweep;

        // Progressive Recrystallization:
        // Left edge starts at x = -1.30. As sweep advances, pure crystal wake grows from -1.30 to sweep.
        if (pureZoneMeshRef.current) {
          pureZoneMeshRef.current.visible = true;
          const currentLength = Math.max(0.02, sweep - (-1.30));
          pureZoneMeshRef.current.scale.set(1, currentLength, 1);
          pureZoneMeshRef.current.position.set(-1.30 + currentLength / 2, 0.1, 0);
        }
      } else if (stage === "refined" && isCorrectMethod) {
        // Parked cleanly at the cutoff boundary mark
        inductionHeaterRef.current.position.x = 0.65;
        if (pureZoneMeshRef.current) {
          pureZoneMeshRef.current.visible = true;
          const fullLength = 1.95; // full distance from -1.30 to 0.65
          pureZoneMeshRef.current.scale.set(1, fullLength, 1);
          pureZoneMeshRef.current.position.set(-0.325, 0.1, 0);
        }
      } else {
        // Idle at start of rod (left)
        inductionHeaterRef.current.position.x = -1.15;
        if (pureZoneMeshRef.current) {
          pureZoneMeshRef.current.visible = false;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Animation 3: Distillation Volatile Metal Vapor & Condensate
    // NOTE: Only low-boiling volatile metals (Level 2: Zinc/Mercury) distill and fill!
    // In other levels (Levels 1, 3, 4: Cu, Sn, Si), the metal has high boiling point and DOES NOT boil or fill!
    // ─────────────────────────────────────────────────────────────
    if (activeMethod === "distillation") {
      const willDistill = isCorrectMethod; // true only for Level 2 (Zinc)

      // 1. Misty Volatile Metal Vapor Column Pulsation & Dissipation inside the tube
      if (distillationVaporMeshRef.current) {
        if (stage === "refining" && willDistill) {
          distillationVaporMeshRef.current.visible = true;
          const vaporMat = distillationVaporMeshRef.current.material as THREE.MeshStandardMaterial;
          if (vaporMat) {
            // Subtle, realistic undulating gas density
            vaporMat.opacity = 0.42 + Math.sin(time * 3.2) * 0.12;
          }
        } else {
          distillationVaporMeshRef.current.visible = false;
        }
      }

      // 2. Condensed Pure Metal Droplets Trickling Down the Inside Bottom Wall
      if (distillationDropletsRef.current) {
        if (stage === "refining" && willDistill) {
          distillationDropletsRef.current.visible = true;
          const posAttr = distillationDropletsRef.current.geometry.attributes.position;
          for (let i = 0; i < distilDropCount; i++) {
            // Flow strictly downwards along local Y of the condenser group (towards receiver)
            let y = posAttr.getY(i) - delta * 0.55;
            if (y < -1.45) {
              y = 0.95 + Math.random() * 0.15; // respawn at top intake from retort
            }
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
        } else {
          distillationDropletsRef.current.visible = false;
        }
      }

      // 3. Condensed Liquid Metal Slow Filling inside the Receiver Flask
      if (distillationPoolRef.current) {
        if (stage === "refining" && willDistill) {
          distillationPoolRef.current.visible = true;
          // Gradually rises from empty base (-0.05) to full level (+0.07)
          distillationPoolRef.current.position.y = THREE.MathUtils.lerp(
            distillationPoolRef.current.position.y,
            0.07,
            delta * 1.1
          );
        } else if (stage === "refined" && willDistill) {
          distillationPoolRef.current.visible = true;
          distillationPoolRef.current.position.y = 0.07; // Fully filled with pure zinc
        } else {
          // Empty receiver flask when metal doesn't distill or before refining starts
          distillationPoolRef.current.visible = false;
          distillationPoolRef.current.position.y = -0.05;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Animation 4: Liquation Sloping Flow down the Reverberatory Hearth
    // NOTE: Melting ONLY occurs if isCorrectMethod is true (Level 3: Tin/Lead).
    // In other levels (Levels 1, 2, 4), the high-melting metal DOES NOT melt!
    // ─────────────────────────────────────────────────────────────
    if (activeMethod === "liquation") {
      const willMelt = isCorrectMethod; // Only melts for Low-Melting metals (Sn, Pb)

      // 1. Droplets running down hearth (only when metal actually melts)
      if (liquationDropletsRef.current) {
        if (stage === "refining" && willMelt) {
          liquationDropletsRef.current.visible = true;
          const posAttr = liquationDropletsRef.current.geometry.attributes.position;
          for (let i = 0; i < dropletCount; i++) {
            // Move along local X axis inside the hearth channel toward the discharge spout
            let x = posAttr.getX(i) + delta * 0.72;
            if (x > 1.35) {
              x = -1.1 + (Math.random() - 0.5) * 0.15; // respawn at crude ingot melting point
            }
            posAttr.setX(i, x);
          }
          posAttr.needsUpdate = true;
        } else {
          liquationDropletsRef.current.visible = false;
        }
      }

      // 2. Left Crude Ingot: ONLY melts in Level 3 (Tin). In other levels (Cu, Zn, Si), it only heats up without melting!
      if (liquationIngotRef.current) {
        if (stage === "refining" && willMelt) {
          // Shrinks down in height and width as tin melts away
          liquationIngotRef.current.scale.lerp(new THREE.Vector3(0.35, 0.2, 0.35), delta * 1.5);
          liquationIngotRef.current.position.y = 0.08;
        } else if (stage === "refined" && willMelt) {
          // Fully melted into infusible slag residual
          liquationIngotRef.current.scale.set(0.2, 0.1, 0.2);
          liquationIngotRef.current.position.y = 0.06;
        } else {
          // Stays solid intact block! In Level 1, 2, 4 it does not melt
          liquationIngotRef.current.scale.set(1.0, 1.0, 1.0);
          liquationIngotRef.current.position.y = 0.14;
        }
      }

      // 3. Right Collection Pot Gradual Filling: only fills if metal melted
      if (liquationPoolRef.current) {
        if (stage === "refining" && willMelt) {
          liquationPoolRef.current.visible = true;
          // Slowly rises from empty (-0.12) up to rim (0.12)
          liquationPoolRef.current.position.y = THREE.MathUtils.lerp(
            liquationPoolRef.current.position.y,
            0.12,
            delta * 1.2
          );
        } else if (stage === "refined" && willMelt) {
          liquationPoolRef.current.visible = true;
          liquationPoolRef.current.position.y = 0.12; // Filled to brim
        } else {
          // Empty pot when metal didn't melt
          liquationPoolRef.current.visible = false;
          liquationPoolRef.current.position.y = -0.12;
        }
      }
    }
  });

  return (
    <group position={[0, -0.15, 0]}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* GROUND STAGE - Industrial Clean Platform                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[7.8, 0.12, 3.6]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* High-visibility Cyan Guide Line */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[7.6, 0.01, 0.05]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.6} />
      </mesh>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 1: ELECTROLYTIC REFINING TANK (Main Simulation Setup)    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeMethod === "electrolytic" && (
        <group position={[0, 0, 0]}>
          {/* Heavy Steel Support Stand on Floor */}
          {[-1.35, 1.35].map((x) =>
            [-0.65, 0.65].map((z) => (
              <mesh key={`tank-leg-${x}-${z}`} position={[x, -0.42, z]}>
                <boxGeometry args={[0.1, 0.52, 0.1]} />
                <meshStandardMaterial color="#0F172A" metalness={0.9} />
              </mesh>
            ))
          )}

          {/* Heavy Base Slab with Metallic Trim */}
          <mesh position={[0, -0.16, 0]}>
            <boxGeometry args={[3.2, 0.12, 1.7]} />
            <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* ─── OBSERVATION TANK STRUCTURE ─── */}
          {/* Back & Bottom Industrial Ceramic Tank Shell (Bright Light Grey for High Contrast) */}
          <mesh position={[0, 0.32, -0.68]}>
            <boxGeometry args={[3.04, 0.86, 0.08]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Left Solid Wall */}
          <mesh position={[-1.48, 0.32, 0]}>
            <boxGeometry args={[0.08, 0.86, 1.44]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Right Solid Wall */}
          <mesh position={[1.48, 0.32, 0]}>
            <boxGeometry args={[0.08, 0.86, 1.44]} />
            <meshStandardMaterial color="#CBD5E1" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Bottom Chamber Floor (Light Clean Tile) */}
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[2.92, 0.06, 1.36]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.5} metalness={0.2} />
          </mesh>

          {/* Clear Viewing Glass Front Panel (Cutaway Observation Window) */}
          <mesh position={[0, 0.32, 0.68]} renderOrder={3}>
            <boxGeometry args={[3.04, 0.86, 0.04]} />
            <meshStandardMaterial
              color="#FFFFFF"
              transparent
              opacity={0.1}
              roughness={0.02}
              metalness={0.05}
              depthWrite={false}
            />
          </mesh>

          {/* Polished Chrome Rim Bevel Frames */}
          <mesh position={[0, 0.74, 0.68]} renderOrder={4}>
            <boxGeometry args={[3.08, 0.05, 0.07]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.1, 0.68]} renderOrder={4}>
            <boxGeometry args={[3.08, 0.05, 0.07]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-1.48, 0.32, 0.68]} renderOrder={4}>
            <boxGeometry args={[0.06, 0.86, 0.07]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[1.48, 0.32, 0.68]} renderOrder={4}>
            <boxGeometry args={[0.06, 0.86, 0.07]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Inner Electrolyte Chamber (Rich, Vibrant Blue CuSO4 Solution) */}
          <mesh position={[0, 0.28, 0]} renderOrder={2}>
            <boxGeometry args={[2.84, 0.74, 1.28]} />
            <meshStandardMaterial
              color="#0284C7"
              transparent
              opacity={0.52}
              roughness={0.06}
              metalness={0.12}
              depthWrite={false}
            />
          </mesh>

          {/* ─── DC POWER SUPPLY UNIT & WIRING ─── */}
          {/* Digital DC Rectifier / Power Source positioned on rear support */}
          <group position={[0, 1.02, -0.42]}>
            <mesh>
              <boxGeometry args={[0.92, 0.36, 0.28]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* LED Status Display Panel */}
            <mesh position={[0, 0.04, 0.15]}>
              <planeGeometry args={[0.72, 0.2]} />
              <meshStandardMaterial
                color={stage === "refining" ? "#10B981" : "#0284C7"}
                emissive={stage === "refining" ? "#059669" : "#0369A1"}
                emissiveIntensity={0.8}
              />
            </mesh>
            {/* Digital Voltage / Current Readout text in 3D */}
            <Html position={[0, 0.04, 0.16]} center>
              <div className="font-mono text-[9px] font-black text-white px-1 tracking-widest whitespace-nowrap select-none pointer-events-none">
                {stage === "refining" ? "DC 1.3V • 240A ON" : "DC RECTIFIER • STANDBY"}
              </div>
            </Html>

            {/* Left Outgoing Red (+) Terminal on Rectifier Face */}
            <mesh position={[-0.32, -0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
              <meshStandardMaterial color="#EF4444" roughness={0.3} />
            </mesh>
            {/* Right Outgoing Blue (-) Terminal on Rectifier Face */}
            <mesh position={[0.32, -0.06, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
              <meshStandardMaterial color="#0284C7" roughness={0.3} />
            </mesh>
          </group>

          {/* Overhead Heavy Copper Busbars (+ Anode Bar on Left, - Cathode Bar on Right) */}
          {/* Left busbar spanning along X from -1.25 to -0.45 */}
          <mesh position={[-0.85, 0.72, 0]}>
            <boxGeometry args={[0.85, 0.08, 0.08]} />
            <meshStandardMaterial color="#B45309" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Red + Terminal Block on busbar */}
          <mesh position={[-0.85, 0.78, 0]}>
            <boxGeometry args={[0.12, 0.09, 0.09]} />
            <meshStandardMaterial color="#EF4444" roughness={0.3} />
          </mesh>

          {/* Right busbar spanning along X from +0.45 to +1.25 */}
          <mesh position={[0.85, 0.72, 0]}>
            <boxGeometry args={[0.85, 0.08, 0.08]} />
            <meshStandardMaterial color="#B45309" metalness={0.95} roughness={0.2} />
          </mesh>
          {/* Blue - Terminal Block on busbar */}
          <mesh position={[0.85, 0.78, 0]}>
            <boxGeometry args={[0.12, 0.09, 0.09]} />
            <meshStandardMaterial color="#0284C7" roughness={0.3} />
          </mesh>

          {/* Real Curved Cables Physically Connected to Rectifier and Busbars */}
          {/* Red Wire (+) from Rectifier [-0.32, 0.96, -0.27] to Busbar Terminal [-0.85, 0.78, 0] */}
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(-0.32, 0.96, -0.27),
                  new THREE.Vector3(-0.55, 1.05, -0.15),
                  new THREE.Vector3(-0.75, 0.92, -0.05),
                  new THREE.Vector3(-0.85, 0.78, 0),
                ]),
                32,
                0.016,
                8,
                false,
              ]}
            />
            <meshStandardMaterial color="#DC2626" roughness={0.5} metalness={0.3} />
          </mesh>

          {/* Blue Wire (-) from Rectifier [0.32, 0.96, -0.27] to Busbar Terminal [0.85, 0.78, 0] */}
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3([
                  new THREE.Vector3(0.32, 0.96, -0.27),
                  new THREE.Vector3(0.55, 1.05, -0.15),
                  new THREE.Vector3(0.75, 0.92, -0.05),
                  new THREE.Vector3(0.85, 0.78, 0),
                ]),
                32,
                0.016,
                8,
                false,
              ]}
            />
            <meshStandardMaterial color="#2563EB" roughness={0.5} metalness={0.3} />
          </mesh>

          {/* ───────────────────────────────────────────────────────── */}
          {/* ELECTRODE 1: IMPURE ANODE (Left, Full Crude Metal Slab)    */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[-0.85, 0.22, 0]}>
            <mesh ref={anodeRef} castShadow>
              {/* Full height slab: width(X)=0.62, height(Y)=0.62, thickness(Z)=0.12 */}
              <boxGeometry args={[0.62, 0.62, 0.12]} />
              <meshStandardMaterial
                color="#78231C" // Deep dark blister copper / crude raw metal
                roughness={0.7}
                metalness={0.4}
              />
            </mesh>
            {/* Seamless Anode Hanger Lug Hooked on Busbar */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.35, 0.12, 0.08]} />
              <meshStandardMaterial color="#B45309" metalness={0.95} />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* ELECTRODE 2: PURE CATHODE (Right, Pure Metal Sheet)       */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[0.85, 0.22, 0]}>
            <mesh ref={cathodeRef} castShadow>
              {/* Full height sheet: width(X)=0.62, height(Y)=0.62, thickness(Z)=0.05 */}
              <boxGeometry args={[0.62, 0.62, 0.05]} />
              <meshStandardMaterial
                color="#D97706" // Lustrous rich copper metal (vivid & clear)
                metalness={0.85}
                roughness={0.2}
              />
            </mesh>
            {/* Seamless Cathode Hanger Lug Hooked on Busbar */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.35, 0.12, 0.06]} />
              <meshStandardMaterial color="#B45309" metalness={0.95} />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* ANODE MUD (Precious Insoluble Sludge: Au, Ag, Pt)         */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[-0.85, -0.06, 0]}>
            <mesh ref={anodeMudRef} scale={[0.1, 0.1, 0.1]}>
              <coneGeometry args={[0.34, 0.14, 18]} />
              <meshStandardMaterial color="#3B1E08" roughness={0.95} metalness={0.3} />
            </mesh>
            {/* Anode Mud Floating Identifier Tag */}
            <Html position={[0, -0.06, 0.48]} center>
              <div style={{ transform: "scale(1.05)", transformOrigin: "center" }}>
                <div className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500/50 text-amber-300 font-mono text-[9.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
                  ANODE MUD (Ag, Au, Pt)
                </div>
              </div>
            </Html>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* MIGRATING METAL IONS (Stream of Cu2+ / Mn+ from L to R)   */}
          {/* ───────────────────────────────────────────────────────── */}
          <points ref={ionsPointsRef} position={[0, 0.28, 0]}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[ionParticles, 3]} />
            </bufferGeometry>
            <pointsMaterial
              size={0.16}
              color="#38BDF8"
              transparent
              opacity={0.92}
            />
          </points>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3D BADGES (Positioned Outwards to Keep Wires Fully Visible) */}
          {/* ───────────────────────────────────────────────────────── */}
          {/* Anode Badge positioned outwards to the left */}
          <Html position={[-1.38, 1.05, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-rose-500/60 text-rose-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                <span>(+) ANODE: CRUDE {metalName.toUpperCase()}</span>
              </div>
            </div>
          </Html>

          {/* Central Tank & Electrolyte Badge */}
          <Html position={[0, 0.72, 0.76]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>ELECTROLYTE BATH</span>
              </div>
            </div>
          </Html>

          {/* Cathode Badge positioned outwards to the right */}
          <Html position={[1.38, 1.05, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-emerald-500/60 text-emerald-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>(−) CATHODE: PURE {metalSymbol}</span>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 2: DISTILLATION RETORT (For Low-Boiling Metals: Zn, Hg)  */}
      {/* Scaled and grounded firmly on the platform at y = -0.66        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeMethod === "distillation" && (
        <group position={[0.22, -0.02, 0]} scale={[0.82, 0.82, 0.82]}>
          {/* ───────────────────────────────────────────────────────── */}
          {/* 1. HEATED RETORT FURNACE (LEFT: centered at x = -1.6)     */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[-1.6, 0.1, 0]}>
            {/* Furnace Base Stand on Platform */}
            <mesh position={[0, -0.42, 0]}>
              <cylinderGeometry args={[0.62, 0.68, 0.44, 24]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.4} />
            </mesh>

            {/* Heating Mantle Hearth Body */}
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.55, 0.60, 0.36, 24]} />
              <meshStandardMaterial color="#991B1B" roughness={0.6} />
            </mesh>

            {/* Glowing Furnace Fire Hearth Window */}
            <mesh position={[0, -0.05, 0.55]}>
              <planeGeometry args={[0.3, 0.18]} />
              <meshBasicMaterial color={stage === "refining" ? "#F59E0B" : "#EA580C"} />
            </mesh>

            {/* Industrial Clay/Iron Retort Flask Body */}
            <mesh position={[0, 0.32, 0]}>
              <sphereGeometry args={[0.45, 24, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
            </mesh>

            {/* Top Charging Neck & Sealed Stopper */}
            <mesh position={[0, 0.74, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.26, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.88, 0]}>
              <cylinderGeometry args={[0.13, 0.11, 0.08, 16]} />
              <meshStandardMaterial color="#1E293B" metalness={0.9} />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 2. WATER-COOLED LIEBIG CONDENSER & DELIVERY ASSEMBLY       */}
          {/* Slope angle: 28° (Math.PI * 0.344 rad = 1.08 rad from Y)  */}
          {/* Centered at x = -0.35, y = 0.0                            */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[-0.35, 0.0, 0]} rotation={[0, 0, 1.08]}>
            {/* Retort Vapor Delivery Arm */}
            {/* Upper end enters flask shoulder at (-1.35, 0.52); lower end extends to (0.75, 0) */}
            <mesh position={[0, 1.15, 0]}>
              <cylinderGeometry args={[0.052, 0.062, 0.92, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.35} />
            </mesh>

            {/* Rubber / Glass Ground-Joint Collar Sealing the Connection */}
            <mesh position={[0, 0.75, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.14, 16]} />
              <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.3} />
            </mesh>

            {/* Inner Vapor Glass Conduit (continuous through jacket) */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.056, 0.056, 1.85, 20]} />
              <meshStandardMaterial
                color="#BAE6FD"
                transparent
                opacity={0.35}
                roughness={0.05}
                metalness={0.1}
              />
            </mesh>

            {/* Realistic Volatile Metal Misty Vapor Column (STRICTLY INSIDE inner glass tube) */}
            <mesh ref={distillationVaporMeshRef} position={[0, 0.15, 0]} visible={false}>
              <cylinderGeometry args={[0.046, 0.046, 1.8, 16]} />
              <meshStandardMaterial
                color="#F8FAFC"
                emissive="#E2E8F0"
                emissiveIntensity={0.35}
                transparent
                opacity={0.45}
                roughness={0.9}
              />
            </mesh>

            {/* Liquid Condensed Droplets trickling down the inside bottom surface of the tube */}
            <points ref={distillationDropletsRef} visible={false}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[distilDropParticles, 3]} />
              </bufferGeometry>
              <pointsMaterial
                size={0.065}
                color="#FBBF24"
                transparent
                opacity={0.95}
              />
            </points>

            {/* Outer Water-Cooling Jacket Sleeve */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 1.35, 24]} />
              <meshStandardMaterial
                color="#38BDF8"
                transparent
                opacity={0.4}
                roughness={0.05}
                metalness={0.1}
              />
            </mesh>

            {/* Water Inlet Nozzle (Cold Water IN at bottom right) */}
            <mesh position={[0.16, -0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
              <meshStandardMaterial color="#0284C7" metalness={0.5} />
            </mesh>
            {/* Water Outlet Nozzle (Warm Water OUT at top left) */}
            <mesh position={[-0.16, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.14, 12]} />
              <meshStandardMaterial color="#0284C7" metalness={0.5} />
            </mesh>

            {/* Condenser Support Clamp connected to laboratory stand */}
            <mesh position={[0, 0, -0.18]}>
              <boxGeometry args={[0.22, 0.08, 0.18]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} />
            </mesh>

            {/* Extended Drip Adapter / Receiving Tail Tube at bottom */}
            {/* Drips straight into the receiver flask mouth at x = 0.78, y = -0.58 */}
            <mesh position={[0, -1.18, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.54, 16]} />
              <meshStandardMaterial
                color="#BAE6FD"
                transparent
                opacity={0.5}
                roughness={0.05}
              />
            </mesh>
          </group>

          {/* Laboratory Stand Vertical Rod for Condenser */}
          <mesh position={[-0.35, -0.04, -0.26]}>
            <cylinderGeometry args={[0.02, 0.02, 1.3, 16]} />
            <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-0.35, -0.56, -0.26]}>
            <boxGeometry args={[0.42, 0.06, 0.32]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3. RECEIVER ADAPTER & DISTILLATE COLLECTOR (RIGHT: x = 0.88) */}
          {/* Straight 90° upright flask directly receiving drip tube   */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[0.88, -0.54, 0]}>
            {/* Base Stand for Receiver (Platform block) */}
            <mesh position={[0, -0.09, 0]}>
              <boxGeometry args={[0.62, 0.12, 0.62]} />
              <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
            </mesh>

            {/* Receiver Glass Flask (Conical Erlenmeyer / Collector) */}
            {/* Crisp scientific cyan/borosilicate tint with dark rim collar */}
            {/* Lower cone body */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.15, 0.32, 0.34, 24]} />
              <meshStandardMaterial
                color="#0284C7"
                transparent
                opacity={0.48}
                roughness={0.08}
                metalness={0.2}
              />
            </mesh>

            {/* Straight Vertical 90° Upright Flask Neck */}
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.22, 24]} />
              <meshStandardMaterial
                color="#0284C7"
                transparent
                opacity={0.52}
                roughness={0.08}
                metalness={0.2}
              />
            </mesh>

            {/* Top Lip Collar Rim (Flat horizontal torus at 90° upright) */}
            <mesh position={[0, 0.47, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.098, 0.014, 12, 24]} />
              <meshStandardMaterial color="#0369A1" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Pure Condensed Liquid Metal Pool inside Collector */}
            {/* Animates rising slowly from -0.05 to +0.07 when refining starts! */}
            <mesh ref={distillationPoolRef} position={[0, -0.05, 0]} visible={false}>
              <cylinderGeometry args={[0.26, 0.29, 0.15, 24]} />
              <meshStandardMaterial
                color={stage === "refined" && isCorrectMethod ? "#38BDF8" : stage === "refining" ? "#E0F2FE" : "#475569"}
                emissive={stage === "refined" && isCorrectMethod ? "#0284C7" : stage === "refining" ? "#38BDF8" : "#000000"}
                emissiveIntensity={stage === "refined" || stage === "refining" ? 0.6 : 0}
                metalness={0.92}
                roughness={0.1}
              />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3D BADGES (Positioned Cleanly on Distillation)            */}
          {/* ───────────────────────────────────────────────────────── */}
          <Html position={[-1.6, 1.35, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-amber-500/60 text-amber-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                <span>① HEATED RETORT</span>
              </div>
            </div>
          </Html>

          <Html position={[-0.15, 1.35, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>② WATER CONDENSER</span>
              </div>
            </div>
          </Html>

          <Html position={[1.2, 1.35, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-emerald-500/60 text-emerald-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>③ CONDENSED {metalSymbol}</span>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 3: LIQUATION REVERBERATORY HEARTH (For Low-Melting: Sn, Pb)*/}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeMethod === "liquation" && (
        <group position={[0, 0, 0]}>
          {/* ───────────────────────────────────────────────────────── */}
          {/* 1. SLOPING HEARTH ASSEMBLY (Tilted at -12° / -0.21 rad)   */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[-0.3, 0.12, 0]} rotation={[0, 0, -0.21]}>
            {/* Hearth Bed Refractory Tile (Firebrick lining) */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2.7, 0.14, 0.92]} />
              <meshStandardMaterial color="#92400E" roughness={0.8} />
            </mesh>

            {/* Front Raised Curb / Side Retention Rail */}
            <mesh position={[0, 0.08, 0.44]}>
              <boxGeometry args={[2.7, 0.12, 0.08]} />
              <meshStandardMaterial color="#78350F" roughness={0.7} />
            </mesh>

            {/* Back Raised Curb / Side Retention Rail */}
            <mesh position={[0, 0.08, -0.44]}>
              <boxGeometry args={[2.7, 0.12, 0.08]} />
              <meshStandardMaterial color="#78350F" roughness={0.7} />
            </mesh>

            {/* Molten Liquid Metal Flow Stream Channel */}
            <mesh position={[0.1, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.4, 0.42]} />
              <meshStandardMaterial
                color={(stage === "refining" || stage === "refined") && isCorrectMethod ? "#E2E8F0" : "#64748B"}
                emissive={stage === "refining" && isCorrectMethod ? "#94A3B8" : "#000000"}
                emissiveIntensity={stage === "refining" && isCorrectMethod ? 0.35 : 0}
                metalness={0.95}
                roughness={0.1}
              />
            </mesh>

            {/* ── High-Temperature Reverberatory Arch Canopy (Semi-Transparent Observation Hood) ── */}
            {/* Sits flush on the hearth curbs from x = -1.2 to +0.8 */}
            <mesh position={[-0.2, 0.40, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.45, 0.45, 2.0, 24, 1, true, 0, Math.PI]} />
              <meshStandardMaterial
                color="#F97316"
                transparent
                opacity={0.32}
                roughness={0.2}
                metalness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Back Firebrick Furnace Enclosure Wall (Full height from hearth bed y = 0.07 to roof) */}
            <mesh position={[-0.2, 0.24, -0.45]}>
              <boxGeometry args={[2.0, 0.36, 0.04]} />
              <meshStandardMaterial
                color="#78350F"
                transparent
                opacity={0.5}
                roughness={0.7}
              />
            </mesh>

            {/* Furnace Left Retaining End-Wall (Closed at charging side behind the crude ingot) */}
            <mesh position={[-1.2, 0.22, 0]}>
              <boxGeometry args={[0.04, 0.32, 0.88]} />
              <meshStandardMaterial color="#78350F" roughness={0.8} />
            </mesh>

            {/* Right Discharge Taphole Arch (Allows molten metal to pour freely out the spout) */}
            <mesh position={[0.8, 0.34, 0]}>
              <boxGeometry args={[0.04, 0.12, 0.88]} />
              <meshStandardMaterial color="#78350F" roughness={0.8} />
            </mesh>

            {/* Structural Steel Ribs (Cleanly hugging the transparent vaulted roof arc) */}
            {[-1.2, -0.2, 0.8].map((xArch) => (
              <mesh key={`arch-rib-${xArch}`} position={[xArch, 0.40, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.455, 0.016, 12, 24, Math.PI]} />
                <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
              </mesh>
            ))}

            {/* Flue Gas Chimney / Exhaust Stack (Mounted cleanly on top apex of the roof venting upward) */}
            <group position={[0.55, 0.82, 0]}>
              {/* Vertical Chimney Pipe rising upward */}
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.075, 0.08, 0.32, 16]} />
                <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.3} />
              </mesh>
              {/* Flange Base Collar directly sealing into the roof apex */}
              <mesh position={[0, -0.04, 0]}>
                <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
            </group>

            {/* Interior Reverberatory Flame Glow */}
            <pointLight
              position={[-0.6, 0.28, 0]}
              color={stage === "refining" ? "#F59E0B" : "#EA580C"}
              intensity={stage === "refining" ? 3.5 : 1.2}
              distance={2.5}
            />

            {/* Crude Ingot Bar (Feeding at top high end of slope - melts during refining) */}
            <mesh ref={liquationIngotRef} position={[-1.0, 0.14, 0]} rotation={[0, 0.1, 0]}>
              <boxGeometry args={[0.42, 0.16, 0.36]} />
              <meshStandardMaterial
                color="#64748B"
                metalness={0.7}
                roughness={0.4}
              />
            </mesh>

            {/* Infusible High-Melting Dross (Porous iron/copper slag residue left behind) */}
            <group position={[-0.92, 0.22, 0]}>
              <mesh position={[-0.05, 0, -0.08]}>
                <dodecahedronGeometry args={[0.12, 0]} />
                <meshStandardMaterial color="#3E2723" roughness={0.95} />
              </mesh>
              <mesh position={[0.08, -0.02, 0.06]}>
                <dodecahedronGeometry args={[0.1, 0]} />
                <meshStandardMaterial color="#4E342E" roughness={0.95} />
              </mesh>
              <mesh position={[0.02, 0.04, 0.02]}>
                <dodecahedronGeometry args={[0.08, 0]} />
                <meshStandardMaterial color="#271C19" roughness={0.95} />
              </mesh>
            </group>

            {/* Flowing Droplets Particles (Enclosed strictly inside channel) */}
            <points ref={liquationDropletsRef} position={[0, 0, 0]}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[dropletParticles, 3]} />
              </bufferGeometry>
              <pointsMaterial
                size={0.11}
                color="#FFFFFF"
                transparent
                opacity={0.95}
              />
            </points>

            {/* Molten Pouring Stream pouring vertically from Spout into Crucible */}
            <mesh position={[1.36, -0.22, 0]} rotation={[0, 0, 0.21]} visible={stage === "refining" && isCorrectMethod}>
              <cylinderGeometry args={[0.038, 0.048, 0.44, 12]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive="#E2E8F0"
                emissiveIntensity={0.8}
                metalness={0.98}
                roughness={0.05}
              />
            </mesh>

            {/* Discharge Pouring Spout Lip at Bottom of Sloping Bed */}
            <mesh position={[1.34, 0.02, 0]}>
              <boxGeometry args={[0.12, 0.06, 0.36]} />
              <meshStandardMaterial color="#78350F" roughness={0.7} />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 2. SOLID RECTANGULAR FOUNDATION PIERS (Grounded on floor)  */}
          {/* ───────────────────────────────────────────────────────── */}
          {/* High End Left Foundation Pier: clean unified monolith extending into underside of hearth */}
          <mesh position={[-1.24, -0.19, 0]}>
            <boxGeometry args={[0.38, 0.94, 0.94]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Low End Right Foundation Pier: clean unified monolith extending into underside of hearth */}
          <mesh position={[0.5, -0.36, 0]}>
            <boxGeometry args={[0.36, 0.60, 0.94]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Foundation Footing Base Trim Placed on Ground Plane */}
          <mesh position={[-1.24, -0.64, 0]}>
            <boxGeometry args={[0.48, 0.04, 1.02]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} />
          </mesh>
          <mesh position={[0.5, -0.64, 0]}>
            <boxGeometry args={[0.46, 0.04, 1.02]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} />
          </mesh>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3. PURE MOLTEN METAL RECEIVER POT / COLLECTION WELL       */}
          {/* Placed directly beneath the discharge pouring spout       */}
          {/* Open-top metallurgical collection ladle with visible bath */}
          {/* ───────────────────────────────────────────────────────── */}
          <group position={[1.15, -0.42, 0]}>
            {/* Crucible Body: Open hollow cylinder (openEnded=true so there is NO top lid) */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.32, 0.30, 32, 1, true]} />
              <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Crucible Bottom Floor Lid */}
            <mesh position={[0, -0.15, 0]}>
              <circleGeometry args={[0.32, 32]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} side={THREE.DoubleSide} />
            </mesh>

            {/* Top Rim Collar (Rotated flat on X-Z plane) */}
            <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.022, 12, 32]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Heavy Base Block Stand on Platform */}
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.82, 0.06, 0.82]} />
              <meshStandardMaterial color="#0F172A" metalness={0.8} />
            </mesh>

            {/* Radiant Solid Molten Metal Pool Surface inside Crucible */}
            {/* Flat circle disc rotated on X-Z plane; animates rising from bottom -0.12 to top +0.12 as pot fills slowly! */}
            <mesh ref={liquationPoolRef} position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
              <circleGeometry args={[0.36, 32]} />
              <meshStandardMaterial
                color={stage === "refined" && isCorrectMethod ? "#F8FAFC" : stage === "refining" ? "#E2E8F0" : "#475569"}
                emissive={stage === "refined" && isCorrectMethod ? "#E2E8F0" : stage === "refining" ? "#CBD5E1" : "#1E293B"}
                emissiveIntensity={stage === "refined" || stage === "refining" ? 0.7 : 0.1}
                metalness={0.95}
                roughness={0.12}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Dedicated Illumination Spot inside the Crucible */}
            <pointLight
              position={[0, 0.35, 0.25]}
              color={stage === "refined" || stage === "refining" ? "#E0F2FE" : "#94A3B8"}
              intensity={stage === "refined" || stage === "refining" ? 3.0 : 0.8}
              distance={2.0}
            />
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 4. 3D BADGES (Positioned Cleanly Below Header Bar)        */}
          {/* ───────────────────────────────────────────────────────── */}
          <Html position={[-1.3, 1.05, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-amber-500/60 text-amber-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                <span>① SLOPING HEARTH</span>
              </div>
            </div>
          </Html>
          <Html position={[0.05, 1.05, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>② MELTING ZONE</span>
              </div>
            </div>
          </Html>
          <Html position={[1.4, 1.05, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-emerald-500/60 text-emerald-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>③ PURE MOLTEN {metalSymbol}</span>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 4: ZONE REFINING (Ultra-Pure Semiconductors: Si, Ge)    */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {activeMethod === "zone" && (
        <group position={[0, 0.05, 0]}>
          {/* ───────────────────────────────────────────────────────── */}
          {/* 1. HEAVY LABORATORY BENCH & DUAL STANCHIONS               */}
          {/* ───────────────────────────────────────────────────────── */}
          {/* Precision Optical Bench Rail Base */}
          <mesh position={[0, -0.66, 0]}>
            <boxGeometry args={[3.6, 0.06, 0.65]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Left Stanchion Stand (V-Block Cradle holding quartz tube) */}
          <group position={[-1.3, -0.32, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 0.62, 0.52]} />
              <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Curved saddle ring cleanly cradling the bottom half of the quartz tube */}
            <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.22, 24, 1, true, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Right Stanchion Stand (V-Block Cradle holding quartz tube) */}
          <group position={[1.3, -0.32, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.22, 0.62, 0.52]} />
              <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
            </mesh>
            {/* Curved saddle ring cleanly cradling the bottom half of the quartz tube */}
            <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.22, 24, 1, true, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Dual Precision Linear Guide Rods for Motorized Induction Carriage */}
          <mesh position={[0, -0.42, 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 2.8, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.42, -0.12]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 2.8, 16]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 2. QUARTZ INERT CHAMBER & END VACUUM FLANGES              */}
          {/* ───────────────────────────────────────────────────────── */}
          {/* High-Purity Fused Quartz Enclosure Tube */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.40, 0.40, 3.1, 32]} />
            <meshStandardMaterial
              color="#BAE6FD"
              transparent
              opacity={0.32}
              roughness={0.05}
              metalness={0.1}
            />
          </mesh>

          {/* Left Vacuum / Argon Gas Inlet Flange */}
          <group position={[-1.55, 0.1, 0]}>
            {/* Stainless Steel End Cap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.08, 32]} />
              <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Argon Gas Inlet Port & Valve */}
            <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
              <meshStandardMaterial color="#38BDF8" metalness={0.8} />
            </mesh>
          </group>

          {/* Right Vacuum Exhaust Port Flange */}
          <group position={[1.55, 0.1, 0]}>
            {/* Stainless Steel End Cap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.08, 32]} />
              <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Vacuum Exhaust Port to Turbomolecular Pump */}
            <mesh position={[0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.9} />
            </mesh>
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 3. SEMICONDUCTOR INGOT ROD (Silicon / Germanium)          */}
          {/* High-contrast pure vs impure coloring and clear cut line  */}
          {/* Total rod runs from x = -1.30 to +1.20 (length = 2.50)    */}
          {/* Cutoff boundary at x = 0.70                               */}
          {/* ───────────────────────────────────────────────────────── */}
          {/* Base Unrefined Crude Ingot Section (from x = -1.30 to x = +0.70, length = 2.00) */}
          {/* Pre-refining constant raw matte steel grey (#475569) */}
          <mesh position={[-0.30, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.165, 0.165, 2.00, 32]} />
            <meshStandardMaterial
              color="#475569"
              metalness={0.4}
              roughness={0.6}
            />
          </mesh>

          {/* Dynamic Progressive Recrystallized Ultra-Pure Crystal Wake */}
          {/* Sleeves directly over base rod (radius 0.168 vs 0.165) growing behind the moving heater */}
          <mesh
            ref={pureZoneMeshRef}
            position={[-0.30, 0.1, 0]}
            rotation={[0, 0, Math.PI / 2]}
            visible={false}
          >
            {/* Unit cylinder with height=1, dynamically scaled along Y by pureZoneMeshRef */}
            <cylinderGeometry args={[0.168, 0.168, 1.0, 32]} />
            <meshStandardMaterial
              color="#F0F9FF"
              emissive="#E0F2FE"
              emissiveIntensity={0.2}
              metalness={0.96}
              roughness={0.06}
            />
          </mesh>

          {/* Luminous Red Cut-off Demarcation Ring (At x = 0.70) */}
          <mesh position={[0.70, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.178, 0.178, 0.035, 32]} />
            <meshStandardMaterial
              color="#EF4444"
              emissive="#DC2626"
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Concentrated Impurity End-Slug (From x = 0.70 to x = +1.20, length = 0.50, center = 0.95) */}
          {/* Starts as normal raw metal (#475569) like the rest of the rod, then transforms into heavily concentrated jet-black burnt slag (#09090B) at the end! */}
          <mesh position={[0.95, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.165, 0.165, 0.50, 32]} />
            <meshStandardMaterial
              color={
                stage === "refined" && isCorrectMethod
                  ? "#09090B" // Jet black concentrated dross / impurity slag
                  : stage === "refining"
                  ? "#1E1E24" // Darkening as impurities get pushed into it
                  : "#475569" // Initially identical to the raw unrefined rod!
              }
              roughness={stage === "refined" ? 0.98 : 0.6}
              metalness={stage === "refined" ? 0.05 : 0.4}
            />
          </mesh>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 4. MOTORIZED MOBILE INDUCTION HEATER CARRIAGE             */}
          {/* ───────────────────────────────────────────────────────── */}
          <group ref={inductionHeaterRef} position={[-1.15, 0.1, 0]}>
            {/* Induction Ring Heating Coil surrounding rod */}
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.30, 0.045, 16, 32]} />
              <meshStandardMaterial
                color="#F97316"
                emissive="#EA580C"
                emissiveIntensity={stage === "refining" ? 1.0 : 0.4}
                metalness={0.8}
              />
            </mesh>

            {/* Glowing Molten Liquid Metal Zone inside the semiconductor rod */}
            {/* Radius 0.180 cleanly sleeves over rod (0.165) with depthWrite={false} and renderOrder */}
            <mesh rotation={[0, 0, Math.PI / 2]} visible={stage === "refining"} renderOrder={2}>
              <cylinderGeometry args={[0.180, 0.180, 0.26, 24]} />
              <meshStandardMaterial
                color="#FDE047"
                emissive="#F59E0B"
                emissiveIntensity={0.9}
                transparent
                opacity={0.92}
                depthWrite={false}
              />
            </mesh>

            {/* Under-Tube Drive Slider Block on the Linear Guide Rails */}
            <mesh position={[0, -0.47, 0]}>
              <boxGeometry args={[0.22, 0.12, 0.32]} />
              <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Vertical Support Strut connecting Slider to Ring */}
            <mesh position={[0, -0.36, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.18, 12]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>

            {/* Radiant Heat Glow from the Molten Zone */}
            <pointLight
              color="#F59E0B"
              intensity={stage === "refining" ? 3.0 : 0.8}
              distance={1.6}
            />
          </group>

          {/* ───────────────────────────────────────────────────────── */}
          {/* 5. 3D BADGES (Positioned Cleanly Without Overlapping)     */}
          {/* Lowered to y = 0.85 so they are completely visible below the top bar */}
          {/* ───────────────────────────────────────────────────────── */}
          <Html position={[-1.25, 0.85, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                <span>① ARGON CHAMBER</span>
              </div>
            </div>
          </Html>
          <Html position={[0.0, 0.85, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-amber-500/60 text-amber-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                <span>② INDUCTION HEATER</span>
              </div>
            </div>
          </Html>
          <Html position={[1.25, 0.85, 0]} center>
            <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
              <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 border border-rose-500/60 text-rose-300 font-mono text-[10.5px] font-black tracking-tight shadow-lg whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                <span>③ IMPURITY SLUG</span>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* LIGHTING SUITE                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.8} />
      {/* Front-Facing Fill Light illuminating inside the tank */}
      <pointLight position={[0, 0.6, 2.2]} intensity={1.2} color="#FFFFFF" />
      <pointLight position={[-0.85, 0.4, 0.8]} intensity={0.8} color="#FED7AA" /> {/* Warm spot on Anode */}
      <pointLight position={[0.85, 0.4, 0.8]} intensity={0.8} color="#FDE68A" />  {/* Golden spot on Cathode */}
    </group>
  );
}

