import ast
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path('/home/daniebo/Desktop/measure')
RUN = ROOT / 'measure/runs/spec_review_gate_20261030'
BASE = '7d72b40665074a89f5be606935cad94a1ef1e4e9'
HEAD = '8a8efe2306f617c42aaae2abd71960d33bc0e9ad'
CHECKER = ROOT / 'skills/measure-orchestrator/scripts/measure_interphase_checks.py'

def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], text=True, capture_output=True)

def load_checker():
    spec = importlib.util.spec_from_file_location('measure_final_checker', CHECKER)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module

def verify():
    checker = load_checker()
    assert git('rev-parse', 'HEAD').stdout.strip() == HEAD
    assert git('merge-base', '--is-ancestor', BASE, HEAD).returncode == 0
    plan = (ROOT / 'measure/tracks/spec_review_gate_20261030/plan.md').read_text()
    headings = re.findall(r'^## (Phase S[1-4]: .+)', plan, re.M)
    passing = {}
    for path in sorted(RUN.glob('phase-acceptance-*.json')):
        payload = json.loads(path.read_text())
        print('PHASE RESULT', path.name, payload['status'])
        if payload['status'] != 'pass':
            continue
        errors = checker.validate_audit_payload(payload, 'phase-acceptance')
        assert not errors, (path.name, errors)
        audited = payload['audited_head_sha']
        for field in ('phase_base_sha', 'role_base_sha'):
            value = payload[field]
            assert git('merge-base', '--is-ancestor', value, audited).returncode == 0
        assert git('merge-base', '--is-ancestor', audited, HEAD).returncode == 0
        phase = re.search(r's([1-4])', path.name).group(1)
        passing.setdefault(phase, []).append(path.name)
        print('ANCESTRY PASS', payload['phase_base_sha'], payload['role_base_sha'], audited)
    assert len(headings) == 4
    assert set(passing) == {'1', '2', '3', '4'}
    assert all(len(paths) == 1 for paths in passing.values())
    latest = json.loads((RUN / passing['4'][0]).read_text())
    assert latest['audited_head_sha'] == HEAD
    checked_heads = 0
    for path in sorted(RUN.glob('*.json')):
        payload = json.loads(path.read_text())
        audited = payload.get('audited_head_sha')
        if not audited:
            continue
        assert git('merge-base', '--is-ancestor', audited, HEAD).returncode == 0, path.name
        for field in ('phase_base_sha', 'role_base_sha', 'track_base_sha', 'baseline_sha'):
            value = payload.get(field)
            if value:
                assert git('merge-base', '--is-ancestor', value, audited).returncode == 0, (path.name, field)
        checked_heads += 1
    print('ALL RECORDED AUDIT ANCESTRY PASS', checked_heads)
    tasks = re.findall(r'^- \[([^]]+)\] Task ([0-9.]+): (.+)', plan, re.M)
    assert len(tasks) == 19
    for marker, number, text in tasks:
        assert marker == 'x', (number, marker)
        sha = re.search(r'\b[0-9a-f]{7,40}\b', text).group(0)
        assert git('cat-file', '-t', sha).stdout.strip() == 'commit'
        assert git('merge-base', '--is-ancestor', sha, HEAD).returncode == 0
        note = git('notes', 'show', sha)
        assert note.returncode == 0 and note.stdout.strip(), number
        print('TASK PASS', number, sha, note.stdout.strip())
    print('A5 MATCHES')
    for number, line in enumerate(plan.splitlines(), 1):
        if re.search(r'PASS=[0-9]+.*FAIL=0|all checks pass', line):
            print(number, line)
    refs = []
    own_refs = []
    for path in sorted((ROOT / 'tests').rglob('*')):
        if not path.is_file() or '__pycache__' in path.parts:
            continue
        text = path.read_text(errors='replace')
        for number, line in enumerate(text.splitlines(), 1):
            for track in re.findall(r'measure/tracks/([a-z_0-9-]+)/', line):
                archived = (ROOT / 'measure/archive' / track).exists()
                active = (ROOT / 'measure/tracks' / track).exists()
                refs.append((str(path.relative_to(ROOT)), number, track, archived, active))
                assert not (archived and not active), refs[-1]
            if 'measure/tracks/spec_review_gate_20261030/' in line:
                own_refs.append((str(path.relative_to(ROOT)), number, line))
    assert not own_refs
    print('A9 PASS', refs)
    assert not (ROOT / 'measure/doctor.sh').exists()
    print('DOCTOR NOT APPLICABLE: no `measure/doctor.sh` in this repository')
    old_source = git('show', BASE + ':skills/measure-orchestrator/scripts/measure_interphase_checks.py').stdout
    new_source = CHECKER.read_text()
    old_ast, new_ast = ast.parse(old_source), ast.parse(new_source)
    old_functions = {n.name: ast.dump(n) for n in old_ast.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    new_functions = {n.name: ast.dump(n) for n in new_ast.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))}
    print('CHECKER CHANGED FUNCTIONS', [name for name in old_functions if old_functions[name] != new_functions.get(name)])
    assert old_functions['committed_files'] == new_functions['committed_files']
    assert old_functions['non_test_committed_files'] == new_functions['non_test_committed_files']
    assert old_functions['gate_command'] == new_functions['gate_command']
    old_aliases = next(n.value for n in old_ast.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'ROLE_ALIASES' for t in n.targets))
    assert all(checker.ROLE_ALIASES[k] == v for k, v in ast.literal_eval(old_aliases).items())
    print('OLD ALIASES PASS', len(ast.literal_eval(old_aliases)))
    print('SUPERVISOR DIFF', [p for p in git('diff', '--name-only', BASE, HEAD).stdout.splitlines() if 'supervisor' in p])
    red_shas = ['dbd7127', '345f47d', '99ba994', '8f87953']
    for sha in red_shas:
        print('RED NOTE', sha, git('notes', 'show', sha).stdout)
    for sha in ['1dc03cf', '0b6670d', 'eef86ff', '8a8efe2']:
        print('DEVIATION COMMIT', sha, git('show', '--stat', '--oneline', sha).stdout, git('notes', 'show', sha).stdout)

def results():
    for path in sorted(RUN.glob('*.json')):
        if path.name.startswith('final-acceptance'):
            continue
        payload = json.loads(path.read_text())
        print('\nRESULT', path.name)
        print(json.dumps(payload, indent=2, ensure_ascii=False))

def logs():
    for path in sorted(RUN.glob('*.log')):
        if path.name.startswith('final-acceptance'):
            continue
        print('\nLOG', path.name)
        print(path.read_text(errors='replace'))

def concise():
    for path in sorted(RUN.glob('*.json')):
        if path.name.startswith('final-acceptance'):
            continue
        payload = json.loads(path.read_text())
        print('\nRESULT', path.name, payload.get('status'), payload.get('audited_head_sha'))
        print(payload.get('summary', ''))
        for field in ('blocking_findings', 'nonblocking_findings', 'test_strategy_violations', 'live_contract_violations', 'prod_wiring_violations', 'route_parity_violations'):
            for item in payload.get(field, []):
                print(field, item)
    for path in sorted(RUN.glob('*.log')):
        if path.name.startswith('final-acceptance'):
            continue
        lines = path.read_text(errors='replace').splitlines()
        print('\nHANDOFF', path.name)
        for line in lines:
            if line.startswith(('handoff:', 'dispositions:', 'deviations:', 'known_failures:', 'model:', 'model_deviation:')):
                print(line)

if __name__ == '__main__':
    {'verify': verify, 'results': results, 'logs': logs, 'concise': concise}[sys.argv[1]]()
