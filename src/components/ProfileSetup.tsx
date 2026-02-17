import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { DEGREES, YEARS } from "@/lib/constants";

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
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Set up your profile
          </h1>
          <p className="text-muted-foreground">
            Tell us your details so we can show your timetable instantly
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Degree / Program</Label>
            <Select value={degree} onValueChange={setDegree}>
              <SelectTrigger>
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
            <Label className="text-foreground">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select your year" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Batch / Section</Label>
            <Select value={batch} onValueChange={setBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select your batch" />
              </SelectTrigger>
              <SelectContent>
                {["A", "B", "C", "D", "E", "F", "G", "H"].map((b) => (
                  <SelectItem key={b} value={b}>
                    Batch {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} className="w-full bg-primary hover:bg-teal-light text-primary-foreground teal-glow h-11" disabled={loading}>
            {loading ? "Saving..." : "Save & View Timetable"}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
