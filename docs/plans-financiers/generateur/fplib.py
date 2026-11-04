"""Petit moteur pour construire des plans financiers mensuels (60 mois) avec openpyxl.

Conventions des gabarits de formules (templates) :
  {c} colonne courante, {p} colonne précédente, {Y} indice d'année (1..5), {M} mois de l'année (1..12),
  {N} numéro de mois (1..60)
  [cle]          -> cellule de la ligne `cle` de la feuille courante, même colonne
  [cle@p]        -> idem, colonne précédente
  [Feuille:cle]  -> cellule de la ligne `cle` d'une autre feuille, même colonne
  <cle>          -> hypothèse scalaire (référence absolue)
  <<cle>>        -> hypothèse annuelle (INDEX sur Année 1..5)
"""
import re
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.comments import Comment

FONT = 'Arial'
EUR = '#,##0 €;(#,##0 €);"-"'
EUR2 = '#,##0.00 €;(#,##0.00 €);"-"'
PCT = '0.0%;(0.0%);"-"'
NUM = '#,##0;(#,##0);"-"'
NUM1 = '#,##0.0;(#,##0.0);"-"'
NUM2 = '#,##0.00;(#,##0.00);"-"'
DATEF = 'mmm-yy'

NAVY = '1F3864'
F_TITLE = Font(name=FONT, size=14, bold=True, color=NAVY)
F_SUB = Font(name=FONT, size=9, italic=True, color='595959')
F_HDR = Font(name=FONT, size=9, bold=True, color='FFFFFF')
F_SEC = Font(name=FONT, size=10, bold=True, color=NAVY)
F_IN = Font(name=FONT, size=9, color='0000FF')
F_CALC = Font(name=FONT, size=9, color='000000')
F_CALCB = Font(name=FONT, size=9, color='000000', bold=True)
F_LINK = Font(name=FONT, size=9, color='008000')
F_TXT = Font(name=FONT, size=9)
F_TXTB = Font(name=FONT, size=9, bold=True)
FILL_HDR = PatternFill('solid', fgColor=NAVY)
FILL_SEC = PatternFill('solid', fgColor='D9E1F2')
FILL_KEY = PatternFill('solid', fgColor='FFFF00')
FILL_TOT = PatternFill('solid', fgColor='F2F2F2')
FILL_ANN = PatternFill('solid', fgColor='EDF3FA')
THIN = Side(style='thin', color='A6A6A6')
B_TOP = Border(top=THIN)
WRAP = Alignment(wrap_text=True, vertical='top')

NM = 60
FIRST = 9          # colonne I = mois 1
ANN = ['C', 'D', 'E', 'F', 'G']
LASTM = L(FIRST + NM - 1)  # BP
ROW0 = 9

REG = {}  # nom de feuille -> MonthlySheet / AnnualSheet


def q(name):
    return "'" + name + "'"


