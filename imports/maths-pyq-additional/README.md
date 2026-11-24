# Additional Maths PYQ topics

Five supplied PDFs add 141 distinct questions to the existing Maths PYQ series:

| Topic | Questions | Sources |
| --- | ---: | --- |
| Compound Interest | 85 | English and Tamil PDFs |
| AP and GP | 48 | English and Tamil PDFs, including special-series questions |
| Age Problems | 8 | One bilingual PDF |

All tests remain Draft. The two language copies share question IDs and original numbering. The printed keys agree for AP/GP and Compound Interest. The Age Problems key was visually transcribed from page 2 as D, A, A, C, D, A, B, C. Original question images preserve mathematical notation and Tamil glyphs. AP/GP Q48 has options on the following page; its crop combines both pages without the answer key.

The earlier 940 questions remain unchanged, including Average Q1-26. Combined total: 1,081 questions across 13 topics. The two earlier source-key conflicts remain unassigned.

## Reproduce

```powershell
$env:MATHS_IMPORT_ROOT='imports/maths-pyq-additional'
node scripts/extract-maths-pyq.mjs --additional
python scripts/prepare-maths-pyq.py
python scripts/merge-maths-pyq.py
node scripts/render-maths-pyq-questions.mjs
node scripts/upload-maths-pyq.mjs --check
node --env-file=.env scripts/upload-maths-pyq.mjs
node --env-file=.env scripts/verify-maths-pyq.mjs
```

Sources are read from Downloads. The Age Problems PDF has an incomplete text layer, so its eight visually inspected question rectangles and printed answer key are explicitly preserved in the preparation script. No source PDF is modified.
