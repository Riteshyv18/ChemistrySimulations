# ⚗️ Chemistry 3D Simulations & Challenges

A dedicated, standalone 3D interactive learning repository for chemistry simulations, molecular geometries, hybridization mechanisms, and molecular orbital theory.

Built with **Next.js 16**, **React Three Fiber (R3F)**, **Three.js**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🧪 3D Chemistry Challenge Catalog

### 1. VSEPR Theory & Molecular Shapes
- **Easy (`/challenge/chemical-bonding-molecular-structure/vsepr-molecular-shapes/easy`)**:
  *Shape Identifier & Bond Angles*: 3D rotation and measurement of CH₄ (109.5°), NH₃ (107°), H₂O (104.5°), and BF₃ (120°).
- **Medium (`/challenge/chemical-bonding-molecular-structure/vsepr-molecular-shapes/medium`)**:
  *Lone Pair Balancer*: 5-coordinate Trigonal Bipyramidal (TBP) geometry, placing axial vs equatorial lone pairs for Seesaw and T-shaped species.
- **Hard (`/challenge/chemical-bonding-molecular-structure/vsepr-molecular-shapes/hard`)**:
  *Steric Number Mastery*: Complex interhalogens and noble gas halides (XeF₄, ClF₃, SF₄, I₃⁻).

---

### 2. Hybridization & Orbital Overlap
- **Easy (`/challenge/chemical-bonding-molecular-structure/hybridization-orbital-overlap/easy`)**:
  *Basic Hybridization*: 3D lobes of sp (180°), sp² (120°), and sp³ (109.5°) hybrid orbitals with directional bonding.
- **Medium (`/challenge/chemical-bonding-molecular-structure/hybridization-orbital-overlap/medium`)**:
  *Orbital Workshop*: Step-by-step interactive mixing of s and p orbitals to synthesize hybrid lobes.
- **Hard (`/challenge/chemical-bonding-molecular-structure/hybridization-orbital-overlap/hard`)**:
  *Hybridization Match Puzzle*: Match 3D molecules to their steric numbers, hybrid orbitals, and covalent bond characteristics.

---

### 3. Molecular Orbital Theory (MOT)
- **Easy (`/challenge/chemical-bonding-molecular-structure/molecular-orbital-theory/easy`)**:
  *MOT Orbital Builder*: 1s & 2s atomic orbital linear combinations in-phase (bonding $\sigma$) and out-of-phase (antibonding $\sigma^*$).
- **Medium (`/challenge/chemical-bonding-molecular-structure/molecular-orbital-theory/medium`)**:
  *Diatomic Filling & Energy Diagram*: Aufbau, Pauli, and Hund's rule electron filling across B₂, C₂, N₂, O₂, and F₂ energy levels.
- **Hard (`/challenge/chemical-bonding-molecular-structure/molecular-orbital-theory/hard`)**:
  *MOT Mastery*: Bond order calculations, bond length stability comparisons, and magnetic property deductions (paramagnetic vs diamagnetic).

---

## 📁 Repository Structure

```
ChemistrySimulations/
├── public/
│   └── images/
│       └── orbitals/               # 3D orbital diagrams & molecule references
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML shell
│   │   ├── globals.css             # Tailwind v4 styles & glassmorphism tokens
│   │   ├── page.tsx                # Central 3D Chemistry Challenge Hub
│   │   ├── [module]/[topic]/
│   │   │   ├── page.tsx            # Topic overview with difficulty selection
│   │   │   └── challenge/[difficulty]/
│   │   │       └── page.tsx        # Direct challenge route
│   │   └── challenge/[module]/[topic]/[difficulty]/
│   │       └── page.tsx            # Unified challenge route
│   ├── components/
│   │   └── ChallengeDispatcher.tsx # Dynamic scene loader & error boundary
│   ├── data/
│   │   └── chemistry.json          # Chemistry curriculum data
│   ├── features/
│   │   └── challenges/topics/chemistry/
│   │       ├── vsepr_Molecular_shape/
│   │       ├── hybridization_orbital_overlap/
│   │       ├── Molecular_orbital_theory/
│   │       └── _widgets/
│   └── three/
│       ├── core/renderers/
│       │   └── MoleculeRenderer.tsx
│       └── kit/chemistry/
│           ├── Atom.tsx
│           ├── Bond.tsx
│           ├── Beaker.tsx
│           ├── Flask.tsx
│           ├── TestTube.tsx
│           └── elements.ts
```
