import { Stack, useRouter, useSegments } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { extractUrl } from '../src/lib/helpers';
import { useNotificationTaps, usePushRegistration } from '../src/lib/push';
import { SessionProvider, useSession } from '../src/lib/session';

function Gate() {
  const { ready, user } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  usePushRegistration(!!user);
  useNotificationTaps(() => router.push('/notifications'));

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'login';
    if (!user && !onLogin) router.replace('/login');
    else if (user && onLogin) router.replace('/');
  }, [ready, user, segments, router]);

  // Share Sheet: "Compartilhar" numa loja ou navegador abre o app direto na tela de adicionar
  useEffect(() => {
    if (!ready || !user || !hasShareIntent) return;
    const url = extractUrl(shareIntent.webUrl ?? shareIntent.text ?? '');
    resetShareIntent();
    if (url) router.push({ pathname: '/add', params: { url } });
  }, [ready, user, hasShareIntent, shareIntent, resetShareIntent, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Entrar', headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Adicionar produto' }} />
      <Stack.Screen name="capture" options={{ title: 'Abrir a loja' }} />
      <Stack.Screen name="comparison/[productId]" options={{ title: 'Comparação' }} />
      <Stack.Screen name="candidates/[productId]" options={{ title: 'Outras lojas' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}
