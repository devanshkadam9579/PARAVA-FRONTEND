# PARAVA Celebrations - Frontend Client

This is the Vite React frontend client for PARVA Celebrations, featuring Google Sign-In, Razorpay payments, and Firebase Firestore integration.

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Local Environment**:
   Vite uses environment variables prefixed with `VITE_`.
   Create a `.env` file in the root directory:
   ```env
   VITE_BACKEND_API_URL=http://localhost:5000
   ```

3. **Start the Dev Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` (or the port shown in terminal).

---

## ☁️ Deployment on Render

To deploy this frontend as a **Static Site** on [Render](https://render.com/):

### Step 1: Push code to GitHub
Make sure all changes are committed and pushed to your frontend repository:
```bash
git add .
git commit -m "Initialize frontend repository"
git branch -M main
git push -u origin main
```

### Step 2: Create a Static Site on Render
1. Go to your **Render Dashboard** and click **New > Static Site**.
2. Connect your GitHub account and select the **PARAVA-FRONTEND** repository.
3. Configure the following settings:
   - **Name**: `parava-celebrations`
   - **Branch**: `main`
   - **Root Directory**: Leave blank (root of repository)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables
Under the **Environment** tab, add the following variable:
- `VITE_BACKEND_API_URL`: (Set this to the live URL of your deployed backend, e.g., `https://parava-backend.onrender.com`)

Click **Create Static Site** to deploy. Render will build and deploy the React application.

---

## 🔑 Enabling Google Sign-In for Any Domain

To ensure any Google user (from `@gmail.com` or any custom workspace domain) can successfully log in:

1. **Set OAuth Consent Screen to External**:
   - Open the [Google Cloud Console](https://console.cloud.google.com/).
   - Select your project (`gen-lang-client-0681395105`).
   - Navigate to **APIs & Services > OAuth consent screen**.
   - Make sure your **User Type** is set to **External**. If it is set to *Internal*, change it to *External* so users outside your GSuite organization can log in.

2. **Configure Authorized Redirect URIs**:
   - Go to **APIs & Services > Credentials**.
   - Under **OAuth 2.0 Client IDs**, edit the Web Client ID (usually created automatically by Firebase).
   - In **Authorized JavaScript origins**, add:
     - `http://localhost:3000` (for local development)
     - `https://parava-celebrations.onrender.com` (your deployed Render frontend URL)
   - In **Authorized redirect URIs**, verify that the Firebase auth callback handler is present:
     - `https://gen-lang-client-0681395105.firebaseapp.com/__/auth/handler`

3. **Verify Auth Domain in Firebase Console**:
   - Open the [Firebase Console](https://console.firebase.google.com/).
   - Go to **Authentication > Sign-in method > Google**.
   - Ensure the provider status is **Enabled**.
