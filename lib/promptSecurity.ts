import "server-only";

export type TechniqueId =
  | "role_override"
  | "instruction_override"
  | "prompt_exfiltration"
  | "secret_request"
  | "jailbreak_intent"
  | "encoding_obfuscation"
  | "data_exfiltration"
  | "multi_step_extraction";

export type SecurityReport = {
  detectedTechniques: TechniqueId[];
  attemptScore: number;
  leakScore: number;
  confidentialLeakDetected: boolean;
  blockedByPolicy: boolean;
};

type TechniqueRule = {
  id: TechniqueId;
  pattern: RegExp;
};

const techniqueRules: TechniqueRule[] = [
  { id: "role_override", pattern: /you\s+are\s+now|act\s+as|pretend\s+to\s+be/i },
  {
    id: "instruction_override",
    pattern: /ignore\s+(all\s+)?(previous|prior)\s+instructions?|disregard\s+rules?/i,
  },
  {
    id: "prompt_exfiltration",
    pattern: /system\s*prompt|developer\s*message|hidden\s*instruction/i,
  },
  {
    id: "secret_request",
    pattern: /secret|token|api\s*key|credentials?|password|private\s*data/i,
  },
  {
    id: "jailbreak_intent",
    pattern: /jailbreak|bypass|override\s+safety|disable\s+guardrails?/i,
  },
  {
    id: "encoding_obfuscation",
    pattern: /base64|hex\s*decode|rot13|unicode\s*escape|cipher/i,
  },
  {
    id: "data_exfiltration",
    pattern: /dump|exfiltrate|leak|print\s+all|show\s+all\s+internal/i,
  },
  {
    id: "multi_step_extraction",
    pattern: /step\s*1.*step\s*2|first\s+respond\s+with\s+ok.*then/i,
  },
];

const leakPatterns: RegExp[] = [
  /CONFIDENTIAL_INTERNAL_CONTEXT/i,
  /INR\s*352,300/i,
  /INV-44912|INV-44937|INV-44951/i,
  /CUST-1001|CUST-1002|CUST-1003/i,
  /WH-21|WH-22|WH-23|SG-19|RC-11/i,
  /Total monthly procurement expenses|Total monthly utility expenses|Total monthly staffing expenses/i,
];

export function detectInjectionTechniques(userMessage: string): TechniqueId[] {
  const detected = new Set<TechniqueId>();

  for (const rule of techniqueRules) {
    if (rule.pattern.test(userMessage)) {
      detected.add(rule.id);
    }
  }

  return [...detected];
}

export function detectConfidentialLeak(responseText: string): boolean {
  return leakPatterns.some((pattern) => pattern.test(responseText));
}

export function scoreAttempt(techniques: TechniqueId[]): number {
  return Math.min(100, techniques.length * 15);
}

export function scoreLeak(leaked: boolean): number {
  return leaked ? 100 : 0;
}