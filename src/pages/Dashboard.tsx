import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, LogOut, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProfileSetup } from "@/components/ProfileSetup";
import { TimetableView } from "@/components/TimetableView";
import { DAYS } from "@/lib/constants";

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : today - 1; // Map Sunday=0 to 0, Mon=0, Tue=1, etc.
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const needsSetup = !profile?.degree || !profile?.year || !profile?.batch;

  if (needsSetup || showSettings) {
    return <ProfileSetup onComplete={() => setShowSettings(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground hidden sm:block">SRU Schedule</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-2 hidden sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.degree} · Year {profile?.year} · {profile?.batch}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Day selector - mobile */}
          <div className="flex items-center justify-between mb-6 sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDay((d) => (d - 1 + DAYS.length) % DAYS.length)}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-display font-bold text-foreground">{DAYS[currentDay]}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDay((d) => (d + 1) % DAYS.length)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day tabs - desktop */}
          <div className="hidden sm:flex gap-2 mb-6 overflow-x-auto pb-2">
            {DAYS.map((day, i) => {
              const isToday = new Date().getDay() - 1 === i;
              return (
                <button
                  key={day}
                  onClick={() => setCurrentDay(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    currentDay === i
                      ? "bg-primary text-primary-foreground teal-glow"
                      : isToday
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                  {isToday && currentDay !== i && (
                    <span className="ml-1.5 text-xs opacity-70">Today</span>
                  )}
                </button>
              );
            })}
          </div>

          <TimetableView
            degree={profile?.degree || ""}
            year={profile?.year || ""}
            batch={profile?.batch || ""}
            day={DAYS[currentDay]}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
