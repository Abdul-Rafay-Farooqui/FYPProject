"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { UserCircle, Plus, Edit2, Trash2, Award, TrendingUp } from "lucide-react";

interface StudentGradeData {
  student: any;
  results: any[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  averageGrade?: string;
}

export default function TeacherGradesTab({
  courseId,
  students,
  results,
  onRefresh,
  currentUserId,
  subjectId,
  instituteId,
}: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingResult, setEditingResult] = useState<any>(null);

  console.log("📊 [TeacherGradesTab] Received props:", {
    courseId,
    subjectId,
    studentsCount: students?.length || 0,
    students,
    resultsCount: results?.length || 0,
  });

  // Group results by student
  const studentGrades: StudentGradeData[] = students.map((student: any) => {
    const studentId = student.user_id || student.id;
    const studentResults = results?.filter(
      (r: any) => r.student_id === studentId
    ) || [];

    const totalObtained = studentResults.reduce(
      (sum: number, r: any) => sum + Number(r.marks_obtained),
      0
    );
    const totalMax = studentResults.reduce(
      (sum: number, r: any) => sum + Number(r.total_marks),
      0
    );
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    return {
      student,
      results: studentResults,
      totalObtained,
      totalMax,
      percentage,
    };
  });

  const handleAddGrade = (student: any) => {
    setSelectedStudent(student);
    setEditingResult(null);
    setShowAddModal(true);
  };

  const handleEditGrade = (result: any, student: any) => {
    setSelectedStudent(student);
    setEditingResult(result);
    setShowAddModal(true);
  };

  const handleDeleteGrade = async (resultId: string) => {
    if (!confirm("Are you sure you want to delete this grade?")) return;

    try {
      await InstituteAPI.deleteResult(resultId);
      onRefresh();
    } catch (error) {
      alert("Failed to delete grade");
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 75) return "text-blue-400";
    if (percentage >= 60) return "text-yellow-400";
    if (percentage >= 50) return "text-orange-400";
    return "text-red-400";
  };

