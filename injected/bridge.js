// Ponte do app: equivalente ao content/store.js da extensão, mas fala com o app React Native pelo
// ReactNativeWebView.postMessage e recebe o resultado em window.__pwResult. Roda depois dos extratores,
// do adapter por loja e do botão (os mesmos arquivos da extensão; ver scripts/build-injected.js).
(function () {
  if (window.__pwInjected) return;
  window.__pwInjected = true;

  const PW = globalThis.PW;
  const adapter = PW.adapterFor(location.hostname);
  if (!adapter) return;

  let controller = null;

  function currentProduct() {
    const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.textContent);
    return PW.parseProductJsonLd(jsonLd);
  }

  function post(message) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }

  function track() {
    controller.showLoading();
    const url = PW.canonicalUrl(new URL(location.href), document.querySelector('link[rel="canonical"]')?.href);
    post({ type: 'TRACK', url, clientData: PW.clientDataFrom(currentProduct()) });
  }

  // O app responde depois de chamar a API: { success, error?, needsLogin?, productId? }
  window.__pwResult = function (res) {
    if (!controller) return;
    if (res && res.success) {
      controller.showSuccess();
    } else if (res && res.needsLogin) {
      controller.showLogin();
      setTimeout(() => controller && controller.reset(), 4000);
    } else {
      controller.showError((res && res.error) || 'Erro desconhecido');
      setTimeout(() => controller && controller.reset(), 4000);
    }
  };

  function ensureButton() {
    const isProductPage = adapter.isProductPage(new URL(location.href));
    const mounted = document.getElementById(PW.ui.BUTTON_ID);
    if (!isProductPage) {
      if (mounted) {
        controller && controller.destroy();
        controller = null;
      }
      return;
    }
    if (mounted) return;
    const anchor = adapter.anchorSelectors.map(sel => document.querySelector(sel)).find(Boolean) || null;
    controller = PW.ui.mountButton(anchor, { highlight: true, onClick: track });
  }

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      ensureButton();
    });
  }).observe(document.body, { childList: true, subtree: true });
  ensureButton();
})();
