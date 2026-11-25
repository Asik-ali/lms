from pathlib import Path
import json,math
rows={}
data='''1|D|20+(8*2+6*3-10/5)|52
2|B|6+12/3*8-3|35
3|B|(2/5)*(-3/7)-(1/6)*(3/2)+(1/14)*(2/5)|-0.39285714285714285
4|B|14*10+4-16/8|142
5|C|20+(8*2+6*3-10/5)|52
6|C|7+1|8
7|C|40+1|41
8|C|(3*15+19)/8-6|2
9|A|3|3
10|A|12/(4**0.5)+(2**0.5)*(8**0.5)|10
11|C|2*15-7+100/10|33
12|D|8/(1+3)*(3+3)|12
13|C|16/(-4)|-4
14|A|(7-3)*(7+3)+(3-2)*(3+2)+(2-7)*(2+7)|0
15|B|3.5*5.75/(4.6*4.375)|1
16|D|1+3+3+4|11
17|B|(3+4+7)/7|2
18|B|18*12/4+5-6|53
19|C|100+8/2+(3*2-6/2)|107
20|B|1-1/1|0
21|B|(2+1/3)+(1+5/6)+20/3-(7+1/3)|3.5
22|C|20+(8*2+6*3-10/5)|52
23|D|2**65-(2**65-1)|1
24|A|15/25*5|3
25|C|(6**2+5**2)/(6**2-5**2)|5.545454545454546
26|A|35568/456/650*100|12
27|C|(4+1*32/2-10)*(7*3+8/4+7)|300
28|C|14/2-12/3|3
29|A|(1-1/2)*(1/2-1/4)/(3/4-1/2)|0.5
31|B|5*(5**2+3*14)|335
32|D|14*15*10+5|2105
33|C|0+1|1
34|C|5**3|125
35|A|1**3+2**3-3**3+3*1*2*3|0
36|B|(7-5)*(7-3)|8
37|C|1/(7+1)+1/(7+1)|0.25
38|A|-1/3-(1/((2/3)*(5/7))+8-(5-1/2-1/4))|-6.183333333333334
39|C|(1+1/2)/3|0.5
40|C|1|1
41|C|(49+(220+(16+81**0.5)**0.5)**0.5)**0.5|8
42|D|1/100|0.01
43|D|((679+458)**2-(679-458)**2)/(679*458)|4
44|B|128+681|809
45|C|2**10/2|512
46|B|3|3
47|D|6*999+(1+2+3+4+5+6)/7|5997
48|C|(18+26/27)**(1/3)|2.6666666666666665
49|A|7**2+7*3+3**2|79
50|B|8.94-3.56|5.38
51|B|(4/3+3/2)+(-5/3)/(30/12)|2.1666666666666665
52|B|2**65-(2**65-1)|1
53|B|5.5+(3/4)*(8/9)|6.166666666666667
54|A|4/3+3/2-(5/3)/(30/12)-(12/9)*(-27/16)|4.416666666666667
55|C|(0.1**2+0.01**2)/0.0101|1
56|C|((2*(-1)-1)**2+(2*2-1)**2)/2|9
57|D|(49*((7-3)**2)**2)**0.5|112
58|B|((4356**2-2171**2)/2185)/(4356+2171)|1
59|A|2**2|4
60|C|25*32/4-12+3|191
61|C|((234+2*108)/(234-2*108))**0.5|5
62|A|7**2-7*3+3**2|37
63|B|2*6-12/(4+2)|10
64|B|7**0|1
65|D|(4*3+5*2)/(4*3-5*2)|11
66|B|((3**0.5+1)-2/(3**0.5+1))**2|4
67|B|3**2-1|8
68|A|(7+3/10)-(10+7/21)|-3.033333333333333
69|C|968+512*79/4|11080
70|C|(2+8+2+7)-(5+0+3)|11
71|C|(383+(302-(164+(28-9**0.5)**0.5)**0.5)**0.5)**0.5|20
72|B|cbrt(-121+cbrt(-61+cbrt(-26+cbrt(-1))))|-5
73|B|100+8/2+(3*2-6/2)|107
74|B|(3+4+7)/7|2'''
for line in data.splitlines():
 n,a,e,v=line.split('|');rows[n]={'answer':a,'expression':e,'value':float(v),'status':'verified','reason':''}