  if (!courseId) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8696a0]">Please select a course</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <Award className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No students enrolled in this course</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Student Grades</h2>
        <div className="text-sm text-[#8696a0]">
          {students.length} Students • {results?.length || 0} Total Grades
        </div>
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {studentGrades.map((studentData) => {
          const studentId = studentData.student.user_id || studentData.student.id;
          const studentName =
            studentData.student.user?.display_name ||
            studentData.student.user?.email ||
            studentData.student.display_name ||
            studentData.student.email ||
            "Unknown Student";

          return (
            <div
              key={studentId}
              className="bg-[#111b21] rounded-lg border border-[#2a3942] p-5 hover:border-[#00a884] transition-colors"
            >
              {/* Student Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#00a884]/10 rounded-full flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-[#00a884]" />
                  </div>
                  <div>
                    <h3 className="text-[#e9edef] font-medium">{studentName}</h3>
                    <p className="text-sm text-[#8696a0]">
                      {studentData.results.length} assessment{studentData.results.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddGrade(studentData.student)}
                  className="p-2 hover:bg-[#00a884]/10 rounded-lg text-[#00a884] transition-colors"
                  title="Add Grade"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Score */}
              {studentData.results.length > 0 && (
                <div className="mb-4 pb-4 border-b border-[#2a3942]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#8696a0]">Overall Score</span>
                    <span
                      className={`text-2xl font-bold ${getPercentageColor(studentData.percentage)}`}
                    >
                      {studentData.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8696a0] mb-2">
                    <span>Total Marks</span>
                    <span>
                      {studentData.totalObtained} / {studentData.totalMax}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-[#2a3942] rounded-full h-1.5">
                    <div
                      className="bg-[#00a884] h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(studentData.percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Individual Results */}
              <div className="space-y-2">
                {studentData.results.length > 0 ? (
                  <>
                    <p className="text-xs text-[#8696a0] font-medium mb-2">
                      ASSESSMENTS
                    </p>
                    {studentData.results.map((result) => (
                      <div
                        key={result.id}
                        className="bg-[#0b141a] rounded-lg p-3 group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-[#e9edef] font-medium text-sm capitalize">
                              {result.result_type}
                            </p>
                            <p className="text-xs text-[#8696a0]">
                              {new Date(result.published_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditGrade(result, studentData.student)}
                              className="p-1.5 hover:bg-[#00a884]/10 rounded text-[#00a884] opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(result.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#e9edef] font-semibold">
                            {result.marks_obtained} / {result.total_marks}
                          </span>
                          {result.grade && (
                            <span className="px-2 py-0.5 bg-[#00a884]/20 text-[#00a884] text-xs rounded">
                              {result.grade}
                            </span>
                          )}
                        </div>
                        {result.remarks && (
                          <p className="text-xs text-[#8696a0] mt-2 italic">
                            "{result.remarks}"
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#8696a0]" />
                    <p className="text-xs text-[#8696a0] mb-3">No grades yet</p>
                    <button
                      onClick={() => handleAddGrade(studentData.student)}
                      className="text-xs px-3 py-1.5 bg-[#00a884] text-[#0b141a] rounded hover:bg-[#00a884]/90"
                    >
                      Add First Grade
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Grade Modal */}
      {showAddModal && (
        <GradeModal
          student={selectedStudent}
          editingResult={editingResult}
          courseId={courseId}
          currentUserId={currentUserId}
          subjectId={subjectId}
          instituteId={instituteId}
          onClose={() => {
            setShowAddModal(false);
            setSelectedStudent(null);
            setEditingResult(null);
          }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

function GradeModal({
  student,
  editingResult,
  courseId,
  currentUserId,
  subjectId,
  instituteId,
  onClose,
  onRefresh,
}: any) {
  const [resultType, setResultType] = useState(editingResult?.result_type || "exam");
  const [marksObtained, setMarksObtained] = useState(
    editingResult?.marks_obtained?.toString() || ""
  );
  const [totalMarks, setTotalMarks] = useState(
    editingResult?.total_marks?.toString() || ""
  );
  const [grade, setGrade] = useState(editingResult?.grade || "");
  const [remarks, setRemarks] = useState(editingResult?.remarks || "");
  const [loading, setLoading] = useState(false);

  const studentId = student.user_id || student.id;
  const studentName =
    student.user?.display_name ||
    student.user?.email ||
    student.display_name ||
    student.email ||
    "Unknown Student";

  const handleSubmit = async () => {
    if (!marksObtained || !totalMarks) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);
    try {
      if (editingResult) {
        // Update existing result
        await InstituteAPI.updateResult(editingResult.id, {
          result_type: resultType,
          marks_obtained: parseFloat(marksObtained),
          total_marks: parseFloat(totalMarks),
          grade: grade || undefined,
          remarks: remarks || undefined,
        });
      } else {
        // Create new result
        await InstituteAPI.createResult({
          student_id: studentId,
          teacher_id: currentUserId,
          class_batch_section_id: courseId,
          subject_id: subjectId,
          result_type: resultType,
          marks_obtained: parseFloat(marksObtained),
          total_marks: parseFloat(totalMarks),
          grade: grade || undefined,
          remarks: remarks || undefined,
        });
      }
      onRefresh();
      onClose();
    } catch (error) {
      alert(`Failed to ${editingResult ? "update" : "add"} grade`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#2a3942]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-2">
          {editingResult ? "Edit Grade" : "Add Grade"}
        </h2>
        <p className="text-[#8696a0] text-sm mb-6">for {studentName}</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Assessment Type *
            </label>
            <select
              value={resultType}
              onChange={(e) => setResultType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
            >
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Marks Obtained *
              </label>
              <input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[#8696a0] text-sm mb-2">
                Total Marks *
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                placeholder="100"
                min="0"
              />
            </div>
          </div>

          {marksObtained && totalMarks && (
            <div className="bg-[#00a884]/10 border border-[#00a884]/30 rounded-lg p-3">
              <p className="text-xs text-[#8696a0] mb-1">Percentage</p>
              <p className="text-2xl font-bold text-[#00a884]">
                {((parseFloat(marksObtained) / parseFloat(totalMarks)) * 100).toFixed(1)}%
              </p>
            </div>
          )}

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Grade (Optional)
            </label>
            <input
              type="text"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="A+, B, C, etc."
              maxLength={3}
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#2a3942] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={3}
              placeholder="Additional feedback for the student..."
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#2a3942] transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50 transition-colors"
            disabled={loading}
          >
            {loading
              ? editingResult
                ? "Updating..."
                : "Adding..."
              : editingResult
              ? "Update Grade"
              : "Add Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}
