import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { formatPrice } from '../../src/lib/helpers';
import { useSession } from '../../src/lib/session';
import type { TrackedProduct } from '../../src/lib/types';
import { Button } from '../../src/ui/Button';
import { colors, shared } from '../../src/ui/theme';

export default function Products() {
  const { api } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<TrackedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await api.getProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <View style={shared.screen}>
      <FlatList
        contentContainerStyle={shared.pad}
        data={items}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <Button label="Adicionar produto" onPress={() => router.push('/add')} />
            {error && <Text style={[shared.error, { marginTop: 8 }]}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={shared.muted}>Você ainda não acompanha nenhum produto.</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={[shared.card, { flexDirection: 'row', gap: 12 }]}
            onPress={() => item.productId && router.push({ pathname: '/comparison/[productId]', params: { productId: item.productId } })}
          >
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={{ width: 64, height: 64, borderRadius: 6 }} resizeMode="contain" /> : null}
            <View style={{ flex: 1 }}>
              <Text style={shared.title} numberOfLines={2}>{item.name}</Text>
              <Text style={{ color: colors.success, fontWeight: '700', marginTop: 4 }}>{formatPrice(item.currentPrice)}</Text>
              <Text style={shared.muted}>
                Menor: {formatPrice(item.lowestPrice)}
                {item.targetPrice > 0 ? `  ·  Alvo: ${formatPrice(item.targetPrice)}` : ''}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
