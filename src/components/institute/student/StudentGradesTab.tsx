"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { BookOpen, TrendingUp, Award, Calendar } from "lucide-react";

interface StudentGradesTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh: () => void;
}

interface SubjectGrades {
  subject_id: string;
  subject_name: string;
  subject_code?: string;
  results: any[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  averageGrade?: string;
}

export default function StudentGradesTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentGradesTabProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [groupedGrades, setGroupedGrades] = useState<SubjectGrades[]>([]);

  useEffect(() => {
    fetchGrades();
  }, [currentUserId, enrolledSubjectIds]);

  const fetchGrades = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      // Fetch subjects and results in parallel
      const [subjectsData, resultsData] = await Promise.all([
        InstituteAPI.getSubjects(instituteId),
        InstituteAPI.getResults({ student_id: currentUserId }),
      ]);

      setSubjects(subjectsData);
      setResults(resultsData);

      // Group results by subject
      const grouped = groupResultsBySubject(subjectsData, resultsData);
      setGroupedGrades(grouped);
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupResultsBySubject = (
    subjectsData: any[],
    resultsData: any[],
  ): SubjectGrades[] => {
    // Filter subjects by enrolled subject IDs
    const enrolledSubjects = subjectsData.filter((subject) =>
      enrolledSubjectIds.includes(subject.id),
    );

    return enrolledSubjects.map((subject) => {
      // Get all results for this subject
      const subjectResults = resultsData.filter(
        (result) => result.subject_id === subject.id,
      );

      // Calculate totals
      const totalMarks = subjectResults.reduce(
        (sum, result) => sum + Number(result.total_marks),
        0,
      );
      const obtainedMarks = subjectResults.reduce(
        (sum, result) => sum + Number(result.marks_obtained),
        0,
      );
      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      // Calculate average grade
      const grades = subjectResults
        .filter((r) => r.grade)
        .map((r) => r.grade);
      const averageGrade = grades.length > 0 ? getMostCommonGrade(grades) : undefined;

      return {
        subject_id: subject.id,
        subject_name: subject.name,
        subject_code: subject.code,
        results: subjectResults,
        totalMarks,
        obtainedMarks,
        percentage,
        averageGrade,
      };
    });
  };

  const getMostCommonGrade = (grades: string[]): string => {
    const frequency: { [key: string]: number } = {};
    grades.forEach((grade) => {
      frequency[grade] = (frequency[grade] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b,
    );
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 75) return "text-blue-400";
    if (percentage >= 60) return "text-yellow-400";
    if (percentage >= 50) return "text-orange-400";
    return "text-red-400";
  };

  const getGradeBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500/10 border-green-500/30";
    if (percentage >= 75) return "bg-blue-500/10 border-blue-500/30";
    if (percentage >= 60) return "bg-yellow-500/10 border-yellow-500/30";
    if (percentage >= 50) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (groupedGrades.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <Award className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No grades available yet</p>
        <p className="text-[#8696a0] text-sm mt-2">
          Grades will appear here once your teachers publish them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111b21] rounded-lg border border-[#2a3942] p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#00a884]" />
            <div>
              <p className="text-[#8696a0] text-sm">Enrolled Courses</p>
              <p className="text-[#e9edef] text-2xl font-bold">
                {groupedGrades.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#111b21] rounded-lg border border-[#2a3942] p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-[#8696a0] text-sm">Average Score</p>
              <p className="text-[#e9edef] text-2xl font-bold">
                {groupedGrades.length > 0
                  ? (
                      groupedGrades.reduce((sum, g) => sum + g.percentage, 0) /
                      groupedGrades.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#111b21] rounded-lg border border-[#2a3942] p-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-[#8696a0] text-sm">Total Assessments</p>
              <p className="text-[#e9edef] text-2xl font-bold">
                {results.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupedGrades.map((subjectGrade) => (
          <div
            key={subjectGrade.subject_id}
            className={`bg-[#111b21] rounded-lg border p-6 ${getGradeBgColor(subjectGrade.percentage)}`}
          >
            {/* Subject Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#e9edef]">
                  {subjectGrade.subject_name}
                </h3>
                {subjectGrade.subject_code && (
                  <p className="text-sm text-[#8696a0]">
                    {subjectGrade.subject_code}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`text-3xl font-bold ${getGradeColor(subjectGrade.percentage)}`}
                >
                  {subjectGrade.percentage.toFixed(1)}%
                </p>
                {subjectGrade.averageGrade && (
                  <p className="text-sm text-[#8696a0] mt-1">
                    Grade: {subjectGrade.averageGrade}
                  </p>
                )}
              </div>
            </div>

            {/* Score Summary */}
            <div className="mb-4 pb-4 border-b border-[#2a3942]">
              <div className="flex justify-between text-sm">
                <span className="text-[#8696a0]">Total Marks</span>
                <span className="text-[#e9edef] font-medium">
                  {subjectGrade.obtainedMarks} / {subjectGrade.totalMarks}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-[#2a3942] rounded-full h-2 mt-2">
                <div
                  className="bg-[#00a884] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(subjectGrade.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-2">
              <p className="text-xs text-[#8696a0] font-medium mb-2">
                ASSESSMENTS ({subjectGrade.results.length})
              </p>
              {subjectGrade.results.map((result) => (
                <div
                  key={result.id}
                  className="flex justify-between items-center text-sm bg-[#0b141a] rounded p-2"
                >
                  <div className="flex-1">
                    <p className="text-[#e9edef] font-medium">
                      {result.result_type.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                      <Calendar className="w-3 h-3" />
                      {new Date(result.published_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#e9edef] font-semibold">
                      {result.marks_obtained} / {result.total_marks}
                    </p>
                    {result.grade && (
                      <p className="text-xs text-[#8696a0]">{result.grade}</p>
                    )}
                  </div>
                </div>
              ))}
              {subjectGrade.results.length === 0 && (
                <p className="text-xs text-[#8696a0] text-center py-2">
                  No assessments yet
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
