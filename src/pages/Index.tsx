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
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Local Government at a Glance
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Stay updated on legislation near you—or anywhere—and get news delivered weekly.
            </p>
          </div>

          {/* Primary CTA */}
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 h-auto"
            onClick={handleTryDemo}
          >
            Try Demo
          </Button>
        </div>
      </div>
    </Layout>
  );
}
