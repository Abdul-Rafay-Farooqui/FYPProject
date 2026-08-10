'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { AuthAPI } from '@/lib/api/endpoints';
import { setToken } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, setProfile, setAuthLoaded } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await AuthAPI.login(phone.trim(), password);
      const token = data.access_token || data.token;
      setToken(token);
      setUser({ id: data.user.id });
      setProfile(data.user);
      setAuthLoaded(true);
      if (!data.user.onboarding_complete) {
        router.push('/auth/onboarding');
      } else {
        router.push('/');
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Login failed. Check your phone and password.',
      );
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-[#e9edef] text-xl mb-6 font-medium">
          Login to your account
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[#8696a0] text-sm mb-1">
              Phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+911234567890"
              className="w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 focus:ring-[#00a884]"
              required
            />
          </div>
          <div>
            <label className="block text-[#8696a0] text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 focus:ring-[#00a884]"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00a884] text-[#111b21] font-bold py-3 rounded-md hover:bg-[#008069] transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="text-[#8696a0] text-center mt-6">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-[#00a884] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}