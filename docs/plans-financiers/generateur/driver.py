import subprocess, json, sys, openpyxl, datetime, os
RECALC='/root/.claude/skills/synced/a9f3a2ae-314a-4140-b6cb-107f53d033a3_289e608c-0fc0-4413-bc7f-0b7f46a95b29/xlsx/scripts/recalc.py'
OUTDIR='/home/user/AutoSchub/docs/plans-financiers'
os.makedirs(OUTDIR, exist_ok=True)
def run(script, args, out):
    subprocess.run(['python3', script, out] + [str(a) for a in args], check=True, capture_output=True)
    r = subprocess.run(['python3', RECALC, out, '120'], check=True, capture_output=True, text=True)
    res = json.loads(r.stdout); assert res.get('status') == 'success', res
    return res
def snap(path):
    ws = openpyxl.load_workbook(path, data_only=True)['Synthèse']
    d = {'years': [ws.cell(row=4, column=c).value for c in range(3, 8)]}
    m = {'Chiffre d’affaires (HTVA)': 'ca', 'EBITDA': 'ebitda', 'Résultat net': 'net', 'Trésorerie fin d’année': 'cash', 'Fonds propres fin d’année': 'equity'}
    for row in ws.iter_rows(min_row=5, max_row=40):
        lab = row[0].value
        if lab in m: d[m[lab]] = [row[k].value for k in range(2, 7)]
        elif lab and lab.startswith('Besoin'): d['need'] = row[2].value
        elif lab and lab.startswith('Trésorerie minimale'): d['mincash'] = row[2].value
        elif lab and lab.startswith('Premier mois'):
            v = row[2].value
            d['be'] = v.strftime('%m/%Y') if isinstance(v, datetime.datetime) else str(v)
    return d
which = sys.argv[1]
if which == 'app':
    variants = {'p': (1, 1, 0), 'c': (2, 1, 0), 'o': (3, 1, 0), 'leg': (2, 1, 0, 0.20, 1), 'b2b': (2, 1, 1), 'g2': (2, 2, 0)}
    script, final = 'build_app.py', OUTDIR + '/AutoSchub_Plan_financier_Application_2027-2031.xlsx'
    fargs = (2, 1, 0)
else:
    variants = {'p': (1, 1), 'c': (2, 1), 'o': (3, 1), 's1': (2, 0)}
    script, final = 'build_school.py', OUTDIR + '/Auto-ecole_agreee_Plan_financier_2027-2031.xlsx'
    fargs = (2, 1)
S = {}
for k, a in variants.items():
    run(script, a, 'v_%s.xlsx' % k); S[k] = snap('v_%s.xlsx' % k)
json.dump(S, open(final + '.snap.json', 'w'), indent=1, default=str)
res = run(script, fargs, final)
os.remove(final + '.snap.json')
print(json.dumps(S, indent=1, default=str)); print(res)