class Hyp:
    """Feuille d'hypothèses : A libellé | B..F An1..An5 (ou valeur unique en B) | G unité | H source."""

    def __init__(self, wb, name, title, subtitle):
        self.name = name
        self.ws = wb.create_sheet(name)
        ws = self.ws
        ws['A1'] = title
        ws['A1'].font = F_TITLE
        ws['A2'] = subtitle
        ws['A2'].font = F_SUB
        hdr = ['Hypothèse', 'An 1 / valeur', 'An 2', 'An 3', 'An 4', 'An 5', 'Unité', 'Source / justification']
        for i, h in enumerate(hdr):
            c = ws.cell(row=4, column=i + 1, value=h)
            c.font = F_HDR
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        ws.column_dimensions['A'].width = 52
        for col in 'BCDEF':
            ws.column_dimensions[col].width = 12
        ws.column_dimensions['G'].width = 12
        ws.column_dimensions['H'].width = 95
        ws.freeze_panes = 'B5'
        self.r = 5
        self.refs = {}

    def section(self, title):
        self.r += 1
        c = self.ws.cell(row=self.r, column=1, value=title)
        c.font = F_SEC
        for col in range(1, 9):
            self.ws.cell(row=self.r, column=col).fill = FILL_SEC
        self.r += 1

    def note(self, text):
        c = self.ws.cell(row=self.r, column=1, value=text)
        c.font = F_SUB
        self.r += 1

    def _meta(self, label, unit, src, key_flag):
        ws = self.ws
        ws.cell(row=self.r, column=1, value=label).font = F_TXT
        ws.cell(row=self.r, column=7, value=unit).font = F_TXT
        c = ws.cell(row=self.r, column=8, value=src)
        c.font = F_SUB
        c.alignment = Alignment(wrap_text=False, vertical='top')

    def add(self, key, label, val, unit='', src='', fmt=EUR, key_flag=False):
        ws = self.ws
        self._meta(label, unit, src, key_flag)
        if isinstance(val, (list, tuple)):
            assert len(val) == 5, key
            for i, v in enumerate(val):
                c = ws.cell(row=self.r, column=2 + i, value=v)
                c.font = F_IN
                c.number_format = fmt
                if key_flag:
                    c.fill = FILL_KEY
            self.refs[key] = ('y', self.r)
        else:
            c = ws.cell(row=self.r, column=2, value=val)
            is_formula = isinstance(val, str) and val.startswith('=')
            c.font = F_CALC if is_formula else F_IN
            c.number_format = fmt
            if key_flag:
                c.fill = FILL_KEY
            self.refs[key] = ('s', self.r)
        self.r += 1

    def calc(self, key, label, formula, unit='', src='', fmt=EUR):
        """Hypothèse dérivée (formule) ; la formule peut contenir des <cle>."""
        self.add(key, label, '=' + self.resolve(formula), unit, src, fmt)

    def scen(self, key, label, vals, unit='', src='', fmt=NUM2):
        """3 valeurs (pessimiste / central / optimiste) en B,C,D ; valeur retenue en F."""
        ws = self.ws
        self._meta(label, unit, src, False)
        for i, v in enumerate(vals):
            c = ws.cell(row=self.r, column=2 + i, value=v)
            c.font = F_IN
            c.number_format = fmt
        c = ws.cell(row=self.r, column=6, value='=INDEX(B%d:D%d,%s)' % (self.r, self.r, self.ref('scenario')[1:]
                                                                      if False else self.ref('scenario').split('!')[1]))
        c.font = F_CALCB
        c.number_format = fmt
        self.refs[key] = ('f', self.r)
        self.r += 1

    def lst(self, key, labels, vals, unit='', src='', fmt=NUM2):
        r0 = self.r
        for lab, v in zip(labels, vals):
            self._meta(lab, unit, src if self.r == r0 else '', False)
            c = self.ws.cell(row=self.r, column=2, value=v)
            c.font = F_IN
            c.number_format = fmt
            self.r += 1
        self.refs[key] = ('l', r0, self.r - 1)

    def ref(self, key, local=False):
        t = self.refs[key]
        pre = '' if local else q(self.name) + '!'
        if t[0] == 's':
            return '%s$B$%d' % (pre, t[1])
        if t[0] == 'f':
            return '%s$F$%d' % (pre, t[1])
        raise KeyError(key)

    def yref(self, key, ycell):
        t = self.refs[key]
        if t[0] == 'y':
            return 'INDEX(%s$B$%d:$F$%d,%s)' % (q(self.name) + '!', t[1], t[1], ycell)
        return self.ref(key)

    def lref(self, key, idx):
        t = self.refs[key]
        return 'INDEX(%s$B$%d:$B$%d,%s)' % (q(self.name) + '!', t[1], t[2], idx)

    def rng(self, key, col='B'):
        t = self.refs[key]
        return '%s$%s$%d:$%s$%d' % (q(self.name) + '!', col, t[1], col, t[2])

    def resolve(self, s, ycell='1'):
        s = re.sub(r'<<(\w+)>>', lambda m: self.yref(m.group(1), ycell), s)
        s = re.sub(r'<(\w+)>', lambda m: self.ref(m.group(1), local=False), s)
        return s


class Row:
    def __init__(self, key, label, tmpl, fmt, agg, unit, bold, note, ann, total, link):
        self.__dict__.update(locals())
        del self.__dict__['self']


