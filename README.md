# TextClutch • AI Conversational Reply Strategist

TextClutch is a high-performance web application and multimodal API bot integration that generates context-aware conversational replies (Rizz, Savage/Cold, Caring, Teasing, Tactical) from chat text, screenshots, or uploaded media across English, Hinglish, and Hindi.

## Features
- **Multimodal Chat OCR**: Upload screenshots (`PNG`, `JPG`, `WebP`) or screen recordings (`MP4`, `MOV`) with client-side canvas downscaling to 1080p WebP and video keyframe extraction from the last 25% of duration.
- **5 Charismatic Personas**:
  - 🔥 **Rizz & Charm** (Smooth, flirtatious, high charisma)
  - ❄️ **Cold & Savage** (Unbothered, witty, sharp, boundary-setting)
  - 🧸 **Caring & Wholesome** (Empathetic, reassuring, thoughtful)
  - 🎭 **Playful Banter** (Teasing, sarcastic, lighthearted)
  - 🧠 **Tactical / Strategic** (Subtle frame-control, low investment)
- **3 Dynamic Languages**: Natural English (Gen-Z vibe), Hinglish (Latin-script Indian texting vernacular), and Hindi (Devanagari).
- **Firebase Auth & Firestore**: 1 free guest generation paywall with Google Sign-In and Email/Password auth for unlimited usage.
- **Liquid Glass Aesthetics**: Modern dark mode UI with ambient glows, glassmorphism, and zero layout shift.

## Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **AI / LLM**: Google Gemini 1.5 Flash Multimodal Vision
- **Backend & Auth**: Firebase Authentication & Firestore
- **State**: Zustand

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/theojassahu/textclutch.git
   cd textclutch
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment
Ready for deployment on **Vercel** or **Firebase Hosting**.
