# PAUL Repo Context Seed

## Snapshot
- Repo path: `repos/paul-main`
- Package: `paul-framework` (CLI installer)
- Version: 1.2.0 (`repos/paul-main/package.json`)
- Entry: `npx paul-framework` -> `bin/install.js`
- License: MIT (`repos/paul-main/LICENSE`)

## What PAUL is
- Purpose: structured AI-assisted development for Claude Code using a strict Plan-Apply-Unify loop.
- Positioning: prioritize quality, traceability, and in-session context over parallel subagent execution.
- Primary artifacts: PLAN.md (executable plan), SUMMARY.md (reconciliation), STATE.md (current status).
- Core principle: acceptance criteria are first-class and every plan must be closed with UNIFY.

## Core loop behavior
- PLAN: define objective, acceptance criteria, tasks, boundaries, verification; wait for explicit approval.
- APPLY: execute tasks sequentially with Execute/Qualify (E/Q) loop and explicit status reporting (DONE, DONE_WITH_CONCERNS, NEEDS_CONTEXT, BLOCKED).
- UNIFY: reconcile plan vs actual; create SUMMARY.md; update STATE.md and ROADMAP.md; transition phases when last plan is complete.
- Loop artifacts and expectations live in `src/commands/*.md`, `src/workflows/*.md`, `src/templates/*.md`, `src/references/*.md`.

## Installation and distribution
- CLI installer: `bin/install.js`.
- Supports global or local install:
  - Global: `~/.claude/` (or `CLAUDE_CONFIG_DIR` / `--config-dir`).
  - Local: `./.claude/` in current project.
- Copies:
  - Commands to `commands/paul/`.
  - Framework content (templates/workflows/references/rules) to `paul-framework/`.
- Rewrites markdown path prefixes so @-references match actual install path.

## Command system (26 commands)
- Commands are thin wrappers in `src/commands/*.md` with YAML frontmatter.
- Logic lives in workflows (`src/workflows/*.md`), referenced via `<execution_context>`.
- Core categories (from `src/commands/help.md`):
  - Core loop: init, plan, apply, unify, help, status (deprecated).
  - Session: pause, resume, progress, handoff.
  - Roadmap: add-phase, remove-phase.
  - Milestone: milestone, complete-milestone, discuss-milestone.
  - Pre-planning: discuss, assumptions, discover, consider-issues.
  - Research: research, research-phase.
  - Specialized: flows, config, map-codebase.
  - Quality: verify, plan-fix, audit.

## Generated project structure (.paul/)
- `.paul/PROJECT.md`: product brief and requirements.
- `.paul/ROADMAP.md`: phase and milestone plan.
- `.paul/STATE.md`: loop position, decisions, blockers, continuity.
- `.paul/paul.json`: satellite manifest for discovery.
- `.paul/config.md`: optional integrations and audit settings.
- `.paul/SPECIAL-FLOWS.md`: required skills per work type.
- `.paul/phases/NN-name/` with `NN-PP-PLAN.md`, `NN-PP-SUMMARY.md`, optional `NN-PP-AUDIT.md` and `NN-PP-UAT.md`.

## Templates (document structure)
- Primary templates in `src/templates/`:
  - `PROJECT.md` (requirements and constraints).
  - `PLAN.md` (frontmatter + objective, acceptance_criteria, tasks, boundaries, verification).
  - `SUMMARY.md` (plan reconciliation + AC results + deviations).
  - `STATE.md` (live project status and loop position).
  - `ROADMAP.md` (phases, milestones, decimal phase insertions).
  - `SPECIAL-FLOWS.md` (skills required and audit checklist).
  - `CONTEXT.md` (phase discussion handoff).
  - `UAT-ISSUES.md` (manual testing issues log).
- Codebase mapping templates live under `src/templates/codebase/` (stack, architecture, structure, conventions, testing, integrations, concerns).

## Workflow highlights
- Init (`src/workflows/init-project.md`): conversational setup, type-adapted requirements (application/campaign/workflow/other), optional SEED handoff, creates .paul structure.
- Plan (`src/workflows/plan-phase.md`): scope classification (quick-fix/standard/complex), optional skills section, coherence checks, optional enterprise audit routing.
- Apply (`src/workflows/apply-phase.md`): E/Q loop, strict checkpoint handling, diagnostic failure routing (intent/spec/code).
- Unify (`src/workflows/unify-phase.md`): summary creation, state updates, mandatory phase transition workflow (`src/workflows/transition-phase.md`).
- Verify (`src/workflows/verify-work.md`): user-led UAT with issue classification and per-plan UAT logging.
- Map-codebase (`src/workflows/map-codebase.md`): parallel explore agents generate .paul/codebase docs.
- Quality gate (`src/workflows/quality-gate.md`): optional SonarQube scan and update of CONCERNS.md.

## Rules and constraints
- Command structure rules: `src/rules/commands.md` (frontmatter, section order, thin wrappers).
- Workflow rules: `src/rules/workflows.md` (XML sections, step naming, no frontmatter).
- Template rules: `src/rules/templates.md` (placeholders, structure conventions).
- Style rules: `src/rules/style.md` (imperative tone, no filler, naming conventions, BDD ACs).
- Reference rules: `src/rules/references.md` (teaching-oriented docs with anti-patterns).

## CARL integration
- Domain rules in `src/carl/PAUL` and `src/carl/PAUL.manifest`.
- Enforces: load command+workflow before execution, no APPLY without approved plan, mandatory UNIFY, respect boundaries, log blockers, verify state consistency at phase transitions.

## Quality and verification mechanics
- Acceptance criteria are BDD format; tasks must include files, action, verify, done.
- E/Q loop mandates fresh verification evidence before completion claims.
- Checkpoints:
  - `checkpoint:human-verify` for visual/UX validation.
  - `checkpoint:decision` for architectural choices.
  - `checkpoint:human-action` only when CLI/API is impossible.
- UAT flows capture issues in per-plan UAT files and route to plan-fix or re-plan based on classification.

## Integrations
- SonarQube optional integration via `.paul/config.md` (quality gate workflow).
- Enterprise plan audit optional via `enterprise_plan_audit` config and `/paul:audit`.
- SEED integration: init can recommend SEED for complex projects and import PLANNING.md.

## Repo structure
- `bin/`: installer (`bin/install.js`).
- `src/commands/`: command definitions (Markdown with frontmatter).
- `src/workflows/`: detailed execution workflows.
- `src/templates/`: document templates.
- `src/references/`: conceptual guides (plan format, loop phases, context mgmt, checkpoints).
- `src/rules/`: authoring rules for commands/workflows/templates/references.
- `src/carl/`: CARL domain rule files.
- `assets/`: docs assets (SVG).
- `PAUL-VS-GSD.md`: comparison and positioning.

## Notable design choices
- Plans are executable prompts, not prose; missing Files/Action/Verify/Done means the task is invalid.
- Single-next-action routing (progress/resume) to reduce decision fatigue.
- Subagents reserved for discovery/research, not execution.
- Strong audit trail: SUMMARY.md, STATE.md, ROADMAP.md always updated at loop closure.
