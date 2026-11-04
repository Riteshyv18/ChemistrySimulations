"use client";

import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Zap,
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { exitSimulation } from "@/lib/mobileBridge";

// ── AUDIO SYNTHESIZER ────────────────────────────────────────────────────────
function playAudioTone(type: "click" | "unlock" | "correct" | "wrong" | "hum") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "click") {
      osc.frequency.setValueAtTime(560, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "unlock") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "correct") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "wrong") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.setValueAtTime(130, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "hum") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  } catch {
    // Audio might be blocked before first user gesture
  }
}

// ── 3D GLASS BEAKER WITH SOLUTION ─────────────────────────────────────────────
function Beaker3D({
  position,
  liquidColor,
  liquidOpacity = 0.55,
  solutionFormula,
  isSelected = false,
  onClick,
}: {
  position: [number, number, number];
  liquidColor: string;
  liquidOpacity?: number;
  solutionFormula: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      {/* Outer Selection Glow Ring */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 1.45, 36]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Outer Glass Beaker Cylinder */}
      <mesh position={[0, 0.9, 0]} renderOrder={2}>
        <cylinderGeometry args={[1.2, 1.18, 1.8, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.05}
          transmission={0.92}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Beaker Glass Base */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.18, 36]} />
        <meshStandardMaterial color="#CBD5E1" transparent opacity={0.5} roughness={0.1} />
      </mesh>

      {/* Glass Rim Top Ring */}
      <mesh position={[0, 1.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.035, 16, 40]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.1} />
      </mesh>

      {/* Aqueous Electrolyte Solution Volume */}
      <mesh position={[0, 0.75, 0]} renderOrder={1}>
        <cylinderGeometry args={[1.16, 1.15, 1.45, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={liquidOpacity}
        />
      </mesh>

      {/* Solution Meniscus / Top Surface */}
      <mesh position={[0, 1.47, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[1.15, 36]} />
        <meshStandardMaterial
          color={liquidColor}
          roughness={0.15}
          metalness={0.15}
          transparent
          opacity={Math.min(0.95, liquidOpacity + 0.1)}
        />
      </mesh>

      {/* Measurement Ticks on Beaker Wall */}
      {[-0.3, 0.0, 0.3, 0.6].map((yOff, idx) => (
        <mesh key={idx} position={[1.18, 0.8 + yOff, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
          <meshBasicMaterial color="#94A3B8" />
        </mesh>
      ))}

      {/* Solution Formula Badge on Beaker */}
      <Html position={[0, 0.65, 1.25]} center distanceFactor={8.5} zIndexRange={[15, 0]}>
        <div
          className={`bg-slate-950/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full border ${isSelected
            ? "border-sky-400 ring-2 ring-sky-400 text-sky-200 shadow-md"
            : "border-white/20 text-white"
            } font-mono text-[10px] font-extrabold shadow-sm whitespace-nowrap flex items-center gap-1.5 tracking-wider`}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: liquidColor }} />
          <span>{solutionFormula}</span>
        </div>
      </Html>
    </group>
  );
}

// ── FLOATING IONS IN BEAKER SOLUTIONS ─────────────────────────────────────────
function SolutionIons3D({
  type,
  beakerPos,
  isActive,
}: {
  type: "zn" | "cu";
  beakerPos: [number, number, number];
  isActive: boolean;
}) {
  const count = 6;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate initial random offsets within beaker liquid radius
  const offsets = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      r: 0.3 + (i % 3) * 0.25,
      y: 0.35 + (i % 4) * 0.25,
      speed: 0.8 + (i % 3) * 0.4,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    offsets.forEach((o, i) => {
      const curAngle = o.angle + t * (isActive ? o.speed * 0.6 : 0.2);
      const px = beakerPos[0] + Math.cos(curAngle) * o.r;
      const pz = beakerPos[2] + Math.sin(curAngle) * o.r;
      const py = beakerPos[1] + o.y + Math.sin(t * 2 + i) * 0.06;

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(0.08);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={type === "zn" ? "#94A3B8" : "#38BDF8"}
        emissive={type === "zn" ? "#64748B" : "#0284C7"}
        emissiveIntensity={isActive ? 0.9 : 0.4}
        roughness={0.2}
      />
    </instancedMesh>
  );
}

// ── 3D ZINC ELECTRODE ────────────────────────────────────────────────────────
function ZincElectrode3D({
  assignedRole,
  isRoleConfirmed,
  onAssign,
}: {
  assignedRole: "anode" | "cathode" | null;
  isRoleConfirmed: boolean;
  onAssign?: () => void;
}) {
  const targetPos = [-2.4, 0.95, 0] as [number, number, number];
  const targetRot = [0.1, 0.05, 0.25] as [number, number, number];

  return (
    <group
      position={targetPos}
      rotation={targetRot}
      onClick={(e) => {
        e.stopPropagation();
        if (onAssign) onAssign();
      }}
    >
      {/* Polished Grey Metallic Zinc Bar */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.32, 1.9, 0.08]} />
        <meshStandardMaterial
          color="#D1D5DB"
          metalness={0.88}
          roughness={0.22}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Floating Tag for Zinc Electrode */}
      <Html position={[-0.8, 1.35, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div
          className={`px-2.5 py-0.5 rounded-full border font-mono text-[9px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1 cursor-pointer transition-all ${assignedRole === "anode"
            ? isRoleConfirmed
              ? "bg-slate-900/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50"
              : "bg-slate-900/90 border-sky-400 text-sky-200"
            : assignedRole === "cathode"
              ? "bg-red-950/90 border-red-400 text-red-200"
              : "bg-slate-900/80 border-slate-300/40 text-slate-100"
            }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${assignedRole === "anode" ? "bg-emerald-400" : "bg-slate-300"
              }`}
          />
          <span>
            {assignedRole === "anode"
              ? "Anode (Zn, -)"
              : assignedRole === "cathode"
                ? "Cathode (Zn) ❌"
                : "Zinc Rod (Zn)"}
          </span>
        </div>
      </Html>

      {/* Terminal Contact Clamp Top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Alligator Clip Jaw */}
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>
    </group>
  );
}

// ── 3D COPPER ELECTRODE ───────────────────────────────────────────────────────
function CopperElectrode3D({
  assignedRole,
  isRoleConfirmed,
  onAssign,
}: {
  assignedRole: "anode" | "cathode" | null;
  isRoleConfirmed: boolean;
  onAssign?: () => void;
}) {
  const targetPos = [2.4, 0.95, 0] as [number, number, number];
  const targetRot = [-0.1, -0.05, -0.25] as [number, number, number];

  return (
    <group
      position={targetPos}
      rotation={targetRot}
      onClick={(e) => {
        e.stopPropagation();
        if (onAssign) onAssign();
      }}
    >
      {/* Polished Reddish-Orange Copper Bar */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.32, 1.9, 0.08]} />
        <meshStandardMaterial
          color="#EA580C"
          metalness={0.92}
          roughness={0.18}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Floating Tag for Copper Electrode */}
      <Html position={[0.8, 1.35, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div
          className={`px-2.5 py-0.5 rounded-full border font-mono text-[9px] font-bold shadow-sm whitespace-nowrap flex items-center gap-1 cursor-pointer transition-all ${assignedRole === "cathode"
            ? isRoleConfirmed
              ? "bg-slate-900/90 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50"
              : "bg-slate-900/90 border-orange-400 text-orange-200"
            : assignedRole === "anode"
              ? "bg-red-950/90 border-red-400 text-red-200"
              : "bg-slate-900/80 border-orange-400/40 text-orange-200"
            }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${assignedRole === "cathode" ? "bg-orange-400" : "bg-orange-300"
              }`}
          />
          <span>
            {assignedRole === "cathode"
              ? "Cathode (Cu, +)"
              : assignedRole === "anode"
                ? "Anode (Cu) ❌"
                : "Copper Rod (Cu)"}
          </span>
        </div>
      </Html>

      {/* Terminal Contact Clamp Top */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 16]} />
        <meshStandardMaterial color="#B45309" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Red Alligator Clip Jaw */}
      <mesh position={[0, 1.02, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.1]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── 3D U-SHAPED SALT BRIDGE WITH MOVING IONS ─────────────────────────────────
function SaltBridge3D({
  assignedIonFlow,
  isIonFlowConfirmed,
  isActive,
}: {
  assignedIonFlow: "correct" | "reversed" | null;
  isIonFlowConfirmed: boolean;
  isActive: boolean;
}) {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1.8, 1.15, 0),
        new THREE.Vector3(-1.8, 2.1, 0),
        new THREE.Vector3(-1.4, 2.3, 0),
        new THREE.Vector3(0, 2.3, 0),
        new THREE.Vector3(1.4, 2.3, 0),
        new THREE.Vector3(1.8, 2.1, 0),
        new THREE.Vector3(1.8, 1.15, 0),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.13, 20, false), [curve]);

  // Moving ion particles inside the salt bridge
  const ionCount = 10;
  const cationRef = useMemo(() => new THREE.Object3D(), []);
  const anionRef = useMemo(() => new THREE.Object3D(), []);
  const cationInstRef = useRef<THREE.InstancedMesh>(null);
  const anionInstRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (!cationInstRef.current || !anionInstRef.current) return;
    const t = clock.getElapsedTime();
    const speed = isActive ? 0.35 : 0.15;

    for (let i = 0; i < ionCount; i++) {
      // If correct: K+ flows left-to-right toward Cu (0 to 1); Cl- flows right-to-left toward Zn (1 to 0)
      // If reversed: opposite
      const forward = assignedIonFlow === "correct";
      const progress = ((t * speed + i / ionCount) % 1);

      // K+ Cations
      const kProg = forward ? progress : 1 - progress;
      const kPos = curve.getPointAt(kProg);
      cationRef.position.copy(kPos);
      cationRef.scale.setScalar(0.06);
      cationRef.updateMatrix();
      cationInstRef.current.setMatrixAt(i, cationRef.matrix);

      // Cl- Anions
      const clProg = forward ? 1 - progress : progress;
      const clPos = curve.getPointAt(clProg);
      anionRef.position.copy(clPos);
      anionRef.scale.setScalar(0.06);
      anionRef.updateMatrix();
      anionInstRef.current.setMatrixAt(i, anionRef.matrix);
    }
    cationInstRef.current.instanceMatrix.needsUpdate = true;
    anionInstRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Glass U-Tube */}
      <mesh geometry={tubeGeo} renderOrder={2}>
        <meshPhysicalMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.05}
          transmission={0.9}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Internal Agar Gel Body */}
      <mesh geometry={tubeGeo} scale={[0.88, 0.88, 0.88]} renderOrder={1}>
        <meshStandardMaterial
          color={
            assignedIonFlow === "correct" && isIonFlowConfirmed
              ? "#A855F7"
              : assignedIonFlow === "reversed"
                ? "#EF4444"
                : "#CBD5E1"
          }
          roughness={0.35}
          metalness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Animated Ion Particles (K+ in Purple, Cl- in Amber) */}
      {assignedIonFlow && (
        <>
          <instancedMesh ref={cationInstRef} args={[undefined, undefined, ionCount]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#C084FC" emissive="#A855F7" emissiveIntensity={0.8} />
          </instancedMesh>
          <instancedMesh ref={anionInstRef} args={[undefined, undefined, ionCount]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.8} />
          </instancedMesh>
        </>
      )}

      {/* Floating Salt Bridge Tag */}
      <Html position={[0, 2.58, 0]} center distanceFactor={8.5} zIndexRange={[15, 0]}>
        <div
          className={`px-3 py-0.5 rounded-full border font-mono text-[9.5px] font-bold shadow-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${assignedIonFlow === "correct"
            ? "bg-purple-950/90 border-purple-400 text-purple-200"
            : assignedIonFlow === "reversed"
              ? "bg-red-950/90 border-red-400 text-red-200"
              : "bg-slate-950/80 border-slate-400 text-slate-200"
            }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>
            {assignedIonFlow === "correct"
              ? "KCl Salt Bridge (Cl⁻ → Zn | K⁺ → Cu)"
              : assignedIonFlow === "reversed"
                ? "Salt Bridge (Reversed Ion Flow) ❌"
                : "KCl Salt Bridge"}
          </span>
        </div>
      </Html>
    </group>
  );
}

// ── 3D VOLTMETER ──────────────────────────────────────────────────────────────
function Voltmeter3D({
  isActive,
  voltage,
}: {
  isActive: boolean;
  voltage: number;
}) {
  return (
    <group position={[0, 0.45, 1.4]}>
      {/* Yellow Instrument Housing Case */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.8, 0.45]} />
        <meshStandardMaterial color="#EAB308" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Top Digital Bezel Display Screen */}
      <mesh position={[0, 0.85, 0.23]}>
        <boxGeometry args={[1.2, 0.55, 0.04]} />
        <meshStandardMaterial color="#1E293B" roughness={0.4} />
      </mesh>

      {/* LCD Digital Backlight Glass */}
      <mesh position={[0, 0.85, 0.252]}>
        <planeGeometry args={[1.1, 0.45]} />
        <meshBasicMaterial color={isActive ? "#BEF264" : "#84CC16"} />
      </mesh>

      {/* High-Contrast Digital Readout */}
      <Html position={[0, 0.85, 0.27]} center distanceFactor={7.5} zIndexRange={[15, 0]}>
        <div className="font-mono font-black text-slate-950 text-base sm:text-lg tracking-widest pointer-events-none select-none drop-shadow-xs">
          {voltage.toFixed(2)}
          <span className="text-xs font-bold ml-1 text-slate-800">V</span>
        </div>
      </Html>

      {/* Rotary Selector Dial */}
      <mesh position={[0, 0.2, 0.24]} rotation={[Math.PI / 2, 0, 0.35]}>
        <cylinderGeometry args={[0.28, 0.3, 0.1, 24]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.2, 0.29]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.04, 0.26, 0.04]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>

      {/* Terminal Jacks: Black Common (-) & Red Voltage (+) */}
      <mesh position={[-0.32, -0.25, 0.2]}>
        <boxGeometry args={[0.16, 0.16, 0.12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} />
      </mesh>
      <mesh position={[0.32, -0.25, 0.2]}>
        <boxGeometry args={[0.16, 0.16, 0.12]} />
        <meshStandardMaterial color="#DC2626" roughness={0.3} />
      </mesh>
    </group>
  );
}

// ── 3D CONNECTING WIRES & ELECTRON FLOW ─────────────────────────────────────────
function ConnectingWires3D({
  assignedFlow,
  isFlowConfirmed,
  isActive,
}: {
  assignedFlow: "zn_to_cu" | "cu_to_zn" | null;
  isFlowConfirmed: boolean;
  isActive: boolean;
}) {
  const curveLeft = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.4, 1.85, 0),
        new THREE.Vector3(-2.1, 2.2, 0.3),
        new THREE.Vector3(-1.1, 1.5, 0.9),
        new THREE.Vector3(-0.32, 0.2, 1.6),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const curveRight = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.32, 0.2, 1.6),
        new THREE.Vector3(1.1, 1.5, 0.9),
        new THREE.Vector3(2.1, 2.2, 0.3),
        new THREE.Vector3(2.4, 1.85, 0),
      ],
      false,
      "catmullrom",
      0.3
    );
  }, []);

  const tubeGeoLeft = useMemo(() => new THREE.TubeGeometry(curveLeft, 32, 0.035, 12, false), [curveLeft]);
  const tubeGeoRight = useMemo(() => new THREE.TubeGeometry(curveRight, 32, 0.035, 12, false), [curveRight]);

  const electronCount = 14;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const electronInstRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (!electronInstRef.current || !assignedFlow) return;
    const time = clock.getElapsedTime();
    const speed = isActive ? 0.5 : 0.2;

    for (let i = 0; i < electronCount; i++) {
      let progress = ((time * speed + i / electronCount) % 1);
      if (assignedFlow === "cu_to_zn") {
        progress = 1 - progress;
      }

      let pos: THREE.Vector3;
      if (progress < 0.5) {
        const t = progress * 2;
        pos = curveLeft.getPointAt(t);
      } else {
        const t = (progress - 0.5) * 2;
        pos = curveRight.getPointAt(t);
      }

      dummy.position.copy(pos);
      dummy.scale.setScalar(0.065 + Math.sin(time * 8 + i) * 0.015);
      dummy.updateMatrix();
      electronInstRef.current.setMatrixAt(i, dummy.matrix);
    }
    electronInstRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Black Negative Wire (Anode to Meter) */}
      <mesh geometry={tubeGeoLeft}>
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Red Positive Wire (Cathode to Meter) */}
      <mesh geometry={tubeGeoRight}>
        <meshStandardMaterial color="#DC2626" roughness={0.3} metalness={0.1} />
      </mesh>



      {/* Electron Flow Particles */}
      {assignedFlow && (
        <instancedMesh ref={electronInstRef} args={[undefined, undefined, electronCount]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={assignedFlow === "zn_to_cu" ? "#38BDF8" : "#EF4444"}
            toneMapped={false}
          />
        </instancedMesh>
      )}
    </group>
  );
}

// ── 3D LIGHT BULB CIRCUIT LOAD ────────────────────────────────────────────────
function LightBulb3D({
  position,
  isActive,
}: {
  position: [number, number, number];
  isActive: boolean;
}) {
  return (
    <group position={position}>
      {/* Minimal Transparent Tag */}
      <Html position={[0, 0.55, 0]} center distanceFactor={9} zIndexRange={[15, 0]}>
        <div className="bg-slate-900/65 backdrop-blur-xs px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-200 font-mono text-[9px] font-bold shadow-xs pointer-events-none whitespace-nowrap flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-amber-400 animate-ping" : "bg-amber-400/50"}`} />
          <span>Bulb</span>
        </div>
      </Html>

      {/* Ceramic Screw Base */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.4, 20]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Glass Bulb Dome */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshPhysicalMaterial
          color={isActive ? "#FBBF24" : "#E2E8F0"}
          emissive={isActive ? "#B45309" : "#000000"}
          emissiveIntensity={isActive ? 1.6 : 0}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.1}
          transmission={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Internal Tungsten Filament Core */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={isActive ? "#FEF08A" : "#64748B"} />
      </mesh>

      {/* Radial Point Light Emission */}
      {isActive && (
        <pointLight
          position={[0, 0.15, 0]}
          color="#F59E0B"
          intensity={4.5}
          distance={6}
          decay={1.8}
        />
      )}
    </group>
  );
}

