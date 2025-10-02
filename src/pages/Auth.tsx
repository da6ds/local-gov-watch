import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Authentication</h1>
          </div>
          
          <Card className="w-full p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="you@example.com"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input 
                    id="signin-password" 
                    type="password" 
                    placeholder="••••••••"
                    disabled
                  />
                </div>
                <Button className="w-full" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="Your name"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="you@example.com"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••"
                    disabled
                  />
                </div>
                <Button className="w-full" disabled>
                  <Mail className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                <strong className="text-foreground">Coming in V2:</strong> Full authentication with email/password, 
                profile management, and personalized features.
              </p>
            </div>
          </Card>

          <Button variant="ghost" className="gap-2" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
