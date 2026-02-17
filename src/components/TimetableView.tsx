import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MapPin, User, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIME_SLOTS } from "@/lib/constants";

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
}

export const TimetableView = ({ degree, year, batch, day }: TimetableViewProps) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetable();
  }, [degree, year, batch, day]);

  const fetchTimetable = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-timetable", {
        body: { degree, year, batch, day },
      });

      if (fnError) throw fnError;

      if (data?.classes && data.classes.length > 0) {
        setClasses(data.classes);
      } else {
        // Show demo data when no real data available
        setClasses(getDemoClasses(day));
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
      // Fallback to demo data
      setClasses(getDemoClasses(day));
    } finally {
      setLoading(false);
    }
  };

  const getDemoClasses = (day: string): ClassItem[] => {
    if (day === "Saturday") {
      return TIME_SLOTS.slice(0, 4).map((time, i) => ({
        time,
        subject: ["Data Structures", "Operating Systems", "Database Management", "Soft Skills"][i],
        faculty: ["Dr. Kumar", "Prof. Reddy", "Dr. Sharma", "Ms. Priya"][i],
        room: [`LH-${101 + i}`, `LH-${201 + i}`, `Lab-${1 + i}`, `LH-${301 + i}`][i],
        type: (["lecture", "lecture", "lab", "tutorial"] as const)[i],
      }));
    }
    return TIME_SLOTS.map((time, i) => ({
      time,
      subject: [
        "Data Structures & Algorithms",
        "Computer Networks",
        "Operating Systems",
        "Database Management Systems",
        "Software Engineering",
        "Discrete Mathematics",
        "Web Technologies Lab",
        "Free Period",
      ][i],
      faculty: ["Dr. Kumar", "Prof. Reddy", "Dr. Sharma", "Prof. Rao", "Ms. Priya", "Dr. Suresh", "Prof. Anil", ""][i],
      room: [`LH-${101 + i}`, `LH-${201 + i}`, `Lab-3`, `LH-${301 + i}`, `LH-${401 + i}`, `LH-102`, `CSE Lab-1`, ""][i],
      type: (["lecture", "lecture", "lab", "lecture", "tutorial", "lecture", "lab", "free"] as const)[i],
    }));
  };

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

    const [start] = time.split(" - ");
    const [h, m] = start.split(":").map(Number);
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
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Showing demo schedule · Connect to live data via settings
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {classes.map((cls, i) => (
          <motion.div
            key={`${day}-${cls.time}`}
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
    </div>
  );
};
