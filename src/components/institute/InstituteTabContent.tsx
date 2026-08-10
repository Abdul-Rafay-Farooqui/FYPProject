"use client";

import { useState, useEffect } from "react";
import { InstituteData } from "@/hooks/useInstituteWorkspace";
import { InstituteAPI } from "@/lib/api/institute";
import MembersTab from "./tabs/MembersTab";
import BatchesTab from "./tabs/BatchesTab";
import SectionsTab from "./tabs/SectionsTab";
import SubjectsTab from "./tabs/SubjectsTab";
import AttendanceTab from "./tabs/AttendanceTab";
import HomeworkTab from "./tabs/HomeworkTab";
import ResultsTab from "./tabs/ResultsTab";
import SchedulesTab from "./tabs/SchedulesTab";
import AnnouncementsTab from "./tabs/AnnouncementsTab";
import StudentOverview from "./student/StudentOverview";
import StudentCoursesTab from "./student/StudentCoursesTab";
import StudentAssignmentsTab from "./student/StudentAssignmentsTab";
import StudentQuizzesTab from "./student/StudentQuizzesTab";
import StudentLiveClassesTab from "./student/StudentLiveClassesTab";
import StudentAnnouncementsTab from "./student/StudentAnnouncementsTab";
import StudentGradesTab from "./student/StudentGradesTab";
import StudentDiscussionTab from "./student/StudentDiscussionTab";
import StudentResourcesTab from "./student/StudentResourcesTab";
import TeacherOverview from "./teacher/TeacherOverview";
import AdminOverview from "./admin/AdminOverview";
import TeacherCourseOverview from "./teacher/TeacherCourseOverview";
import TeacherQuizzesTab from "./teacher/TeacherQuizzesTab";
import TeacherAssignmentsTab from "./teacher/TeacherAssignmentsTab";
import TeacherLiveClassesTab from "./teacher/TeacherLiveClassesTab";
import TeacherGradesTab from "./teacher/TeacherGradesTab";
import TeacherDiscussionTab from "./teacher/TeacherDiscussionTab";
import TeacherResourcesTab from "./teacher/TeacherResourcesTab";
import TeacherAttendanceTab from "./teacher/TeacherAttendanceTab";

interface InstituteTabContentProps {
  activeTab: string;
  instituteData: InstituteData;
  selectedInstitute: string;
  userRole: "admin" | "teacher" | "student";
  currentUserId?: string;
  currentUserName?: string;
  onRemoveMember: (memberId: string) => void;
  onUpdateMemberRole: (
    memberId: string,
    role: "admin" | "teacher" | "student",
  ) => void;
  onRefresh: () => void;
  selectedCourse?: string | null;
}

