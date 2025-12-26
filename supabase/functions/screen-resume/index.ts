import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_URL = "https://suhaibbb.app.n8n.cloud/webhook/screen-resume";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 submissions per IP per hour

interface ScreeningResult {
  overall_score: number;
  verdict: "Interview" | "Hold" | "Reject";
  confidence: number;
  matched_skills: string[];
  years_relevant_experience: number;
  short_reason: string;
  recommended_next_steps: string;
  calendar_link?: string;
  email_draft?: string;
}

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first IP
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a hash of user-agent + accept-language for some uniqueness
  const userAgent = req.headers.get("user-agent") || "";
  const acceptLang = req.headers.get("accept-language") || "";
  return `unknown-${hashString(userAgent + acceptLang)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);
  
  // Clean up old entries
  if (entry && (now - entry.firstRequest) > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(clientIP);
  }
  
  const currentEntry = rateLimitStore.get(clientIP);
  
  if (!currentEntry) {
    // First request from this IP
    rateLimitStore.set(clientIP, { count: 1, firstRequest: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - currentEntry.firstRequest)) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }
  
  // Increment count
  currentEntry.count++;
  rateLimitStore.set(clientIP, currentEntry);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - currentEntry.count };
}

async function tryN8nWebhook(formData: FormData): Promise<ScreeningResult | null> {
  console.log("Attempting n8n webhook...");
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("n8n webhook error:", response.status, await response.text());
      return null;
    }

    const result = await response.json();
    console.log("n8n response received");
    
    // Validate the response has required fields
    if (
      typeof result.overall_score === "number" &&
      typeof result.verdict === "string" &&
      typeof result.confidence === "number" &&
      Array.isArray(result.matched_skills) &&
      typeof result.years_relevant_experience === "number" &&
      typeof result.short_reason === "string" &&
      typeof result.recommended_next_steps === "string"
    ) {
      return result as ScreeningResult;
    }

    console.log("n8n response missing required fields, falling back to AI");
    return null;
  } catch (error) {
    console.error("n8n webhook failed:", error);
    return null;
  }
}

async function analyzeWithAI(
  fullName: string,
  email: string,
  jobDescription: string,
  resumeText: string
): Promise<ScreeningResult> {
  console.log("Analyzing with Lovable AI...");
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const systemPrompt = `You are an expert HR recruiter and resume screening specialist. Your task is to analyze resumes against job descriptions and provide structured assessments.

When analyzing, consider:
- Skills match (technical and soft skills)
- Years of relevant experience
- Education and certifications
- Career progression
- Red flags (gaps, job hopping, etc.)

Be fair, objective, and focus on job-relevant qualifications.`;

  const userPrompt = `Analyze this candidate's resume against the job description.

CANDIDATE: ${fullName} (${email})

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeText}

Provide your analysis using the suggest_screening_result function.`;

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_screening_result",
            description: "Return structured resume screening results",
            parameters: {
              type: "object",
              properties: {
                overall_score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "Overall match score from 0-100",
                },
                verdict: {
                  type: "string",
                  enum: ["Interview", "Hold", "Reject"],
                  description: "Recommended action",
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Confidence level from 0 to 1",
                },
                matched_skills: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of skills that match the job requirements",
                },
                years_relevant_experience: {
                  type: "number",
                  description: "Estimated years of relevant experience",
                },
                short_reason: {
                  type: "string",
                  description: "Brief explanation of the assessment (2-3 sentences)",
                },
                recommended_next_steps: {
                  type: "string",
                  description: "Suggested next steps for this candidate",
                },
                calendar_link: {
                  type: "string",
                  description: "Simulated calendar booking link for interview",
                },
                email_draft: {
                  type: "string",
                  description: "Draft email to send to the candidate based on the verdict",
                },
              },
              required: [
                "overall_score",
                "verdict",
                "confidence",
                "matched_skills",
                "years_relevant_experience",
                "short_reason",
                "recommended_next_steps",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_screening_result" } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI gateway error:", response.status);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a few moments.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    throw new Error("AI analysis failed");
  }

  const aiResponse = await response.json();
  console.log("AI response received");

  // Extract the tool call result
  const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== "suggest_screening_result") {
    throw new Error("AI returned unexpected response format");
  }

  const result = JSON.parse(toolCall.function.arguments);
  
  // Add simulated calendar link and email draft if not present
  if (!result.calendar_link && result.verdict === "Interview") {
    result.calendar_link = `https://calendly.com/interview/${fullName.toLowerCase().replace(/\s+/g, "-")}`;
  }
  
  if (!result.email_draft) {
    result.email_draft = generateEmailDraft(fullName, email, result.verdict, result.short_reason);
  }

  return result as ScreeningResult;
}

