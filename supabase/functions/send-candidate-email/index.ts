import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScreeningResult {
  overall_score: number;
  verdict: string;
  normalizedVerdict: 'Interview' | 'Hold' | 'Reject' | 'Unknown';
  short_reason: string;
  recommended_next_steps: string[];
}

interface EmailRequest {
  candidateName: string;
  candidateEmail: string;
  result: ScreeningResult;
}

function generateInterviewEmail(name: string, result: ScreeningResult): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10b981;">Congratulations, ${name}!</h1>
      <p>We're excited to inform you that you've been selected to move forward in our hiring process.</p>
      <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Your Score:</strong> ${result.overall_score}/100</p>
        <p><strong>Assessment:</strong> ${result.short_reason}</p>
      </div>
      <h3>Next Steps:</h3>
      <ul>
        ${result.recommended_next_steps.map(step => `<li>${step}</li>`).join('')}
      </ul>
      <p>We'll be in touch soon with more details about the interview process.</p>
      <p>Best regards,<br>The Hiring Team</p>
    </div>
  `;
}

function generateRejectionEmail(name: string, result: ScreeningResult): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6b7280;">Thank You, ${name}</h1>
      <p>We appreciate your interest in joining our team and the time you invested in your application.</p>
      <p>After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs.</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Feedback:</strong> ${result.short_reason}</p>
      </div>
      ${result.recommended_next_steps.length > 0 ? `
        <h3>Suggestions for Future Applications:</h3>
        <ul>
          ${result.recommended_next_steps.map(step => `<li>${step}</li>`).join('')}
        </ul>
      ` : ''}
      <p>We encourage you to apply again in the future as new opportunities arise.</p>
      <p>Best wishes,<br>The Hiring Team</p>
    </div>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Resend is configured
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured - email sending is disabled");
      return new Response(
        JSON.stringify({ 
          success: true, 
          skipped: true, 
          message: "Email sending is disabled (no RESEND_API_KEY configured)" 
        }), 
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { candidateName, candidateEmail, result }: EmailRequest = await req.json();

    if (!candidateName || !candidateEmail || !result) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const isInterview = result.normalizedVerdict === 'Interview' || result.overall_score >= 70;
    const subject = isInterview 
      ? `Great news! You've been selected for an interview` 
      : `Application Status Update`;
    const htmlContent = isInterview 
      ? generateInterviewEmail(candidateName, result) 
      : generateRejectionEmail(candidateName, result);

    console.log(`Sending ${isInterview ? 'interview' : 'rejection'} email to ${candidateEmail}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${RESEND_API_KEY}` 
      },
      body: JSON.stringify({ 
        from: "ResumeScreen <onboarding@resend.dev>", 
        to: [candidateEmail], 
        subject, 
        html: htmlContent 
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }), 
        { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, emailType: isInterview ? 'interview' : 'rejection', emailId: data.id }), 
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-candidate-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
