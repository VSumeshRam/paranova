# MASTER AGENT SPECIFICATION: CogniTrace AI
### Continuous Cognitive Diagnostic & Adaptive Knowledge Tracing Engine

---

## 1. ARCHITECTURAL OVERVIEW & PRINCIPLES
CogniTrace AI is a full-stack adaptive learning diagnostic engine designed to eliminate the cold-start problem and detect hidden prerequisite knowledge gaps and misconceptions.

You will build this as a standalone Next.js 14+ (App Router) TypeScript application. All business logic must be deterministic and mathematically verifiable, augmented by structured LLM calls only for semantic parsing and causal misconception attribution.

### Core Tech Stack:
- Runtime & Framework: Next.js 14+ (App Router), TypeScript (Strict Mode)
- Database & ORM: SQLite via Prisma ORM
- State Management: Zustand (client-side telemetry buffer + active session state)
- Visualizations: `@xyflow/react` (React Flow) for Directed Acyclic Graph (DAG) rendering
- Schema Validation: Zod (runtime validation on all API boundaries)
- UI Styling: Tailwind CSS + Lucide React

---

## 2. MATHEMATICAL SPECIFICATIONS

### 2.1 Bayesian Knowledge Tracing (BKT) Formulation
Each knowledge node $k$ maintains four parameters:
- $P(L_0)$: Initial prior mastery probability (default: $0.10$)
- $P(T)$: Transition probability from unlearned to learned state ($0.15$)
- $P(G)$: Guess probability—correct response despite not knowing ($0.20$)
- $P(S)$: Slip probability—incorrect response despite knowing ($0.05$)

Given an observation $Obs \in \{1 \text{ (Correct)}, 0 \text{ (Incorrect)}\}$, calculate the updated mastery probability:

1. Prior Probability of Correct Response:
$$P(C_t) = P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)$$

2. Posterior Update:
$$P(L_t \mid Obs = 1) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(C_t)}$$
$$P(L_t \mid Obs = 0) = \frac{P(L_{t-1}) \cdot P(S)}{1 - P(C_t)}$$

3. Forward State Transition for Step $t+1$:
$$P(L_{t+1}) = P(L_t \mid Obs) + (1 - P(L_t \mid Obs)) \cdot P(T)$$

Mastery Threshold: A node is considered mastered when $P(L_t) \ge 0.85$.

### 2.2 Cognitive Friction Score (CFS) Formula
The client telemetry engine collects raw metrics and computes the CFS normalized between $0.0$ and $1.0$:
$$CFS = \min\left(1.0, \frac{TTFA}{60000} \cdot 0.4 + \frac{HP}{5} \cdot 0.35 + \frac{AF}{4} \cdot 0.25\right)$$
Where:
- $TTFA$: Time-to-First-Action in milliseconds.
- $HP$: Hesitation Pauses (cursor stationary over interactive elements for $> 3000\text{ ms}$).
- $AF$: Answer Flips (times an option was chosen and deselected).
Threshold: If $CFS \ge 0.65$ or $TTFA \ge 25000\text{ ms}$, trigger `COGNITIVE_OVERLOAD_PREEMPTION`.

---

## 3. PRISMA SCHEMA DEFINITION (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Student {
  id              String           @id @default(uuid())
  createdAt       DateTime         @default(now())
  lexicalBaseline String           // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  preferredMode   String           @default("TEXT") // "TEXT" | "VISUAL" | "AUDIO"
  masteryStates   MasteryState[]
  interactions    InteractionLog[]
}

model KnowledgeNode {
  id               String           @id
  label            String
  tier             Int
  description      String
  prerequisites    Prerequisite[]   @relation("TargetPrerequisites")
  dependents       Prerequisite[]   @relation("SourcePrerequisites")
  masteryStates    MasteryState[]
  problems         Problem[]
}

model Prerequisite {
  sourceId String
  targetId String
  source   KnowledgeNode @relation("SourcePrerequisites", fields: [sourceId], references: [id])
  target   KnowledgeNode @relation("TargetPrerequisites", fields: [targetId], references: [id])

  @@id([sourceId, targetId])
}

model Problem {
  id              String           @id @default(uuid())
  nodeId          String
  node            KnowledgeNode    @relation(fields: [nodeId], references: [id])
  textPrompt      String
  visualDataJson  String           // JSON for SVG/interactive canvas
  audioPromptText String
  expectedAnswer  String
  antiPatterns    String           // JSON mapping wrong answers to misconceptions
  interactions    InteractionLog[]
}

