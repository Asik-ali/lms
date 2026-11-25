from pathlib import Path
import json
rows={}
data='''1|B|2*128/32|8
2|A|(22/7)/4|0.7857142857142857
3|B|((200/2+14)/2)*((200/2-14)/2)|2451
4|A|(3**0.5)/4*(180/3)**2|1558.8457268119896
5|C|(600/30*5)*(600/30*12)/2|12000
6|B|2*(41+2*20)**0.5|18
7|C|24*25*49/6-10*11*21/6|4515
8|C|8*9*17/6|204
9|B|(192/3)**0.5*3|24
10|D|2*63/7-5|13
11|D|200*(40*25/2)/10000*45|450
12|C|2**2|4
13|C|40**2/25|64
14|B|(800/2/1.6)**2*0.6|37500
15|C|(2*3**3+16)/(2*(3+2))|7
16|B|1|1
17|A|7*24/2|84
18|A|0.5*(30/2)*26|195
19|C|20*12|240
20|B|(4*900)**0.5|60
21|C|(15+20+25)/2|30
22|C|0.5*(22/7)*28**2|1232
23|B|1/0.5|2
24|A|10*8/2|40
25|A|2*(22/7)*56/4|88
26|A|(50/2/5*3)*(50/2/5*2)|150
27|B|(1.2**2-1)*100|44
28|A|(18+12)/2*10|150
29|A|(22/7)*7**2|154
30|A|2*21+60/360*2*(22/7)*21|64
31|A|(16/25)**0.5|0.8
32|A|12*(13**2-12**2)**0.5/2|30
33|A|(22/7)*(440/(2*(22/7)))**2|15400
34|A|(2*6050)**0.5|110
35|A|(20+4)*(15+4)-20*15|156
36|A|4*20/(2**0.5)|56.5685424949238
37|A|(96/2/4)**2*3|432
38|A|(616/(22/7))**0.5-(154/(22/7))**0.5|7'''
for line in data.splitlines():
 n,a,e,v=line.split('|');rows[n]={'answer':a,'expression':e,'value':float(v),'status':'verified','reason':''}
notes={2:'Largest inscribed circle has radiusa/2; areaπa²/4≈11a²/14usingπ22/7.',3:'Length57,breadth43,area2451.',4:'Equilateral side60cm, area900√3≈1558.85; source1558.8is approximate.',5:'Sides100,240,260form a right triangle.',6:'(l+b)²=l²+b²+2lb=41+40=81; perimeter18.',7:'Sum of square areas isΣk²,k11through24.',8:'All squares countΣk²,k1through8=204.',10:'Area=(7/2)(5+x)=63.',11:'Total tiled area100000cm²=10m².',14:'L250,B150.',15:'Factor2x³+16=2(x+2)(x²−2x+4); quotientx²−2x+4. Expression checksx3.',16:'A rectangle rotated about a side produces a general cylinder. A square also does so as a special case; replace overlapping square distractorA with a semicircle.',17:'7²+24²=25².',19:'B(B+8)=240givesB12,L20; requested orderL,Bis20,12.',20:'(√3/4)s²=900√3.',23:'A circle has twice the area of a semicircle of equal radius.',25:'The wire length is preserved.',30:'Perimeter of a sector includes two radii plus arc length.',31:'Perimeter scales linearly with side, not area.',34:'Diagonal²=2*area.',35:'External border adds4mto each dimension.',36:'Perimeter=4d/√2=40√2.',38:'Inner radius7cm,outer14cm.'}
for n,r in notes.items():rows[str(n)]['reason']=r
rows['16']['source_correction']={'option_a':'Semicircle / அரைவட்டம்'}
assert len(rows)==38
Path('imports/maths-pyq-text/audit-2d.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
