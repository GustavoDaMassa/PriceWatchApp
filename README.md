# PriceWatch App (Android)

App Expo (React Native, TypeScript) do PriceWatch. Só Android na v1, publicado no Google Play.

## Telas
- Login, meus produtos, alertas (central in-app) e conta (`app/(tabs)`).
- Adicionar por link, por Share Sheet ou escolhendo a loja (`app/add.tsx`).
- Captura em WebView com o botão "Acompanhar com PriceWatch" (`app/capture.tsx`).
- Candidatas em outras lojas com "é o mesmo produto?" (`app/candidates`) e comparação (`app/comparison`).

## Regras de produto
- O WebView nunca altera a loja além do botão. Carrinho, checkout e login abrem fora do app
  (`src/lib/navigationPolicy.ts`). A compra pelo PriceWatch sai sempre por `POST /offers/{id}/click`.
- O script injetado reaproveita extratores, adapters e botão da extensão: `npm run build:injected`
  gera `src/generated/injectedScript.ts` a partir de `../PriceWatchExtension` (o resultado é versionado).
- Push: token FCM nativo registrado em `POST /api/devices`; precisa de `google-services.json`
  (ignorado pelo git; no EAS, variável `GOOGLE_SERVICES_JSON`). Não funciona no Expo Go.

## Comandos
```bash
npm test             # jest
npm run typecheck
npm run e2e          # script injetado num Chrome headless real (google-chrome + openssl)
npm run build:injected
npx expo start       # desenvolvimento (push exige development build)
```
`EXPO_PUBLIC_API_URL` define a API (ver `.env.example`; no emulador, `http://10.0.2.2:5283/api`).
