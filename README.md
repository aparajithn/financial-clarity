# Financial Clarity

**Plain-English financial health dashboard for small businesses**

Financial Clarity solves the gap between "my accountant files taxes" and "I hire a $5k/month fractional CFO." Small business owners (solopreneurs to 15-employee companies) need to understand their financial health in plain English, not accounting jargon.

## 🎯 Problem

Small business owners have accountants who handle bookkeeping and tax filing, but they still don't understand their business's financial health:

- "Can I afford to hire?"
- "Should I raise prices?"
- "How long until I run out of cash?"
- "Where am I spending too much?"

**Compliance vs. Visibility are two different jobs.** Most accountants are hired for compliance (tax filing, making sure you don't get in trouble with the IRS). They're NOT thinking:

- "Your burn rate means you have 4 months of runway at this pace"
- "If you hire in Q3, here's what that does to your margins"
- "You're leaking cash in these 3 areas"

That's a **fractional CFO mindset** — but fractional CFOs cost $3-5k+/month, which is too expensive for most SMBs.

## ✨ Solution

Financial Clarity connects to your QuickBooks or Xero account and automatically translates your numbers into plain-English insights:

- **"You have 8 months of cash runway"** (not "Your burn rate is $X/month")
- **"If you hire, your runway drops to 5 months"** (not complex spreadsheet scenarios)
- **"You're spending $450/mo on unused software"** (not generic expense reports)

## 🚀 Features

### Core Features
- ✅ **QuickBooks OAuth integration** - Real OAuth 2.0 flow with token management
- ✅ **Xero OAuth integration** - Real OAuth 2.0 flow with multi-tenant support
- ✅ **OpenAI GPT-4o insights** - Plain-English financial explanations
- ✅ **Cash Runway Calculator** - "How long until I run out of cash?"
- ✅ **Burn Rate Analysis** - "How much am I spending vs. making?"
- ✅ **Profit Margin Insights** - "What % of revenue do I keep?"
- ✅ **Hiring Impact Simulator** - "Can I afford to hire?"
- ✅ **Custom Questions** - Ask any financial question, get plain-English answers

### Technical Features
- ✅ Next.js 15 (App Router, Server Components, Server Actions)
- ✅ Supabase (PostgreSQL database + Authentication)
- ✅ shadcn/ui + Tailwind CSS (Clean, modern UI)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Real OAuth flows (not demo/placeholder code)
- ✅ Token refresh handling for QuickBooks and Xero
- ✅ Financial data caching (to avoid API rate limits)

## 📦 Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (serverless)
- **Database:** Supabase (PostgreSQL with RLS)
- **Authentication:** Supabase Auth
- **Integrations:**
  - QuickBooks Online API (OAuth 2.0, financial data)
  - Xero API (OAuth 2.0, multi-tenant)
  - OpenAI GPT-4o (plain-English insights)
- **Deployment:** Vercel (frontend + API routes)

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- QuickBooks Developer account (sandbox for testing)
- Xero Developer account (demo organization for testing)
- OpenAI API key
- Vercel account (for deployment)

### 2. Clone the Repository

```bash
git clone https://github.com/aparajithn/financial-clarity.git
cd financial-clarity
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the SQL schema in the Supabase SQL Editor:
   - Copy the contents of `supabase-schema.sql`
   - Paste into Supabase SQL Editor
   - Run the query
3. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy `URL` and `anon` key
   - Copy `service_role` key (keep this secret!)

### 4. Set Up QuickBooks OAuth

1. Go to https://developer.intuit.com/
2. Create a new app
3. Get Client ID and Client Secret
4. Set redirect URI: `http://localhost:3000/api/quickbooks/callback`
5. Enable scopes: `com.intuit.quickbooks.accounting`

### 5. Set Up Xero OAuth

1. Go to https://developer.xero.com/
2. Create a new app (OAuth 2.0)
3. Get Client ID and Client Secret
4. Set redirect URI: `http://localhost:3000/api/xero/callback`
5. Enable scopes:
   - `offline_access`
   - `accounting.transactions.read`
   - `accounting.reports.read`
   - `accounting.settings.read`

### 6. Set Up OpenAI

1. Go to https://platform.openai.com/
2. Create API key
3. Make sure you have GPT-4o access

### 7. Configure Environment Variables

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox

# Xero OAuth
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:3000/api/xero/callback

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

### 9. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- Project Settings → Environment Variables
- Add all variables from `.env.local`
- Update redirect URIs to your production URL

## 📁 Project Structure

```
financial-clarity/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── login/                   # Login page
│   ├── signup/                  # Signup page
│   ├── dashboard/               # Main dashboard
│   └── api/
│       ├── quickbooks/
│       │   ├── authorize/       # OAuth start
│       │   └── callback/        # OAuth callback
│       ├── xero/
│       │   ├── authorize/       # OAuth start
│       │   └── callback/        # OAuth callback
│       └── insights/
│           └── generate/        # Generate insights
├── components/
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   ├── quickbooks.ts            # QuickBooks API client
│   ├── xero.ts                  # Xero API client
│   └── openai.ts                # OpenAI insights generator
├── supabase-schema.sql          # Database schema
├── .env.example                 # Environment variables template
└── README.md
```

## 🔐 Security

- **Row Level Security (RLS)** enabled on all Supabase tables
- **OAuth tokens** stored encrypted in database
- **CSRF protection** via state parameter in OAuth flows
- **Service role key** never exposed to frontend
- **HTTP-only cookies** for session management
- **No hardcoded secrets** in code

## 🧪 Testing

### Test with QuickBooks Sandbox

1. Create a sandbox company in QuickBooks Developer portal
2. Add sample data (revenue, expenses, bank accounts)
3. Connect via OAuth
4. Generate insights

### Test with Xero Demo

1. Create a demo organization in Xero Developer portal
2. Add sample data
3. Connect via OAuth
4. Generate insights

## 📊 Data Model

### Tables

**users**
- Extends Supabase auth.users
- Stores profile information

**connections**
- OAuth tokens for QuickBooks/Xero
- One connection per provider per user

**financial_snapshots**
- Cached financial data
- Reduces API calls, improves performance

**insights**
- AI-generated plain-English explanations
- Links to user and data snapshot

## 🎨 UI/UX

- **Clean, modern design** using shadcn/ui + Tailwind
- **Mobile-responsive** (works on phone, tablet, desktop)
- **Accessible** (proper ARIA labels, keyboard navigation)
- **Fast** (Server Components, optimized images)
- **Simple** (no jargon, clear CTAs, minimal clicks)

## 🚦 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/quickbooks/authorize` | GET | Start QuickBooks OAuth flow |
| `/api/quickbooks/callback` | GET | QuickBooks OAuth callback |
| `/api/xero/authorize` | GET | Start Xero OAuth flow |
| `/api/xero/callback` | GET | Xero OAuth callback |
| `/api/insights/generate` | POST | Generate financial insights |

## 📈 Roadmap

### Phase 1 (MVP - Done)
- [x] QuickBooks integration
- [x] Xero integration
- [x] OpenAI insights (cash runway, burn rate, profit margin)
- [x] Basic dashboard
- [x] Custom questions

### Phase 2 (Next)
- [ ] Cash leak detection (unused subscriptions)
- [ ] Industry benchmarks (compare to similar businesses)
- [ ] Monthly email reports
- [ ] Pricing simulator (what if I raise prices?)
- [ ] Multi-user support (team access)

### Phase 3 (Future)
- [ ] Forecasting (3-6 month projections)
- [ ] Accountant collaboration (share reports)
- [ ] Mobile app (iOS/Android)
- [ ] Slack/email notifications
- [ ] API for third-party integrations

## 💰 Monetization Strategy

### Pricing Tiers (Planned)

- **Free:** 1 connection, 3 insights/month
- **Pro ($49/mo):** Unlimited insights, both QB + Xero, custom questions
- **Team ($99/mo):** Multi-user, export reports, accountant sharing

### Target Market

- **Primary:** Solopreneurs to 15-employee companies
- **Revenue:** $200k-$2M/year
- **Already paying:** $200-500/mo for bookkeeping
- **Willingness to pay:** $50-150/mo for financial clarity

## 🤝 Contributing

This is a real B2B SaaS product. Contributions welcome!

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- **Problem validation:** Reddit /r/smallbusiness, Hacker News
- **Design inspiration:** Puzzle, Runway, QuickBooks
- **Tech stack:** Next.js, Supabase, shadcn/ui communities

## 📞 Support

- **Email:** support@financialclarity.app (not active yet)
- **GitHub Issues:** https://github.com/aparajithn/financial-clarity/issues
- **Documentation:** This README

---

**Built by Aparajith N** | [GitHub](https://github.com/aparajithn) | 2026

*Solving the gap between "my accountant files taxes" and "I hire a fractional CFO."*