notes={2:'Replace the custom operators, then apply ordinary multiplication/division precedence.',4:'Replace the operators to obtain14*10+4−16/8.',6:'Five identical powers5⁷ sum to5*5⁷=5⁸.',7:'Two identical powers2⁴⁰ sum to2⁴¹.',9:'For the positive convergent nested radical L, L²=3L givesL=3.',10:'Computed value10 corresponds to letterE, which is choiceA.',12:'y=2(x+3).',14:'The three exponent differences telescope to zero, leaving1/m; require m≠0.',16:'Sequence1,3,4,7,11; expression addsF4+F3.',20:'x+1/x=2 implies(x−1)²=0 andx=1.',23:'Finite geometric sumB=2⁶⁵−1.',24:'x=3,y=30.',26:'Interpret the denominator as(?/100)*650; add parentheses to remove operator ambiguity.',27:'After substitution the numerator is10, denominator30, and outer÷becomes×.',28:'Common termp³q² has coefficient7−4=3.',31:'x³−y³=(x−y)[(x−y)²+3xy].',32:'Intended analogy concatenates the product with digit5:14*15=210→2105.',33:'The summands end in0 and1.',34:'log_x5=1/3, hencex=5³=125.',35:'Expression is0, matchingA=x+y−z.',36:'Cancel valid nonzero factors to obtain(x−5)(x−3), withx≠−5,−3,3.',37:'Each fraction simplifies to1/(x+1), excluding original denominator zeros.',38:'Exact result−371/60=−6 11/60. Printed optionA=−5 41/60 is wrong; replace it.',39:'Write reciprocal base as(p/q)^−1/2; then1−3x=−1/2, x1/2. Requirep/q>0 andp≠q.',40:'Self-additive-inverse meansa+b=0, so−a=b.',41:'Nested roots from inside are9,5,15,8.',42:'Product telescopes(1/2)(2/3)...(99/100)=1/100.',44:'128+681=809 givesA8,B1.',45:'Half2¹⁰=2⁹.',46:'Positive convergent fixed pointL²=3L gives3.',47:'Source image fractions are1/7,2/7,3/7,4/7,5/7,6/7. The PDF text layer incorrectly maps2/7to⅔and3/7to⅜; use the visually checked sevenths.',48:'If original fraction=f, f²÷(1/f)=f³=512/27; f=8/3.',49:'Combine denominators to get(x³−y³)/(x−y)=x²+xy+y².',50:'Difference-of-cubes factorization cancels to8.94−3.56.',52:'Finite geometric sumB=2⁶⁵−1.',56:'2x−1=±3 givesx=−1or2.',57:'Principal square root is7|(x−y)²|=7(x−y)².',58:'Difference of squares cancels both factors;4356−2171=2185.',59:'Withy≠0, multiplying through givesy²=4, hence±2.',61:'The data determines the ratio up to sign. Statea>b>0to obtain the intended positive5; without an ordering assumption±5are possible.',62:'Cancel(a+b)and(a−b)to obtaina²−ab+b², preserving original restrictions.',64:'P⁰=1requiresP≠0; add that condition.',67:'(x⁴−1)/(x²+1)=x²−1=8; both±3satisfy.',70:'Alternating digit sum=11−x; the only digit giving a multiple of11isx0.',71:'Inner results3,5,13,17,20.',72:'Real cube roots from inside are−1,−3,−4,−5.'}
for n,r in notes.items():rows[str(n)]['reason']=r
rows['30']={'answer':None,'status':'ambiguous_source','reason':'The ellipsis does not specify the intervening factors. Answer0requires an explicit zero factor(100−100), which is not stated; retain for source clarification rather than invent the product range.'}
rows['38']['source_correction']={'option_a':'−6 11/60'}
rows['61']['source_correction']={'stem_condition':'a>b>0'}
rows['64']['source_correction']={'stem_condition':'P≠0'}
rows['47']['visually_verified_fraction_sequence']=['1/7','2/7','3/7','4/7','5/7','6/7']
assert len(rows)==74
Path('imports/maths-pyq-text/audit-simplification.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
