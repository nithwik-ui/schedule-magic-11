import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, Smartphone, Zap, UserCheck, RefreshCw } from "lucide-react";
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
    <div className="min-h-screen">
      {/* Hero */}
      <section className="hero-gradient min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-light rounded-full blur-[150px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <nav className="absolute top-0 left-0 right-0 flex items-center justify-between py-6 px-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold text-primary-foreground/90">
                SRU Schedule
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <Link to="/auth">
                <Button variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button className="bg-primary hover:bg-teal-light text-primary-foreground teal-glow">
                  Sign Up
                </Button>
              </Link>
            </motion.div>
          </nav>

          <div className="pt-32 pb-20 text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/20 text-teal-glow mb-6">
                ✨ A better way to check your timetable
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-primary-foreground leading-tight mb-6"
            >
              Your SR University{" "}
              <span className="text-gradient-teal">Timetable</span>
              <br />
              Reimagined
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-primary-foreground/60 mb-10 max-w-xl mx-auto"
            >
              No more re-entering your details every time. Beautiful, mobile-friendly, and always up to date.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/auth?tab=signup">
                <Button size="lg" className="bg-primary hover:bg-teal-light text-primary-foreground teal-glow px-8 text-lg h-12">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10 px-8 text-lg h-12">
                  I have an account
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
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
                className="glass rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
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
