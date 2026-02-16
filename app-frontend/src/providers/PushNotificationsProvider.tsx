import { ReactNode, useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "../hooks/useAuth";
import { emitNotificationRefresh } from "../services/notificationEvents";
import { notificationService, NotificationAction } from "../services/notification.service";
import { handleNotificationAction } from "../services/notificationNavigation.service";
import { registerPushToken, unregisterPushToken } from "../services/pushRegistration.service";

type PushNotificationsProviderProps = {
  children: ReactNode;
};

const toAction = (payload: unknown): NotificationAction | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.type !== "string") return undefined;

  return {
    type: raw.type as NotificationAction["type"],
    label: typeof raw.label === "string" ? raw.label : undefined,
    routeName: typeof raw.routeName === "string" ? raw.routeName : undefined,
    routeParams: raw.routeParams && typeof raw.routeParams === "object" ? (raw.routeParams as Record<string, unknown>) : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    phone: typeof raw.phone === "string" ? raw.phone : undefined,
  };
};

export const PushNotificationsProvider = ({ children }: PushNotificationsProviderProps) => {
  const { user } = useAuth();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || user.role === "guest") return;

    let mounted = true;

    const setup = async () => {
      try {
        const token = await registerPushToken();
        if (mounted) tokenRef.current = token;
      } catch {
        // best effort registration
      }
    };

    setup();

    return () => {
      mounted = false;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user && user.role !== "guest") return;
    if (tokenRef.current) {
      unregisterPushToken(tokenRef.current);
      tokenRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    const receiveSub = Notifications.addNotificationReceivedListener(() => {
      emitNotificationRefresh();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = (response.notification.request.content.data || {}) as Record<string, unknown>;
      const action = toAction(data.action);
      await handleNotificationAction(action, data);

      const notificationId = typeof data.notificationId === "string" ? data.notificationId : null;
      if (notificationId) {
        try {
          await notificationService.markAsRead(notificationId);
        } catch {
          // ignore mark read failures
        }
      }

      emitNotificationRefresh();
    });

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, []);

  return <>{children}</>;
};
