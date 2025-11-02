# 🏋️ Trainify AI

**Trainify AI** is an intelligent fitness companion that generates personalized workout, diet, and motivation plans powered by AI. Whether you're a beginner or an experienced fitness enthusiast, Trainify AI tailors comprehensive fitness strategies to help you achieve your health goals.

![Trainify AI](https://img.shields.io/badge/Trainify-AI-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript&style=for-the-badge)
![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite&style=for-the-badge)

## ✨ Features

### 🎯 Personalized Fitness Plans
- **AI-Generated Workout Plans**: 7-day customized workout routines based on your fitness level, goals, and preferences
- **Personalized Diet Plans**: Nutrition strategies tailored to your dietary preferences and fitness objectives
- **Motivation Plans**: Daily tips, affirmations, and motivational quotes to keep you inspired

### 📊 Activity Tracking
- **Streak Calendar**: Track your workout consistency with a visual calendar
- **Progress Monitoring**: Save and view your generated plans anytime

### 🎨 User Experience
- **Beautiful UI**: Modern, responsive design built with shadcn/ui components
- **Dark Mode**: Toggle between light and dark themes
- **Text-to-Speech**: Listen to your plans with built-in voice synthesis
- **PDF Export**: Download your plans as PDF files for offline access
- **Motivational Quotes**: Daily inspiration to fuel your fitness journey
- **Suggested Reads**: Curated fitness and health resources

### 🤖 AI-Powered
- Powered by **Google Gemini AI** for intelligent plan generation
- Context-aware responses that adapt to your specific needs
- Real-time generation with engaging loading experiences

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - Beautiful component library
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **React Hook Form + Zod** - Form validation

### Backend & Services
- **Supabase** - Backend functions and database
- **Google Gemini API** - AI text generation
- **Web Speech API** - Browser-based text-to-speech

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher - [Download Node.js](https://nodejs.org/)
- **npm** or **bun** - Package manager
- **Git** - Version control

### API Keys Required

1. **Google Gemini API Key**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Required for generating workout, diet, and motivation plans

2. **Supabase** (Optional - for advanced features)
   - Create a project at [Supabase](https://supabase.com)
   - Get your project URL and anonymous key

## 🚀 Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivutj/fit-muse-ai-82.git
   cd fit-muse-ai-82
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Or create a `.env` file in the root directory with:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_OPENAI_API_KEY=your_openai_api_key_here  # Optional
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

## 📁 Project Structure

```
trainify-ai/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── UserForm.tsx     # User input form
│   │   ├── PlanDisplay.tsx  # Display generated plans
│   │   ├── StreakCalendar.tsx # Workout streak tracker
│   │   ├── MotivationalQuote.tsx # Daily quotes
│   │   └── SuggestedReads.tsx   # Reading suggestions
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Main homepage
│   │   └── NotFound.tsx     # 404 page
│   ├── lib/                 # Utility functions
│   │   ├── api.ts           # API calls and AI integration
│   │   └── utils.ts         # Helper functions
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations
│   │   └── supabase/        # Supabase client
│   └── assets/              # Static assets
├── supabase/
│   └── functions/           # Supabase edge functions
│       ├── generate-plan/   # Plan generation function
│       ├── generate-image/  # Image generation function
│       └── text-to-speech/  # TTS function
├── public/                  # Public assets
├── package.json             # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎮 Usage

### Generating Your First Plan

1. **Fill out the User Form**
   - Enter your name, age, gender
   - Provide height (cm) and weight (kg)
   - Select your fitness goal (weight loss, muscle gain, etc.)
   - Choose your fitness level (beginner, intermediate, advanced)
   - Specify your location (for weather-specific advice)
   - Select your dietary preferences

2. **Submit and Generate**
   - Click "Generate My Plan"
   - Wait while AI creates your personalized plans
   - Enjoy fitness facts while waiting!

3. **Review Your Plans**
   - View your 7-day workout plan
   - Check your personalized diet plan
   - Read your motivation tips and affirmations

4. **Track Progress**
   - Use the streak calendar to mark completed workouts
   - Plans are automatically saved to your browser

5. **Export and Share**
   - Download plans as PDF
   - Use text-to-speech to listen to your plans
   - Regenerate plans anytime with updated information

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Build in development mode
npm run build:dev
```

### Code Style

This project uses ESLint for code quality. Make sure your code follows the project's linting rules before committing.

```bash
npm run lint
```

## 🚢 Deployment

### Deploy to Render

Trainify AI can be easily deployed to [Render](https://render.com). See the detailed [Deployment Guide](./DEPLOYMENT_GUIDE.md) for step-by-step instructions.

**Quick Deploy to Render:**

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npx vite preview --host 0.0.0.0 --port $PORT`
5. Add environment variables:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (if using Supabase)
   - `VITE_SUPABASE_ANON_KEY` (if using Supabase)
   - `NODE_VERSION=18.x`

### Deploy to Other Platforms

Trainify AI can be deployed to any platform that supports Node.js:
- **Vercel** - Great for Next.js and React apps
- **Netlify** - Excellent for static sites
- **Railway** - Simple container-based deployment
- **Fly.io** - Fast global deployment
- **AWS Amplify** - AWS-powered hosting

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI generation | ✅ Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | ⚠️ Optional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ⚠️ Optional |
| `VITE_OPENAI_API_KEY` | OpenAI API key (for TTS) | ❌ Optional |

### Supabase Setup (Optional)

If you want to use Supabase Edge Functions:

1. Create a Supabase project
2. Deploy edge functions:
   ```bash
   supabase functions deploy generate-plan
   supabase functions deploy generate-image
   supabase functions deploy text-to-speech
   ```
3. Set secrets in Supabase Dashboard

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting
- Ensure ESLint passes without errors

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **shadcn/ui** - Beautiful component library
- **Google Gemini** - AI capabilities
- **Vite** - Lightning-fast build tool
- **Supabase** - Backend infrastructure
- All the amazing open-source contributors

## 📧 Support

If you encounter any issues or have questions:

- Open an [Issue](https://github.com/shivutj/fit-muse-ai-82/issues) on GitHub
- Check the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for deployment help
- Review the [troubleshooting section](./DEPLOYMENT_GUIDE.md#-troubleshooting)

## 🔮 Future Features

- [ ] Social sharing of workout plans
- [ ] Progress photos tracking
- [ ] Integration with fitness wearables
- [ ] Meal prep suggestions with recipes
- [ ] Video exercise demonstrations
- [ ] Community challenges
- [ ] Nutrition tracking
- [ ] Workout video generation

---

**Made with ❤️ for fitness enthusiasts everywhere**

*Start your fitness journey today with Trainify AI!* 🚀
