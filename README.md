<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1IGEUPUDne4omYu76SkEaKW_UAnmtR05B

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` (used by the backend API)
3. Start the backend API (port 4000):
   `npm run backend:dev`
4. Start the frontend (port 3000+):
   `npm run dev`

The frontend proxies `/api/*` to the backend during local development.
