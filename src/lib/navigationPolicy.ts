// Política de navegação do WebView de captura. A loja nunca é alterada: em vez de esconder botões, as
// navegações para carrinho, checkout e login saem do app (navegador do sistema), onde a compra segue o
// fluxo normal da loja. A compra "oficial" pelo PriceWatch passa sempre pelo endpoint de clique.
export type NavigationDecision = 'allow' | 'external' | 'block';

export const STORE_HOSTS = ['mercadolivre.com.br', 'kabum.com.br'];

const SENSITIVE_PATH =
  /\/(cart|carrinho|checkout|pagamento|payment|login|lgz|signin|identificacao|minha-conta|minhaconta|myaccount|cliente|compra|navigation\/addItem)(\/|$|\?)/i;

export function isStoreHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return STORE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function decideNavigation(rawUrl: string): NavigationDecision {
  if (rawUrl === 'about:blank') return 'allow';
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return 'block';
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'block';
  if (url.protocol !== 'https:' || !isStoreHost(url.hostname)) return 'external';
  return SENSITIVE_PATH.test(`${url.pathname}/`) ? 'external' : 'allow';
}
