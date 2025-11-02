# Trainify AI - Render Deployment Guide

This guide covers deploying Trainify AI to **Render**.

---

## 🖥️ Render Deployment

### **Step 1: Create Render Account**
1. Go to https://render.com
2. Sign up/login with GitHub/GitLab/Bitbucket
3. Connect your repository

### **Step 2: Create New Web Service**

1. Click **"New +"** → **"Web Service"**
2. Select your repository (GitHub/GitLab/Bitbucket)
3. Click **"Connect"**

### **Step 3: Configure Service Settings**

Fill in the following settings:

**Name:**
```
trainify-ai
```

**Environment:**
```
Node
```

**Region:**
```
Choose closest to your users (e.g., Oregon, Frankfurt, Singapore)
```

**Branch:**
```
main
```

**Root Directory:**
```
. (leave empty or use .)
```

### **Step 4: Configure Build & Start Commands**

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npx vite preview --host 0.0.0.0 --port $PORT
```

**OR** (alternative):
```bash
npm run preview
```
*(But you'll need to update vite.config.ts to use $PORT)*

### **Step 5: Configure Environment Variables**

In Render Dashboard → Your Service → Environment:

Click **"Add Environment Variable"** and add these:

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_VERSION=18.x
```

**Optional (if needed):**
```
VITE_OPENAI_API_KEY=your_openai_api_key
```
*(Currently using Web Speech API, so this is optional)*

**Important Note:** `LOVABLE_API_KEY` is **NOT** added here - it's stored in Supabase Edge Function secrets (see Supabase setup below).

### **Step 6: Deploy**

1. Review all settings
2. Click **"Create Web Service"**
3. Render will automatically:
   - Install dependencies
   - Run build command
   - Start the service
4. Wait for deployment to complete (~5-10 minutes)
5. Your app will be available at: `https://trainify-ai.onrender.com`

---

## 📋 Render Configuration File (Optional but Recommended)

You can use `render.yaml` in your project root for automatic configuration:

```yaml
services:
  - type: web
    name: trainify-ai
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npx vite preview --host 0.0.0.0 --port $PORT
    envVars:
      - key: VITE_GEMINI_API_KEY
        sync: false
      - key: VITE_OPENAI_API_KEY
        sync: false
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: NODE_VERSION
        value: 18.x
```

**How to use:**
1. Push `render.yaml` to your repository
2. When creating a new service, Render will detect and use this file
3. You can still override settings in the dashboard if needed

---

## 🔧 Build Configuration

### **Update `vite.config.ts` for Render**

Make sure your `vite.config.ts` includes production settings:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true,
  },
});
```

---

## 📝 Package.json Scripts (Verify)

Make sure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

---

## 🌐 Supabase Edge Functions Setup

**Important:** Supabase Edge Functions need to be deployed separately!

### **Deploy Supabase Functions**

#### **Option 1: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-plan
supabase functions deploy generate-image
supabase functions deploy text-to-speech
```

#### **Option 2: Manual Deployment (Supabase Dashboard)**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. For each function:
   - Click **"Deploy a new function"**
   - Upload the function folder or paste the code
   - Deploy `generate-plan`
   - Deploy `generate-image`
   - Deploy `text-to-speech`

### **Set Supabase Function Secrets**

**IMPORTANT:** The Lovable API key must be set in Supabase secrets, NOT in Render environment variables.

1. Go to Supabase Dashboard → Your Project
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **"Add secret"**
4. Add:
   - **Name:** `LOVABLE_API_KEY`
   - **Value:** `your_lovable_api_key`
5. Click **"Save"**

**Note:** This secret is only accessible by Supabase Edge Functions on the server-side, keeping it secure.

---

## 🔐 Environment Variables Checklist

### **Render Environment Variables (Frontend):**

Add these in Render Dashboard → Your Service → Environment:

✅ **Required:**
- `VITE_GEMINI_API_KEY` - Google Gemini API key (for text generation)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `NODE_VERSION` - Set to `18.x`

❌ **Optional:**
- `VITE_OPENAI_API_KEY` - Only if using OpenAI TTS (currently using free Web Speech API)

### **Supabase Edge Functions Secrets:**

**Set in Supabase Dashboard, NOT in Render:**

1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add: `LOVABLE_API_KEY` = `your_lovable_api_key`

**Important:** 
- ❌ `LOVABLE_API_KEY` is **NOT** a `VITE_` variable
- ✅ It's stored securely in Supabase Edge Function secrets
- ✅ Only the `generate-image` Supabase function can access it
- ✅ Frontend never sees this key (more secure!)

---

## 🚀 Deployment Steps Summary

