// Keep startup failures visible even when an imported module fails before React mounts.
const message = document.getElementById('startup-message');
function showStartupFailure(error) {
  console.error('Application startup failed:', error);
  if (!document.getElementById('startup-message')) return;
  message.textContent = 'Unable to start EXAMSTICK. Check your connection and reload.';
  document.getElementById('startup-reload').hidden = false;
}
const timer = setTimeout(() => showStartupFailure(new Error('Startup timed out')), 20000);
import('./startApp.jsx').then(() => clearTimeout(timer)).catch(error => {
  clearTimeout(timer);
  showStartupFailure(error);
});
document.getElementById('startup-reload').addEventListener('click', () => location.reload());
