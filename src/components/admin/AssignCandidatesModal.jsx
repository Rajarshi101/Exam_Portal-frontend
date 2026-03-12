// src/components/admin/AssignCandidatesModal.jsx
import { useState, useEffect } from "react";
import { inviteMultipleCandidates, uploadExamCandidatesCSV } from "../../api/examApi";
import { batchApi, studentApi } from "../../api/batchManagementApi";
import "../../styles/Modal.css";

function AssignCandidatesModal({ examId, examTitle, onClose }) {
  const [inviteMethod, setInviteMethod] = useState("individual");
  const [candidates, setCandidates] = useState([{ name: "", email: "" }]);
  const [bulkCandidates, setBulkCandidates] = useState([]);
  const [bulkCSVFile, setBulkCSVFile] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Batch related states
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [batchStudents, setBatchStudents] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedBatchCandidates, setSelectedBatchCandidates] = useState([]);

  // Fetch all batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const data = await batchApi.getAllBatches();
      setBatches(data);
    } catch (err) {
      console.error("Error fetching batches:", err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const fetchBatchStudents = async (batchId) => {
    try {
      setLoadingStudents(true);
      const data = await studentApi.getStudentsByBatch(batchId);
      setBatchStudents(data);
      
      // Format students for display
      const formattedStudents = data.map(student => ({
        name: student.name,
        email: student.email,
        selected: false
      }));
      setSelectedBatchCandidates(formattedStudents);
    } catch (err) {
      console.error("Error fetching batch students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setBatchSearchTerm(batch.name);
    setShowBatchDropdown(false);
    fetchBatchStudents(batch.id);
  };

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(batchSearchTerm.toLowerCase())
  );

  const toggleStudentSelection = (index) => {
    const updated = [...selectedBatchCandidates];
    updated[index].selected = !updated[index].selected;
    setSelectedBatchCandidates(updated);
  };

  const selectAllStudents = () => {
    const updated = selectedBatchCandidates.map(student => ({
      ...student,
      selected: true
    }));
    setSelectedBatchCandidates(updated);
  };

  const deselectAllStudents = () => {
    const updated = selectedBatchCandidates.map(student => ({
      ...student,
      selected: false
    }));
    setSelectedBatchCandidates(updated);
  };

  const getSelectedStudentsCount = () => {
    return selectedBatchCandidates.filter(s => s.selected).length;
  };

  const addCandidateField = () => {
    setCandidates([...candidates, { name: "", email: "" }]);
  };
  
  const updateCandidate = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };
  
  const removeCandidateField = (index) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleBulkCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBulkCSVFile(file);
    setBulkCandidates([]);

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const rows = target.result.split("\n").slice(1);
      
      const parsed = rows
        .map((row) => {
          const cols = row.split(",");
          if (cols.length >= 2) {
            return {
              name: cols[0]?.trim(),
              email: cols[1]?.trim()
            };
          }
          return null;
        })
        .filter(candidate => candidate !== null && candidate.name && candidate.email);
      
      setBulkCandidates(parsed);
    };
    reader.readAsText(file);
  };

  const handleInvite = async () => {
    try {
      setInviting(true);
      
      // Check token
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login again. Token not found.");
        return;
      }
      
      let validCandidates = [];
      
      if (inviteMethod === "individual") {
        validCandidates = candidates.filter(c => c.name.trim() && c.email.trim());
        if (validCandidates.length === 0) {
          alert("Please add at least one candidate with name and email");
          return;
        }
      } else if (inviteMethod === "bulk") {
        if (!bulkCSVFile) {
          alert("Please upload a CSV file first.");
          return;
        }
        
        await uploadExamCandidatesCSV(examId, bulkCSVFile);
        setInviteSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      } else if (inviteMethod === "batch") {
        validCandidates = selectedBatchCandidates
          .filter(s => s.selected)
          .map(({ name, email }) => ({ name, email }));
        
        if (validCandidates.length === 0) {
          alert("Please select at least one student from the batch");
          return;
        }
      }

      // For individual and batch methods, use the multiple invite API
      await inviteMultipleCandidates(examId, validCandidates);

      setInviteSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error("Invitation error:", error);
      
      if (error.response?.status === 403) {
        alert("Access denied (403). Please check your authentication.");
      } else if (error.response?.status === 400) {
        alert("Invalid data format. Please check the candidate details.");
      } else {
        alert(`Failed to invite candidates: ${error.message}`);
      }
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Assign Candidates to: {examTitle}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
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
              
              {candidates.map((candidate, index) => (
                <div className="email-row" key={index}>
                  <input
                    type="text"
                    placeholder="Candidate Name"
                    value={candidate.name}
                    onChange={(e) => updateCandidate(index, "name", e.target.value)}
                    required
                  />
                  
                  <input
                    type="email"
                    placeholder="Candidate Email"
                    value={candidate.email}
                    onChange={(e) => updateCandidate(index, "email", e.target.value)}
                    required
                  />
                  
                  {candidates.length > 1 && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => removeCandidateField(index)}
                      title="Remove"
                    >
                      <span className="trash-icon">🗑</span>
                    </button>
                  )}
                </div>
              ))}
              
              <div className="candidate-count">
                <p>{candidates.length} candidate(s) added</p>
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
              
              {bulkCandidates.length > 0 && (
                <div className="candidate-preview">
                  <h4>Preview ({bulkCandidates.length} candidates)</h4>
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
                        {bulkCandidates.slice(0, 5).map((c, idx) => (
                          <tr key={idx}>
                            <td>{idx + 1}</td>
                            <td>{c.name}</td>
                            <td>{c.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {bulkCandidates.length > 5 && (
                    <p className="more-candidates">... and {bulkCandidates.length - 5} more candidates</p>
                  )}
                </div>
              )}
            </div>
          )}

          {inviteMethod === "batch" && (
            <div className="invite-section batch-section">
              <label>Select Batch</label>
              
              {/* Batch Search Dropdown */}
              <div className="batch-search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search for a batch..."
                    value={batchSearchTerm}
                    onChange={(e) => {
                      setBatchSearchTerm(e.target.value);
                      setShowBatchDropdown(true);
                      setSelectedBatch(null);
                    }}
                    onFocus={() => setShowBatchDropdown(true)}
                    className="batch-search-input"
                  />
                  {loadingBatches && <span className="search-spinner">⏳</span>}
                </div>

                {showBatchDropdown && batchSearchTerm && (
                  <div className="batch-dropdown">
                    {filteredBatches.length > 0 ? (
                      filteredBatches.map(batch => (
                        <div
                          key={batch.id}
                          className="batch-option"
                          onClick={() => handleBatchSelect(batch)}
                        >
                          <strong>{batch.name}</strong>
                          <small>{batch.description}</small>
                        </div>
                      ))
                    ) : (
                      <div className="no-batches">No batches found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Batch Info */}
              {selectedBatch && (
                <div className="selected-batch-info">
                  <h4>Selected Batch: {selectedBatch.name}</h4>
                  <p className="batch-description">{selectedBatch.description}</p>
                </div>
              )}

              {/* Students List */}
              {selectedBatch && (
                <div className="batch-students-section">
                  <div className="students-header">
                    <h4>Students in this batch</h4>
                    <div className="student-selection-actions">
                      <button 
                        className="small-btn"
                        onClick={selectAllStudents}
                        disabled={loadingStudents}
                      >
                        Select All
                      </button>
                      <button 
                        className="small-btn"
                        onClick={deselectAllStudents}
                        disabled={loadingStudents}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {loadingStudents ? (
                    <div className="loading-students">Loading students...</div>
                  ) : (
                    <>
                      <div className="students-count">
                        {getSelectedStudentsCount()} of {selectedBatchCandidates.length} students selected
                      </div>

                      <div className="students-list-container">
                        {selectedBatchCandidates.length > 0 ? (
                          selectedBatchCandidates.map((student, index) => (
                            <div key={index} className="student-item">
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={student.selected}
                                  onChange={() => toggleStudentSelection(index)}
                                />
                                <div className="student-info">
                                  <span className="student-name">{student.name}</span>
                                  <span className="student-email">{student.email}</span>
                                </div>
                              </label>
                            </div>
                          ))
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

        <div className="modal-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={inviting}
          >
            Cancel
          </button>
          <button 
            className="btn-invite" 
            onClick={handleInvite}
            disabled={
              inviting || 
              (inviteMethod === "batch" && getSelectedStudentsCount() === 0)
            }
          >
            {inviting ? "Inviting..." : inviteSuccess ? "✓ Invited!" : "Send Invitations"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignCandidatesModal;