from pathlib import Path
import json,re,os
root=Path(os.environ.get('MATHS_IMPORT_ROOT','imports/maths-pyq')); sources=sorted(root.joinpath('source').glob('*.pdf.json'),key=lambda p:p.name)
def rows(items):
 groups=[]
 for it in sorted(items,key=lambda i:(i['y'],i['x'])):
  row=next((r for r in groups if abs(r[0]-it['y'])<3),None)
  if row is None:row=[it['y'],[]];groups.append(row)
  row[1].append(it)
 return '\n'.join(' '.join(it['text'] for it in sorted(r[1],key=lambda i:i['x'])) for r in groups)
manifest=[]
for f in sources:
 name=f.name[:-5]; pages=json.loads(f.read_text(encoding='utf8'))
 tamil=bool(re.search('[\u0b80-\u0bff]',name)); bilingual='Bilingual' in name
 topic=next((v for k,v in [('CI ','Compound Interest'),('AP GP','AP and GP'),('Age problem','Age Problems'),('2D','2D Mensuration'),('3D','3D Mensuration'),('Average','Average'),('LCM','LCM and HCF'),('Percentage','Percentage'),('Profit','Profit and Loss'),('Ratio','Ratio and Proportion'),('Time','Time and Work'),('simplification','Simplification')] if k.lower() in name.lower()),'Simplification')
 if name.startswith('(SI') or name.startswith('SI '):topic='Simple Interest'
 expected={'Compound Interest':85,'AP and GP':48,'Age Problems':8,'Simple Interest':130,'2D Mensuration':38,'3D Mensuration':97,'Average':27,'LCM and HCF':180,'Percentage':111,'Profit and Loss':52,'Ratio and Proportion':101,'Time and Work':131,'Simplification':74}[topic]
 columns=topic=='LCM and HCF' and not tamil
 marks=[]
 if topic=='Age Problems':
  boxes=[(1,102,213),(1,221,331),(1,339,438),(1,446,545),(1,553,675),(1,683,782),(2,14,133),(2,142,251)]
  questions=[{'number':i+1,'correct_answer':'DAACDABC'[i],'segments':[{'page':pn,'rect':[43,top,552,bottom]}],'source_text':f'Original bilingual age question {i+1}; retained as image.','has_e':True,'source_image':f'{root.as_posix()}/images/paper-{len(manifest)+1:02d}/q{i+1:03d}.webp'} for i,(pn,top,bottom) in enumerate(boxes)]
  manifest.append({'source':name,'topic':topic,'language':'English / Tamil','questions':questions,'answers':{i+1:a for i,a in enumerate('DAACDABC')},'issues':[]})
  continue
 for p in pages:
  candidates=[]
  for it in p['items']:
   if topic=='2D Mensuration':
    if 47.9<it['x']<52.4 and len(it['text'])>8 and p['page']<4: candidates.append((None,it))
   elif topic=='Profit and Loss':
    if it['text']=='Q' and 60<it['x']<65: candidates.append((None,it))
   else:
    m=re.match(r'^(?:Question\s+|Q\s*)?(\d{1,3})[.:](?!\d)',it['text'])
    if not m:continue
    if topic=='Simple Interest' and not tamil and not it['text'].startswith('Question '):continue
    if columns and not (20<it['x']<45 or 290<it['x']<315):continue
    if not columns and it['x']>95:continue
    candidates.append((int(m[1]),it))
  candidates.sort(key=lambda c:(c[1]['x']>200 if columns else False,c[1]['y']))
  for num,it in candidates:
   if len(marks)>=expected:break
   if num is not None and num!=len(marks)+1:continue
   marks.append({'number':len(marks)+1,'page':p['page'],'column':int(columns and it['x']>200),'y':it['y'],'h':it['h']})
 if len(marks)!=expected:raise Exception(f'{name}: {len(marks)}/{expected}')
 keypages=pages[-2:]
 if topic=='Ratio and Proportion':keypages=pages[-2:]
 keytext='\n'.join(p['text'] for p in keypages)
 answers={}
 if topic=='Simple Interest' and not tamil:
  for m in re.finditer(r'Question\s+(\d+):[\s\S]*?Correct Answer:\s*\(([A-E])\)', '\n'.join(p['text'] for p in pages)):answers[int(m[1])]=m[2]
 elif topic in ['2D Mensuration','Profit and Loss']:
  key=pages[-1]
  limits=[(105,130),(210,235),(315,337),(415,440),(520,543)] if topic=='2D Mensuration' else [(110,145),(210,260),(340,390),(470,520)]
  per=8 if topic=='2D Mensuration' else 13
  for ci,(left,right) in enumerate(limits):
   vals=sorted([it for it in key['items'] if left<it['x']<right and it['y']>85 and re.match(r'^[A-E](?:\s|$)',it['text'])],key=lambda it:it['y'])
   for ri,it in enumerate(vals):answers[ci*per+ri+1]=it['text'][0]
 else:
  for m in re.finditer(r'\b(?:Q\s*)?(\d{1,3})\s*[:.]?\s*(?:\(\s*([A-E])\s*\)|([A-E])(?=\s|$))',keytext):answers[int(m[1])]=m[2] or m[3]
 if topic=='Profit and Loss':answers={i+1:a for i,a in enumerate('BABCCADB BDBAD'.replace(' ','')+'DCCCBDCDCCDBA'+'ACCAADACDABBA'+'BCACAADDCCBAB')}
 answers={k:v for k,v in answers.items() if 1<=k<=expected}
 if tamil and topic in ['Time and Work','Simple Interest']:answers={}
 questions=[]
 for i,m in enumerate(marks):
  following=marks[i+1] if i+1<len(marks) else None
  segments=[]
  startblock=(m['page']-1)*(2 if columns else 1)+m['column']
  endblock=(following['page']-1)*(2 if columns else 1)+following['column'] if following else ((len(pages)-1) if topic=='AP and GP' and not tamil else startblock)
  for block in range(startblock,endblock+1):
   pn=block//(2 if columns else 1)+1; col=block%(2 if columns else 1); p=pages[pn-1]
   left=25 if not columns or col==0 else p['width']/2-10
   right=p['width']-25 if not columns or col==1 else p['width']/2-10
   top=m['y']-m['h']-5 if block==startblock else (20 if tamil and topic=='Simplification' else 38)
   bottom=following['y']-following['h']-1 if following and block==endblock else p['height']-42
   if not following:
    headers=[it for it in p['items'] if it['y']>(m['y']+25 if block==startblock else 38) and ((block==startblock and (it['text'].startswith('ExamStick') or it['text'].startswith('EXAMSTICK'))) or it['text']=='ANSWER' or re.search(r'answer\s*key',it['text'],re.I))]
    if headers:bottom=min(bottom,min(it['y']-it['h']-5 for it in headers))
   if following and block==endblock and following['page']!=m['page'] and bottom<45:continue
   items=[it for it in p['items'] if left<=it['x']<right and top<=it['y']<=bottom and not re.match(r'^(?:Page \d|ExamStick|EXAMSTICK)',it['text'])]
   if topic=='Simple Interest' and not tamil:
    correct=next((it for it in items if it['text'].startswith('Correct Answer:')),None)
    if correct:bottom=correct['y']-correct['h']-4;items=[it for it in items if it['y']<bottom]
   if not items:continue
   # Trim trailing whitespace while retaining subscript descenders and source artwork.
   bottom=min(bottom,max(it['y']+max(6,it['h']*.4) for it in items)+4)
   if bottom>top:segments.append({'page':pn,'rect':[left,max(0,top),right,bottom]})
  if not segments:raise Exception(f'No crop {name} Q{i+1}')
  text='\n'.join(rows([it for it in pages[s['page']-1]['items'] if s['rect'][0]<=it['x']<s['rect'][2] and s['rect'][1]<=it['y']<s['rect'][3]]) for s in segments)
  questions.append({'number':i+1,'correct_answer':answers.get(i+1),'segments':segments,'source_text':text,'has_e':topic=='2D Mensuration' or bool(re.search(r'\(\s*E\s*\)',text)),'source_image':f'{root.as_posix()}/images/paper-{len(manifest)+1:02d}/q{i+1:03d}.webp'})
 manifest.append({'source':name,'topic':topic,'language':'English / Tamil' if bilingual else 'Tamil' if tamil else 'English','questions':questions,'answers':answers,'issues':[]})
 print(name.encode('ascii','backslashreplace').decode(),len(questions),'answers',len(answers),'multi',sum(len(q['segments'])>1 for q in questions))
root.joinpath('papers.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
