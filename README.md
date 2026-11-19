# EduBridge — Study Abroad CRM + AI Adviser (live demo)

Interactive demo for a study-abroad consultancy. **All data is sample data** (university fees/requirements are rough sample figures). A demo by AI Digital Marketing.

- Landing page (EN / AR / UR, RTL) with consultation form (→ CRM + email via FormSubmit)
- WhatsApp-style **AI Adviser**: country → level → field → universities, eligibility check, fee details, talk to counsellor (creates a CRM enquiry)
- CRM: Dashboard, Enquiries (AI eligibility + WhatsApp follow-up draft, assign counsellor), Students, Applications (drag & drop), Counsellors, Universities, Courses, Follow-ups, Tasks, WhatsApp inbox, Reports (CSV), Settings
- Works without keys (rule-based replies); live AI with `GEMINI_API_KEY` (optional `GROQ_API_KEY`) in Vercel env vars. `/api/health` shows only true/false.
- Photos: Unsplash. Flags: flag-icons (MIT).

Local: `node tests/server.js` (PORT=4174) · tests: `node tests/smoke.js`