class MonthlySheet:
    def __init__(self, wb, name, title, subtitle, hyp, start_ref):
        self.name = name
        self.ws = wb.create_sheet(name)
        self.hyp = hyp
        self.items = []  # ('sec', title) | ('row', Row) | ('blank',)
        self.rows = {}
        self.r = ROW0
        REG[name] = self
        ws = self.ws
        ws['A1'] = title
        ws['A1'].font = F_TITLE
        ws['A2'] = subtitle
        ws['A2'].font = F_SUB
        ws.column_dimensions['A'].width = 46
        ws.column_dimensions['B'].width = 9
        for col in ANN:
            ws.column_dimensions[col].width = 13
        ws.column_dimensions['H'].width = 2
        for j in range(NM):
            ws.column_dimensions[L(FIRST + j)].width = 10.5
        # en-têtes
        ws['A4'] = 'Période'
        ws['A5'] = 'Année (indice)'
        ws['A6'] = 'Mois de l’année'
        ws['A7'] = 'Mois n°'
        for r in (4, 5, 6, 7):
            ws.cell(row=r, column=1).font = F_TXTB if r == 4 else F_SUB
        for i, col in enumerate(ANN):
            c = ws[col + '4']
            c.value = '="An "&%s&" ("&(YEAR(%s)+%d)&")"' % (i + 1, start_ref, i)
            c.font = F_HDR
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center')
            ws[col + '5'] = i + 1
            ws[col + '5'].font = F_SUB
            ws[col + '3'] = 'Total / fin d’année' if i == 0 else None
        ws['C3'].font = F_SUB
        ws[L(FIRST) + '3'] = 'Détail mensuel →'
        ws[L(FIRST) + '3'].font = F_SUB
        for j in range(NM):
            col = L(FIRST + j)
            c = ws[col + '4']
            c.value = '=EDATE(%s,%d)' % (start_ref, j)
            c.number_format = DATEF
            c.font = F_HDR
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center')
            ws[col + '5'] = j // 12 + 1
            ws[col + '6'] = j % 12 + 1
            ws[col + '7'] = j + 1
            for r in (5, 6, 7):
                ws[col + str(r)].font = F_SUB
        ws.freeze_panes = 'C8' if False else ws['%s8' % L(FIRST)]
        ws.freeze_panes = 'C8'

    # --- définition
    def section(self, title):
        self.items.append(('sec', title, self.r))
        self.r += 1

    def blank(self):
        self.r += 1

    def row(self, key, label, tmpl, fmt=EUR, agg='sum', unit='€', bold=False, note=None, ann=None,
            total=False, link=False):
        assert key not in self.rows, (self.name, key)
        rw = Row(key, label, tmpl, fmt, agg, unit, bold, note, ann, total, link)
        rw.r = self.r
        self.rows[key] = rw
        self.items.append(('row', rw))
        self.r += 1
        return rw

    def addr(self, key, col):
        return '%s%d' % (col, self.rows[key].r)

    # --- résolution
    def resolve(self, s, j=None, col=None, pcol=None, annual=False):
        ycell = '%s$5' % col
        s = s.replace('{c}', col).replace('{p}', pcol)
        s = s.replace('{Y}', '%s$5' % col).replace('{M}', '%s$6' % col).replace('{N}', '%s$7' % col)

        def sub(m):
            sheet, key, prev = m.group(1), m.group(2), m.group(3)
            c = pcol if prev else col
            if sheet:
                sh = REG[sheet]
                return '%s!%s%d' % (q(sheet), c, sh.rows[key].r)
            return '%s%d' % (c, self.rows[key].r)

        s = re.sub(r'\[(?:([^\]:]+):)?(\w+)(@p)?\]', sub, s)
        s = self.hyp.resolve(s, ycell)
        return s

    def finalize(self):
        ws = self.ws
        for it in self.items:
            if it[0] == 'sec':
                c = ws.cell(row=it[2], column=1, value=it[1])
                c.font = F_SEC
                for col in range(1, FIRST + NM):
                    ws.cell(row=it[2], column=col).fill = FILL_SEC
                continue
            rw = it[1]
            r = rw.r
            c = ws.cell(row=r, column=1, value=rw.label)
            c.font = F_TXTB if (rw.bold or rw.total) else F_TXT
            if rw.note:
                c.comment = Comment(rw.note, 'Plan financier')
            ws.cell(row=r, column=2, value=rw.unit).font = F_SUB
            # mensuel
            if rw.tmpl is not None:
                for j in range(NM):
                    col = L(FIRST + j)
                    pcol = L(FIRST + j - 1)
                    t = rw.tmpl(j, col) if callable(rw.tmpl) else rw.tmpl
                    f = '=' + self.resolve(t, j, col, pcol)
                    cell = ws.cell(row=r, column=FIRST + j, value=f)
                    cell.number_format = rw.fmt
                    cell.font = F_CALCB if (rw.bold or rw.total) else (F_LINK if rw.link else F_CALC)
                    if rw.total:
                        cell.fill = FILL_TOT
                        cell.border = B_TOP
            # annuel
            for i, col in enumerate(ANN):
                pcol = 'B' if i == 0 else ANN[i - 1]
                if rw.agg == 'sum':
                    f = '=SUMIF($%s$5:$%s$5,%s$5,$%s%d:$%s%d)' % (L(FIRST), LASTM, col, L(FIRST), r, LASTM, r)
                elif rw.agg == 'end':
                    f = '=INDEX($%s%d:$%s%d,%s$5*12)' % (L(FIRST), r, LASTM, r, col)
                elif rw.agg == 'avg':
                    f = '=AVERAGEIF($%s$5:$%s$5,%s$5,$%s%d:$%s%d)' % (L(FIRST), LASTM, col, L(FIRST), r, LASTM, r)
                elif rw.agg == 'custom':
                    t = rw.ann(i, col) if callable(rw.ann) else rw.ann
                    if i == 0:
                        t = t.replace('[@p]', '0')
                    f = '=' + self.resolve(t, None, col, pcol, annual=True)
                else:
                    f = None
                if f:
                    cell = ws.cell(row=r, column=3 + i, value=f)
                    cell.number_format = rw.fmt
                    cell.font = F_CALCB
                    cell.fill = FILL_ANN
                    if rw.total:
                        cell.border = B_TOP


