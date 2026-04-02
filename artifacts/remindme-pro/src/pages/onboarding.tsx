import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterUser } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, Camera, RefreshCw } from "lucide-react";

export default function Onboarding() {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const registerMutation = useRegisterUser();

  const handleNext = () => {
    if (step === 1 && (!name || !email)) return;
    setStep((prev) => prev + 1);
  };

  const handleComplete = async () => {
    try {
      const uid = crypto.randomUUID();
      await registerMutation.mutateAsync({
        data: {
          uid,
          displayName: name,
          email
        }
      });
      
      login({ uid, displayName: name, email });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-primary mb-2">RemindMe Pro</h1>
          <p className="text-muted-foreground">Precision in every moment.</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium text-foreground">Welcome</h2>
                  <p className="text-sm text-muted-foreground">Enter your details to begin.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={handleNext} disabled={!name || !email}>
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium text-foreground">Permissions</h2>
                  <p className="text-sm text-muted-foreground">To function precisely, we need a few permissions.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Never miss an alarm or group message.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">Background Sync</p>
                      <p className="text-xs text-muted-foreground">Keep your data up to date, silently.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={handleComplete} disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Preparing..." : "Enter"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
