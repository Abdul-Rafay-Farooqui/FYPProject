"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import QuizAttemptModal from "./QuizAttemptModal";

interface StudentQuizzesTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh?: () => void;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  duration_minutes?: number;
  is_published: boolean;
  teacher?: { id: string; display_name: string };
  subject?: { id: string; name: string };
  questions?: any[];
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score?: number;
  total_marks?: number;
  status: "in_progress" | "submitted";
  attempted_at: string;
  submitted_at?: string;
}

export default function StudentQuizzesTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentQuizzesTabProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [showAttemptModal, setShowAttemptModal] = useState(false);

  useEffect(() => {
    loadQuizzes();
    loadAttempts();
  }, [currentUserId, enrolledSubjectIds]);

  const loadQuizzes = async () => {
    try {
      if (enrolledSubjectIds.length === 0) {
        setQuizzes([]);
        return;
      }

      setLoading(true);
      const subjectIdString = enrolledSubjectIds.join(",");
      const data = await InstituteAPI.getQuizzes({
        subject_ids: subjectIdString,
        is_published: "true",
      });
      setQuizzes(data || []);
    } catch (error) {
      console.error("Failed to load quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const data = await InstituteAPI.getMyQuizAttempts();
      setAttempts(data || []);
    } catch (error) {
      console.error("Failed to load attempts:", error);
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      setShowAttemptModal(true);
    } catch (error: any) {
      console.error("Failed to start quiz:", error);
      alert(
        error.response?.data?.message ||
          "Failed to start quiz. You may have already completed it.",
      );
    }
  };

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const quizAttempts = attempts.filter((a) => a.quiz_id === selectedQuizId);
  const hasAttempted = quizAttempts.length > 0;

  if (loading) {
    return <div className="text-[#8696a0]">Loading quizzes...</div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#8696a0]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <p className="text-[#8696a0]">
          No quizzes in your enrolled courses yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quizzes List */}
      <div className="lg:col-span-1">
        <h3 className="text-[#e9edef] text-lg font-semibold mb-4">Quizzes</h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
          {quizzes.map((quiz) => {
            const attempt = attempts.find((a) => a.quiz_id === quiz.id);

            return (
              <button
                key={quiz.id}
                onClick={() => setSelectedQuizId(quiz.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedQuizId === quiz.id
                    ? "border-[#00a884] bg-[#00a884]/10"
                    : "border-[#222d34] bg-[#111b21] hover:border-[#00a884]/50"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-[#e9edef] font-medium text-sm">
                      {quiz.title}
                    </p>
                    <p className="text-[#8696a0] text-xs mt-1">
                      {quiz.subject?.name}
                    </p>
                  </div>
                  {attempt ? (
                    <span className="text-xs bg-green-400/20 text-green-400 px-2 py-1 rounded">
                      Attempted
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-[#8696a0] text-xs">
                  {quiz.total_marks} marks • {quiz.duration_minutes || "∞"} mins
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz Details */}
      <div className="lg:col-span-2">
        {selectedQuiz ? (
          <div className="bg-[#111b21] rounded-lg border border-[#222d34] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[#e9edef] text-2xl font-semibold">
                  {selectedQuiz.title}
                </h2>
                <p className="text-[#00a884] text-sm font-medium mt-2">
                  {selectedQuiz.subject?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#8696a0] text-sm">Status</p>
                <p className="text-[#e9edef] font-medium">
                  {hasAttempted ? (
                    <span className="text-green-400">Attempted</span>
                  ) : (
                    <span className="text-yellow-400">Pending</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {selectedQuiz.description && (
                <div>
                  <h3 className="text-[#e9edef] font-semibold mb-2">
                    Description
                  </h3>
                  <p className="text-[#8696a0]">{selectedQuiz.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 bg-[#0b141a] rounded-lg p-4">
                <div>
                  <p className="text-[#8696a0] text-sm">Total Marks</p>
                  <p className="text-[#e9edef] font-medium text-lg">
                    {selectedQuiz.total_marks}
                  </p>
                </div>
                <div>
                  <p className="text-[#8696a0] text-sm">Duration</p>
                  <p className="text-[#e9edef] font-medium text-lg">
                    {selectedQuiz.duration_minutes ? (
                      `${selectedQuiz.duration_minutes} mins`
                    ) : (
                      <span>No limit</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[#8696a0] text-sm">Questions</p>
                  <p className="text-[#e9edef] font-medium text-lg">
                    {selectedQuiz.questions?.length || 0}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[#8696a0] text-sm">Teacher</p>
                <p className="text-[#e9edef]">
                  {selectedQuiz.teacher?.display_name || "Unknown"}
                </p>
              </div>
            </div>

            {/* Attempts History */}
            {quizAttempts.length > 0 && (
              <div className="bg-[#0b141a] rounded-lg border border-[#222d34] p-4 mb-6">
                <h3 className="text-[#e9edef] font-semibold mb-3">
                  Your Attempts
                </h3>
                <div className="space-y-2">
                  {quizAttempts.map((attempt, idx) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-2 bg-[#111b21] rounded"
                    >
                      <span className="text-[#8696a0] text-sm">
                        Attempt {idx + 1} •{" "}
                        {new Date(attempt.attempted_at).toLocaleDateString()}
                      </span>
                      {attempt.score !== undefined && (
                        <span className="text-[#e9edef] font-medium">
                          {attempt.score}/{attempt.total_marks} marks
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => handleStartQuiz(selectedQuiz.id)}
              disabled={hasAttempted}
              className="w-full px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasAttempted ? "Already Attempted" : "Start Quiz"}
            </button>
          </div>
        ) : (
          <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#222d34]">
            <p className="text-[#8696a0]">Select a quiz to view details</p>
          </div>
        )}
      </div>

      {showAttemptModal && selectedQuizId && (
        <QuizAttemptModal
          quizId={selectedQuizId}
          onClose={() => setShowAttemptModal(false)}
          onSubmit={() => {
            loadAttempts();
            setShowAttemptModal(false);
          }}
        />
      )}
    </div>
  );
}
