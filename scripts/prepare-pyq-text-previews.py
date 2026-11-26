"""Prepare explicitly unreviewed text alongside authoritative source images."""
import json
import re
from pathlib import Path

root = Path('imports/maths-pyq-text')
draft = json.loads((root / 'draft-text.json').read_text(encoding='utf8'))
canonical = {p['topic']: p for batch in ['maths-pyq', 'maths-pyq-additional']
             for p in json.loads(Path('imports', batch, 'prepared.json').read_text(encoding='utf8'))}
age_options = [
    ['40 years / 40 ஆண்டுகள்', '20 years / 20 ஆண்டுகள்', '35 years / 35 ஆண்டுகள்', '30 years / 30 ஆண்டுகள்'],
    ['45', '55', '65', '70'], ['45', '35', '25', '15'], ['10', '11', '13', '18'],
    ['6', '5', '4', '3'], ['5, 35', '6, 36', '7, 42', '4, 32'],
    ['(15, 21)', '(20, 28)', '(25, 35)', '(24, 32)'], ['4:7', '6:5', '7:4', '3:2'],
]

def clean(value):
    value = re.sub(r'[\x00-\x08\x0b-\x1f\x7f\u200b-\u200d\ufeff]', '', value or '')
    value = re.sub(r'^\s*[|!]?\s*(?:Q\s*|Question\s*)?\d+[.:]\s*', '', value)
    value = re.sub(r'(?m)^\s*\([08©]\)\s*', '', value)
    return re.sub(r'[ \t]+', ' ', value).strip()

output = []
for topic in draft:
    originals = {q['number']: q for q in canonical[topic['topic']]['questions']}
    for row in topic['questions']:
        original = originals[row['number']]
        versions = {}
        for language in ['english', 'tamil']:
            source = row[language]
            if topic['topic'] == 'Age Problems':
                ocr = source['ocr']
                match = re.search(r'[\u0b80-\u0bff]', ocr)
                option_start = re.search(r'\n\s*(?:\(A\)|௦6)', ocr)
                assert match and option_start
                stem = ocr[:match.start()] if language == 'english' else ocr[match.start():option_start.start()]
                values = dict(zip(['option_a', 'option_b', 'option_c', 'option_d'], age_options[row['number'] - 1]))
                values['option_e'] = 'Answer not known' if language == 'english' else 'விடை தெரியவில்லை'
            else:
                stem = source.get('question', '')
                # In these papers the native Tamil layer preserves mathematical
                # symbols better than OCR. Only use it when no control glyphs exist.
                native = source.get('native_stem', '')
                if language == 'tamil' and topic['topic'] in ['Simplification', 'AP and GP'] and not re.search(r'[\x00-\x08\x0b-\x1f]', native):
                    stem = native
                values = {key: source.get(key, '') for key in ['option_a', 'option_b', 'option_c', 'option_d', 'option_e']}
            if topic['topic'] == 'Average' and row['number'] == 22:
                stem = 'Find the median of the data: 12, 14, 25, 23, 18, 17, 24, 20.' if language == 'english' else '12, 14, 25, 23, 18, 17, 24, 20 ஆகிய தரவுகளின் இடைநிலையைக் காண்க.'
                values = {'option_a': '24', 'option_b': '23', 'option_c': '18', 'option_d': '19', 'option_e': 'Answer not known' if language == 'english' else 'விடை தெரியவில்லை'}
            assert clean(stem), (topic['topic'], row['number'], language)
            preview = {'status': 'unreviewed', 'question': clean(stem)}
            for key, value in values.items():
                if key == 'option_e' and not original['has_e']:
                    continue
                value = clean(value)
                # Never present missing/corrupted option text as a real choice.
                if not value or (language == 'english' and re.search(r'[\u0b80-\u0bff]', value) and '/' not in value):
                    value = 'See original image' if language == 'english' else 'அசல் படத்தைப் பார்க்கவும்'
                preview[key] = value
            versions[language] = preview
        output.append({'topic': topic['topic'], 'number': row['number'], 'textVersions': versions})
assert len(output) == 1081
assert len({(r['topic'], r['number']) for r in output}) == 1081
(root / 'text-previews.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print('Prepared 1081 English/Tamil text previews; original images and canonical options remain authoritative.')
