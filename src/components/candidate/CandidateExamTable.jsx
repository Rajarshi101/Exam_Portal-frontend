import { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { getStudentExams } from "../../api/candidateApi";

import "../../styles/ExamTable.css";
import "../../styles/CandidateExamTable.css";

function CandidateExamTable({ type, onStartExam }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [publishing, setPublishing] = useState({});

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [searchTitle, setSearchTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Empty string = all statuses
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTitle);
      setCurrentPage(0); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTitle]);

  // Fetch exams with pagination and filters
  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: 0,
        size: 1000,
      };

      // Add filters if they exist
      if (debouncedSearch.trim()) {
        params.title = debouncedSearch.trim();
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      console.log("Fetching exams with params:", params);
      
      // const response = await getStudentExams(params);
      // console.log("Exams response:", response.data);
      
      // setExams(response.data.data || []);

      const response = await getStudentExams(params);

      let examsData = response.data.data || [];

      examsData.sort((a, b) => b.examId - a.examId);

      // 🔥 APPLY FILTER HERE
      if (type === "upcoming") {
        examsData = examsData.filter(exam => {
          const status = exam.status?.toUpperCase();
          const inviteRemaining = exam.inviteRemaining;

          if (inviteRemaining === "EXPIRED") return false;

          return (
            status === "INVITED" ||
            status === "PENDING" ||
            status === "ONGOING"
          );
        });
      } else if (type === "past") {
        examsData = examsData.filter(exam => {
          const status = exam.status?.toUpperCase();
          const inviteRemaining = exam.inviteRemaining;

          return (
            status === "COMPLETED" ||
            status === "SUBMITTED" ||
            inviteRemaining === "EXPIRED"
          );
        });
      }

      // setExams(examsData);
      // setTotalPages(response.data.totalPages || 0);
      // setTotalExams(response.data.total || 0);
      // ✅ total AFTER filtering
      const totalFiltered = examsData.length;

      // ✅ slice data for current page
      const startIndex = currentPage * pageSize;
      const paginatedData = examsData.slice(
        startIndex,
        startIndex + pageSize
      );

      // ✅ set states
      setExams(paginatedData);
      setTotalExams(totalFiltered);
      setTotalPages(Math.ceil(totalFiltered / pageSize));

    } catch (error) {
      console.error("Error fetching exams:", error);
      alert("Failed to load exams");
      setExams([]);
      setTotalPages(0);
      setTotalExams(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, type]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);


  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not set";
    try {
      return new Date(dateTimeString).toLocaleString();
    } catch (error) {
      return dateTimeString;
    }
  };

  const getStatusBadge = (status) => {
    const statusText = status || "UNKNOWN";

    switch (statusText.toUpperCase()) {
      case "INVITED":
        return <span className="status-badge invited">Invited</span>;

      case "PENDING":
        return <span className="status-badge pending">Pending</span>;

      case "ONGOING":
        return <span className="status-badge ongoing">Ongoing</span>;

      case "COMPLETED":
        return <span className="status-badge completed">Completed</span>;

      case "SUBMITTED":
        return <span className="status-badge submitted">Submitted</span>;

      default:
        return <span className="status-badge unknown">{statusText}</span>;
    }
  };

  const hasExamStarted = (exam) => {
    if (!exam.startDate) return false;
    try {
      const now = new Date();
      const start = new Date(exam.startDate);
      return now >= start;
    } catch {
      return false;
    }
  };

  // const handleModalClose = () => {
  //   setShowAddQuestionsModal(false);
  //   setShowAssignCandidatesModal(false);
  //   setSelectedExam(null);
  //   fetchExams(); // Refresh exams after modal actions
  // };

  // const getExamActions = (exam) => {
  //   const status = exam.status?.toUpperCase() || "DRAFT";

  //   switch (status) {
  //     case "DRAFT":
  //       return (
  //         <div className="draft-actions">
  //           <button
  //             className="btn-action btn-add-questions"
  //             onClick={() => handleAddQuestions(exam)}
  //           >
  //             Add Questions
  //           </button>
  //           <button
  //             className="btn-action btn-publish"
  //             onClick={() => handlePublishExam(exam.id)}
  //             disabled={publishing[exam.id]}
  //           >
  //             {publishing[exam.id] ? "Publishing..." : "Publish Exam"}
  //           </button>
  //         </div>
  //       );

  //     case "PUBLISHED":
  //       if (hasExamStarted(exam)) {
  //         return (
  //           <button
  //             className="btn-action btn-monitor"
  //             onClick={() => onMonitorExam(exam.id)}
  //           >
  //             Monitor Exam
  //           </button>
  //         );
  //       } else {
  //         return (
  //           <button
  //             className="btn-action btn-assign-candidates"
  //             onClick={() => handleAssignCandidates(exam)}
  //           >
  //             Assign Candidates
  //           </button>
  //         );
  //       }

  //     case "COMPLETED":
  //       return (
  //         <button
  //           className="btn-action btn-view-results"
  //           onClick={() => onMonitorExam(exam.id)}
  //         >
  //           View Results
  //         </button>
  //       );

  //     case "ACTIVE":
  //       return (
  //         <button
  //           className="btn-action btn-monitor"
  //           onClick={() => onMonitorExam(exam.id)}
  //         >
  //           Monitor Exam
  //         </button>
  //       );

  //     default:
  //       return <span className="no-actions">No actions available</span>;
  //   }
  // };

  // const getExamStage = (exam) => {
  //   const status = exam.status?.toUpperCase() || "DRAFT";

  //   switch (status) {
  //     case "DRAFT":
  //       return "Add Questions & Publish";

  //     case "PUBLISHED":
  //       return hasExamStarted(exam)
  //         ? "Started - Monitor"
  //         : "Ready - Assign Candidates";

  //     case "ACTIVE":
  //       return "Active - Monitor";

  //     case "COMPLETED":
  //       return "Completed - View Results";

  //     default:
  //       return "Unknown";
  //   }
  // };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when page size changes
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(0); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearchTitle(e.target.value);
  };

  const clearFilters = () => {
    setSearchTitle("");
    setStatusFilter("");
    setCurrentPage(0);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited pages with ellipsis
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

  if (loading && exams.length === 0) {
    return <div className="loading">Loading exams...</div>;
  }

  return (
    <div className="exam-table-container">
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by exam title..."
            value={searchTitle}
            onChange={handleSearchChange}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-controls">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            
           
          </select>
          
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="page-size-select"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
          
          <button onClick={clearFilters} className="clear-filters-btn">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="results-count">
        Showing {exams.length} of {totalExams} exams
        {(debouncedSearch || statusFilter) && (
          <span className="active-filters">
            {debouncedSearch && ` (Search: "${debouncedSearch}")`}
            {statusFilter && ` (Status: ${statusFilter})`}
          </span>
        )}
      </div>

      {exams.length === 0 ? (
        <div className="no-exams">
          <p>No exams found</p>
          {debouncedSearch || statusFilter ? (
            <p className="hint">
              No exams match your search criteria. Try different filters.
            </p>
          ) : (
            <p className="hint">Click "Create New Exam" to get started</p>
          )}
        </div>
      ) : (
        <>
          <table className="exams-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Expires In</th>
                <th>
                    {type === "upcoming" && <span>Action</span>}
                    {type === "past" && <span>Score</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.examId}>
                  <td className="exam-title">
                    <strong>{exam.title || "Untitled Exam"}</strong>
                    {/* {exam.description && (
                      <small className="exam-desc">{exam.description}</small>
                    )}
                    <small>ID: {exam.id}</small> */}
                  </td>
                  <td>{exam.duration || 0} minutes</td>
                  <td>{getStatusBadge(exam.status)}</td>
                  <td>
                    <span
                      className={
                        exam.inviteRemaining === "EXPIRED"
                          ? "expire-badge expired"
                          : "expire-badge active"
                      }
                      title={
                        exam.inviteRemaining === "EXPIRED"
                          ? "Invitation time is over"
                          : `Time remaining: ${exam.inviteRemaining}`
                      }
                    >
                      {exam.inviteRemaining === "EXPIRED"
                        ? "Time Over"
                        : `⏳ ${exam.inviteRemaining}`
                      }
                    </span>
                  </td>
                  <td>
                    {type === "upcoming" && (
                      <button className="btn-action btn-monitor" onClick={() => onStartExam(exam.examId)}>Start</button>
                    )}
                    {type === "past" && <span>--</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                ← Previous
              </button>
              
              <div className="page-numbers">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                ))}
                
                {totalPages > 5 && currentPage < totalPages - 3 && (
                  <span className="ellipsis">...</span>
                )}
              </div>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Next →
              </button>
              
              <div className="page-info">
                Page {currentPage + 1} of {totalPages}
              </div>
            </div>
          )}

          <div className="table-footer">
            <p>Total Exams: {totalExams}</p>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-dot draft"></span> Draft: Add Questions
                & Publish
              </span>
              <span className="legend-item">
                <span className="legend-dot published"></span> Published: Assign
                Candidates
              </span>
              <span className="legend-item">
                <span className="legend-dot active"></span> Active/Completed:
                Monitor
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CandidateExamTable;