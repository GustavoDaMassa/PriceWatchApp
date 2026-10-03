import type { ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';

// google-services.json (Firebase/FCM) não vai para o git: localmente fica na raiz; no EAS vem de um
// "file secret" apontado pela variável GOOGLE_SERVICES_JSON. Sem ele o app builda, mas sem push.
export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const googleServices = process.env.GOOGLE_SERVICES_JSON ?? (existsSync('./google-services.json') ? './google-services.json' : undefined);
  return {
    ...config,
    android: { ...config.android, ...(googleServices ? { googleServicesFile: googleServices } : {}) },
  } as ExpoConfig;
};
