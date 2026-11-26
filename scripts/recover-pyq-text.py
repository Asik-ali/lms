import importlib.util,json,re,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('layout','scripts/pyq-text-layout.py');layout=importlib.util.module_from_spec(spec);spec.loader.exec_module(layout)
root=Path('imports/maths-pyq-text');canonical=[p for r in ['maths-pyq','maths-pyq-additional'] for p in json.loads(Path('imports',r,'prepared.json').read_text(encoding='utf8'))]
result=[];errors=[]
for p in canonical:
 rows=[]
 for q in p['questions']:
  combined=not q['tamil_image'];en=layout.recover(q['english_image'],'English',combined);ta=layout.recover(q['tamil_image'] or q['english_image'],'Tamil',combined)
  if 'error' in en or 'error' in ta:errors.append((p['topic'],q['number']))
  rows.append({'number':q['number'],'english':en,'tamil':ta,'source_images':[q['english_image'],q['tamil_image']]})
 result.append({'topic':p['topic'],'questions':rows})
(root/'draft-text.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print('Missing anchor layouts',errors)
for p in result:print(p['topic'],sum('error' not in q['english'] for q in p['questions']),sum('error' not in q['tamil'] for q in p['questions']))
