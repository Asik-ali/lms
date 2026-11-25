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
   if prev and it['h']<prev['h']*.9 and re.fullmatch('[0-9nxy+()=-]+',text) and re.search(r'[A-Za-zπ\u0b80-\u0bff)]$',prev['text']) and not re.fullmatch(r'\(?[A-E]\)?',prev['text'].strip()):
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
if __name__=='__main__':
 for f in ['imports/maths-pyq/images/paper-04/q002.webp','imports/maths-pyq/images/paper-07/q001.webp','imports/maths-pyq-additional/images/paper-01/q002.webp']:
  print(f);print(rich(frame(f)))
