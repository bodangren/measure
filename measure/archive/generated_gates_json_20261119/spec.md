# Specification: Closeout generated check reads gates.json

## Overview

The closeout gate fails with unset when `GENERATED_CHECK_COMMAND` is absent from the environment. The project holds the command in `measure/gates.json`.

## Decided change

Read the env var first. When missing, read `GENERATED_CHECK_COMMAND` from `measure/gates.json` of the `--repo` project. Reuse the `gate_value` reader used by `RED_TEST_COMMAND`. When neither holds it and `measure/generated` exists, fail and name the key and `measure/gates.json`. Keep the INFO skip when no `measure/generated` exists.