// ── MAIN COMPONENT: TOPIC 2 GAME PAGE ─────────────────────────────────────────
export default function ElectronIonFlowLevel1GamePage({
  difficulty = "level1",
  onExit,
}: {
  difficulty?: string;
  onExit?: () => void;
}) {
  // Screen flow: 'mission' -> 'instructions' -> 'game'
  const [introStep, setIntroStep] = useState<"mission" | "instructions">("mission");
  const [gameStarted, setGameStarted] = useState(false);

  // Stage 1: Electrode Role Identification
  const [znRole, setZnRole] = useState<"anode" | "cathode" | null>(null);
  const [cuRole, setCuRole] = useState<"anode" | "cathode" | null>(null);
  const [selectedElectrode, setSelectedElectrode] = useState<"zn" | "cu" | null>(null);
  const [rolesConfirmed, setRolesConfirmed] = useState(false);

  // Stage 2: External Electron Flow Direction
  const [electronFlow, setElectronFlow] = useState<"zn_to_cu" | "cu_to_zn" | null>(null);
  const [electronFlowConfirmed, setElectronFlowConfirmed] = useState(false);

  // Stage 3: Salt Bridge Ion Pathways
  const [saltBridgeFlow, setSaltBridgeFlow] = useState<"correct" | "reversed" | null>(null);
  const [saltBridgeFlowConfirmed, setSaltBridgeFlowConfirmed] = useState(false);

  // Stage 4: Circuit Activation & Target Achievement
  const [cellActivated, setCellActivated] = useState(false);
  const [meterVoltage, setMeterVoltage] = useState(0.0);

  // UI Feedback & Modals
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  // Handle assigning roles
  const handleAssignElectrodeRole = (electrode: "zn" | "cu", role: "anode" | "cathode") => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (electrode === "zn") {
      if (role === "anode") {
        setZnRole("anode");
        playAudioTone("unlock");
        if (cuRole === "cathode") {
          setRolesConfirmed(true);
          playAudioTone("correct");
          setFeedbackSuccess("Perfect! Zinc oxidizes as Anode (AN OX) and Copper reduces as Cathode (RED CAT).");
          setTimeout(() => setFeedbackSuccess(null), 2000);
        } else {
          setFeedbackSuccess("Zinc is correctly assigned as Anode (Oxidation). Now assign Copper!");
          setTimeout(() => setFeedbackSuccess(null), 2000);
        }
      } else {
        setZnRole("cathode");
        playAudioTone("wrong");
        setFeedbackError("Incorrect! Zinc undergoes oxidation (loses electrons), so it must be the Anode (AN OX)!");
      }
    } else {
      if (role === "cathode") {
        setCuRole("cathode");
        playAudioTone("unlock");
        if (znRole === "anode") {
          setRolesConfirmed(true);
          playAudioTone("correct");
          setFeedbackSuccess("Perfect! Zinc is Anode (AN OX) and Copper is Cathode (RED CAT).");
          setTimeout(() => setFeedbackSuccess(null), 2000);
        } else {
          setFeedbackSuccess("Copper is correctly assigned as Cathode (Reduction). Now assign Zinc!");
          setTimeout(() => setFeedbackSuccess(null), 2000);
        }
      } else {
        setCuRole("anode");
        playAudioTone("wrong");
        setFeedbackError("Incorrect! Copper ions undergo reduction (gain electrons), so it must be the Cathode (RED CAT)!");
      }
    }
  };

  // Handle Electron Flow Selection
  const handleSelectElectronFlow = (dir: "zn_to_cu" | "cu_to_zn") => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (dir === "zn_to_cu") {
      setElectronFlow("zn_to_cu");
      setElectronFlowConfirmed(true);
      playAudioTone("correct");
      setFeedbackSuccess("Correct! Electrons flow through the wire from Anode (Zn) to Cathode (Cu).");
      setTimeout(() => setFeedbackSuccess(null), 2000);
    } else {
      setElectronFlow("cu_to_zn");
      setElectronFlowConfirmed(false);
      playAudioTone("wrong");
      setFeedbackError("Incorrect! Oxidation releases electrons at the Zinc anode, pushing them toward Copper!");
    }
  };

  // Handle Salt Bridge Ion Direction Selection
  const handleSelectSaltBridgeFlow = (flow: "correct" | "reversed") => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (flow === "correct") {
      setSaltBridgeFlow("correct");
      setSaltBridgeFlowConfirmed(true);
      playAudioTone("correct");
      setFeedbackSuccess("Correct! Cl⁻ anions balance Zn²⁺ accumulation at Anode; K⁺ cations balance SO₄²⁻ at Cathode!");
      setTimeout(() => setFeedbackSuccess(null), 2000);
    } else {
      setSaltBridgeFlow("reversed");
      setSaltBridgeFlowConfirmed(false);
      playAudioTone("wrong");
      setFeedbackError("Incorrect! Anions (Cl⁻) must flow to Anode; Cations (K⁺) must flow to Cathode!");
    }
  };

  // Handle Activation
  const handleActivateSimulation = () => {
    if (!rolesConfirmed || !electronFlowConfirmed || !saltBridgeFlowConfirmed) {
      playAudioTone("wrong");
      return;
    }

    setCellActivated(true);
    playAudioTone("hum");

    let currentV = 0.0;
    const interval = setInterval(() => {
      currentV += 0.11;
      if (currentV >= 1.1) {
        setMeterVoltage(1.1);
        clearInterval(interval);
        playAudioTone("correct");
      } else {
        setMeterVoltage(Number(currentV.toFixed(2)));
      }
    }, 40);
  };

  // Reset challenge
  const handleResetChallenge = () => {
    setZnRole(null);
    setCuRole(null);
    setSelectedElectrode(null);
    setRolesConfirmed(false);
    setElectronFlow(null);
    setElectronFlowConfirmed(false);
    setSaltBridgeFlow(null);
    setSaltBridgeFlowConfirmed(false);
    setCellActivated(false);
    setMeterVoltage(0.0);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setShowSuccessModal(false);
    playAudioTone("click");
  };

  const allTargetsAchieved = rolesConfirmed && electronFlowConfirmed && saltBridgeFlowConfirmed;

  return (
    <div className="w-full h-full h-screen h-[100dvh] bg-white text-[#1E293B] relative overflow-hidden select-none font-sans rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col">
      {/* ── SCREEN 1: MISSION SCREEN ───────────────────────────────────────── */}
      {!gameStarted && introStep === "mission" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-5 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button Only */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          {/* Mission Center: Title & Next Button */}
          <div className="max-w-3xl mx-auto my-auto text-center space-y-4 sm:space-y-6 z-10 px-4 py-2 animate-in fade-in duration-200">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1E293B] tracking-tight leading-tight">
              <span className="text-[#2563EB]">MISSION:</span>  Establish the correct electron and ion movement in a functioning galvanic cell to achieve continuous electrical power.
            </h1>





            <div>
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

      {/* ── SCREEN 2: INSTRUCTIONS SCREEN (Matching 3-Card Landscape Layout) ── */}
      {!gameStarted && introStep === "instructions" && (
        <div className="absolute inset-0 z-40 flex flex-col justify-between p-2.5 sm:p-4 bg-white/98 backdrop-blur-md overflow-y-auto">
          {/* Top Bar: Exit Button */}
          <div className="w-full flex items-center justify-between z-10 shrink-0">
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto my-auto flex flex-col justify-between z-10 px-2 sm:px-3 py-0.5 w-full animate-in fade-in duration-200 flex-1">
            <div className="text-center pt-0.5 pb-1 sm:pb-2">
              <h2 className="text-[#1E293B] text-xs sm:text-sm md:text-base font-black tracking-wide uppercase">
                INSTRUCTIONS TO PLAY
              </h2>
            </div>

            {/* 3 Instructions Side-by-Side in Landscape Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 landscape:grid-cols-3 gap-2 sm:gap-3 w-full mx-auto my-auto items-stretch">
              
              {/* Card 1: Select & Assign Electrodes */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      1
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Assign Electrodes
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Step 1 • Roles
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Click an electrode (Zn or Cu) on the dock, then select whether it acts as the <strong>Anode (-)</strong> or <strong>Cathode (+)</strong>.
                  </p>
                </div>

                {/* UI Preview Box: Matching User's shared screenshot 1 */}
                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 scale-90 sm:scale-95">
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500 text-white flex items-center gap-1 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>Zn Rod</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span>Cu Rod</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-bold text-sky-300 scale-90 sm:scale-95">
                    <span className="text-slate-400">ASSIGN:</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-600">Anode (-)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600/90 text-white">Cathode (+)</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Select Electron Flow Direction */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      2
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Choose e⁻ Flow
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Step 2 • External Wire
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Determine which direction electrons travel through the external circuit and select the correct pathway.
                  </p>
                </div>

                {/* UI Preview Box: Matching User's shared screenshot 2 */}
                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5 space-y-1.5">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    SELECT DIRECTION
                  </div>
                  <div className="flex items-center gap-2 scale-90 sm:scale-95">
                    <div className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 shadow-xs">
                      <span>Zn → Cu</span>
                      <span className="text-cyan-400">→</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                      <span>Cu → Zn</span>
                      <span className="text-amber-400">←</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Direct Salt Bridge Ions */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md border border-slate-200 flex flex-col justify-between transition-all hover:shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#0284C7] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      3
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-tight">
                      Balance Bridge Ions
                    </h3>
                  </div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[9px] sm:text-[10px] tracking-wide">
                      Step 3 • Internal Ions
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium text-[10px] sm:text-[11px] leading-tight mt-0.5 sm:mt-1">
                    Choose the proper movement of anions and cations through the salt bridge to maintain neutral solutions.
                  </p>
                </div>

                {/* UI Preview Box: Matching User's shared screenshot 3 */}
                <div className="w-full h-18 sm:h-22 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col items-center justify-center p-2 mt-1 sm:mt-1.5 space-y-1.5">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    SELECT ION MIGRATION
                  </div>
                  <div className="flex items-center gap-1.5 scale-90 sm:scale-95">
                    <div className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-800 text-slate-200 border border-slate-700 text-center leading-tight">
                      Cl⁻ → Zn | K⁺ → Cu
                    </div>
                    <div className="px-2 py-0.5 rounded-full text-[8.5px] font-bold bg-slate-800 text-slate-200 border border-slate-700 text-center leading-tight">
                      K⁺ → Zn | Cl⁻ → Cu
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Action Buttons: Equal-sized BACK and PLAY Buttons */}
            <div className="pt-2 sm:pt-2.5 pb-0.5 flex items-center justify-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIntroStep("mission")}
                className="w-28 sm:w-32 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1"
              >
                <span>BACK</span>
              </button>
              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="w-28 sm:w-32 py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-lg shadow-sky-600/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 text-center flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: 3D SIMULATION PLAYGROUND ───────────────────────────────── */}
      {gameStarted && (
        <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden">
          {/* Full Screen 3D Interactive WebGL Scene */}
          <div className="absolute inset-0 w-full h-full">
            <Canvas
              camera={{ position: [0, 3.8, 8.2], fov: 38 }}
              gl={{ antialias: true, alpha: false }}
              className="w-full h-full touch-none"
            >
              <color attach="background" args={["#F8FAFC"]} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[6, 9, 6]} intensity={1.4} castShadow />
              <directionalLight position={[-6, -4, -4]} intensity={0.5} />

              {/* 3D Lab Bench Surface */}
              <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[22, 12]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.05} />
              </mesh>

              {/* Lab Bench Grid Lines */}
              <gridHelper args={[20, 40, "#E2E8F0", "#F1F5F9"]} position={[0, -0.04, 0]} />

              {/* Left Beaker: Zinc Sulphate ZnSO4(aq) */}
              <Beaker3D
                position={[-2.2, 0, 0]}
                liquidColor="#475569"
                liquidOpacity={0.82}
                solutionFormula="ZnSO₄(aq)"
                isSelected={selectedElectrode === "zn"}
                onClick={() => setSelectedElectrode("zn")}
              />

              {/* Floating ions in Left Beaker */}
              <SolutionIons3D type="zn" beakerPos={[-2.2, 0, 0]} isActive={cellActivated} />

              {/* Right Beaker: Copper Sulphate CuSO4(aq) */}
              <Beaker3D
                position={[2.2, 0, 0]}
                liquidColor="#0284C7"
                liquidOpacity={0.82}
                solutionFormula="CuSO₄(aq)"
                isSelected={selectedElectrode === "cu"}
                onClick={() => setSelectedElectrode("cu")}
              />

              {/* Floating ions in Right Beaker */}
              <SolutionIons3D type="cu" beakerPos={[2.2, 0, 0]} isActive={cellActivated} />

              {/* Zinc Electrode */}
              <ZincElectrode3D
                assignedRole={znRole}
                isRoleConfirmed={rolesConfirmed}
                onAssign={() => setSelectedElectrode("zn")}
              />

              {/* Copper Electrode */}
              <CopperElectrode3D
                assignedRole={cuRole}
                isRoleConfirmed={rolesConfirmed}
                onAssign={() => setSelectedElectrode("cu")}
              />

              {/* Salt Bridge with Ion Paths */}
              <SaltBridge3D
                assignedIonFlow={saltBridgeFlow}
                isIonFlowConfirmed={saltBridgeFlowConfirmed}
                isActive={cellActivated}
              />

              {/* Voltmeter */}
              <Voltmeter3D isActive={cellActivated} voltage={meterVoltage} />

              {/* External Connecting Wires & Animated Electrons */}
              <ConnectingWires3D
                assignedFlow={electronFlow}
                isFlowConfirmed={electronFlowConfirmed}
                isActive={cellActivated}
              />

              {/* Light Bulb Circuit Load */}
              <LightBulb3D position={[4.6, 0.45, 0.3]} isActive={cellActivated} />

              {/* Orbit Controls */}
              <OrbitControls
                enablePan={false}
                minDistance={5.5}
                maxDistance={12}
                maxPolarAngle={Math.PI / 2.05}
                minPolarAngle={Math.PI / 4.5}
              />
            </Canvas>
          </div>

          {/* ── TOP BAR OVERLAY: EXIT BUTTON (LEFT) & EXPLANATION (RIGHT) ─── */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
            {/* Left Exit Button */}
            <button
              type="button"
              onClick={() => (onExit ? onExit() : exitSimulation())}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-800/90 hover:bg-slate-700 text-white shadow-md transition-all cursor-pointer pointer-events-auto active:scale-95 backdrop-blur-md"
              title="Exit Simulation"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>EXIT</span>
            </button>

            {/* Right Explanation Button */}
            <button
              type="button"
              onClick={() => setShowExplanationModal(true)}
              className="flex items-center gap-1.5 h-7 sm:h-8 px-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer pointer-events-auto active:scale-95"
              title="Learn Theory & Formulas"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-200 shrink-0" />
              <span>EXPLANATION</span>
            </button>
          </div>

          {/* ── BOTTOM DOCK: INTERACTIVE 4-STAGE BAR ───────────────────────── */}
          <div className="absolute bottom-2.5 sm:bottom-3 inset-x-2 sm:inset-x-6 z-20 flex flex-col items-center pointer-events-none gap-2">
            {/* Feedback Message (Error or Success) */}
            {feedbackError && (
              <div className="bg-red-600/95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg border border-red-400 flex items-center gap-2 pointer-events-auto animate-bounce">
                <span>⚠️</span>
                <span>{feedbackError}</span>
              </div>
            )}
            {feedbackSuccess && (
              <div className="bg-emerald-600/95 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200">
                <span>✅</span>
                <span>{feedbackSuccess}</span>
              </div>
            )}

            <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full px-2.5 sm:px-4 py-1.5 shadow-xl border border-slate-200/90 flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pointer-events-auto">
              
              {/* STEP 1: ONLY SHOWN DURING STEP 1 */}
              {!rolesConfirmed && (
                <>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                    Step 1 (Electrodes):
                  </span>

                  {/* Zinc Rod Selector */}
                  <button
                    type="button"
                    onClick={() => setSelectedElectrode("zn")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedElectrode === "zn"
                        ? "bg-sky-600 text-white ring-2 ring-sky-400 shadow-md scale-105"
                        : znRole === "anode"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${znRole === "anode" ? "bg-emerald-600" : "bg-slate-400"}`} />
                    <span>Zn Rod</span>
                  </button>

                  {/* Copper Rod Selector */}
                  <button
                    type="button"
                    onClick={() => setSelectedElectrode("cu")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedElectrode === "cu"
                        ? "bg-sky-600 text-white ring-2 ring-sky-400 shadow-md scale-105"
                        : cuRole === "cathode"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cuRole === "cathode" ? "bg-emerald-600" : "bg-orange-500"}`} />
                    <span>Cu Rod</span>
                  </button>

                  {/* Role Assignment Buttons */}
                  {selectedElectrode && (
                    <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-300 animate-in fade-in">
                      <span className="text-[10px] font-bold text-sky-700 uppercase">
                        Assign {selectedElectrode === "zn" ? "Zn" : "Cu"}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAssignElectrodeRole(selectedElectrode, "anode")}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white shadow-xs cursor-pointer active:scale-95"
                      >
                        Anode (-)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignElectrodeRole(selectedElectrode, "cathode")}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs cursor-pointer active:scale-95"
                      >
                        Cathode (+)
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: ONLY SHOWN DURING STEP 2 (NO STEP 1 TAB, NO ACTIVATE BUTTON) */}
              {rolesConfirmed && !electronFlowConfirmed && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Step 2 (e⁻ Flow):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectElectronFlow("zn_to_cu")}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Zn → Cu</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectElectronFlow("cu_to_zn")}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>Cu → Zn</span>
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* STEP 3: ONLY SHOWN DURING STEP 3 (NO PREVIOUS GREEN TABS) */}
              {electronFlowConfirmed && (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    Step 3 (Salt Bridge):
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectSaltBridgeFlow("correct")}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                      saltBridgeFlow === "correct"
                        ? "bg-purple-700 text-white border-purple-800 shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-xs"
                    }`}
                  >
                    Cl⁻ → Zn | K⁺ → Cu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSaltBridgeFlow("reversed")}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                      saltBridgeFlow === "reversed"
                        ? "bg-red-700 text-white border-red-800 shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-xs"
                    }`}
                  >
                    K⁺ → Zn | Cl⁻ → Cu
                  </button>
                </div>
              )}

              {/* ACTIVATE BUTTON: ONLY SHOWN AT THE LAST STEP WHEN SALT BRIDGE IS CONFIRMED */}
              {saltBridgeFlowConfirmed && !cellActivated && (
                <button
                  type="button"
                  onClick={handleActivateSimulation}
                  className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md animate-pulse cursor-pointer whitespace-nowrap ml-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>ACTIVATE</span>
                </button>
              )}

              {/* FINISH BUTTON: ONLY SHOWN AFTER CELL ACTIVATION */}
              {cellActivated && (
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(true)}
                  className="flex items-center gap-1.5 px-5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/40 animate-bounce cursor-pointer whitespace-nowrap transition-all transform hover:scale-105 active:scale-95 ml-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>FINISH</span>
                </button>
              )}

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetChallenge}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer ml-1"
                title="Reset Challenge"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL POPUP (Replay & Explanation) ────────────────────────── */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/90 max-w-md w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            {/* Top Celebration Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            {/* Title & Celebration Feedback */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                MISSION COMPLETE!
              </h2>
              <p className="text-emerald-700 font-bold text-xs sm:text-sm">
                &ldquo;Perfect! You established the correct electron and ion flow.&rdquo;
              </p>
            </div>

            {/* Target Breakdown Summary Box */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                <span>Voltage Generated:</span>
                <span className="text-emerald-600 font-mono text-sm">1.10 V</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Anode:</span>
                <span className="font-semibold text-slate-800">Zinc (Oxidation, -)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cathode:</span>
                <span className="font-semibold text-slate-800">Copper (Reduction, +)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>External Wire:</span>
                <span className="font-semibold text-sky-700">e⁻ flows Zn → Cu</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Salt Bridge:</span>
                <span className="font-semibold text-purple-700">Cl⁻ → Zn²⁺ | K⁺ → Cu²⁺</span>
              </div>
            </div>

            {/* 2 Buttons: Replay & Explanation */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleResetChallenge();
                  setShowSuccessModal(false);
                }}
                className="flex-1 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowExplanationModal(true);
                }}
                className="flex-1 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explanation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EXPLANATION MODAL (Clean 2-Box Format) ─────────────────────────── */}
      {showExplanationModal && (
        <div className="absolute inset-0 z-50 flex flex-col justify-between bg-white/98 backdrop-blur-md animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 bg-white/90">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Anode, Cathode &amp; Electron/Ion Flow Guide
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Topic 02: Electrochemistry • Directional Flow &amp; Charge Balance
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            
            {/* BOX 1: Core Scientific Concept (Highlight Card) */}
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/90 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white flex items-center justify-center text-xs font-black shadow-xs">
                  1
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-sky-950">
                  The Core Scientific Concept
                </h3>
              </div>
              <p className="text-slate-700">
                A battery produces electricity by sending electrons through an external wire. But for electrons to keep moving continuously, negative and positive charges inside the liquids must also stay balanced.
              </p>
              <p className="text-sky-950 font-semibold bg-white/90 p-3 rounded-xl border border-sky-100">
                💡 <strong>What this game teaches:</strong> Electricity is a two-way street! Electrons flow through the wire from Zinc to Copper, while ions migrate through the salt bridge to keep both solutions neutral so the current never stops.
              </p>
            </div>

            {/* NORMAL READING TEXT: Step-by-Step Learning */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  2
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  What Students Do &amp; Learn Step-by-Step
                </h3>
              </div>

              {/* Step 1 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 1: Assign Electrode Roles <span className="font-semibold text-slate-500">— AN OX &amp; RED CAT Rule</span>
                </div>
                <div className="font-mono font-bold text-slate-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-slate-400">
                  Anode (Zn): Zn(s) → Zn²⁺(aq) + 2e⁻ (Oxidation)<br />
                  Cathode (Cu): Cu²⁺(aq) + 2e⁻ → Cu(s) (Reduction)
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  • <strong>Zinc acts as Anode (-):</strong> Zinc metal atoms dissolve into the water as Zn²⁺ ions, releasing electrons into the metal strip.<br />
                  • <strong>Copper acts as Cathode (+):</strong> Dissolved Cu²⁺ ions in solution pull electrons from the strip and stick onto it as solid copper metal.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 2: Choose Electron Flow Direction <span className="font-semibold text-slate-500">— External Circuit</span>
                </div>
                <div className="font-mono font-bold text-sky-900 text-[11.5px] sm:text-xs pl-2 border-l-2 border-sky-500">
                  Electrons (e⁻) flow from Zinc → Copper through the external wire
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  • Electrons are negative particles created at the zinc strip. They get pushed through the wire and voltmeter toward the copper strip where they are consumed.<br />
                  • <em>Exam Rule:</em> Electrons flow from <strong>Anode to Cathode</strong> in the wire. Conventional current is defined in the opposite direction (<strong>Cathode to Anode</strong>).
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 3: Direct Salt Bridge Ions <span className="font-semibold text-slate-500">— Internal Charge Balance</span>
                </div>
                <div className="font-mono font-bold text-purple-900 text-[11.5px] sm:text-xs pl-2 border-l-2 border-purple-500">
                  Anions (Cl⁻) → Zn beaker | Cations (K⁺) → Cu beaker
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  • In the left beaker, extra positive Zn²⁺ ions accumulate. Negatively charged <strong>Cl⁻ anions</strong> travel in to cancel out this positive buildup.<br />
                  • In the right beaker, positive Cu²⁺ ions leave the solution, creating extra negative charge. Positively charged <strong>K⁺ cations</strong> travel in to balance it.<br />
                  • <em>Rule of Thumb:</em> <strong>Anions to Anode (A to A)</strong> and <strong>Cations to Cathode (C to C)</strong>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="space-y-1 pl-1">
                <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Step 4: Activate Simulation <span className="font-semibold text-slate-500">— Voltage &amp; Useful Power</span>
                </div>
                <div className="font-mono font-bold text-emerald-800 text-[11.5px] sm:text-xs pl-2 border-l-2 border-emerald-500">
                  E°cell = E°cathode - E°anode = (+0.34 V) - (-0.76 V) = +1.10 V
                </div>
                <p className="text-slate-600 text-[11.5px] sm:text-xs">
                  Once both the wire and the salt bridge are working together, the chemical reaction generates exactly <strong>1.10 V</strong>, continuously lighting up the lab bulb!
                </p>
              </div>
            </div>

            {/* BOX 2: Key Takeaways for Students (Summary Card) */}
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  3
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                  Key Takeaways for Students
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  <strong>• Electricity is a Two-Way Street:</strong> You cannot have electrical flow by wire alone; ions must move through the salt bridge to keep solutions neutral, or current stops immediately.
                </p>
                <p>
                  <strong>• Easy Memory Mnemonics:</strong><br />
                  &nbsp;&nbsp;• <strong>AN OX:</strong> <strong>An</strong>ode is <strong>Ox</strong>idation (Zn loses electrons).<br />
                  &nbsp;&nbsp;• <strong>RED CAT:</strong> <strong>Red</strong>uction is <strong>Cat</strong>hode (Cu²⁺ gains electrons).<br />
                  &nbsp;&nbsp;• <strong>A to A &amp; C to C:</strong> <strong>A</strong>nions go to <strong>A</strong>node, <strong>C</strong>ations go to <strong>C</strong>athode.
                </p>
                <p>
                  <strong>• IUPAC Cell Notation:</strong>{" "}
                  <code className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Zn(s) | ZnSO₄(aq) || CuSO₄(aq) | Cu(s)
                  </code>{" "}
                  (Anode on Left, Cathode on Right, Double vertical bar || represents the Salt Bridge).
                </p>
              </div>
            </div>

          </div>
          {/* Sticky Blue Resume Button */}
          <div className="p-2 border-t border-slate-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setShowExplanationModal(false)}
              className="w-full py-2 rounded-full font-extrabold text-xs uppercase tracking-wider bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer text-center block"
            >
              RESUME CHALLENGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
