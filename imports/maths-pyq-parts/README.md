# Maths PYQ parts

All 13 topic categories now contain parts of at most 25 questions: 51 parts, 1,081 active questions in total. Original source numbering is retained in bilingual metadata; each part description identifies its source range.

Published originals and originals with attempts are archived with their questions unchanged. Replacement parts retain the original publication status. Existing attempts still refer to their original tests and questions.

`plan.json` records the source question IDs and ranges. `receipt.json` adds each replacement test ID. The local, ignored `before.json` is the full recovery snapshot; retain it when rerunning the migration. `node --env-file=.env scripts/split-maths-pyq.mjs --apply` resumes idempotently using that snapshot. Do not delete the snapshot and rerun against an already split database.

The migration checks every replacement question against its source, including bilingual text, images, options and answer keys. It does not apply the separate answer audit corrections or approve OCR text. Use `node --env-file=.env scripts/audit-maths-pyq.mjs` for a read-only active-parts audit. Original full-topic upload scripts are guarded after this migration.
