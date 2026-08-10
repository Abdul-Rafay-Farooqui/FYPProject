"use client";

import { useState, useEffect } from "react";
import { InstituteAPI } from "@/lib/api/institute";
import { AddBatchModal } from "../InstituteDataModals";

interface Batch {
  id: string;
  name: string;
  year: number;
  institute_id: string;
  created_at: string;
  student_count?: number;
}

interface Student {
  id: string;
  display_name: string;
  email: string;
  enrollment_id: string;
  enrollment_date: string;
  class_batch_section: {
    id: string;
    class: { name: string };
    section: { name: string };
  };
}

export default function BatchesTab({ batches: initialBatches, instituteId, isAdmin, onRefresh }: any) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchStudents, setBatchStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<'name' | 'year' | 'created_at' | 'student_count'>('year');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [batches, setBatches] = useState<Batch[]>(initialBatches || []);
  const [loading, setLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [classBatchSections, setClassBatchSections] = useState<any[]>([]);
  const [selectedCBS, setSelectedCBS] = useState<string>("");

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await InstituteAPI.getBatches({
        institute_id: instituteId,
        search: searchTerm,
        sortField,
        sortOrder,
        page: 1,
        limit: 100
      });
      // Handle both paginated response and direct array response
      const batchData = response.data || response;
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [searchTerm, sortField, sortOrder]);

  useEffect(() => {
    setBatches(initialBatches || []);
  }, [initialBatches]);

  const handleAddBatch = async (name: string, year: number) => {
    await InstituteAPI.createBatch({ name, year, institute_id: instituteId });
    await fetchBatches();
    onRefresh();
  };

  const handleUpdateBatch = async (name: string, year: number) => {
    if (!selectedBatch) return;
    await InstituteAPI.updateBatch(selectedBatch.id, { name, year });
    await fetchBatches();
    onRefresh();
    setShowEditModal(false);
    setSelectedBatch(null);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (confirm("Are you sure you want to delete this batch? This will fail if there are active student enrollments.")) {
      try {
        await InstituteAPI.deleteBatch(batchId);
        await fetchBatches();
        onRefresh();
      } catch (error: any) {
        alert(error.response?.data?.message || "Failed to delete batch. It may have active enrollments.");
      }
    }
  };

  const handleViewStudents = async (batch: Batch) => {
    setSelectedBatch(batch);
    setLoading(true);
    try {
      const data = await InstituteAPI.getBatchWithStudents(batch.id);
      setBatchStudents(data.students || []);
      setShowStudentsModal(true);
    } catch (error) {
      console.error("Error fetching batch students:", error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddStudents = async (batch: Batch) => {
    setSelectedBatch(batch);
    setLoading(true);
    try {
      // Fetch all students with student role in this institute
      const memberships = await InstituteAPI.getMembers(instituteId, 'student');
      console.log('Student memberships:', memberships);
      
      // Extract user objects from memberships
      const students = Array.isArray(memberships) 
        ? memberships.map((m: any) => m.user || m).filter((u: any) => u && u.id)
        : [];
      
      console.log('Extracted students:', students);
      setAvailableStudents(students);
      
      // Fetch sections for this institute
      const sectionsData = await InstituteAPI.getSections(instituteId);
      console.log('Sections:', sectionsData);
      
      // Fetch classes for this institute (if they exist)
      let classesData = [];
      try {
        classesData = await InstituteAPI.getClasses(instituteId);
        console.log('Classes:', classesData);
      } catch (error) {
        console.log('No classes found, will use default class');
      }
      
      // Create class-batch-sections on the fly or fetch existing ones
      const cbsData = await InstituteAPI.getCBS({ batch_id: batch.id });
      console.log('Existing Class-Batch-Sections:', cbsData);
      
      // If no CBS exists, we need to create them
      if (!cbsData || cbsData.length === 0) {
        // Get or create a default class
        let defaultClass = classesData && classesData.length > 0 ? classesData[0] : null;
        
        if (!defaultClass) {
          // Create a default class
          console.log('Creating default class...');
          defaultClass = await InstituteAPI.createClass({
            name: 'Default Class',
            description: 'Auto-created default class',
            institute_id: instituteId
          });
        }
        
        // Create CBS for each section with this batch
        if (sectionsData && sectionsData.length > 0) {
          console.log('Creating class-batch-sections...');
          const cbsPromises = sectionsData.map((section: any) =>
            InstituteAPI.createCBS({
              class_id: defaultClass.id,
              batch_id: batch.id,
              section_id: section.id
            }).catch(err => {
              console.error('Error creating CBS:', err);
              return null;
            })
          );
          
          await Promise.all(cbsPromises);
          
          // Refetch CBS with relations to get class and section names
          const refreshedCBS = await InstituteAPI.getCBS({ batch_id: batch.id });
          console.log('Refreshed CBS with relations:', refreshedCBS);
          setClassBatchSections(Array.isArray(refreshedCBS) ? refreshedCBS : []);
          
          if (!refreshedCBS || refreshedCBS.length === 0) {
            alert("Failed to create class-batch-sections. Please try again.");
            setLoading(false);
            return;
          }
        } else {
          alert("No sections found. Please create sections first in the Sections tab.");
          setLoading(false);
          return;
        }
      } else {
        setClassBatchSections(Array.isArray(cbsData) ? cbsData : []);
      }
      
      // Check if we have the necessary data
      if (students.length === 0) {
        alert("No students found in this institute. Please add students first in the Members tab.");
        setLoading(false);
        return;
      }
      
      setShowAddStudentsModal(true);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (!selectedBatch || selectedStudentIds.length === 0 || !selectedCBS) {
      alert("Please select students and a class-batch-section");
      return;
    }
    
    console.log('Adding students to batch:', {
      batchId: selectedBatch.id,
      selectedCBS,
      studentIds: selectedStudentIds,
      classBatchSections: classBatchSections
    });
    
    // Find the selected CBS to verify it has the correct batch_id
    const selectedCBSObj = classBatchSections.find((cbs: any) => cbs.id === selectedCBS);
    console.log('Selected CBS object:', selectedCBSObj);
    
    if (selectedCBSObj && selectedCBSObj.batch_id !== selectedBatch.id) {
      alert(`Error: The selected class-section belongs to a different batch. CBS batch_id: ${selectedCBSObj.batch_id}, Current batch: ${selectedBatch.id}`);
      return;
    }
    
    try {
      await InstituteAPI.addStudentsToBatch(selectedBatch.id, {
        student_ids: selectedStudentIds,
        class_batch_section_id: selectedCBS
      });
      alert("Students added successfully!");
      setShowAddStudentsModal(false);
      setSelectedStudentIds([]);
      setSelectedCBS("");
      await fetchBatches();
    } catch (error: any) {
      console.error('Error adding students:', error);
      alert(error.response?.data?.message || "Failed to add students");
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (confirm("Remove this student from the batch?")) {
      try {
        await InstituteAPI.removeStudentFromBatch(enrollmentId);
        setBatchStudents(batchStudents.filter(s => s.enrollment_id !== enrollmentId));
        await fetchBatches();
      } catch (error) {
        alert("Failed to remove student");
      }
    }
  };

  const displayBatches = Array.isArray(batches) && batches.length > 0 
    ? batches 
    : Array.isArray(initialBatches) 
      ? initialBatches 
      : [];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#e9edef] text-2xl font-semibold">Batches</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 font-medium"
            >
              + Add Batch
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search batches by name or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-[#111b21] border border-[#222d34] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
          />
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="px-4 py-2 bg-[#111b21] border border-[#222d34] rounded-lg text-[#e9edef] focus:outline-none focus:border-[#00a884]"
          >
            <option value="name">Sort by Name</option>
            <option value="year">Sort by Year</option>
            <option value="created_at">Sort by Created Date</option>
            <option value="student_count">Sort by Student Count</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-4 py-2 bg-[#111b21] border border-[#222d34] rounded-lg text-[#e9edef] focus:outline-none focus:border-[#00a884]"
          >
            <option value="ASC">Ascending</option>
            <option value="DESC">Descending</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
          <p className="text-[#8696a0] mt-2">Loading...</p>
        </div>
      ) : !Array.isArray(displayBatches) || displayBatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1e2a30] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-[#8696a0]">No batches found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayBatches.map((batch: Batch) => (
            <div key={batch.id} className="bg-[#111b21] rounded-lg p-4 border border-[#222d34] hover:border-[#2a3942] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[#e9edef] font-medium text-lg">{batch.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#8696a0]">
                    <span>Year: {batch.year}</span>
                    <span>•</span>
                    <span>Students: {batch.student_count || 0}</span>
                    <span>•</span>
                    <span>Created: {new Date(batch.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewStudents(batch)}
                    className="px-3 py-1.5 text-sm rounded bg-[#1e2a30] text-[#00a884] hover:bg-[#2a3942] transition-colors"
                  >
                    View Students
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenAddStudents(batch)}
                        className="px-3 py-1.5 text-sm rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 transition-colors"
                      >
                        + Add Students
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#1e2a30] rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddBatchModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddBatch} />
      {showEditModal && selectedBatch && (
        <EditBatchModal open={showEditModal} onClose={() => { setShowEditModal(false); setSelectedBatch(null); }} onSubmit={handleUpdateBatch} batch={selectedBatch} />
      )}
      {showStudentsModal && selectedBatch && (
        <ViewStudentsModal open={showStudentsModal} onClose={() => { setShowStudentsModal(false); setSelectedBatch(null); setBatchStudents([]); }} batch={selectedBatch} students={batchStudents} onRemoveStudent={isAdmin ? handleRemoveStudent : undefined} />
      )}
      {showAddStudentsModal && selectedBatch && (
        <AddStudentsModal open={showAddStudentsModal} onClose={() => { setShowAddStudentsModal(false); setSelectedBatch(null); setSelectedStudentIds([]); setSelectedCBS(""); }} batch={selectedBatch} availableStudents={availableStudents} classBatchSections={classBatchSections} selectedStudentIds={selectedStudentIds} setSelectedStudentIds={setSelectedStudentIds} selectedCBS={selectedCBS} setSelectedCBS={setSelectedCBS} onSubmit={handleAddStudents} />
      )}
    </div>
  );
}

function EditBatchModal({ open, onClose, onSubmit, batch }: any) {
  const [name, setName] = useState(batch.name);
  const [year, setYear] = useState(batch.year);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Batch name is required"); return; }
    setLoading(true); setError("");
    try { await onSubmit(name, year); onClose(); } catch (err: any) { setError(err.message || "Failed to update batch"); } finally { setLoading(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-md w-full p-6 border border-[#222d34]">
        <h2 className="text-[#e9edef] text-xl font-semibold mb-4">Edit Batch</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Batch Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-[#1e2a30] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]" required />
          </div>
          <div className="mb-4">
            <label className="block text-[#8696a0] text-sm mb-2">Year *</label>
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full px-3 py-2 bg-[#1e2a30] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]" required />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942]" disabled={loading}>Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90" disabled={loading}>{loading ? "Updating..." : "Update Batch"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewStudentsModal({ open, onClose, batch, students, onRemoveStudent }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border border-[#222d34]">
        <div className="p-6 border-b border-[#222d34]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#e9edef] text-xl font-semibold">{batch.name} - Students</h2>
              <p className="text-[#8696a0] text-sm mt-1">{students.length} students enrolled</p>
            </div>
            <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef] p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {students.length === 0 ? (
            <div className="text-center py-12"><p className="text-[#8696a0]">No students enrolled in this batch</p></div>
          ) : (
            <div className="space-y-3">
              {students.map((student: Student) => (
                <div key={student.enrollment_id} className="bg-[#1e2a30] rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-[#e9edef] font-medium">{student.display_name}</h3>
                    <p className="text-[#8696a0] text-sm mt-1">{student.email}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#8696a0]">
                      <span>{student.class_batch_section.class.name}</span><span>•</span>
                      <span>{student.class_batch_section.section.name}</span><span>•</span>
                      <span>Enrolled: {new Date(student.enrollment_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {onRemoveStudent && (
                    <button onClick={() => onRemoveStudent(student.enrollment_id)} className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddStudentsModal({ open, onClose, batch, availableStudents, classBatchSections, selectedStudentIds, setSelectedStudentIds, selectedCBS, setSelectedCBS, onSubmit }: any) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Ensure availableStudents is an array and filter safely
  const students = Array.isArray(availableStudents) ? availableStudents : [];
  const filteredStudents = students.filter((student: any) => {
    if (!student) return false;
    const name = student.display_name?.toLowerCase() || '';
    const email = student.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });
  
  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev: string[]) => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden border border-[#222d34]">
        <div className="p-6 border-b border-[#222d34]">
          <h2 className="text-[#e9edef] text-xl font-semibold">Add Students to {batch.name}</h2>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="mb-6">
            <label className="block text-[#8696a0] text-sm mb-2">Select Class-Section *</label>
            <select value={selectedCBS} onChange={(e) => setSelectedCBS(e.target.value)} className="w-full px-3 py-2 bg-[#1e2a30] border border-[#222d34] rounded text-[#e9edef] focus:outline-none focus:border-[#00a884]" required>
              <option value="">Choose a class-section...</option>
              {classBatchSections.map((cbs: any) => (
                <option key={cbs.id} value={cbs.id}>
                  {cbs.class?.name || 'Class'} - {cbs.section?.name || 'Section'}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 bg-[#1e2a30] border border-[#222d34] rounded text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]" />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredStudents.map((student: any) => (
              <label key={student.id} className="flex items-center gap-3 p-3 bg-[#1e2a30] rounded-lg cursor-pointer hover:bg-[#2a3942] transition-colors">
                <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} className="w-4 h-4 rounded border-[#222d34] text-[#00a884] focus:ring-[#00a884]" />
                <div className="flex-1">
                  <p className="text-[#e9edef] font-medium">{student.display_name || 'Unknown'}</p>
                  <p className="text-[#8696a0] text-sm">{student.email || 'No email'}</p>
                </div>
              </label>
            ))}
          </div>
          {filteredStudents.length === 0 && searchTerm && (
            <p className="text-[#8696a0] text-sm text-center py-4">No students found</p>
          )}
          {selectedStudentIds.length > 0 && (<p className="text-[#00a884] text-sm mt-4">{selectedStudentIds.length} student(s) selected</p>)}
        </div>
        <div className="p-6 border-t border-[#222d34] flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded bg-[#1e2a30] text-[#e9edef] hover:bg-[#2a3942]">Cancel</button>
          <button onClick={onSubmit} disabled={selectedStudentIds.length === 0 || !selectedCBS} className="flex-1 px-4 py-2 rounded bg-[#00a884] text-[#0b141a] hover:bg-[#00a884]/90 disabled:opacity-50 disabled:cursor-not-allowed">Add {selectedStudentIds.length} Student(s)</button>
        </div>
      </div>
    </div>
  );
}
