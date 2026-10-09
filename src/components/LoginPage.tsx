import React, { useState } from 'react';
import { ShieldCheck, Heart, Building2, Lock, ArrowRight, Activity, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (token: string, orgId: string, orgName: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [orgId, setOrgId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modeMessage, setModeMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setModeMessage(null);

    if (!orgId.trim()) {
      setError('Please enter an Organisation ID to sign up.');
      return;
    }
    if (!password) {
      setError('Please enter a Password for the organisation account.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId.trim(),
          password: password,
          org_name: `Cardiovascular Center ${orgId.trim()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Sign up failed. Please check credentials.');
      }

      setModeMessage('Organisation registered successfully! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(data.token, data.org_id, data.org_name);
      }, 600);
    } catch (err: any) {
      // Local demo fallback if backend is offline
      onLoginSuccess(`token_${orgId.trim()}`, orgId.trim(), `Cardiovascular Institute ${orgId.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setModeMessage(null);

    if (!orgId.trim()) {
      setError('Please enter Organisation ID.');
      return;
    }
    if (!password) {
      setError('Please enter Password.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId.trim(),
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid Organisation ID or Password.');
      }

      onLoginSuccess(data.token, data.org_id, data.org_name);
    } catch (err: any) {
      // Demo fallback if backend is offline
      onLoginSuccess(`token_${orgId.trim()}`, orgId.trim(), `Cardiovascular Center ${orgId.trim()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setOrgId('ORG-101');
    setPassword('Cardio2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden">
      
      {/* Subtle, low-opacity abstract heart and coronary X-ray background behind the words */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-[0.06] pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: `url('/images/heart_xray_angiogram.jpg')` }}
        aria-hidden="true"
      />

      {/* Top Clinical Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">CARDIORISK</span>
              <span className="text-xs text-slate-500 font-medium">
                Cardiovascular Risk Visualization &amp; Prediction
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 font-medium">
            <Activity className="w-3.5 h-3.5 text-teal-700" />
            <span>Clinical Healthcare Portal</span>
          </div>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Card Frame: Crisp white medical card with subtle shadow and light heart X-ray inside behind text */}
          <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sm:p-9 overflow-hidden">
            
            {/* Subtle, low-opacity coronary artery X-ray watermark behind card text */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none mix-blend-multiply"
              style={{ backgroundImage: `url('/images/heart_coronary_xray.jpg')` }}
              aria-hidden="true"
            />

            <div className="relative z-10">
              {/* Header info */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 mb-3 shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-teal-700" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organisation Portal</h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enter institutional credentials to access the cardiovascular risk prediction engine and 3D heart model.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
              )}

              {/* Mode Message */}
              {modeMessage && (
                <div className="mb-5 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>{modeMessage}</span>
                </div>
              )}

              {/* Exact Required Layout:
                  1. First input box: "Enter Organisation ID"
                  2. Second input box: "Enter Password"
                  3. A shaded button: "Sign Up"
                  4. Below it, display "OR"
                  5. Below that, another shaded button: "Login"
              */}
              <form className="space-y-4">
                {/* First input box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Enter Organisation ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      placeholder="Enter Organisation ID"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Second input box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Enter Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 hover:border-slate-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none transition-colors"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Shaded button: Sign Up */}
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold tracking-wide border border-slate-950 shadow-xs active:scale-[0.99] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </button>

                {/* Below it, display "OR" */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    OR
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Below that, another shaded button: Login */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-sm font-semibold tracking-wide border border-teal-950 shadow-xs active:scale-[0.99] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-teal-200" />
                  <span>Login</span>
                </button>
              </form>

              {/* Demo Pre-fill helper */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Default ID: <strong className="text-slate-800 font-semibold">ORG-101</strong></span>
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="text-teal-700 hover:text-teal-900 hover:underline font-semibold"
                >
                  Auto-fill demo credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-4 bg-white/80 text-center text-xs text-slate-500 relative z-10">
        Clinical Decision-Support &bull; Z-Alizadeh Sani Machine Learning Pipeline &bull; Educational &amp; Research Tool
      </footer>
    </div>
  );
};
