import { useState, useEffect } from "react";
import {
  getExams,
  getExamSubmissions,
  getExamQuestions,
} from "../../api/examApi";
import SecureSnapshotImage from "./SecureSnapshotImage";
import "../../styles/AdminMonitoringDashboard.css";

function AdminMonitoringDashboard({ examId, onMonitorExam, onBack }) {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState(null);
  const [examQuestions, setExamQuestions] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState({});

  useEffect(() => {
    if (examId) {
      fetchSubmissions(examId);
      fetchExamQuestions(examId);
    } else {
      fetchExams();
    }
  }, [examId]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await getExams();
      setExams(response.data || []);
    } catch (error) {
      console.error("Error fetching exams:", error);
      alert("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (id) => {
    try {
      setSubmissionsLoading(true);
      const response = await getExamSubmissions(id);
      setSubmissions(response.data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      alert("Failed to load submissions");
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const fetchExamQuestions = async (id) => {
    try {
      setQuestionsLoading((prev) => ({ ...prev, [id]: true }));
      const response = await getExamQuestions(id);
      setExamQuestions((prev) => ({
        ...prev,
        [id]: response.data || [],
      }));
    } catch (error) {
      console.error("Error fetching exam questions:", error);
    } finally {
      setQuestionsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleViewSnapshot = (submissionId) => {
    setExpandedSubmission((prev) =>
      prev === submissionId ? null : submissionId,
    );
    // Close answers when opening snapshots
    setExpandedAnswers(null);
  };

  const handleViewAnswers = (submissionId) => {
    setExpandedAnswers((prev) => (prev === submissionId ? null : submissionId));
    // Close snapshots when opening answers
    setExpandedSubmission(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PUBLISHED":
        return <span className="status-badge published">Published</span>;
      case "DRAFT":
        return <span className="status-badge draft">Draft</span>;
      default:
        return <span className="status-badge unknown">{status}</span>;
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Not started";
    return new Date(dateTimeString).toLocaleString();
  };

  const calculateProgress = (submission) => {
    if (!submission.startedAt) return 0;
    if (submission.completed) return 100;
    return 50;
  };

  const getAnswerStatus = (questionId, submissionAnswers, correctOption) => {
    const userAnswer = submissionAnswers?.[questionId];
    if (!userAnswer) return "not-answered";
    return userAnswer === correctOption ? "correct" : "incorrect";
  };

  const renderAnswersPreview = (submission, questions) => {
    if (!questions || questions.length === 0) {
      return (
        <div className="no-questions-message">
          <p>No questions available for this exam</p>
        </div>
      );
    }

    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(submission.answers || {}).length;
    const answeredPercentage = (answeredQuestions / totalQuestions) * 100;

    return (
      <div className="answers-preview-container">
        <div className="answers-header">
          <h4>Answers for {submission.candidateName}</h4>
          <div className="answers-summary">
            <div className="summary-stats">
              <span className={`stat-badge total`}>
                Total: {totalQuestions}
              </span>
              <span className={`stat-badge answered`}>
                Answered: {answeredQuestions}
              </span>
              <span className={`stat-badge not-answered`}>
                Not Answered: {totalQuestions - answeredQuestions}
              </span>
              <span className={`stat-badge correct`}>
                Correct:{" "}
                {
                  questions.filter(
                    (q) => submission.answers?.[q.id] === q.correctOption,
                  ).length
                }
              </span>
              <span className={`stat-badge incorrect`}>
                Incorrect:{" "}
                {
                  questions.filter(
                    (q) =>
                      submission.answers?.[q.id] &&
                      submission.answers[q.id] !== q.correctOption,
                  ).length
                }
              </span>
            </div>
            <div className="progress-bar small">
              <div
                className="progress-fill"
                style={{ width: `${answeredPercentage}%` }}
              ></div>
              <span className="progress-text">
                {answeredPercentage.toFixed(1)}% Answered
              </span>
            </div>
          </div>
        </div>

        <div className="questions-list">
          {questions.map((question, index) => {
            const userAnswer = submission.answers?.[question.id];
            const isCorrect = userAnswer === question.correctOption;
            const status = getAnswerStatus(
              question.id,
              submission.answers,
              question.correctOption,
            );

            return (
              <div key={question.id} className={`question-item ${status}`}>
                <div className="question-header">
                  <span className="question-number">Q{index + 1}.</span>
                  <span className="question-marks">
                    [{question.marks} marks]
                  </span>
                  <span className={`answer-status ${status}`}>
                    {status === "correct" && "✅ Correct"}
                    {status === "incorrect" && "❌ Incorrect"}
                    {status === "not-answered" && "⭕ Not Answered"}
                  </span>
                </div>
                <div className="question-text">{question.text}</div>
               
                <div className="options-grid">
                  {question.options &&
                    Object.entries(question.options).map(([key, value]) => {
                      const isSelected = userAnswer === key;
                      const isCorrectOption = question.correctOption === key;

                      return (
                        <div
                          key={key}
                          className={`option-item 
          ${isSelected ? "selected" : ""} 
          ${isCorrectOption ? "correct-option" : ""}
          ${isSelected && isCorrectOption ? "correct-selection" : ""}
          ${isSelected && !isCorrectOption ? "incorrect-selection" : ""}
        `}
                        >
                          <div className="option-content">
                            <span className="option-key">{key}.</span>
                            <span className="option-value">{value}</span>
                          </div>
                          <div className="option-badges">
                            {isCorrectOption && (
                              <span className="correct-badge">✓ Correct</span>
                            )}
                            {isSelected && (
                              <span className="selected-badge">✓ Selected</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {userAnswer && (
                  <div className="user-answer">
                    <strong>Student's answer:</strong> {userAnswer} -{" "}
                    {question.options?.[userAnswer] || "Unknown option"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // If examId is provided, show submissions for that exam
  if (examId) {
    const questions = examQuestions[examId] || [];
    const isLoadingQuestions = questionsLoading[examId];

    return (
      <div className="monitoring-dashboard">
        <div className="exams-header">
          <h1>Monitoring Exam {examId}</h1>
          <button className="btn-back" onClick={onBack}>
            ← Back to All Exams
          </button>
        </div>

        <div className="submissions-container">
          {submissionsLoading ? (
            <div className="loading">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="no-data">No submissions found for this exam</div>
          ) : (
            <>
              <div className="submissions-table-container">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Score</th>
                      <th>Violations</th>
                      <th>Time Taken</th>
                      <th>Started At</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <>
                        <tr key={submission.submissionId}>
                          <td>{submission.candidateName || "N/A"}</td>
                          <td>{submission.candidateEmail}</td>
                          <td>
                            {submission.completed ? (
                              <span className="status completed">
                                Completed
                              </span>
                            ) : submission.startedAt ? (
                              <span className="status in-progress">
                                In Progress
                              </span>
                            ) : (
                              <span className="status not-started">
                                Not Started
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${calculateProgress(submission)}%`,
                                }}
                              ></div>
                              <span className="progress-text">
                                {calculateProgress(submission)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {submission.score !== null ? (
                              <span
                                className={`score ${submission.score > 70 ? "good" : submission.score > 40 ? "average" : "poor"}`}
                              >
                                {submission.score.toFixed(2)}%
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            <span
                              className={`violations ${submission.violations > 2 ? "high" : submission.violations > 0 ? "medium" : ""}`}
                            >
                              {submission.violations}
                            </span>
                          </td>
                          <td>
                            {submission.timeTaken !== null
                              ? `${submission.timeTaken} min`
                              : "N/A"}
                          </td>
                          <td>{formatDateTime(submission.startedAt)}</td>
                          <td>{formatDateTime(submission.submittedAt)}</td>
                          <td>
                            <div className="action-buttons">
                              {submission.snapshotIds &&
                                submission.snapshotIds.length > 0 && (
                                  <button
                                    className="btn-action btn-snapshot"
                                    onClick={() =>
                                      handleViewSnapshot(
                                        submission.submissionId,
                                      )
                                    }
                                  >
                                    {expandedSubmission ===
                                    submission.submissionId
                                      ? "Hide"
                                      : "View"}{" "}
                                    Snapshots
                                  </button>
                                )}
                              {submission.completed && (
                                <button
                                  className="btn-action btn-answers"
                                  onClick={() =>
                                    handleViewAnswers(submission.submissionId)
                                  }
                                  disabled={isLoadingQuestions}
                                >
                                  {isLoadingQuestions
                                    ? "Loading..."
                                    : expandedAnswers ===
                                        submission.submissionId
                                      ? "Hide"
                                      : "View"}{" "}
                                  Answers
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Snapshots Row */}
                        {expandedSubmission === submission.submissionId &&
                          submission.snapshotIds &&
                          submission.snapshotIds.length > 0 && (
                            <tr className="snapshots-row">
                              <td colSpan="10">
                                <div className="snapshots-container">
                                  <h4>
                                    Snapshots for {submission.candidateName}
                                  </h4>
                                  <div className="snapshots-grid">
                                    {submission.snapshotIds.map(
                                      (snapshotId, index) => (
                                        <div
                                          key={snapshotId}
                                          className="snapshot-item"
                                        >
                                          <div className="snapshot-header">
                                            <span>Snapshot {index + 1}</span>
                                            <span className="snapshot-id">
                                              {snapshotId.substring(0, 8)}...
                                            </span>
                                          </div>
                                          <div className="snapshot-image">
                                            <SecureSnapshotImage
                                              snapshotId={snapshotId}
                                              alt={`Snapshot ${index + 1} for ${submission.candidateName}`}
                                              className="snapshot-img"
                                            />
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                        {/* Answers Preview Row */}
                        {expandedAnswers === submission.submissionId && (
                          <tr className="answers-row">
                            <td colSpan="10">
                              {isLoadingQuestions ? (
                                <div className="loading-small">
                                  Loading questions...
                                </div>
                              ) : (
                                renderAnswersPreview(submission, questions)
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="summary-stats">
                <div className="stat-card">
                  <h3>Total Candidates</h3>
                  <p className="stat-value">{submissions.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Completed</h3>
                  <p className="stat-value">
                    {submissions.filter((s) => s.completed).length}
                  </p>
                </div>
                <div className="stat-card">
                  <h3>In Progress</h3>
                  <p className="stat-value">
                    {
                      submissions.filter((s) => s.startedAt && !s.completed)
                        .length
                    }
                  </p>
                </div>
                <div className="stat-card">
                  <h3>Average Score</h3>
                  <p className="stat-value">
                    {(() => {
                      const completedSubmissions = submissions.filter(
                        (s) => s.score !== null,
                      );
                      if (completedSubmissions.length === 0) return "N/A";
                      const avg =
                        completedSubmissions.reduce(
                          (sum, s) => sum + s.score,
                          0,
                        ) / completedSubmissions.length;
                      return avg.toFixed(2) + "%";
                    })()}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // If no examId, show all exams
  return (
    <div className="monitoring-dashboard">
      <div className="exams-header">
        <h1>All Exams</h1>
        <button className="btn-back" onClick={onBack}>
          ← Back to Create Exam
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading exams...</div>
      ) : exams.length === 0 ? (
        <div className="no-data">No exams found</div>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="exam-header">
                <h3>{exam.title}</h3>
                {getStatusBadge(exam.status)}
              </div>

              <div className="exam-details">
                <p>
                  <strong>Description:</strong> {exam.description}
                </p>
                <p>
                  <strong>Duration:</strong> {exam.duration} minutes
                </p>
                <p>
                  <strong>Start:</strong> {formatDateTime(exam.startDate)}
                </p>
                <p>
                  <strong>End:</strong> {formatDateTime(exam.endDate)}
                </p>
                <p>
                  <strong>ID:</strong> {exam.id}
                </p>
              </div>

              <div className="exam-actions">
                <button
                  className="btn-monitor"
                  onClick={() => onMonitorExam(exam.id)}
                  disabled={exam.status !== "PUBLISHED"}
                >
                  Monitor Exam
                </button>
                {exam.status !== "PUBLISHED" && (
                  <span className="hint">
                    Only published exams can be monitored
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminMonitoringDashboard;