model MasteryState {
  id        String        @id @default(uuid())
  studentId String
  nodeId    String
  pMastery  Float         @default(0.1)
  isMastered Boolean      @default(false)
  updatedAt DateTime      @updatedAt
  student   Student       @relation(fields: [studentId], references: [id])
  node      KnowledgeNode @relation(fields: [nodeId], references: [id])

  @@unique([studentId, nodeId])
}

model InteractionLog {
  id                 String   @id @default(uuid())
  studentId          String
  problemId          String
  modalityUsed       String   // "TEXT" | "VISUAL" | "AUDIO"
  isCorrect          Boolean
  userSubmission     String
  timeToFirstAction  Int
  hesitationPauses   Int
  answerFlips        Int
  cognitiveFriction  Float
  diagnosedGapNodeId String?
  misconceptionLabel String?
  createdAt          DateTime @default(now())
  student            Student  @relation(fields: [studentId], references: [id])
  problem            Problem  @relation(fields: [problemId], references: [id])
}
```

## 4. DOMAIN SEED DATA & DAG TOPOLOGY (`src/lib/seed-data.ts`)
Populate a 5-node atomic Directed Acyclic Graph (DAG) for arithmetic reasoning:
- NODE_INT: "Integer Magnitude & Operations" (Tier 1)
- NODE_DIV: "Equal Partitioning & Division" (Tier 2, Prereq: NODE_INT)
- NODE_FRAC_CORE: "Part-Whole Fraction Representation" (Tier 3, Prereq: NODE_DIV)
- NODE_COMMON_DENOM: "Common Multiples & Equivalence" (Tier 4, Prereq: NODE_FRAC_CORE)
- NODE_FRAC_ADD: "Addition of Unlike Fractions" (Tier 5, Prereq: NODE_COMMON_DENOM)

Each node must include tri-modal content:
- Text Mode: Formatted word problem.
- Visual Mode: Interactive grid (e.g., interactive $3 \times 4$ slice blocks representing $1/3$ and $1/4$).
- Audio Mode: Speech synthesis narrative script.

Anti-Pattern Payload for NODE_FRAC_ADD:
- Input 2/7 for $1/3 + 1/4$: Maps to "ADDITIVE_DENOMINATOR_FALLACY" ("Added numerators and denominators straight across").
- Input 2/12: Maps to "MULTIPLIED_DENOMINATOR_WITHOUT_NUMERATOR_SCALING".

## 5. API CONTRACTS (ZOD SCHEMAS & IMPLEMENTATION)

### 5.1 POST `/api/onboarding`
Input Schema:
```typescript
const OnboardingRequest = z.object({
  rawUserInput: z.string().min(3),
});
```

### 5.2 POST `/api/diagnose`
Input Schema:
```typescript
const DiagnoseRequest = z.object({
  studentId: z.string(),
  problemId: z.string(),
  submission: z.string(),
  telemetry: z.object({
    timeToFirstAction: z.number(),
    hesitationPauses: z.number(),
    answerFlips: z.number(),
    activeModality: z.enum(["TEXT", "VISUAL", "AUDIO"]),
  }),
});
```

## 6. CLIENT COMPONENT SPECIFICATIONS

### 6.1 Invisible Telemetry Listener (`src/components/TelemetryTracker.tsx`)
High-frequency event listener wrapping the exercise canvas.

### 6.2 Tri-Modal Assessment Canvas (`src/components/ModalityCanvas.tsx`)
Renders conditionally based on `activeModality`.

### 6.3 Diagnostic React Flow HUD (`src/components/GraphHUD.tsx`)
Renders the 5-node DAG using `@xyflow/react`.

## 7. EXECUTION PROTOCOL FOR AGENT

Execute the build sequentially. Verify zero runtime errors at each stage:
1. Initialize Next.js 14 App Router project with dependencies: `@xyflow/react`, `zustand`, `lucide-react`, `prisma`, `@prisma/client`, `zod`.
2. Write and apply `prisma/schema.prisma`. Run `prisma db push`.
3. Create `src/lib/seed-data.ts` and write a seed script to load the 5-node DAG and tri-modal questions.
4. Implement the Bayesian Knowledge Tracing utility in `src/lib/bkt.ts`. Write unit tests verifying $P(L_t)$ updates.
5. Build API routes (`/api/onboarding`, `/api/diagnose`).
6. Build client telemetry engine and Zustand store in `src/lib/store.ts`.
7. Build the UI pages:
   - `/`: Zero-quiz conversational prompt.
   - `/learn`: Tri-modal learning canvas with invisible telemetry tracker.
   - `/dashboard`: Real-time React Flow knowledge graph and cognitive diagnostic HUD.
8. Verify end-to-end user journey: Onboarding -> Fail text problem with high hesitation -> Dynamic modality switch to visual -> Anti-pattern diagnosis -> Knowledge graph nodes turn red/amber in dashboard.
