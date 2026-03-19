// src/components/admin/AssignCandidatesModal.jsx
import { useState, useEffect } from "react";
import { inviteMultipleCandidates, uploadExamCandidatesCSV } from "../../api/examApi";
import { batchApi, studentApi } from "../../api/batchManagementApi";
import "../../styles/Modal.css";
 
function AssignCandidatesModal({ examId, examTitle, onClose }) {
  const safeExamId = examId || '';
  const safeExamTitle = examTitle || 'Exam';
  const safeOnClose = onClose || (() => {});
 
  const [inviteMethod, setInviteMethod] = useState("individual");
  const [candidates, setCandidates] = useState([{ name: "", email: "" }]);
  const [bulkCandidates, setBulkCandidates] = useState([]);
  const [bulkCSVFile, setBulkCSVFile] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
 
  // Batch related states with pagination
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedBatchCandidates, setSelectedBatchCandidates] = useState([]);
  const [error, setError] = useState(null);
 
  // Pagination states for batches
  const [batchPage, setBatchPage] = useState(0);
  const [batchTotalPages, setBatchTotalPages] = useState(1);
  const [batchTotal, setBatchTotal] = useState(0);
 
  // Pagination states for students
  const [studentPage, setStudentPage] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
 
  // Fetch all batches with search
  const fetchBatches = async (search = "", page = 0) => {
    try {
      setLoadingBatches(true);
      setError(null);
     
      console.log("Fetching batches with search:", search, "page:", page);
     
      const response = await batchApi.getAllBatches({
        page: page,
        name: search || undefined
      });
     
      console.log("Batch API Response:", response);
     
      // Handle paginated response structure
      if (response && response.data && Array.isArray(response.data)) {
        if (page > 0) {
          // Append for pagination
          setBatches(prev => [...prev, ...response.data]);
        } else {
          setBatches(response.data);
        }
        setBatchTotalPages(response.totalPages || 1);
        setBatchTotal(response.total || 0);
        setBatchPage(response.page || 0);
      } else {
        console.error("Unexpected response format:", response);
        setBatches([]);
      }
     
    } catch (err) {
      console.error("Error fetching batches:", err);
      setError("Failed to load batches. Please try again.");
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };
 
  // Fetch students for selected batch with search
  const fetchBatchStudents = async (batchId, search = "", page = 0) => {
    if (!batchId) return;
   
    try {
      setLoadingStudents(true);
      setError(null);
     
      console.log("Fetching students for batch:", batchId, "search:", search, "page:", page);
     
      const response = await studentApi.getStudentsByBatch(batchId, {
        page: page,
        search: search || undefined
      });
     
      console.log("Students API Response:", response);
     
      // Handle paginated response structure
      if (response && response.data && Array.isArray(response.data)) {
        // Format students for display
        const formattedStudents = response.data.map(student => ({
          id: student.id,
          name: student?.name || '',
          email: student?.email || '',
          selected: false
        }));
       
        // If loading more pages, append to existing list
        if (page > 0) {
          setSelectedBatchCandidates(prev => [...prev, ...formattedStudents]);
        } else {
          setSelectedBatchCandidates(formattedStudents);
        }
       
        setStudentTotalPages(response.totalPages || 1);
        setStudentTotal(response.total || 0);
        setStudentPage(response.page || 0);
      } else {
        console.error("Unexpected students response format:", response);
        setSelectedBatchCandidates([]);
      }
     
    } catch (err) {
      console.error("Error fetching batch students:", err);
      setError("Failed to load students. Please try again.");
      setSelectedBatchCandidates([]);
    } finally {
      setLoadingStudents(false);
    }
  };
 
  // Initial fetch
  useEffect(() => {
    console.log("Component mounted, fetching batches...");
    fetchBatches("", 0);
  }, []);
 
  // Handle batch search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (batchSearchTerm !== undefined) {
        fetchBatches(batchSearchTerm, 0);
      }
    }, 500);
 
    return () => clearTimeout(timer);
  }, [batchSearchTerm]);
 
  const handleBatchSelect = (batch) => {
    if (!batch) return;
   
    console.log("Selected batch:", batch);
    setSelectedBatch(batch);
    setBatchSearchTerm(batch?.name || '');
    setShowBatchDropdown(false);
    setStudentSearchTerm(""); // Reset student search
    fetchBatchStudents(batch?.id, "", 0);
  };
 
  // Load more batches (for infinite scroll)
  const loadMoreBatches = () => {
    if (batchPage < batchTotalPages - 1 && !loadingBatches) {
      fetchBatches(batchSearchTerm, batchPage + 1);
    }
  };
 
  // Load more students
  const loadMoreStudents = () => {
    if (studentPage < studentTotalPages - 1 && !loadingStudents && selectedBatch) {
      fetchBatchStudents(selectedBatch.id, studentSearchTerm, studentPage + 1);
    }
  };
 
  // Handle student search
  const handleStudentSearch = (e) => {
    const search = e.target.value;
    setStudentSearchTerm(search);
   
    // Clear previous timer
    if (window.studentSearchTimer) {
      clearTimeout(window.studentSearchTimer);
    }
   
    // Set new timer
    window.studentSearchTimer = setTimeout(() => {
      if (selectedBatch) {
        fetchBatchStudents(selectedBatch.id, search, 0);
      }
    }, 500);
  };
 
  const toggleStudentSelection = (index) => {
    if (!selectedBatchCandidates || index >= selectedBatchCandidates.length) return;
   
    const updated = [...selectedBatchCandidates];
    updated[index] = {
      ...updated[index],
      selected: !updated[index]?.selected
    };
    setSelectedBatchCandidates(updated);
  };
 
  const selectAllStudents = () => {
    if (!selectedBatchCandidates) return;
   
    const updated = selectedBatchCandidates.map(student => ({
      ...student,
      selected: true
    }));
    setSelectedBatchCandidates(updated);
  };
 
  const deselectAllStudents = () => {
    if (!selectedBatchCandidates) return;
   
    const updated = selectedBatchCandidates.map(student => ({
      ...student,
      selected: false
    }));
    setSelectedBatchCandidates(updated);
  };
 
  const getSelectedStudentsCount = () => {
    return (selectedBatchCandidates || []).filter(s => s?.selected).length;
  };
 
  const addCandidateField = () => {
    setCandidates([...candidates, { name: "", email: "" }]);
  };
 
  const updateCandidate = (index, field, value) => {
    if (!candidates || index >= candidates.length) return;
   
    const updated = [...candidates];
    updated[index] = {
      ...updated[index],
      [field]: value || ''
    };
    setCandidates(updated);
  };
 
  const removeCandidateField = (index) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };
 
  const handleBulkCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
 
    setBulkCSVFile(file);
    setBulkCandidates([]);
 
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      try {
        const content = target?.result;
        if (!content) return;
       
        const rows = content.split("\n").filter(row => row.trim());
        const dataRows = rows.slice(1); // Skip header
       
        const parsed = dataRows
          .map((row) => {
            if (!row || !row.trim()) return null;
           
            const cols = row.split(',').map(col =>
              col.trim().replace(/^["']|["']$/g, '')
            );
           
            if (cols.length >= 2) {
              const name = cols[0]?.trim() || '';
              const email = cols[1]?.trim() || '';
             
              if (name && email && email.includes('@')) {
                return { name, email };
              }
            }
            return null;
          })
          .filter(candidate => candidate !== null);
       
        setBulkCandidates(parsed);
       
        if (parsed.length === 0) {
          alert("No valid candidates found in CSV. Please check the format.");
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file. Please check the format.");
        setBulkCandidates([]);
      }
    };
   
    reader.onerror = () => {
      alert("Error reading file");
      setBulkCandidates([]);
    };
   
    reader.readAsText(file);
  };
 
  const handleInvite = async () => {
    try {
      setInviting(true);
      setError(null);
     
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again. Token not found.");
        return;
      }
     
      let validCandidates = [];
     
      if (inviteMethod === "individual") {
        validCandidates = (candidates || [])
          .filter(c => c?.name?.trim() && c?.email?.trim())
          .map(({ name, email }) => ({ name: name.trim(), email: email.trim() }));
       
        if (validCandidates.length === 0) {
          alert("Please add at least one candidate with name and email");
          return;
        }
      }
      else if (inviteMethod === "bulk") {
        if (!bulkCSVFile) {
          alert("Please upload a CSV file first.");
          return;
        }
       
        if (bulkCandidates.length === 0) {
          alert("No valid candidates found in the CSV file.");
          return;
        }
       
        await uploadExamCandidatesCSV(safeExamId, bulkCSVFile);
        setInviteSuccess(true);
        setTimeout(() => {
          safeOnClose();
        }, 2000);
        return;
      }
      else if (inviteMethod === "batch") {
        validCandidates = (selectedBatchCandidates || [])
          .filter(s => s?.selected)
          .map(({ name, email }) => ({ name, email }));
       
        if (validCandidates.length === 0) {
          alert("Please select at least one student from the batch");
          return;
        }
      }
 
      await inviteMultipleCandidates(safeExamId, validCandidates);
 
      setInviteSuccess(true);
      setTimeout(() => {
        safeOnClose();
      }, 2000);
     
    } catch (error) {
      console.error("Invitation error:", error);
     
      if (error?.response?.status === 403) {
        alert("Access denied (403). Please check your authentication.");
      } else if (error?.response?.status === 400) {
        alert("Invalid data format. Please check the candidate details.");
      } else if (error?.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
      } else {
        alert(`Failed to invite candidates: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setInviting(false);
    }
  };
 
  const handleClose = () => {
    setError(null);
    safeOnClose();
  };
 
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Assign Candidates to: {safeExamTitle}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
       
        {error && (
          <div className="error-message" style={{ padding: '10px', margin: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
            {error}
          </div>
        )}
       
        <div className="modal-body">
          <div className="invite-method-row">
            <label className="radio-option">
              <input
                type="radio"
                name="inviteMethod"
                value="individual"
                checked={inviteMethod === "individual"}
                onChange={() => setInviteMethod("individual")}
              />
              Manual Entry
            </label>
 
            <label className="radio-option">
              <input
                type="radio"
                name="inviteMethod"
                value="bulk"
                checked={inviteMethod === "bulk"}
                onChange={() => setInviteMethod("bulk")}
              />
              Bulk CSV Upload
            </label>
 
            <label className="radio-option">
              <input
                type="radio"
                name="inviteMethod"
                value="batch"
                checked={inviteMethod === "batch"}
                onChange={() => setInviteMethod("batch")}
              />
              Assign by Batch
            </label>
          </div>
 
          {inviteMethod === "individual" && (
            <div className="invite-section">
              <label>Add Candidates Manually</label>
             
              {(candidates || []).map((candidate, index) => (
                <div className="email-row" key={`candidate-${index}`}>
                  <input
                    type="text"
                    placeholder="Candidate Name"
                    value={candidate?.name || ''}
                    onChange={(e) => updateCandidate(index, "name", e.target.value)}
                    required
                  />
                 
                  <input
                    type="email"
                    placeholder="Candidate Email"
                    value={candidate?.email || ''}
                    onChange={(e) => updateCandidate(index, "email", e.target.value)}
                    required
                  />
                 
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      className="btn-delete-student"
                      onClick={() => removeCandidateField(index)}
                      title="Remove"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              ))}
             
              <div className="candidate-count">
                <p>{(candidates || []).length} candidate(s) added</p>
              </div>
             
              <button
                type="button"
                className="secondary-btn"
                onClick={addCandidateField}
              >
                + Add Another Candidate
              </button>
            </div>
          )}
 
          {inviteMethod === "bulk" && (
            <div className="invite-section">
              <label>Upload Candidates CSV</label>
              <div className="format-info">
                <p><strong>CSV Format:</strong> Name, Email</p>
                <p><small>Example: John Doe,john@example.com</small></p>
              </div>
             
              <div className="file-upload-area">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkCSV}
                  id="candidates-csv-upload"
                />
                <label htmlFor="candidates-csv-upload" className="upload-label">
                  {bulkCSVFile ? bulkCSVFile.name : "Choose CSV File"}
                </label>
              </div>
             
              {(bulkCandidates || []).length > 0 && (
                <div className="candidate-preview">
                  <h4>Preview ({(bulkCandidates || []).length} candidates)</h4>
                  <div className="preview-table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bulkCandidates || []).slice(0, 5).map((c, idx) => (
                          <tr key={`preview-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{c?.name || ''}</td>
                            <td>{c?.email || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(bulkCandidates || []).length > 5 && (
                    <p className="more-candidates">... and {(bulkCandidates || []).length - 5} more candidates</p>
                  )}
                </div>
              )}
            </div>
          )}
 
          {inviteMethod === "batch" && (
            <div className="invite-section batch-section">
              <label>Select Batch</label>
             
              {/* Batch count indicator */}
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                Total batches available: {batchTotal || 0}
              </div>
             
              {/* Batch Search Dropdown */}
              <div className="batch-search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search for a batch..."
                    value={batchSearchTerm || ''}
                    onChange={(e) => {
                      setBatchSearchTerm(e.target.value);
                      setShowBatchDropdown(true);
                      setSelectedBatch(null);
                      setSelectedBatchCandidates([]); // Clear students when searching
                    }}
                    onFocus={() => setShowBatchDropdown(true)}
                    className="batch-search-input"
                  />
                  {loadingBatches && <span className="search-spinner">⏳</span>}
                </div>
 
                {showBatchDropdown && (
                  <div className="batch-dropdown">
                    {(batches || []).length > 0 ? (
                      <>
                        {batches.map(batch => (
                          <div
                            key={batch?.id || `batch-${Math.random()}`}
                            className="batch-option"
                            onClick={() => handleBatchSelect(batch)}
                          >
                            <strong>{batch?.name || 'Unnamed Batch'}</strong>
                            {batch?.description && (
                              <small style={{ display: 'block', color: '#666' }}>{batch.description}</small>
                            )}
                          </div>
                        ))}
                        {batchPage < batchTotalPages - 1 && (
                          <div
                            className="load-more"
                            onClick={loadMoreBatches}
                            style={{ padding: '8px', textAlign: 'center', cursor: 'pointer', color: '#0066cc' }}
                          >
                            Load more...
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-batches">
                        {loadingBatches ? 'Loading...' : 'No batches found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
 
              {/* Selected Batch Info */}
              {selectedBatch && (
                <div className="selected-batch-info">
                  <h4>Selected Batch: {selectedBatch?.name || ''}</h4>
                  <p className="batch-description">{selectedBatch?.description || ''}</p>
                </div>
              )}
 
              {/* Students List */}
              {selectedBatch && (
                <div className="batch-students-section">
                  <div className="students-header">
                    <h4>Students in this batch</h4>
                    <div className="student-search" style={{ marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchTerm}
                        onChange={handleStudentSearch}
                        className="student-search-input"
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                    </div>
                    <div className="student-selection-actions" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <button
                        className="small-btn"
                        onClick={selectAllStudents}
                        disabled={loadingStudents || (selectedBatchCandidates || []).length === 0}
                        style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Select All
                      </button>
                      <button
                        className="small-btn"
                        onClick={deselectAllStudents}
                        disabled={loadingStudents || (selectedBatchCandidates || []).length === 0}
                        style={{ padding: '5px 10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
 
                  {loadingStudents ? (
                    <div className="loading-students">Loading students...</div>
                  ) : (
                    <>
                      <div className="students-count" style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                        {getSelectedStudentsCount()} of {studentTotal || 0} students selected
                      </div>
 
                      <div className="students-list-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {(selectedBatchCandidates || []).length > 0 ? (
                          <>
                            {selectedBatchCandidates.map((student, index) => (
                              <div key={`student-${student.id || index}`} className="student-item" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={student?.selected || false}
                                    onChange={() => toggleStudentSelection(index)}
                                    style={{ marginRight: '10px' }}
                                  />
                                  <div className="student-info">
                                    <span className="student-name" style={{ display: 'block', fontWeight: '500' }}>{student?.name || ''}</span>
                                    <span className="student-email" style={{ display: 'block', fontSize: '12px', color: '#666' }}>{student?.email || ''}</span>
                                  </div>
                                </label>
                              </div>
                            ))}
                            {studentPage < studentTotalPages - 1 && (
                              <div
                                className="load-more-students"
                                onClick={loadMoreStudents}
                                style={{ padding: '10px', textAlign: 'center', cursor: 'pointer', color: '#0066cc' }}
                              >
                                Load more students...
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="no-students">No students found in this batch</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
 
        <div className="modal-footer" style={{ padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee' }}>
          <button
            className="btn-cancel"
            onClick={handleClose}
            disabled={inviting}
            style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            className="btn-invite"
            onClick={handleInvite}
            disabled={
              inviting ||
              (inviteMethod === "batch" && getSelectedStudentsCount() === 0) ||
              (inviteMethod === "bulk" && (!bulkCSVFile || (bulkCandidates || []).length === 0))
            }
            style={{ padding: '8px 16px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {inviting ? "Inviting..." : inviteSuccess ? "✓ Invited!" : "Send Invitations"}
          </button>
        </div>
      </div>
    </div>
  );
}
 
AssignCandidatesModal.defaultProps = {
  examId: '',
  examTitle: '',
  onClose: () => {}
};
 
export default AssignCandidatesModal;