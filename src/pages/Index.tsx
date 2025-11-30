import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

export default function Index() {
  const { startGuestSession } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleTryDemo = async () => {
    setIsLoading(true);
    try {
      console.log("Starting guest session...");
      await startGuestSession();
      console.log("Guest session started successfully");
      toast.success("Welcome! Loading your dashboard...");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error starting guest session:", error);
      toast.error("Failed to start demo. Trying again...");
      // Navigate anyway for graceful degradation
      setTimeout(() => navigate("/dashboard"), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12">
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Local Government at a Glance</h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Get involved and stay updated on your local government
            </p>
          </div>

          {/* Primary CTA */}
          <Button
            size="lg"
            className="text-base px-6 py-5 h-auto"
            onClick={handleTryDemo}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Get Started"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
