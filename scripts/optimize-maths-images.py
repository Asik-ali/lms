"""Optimize PNG encoding without changing any decoded pixels or dimensions."""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image, ImageChops

papers = json.loads(Path('imports/maths/prepared.json').read_text(encoding='utf8'))
rows = []
for paper in papers:
    for question in paper['questions']:
        source = Path(question['source_image'])
        original_bytes = source.read_bytes()
        original = Image.open(io.BytesIO(original_bytes)).convert('RGB')
        candidates = [original_bytes]
        versions = [original]
        r,g,b = original.split()
        if not ImageChops.difference(r,g).getbbox() and not ImageChops.difference(r,b).getbbox():
            versions.append(r)
        for version in versions:
            buffer = io.BytesIO()
            version.save(buffer,format='PNG',optimize=True,compress_level=9)
            candidates.append(buffer.getvalue())
        best = min(candidates,key=len)
        decoded = Image.open(io.BytesIO(best)).convert('RGB')
        if decoded.size != original.size or decoded.tobytes() != original.tobytes():
            raise ValueError(f'Pixel mismatch: {source}')
        output = Path(str(source).replace('/final/','/optimized/'))
        output.parent.mkdir(parents=True,exist_ok=True)
        output.write_bytes(best)
        rows.append({'source':source.as_posix(),'optimized':output.as_posix(),'objectPath':source.as_posix().replace('imports/maths/question-images/',''),'before':len(original_bytes),'after':len(best),'sha256':hashlib.sha256(best).hexdigest()})
before,after = sum(r['before'] for r in rows),sum(r['after'] for r in rows)
report = {'count':len(rows),'beforeBytes':before,'afterBytes':after,'savedPercent':round(100*(1-after/before),2),'pixelIdentical':True,'images':rows}
Path('imports/maths/image-optimization.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k != 'images'}))
