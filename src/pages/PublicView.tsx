import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimetableView } from "@/components/TimetableView";
import { DEGREES, DAYS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const PublicView = () => {
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");

  const [years, setYears] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);

  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : today - 1;
  });

  useEffect(() => {
    if (!degree) {
      setYears([]);
      setYear("");
      setBatches([]);
      setBatch("");
      return;
    }
    setYear("");
    setBatch("");
    setBatches([]);
    setLoadingYears(true);
    supabase.functions.invoke("fetch-options", { body: { action: "getYears", degree } }).then(({ data, error }) => {
      if (data?.success && Array.isArray(data.options)) setYears(data.options);
      else setYears([]);
      setLoadingYears(false);
      if (error) console.error("fetch-options getYears error:", error);
    });
  }, [degree]);

  useEffect(() => {
    if (!degree || !year) {
      setBatches([]);
      setBatch("");
      return;
    }
    setBatch("");
    setLoadingBatches(true);
    supabase.functions.invoke("fetch-options", { body: { action: "getBatches", degree, year } }).then(({ data, error }) => {
      if (data?.success && Array.isArray(data.options)) setBatches(data.options);
      else setBatches([]);
      setLoadingBatches(false);
      if (error) console.error("fetch-options getBatches error:", error);
    });
  }, [degree, year]);

  useEffect(() => {
    // Try to preselect a sensible default degree/year if available
    setLoadingInit(true);
    // no-op for now; leave loading false after tiny delay to avoid flicker
    const t = setTimeout(() => setLoadingInit(false), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <nav className="py-6 px-4 container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">SR University</span>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">My Schedule</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-8 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Quick Timetable View</h1>
            <p className="text-muted-foreground mt-2">Select degree, year and batch to view the timetable without signing in.</p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground text-sm font-semibold">Degree</Label>
                <Select value={degree} onValueChange={setDegree}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground text-sm font-semibold">Year</Label>
                <Select value={year} onValueChange={setYear} disabled={!degree || loadingYears}>
                  <SelectTrigger className="bg-background border-border">
                    {loadingYears ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/> Loading years...</span> : <SelectValue placeholder={!degree ? "Select a degree first" : "Select year"} />}
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground text-sm font-semibold">Batch</Label>
                <Select value={batch} onValueChange={setBatch} disabled={!year || loadingBatches}>
                  <SelectTrigger className="bg-background border-border">
                    {loadingBatches ? <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin"/> Loading batches...</span> : <SelectValue placeholder={!year ? "Select a year first" : "Select batch"} />}
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full sm:hidden">
                <label className="sr-only">Select day</label>
                <select
                  value={currentDay}
                  onChange={(e) => setCurrentDay(Number(e.target.value))}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 mb-3"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d} - {new Date().getDate() + i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex gap-2 overflow-x-auto hide-scrollbar">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setCurrentDay(i)}
                    className={`px-4 py-3 rounded-full text-base sm:text-sm font-medium min-w-[56px] sm:min-w-auto ${currentDay === i ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                    {d.substring(0,3)}
                  </button>
                ))}
              </div>

              <div className="ml-auto">
                <Button asChild>
                  <Link to="/setup" className="flex items-center gap-2">Save preferences <ArrowRight className="w-4 h-4"/></Link>
                </Button>
              </div>
            </div>
          </div>

          <div>
            {degree && year && batch ? (
              <div className="bg-card rounded-xl p-4 border border-border">
                <TimetableView degree={degree} year={year} batch={batch} day={DAYS[currentDay]} />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-8 border border-border text-center text-muted-foreground">
                Please select degree, year and batch to view the timetable.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicView;
