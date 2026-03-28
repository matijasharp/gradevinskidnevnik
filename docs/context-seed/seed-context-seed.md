# SEED Repo Context Seed

## Snapshot
- Repo path: `repos/seed-main`
- Package: `@chrisai/seed`
- Version: 0.1.3 (`repos/seed-main/package.json`)
- Entry point: `seed.md` (Skillsmith-compliant entry)
- CLI installer: `bin/install.js`
- License: MIT (`repos/seed-main/LICENSE`)

## What SEED is
- Purpose: typed project incubator for Claude Code that guides ideation, produces a populated PLANNING.md, and graduates projects into buildable directories.
- Core promise: type-first guided exploration, coach persona, structured planning outputs ready for PAUL handoff.
- SEED is markdown-only at runtime (no hooks or MCP servers required). Install script just copies files into the Claude commands directory.

## Commands and routing
- Primary commands (from `seed.md`, `README.md`):
  - `/seed` (default ideation)
  - `/seed graduate`
  - `/seed launch`
  - `/seed status`
  - `/seed add-type`
- Task routing lives in `seed.md` and delegates to `tasks/*.md`.

## Ideation flow (/seed)
- Task file: `tasks/ideate.md`.
- Steps:
  - Determine project type first (application, workflow, client, utility, campaign).
  - Create `projects/{name}/` and collect type-specific context from `data/{type}/guide.md` and `data/{type}/config.md`.
  - Coach persona: collaborative, type-appropriate rigor (tight/standard/deep/creative).
  - Optional skill loadout recommendations from `data/{type}/skill-loadout.md`.
  - Generate `projects/{name}/PLANNING.md` using `templates/planning-{type}.md`.
  - Reference `checklists/planning-quality.md` before output.
  - Update `.base/ACTIVE.md` if BASE is present.

## Graduation flow (/seed graduate)
- Task file: `tasks/graduate.md`.
- Inputs: a project in `projects/{name}/` with PLANNING.md.
- Quality gate: `checklists/planning-quality.md`.
- Outputs:
  - `apps/{name}/` created.
  - `apps/{name}/README.md` synthesized (not copied) from PLANNING.md.
  - Git repo initialized and initial commit created.
  - `projects/{name}/PLANNING.md` updated with graduation note.
  - `.base/ACTIVE.md` updated if present.

## Launch flow (/seed launch)
- Task file: `tasks/launch.md`.
- Wraps graduation + optional PAUL init.
- Checks `~/.claude/paul-framework/` availability before headless PAUL init.
- Headless PAUL init uses `apps/{name}/README.md` and `projects/{name}/PLANNING.md` as context (no re-asking).

## Status and type extension
- `/seed status`: scans `projects/` and `apps/` to report ideation pipeline (`tasks/status.md`).
- `/seed add-type`: adds a new type by creating `data/{type}/guide.md`, `config.md`, `skill-loadout.md` (`tasks/add-type.md`).

## Type system (data/{type}/)
- Types included: application, workflow, client, utility, campaign (`data/*`).
- Each type has:
  - `guide.md`: conversation sections with Explore + Suggest prompts.
  - `config.md`: rigor level, demeanor, required vs optional sections.
  - `skill-loadout.md`: recommended ecosystem tools.
- Rigor levels:
  - application: deep (`data/application/config.md`).
  - workflow, client: standard (`data/workflow/config.md`, `data/client/config.md`).
  - utility: tight (`data/utility/config.md`).
  - campaign: creative (`data/campaign/config.md`).

## Planning templates (templates/)
- Type-specific PLANNING.md templates:
  - `templates/planning-application.md`
  - `templates/planning-workflow.md`
  - `templates/planning-client.md`
  - `templates/planning-utility.md`
  - `templates/planning-campaign.md`
- Templates include metadata blocks (Type, Skill Loadout, Quality Gates) and sections aligned to guide/config requirements.

## Quality gate
- `checklists/planning-quality.md` defines universal checks, type-specific checks, and PAUL-readiness checks.
- Used by `tasks/graduate.md` and `tasks/launch.md`.

## Installation and distribution
- CLI installer: `bin/install.js`.
- Install targets:
  - Global (default): `~/.claude/commands/seed/`.
  - Local: `./.claude/commands/seed/`.
  - Custom config dir: `--config-dir` or `CLAUDE_CONFIG_DIR`.
- Installed files: `seed.md`, `tasks/`, `data/`, `templates/`, `checklists/`.

## Integrations
- PAUL: `/seed launch` performs headless PAUL init and expects PAUL installed.
- BASE: ideation/graduation update `.base/ACTIVE.md` if present.
- AEGIS and Skillsmith are referenced as ecosystem tools but not required.

## Repo structure
- `seed.md`: entry point, routing, persona, command map.
- `tasks/`: ideate, graduate, launch, status, add-type workflows.
- `data/`: type-specific guides/config/loadouts.
- `templates/`: PLANNING.md templates per type.
- `checklists/`: planning quality gate.
- `bin/`: installer.
- `README.md`: product overview and install instructions.
