import argparse
import contextlib
import importlib.util
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import types
from pathlib import Path

ROOT = Path('/home/daniebo/Desktop/measure')
RUN = ROOT / 'measure/runs/spec_review_gate_20261030'
BASE = '7d72b40665074a89f5be606935cad94a1ef1e4e9'
HEAD = '8a8efe2306f617c42aaae2abd71960d33bc0e9ad'
REL = 'skills/measure-orchestrator/scripts/measure_interphase_checks.py'

def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, text=True, check=True).stdout

def module_from_source(name, source):
    module = types.ModuleType(name)
    sys.modules[name] = module
    exec(compile(source, name, 'exec'), module.__dict__)
    return module

old = module_from_source('old_measure_checker', git('show', BASE + ':' + REL))
new = module_from_source('new_measure_checker', (ROOT / REL).read_text())
os.environ.update(RED_TEST_COMMAND='false', GREEN_TEST_COMMAND='true', PROJECT_LINT='true', PROJECT_CHECKS='true', PROJECT_TESTS='true')

def call(module, role, log):
    args = argparse.Namespace(repo=str(ROOT), role=role, track='spec_review_gate_20261030',
                              phase='Phase S4: Doc drift check in the weekly audit', baseline=BASE,
                              result_file=str(RUN / 'phase-acceptance-s4-8a8efe2.json'), log_file=str(log))
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        code = module.cmd_role_gate(args)
    return code, output.getvalue()

with tempfile.TemporaryDirectory(prefix='probe-final-2-', dir=RUN) as raw:
    folder = Path(raw)
    for label, body in [('no-line', ''), ('valid', 'dispositions: F1=FIX; F2=CONTEST(tests/test_x.py::test_empty)\n')]:
        log = folder / (label + '.txt')
        log.write_text('MEASURE_AGENT_RESULT\nrole: fixture\n' + body + 'END_MEASURE_AGENT_RESULT\n')
        for role in old.ROLE_ALIASES:
            before = call(old, role, log)
            after = call(new, role, log)
            assert before == after, (role, label, before, after)
        print('BACKWARD COMPATIBILITY PASS', label, len(old.ROLE_ALIASES), 'aliases')
    log = folder / 'invalid.txt'
    log.write_text('MEASURE_AGENT_RESULT\nrole: fixture\ndispositions: F1=fix\nEND_MEASURE_AGENT_RESULT\n')
    for role in sorted(set(new.ROLE_ALIASES.values())):
        code, output = call(new, role, log)
        assert code == 1 and 'invalid dispositions line' in output, (role, code, output)
    print('INVALID DISPOSITIONS PASS', len(set(new.ROLE_ALIASES.values())), 'canonical roles')
    log = folder / 'no-line.txt'
    for key in ('PROJECT_LINT', 'PROJECT_CHECKS', 'PROJECT_TESTS'):
        os.environ.pop(key)
    code, output = call(new, 'final-acceptance', log)
    assert code == 1
    for key in ('PROJECT_LINT', 'PROJECT_CHECKS', 'PROJECT_TESTS'):
        assert key + ' is required but unset' in output
    print('UNSET FINAL GATES PASS: each missing gate fails final acceptance')

commits = git('rev-list', '--reverse', BASE + '..' + HEAD).splitlines()
for sha in commits:
    paths = {}
    for line in git('ls-tree', '-r', sha, '--', 'skills/measure', 'claude-skills/measure').splitlines():
        identity, path = line.split('\t', 1)
        if path.startswith('skills/measure/'):
            paths.setdefault(path[len('skills/measure/'):], {})['canonical'] = identity
        elif path.startswith('claude-skills/measure/'):
            paths.setdefault(path[len('claude-skills/measure/'):], {})['bundle'] = identity
    assert paths and all(record.get('canonical') == record.get('bundle') for record in paths.values()), sha
print('COMMIT BUNDLE PARITY PASS', len(commits), 'commits')

catalog = (ROOT / 'measure/anti-patterns.md').read_text()
entry = catalog.split('## A11 — Doc-to-code drift after closeout\n', 1)[1].split('\n---\n', 1)[0]
recipe = entry.split('```bash\n', 1)[1].split('\n```', 1)[0]
result = subprocess.run(['bash', '-c', recipe], cwd=ROOT, capture_output=True, text=True)
assert result.returncode == 0
print('A11 RECIPE EXIT', result.returncode)
print(result.stdout, end='')
roles = list((ROOT / 'agents').glob('measure-*.md'))
assert len(roles) == 14
for path in [ROOT / 'skills/measure-orchestrator/references/anti-pattern-catalog.md', ROOT / 'measure/anti-patterns.md']:
    assert len(re.findall(r'^## A[0-9]+ — ', path.read_text(), re.M)) == 11
print('LABELED COUNTS PASS: 14 roles and 11 catalog entries')
assert git('rev-parse', 'HEAD').strip() == HEAD
print('FINAL HEAD PASS', HEAD)
payload = json.loads((RUN / 'final-acceptance-8a8efe2.json').read_text())
for field, values in payload.items():
    if isinstance(values, list):
        for value in values:
            assert isinstance(value, str) and re.match(r'^.+:[1-9][0-9]*: \S', value), (field, value)
assert not new.validate_audit_payload(payload, 'final-acceptance')
assert payload['status'] == 'pass' and payload['retry_recommendation'] == 'none'
assert not payload['blocking_findings']
for field in new.HARD_BLOCKING_FIELDS:
    assert payload[field] == []
log_text = (RUN / 'final-acceptance-8a8efe2.log').read_text()
log_lines = log_text.splitlines()
assert log_lines.count('MEASURE_AGENT_RESULT') == 1
assert log_lines.count('END_MEASURE_AGENT_RESULT') == 1
assert not any(line.startswith('dispositions:') for line in log_lines)
assert not new.dispositions_feedback(str(RUN / 'final-acceptance-8a8efe2.log'))
print('FINAL ARTIFACT FORMAT PASS')
