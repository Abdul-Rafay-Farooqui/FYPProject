"use client";

import { useState, useEffect, useCallback } from "react";
import { InstituteAPI } from "@/lib/api/institute";

export interface Institute {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  created_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_user_role?: "admin" | "teacher" | "student";
  members?: any[];
}

export interface InstituteData {
  classes: any[];
  batches: any[];
  sections: any[];
  subjects: any[];
  members: any[];
  teachers: any[];
  students: any[];
  classBatchSections: any[];
  attendance: any[];
  homework: any[];
  homeworkSubmissions: any[];
  results: any[];
  schedules: any[];
  announcements: any[];
  quizzes: any[];
  liveClasses: any[];
  resources: any[];
  discussions: any[];
  subjectAssignments: any[];
  courseEnrollments: any[];
}

const defaultInstituteData: InstituteData = {
  classes: [],
  batches: [],
  sections: [],
  subjects: [],
  members: [],
  teachers: [],
  students: [],
  classBatchSections: [],
  attendance: [],
  homework: [],
  homeworkSubmissions: [],
  results: [],
  schedules: [],
  announcements: [],
  quizzes: [],
  liveClasses: [],
  resources: [],
  discussions: [],
  subjectAssignments: [],
  courseEnrollments: [],
};

export function useInstituteWorkspace() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string | null>(null);
  const [instituteData, setInstituteData] = useState<InstituteData>(defaultInstituteData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [error, setError] = useState("");

  // Load all institutes for the current user
  const loadInstitutes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await InstituteAPI.listInstitutes();
      setInstitutes(data || []);
    } catch (err: any) {
      console.error("Failed to load institutes:", err);
      setError(err.message || "Failed to load institutes");
      setInstitutes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load institute data (classes, members, etc.)
  const loadInstituteData = useCallback(async (instituteId: string) => {
    setIsDataLoading(true);
    setError("");
    try {
      console.log('[useInstituteWorkspace] Loading data for institute:', instituteId);
      
      const [
        classes,
        batches,
        sections,
        subjects,
        members,
        teachers,
        students,
        classBatchSections,
        homework,
        schedules,
        announcements,
        quizzes,
        homeworkSubmissions,
        liveClasses,
        resources,
        discussions,
        subjectAssignments,
        results,
        courseEnrollments,
      ] = await Promise.all([
        InstituteAPI.getClasses(instituteId).catch((err) => { console.error('Failed to load classes:', err); return []; }),
        InstituteAPI.getBatches({ institute_id: instituteId, page: 1, limit: 1000 }).then(r => r.data || r).catch((err) => { console.error('Failed to load batches:', err); return []; }),
        InstituteAPI.getSections({ institute_id: instituteId, page: 1, limit: 1000 }).then(r => r.data || r).catch((err) => { console.error('Failed to load sections:', err); return []; }),
        InstituteAPI.getSubjects(instituteId).catch((err) => { console.error('Failed to load subjects:', err); return []; }),
        InstituteAPI.getMembers(instituteId).catch((err) => { console.error('Failed to load members:', err); return []; }),
        InstituteAPI.getMembers(instituteId, "teacher").catch((err) => { console.error('Failed to load teachers:', err); return []; }),
        InstituteAPI.getMembers(instituteId, "student").catch((err) => { console.error('Failed to load students:', err); return []; }),
        InstituteAPI.getCBS().catch((err) => { console.error('Failed to load CBS:', err); return []; }),
        InstituteAPI.getHomework({ institute_id: instituteId }).catch((err) => { console.error('Failed to load homework:', err); return []; }),
        InstituteAPI.getSchedules({ institute_id: instituteId }).catch((err) => { console.error('Failed to load schedules:', err); return []; }),
        InstituteAPI.getAnnouncements({ institute_id: instituteId }).catch((err) => { 
          console.error('Failed to load announcements:', err);
          console.error('Announcements error details:', err.response?.data);
          return []; 
        }),
        InstituteAPI.getQuizzes({ institute_id: instituteId }).catch((err) => { 
          console.error('Failed to load quizzes:', err); 
          return []; 
        }),
        InstituteAPI.getSubmissions().catch((err) => { console.error('Failed to load homework submissions:', err); return []; }),
        InstituteAPI.getLiveClasses({ institute_id: instituteId }).catch((err) => { console.error('Failed to load live classes:', err); return []; }),
        InstituteAPI.getResources({ institute_id: instituteId }).catch((err) => { console.error('Failed to load resources:', err); return []; }),
        InstituteAPI.getDiscussions({ institute_id: instituteId }).catch((err) => { console.error('Failed to load discussions:', err); return []; }),
        InstituteAPI.getSubjectAssignments(instituteId).catch((err) => { console.error('Failed to load subject assignments:', err); return []; }),
        InstituteAPI.getResults().catch((err) => { console.error('Failed to load results:', err); return []; }),
        InstituteAPI.getCourseEnrollments({ institute_id: instituteId }).catch((err) => { console.error('Failed to load course enrollments:', err); return []; }),
      ]);

      console.log('[useInstituteWorkspace] Loaded classes:', classes);
      console.log('[useInstituteWorkspace] Loaded batches:', batches);
      console.log('[useInstituteWorkspace] Loaded sections:', sections);
      console.log('[useInstituteWorkspace] Loaded subjects:', subjects);

      setInstituteData({
        classes: classes || [],
        batches: batches || [],
        sections: sections || [],
        subjects: subjects || [],
        members: members || [],
        teachers: teachers || [],
        students: students || [],
        classBatchSections: classBatchSections || [],
        attendance: [],
        homework: homework || [],
        homeworkSubmissions: homeworkSubmissions || [],
        results: results || [],
        schedules: schedules || [],
        announcements: announcements || [],
        quizzes: quizzes || [],
        liveClasses: liveClasses || [],
        resources: resources || [],
        discussions: discussions || [],
        subjectAssignments: subjectAssignments || [],
        courseEnrollments: courseEnrollments || [],
      });
    } catch (err: any) {
      console.error("Failed to load institute data:", err);
      setError(err.message || "Failed to load institute data");
      setInstituteData(defaultInstituteData);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Load institutes on mount
  useEffect(() => {
    loadInstitutes();
  }, [loadInstitutes]);

  // Auto-select first institute when institutes are loaded
  useEffect(() => {
    if (institutes.length > 0 && !selectedInstitute) {
      setSelectedInstitute(institutes[0].id);
    }
  }, [institutes, selectedInstitute]);

  // Load institute data when selection changes
  useEffect(() => {
    if (selectedInstitute) {
      loadInstituteData(selectedInstitute);
    } else {
      setInstituteData(defaultInstituteData);
    }
  }, [selectedInstitute, loadInstituteData]);

  return {
    institutes,
    selectedInstitute,
    setSelectedInstitute,
    instituteData,
    setInstituteData,
    isLoading,
    isDataLoading,
    error,
    setError,
    loadInstitutes,
    loadInstituteData,
  };
}
