# Implementation Plan: Guard phase acceptance

Track: `guard_phase_acceptance_20261118`
Spec: [./spec.md](./spec.md)

**All commits go on chore/guard-phase-acceptance. Push only to origin/chore/guard-phase-acceptance, never to main. Only the PM or Daniel merges.**

## Phase 1: Guard phase acceptance

- [x] Task 1.1: add a guard test that maps measure-phase-acceptance to the phase-acceptance route list, then change the map in the three guards.ts copies, run each package test command, run the parity checks, install the plugin, and prove the installed copy matches the repo build `8cf3719`
- [ ] Task 1.2: records and closeout
