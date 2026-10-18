(function () {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then((reg) => {
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      });
    }).catch(() => {});
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const btn = document.getElementById('install-btn');
    if (!btn) return;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      btn.hidden = true;
      e.prompt();
    });
  });

  window.addEventListener('appinstalled', () => {
    const btn = document.getElementById('install-btn');
    if (btn) btn.hidden = true;
  });
})();
