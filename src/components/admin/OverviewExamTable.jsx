// import { useEffect, useState } from "react";
// import { getExams } from "../../api/examApi";
import { useState, useEffect, useCallback } from "react";
import { getExams } from "../../api/examApi";
import { jwtDecode } from "jwt-decode";
import AddQuestionsModal from "./AddQuestionsModal";
import AssignCandidatesModal from "./AssignCandidatesModal";
import "../../styles/ExamTable.css";

function OverviewExamTable({ onSelectExam, selectedExamId }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false);
  const [showAssignCandidatesModal, setShowAssignCandidatesModal] = useState(false);
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
        page: currentPage,
        size: pageSize,
      };

      // Add filters if they exist
      if (debouncedSearch.trim()) {
        params.title = debouncedSearch.trim();
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }

      console.log("Fetching exams with params:", params);
      
      const response = await getExams(params);
      console.log("Exams response:", response.data);
      
      setExams(response.data.data || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalExams(response.data.total || 0);
    } catch (error) {
      console.error("Error fetching exams:", error);
      alert("Failed to load exams");
      setExams([]);
      setTotalPages(0);
      setTotalExams(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

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
      case "PUBLISHED":
        return <span className="status-badge published">Published</span>;
      case "DRAFT":
        return <span className="status-badge draft">Draft</span>;
    
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

  const handleModalClose = () => {
    setShowAddQuestionsModal(false);
    setShowAssignCandidatesModal(false);
    setSelectedExam(null);
    fetchExams(); // Refresh exams after modal actions
  };

//   const getExamActions = (exam) => {
//     return (
//         <button
//         className="btn-action btn-analytics"
//         onClick={() => onOpenAnalytics(exam.id)}
//         >
//         Open Analytics
//         </button>
//     );
//     };

  const getExamStage = (exam) => {
    const status = exam.status?.toUpperCase() || "DRAFT";

    switch (status) {
      case "DRAFT":
        return "Add Questions & Publish";

      case "PUBLISHED":
        return hasExamStarted(exam)
          ? "Started - Monitor"
          : "Ready - Assign Candidates";

      case "ACTIVE":
        return "Active - Monitor";

      case "COMPLETED":
        return "Completed - View Results";

      default:
        return "Unknown";
    }
  };

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
                <th>Status</th>
                {/* <th>Stage</th> */}
                {/* <th>Duration</th> */}
                <th>Start Date</th>
                {/* <th>End Date</th> */}
                {/* <th>Actions</th> */}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr
                    key={exam.id}
                    className={`clickable-row ${selectedExamId === exam.id ? "selected-row" : ""}`}
                    onClick={() => onSelectExam(exam.id)}
                >
                  <td className="exam-title">
                    <strong>{exam.title || "Untitled Exam"}</strong>
                    {exam.description && (
                      <small className="exam-desc">{exam.description}</small>
                    )}
                    <small>ID: {exam.id}</small>
                  </td>
                  <td>{getStatusBadge(exam.status)}</td>
                  {/* <td>
                    <span className="exam-stage">{getExamStage(exam)}</span>
                  </td> */}
                  {/* <td>{exam.duration || 0} minutes</td> */}
                  <td>{formatDateTime(exam.startDate)}</td>
                  {/* <td>{formatDateTime(exam.endDate)}</td> */}
                  {/* <td>
                    <div className="action-buttons">{getExamActions(exam)}</div>
                  </td> */}
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

export default OverviewExamTable;