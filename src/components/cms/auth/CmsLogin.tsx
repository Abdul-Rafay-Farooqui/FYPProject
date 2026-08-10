import React, { useState } from "react";
import { useAuth } from "@/contexts/cms/AuthContext";
import { useCmsRouter } from "@/contexts/cms/CmsRouterContext";
import { GraduationCap, Mail, Lock, Key, LogIn } from "lucide-react";

export default function CmsLogin() {
  const { login } = useAuth();
  const { navigate } = useCmsRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    school_password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload: any = { email: formData.email };
    if (isAdmin) {
      payload.password = formData.password;
    } else {
      payload.school_password = formData.school_password;
    }

    const result = await login(payload);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Invalid credentials");
    }
  };

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
              School Portal
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Sign in to access your school's communication hub.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Secure authentication</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Staff, student & admin access</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/70">Stay connected 24/7</p>
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
              {/* <h2 className="text-2xl font-bold text-[#e9edef]">
                School Portal
              </h2>
              <p className="text-[#8696a0] mt-1">
                Sign in to your school account
              </p> */}
            </div>

            <div
              className="rounded-xl p-6"
              style={{ background: "#111b21", border: "1px solid #222d34" }}
            >
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

              <div
                className="flex mb-6 rounded-lg overflow-hidden"
                style={{ background: "#0b141a" }}
              >
                <button
                  type="button"
                  onClick={() => setIsAdmin(false)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${!isAdmin ? "text-white" : "text-[#8696a0]"}`}
                  style={!isAdmin ? { background: "#00a884" } : {}}
                >
                  Staff / Student
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdmin(true)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-all ${isAdmin ? "text-white" : "text-[#8696a0]"}`}
                  style={isAdmin ? { background: "#00a884" } : {}}
                >
                  Admin
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isAdmin && (
                  <div>
                    <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                      School Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                      <input
                        type="password"
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
                        placeholder="Enter school password"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                      style={{
                        background: "#0b141a",
                        border: "1px solid #222d34",
                      }}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <label className="block text-[#8696a0] text-xs font-medium mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
                      <input
                        type="password"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                        style={{
                          background: "#0b141a",
                          border: "1px solid #222d34",
                        }}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>
                )}
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
                      <LogIn className="w-4 h-4" /> Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button
                  onClick={() => navigate("/cms/register")}
                  className="text-[#00a884] hover:underline text-sm"
                >
                  Register a new school
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
