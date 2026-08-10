'use client';

import { useState } from 'react';
import { Plus, Award, Heart, Star, Zap, Trophy, Target, Lightbulb, Users, ThumbsUp, Sparkles, Crown } from 'lucide-react';

interface Praise {
  id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_avatar?: string | null;
  to_user_id: string;
  to_user_name: string;
  to_user_avatar?: string | null;
  badge: string;
  message?: string | null;
  created_at: string;
}

interface PraiseTabProps {
  praise?: Praise[];
  teamMembers?: { id: string; name: string; avatar?: string | null }[];
  currentUserId?: string;
  onSendPraise?: (payload: {
    to_user_id: string;
    badge: string;
    message?: string;
  }) => Promise<void>;
}

const PRAISE_BADGES = [
  { 
    value: 'team-player', 
    label: 'Team Player', 
    icon: Users, 
    color: 'from-blue-500 to-blue-600',
    emoji: '🤝',
    description: 'Great collaboration and teamwork'
  },
  { 
    value: 'problem-solver', 
    label: 'Problem Solver', 
    icon: Lightbulb, 
    color: 'from-yellow-500 to-yellow-600',
    emoji: '💡',
    description: 'Creative solutions and critical thinking'
  },
  { 
    value: 'high-achiever', 
    label: 'High Achiever', 
    icon: Trophy, 
    color: 'from-purple-500 to-purple-600',
    emoji: '🏆',
    description: 'Outstanding performance and results'
  },
  { 
    value: 'innovator', 
    label: 'Innovator', 
    icon: Sparkles, 
    color: 'from-pink-500 to-pink-600',
    emoji: '✨',
    description: 'Innovative ideas and approaches'
  },
  { 
    value: 'mentor', 
    label: 'Mentor', 
    icon: Crown, 
    color: 'from-orange-500 to-orange-600',
    emoji: '👑',
    description: 'Helping others grow and learn'
  },
  { 
    value: 'go-getter', 
    label: 'Go-Getter', 
    icon: Zap, 
    color: 'from-green-500 to-green-600',
    emoji: '⚡',
    description: 'Proactive and driven'
  },
  { 
    value: 'quality-champion', 
    label: 'Quality Champion', 
    icon: Star, 
    color: 'from-indigo-500 to-indigo-600',
    emoji: '⭐',
    description: 'Commitment to excellence'
  },
  { 
    value: 'goal-crusher', 
    label: 'Goal Crusher', 
    icon: Target, 
    color: 'from-red-500 to-red-600',
    emoji: '🎯',
    description: 'Consistently hitting targets'
  },
  { 
    value: 'positive-vibes', 
    label: 'Positive Vibes', 
    icon: Heart, 
    color: 'from-rose-500 to-rose-600',
    emoji: '❤️',
    description: 'Spreading positivity and motivation'
  },
  { 
    value: 'awesome', 
    label: 'Simply Awesome', 
    icon: ThumbsUp, 
    color: 'from-cyan-500 to-cyan-600',
    emoji: '👍',
    description: 'All-around amazing work'
  },
];

