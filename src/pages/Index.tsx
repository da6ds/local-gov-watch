import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { startGuestSession } = useAuth();
  const navigate = useNavigate();

  const handleTryDemo = async () => {
    await startGuestSession();
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12">
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Local Government at a Glance
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Stay updated on legislation near you—or anywhere—and get news delivered weekly.
            </p>
          </div>

          {/* Primary CTA */}
          <Button 
            size="lg" 
            className="text-base px-6 py-5 h-auto"
            onClick={handleTryDemo}
          >
            Try Demo
          </Button>
        </div>
      </div>
    </Layout>
  );
}
