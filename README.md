# ClearCash

ClearCash is a mobile-first personal finance tracker that connects everyday income, spending, recurring subscriptions and savings goals to understandable analytics. It uses manual entry; it does not connect to banks or move money. Amounts are displayed in INR.

## Features

- JWT signup/login and a private account for each user.
- Home: safe-to-spend budget with Salary / Fixed Out / Left pills, separate waste and days-left cards, cash flow, debit reminder modals, and transaction CRUD.
- Subscriptions: add/edit/delete, active/unused filters, and monthly equivalents of unused subscriptions.
- Insights: cash flow, current-month spending mix, unusual expenses, category trends, weighted financial health points, a preference-controlled Weekly Digest, and savings-goal CRUD.
- Profile: salary, fixed commitments and working notification preferences. Due-date alerts control due-soon results and the bell badge; unusual-spending alerts control anomalies; Weekly Summary controls the on-screen Weekly Digest. Scheduled email delivery and bank sync are not implemented.
- Consistent loading skeletons, actionable empty states, inline API errors, session-expiry feedback and client-side form validation.

## Stack

React 19, Vite, Tailwind CSS, React Router, Axios and Recharts; Node.js, Express, MongoDB/Mongoose, bcrypt and JWT. Backend tests use Node's built-in test runner.

## Analytics differentiator

The implementation is in server/utils/analyticsEngine.js and server/controllers/analyticsController.js:

- **Anomalies:** groups expenses by category, requires at least three records, and flags amounts greater than the category mean plus two population standard deviations. The mean includes the candidate expense. This is a transparent statistical heuristic, not machine learning or fraud detection.
- **Trends:** compares the current calendar month's category total with the average of the preceding three calendar months, including zero-spend months. Changes within 5% are stable. A nonzero total with a zero baseline is reported as +100%. A partial current month can make the comparison look lower.
- **Health score:** 40% savings rate, 30% inverse subscription waste, and 30% inverse spending volatility. Each input is clamped to 0?100%. Savings rate is (income - expenses) / income; volatility is the standard deviation divided by the mean of daily expense totals on days with spending. The API uses the previous three months plus the current month; waste is the monthly equivalent of unused subscriptions divided by total expenses in that window. New users see guidance instead of an unsupported score.
- **Daily budget:** (salary - fixed commitments - this month's recorded expenses) / remaining calendar days, including today. Avoid recording the same cost both as a fixed commitment and as a transaction. The demo records rent as a transaction and sets fixed commitments to zero.

These are descriptive budgeting indicators, not financial advice.

## Local setup

Use Node.js 22.12+ (or a supported newer LTS) and a local MongoDB instance or Atlas connection string.

### Backend

Run from server/:

~~~sh
npm ci
cp .env.example .env
npm run dev
~~~

On PowerShell use Copy-Item .env.example .env instead of cp if needed. Set MONGO_URI and a long random JWT_SECRET. PORT defaults to 5000. Set CORS_ORIGIN to the exact frontend origin, such as http://localhost:5173; multiple trusted origins may be comma-separated without trailing slashes. MONGODB_URI remains accepted as a legacy fallback, but use MONGO_URI for new setups. Never commit .env or real credentials.

GET /health (also /api/health) returns HTTP 200 once the server is running. The process connects to MongoDB before listening; the health route is a simple liveness check, not an ongoing database-readiness check.

### Frontend

In another terminal, run from client/:

~~~sh
npm ci
cp .env.example .env
npm run dev
~~~

VITE_API_BASE_URL is the backend origin, for example http://localhost:5000, without /api. The client appends API paths. If unset, requests use the current origin; there is no production localhost fallback. Vite embeds this setting at build time, so rebuild after changing it.

### Demo data

Run from server/:

~~~sh
npm run seed -- --dry-run
npm run seed
~~~

The dry run validates every record using the Mongoose schemas without connecting to MongoDB. The normal run creates around 90 days of synthetic, clearly marked demo transactions across salary, groceries, dining, transport, housing and other categories, four active/unused subscriptions, and two goals. A celebration dinner demonstrates anomaly detection.

Default demo login: demo@clearcash.example / ClearCashDemo123!
Override with DEMO_EMAIL and DEMO_PASSWORD. The script hashes the password, only inserts missing demo rows, never deletes existing data, and refuses to use an unrelated existing account. Re-running on the same day does not duplicate rows; later runs add missing recent history without overwriting edits or removing older history. Existing subscription due dates are preserved. Run against a dedicated demo database for interviews.

## Checks

~~~sh
cd server
npm test
node --check server.js
node seed.js --dry-run
cd ../client
npm test
npm run lint
npm run build
npm run preview
~~~

The fixture-based browser audit is in tests/browser-polish.js. Start the production preview on 127.0.0.1:4178, open an isolated Playwright CLI session, and run it with playwright-cli run-code --filename=../tests/browser-polish.js (adjust the path for your working directory). It intercepts API requests and checks 375px, 768px and 1280px layouts, empty/loading/error states and form validation; it does not write to a live database.

## Deployment preparation (nothing is deployed)

- **Render:** server/ root, npm ci build command, npm start start command; set MONGO_URI, JWT_SECRET, CORS_ORIGIN and optionally JWT_EXPIRES_IN. Render supplies PORT. Use /health as the health-check path.
- **Atlas:** create the database/user and configure network access yourself; place the URI only in the backend environment.
- **Vercel:** client/ root, npm run build, dist output; set VITE_API_BASE_URL to the Render HTTPS origin. vercel.json provides SPA rewrites so direct visits to /home or /insights work. For another host, configure its equivalent fallback to index.html.
- Set backend CORS_ORIGIN to the exact deployed frontend HTTPS origin. Add preview origins explicitly if needed. Verify signup, login and CRUD on the deployed app after configuring both services.

## Screenshots

Place screenshots here after setting up the demo account:

- Home and transaction form ? mobile (375px) and desktop.
- Subscriptions ? active and unused services.
- Insights ? anomaly, trend and goal examples.
- Profile ? account details and preferences.

## Limitations

No bank synchronization, external payments or email delivery is included. Browser layout/API-failure tests can use request fixtures; these do not substitute for checking the configured MongoDB deployment. The seed script is opt-in and is not run by server startup.

## Updated API contracts

- GET /api/subscriptions/waste returns totalMonthlyRecurring, monthlyWaste and potentialSavings. All subscriptions contribute to recurring totals; unused subscriptions contribute to savings. Yearly costs are divided by 12. Legacy totalMonthlyCost and unusedSubscriptionCount fields remain available.
- Health breakdown entries now contain value (raw percentage) and weightedScore (earned points). Savings has 40 available points; inverse waste and inverse volatility each have 30. Rounded points sum to the returned score.
- Analytics includes spendingMix for this UTC calendar month through now, sorted by category amount, with category/amount/percent entries. It also returns notificationPrefs and an optional weeklyDigest based on the last seven UTC calendar days including today.
- Notification keys are dueDateAlerts, unusualSpendingAlerts and weeklySummary. Existing dueDateReminders/anomalyAlerts values remain supported and synchronized. Disabled reminders return an empty due-soon result; disabled unusual-spending alerts return an empty anomalies array.
- Debit modals only display reminders. Got it, Not now, Dismiss and Escape close them without authorizing or changing payments.

The ten mockup-gap acceptance checks are in tests/browser-gap-fixes.js, runnable with the same Playwright CLI preview setup as browser-polish.js. They cover preference off/on behavior, modal focus and close-only actions, summary totals, weighted points, both charts, and responsive layouts.
