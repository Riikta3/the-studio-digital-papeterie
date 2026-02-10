import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

// Initialize Resend with API Key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender address (update with your verified domain)
const DEFAULT_SENDER = "Acme <onboarding@resend.dev>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  campaignId?: string; // Optional: Link to a campaign
  householdId?: string; // Optional: Link to a household
}

export async function sendEmail({
  to,
  subject,
  html,
  campaignId,
  householdId,
}: SendEmailParams) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(
      "Unauthorized: Must be logged in to send emails via this service.",
    );
  }

  try {
    // 1. Send Email via Resend
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [to],
      subject: subject,
      html: html,
    });

    if (resendError) {
      console.error("Resend API Error:", resendError);

      // Log failure to DB
      await logEmailAttempt({
        supabase,
        weddingId: user.id,
        recipient: to,
        status: "failed",
        error: resendError.message,
        campaignId,
        householdId,
      });

      return { success: false, error: resendError.message };
    }

    // 2. Log Success to DB
    await logEmailAttempt({
      supabase,
      weddingId: user.id,
      recipient: to, // Emails are sent one by one usually in this wrapper
      status: "queued", // Resend queues it initially
      providerId: resendData?.id,
      campaignId,
      householdId,
    });

    return { success: true, messageId: resendData?.id };
  } catch (error: any) {
    console.error("Internal Email Service Error:", error);
    return { success: false, error: error.message };
  }
}

// Helper to log to Supabase
async function logEmailAttempt({
  supabase,
  weddingId,
  recipient,
  status,
  providerId,
  error,
  campaignId,
  householdId,
}: {
  supabase: any;
  weddingId: string;
  recipient: string;
  status: "queued" | "sent" | "failed";
  providerId?: string;
  error?: string;
  campaignId?: string;
  householdId?: string;
}) {
  await supabase.from("email_logs").insert({
    wedding_id: weddingId,
    recipient_email: recipient,
    status: status,
    provider_id: providerId,
    error_message: error,
    campaign_id: campaignId,
    household_id: householdId,
  });
}
