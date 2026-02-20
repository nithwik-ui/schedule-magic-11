import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User, Clock, AlertCircle, Wifi, WifiOff, ChevronRight, Coffee, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TimetableViewProps {
  degree: string;
  year: string;
  batch: string;
  day: string;
  // optional signal to force refetch when parent increments
  refreshSignal?: number;
}

interface ClassItem {
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type: "lecture" | "lab" | "tutorial" | "free";
  ltp?: string;
}

export const TimetableView = ({ degree, year, batch, day, refreshSignal }: TimetableViewProps) => {
  const [allClasses, setAllClasses] = useState<Record<string, ClassItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("loading");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // support manual refresh by key change
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  // per-class notification subscriptions (ids)
  const [classSubs, setClassSubs] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("sru_class_alerts");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // in-memory timers to clear on unmount
  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      try {
        for (const k of Object.keys(timersRef)) {
          clearTimeout(timersRef[k]);
        }
      } catch {}
    };
  }, []);
  const timersRef = useState<Record<string, number>>(() => ({}))[0] as Record<string, number>;

  useEffect(() => {
    fetchTimetable();
    // try to load from cache first if available
    try {
      const key = `sru_tt_${degree}_${year}_${batch}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.classes && Object.keys(parsed.classes).length > 0) {
          setAllClasses(parsed.classes);
          setSource(parsed.source || "cached");
          if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
        }
      }
    } catch {}
  }, [degree, year, batch]);

  // restore and schedule any subscribed class alerts when classes load
  useEffect(() => {
    // clear existing timers
    try {
      for (const k of Object.keys(timersRef)) {
        clearTimeout(timersRef[k]);
        delete timersRef[k];
      }
    } catch {}

    // schedule timers for subscribed classes
    try {
      const subsRaw = localStorage.getItem("sru_class_alerts");
      const subs = subsRaw ? JSON.parse(subsRaw) : {};
      setClassSubs(subs);
      const notifiedRaw = localStorage.getItem("sru_notified_ids");
      const notified = notifiedRaw ? JSON.parse(notifiedRaw) : [];

      for (const [d, items] of Object.entries(allClasses)) {
        for (const cls of items) {
          const id = `${d}-${cls.time}-${cls.subject}-${cls.room}`;
          if (!subs[id]) continue;

          // compute class start time (today adjusted to the week's day)
          const [start] = cls.time.split("-").map((s) => s.trim());
          const [h, m] = start.split(":").map(Number);
          if (isNaN(h) || isNaN(m)) continue;

          // find next occurrence date for this day name
          const today = new Date();
          const dayMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
          const targetDow = dayMap[d as string];
          if (!targetDow) continue;
          const delta = (targetDow + 7 - today.getDay()) % 7;
          const classDate = new Date(today);
          classDate.setDate(today.getDate() + delta);
          classDate.setHours(h, m, 0, 0);

          const scheduleAt = classDate.getTime() - 10 * 60 * 1000;
          const now = Date.now();
          if (notified.includes(id)) continue; // already sent

          if (scheduleAt <= now) {
            // too late -> show immediately
            showNotificationForClass(id, cls);
            try { notified.push(id); localStorage.setItem('sru_notified_ids', JSON.stringify(notified)); } catch {}
          } else {
            const to = window.setTimeout(() => {
              showNotificationForClass(id, cls);
              try {
                const nr = localStorage.getItem('sru_notified_ids');
                const nrArr = nr ? JSON.parse(nr) : [];
                nrArr.push(id);
                localStorage.setItem('sru_notified_ids', JSON.stringify(nrArr));
              } catch {}
            }, scheduleAt - now);
            timersRef[id] = to;
          }
        }
      }
    } catch (e) { console.error(e); }
  }, [allClasses]);

  // refresh when parent increments signal
  useEffect(() => {
    if (typeof (refreshSignal as any) === 'number') fetchTimetable();
  }, [degree, year, batch, (refreshSignal as any)]);

  const fetchTimetable = async () => {
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-timetable", {
        body: { degree, year, batch },
      });

      if (fnError) throw fnError;

      if (data?.success && data.classes && Object.keys(data.classes).length > 0) {
        const transformed: Record<string, ClassItem[]> = {};
        for (const [d, items] of Object.entries(data.classes)) {
          transformed[d] = (items as any[]).map((item) => ({
            time: item.time,
            subject: item.subject,
            faculty: item.faculty,
            room: item.room,
            type: item.type as ClassItem["type"],
            ltp: item.ltp,
          }));
        }
        setAllClasses(transformed);
        setSource(data.source || "live");
        const nowStr = new Date().toISOString();
        setLastUpdated(nowStr);
        try {
          const key = `sru_tt_${degree}_${year}_${batch}`;
          localStorage.setItem(key, JSON.stringify({ classes: transformed, source: data.source || "live", lastUpdated: nowStr }));
        } catch {}
      } else {
        setAllClasses({});
        setSource("unavailable");
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setAllClasses({});
      setSource("error");
    } finally {
      setLoading(false);
    }
  };

  const showNotificationForClass = (id: string, cls: ClassItem) => {
    try {
      if (typeof Notification === 'undefined') {
        toast({ title: 'Notifications not supported in this browser' });
        return;
      }
      if (Notification.permission !== 'granted') {
        toast({ title: 'Please enable notifications', description: 'Grant permission from the banner', variant: 'destructive' });
        return;
      }
      const title = `${cls.subject} starts in 10 minutes`;
      const body = `${cls.faculty} • ${cls.room} • ${cls.time}`;
      new Notification(title, { body });
    } catch (e) {
      console.error('notify', e);
    }
  };

  const toggleClassSubscription = (dayName: string, cls: ClassItem) => {
    const id = `${dayName}-${cls.time}-${cls.subject}-${cls.room}`;
    const next = { ...classSubs };
    if (next[id]) {
      delete next[id];
      // clear timer if any
      try { if (timersRef[id]) { clearTimeout(timersRef[id]); delete timersRef[id]; } } catch {}
    } else {
      next[id] = true;
      // schedule now (will be handled by effect when allClasses changes) - but also schedule immediate for current render
      try { localStorage.setItem('sru_class_alerts', JSON.stringify(next)); } catch {}
      setClassSubs(next);
      // trigger scheduling by re-running effect: force update by touching allClasses state (no-op)
    }
    try { localStorage.setItem('sru_class_alerts', JSON.stringify(next)); } catch {}
    setClassSubs(next);
  };

  const classes = allClasses[day] || [];

  const isCurrentClass = (time: string) => {
    const now = new Date();
    const todayDow = now.getDay();
    const dayMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    if (dayMap[day] !== todayDow) return false;

    const [start] = time.split("-").map((s) => s.trim());
    const [h, m] = start.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const classStart = h * 60 + m;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return currentMin >= classStart && currentMin < classStart + 50;
  };

  const isLunchBreak = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    return hour === 12 || hour === 13;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center gap-1 w-12 shrink-0">
              <div className="h-4 w-10 bg-muted rounded animate-pulse" />
              <div className="w-px h-12 bg-border" />
            </div>
            <div className="flex-1 pb-4">
              <div className="bg-card border border-border p-4 rounded-xl animate-pulse">
                <div className="h-4 bg-muted rounded w-40 mb-2" />
                <div className="h-3 bg-muted rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lastUpdated && (
        <div className="text-xs text-muted-foreground/80">Timetable last updated: {new Date(lastUpdated).toLocaleString()}</div>
      )}
      {/* Source indicator */}
      <div className="flex items-center gap-2 mb-4 px-1">
        {source === "live" ? (
          <span className="text-xs text-primary flex items-center gap-1 font-medium">
            <Wifi className="w-3 h-3" />
            Live from SR University
          </span>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Could not connect · Try again later
          </span>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No classes on {day}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {source === "unavailable" || source === "error"
              ? "University server may be down. Try refreshing."
              : "Enjoy your day off!"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {classes.map((cls, i) => {
            const current = isCurrentClass(cls.time);
            const showLunchBefore =
              i > 0 &&
              !isLunchBreak(classes[i - 1].time) &&
              isLunchBreak(cls.time);

            return (
              <div key={`${day}-${cls.time}-${i}`}>
                {/* Lunch break divider */}
                {showLunchBefore && (
                  <div className="flex gap-4 my-2">
                    <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                      <span className="text-xs font-bold text-muted-foreground italic">12:00</span>
                      <div className="w-px h-full border-l border-dashed border-muted-foreground/30 my-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center gap-3">
                        <Coffee className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Lunch Break</span>
                      </div>
                    </div>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4"
                >
                  {/* Time column */}
                  <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                    <span className={`text-xs font-bold ${current ? "text-foreground" : "text-muted-foreground"}`}>
                      {cls.time.split("-")[0]?.split(":").slice(0, 2).join(":")}
                    </span>
                    {i < classes.length - 1 && (
                      <div className="w-px h-full bg-border my-1" />
                    )}
                  </div>

                  {/* Class card */}
                  <div className="flex-1 pb-4">
                    {current ? (
                      <div className="relative overflow-hidden rounded-xl bg-card border border-border p-4 shadow-xl">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                        <div className="flex justify-between items-start pl-2">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                              Ongoing
                            </span>
                            <h3 className="text-base font-bold text-foreground leading-tight">{cls.subject}</h3>
                            <p className="text-sm text-muted-foreground">
                              {cls.faculty} • {cls.room}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 pl-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">{cls.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded">
                              {cls.type}
                            </span>
                            <button
                              onClick={() => toggleClassSubscription(day, cls)}
                              title="Notify me for this class"
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                            >
                              {classSubs[`${day}-${cls.time}-${cls.subject}-${cls.room}`] ? (
                                <Bell className="w-4 h-4 text-primary" />
                              ) : (
                                <BellOff className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-card/50 border border-border p-4 rounded-xl flex justify-between items-center group active:scale-[0.98] transition-transform">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{cls.subject}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {cls.faculty} • {cls.room}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleClassSubscription(day, cls)}
                            title="Notify me for this class"
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                          >
                            {classSubs[`${day}-${cls.time}-${cls.subject}-${cls.room}`] ? (
                              <Bell className="w-5 h-5 text-primary" />
                            ) : (
                              <BellOff className="w-5 h-5" />
                            )}
                          </button>
                          <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-active:text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};
