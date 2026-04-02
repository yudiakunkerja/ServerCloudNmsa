import { useEffect } from "react";
import { messaging, getToken, onMessage } from "@/lib/firebase";
import { useRegisterFcmToken } from "@workspace/api-client-react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export function useFcm() {
  const { user } = useAuth();
  const registerTokenMutation = useRegisterFcmToken();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermissionAndRegister = async () => {
      if (!messaging) return;
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const registration = await navigator.serviceWorker.ready;
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
          });

          if (token) {
            const storedToken = localStorage.getItem("fcm_token");
            if (storedToken !== token) {
              localStorage.setItem("fcm_token", token);
              registerTokenMutation.mutate({
                data: {
                  userId: user.uid,
                  token,
                  platform: "web"
                }
              });
            }
          }
        }
      } catch (error) {
        console.error("Error registering FCM token:", error);
      }
    };

    requestPermissionAndRegister();

    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "New Notification";
      const body = payload.notification?.body || payload.data?.body || "";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png"
        });
      }

      toast({
        title,
        description: body
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);
}
