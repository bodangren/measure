# Skill-doc contract check evidence

Date: 2026-11-09

New test: bash tests/dsh/test-skill-docs.sh -> [PASS] real repository; [PASS] oversized description rejected; [PASS] angle-bracket description rejected; [PASS] folder link rejected.
Descriptions: skills/build-graph 337, skills/measure 462, skills/measure-orchestrator 375 characters (all <= 1024, no '<'/'>').
claude-skills/: no symbolic links.
CLI suite: 13 passed / 0 failed; srg 11/11; node 301/301; parity ok.
