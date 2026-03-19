import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import batchManagementApi from "../../api/batchManagementApi";
import "../../styles/BatchManagement.css";

function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [batchStudentCounts, setBatchStudentCounts] = useState({}); // Store counts per batch
  
  // Batch pagination and search states
  const [batchCurrentPage, setBatchCurrentPage] = useState(0);
  const [batchTotalPages, setBatchTotalPages] = useState(0);
  const [batchTotalBatches, setBatchTotalBatches] = useState(0);
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [debouncedBatchSearch, setDebouncedBatchSearch] = useState("");

  // Student pagination and search states
  const [studentCurrentPage, setStudentCurrentPage] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(0);
  const [studentTotalStudents, setStudentTotalStudents] = useState(0);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  
  // Add Students Modal states
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [addMethod, setAddMethod] = useState(null);
  const [manualEntries, setManualEntries] = useState([{ name: "", email: "", emailError: "" }]);
  const [csvData, setCsvData] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvErrors, setCsvErrors] = useState([]);
  const [processingUsers, setProcessingUsers] = useState(false);
  const [checkUsersResult, setCheckUsersResult] = useState(null);
  const [inviteExpiryHours, setInviteExpiryHours] = useState(24);
  const [showInviteSection, setShowInviteSection] = useState(false);
  
  // Form state for create batch
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Debounce batch search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBatchSearch(batchSearchTerm);
      setBatchCurrentPage(0); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [batchSearchTerm]);

  // Debounce student search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStudentSearch(studentSearchTerm);
      setStudentCurrentPage(0); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [studentSearchTerm]);

  // Fetch all batches with pagination and search
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: batchCurrentPage,
        size: 10, // Always 10 per page
      };

      if (debouncedBatchSearch.trim()) {
        params.name = debouncedBatchSearch.trim();
      }

      console.log("Fetching batches with params:", params);
      
      const response = await batchManagementApi.batch.getAllBatches(params);
      console.log("Batches response:", response);
      
      setBatches(response.data || []);
      setBatchTotalPages(response.totalPages || 0);
      setBatchTotalBatches(response.total || 0);
      
      // Fetch student counts for each batch
      if (response.data && response.data.length > 0) {
        await fetchBatchStudentCounts(response.data);
      }
      
      setError(null);
    } catch (err) {
      setError(err.error || "Failed to load batches");
      console.error("Error fetching batches:", err);
      setBatches([]);
      setBatchTotalPages(0);
      setBatchTotalBatches(0);
    } finally {
      setLoading(false);
    }
  }, [batchCurrentPage, debouncedBatchSearch]);

  // Fetch student counts for a list of batches
  const fetchBatchStudentCounts = async (batchesList) => {
    try {
      const counts = {};
      
      // Fetch student counts for each batch (first page only to get total)
      await Promise.all(
        batchesList.map(async (batch) => {
          try {
            const response = await batchManagementApi.student.getStudentsByBatch(batch.id, {
              page: 0,
              size: 1 // Just get 1 record to get the total count
            });
            counts[batch.id] = response.total || 0;
          } catch (err) {
            console.error(`Error fetching count for batch ${batch.id}:`, err);
            counts[batch.id] = 0;
          }
        })
      );
      
      setBatchStudentCounts(counts);
    } catch (err) {
      console.error("Error fetching batch student counts:", err);
    }
  };

  // Update student count for a specific batch
  const updateBatchStudentCount = (batchId, newCount) => {
    setBatchStudentCounts(prev => ({
      ...prev,
      [batchId]: newCount
    }));
  };

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Fetch students for a specific batch with pagination and search
  const fetchStudents = useCallback(async (batchId, page = 0) => {
    if (!batchId) return;
    
    try {
      setStudentsLoading(true);
      
      const params = {
        page: page,
        size: 10, // Always 10 per page
      };

      // Use debouncedStudentSearch here
      if (debouncedStudentSearch.trim()) {
        params.search = debouncedStudentSearch.trim();
      }

      console.log(`Fetching students for batch ${batchId} with params:`, params);
      
      const response = await batchManagementApi.student.getStudentsByBatch(batchId, params);
      console.log("Students response:", response);
      
      setStudents(response.data || []);
      setStudentTotalPages(response.totalPages || 0);
      setStudentTotalStudents(response.total || 0);
      
      // Update the batch student count with the total from response
      updateBatchStudentCount(batchId, response.total || 0);
      
    } catch (err) {
      console.error("Error fetching students:", err);
      // Don't show alert for every search, just log the error
      setStudents([]);
      setStudentTotalPages(0);
      setStudentTotalStudents(0);
    } finally {
      setStudentsLoading(false);
    }
  }, [debouncedStudentSearch]); // Important: depends on debouncedStudentSearch

  // Effect to trigger fetch when debounced search or page changes
  useEffect(() => {
    if (selectedBatch) {
      fetchStudents(selectedBatch.id, studentCurrentPage);
    }
  }, [debouncedStudentSearch, studentCurrentPage, selectedBatch?.id, fetchStudents]);

  // Handle view students
  const handleViewStudents = (batch) => {
    setSelectedBatch(batch);
    setStudentSearchTerm(""); // Reset search
    setDebouncedStudentSearch(""); // Reset debounced search
    setStudentCurrentPage(0); // Reset to first page
    setShowStudentsModal(true);
    // fetchStudents will be called by the useEffect above
  };

  // Handle student page change
  const handleStudentPageChange = (page) => {
    setStudentCurrentPage(page);
    // fetchStudents will be called by the useEffect above
  };

  // Handle student search change
  const handleStudentSearchChange = (e) => {
    const value = e.target.value;
    setStudentSearchTerm(value);
    // The debounce effect will handle updating debouncedStudentSearch
    // which will then trigger fetchStudents via the useEffect
  };

  // Clear student filters
  const clearStudentFilters = () => {
    setStudentSearchTerm("");
    setDebouncedStudentSearch("");
    setStudentCurrentPage(0);
  };

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  // Name validation function
  const validateName = (name) => {
    if (!name || !name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  // Check if manual entries are valid
  const validateManualEntries = () => {
    let isValid = true;
    const updatedEntries = manualEntries.map(entry => {
      const nameError = validateName(entry.name);
      const emailError = validateEmail(entry.email);
      if (nameError || emailError) isValid = false;
      return {
        ...entry,
        nameError,
        emailError
      };
    });
    setManualEntries(updatedEntries);
    return isValid;
  };

  // Validate CSV data
  const validateCSVData = (data) => {
    const errors = [];
    const validData = [];
    
    data.forEach((row, index) => {
      const nameError = validateName(row.name);
      const emailError = validateEmail(row.email);
      
      if (!nameError && !emailError) {
        validData.push(row);
      } else {
        errors.push({
          row: index + 1,
          name: row.name,
          email: row.email,
          nameError,
          emailError
        });
      }
    });
    
    return { validData, errors };
  };

  // Handle form input change for create batch
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError("");
  };

  // Handle create batch using API
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError("Batch name is required");
      return;
    }

    try {
      await batchManagementApi.batch.createBatch(formData);
      
      setFormSuccess("Batch created successfully!");
      setFormData({ name: "", description: "" });
      fetchBatches();
      
      setTimeout(() => setFormSuccess(""), 3000);
      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess("");
      }, 1000);
      
    } catch (err) {
      setFormError(err.error || "Failed to create batch. Please try again.");
      console.error("Error creating batch:", err);
    }
  };

  // Handle add students
  const handleAddStudents = (batch) => {
    setSelectedBatch(batch);
    setAddMethod(null);
    setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
    setCsvData([]);
    setCsvFileName("");
    setCsvErrors([]);
    setCheckUsersResult(null);
    setShowInviteSection(false);
    setInviteExpiryHours(24);
    setShowAddStudentsModal(true);
  };

  // Manual entry handlers
  const handleManualEntryChange = (index, field, value) => {
    const updated = [...manualEntries];
    updated[index][field] = value;
    
    if (field === 'email') {
      updated[index].emailError = "";
    } else if (field === 'name') {
      updated[index].nameError = "";
    }
    
    setManualEntries(updated);
  };

  const handleManualEntryBlur = (index, field, value) => {
    const updated = [...manualEntries];
    if (field === 'email') {
      updated[index].emailError = validateEmail(value);
    } else if (field === 'name') {
      updated[index].nameError = validateName(value);
    }
    setManualEntries(updated);
  };

  const addManualEntry = () => {
    setManualEntries([...manualEntries, { name: "", email: "", nameError: "", emailError: "" }]);
  };

  const removeManualEntry = (index) => {
    if (manualEntries.length > 1) {
      setManualEntries(manualEntries.filter((_, i) => i !== index));
    }
  };

  // CSV upload handler
  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvErrors([]);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        if (!headers.includes('name') || !headers.includes('email')) {
          alert("CSV must contain 'name' and 'email' columns");
          return;
        }

        const rawData = results.data.map(row => ({
          name: row.name?.trim() || "",
          email: row.email?.trim() || ""
        }));

        const { validData, errors } = validateCSVData(rawData);
        
        if (errors.length > 0) {
          setCsvErrors(errors);
        }
        
        if (validData.length > 0) {
          setCsvData(validData);
        } else {
          setCsvData([]);
        }

        if (validData.length === 0 && errors.length > 0) {
          alert("No valid entries found in CSV. Please check the errors below.");
        }
      },
      error: (error) => {
        alert("Error parsing CSV file: " + error.message);
      }
    });
  };

  // Get users array based on selected method
  const getUsersArray = () => {
    if (addMethod === 'manual') {
      return manualEntries
        .filter(entry => entry.name.trim() !== "" && entry.email.trim() !== "")
        .map(({ name, email }) => ({ name: name.trim(), email: email.trim() }));
    } else if (addMethod === 'csv') {
      return csvData;
    }
    return [];
  };

  // Check if form is valid before proceeding
  const isFormValid = () => {
    if (addMethod === 'manual') {
      const hasValidEntries = manualEntries.some(entry => 
        entry.name.trim() !== "" && 
        entry.email.trim() !== "" && 
        !validateName(entry.name) && 
        !validateEmail(entry.email)
      );
      
      const noErrors = manualEntries.every(entry => 
        !entry.nameError && !entry.emailError
      );
      
      return hasValidEntries && noErrors;
    } else if (addMethod === 'csv') {
      return csvData.length > 0 && csvErrors.length === 0;
    }
    return false;
  };

  // Check users before adding using API
  const handleCheckUsers = async () => {
    if (addMethod === 'manual') {
      if (!validateManualEntries()) {
        alert("Please fix the errors in the form");
        return;
      }
    }

    const users = getUsersArray();
    
    if (users.length === 0) {
      alert("Please add at least one valid user");
      return;
    }

    try {
      setProcessingUsers(true);
      const result = await batchManagementApi.student.checkUsers(users);
      setCheckUsersResult(result);

      if (result.allExists) {
        await handleAddUsersToBatch(users);
      } else {
        setShowInviteSection(true);
      }
    } catch (err) {
      alert(err.error || "Error checking users");
    } finally {
      setProcessingUsers(false);
    }
  };

  // Add users to batch using appropriate API
  const handleAddUsersToBatch = async (users) => {
    try {
      if (checkUsersResult && !checkUsersResult.allExists && inviteExpiryHours) {
        await batchManagementApi.student.addNewUsersWithInvite(
          selectedBatch.id,
          users,
          inviteExpiryHours
        );
      } else {
        await batchManagementApi.student.addExistingUsersToBatch(
          selectedBatch.id,
          users
        );
      }

      alert("Users added successfully!");
      
      // Update student count for this batch
      const newCount = (batchStudentCounts[selectedBatch.id] || 0) + users.length;
      updateBatchStudentCount(selectedBatch.id, newCount);
      
      // Reset and close modal
      setShowAddStudentsModal(false);
      setAddMethod(null);
      setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
      setCsvData([]);
      setCsvErrors([]);
      setCheckUsersResult(null);
      setShowInviteSection(false);
      
      // Refresh students list if modal is open
      if (showStudentsModal) {
        fetchStudents(selectedBatch.id, studentCurrentPage);
      }
      
    } catch (err) {
      alert(err.error || "Error adding users");
    }
  };

  // Proceed with adding users
  const handleProceedAddUsers = async () => {
    const users = getUsersArray();
    
    if (checkUsersResult && !checkUsersResult.allExists) {
      const newUsersList = checkUsersResult.newUsers.join("\n");
      alert(`New users found (${checkUsersResult.newUserCount}):\n${newUsersList}\n\nThey will receive invitations.`);
    }
    
    await handleAddUsersToBatch(users);
  };

  // Delete student handler
  const handleDeleteStudent = async (student) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${student.name}" (ID: ${student.id}) from this batch?`
    );
    
    if (!confirmDelete) return;

    try {
      setStudentsLoading(true);
      
      console.log(`Deleting student with ID: ${student.id} from batch ID: ${selectedBatch.id}`);
      
      await batchManagementApi.student.deleteStudentFromBatch(selectedBatch.id, student.id);
      
      // Update student count for this batch
      const newCount = Math.max((batchStudentCounts[selectedBatch.id] || 1) - 1, 0);
      updateBatchStudentCount(selectedBatch.id, newCount);
      
      // Refresh students list after deletion
      fetchStudents(selectedBatch.id, studentCurrentPage);
      
      alert(`"${student.name}" has been removed from the batch successfully!`);
      
    } catch (err) {
      console.error("Error deleting student:", err);
      alert(err.error || "Failed to remove student from batch. Please try again.");
    } finally {
      setStudentsLoading(false);
    }
  };

  // Batch pagination handlers
  const handleBatchPageChange = (page) => {
    setBatchCurrentPage(page);
  };

  const handleBatchSearchChange = (e) => {
    setBatchSearchTerm(e.target.value);
  };

  const clearBatchFilters = () => {
    setBatchSearchTerm("");
    setDebouncedBatchSearch("");
    setBatchCurrentPage(0);
  };

  // Generate page numbers for pagination
  const getPageNumbers = (currentPage, totalPages) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage >= totalPages) {
        endPage = totalPages - 1;
        startPage = Math.max(0, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  if (loading && batches.length === 0) {
    return <div className="loading">Loading batches...</div>;
  }

  return (
    <div className="batch-management">
      <div className="batch-header">
        <h1>Batch Management</h1>
        <button 
          className="btn-create-batch"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Batch
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      <div className="batch-table-container">
      {/* Search and Filter Section for Batches */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by batch name..."
            value={batchSearchTerm}
            onChange={handleBatchSearchChange}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <button onClick={clearBatchFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results count for batches */}
      <div className="results-count">
        Showing {batches.length} of {batchTotalBatches} batches
        {debouncedBatchSearch && (
          <span className="active-filters">
            {` (Search: "${debouncedBatchSearch}")`}
          </span>
        )}
      </div>

      {batches.length === 0 ? (
        <div className="no-batches">
          <p>No batches found</p>
          {debouncedBatchSearch ? (
            <p className="hint">
              No batches match your search criteria. Try different search term.
            </p>
          ) : (
            <p className="hint">Click "Create New Batch" to get started</p>
          )}
        </div>
      ) : (
        <>
            <table className="batch-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Batch Name</th>
                  <th>Description</th>
                  <th>Students Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch.id}>
                    <td>{batch.id}</td>
                    <td className="batch-name">{batch.name}</td>
                    <td className="batch-description">{batch.description}</td>
                    <td className="student-count">
                      <span className="count-badge">
                        {batchStudentCounts[batch.id] !== undefined ? batchStudentCounts[batch.id] : 0}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-view"
                        onClick={() => handleViewStudents(batch)}
                        title="View Students"
                      >
                        <i className="fas fa-eye"></i>
                        <span>View</span>
                      </button>
                      <button 
                        className="btn-add"
                        onClick={() => handleAddStudents(batch)}
                        title="Add Students"
                      >
                        <i className="fas fa-user-plus"></i>
                        <span>Add</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          {/* Pagination for Batches */}
          {batchTotalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handleBatchPageChange(batchCurrentPage - 1)}
                disabled={batchCurrentPage === 0}
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {getPageNumbers(batchCurrentPage, batchTotalPages).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-number ${batchCurrentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handleBatchPageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                
                {batchTotalPages > 5 && batchCurrentPage < batchTotalPages - 3 && (
                  <span className="ellipsis">...</span>
                )}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handleBatchPageChange(batchCurrentPage + 1)}
                disabled={batchCurrentPage >= batchTotalPages - 1}
              >
                Next →
              </button>
              
              <div className="page-info">
                Page {batchCurrentPage + 1} of {batchTotalPages}
              </div>
            </div>
          )}
        </>
      )}
      </div>


      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Batch</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError("");
                  setFormSuccess("");
                  setFormData({ name: "", description: "" });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <form onSubmit={handleCreateBatch}>
              <div className="form-group">
                <label htmlFor="name">Batch Name </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter batch name"
                  className={formError ? "error" : ""}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter batch description"
                  rows="3"
                />
              </div>

              {formError && (
                <div className="form-error">{formError}</div>
              )}

              {formSuccess && (
                <div className="form-success">{formSuccess}</div>
              )}
            </form>
            </div>
            <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormError("");
                    setFormSuccess("");
                    setFormData({ name: "", description: "" });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Batch
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal with Search and Pagination */}
      {showStudentsModal && (
        <div className="modal-overlay">
          <div className="modal-content students-modal">
            <div className="modal-header">
              <h2>Students in {selectedBatch?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedBatch(null);
                  setStudents([]);
                  setStudentSearchTerm("");
                  setDebouncedStudentSearch("");
                  setStudentCurrentPage(0);
                }}
              >
                ×
              </button>
            </div>

            {/* Clean Search Bar - No Button */}
            <div className="search-bar-container">
              <div className="search-box">
                {/* <i className="fas fa-search search-icon"></i> */}
                <input
                  type="text"
                  placeholder="Search by name, email, or ID... (type to search)"
                  value={studentSearchTerm}
                  onChange={handleStudentSearchChange}
                  className="search-input"
                  autoFocus
                />
                <span class="search-icon">🔍</span>
                {studentSearchTerm && (
                  <button 
                    className="clear-search-icon"
                    onClick={clearStudentFilters}
                    title="Clear search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {studentSearchTerm && !studentsLoading && (
                <div className="search-hint">
                  Searching for "{studentSearchTerm}"...
                </div>
              )}
            </div>

            {/* Results count for students */}
            <div className="results-count">
              {studentTotalStudents > 0 ? (
                <>Showing {students.length} of {studentTotalStudents} students</>
              ) : (
                <>No students found</>
              )}
              {debouncedStudentSearch && (
                <span className="active-filters">
                  {` (Search: "${debouncedStudentSearch}")`}
                </span>
              )}
            </div>

            {studentsLoading ? (
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i> Loading students...
              </div>
            ) : (
              <div className="students-list">
                {students.length > 0 ? (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id}>
                          <td>{student.id}</td>
                          <td>{student.name}</td>
                          <td>{student.email}</td>
                          <td className="actions-cell">
                            <button 
                              className="btn-delete-student"
                              onClick={() => handleDeleteStudent(student)}
                              title="Remove"
                              style={{zIndex: 1}}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-results">
                    <i className="fas fa-search"></i>
                    <p>No students found</p>
                    {debouncedStudentSearch ? (
                      <>
                        <p className="hint">No results match "{debouncedStudentSearch}"</p>
                        <button 
                          onClick={clearStudentFilters} 
                          className="clear-search-btn"
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <p className="hint">This batch doesn't have any students yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pagination for Students */}
            {studentTotalPages > 1 && students.length > 0 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handleStudentPageChange(studentCurrentPage - 1)}
                  disabled={studentCurrentPage === 0}
                >
                  ← Previous
                </button>
                
                <div className="page-numbers">
                  {getPageNumbers(studentCurrentPage, studentTotalPages).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-number ${studentCurrentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handleStudentPageChange(pageNum)}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                  
                  {studentTotalPages > 5 && studentCurrentPage < studentTotalPages - 3 && (
                    <span className="ellipsis">...</span>
                  )}
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => handleStudentPageChange(studentCurrentPage + 1)}
                  disabled={studentCurrentPage >= studentTotalPages - 1}
                >
                  Next →
                </button>
                
                <div className="page-info">
                  Page {studentCurrentPage + 1} of {studentTotalPages}
                </div>
              </div>
            )}

            <div className="modal-footer">
              {/* <button 
                className="btn-cancel"
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedBatch(null);
                  setStudents([]);
                  setStudentSearchTerm("");
                  setDebouncedStudentSearch("");
                  setStudentCurrentPage(0);
                }}
              >
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddStudentsModal && (
        <div className="modal-overlay">
          <div className="modal-content add-students-modal">
            <div className="modal-header">
              <h2>Add Students to {selectedBatch?.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddStudentsModal(false);
                  setAddMethod(null);
                  setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
                  setCsvData([]);
                  setCsvErrors([]);
                  setCheckUsersResult(null);
                  setShowInviteSection(false);
                }}
              >
                ×
              </button>
            </div>

            {!addMethod ? (
              <div className="method-selection">
                <h3>Choose addition method:</h3>
                <div className="method-buttons">
                  <button 
                    className="method-btn"
                    onClick={() => setAddMethod('manual')}
                  >
                    <i className="fas fa-pen"></i>
                    Manual Entry
                  </button>
                  <button 
                    className="method-btn"
                    onClick={() => setAddMethod('csv')}
                  >
                    <i className="fas fa-file-csv"></i>
                    CSV Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="add-method-content">
                {addMethod === 'manual' && (
                  <div className="manual-entries">
                    <h3>Manual Entry</h3>
                    {manualEntries.map((entry, index) => (
                      <div key={index} className="email-row">
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={entry.name}
                            onChange={(e) => handleManualEntryChange(index, 'name', e.target.value)}
                            onBlur={(e) => handleManualEntryBlur(index, 'name', e.target.value)}
                            
                          />
                          {/* {entry.nameError && (
                            <span className="field-error">{entry.nameError}</span>
                          )} */}
                        </div>
                        <div className="input-group">
                          <input
                            type="email"
                            placeholder="Email Address"
                            value={entry.email}
                            onChange={(e) => handleManualEntryChange(index, 'email', e.target.value)}
                            onBlur={(e) => handleManualEntryBlur(index, 'email', e.target.value)}
                            
                          />
                          {/* {entry.emailError && (
                            <span className="field-error">{entry.emailError}</span>
                          )} */}
                        </div>
                        <button 
                          className="btn-delete-student"
                          onClick={() => removeManualEntry(index)}
                          disabled={manualEntries.length === 1}
                          title="Remove"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    ))}
                    <button className="add-entry-btn" onClick={addManualEntry}>
                      <i className="fas fa-plus"></i> Add Another Student
                    </button>
                  </div>
                )}

                {addMethod === 'csv' && (
                  <div className="csv-upload">
                    <h3>CSV Upload</h3>
                    <div className="csv-upload-area">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        id="csv-input"
                      />
                      <label htmlFor="csv-input" className="csv-label">
                        <i className="fas fa-cloud-upload-alt"></i>
                        {csvFileName ? csvFileName : "Choose CSV file"}
                      </label>
                      <p className="csv-hint">
                        CSV must have columns: name, email
                      </p>
                    </div>

                    {csvErrors.length > 0 && (
                      <div className="csv-errors">
                        <h4>Validation Errors ({csvErrors.length}):</h4>
                        <div className="errors-list">
                          {csvErrors.map((error, idx) => (
                            <div key={idx} className="error-item">
                              <strong>Row {error.row}:</strong>
                              {error.nameError && <span> {error.nameError}</span>}
                              {error.emailError && <span> {error.emailError}</span>}
                              <small>({error.name} - {error.email})</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {csvData.length > 0 && csvErrors.length === 0 && (
                      <div className="csv-preview">
                        <h4>✓ {csvData.length} valid entr{csvData.length === 1 ? 'y' : 'ies'} ready to add</h4>
                        <div className="preview-list">
                          {csvData.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="preview-item valid">
                              <span>{item.name}</span>
                              <span>{item.email}</span>
                            </div>
                          ))}
                          {csvData.length > 5 && (
                            <p>... and {csvData.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showInviteSection && checkUsersResult && !checkUsersResult.allExists && (
                  <div className="invite-section">
                    <h3>Invite New Users</h3>
                    <div className="new-users-info">
                      <p className="new-users-count">
                        {checkUsersResult.newUserCount} new user(s) found:
                      </p>
                      <ul className="new-users-list">
                        {checkUsersResult.newUsers.map((email, idx) => (
                          <li key={idx}>
                            <i className="fas fa-envelope"></i> {email}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="form-group">
                      <label htmlFor="inviteExpiry">Invitation Expiry (hours)</label>
                      <input
                        type="number"
                        id="inviteExpiry"
                        min="1"
                        max="720"
                        value={inviteExpiryHours}
                        onChange={(e) => setInviteExpiryHours(e.target.value)}
                      />
                      <small className="help-text">Set how many hours the invitation link should be valid</small>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="modal-footer">
                  <button 
                    className="btn-cancel"
                    onClick={() => {
                      setAddMethod(null);
                      setManualEntries([{ name: "", email: "", nameError: "", emailError: "" }]);
                      setCsvData([]);
                      setCsvErrors([]);
                      setCheckUsersResult(null);
                      setShowInviteSection(false);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i> Back
                  </button>
                  {!checkUsersResult ? (
                    <button 
                      className="btn-submit"
                      onClick={handleCheckUsers}
                      disabled={processingUsers || !isFormValid()}
                    >
                      {processingUsers ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Checking...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle"></i> Check Users
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      className="btn-submit"
                      onClick={handleProceedAddUsers}
                      disabled={processingUsers}
                    >
                      {processingUsers ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Adding...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus"></i> Add to Batch
                        </>
                      )}
                    </button>
                  )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchManagement;