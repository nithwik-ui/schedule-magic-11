import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DEGREES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [degree, setDegree] = useState(profile?.degree || "");
  const [year, setYear] = useState(profile?.year || "");
  const [batch, setBatch] = useState(profile?.batch || "");
  const [loading, setLoading] = useState(false);

  const [years, setYears] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);

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
    supabase.functions.invoke("fetch-options", {
      body: { action: "getYears", degree },
    }).then(({ data, error }) => {
      if (data?.success && Array.isArray(data.options)) {
        setYears(data.options);
      } else {
        setYears([]);
        console.error("Failed to fetch years:", error || data?.error);
      }
      setLoadingYears(false);
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
    supabase.functions.invoke("fetch-options", {
      body: { action: "getBatches", degree, year },
    }).then(({ data, error }) => {
      if (data?.success && Array.isArray(data.options)) {
        setBatches(data.options);
      } else {
        setBatches([]);
        console.error("Failed to fetch batches:", error || data?.error);
      }
      setLoadingBatches(false);
    });
  }, [degree, year]);

  const handleSave = async () => {
    if (!degree || !year || !batch) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updateProfile({ degree, year, batch });
    if (error) {
      toast({ title: "Failed to save", description: String(error), variant: "destructive" });
    } else {
      toast({ title: "Preferences saved!" });
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Set up your profile
          </h1>
          <p className="text-muted-foreground">
            Tell us your details so we can show your timetable instantly
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border shadow-xl space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-semibold">Degree / Program</Label>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select your degree" />
              </SelectTrigger>
              <SelectContent>
                {DEGREES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm font-semibold">Year</Label>
            <Select value={year} onValueChange={setYear} disabled={!degree || loadingYears}>
              <SelectTrigger className="bg-background border-border">
                {loadingYears ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading years...
                  </span>
                ) : (
                  <SelectValue placeholder={!degree ? "Select a degree first" : "Select your year"} />
                )}
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground text-sm font-semibold">Batch / Section</Label>
            <Select value={batch} onValueChange={setBatch} disabled={!year || loadingBatches}>
              <SelectTrigger className="bg-background border-border">
                {loadingBatches ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading batches...
                  </span>
                ) : (
                  <SelectValue placeholder={!year ? "Select a year first" : "Select your batch"} />
                )}
              </SelectTrigger>
              <SelectContent>
                {batches.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-bold shadow-lg shadow-primary/20 gap-2 group"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & View Timetable"}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
