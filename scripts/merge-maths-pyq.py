from pathlib import Path
import json,html,os
root=Path(os.environ.get('MATHS_IMPORT_ROOT','imports/maths-pyq')); papers=json.loads(root.joinpath('papers.json').read_text(encoding='utf8'))
topics=['Simplification','LCM and HCF','Percentage','Ratio and Proportion','Average','Profit and Loss','Simple Interest','Time and Work','2D Mensuration','3D Mensuration']
if os.environ.get('MATHS_IMPORT_ROOT'):topics=['Compound Interest','AP and GP','Age Problems']
result=[]
for topic in topics:
 group=[p for p in papers if p['topic']==topic]; en=next((p for p in group if p['language']=='English'),None); ta=next((p for p in group if p['language']=='Tamil'),None); combined=next((p for p in group if p['language']=='English / Tamil'),None);base=en or combined or ta;qs=[];issues=list(base.get('issues',[]))
 for i,q in enumerate(base['questions'][:26] if topic=='Average' else base['questions']):
  variant=ta['questions'][i] if en and ta else None
  a=q['correct_answer'];b=variant['correct_answer'] if variant else None
  flags=[issue['issue'] for issue in base.get('issues',[]) if issue.get('number')==i+1]
  if a and b and a!=b:
   flags.append(f'Conflicting source keys: English {a}; Tamil {b}. Answer left unassigned for review.');a=None
  elif not a:a=b
  if topic=='Simple Interest':flags.append('Tamil source key matched by question number to supplied English solutions.')
  if topic=='Time and Work':flags.append('Tamil source has no key; supplied English source key retained.')
  if not a:issues.append({'number':i+1,'issue':'; '.join(flags) or 'Source answer missing.'})
  qs.append({'number':i+1,'english_image':q['source_image'],'tamil_image':variant['source_image'] if variant else None,'has_e':q['has_e'] or bool(variant and variant['has_e']),'correct_answer':a,'sources':[base['source']]+([ta['source']] if variant else []),'source_answers':{base['language']:q['correct_answer'],**({'Tamil':b} if variant else {})},'notes':flags})
 if topic=='Average':issues.append({'issue':'User requested Average questions 1-26 only; question 27 is intentionally excluded.'})
 if topic=='Ratio and Proportion':issues.append({'issue':'English PDF not supplied. Tamil source preserved without invented translations.'})
 result.append({'topic':topic,'name':f'{topic} PYQ','language':'English / Tamil' if combined or en and ta else base['language'],'questions':qs,'issues':issues})
# Apply later-supplied English sources without duplicating existing question IDs.
remaining=Path('imports/maths-pyq-remaining/papers.json')
if root.as_posix()=='imports/maths-pyq' and remaining.exists():
 for source in json.loads(remaining.read_text(encoding='utf8')):
  paper=next(p for p in result if p['topic']==source['topic'])
  if len(paper['questions'])!=len(source['questions']):raise ValueError('Remaining source count mismatch')
  for q,new in zip(paper['questions'],source['questions']):
   if new['correct_answer'] and q['correct_answer']!=new['correct_answer']:raise ValueError(f"Conflicting key: {paper['topic']} Q{q['number']}")
   q['tamil_image']=q['tamil_image'] or q['english_image']
   q['english_image']=new['source_image']
   q['has_e']=q['has_e'] or new['has_e']
   q['sources']=list(dict.fromkeys(q['sources']+[source['source']]))
   if new['correct_answer']:q['source_answers']['English']=new['correct_answer']
  paper['language']='English / Tamil'
  paper['issues']=[i for i in paper['issues'] if 'English PDF not supplied' not in i['issue']]
root.joinpath('prepared.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
root.joinpath('review-flags.json').write_text(json.dumps([{'topic':p['topic'],'issues':p['issues']} for p in result if p['issues']],ensure_ascii=False,indent=2),encoding='utf8')
review=['<!doctype html><meta charset="utf-8"><title>Maths PYQ import review</title><style>body{font:16px system-ui;max-width:1100px;margin:30px auto;background:#edf2f7}article,details{background:white;padding:20px;margin:15px 0}img{max-width:100%}summary{cursor:pointer}h3{color:#223d65}</style><h1>Maths PYQ - source review</h1>']
for p in result:
 review.append(f'<details><summary>{html.escape(p["topic"])}: {len(p["questions"])} questions; {p["language"]}</summary>')
 for q in p['questions']:
  review.append(f'<article><h3>Q{q["number"]}</h3>')
  for key in ['english_image','tamil_image']:
   if q[key]:review.append(f'<img loading="lazy" src="{q[key].replace(root.as_posix()+"/", "")}" alt="Original source question">')
  review.append(f'<p>Source answer: {q["correct_answer"] or "Unassigned - conflicting keys"}. {html.escape("; ".join(q["notes"]))}</p></article>')
 review.append('</details>')
root.joinpath('review.html').write_text('\n'.join(review),encoding='utf8')
print(json.dumps({'topics':len(result),'questions':sum(len(p['questions']) for p in result),'answers':sum(bool(q['correct_answer']) for p in result for q in p['questions']),'sources':len(papers),'source_question_instances':sum(len(p['questions']) for p in papers)},indent=2))
