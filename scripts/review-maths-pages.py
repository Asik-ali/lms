from pathlib import Path
import io
import pymupdf
from PIL import Image, ImageDraw

root = Path(r'C:\Users\asik1\Desktop\examsticks pdf')
document = pymupdf.open(root/'Profit and Loss (25).pdf')
canvas = Image.new('RGB', (2100, 620), 'white')
draw = ImageDraw.Draw(canvas)
for index, page in enumerate(document):
    image = Image.open(io.BytesIO(page.get_pixmap(matrix=pymupdf.Matrix(.21,.21)).tobytes('png')))
    canvas.paste(image, (index*300, 20))
    draw.text((index*300,0), str(index+1), fill='black')
canvas.save('imports/maths/profit-contact.png')
paths = sorted(Path('imports/maths/question-images/english-profit-and-loss').glob('q*-1.png'))
canvas = Image.new('RGB',(2000,2200),'#dddddd')
draw = ImageDraw.Draw(canvas)
for index,path in enumerate(paths):
    image = Image.open(path)
    image.thumbnail((390,410))
    x,y = (index%5)*400,(index//5)*440
    canvas.paste(image,(x,y+20))
    draw.text((x,y),path.name,fill='black')
canvas.save('imports/maths/profit-crops-review.png')
