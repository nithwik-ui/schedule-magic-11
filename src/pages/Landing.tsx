import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Smartphone, Zap, UserCheck, RefreshCw, GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Calendar,
    title: "Beautiful Timetable",
    description: "View your weekly schedule in a clean, card-based layout that's easy to read.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Designed for your phone. Check your next class on the go, effortlessly.",
  },
  {
    icon: UserCheck,
    title: "Save Preferences",
    description: "Login once, set your degree, year & batch. Never re-enter them again.",
  },
  {
    icon: RefreshCw,
    title: "Auto Updates",
    description: "When the university updates the timetable, your view updates automatically.",
  },
  {
    icon: Clock,
    title: "Today's View",
    description: "See what's happening today at a glance with highlighted current classes.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant loading. No more waiting for the old portal to respond.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="min-h-screen flex items-center relative overflow-hidden bg-background">
        {/* Background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <nav className="absolute top-0 left-0 right-0 flex items-center justify-between py-6 px-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                SR University
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <Link to="/view">
                <Button variant="outline" className="text-foreground hover:bg-muted">Quick View</Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">My Schedule</Button>
              </Link>
            </motion.div>
          </nav>

          <div className="pt-32 pb-20 text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary mb-6">
                ✨ A better way to check your timetable
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6"
            >
              Your SR University{" "}
              <span className="text-primary">Timetable</span>
              <br />
              Reimagined
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto"
            >
              No more re-entering your details every time. Beautiful, mobile-friendly, and always up to date.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/view">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-8 text-lg h-12 gap-2 group">
                  Quick View
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why switch to SRU Schedule?
            </h2>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Everything the official portal should have been, and more.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            Built with ❤️ for SR University students. Not affiliated with SR University.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
