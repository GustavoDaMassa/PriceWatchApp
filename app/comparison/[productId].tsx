import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import { formatPrice, freshnessLabel } from '../../src/lib/helpers';
import { useSession } from '../../src/lib/session';
import type { ProductComparison } from '../../src/lib/types';
import { Button } from '../../src/ui/Button';
import { colors, shared } from '../../src/ui/theme';

export default function Comparison() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { api } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ProductComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getComparison(productId).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar'));
  }, [api, productId]);

  // A saída para a loja passa sempre pelo clique: registra e devolve o link de afiliado quando há
  const goToStore = useCallback(
    async (offerId: string) => {
      try {
        const { url } = await api.clickOffer(offerId);
        await Linking.openURL(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Não foi possível abrir a loja');
      }
    },
    [api],
  );

  if (error) return <Text style={[shared.error, shared.pad]}>{error}</Text>;
  if (!data) return null;

  return (
    <ScrollView style={shared.screen} contentContainerStyle={shared.pad}>
      <Text style={[shared.title, { marginBottom: 12 }]}>{data.name}</Text>
      {data.offers.map((o) => (
        <View key={o.offerId} style={[shared.card, o.isCheapest && { borderColor: colors.success }]}>
          <Text style={shared.title}>{o.storeName}{o.isCheapest ? '  ·  menor preço' : ''}</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success, marginVertical: 4 }}>{formatPrice(o.currentPrice)}</Text>
          <Text style={[shared.muted, { marginBottom: 10 }]}>
            Menor já visto: {formatPrice(o.lowestPrice)}  ·  verificado {freshnessLabel(o.lastCheckedAt)}
          </Text>
          <Button label="Ir para a loja" onPress={() => goToStore(o.offerId)} />
        </View>
      ))}
      <Text style={[shared.muted, { marginBottom: 12 }]}>
        Preços de feeds e redes de afiliados podem ter atraso em relação ao site da loja.
      </Text>
      <Button secondary label="Procurar em outras lojas" onPress={() => router.push({ pathname: '/candidates/[productId]', params: { productId } })} />
    </ScrollView>
  );
}
