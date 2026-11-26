# Maths PYQ text and image views

All 1,081 active questions in the 51 parts have English and Tamil text previews alongside their original source images. The question and result screens offer Text + image, Text, and Image views. Images retain zoom controls and full-size links.

Text previews are explicitly **unreviewed**. OCR and PDF text extraction can alter mathematical symbols, fractions, option labels and Tamil words. A visible notice asks students to check the original image when text differs. The preview options are reference text; canonical answer-selection letters and grading fields are unchanged. This update does not apply the independent answer-audit corrections.

`text-previews.json` contains the prepared previews. `text-preview-receipt.json` records the affected active question IDs. The local, ignored `before-text-previews.json` retains a recovery snapshot. Archived full-topic tests and historic attempts are untouched.

Average Q22's original crop omitted its Tamil stem and first two options across a page break. Its source crop was repaired, visually checked against pages 4–5 and uploaded under a new image URL for the active part. Other original source images remain unchanged.

Prepare previews with `python -X utf8 scripts/prepare-pyq-text-previews.py`. Validate against the database with `node --env-file=.env scripts/upload-pyq-text-previews.mjs`; add `--apply` to attach previews. The upload changes only explanation metadata and the repaired Average Q22 image URL. It verifies every other question field remains unchanged and never attaches answer audit proofs or answer keys to student-visible metadata.
