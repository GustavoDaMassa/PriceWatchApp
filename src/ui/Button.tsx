import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { shared } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, secondary, loading, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={[secondary ? shared.buttonSecondary : shared.button, (disabled || loading) && { opacity: 0.6 }]}
    >
      {loading ? <ActivityIndicator color={secondary ? '#3483FA' : '#fff'} /> : <Text style={secondary ? shared.buttonSecondaryText : shared.buttonText}>{label}</Text>}
    </Pressable>
  );
}
