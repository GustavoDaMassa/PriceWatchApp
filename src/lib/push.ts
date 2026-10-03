import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSession } from './session';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Pede permissão e registra o token FCM do aparelho na API (best-effort: falhar não atrapalha o app). */
export function usePushRegistration(loggedIn: boolean) {
  const { api } = useSession();
  useEffect(() => {
    if (!loggedIn || Platform.OS !== 'android' || !Device.isDevice) return;
    // Expo Go não suporta push no Android; o app de verdade (development/production build) sim
    if (Constants.appOwnership === 'expo') return;
    (async () => {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Alertas de preço',
          importance: Notifications.AndroidImportance.HIGH,
        });
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        const token = await Notifications.getDevicePushTokenAsync();
        await api.registerDevice(String(token.data), 'android');
      } catch {
        // sem Firebase configurado ou sem rede: o app segue sem push
      }
    })();
  }, [loggedIn, api]);
}

/** Toque no push (app aberto, em segundo plano ou fechado) leva à central de notificações. */
export function useNotificationTaps(onTap: () => void) {
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (last) onTap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [last?.notification.request.identifier]);
}
