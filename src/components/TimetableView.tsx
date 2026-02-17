import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin, User, Clock, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimetableViewProps {
  degree: string;
  year: string;
  batch: string;
  day: string;
}

interface ClassItem {
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type: "lecture" | "lab" | "tutorial" | "free";
  ltp?: string;
}

export const TimetableView = ({ degree, year, batch, day }: TimetableViewProps) => {
  const [allClasses, setAllClasses] = useState<Record<string, ClassItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("loading");

  useEffect(() => {
    fetchTimetable();
  }, [degree, year, batch]);

  const fetchTimetable = async () => {
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-timetable", {
        body: { degree, year, batch },
      });

      if (fnError) throw fnError;

      if (data?.success && data.classes && Object.keys(data.classes).length > 0) {
        // Transform the response: classes is { "Monday": [...], "Tuesday": [...] }
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

  const classes = allClasses[day] || [];

  const getTypeStyles = (type: ClassItem["type"]) => {
    switch (type) {
      case "lab":
        return "border-l-4 border-l-teal bg-teal/5";
      case "tutorial":
        return "border-l-4 border-l-amber-500 bg-amber-500/5";
      case "free":
        return "border-l-4 border-l-muted bg-muted/50 opacity-60";
      default:
        return "border-l-4 border-l-primary bg-card";
    }
  };

  const isCurrentClass = (time: string) => {
    const now = new Date();
    const today = new Date().getDay();
    const dayMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
    };
    if (dayMap[day] !== today) return false;

    const [start] = time.split("-").map((s) => s.trim());
    const [h, m] = start.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const classStart = h * 60 + m;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return currentMin >= classStart && currentMin < classStart + 50;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2" />
            <div className="h-5 bg-muted rounded w-48 mb-1" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {source === "live" ? (
          <span className="text-xs text-teal flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Live from SR University
          </span>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Could not connect to university server · Try again later
          </span>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
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
          {classes.map((cls, i) => (
            <motion.div
              key={`${day}-${cls.time}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.05 }}
              className={`glass rounded-xl p-4 transition-all ${getTypeStyles(cls.type)} ${
                isCurrentClass(cls.time) ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{cls.time}</span>
                    {isCurrentClass(cls.time) && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Now
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground/60 capitalize px-1.5 py-0.5 bg-muted rounded">
                      {cls.type}
                    </span>
                    {cls.ltp && (
                      <span className="text-xs text-muted-foreground/40 px-1.5 py-0.5">
                        LTP: {cls.ltp}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-foreground">{cls.subject}</h3>
                  {cls.type !== "free" && (
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" /> {cls.faculty}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {cls.room}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <BookOpen className={`w-5 h-5 ${cls.type === "free" ? "text-muted" : "text-primary/50"}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};
