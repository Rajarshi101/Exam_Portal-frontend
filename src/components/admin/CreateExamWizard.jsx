import { useState, useEffect } from "react";
import { 
  createExam, 
  publishExam, 
  inviteMultipleCandidates, 
  uploadExamCandidatesCSV,
  uploadQuestionsCSV
} from "../../api/examApi";
import { batchApi, studentApi } from "../../api/batchManagementApi";
import "../../styles/CreateExamWizard.css";
import "../../styles/CreateExamModal.css";

function CreateExamWizard() {
  const [createdExamId, setCreatedExamId] = useState(null);
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // STEP 1
  const [examDetails, setExamDetails] = useState({
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    duration: "",
    cutoff: "",
  });

  // STEP 2
  const [questions, setQuestions] = useState([]);
  const [questionsFile, setQuestionsFile] = useState(null);

  // STEP 3 - Invite Methods
  const [inviteMethod, setInviteMethod] = useState("individual");
  const [candidates, setCandidates] = useState([{ name: "", email: "" }]);
  const [bulkCandidates, setBulkCandidates] = useState([]);
  const [bulkCSVFile, setBulkCSVFile] = useState(null);

  // Batch related states
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  // const [batchStudents, setBatchStudents] = useState([]);
  const [batchPage, setBatchPage] = useState(0);
  const [batchTotalPages, setBatchTotalPages] = useState(1);
  const [batchTotal, setBatchTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedBatchCandidates, setSelectedBatchCandidates] = useState([]);

  // Fetch all batches on component mount
  useEffect(() => {
    fetchBatches("", 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatches(batchSearchTerm, 0);
    }, 400);

    return () => clearTimeout(timer);
  }, [batchSearchTerm]);

  // const fetchBatches = async () => {
  //   try {
  //     setLoadingBatches(true);
  //     const response = await batchApi.getAllBatches();
  //     setBatches(response.data || []);
  //   } catch (err) {
  //     console.error("Error fetching batches:", err);
  //   } finally {
  //     setLoadingBatches(false);
  //   }
  // };

  const fetchBatches = async (search = "", page = 0) => {
    try {
      setLoadingBatches(true);

      const response = await batchApi.getAllBatches({
        page,
        name: search || undefined,
      });

      if (response && response.data && Array.isArray(response.data)) {
        if (page > 0) {
          setBatches(prev => [...prev, ...response.data]);
        } else {
          setBatches(response.data);
        }

        setBatchPage(response.page || 0);
        setBatchTotalPages(response.totalPages || 1);
        setBatchTotal(response.total || 0);
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.error("Error fetching batches:", err);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  // const fetchBatchStudents = async (batchId) => {
  //   try {
  //     setLoadingStudents(true);
  //     const response = await studentApi.getStudentsByBatch(batchId);
  //     const data = response.data || [];
  //     setBatchStudents(data);
      
  //     // Format students for display
  //     const formattedStudents = data.map(student => ({
  //       id: student.id,
  //       name: student.name,
  //       email: student.email,
  //       selected: false
  //     }));
  //     setSelectedBatchCandidates(formattedStudents);
  //   } catch (err) {
  //     console.error("Error fetching batch students:", err);
  //   } finally {
  //     setLoadingStudents(false);
  //   }
  // };

  const fetchBatchStudents = async (batchId, search = "", page = 0) => {
    try {
      setLoadingStudents(true);

      const response = await studentApi.getStudentsByBatch(batchId, {
        page,
        search: search || undefined,
      });

      if (response && response.data && Array.isArray(response.data)) {
        const formattedStudents = response.data.map(student => ({
          id: student.id,
          name: student.name,
          email: student.email,
          selected: false,
        }));

        if (page > 0) {
          setSelectedBatchCandidates(prev => [...prev, ...formattedStudents]);
        } else {
          setSelectedBatchCandidates(formattedStudents);
        }

        setStudentPage(response.page || 0);
        setStudentTotalPages(response.totalPages || 1);
        setStudentTotal(response.total || 0);
      } else {
        setSelectedBatchCandidates([]);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setSelectedBatchCandidates([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setBatchSearchTerm(batch.name);
    setStudentSearchTerm("");
    setShowBatchDropdown(false);
    fetchBatchStudents(batch.id, "", 0);
  };

  // const filteredBatches = batches.filter(batch =>
  //   batch.name.toLowerCase().includes(batchSearchTerm.toLowerCase())
  // );

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

  /* ---------------- STEP 1 ---------------- */
  const handleDetailsChange = (e) => {
    setExamDetails({ ...examDetails, [e.target.name]: e.target.value });
  };

  const goToStep2 = async () => {
    if (Object.values(examDetails).some((v) => !v)) {
      alert("Fill all exam details.");
      return;
    }
    
    const start = new Date(examDetails.startDateTime);
    const end = new Date(examDetails.endDateTime);
    const durationMinutes = Number(examDetails.duration);

    if (durationMinutes <= 0) {
      alert("Duration must be greater than 0");
      return;
    }
    
    if (start >= end) {
      alert("Start time must be before end time.");
      return;
    }

    if (start < new Date()) {
      alert("Start time cannot be in the past.");
      return;
    }

    const diffMinutes = (end - start) / (1000 * 60);
    if (diffMinutes < durationMinutes) {
      alert(
        `Exam duration (${durationMinutes} min) must fit between start and end time.`
      );
      return;
    }

    const cutoff = Number(examDetails.cutoff);

    if (cutoff < 0 || cutoff > 100) {
      alert("Cutoff must be between 0 and 100");
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId") || 1;

      const res = await createExam(adminId, {
        title: examDetails.title,
        description: examDetails.description,
        duration: durationMinutes,
        startDate: examDetails.startDateTime,
        endDate: examDetails.endDateTime,
        cutoff: cutoff,
      });

      setCreatedExamId(res.data.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to create exam");
    }
  };

  /* ---------------- STEP 2 ---------------- */
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setQuestionsFile(file);

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const rows = target.result.split("\n").slice(1);
      
      const parsed = rows
        .map((row) => {
          const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (cols.length >= 7) {
            return cols.map(col => col.replace(/^"|"$/g, '').trim());
          }
          return null;
        })
        .filter(cols => cols !== null)
        .map((cols, idx) => ({
          id: idx + 1,
          question: cols[0] || "",
          options: [
            cols[1] || "",
            cols[2] || "",
            cols[3] || "",
            cols[4] || ""
          ],
          correctAnswer: cols[5] || "",
          marks: Number(cols[6]) || 0
        }));
      
      setQuestions(parsed);
    };
    reader.readAsText(file);
  };

  const goToStep3 = async () => {
    if (!questionsFile) {
      alert("Please upload a CSV file with questions.");
      return;
    }

    if (questions.length === 0) {
      alert("CSV file is empty or invalid format.");
      return;
    }

    try {
      setUploading(true);
      
      // Upload the CSV file
      await uploadQuestionsCSV(createdExamId, questionsFile);
      
      // Publish the exam
      await publishExam(createdExamId);
      
      setStep(3);
    } catch (err) {
      console.error("Upload error:", err);
      
      if (err.response?.status === 403) {
        alert("Access denied. Please check your authentication.");
      } else if (err.response?.status === 400) {
        alert("Invalid CSV format. Please check your file.");
      } else {
        alert("Failed to upload questions. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- STEP 3 ---------------- */
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

    // Parse for preview
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

  const handleStudentSearch = (e) => {
    const search = e.target.value;
    setStudentSearchTerm(search);

    if (window.studentSearchTimer) {
      clearTimeout(window.studentSearchTimer);
    }

    window.studentSearchTimer = setTimeout(() => {
      if (selectedBatch) {
        fetchBatchStudents(selectedBatch.id, search, 0);
      }
    }, 400);
  };

  const finishCreatingExam = async () => {
    try {
      setInviting(true);
      
      let validCandidates = [];
      
      if (inviteMethod === "individual") {
        validCandidates = candidates.filter(c => c.name.trim() && c.email.trim());
        if (validCandidates.length === 0) {
          alert("Please add at least one candidate with name and email");
          setInviting(false);
          return;
        }
      } else if (inviteMethod === "bulk") {
        if (!bulkCSVFile) {
          alert("Please upload a CSV file for candidates.");
          setInviting(false);
          return;
        }
        
        console.log("Uploading CSV file:", bulkCSVFile.name);
        await uploadExamCandidatesCSV(createdExamId, bulkCSVFile);
        
        setInviteSuccess(true);
        setTimeout(() => {
          resetForm();
        }, 2000);
        return;
      } else if (inviteMethod === "batch") {
        validCandidates = selectedBatchCandidates
          .filter(s => s.selected)
          .map(({ name, email }) => ({ name, email }));
        
        if (validCandidates.length === 0) {
          alert("Please select at least one student from the batch");
          setInviting(false);
          return;
        }
      }

      // For individual and batch methods, use the multiple invite API
      if (inviteMethod !== "bulk") {
        await inviteMultipleCandidates(createdExamId, validCandidates);
      }

      setInviteSuccess(true);
      alert("Exam created and candidates invited successfully ✅");
      
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (err) {
      console.error("Invitation error:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response?.status === 400) {
        alert("Invalid data format. Please check the candidate details.");
      } else if (err.response?.status === 403) {
        alert("Access denied. Please check your authentication.");
      } else {
        alert("Candidate invitation failed. Please try again.");
      }
    } finally {
      setInviting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setExamDetails({
      title: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      duration: "",
      cutoff: "",
    });
    setQuestions([]);
    setQuestionsFile(null);
    setCandidates([{ name: "", email: "" }]);
    setBulkCandidates([]);
    setBulkCSVFile(null);
    setSelectedBatch(null);
    setBatchSearchTerm("");
    setSelectedBatchCandidates([]);
    setCreatedExamId(null);
    setInviteSuccess(false);
  };

  return (
    <div className="wizard-container">
      {/* STEPS HEADER */}
      <div className="wizard-steps">
        <span className={step === 1 ? "active" : ""}>1. Exam Details</span>
        <span className={step === 2 ? "active" : ""}>2. Upload Questions</span>
        <span className={step === 3 ? "active" : ""}>3. Invite Students</span>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="wizard-step modal-card">

          <div className="note-box">
            <strong>Note:</strong> Dates should be in ISO format (YYYY-MM-DDTHH:MM:SS)
          </div>

          <div className="form-group">
            <label>
              Exam Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="Enter exam title"
              value={examDetails.title}
              onChange={handleDetailsChange}
            />
          </div>

          <div className="form-group">
            <label>
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter exam description"
              value={examDetails.description}
              onChange={handleDetailsChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="startDateTime"
                value={examDetails.startDateTime}
                onChange={handleDetailsChange}
              />
              <small className="helper-text">
                Will be sent as: YYYY-MM-DDTHH:MM:SS
              </small>
            </div>

            <div className="form-group">
              <label>
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDateTime"
                value={examDetails.endDateTime}
                onChange={handleDetailsChange}
              />
              <small className="helper-text">
                Will be sent as: YYYY-MM-DDTHH:MM:SS
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                placeholder="e.g., 60"
                value={examDetails.duration}
                onChange={handleDetailsChange}
              />
              <small className="error-text">
                Exam duration must fit between start and end time
              </small>
            </div>

            <div className="form-group">
              <label>
                Cutoff (%)
              </label>
              <input
                type="number"
                name="cutoff"
                placeholder="e.g., 40"
                value={examDetails.cutoff}
                onChange={handleDetailsChange}
                min="0"
                max="100"
                step="0.01"
              />
              <small className="helper-text">
                Candidate must score ≥ cutoff to qualify
              </small>
            </div>
          </div>

          <div className="step-actions">
            <button className="next-btn" onClick={goToStep2}>
              Next
            </button>
          </div>

        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="wizard-step modal-card">
          <div className="upload-section">
            <h3>Upload Questions CSV</h3>
            <div className="format-info">
              <p><strong>CSV Format:</strong></p>
              <p>text, optionA, optionB, optionC, optionD, correctOption, marks</p>
              <p><small>Example: "What is JVM?","Java Virtual Machine","Java Variable Method","Java Verified Mode","None","A",5</small></p>
            </div>
            
            <div className="file-upload-area">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleCSVUpload} 
                id="questions-csv-upload"
              />
              <label htmlFor="questions-csv-upload" className="upload-label">
                {questionsFile ? questionsFile.name : "Choose CSV File"}
              </label>
            </div>

            {questions.length > 0 && (
              <div className="question-preview">
                <h4>Preview ({questions.length} questions)</h4>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Question</th>
                      <th>Options</th>
                      <th>Correct</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.slice(0, 5).map((q) => (
                      <tr key={q.id}>
                        <td>{q.id}</td>
                        <td>{q.question}</td>
                        <td>
                          <strong>A:</strong> {q.options[0]}<br/>
                          <strong>B:</strong> {q.options[1]}<br/>
                          <strong>C:</strong> {q.options[2]}<br/>
                          <strong>D:</strong> {q.options[3]}
                        </td>
                        <td>{q.correctAnswer}</td>
                        <td>{q.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {questions.length > 5 && (
                  <p className="more-questions">... and {questions.length - 5} more questions</p>
                )}
                
                <div className="total-marks">
                  <p><strong>Total Marks:</strong> {questions.reduce((sum, q) => sum + q.marks, 0)}</p>
                </div>
              </div>
            )}

            <div className="step-actions">
              <button 
                className="next-btn" 
                onClick={goToStep3}
                disabled={!questionsFile || uploading}
              >
                {uploading ? "Uploading and Publishing..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="wizard-step modal-card">
          <h3 className="section-title">Invite Candidates</h3>

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

          {/* MANUAL ENTRY */}
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

          {/* BULK CSV UPLOAD */}
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
                  {bulkCandidates.length > 5 && (
                    <p className="more-candidates">... and {bulkCandidates.length - 5} more candidates</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* BATCH ASSIGNMENT */}
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
                  <span className="search-icon">🔍</span>
                  {loadingBatches && <span className="search-spinner">⏳</span>}
                </div>

                {showBatchDropdown && (
                  <div className="batch-dropdown">
                    {batches.length > 0 ? (
                      <>
                        {batches.map(batch => (
                          <div
                            key={batch.id}
                            className="batch-option"
                            onClick={() => handleBatchSelect(batch)}
                          >
                            <strong>{batch.name}</strong>
                            <small>{batch.description}</small>
                          </div>
                        ))}
                        {batchPage < batchTotalPages - 1 && (
                          <div
                            className="load-more"
                            onClick={() => fetchBatches(batchSearchTerm, batchPage + 1)}
                            style={{ padding: '8px', textAlign: 'center', cursor: 'pointer', color: '#0066cc' }}
                          >
                            Load more...
                          </div>
                        )}
                      </>
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
                    <div className="student-search">
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearchTerm}
                        onChange={handleStudentSearch}
                        className="student-search-input"
                      />
                      <span className="search-icon">🔍</span>
                    </div>
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
                        {getSelectedStudentsCount()} of {studentTotal} students selected
                      </div>

                      <div className="students-list-container">
                        {selectedBatchCandidates.length > 0 ? (
                          <>
                            {selectedBatchCandidates.map((student, index) => (
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
                            ))}

                            {studentPage < studentTotalPages - 1 && (
                              <div
                                className="load-more-students"
                                onClick={() =>
                                  fetchBatchStudents(selectedBatch.id, studentSearchTerm, studentPage + 1)
                                }
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

          <div className="step-actions">
            <button 
              className="finish-btn" 
              onClick={finishCreatingExam}
              disabled={
                inviting || 
                (inviteMethod === "batch" && getSelectedStudentsCount() === 0) ||
                (inviteMethod === "individual" && candidates.filter(c => c.name && c.email).length === 0) ||
                (inviteMethod === "bulk" && !bulkCSVFile)
              }
            >
              {inviting ? "Inviting..." : inviteSuccess ? "✓ Invited!" : "Finish & Send Invitations"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateExamWizard;