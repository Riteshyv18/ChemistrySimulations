"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export type ExtractionMethod = "carbon" | "electrolytic" | "self";

interface ReductionFurnace3DProps {
  stage: "idle" | "extracting" | "extracted";
  oxideName: string;
  metalName: string;
  reactivityTier: "high" | "moderate" | "low";
  oxideColor: string;
  metalColor: string;
  selectedMethod: ExtractionMethod | null;
  isCorrectMethod: boolean;
}

export default function ReductionFurnace3D({
  stage,
  oxideName,
  metalName,
  reactivityTier,
  oxideColor,
  metalColor,
  selectedMethod,
  isCorrectMethod,
}: ReductionFurnace3DProps) {
  // Animation refs
  const hearthGlowRef = useRef<THREE.Mesh>(null);
  const corePointLightRef = useRef<THREE.PointLight>(null);
  const gasPointsRef = useRef<THREE.Points>(null);
  const oxideParticlesMeshRef = useRef<THREE.InstancedMesh>(null);
  const moltenMetalMeshRef = useRef<THREE.Mesh>(null);
  const electrodeGroupRef = useRef<THREE.Group>(null);
  const tapStreamRef = useRef<THREE.Mesh>(null);

  const isElectrolyticActive = selectedMethod === "electrolytic";
  const isSelfReductionActive = selectedMethod === "self";

  // Particle positions for rising exhaust gas (CO, CO2, SO2, O2)
  // Starts directly at the chimney rim (y: 0, rising up to 1.5)
  const gasParticles = useMemo(() => {
    const count = 48;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.16;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.16;
    }
    return positions;
  }, []);

  // 40 Instanced oxide and reducing agent granule coordinates
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const oreChargeParticles = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 0.8,
      y: 0.2 + (i / 42) * 0.75,
      z: (Math.random() - 0.5) * 0.8,
      speed: 0.003 + Math.random() * 0.005,
      scale: 0.05 + Math.random() * 0.03,
      isCarbon: i % 3 === 0, // Every 3rd granule is dark carbon coke
    }));
  }, []);

  // Setup initial instanced positions for ore charge
  useEffect(() => {
    if (!oxideParticlesMeshRef.current) return;
    oreChargeParticles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.rotation.set(p.id, p.id * 0.5, p.id * 0.2);
      dummy.updateMatrix();
      oxideParticlesMeshRef.current!.setMatrixAt(i, dummy.matrix);
      // Give carbon coke dark anthracite color, oxide its respective color
      const color = p.isCarbon ? new THREE.Color("#1E293B") : new THREE.Color(oxideColor);
      oxideParticlesMeshRef.current!.setColorAt(i, color);
    });
    oxideParticlesMeshRef.current.instanceMatrix.needsUpdate = true;
    if (oxideParticlesMeshRef.current.instanceColor) {
      oxideParticlesMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [oreChargeParticles, oxideColor, dummy]);

  // Animation frame loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Core Thermal Glow & Pulsing
    if (stage === "extracting" || stage === "extracted") {
      if (corePointLightRef.current) {
        corePointLightRef.current.intensity = isElectrolyticActive
          ? 2.2 + Math.sin(time * 8) * 0.4 // Electric blue glow
          : 3.5 + Math.sin(time * 9) * 0.8; // Fiery furnace orange glow
      }
      if (hearthGlowRef.current) {
        (hearthGlowRef.current.material as THREE.MeshBasicMaterial).opacity =
          0.65 + Math.sin(time * 7) * 0.25;
      }
    } else {
      if (corePointLightRef.current) corePointLightRef.current.intensity = 0.5;
      if (hearthGlowRef.current) {
        (hearthGlowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2;
      }
    }

    // 2. Rising Gas Effervescence Animation (Continuous chimney plume)
    if (gasPointsRef.current) {
      if (stage === "extracting" || stage === "extracted") {
        gasPointsRef.current.visible = true;
        const posAttr = gasPointsRef.current.geometry.attributes.position;
        for (let i = 0; i < 48; i++) {
          let y = posAttr.getY(i) + delta * 0.75;
          let x = posAttr.getX(i) + Math.sin(time * 3 + i) * 0.003;
          if (y > 1.6) {
            y = 0.02 + Math.random() * 0.12; // Respawns directly at chimney mouth
            x = (Math.random() - 0.5) * 0.16;
          }
          posAttr.setY(i, y);
          posAttr.setX(i, x);
        }
        posAttr.needsUpdate = true;
      } else {
        gasPointsRef.current.visible = false;
      }
    }

    // 3. Molten Metal Pool Rising in Lower Basin
    if (moltenMetalMeshRef.current) {
      if (stage === "extracted") {
        moltenMetalMeshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      } else if (stage === "extracting") {
        const progress = Math.min(1, Math.sin(time * 2) * 0.5 + 0.5);
        moltenMetalMeshRef.current.scale.lerp(new THREE.Vector3(1, progress, 1), 0.04);
      } else {
        moltenMetalMeshRef.current.scale.set(1, 0.08, 1);
      }
    }

    // 4. Tap stream: (Removed separate stream mesh to keep visuals clean)

    // 5. Electrode subtle vibration during electrolysis
    if (electrodeGroupRef.current && isElectrolyticActive && stage === "extracting") {
      electrodeGroupRef.current.position.y = 0.85 + Math.sin(time * 20) * 0.008;
    }
  });

  return (
    <group position={[0, -0.48, 0]}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* GROUND STAGE - Medium-Light Slate Navy Industrial Platform     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[7.8, 0.12, 3.6]} />
        <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* High-visibility Cyan Guide Line */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[7.6, 0.01, 0.05]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.6} />
      </mesh>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INTER-UNIT RUNNERS & CONNECTORS (Bridging the 3 units)         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Left-to-Center: Enclosed Feed Chute / Runner entering furnace throat */}
      <group position={[-1.4, -0.12, 0]}>
        {/* Slanted Steel Delivery Tube */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.22]}>
          <boxGeometry args={[1.5, 0.14, 0.32]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Yellow Safety Top Rim on Chute */}
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, -0.22]}>
          <boxGeometry args={[1.52, 0.03, 0.34]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        {/* Support Steel Stanchion */}
        <mesh position={[0, -0.26, 0]}>
          <boxGeometry args={[0.08, 0.44, 0.28]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>
      </group>

      {/* Center-to-Right: Metal Tap Runner pouring cleanly into Ingot Mould */}
      <group position={[1.42, 0.08, 0]}>
        {/* Slanted Iron Trough Channel */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[1.35, 0.08, 0.28]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Yellow Safety Guard Border */}
        <mesh position={[0, 0.05, 0.13]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[1.37, 0.05, 0.03]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, -0.13]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[1.37, 0.05, 0.03]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.4} />
        </mesh>
        {/* Inner Liquid Metal Channel Floor */}
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[1.31, 0.03, 0.22]} />
          <meshStandardMaterial
            color={stage === "extracted" ? metalColor : "#D97706"}
            emissive={stage === "extracted" ? "#000000" : "#B45309"}
            emissiveIntensity={stage === "extracted" ? 0 : 0.5}
            metalness={0.9}
          />
        </mesh>
        {/* Stanchion Support */}
        <mesh position={[0.05, -0.38, 0]}>
          <boxGeometry args={[0.08, 0.62, 0.22]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. LEFT STATION: RAW OXIDE FEEDER & CHARGING HOPPER           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[-2.4, 0, 0]}>
        {/* Support Legs */}
        {[-0.32, 0.32].map((x) =>
          [-0.32, 0.32].map((z) => (
            <mesh key={`feeder-${x}-${z}`} position={[x, -0.42, z]}>
              <boxGeometry args={[0.08, 0.52, 0.08]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
          ))
        )}

        {/* Storage Silo Base */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.9, 0.45, 0.9]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Transparent Mineral Inspection Glass */}
        <mesh position={[0, -0.08, 0.46]}>
          <planeGeometry args={[0.55, 0.28]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.65} roughness={0.1} />
        </mesh>

        {/* Conical Hopper Funnel (Open Top Chamber) */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.55, 0.25, 0.6, 24, 1, true]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.6} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Yellow Safety Top Rim (Horizontal collar flat on the hopper rim) */}
        <mesh position={[0, 0.70, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.54, 0.04, 16, 32]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.3} />
        </mesh>

        {/* Oxide Ore Minerals in Hopper (Heaped cluster of chunks, clearly visible sitting in open hopper) */}
        {stage === "idle" && (
          <group position={[0, 0.72, 0]}>
            {/* Main Central Boulder */}
            <mesh position={[0, 0.08, 0]}>
              <dodecahedronGeometry args={[0.22, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.65} metalness={0.2} />
            </mesh>
            {/* Front & Surrounding Distinct Chunks */}
            <mesh position={[-0.18, 0.02, 0.14]}>
              <dodecahedronGeometry args={[0.15, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.7} metalness={0.2} />
            </mesh>
            <mesh position={[0.18, 0.04, 0.12]}>
              <dodecahedronGeometry args={[0.14, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.7} metalness={0.2} />
            </mesh>
            <mesh position={[0.22, 0.01, -0.14]}>
              <dodecahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.7} metalness={0.2} />
            </mesh>
            <mesh position={[-0.20, 0.02, -0.14]}>
              <dodecahedronGeometry args={[0.15, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.65} metalness={0.2} />
            </mesh>
            {/* Top Peak Rocks */}
            <mesh position={[0.06, 0.19, 0.04]}>
              <dodecahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.65} metalness={0.2} />
            </mesh>
            <mesh position={[-0.08, 0.16, -0.06]}>
              <dodecahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color={oxideColor} roughness={0.65} metalness={0.2} />
            </mesh>
          </group>
        )}

        {/* Discharge Chute pouring cleanly into delivery runner */}
        <mesh position={[0.55, -0.16, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.42, 0.1, 0.34]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. CENTRAL STATION: MAIN REDUCTION REACTOR / EXTRACTION FURNACE*/}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[0.05, 0.05, 0]}>
        {/* Foundation Base Block */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[2.1, 0.32, 1.8]} />
          <meshStandardMaterial color="#64748B" metalness={0.4} roughness={0.5} />
        </mesh>

        {/* Main Furnace Body - Blast Furnace / Reverberatory / Electrolytic Tank / Bessemer Converter */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.92, 1.08, 1.45, 32]} />
          <meshStandardMaterial
            color={
              isElectrolyticActive
                ? "#64748B" // Industrial Slate Grey electrolyte bath vat
                : isSelfReductionActive
                ? "#7C2D12" // Bessemer Converter refractory copper-brown
                : "#831843" // Blast furnace refractory maroon
            }
            roughness={0.75}
            metalness={0.4}
          />
        </mesh>

        {/* Steel Reinforcing Rings & Straps */}
        {[-0.35, 0.1, 0.55].map((y) => (
          <mesh key={`band-${y}`} position={[0, y, 0]}>
            <cylinderGeometry args={[1.02, 1.02, 0.08, 32]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>
        ))}

        {/* Clean Rectangular Observation Port Frame */}
        <mesh position={[0, 0.12, 0.98]}>
          <boxGeometry args={[0.78, 0.46, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>

        {/* Front Observation / Reaction Chamber Quartz Glass */}
        <mesh position={[0, 0.12, 1.04]}>
          <planeGeometry args={[0.66, 0.36]} />
          <meshBasicMaterial
            color={
              stage === "extracting" || stage === "extracted"
                ? isElectrolyticActive
                  ? "#06B6D4" // Electric cyan glow
                  : "#F97316" // Intense thermite orange glow
                : "#0284C7"
            }
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Internal Glow Mesh behind window */}
        <mesh ref={hearthGlowRef} position={[0, 0.12, 0.85]}>
          <planeGeometry args={[0.76, 0.52]} />
          <meshBasicMaterial
            color={isElectrolyticActive ? "#22D3EE" : "#FB923C"}
            transparent
            opacity={0.3}
          />
        </mesh>

        {/* Internal Molten Layer accumulating at base */}
        <mesh ref={moltenMetalMeshRef} position={[0, -0.42, 0]} scale={[1, 0.08, 1]}>
          <cylinderGeometry args={[0.85, 0.85, 0.35, 24]} />
          <meshStandardMaterial
            color={stage === "extracted" ? metalColor : isElectrolyticActive ? "#E2E8F0" : "#F59E0B"}
            metalness={0.9}
            roughness={0.2}
            emissive={stage === "extracted" ? "#000000" : "#D97706"}
            emissiveIntensity={stage === "extracted" ? 0 : 0.4}
          />
        </mesh>

        {/* Dynamic Instanced Particles inside chamber (Oxide + Carbon) */}
        <instancedMesh ref={oxideParticlesMeshRef} args={[undefined, undefined, 42]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial roughness={0.6} metalness={0.4} />
        </instancedMesh>

        {/* ── TOP ASSEMBLY: Depends on Method Mode ── */}
        {isElectrolyticActive ? (
          /* ELECTROLYTIC CELL: Carbon Anode Rods dipping into bath */
          <group ref={electrodeGroupRef} position={[0, 0.85, 0]}>
            {/* Busbar Crossbeam */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[1.5, 0.08, 0.25]} />
              <meshStandardMaterial color="#B45309" metalness={0.9} /> {/* Copper busbar */}
            </mesh>
            {/* 3 Graphite Anodes hanging into the molten electrolyte */}
            {[-0.45, 0, 0.45].map((x) => (
              <mesh key={`anode-${x}`} position={[x, -0.05, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.75, 16]} />
                <meshStandardMaterial color="#64748B" roughness={0.6} metalness={0.5} />
              </mesh>
            ))}
          </group>
        ) : isSelfReductionActive ? (
          /* BESSEMER / AUTO-REDUCTION CONVERTER: Compact Industrial Hood & Blast Tuyeres */
          <group position={[0, 0.9, 0]}>
            {/* Flared Conical Converter Dome */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.52, 0.92, 0.38, 32]} />
              <meshStandardMaterial color="#431407" metalness={0.6} />
            </mesh>
            {/* Horizontal Top Convering Mouth Collar (Flat rim, no vertical handle) */}
            <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.50, 0.04, 16, 32]} />
              <meshStandardMaterial color="#A16207" metalness={0.8} />
            </mesh>
            {/* Double Air Tuyere Injector Manifolds on the side */}
            <mesh position={[-0.45, 0.05, 0]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.07, 0.07, 0.35, 16]} />
              <meshStandardMaterial color="#D97706" metalness={0.8} />
            </mesh>
            <mesh position={[0.45, 0.05, 0]} rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.07, 0.07, 0.35, 16]} />
              <meshStandardMaterial color="#D97706" metalness={0.8} />
            </mesh>
          </group>
        ) : (
          /* BLAST / THERMAL FURNACE: Bell Charging Hopper & Exhaust Flue */
          <group position={[0, 0.9, 0]}>
            {/* Top Conical Dome */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.42, 0.92, 0.35, 32]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
            {/* Double-Bell Feed Top */}
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.38, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            {/* Yellow Top Access Ring */}
            <mesh position={[0, 0.65, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.06, 24]} />
              <meshStandardMaterial color="#F59E0B" roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* Off-gas Chimney Flue */}
        <mesh position={[0.55, 1.15, -0.2]}>
          <cylinderGeometry args={[0.14, 0.16, 0.75, 16]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>
        <mesh position={[0.55, 1.54, -0.2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>

        {/* 4. CHIMNEY GAS EFFLUENT (CO, CO2, SO2, O2 Plumes) inside furnace group */}
        {/* Starts directly at the flue cap mouth [0.55, 1.57, -0.2] */}
        <points ref={gasPointsRef} position={[0.55, 1.57, -0.2]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[gasParticles, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.16}
            color={
              isElectrolyticActive
                ? "#E2E8F0" // Colorless O2 gas bubbles
                : selectedMethod === "self"
                ? "#FBBF24" // Pungent yellow SO2 gas
                : "#94A3B8" // Carbon dioxide / CO smokey vapor
            }
            transparent
            opacity={0.65}
          />
        </points>

        {/* Tap-hole Spout (Right side) pouring pure metal out */}
        <mesh position={[0.95, -0.1, 0]} rotation={[0, 0, -0.16]}>
          <boxGeometry args={[0.38, 0.08, 0.22]} />
          <meshStandardMaterial color="#64748B" metalness={0.7} />
        </mesh>
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. RIGHT STATION: EXTRACTED METAL RECEIVER TABLE              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[2.45, 0, 0]}>
        {/* Support Steel Stand Firmly on Floor */}
        {[-0.32, 0.32].map((x) =>
          [-0.32, 0.32].map((z) => (
            <mesh key={`ingot-stand-${x}-${z}`} position={[x, -0.42, z]}>
              <boxGeometry args={[0.08, 0.52, 0.08]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
          ))
        )}

        {/* Heavy Industrial Stand Base Table */}
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[1.05, 0.16, 0.85]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.5} />
        </mesh>

        {/* Outer Ingot Mould Raised Rim (Consistent Clean Industrial Slate) */}
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[0.94, 0.12, 0.74]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>

        {/* Inner Clean Empty Mould Floor (Always clean silver-grey before extraction or on wrong attempt) */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.84, 0.03, 0.64]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.4} metalness={0.4} />
        </mesh>

        {/* 2 Empty Mould Cavity Grooves when tray is empty */}
        {!(stage === "extracted" && isCorrectMethod) && (
          <>
            <mesh position={[-0.2, 0.025, 0]}>
              <boxGeometry args={[0.3, 0.01, 0.52]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.5} />
            </mesh>
            <mesh position={[0.2, 0.025, 0]}>
              <boxGeometry args={[0.3, 0.01, 0.52]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.5} />
            </mesh>
          </>
        )}

        {/* Pure Shiny Metal Ingot Bars (Appear only when extraction is successfully completed) */}
        {stage === "extracted" && isCorrectMethod && (
          <group position={[0, 0.06, 0]}>
            {/* Left Ingot Bar */}
            <mesh position={[-0.2, 0, 0]}>
              <boxGeometry args={[0.3, 0.08, 0.52]} />
              <meshStandardMaterial
                color={metalColor}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
            {/* Right Ingot Bar */}
            <mesh position={[0.2, 0, 0]}>
              <boxGeometry args={[0.3, 0.08, 0.52]} />
              <meshStandardMaterial
                color={metalColor}
                metalness={0.4}
                roughness={0.3}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3D FLOATING BADGES                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Badge 1: Left Feeder */}
      <Html position={[-2.4, -0.62, 0.8]} center zIndexRange={[10, 0]}>
        <div style={{ transform: "scale(0.92)", transformOrigin: "center" }}>
          <div className="px-2 py-0.5 rounded-md bg-slate-800/95 border border-slate-600 text-cyan-300 font-mono text-[9.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
            ① OXIDE CHARGE ({oxideName})
          </div>
        </div>
      </Html>

      {/* Badge 2: Central Core (Shifted upward cleanly on the furnace front face so it is completely clear of bottom buttons) */}
      <Html position={[0.05, -0.20, 1.25]} center zIndexRange={[10, 0]}>
        <div style={{ transform: "scale(0.92)", transformOrigin: "center" }}>
          <div className="px-2 py-0.5 rounded-md bg-slate-800/95 border border-slate-600 text-slate-100 font-mono text-[9.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
            ② {isElectrolyticActive ? "ELECTROLYTIC BATH" : isSelfReductionActive ? "BESSEMER CONVERTER" : "BLAST FURNACE"}
          </div>
        </div>
      </Html>

      {/* Badge 3: Right Ingot Mould */}
      <Html position={[2.45, -0.62, 0.8]} center zIndexRange={[10, 0]}>
        <div style={{ transform: "scale(0.92)", transformOrigin: "center" }}>
          <div className="px-2 py-0.5 rounded-lg bg-slate-800/95 border border-slate-600 text-amber-300 font-mono text-[9.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
            ③ EXTRACTED {metalName.toUpperCase()}
          </div>
        </div>
      </Html>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. LIGHTING SUITE                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-4, 5, -2]} intensity={0.7} />
      <pointLight
        ref={corePointLightRef}
        position={[0.1, 0.25, 0.6]}
        intensity={stage === "extracting" || stage === "extracted" ? 3.5 : 0.5}
        color={isElectrolyticActive ? "#06B6D4" : "#F59E0B"}
        distance={4.8}
      />
    </group>
  );
}

