import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuestRunUpdateResponse {
  job_id: string;
  startedAt: string;
  previousLastRunAt: string | null;
  estimatedDuration: number;
}

export function useGuestRunUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scope, sessionId }: { scope: string; sessionId?: string }): Promise<GuestRunUpdateResponse> => {
      const { data, error } = await supabase.functions.invoke('guest-run-update', {
        body: { scope, sessionId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Don't invalidate immediately - let polling handle it
      console.log('Guest run update initiated');
    }
  });
}
