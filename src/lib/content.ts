import chemistryData from "@/data/chemistry.json";
import { moduleSlug, topicSlug } from "@/lib/theme";

export interface ChemistryTopic {
  topicId: string;
  topicName: string;
  coreConcept: string;
  slug: string;
  keyFormulas?: Array<{ formula: string; label: string }>;
  challenges?: {
    easy?: { title: string; description: string };
    medium?: { title: string; description: string };
    advanced?: { title: string; description: string };
  };
}

export interface ChemistryModule {
  moduleId: string;
  moduleName: string;
  slug: string;
  topics: ChemistryTopic[];
}

export function getModules(): ChemistryModule[] {
  return (chemistryData.modules || []).map((m) => ({
    moduleId: m.moduleId,
    moduleName: m.moduleName,
    slug: moduleSlug(m.moduleName),
    topics: (m.topics || []).map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      coreConcept: (t as any).coreConcept || "",
      slug: topicSlug(t.topicName),
      keyFormulas: (t as any).keyFormulas,
      challenges: (t as any).challenges,
    })),
  }));
}

export function findModule(moduleParam: string): ChemistryModule | null {
  const modules = getModules();
  const norm = moduleParam.toLowerCase().replace(/_/g, "-");

  return (
    modules.find(
      (m) =>
        m.slug === norm ||
        m.moduleId.toLowerCase() === norm ||
        m.moduleId.toLowerCase() === `m${norm}` ||
        norm.replace(/-/g, "") === m.moduleId.toLowerCase() ||
        norm === `module${m.moduleId.replace(/[^0-9]/g, "")}` ||
        norm === "module1" && m.moduleId === "M1"
    ) || modules[0] || null
  );
}

export function findTopic(
  moduleParam: string,
  topicParam: string
): { module: ChemistryModule; topic: ChemistryTopic } | null {
  const mod = findModule(moduleParam);
  if (!mod) return null;

  const norm = topicParam.toLowerCase().replace(/_/g, "-");

  const topic =
    mod.topics.find((t) => {
      if (t.slug === norm || t.topicId === norm) return true;
      if (norm.includes("vsepr") && (t.slug.includes("vsepr") || t.topicId === "1")) return true;
      if (norm.includes("hybrid") && (t.slug.includes("hybrid") || t.topicId === "2")) return true;
      if (norm.includes("mot") && (t.slug.includes("molecular-orbital") || t.topicId === "3")) return true;
      if (norm === "molecular-orbital-theory" && t.topicId === "3") return true;
      if (norm.includes("bohr") && (t.slug.includes("bohr") || t.topicId === "4")) return true;
      if ((norm === "bohr-model" || norm === "bohr-model-hydrogen-spectrum") && t.topicId === "4") return true;
      if (
        (norm.includes("atomic-orbital") ||
          norm === "atomic-orbitals" ||
          (norm.includes("orbital") && !norm.includes("quantum"))) &&
        t.topicId === "5"
      )
        return true;
      if (
        (norm.includes("electronic") ||
          norm.includes("config") ||
          norm === "electronic-configurations") &&
        t.topicId === "6"
      )
        return true;
      if (
        (norm.includes("dual-nature") ||
          norm.includes("matter-wave") ||
          norm.includes("de-broglie") ||
          norm.includes("double-slit") ||
          norm === "dual-nature-of-matter") &&
        t.topicId === "7"
      )
        return true;
      if (
        (norm.includes("quantum-number") ||
          norm.includes("quantum_number") ||
          norm.includes("quantum") ||
          norm === "quantum-numbers" ||
          norm === "quantum-number") &&
        t.topicId === "8"
      )
        return true;
      return false;
    }) || mod.topics[0];

  return { module: mod, topic };
}
