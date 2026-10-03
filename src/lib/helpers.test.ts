import { extractUrl, formatPrice, outcomeMessage, freshnessLabel } from './helpers';
import { ConfirmOutcome } from './types';

describe('extractUrl', () => {
  it('pega o link de um texto compartilhado', () => {
    expect(extractUrl('Olha isso! https://www.kabum.com.br/produto/1/x?a=1 que barato')).toBe('https://www.kabum.com.br/produto/1/x?a=1');
  });
  it('aceita o link puro e com espaços', () => {
    expect(extractUrl('  https://mercadolivre.com.br/p/MLB1 \n')).toBe('https://mercadolivre.com.br/p/MLB1');
  });
  it('aceita link sem esquema', () => {
    expect(extractUrl('www.kabum.com.br/produto/1/x')).toBe('https://www.kabum.com.br/produto/1/x');
  });
  it('tira pontuação final colada ao link', () => {
    expect(extractUrl('veja https://meli.la/abc123.')).toBe('https://meli.la/abc123');
  });
  it('devolve null sem link', () => {
    expect(extractUrl('sem link aqui')).toBeNull();
    expect(extractUrl('')).toBeNull();
  });
  it('ignora esquemas que não são http(s)', () => {
    expect(extractUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formata em reais', () => {
    expect(formatPrice(2599.9).replace(/\s/g, ' ')).toBe('R$ 2.599,90');
  });
});

describe('outcomeMessage', () => {
  it.each([
    [ConfirmOutcome.Attached, 'acompanhando'],
    [ConfirmOutcome.Pending, 'aguardando'],
    [ConfirmOutcome.Rejected, 'descartada'],
    [ConfirmOutcome.Recorded, 'registrado'],
    [ConfirmOutcome.Unavailable, 'indisponível'],
  ])('resultado %s', (outcome, fragment) => {
    expect(outcomeMessage(outcome).toLowerCase()).toContain(fragment);
  });
});

describe('freshnessLabel', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  it('descreve o frescor do preço', () => {
    expect(freshnessLabel(null, now)).toBe('ainda não verificado');
    expect(freshnessLabel('2026-10-03T11:59:30Z', now)).toBe('agora há pouco');
    expect(freshnessLabel('2026-10-03T11:15:00Z', now)).toBe('há 45 min');
    expect(freshnessLabel('2026-10-03T09:00:00Z', now)).toBe('há 3 h');
    expect(freshnessLabel('2026-10-01T12:00:00Z', now)).toBe('há 2 d');
  });
});
