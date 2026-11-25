from pathlib import Path
import json
rows={}
data='''1|B|528/1.2*1.25|550
2|A|32000*(0.95*1.1*1.125-1)|5620
3|B|528/1.2*1.25|550
4|C|((200-5)*12-200*10)/(200*10)*100|17
5|C|(5-4)/4*100|25
6|A|(600-480)/600*100|20
7|D|((100/12*60)-320)/320*100|56.25
8|B|4275/0.95*1.05|4725
9|B|(1-1.15*0.85)*100|2.25
10|D|(426000+9000+15000-441000)/(426000+9000+15000)*100|2
11|B|1/5*100|20
12|A|15000*0.85|12750
13|D|(25/20-1)*100|25
14|D|15000/(0.85*0.75)|23529.41176470588
15|C|450*1.2/0.9|600
16|C|1200*1.3*0.8|1248
17|C|((12-2)*200-12*160)/(12*160)*100|4.166666666666667
18|B|12000-10000|2000
19|D|(1500-1350)/1500*100|10
20|C|(12/10-1)*100|20
21|D|414/1.15|360
22|C|10**2/100|1
23|C|1700*0.9|1530
24|D|140000/0.8|175000
25|B|(875*10-8400)*100/(8400*(10/12))|5
26|A|(1500+500-1800)/(1500+500)*100|10
27|A|1|1
28|C|25*(55+11)|1650
29|C|(1500-1350)/1500*100|10
30|A|(1250+250-1400)/(1250+250)*100|6.666666666666667
31|A|(300000-200000-50000)/(200000+50000)*100|20
32|D|(14355-13050)/13050*100|10
33|A|405/1.2|337.5
34|C|(9*250-10*210)/(10*210)*100|7.142857142857143
35|D|(1.25-8/10)/(8/10)*100|56.25
36|A|300*0.8*1.1|264
37|B|(16/12-1)*100|33.333333333333336
38|B|6*1+3*2|12
39|A|3680-2*1680|320
40|B|10**2/100|1
41|C|10**2/100|1
42|A|2200*0.8/1.1|1600
43|C|(1.15*1.1-1)*100|26.5
44|A|24/0.8*0.7|21
45|A|770*(1/0.8-1)/3.5|55
46|D|((20+35)*6.5-(20*5+35*7))/(20*5+35*7)*100|3.6231884057971016
47|D|54000*(1-1/6-1/3-1/4)|13500
48|C|3.5/10|0.35
49|C|24*0.75|18
50|B|984000*(1-1/3-1/4-1/5)|213200
51|A|2*8+1|17
52|B|400*250/8|12500'''
for line in data.splitlines():
 n,a,e,v=line.split('|');rows[n]={'answer':a,'expression':e,'value':float(v),'status':'verified','reason':''}
notes={2:'Successive multipliers are.95,1.1,1.125; final capital37620and net gain5620.',7:'Selling100bananas at60per dozen earns500; gain180/320=56.25%.',9:'Successive markup and discount leave.9775of cost, a2.25%loss.',11:'Selling5articles gains the cost of1, hence20%.',13:'Unit selling price is25/20times unit cost.',14:'With stated15%and25%successive discounts, marked price=23529.4118. Printed D=25000does not satisfy these discounts.',16:'Sale1248; cost1200; gain4%.',17:'Cost1920, sale2000, profit80/1920=4.1667%.',18:'Profit2000.',22:'Equal sale prices and equal gain/loss percentages yield net loss p²/100=1%.',25:'Assumes flat simple interest on the original8400for10months: interest350gives5%annual. State the flat-rate and annual convention; reducing-balance EMI interest is different.',27:'Gain/loss percentage denominator is cost price.',28:'Total sale25*(55+11)=1650, not price per cake66.',30:'Cost1500,sale1400,loss6⅔%.',34:'Cost2100,sale2250; profit7⅐%.',37:'Unit sale/unit cost16/12, giving33⅓%.',38:'Solving5p+4e13and9p+5e19givesp1,e2; requested total12.',39:'Three shirts+four pants3680minus twice(one shirt+two pants1680)gives shirt320,pant680.',40:'Same selling price594and opposite10%rates give1%overall loss.',41:'Same selling price594and opposite10%rates give1%overall loss.',43:'Combined multiplier1.15*1.1=1.265.',45:'Extra quantity=770/(.8p)−770/p=3.5, hencep55.',46:'Cost345,sale357.5,gain12.5; percent250/69=3 43/69%.',50:'Agarwal invests13/60of capital.',51:'After2kdays balance5k; on day2k+1balance5k+20. First60occursk8,on day17.',52:'Unit area costs37.5,33⅓,31.25; paintCcosts12500for400m².'}
for n,r in notes.items():rows[str(n)]['reason']=r
rows['14']['source_correction']={'option_d':'₹23,529.41 (approximately)'}
assert len(rows)==52
Path('imports/maths-pyq-text/audit-profit-loss.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
