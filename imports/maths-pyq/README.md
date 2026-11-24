# Maths PYQ import

This batch creates a separate `Maths PYQ` series with ten topic tests. Paired PDFs share question IDs and numbering; English/Tamil switching changes the displayed source image. PDFs that already contain both languages retain both in one image.

| Topic | Questions | Language |
| --- | ---: | --- |
| Simplification | 74 | English / Tamil |
| LCM and HCF | 180 | English / Tamil |
| Percentage | 111 | English / Tamil |
| Ratio and Proportion | 101 | English / Tamil |
| Average | 26 | English / Tamil; Q1-26 requested by user |
| Profit and Loss | 52 | English / Tamil |
| Simple Interest | 130 | English / Tamil |
| Time and Work | 131 | English / Tamil |
| 2D Mensuration | 38 | English / Tamil |
| 3D Mensuration | 97 | English / Tamil |
| Total | 940 | |

The 15 original PDFs plus the subsequently supplied Tamil Simple Interest PDF contain 1,664 source question instances. The reattached Tamil Ratio PDF is identical to the original and is not imported twice. Average Q27 is retained in source artifacts but deliberately excluded from the requested Q1-26 import.

Tests remain Draft. Two conflicting printed keys remain unassigned: 3D Q55 (English D / Tamil A) and Percentage Q80 (English A / Tamil C). The remaining 938 answers use the supplied source keys. Tamil Simple Interest and Time and Work have no separate keys; their matching English keys are used by original question number. No mathematical correctness beyond source-key matching is claimed.

Original images preserve Tamil glyphs, fractions, exponents and diagrams. Option E is retained in question metadata and supported by the student taking/result views. No database schema change is required.

## Reproduce

Requires Node dependencies from package-lock.json and Python 3 for the standard-library-only preparation scripts. Original PDFs are read from `C:\Users\asik1\Desktop\examsticks pdf\Today`; the additional Tamil Simple Interest PDF is read from Downloads. No source PDF is modified.

```powershell
node scripts/extract-maths-pyq.mjs
python scripts/prepare-maths-pyq.py
python scripts/merge-maths-pyq.py
node scripts/render-maths-pyq-questions.mjs
node scripts/upload-maths-pyq.mjs --check
node --env-file=.env scripts/upload-maths-pyq.mjs
node --env-file=.env scripts/verify-maths-pyq.mjs
```

`review.html` shows question crops and source answers. `review-flags.json` records the known gaps. The uploader resumes safely, only changes its own draft questions, checks existing source metadata and verifies every saved question by readback. Image object paths include content hashes. The upload receipts record actual database IDs and uploaded image URLs. Later source additions are documented in `../maths-pyq-remaining/README.md`; English Ratio and Simple Interest question displays now use the separately supplied question PDFs.
