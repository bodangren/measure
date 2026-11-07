# Commit guard nested fix2 evidence

Date: 2026-11-09

Widened recognition: MAX_NESTED_DEPTH=3 (four levels); eval joins all words; shell basename with -c/-lc/-x -c//bin/bash; git stage in substitutions; unreadable inner fails closed.
Tests: zsh -c, bash -lc, /bin/bash -c, bash -x -c, both multi-word eval forms, X=$(git stage ...), five-level nesting -> all true, unreadable inner -> all true, untracked integration path. Node 308/308.
Parity ok (adapter-local); CLI 13/13; srg 11/11.
Residual: arbitrary wrapper scripts and shell functions only.
