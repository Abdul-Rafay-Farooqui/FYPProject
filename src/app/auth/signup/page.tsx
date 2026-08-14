'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { AuthAPI } from '@/lib/api/endpoints';
import { setToken } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

// ── Validation helpers ────────────────────────────────────────────────────
const validateEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// Accept formats: 03XXXXXXXXX (11 digits) or +923XXXXXXXXX (13 chars)
const validatePhone = (v: string) => {
  const cleaned = v.trim();
  return /^(0\d{10}|\+\d{11})$/.test(cleaned);
};

const passwordRules = (v: string) => ({
  length: v.length >= 8,
  upper: /[A-Z]/.test(v),
  lower: /[a-z]/.test(v),
  number: /[0-9]/.test(v),
  special: /[^A-Za-z0-9]/.test(v),
});

export default function SignupPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { setUser, setProfile, setAuthLoaded } = useAuthStore();

  const rules = passwordRules(password);
  const passwordStrong = Object.values(rules).every(Boolean);

  const fieldError = {
    displayName: touched.displayName && displayName.trim().length < 2
      ? 'Name must be at least 2 characters'
      : null,
    email: touched.email && !validateEmail(email)
      ? 'Enter a valid email address'
      : null,
    phone: touched.phone && !validatePhone(phone)
      ? 'Enter a valid 11-digit number (e.g. 03001234567)'
      : null,
    password: touched.password && !passwordStrong
      ? 'Password does not meet requirements'
      : null,
  };

  const isFormValid =
    displayName.trim().length >= 2 &&
    validateEmail(email) &&
    validatePhone(phone) &&
    passwordStrong;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all touched so errors show
    setTouched({ displayName: true, email: true, phone: true, password: true });
    if (!isFormValid) return;

    setLoading(true);
    setError(null);
    try {
      const data = await AuthAPI.register(
        phone.trim(),
        email.trim(),
        password,
        displayName.trim(),
      );
      const token = data.access_token || data.token;
      setToken(token);
      setUser({ id: data.user.id });
      setProfile(data.user);
      setAuthLoaded(true);
      router.push('/auth/onboarding');
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const blur = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  return (
    <div className="min-h-screen bg-[#111b21] overflow-y-auto p-4">
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-[#00a884] p-3 rounded-full">
            <MessageCircle className="text-white w-8 h-8" />
          </div>
          <h1 className="text-[#e9edef] text-3xl font-bold">WeConnect</h1>
        </div>

        <div className="bg-[#202c33] p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-[#e9edef] text-xl mb-6 font-medium">Create a new account</h2>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => blur('displayName')}
                placeholder="John Doe"
                className={`w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 ${
                  fieldError.displayName ? 'ring-2 ring-red-500' : 'focus:ring-[#00a884]'
                }`}
              />
              {fieldError.displayName && (
                <p className="text-red-400 text-xs mt-1">{fieldError.displayName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => blur('email')}
                placeholder="your@email.com"
                className={`w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 ${
                  fieldError.email ? 'ring-2 ring-red-500' : 'focus:ring-[#00a884]'
                }`}
              />
              {fieldError.email && (
                <p className="text-red-400 text-xs mt-1">{fieldError.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => blur('phone')}
                placeholder="03001234567"
                maxLength={13}
                className={`w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 ${
                  fieldError.phone ? 'ring-2 ring-red-500' : 'focus:ring-[#00a884]'
                }`}
              />
              {fieldError.phone ? (
                <p className="text-red-400 text-xs mt-1">{fieldError.phone}</p>
              ) : (
                <p className="text-[#8696a0] text-xs mt-1">Format: 03001234567 or +923001234567</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#8696a0] text-sm mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => blur('password')}
                  placeholder="Min. 8 characters"
                  className={`w-full bg-[#2a3942] text-[#e9edef] p-3 pr-10 rounded-md outline-none focus:ring-2 ${
                    touched.password && !passwordStrong ? 'ring-2 ring-red-500' : 'focus:ring-[#00a884]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-[#e9edef]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password rules */}
              {touched.password && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {[
                    { key: 'length', label: '8+ characters' },
                    { key: 'upper', label: 'Uppercase letter' },
                    { key: 'lower', label: 'Lowercase letter' },
                    { key: 'number', label: 'Number' },
                    { key: 'special', label: 'Special character' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1">
                      {rules[key as keyof typeof rules] ? (
                        <CheckCircle className="w-3 h-3 text-[#00a884] flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs ${rules[key as keyof typeof rules] ? 'text-[#00a884]' : 'text-red-400'}`}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00a884] text-[#111b21] font-bold py-3 rounded-md hover:bg-[#008069] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p className="text-[#8696a0] text-center mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#00a884] hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
