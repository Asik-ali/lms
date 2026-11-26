export function isAnnouncementVisible(announcement, role = 'student') {
  if (announcement.status !== 'Published') return false;
  const target = String(announcement.target || '').trim().toLowerCase();
  const audience = role === 'admin' || role === 'instructor' ? 'admin' : 'student';
  return target === 'all' || target.includes(audience);
}
