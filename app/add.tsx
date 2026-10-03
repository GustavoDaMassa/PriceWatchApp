import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { extractUrl } from '../src/lib/helpers';
import { useSession } from '../src/lib/session';
import type { StoreCapabilities } from '../src/lib/types';
import { Button } from '../src/ui/Button';
import { shared } from '../src/ui/theme';

export default function Add() {
  const { api } = useSession();
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string }>();
  const [link, setLink] = useState(params.url ?? '');
  const [stores, setStores] = useState<StoreCapabilities[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getStores().then(setStores).catch(() => undefined);
  }, [api]);

  async function paste() {
    const text = await Clipboard.getStringAsync();
    const url = extractUrl(text);
    if (url) setLink(url);
    else setError('Não encontrei um link na área de transferência.');
  }

  async function submit() {
    const url = extractUrl(link);
    if (!url) {
      setError('Cole o link de um produto.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const offer = await api.createOffer({ url });
      router.replace({ pathname: '/candidates/[productId]', params: { productId: offer.productId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível importar o produto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.pad} keyboardShouldPersistTaps="handled">
      <Text style={[shared.title, { marginBottom: 8 }]}>Cole o link do produto</Text>
      <TextInput style={shared.input} placeholder="https://..." autoCapitalize="none" autoCorrect={false} value={link} onChangeText={setLink} />
      {error && <Text style={shared.error}>{error}</Text>}
      <View style={{ gap: 8 }}>
        <Button label="Acompanhar" onPress={submit} loading={loading} disabled={!link} />
        <Button secondary label="Colar da área de transferência" onPress={paste} />
      </View>

      <Text style={[shared.title, { marginTop: 28, marginBottom: 4 }]}>Ou escolha a loja</Text>
      <Text style={[shared.muted, { marginBottom: 12 }]}>
        Navegue até o produto e toque em "Acompanhar com PriceWatch". Carrinho, checkout e login abrem fora do app.
      </Text>
      {stores.filter((s) => s.canFetchByUrl).map((s) => (
        <View key={s.source} style={{ marginBottom: 8 }}>
          <Button secondary label={s.name} onPress={() => router.push({ pathname: '/capture', params: { url: s.homeUrl } })} />
        </View>
      ))}
    </ScrollView>
  );
}
