# Polity bilingual tests

Supabase now contains three canonical draft tests in Polity Import Drafts / Polity:

- Sectional Test I: 100 bilingual questions, 100 supplied answers.
- Sectional Test II: 100 bilingual questions, 99 supplied answers. Question 100 remains null.
- Full Test: 200 bilingual questions, 200 supplied answers.

English test and question IDs are retained. Duplicate Tamil tests are Archived and filtered out of the updated student listings. Their questions and historical attempts remain intact. Existing Tamil attempts still use the original test. The updated frontend needs deployment for the language toggle and filtering to appear on a hosted app.

The test-taking and solution pages offer English and Tamil modes. Switching changes only question and option text; IDs, answer letters, progress, timer and grading stay the same. Questions sort by source number, with ID ordering for legacy tests.

## Storage

Six original papers are in sources/; five key photos and the supplied JSON keys are in answer-keys/. These backups are outside public/. Shared answer keys follow the user's explicit confirmation.

Translations use a tagged JSON envelope in the existing questions.explanation field (format: lms-bilingual-v1). It contains the source number, Tamil stem/options and separate explanation text. The student frontend unwraps this metadata. Future admin explanation editing must preserve the envelope. Plain explanations remain supported.

prepare-polity-import.mjs regenerates source staging data. upload-polity-import.mjs is disabled after merging to prevent recreating separate tests. merge-polity-tests.mjs attaches and verifies translations using server credentials from .env. bilingual-receipt.json records the final canonical and archived IDs. upload-receipt.json describes the historical six-test upload.

## Question review

All 400 numbered pairs were checked for non-empty stems, four options, matching supplied answer letters and exact source-to-cloud text. This does not certify factual correctness or complete semantic translation equivalence. Source wording and supplied keys were preserved.

question-review.json flags 92 numbered pairs with numerical differences for comparison. Differences may reflect formatting rather than errors. Sectional Test I Q99 has different matching-statement numbering and options in the supplied papers. Sectional Test II Q100 has no supplied answer. Review these source issues before publication.

Validation: production build and all 13 Node tests pass, including language-switch identity/answer preservation and question ordering.
