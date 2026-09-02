# LIWFY blog

Static site that shows the LIWFY channel's banner, avatar, description, and latest uploads. A GitHub Action calls the YouTube Data API every 30 minutes, writes the result to `data/channel.json`, and redeploys the page. The API key never reaches the browser — only the generated JSON is public.

## 1. Get a YouTube Data API key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or reuse one).
3. Enable **YouTube Data API v3** under "APIs & Services".
4. Create an API key under "Credentials". You can restrict it to the YouTube Data API v3 for safety.

## 2. Create the repo

1. Create a new GitHub repo (e.g. `liwfy-blog`, or `<your-username>.github.io` if you want it at the root domain).
2. Push everything in this folder to the repo's `main` branch.

## 3. Add the API key as a secret

In the repo: **Settings → Secrets and variables → Actions → New repository secret**

- Name: `YT_API_KEY`
- Value: the API key from step 1

## 4. Enable Pages via Actions

**Settings → Pages → Build and deployment → Source → GitHub Actions**

## 5. Run it

- Push to `main`, or go to **Actions → Update channel data → Run workflow** to trigger it manually the first time.
- After that it runs automatically every 30 minutes, refreshes `data/channel.json`, commits if anything changed, and redeploys the site.

## Local structure

```
index.html              the page
assets/style.css        styling
assets/script.js        loads data/channel.json and renders it client-side
data/channel.json        generated data (fallback content is checked in so the page isn't empty on first deploy)
scripts/fetch-data.mjs   the script the Action runs
.github/workflows/update-data.yml   schedule + deploy
```

## Notes

- The channel handle is set to `lienxt` in the workflow (`CHANNEL_HANDLE` env var) — change it there if the handle ever changes.
- `videos.list` and `playlistItems.list` are used instead of `search.list` to keep API quota usage low (search costs 100 units per call; these cost 1 each).
- If you rename the default branch away from `main`, update the `ref` in the workflow's `checkout` steps and the `branches` trigger.
