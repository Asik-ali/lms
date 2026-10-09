# Tamil question review

Structural screening of all 1000 imported questions; visual inspection of all 12 missing-option cases, both duplicate-option cases, and the original vocabulary PDF page 1. Full linguistic and subject-matter verification is still outstanding.

- Tests: 10
- Questions: 1000
- Questions with missing or unreadable option labels: 12
- Questions with repeated nonempty option text: 2
- Questions flagged for possible extraction damage: 431

## Missing or unreadable options

| Test | Question | Option |
| --- | --- | --- |
| அலகு 2. சொல்லகராதி (ii) (iii) | 22 | B |
| அலகு 2. சொல்லகராதி (ii) (iii) | 43 | A, B, C, D |
| அலகு 3 முழு தேர்வு | 38 | D |
| அலகு 3-எழுதும் திறன் ( i) | 17 | A |
| தமிழ் - இலக்கணம் i)எழுத்து | 61 | C |
| தமிழ் - இலக்கணம் i)எழுத்து | 82 | A |
| தமிழ் -இலக்கணம் (full) | 4 | B |
| தமிழ் -இலக்கணம் (full) | 28 | A |
| தமிழ் -இலக்கணம் (full) | 72 | B |
| தமிழ் -இலக்கணம் (full) | 84 | B |
| தமிழ் அலகு 2 (முழு தேர்வு) | 79 | B |
| தமிழ் அலகு 2 (முழு தேர்வு) | 98 | B |

Most entries have the text in the original TXT but malformed labels such as Greek Α/Β, `[D)`, `((B)`, `8)`, or a missing bracket. Vocabulary (ii)/(iii), question 43 has four numbered statements and no A–D answer choices in the supplied TXT. Unit 2 Full Test questions 79 and 98 contain repeated option labels and need comparison with the PDF.

## Repeated option text

- தமிழ் - இலக்கணம் i)எழுத்து, question 57: தொன்மைச் சிறப்பும் தலைமைச் சிறப்புமே தமிழை இன்று உயர்தனிச்
செம்ம மொழிகளாய் உயர்ந்து நிற்கச் செய்துள்ளது / தொன்மைச் சிறப்பும் தலைமைச் சிறப்புமே தமிழை இன்று உயர்தனிச்
செம்ம மொழியாய் உயர்ந்து நிற்கச் செய்துள்ளன / தொன்மைச் சிறப்பும் தலைமைச் சிறப்புமே தமிழை இன்று உயர்தனிச்
செம்ம மொழிகளாய் உயர்ந்து நிற்கச் செய்துள்ளது / தொன்மைச் சிறப்பும் தலைமைச் சிறப்புமே தமிழை இன்று உயர்தனிச்
செம்ம மொழியாய் உயர்ந்து நிற்கச் செய்துள்ளது
- தமிழ் -இலக்கணம் ii) சொல், question 33: சென்னைக்கு அருகாமையில் இருப்பது மதுரை அல்ல / சென்னைக்கு பக்கத்தில் இருப்பது மதுரை இல்லை / சென்னைக்கு அருகாமையில் இருப்பது மதுரை அல்ல / சென்னைக்கு அருகில் இருப்பது மதுரை அன்று

## Original PDF findings

| Test | Question | PDF page | Finding |
| --- | --- | --- | --- |
| அலகு 2. சொல்லகராதி (ii) (iii) | 22 | 7 | PDF has option B with text அதனால்; TXT uses Greek Β, which the parser did not recognize. Repair parser label recognition. |
| அலகு 2. சொல்லகராதி (ii) (iii) | 43 | 14 | PDF also has four numbered statements and no A–D answer choices. Author must specify how the statements map to the supplied answer letter; do not invent choices. |
| அலகு 3 முழு தேர்வு | 38 | 11 | PDF has complete option D; TXT label is malformed as [D). Repair label parsing; preserve intentionally incorrect sentences. |
| அலகு 3-எழுதும் திறன் ( i) | 17 | 5 | PDF has complete option A; TXT uses Greek Α. Repair parser label recognition. |
| தமிழ் - இலக்கணம் i)எழுத்து | 61 | 17 | Third option is labeled O in the PDF itself. Normalize label to C after source review; preserve its intentionally different spelling. |
| தமிழ் - இலக்கணம் i)எழுத்து | 82 | 23 | PDF has complete option A; TXT label is malformed as A]. Repair label parsing. |
| தமிழ் -இலக்கணம் (full) | 4 | 1 | Second option is labeled 8) in the PDF itself. Normalize label to B after source review. |
| தமிழ் -இலக்கணம் (full) | 28 | 8 | PDF option A is missing the closing bracket. Repair label parsing. |
| தமிழ் -இலக்கணம் (full) | 72 | 21 | PDF option B has an extra opening bracket. Repair label parsing. |
| தமிழ் -இலக்கணம் (full) | 84 | 25 | PDF option B has an extra opening bracket. Repair label parsing. |
| தமிழ் அலகு 2 (முழு தேர்வு) | 79 | 24 | PDF itself labels both the second and fourth choices D. Normalize second choice label to B after source review. |
| தமிழ் அலகு 2 (முழு தேர்வு) | 98 | 29 | PDF itself labels both the second and third choices C. Normalize second choice label to B after source review. |
| தமிழ் - இலக்கணம் i)எழுத்து | 57 | 16 | Repeated A/C option text is also present in the PDF. Author review required to produce distinct choices. |
| தமிழ் -இலக்கணம் ii) சொல் | 33 | 9 | Repeated A/C option text is also present in the PDF. Author review required to produce distinct choices. |

## Examples checked against the source PDF

- அலகு 2 - சொல்லகராதி (i), question 4: ஒரு மொழியைத் ததோக → ஒரு மொழியைத் தேர்க.
- அலகு 2 - சொல்லகராதி (i), question 4: மமோ → மோ.

## Next steps

- Repair option labels using the original PDF; do not infer missing answer text.
- Review doubled Tamil characters and detached letter fragments against source pages.
- Preserve deliberately incorrect spellings, sentences, and matching pairs used as answer choices.
- Preserve answer letters and question order; supplied answer keys are not independent proof of subject-matter correctness.
- Keep tests as drafts until source discrepancies have been resolved.
