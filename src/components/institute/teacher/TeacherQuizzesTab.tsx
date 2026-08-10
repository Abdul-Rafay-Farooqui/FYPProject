"use client";

import { useState } from "react";
import { InstituteAPI } from "@/lib/api/institute";

export default function TeacherQuizzesTab({
  courseId,
  quizzes,
  onRefresh,
  instituteId,
  currentUserId,
  subjectId,
}: any) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  const handleDeleteQuiz = async (quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      await InstituteAPI.deleteQuiz(quizId);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[#e9edef] text-2xl font-semibold">Quizzes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90"
        >
          + Create Quiz
        </button>
      </div>

      {!courseId ? (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">
            Please select a course to view quizzes
          </p>
        </div>
      ) : quizzes.length === 0 ? (
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
          <p className="text-[#8696a0]">No quizzes yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz: any) => (
            <div
              key={quiz.id}
              className="bg-[#111b21] rounded-lg p-4 border border-[#222d34]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[#e9edef] font-medium mb-2">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-[#8696a0] text-sm mb-2">
                      {quiz.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[#8696a0]">
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span>Total: {quiz.total_marks} marks</span>
                    <span>Duration: {quiz.duration_minutes} min</span>
                    {quiz.is_published ? (
                      <span className="text-green-400">Published</span>
                    ) : (
                      <span className="text-yellow-400">Draft</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedQuiz(quiz)}
                    className="text-[#00a884] hover:text-[#00a884]/80 p-2"
                    title="View questions"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                    title="Delete quiz"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateQuizModal
          courseId={courseId}
          instituteId={instituteId}
          currentUserId={currentUserId}
          subjectId={subjectId}
          onClose={() => setShowCreateModal(false)}
          onRefresh={onRefresh}
        />
      )}

      {selectedQuiz && (
        <ViewQuizModal
          quiz={selectedQuiz}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </div>
  );
}

function CreateQuizModal({
  courseId,
  instituteId,
  currentUserId,
  subjectId,
  onClose,
  onRefresh,
}: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "mcq",
        options: ["", "", "", ""],
        correct_answer: "",
        marks: 1,
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || questions.length === 0) {
      alert("Please add title and at least one question");
      return;
    }

    setLoading(true);
    try {
      const quiz = await InstituteAPI.createQuiz({
        title,
        description,
        duration_minutes: duration,
        total_marks: questions.reduce((sum, q) => sum + q.marks, 0),
        questions,
        institute_id: instituteId,
        teacher_id: currentUserId,
        subject_id: subjectId,
        is_published: true,
      });

      // Automatically create an announcement for the quiz
      try {
        await InstituteAPI.createAnnouncement({
          teacher_id: currentUserId,
          institute_id: instituteId,
          subject_id: subjectId, // Link to the actual subject ID
          announcement_type: "general",
          title: `New Quiz: ${title}`,
          content: `A new quiz "${title}" has been created. ${description ? description : ""} Duration: ${duration} minutes. Total marks: ${questions.reduce((sum, q) => sum + q.marks, 0)}.`,
        });
      } catch (err) {
        console.error("Failed to create announcement:", err);
        // Don't fail the quiz creation if announcement fails
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to create quiz:", error);
      alert("Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111b21] rounded-lg max-w-3xl w-full p-6 border border-[#222d34] my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">
          Create Quiz
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#8696a0] text-sm mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              placeholder="Quiz title"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884] resize-none"
              rows={2}
              placeholder="Quiz description"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] text-sm mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              min="1"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#e9edef] font-medium">Questions</h3>
            <button
              onClick={addQuestion}
              className="px-3 py-1 rounded bg-[#00a884] text-[#0b141a] text-sm hover:bg-[#00a884]/90"
            >
              + Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="p-4 bg-[#0b141a] rounded border border-[#222d34]"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[#e9edef] font-medium">
                    Question {qIndex + 1}
                  </span>
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={q.question_text}
                    onChange={(e) =>
                      updateQuestion(qIndex, "question_text", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-[#111b21] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                    placeholder="Question text"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt: string, oIndex: number) => (
                      <input
                        key={oIndex}
                        type="text"
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, oIndex, e.target.value)
                        }
                        className="px-3 py-2 bg-[#111b21] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[#8696a0] text-xs mb-1">
                        Correct Answer
                      </label>
                      <input
                        type="text"
                        value={q.correct_answer}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "correct_answer",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 bg-[#111b21] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                        placeholder="Correct answer"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[#8696a0] text-xs mb-1">
                        Marks
                      </label>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) =>
                          updateQuestion(
                            qIndex,
                            "marks",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full px-3 py-2 bg-[#111b21] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-[#8696a0] hover:bg-[#1e2a30]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewQuizModal({ quiz, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111b21] rounded-lg max-w-4xl w-full p-6 border border-[#222d34] my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[#e9edef] text-xl font-semibold mb-2">
              {quiz.title}
            </h2>
            {quiz.description && (
              <p className="text-[#8696a0] text-sm">{quiz.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#8696a0] mt-2">
              <span>{quiz.questions?.length || 0} questions</span>
              <span>Total: {quiz.total_marks} marks</span>
              <span>Duration: {quiz.duration_minutes} min</span>
              {quiz.is_published ? (
                <span className="text-green-400">Published</span>
              ) : (
                <span className="text-yellow-400">Draft</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-[#e9edef]"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!quiz.questions || quiz.questions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#8696a0]">No questions in this quiz</p>
          </div>
        ) : (
          <div className="space-y-6">
            {quiz.questions.map((question: any, index: number) => (
              <div
                key={question.id}
                className="p-4 bg-[#0b141a] rounded border border-[#222d34]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[#00a884] font-medium">
                        Question {index + 1}
                      </span>
                      <span className="text-xs text-[#8696a0]">
                        ({question.marks}{" "}
                        {question.marks === 1 ? "mark" : "marks"})
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#1e2a30] text-[#8696a0]">
                        {question.question_type === "mcq"
                          ? "Multiple Choice"
                          : question.question_type === "true_false"
                            ? "True/False"
                            : "Short Answer"}
                      </span>
                    </div>
                    <p className="text-[#e9edef]">{question.question_text}</p>
                  </div>
                </div>

                {question.question_type === "mcq" && question.options && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[#8696a0] text-sm mb-2">Options:</p>
                    {question.options.map(
                      (option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border ${
                            option.toLowerCase().trim() ===
                            question.correct_answer.toLowerCase().trim()
                              ? "border-green-500 bg-green-500/10"
                              : "border-[#222d34]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[#8696a0] text-sm">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="text-[#e9edef] text-sm">
                              {option}
                            </span>
                            {option.toLowerCase().trim() ===
                              question.correct_answer.toLowerCase().trim() && (
                              <span className="ml-auto text-green-400 text-xs">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {question.question_type === "true_false" && (
                  <div className="mt-3">
                    <p className="text-[#8696a0] text-sm mb-2">
                      Correct Answer:
                    </p>
                    <div className="p-2 rounded border border-green-500 bg-green-500/10 inline-block">
                      <span className="text-green-400 font-medium">
                        {question.correct_answer}
                      </span>
                    </div>
                  </div>
                )}

                {question.question_type === "short_answer" && (
                  <div className="mt-3">
                    <p className="text-[#8696a0] text-sm mb-2">
                      Expected Answer:
                    </p>
                    <div className="p-2 rounded border border-[#222d34] bg-[#111b21]">
                      <span className="text-[#e9edef] text-sm">
                        {question.correct_answer}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
