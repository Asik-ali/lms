import json,ast,math
from pathlib import Path
mapping={'age':'Age Problems','percentage':'Percentage','simple-interest':'Simple Interest','compound-interest':'Compound Interest','ap-gp':'AP and GP','ratio':'Ratio and Proportion','3d':'3D Mensuration','average':'Average','time-work':'Time and Work','lcm-hcf':'LCM and HCF','simplification':'Simplification','2d':'2D Mensuration','profit-loss':'Profit and Loss'}
canonical=[p for name in ['maths-pyq','maths-pyq-additional'] for p in json.loads(Path('imports',name,'prepared.json').read_text(encoding='utf8'))]
report={'reviewed':0,'verified':0,'source_issues':[],'key_changes':[],'calculation_failures':[],'topics':[]}
allowed={ast.Expression,ast.BinOp,ast.UnaryOp,ast.Constant,ast.Add,ast.Sub,ast.Mult,ast.Div,ast.Pow,ast.Mod,ast.USub,ast.UAdd,ast.FloorDiv,ast.Call,ast.Name,ast.Load}
functions={'gcd':math.gcd,'lcm':math.lcm,'ceil':math.ceil,'cbrt':math.cbrt}
for slug,topic in mapping.items():
 file=Path('imports/maths-pyq-text',f'audit-{slug}.json');audit=json.loads(file.read_text(encoding='utf8'));paper=next(p for p in canonical if p['topic']==topic)
 assert len(audit)==len(paper['questions']),(topic,len(audit))
 for q in paper['questions']:
  item=audit[str(q['number'])];report['reviewed']+=1
  if 'expression' in item:
   tree=ast.parse(item['expression'],mode='eval')
   assert all(type(n) in allowed for n in ast.walk(tree))
   assert all(not isinstance(n,ast.Name) or n.id in functions for n in ast.walk(tree))
   value=eval(compile(tree,'<audited arithmetic>','eval'),{'__builtins__':{}},functions)
   if not math.isclose(value,item['value'],rel_tol=1e-8,abs_tol=1e-7):report['calculation_failures'].append({'topic':topic,'number':q['number'],'computed':value,'recorded':item['value']})
  if item['status']=='verified':
   report['verified']+=1
   if item['answer']!=q['correct_answer']:report['key_changes'].append({'topic':topic,'number':q['number'],'source':q['correct_answer'],'calculated':item['answer']})
  else:report['source_issues'].append({'topic':topic,'number':q['number'],**item})
 report['topics'].append({'topic':topic,'reviewed':len(audit)})
assert report['reviewed']==1081
Path('imports/maths-pyq-text/answer-audit-summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k!='topics'},ensure_ascii=True,indent=2))
