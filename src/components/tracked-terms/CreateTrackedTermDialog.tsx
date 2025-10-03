import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { LocationSelector } from "@/components/LocationSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { createTrackedTerm } from "@/lib/trackedTermStorage";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  keywords: z.array(z.string()).min(1, "Add at least one keyword").max(50),
  jurisdictions: z.array(z.string()).min(1, "Select at least one location"),
  alertEnabled: z.boolean().default(true),
});

interface CreateTrackedTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTrackedTermDialog({
  open,
  onOpenChange,
}: CreateTrackedTermDialogProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      keywords: [],
      jurisdictions: [],
      alertEnabled: true,
    },
  });

  const keywords = form.watch("keywords");

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;

    const currentKeywords = form.getValues("keywords");
    if (currentKeywords.includes(trimmed)) {
      toast.error("Keyword already added");
      return;
    }

    if (currentKeywords.length >= 50) {
      toast.error("Maximum 50 keywords allowed");
      return;
    }

    form.setValue("keywords", [...currentKeywords, trimmed]);
    setKeywordInput("");
  };

  const handleRemoveKeyword = (keyword: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue(
      "keywords",
      currentKeywords.filter((k) => k !== keyword)
    );
  };

  const handleKeywordInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handlePasteKeywords = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData("text");
    const keywords = pastedText
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k.length <= 50);

    if (keywords.length > 0) {
      e.preventDefault();
      const currentKeywords = form.getValues("keywords");
      const newKeywords = [...new Set([...currentKeywords, ...keywords])].slice(
        0,
        50
      );
      form.setValue("keywords", newKeywords);
      setKeywordInput("");
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTrackedTerm({
      name: values.name,
      keywords: values.keywords,
      jurisdictions: values.jurisdictions,
      active: true,
      alertEnabled: values.alertEnabled,
    });

    toast.success("Tracked term created");
    queryClient.invalidateQueries({ queryKey: ["tracked-terms-session"] });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tracked Term</DialogTitle>
          <DialogDescription>
            Monitor specific keywords across legislation and meetings
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name this tracked term</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bay Area Biomedical Development"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Give it a descriptive name so you remember what it's tracking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords */}
            <FormField
              control={form.control}
              name="keywords"
              render={() => (
                <FormItem>
                  <FormLabel>What keywords should we monitor?</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type keyword and press Enter"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={handleKeywordInputKeyDown}
                          onPaste={handlePasteKeywords}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
                        >
                          Add
                        </Button>
                      </div>
                      {keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                          {keywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="gap-1"
                            >
                              {keyword}
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(keyword)}
                                className="ml-1 hover:bg-background rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Example: affordable housing, rent control, inclusionary zoning
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Locations */}
            <FormField
              control={form.control}
              name="jurisdictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Which locations should we monitor?</FormLabel>
                  <FormControl>
                    <LocationSelector
                      value={field.value}
                      onChange={field.onChange}
                      maxSelections={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alert Preference */}
            <FormField
              control={form.control}
              name="alertEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Send me email alerts when new matches are found
                    </FormLabel>
                    <FormDescription>
                      You can change this later in Alert Settings
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Tracked Term</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
