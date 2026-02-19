import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, LogIn, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Check your email!",
          description: "We've sent you a verification link. Please verify your email to continue.",
        });
      }
    }
    setLoading(false);
  };

  if (isLogin) {
    // Login view - centered glass card
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px] z-10"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary p-3 rounded-xl mb-4 shadow-lg shadow-primary/20">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SR University</h1>
            <p className="text-muted-foreground text-sm font-medium">Academic Portal</p>
          </div>

          {/* Auth Card */}
          <div className="bg-card rounded-xl p-8 shadow-2xl border border-border">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Please enter your details to access the portal.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@sr-university.edu"
                    className="pl-12 py-6 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 pr-12 py-6 bg-background border-border"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <LogIn className="w-5 h-5" />}
              </Button>
            </form>
          </div>

          <p className="text-center mt-8 text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => setIsLogin(false)} className="text-primary font-bold hover:underline transition-all">
              Join the community
            </button>
          </p>

          <div className="flex justify-center gap-6 mt-12 text-xs text-muted-foreground font-medium">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Help Center</span>
          </div>
        </motion.div>

        <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      </div>
    );
  }

  // Signup view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10 lg:px-20 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center text-primary-foreground">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-foreground text-lg font-bold tracking-tight">SR University</h2>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Portal Home
          </Link>
          <div className="h-4 w-[1px] bg-border" />
          <button onClick={() => setIsLogin(true)} className="text-sm font-semibold text-primary">Login</button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[480px] flex flex-col gap-8"
        >
          <div className="text-center md:text-left">
            <h1 className="text-foreground text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
              Create Your Account
            </h1>
            <p className="text-muted-foreground text-base">
              Welcome to the SRU Academic Portal. Please enter your details to get started.
            </p>
          </div>

          <div className="bg-card p-6 md:p-10 rounded-xl shadow-xl border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Johnathan Doe"
                    className="pl-11 py-5 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">University Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@sru.edu"
                    className="pl-11 py-5 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-11 pr-12 py-5 bg-background border-border"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 italic">
                  Must be at least 6 characters.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg shadow-lg shadow-primary/20 transition-all gap-2 group mt-4"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-medium">Agreement</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => setIsLogin(true)} className="text-primary font-bold hover:underline ml-1">
                Log In
              </button>
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>© 2024 SR University. All rights reserved.</p>
        </div>
      </footer>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-full overflow-hidden opacity-20 pointer-events-none hidden lg:block">
        <div className="absolute top-[-10%] right-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-primary/30 to-transparent blur-3xl rounded-full" />
      </div>
    </div>
  );
};

export default Auth;
