export function isInspectionShortcut(event) {
  const key = String(event.key || '').toLowerCase();
  if (key === 'f12') return true;
  const modifier = event.ctrlKey || event.metaKey;
  return Boolean(modifier && (
    (event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
    (event.metaKey && event.altKey && ['i', 'j', 'c', 'u'].includes(key)) ||
    (key === 'u' && !event.altKey && !event.shiftKey)
  ));
}

export function installInspectionShortcutExit(auth) {
  let exiting = false;
  const onKeyDown = async event => {
    if (!isInspectionShortcut(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (exiting) return;
    exiting = true;
    try {
      await auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Inspection shortcut sign-out failed:', error);
    } finally {
      window.location.replace('/login');
    }
  };
  document.addEventListener('keydown', onKeyDown, true);
  return () => document.removeEventListener('keydown', onKeyDown, true);
}
