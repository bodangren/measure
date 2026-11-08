# Specification: DSH Measure band render test

## Overview

The DSH plugin's browser half (`client.js`) is exercised only by static regex checks and the
live check: no test ever executes the bundle or renders a component, so a render-time
regression (a missing band row, a broken conditional, a wrong i18n label, a button without
its handler) can only be found by a human looking at the band. The known-limits row records
this ("no DOM/integration test") and notes that a DOM test would need a test-only dependency
the project does not want.

This track adds a dependency-free render harness: a fake `window.__ModuleLoader__` captures
the factory, a miniature React (createElement, useState, useEffect, Component) renders the
registered components to a plain element tree, and stubbed `fetch`/`setInterval` feed the
band and panel their Host views. The tests then assert the tree text and props the user
actually sees — the band line, its full-text title, the guards/mode/goal rows, setup
buttons, problem rows, the zh labels, the panel's empty state, session select, and status
block — plus the `apply(ctx)` registrations (slot ids/order, locale, command decoration).

## Functional Requirements

- **FR-1 (harness).** `plugins/dsh-measure-guard/tests/client-render.test.js` loads
  `client.js` through a stub module loader (no `document`, no jsdom, no build step), renders
  function and class components with a miniature React (hooks keyed by component position,
  effects with dependency comparison, re-render loop for state updates), and stubs
  `fetch`, `setInterval`, and `clearInterval`.
- **FR-2 (band assertions).** With a Host view the band renders the compact line, the
  `title` full text, the guards/mode/goal rows, the setup buttons (while unanswered), and
  the problem rows; without a view it renders nothing; the session id reaches
  `/measure-guard/state?sessionId=…` and the poll interval is 2000 ms; clicking a setup
  button POSTs `{ sessionId, choice }` and refetches.
- **FR-3 (panel assertions).** With no sessions the panel renders the empty state; with a
  session list it renders the session title in the select, the guards row, and the status
  `pre`; the refresh button is disabled when there is no session.
- **FR-4 (apply registrations).** `apply(ctx)` registers the band at
  `conversation.input.dock` (id measure-guard, order 20), the keyed `main` panel, the
  sidebar entry, the locale dictionaries, and the `measure-status` action whose `run()`
  selects the measure panel; every `slots.inject` callback runs.
- **FR-5 (i18n).** The zh dictionary renders its own labels while the shared band text stays
  as the Host sends it.
- **FR-6 (verification).** The node suite grows by the new tests and stays green, both parity
  gates ok, srg 11/11, CLI 13/13; the installed plugin is reloaded and the live check
  passes; the known-limits row records the closure; the track is archived.

## Non-Functional Requirements

- **NFR-1 (no new dependency).** Only Node built-ins; the harness is test-local and reads
  the real `client.js` file.
- **NFR-2 (no production change).** `client.js` is not modified; the test renders exactly
  the shipped bundle.

## Acceptance Criteria (track level)

- Given the shipped bundle, Then the captured factory renders the band with the Host view
  and the panel with a session list without any DOM library.
- Given the zh dictionary, Then the band's setup buttons use the zh labels.
- Given `apply(ctx)`, Then each slot registration and the command decoration is exercised.
