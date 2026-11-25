import json,re,hashlib
from pathlib import Path
root=Path('imports/maths-pyq-text')
papers=[p for name in ['maths-pyq','maths-pyq-additional','maths-pyq-remaining'] for p in json.loads(Path('imports',name,'papers.json').read_text(encoding='utf8'))]
source={q['source_image']:q for p in papers for q in p['questions']}
canonical=[p for name in ['maths-pyq','maths-pyq-additional'] for p in json.loads(Path('imports',name,'prepared.json').read_text(encoding='utf8'))]
def clean(s):
 s=re.sub('[\u200b-\u200f\ufeff]','',s)
 return s.replace('ﬁ','fi').replace('ﬂ','fl').strip()
def parse(text):
 text=clean(text)
 labels=list(re.finditer(r'\(\s*([A-E])\s*\)',text))
 # Retain the final ordered run; matching tables may contain earlier labels.
 starts=[i for i,m in enumerate(labels) if m[1]=='A']
 for i in reversed(starts):
  run=labels[i:]
  if ''.join(m[1] for m in run) in ['ABCD','ABCDE']:
   stem=re.sub(r'^\s*(?:Question\s+|Q\s*)?\d+[.:]\s*','',text[:run[0].start()]).strip()
   options={f'option_{m[1].lower()}':text[m.end():run[j+1].start() if j+1<len(run) else len(text)].strip() for j,m in enumerate(run)}
   return {'question':stem,**options}
 return None
result=[]
for paper in canonical:
 rows=[]
 for q in paper['questions']:
  variants={}
  for lang,key in [('English','english_image'),('Tamil','tamil_image')]:
   file=q[key]
   if not file:continue
   digest=hashlib.sha256(Path(file).read_bytes()).hexdigest();ocr=json.loads((root/'ocr'/f'{digest}.json').read_text(encoding='utf8'))
   native=source[file]['source_text'];parsed=parse(native) if lang=='English' and paper['topic'] not in ['2D Mensuration','Profit and Loss','Average','Age Problems'] else parse(ocr['text'])
   flags=[]
   if not parsed:flags.append('option_labels_require_review')
   if parsed and re.search(r'^\s*[\d /]+\s*$',parsed['question'],re.M):flags.append('stacked_formula_requires_review')
   if parsed and lang=='Tamil' and re.search('[A-Za-z]{4,}',parsed['question']):flags.append('mixed_script_review')
   if ocr['confidence']<85:flags.append('ocr_confidence_below_85')
   variants[lang]={'candidate':parsed,'native_text':native,'ocr_text':clean(ocr['text']),'ocr_confidence':ocr['confidence'],'flags':flags,'reviewed':False,'source_image':file}
  rows.append({'number':q['number'],'correct_answer':q['correct_answer'],'variants':variants,'has_combined_source':not q['tamil_image']})
 result.append({'topic':paper['topic'],'questions':rows})
(root/'text-candidates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'questions':sum(len(p['questions']) for p in result),'variants':sum(len(q['variants']) for p in result for q in p['questions']),'parseable':sum(v['candidate'] is not None for p in result for q in p['questions'] for v in q['variants'].values())}))
