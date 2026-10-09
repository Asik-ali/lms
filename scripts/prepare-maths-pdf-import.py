"""Read PDF question geometry; use supplied OCR for the two scanned papers."""
import json
import re
from pathlib import Path
import pymupdf as pdf

pdf_root = Path(r'C:\Users\asik1\Desktop\examsticks pdf')
md_root = Path(r'C:\Users\asik1\Downloads\Math_25_Question_Markdown (1)')
out = Path('imports/maths')
out.mkdir(parents=True, exist_ok=True)
topics = [('AP GP', 'Arithmetic and Geometric Progressions'), ('CI', 'Compound Interest'), ('SI', 'Simple Interest'), ('Ratio', 'Ratio and Proportion'), ('LCM', 'LCM and HCF'), ('average', 'Average'), ('percentage', 'Percentage'), ('சதவீதம்', 'Percentage'), ('Profit', 'Profit and Loss'), ('2D', '2D Mensuration'), ('3D', '3D Mensuration'), ('Time', 'Time and Work'), ('நேரம்', 'Time and Work'), ('simplification', 'Simplification'), ('சுருக்குதல்', 'Simplification')]

def unique_spans(page):
    result = {}
    for block in page.get_text('dict', flags=pdf.TEXTFLAGS_DICT & ~pdf.TEXT_PRESERVE_IMAGES)['blocks']:
        for line in block.get('lines', []):
            for span in line['spans']:
                key = (tuple(round(n, 2) for n in span['bbox']), span['text'])
                result[key] = span
    return list(result.values())

def text_lines(spans):
    rows = {}
    for span in spans:
        rows.setdefault(round(span['origin'][1]), []).append(span)
    return '\n'.join(' '.join(s['text'] for s in sorted(row, key=lambda s: s['bbox'][0]) if s['text'].strip() != 'PDF').strip() for _, row in sorted(rows.items()))

def options(text):
    tokens = list(re.finditer(r'\(\s*([A-Ea-e])\s*\)', text))
    # Match uppercase option labels before considering lowercase matching-list labels.
    uppercase = [token for token in tokens if token[1].isupper()]
    if len(uppercase) >= 3:
        tokens = uppercase
    result = {f'option_{letter}': '' for letter in 'abcd'}
    for i, token in enumerate(tokens):
        if token[1].lower() in 'abcd':
            result[f'option_{token[1].lower()}'] = text[token.end():tokens[i+1].start() if i+1 < len(tokens) else len(text)].strip()
    stem = text[:tokens[0].start()].strip() if tokens else text.strip()
    return stem, result

