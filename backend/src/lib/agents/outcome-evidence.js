"use strict";
// ============================================================
// Outcome evidence — deterministic before/after + KPI layer
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSimulation = validateSimulation;
exports.buildOutcomeEvidence = buildOutcomeEvidence;
function rowDiffs(before, after) {
    const out = [];
    const maxRows = Math.min(before.length, after.length, 8);
    for (let i = 0; i < maxRows; i++) {
        const b = before[i];
        const a = after[i];
        const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
        for (const k of keys) {
            const bv = b[k];
            const av = a[k];
            if (bv !== av) {
                out.push(`Row ${i + 1} · ${k}: ${String(bv)} → ${String(av)}`);
            }
        }
    }
    return out.slice(0, 16);
}
function buildKpis(highlights, simulation) {
    var _a, _b, _c, _d, _e, _f;
    const kpis = [];
    const take = highlights.slice(0, 3);
    for (const h of take) {
        const m = h.match(/^Row (\d+) · (.+): (.+) → (.+)$/);
        if (m) {
            kpis.push({
                metric: m[2].trim(),
                before_snapshot: m[3].trim(),
                after_snapshot: m[4].trim(),
            });
        }
    }
    if (kpis.length === 0) {
        kpis.push({
            metric: 'Simulation rows (before → after)',
            before_snapshot: String((_b = (_a = simulation.before_state) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0),
            after_snapshot: String((_d = (_c = simulation.after_state) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0),
        });
        kpis.push({
            metric: 'Execution steps (planned)',
            before_snapshot: '—',
            after_snapshot: String((_f = (_e = simulation.steps) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0),
        });
        kpis.push({
            metric: 'Top action (simulated)',
            before_snapshot: '—',
            after_snapshot: simulation.action_taken.length > 120
                ? `${simulation.action_taken.slice(0, 117)}…`
                : simulation.action_taken,
        });
    }
    return kpis.slice(0, 4);
}
function validateSimulation(simulation) {
    var _a, _b, _c;
    const warnings = [];
    const before = (_a = simulation.before_state) !== null && _a !== void 0 ? _a : [];
    const after = (_b = simulation.after_state) !== null && _b !== void 0 ? _b : [];
    const steps = (_c = simulation.steps) !== null && _c !== void 0 ? _c : [];
    const before_after_rows_ok = before.length > 0 && after.length > 0;
    if (!before_after_rows_ok) {
        warnings.push('before_state or after_state is empty');
    }
    const steps_count_ok = steps.length >= 5;
    if (!steps_count_ok) {
        warnings.push(`Expected ≥5 simulation steps, got ${steps.length}`);
    }
    const highlights = before_after_rows_ok ? rowDiffs(before, after) : [];
    const state_changed = highlights.length > 0;
    if (before_after_rows_ok && !state_changed) {
        warnings.push('before_state and after_state have no differing fields (weak demo signal)');
    }
    return {
        before_after_rows_ok,
        steps_count_ok,
        state_changed,
        tools_all_acknowledged: true,
        warnings,
    };
}
function buildOutcomeEvidence(simulation, toolInvocations) {
    var _a, _b;
    const highlights = rowDiffs((_a = simulation.before_state) !== null && _a !== void 0 ? _a : [], (_b = simulation.after_state) !== null && _b !== void 0 ? _b : []);
    const toolsBad = toolInvocations.filter((t) => t.status !== 'ok').length;
    const base = validateSimulation(simulation);
    const warnings = [...base.warnings];
    if (toolsBad > 0) {
        warnings.push(`${toolsBad} mock tool invocation(s) returned non-ok status`);
    }
    const simulation_validation = Object.assign(Object.assign({}, base), { tools_all_acknowledged: toolsBad === 0, warnings });
    const dashboard_kpis = buildKpis(highlights, simulation);
    if (toolInvocations.length > 0) {
        dashboard_kpis.push({
            metric: 'Mock tool calls (sandbox)',
            before_snapshot: '0 executed',
            after_snapshot: `${toolInvocations.length} audited`,
        });
    }
    return {
        diff_highlights: highlights,
        dashboard_kpis: dashboard_kpis.slice(0, 5),
        simulation_validation,
    };
}
