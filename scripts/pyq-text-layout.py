from pathlib import Path
import json,re,hashlib,collections,math
root=Path('imports/maths-pyq-text')
allpapers=[p for r in ['maths-pyq','maths-pyq-additional','maths-pyq-remaining'] for p in json.loads(Path('imports',r,'papers.json').read_text(encoding='utf8'))]
lookup={q['source_image']:(r,q) for r in allpapers for q in r['questions']}
sources={}
for folder in ['maths-pyq','maths-pyq-additional','maths-pyq-remaining']:
 for f in Path('imports',folder,'source').glob('*.pdf.json'):sources[f.name[:-5]]=json.loads(f.read_text(encoding='utf8'))
SUP=str.maketrans('0123456789+-=()nxy','⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿˣʸ');SUB=str.maketrans('0123456789+-=()','₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎')
def rich(items):
 if not items:return ''
 med=sorted(i['h'] for i in items)[len(items)//2]
 main=[i for i in items if i['h']>=med*.9]
 rows=[]
 for it in sorted(main,key=lambda i:(i['y'],i['x'])):
  row=next((r for r in rows if abs(r['y']-it['y'])<2.5),None)
  if row is None:row={'y':it['y'],'items':[]};rows.append(row)
  row['items'].append(it)
 for it in items:
  if it in main:continue
  row=min(rows,key=lambda r:abs(r['y']-it['y']))
  if abs(row['y']-it['y'])<med*.9:row['items'].append(it)
  else:rows.append({'y':it['y'],'items':[it]})
 output=[]
 for row in sorted(rows,key=lambda r:r['y']):
  parts=[];prev=None
  for it in sorted(row['items'],key=lambda i:(i['x'],i['y'])):
   text=it['text'].strip()
   if prev and it['h']<prev['h']*.9 and re.fullmatch('[0-9nxy+()=-]+',text) and re.search(r'[A-Za-zπ0-9\u0b80-\u0bff)]$',prev['text']) and not re.fullmatch(r'\(?[A-E]\)?',prev['text'].strip()) and it['x']-(prev['x']+prev['w'])<med*.7:
    if it['y']<prev['y']-2:text=text.translate(SUP)
    elif it['y']>prev['y']+2:text=text.translate(SUB)
   gap=it['x']-(prev['x']+prev['w']) if prev else 0
   if parts and gap>max(1,it['h']*.15):parts.append(' ')
   parts.append(text);prev=it
  output.append(''.join(parts))
 return '\n'.join(output)
def frame(file):
 paper,q=lookup[file];items=[];height=0
 for seg in q['segments']:
  left,top,right,bottom=seg['rect'];page=sources[paper['source']][seg['page']-1]
  for it in page['items']:
   if left<=it['x']<right and top<=it['y']<=bottom:items.append({**it,'x':(it['x']-left)*2.4,'y':(it['y']-top)*2.4+height,'w':it['w']*2.4,'h':it['h']*2.4})
  height+=math.ceil((bottom-top)*2.4)
 return items

def option_anchors(items):
 candidates=[];direct=[]
 for it in items:
  match=re.match(r'^\(\s*([A-E])\s*\)',it['text'].strip())
  if match:direct.append({**it,'label':match[1]});candidates.append({**it,'label':match[1]});continue
  if it['text'].strip() in 'ABCDE' and len(it['text'].strip())==1:
   candidates.append({**it,'label':it['text'].strip()})
  else:
   loose=re.match(r'^([A-E])\s+',it['text'].strip())
   if loose:candidates.append({**it,'label':loose[1]})
 for stream in [direct,candidates]:
  stream.sort(key=lambda i:(round(i['y']/5),i['x']))
  for start in reversed(range(len(stream))):
   if stream[start]['label']!='A':continue
   run=stream[start:]
   if ''.join(i['label'] for i in run) in ['ABCD','ABCDE']:return run
 return []

def ocr_lines(words):
 rows=[]
 for word in sorted(words,key=lambda w:(w['bbox']['y0'],w['bbox']['x0'])):
  box=word['bbox'];middle=(box['y0']+box['y1'])/2
  row=next((r for r in rows if abs(r['y']-middle)<max(7,(box['y1']-box['y0'])*.4)),None)
  if row is None:row={'y':middle,'words':[]};rows.append(row)
  row['words'].append(word)
 return '\n'.join(' '.join(w['text'] for w in sorted(row['words'],key=lambda w:w['bbox']['x0'])) for row in sorted(rows,key=lambda r:r['y']))

def recover(file,language='English',combined=False):
 items=frame(file);anchors=option_anchors(items)
 digest=hashlib.sha256(Path(file).read_bytes()).hexdigest()
 ocr=json.loads((root/'ocr'/f'{digest}.json').read_text(encoding='utf8'))
 if not anchors:
  first=[it for it in items if re.match(r'^\(?\s*A(?:\s*\)|\s|$)',it['text'])]
  if first:
   bottom=max(it['y'] for it in first)
   anchor=min((it for it in first if abs(it['y']-bottom)<5),key=lambda it:it['x'])
   anchors=[{**anchor,'label':'A'}]
  else:return {'error':'missing_option_anchors','ocr':ocr['text']}
 top=min(a['y']-a['h']*.85 for a in anchors)
 stemwords=[w for w in ocr['words'] if (w['bbox']['y0']+w['bbox']['y1'])/2<top]
 if combined:
  tamil=[w for w in stemwords if re.search('[\u0b80-\u0bff]',w['text'])]
  split=min((w['bbox']['y0'] for w in tamil),default=top)
  stemwords=[w for w in stemwords if ((w['bbox']['y0']+w['bbox']['y1'])/2<split if language=='English' else (w['bbox']['y0']+w['bbox']['y1'])/2>=split)]
 native=rich([it for it in items if it['y']<top])
 stem=ocr_lines(stemwords) if language=='Tamil' or combined else native
 stem=re.sub(r'^\s*(?:Q\s*|Question\s*)?\d+[.:]\s*','',stem).strip()
 options={}
 for anchor in anchors:
  peers=[a for a in anchors if abs(a['y']-anchor['y'])<5]
  nextx=min((a['x'] for a in peers if a['x']>anchor['x']+5),default=100000)
  nexty=min((a['y']-a['h']*.85 for a in anchors if a['y']>anchor['y']+5),default=100000)
  y0=anchor['y']-anchor['h']*.85
  selected=[it for it in items if anchor['x']-3<=it['x']<nextx-3 and y0<=it['y']<nexty]
  if combined:
   selectedwords=[w for w in ocr['words'] if anchor['x']-5<=(w['bbox']['x0']+w['bbox']['x1'])/2<nextx-5 and y0<=(w['bbox']['y0']+w['bbox']['y1'])/2<nexty]
   value=ocr_lines(selectedwords)
  else:value=rich(selected)
  value=re.sub(r'^[\s\d]*\(\s*'+anchor['label']+r'\s*\)\s*','',value).strip()
  value=re.sub(r'^\s*\(?\s*'+anchor['label']+r'\s*\)?\s*','',value).strip()
  value=re.sub(r'\s*\(?\s*[A-E]\s*\)?\s*$','',value).strip().rstrip('(').strip()
  options['option_'+anchor['label'].lower()]=value
 return {'question':stem,**options,'ocr_confidence':ocr['confidence'],'native_stem':native,'low_confidence_words':[w['text'] for w in stemwords if w['confidence']<65]}
if __name__=='__main__':
 for f in ['imports/maths-pyq/images/paper-04/q002.webp','imports/maths-pyq/images/paper-07/q001.webp','imports/maths-pyq-additional/images/paper-01/q002.webp']:
  print(f);print(rich(frame(f)))
