"use client";

import React, { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useAldolCannizzaroStore } from "./AldolCannizzaroStore";

// ============================================================================
// Helper: Quaternion-Aligned Bond Cylinder (Aligned from +Y axis)
// ============================================================================
function SimpleBond({
  from,
  to,
  radius = 0.05,
  color = "#cbd5e1",
  opacity = 1,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius?: number;
  color?: string;
  opacity?: number;
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

  if (length < 0.001 || opacity <= 0.02) return null;

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.15}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

// ============================================================================
// Helper: Double Bond with Smooth π-Bond Opacity
// ============================================================================
function DoubleBond({
  from,
  to,
  piOpacity = 1,
  piColor = "#38bdf8",
  radius = 0.042,
}: {
  from: [number, number, number];
  to: [number, number, number];
  piOpacity?: number;
  piColor?: string;
  radius?: number;
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

  if (length < 0.001) return null;

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[-0.04 * piOpacity, 0, 0]}>
        <cylinderGeometry args={[radius, radius, length, 14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.15} />
      </mesh>
      {piOpacity > 0.02 && (
        <mesh position={[0.06, 0, 0]}>
          <cylinderGeometry args={[radius * 0.85, radius * 0.85, length, 14]} />
          <meshStandardMaterial
            color={piColor}
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

function AtomSphere({
  position,
  radius,
  color,
  emissive,
  emissiveIntensity = 0,
  label,
  labelColor = "#ffffff",
  isModalOpen = false,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  label?: string;
  labelColor?: string;
  isModalOpen?: boolean;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.12}
        emissive={emissive || "#000000"}
        emissiveIntensity={emissiveIntensity}
      />
      {label && !isModalOpen && (
        <Html center className="pointer-events-none select-none">
          <span
            className={`font-mono font-black leading-none select-none ${
              radius < 0.2 ? "text-[8.5px]" : "text-[10.5px]"
            }`}
            style={{
              color: labelColor,
              textShadow:
                labelColor === "#ffffff"
                  ? "0 1px 2px rgba(0,0,0,0.45)"
                  : "0 1px 1px rgba(255,255,255,0.6)",
            }}
          >
            {label}
          </span>
        </Html>
      )}
    </mesh>
  );
}

// ============================================================================
// STAGE 1: α-Hydrogen Gatekeeper (Acetaldehyde vs. Benzaldehyde)
// ============================================================================
function Stage1Scene({ isModalOpen }: { isModalOpen: boolean }) {
  const molecule = useAldolCannizzaroStore((s) => s.stage1Molecule);
  const progress = useAldolCannizzaroStore((s) => s.stage1Progress);

  if (molecule === "acetaldehyde") {
    // Acetaldehyde: C=O at [0.6, 0, 0], α-Carbon at [-0.65, -0.62, 0]
    const cCarb: [number, number, number] = [0.65, 0.05, 0];
    const oPos: [number, number, number] = [0.65, 1.32, 0];
    const hCarb: [number, number, number] = [1.65, -0.52, 0];
    const cAlpha: [number, number, number] = [-0.65, -0.55, 0];

    // 3 α-hydrogens around α-carbon (top α-H gets plucked by OH⁻)
    const alphaH1: [number, number, number] = [
      -0.85 - 1.35 * progress,
      0.28 + 0.65 * progress,
      0.32,
    ];
    const alphaH2: [number, number, number] = [-1.45, -1.05, 0.55 * (1 - progress * 0.4)];
    const alphaH3: [number, number, number] = [-1.35, -1.05, -0.6 * (1 - progress * 0.4)];

    // Incoming OH⁻ ion moving toward alphaH1
    const ohPos: [number, number, number] = [
      -2.65 + 0.32 * progress,
      0.95,
      0.32,
    ];

    return (
      <group>
        {/* Carbonyl C=O & C-H */}
        <DoubleBond from={cCarb} to={oPos} piOpacity={Math.max(0.2, 1 - 0.65 * progress)} />
        <SimpleBond from={cCarb} to={hCarb} />
        <DoubleBond from={cCarb} to={cAlpha} piOpacity={progress * 0.85} piColor="#10b981" />

        <AtomSphere position={cCarb} radius={0.27} color="#334155" label="C" isModalOpen={isModalOpen} />
        <AtomSphere position={oPos} radius={0.30} color="#ef4444" label="O" isModalOpen={isModalOpen} />
        <AtomSphere position={hCarb} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />

        {/* α-Carbon */}
        <AtomSphere
          position={cAlpha}
          radius={0.27}
          color="#334155"
          emissive="#0284c7"
          emissiveIntensity={0.25 + 0.35 * progress}
          label="C"
          isModalOpen={isModalOpen}
        />

        {/* α-Hydrogens */}
        <SimpleBond from={cAlpha} to={alphaH1} opacity={Math.max(0, 1 - progress * 1.4)} color="#38bdf8" />
        <SimpleBond from={cAlpha} to={alphaH2} />
        <SimpleBond from={cAlpha} to={alphaH3} />

        <AtomSphere position={alphaH1} radius={0.18} color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} label="H" isModalOpen={isModalOpen} />
        <AtomSphere position={alphaH2} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
        <AtomSphere position={alphaH3} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />

        {/* Base OH⁻ Ion */}
        <group position={ohPos}>
          <SimpleBond from={[0, 0, 0]} to={[-0.42, 0.25, 0]} radius={0.04} color="#cbd5e1" />
          <AtomSphere position={[0, 0, 0]} radius={0.26} color="#ef4444" label="O" isModalOpen={isModalOpen} />
          <AtomSphere position={[-0.42, 0.25, 0]} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
          {!isModalOpen && (
            <Html position={[0, -0.45, 0]} center className="pointer-events-none select-none">
              <div className="bg-red-50/95 border border-red-300 text-red-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                {progress > 0.7 ? "H₂O" : "OH⁻"}
              </div>
            </Html>
          )}
        </group>

        {!isModalOpen && (
          <>
            <Html position={[oPos[0], oPos[1] + 0.45, 0]} center className="pointer-events-none select-none">
              <div className="bg-red-50/95 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                {progress > 0.7 ? "O⁻ (Enolate)" : "C=O"}
              </div>
            </Html>
            <Html position={[cAlpha[0], cAlpha[1] - 0.55, 0]} center className="pointer-events-none select-none">
              <div className="bg-sky-50/95 border border-sky-300 text-sky-800 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                α-C (3 α-H)
              </div>
            </Html>
          </>
        )}
      </group>
    );
  }

  // Benzaldehyde: Planar hexagonal benzene ring + -CHO group (0 α-H!)
  const ringRadius = 1.1;
  const ringCenterX = -1.35;
  const ringCenterY = -0.15;
  const ringCarbons: [number, number, number][] = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3; // vertex 0 at right (+X): ipso carbon
    return [ringCenterX + ringRadius * Math.cos(a), ringCenterY + ringRadius * Math.sin(a), 0];
  });
  const ipsoC = ringCarbons[0];
  const cCarb: [number, number, number] = [0.95, 0.05, 0];
  const oPos: [number, number, number] = [1.45, 1.15 - 0.15 * progress, -0.35 * progress];
  const hCarb: [number, number, number] = [1.85, -0.65, -0.35 * progress];

  // OH⁻ approaching carbonyl carbon directly along +Z
  const ohPos: [number, number, number] = [
    0.95,
    0.05,
    2.4 - 1.3 * progress,
  ];

  return (
    <group>
      {/* Benzene Ring C–C Bonds */}
      {ringCarbons.map((c, idx) => {
        const next = ringCarbons[(idx + 1) % 6];
        return idx % 2 === 0 ? (
          <DoubleBond key={`ring-b-${idx}`} from={c} to={next} piOpacity={0.7} piColor="#94a3b8" radius={0.038} />
        ) : (
          <SimpleBond key={`ring-b-${idx}`} from={c} to={next} radius={0.048} />
        );
      })}

      {/* Benzene Carbons & 5 Ring Hydrogens (NO H on ipsoC idx=0) */}
      {ringCarbons.map((c, idx) => {
        const angle = (idx * Math.PI) / 3;
        const hPos: [number, number, number] = [
          c[0] + 0.72 * Math.cos(angle),
          c[1] + 0.72 * Math.sin(angle),
          0,
        ];
        return (
          <group key={`ring-c-${idx}`}>
            <AtomSphere
              position={c}
              radius={0.23}
              color="#334155"
              emissive={idx === 0 ? "#f59e0b" : undefined}
              emissiveIntensity={idx === 0 ? 0.35 : 0}
              label="C"
              isModalOpen={isModalOpen}
            />
            {idx !== 0 && (
              <>
                <SimpleBond from={c} to={hPos} radius={0.038} />
                <AtomSphere position={hPos} radius={0.14} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
              </>
            )}
          </group>
        );
      })}

      {/* Ipso C to Carbonyl C bond */}
      <SimpleBond from={ipsoC} to={cCarb} />
      <DoubleBond from={cCarb} to={oPos} piOpacity={Math.max(0, 1 - progress * 1.1)} />
      <SimpleBond from={cCarb} to={hCarb} />

      <AtomSphere position={cCarb} radius={0.27} color="#334155" label="C" isModalOpen={isModalOpen} />
      <AtomSphere position={oPos} radius={0.30} color="#ef4444" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={hCarb} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />

      {/* Direct OH⁻ Nucleophilic Attack on C=O */}
      <SimpleBond from={cCarb} to={ohPos} opacity={progress > 0.75 ? (progress - 0.75) * 4 : 0} color="#10b981" />
      <group position={ohPos}>
        <SimpleBond from={[0, 0, 0]} to={[0, 0.38, 0.25]} radius={0.04} color="#cbd5e1" />
        <AtomSphere position={[0, 0, 0]} radius={0.26} color="#ef4444" label="O" isModalOpen={isModalOpen} />
        <AtomSphere position={[0, 0.38, 0.25]} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
        {!isModalOpen && (
          <Html position={[0, -0.42, 0]} center className="pointer-events-none select-none">
            <div className="bg-red-50/95 border border-red-300 text-red-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              OH⁻
            </div>
          </Html>
        )}
      </group>

      {!isModalOpen && (
        <>
          <Html position={[ipsoC[0], ipsoC[1] - 0.52, 0]} center className="pointer-events-none select-none">
            <div className="bg-amber-50/95 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              α-C (0 α-H!)
            </div>
          </Html>
          <Html position={[oPos[0], oPos[1] + 0.42, oPos[2]]} center className="pointer-events-none select-none">
            <div className="bg-red-50/95 border border-red-200 text-red-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              {progress > 0.75 ? "O⁻" : "C=O"}
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// ============================================================================
// Helper: Dotted Line Indicator Between Two Reactive Centers
// ============================================================================
function DottedLine({
  from,
  to,
  color = "#94a3b8",
  dotCount = 9,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  dotCount?: number;
}) {
  const dots = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 1; i < dotCount; i++) {
      const t = i / dotCount;
      arr.push([
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t,
      ]);
    }
    return arr;
  }, [from, to, dotCount]);

  return (
    <group>
      {dots.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.032, 10, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// STAGE 2: Aldol Coupling (Rotate Enolate -> Approach) & Heat Dehydration (Δ)
// ============================================================================
function Stage2Scene({ isModalOpen }: { isModalOpen: boolean }) {
  const rotDeg = useAldolCannizzaroStore((s) => s.stage2RotationDeg);
  const cp = useAldolCannizzaroStore((s) => s.stage2CouplingProgress);
  const dp = useAldolCannizzaroStore((s) => s.stage2DehydrationProgress);
  const coupled = useAldolCannizzaroStore((s) => s.stage2Coupled);
  const couplingAnimating = useAldolCannizzaroStore((s) => s.stage2CouplingAnimating);
  const dehydrated = useAldolCannizzaroStore((s) => s.stage2Dehydrated);
  const triggerStage2Coupling = useAldolCannizzaroStore((s) => s.triggerStage2Coupling);

  const isAligned = Math.abs(rotDeg) <= 15;

  // Both molecules glide symmetrically toward each other when APPROACH is clicked (cp: 0 -> 1)
  const shiftLeft = 0.72 * cp;
  const shiftRight = -0.72 * cp;

  // LEFT MOLECULE: Acetaldehyde acceptor (Cβ at x = -1.4 + shiftLeft)
  const cBeta: [number, number, number] = [-1.4 + shiftLeft, 0, 0];
  const oBeta: [number, number, number] = [
    -1.4 + shiftLeft - 0.45 * dp,
    1.22 + 0.95 * dp,
    0,
  ];
  const hOh: [number, number, number] = [oBeta[0] - 0.45, oBeta[1] + 0.28, 0];
  const hBeta: [number, number, number] = [-1.4 + shiftLeft, -0.75 * (1 - dp * 0.4), 0.72 * cp];
  const cMethyl: [number, number, number] = [-2.6 + shiftLeft, -0.45, -0.35 * cp];
  const methylHPositions: [number, number, number][] = [
    [cMethyl[0] - 0.25, cMethyl[1] - 0.36, cMethyl[2] + 0.28],
    [cMethyl[0] - 0.25, cMethyl[1] - 0.36, cMethyl[2] - 0.28],
    [cMethyl[0] - 0.46, cMethyl[1] + 0.16, cMethyl[2]],
  ];

  // RIGHT MOLECULE: Enolate nucleophile (α-C pivot at x = +1.4 + shiftRight, rotated by rotDeg)
  const enolatePivot: [number, number, number] = [1.4 + shiftRight, 0, 0];
  const rotRad = (rotDeg * Math.PI) / 180;

  // Local coordinates of Enolate relative to α-C (0,0,0)
  const localCCarb: [number, number, number] = [1.15, 0.55, 0];
  const localO: [number, number, number] = [1.15, 1.78, 0];
  const localHCarb: [number, number, number] = [2.05, 0.0, 0];
  const localHAlphaA: [number, number, number] = [0, -0.78, 0.42];
  const localHAlphaLeaving: [number, number, number] = [
    -0.6 * dp,
    -0.78 * (1 - dp) + 2.1 * dp,
    -0.42 * (1 - dp),
  ];

  // World position of leaving α-H for dehydration H2O bond
  const worldHAlphaLeaving: [number, number, number] = [
    enolatePivot[0] + localHAlphaLeaving[0],
    enolatePivot[1] + localHAlphaLeaving[1],
    enolatePivot[2] + localHAlphaLeaving[2],
  ];

  return (
    <group>
      {/* LEFT: Acetaldehyde Acceptor */}
      <DoubleBond from={cBeta} to={oBeta} piOpacity={Math.max(0, 1 - cp * 1.1)} />
      {dp > 0.1 && (
        <SimpleBond from={worldHAlphaLeaving} to={oBeta} opacity={dp} color="#38bdf8" radius={0.035} />
      )}
      {cp > 0.5 && <SimpleBond from={oBeta} to={hOh} radius={0.038} />}
      {cp > 0.5 && <AtomSphere position={hOh} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />}

      <SimpleBond from={cBeta} to={hBeta} />
      <SimpleBond from={cBeta} to={cMethyl} />

      <AtomSphere position={cBeta} radius={0.26} color="#334155" label="C" isModalOpen={isModalOpen} />
      <AtomSphere position={oBeta} radius={0.29} color="#ef4444" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={hBeta} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
      <AtomSphere position={cMethyl} radius={0.25} color="#475569" label="C" isModalOpen={isModalOpen} />
      {methylHPositions.map((mhp, idx) => (
        <group key={`s2-mh-${idx}`}>
          <SimpleBond from={cMethyl} to={mhp} radius={0.032} />
          <AtomSphere position={mhp} radius={0.13} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
        </group>
      ))}

      {/* Dotted Approach Line (before coupling) or Solid/Double Cα–Cβ Bond (after coupling) */}
      {!coupled && !couplingAnimating ? (
        <DottedLine
          from={cBeta}
          to={enolatePivot}
          color={isAligned ? "#10b981" : "#94a3b8"}
          dotCount={10}
        />
      ) : (
        <DoubleBond
          from={cBeta}
          to={enolatePivot}
          piOpacity={dp}
          piColor="#10b981"
          radius={0.048}
        />
      )}

      {/* Center APPROACH Block (Appears when Enolate is correctly rotated & aligned!) */}
      {!coupled && !couplingAnimating && isAligned && !isModalOpen && (
        <Html position={[0, 0.42, 0]} center className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={triggerStage2Coupling}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold tracking-wider shadow-lg shadow-emerald-600/30 border border-emerald-400 cursor-pointer transition-all transform hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap"
          >
            APPROACH ✓
          </button>
        </Html>
      )}

      {/* RIGHT: Rotatable Enolate Nucleophile */}
      <group position={enolatePivot} rotation={[0, rotRad, 0]}>
        <DoubleBond from={localCCarb} to={localO} piOpacity={1} />
        <SimpleBond from={localCCarb} to={localHCarb} />
        <SimpleBond from={localCCarb} to={[0, 0, 0]} />
        <SimpleBond from={[0, 0, 0]} to={localHAlphaA} />
        <SimpleBond from={[0, 0, 0]} to={localHAlphaLeaving} opacity={Math.max(0, 1 - dp * 1.4)} />

        <AtomSphere position={localCCarb} radius={0.25} color="#334155" label="C" isModalOpen={isModalOpen} />
        <AtomSphere position={localO} radius={0.28} color="#ef4444" label="O" isModalOpen={isModalOpen} />
        <AtomSphere position={localHCarb} radius={0.16} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
        <AtomSphere position={[0, 0, 0]} radius={0.26} color="#334155" emissive="#0284c7" emissiveIntensity={0.3} label="C" isModalOpen={isModalOpen} />
        <AtomSphere position={localHAlphaA} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
        <AtomSphere position={localHAlphaLeaving} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
      </group>

      {!isModalOpen && (
        <>
          <Html position={[cBeta[0], -1.25, 0]} center className="pointer-events-none select-none">
            <div className="bg-slate-50/95 border border-slate-300 text-slate-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              {dehydrated ? "Crotonaldehyde (C=C)" : coupled ? "Aldol (C–C Formed)" : "Acetaldehyde"}
            </div>
          </Html>
          {!coupled && (
            <Html position={[enolatePivot[0], -1.25, 0]} center className="pointer-events-none select-none">
              <div className="bg-sky-50/95 border border-sky-300 text-sky-800 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                Enolate (⁻CH₂–CHO)
              </div>
            </Html>
          )}
          {dp > 0.7 && (
            <Html position={[oBeta[0], oBeta[1] + 0.45, 0]} center className="pointer-events-none select-none">
              <div className="bg-sky-50/95 border border-sky-300 text-sky-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
                H₂O ↑ (Eliminated)
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

// ============================================================================
// STAGE 3: Cannizzaro Disproportionation (Formaldehyde Hydride Shift :H⁻)
// ============================================================================
function Stage3Scene({ isModalOpen }: { isModalOpen: boolean }) {
  const bp = useAldolCannizzaroStore((s) => s.stage3HydrateProgress);
  const hp = useAldolCannizzaroStore((s) => s.stage3HydrideProgress);
  const baseAdded = useAldolCannizzaroStore((s) => s.stage3BaseAdded);
  const hydrideShifted = useAldolCannizzaroStore((s) => s.stage3HydrideShifted);

  // Molecule 1 (Left: HCHO -> H2C(OH)O⁻ -> HCOO⁻ Oxidized)
  const c1: [number, number, number] = [-1.55, 0, 0];
  const o1: [number, number, number] = [-1.55, 1.25, 0];
  const h1Left: [number, number, number] = [-2.55, -0.58, 0];
  const oh1: [number, number, number] = [-1.55, -0.85 - 0.85 * (1 - bp), 0.75 * (1 - hp * 0.5)];
  const hOh1: [number, number, number] = [oh1[0] - 0.45, oh1[1] - 0.25, oh1[2]];

  // Molecule 2 (Right: HCHO -> CH3OH Reduced)
  const c2: [number, number, number] = [1.55, 0, 0];
  const o2: [number, number, number] = [1.55, 1.25, 0];
  const h2A: [number, number, number] = [2.55, -0.58, 0.35 * hp];
  const h2B: [number, number, number] = [1.15, -0.68, -0.55 * hp];

  // Hydride Ion (:H⁻) transferring from Molecule 1 to Molecule 2!
  const hydridePos: [number, number, number] = [
    (-0.55) * (1 - hp) + 0.65 * hp,
    -0.55 * (1 - hp) + 0.45 * Math.sin(hp * Math.PI) - 0.45 * hp,
    0.35 * Math.sin(hp * Math.PI),
  ];

  return (
    <group>
      {/* Molecule 1 */}
      <DoubleBond from={c1} to={o1} piOpacity={Math.max(0.5, 1 - bp * 0.5 + hp * 0.5)} />
      <SimpleBond from={c1} to={h1Left} />
      <SimpleBond from={c1} to={oh1} opacity={bp} color="#10b981" />
      <SimpleBond from={oh1} to={hOh1} radius={0.038} />
      <SimpleBond from={c1} to={hydridePos} opacity={Math.max(0, 1 - hp * 2)} color="#38bdf8" />

      <AtomSphere position={c1} radius={0.27} color="#334155" label="C" isModalOpen={isModalOpen} />
      <AtomSphere position={o1} radius={0.30} color="#ef4444" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={h1Left} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
      <AtomSphere position={oh1} radius={0.27} color="#ef4444" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={hOh1} radius={0.15} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />

      {/* Molecule 2 */}
      <DoubleBond from={c2} to={o2} piOpacity={Math.max(0, 1 - hp * 1.1)} />
      <SimpleBond from={c2} to={h2A} />
      <SimpleBond from={c2} to={h2B} />
      <SimpleBond from={c2} to={hydridePos} opacity={hp > 0.6 ? (hp - 0.6) * 2.5 : 0} color="#10b981" />

      <AtomSphere position={c2} radius={0.27} color="#334155" label="C" isModalOpen={isModalOpen} />
      <AtomSphere position={o2} radius={0.30} color="#ef4444" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={h2A} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />
      <AtomSphere position={h2B} radius={0.17} color="#f1f5f9" label="H" labelColor="#334155" isModalOpen={isModalOpen} />

      {/* Glowing Hydride (:H⁻) Ion */}
      <AtomSphere
        position={hydridePos}
        radius={0.19}
        color="#38bdf8"
        emissive="#0284c7"
        emissiveIntensity={hp > 0 && hp < 1 ? 1.2 : 0.45}
        label="H⁻"
        isModalOpen={isModalOpen}
      />

      {!isModalOpen && (
        <>
          <Html position={[-1.55, 1.75, 0]} center className="pointer-events-none select-none">
            <div className="bg-amber-50/95 border border-amber-300 text-amber-800 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              {hydrideShifted ? "HCOO⁻ (Oxidized)" : baseAdded ? "H₂C(OH)O⁻" : "Formaldehyde #1"}
            </div>
          </Html>
          <Html position={[1.55, 1.75, 0]} center className="pointer-events-none select-none">
            <div className="bg-emerald-50/95 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xs whitespace-nowrap">
              {hydrideShifted ? "CH₃OH (Reduced)" : "Formaldehyde #2"}
            </div>
          </Html>
          {hp > 0.05 && hp < 0.95 && (
            <Html position={[hydridePos[0], hydridePos[1] + 0.38, hydridePos[2]]} center className="pointer-events-none select-none">
              <div className="bg-sky-600 text-white px-2 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-sm whitespace-nowrap">
                :H⁻ Hydride Shift
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

// ============================================================================
// Inner Canvas Scene Controller
// ============================================================================
function SceneContent({ isModalOpen }: { isModalOpen: boolean }) {
  const stage = useAldolCannizzaroStore((s) => s.stage);
  const tickSimulation = useAldolCannizzaroStore((s) => s.tickSimulation);

  useFrame((_, delta) => {
    tickSimulation(delta);
  });

  return (
    <>
      <color attach="background" args={["#F8FAFC"]} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 8, 6]} intensity={1.3} color="#ffffff" />
      <directionalLight position={[-5, 4, -4]} intensity={0.65} color="#bae6fd" />

      <OrbitControls
        enablePan={false}
        target={[0, 0.15, 0]}
        minDistance={3.5}
        maxDistance={12.0}
        maxPolarAngle={Math.PI / 1.8}
      />

      {stage === 1 && <Stage1Scene isModalOpen={isModalOpen} />}
      {stage === 2 && <Stage2Scene isModalOpen={isModalOpen} />}
      {stage === 3 && <Stage3Scene isModalOpen={isModalOpen} />}
    </>
  );
}

// ============================================================================
// Exported 3D Canvas Wrapper
// ============================================================================
export default function AldolCannizzaro3D({
  isModalOpen = false,
}: {
  isModalOpen?: boolean;
}) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 1.65, 7.6], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <SceneContent isModalOpen={isModalOpen} />
      </Canvas>
    </div>
  );
}
