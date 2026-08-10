"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { Download, FileText, BookOpen } from "lucide-react";

interface StudentResourcesTabProps {
  instituteId: string;
  currentUserId: string;
  enrolledSubjectIds: string[];
  onRefresh: () => void;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  subject_id: string;
  subject?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    display_name: string;
    email: string;
  };
  created_at: string;
}

export default function StudentResourcesTab({
  instituteId,
  currentUserId,
  enrolledSubjectIds,
  onRefresh,
}: StudentResourcesTabProps) {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [enrolledSubjectIds]);

  const fetchData = async () => {
    if (enrolledSubjectIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch subjects
      const subjectsData = await InstituteAPI.getSubjects(instituteId);
      const enrolledSubjects = subjectsData.filter((subject: any) =>
        enrolledSubjectIds.includes(subject.id)
      );
      setSubjects(enrolledSubjects);

      // Fetch resources for all enrolled subjects
      const resourcePromises = enrolledSubjectIds.map((subjectId) =>
        InstituteAPI.getResources({ institute_id: instituteId, subject_id: subjectId })
      );
      
      const resourcesArrays = await Promise.all(resourcePromises);
      const allResources = resourcesArrays.flat();
      
      setResources(allResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  // Group resources by subject
  const resourcesBySubject: { [key: string]: Resource[] } = {};
  resources.forEach((resource) => {
    if (!resourcesBySubject[resource.subject_id]) {
      resourcesBySubject[resource.subject_id] = [];
    }
    resourcesBySubject[resource.subject_id].push(resource);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (enrolledSubjectIds.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No enrolled courses</p>
        <p className="text-[#8696a0] text-sm mt-2">
          Enroll in courses to access resources
        </p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111b21] rounded-lg border border-[#2a3942]">
        <FileText className="w-12 h-12 mx-auto mb-4 text-[#8696a0]" />
        <p className="text-[#8696a0]">No resources available yet</p>
        <p className="text-[#8696a0] text-sm mt-2">
          Your teachers haven't uploaded any resources yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[#e9edef] text-2xl font-semibold">Course Resources</h2>

      {subjects.map((subject) => {
        const subjectResources = resourcesBySubject[subject.id] || [];
        if (subjectResources.length === 0) return null;

        return (
          <div
            key={subject.id}
            className="bg-[#111b21] rounded-lg border border-[#2a3942] p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-6 h-6 text-[#00a884]" />
              <h3 className="text-[#e9edef] text-lg font-semibold">
                {subject.name}
              </h3>
              <span className="text-[#8696a0] text-sm">
                ({subjectResources.length} resource{subjectResources.length !== 1 ? "s" : ""})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-[#0b141a] rounded-lg p-4 border border-[#1e2a30] hover:border-[#00a884]/50 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-[#00a884]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#e9edef] font-medium text-sm truncate">
                        {resource.title}
                      </p>
                      <p className="text-[#8696a0] text-xs capitalize">
                        {resource.resource_type}
                      </p>
                    </div>
                  </div>

                  {resource.description && (
                    <p className="text-[#8696a0] text-sm mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[#8696a0] text-xs">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </span>
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00a884]/10 text-[#00a884] text-sm rounded hover:bg-[#00a884]/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
