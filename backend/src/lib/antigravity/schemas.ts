// ============================================================
// Antigravity-aligned structured planning (Manager surface)
// Mirrors Google Antigravity: mission → tasks → artifacts → tools
// Ref: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/
// ============================================================

import { z } from 'zod';

export const AntigravityWorkPlanSchema = z.object({
  mission: z
    .string()
    .describe('One sentence: what outcome this managed run must produce for the user'),
  reasoning_chain: z
    .array(z.string())
    .min(3)
    .max(7)
    .describe('Ordered reasoning steps (planning trace) before execution'),
  planned_tasks: z
    .array(
      z.object({
        task_id: z.string(),
        title: z.string(),
        manager_surface: z
          .enum(['planning', 'analysis', 'reasoning', 'tools', 'verification'])
          .describe('Which Antigravity-style surface owns this task'),
        depends_on: z.array(z.string()).describe('task_ids that must finish first; empty for root'),
        expected_artifact: z
          .string()
          .describe('Tangible deliverable: table, ranked actions, simulation trace, etc.'),
      })
    )
    .length(6)
    .describe('Exactly six tasks — one per downstream specialist agent in order'),
  tool_integration_notes: z
    .string()
    .describe('How external tools/APIs (Sheets, CRM, notifications) will be used in simulation'),
});

export type AntigravityWorkPlanOutput = z.infer<typeof AntigravityWorkPlanSchema>;
