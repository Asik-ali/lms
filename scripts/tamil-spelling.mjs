// Conservative OCR/spelling corrections; do not change numbers or answer letters.
export const tamilCorrections = [
  ['கீ ழ்', 'கீழ்'], ['மீ ண்டும்', 'மீண்டும்'], ['மீ து', 'மீது'],
  ['மீ தான', 'மீதான'], ['மீ ட்ப', 'மீட்ப'], ['மீ ற', 'மீற'],
  ['மீ ன்பிடி', 'மீன்பிடி'], ['மீ ராகுமார்', 'மீராகுமார்'],
  ['அங்கீ கரி', 'அங்கீகரி'], ['தார்மீ க', 'தார்மீக'],
  ['காஷ்மீ ர்', 'காஷ்மீர்'], ['ஒதுக்கீ டு', 'ஒதுக்கீடு'],
  ['தேசியக் கீ த', 'தேசியக் கீத'], ['தேசிய கீ த', 'தேசிய கீத'],
  ['கீ தத்தை', 'கீதத்தை'], ['நவன்ீ', 'நவீன்'],
  ['நாட்டிலிந்து', 'நாட்டிலிருந்து'], ['ஆக்கிய நகரங்களில்', 'ஆகிய நகரங்களில்'],
  ['நீதிமன்றங் களாகும்', 'நீதிமன்றங்களாகும்'],
  ['சமர்பிக்க', 'சமர்ப்பிக்க'], ['சமர்பித்த', 'சமர்ப்பித்த'],
  ['அம்பேத்கார்', 'அம்பேத்கர்'], ['சுருக்கப்பட்டச்சொல்', 'சுருக்கப்பட்ட சொல்'],
  ['வதைபடுதலை', 'வதைப்படுத்தலை'],
];
export function correctTamil(text) {
  let result = text;
  for (const [before, after] of tamilCorrections) result = result.replace(new RegExp(before.replace(/ /g, '\\s+'), 'g'), after);
  // PDF extraction can detach a vowel sign onto the following line.
  result = result.replace(/வின\s+ீத்/g, 'வினீத்')
    .replace(/சுவடன்\s+ீ/g, 'சுவீடன்')
    .replace(/வரப்ப\s+ீ/g, 'வீரப்ப')
    .replace(/பூர்வக\s+ீ/g, 'பூர்வீக')
    .replace(/வட்டு\s+ீ/g, 'வீட்டு');
  return result;
}
