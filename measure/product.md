# Product Definition: Measure

## Overview

Measure is a spec-driven development framework for AI-assisted software projects. It organizes development work into structured, trackable units called "tracks" and enforces a consistent lifecycle of: **Context → Spec & Plan → Implement**.

The philosophy is simple: control your code. By treating project context as a managed artifact alongside your code, Measure transforms your repository into a single source of truth that drives every AI agent interaction with deep, persistent project awareness.

## Target Users

Software developers who use AI coding assistants (Gemini CLI, Claude Code, and similar tools) and want a structured, repeatable approach to AI-assisted feature development — particularly those who work in teams or on long-running projects where context continuity matters.

## Core Problem

AI coding assistants excel at writing code but lack persistent project context, consistent process discipline, and structured traceability. Without structure, AI-generated code drifts from product goals, tech stack choices, and quality standards. Work is hard to audit, review, or revert at a logical level.

## Key Features

- **Setup**: Bootstraps a project with product definition, tech stack, workflow, and style guides as managed artifacts
- **New Track**: Interactive spec and plan generation for features, bugs, and chores via guided questions
- **Implement**: TDD-driven task execution following the project's defined workflow, with phase checkpoints
- **Review**: Code review against project standards, style guides, and the original plan
- **Status**: High-level project progress overview across all tracks
- **Revert**: Git-aware rollback by track, phase, or task (understands logical units, not just commit hashes)

## Distribution

- **Claude Skills**: Packaged as a `.skill` bundle for use with Claude Code (`claude-skills/measure/`)
- **Gemini CLI Extension**: Published as a Gemini CLI extension (`codex-skills/measure/`)

## Success Metrics

- Tracks are implemented to spec with minimal unplanned deviation
- All work is traceable through git history and plan files
- AI agents consistently follow project style, tech stack, and workflow preferences
- Teams can onboard new contributors by pointing them at the measure context files
