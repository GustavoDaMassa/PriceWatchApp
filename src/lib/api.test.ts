import { ApiClient, ApiError } from './api';

function fakeFetch(status: number, body: unknown) {
  return jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  })) as unknown as typeof fetch;
}

describe('ApiClient', () => {
  it('envia o token em Bearer e o corpo em JSON', async () => {
    const f = fakeFetch(201, { offerId: 'o1' });
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 'tok', fetchImpl: f });

    const res = await api.createOffer({ url: 'https://loja/p' });

    expect(res).toEqual({ offerId: 'o1' });
    const [url, init] = (f as unknown as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.test/api/offers');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ url: 'https://loja/p' });
  });

  it('não envia Authorization sem token (login)', async () => {
    const f = fakeFetch(200, { token: 't' });
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => null, fetchImpl: f });

    await api.login({ email: 'a@b.c', password: 'x' });

    const init = (f as unknown as jest.Mock).mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('devolve undefined em 204 sem corpo', async () => {
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 't', fetchImpl: fakeFetch(204, undefined) });
    await expect(api.unregisterDevice('d1')).resolves.toBeUndefined();
  });

  it('lança ApiError com a mensagem da API', async () => {
    const f = fakeFetch(400, { status: 400, error: 'Bad', message: 'Loja não suportada' });
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 't', fetchImpl: f });

    await expect(api.createOffer({ url: 'x' })).rejects.toMatchObject({ status: 400, message: 'Loja não suportada' });
  });

  it('avisa a sessão expirada em 401', async () => {
    const onUnauthorized = jest.fn();
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 't', fetchImpl: fakeFetch(401, {}), onUnauthorized });

    await expect(api.getProducts()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('não chama onUnauthorized quando o 401 vem do login (credencial errada)', async () => {
    const onUnauthorized = jest.fn();
    const api = new ApiClient({
      baseUrl: 'https://api.test/api', getToken: () => null, fetchImpl: fakeFetch(401, { message: 'Credenciais inválidas' }), onUnauthorized,
    });

    await expect(api.login({ email: 'a', password: 'b' })).rejects.toMatchObject({ message: 'Credenciais inválidas' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('falha de rede vira ApiError com status 0', async () => {
    const f = jest.fn(async () => { throw new TypeError('Network request failed'); }) as unknown as typeof fetch;
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 't', fetchImpl: f });

    await expect(api.getStores()).rejects.toMatchObject({ status: 0 });
  });

  it('monta as rotas de descoberta, comparação e clique', async () => {
    const f = fakeFetch(200, []);
    const api = new ApiClient({ baseUrl: 'https://api.test/api', getToken: () => 't', fetchImpl: f });

    await api.discover('p1');
    await api.getCandidates('p1');
    await api.sendFeedback('c1', { isSameProduct: true, track: true });
    await api.getComparison('p1');
    await api.clickOffer('o1');
    await api.clickProduct('t1');
    await api.registerDevice('fcm', 'android');

    const calls = (f as unknown as jest.Mock).mock.calls.map(([u, i]) => `${i.method} ${u}`);
    expect(calls).toEqual([
      'POST https://api.test/api/products/p1/discover',
      'GET https://api.test/api/products/p1/candidates',
      'POST https://api.test/api/candidates/c1/feedback',
      'GET https://api.test/api/products/p1/comparison',
      'POST https://api.test/api/offers/o1/click',
      'POST https://api.test/api/products/t1/click',
      'POST https://api.test/api/devices',
    ]);
  });
});
