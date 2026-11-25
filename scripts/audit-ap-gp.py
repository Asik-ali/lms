from pathlib import Path
import json
rows={}
data='''1|A|21*(0.4+1)/2|14.7
2|D|6/7|0.8571428571428571
3|C|5*10-1|49
4|A|-11+18*(-4)|-83
5|A|7**2+3|52
6|C|(8*9/2)**2|1296
7|D|8**3-1|511
8|C|18+(-3)|15
9|C|20+29*2|78
10|C|9*(1/3)**7|0.00411522633744856
11|B|(90-144)/(24-21)|-18
12|D|1+(-54-16)/(-5)|15
13|D|28*(2+27*4)/2|1540
14|A|2+20*1.5|32
15|D|26*(48-25*3)/2|-351
16|B|3-1|2
17|B|28*29*57/6-14*15*29/6|6699
18|C|-23+23|0
19|C|-100+11*2|-78
20|B|40*(6+39*4)/2|3240
21|C|40*41|1640
22|A|55**2|3025
23|D|36*(2*5+35*4)/2|2700
24|A|44100**0.5|210
25|A|-12+12|0
26|A|0.015/0.15|0.1
27|B|(1/18)*(2/3)|0.037037037037037035
28|A|(2*7-1)-(7-1)|7
29|A|325**2|105625
30|D|36*37/2|666
31|D|25**2|625
32|B|9*(2*9+3)|189
33|D|2**10|1024
34|A|7**2|49
35|B|(4**6-1)/3|1365
36|B|40**2|1600
37|C|40**2|1600
39|A|35*36*71/6-11*12*23/6|14404
40|C|(-1)**2+(-25)**2|626
41|D|972*3**2|8748
42|A|(11*12/2)**2|4356
43|A|(6/25)/(2/5)|0.6
44|C|(15*16/2)**2-15*16/2|14280
45|A|(20*21/2)**2|44100
46|D|(5/3+5)/(5/3+15)|0.4
47|D|28*29*57/6-14*15*29/6|6699
48|B|(1/18)*(2/3)|0.037037037037037035'''
for line in data.splitlines():
 n,a,e,v=line.split('|');rows[n]={'answer':a,'expression':e,'value':float(v),'status':'verified','reason':''}
notes={2:'Pattern n/(n+1); the sixth term is 6/7.',3:'S(n)-S(n-1)=5n-1.',5:'Odd-position terms are n²+3; even-position terms are n²+1. Next terms 52,65.',6:'Sum of cubes=[n(n+1)/2]²; n=8 gives 1296.',8:'The two interior terms sum to the two endpoints in a four-term AP.',14:'Terms are 2, 3½, 5, 6½; common difference 1½.',15:'The positive solution of n(51-3n)/2=-351 is 26.',16:'For an even-length GP, total=(1+r) times odd-position sum; r=2.',18:'9(a+8d)=15(a+14d) implies a=-23d, so term 24 is zero.',22:'Sum of cubes equals the square of the corresponding sum of integers.',24:'Sum of integers is the positive square root of the cube sum.',25:'6(a+5d)=7(a+6d) implies a=-12d, so term 13 is zero.',27:'Successive ratio is 2/3.',28:'[a+(2n-1)d]-[a+(n-1)d]=nd; expression checks n=7,d=1.',30:'Positive solution of n(n+1)/2=666 is 36.',32:'Positive solution of n(2n+3)=189 is 9.',33:'Terms are 2¹ through 2¹⁰.',34:'If sum of integers is k, sum of cubes is k²; expression checks k=7.',35:'Six-term GP sum is 1365.',40:'X=-1 because alternating terms cancel; every term of Y is -1, giving Y=-25.',42:'Cube-sum identity gives n(n+1)/2=66, hence n=11.',45:'Cube-sum identity gives n(n+1)/2=210, hence n=20.',46:'11(a+9d)=8(a+13d) implies a=5d/3, then t6/t16=2/5.',48:'Successive ratio is 2/3.'}
for n,note in notes.items():rows[str(n)]['reason']=note
rows['38']={'answer':None,'status':'divergent_series','reason':'The common ratio is -3 and its modulus exceeds 1. The infinite series does not converge. Printed A=4 incorrectly applies a/(1-r) outside its convergence condition.'}
assert len(rows)==48
Path('imports/maths-pyq-text/audit-ap-gp.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
