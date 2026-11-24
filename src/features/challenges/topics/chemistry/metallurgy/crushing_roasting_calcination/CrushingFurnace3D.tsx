"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface CrushingFurnace3DProps {
  stage: "idle" | "crushing" | "crushed" | "furnace_running" | "transformed";
  oreType: "sulphide" | "carbonate";
  rawOreColor: string;
  oxideColor: string;
  selectedProcess: "roasting" | "calcination" | null;
  isCorrectProcess: boolean;
}

export default function CrushingFurnace3D({
  stage,
  oreType,
  rawOreColor,
  oxideColor,
  selectedProcess,
  isCorrectProcess,
}: CrushingFurnace3DProps) {
  // Mechanical animation refs
  const crusherJawRef = useRef<THREE.Group>(null);
  const conveyorBeltMeshRef = useRef<THREE.Mesh>(null);
  const roller1Ref = useRef<THREE.Mesh>(null);
  const roller2Ref = useRef<THREE.Mesh>(null);
  const flameMeshRef = useRef<THREE.Mesh>(null);
  const smokePointsRef = useRef<THREE.Points>(null);
  const rocksGroupRef = useRef<THREE.Group>(null);
  const powderMeshRef = useRef<THREE.InstancedMesh>(null);

  // Large raw ore rocks placed INSIDE the hollow crusher mouth
  const rawRocks = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      initPos: new THREE.Vector3(
        -2.35 + ((i % 3) - 1) * 0.12,
        0.82 + Math.floor(i / 3) * 0.14,
        ((i % 2) - 0.5) * 0.16
      ),
      size: 0.11 + (i % 4) * 0.025,
      rot: new THREE.Euler(i * 0.6, i * 0.9, i * 0.4),
    }));
  }, []);

  // 96 Natural Crushed Mineral Granules along the conveyor
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const crushedParticles = useMemo(() => {
    return Array.from({ length: 96 }).map((_, i) => ({
      id: i,
      // progress along conveyor with slight random jitter for natural look
      frac: (i / 96) + (Math.sin(i * 9) * 0.015),
      lateral: ((Math.sin(i * 13) * 0.14)),
      sizeScale: 0.75 + ((i % 5) * 0.12),
    }));
  }, []);

  // Smoke / Gas Particle cloud for furnace chimney
  // Chimney is at x = 2.2 + 0.35 = 2.55, y = 1.15 to 2.2, z = 0
  const smokeParticles = useMemo(() => {
    const count = 35;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 2.55 + (Math.random() - 0.5) * 0.12;
      positions[i * 3 + 1] = 1.15 + Math.random() * 0.9;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    return positions;
  }, []);

  // Frame animation loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // 1. Jaw Crusher Vibration/Crushing motion
    if (crusherJawRef.current) {
      if (stage === "crushing") {
        crusherJawRef.current.rotation.z = Math.sin(t * 24) * 0.12 - 0.18;
      } else {
        crusherJawRef.current.rotation.z = -0.12;
      }
    }

    // 2. Rollers rotation
    if (roller1Ref.current && roller2Ref.current) {
      if (stage === "crushing" || stage === "furnace_running") {
        roller1Ref.current.rotation.z -= delta * 4;
        roller2Ref.current.rotation.z -= delta * 4;
      }
    }

    // 3. Raw Rocks dropping through crusher
    if (rocksGroupRef.current) {
      if (stage === "crushing") {
        rocksGroupRef.current.children.forEach((rock) => {
          rock.position.y -= delta * 0.85;
          rock.rotation.x += delta * 2;
          rock.rotation.y += delta * 2.5;
          if (rock.position.y < 0.25) {
            rock.scale.setScalar(Math.max(0.01, rock.scale.x - delta * 2.5));
          }
          if (rock.position.y < -0.1) {
            rock.visible = false;
          }
        });
      } else if (stage === "idle") {
        rocksGroupRef.current.children.forEach((rock, idx) => {
          rock.visible = true;
          rock.position.copy(rawRocks[idx].initPos);
          rock.scale.setScalar(1);
        });
      }
    }

    // 4. Crushed Powder Movement on Conveyor & into Furnace
    if (powderMeshRef.current) {
      const activeColor = new THREE.Color(
        stage === "transformed" && isCorrectProcess ? oxideColor : rawOreColor
      );

      crushedParticles.forEach((p, idx) => {
        let x = 0;
        let y = 0;
        let z = p.lateral;
        let scale = 0;

        if (stage === "idle") {
          scale = 0;
        } else if (stage === "crushing") {
          // Particles emerge from crusher discharge chute and stream along belt to right!
          // Progress depends on time
          const speed = 0.55;
          const currentFrac = ((p.frac + t * speed) % 1.0);
          x = -1.65 + currentFrac * 3.1;
          y = -0.13 + (Math.sin(idx * 7) * 0.008);
          scale = 0.038 * p.sizeScale;
        } else if (stage === "crushed") {
          // Once crushed, continuous steady belt streaming from crusher to furnace!
          const speed = 0.45;
          const currentFrac = ((p.frac + t * speed) % 1.0);
          x = -1.65 + currentFrac * 3.1;
          y = -0.13 + (Math.sin(idx * 7) * 0.008);
          scale = 0.038 * p.sizeScale;
        } else if (stage === "furnace_running") {
          // Powder flows into furnace hearth bed
          const feedIn = Math.min(1.0, (t * 0.8) % 1.0);
          x = -0.2 + feedIn * 1.8 + ((idx % 12) * 0.04);
          y = -0.18 + ((idx * 5) % 6) * 0.012;
          z = -0.22 + Math.floor(idx / 12) * 0.055;
          scale = 0.040 * p.sizeScale;
        } else if (stage === "transformed") {
          // Concentrated mound inside furnace hearth glowing as oxide!
          x = 1.6 + ((idx % 12) * 0.065);
          y = -0.18 + ((idx * 5) % 6) * 0.012;
          z = -0.24 + Math.floor(idx / 12) * 0.065;
          scale = 0.042 * p.sizeScale;
        }

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(scale);
        dummy.rotation.set(idx * 0.3 + t * 0.5, idx * 0.5, idx * 0.7);
        dummy.updateMatrix();
        powderMeshRef.current!.setMatrixAt(idx, dummy.matrix);
        powderMeshRef.current!.setColorAt(idx, activeColor);
      });
      powderMeshRef.current.instanceMatrix.needsUpdate = true;
      if (powderMeshRef.current.instanceColor) {
        powderMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    // 5. Furnace Heating Flame & Glow
    if (flameMeshRef.current) {
      if (stage === "furnace_running" || stage === "transformed") {
        const flicker = 0.9 + Math.sin(t * 16) * 0.12 + Math.cos(t * 26) * 0.08;
        flameMeshRef.current.scale.set(1 + Math.sin(t * 12) * 0.08, flicker, 1);
        flameMeshRef.current.visible = true;
      } else {
        flameMeshRef.current.visible = false;
      }
    }

    // 6. Chimney Smoke / Gas particle rise directly from the chimney lip
    if (smokePointsRef.current) {
      if (stage === "furnace_running" || stage === "transformed") {
        smokePointsRef.current.visible = true;
        const posAttr = smokePointsRef.current.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          let y = posAttr.getY(i) + delta * (0.85 + (i % 3) * 0.25);
          let x = posAttr.getX(i) + Math.sin(t * 3 + i) * 0.005;
          if (y > 2.2) {
            y = 1.15;
            x = 2.55 + (Math.random() - 0.5) * 0.12;
          }
          posAttr.setY(i, y);
          posAttr.setX(i, x);
        }
        posAttr.needsUpdate = true;
      } else {
        smokePointsRef.current.visible = false;
      }
    }
  });

  return (
    <group position={[0, -0.45, 0]}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* FACTORY STUDIO ENCLOSURE (Seamless / No Artificial Walls)      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Heavy Steel Floor Plate - Industrial Slate Navy contrast stage directly under system */}
      <mesh position={[0, -0.72, 0]}>
        <boxGeometry args={[7.8, 0.12, 3.6]} />
        <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Floor Guide Accent Line */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[7.6, 0.01, 0.05]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.5} />
      </mesh>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. JAW CRUSHER UNIT (Left Section, firmly seated on floor)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[-2.35, 0, 0]}>
        {/* Open Feed Hopper (Hollow Funnel with open top) */}
        <group position={[0, 0.95, 0]}>
          {/* 4 Funnel Flaring Plates creating an open mouth */}
          <mesh position={[0, 0, 0.32]} rotation={[-0.32, 0, 0]}>
            <boxGeometry args={[0.78, 0.62, 0.05]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, -0.32]} rotation={[0.32, 0, 0]}>
            <boxGeometry args={[0.78, 0.62, 0.05]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0.32, 0, 0]} rotation={[0, 0, -0.32]}>
            <boxGeometry args={[0.05, 0.62, 0.68]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[-0.32, 0, 0]} rotation={[0, 0, 0.32]}>
            <boxGeometry args={[0.05, 0.62, 0.68]} />
            <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.7} />
          </mesh>

          {/* Yellow Safety Trim around the OPEN rim (hollow ring) */}
          <mesh position={[0, 0.3, 0.44]}>
            <boxGeometry args={[0.96, 0.04, 0.04]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.3, -0.44]}>
            <boxGeometry args={[0.96, 0.04, 0.04]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.3} />
          </mesh>
          <mesh position={[0.44, 0.3, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.88]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.3} />
          </mesh>
          <mesh position={[-0.44, 0.3, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.88]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.3} />
          </mesh>
        </group>

        {/* Heavy Crusher Body Casing - Industrial Slate/Steel */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.95, 0.85, 0.95]} />
          <meshStandardMaterial color="#64748B" roughness={0.35} metalness={0.5} />
        </mesh>

        {/* Steel Corner Trims for crisp industrial geometry */}
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[0.98, 0.05, 0.98]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.98, 0.05, 0.98]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>

        {/* Glass Inspection Window */}
        <mesh position={[0, 0.25, 0.485]}>
          <planeGeometry args={[0.62, 0.45]} />
          <meshStandardMaterial color="#94A3B8" transparent opacity={0.5} roughness={0.1} />
        </mesh>

        {/* Internal Fixed Jaw Plate */}
        <mesh position={[0.2, 0.25, 0]}>
          <boxGeometry args={[0.1, 0.6, 0.7]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} />
        </mesh>

        {/* Internal Moving Jaw Plate */}
        <group ref={crusherJawRef} position={[-0.2, 0.35, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.12, 0.6, 0.7]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        </group>

        {/* Side Drive Pulley / Flywheel */}
        <mesh position={[0, 0.35, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.08, 24]} />
          <meshStandardMaterial color="#64748B" metalness={0.7} />
        </mesh>

        {/* Discharge Chute pouring cleanly ONTO the conveyor belt */}
        <mesh position={[0.55, -0.12, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.42, 0.08, 0.42]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>

        {/* 4 Structural Steel Legs Firmly on Floor */}
        {[-0.35, 0.35].map((x) =>
          [-0.35, 0.35].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.42, z]}>
              <boxGeometry args={[0.12, 0.48, 0.12]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
          ))
        )}

        {/* 3D Floating Station Badge: JAW CRUSHER - Direct below unit */}
        <Html position={[0, -0.66, 0.72]} center zIndexRange={[10, 0]}>
          <div style={{ transform: 'scale(1.06)', transformOrigin: 'center' }}>
            <div className="px-2.5 py-1 rounded-md bg-slate-800/95 border border-slate-600 text-cyan-300 font-mono text-[10.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
              ① JAW CRUSHER
            </div>
          </div>
        </Html>
      </group>

      {/* Raw Chunks Group waiting inside/above Crusher Hopper */}
      <group ref={rocksGroupRef}>
        {rawRocks.map((rock) => (
          <mesh key={rock.id} position={rock.initPos} rotation={rock.rot} castShadow>
            <dodecahedronGeometry args={[rock.size, 0]} />
            <meshStandardMaterial color={rawOreColor} roughness={0.7} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. INDUSTRIAL CONVEYOR BELT (Seamlessly bridges crusher -> furnace) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[0.05, -0.18, 0]}>
        {/* Moving Rubber Belt Surface */}
        <mesh ref={conveyorBeltMeshRef} position={[0, 0.02, 0]}>
          <boxGeometry args={[3.4, 0.04, 0.48]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>

        {/* Steel Bed Frame */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[3.45, 0.05, 0.54]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>

        {/* Yellow Guard Rails */}
        <mesh position={[0, 0.06, 0.28]}>
          <boxGeometry args={[3.45, 0.08, 0.03]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.06, -0.28]}>
          <boxGeometry args={[3.45, 0.08, 0.03]} />
          <meshStandardMaterial color="#F59E0B" roughness={0.5} />
        </mesh>

        {/* End Rollers (Inside belt frame, NOT floating!) */}
        <mesh ref={roller1Ref} position={[-1.68, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 16]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </mesh>
        <mesh ref={roller2Ref} position={[1.68, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 16]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </mesh>

        {/* Support Steel Stanchions Anchored to Floor (y = -0.66) */}
        {[-1.1, 0, 1.1].map((x) => (
          <group key={x} position={[x, -0.25, 0]}>
            <mesh position={[0, 0, 0.24]}>
              <boxGeometry args={[0.08, 0.46, 0.06]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
            <mesh position={[0, 0, -0.24]}>
              <boxGeometry args={[0.08, 0.46, 0.06]} />
              <meshStandardMaterial color="#64748B" metalness={0.6} />
            </mesh>
            {/* Cross-brace bar */}
            <mesh position={[0, -0.15, 0]}>
              <boxGeometry args={[0.06, 0.04, 0.48]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          </group>
        ))}

        {/* 3D Floating Station Badge: CONVEYOR FEED - Placed on top side above conveyor */}
        <Html position={[0, 0.38, 0]} center zIndexRange={[10, 0]}>
          <div style={{ transform: 'scale(1.06)', transformOrigin: 'center' }}>
            <div className="px-2.5 py-1 rounded-md bg-slate-800/95 border border-slate-600 text-slate-100 font-mono text-[10.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
              ② CONVEYOR FEED
            </div>
          </div>
        </Html>
      </group>

      {/* Crushed Powder Instanced Mesh (Flows along conveyor & enters furnace) */}
      <instancedMesh ref={powderMeshRef} args={[undefined, undefined, 96]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.65} metalness={0.4} />
      </instancedMesh>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. REVERBERATORY PROCESSING FURNACE (Solidly on the Ground!)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <group position={[2.2, 0, 0]}>
        {/* Concrete / Brick Foundation Block (Anchors furnace to floor at y: -0.66) */}
        <mesh position={[0, -0.48, 0]}>
          <boxGeometry args={[1.5, 0.36, 1.3]} />
          <meshStandardMaterial color="#64748B" roughness={0.7} metalness={0.3} />
        </mesh>

        {/* Main Refractory Brick Furnace Body */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[1.45, 0.98, 1.25]} />
          <meshStandardMaterial color="#9A3412" roughness={0.85} />
        </mesh>

        {/* Heavy Structural Steel Buckstays & Straps */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.48, 0.08, 1.28]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[1.48, 0.08, 1.28]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>

        {/* Conveyor Entrance Throat on Left (x = -0.73) */}
        <mesh position={[-0.73, -0.12, 0]}>
          <boxGeometry args={[0.06, 0.38, 0.62]} />
          <meshStandardMaterial color="#475569" />
        </mesh>

        {/* Front Inspection Port / Tinted Quartz Glass */}
        <mesh position={[0, 0.22, 0.63]}>
          <planeGeometry args={[0.7, 0.42]} />
          <meshStandardMaterial
            color={stage === "furnace_running" || stage === "transformed" ? "#F59E0B" : "#94A3B8"}
            emissive={stage === "furnace_running" || stage === "transformed" ? "#D97706" : "#000000"}
            emissiveIntensity={stage === "furnace_running" || stage === "transformed" ? 0.8 : 0}
            transparent
            opacity={0.7}
            roughness={0.1}
          />
        </mesh>

        {/* Internal Fire Hearth Floor */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[1.2, 0.08, 1.0]} />
          <meshStandardMaterial color="#451A03" roughness={0.9} />
        </mesh>

        {/* Internal Fire Glow / Flame Mesh */}
        <mesh ref={flameMeshRef} position={[0, -0.1, 0]}>
          <boxGeometry args={[0.9, 0.22, 0.7]} />
          <meshBasicMaterial color="#FF5722" transparent opacity={0.85} />
        </mesh>

        {/* Roof-Mounted Air Damper / Tuyere Valve */}
        <group position={[-0.28, 0.78, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.22, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
          {/* Pivoting Damper Flap (Green = Open / Red = Closed) */}
          <mesh
            position={[0, 0.12, 0]}
            rotation={[selectedProcess === "roasting" ? 0.9 : 0, 0, 0]}
          >
            <boxGeometry args={[0.26, 0.03, 0.26]} />
            <meshStandardMaterial
              color={selectedProcess === "roasting" ? "#10B981" : "#EF4444"}
              metalness={0.5}
            />
          </mesh>
        </group>

        {/* Flue Exhaust Chimney */}
        <mesh position={[0.35, 1.05, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 0.75, 16]} />
          <meshStandardMaterial color="#64748B" metalness={0.6} />
        </mesh>
        {/* Chimney Lip */}
        <mesh position={[0.35, 1.43, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.06, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>

        {/* 3D Floating Station Badge: REVERBERATORY FURNACE - Directly below furnace */}
        <Html position={[0, -0.66, 0.72]} center zIndexRange={[10, 0]}>
          <div style={{ transform: 'scale(1.06)', transformOrigin: 'center' }}>
            <div className="px-2.5 py-1 rounded-md bg-slate-800/95 border border-slate-600 text-amber-300 font-mono text-[10.5px] font-bold tracking-tight shadow-md whitespace-nowrap pointer-events-none select-none">
              ③ REVERBERATORY FURNACE
            </div>
          </div>
        </Html>
      </group>

      {/* Chimney Gas Smoke Clouds (SO2 vs CO2) */}
      <points ref={smokePointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[smokeParticles, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.18}
          color={
            oreType === "sulphide" && selectedProcess === "roasting"
              ? "#FBBF24" // Pungent Yellowish SO2 Gas
              : "#E2E8F0" // White/Colorless CO2 / Steam Vapor
          }
          transparent
          opacity={0.65}
        />
      </points>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. BALANCED INDUSTRIAL LIGHTING                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-4, 5, -2]} intensity={0.7} />
      <pointLight
        position={[2.2, 0.2, 0.5]}
        intensity={stage === "furnace_running" || stage === "transformed" ? 3.5 : 0.4}
        color="#F59E0B"
        distance={4.5}
      />
    </group>
  );
}
