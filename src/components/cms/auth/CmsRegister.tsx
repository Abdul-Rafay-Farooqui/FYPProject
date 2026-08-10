import React, { useState } from "react";
import { useAuth } from "@/contexts/cms/AuthContext";
import { useCmsRouter } from "@/contexts/cms/CmsRouterContext";
import { GraduationCap, Key, Building, UserPlus } from "lucide-react";

export default function CmsRegister() {
  const { register } = useAuth();
  const { navigate } = useCmsRouter();
  const [formData, setFormData] = useState({
    org_name: "",
    school_password: "",
    personal_code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(formData);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Registration failed");
    } else {
      // Registration successful - show success state
      setSuccess(true);
      setSchoolData({ name: formData.org_name, password: formData.school_password });
    }
  };

  if (success && schoolData) {
    return (
      <div
        className="min-h-screen overflow-y-auto flex items-center justify-center p-6"
        style={{ background: "#0b141a" }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ background: "rgba(0, 168, 132, 0.2)" }}
            >
              <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#e9edef] mb-3">
              School Registered Successfully!
            </h2>
            <p className="text-[#8696a0] text-lg mb-8">
              {schoolData.name} has been created
            </p>
          </div>

          <div className="rounded-xl p-6 mb-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
            <h3 className="text-[#e9edef] font-semibold mb-4">Next Steps:</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="text-[#e9edef] font-medium">Login as Admin</p>
                  <p className="text-[#8696a0] text-sm">Use your WeConnect email and password</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="text-[#e9edef] font-medium">Share School Password</p>
                  <p className="text-[#8696a0] text-sm">Staff and students can join using: <span className="text-[#00a884] font-mono">{schoolData.password}</span></p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/cms/login")}
            className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
            style={{ background: "#00a884" }}
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: "#0b141a" }}
    >
      <div className="flex h-full">
        {/* Left Side - Image & Text */}
        <div
          className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12"
          style={{
            background: "linear-gradient(135deg, #00a884 0%, #0b141a 100%)",
          }}
        >
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 bg-white/10">
              <GraduationCap className="w-10 h-10 text-[#00a884]" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              School Management
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Connect, communicate, and collaborate with your school community.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Secure school registration</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Manage staff and students</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Real-time communication</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: "#00a884" }}
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#e9edef]">
                Register School
              </h2>
              {/* <p className="text-[#8696a0] mt-1">Create your school portal</p> */}
            </div>

            {error && (
              <div
                className="mb-4 p-3 rounded-lg text-sm"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                  School Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                    style={{
                      background: "#0b141a",
                      border: "1px solid #222d34",
                    }}
                    value={formData.org_name}
                    onChange={(e) =>
                      setFormData({ ...formData, org_name: e.target.value })
                    }
                    placeholder="e.g. Oxford Academy"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                  School Password (shared with staff & students)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                    style={{
                      background: "#0b141a",
                      border: "1px solid #222d34",
                    }}
                    value={formData.school_password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        school_password: e.target.value,
                      })
                    }
                    placeholder="e.g. oxford2026"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                  Personal Code (optional)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                    style={{
                      background: "#0b141a",
                      border: "1px solid #222d34",
                    }}
                    value={formData.personal_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_code: e.target.value,
                      })
                    }
                    placeholder="Your unique code"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#00a884" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Register School
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={() => navigate("/cms/login")}
                className="text-[#00a884] hover:underline text-sm"
              >
                Already registered? Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
