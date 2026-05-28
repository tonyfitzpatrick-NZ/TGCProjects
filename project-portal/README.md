# Meridian Developments — Project Portal

A private collaboration platform for your in-house team, remote architectural documentation team, structural engineers, fire designers, and interior designers.

---

## What it does

- **Single login** — password-protected access for all parties
- **Project list** — searchable table of all projects with stage, progress, deadlines, team
- **Project detail** — per-project tabs for Files, Team, and Messages
- **Files** — upload files directly OR link to OneDrive/SharePoint files (DWG, IFC, PDF, XLSX, etc.)
- **Team & deadlines** — assign consultants, set deadlines, track overdue items
- **Messaging** — real-time project chat between all parties on a project
- **Stage tracking** — six-stage pipeline: Concept → Resource Consent → Developed Design → Costing → Building Consent → Construction
- **Role-based access** — Admins create projects; Project leads invite consultants; Consultants see only their projects

---

## Tech stack

| Layer | Tool | Cost |
|---|---|---|
| Frontend | React (hosted on Netlify) | Free |
| Auth + Database | Supabase | Free (up to 50,000 rows) |
| File storage | Supabase Storage | Free (up to 1GB) |
| OneDrive files | Linked via URL (no copy) | Free |

---

## Setup — step by step

### 1. Create a Supabase project (10 min)

1. Go to [supabase.com](https://supabase.com) → sign up (free) → New project
2. Choose a name (e.g. `meridian-portal`) and a strong database password
3. Wait ~2 minutes for it to spin up
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ…`)

### 2. Run the database schema

1. In Supabase, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Paste the entire contents and click **Run**
4. This creates all tables, security rules, and the file storage bucket

### 3. Add a helper function for user lookup

In Supabase SQL Editor, also run this:

```sql
create or replace function get_user_id_by_email(email_input text)
returns uuid
language plpgsql security definer
as $$
declare
  user_id uuid;
begin
  select id into user_id from auth.users where email = email_input;
  return user_id;
end;
$$;
```

### 4. Configure the app

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase URL and anon key:

```
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### 5. Run locally (optional)

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Netlify (10 min)

**Option A — via GitHub (recommended):**
1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → New site from Git → connect your repo
3. Build command: `npm run build`
4. Publish directory: `build`
5. Go to **Site settings → Environment variables** and add:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
6. Click **Deploy** — your site will be live at a `*.netlify.app` URL

**Option B — drag and drop:**
1. Run `npm run build` locally
2. Drag the `build/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Add environment variables in site settings and redeploy

---

## Creating the first admin account

1. In Supabase → **Authentication → Users** → **Invite user** (enter your email)
2. Check your email and set your password
3. In **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where id = (
     select id from auth.users where email = 'your@email.com'
   );
   ```
4. Log in to your portal — you now have full admin access

---

## Adding users

As admin, go to your Supabase dashboard → **Authentication → Users → Invite user**.

Enter the consultant's email. They'll receive an email with a link to set their password.

Then in the portal:
- **Admin or project lead** → open the project → Team tab → Add consultant
- Search by their email and assign their role type and deadline

---

## OneDrive integration

Files stay in OneDrive — the portal just links to them. When adding a file to a project:
1. In OneDrive/SharePoint, right-click the file → **Share** → set to "Anyone with the link can view"
2. Copy the link
3. In the portal → project → Files tab → **Add OneDrive link**
4. Paste the URL and label the file

For a whole project folder, add the folder URL in **Edit project → OneDrive folder URL** — it shows as a quick-access button on the files tab.

---

## Customising stages

Edit `src/lib/supabase.js` — the `STAGES` array:

```js
export const STAGES = [
  'Concept',
  'Resource Consent',
  'Developed Design',
  'Costing',
  'Building Consent',
  'Construction'
]
```

---

## Questions or issues?

- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- Netlify docs: [docs.netlify.com](https://docs.netlify.com)
