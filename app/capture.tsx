import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Linking } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { INJECTED_SCRIPT } from '../src/generated/injectedScript';
import { ApiError } from '../src/lib/api';
import { decideNavigation } from '../src/lib/navigationPolicy';
import { useSession } from '../src/lib/session';

export default function Capture() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const { api } = useSession();
  const router = useRouter();
  const webview = useRef<WebView>(null);

  const reply = (result: object) => webview.current?.injectJavaScript(`window.__pwResult(${JSON.stringify(result)}); true;`);

  async function onMessage(event: WebViewMessageEvent) {
    let message: { type?: string; url?: string; clientData?: { brand?: string; model?: string } };
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type !== 'TRACK' || typeof message.url !== 'string') return;
    try {
      const offer = await api.createOffer({ url: message.url, clientData: message.clientData });
      reply({ success: true, productId: offer.productId });
      router.replace({ pathname: '/candidates/[productId]', params: { productId: offer.productId } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) reply({ needsLogin: true });
      else reply({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' });
    }
  }

  return (
    <WebView
      ref={webview}
      source={{ uri: url }}
      injectedJavaScript={INJECTED_SCRIPT}
      onMessage={onMessage}
      originWhitelist={['https://*']}
      javaScriptEnabled
      domStorageEnabled
      onShouldStartLoadWithRequest={(req) => {
        const decision = decideNavigation(req.url);
        if (decision === 'external') void Linking.openURL(req.url).catch(() => undefined);
        return decision === 'allow';
      }}
    />
  );
}
