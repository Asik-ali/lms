import test from 'node:test';
import assert from 'node:assert/strict';
import { isInspectionShortcut } from '../src/data/inspectionShortcuts.js';

test('inspection shortcuts match without blocking ordinary navigation, copy, or zoom', () => {
  for (const event of [
    { key: 'F12' }, { key: 'I', ctrlKey: true, shiftKey: true },
    { key: 'j', metaKey: true, altKey: true }, { key: 'u', ctrlKey: true },
  ]) assert.equal(isInspectionShortcut(event), true);
  for (const event of [
    { key: 'c', ctrlKey: true }, { key: 'i' }, { key: 'Escape' },
    { key: '+', ctrlKey: true }, { key: 'ArrowLeft', altKey: true },
  ]) assert.equal(isInspectionShortcut(event), false);
});
