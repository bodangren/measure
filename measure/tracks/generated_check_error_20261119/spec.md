# Specification: Generated check error names path and state

## Overview

Forge saw an unset error for a committed `gates.json`. The likely cause is a missing, unreadable, or keyless file at the `--repo` path.

## Decided change

Read the command with one `gate_value` call. The env var wins over `gates.json`. The lookup order already holds and stays.

When the command is empty, fail with the key, the absolute `gates.json` path, and the file state. The state is `file missing`, `file unreadable or not a JSON object`, or `key absent`.
