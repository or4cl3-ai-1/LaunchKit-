# LaunchKit 🚀

**The "Business-in-a-Box" Engine.**

LaunchKit is an AI-powered strategic partner that transforms raw ideas, messy notes, or project specifications into a cohesive, professionally designed suite of business assets. From "Shower Idea" to "Investor Ready" in under 10 minutes.

![LaunchKit Preview](https://picsum.photos/seed/launchkit/1200/600)

## 🌟 Core Value Proposition

Launching a business is hard. You usually need to hire a designer, a copywriter, a market researcher, and a financial analyst. **LaunchKit** automates the heavy lifting by leveraging advanced Generative AI and professional design patterns to give you a consultancy-grade foundation for any business idea.

## ✨ Key Features

### 1. Magic Import Engine 🪄
- **Multi-Source Intake**: Paste raw text, upload READMEs, technical specs, or brain-dumps.
- **Smart Extraction**: Our logic engine extracts critical business components: Problem, Solution, Audience, and Pricing.
- **Auto-Gap Detection**: Identifies missing information and prompts you before generation.

### 2. The Full Deliverable Suite 📊
- **🎨 Logo Design**: Dynamic SVG logo generation based on your brand vibe.
- **🎨 Brand Identity**: Custom color palettes, typography pairings, and social media guides.
- **📝 Business Plan**: 15-page comprehensive operations and strategy document.
- **💰 Financials**: 12-month P&L, startup costs, and unit economics.
- **🎤 Pitch Deck**: Investor-ready slide structures with high-impact storytelling.
- **🔍 Competitive Analysis**: SWOT maps and positioning vs. real-world competitors.
- **📣 Marketing Strategy**: 30-day launch calendars and high-conversion ad copy.

### 3. Collaboration & Feedback 🤝
- **Real-Time Commenting**: Discuss specific assets with your team directly in the dashboard.
- **Team Roles**: Owner, Editor, and Viewer permissions via Firebase Auth.
- **Public Sharing**: Toggle "Public Mode" to share view-only links with investors or partners.
- **Intelligent Iteration**: Rate deliverables and provide qualitative feedback. The AI analyzes your feedback to "Smart Regenerate" the asset.

### 4. Design Vibes 🎨
- **Minimal**: For clean, modern SaaS and lifestyle brands.
- **Bold**: High-impact, energetic designs for consumer products.
- **Luxury**: Elegant, serif-heavy aesthetics for premium services.
- **Tech**: Monospaced accents and grid patterns for technical infrastructure.

---

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/) (Framer Motion)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **AI Service**: [Google Gemini API](https://ai.google.dev/) via `@google/genai`
- **Markdown Rendering**: [react-markdown](https://github.com/remarkjs/react-markdown)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Google Cloud Project with the **Gemini API** enabled.
- A Firebase Project.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/launchkit.git
   cd launchkit
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   # Firebase config is handled via firebase-applet-config.json
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 🏗 Project Architecture

```text
src/
├── components/       # Reusable UI (Modals, Comments, Onboarding)
├── services/         # Logic layers (AI Engine, Storage, Firestore)
├── pages/            # View components (Wizard, Dashboard, Projects)
├── constants/        # Templates, Vibe definitions, UI strings
├── lib/              # SDK Initializations (Firebase, Gemini)
└── types/            # TypeScript Interfaces
```

### AI Logic Engine
The core logic resides in `src/services/ai.ts`. It uses a multi-agent prompting strategy:
1. **The Architect**: Parses raw input into a structured `BusinessIdea`.
2. **The Specialist**: Generates category-specific content (Financials, Copy, etc.).
3. **The Designer**: Wraps the content in CSS-compatible vibes.

---

## 🛡 Security & Permissions

LaunchKit uses **Attribute-Based Access Control (ABAC)** via Firestore Security Rules:
- **Private by Default**: Only owners and invited collaborators can read/write.
- **Permission Tiers**: `Editors` can trigger regenerations; `Viewers` can only comment.
- **Public Toggle**: If `isPublic` is set to `true`, read access is granted to unauthenticated users via the "Public Mode" decorator.

---

## 📦 Deployment

### Production Build
```bash
npm run build
```
This will generate a `dist` folder ready for static hosting (Firebase Hosting, Vercel, Netlify).

### Environment Sync
Ensure that `VITE_GEMINI_API_KEY` is set in your CI/CD pipeline or hosting provider's dashboard.

---

## 🛤 Roadmap
- [ ] **Multi-Currency Support**: For global financial projections.
- [ ] **Domain Availability**: Integrated search for `.com` / `.io` names.
- [ ] **Landing Page Export**: Export generated copy directly into a React/Tailwind template.
- [ ] **Agent Swarm 2.0**: Deeper integration with autonomous marketing agents for Twitter/LinkedIn.

---

## 📄 License
This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the LaunchKit Team. Ready to build? [Start Your Engine.](/wizard)
