import "server-only";
import { type ClassifierLabel, type SemanticClassification } from "./semanticClassifier";

export type InjectionScore = {
  totalScore: number;
  maxScore: number;
  percentage: number;
  category: "harmless" | "low" | "moderate" | "high" | "critical";
  breakdown: {
    typeScore: number;
    confidenceBonus: number;
    riskBonus: number;
  };
};

const injectionTypeScores: Record<ClassifierLabel, number> = {
  benign: 0,
  unknown: 5,
  secret_request: 25,
  prompt_exfiltration: 35,
  instruction_override: 30,
  data_exfiltration: 40,
  jailbreak_intent: 45,
};

const riskBonusMap: Record<"low" | "medium" | "high", number> = {
  low: 0,
  medium: 10,
  high: 20,
};

export function calculateInjectionScore(
  classification: SemanticClassification
): InjectionScore {
  const typeScore = injectionTypeScores[classification.label] ?? 0;
  const confidenceBonus = Math.round((classification.confidence / 100) * 15);
  const riskBonus = riskBonusMap[classification.riskLevel] ?? 0;

  const totalScore = Math.min(100, typeScore + confidenceBonus + riskBonus);

  let category: "harmless" | "low" | "moderate" | "high" | "critical";
  if (totalScore === 0) {
    category = "harmless";
  } else if (totalScore <= 20) {
    category = "low";
  } else if (totalScore <= 40) {
    category = "moderate";
  } else if (totalScore <= 70) {
    category = "high";
  } else {
    category = "critical";
  }

  return {
    totalScore,
    maxScore: 100,
    percentage: totalScore,
    category,
    breakdown: {
      typeScore,
      confidenceBonus,
      riskBonus,
    },
  };
}
