# What's My Availability

Quickly check your Google Calendar availability and share it with a link.

## What it does

Connects to your Google Calendar, shows your free slots for the next 5 business days, and generates a shareable link so others can see when you're available — no sign-up or backend required.

## Features

- Google Calendar integration via OAuth
- 5-day business day availability view
- One-click shareable link (compressed with lz-string). So no database!
- No backend — runs entirely in the browser!
- Mobile responsive

## Tech stack

Vite, React 19, TypeScript, Google OAuth (`@react-oauth/google`), lz-string

## Getting started

```bash
git clone https://github.com/user/whats-my-availability.git
cd whats-my-availability
pnpm install
```

Create a `.env` file:

```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

```bash
pnpm dev
```

## Live site

[wma.sidv.me](https://wma.sidv.me)
