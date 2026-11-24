# Complete the remaining English Maths PYQ sources

The newly supplied English Ratio and Proportion PDF contains 101 questions. Its printed key agrees with the imported Tamil source for all 101. Existing test 84 is updated to English / Tamil, preserving its question IDs and answers. Tamil source images remain available through the language switch.

The separate English Simple Interest question PDF contains the same 130 numbered questions. Existing test 87 now displays those original question-only pages; the supplied English answers-and-solutions document remains the answer-key source. Tamil versions, answers and IDs are preserved.

No duplicate tests or questions are created. Total remains 1,081 questions across 13 topics. All 23 PDF filenames in the supplied Today folder are covered across the three import batches. Copies previously read from Downloads match the files in Today by SHA-256. Average Q27 remains intentionally excluded under the user's Q1-26 instruction.

Pending review: conflicting printed keys for 3D Q55 and Percentage Q80 remain unassigned. All topic tests remain Draft.

## Reproduce

```powershell
$env:MATHS_IMPORT_ROOT='imports/maths-pyq-remaining'
node scripts/extract-maths-pyq.mjs --remaining
python scripts/prepare-maths-pyq.py
node scripts/render-maths-pyq-questions.mjs
Remove-Item Env:MATHS_IMPORT_ROOT
python scripts/merge-maths-pyq.py
node --env-file=.env scripts/upload-remaining-maths-pyq.mjs
node --env-file=.env scripts/audit-maths-pyq.mjs
```

The uploader only updates the two existing draft tests, validates existing import metadata and keys, and verifies saved data and IDs by readback. `source-audit.json` records file coverage, and `verification.json` records the combined database audit.
