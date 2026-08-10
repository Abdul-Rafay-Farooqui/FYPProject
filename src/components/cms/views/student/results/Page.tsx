'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/cms/api';
import { useAuth } from '@/contexts/cms/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiDownload } from 'react-icons/fi';

export default function StudentResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchResults(); }, [user]);

  const fetchResults = async () => {
    try { const data = await api.get(`/api/results?student_id=${user?.id}`); setResults(data); }
    catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text('Student Result Report', 14, 20);
    doc.setFontSize(12); doc.text(`Student: ${user?.display_name}`, 14, 30); doc.text(`Email: ${user?.email}`, 14, 37); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 44);
    const tableData = results.map(r => [r.subject?.name || 'N/A', r.result_type.toUpperCase(), `${r.marks_obtained}/${r.total_marks}`, r.grade || 'N/A', r.teacher?.name || 'N/A', new Date(r.published_date).toLocaleDateString()]);
    autoTable(doc, { startY: 50, head: [['Subject', 'Type', 'Marks', 'Grade', 'Teacher', 'Date']], body: tableData, theme: 'grid', headStyles: { fillColor: [59, 130, 246] } });
    doc.save(`${user?.display_name}_results.pdf`);
  };

  const groupedResults = results.reduce((acc, result) => { const type = result.result_type; if (!acc[type]) acc[type] = []; acc[type].push(result); return acc; }, {} as Record<string, any[]>);

  if (loading) return (<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div></div>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#e9edef]">My Results</h1>
        {results.length > 0 && (<button onClick={generatePDF} className="flex items-center space-x-2 bg-[#00a884] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"><FiDownload /><span>Download PDF</span></button>)}
      </div>

      {Object.keys(groupedResults).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, typeResults]) => (
            <div key={type} className="rounded-xl p-6" style={{ background: "#111b21", border: "1px solid #222d34" }}>
              <h2 className="text-xl font-semibold text-[#e9edef] mb-4 capitalize">{type}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#222d34]">
                  <thead className="bg-[#111b21]"><tr><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Subject</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Marks</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Grade</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Teacher</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-medium text-[#8696a0] uppercase">Remarks</th></tr></thead>
                  <tbody className=" divide-y divide-[#222d34]">
                    {typeResults.map((result) => (
                      <tr key={result.id}>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-[#e9edef]">{result.subject?.name || 'N/A'}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-[#e9edef]">{result.marks_obtained}/{result.total_marks}</div><div className="text-xs text-[#8696a0]">{Math.round((result.marks_obtained / result.total_marks) * 100)}%</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800' : result.grade === 'B' || result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{result.grade}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{result.teacher?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8696a0]">{new Date(result.published_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-sm text-[#8696a0]">{result.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (<div className="rounded-xl p-12 text-center" style={{ background: "#111b21", border: "1px solid #222d34" }}><p className="text-[#8696a0]">No results published yet.</p></div>)}
    </div>
  );
}
