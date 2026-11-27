"use client";

import React, { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useCarboxylicAcidityStore, ACID_DATA } from "./CarboxylicAcidityStore";

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
      <mesh position={[-0.04 * Math.min(1, piOpacity + 0.15), 0, 0]}>
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

// ============================================================================
// Helper: Atom Sphere with Crisp Centered Element Label
// ============================================================================
function AtomSphere({
  position,
  radius,
  color,
  emissive,
  emissiveIntensity = 0,
  opacity = 1,
  label,
  labelColor = "#ffffff",
  isModalOpen = false,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  label?: string;
  labelColor?: string;
  isModalOpen?: boolean;
}) {
  if (opacity <= 0.02) return null;
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.12}
        emissive={emissive || "#000000"}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity < 1}
        opacity={opacity}
      />
      {label && !isModalOpen && opacity > 0.35 && (
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
// STAGE 1: −I Inductive Acidity Ladder (Acetic -> Trichloroacetic Acid)
// ============================================================================
function Stage1InductiveScene({ isModalOpen }: { isModalOpen: boolean }) {
  const {
    clCount,
    stage1Progress,
    stage1Failed,
    stage1FailProgress,
  } = useCarboxylicAcidityStore();

  const cAlpha: [number, number, number] = [-1.05, 0, 0];
  const cCarboxyl: [number, number, number] = [0.55, 0, 0];
  const oTop: [number, number, number] = [1.25, 1.05, 0];
  const oBot: [number, number, number] = [1.25, -1.05, 0];

  // Tetrahedral unit vectors from C_alpha pointing leftwards
  const dirs: [number, number, number][] = useMemo(() => {
    const raw: [number, number, number][] = [
      [-0.58, 0.85, 0.45],
      [-0.58, -0.85, 0.45],
      [-0.58, 0.0, -0.95],
    ];
    return raw.map((d) => {
      const v = new THREE.Vector3(...d).normalize();
      return [v.x, v.y, v.z];
    });
  }, []);

  // When failed attempt, H+ stretches out and snaps back
  const failOffset = stage1Failed
    ? Math.sin(stage1FailProgress * Math.PI) * 0.45
    : 0;

  const dissProg = stage1Progress;
  const hPos: [number, number, number] = [
    2.15 + (dissProg + failOffset) * 1.45,
    -1.05 - dissProg * 0.65,
    dissProg * 0.45,
  ];
  const hOpacity = 1 - dissProg * 0.85;

  const acidInfo = ACID_DATA[clCount];

  return (
    <group>
      {/* C_alpha - C_carboxyl bond */}
      <SimpleBond from={cAlpha} to={cCarboxyl} color={clCount > 0 ? "#86efac" : "#cbd5e1"} />

      {/* Carboxyl C=O & C-OH (Equalizes to resonance C...O on dissociation) */}
      <DoubleBond
        from={cCarboxyl}
        to={oTop}
        piOpacity={1 - dissProg * 0.45}
        piColor="#38bdf8"
      />
      <DoubleBond
        from={cCarboxyl}
        to={oBot}
        piOpacity={dissProg * 0.55}
        piColor="#38bdf8"
      />
      {/* O-H bond fades as H+ departs */}
      <SimpleBond
        from={oBot}
        to={hPos}
        color={stage1Failed ? "#f87171" : "#cbd5e1"}
        opacity={1 - dissProg}
      />

      {/* C_alpha & Substituents (H vs Cl) */}
      <AtomSphere
        position={cAlpha}
        radius={0.34}
        color="#0f172a"
        label="C"
        isModalOpen={isModalOpen}
      />
      {dirs.map((d, idx) => {
        const isCl = idx < clCount;
        const dist = isCl ? 1.32 : 0.96;
        const pos: [number, number, number] = [
          cAlpha[0] + d[0] * dist,
          cAlpha[1] + d[1] * dist,
          cAlpha[2] + d[2] * dist,
        ];
        return (
          <React.Fragment key={idx}>
            <SimpleBond
              from={cAlpha}
              to={pos}
              color={isCl ? "#86efac" : "#cbd5e1"}
            />
            <AtomSphere
              position={pos}
              radius={isCl ? 0.29 : 0.17}
              color={isCl ? "#16a34a" : "#e2e8f0"}
              emissive={isCl ? "#22c55e" : "#000000"}
              emissiveIntensity={isCl ? 0.25 : 0}
              label={isCl ? "Cl" : "H"}
              labelColor={isCl ? "#ffffff" : "#1e293b"}
              isModalOpen={isModalOpen}
            />
          </React.Fragment>
        );
      })}

      {/* Carboxyl Group Atoms */}
      <AtomSphere
        position={cCarboxyl}
        radius={0.34}
        color="#0f172a"
        label="C"
        isModalOpen={isModalOpen}
      />
      <AtomSphere
        position={oTop}
        radius={0.31}
        color="#dc2626"
        emissive={dissProg > 0.3 ? "#ef4444" : "#000000"}
        emissiveIntensity={dissProg * 0.35}
        label={dissProg > 0.5 ? "O⁻" : "O"}
        isModalOpen={isModalOpen}
      />
      <AtomSphere
        position={oBot}
        radius={0.31}
        color="#dc2626"
        emissive={dissProg > 0.3 ? "#ef4444" : "#000000"}
        emissiveIntensity={dissProg * 0.35}
        label={dissProg > 0.5 ? "O⁻" : "O"}
        isModalOpen={isModalOpen}
      />
      <AtomSphere
        position={hPos}
        radius={0.18}
        color={
          stage1Failed
            ? "#ef4444"
            : dissProg > 0.2
            ? "#38bdf8"
            : "#e2e8f0"
        }
        emissive={
          stage1Failed
            ? "#ef4444"
            : dissProg > 0.2
            ? "#0284c7"
            : "#000000"
        }
        emissiveIntensity={stage1Failed ? 0.5 : dissProg * 0.5}
        opacity={hOpacity}
        label={dissProg > 0.2 ? "H⁺" : "H"}
        labelColor={stage1Failed || dissProg > 0.2 ? "#ffffff" : "#1e293b"}
        isModalOpen={isModalOpen}
      />

      {/* Molecule & Inductive Pull Info Labels */}
      {!isModalOpen && (
        <>
          <Html position={[-0.25, -1.85, 0]} center>
            <div className="px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap flex items-center gap-2">
              <span>{acidInfo.name}</span>
              <span className="text-sky-700">({acidInfo.formula})</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  acidInfo.pka < 1.0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                pKa = {acidInfo.pka.toFixed(2)}
              </span>
            </div>
          </Html>

          {clCount > 0 && (
            <Html position={[-0.35, 1.35, 0]} center>
              <div className="px-2.5 py-1 rounded-full bg-emerald-50/95 border border-emerald-300 shadow-sm font-mono text-[10px] font-bold text-emerald-700 whitespace-nowrap">
                ← {clCount}× Cl (−I Electron Pull)
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
}

// ============================================================================
// STAGE 2: Hell-Volhard-Zelinsky (HVZ) α-Bromination
// ============================================================================
function Stage2HVZScene({ isModalOpen }: { isModalOpen: boolean }) {
  const {
    stage2Reagent,
    stage2PosOffset,
    stage2Progress,
    stage2Failed,
    stage2FailProgress,
    triggerStage2Substitution,
  } = useCarboxylicAcidityStore();

  const subProg = stage2Progress;

  // Propanoic Acid Backbone
  const cBeta: [number, number, number] = [-1.45, 0.15, 0];
  const cAlpha: [number, number, number] = [0.0, -0.35, 0];
  const cCarboxyl: [number, number, number] = [1.45, 0.15, 0];
  const oTop: [number, number, number] = [1.45, 1.25, 0];
  const oBot: [number, number, number] = [2.5, -0.45, 0];
  const hAcid: [number, number, number] = [2.95, 0.28, 0];

  // Alpha hydrogens
  const hAlpha1Start: [number, number, number] = [0.0, 0.55, 0.55];
  const hAlpha2: [number, number, number] = [0.0, -1.1, -0.58];

  // Beta hydrogens on CH3
  const betaHs: [number, number, number][] = [
    [-2.0, 0.95, 0.3],
    [-2.1, -0.45, 0.45],
    [-1.85, 0.15, -0.88],
  ];

  // Rebound/deflection animation on failure
  const failDrop = stage2Failed
    ? Math.sin(stage2FailProgress * Math.PI) * -0.9
    : 0;

  // Br2 initial & animated positions
  const brHoverX = stage2PosOffset;
  const brHoverY = 2.1 + failDrop;

  const br1Pos: [number, number, number] = [
    THREE.MathUtils.lerp(brHoverX - 0.42, 0.0, subProg),
    THREE.MathUtils.lerp(brHoverY, 0.88, subProg),
    THREE.MathUtils.lerp(0, 0.55, subProg),
  ];
  const br2Pos: [number, number, number] = [
    THREE.MathUtils.lerp(brHoverX + 0.42, 0.95, subProg),
    THREE.MathUtils.lerp(brHoverY, 3.05, subProg),
    0,
  ];
  const hAlpha1Pos: [number, number, number] = [
    THREE.MathUtils.lerp(hAlpha1Start[0], 0.35, subProg),
    THREE.MathUtils.lerp(hAlpha1Start[1], 3.05, subProg),
    THREE.MathUtils.lerp(hAlpha1Start[2], 0, subProg),
  ];

  const isRedPActive = stage2Reagent === "br2_redp";
  const isAlignedAlpha = isRedPActive && Math.abs(stage2PosOffset) <= 0.22;
  const showBr2 = stage2Reagent !== null || subProg > 0;
  const hbrOpacity = 1 - subProg * 0.85;

  return (
    <group>
      {/* Backbone Bonds */}
      <SimpleBond from={cBeta} to={cAlpha} />
      <SimpleBond from={cAlpha} to={cCarboxyl} />
      <DoubleBond from={cCarboxyl} to={oTop} />
      <SimpleBond from={cCarboxyl} to={oBot} />
      <SimpleBond from={oBot} to={hAcid} />

      {/* Beta H bonds */}
      {betaHs.map((h, i) => (
        <React.Fragment key={i}>
          <SimpleBond from={cBeta} to={h} />
          <AtomSphere
            position={h}
            radius={0.16}
            color="#e2e8f0"
            label="H"
            labelColor="#1e293b"
            isModalOpen={isModalOpen}
          />
        </React.Fragment>
      ))}

      {/* Alpha H2 bond */}
      <SimpleBond from={cAlpha} to={hAlpha2} />
      <AtomSphere
        position={hAlpha2}
        radius={0.16}
        color="#e2e8f0"
        label="H"
        labelColor="#1e293b"
        isModalOpen={isModalOpen}
      />

      {/* Alpha H1 bond (breaks during substitution) -> replaced by C_alpha-Br1 */}
      <SimpleBond from={cAlpha} to={hAlpha1Start} opacity={1 - subProg} />
      {subProg > 0.05 && (
        <SimpleBond from={cAlpha} to={br1Pos} color="#fca5a5" opacity={subProg} />
      )}
      <AtomSphere
        position={hAlpha1Pos}
        radius={0.17}
        color="#e2e8f0"
        opacity={hbrOpacity}
        label="H"
        labelColor="#1e293b"
        isModalOpen={isModalOpen}
      />

      {/* Backbone Carbons & Oxygens */}
      <AtomSphere position={cBeta} radius={0.32} color="#0f172a" label="Cβ" isModalOpen={isModalOpen} />
      <AtomSphere
        position={cAlpha}
        radius={0.35}
        color="#0284c7"
        emissive={isAlignedAlpha ? "#10b981" : "#0284c7"}
        emissiveIntensity={isAlignedAlpha ? 0.35 : 0.15}
        label="Cα"
        isModalOpen={isModalOpen}
      />
      <AtomSphere position={cCarboxyl} radius={0.32} color="#0f172a" label="C" isModalOpen={isModalOpen} />
      <AtomSphere position={oTop} radius={0.28} color="#dc2626" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={oBot} radius={0.28} color="#dc2626" label="O" isModalOpen={isModalOpen} />
      <AtomSphere position={hAcid} radius={0.16} color="#e2e8f0" label="H" labelColor="#1e293b" isModalOpen={isModalOpen} />

      {/* Br2 Molecule & Dotted Alignment Line */}
      {showBr2 && (
        <>
          <SimpleBond from={br1Pos} to={br2Pos} opacity={1 - subProg} />
          {subProg > 0.25 && (
            <SimpleBond from={br2Pos} to={hAlpha1Pos} opacity={hbrOpacity} color="#fca5a5" />
          )}
          <AtomSphere
            position={br1Pos}
            radius={0.3}
            color={stage2Failed ? "#ef4444" : "#991b1b"}
            emissive={stage2Failed ? "#ef4444" : "#000000"}
            emissiveIntensity={stage2Failed ? 0.45 : 0}
            label="Br"
            isModalOpen={isModalOpen}
          />
          <AtomSphere
            position={br2Pos}
            radius={0.3}
            color={stage2Failed ? "#ef4444" : "#991b1b"}
            emissive={stage2Failed ? "#ef4444" : "#000000"}
            emissiveIntensity={stage2Failed ? 0.45 : 0}
            opacity={hbrOpacity}
            label="Br"
            isModalOpen={isModalOpen}
          />
          {subProg <= 0.05 && (
            <Line
              points={[
                [brHoverX, brHoverY - 0.2, 0],
                [brHoverX, 0.5, 0],
              ]}
              color={stage2Failed ? "#ef4444" : isAlignedAlpha ? "#10b981" : "#64748b"}
              lineWidth={2}
              dashed
              dashScale={8}
              dashSize={0.5}
              gapSize={0.4}
            />
          )}
        </>
      )}

      {/* Interactive REACT ✓ Button in Center when Aligned over α-C */}
      {isAlignedAlpha && subProg <= 0.02 && !isModalOpen && (
        <Html position={[0, 1.35, 0]} center>
          <button
            type="button"
            onClick={triggerStage2Substitution}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold tracking-wider shadow-lg shadow-emerald-600/30 border border-emerald-400 cursor-pointer transition-transform hover:scale-105 active:scale-95 whitespace-nowrap animate-bounce"
          >
            REACT ✓
          </button>
        </Html>
      )}

      {!isModalOpen && (
        <Html position={[0, -1.85, 0]} center>
          <div className="px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {subProg >= 0.8
              ? "2-Bromopropanoic Acid (CH₃CH(Br)COOH) + HBr↑"
              : "Propanoic Acid (CH₃CH₂COOH)"}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// STAGE 3: Fischer Esterification Engine (Acetic Acid + Ethanol)
// ============================================================================
function Stage3EsterScene({ isModalOpen }: { isModalOpen: boolean }) {
  const {
    stage3CatalystAdded,
    stage3RotationDeg,
    stage3Coupled,
    stage3CouplingProgress,
    stage3EsterProgress,
    stage3Failed,
    stage3FailProgress,
    triggerStage3Approach,
  } = useCarboxylicAcidityStore();

  const coupleProg = stage3Coupled ? 1.0 : stage3CouplingProgress;
  const esterProg = stage3EsterProgress;

  // Failure shake offset
  const failShake = stage3Failed
    ? Math.sin(stage3FailProgress * Math.PI * 4) * 0.08
    : 0;

  // Left: Acetic Acid
  const cMethylAcid: [number, number, number] = [-2.55 + failShake, 0, 0];
  const cCarbonyl: [number, number, number] = [-1.15 + failShake, 0, 0];
  const oCarbonyl: [number, number, number] = [-1.15 + failShake, 1.15, 0];
  const hCatPos: [number, number, number] = [-0.52 + failShake, 1.48, 0];

  // Acid -OH leaves upward during dehydration (esterProg)
  const oLeaving: [number, number, number] = [
    -1.15 + esterProg * 0.55,
    -1.15 + esterProg * 3.25,
    esterProg * 0.4,
  ];
  const hLeavingAcid: [number, number, number] = [
    oLeaving[0] - 0.55,
    oLeaving[1] - 0.3,
    oLeaving[2],
  ];
  const waterOpacity = 1 - esterProg * 0.9;

  // Right: Ethanol group pivoted at its nucleophilic oxygen
  const ethPivotX = THREE.MathUtils.lerp(1.95, 0.25, coupleProg) - failShake;
  const rotRad = THREE.MathUtils.lerp((stage3RotationDeg * Math.PI) / 180, 0, coupleProg);

  const isAligned =
    stage3CatalystAdded &&
    Math.abs(stage3RotationDeg) <= 15 &&
    !stage3Coupled &&
    coupleProg <= 0.02;

  // Carbonyl pi-bond disappears on coupling, restores on esterification!
  const carbonylPiOpacity =
    coupleProg > 0.02 ? esterProg : 1;

  // Alcohol H leaves with Acid -OH as H2O
  const hAlcoholPos: [number, number, number] = [
    THREE.MathUtils.lerp(0.0, oLeaving[0] + 0.45 - ethPivotX, esterProg),
    THREE.MathUtils.lerp(-0.85, oLeaving[1] - 0.15, esterProg),
    oLeaving[2],
  ];

  return (
    <group>
      {/* Left: Acetic Acid */}
      <SimpleBond from={cMethylAcid} to={cCarbonyl} />
      <DoubleBond
        from={cCarbonyl}
        to={oCarbonyl}
        piOpacity={carbonylPiOpacity}
        piColor="#38bdf8"
      />
      <SimpleBond from={cCarbonyl} to={oLeaving} opacity={1 - esterProg} />
      <SimpleBond from={oLeaving} to={hLeavingAcid} opacity={waterOpacity} />

      <AtomSphere position={cMethylAcid} radius={0.31} color="#0f172a" label="CH₃" isModalOpen={isModalOpen} />
      <AtomSphere
        position={cCarbonyl}
        radius={0.34}
        color="#0f172a"
        emissive={stage3CatalystAdded ? "#0284c7" : "#000000"}
        emissiveIntensity={stage3CatalystAdded ? 0.25 : 0}
        label="C"
        isModalOpen={isModalOpen}
      />
      <AtomSphere position={oCarbonyl} radius={0.29} color="#dc2626" label="O" isModalOpen={isModalOpen} />
      <AtomSphere
        position={oLeaving}
        radius={0.29}
        color="#dc2626"
        opacity={waterOpacity}
        label="O"
        isModalOpen={isModalOpen}
      />
      <AtomSphere
        position={hLeavingAcid}
        radius={0.17}
        color="#e2e8f0"
        opacity={waterOpacity}
        label="H"
        labelColor="#1e293b"
        isModalOpen={isModalOpen}
      />

      {/* H+ Catalyst indicator */}
      {stage3CatalystAdded && esterProg <= 0.8 && (
        <>
          <SimpleBond from={oCarbonyl} to={hCatPos} color="#fbbf24" opacity={0.85} />
          <AtomSphere
            position={hCatPos}
            radius={0.17}
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.4}
            label="H⁺"
            isModalOpen={isModalOpen}
          />
        </>
      )}

      {/* Dotted Alignment Line / New C-O Ester Bond */}
      {!stage3Coupled && coupleProg <= 0.05 ? (
        <Line
          points={[
            cCarbonyl,
            [ethPivotX, 0, 0],
          ]}
          color={isAligned ? "#10b981" : "#64748b"}
          lineWidth={2}
          dashed
          dashScale={8}
          dashSize={0.5}
          gapSize={0.4}
        />
      ) : (
        <SimpleBond from={cCarbonyl} to={[ethPivotX, 0, 0]} color="#38bdf8" opacity={coupleProg} />
      )}

      {/* Right: Ethanol (HO - CH2 - CH3) */}
      <group position={[ethPivotX, 0, 0]} rotation={[0, 0, rotRad]}>
        <SimpleBond from={[0, 0, 0]} to={[1.25, 0, 0]} />
        <SimpleBond from={[1.25, 0, 0]} to={[2.35, 0.65, 0]} />
        <SimpleBond from={[0, 0, 0]} to={hAlcoholPos} opacity={1 - esterProg} />

        <AtomSphere position={[0, 0, 0]} radius={0.3} color="#dc2626" label="O" isModalOpen={isModalOpen} />
        <AtomSphere position={[1.25, 0, 0]} radius={0.31} color="#0f172a" label="CH₂" isModalOpen={isModalOpen} />
        <AtomSphere position={[2.35, 0.65, 0]} radius={0.31} color="#0f172a" label="CH₃" isModalOpen={isModalOpen} />
        <AtomSphere
          position={hAlcoholPos}
          radius={0.17}
          color="#e2e8f0"
          opacity={waterOpacity}
          label="H"
          labelColor="#1e293b"
          isModalOpen={isModalOpen}
        />
      </group>

      {/* Center APPROACH ✓ Button when H+ added & rotated within 15° */}
      {isAligned && !isModalOpen && (
        <Html position={[0.4, 0.9, 0]} center>
          <button
            type="button"
            onClick={triggerStage3Approach}
            className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-extrabold tracking-wider shadow-lg shadow-emerald-600/30 border border-emerald-400 cursor-pointer transition-transform hover:scale-105 active:scale-95 whitespace-nowrap animate-bounce"
          >
            APPROACH ✓
          </button>
        </Html>
      )}

      {!isModalOpen && (
        <Html position={[0.1, -1.85, 0]} center>
          <div className="px-3 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
            {esterProg >= 0.8
              ? "Ethyl Acetate (CH₃COOCH₂CH₃) + H₂O↑"
              : stage3Coupled
              ? "Tetrahedral Intermediate • Heat ≥ 80°C"
              : "Acetic Acid + Ethanol"}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// INNER SCENE CONTENT (DRIVES FRAME SIMULATION TICK)
// ============================================================================
function SceneContent({ isModalOpen }: { isModalOpen: boolean }) {
  const stage = useCarboxylicAcidityStore((s) => s.stage);
  const tickSimulation = useCarboxylicAcidityStore((s) => s.tickSimulation);

  useFrame((_, delta) => {
    tickSimulation(delta);
  });

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} />
      <directionalLight position={[-6, -4, -4]} intensity={0.4} />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        enableDamping
        dampingFactor={0.08}
      />

      {stage === 1 && <Stage1InductiveScene isModalOpen={isModalOpen} />}
      {stage === 2 && <Stage2HVZScene isModalOpen={isModalOpen} />}
      {stage === 3 && <Stage3EsterScene isModalOpen={isModalOpen} />}
    </>
  );
}

// ============================================================================
// MAIN CANVAS EXPORT
// ============================================================================
export default function CarboxylicAcidity3D({
  isModalOpen = false,
}: {
  isModalOpen?: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.35, 8.2], fov: 45 }}
      dpr={[1, 2]}
      className="w-full h-full bg-[#F8FAFC]"
    >
      <color attach="background" args={["#F8FAFC"]} />
      <SceneContent isModalOpen={isModalOpen} />
    </Canvas>
  );
}
