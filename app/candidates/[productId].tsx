import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { formatPrice, outcomeMessage } from '../../src/lib/helpers';
import { useSession } from '../../src/lib/session';
import type { OfferCandidate } from '../../src/lib/types';
import { Button } from '../../src/ui/Button';
import { colors, shared } from '../../src/ui/theme';

export default function Candidates() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { api } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<OfferCandidate[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // discover respeita o limite de 1 busca por produto a cada 6 h; se ele recusar, mostra as já achadas
    api.discover(productId)
      .catch(() => api.getCandidates(productId))
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao buscar'));
  }, [api, productId]);

  async function vote(c: OfferCandidate, isSameProduct: boolean) {
    setBusy(c.id);
    try {
      const res = await api.sendFeedback(c.id, { isSameProduct, track: isSameProduct });
      setAnswers((a) => ({ ...a, [c.id]: outcomeMessage(res.outcome) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setBusy(null);
    }
  }

  if (items === null && !error) return <ActivityIndicator style={{ marginTop: 32 }} />;

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.pad}>
      {error && <Text style={shared.error}>{error}</Text>}
      {items?.length === 0 && <Text style={shared.muted}>Não encontramos esse produto em outras lojas.</Text>}
      {items?.map((c) => (
        <View key={c.id} style={shared.card}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {c.imageUrl ? <Image source={{ uri: c.imageUrl }} style={{ width: 64, height: 64 }} resizeMode="contain" /> : null}
            <View style={{ flex: 1 }}>
              <Text style={shared.muted}>{c.storeName}{c.reason === 0 ? '  ·  mesmo GTIN' : ''}</Text>
              <Text style={shared.title} numberOfLines={3}>{c.name}</Text>
              <Text style={{ color: colors.success, fontWeight: '700' }}>{formatPrice(c.price)}</Text>
            </View>
          </View>
          {answers[c.id] ? (
            <Text style={{ marginTop: 10, color: colors.text }}>{answers[c.id]}</Text>
          ) : (
            <View style={{ marginTop: 10, gap: 8 }}>
              <Text style={shared.muted}>É o mesmo produto?</Text>
              <Button label="Sim, acompanhar" loading={busy === c.id} onPress={() => vote(c, true)} />
              <Button secondary label="Não é" disabled={busy === c.id} onPress={() => vote(c, false)} />
            </View>
          )}
        </View>
      ))}
      <Button secondary label="Ver comparação" onPress={() => router.replace({ pathname: '/comparison/[productId]', params: { productId } })} />
    </ScrollView>
  );
}
