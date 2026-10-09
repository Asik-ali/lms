import test from 'node:test';
import assert from 'node:assert/strict';
import { correctTamil } from '../scripts/tamil-spelling.mjs';
test('Tamil OCR corrections preserve numbers and normal word boundaries', () => {
  const input = 'கீ ழ் அங்கீ கரிக்கப்பட்ட மீ ண்டும் ஒதுக்கீ டு 19-22 நிதி ஆணையம்';
  assert.equal(correctTamil(input), 'கீழ் அங்கீகரிக்கப்பட்ட மீண்டும் ஒதுக்கீடு 19-22 நிதி ஆணையம்');
  assert.equal(correctTamil('வட்டு\n    ீ வரி'), 'வீட்டு வரி');
  assert.equal(correctTamil(correctTamil(input)), correctTamil(input));
});
