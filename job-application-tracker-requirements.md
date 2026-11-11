# Job Application Tracker — Requirements Document

Nov 4, 2026 · Julius

## Overview

A single-user web app that records every job application, tracks its stage, and reminds you of follow-ups and interviews, so no application gets lost.

**Goals**

- Keep every application in one place with its job description, contacts and notes.
- See at a glance what is waiting for a reply and what needs action today.

**Tech stack**

| Layer | Choice |
| --- | --- |
| Frontend | React |
| Backend | Laravel (REST API) |
| Database | Supabase (Postgres) |
| File storage | Supabase Storage (screenshots, CVs, cover letters) |
| Login | Single user, email and password |

**Malaysia defaults:** timezone Asia/Kuala_Lumpur, date format DD/MM/YYYY, and common local sources (JobStreet, LinkedIn, Hiredly, Indeed) pre-listed.

**Out of scope:** work mode, salary range and employment type are not tracked. Multi-user accounts and the job application agent are not part of v1.

## Features (v1)

**1. Application record**

| Field | Notes |
| --- | --- |
| Company | Auto-fill details after typing the name (see Company auto-fill) |
| Job title | Required |
| Job link | URL of the posting |
| Source | JobStreet, LinkedIn, Hiredly, Indeed, company site, referral, other |
| Date applied | Defaults to today |
| Location | City or area, default Kuala Lumpur |
| Job description | Pasted as text, because postings get taken down |
| Screenshot | Optional image of the posting |
| CV and cover letter used | Choose or upload the version you sent |
| Notes | Free text |

**2. Status pipeline**

Saved, Applied, Screening, Interview, Technical Test, Offer, then one final state: Accepted, Rejected, Ghosted or Withdrawn. Every status change is stored with its date, so you can see how long each stage took.

**3. Dashboard**

- Counts per status and a Kanban board where you drag cards between stages.
- Applications sent this week.
- Upcoming interviews and overdue follow-ups.

**4. Search, filter and sort**

Filter by status, source, date range and company. Search across company, title and notes.

**5. Follow-up reminders**

- Set a follow-up date on any application.
- Applications with no reply for 7 days or more are flagged automatically (the number of days is adjustable).
- A "today" list shows what needs action.

**6. Interview tracking**

Many interviews per application, each with date and time, type (HR, technical, final), interviewer, meeting link or location, prep notes and result notes.

**7. Contacts**

Recruiter or hiring manager name, email, phone and LinkedIn, linked to the application.

**8. Company auto-fill**

Type a company name and the website, industry, size and location are filled in for you to review and edit. Details are in the Company auto-fill section.

## Additions and later features

These are not required for v1. Build them after the core is working.

**Strong additions**

- **Duplicate check:** warns you if you already applied to the same company and role.
- **Analytics:** response rate, interview rate, and which source gives the most replies.
- **Tags:** for example "dream job" or "Laravel".

**Later**

- Email or Google Calendar integration for interviews.
- Browser extension to save a job posting in one click.
- Link to the job application agent project.

## Data model

Seven tables in Supabase (Postgres). Every table has an id, created_at and updated_at.

| Table | Key fields | Relationship |
| --- | --- | --- |
| companies | name, website, industry, size, location, logo_url | Has many applications |
| applications | company_id, job_title, job_url, source, date_applied, location, job_description, screenshot_path, status, follow_up_date, notes | Belongs to a company |
| status_history | application_id, from_status, to_status, changed_at | Many per application |
| interviews | application_id, interview_type, scheduled_at, interviewer, link_or_location, prep_notes, result_notes | Many per application |
| contacts | application_id, name, role, email, phone, linkedin_url | Many per application |
| documents | application_id, kind (cv or cover letter), file_name, file_path | Many per application |
| tags | name, linked to applications through a join table | Many to many (later) |

**Notes**

- Salary, work mode and employment type are intentionally not stored.
- Changing an application's status always writes a row to status_history.
- Screenshots and documents live in Supabase Storage; the tables keep only the file path.

## Screens and flows

| Screen | Purpose |
| --- | --- |
| Login | Single user sign-in |
| Dashboard | Status counts, this week's activity, upcoming interviews, overdue follow-ups |
| Applications list | Table with search, filters and sorting |
| Kanban board | Cards grouped by status, drag to change stage |
| Add or edit application | The form with company auto-fill, screenshot upload and documents |
| Application detail | All data in tabs: overview, interviews, contacts, status history, notes |
| Settings | Reminder days, source list |

**Main flows**

1. Add an application: type the company name, review the auto-filled details, fill the job fields, optionally upload a screenshot, save. The status starts at Applied (or Saved).
2. Change a status: drag the card on the Kanban board or use the dropdown on the detail screen. The change is logged with the date.
3. Schedule an interview: add it on the detail screen. It appears on the dashboard under upcoming interviews.
4. Daily check: open the dashboard and work through overdue follow-ups and today's interviews.

## Company auto-fill

The React form sends the company name to a Laravel endpoint, which asks an AI model (with web search if available) for company details and returns them for you to review before saving.

**How it works**

1. You type a company name in the form and pause for about half a second.
2. React calls `POST /api/companies/lookup` with the name.
3. Laravel first checks the companies table. If the company already exists, it returns the saved record.
4. If not, Laravel calls the AI API with a fixed prompt and asks for JSON: website, industry, size range, headquarters location.
5. React fills the fields and marks them as suggested. You edit anything wrong and save.
6. The saved company is reused for future applications, so each company is looked up once.

**Rules**

- The API key stays in Laravel and is never sent to the browser.
- Auto-filled values are suggestions only. A wrong guess must be easy to correct.
- If the lookup fails or finds nothing, the fields stay empty and you type them yourself.
- Small or local Malaysian companies may return little data, so manual entry must always work.
- The AI result is not used as proof that a company is real.

## Technical architecture

React talks only to the Laravel API. Laravel is the one place that reads and writes Supabase.

| Part | Role |
| --- | --- |
| React app | Screens, forms, Kanban drag and drop, calls the Laravel API |
| Laravel API | Validation, business rules (status history, reminders), auth, company lookup |
| Supabase Postgres | Stores all tables in the data model |
| Supabase Storage | Stores screenshots and documents, returned to React through signed links |
| AI API | Called from Laravel for company auto-fill |
| Laravel scheduler | Daily job that flags applications with no reply and prepares the reminder list |

**API groups:** auth, applications, companies (including lookup), interviews, contacts, documents, dashboard summary.

**Frontend libraries (suggested):** React Router for pages, TanStack Query for API data, a drag and drop library for the Kanban board, and a form library with validation.

**Security basics:** all routes require login, uploads are limited by file type and size, and the Supabase service key and AI key live only in Laravel's environment file.

## Build plan

Build in four phases. After phase 2 the app is already usable for daily tracking.

1. **Foundation:** set up Laravel, React and Supabase, create the tables, and add login.
2. **Core tracking:** application form and list, status pipeline with history, search and filters, screenshot upload.
3. **Detail, follow-up and interviews:** application detail page, reminders, interview tracking, contacts, documents, and the dashboard with the Kanban board.
4. **Company auto-fill and polish:** the AI lookup, validation, error handling and Malaysia locale checks.

The additions (duplicate check, analytics, tags) come after phase 4.
