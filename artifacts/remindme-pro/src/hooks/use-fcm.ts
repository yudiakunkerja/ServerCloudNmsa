import { useEffect } from "react";
import { messaging, getToken, onMessage } from "@/lib/firebase";
import { useRegisterFcmToken } from "@workspace/api-client-react";
import { useAuth } from "./use-auth";

export function useFcm() {
  const { user } = useAuth();
  const registerTokenMutation = useRegisterFcmToken();

  useEffect(() => {
    if (!user || !messaging) return;

    const requestPermissionAndRegister = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });
          
          if (token) {
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
      } catch (error) {
        console.error("Error registering FCM token:", error);
      }
    };

    requestPermissionAndRegister();

    const unsubscribe = onMessage(messaging, (payload) => {
      // In foreground, we might want to show a toast, but for now just log or let service worker handle it if possible.
      // Usually, foreground messages don't show native notifications unless we do it manually.
      console.log("Received foreground message:", payload);
      
      // Could show a toast here.
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);
}