const PraiseTab = ({
  praise = [],
  teamMembers = [],
  currentUserId,
  onSendPraise,
}: PraiseTabProps) => {
  const [showPraiseModal, setShowPraiseModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  // Filter out current user from recipients
  const availableRecipients = teamMembers.filter(m => m.id !== currentUserId);

  const resetForm = () => {
    setSelectedRecipient('');
    setSelectedBadge('');
    setMessage('');
    setErr('');
  };

  const handleSendPraise = async () => {
    if (!selectedRecipient) {
      setErr('Please select a team member');
      return;
    }
    if (!selectedBadge) {
      setErr('Please select a badge');
      return;
    }

    setSending(true);
    setErr('');
    try {
      await onSendPraise?.({
        to_user_id: selectedRecipient,
        badge: selectedBadge,
        message: message.trim() || undefined,
      });
      resetForm();
      setShowPraiseModal(false);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to send praise');
    } finally {
      setSending(false);
    }
  };

  const getBadgeConfig = (badgeValue: string) => {
    return PRAISE_BADGES.find(b => b.value === badgeValue) || PRAISE_BADGES[9];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const Spinner = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#e9edef] text-lg font-semibold">Team Recognition</h3>
          <p className="text-[#8696a0] text-sm">Celebrate your teammates' achievements</p>
        </div>
        <button
          onClick={() => setShowPraiseModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#00a884] to-[#008069] hover:from-[#008069] hover:to-[#00a884] text-white transition-all shadow-lg"
        >
          <Award className="w-4 h-4" /> Give Praise
        </button>
      </div>

      {/* Praise Feed */}
      <div className="space-y-3">
        {praise.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#008069]/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-[#00a884]" />
            </div>
            <p className="text-[#8696a0] text-sm">No praise yet. Be the first to recognize someone!</p>
          </div>
        ) : (
          praise.map(item => {
            const badgeConfig = getBadgeConfig(item.badge);
            const BadgeIcon = badgeConfig.icon;

            return (
              <div
                key={item.id}
                className="bg-[#111b21] border border-[#222d34] rounded-xl p-4 hover:border-[#2a3942] transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Badge Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${badgeConfig.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                    <span className="text-3xl">{badgeConfig.emoji}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-[#e9edef] text-sm font-semibold">{badgeConfig.label}</h4>
                        <p className="text-[#8696a0] text-xs mt-0.5">{badgeConfig.description}</p>
                      </div>
                      <span className="text-[#8696a0] text-xs whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* From/To */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* From User */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                          {item.from_user_avatar ? (
                            <img 
                              src={item.from_user_avatar} 
                              alt={item.from_user_name} 
                              className="w-full h-full rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-[#00a884] text-xs font-semibold">
                              {item.from_user_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[#e9edef] text-sm font-medium">{item.from_user_name}</span>
                      </div>

                      <span className="text-[#8696a0] text-xs">→</span>

                      {/* To User */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                          {item.to_user_avatar ? (
                            <img 
                              src={item.to_user_avatar} 
                              alt={item.to_user_name} 
                              className="w-full h-full rounded-full object-cover" 
                            />
                          ) : (
                            <span className="text-[#00a884] text-xs font-semibold">
                              {item.to_user_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[#e9edef] text-sm font-medium">{item.to_user_name}</span>
                      </div>
                    </div>

                    {/* Message */}
                    {item.message && (
                      <div className="mt-2 p-3 bg-[#0b141a] rounded-lg border-l-2 border-[#00a884]">
                        <p className="text-[#cfd4d7] text-sm italic">"{item.message}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Give Praise Modal */}
      {showPraiseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111b21] border border-[#222d34] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-[#111b21] border-b border-[#222d34] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#00a884]" />
                <h3 className="text-[#e9edef] text-lg font-semibold">Give Praise</h3>
              </div>
              <button
                onClick={() => {
                  setShowPraiseModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-all"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Select Team Member */}
              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-2">
                  Who do you want to recognize? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRecipients.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedRecipient(member.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedRecipient === member.id
                          ? 'border-[#00a884] bg-[#00a884]/10'
                          : 'border-[#222d34] hover:border-[#2a3942] bg-[#0b141a]'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                        {member.avatar ? (
                          <img 
                            src={member.avatar} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover" 
                          />
                        ) : (
                          <span className="text-[#00a884] font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-[#e9edef] text-sm font-medium text-left">{member.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Badge */}
              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-2">
                  Choose a badge *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PRAISE_BADGES.map(badge => {
                    const BadgeIcon = badge.icon;
                    return (
                      <button
                        key={badge.value}
                        onClick={() => setSelectedBadge(badge.value)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          selectedBadge === badge.value
                            ? 'border-[#00a884] bg-[#00a884]/10'
                            : 'border-[#222d34] hover:border-[#2a3942] bg-[#0b141a]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                          <span className="text-2xl">{badge.emoji}</span>
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-[#e9edef] text-sm font-medium">{badge.label}</p>
                          <p className="text-[#8696a0] text-xs mt-0.5">{badge.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[#8696a0] text-xs uppercase tracking-wider mb-1">
                  Add a personal message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share why they deserve this recognition..."
                  rows={3}
                  className="w-full bg-[#0b141a] border border-[#2a3942] text-[#e9edef] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#00a884] placeholder-[#4a5568] resize-none"
                />
              </div>

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => {
                    setShowPraiseModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendPraise}
                  disabled={sending}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#00a884] to-[#008069] hover:from-[#008069] hover:to-[#00a884] text-white disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  {sending && <Spinner />}
                  <Award className="w-4 h-4" />
                  Send Praise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PraiseTab;
