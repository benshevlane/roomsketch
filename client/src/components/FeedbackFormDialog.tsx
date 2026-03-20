import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackFormSchema, type FeedbackFormData } from "../../../shared/email-schemas";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
  { value: "praise", label: "Praise" },
] as const;

export default function FeedbackFormDialog({ open, onOpenChange }: FeedbackFormDialogProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { type: undefined, message: "", email: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSuccess(false);
      setServerError("");
    }
  }, [open, form]);

  async function onSubmit(data: FeedbackFormData) {
    setServerError("");
    try {
      await apiRequest("POST", "/api/feedback", data);
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear from you. Let us know how we can improve.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <p className="text-lg font-medium">Thanks for your feedback!</p>
            <p className="text-sm text-muted-foreground mt-1">We appreciate you taking the time to share your thoughts.</p>
            <Button className="mt-4" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Feedback Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Message</Label>
              <Textarea id="feedback-message" placeholder="Tell us what you think..." rows={4} {...form.register("message")} />
              {form.formState.errors.message && (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input id="feedback-email" type="email" placeholder="you@example.com" {...form.register("email")} />
              <p className="text-xs text-muted-foreground">Include if you'd like us to follow up with you.</p>
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
