# Audit contract fix2 evidence

Date: 2026-11-10

Doc: Inputs #1 and Detectors item 3 are proposals; Outputs defines the PROPOSAL: candidate format (nonblocking finding, path and assertion, applied by the orchestrator or a track).
Tests: measure-orchestrator-audit alias gate passes; the S4 doc-drift suite asserts the PROPOSAL format and the absence of 'entries get appended' and 'you may write a focused guard test' (31 checks).
srg 11/11; CLI 13/13 (after the registry sync); node 318/318; parity ok.
