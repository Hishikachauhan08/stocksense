'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { auth as authApi } from '@/lib/api';
import { useToast } from '@/lib/toast';

type Tab = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpDisplay, setOtpDisplay] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();

  // Login form
  const [email, setEmail] = useState('admin@stocksense.com');
  const [password, setPassword] = useState('admin123');

  // Register
  const [reg, setReg] = useState({ name: '', username: '', email: '', password: '' });

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back!', 'success');
    } catch (err: any) {
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({
        email: reg.email,
        username: reg.username,
        password: reg.password,
        full_name: reg.name,
      });
      toast('Account created! Please login.', 'success');
      setTab('login');
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.forgot(forgotEmail);
      setOtpDisplay(data.otp || '');
      setOtpStep(true);
      toast('OTP generated (demo mode)', 'info');
    } catch (err: any) {
      toast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await authApi.reset(forgotEmail, otp, newPass);
      toast('Password reset! Login now.', 'success');
      setTab('login');
      setOtpStep(false);
    } catch (err: any) {
      toast(err.message || 'Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (t: Tab) =>
    `flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
      tab === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark-950 via-dark-900 to-brand-900/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30 mb-4"
          >
            <Package className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
            StockSense
          </h1>
          <p className="text-slate-400 mt-1">Inventory Management System</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex mb-6 bg-dark-800 rounded-xl p-1">
            <button type="button" onClick={() => setTab('login')} className={tabClass('login')}>
              Login
            </button>
            <button type="button" onClick={() => setTab('register')} className={tabClass('register')}>
              Sign Up
            </button>
            <button type="button" onClick={() => { setTab('forgot'); setOtpStep(false); }} className={tabClass('forgot')}>
              Reset
            </button>
          </div>

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Sign In
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                Demo: admin@stocksense.com / admin123
              </p>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                <input
                  value={reg.name}
                  onChange={(e) => setReg({ ...reg, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <input
                  value={reg.username}
                  onChange={(e) => setReg({ ...reg, username: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={reg.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <div className="space-y-4">
              {!otpStep ? (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send OTP
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {otpDisplay && (
                    <p className="text-sm text-brand-400">Demo OTP: {otpDisplay}</p>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">OTP</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      minLength={6}
                      className="w-full px-4 py-3 bg-dark-800 border border-slate-700 rounded-xl text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full py-3 btn-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
