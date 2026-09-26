import React, { useState, useEffect } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { Role } from '../../types/inventory';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'reset';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
}) => {
  const { login, signup, requestPasswordOtp, verifyPasswordOtp, resetPasswordWithToken } = useInventory();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(defaultMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signupRole, setSignupRole] = useState<Role>('inventory_manager');
  const [isBusy, setIsBusy] = useState(false);

  // OTP Reset states
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1); // 1: Enter email, 2: Enter OTP, 3: New Password
  const [devOtp, setDevOtp] = useState<string>('');
  const [otpEmailSent, setOtpEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(defaultMode);
    setErrorMsg('');
    setSuccessMsg('');
    setResetStep(1);
    setEnteredOtp('');
    setNewPassword('');
    setDevOtp('');
  }, [defaultMode, isOpen]);

  // Countdown before a new code can be requested
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'reset' && resetStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resetStep, timerSeconds]);

  if (!isOpen) return null;

  /** Runs an auth request, showing its error inline. */
  const run = async (fn: () => Promise<void>) => {
    setErrorMsg('');
    setIsBusy(true);
    try {
      await fn();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      sound.playError();
    } finally {
      setIsBusy(false);
    }
  };

  const celebrate = () => {
    sound.playSuccess();
    confetti({ particleCount: 50, spread: 60 });
    onClose();
  };

  const handleSendOtp = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    run(async () => {
      const res = await requestPasswordOtp(email.trim());
      setDevOtp(res.devOtp || '');
      setOtpEmailSent(res.emailSent);
      setEnteredOtp('');
      setResetStep(2);
      setTimerSeconds(30);
      sound.playBeep();
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const token = await verifyPasswordOtp(email.trim(), enteredOtp);
      setResetToken(token);
      setResetStep(3);
      sound.playSuccess();
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    run(async () => {
      await resetPasswordWithToken(resetToken, newPassword);
      setSuccessMsg('Password has been reset successfully! Redirecting to dashboard...');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      sound.playSuccess();
      setTimeout(onClose, 900);
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in both email and password.');
      return;
    }
    run(async () => {
      await login(email.trim(), password);
      celebrate();
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    run(async () => {
      await signup({ name: fullName.trim(), email: email.trim(), password, role: signupRole });
      celebrate();
    });
  };

  const fillQuickDemoAccount = (accountEmail: string, accountPass: string) => {
    setEmail(accountEmail);
    setPassword(accountPass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-xl overflow-hidden text-stone-900">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {mode === 'login' && 'Staff & Manager Sign In'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'reset' && 'OTP Password Reset'}
              </h3>
              <p className="text-xs text-stone-500">
                {mode === 'login' && 'Sign in to open your inventory dashboard'}
                {mode === 'signup' && 'Register as an Inventory Manager or Warehouse Staff'}
                {mode === 'reset' && 'Verify identity via 6-digit one-time passcode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Pre-fill Pill Buttons */}
          {mode === 'login' && (
            <div className="mb-5 p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="text-[11px] font-semibold text-stone-500 flex items-center justify-between">
                <span>Select Credential Profile:</span>
                <span className="text-[10px] text-amber-800 font-mono font-bold">1-CLICK LOGIN</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickDemoAccount('m.vance@stocksense.io', 'manager123')}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-left transition-colors shadow-2xs"
                >
                  <div className="text-xs font-bold text-stone-900">Marcus Vance</div>
                  <div className="text-[10px] text-amber-800 font-mono font-semibold">Inventory Manager</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickDemoAccount('elena.r@stocksense.io', 'warehouse123')}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-left transition-colors shadow-2xs"
                >
                  <div className="text-xs font-bold text-stone-900">Elena Rostova</div>
                  <div className="text-[10px] text-stone-600 font-mono">Warehouse Staff (Floor)</div>
                </button>
              </div>
            </div>
          )}

          {/* Mode: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@stocksense.io"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMsg('');
                    }}
                    className="text-xs text-stone-600 hover:text-stone-900 font-medium"
                  >
                    Forgot Password? (OTP)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>{isBusy ? 'Signing in...' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <div className="text-center pt-2 text-xs text-stone-500">
                New to StockSense?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-stone-800 hover:text-stone-950 font-semibold"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* Mode: SIGNUP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    minLength={2}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['inventory_manager', 'Inventory Manager', 'Incoming & outgoing stock'],
                    ['warehouse_staff', 'Warehouse Staff', 'Transfers, picking, counting'],
                  ] as [Role, string, string][]).map(([value, label, hint]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSignupRole(value)}
                      className={`p-2.5 rounded-xl border text-left transition-colors ${
                        signupRole === value
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'bg-white border-stone-200 text-stone-900 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{label}</div>
                      <div className={`text-[10px] ${signupRole === value ? 'text-stone-300' : 'text-stone-500'}`}>{hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>{isBusy ? 'Creating account...' : 'Create Account & Open Dashboard'}</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <div className="text-center pt-1 text-xs text-stone-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-stone-800 hover:text-stone-950 font-semibold"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Mode: RESET (OTP Flow) */}
          {mode === 'reset' && (
            <div className="space-y-4">
              {resetStep === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-stone-500">
                    Enter your registered email address to receive a 6-digit verification code.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="m.vance@stocksense.io"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>{isBusy ? 'Sending...' : 'Send Verification Code'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {devOtp ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      <div className="font-bold flex items-center justify-between mb-1">
                        <span>Development mode code:</span>
                        <span className="font-mono bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded font-bold">
                          {devOtp}
                        </span>
                      </div>
                      <div>Email delivery is not configured on the server, so the code is shown here.</div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                      {otpEmailSent
                        ? `We sent a 6-digit code to ${email}. It is valid for 10 minutes.`
                        : `If an account exists for ${email}, a 6-digit code has been sent.`}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-stone-700">Enter 6-Digit OTP</label>
                      {devOtp && (
                        <button
                          type="button"
                          onClick={() => setEnteredOtp(devOtp)}
                          className="text-xs text-stone-600 hover:text-stone-900 font-medium"
                        >
                          Autofill Code
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono tracking-widest text-stone-900 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{timerSeconds > 0 ? `Resend available in ${timerSeconds}s` : 'Did not get it?'}</span>
                    <button
                      type="button"
                      disabled={timerSeconds > 0 || isBusy}
                      onClick={() => handleSendOtp()}
                      className="text-stone-600 hover:text-stone-900 disabled:opacity-40"
                    >
                      Resend Code
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy || enteredOtp.length !== 6}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-semibold text-xs shadow-xs"
                  >
                    {isBusy ? 'Verifying...' : 'Verify Passcode'}
                  </button>
                </form>
              )}

              {resetStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Set New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-xs shadow-xs"
                  >
                    {isBusy ? 'Updating...' : 'Update Password & Launch'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetStep(1);
                  setErrorMsg('');
                }}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
