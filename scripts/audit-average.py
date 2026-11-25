from pathlib import Path
import json
rows={}
data='''1|A|18*3-12-28|14
2|C|10*21-9*(21-2/12)|22.5
3|B|(25*78.4-69+96)/25|79.48
4|D|(5*28-3*24)/2|34
5|A|5*27-4*25|35
6|B|(60+2*66)/3|64
7|B|45+4|49
8|C|4*60-56-68-72|44
9|A|(5*28-3*24)/2|34
10|B|(1+3+3+3+5)/5|3
11|A|(10**2-1)/12|8.25
12|C|(3500+2700+3000+2800+3900+2100)/6|3000
13|A|(100*40-83+53)/100|39.7
14|A|(4+5)/2|4.5
15|C|1|1
16|B|(3500+2700+3000+2800+3900+2100)/6|3000
17|D|6|6
18|D|28-18|10
19|B|20-1|19
20|C|8/4|2
21|D|(30+34)/2|32
22|D|(18+20)/2|19
23|B|3|3
24|A|6.25**0.5|2.5
25|A|(100*40-83+53)/100|39.7
26|B|45+4|49'''
for line in data.splitlines():
 n,a,e,v=line.split('|');rows[n]={'answer':a,'expression':e,'value':float(v),'status':'verified','reason':''}
notes={2:'After death the average is 20 years 10 months. Deceased age=210-9*(20+10/12)=22.5 years. Printed choice C says 22 years; correct it to 22 years 6 months.',6:'Uses the empirical relation mode=3 median−2 mean; name that assumption in the question.',10:'Only set B has mean=median=mode=3.',11:'Mean=(1+10)/2=5.5; population variance=(10²−1)/12=8.25.',14:'Total frequency 20: cumulative counts are 1,4,6,10,18,20. Observations 10 and 11 are 4 and 5.',15:'Arithmetic mean measures central tendency; range, standard deviation and variance measure dispersion.',17:'Six occurs nine times, more often than any other listed value.',18:'The 16-18 class has zero frequency; occupied class bounds span 18 to 28.',20:'Median is 4a, so a=2.',21:'Sorted data 24,29,30,34,35,38.',22:'Sorted data 12,14,17,18,20,23,24,25.',23:'Translation does not affect standard deviation; scaling by 3 multiplies it by |3|.'}
for n,r in notes.items():rows[str(n)]['reason']=r
rows['2']['source_correction']={'option_c':'22 years 6 months'}
Path('imports/maths-pyq-text/audit-average.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