papers = []
for md_file in sorted(md_root.glob('*.md')):
    name = re.sub(r'\(1\)$', '', md_file.stem).strip()
    original = next((p for p in pdf_root.glob('*.pdf') if re.sub(r'\s+', '', p.stem) == re.sub(r'\s+', '', name)), None)
    if not original:
        raise ValueError(f'No PDF for {md_file.name}')
    document = pdf.open(original)
    pages = [unique_spans(page) for page in document]
    language = 'Tamil' if re.search(r'[\u0b80-\u0bff]', name) else 'English'
    topic = next(value for pattern, value in topics if pattern.lower() in name.lower())
    expected_count = 10 if '26' in name else 25
    question_texts = {}
    answers = {}
    issues = []
    question_images = {}
    if not any(pages):
        replacement = Path(r'C:\Users\asik1\Downloads') / ('Profit%20and%20Loss%20(25)(1).md' if language == 'English' else '%E0%AE%9A%E0%AF%81%E0%AE%B0%E0%AF%81%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AF%81%E0%AE%A4%E0%AE%B2%E0%AF%8D(25)(1).md')
        text = replacement.read_text(encoding='utf-8-sig')
        body = text.split('Answer Key')[0]
        body = re.sub(r'^## Page \d+\s*$', '', body, flags=re.M)
        markers = list(re.finditer(r'^\s*(\d{1,2})[.:;,]\s*', body, re.M))
        for i, marker in enumerate(markers):
            question_texts[int(marker[1])] = body[marker.end():markers[i+1].start() if i+1 < len(markers) else len(body)].strip()
        issues.append('Scanned source: OCR formulas and option labels need review against the PDF.')
        # These sequences were visually transcribed from the original PDF answer pages.
        sequence = 'ACDABBADBCDCDCCC BBAABB CAB'.replace(' ', '') if language == 'English' else 'BBBB CACCAD DDCBC CACBC BBCCB'.replace(' ', '')
        if len(sequence) != 25:
            raise ValueError(f'Bad scanned key for {name}: {len(sequence)}')
        answers = {index + 1: letter for index, letter in enumerate(sequence)}
        if language == 'Tamil':
            boundaries = [(0,60),(0,329),(0,595),(1,22),(1,268),(1,573),(2,22),(2,274),(2,510),(3,24),(3,354),(4,22),(4,354),(5,22),(5,346),(5,524),(6,22),(6,354),(7,22),(7,350),(7,703),(8,203),(8,414),(9,22),(9,272)]
            image_root = out/'question-images'/'tamil-simplification'
            image_root.mkdir(parents=True, exist_ok=True)
            for index, (start_page, start_y) in enumerate(boundaries):
                end_page, end_y = boundaries[index+1] if index+1 < 25 else (9, 800)
                paths = []
                for page_number in range(start_page, end_page+1):
                    top = start_y-7 if page_number == start_page else 15
                    bottom = end_y-7 if page_number == end_page else document[page_number].rect.height-10
                    if bottom <= top:
                        continue
                    target = image_root/f'q{index+1:02d}-{len(paths)+1}.png'
                    document[page_number].get_pixmap(matrix=pdf.Matrix(2,2), clip=pdf.Rect(25, top, document[page_number].rect.width-20, bottom)).save(target)
                    paths.append(target.as_posix())
                question_images[index+1] = paths
                question_texts.setdefault(index+1, f'Original scanned question {index+1}; preserved in the attached source image.')
    else:
        markers = []
        key_candidates = []
        next_number = 1
        two_columns = (language == 'English' and topic in ['Simple Interest', 'Time and Work']) or (language == 'Tamil' and topic == 'Ratio and Proportion')
        for page_number, spans in enumerate(pages):
            candidates = []
            for span in spans:
                text = span['text'].strip()
                match = re.match(r'^(\d{1,2})[.:)](?!\d)', text)
                x, y = span['bbox'][:2]
                if match and (x < 110 or (two_columns and document[page_number].rect.width * .45 < x < document[page_number].rect.width * .65)):
                    candidates.append({'number': int(match[1]), 'page': page_number, 'x': x, 'y': y})
                if re.search(r'Answer\s*Key|விடை', text, re.I):
                    key_candidates.append((page_number, y))
            column_order = language == 'Tamil' and topic == 'Ratio and Proportion'
            for marker in sorted(candidates, key=lambda m: (m['x'] >= document[page_number].rect.width/2, m['y']) if column_order else (round(m['y']/10), m['x'])):
                if marker['number'] == next_number:
                    markers.append(marker)
                    next_number += 1
                elif next_number > expected_count and marker['number'] == 1:
                    key_candidates.append((page_number, marker['y'] - 5))
        if len(markers) != expected_count:
            print(f'BOUNDARY FAILURE {name}: {len(markers)}/{expected_count}', flush=True)
            continue
        last = markers[-1]
        valid_keys = [key for key in key_candidates if key[0] > last['page'] or (key[0] == last['page'] and key[1] > last['y'])]
        key_page, key_y = min(valid_keys) if valid_keys else (len(document)-1, document[-1].rect.height)
        for page_number in range(key_page, len(document)):
            key_spans = [span for span in pages[page_number] if page_number != key_page or span['bbox'][1] >= key_y - 2]
            text = text_lines(key_spans)
            for match in re.finditer(r'\b(?:Q\s*)?(\d{1,2})\s*[.:)]?\s*(?:\(\s*([A-Ea-e])\s*\)|([A-Ea-e])(?=\s|$))', text):
                answers[int(match[1])] = (match[2] or match[3]).upper()
            if topic == 'Ratio and Proportion' and language == 'Tamil':
                # Table cells have independent baselines; associate number/answer by coordinates.
                for span in key_spans:
                    if not re.fullmatch(r'\d{1,2}', span['text'].strip()):
                        continue
                    nearby = [s for s in key_spans if re.match(r'^\(\s*[A-D]\s*\)', s['text'].strip()) and 0 < s['bbox'][0]-span['bbox'][0] < 55 and abs(s['bbox'][1]-span['bbox'][1]) < 15]
                    if nearby:
                        closest = min(nearby, key=lambda s: abs(s['bbox'][1]-span['bbox'][1])*3 + s['bbox'][0]-span['bbox'][0])
                        number = int(span['text'].strip())
                        if number not in answers:
                            answers[number] = re.match(r'^\(\s*([A-D])', closest['text'].strip())[1]
                # Visually checked printed table; its last row is absent from the PDF.
                answers = {1:'D',2:'D',3:'C',4:'D',6:'A',7:'A',8:'D',9:'A',11:'D',12:'B',13:'A',14:'B',16:'D',17:'D',18:'D',19:'D',21:'C',22:'A',23:'C',24:'D',25:'D'}
        for index, marker in enumerate(markers):
            sections = []
            if two_columns:
                following = next((m for m in markers[index+1:] if m['page'] == marker['page'] and abs(m['x']-marker['x']) < 70), None)
                end_page = marker['page']
                end_y = following['y'] - 2 if following else min(document[end_page].rect.height-35, key_y-2 if key_page == end_page else 9999)
            else:
                following = markers[index+1] if index+1 < len(markers) else None
                end_page, end_y = (following['page'], following['y'] - 2) if following else (key_page, key_y-2)
            for page_number in range(marker['page'], end_page+1):
                top = marker['y'] - 2 if page_number == marker['page'] else 20
                bottom = end_y if page_number == end_page else document[page_number].rect.height-20
                left = marker['x']-4 if two_columns else 25
                right = document[page_number].rect.width/2 if two_columns and marker['x'] < document[page_number].rect.width/2 else document[page_number].rect.width-25
                selected = [span for span in pages[page_number] if left <= span['bbox'][0] < right and top <= span['bbox'][1] < bottom]
                sections.append(text_lines(selected))
            question_texts[marker['number']] = re.sub(r'^\s*\d{1,2}[.:)]\s*', '', '\n'.join(sections)).strip()
    questions = []
    for number in range(1, expected_count+1):
        raw = question_texts.get(number, '')
        if not raw:
            raise ValueError(f'Missing source question: {name} {number}')
        stem, choices = options(raw)
        answer = answers.get(number)
        missing = [label for label in 'abcd' if not choices[f'option_{label}']]
        if missing:
            issues.append(f'Question {number}: missing or unreadable option labels {", ".join(missing).upper()}')
        if not answer or answer not in 'ABCD':
            issues.append(f'Question {number}: answer unavailable or unsupported in source')
            answer = None
        if re.search(r'\(E\)', raw):
            issues.append(f'Question {number}: source has option E; application supports A–D')
        if number in question_images:
            choices = {f'option_{label}': f'Option {label.upper()} (shown in the original question)' for label in 'abcd'}
            missing = []
        questions.append({'number': number, 'question': stem or raw, **choices, 'correct_answer': answer, 'source_text': raw, 'source_images': question_images.get(number, [])})
    papers.append({'name': name, 'source': md_file.name, 'pdfSource': original.name, 'topic': topic, 'language': language, 'questions': questions, 'issues': issues})
    print(f'{name}: {len(questions)} questions, {sum(q["correct_answer"] is not None for q in questions)} readable answers, {len(issues)} flags', flush=True)

(out/'prepared.json').write_text(json.dumps(papers, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
if len(papers) != 25:
    raise ValueError(f'Only {len(papers)} of 25 papers parsed; repair boundaries before upload.')
