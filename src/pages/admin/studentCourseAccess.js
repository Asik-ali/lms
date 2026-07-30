export function normalizeCourseAccessSelection(value) {
  if (!value) return [];
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

export function serializeCourseAccess(courses) {
  return courses.filter(Boolean).join(', ');
}

export function getCourseAccessLabel(value) {
  const normalized = normalizeCourseAccessSelection(value);
  return normalized.length > 0 ? normalized.join(', ') : '-';
}
