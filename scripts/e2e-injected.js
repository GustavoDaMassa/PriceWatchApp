// Teste do script injetado no WebView, rodando num Chrome headless real contra uma "KaBuM!" falsa (HTTPS
// local; www.kabum.com.br aponta para 127.0.0.1 por --host-resolver-rules). O ReactNativeWebView é
// simulado por um stub que guarda as mensagens. Uso: npm run e2e (precisa de google-chrome e openssl).
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { execFileSync, spawn } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-app-e2e-'));
const CDP_PORT = 9445;
let failures = 0;

const check = (ok, message) => {
  console.log(`${ok ? 'ok     ' : 'FALHOU '} ${message}`);
  if (!ok) failures++;
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function until(fn, what, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await sleep(150);
  }
  throw new Error(`tempo esgotado esperando: ${what}`);
}

const generated = fs.readFileSync(path.join(ROOT, 'src/generated/injectedScript.ts'), 'utf8');
const INJECTED = JSON.parse(generated.match(/INJECTED_SCRIPT = (".*");\n$/s)[1]);

const PRODUCT_PAGE = `<!doctype html><html><head><title>Placa</title>
<link rel="canonical" href="https://www.kabum.com.br/produto/123/placa-teste?ref=x">
<script type="application/ld+json">{"@type":"Product","name":"RTX 4060","brand":{"name":"Gigabyte"},"mpn":"GV-N4060","gtin13":"7891234567895"}</script>
</head><body><h1>Placa</h1><div id="blocoValores">R$ 2.599,90</div><button id="buy">Comprar</button></body></html>`;
const HOME_PAGE = '<!doctype html><html><body><h1>KaBuM!</h1></body></html>';

const STUB = `window.__posted = []; window.ReactNativeWebView = { postMessage: m => window.__posted.push(JSON.parse(m)) };`;

class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async evaluate(sessionId, expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }
}

async function main() {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=www.kabum.com.br',
    '-addext', 'subjectAltName=DNS:www.kabum.com.br', '-keyout', path.join(TMP, 'key.pem'), '-out', path.join(TMP, 'cert.pem')], { stdio: 'ignore' });
  const kabum = https.createServer(
    { key: fs.readFileSync(path.join(TMP, 'key.pem')), cert: fs.readFileSync(path.join(TMP, 'cert.pem')) },
    (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(req.url.startsWith('/produto/') ? PRODUCT_PAGE : HOME_PAGE);
    });
  await new Promise(r => kabum.listen(8444, '127.0.0.1', r));

  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', `--user-data-dir=${path.join(TMP, 'profile')}`,
    `--remote-debugging-port=${CDP_PORT}`, '--ignore-certificate-errors',
    '--host-resolver-rules=MAP www.kabum.com.br 127.0.0.1:8444', 'about:blank',
  ], { stdio: 'ignore' });

  try {
    const version = await until(async () => {
      try { return await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json(); } catch { return null; }
    }, 'o Chrome iniciar');
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const cdp = new Cdp(ws);

    const open = async (url) => {
      const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
      await cdp.send('Page.enable', {}, sessionId);
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: STUB }, sessionId);
      await cdp.send('Page.navigate', { url }, sessionId);
      await until(() => cdp.evaluate(sessionId, `document.readyState === 'complete' && location.href !== 'about:blank'`), 'a página carregar');
      // o WebView injeta o script depois do carregamento
      await cdp.evaluate(sessionId, INJECTED);
      return { targetId, session: sessionId };
    };
    const hasButton = (s) => cdp.evaluate(s, `!!document.getElementById('pw-host')`);
    const buttonText = (s) => cdp.evaluate(s, `document.getElementById('pw-host')?.shadowRoot.querySelector('button.main').textContent`);
    const clickButton = (s) => cdp.evaluate(s, `document.getElementById('pw-host').shadowRoot.querySelector('button.main').click()`);
    const posted = (s) => cdp.evaluate(s, `window.__posted`);

    // ---- home da loja: sem botão
    const home = await open('https://www.kabum.com.br/');
    await sleep(800);
    check(!(await hasButton(home.session)), 'a home da loja não mostra o botão');
    await cdp.send('Target.closeTarget', { targetId: home.targetId });

    // ---- página de produto
    const page = await open('https://www.kabum.com.br/produto/123/placa-teste');
    await until(() => hasButton(page.session), 'o botão na página de produto');
    check(await cdp.evaluate(page.session, `document.getElementById('pw-host').parentElement.id === 'blocoValores'`),
      'o botão entra na âncora conhecida da loja');
    check(await cdp.evaluate(page.session, `document.getElementById('buy') !== null && getComputedStyle(document.getElementById('buy')).display !== 'none'`),
      'o botão de comprar da loja continua intacto (nada é escondido)');

    // injetar duas vezes não duplica o botão nem as mensagens
    await cdp.evaluate(page.session, INJECTED);
    check(await cdp.evaluate(page.session, `document.querySelectorAll('#pw-host').length === 1`), 'injeção repetida não duplica o botão');

    await clickButton(page.session);
    const msgs = await until(async () => { const m = await posted(page.session); return m.length ? m : null; }, 'a mensagem TRACK');
    check(msgs.length === 1 && msgs[0].type === 'TRACK', 'o clique envia uma mensagem TRACK ao app');
    check(msgs[0].url === 'https://www.kabum.com.br/produto/123/placa-teste', 'envia a URL canônica, sem query nem hash');
    check(JSON.stringify(msgs[0].clientData) === JSON.stringify({ brand: 'Gigabyte', model: 'GV-N4060' }), 'envia só marca e modelo');
    check(!JSON.stringify(msgs[0]).includes('7891234567895'), 'NÃO envia o GTIN da página');
    check(/Adicionando/.test(await buttonText(page.session)), 'o botão mostra o estado de carregamento');

    await cdp.evaluate(page.session, `window.__pwResult({ success: true })`);
    check(/Acompanhando/.test(await buttonText(page.session)), 'o resultado de sucesso do app vira o estado de sucesso');

    await cdp.evaluate(page.session, `window.__pwResult({ success: false, error: 'Loja não suportada' })`);
    check(/Loja não suportada/.test(await buttonText(page.session)), 'o erro do app aparece no botão');

    await cdp.evaluate(page.session, `window.__pwResult({ needsLogin: true })`);
    check(/login/i.test(await buttonText(page.session)), 'sessão expirada pede login');
    await cdp.send('Target.closeTarget', { targetId: page.targetId });

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    kabum.close();
    fs.rmSync(TMP, { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\nTudo certo.' : `\n${failures} verificação(ões) falharam.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(e => {
  console.error('Erro no e2e:', e.message);
  process.exit(1);
});
