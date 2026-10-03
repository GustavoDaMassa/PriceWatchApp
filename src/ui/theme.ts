import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#3483FA',
  success: '#00A650',
  danger: '#F23D4F',
  bg: '#F5F5F5',
  card: '#FFFFFF',
  text: '#222222',
  muted: '#666666',
  border: '#E0E0E0',
};

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, marginBottom: 12 },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  buttonSecondaryText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  error: { color: colors.danger, marginBottom: 12 },
});
