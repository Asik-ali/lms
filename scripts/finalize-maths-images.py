import json
import html
from pathlib import Path
from PIL import Image

target = Path('imports/maths/prepared.json')
papers = json.loads(target.read_text(encoding='utf8'))
for paper_index, paper in enumerate(papers):
    for question in paper['questions']:
        paths = question['source_images']
        if not paths:
            raise ValueError(f'Missing original image: {paper["name"]} Q{question["number"]}')
        images = [Image.open(path).convert('RGB') for path in paths]
        canvas = Image.new('RGB', (max(image.width for image in images), sum(image.height for image in images)), 'white')
        y = 0
        for image in images:
            canvas.paste(image, (0,y))
            y += image.height
        output = Path(f'imports/maths/question-images/final/paper-{paper_index+1:02d}/q{question["number"]:02d}.png')
        output.parent.mkdir(parents=True,exist_ok=True)
        canvas.save(output)
        question['source_image'] = output.as_posix()
target.write_text(json.dumps(papers,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Preserved {sum(len(p["questions"]) for p in papers)} original question images')
preview = ['<!doctype html><meta charset="utf-8"><title>Maths source review</title><style>body{font:16px system-ui;max-width:1000px;margin:24px auto;padding:16px;background:#eef2f6}article{background:white;padding:20px;margin:16px 0;border-radius:10px}img{width:100%;height:auto}summary{cursor:pointer;padding:12px}h2{margin-top:40px}</style><h1>Maths PDF question review</h1><p>Original PDF question images. Missing answers remain unassigned. Imports remain Draft pending review.</p>']
for paper in papers:
    preview.append(f'<details><summary>{html.escape(paper["name"])} — {len(paper["questions"])} questions</summary>')
    for question in paper['questions']:
        image = question['source_image'].replace('imports/maths/','')
        preview.append(f'<article><h3>Question {question["number"]}</h3><img loading="lazy" src="{image}" alt="Original PDF question"><p>Source key: {question["correct_answer"] or "Missing / unreadable — needs review"}</p></article>')
    preview.append('</details>')
Path('imports/maths/review.html').write_text('\n'.join(preview),encoding='utf8')
