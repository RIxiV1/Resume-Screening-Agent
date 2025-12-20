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
  return `<h1>Congratulations, ${name}!</h1><p>You've been selected for an interview.</p><p><strong>Score:</strong> ${result.overall_score}/100</p><p>${result.short_reason}</p>`;
}

function generateRejectionEmail(name: string, result: ScreeningResult): string {
  return `<h1>Thank You, ${name}</h1><p>After review, we've decided to move forward with other candidates.</p><p>${result.short_reason}</p>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidateName, candidateEmail, result }: EmailRequest = await req.json();

    if (!candidateName || !candidateEmail || !result) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const isInterview = result.normalizedVerdict === 'Interview' || result.overall_score >= 70;
    const subject = isInterview ? `Great news! You've been selected for an interview` : `Application Status Update`;
    const htmlContent = isInterview ? generateInterviewEmail(candidateName, result) : generateRejectionEmail(candidateName, result);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "ResumeScreen <onboarding@resend.dev>", to: [candidateEmail], subject, html: htmlContent }),
    });

    const data = await res.json();
    console.log("Email sent:", data);

    return new Response(JSON.stringify({ success: true, emailType: isInterview ? 'interview' : 'rejection' }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
