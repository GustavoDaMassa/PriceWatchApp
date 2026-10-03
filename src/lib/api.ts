import type {
  AppNotification, AuthResponse, ClickResponse, ConfirmMatchRequest, ConfirmMatchResponse, CreateOfferRequest,
  OfferCandidate, OfferResponse, ProductComparison, StoreCapabilities, TrackedProduct,
} from './types';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = this.options.getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const doFetch = this.options.fetchImpl ?? fetch;
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await doFetch(`${this.options.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, 'Sem conexão com o PriceWatch');
    }

    const text = await res.text();
    const data = text ? safeParse(text) : undefined;
    if (!res.ok) {
      // 401 com sessão ativa = token expirado; sem token (login) é só credencial errada
      if (res.status === 401 && token) this.options.onUnauthorized?.();
      const message = (data as { message?: string } | undefined)?.message ?? `Erro ${res.status}`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  }

  login(req: { email: string; password: string }) {
    return this.request<AuthResponse>('POST', '/auth/login', req);
  }
  getProducts() {
    return this.request<TrackedProduct[]>('GET', '/products');
  }
  removeProduct(id: string) {
    return this.request<void>('DELETE', `/products/${id}`);
  }
  updateProduct(id: string, req: { targetPrice?: number; isActive?: boolean }) {
    return this.request<void>('PUT', `/products/${id}`, req);
  }
  clickProduct(id: string) {
    return this.request<ClickResponse>('POST', `/products/${id}/click`);
  }
  getStores() {
    return this.request<StoreCapabilities[]>('GET', '/stores');
  }
  createOffer(req: CreateOfferRequest) {
    return this.request<OfferResponse>('POST', '/offers', req);
  }
  clickOffer(id: string) {
    return this.request<ClickResponse>('POST', `/offers/${id}/click`);
  }
  getComparison(productId: string) {
    return this.request<ProductComparison>('GET', `/products/${productId}/comparison`);
  }
  discover(productId: string) {
    return this.request<OfferCandidate[]>('POST', `/products/${productId}/discover`);
  }
  getCandidates(productId: string) {
    return this.request<OfferCandidate[]>('GET', `/products/${productId}/candidates`);
  }
  sendFeedback(candidateId: string, req: ConfirmMatchRequest) {
    return this.request<ConfirmMatchResponse>('POST', `/candidates/${candidateId}/feedback`, req);
  }
  getNotifications() {
    return this.request<AppNotification[]>('GET', '/notifications');
  }
  markAllAsRead() {
    return this.request<void>('PATCH', '/notifications/read-all', {});
  }
  registerDevice(token: string, platform: 'android') {
    return this.request<{ id: string; platform: string }>('POST', '/devices', { token, platform });
  }
  unregisterDevice(id: string) {
    return this.request<void>('DELETE', `/devices/${id}`);
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
