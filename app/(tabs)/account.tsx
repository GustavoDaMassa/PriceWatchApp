import React from 'react';
import { Text, View } from 'react-native';
import { useSession } from '../../src/lib/session';
import { Button } from '../../src/ui/Button';
import { shared } from '../../src/ui/theme';

export default function Account() {
  const { user, signOut } = useSession();
  return (
    <View style={[shared.screen, shared.pad]}>
      <View style={shared.card}>
        <Text style={shared.title}>{user?.name}</Text>
        <Text style={shared.muted}>{user?.email}</Text>
      </View>
      <Button secondary label="Sair" onPress={() => void signOut()} />
    </View>
  );
}
