"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";

interface QuizAttemptModalProps {
  quizId: string;
  onClose: () => void;
  onSubmit: () => void;
}

interface Question {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "short_answer";
  options?: string | string[];
  correct_answer?: string;
  marks: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  duration_minutes?: number;
  questions: Question[];
}

export default function QuizAttemptModal({
  quizId,
  onClose,
  onSubmit,
}: QuizAttemptModalProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializeAttempt();
  }, [quizId]);

  const initializeAttempt = async () => {
    try {
      setLoading(true);

      // Start the attempt
      const attemptData = await InstituteAPI.startQuizAttempt(quizId);
      setAttempt(attemptData);

      // Get quiz details with questions
      const quizData = await InstituteAPI.getQuiz(quizId);
      setQuiz(quizData);

      // Initialize answers object
      const initialAnswers: Record<string, string> = {};
      if (quizData.questions) {
        quizData.questions.forEach((q: Question) => {
          initialAnswers[q.id] = "";
        });
      }
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Failed to initialize quiz attempt:", error);
      alert("Failed to start quiz. Please try again.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Prepare answers in the format expected by backend
      const formattedAnswers = quiz!.questions.map((q: Question) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));

      // Submit the quiz
      const result = await InstituteAPI.submitQuizAttempt(attempt.id, {
        answers: formattedAnswers,
      });

      // Set score and show result
      setScore(result.score || 0);
      setShowResult(true);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (showResult) {
      onSubmit();
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#111b21] rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-48">
            <div className="text-[#8696a0]">Loading quiz...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#111b21] rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-48">
            <div className="text-[#8696a0]">Failed to load quiz</div>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = ((score / quiz.total_marks) * 100).toFixed(1);
    const isPassed = score >= quiz.total_marks * 0.5;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#111b21] rounded-lg p-8 max-w-md w-full mx-4 border border-[#222d34]">
          <div className="text-center">
            <div
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isPassed ? "bg-green-400/20" : "bg-red-400/20"
              }`}
            >
              {isPassed ? (
                <svg
                  className="w-10 h-10 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2"
                  />
                </svg>
              )}
            </div>

            <h2 className="text-[#e9edef] text-2xl font-semibold mb-2">
              {isPassed ? "Quiz Passed!" : "Quiz Completed"}
            </h2>

            <div className="mb-6">
              <p className="text-[#8696a0] text-sm mb-2">Your Score</p>
              <p className="text-[#e9edef] text-4xl font-bold">
                {score}/{quiz.total_marks}
              </p>
              <p className="text-[#8696a0] text-sm mt-2">{percentage}%</p>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#111b21] rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-48">
            <div className="text-[#8696a0]">No questions in this quiz</div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const optionsArray = Array.isArray(currentQuestion.options)
    ? currentQuestion.options
    : currentQuestion.options
    ? currentQuestion.options.split(",").map((o: string) => o.trim())
    : [];
  const currentAnswer = answers[currentQuestion.id] || "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111b21] rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#222d34]">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[#e9edef] text-2xl font-semibold">
              {quiz.title}
            </h2>
            <p className="text-[#8696a0] text-sm mt-1">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef]"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-[#0b141a] rounded-full h-2">
            <div
              className="bg-[#00a884] h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-[#e9edef] text-lg font-medium mb-2">
            {currentQuestion.question_text}
          </h3>
          <p className="text-[#8696a0] text-sm">
            {currentQuestion.marks} marks
          </p>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.question_type === "true_false" ? (
            <>
              {["True", "False"].map((option) => (
                <label
                  key={option}
                  className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                  style={{
                    borderColor:
                      currentAnswer === option ? "#00a884" : "#222d34",
                    backgroundColor:
                      currentAnswer === option ? "#00a884/10" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="text-[#e9edef]">{option}</span>
                </label>
              ))}
            </>
          ) : currentQuestion.question_type === "mcq" ? (
            <>
              {optionsArray.map((option, idx) => (
                <label
                  key={idx}
                  className="flex items-center p-3 border rounded-lg cursor-pointer transition-colors"
                  style={{
                    borderColor:
                      currentAnswer === option ? "#00a884" : "#222d34",
                    backgroundColor:
                      currentAnswer === option ? "#00a884/10" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="mr-3"
                  />
                  <span className="text-[#e9edef]">{option}</span>
                </label>
              ))}
            </>
          ) : (
            <>
              <textarea
                value={currentAnswer}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
                placeholder="Enter your answer..."
                className="w-full px-4 py-3 rounded-lg bg-[#0b141a] border border-[#222d34] text-[#e9edef] placeholder-[#8696a0] focus:border-[#00a884] focus:outline-none min-h-32 resize-none"
              />
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="flex-1 px-4 py-2 rounded-lg border border-[#222d34] text-[#e9edef] hover:bg-[#0b141a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex(
                  Math.min(quiz.questions.length - 1, currentQuestionIndex + 1),
                )
              }
              className="flex-1 px-4 py-2 rounded-lg bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors font-medium"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Indicators */}
        <div className="mt-6 pt-6 border-t border-[#222d34]">
          <p className="text-[#8696a0] text-sm mb-3">Questions:</p>
          <div className="grid grid-cols-6 gap-2">
            {quiz.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                  idx === currentQuestionIndex
                    ? "bg-[#00a884] text-[#0b141a]"
                    : answers[quiz.questions[idx].id]
                      ? "bg-[#00a884]/20 text-[#00a884]"
                      : "bg-[#0b141a] text-[#8696a0] border border-[#222d34]"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