function generateEmailDraft(
  fullName: string,
  email: string,
  verdict: string,
  reason: string
): string {
  const firstName = fullName.split(" ")[0];
  
  if (verdict === "Interview") {
    return `Dear ${firstName},

Thank you for your application. We were impressed with your qualifications and would like to invite you for an interview.

${reason}

Please use the calendar link provided to schedule a time that works for you.

Best regards,
Hiring Team`;
  } else if (verdict === "Hold") {
    return `Dear ${firstName},

Thank you for your application. Your profile is currently under review, and we will be in touch soon with an update.

Best regards,
Hiring Team`;
  } else {
    return `Dear ${firstName},

Thank you for taking the time to apply. After careful consideration, we have decided to move forward with other candidates whose experience more closely aligns with our current needs.

We encourage you to apply for future opportunities that match your qualifications.

Best regards,
Hiring Team`;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log("Request from IP:", clientIP.substring(0, 10) + "...");
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for IP:", clientIP.substring(0, 10) + "...");
      return new Response(
        JSON.stringify({ 
          error: "Too many submissions. Please try again later.",
          retryAfter: rateLimit.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter)
          } 
        }
      );
    }
    
    const contentType = req.headers.get("content-type") || "";
    
    let fullName: string;
    let email: string;
    let jobDescription: string;
    let resumeFile: File | null = null;
    let resumeText = "";

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data (file upload)
      const formData = await req.formData();
      
      // Honeypot check - if hidden field is filled, it's a bot
      const honeypot = formData.get("website") as string || "";
      if (honeypot) {
        console.log("Honeypot triggered - bot detected");
        // Return fake success to not reveal detection
        return new Response(
          JSON.stringify({ 
            overall_score: 0, 
            verdict: "Hold",
            confidence: 0,
            matched_skills: [],
            years_relevant_experience: 0,
            short_reason: "Application received and under review.",
            recommended_next_steps: "We will contact you if there's a match."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      fullName = formData.get("Full Name") as string || "";
      email = formData.get("Email Address") as string || "";
      jobDescription = formData.get("job_description") as string || "";
      resumeFile = formData.get("Resume_PDF_only_") as File | null;

      console.log("Received submission from:", email.substring(0, 3) + "***");

      // Input validation
      if (!fullName || !email || !jobDescription) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: Full Name, Email Address, or job_description" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email address format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate input lengths to prevent abuse
      if (fullName.length > 200 || email.length > 320 || jobDescription.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Input exceeds maximum allowed length" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!resumeFile) {
        return new Response(
          JSON.stringify({ error: "Please upload a PDF resume" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate file size (max 10MB)
      if (resumeFile.size > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: "Resume file too large. Maximum size is 10MB." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Try n8n webhook first with original FormData
      const n8nFormData = new FormData();
      n8nFormData.append("Resume_PDF_only_", resumeFile);
      n8nFormData.append("Email Address", email);
      n8nFormData.append("Full Name", fullName);
      n8nFormData.append("job_description", jobDescription);

      const n8nResult = await tryN8nWebhook(n8nFormData);
      
      if (n8nResult) {
        console.log("Successfully got result from n8n");
        return new Response(JSON.stringify(n8nResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback to AI analysis
      // Extract text from PDF (basic extraction - reads as text)
      try {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder("utf-8", { fatal: false });
        resumeText = decoder.decode(uint8Array);
        
        // Clean up PDF binary content - extract readable text
        resumeText = resumeText
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        
        // If text is too short, it's likely binary PDF
        if (resumeText.length < 100) {
          resumeText = `[PDF Resume uploaded: ${resumeFile.name}, Size: ${resumeFile.size} bytes. Unable to extract text - please ensure the PDF contains searchable text, not just images.]`;
        }
      } catch (e) {
        console.error("PDF text extraction failed");
        resumeText = `[PDF Resume: ${resumeFile.name}]`;
      }

    } else {
      // Handle JSON body
      const body = await req.json();
      fullName = body.fullName || body["Full Name"] || "";
      email = body.email || body["Email Address"] || "";
      jobDescription = body.jobDescription || body.job_description || "";
      resumeText = body.resumeText || "";

      if (!fullName || !email || !jobDescription) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email address format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Validate input lengths
      if (fullName.length > 200 || email.length > 320 || jobDescription.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Input exceeds maximum allowed length" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use AI fallback
    console.log("Using AI fallback for resume analysis");
    const aiResult = await analyzeWithAI(fullName, email, jobDescription, resumeText);

    return new Response(JSON.stringify(aiResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Screen resume error:", error instanceof Error ? error.message : "Unknown error");
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    // Map specific errors to user-friendly messages
    let userMessage = "An error occurred processing your submission.";
    if (errorMessage.includes("Rate limit")) {
      userMessage = "Temporary processing error — please try again in a few moments.";
    } else if (errorMessage.includes("credits")) {
      userMessage = "Service temporarily unavailable. Please try again later.";
    }

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});