1. ✅ **Create Render account** and connect repository
2. ✅ **Create Web Service** in Render Dashboard
3. ✅ **Configure build/start commands** (see Step 4 above)
4. ✅ **Add environment variables** in Render (see Step 5 above)
5. ✅ **Deploy Supabase Edge Functions** (separately)
6. ✅ **Set Supabase secrets** (LOVABLE_API_KEY)
7. ✅ **Click "Create Web Service"** and wait for deployment

---

## 🔍 Post-Deployment Checks

After deployment, verify these features work:

1. ✅ **Homepage loads** correctly
2. ✅ **User form** displays properly
3. ✅ **Form submission** works and generates plans
4. ✅ **Workout plan** displays with proper formatting
5. ✅ **Diet plan** displays with proper formatting
6. ✅ **Motivation plan** displays
7. ✅ **Image generation** works for exercises (requires Supabase function)
8. ✅ **PDF export** downloads correctly
9. ✅ **Dark mode** toggles properly
10. ✅ **Text-to-speech** plays audio (browser feature)
11. ✅ **Streak calendar** loads and displays
12. ✅ **Suggested reads** links work
13. ✅ **No console errors** (check browser DevTools)

---

## 🐛 Troubleshooting

### **Issue 1: Build Fails**

**Solution:**
```bash
# Check Node version (should be 18.x)
node --version

# Clear cache locally
rm -rf node_modules package-lock.json
npm install

# Verify build works locally
npm run build
```

**In Render:**
- Check build logs for specific errors
- Ensure `NODE_VERSION` is set to `18.x`
- Verify all dependencies are in `package.json`

### **Issue 2: Environment Variables Not Loading**

**Solutions:**
- ✅ Ensure variables start with `VITE_` prefix (except NODE_VERSION)
- ✅ Restart the service after adding variables
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Verify values are correct (no extra spaces)
- ✅ Clear browser cache and reload

### **Issue 3: Supabase Functions Not Working**

**Solutions:**
- ✅ Verify functions are deployed in Supabase Dashboard
- ✅ Check `LOVABLE_API_KEY` secret is set in Supabase
- ✅ Verify CORS headers in function code
- ✅ Check function logs in Supabase Dashboard
- ✅ Ensure Supabase URL and keys are correct in Render env vars

### **Issue 4: 404 Errors on Routes**

**Solutions:**
- ✅ This shouldn't happen with `vite preview`, but if it does:
- ✅ Check that `startCommand` uses `npx vite preview`
- ✅ Verify all routes work in development first
- ✅ Check browser console for routing errors

### **Issue 5: Port/Startup Errors**

**Solutions:**
- ✅ Ensure start command uses `$PORT` environment variable
- ✅ Use: `npx vite preview --host 0.0.0.0 --port $PORT`
- ✅ Verify `vite.config.ts` has correct preview settings
- ✅ Check Render service logs for port binding errors

### **Issue 6: API Rate Limits**

**Solutions:**
- ✅ Check Google Gemini API quota/usage
- ✅ Verify API keys are valid and not expired
- ✅ Monitor API usage in respective dashboards
- ✅ Consider adding rate limiting or caching

### **Issue 7: Images Not Generating**

**Solutions:**
- ✅ Verify `generate-image` Supabase function is deployed
- ✅ Check `LOVABLE_API_KEY` is set in Supabase secrets
- ✅ Check Supabase function logs for errors
- ✅ Verify Lovable API key has credits/quota
- ✅ Test function directly in Supabase Dashboard

---

## 📊 Render Free Tier Limitations

**Important Notes:**
- Free tier services **spin down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds (cold start)
- Consider upgrading to paid tier for production use
- Free tier is perfect for testing and development

**To avoid spin-down:**
- Upgrade to paid tier (starts at $7/month)
- Or use a ping service to keep service awake
- Or accept the cold start delay

---

## 🔗 Custom Domain Setup

1. In Render Dashboard → Your Service → Settings
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `trainify-ai.com`)
5. Follow DNS configuration instructions
6. Render will provision SSL certificate automatically

---

## 🔄 Automatic Deployments

Render automatically deploys when you:
- ✅ Push to the connected branch (usually `main`)
- ✅ Merge a pull request to the main branch
- ✅ Manually trigger deployment from dashboard

**Auto-deploy settings:**
- Can be configured in Service → Settings → Build & Deploy
- Can disable auto-deploy if needed
- Can set specific branch for auto-deploy

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Render Status:** https://status.render.com

---

## ✅ Quick Checklist Before Deploying

- [ ] Repository is connected to Render
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npx vite preview --host 0.0.0.0 --port $PORT`
- [ ] Environment variables added (VITE_GEMINI_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, NODE_VERSION)
- [ ] Supabase Edge Functions deployed
- [ ] LOVABLE_API_KEY secret set in Supabase
- [ ] Tested build locally (`npm run build`)
- [ ] Tested preview locally (`npm run preview`)

---

**Good luck with your deployment! 🚀**
