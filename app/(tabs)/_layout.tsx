import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../src/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen name="index" options={{ title: 'Meus produtos' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Alertas' }} />
      <Tabs.Screen name="account" options={{ title: 'Conta' }} />
    </Tabs>
  );
}
