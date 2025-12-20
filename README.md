# ResumeScreen – AI Resume Screening Agent

This project is a simple AI-powered resume screener built with **n8n** and **Lovable**.

Candidates upload a PDF resume and paste a job description. The system:

1. Extracts text from the resume.
2. Sends the resume + JD to an AI model.
3. Returns a score and summary.
4. (Optionally) sends interview or rejection emails.

---

## How it works

### 1. Lovable app

- Form fields:
  - Full Name
  - Email Address
  - Job Description (text area)
  - Resume (PDF upload)
- On submit, Lovable calls an **n8n Webhook** and waits for the JSON response.
- The Screening Results page shows:
  - Score
  - Confidence
  - Summary
  - Experience (years)
  - Matched skills
  - Recommended next steps

### 2. n8n workflow (high level)

1. **Webhook – Lovable Integration**  
2. **Move Binary to Data** – prepare resume file  
3. **Extract Resume Text** – get text from PDF  
4. **Merge + Edit Fields** – build a clean object with:
   - `resume_text`
   - `job_description`
   - `email`
   - `full_name`
5. **Resume Screening Agent (AI Agent node)**  
   - Uses a chat model (OpenAI / Gemini / Groq).  
   - Prompt includes the JD and the resume text.  
   - Structured output with fields like:
     - `overall_score`
     - `confidence`
     - `summary`
     - `strengths`
     - `matched_skills`
     - `years_relevant_experience`
     - `recommendation` (`interview` or `reject`)
     - `short_reason`
     - `recommended_next_steps`
6. **Return AI Results to Lovable**  
   - Responds with JSON:

     ```
     {
       "overall_score": 92,
       "verdict": "interview",
       "confidence": 94,
       "matched_skills": ["Developer Relations", "React", "Next.js"],
       "years_relevant_experience": 3,
       "short_reason": "Strong match for the role.",
       "recommended_next_steps": ["Invite for interview", "Share take-home task"]
     }
     ```

7. _(Optional)_ IF + Gmail nodes to send:
   - Interview email when `verdict = "interview"`.
   - Rejection email otherwise.

---

## Setup (quick)

1. Import the n8n workflow JSON from the `n8n/` folder.  
2. Set up your Chat Model credentials (OpenAI / Gemini / Groq) in n8n.  
3. Copy the Webhook URL into the Lovable form action.  
4. In Lovable, map the response fields (`overall_score`, `summary`, etc.) to the results UI.  

That’s it – submit a resume + JD in the app and you’ll get instant AI screening results.
