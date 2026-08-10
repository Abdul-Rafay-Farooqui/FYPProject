'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Camera, User, Info, Check } from 'lucide-react';
import { MediaAPI, UsersAPI } from '@/lib/api/endpoints';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('Hey there! I am using WeConnect.');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const { profile, setProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAbout(profile.about || 'Hey there! I am using WeConnect.');
      setAvatarUrl(profile.avatar_url || null);
      if (profile.onboarding_complete) {
        router.push('/');
      }
    }
  }, [profile, router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const res = await MediaAPI.upload(file);
      setAvatarUrl(res.url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const updated = await UsersAPI.updateMe({
        display_name: displayName,
        about,
        avatar_url: avatarUrl,
        onboarding_complete: true,
      });
      setProfile(updated);
      router.push('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#202c33] rounded-lg shadow-xl overflow-hidden">
        <div className="bg-[#00a884] p-6 text-center">
          <h1 className="text-[#111b21] text-2xl font-bold">
            Welcome to WeConnect
          </h1>
          <p className="text-[#111b21] opacity-80">
            Let's set up your profile
          </p>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-[#2a3942] rounded-full flex items-center justify-center overflow-hidden border-4 border-[#00a884]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-[#8696a0]" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#00a884] p-2 rounded-full cursor-pointer hover:bg-[#008069] transition-colors">
                  <Camera className="w-5 h-5 text-[#111b21]" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    accept="image/*"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-[#e9edef] text-lg font-medium">
                  Profile Photo
                </h3>
                <p className="text-[#8696a0] text-sm">
                  {uploading
                    ? 'Uploading…'
                    : 'Add a photo so your friends can recognize you'}
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#00a884] text-[#111b21] font-bold py-3 rounded-md hover:bg-[#008069] transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[#8696a0] text-sm mb-1 flex items-center gap-2">
                    <User className="w-4 h-4" /> Your Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 focus:ring-[#00a884]"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="text-[#8696a0] text-sm mb-1 flex items-center gap-2">
                    <Info className="w-4 h-4" /> About
                  </label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full bg-[#2a3942] text-[#e9edef] p-3 rounded-md outline-none focus:ring-2 focus:ring-[#00a884] h-24 resize-none"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-[#2a3942] text-[#e9edef] font-bold py-3 rounded-md hover:bg-[#374045] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || !displayName}
                  className="flex-1 bg-[#00a884] text-[#111b21] font-bold py-3 rounded-md hover:bg-[#008069] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Saving…'
                  ) : (
                    <>
                      <Check className="w-5 h-5" /> Finish
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}