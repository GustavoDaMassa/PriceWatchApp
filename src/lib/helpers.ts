import { ConfirmOutcome } from './types';

/** Primeiro link http(s) de um texto (Share Sheet manda "texto + link"). Aceita "www.loja.com/x". */
export function extractUrl(text: string): string | null {
  const match = text.match(/(?:https?:\/\/|www\.)[^\s<>"']+/i);
  if (!match) return null;
  const raw = match[0].replace(/[.,;:!?)\]]+$/, '');
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function outcomeMessage(outcome: ConfirmOutcome): string {
  switch (outcome) {
    case ConfirmOutcome.Attached:
      return 'Pronto, você está acompanhando essa loja.';
    case ConfirmOutcome.Pending:
      return 'Obrigado! Aguardando mais uma confirmação para juntar os produtos.';
    case ConfirmOutcome.Rejected:
      return 'Candidata descartada.';
    case ConfirmOutcome.Recorded:
      return 'Voto registrado.';
    default:
      return 'Oferta indisponível no momento.';
  }
}

export function freshnessLabel(lastCheckedAt: string | null | undefined, now: Date = new Date()): string {
  if (!lastCheckedAt) return 'ainda não verificado';
  const minutes = Math.floor((now.getTime() - new Date(lastCheckedAt).getTime()) / 60000);
  if (minutes < 1) return 'agora há pouco';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `há ${Math.floor(hours / 24)} d`;
}
