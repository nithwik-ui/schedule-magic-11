import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DAYS } from "@/lib/constants";

type Profile = { degree?: string | null; year?: string | null; batch?: string | null; full_name?: string | null };

const LOCAL_NOTIFY_KEY = "sru_notify_enabled";

function parseStartTime(time: string, baseDate: Date) {
  const [start] = time.split("-").map((s) => s.trim());
  const [h, m] = start.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function nextDateForDay(dayName: string) {
  const map: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const desired = map[dayName];
  if (!desired) return null;
  const today = new Date();
  const todayDow = today.getDay();
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
  const d = new Date(today);
  d.setDate(today.getDate() + mondayOffset + (desired - 1));
  return d;
}

export const useScheduleNotifications = (profile: Profile | null, enabled: boolean, beforeMinutes = 10) => {
  const timers = useRef<number[]>([]);
  const lastClassesRef = useRef<string | null>(null);
  const weeklyTimeoutRef = useRef<number | null>(null);
  const weeklyIntervalRef = useRef<number | null>(null);
  const notifiedSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // clear previous
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    if (!enabled || !profile?.degree || !profile?.year || !profile?.batch) return;
    if (typeof Notification === "undefined") return;

    // request permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission().catch(() => {});
    }

    let mounted = true;

    const scheduleFromServer = async () => {
      try {
        const { data } = await supabase.functions.invoke("fetch-timetable", {
          body: { degree: profile?.degree, year: profile?.year, batch: profile?.batch },
        });

        if (!mounted) return;
        if (!data?.success || !data.classes) return;

        const classesStr = JSON.stringify(data.classes);
        // if we have previous classes and they differ, notify about update
        if (lastClassesRef.current && lastClassesRef.current !== classesStr) {
          if (Notification.permission === "granted") {
            const title = profile?.full_name ? `Hey ${profile.full_name.split(" ")[0]}!!` : "Timetable updated";
            const body = `Your timetable for ${profile?.degree} ${profile?.year} ${profile?.batch} got updated.`;
            new Notification(title, { body });
          }
        }

        lastClassesRef.current = classesStr;

        // schedule notifications for next 24 hours
        const now = new Date();
        const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        for (const [day, items] of Object.entries(data.classes)) {
          const base = nextDateForDay(day);
          if (!base) continue;
          for (const item of items as any[]) {
            const start = parseStartTime(item.time, base);
            if (start < now) start.setDate(start.getDate() + 7);
            if (start > horizon) continue;
            const notifyAt = new Date(start.getTime() - beforeMinutes * 60 * 1000);
            const delay = notifyAt.getTime() - now.getTime();
            if (delay <= 0) {
              if (Notification.permission === "granted") {
                const title = `Next: ${item.subject}${item.type ? ` (${item.type})` : ""}`;
                const body = `${item.room || ""} • ${item.faculty || ""} • Starts at ${item.time}`;
                new Notification(title, { body });
              }
              continue;
            }
            // create a stable id for the class to avoid duplicated notifications
            const classId = `${profile?.degree}|${profile?.year}|${profile?.batch}|${day}|${item.time}|${item.subject}`;
            if (notifiedSetRef.current.has(classId)) continue; // skip if already notified for this class
            const t = window.setTimeout(() => {
              if (Notification.permission === "granted") {
                const title = profile?.full_name ? `Hey ${profile.full_name.split(" ")[0]}!!` : `Next: ${item.subject}`;
                const body = `${item.subject}${item.type ? ` (${item.type})` : ""} • ${item.room || ""} • ${item.faculty || ""} • Starts at ${item.time}`;
                new Notification(title, { body });
                // mark as notified
                try {
                  notifiedSetRef.current.add(classId);
                  localStorage.setItem("sru_notified_ids", JSON.stringify(Array.from(notifiedSetRef.current)));
                } catch {}
              }
            }, delay);
            timers.current.push(t);
          }
        }
      } catch (e) {
        console.error("Failed to schedule notifications", e);
      }
    };

    // initial schedule
    scheduleFromServer();

    // schedule a weekly check at next Friday midnight (00:00)
    const now = new Date();
    // compute next Friday (5) midnight
    const day = now.getDay();
    const daysUntilFriday = (5 - day + 7) % 7 || 7; // if today is Friday, schedule next Friday
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);
    const msUntilNextFriday = nextFriday.getTime() - now.getTime();

    weeklyTimeoutRef.current = window.setTimeout(() => {
      // clear existing timers and reschedule from server
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
      scheduleFromServer();

      // after first trigger, set weekly interval
      weeklyIntervalRef.current = window.setInterval(() => {
        timers.current.forEach((t) => clearTimeout(t));
        timers.current = [];
        scheduleFromServer();
      }, 7 * 24 * 60 * 60 * 1000) as unknown as number;
    }, msUntilNextFriday) as unknown as number;

    return () => {
      mounted = false;
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
      if (weeklyTimeoutRef.current) {
        clearTimeout(weeklyTimeoutRef.current);
        weeklyTimeoutRef.current = null;
      }
      if (weeklyIntervalRef.current) {
        clearInterval(weeklyIntervalRef.current);
        weeklyIntervalRef.current = null;
      }
    };
  }, [profile?.degree, profile?.year, profile?.batch, enabled, beforeMinutes]);

  // helper to persist preference
  const setEnabled = (v: boolean) => {
    try {
      localStorage.setItem(LOCAL_NOTIFY_KEY, v ? "1" : "0");
    } catch {}
  };

  return { setEnabled };
};