class AnnualSheet:
    """Feuille annuelle : A libellé | B ouverture (facultatif) | C..G An1..An5 (mêmes lettres que les feuilles mensuelles)."""

    def __init__(self, wb, name, title, subtitle, hyp, start_ref, opening=False):
        self.name = name
        self.ws = wb.create_sheet(name)
        self.hyp = hyp
        self.items = []
        self.rows = {}
        self.r = 8
        self.opening = opening
        REG[name] = self
        ws = self.ws
        ws['A1'] = title
        ws['A1'].font = F_TITLE
        ws['A2'] = subtitle
        ws['A2'].font = F_SUB
        ws.column_dimensions['A'].width = 52
        ws.column_dimensions['B'].width = 14
        for col in ANN:
            ws.column_dimensions[col].width = 14
        ws.column_dimensions['H'].width = 60
        ws['A6'] = '(en euros, hors TVA)'
        ws['A6'].font = F_SUB
        if opening:
            ws['B6'] = 'Ouverture'
            ws['B6'].font = F_HDR
            ws['B6'].fill = FILL_HDR
            ws['B6'].alignment = Alignment(horizontal='center')
            ws['B5'] = 0
            ws['B5'].font = F_SUB
        for i, col in enumerate(ANN):
            c = ws[col + '6']
            c.value = '="An "&%s&" ("&(YEAR(%s)+%d)&")"' % (i + 1, start_ref, i)
            c.font = F_HDR
            c.fill = FILL_HDR
            c.alignment = Alignment(horizontal='center')
            ws[col + '5'] = i + 1
            ws[col + '5'].font = F_SUB
        ws['H6'] = 'Commentaire'
        ws['H6'].font = F_HDR
        ws['H6'].fill = FILL_HDR
        ws.freeze_panes = 'B7'

    def section(self, title):
        self.items.append(('sec', title, self.r))
        self.r += 1

    def blank(self):
        self.r += 1

    def row(self, key, label, tmpl, fmt=EUR, open_tmpl=None, bold=False, total=False, note=None, link=False):
        rw = Row(key, label, tmpl, fmt, None, '', bold, note, open_tmpl, total, link)
        rw.r = self.r
        self.rows[key] = rw
        self.items.append(('row', rw))
        self.r += 1
        return rw

    def resolve(self, s, col, pcol):
        s = s.replace('{c}', col).replace('{p}', pcol).replace('{Y}', '%s$5' % col)

        def sub(m):
            sheet, key, prev = m.group(1), m.group(2), m.group(3)
            c = pcol if prev else col
            if sheet:
                return '%s!%s%d' % (q(sheet), c, REG[sheet].rows[key].r)
            return '%s%d' % (c, self.rows[key].r)

        s = re.sub(r'\[(?:([^\]:]+):)?(\w+)(@p)?\]', sub, s)
        return self.hyp.resolve(s, '%s$5' % col)

    def finalize(self):
        ws = self.ws
        for it in self.items:
            if it[0] == 'sec':
                c = ws.cell(row=it[2], column=1, value=it[1])
                c.font = F_SEC
                for col in range(1, 9):
                    ws.cell(row=it[2], column=col).fill = FILL_SEC
                continue
            rw = it[1]
            r = rw.r
            c = ws.cell(row=r, column=1, value=rw.label)
            c.font = F_TXTB if (rw.bold or rw.total) else F_TXT
            if rw.note:
                n = ws.cell(row=r, column=8, value=rw.note)
                n.font = F_SUB
            cols = ([('B', 'A')] if self.opening else []) + [(col, 'B' if i == 0 else ANN[i - 1]) for i, col in enumerate(ANN)]
            for col, pcol in cols:
                if col == 'B':
                    t = rw.ann
                    if t is None:
                        continue
                else:
                    t = rw.tmpl(col) if callable(rw.tmpl) else rw.tmpl
                    if t is None:
                        continue
                    if not self.opening:
                        t = t.replace('@p]', '@p]')
                f = '=' + self.resolve(t, col, pcol) if isinstance(t, str) else t
                cell = ws[col + str(r)]
                cell.value = f
                cell.number_format = rw.fmt
                cell.font = F_CALCB if (rw.bold or rw.total) else (F_LINK if rw.link else F_CALC)
                if rw.total:
                    cell.fill = FILL_TOT
                    cell.border = B_TOP


