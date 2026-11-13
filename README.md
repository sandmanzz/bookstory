# bookstory

Web app for **MainStory**, a paid digital storybook library for toddlers. One subscription unlocks every book, and a one-time purchase unlocks a single book for good.

API: [bookstory-be](https://github.com/sandmanzz/bookstory-be)

## Stack

Vite, React 18, React Router, Tailwind CSS v4, TypeScript in strict mode, Vitest.

## Run locally

Start the API first (see [bookstory-be](https://github.com/sandmanzz/bookstory-be)), then:

```bash
npm install
npm run dev        # http://localhost:5173, talks to http://localhost:8787
npm run check      # lint, format check, strict typecheck and tests
```

Set `VITE_API_URL` (see `.env.example`) to point at another API. It is baked in at build time, and a production build fails with a clear message if it is missing.

Demo accounts (log in with the email only): `parent@mainstory.test`, `subscriber@mainstory.test`, `admin@mainstory.test`. The admin panel is at `/admin` for the admin account. Test card for payments: `4242 4242 4242 4242`.

## What is in it

- **Library and book pages:** which books are open and which are locked is always clear, with filters by age and by access. A launch-offer countdown shows for parents on the landing page and the plans page, never in the reader.
- **Reader:** a 3D page-turn book with touchable stickers, picture questions, tap-a-word read aloud, auto read, English and Indonesian, and a puzzle for each finished story.
- **Checkout:** subscription (with a free trial) and one-time purchase, always behind a grown-ups-only gate.
- **Reader profiles:** up to four children per device. They live only in the browser, so a child's name and age never reach a server.
- **Admin:** create, edit and delete books, pages, stickers, questions and Indonesian translations, with a custom accessible select instead of native dropdowns.
- **Illustrations:** in `public/stories/<slug>/` (`cover.jpg`, `p1.jpg` to `p6.jpg`). A missing image falls back to an emoji on a gradient.

Logic that can be tested without a browser lives in `src/lib` and is covered by unit tests. There are no component or end-to-end tests yet.

## Deploy on Vercel

1. Import this repository in Vercel (framework: Vite). The single-page-app rewrite is already in `vercel.json`.
2. Set `VITE_API_URL` to the deployed API URL, with no trailing slash, then deploy.
3. In the API project, set `ALLOWED_ORIGINS` to this site's URL.

It has **not been deployed or verified on Vercel yet**.
