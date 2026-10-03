import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSession } from '../../src/lib/session';
import type { AppNotification } from '../../src/lib/types';
import { Button } from '../../src/ui/Button';
import { colors, shared } from '../../src/ui/theme';

export default function Notifications() {
  const { api } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await api.getNotifications());
    } catch {
      // mantém a lista anterior
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(useCallback(() => void load(), [load]));

  async function readAll() {
    await api.markAllAsRead().catch(() => undefined);
    await load();
  }

  return (
    <View style={shared.screen}>
      <FlatList
        contentContainerStyle={shared.pad}
        data={items}
        keyExtractor={(n) => n.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={items.some((n) => !n.isRead) ? <View style={{ marginBottom: 12 }}><Button secondary label="Marcar todas como lidas" onPress={readAll} /></View> : null}
        ListEmptyComponent={!loading ? <Text style={shared.muted}>Nenhum alerta por enquanto.</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={[shared.card, !item.isRead && { borderColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/comparison/[productId]', params: { productId: item.productId } })}
          >
            <Text style={shared.title} numberOfLines={2}>{item.productName}</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>{item.message}</Text>
            <Text style={shared.muted}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