def finalize_all():
    for sh in REG.values():
        sh.finalize()


def text_sheet(wb, name, title, blocks, width=120):
    """Feuille de texte : blocks = liste de (style, texte) avec style in {'h','p','b','s'}."""
    ws = wb.create_sheet(name)
    ws.column_dimensions['A'].width = 3
    ws.column_dimensions['B'].width = width
    ws['B1'] = title
    ws['B1'].font = F_TITLE
    r = 3
    for style, txt in blocks:
        c = ws.cell(row=r, column=2, value=txt)
        if style == 'h':
            c.font = F_SEC
            c.fill = FILL_SEC
        elif style == 'b':
            c.font = F_TXTB
        elif style == 's':
            c.font = F_SUB
        else:
            c.font = F_TXT
        c.alignment = Alignment(wrap_text=True, vertical='top')
        lines = max(1, len(txt) // int(width * 1.1) + 1 + txt.count('\n'))
        ws.row_dimensions[r].height = 13 * lines
        r += 1
    ws.sheet_view.showGridLines = False
    return ws


def vat_settlement(j, netvat_row_ref_fn):
    """Formule de règlement trimestriel de TVA pour la colonne mensuelle j (0-based) :
    payée le mois suivant la fin du trimestre (janv., avril, juil., oct.)."""
    if j < 3 or j % 3 != 0:
        return '0'
    cols = [L(FIRST + k) for k in range(j - 3, j)]
    return 'SUM(%s:%s)' % (netvat_row_ref_fn(cols[0]), netvat_row_ref_fn(cols[-1]))


def amort_formula(j, row, months):
    a = max(0, j - months + 1)
    return 'SUM(%s%d:%s%d)/%s' % (L(FIRST + a), row, L(FIRST + j), row, months)