export default function InstituteTabContent({
  activeTab,
  instituteData,
  selectedInstitute,
  userRole,
  currentUserId,
  currentUserName,
  onRemoveMember,
  onUpdateMemberRole,
  onRefresh,
  selectedCourse,
}: InstituteTabContentProps) {
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([]);
  const isAdmin = userRole === "admin";

  // Fetch enrolled subject IDs for students
  useEffect(() => {
    if (userRole === "student" && currentUserId) {
      const fetchEnrolledSubjects = async () => {
        try {
          const enrollments = await InstituteAPI.getCourseEnrollments({
            student_id: currentUserId,
            institute_id: selectedInstitute,
          });
          const subjectIds = enrollments.map((e: any) => e.subject_id);
          setEnrolledSubjectIds(subjectIds);
        } catch (error) {
          console.error("Failed to fetch enrolled subjects:", error);
        }
      };
      fetchEnrolledSubjects();
    }
  }, [userRole, currentUserId, selectedInstitute]);

  // Handle overview tab based on role
  if (activeTab === "overview") {
    if (userRole === "student") {
      return (
        <StudentOverview 
          instituteId={selectedInstitute}
          currentUserId={currentUserId}
        />
      );
    } else if (userRole === "teacher") {
      if (!selectedCourse) {
        return (
          <div className="text-center py-12">
            <p className="text-[#8696a0]">
              Please select a course from the dropdown above
            </p>
          </div>
        );
      }
      return (
        <TeacherCourseOverview
          courseId={selectedCourse}
          instituteId={selectedInstitute}
        />
      );
    } else {
      return <AdminOverview instituteId={selectedInstitute} />;
    }
  }

  // Student-specific tabs
  if (userRole === "student") {
    switch (activeTab) {
      case "courses":
        return (
          <StudentCoursesTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            onRefresh={onRefresh}
          />
        );
      case "assignments":
        return (
          <StudentAssignmentsTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "quizzes":
        return (
          <StudentQuizzesTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "live-classes":
        return (
          <StudentLiveClassesTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            currentUserName={currentUserName || "Student"}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "grades":
        return (
          <StudentGradesTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "announcements":
        return (
          <StudentAnnouncementsTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "discussion":
        return (
          <StudentDiscussionTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      case "resources":
        return (
          <StudentResourcesTab
            instituteId={selectedInstitute}
            currentUserId={currentUserId || ""}
            enrolledSubjectIds={enrolledSubjectIds}
            onRefresh={onRefresh}
          />
        );
      default:
        return <div className="text-[#8696a0]">Select a tab</div>;
    }
  }

  // Teacher-specific tabs
  if (userRole === "teacher") {
    if (!selectedCourse) {
      return (
        <div className="text-center py-12">
          <p className="text-[#8696a0]">
            Please select a course from the dropdown above
          </p>
        </div>
      );
    }

    // Get the subject ID from the selected course (SubjectAssignment)
    const selectedAssignment = instituteData.subjectAssignments?.find(
      (sa: any) => sa.id === selectedCourse,
    );
    const subjectId = selectedAssignment?.subject_id;


    // Filter data by selected course using subject_id
    // For quizzes: Only include if teacher_id matches AND subject_id exactly matches
    const courseQuizzes =
      instituteData.quizzes?.filter(
        (q: any) =>
          q.teacher_id === currentUserId && q.subject_id === subjectId,
      ) || [];

    const courseResults =
      instituteData.results?.filter(
        (r: any) =>
          r.teacher_id === currentUserId && r.subject_id === subjectId,
      ) || [];


    const courseAssignments =
      instituteData.homework?.filter(
        (h: any) =>
          h.teacher_id === currentUserId && h.subject_id === subjectId,
      ) || [];
    const courseSubmissions =
      instituteData.homeworkSubmissions?.filter((s: any) =>
        courseAssignments.some((a: any) => a.id === s.homework_id),
      ) || [];
    const courseLiveClasses =
      instituteData.liveClasses?.filter(
        (lc: any) =>
          lc.teacher_id === currentUserId && lc.subject_id === subjectId,
      ) || [];
    const courseDiscussions =
      instituteData.discussions?.filter(
        (d: any) =>
          d.teacher_id === currentUserId && 
          d.subject_id === subjectId &&
          !d.parent_id, // Exclude replies - only show parent discussions
      ) || [];
    const courseResources =
      instituteData.resources?.filter(
        (r: any) =>
          r.teacher_id === currentUserId && r.subject_id === subjectId,
      ) || [];
    const courseAnnouncements =
      instituteData.announcements?.filter(
        (a: any) =>
          a.teacher_id === currentUserId && a.subject_id === subjectId,
      ) || [];

    // Get students enrolled in this specific course/subject
    const courseStudents =
      instituteData.courseEnrollments
        ?.filter((enrollment: any) => enrollment.subject_id === subjectId)
        .map((enrollment: any) => {
          // Find the student member data
          const studentMember = instituteData.members?.find(
            (m: any) => m.user_id === enrollment.student_id
          );
          return {
            ...enrollment,
            ...studentMember,
            user_id: enrollment.student_id,
          };
        })
        .filter((s: any) => s.user) || []; // Filter out any enrollments without user data

    switch (activeTab) {
      case "quizzes":
        return (
          <TeacherQuizzesTab
            courseId={selectedCourse}
            quizzes={courseQuizzes}
            onRefresh={onRefresh}
            instituteId={selectedInstitute}
            currentUserId={currentUserId}
            subjectId={subjectId}
          />
        );
      case "assignments":
        return (
          <TeacherAssignmentsTab
            courseId={selectedCourse}
            assignments={courseAssignments}
            submissions={courseSubmissions}
            onRefresh={onRefresh}
            instituteId={selectedInstitute}
            currentUserId={currentUserId}
            subjectAssignments={instituteData.subjectAssignments}
          />
        );
      case "live-classes":
        return (
          <TeacherLiveClassesTab
            assignmentId={selectedCourse}
            subjectAssignments={instituteData.subjectAssignments}
            liveClasses={courseLiveClasses}
            onRefresh={onRefresh}
            instituteId={selectedInstitute}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        );
      case "grades":
        return (
          <TeacherGradesTab
            courseId={selectedCourse}
            students={courseStudents}
            results={courseResults}
            onRefresh={onRefresh}
            currentUserId={currentUserId}
            subjectId={subjectId}
            instituteId={selectedInstitute}
          />
        );
      case "announcements":
        return (
          <AnnouncementsTab
            announcements={courseAnnouncements}
            instituteId={selectedInstitute}
            isAdmin={false}
            currentUserId={currentUserId}
            classBatchSections={instituteData.classBatchSections}
            onRefresh={onRefresh}
            courseId={selectedCourse}
            subjectAssignments={instituteData.subjectAssignments}
          />
        );
      case "discussion":
        return (
          <TeacherDiscussionTab
            courseId={selectedCourse}
            discussions={courseDiscussions}
            onRefresh={onRefresh}
            currentUserId={currentUserId}
            subjectId={subjectId}
          />
        );
      case "resources":
        return (
          <TeacherResourcesTab
            courseId={selectedCourse}
            resources={courseResources}
            onRefresh={onRefresh}
            instituteId={selectedInstitute}
            currentUserId={currentUserId}
            subjectId={subjectId}
          />
        );
      case "attendance":
        return (
          <TeacherAttendanceTab
            courseId={selectedCourse}
            students={courseStudents}
            instituteId={selectedInstitute}
            currentUserId={currentUserId}
            subjectId={subjectId}
            subjectName={selectedAssignment?.subject?.name}
            onRefresh={onRefresh}
          />
        );
      default:
        return <div className="text-[#8696a0]">Select a tab</div>;
    }
  }

  // Admin tabs
  switch (activeTab) {
    case "members":
      return (
        <MembersTab
          members={instituteData.members}
          teachers={instituteData.teachers}
          students={instituteData.students}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onRemoveMember={onRemoveMember}
          onUpdateMemberRole={onUpdateMemberRole}
        />
      );
    case "batches":
      return (
        <BatchesTab
          batches={instituteData.batches}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      );
    case "sections":
      return (
        <SectionsTab
          sections={instituteData.sections}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      );
    case "subjects":
      return (
        <SubjectsTab
          subjects={instituteData.subjects}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      );
    case "attendance":
      return (
        <AttendanceTab
          attendance={instituteData.attendance}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      );
    case "homework":
      return (
        <HomeworkTab
          homework={instituteData.homework}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          classBatchSections={instituteData.classBatchSections}
          subjects={instituteData.subjects}
          onRefresh={onRefresh}
        />
      );
    case "results":
      return (
        <ResultsTab
          results={instituteData.results}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
        />
      );
    case "schedules":
      return (
        <SchedulesTab
          schedules={instituteData.schedules}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          classBatchSections={instituteData.classBatchSections}
          subjects={instituteData.subjects}
          onRefresh={onRefresh}
        />
      );
    case "announcements":
      return (
        <AnnouncementsTab
          announcements={instituteData.announcements}
          instituteId={selectedInstitute}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          classBatchSections={instituteData.classBatchSections}
          onRefresh={onRefresh}
        />
      );
    default:
      return <div className="text-[#8696a0]">Select a tab</div>;
  }
}
