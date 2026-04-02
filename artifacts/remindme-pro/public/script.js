/**
 * RemindMe Pro – Firebase Integration Script
 * Handles: FCM push notifications, Firestore real-time updates,
 * alarm scheduling, and background message reception.
 *
 * This module is loaded by the app as an ES module and also
 * referenced by the service worker for background notifications.
 */

// ─────────────────────────────────────────────
// Firebase config (values injected at build time via env)
// ─────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey:            window.__FIREBASE_API_KEY__            || "",
  authDomain:        window.__FIREBASE_AUTH_DOMAIN__        || "",
  projectId:         window.__FIREBASE_PROJECT_ID__         || "",
  storageBucket:     window.__FIREBASE_STORAGE_BUCKET__     || "",
  messagingSenderId: window.__FIREBASE_MESSAGING_SENDER_ID__ || "",
  appId:             window.__FIREBASE_APP_ID__             || "",
};

const VAPID_KEY = window.__FIREBASE_VAPID_KEY__ || "";

// ─────────────────────────────────────────────
// Service Worker Registration
// ─────────────────────────────────────────────
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("[RemindMe] Service workers not supported.");
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/"
    });
    console.log("[RemindMe] Service worker registered:", registration.scope);
    return registration;
  } catch (err) {
    console.error("[RemindMe] Service worker registration failed:", err);
    return null;
  }
}

// ─────────────────────────────────────────────
// Request Notification Permission
// ─────────────────────────────────────────────
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("[RemindMe] Notifications not supported.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// ─────────────────────────────────────────────
// Show a Native Notification
// ─────────────────────────────────────────────
function showNotification(title, body, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notif = new Notification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    ...options
  });

  notif.onclick = (e) => {
    e.preventDefault();
    window.focus();
    notif.close();
  };
}

// ─────────────────────────────────────────────
// Alarm Scheduler – checks every 30 seconds
// ─────────────────────────────────────────────
let alarmIntervalId = null;

function startAlarmScheduler(getAlarmsFn, onAlarmTriggered) {
  if (alarmIntervalId) clearInterval(alarmIntervalId);

  const check = async () => {
    const now = new Date();
    const alarms = await getAlarmsFn();
    if (!Array.isArray(alarms)) return;

    for (const alarm of alarms) {
      if (!alarm.isActive || !alarm.scheduledAt) continue;

      const alarmTime = new Date(alarm.scheduledAt);
      const diff = Math.abs(now - alarmTime) / 1000; // seconds

      if (diff <= 30) {
        const lastFiredKey = `alarm_last_fired_${alarm.id}`;
        const lastFired = localStorage.getItem(lastFiredKey);
        if (lastFired && Math.abs(new Date() - new Date(lastFired)) < 60000) continue;

        localStorage.setItem(lastFiredKey, now.toISOString());
        onAlarmTriggered(alarm);

        showNotification(
          `⏰ Alarm: ${alarm.title}`,
          `Your alarm "${alarm.title}" is ringing!`,
          { tag: `alarm-${alarm.id}`, renotify: true }
        );
      }
    }
  };

  check();
  alarmIntervalId = setInterval(check, 30000);
  return () => clearInterval(alarmIntervalId);
}

function stopAlarmScheduler() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

// ─────────────────────────────────────────────
// Daily Startup Popup – pending reminders
// ─────────────────────────────────────────────
function checkDailyReminders(reminders) {
  const today = new Date().toDateString();
  const lastOpened = localStorage.getItem("remindme_last_opened");
  if (lastOpened === today) return;

  localStorage.setItem("remindme_last_opened", today);

  const pending = reminders.filter(r => !r.isCompleted);
  if (pending.length === 0) return;

  showNotification(
    `📋 You have ${pending.length} pending reminder${pending.length > 1 ? "s" : ""}`,
    pending.slice(0, 3).map(r => `• ${r.title}`).join("\n"),
    { tag: "daily-summary" }
  );
}

// ─────────────────────────────────────────────
// PWA Install Prompt Helper
// ─────────────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.dispatchEvent(new CustomEvent("remindme:install-available"));
});

async function promptInstall() {
  if (!deferredInstallPrompt) return false;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return outcome === "accepted";
}

// ─────────────────────────────────────────────
// Clipboard Helper
// ─────────────────────────────────────────────
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

// ─────────────────────────────────────────────
// Audio Alarm Tone
// ─────────────────────────────────────────────
function playAlarmTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const beep = (time, freq, duration = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + time + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + time + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + duration);
    };

    beep(0.0, 880);
    beep(0.3, 880);
    beep(0.6, 880);
    beep(1.0, 1046.5);
    beep(1.3, 1046.5);
  } catch (e) {
    console.warn("[RemindMe] Audio playback failed:", e);
  }
}

// ─────────────────────────────────────────────
// Init – call this once on app startup
// ─────────────────────────────────────────────
async function initRemindMeScripts() {
  await registerServiceWorker();
  const allowed = await requestNotificationPermission();
  if (!allowed) {
    console.warn("[RemindMe] Notification permission not granted.");
  }
  console.log("[RemindMe] Scripts initialized.");
}

// ─────────────────────────────────────────────
// Exports for use in React / TypeScript modules
// ─────────────────────────────────────────────
window.RemindMe = {
  init: initRemindMeScripts,
  registerServiceWorker,
  requestNotificationPermission,
  showNotification,
  startAlarmScheduler,
  stopAlarmScheduler,
  checkDailyReminders,
  promptInstall,
  copyToClipboard,
  playAlarmTone,
};
