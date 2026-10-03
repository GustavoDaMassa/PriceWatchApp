import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { Button } from '../src/ui/Button';
import { colors, shared } from '../src/ui/theme';
import { useSession } from '../src/lib/session';

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[shared.screen, { justifyContent: 'center' }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={shared.pad}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>PriceWatch</Text>
        <Text style={[shared.muted, { marginBottom: 24 }]}>Acompanhe o preço e compare lojas.</Text>
        <TextInput style={shared.input} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" autoComplete="email" value={email} onChangeText={setEmail} />
        <TextInput style={shared.input} placeholder="Senha" secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} onSubmitEditing={submit} />
        {error && <Text style={shared.error}>{error}</Text>}
        <Button label="Entrar" onPress={submit} loading={loading} disabled={!email || !password} />
        <Text style={[shared.muted, { marginTop: 16, textAlign: 'center' }]}>Ainda não tem conta? Crie em pricewatch.gustavohdev.com.br</Text>
      </View>
    </KeyboardAvoidingView>
  );
}
