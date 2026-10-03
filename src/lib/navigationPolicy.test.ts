import { decideNavigation, isStoreHost } from './navigationPolicy';

describe('decideNavigation', () => {
  it.each([
    'https://www.kabum.com.br/produto/123/placa',
    'https://www.mercadolivre.com.br/p/MLB123',
    'https://produto.mercadolivre.com.br/MLB-1234567-teste',
    'https://www.kabum.com.br/busca/rtx',
    'about:blank',
  ])('permite navegar em %s', (url) => {
    expect(decideNavigation(url)).toBe('allow');
  });

  it.each([
    'https://www.mercadolivre.com.br/gz/cart',
    'https://www.mercadolivre.com.br/checkout/buy',
    'https://www.mercadolivre.com.br/navigation/addItem?id=1',
    'https://www.mercadolivre.com.br/jms/mlb/lgz/login',
    'https://www.kabum.com.br/carrinho',
    'https://www.kabum.com.br/checkout/pagamento',
    'https://www.kabum.com.br/login',
    'https://www.kabum.com.br/cliente/minha-conta',
    'https://www.mercadolivre.com.br/mercado-pago/compra',
  ])('abre %s fora do app (carrinho, checkout ou login)', (url) => {
    expect(decideNavigation(url)).toBe('external');
  });

  it('abre outro domínio fora do app', () => {
    expect(decideNavigation('https://www.mercadopago.com.br/checkout')).toBe('external');
    expect(decideNavigation('https://evil.example/kabum.com.br')).toBe('external');
  });

  it('bloqueia esquemas que não são http(s)', () => {
    expect(decideNavigation('intent://scan/#Intent;scheme=zxing;end')).toBe('block');
    expect(decideNavigation('javascript:alert(1)')).toBe('block');
    expect(decideNavigation('file:///etc/passwd')).toBe('block');
  });

  it('não aceita http simples nem lookalike de host', () => {
    expect(decideNavigation('http://www.kabum.com.br/produto/1')).toBe('external');
    expect(decideNavigation('https://notkabum.com.br/produto/1')).toBe('external');
  });

  it('url inválida é bloqueada', () => {
    expect(decideNavigation('::::')).toBe('block');
  });
});

describe('isStoreHost', () => {
  it('reconhece só os domínios das lojas e subdomínios', () => {
    expect(isStoreHost('www.kabum.com.br')).toBe(true);
    expect(isStoreHost('kabum.com.br')).toBe(true);
    expect(isStoreHost('x.mercadolivre.com.br')).toBe(true);
    expect(isStoreHost('kabum.com.br.evil.com')).toBe(false);
  });
});
