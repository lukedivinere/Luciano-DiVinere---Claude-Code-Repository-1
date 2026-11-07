// Python grading harness. This source is executed inside Pyodide, both in the
// browser (python.worker.ts) and in Node (scripts/validate-content.ts), so the
// app and the validator grade code identically.
//
// Exposes two Python functions:
//   cq_run(code, stdin_json)    -> JSON {stdout, error}
//   cq_grade(code, tests_json)  -> JSON {results: [...], fatal}

export const PY_HARNESS = String.raw`
import sys, io, json, traceback, builtins, importlib, math

class _CQInputExhausted(Exception):
    pass

def _cq_make_input(values, out, echo):
    queue = list(values)
    def _input(prompt=''):
        if echo:
            out.write(str(prompt))
        if not queue:
            raise _CQInputExhausted('Your program asked for more input() than the test provides.')
        v = queue.pop(0)
        if echo:
            out.write(str(v) + '\n')
        return str(v)
    return _input

def _cq_error(e):
    tb = traceback.extract_tb(e.__traceback__)
    line = None
    for fr in tb:
        if fr.filename == 'main.py':
            line = fr.lineno
    if isinstance(e, SyntaxError) and e.filename == 'main.py':
        line = e.lineno
    name = type(e).__name__
    if isinstance(e, _CQInputExhausted):
        name = 'InputExhausted'
    msg = str(e)
    if isinstance(e, SyntaxError):
        msg = e.msg
    return {'type': name, 'message': msg, 'line': line}

def _cq_exec(code, stdin, echo, setup=None):
    out = io.StringIO()
    g = {'__name__': '__main__'}
    old_out, old_input = sys.stdout, builtins.input
    sys.stdout = out
    builtins.input = _cq_make_input(stdin or [], out, echo)
    err = None
    try:
        import random
        importlib.reload(random)
        random.seed(12345)
        if setup:
            exec(setup, g)
        exec(compile(code, 'main.py', 'exec'), g)
    except SystemExit:
        pass
    except BaseException as e:
        err = _cq_error(e)
    finally:
        sys.stdout = old_out
        builtins.input = old_input
    return out.getvalue(), err, g

def _cq_norm(s):
    lines = [l.rstrip() for l in str(s).replace('\r\n', '\n').split('\n')]
    while lines and lines[-1] == '':
        lines.pop()
    return '\n'.join(lines)

def _cq_plain(v):
    if isinstance(v, tuple):
        return [_cq_plain(x) for x in v]
    if isinstance(v, list):
        return [_cq_plain(x) for x in v]
    if isinstance(v, dict):
        return {str(k): _cq_plain(x) for k, x in v.items()}
    return v

def _cq_equal(a, b):
    a, b = _cq_plain(a), _cq_plain(b)
    if isinstance(a, bool) or isinstance(b, bool):
        return type(a) == type(b) and a == b
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return math.isclose(a, b, rel_tol=1e-6, abs_tol=1e-6)
    if isinstance(a, list) and isinstance(b, list):
        return len(a) == len(b) and all(_cq_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(_cq_equal(a[k], b[k]) for k in a)
    return a == b

def _cq_show(v):
    try:
        return repr(v)
    except Exception:
        return '<unprintable>'

def cq_run(code, stdin_json):
    stdout, err, _ = _cq_exec(code, json.loads(stdin_json), echo=True)
    return json.dumps({'stdout': stdout, 'error': err})

def cq_grade(code, tests_json):
    tests = json.loads(tests_json)
    # Syntax check first so a typo gives one clear message.
    try:
        compile(code, 'main.py', 'exec')
    except SyntaxError as e:
        return json.dumps({'results': [], 'fatal': _cq_error(e)})
    results = []
    for t in tests:
        r = {'name': t['name'], 'explain': t['explain'], 'passed': False}
        kind = t['kind']
        stdin = t.get('stdin') or []
        stdout, err, g = _cq_exec(code, stdin, echo=False, setup=t.get('setup'))
        if stdin:
            r['stdin'] = stdin
        try:
            if kind == 'stdout':
                r['expected'] = t['expected']
                r['got'] = stdout
                if err:
                    r['error'] = err
                else:
                    r['passed'] = _cq_norm(stdout) == _cq_norm(t['expected'])
            elif kind == 'call':
                args_s = ', '.join(_cq_show(a) for a in t['args'])
                r['expected'] = t['fn'] + '(' + args_s + ') should return ' + _cq_show(t['expected'])
                if err:
                    r['error'] = err
                elif t['fn'] not in g or not callable(g[t['fn']]):
                    r['got'] = 'There is no function called ' + t['fn'] + ' in your code.'
                else:
                    old_out = sys.stdout
                    sys.stdout = io.StringIO()
                    try:
                        val = g[t['fn']](*t['args'])
                    finally:
                        sys.stdout = old_out
                    r['got'] = 'it returned ' + _cq_show(val)
                    r['passed'] = _cq_equal(val, t['expected'])
            elif kind == 'check':
                if err:
                    r['error'] = err
                else:
                    g['__cq_stdout__'] = stdout
                    g['CODE'] = code
                    g['OUTPUT'] = stdout
                    old_out = sys.stdout
                    sys.stdout = io.StringIO()
                    try:
                        exec(t['code'], g)
                        r['passed'] = True
                    except AssertionError as ae:
                        msg = str(ae)
                        if msg:
                            r['got'] = msg
                    finally:
                        sys.stdout = old_out
            else:
                r['got'] = 'Unknown test kind ' + kind
        except BaseException as e:
            r['error'] = _cq_error(e)
        results.append(r)
    return json.dumps({'results': results, 'fatal': None})
`;
