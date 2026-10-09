# Polity question import

The six original UTF-8 question papers are backed up in `sources/`. The five supplied photos are in `answer-keys/`. These files are outside `public/` so Vite does not serve the papers or answer keys as static assets.

Run `node scripts/prepare-polity-import.mjs` from the repository root to regenerate `prepared.json`. It contains 800 question records across six draft papers. Source wording is preserved, including apparent source errors. The parser handles lowercase and Greek option labels, irregular spacing, labelled statements in stems, and reordered options. All six papers now parse without option-format warnings.

## Cloud upload completed

All 800 questions and 798 supplied answers were uploaded to Supabase under the non-free series `Polity Import Drafts`, category `Polity`, with all six tests marked `Draft`. Every saved question, option, and answer was read back and compared with the payload. See `upload-receipt.json` for IDs and counts.

`cloud-payload.json` is 364,998 bytes; staging metadata and redundant whitespace are omitted. It removes staging metadata, repeated optional fields, and redundant whitespace. This measures payload size, not actual PostgreSQL disk usage. Source files and photos remain local backups.

`node scripts/upload-polity-import.mjs` regenerates the compact payload and resumes matching draft imports without duplicating rows. It requires the existing Supabase server credentials in `.env`; credentials are never included in the payload. The draft series is not free and should not be assigned to students until review is complete. Draft status alone is not an access-control rule in the current LMS.

## Recommended storage

Use the existing Supabase `test_series`, `test_categories`, `tests`, and `questions` tables for online tests. Keep these source files as backups. Do not ship the answer keys in the public static directory.

## Required review before cloud import

- English Sectional Test I: all 100 supplied answers visually match photo `12.04.06 PM`. The verified transcription is saved in `answer-keys/sectional-test-1-english.json` and applied when regenerating the English draft. This verifies agreement with the image, not the factual correctness of the original key.
- English Sectional Test II: the 99 supplied answers visually match photo `12.04.08 PM`, including the overwritten B at question 81. Saved in `answer-keys/sectional-test-2-english.json` and applied to the English draft. Question 100 has no answer written and remains null. Verification checks transcription against the image, not factual correctness.
- English Full Test: all 200 supplied answers visually match photo `12.05.37 PM`, including the corrected C at question 36. Saved in `answer-keys/full-test-english.json` and applied to the English draft. This verifies transcription against the image, not factual correctness.
- Tamil Polity Sectional Test I: user explicitly confirmed the English key also applies to Tamil. All 100 answers are assigned and verified in Supabase using that supplied mapping.
- Tamil Polity Sectional Test II: supplied in `sources/Polity_Sectional_Test_2_Tamil.txt`, parsed into 100 questions, and uploaded with 99 answers using the user-confirmed shared English key. Question 100 remains null.
- Tamil Polity Full Test: user confirmed it uses the same 200-answer key as English Full Test. The shared key in `answer-keys/full-test-english.json` is applied to both drafts. This mapping is based on user confirmation.
- Photos `12.05.39 PM` and `12.05.40 PM` are labelled Tamil language tests and contain 100 answers each. They do not establish answers for the Tamil Polity papers.
- Review source content, supplied answer correctness, duration, and marks before publication. Upload settings use 1 mark per question and 90/180 minutes as draft placeholders.

English and Tamil Sectional Test I each have 100 assigned answers; English and Tamil Sectional Test II each have 99, with question 100 unanswered in both; English and Tamil Full Tests each have 200. The only missing answers among the 800 uploaded questions are Sectional Test II question 100 in English and Tamil, explicitly stored as null. `readyForCloud` remains false as a publication-readiness flag until outstanding keys and content have been reviewed.
