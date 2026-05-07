"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 30_000;

export interface ClientNotification {
  id: string;
  type: "match_start" | "checkin_reminder" | "result" | "system" | "team_invite";
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: ClientNotification[];
  unreadCount: number;
}

export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchNotifications = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("[useNotifications] fetch failed:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") fetchNotifications();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      abortRef.current?.abort();
    };
  }, [enabled, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => {
      const target = notifications.find((n) => n.id === id);
      return target && !target.read ? Math.max(0, prev - 1) : prev;
    });
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("[useNotifications] markAsRead failed:", err);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error("[useNotifications] markAllAsRead failed:", err);
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
