# 🤖 AI-Powered Resume Screening Agent

ResumeScreen is an end-to-end AI resume screening system built with:

- [n8n](https://n8n.io) for workflow automation
- [Lovable](https://lovable.dev) for the candidate-facing web app
- An LLM (Gemini / OpenAI / Groq) for resume–JD matching

It lets candidates upload a resume + job description and instantly returns a score, summary, strengths, gaps, and suggested next steps. HR can then choose to send interview or rejection emails automatically.

---

## ✨ Features

- 📥 Candidate web form (Lovable) with:
  - Full name, email
  - Job description text
  - Resume PDF upload
- ⚙️ n8n workflow that:
  - Extracts text from PDF resumes
  - Merges resume + JD + candidate metadata
  - Calls an AI Agent to score the candidate from 0–100
  - Returns structured JSON back to Lovable
- 📊 Structured output:
  - `overall_score`
  - `confidence`
  - `summary`
  - `strengths`
  - `matched_skills`
  - `years_relevant_experience`
  - `short_reason`
  - `recommended_next_steps`
- 📧 Optional: sends interview / rejection emails based on the AI verdict

---

## 🧱 Architecture

**Lovable app (ResumeScreen)**

1. Candidate submits:
   - `full_name`
   - `email`
   - `job_description`
   - `resume` (PDF, up to 8 MB)
2. Lovable POSTs this data (multipart/form-data) to an n8n **Webhook**.

**n8n workflow**

Nodes (simplified):

1. **Webhook – Lovable Integration**  
2. **Edit Fields2** – normalize incoming fields  
3. **Move Binary to Data** – prepare resume file  
4. **Extract Resume Text** – extract text from PDF  
5. **Merge** – combine resume text with form fields (Merge by Position)  
6. **Edit Fields** – final input object:
   - `resume_text`
   - `job_description`
   - `email`
   - `full_name`
7. **Resume Screening Agent (AI Agent node)**
   - Chat Model: OpenAI / Gemini / Groq
   - Prompt:

     ```
     JOB DESCRIPTION:
     {{ $json.job_description }}

     CANDIDATE RESUME:
     {{ $json.resume_text }}
     ```

   - Structured Output Parser schema:

     ```
     {
       "type": "object",
       "properties": {
         "overall_score": { "type": "number" },
         "confidence": { "type": "number" },
         "summary": { "type": "string" },
         "strengths": { "type": "array", "items": { "type": "string" } },
         "matched_skills": { "type": "array", "items": { "type": "string" } },
         "gaps": { "type": "array", "items": { "type": "string" } },
         "recommended_next_steps": {
           "type": "array",
           "items": { "type": "string" }
         },
         "years_relevant_experience": { "type": "number" },
         "recommendation": {
           "type": "string",
           "enum": ["interview", "reject"]
         },
         "short_reason": { "type": "string" }
       },
       "required": [
         "overall_score",
         "confidence",
         "summary",
         "strengths",
         "matched_skills",
         "gaps",
         "recommended_next_steps",
         "years_relevant_experience",
         "recommendation",
         "short_reason"
       ],
       "additionalProperties": false
     }
     ```

8. **Return AI Results to Lovable** – Webhook response:

