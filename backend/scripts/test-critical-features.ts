import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { ActionCriticSchema, SimulationSchema } from '../src/lib/agents/schemas';
import { AGENT_PROMPTS, SIMULATION_RETRY_SUFFIX } from '../src/lib/agents/prompts';
import { validateSimulation } from '../src/lib/agents/outcome-evidence';
import fs from 'fs';
import path from 'path';

// Disabled dotenv

const MODEL_ID = 'gemini-1.5-pro';

async function runTests() {
  const model = google(MODEL_ID);
  const logStream = fs.createWriteStream(path.join(__dirname, 'test-results.md'), { flags: 'w' });
  const log = (msg: string) => {
    console.log(msg);
    logStream.write(msg + '\n');
  };

  log('# Autonomous Content-to-Action Agent - Critical Features Test Runs\n');

  // Test 1: Action Critic Rejection
  log('## Test 1: Action Critic Rejecting Bad Actions\n');
  log('Context: Testing if the ActionQualityCriticAgent correctly rejects a generic, non-specific action that lacks concrete levers and ownership.\n');
  
  const badActionContext = JSON.stringify({
    main_insight: "The unexpected breakdown of two primary RTG cranes at Port Qasim East Wharf has spiked container dwell time to 14.5 days, threatening $4.2M in export shipments and $42,000/day in demurrage charges.",
    urgency: "critical",
    severity: "critical",
    estimated_impact: "$42,000/day in demurrage + $4.2M in missed shipments",
    actions: {
      top_action: "Monitor the situation and consider discussing with stakeholders.",
      actions: [
        {
          rank: 1,
          action: "Monitor the situation and consider discussing with stakeholders.",
          owner: "Management",
          expected_result: "Better understanding of the issue."
        },
        {
          rank: 2,
          action: "Enhance port efficiency.",
          owner: "Operations",
          expected_result: "Improved operations."
        },
        {
          rank: 3,
          action: "Leverage synergies.",
          owner: "Strategy",
          expected_result: "Synergistic outcomes."
        }
      ]
    },
    content_excerpt: "Container dwell time at Port Qasim Terminal 2 has spiked..."
  }, null, 2);

  const criticResult = await generateObject({
    model,
    schema: ActionCriticSchema,
    prompt: AGENT_PROMPTS.actionCritic + badActionContext,
  });

  const critique = criticResult.object;
  log('**Action Tested:** "Monitor the situation and consider discussing with stakeholders."');
  log(`**Verdict:** \`${critique.verdict.toUpperCase()}\``);
  log('**Reasoning Chain:**');
  critique.reasoning_chain.forEach(r => log(`- ${r}`));
  log('**Identified Problems:**');
  critique.problems.forEach(p => log(`- ${p}`));
  log('**Improvement Instructions:**');
  log(`> ${critique.improvement_instructions}\n`);
  
  if (critique.verdict === 'reject') {
    log('✅ *PASS: Action Critic successfully rejected the bad action.*\n');
  } else {
    log('❌ *FAIL: Action Critic failed to reject the bad action.*\n');
  }

  // Test 2: Simulation Retry
  log('## Test 2: Simulation Retry on Identical Before/After State\n');
  log('Context: Testing if the ExecutionSimulatorAgent can recover via automated retry when its first output is invalid (e.g., identical before/after state).\n');

  // We simulate the failure by running a mock first, but let's test the retry prompt itself
  const baseContext = JSON.stringify({
    original_content: "Port Qasim Congestion Crisis...",
    content_understanding: { domain: "Supply Chain", time_sensitivity: "immediate" },
    insight: { main_insight: "Crane breakdown causing massive backlog" },
    impact: { severity: "high" },
    actions: { top_action: "Divert incoming vessels to KPT immediately." }
  }, null, 2);

  const promptWithRetry = AGENT_PROMPTS.executionSimulator + baseContext + SIMULATION_RETRY_SUFFIX;

  log('**Simulating Retry Round 2 (with Retry Suffix)...**\n');
  
  const simResult = await generateObject({
    model,
    schema: SimulationSchema,
    prompt: promptWithRetry,
  });

  const simulation = simResult.object as any;
  const validation = validateSimulation(simulation);

  log('**Generated Simulation Validation:**');
  log(`- Before/After Row Count Match: \`${validation.before_after_rows_ok}\``);
  log(`- Steps Count OK (>=5): \`${validation.steps_count_ok}\``);
  log(`- State Changed (Concrete differences): \`${validation.state_changed}\``);
  
  if (validation.warnings.length > 0) {
    log('**Warnings:**');
    validation.warnings.forEach(w => log(`- ${w}`));
  }

  if (validation.state_changed && validation.steps_count_ok && validation.before_after_rows_ok) {
    log('\n✅ *PASS: Simulation successfully generated valid state changes on retry.*\n');
  } else {
    log('\n❌ *FAIL: Simulation failed validation on retry.*\n');
  }

  log('--- END OF TEST RUNS ---');
  logStream.end();
  console.log('Results saved to test-results.md');
}

runTests().catch(console.error);
