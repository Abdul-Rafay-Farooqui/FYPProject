'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';

export default function StudentAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (user) fetchAnnouncements();
    else setLoading(false);
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const data = await api.get(`/api/announcements?student_id=${user?.id}`);
      setAnnouncements(data);
    } catch (error) { 
      console.error('Error fetching announcements:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#e9edef] mb-6">Announcements</h1>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="rounded-xl p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold text-[#e9edef]">{announcement.title}</h3>
                <p className="text-sm text-[#8696a0]">From: {announcement.teacher?.name}</p>
                {announcement.announcement_type === 'individual' && <span className="inline-block mt-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">Direct Message to You</span>}
              </div>
              <p className="text-sm text-[#8696a0]">{new Date(announcement.published_date).toLocaleDateString()}</p>
            </div>
            <p className="text-[#d1d7db] mt-4 whitespace-pre-wrap">{announcement.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No announcements yet.</p></div>}
      </div>
    </div>
  );
}
