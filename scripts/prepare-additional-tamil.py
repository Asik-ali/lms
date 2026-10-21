import pymupdf as pdf
from pathlib import Path

out = Path('imports/tamil-additional/source')
out.mkdir(parents=True, exist_ok=True)
for name in ['அலகு 5-முழு தேர்வு.pdf', 'அலகு 6(முழு தேர்வு).pdf', 'அலகு 7 (திருக்குறள், அறநூல்கள்).pdf', 'அலகு - 7 முழு தேர்வு.pdf', 'unit 7 2.pdf']:
    document = pdf.open(Path('C:/Users/asik1/Downloads') / name)
    (out / (Path(name).stem + '.txt')).write_text('\n'.join(page.get_text() for page in document), encoding='utf-8')
    document[0].get_pixmap().save(str(out / (Path(name).stem + '.png')))
