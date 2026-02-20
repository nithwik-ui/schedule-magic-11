import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Settings, ChevronRight, GraduationCap, Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProfileSetup } from "@/components/ProfileSetup";
import { TimetableView } from "@/components/TimetableView";
import { DAYS } from "@/lib/constants";
import { useScheduleNotifications } from "@/hooks/useScheduleNotifications";
import { subscribeToPush } from "@/lib/push";
import { useToast } from "@/hooks/use-toast";
import NotificationPermissionBanner from "@/components/NotificationPermissionBanner";

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(() => {
    try {
      return localStorage.getItem("sru_notify_enabled") === "1";
    } catch {
      return false;
    }
  });
  const [todayOnly, setTodayOnly] = useState(() => {
    try { return localStorage.getItem("sru_notify_today_only") !== "0"; } catch { return true; }
  });
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [bgPushRegistered, setBgPushRegistered] = useState(false);
  const { toast } = useToast();
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : today - 1;
  });

  useEffect(() => {
    if (!loading && !user && !profile) navigate("/setup");
  }, [loading, user, profile, navigate]);

  // schedule notifications when enabled (pass todayOnly)
  const { setEnabled: persistNotify } = useScheduleNotifications(profile ?? null, notifyEnabled, 10);

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

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">SR University</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant={notifyEnabled ? "secondary" : "ghost"}
            size="icon"
            onClick={() => {
              const next = !notifyEnabled;
              setNotifyEnabled(next);
              try { localStorage.setItem("sru_notify_enabled", next ? "1" : "0"); } catch {}
              try { persistNotify(next); } catch {}
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
          </Button>
          {/* Today-only toggle */}
          <button
            onClick={() => {
              const next = !todayOnly;
              setTodayOnly(next);
              try { localStorage.setItem("sru_notify_today_only", next ? "1" : "0"); } catch {}
            }}
            className={`px-3 py-1 rounded-md text-sm ${todayOnly ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
          >
            {todayOnly ? 'Today' : 'Full week'}
          </button>
          {/* Refresh button */}
          <button
            onClick={() => {
              // bump signal to trigger child TimetableView refresh (it reads degree/year/batch)
              setRefreshSignal((s) => s + 1);
            }}
            className="px-3 py-1 rounded-md text-sm bg-card border border-border text-muted-foreground"
            title="Refresh timetable"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {
              try { localStorage.removeItem('sru_notified_ids'); } catch {}
              try { toast({ title: 'Cleared notified history' }); } catch {}
            }}
            className="px-3 py-1 rounded-md text-sm bg-card border border-border text-muted-foreground"
            title="Clear notified history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (!profile) return toast({ title: 'Save preferences first', variant: 'destructive' });
              const serverUrl = window.prompt('Enter push server URL (e.g. http://localhost:3000)');
              if (!serverUrl) return;
              try {
                await subscribeToPush(serverUrl, { full_name: profile.full_name, degree: profile.degree, year: profile.year, batch: profile.batch });
                setBgPushRegistered(true);
                toast({ title: 'Background push enabled' });
              } catch (e: any) {
                console.error(e);
                toast({ title: 'Failed to enable background push', description: String(e), variant: 'destructive' });
              }
            }}
            className={`px-3 py-1 rounded-md text-sm ${bgPushRegistered ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
          >
            Enable Background Push
          </button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Permission banner (shows when notifications are enabled but browser permission not granted) */}
      <NotificationPermissionBanner onGrant={() => {
        // If user granted permission via banner, ensure notify toggle is persisted
        try { localStorage.setItem('sru_notify_enabled','1'); } catch {}
      }} />

      <main className="flex-1 overflow-y-auto pb-8">
        {/* Filter chips */}
        <section className="px-4 pt-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <div className="bg-card border border-border px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{profile?.degree}</span>
          </div>
          <div className="bg-card border border-border px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{profile?.year}</span>
          </div>
          <div className="bg-card border border-border px-3 py-1.5 rounded-full flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{profile?.batch}</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 ml-auto"
          >
            <Settings className="w-5 h-5 text-primary-foreground" />
          </button>
        </section>

        {/* Day Selector */}
        <section className="mt-6 border-b border-border sticky top-[60px] bg-background/95 backdrop-blur-md z-40">
          <div className="flex px-4 overflow-x-auto hide-scrollbar gap-6 items-center">
            {/* Mobile: native select */}
            <div className="w-full sm:hidden">
              <label className="sr-only">Select day</label>
              <select
                value={currentDay}
                onChange={(e) => setCurrentDay(Number(e.target.value))}
                className="w-full bg-card border border-border rounded-lg px-3 py-2"
              >
                {DAYS.map((day, i) => (
                  <option key={day} value={i}>
                    {day} - {weekDates[i]?.getDate()}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop/tablet: chips */}
            <div className="hidden sm:flex gap-6">
              {DAYS.map((day, i) => {
              const isToday = today.getDay() - 1 === i;
              const dateNum = weekDates[i]?.getDate();
              const shortDay = day.substring(0, 3);
              return (
                <button
                  key={day}
                  onClick={() => setCurrentDay(i)}
                  className={`flex flex-col items-center px-3 py-3 border-b-2 min-w-[64px] sm:min-w-[40px] rounded-lg touch-manipulation transition-colors ${
                    currentDay === i
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <span className={`text-sm sm:text-[10px] font-bold uppercase tracking-tighter ${
                    currentDay === i ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {shortDay}
                  </span>
                  <span className={`text-lg sm:text-base font-bold ${
                    currentDay === i ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {dateNum}
                  </span>
                  {isToday && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${
                      currentDay === i ? "bg-primary" : "bg-muted-foreground"
                    }`} />
                  )}
                </button>
              );
            })}
            </div>
          </div>
        </section>

        {/* Timetable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mt-6"
        >
          <TimetableView
            degree={profile?.degree || ""}
            year={profile?.year || ""}
            batch={profile?.batch || ""}
            day={DAYS[currentDay]}
            refreshSignal={refreshSignal}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
