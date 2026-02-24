import { useState, useEffect } from "react";
import SecureSnapshotImage from "./SecureSnapshotImage";
import "../../styles/SnapshotViewerModal.css";

function SnapshotViewerModal({ submission, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [filter, setFilter] = useState("all"); // all, violations, clean

  useEffect(() => {
    if (submission?.snapshots?.length > 0) {
      // Add mock timestamps if not provided by API
      // In production, these should come from the API
      const snapshotsWithTime = submission.snapshots.map((snapshot, index) => ({
        ...snapshot,
        // Mock timestamp - replace with actual data from API
        createdAt: snapshot.createdAt || new Date(Date.now() - (index * 5 * 60000)).toISOString()
      }));
      setSnapshots(snapshotsWithTime);
    }
  }, [submission]);

  const getViolationCount = () => {
    return snapshots.filter(s => s.isViolate).length;
  };

  const getCleanCount = () => {
    return snapshots.filter(s => !s.isViolate).length;
  };

  const filteredSnapshots = snapshots.filter(snapshot => {
    if (filter === "violations") return snapshot.isViolate;
    if (filter === "clean") return !snapshot.isViolate;
    return true;
  });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "Unknown time";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleSnapshotClick = (snapshot) => {
    setSelectedSnapshot(snapshot);
  };

  const handleCloseFullView = () => {
    setSelectedSnapshot(null);
  };

  const handleClose = () => {
    setSelectedSnapshot(null);
    onClose();
  };

  return (
    <div className="snapshot-viewer-modal-overlay" onClick={handleClose}>
      <div className="snapshot-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <h2>Snapshots - {submission.candidateName}</h2>
            <span className="candidate-email">{submission.candidateEmail}</span>
          </div>
          <div className="header-stats">
            <div className="stats-badges">
              <span className="stat-badge total">
                Total: {snapshots.length}
              </span>
              <span className={`stat-badge violations ${getViolationCount() > 0 ? 'has-violations' : ''}`}>
                ⚠️ Violations: {getViolationCount()}
              </span>
              <span className="stat-badge clean">
                ✅ Clean: {getCleanCount()}
              </span>
            </div>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>
        </div>

        <div className="filter-controls">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({snapshots.length})
          </button>
          <button 
            className={`filter-btn violations ${filter === 'violations' ? 'active' : ''}`}
            onClick={() => setFilter('violations')}
          >
            ⚠️ Violations ({getViolationCount()})
          </button>
          <button 
            className={`filter-btn clean ${filter === 'clean' ? 'active' : ''}`}
            onClick={() => setFilter('clean')}
          >
            ✅ Clean ({getCleanCount()})
          </button>
        </div>

        {filteredSnapshots.length === 0 ? (
          <div className="no-snapshots">
            <p>No snapshots found for this filter.</p>
          </div>
        ) : (
          <div className="snapshots-grid">
            {filteredSnapshots.map((snapshot, index) => (
              <div
                key={snapshot.snapshotId}
                className={`snapshot-card ${snapshot.isViolate ? 'violation' : 'clean'}`}
                onClick={() => handleSnapshotClick(snapshot)}
              >
                <div className="snapshot-image-container">
                  <SecureSnapshotImage 
                    snapshotId={snapshot.snapshotId}
                    alt={`Snapshot ${index + 1}`}
                    className="snapshot-thumbnail"
                    isViolate={snapshot.isViolate}
                  />
                  {snapshot.isViolate && (
                    <div className="violation-badge">⚠️ Violation</div>
                  )}
                </div>
                <div className="snapshot-info">
                  <div className="snapshot-main-info">
                    <span className="snapshot-number">#{index + 1}</span>
                    <span className={`snapshot-status ${snapshot.isViolate ? 'violation' : 'clean'}`}>
                      {snapshot.isViolate ? 'Violation' : 'Clean'}
                    </span>
                  </div>
                  <div className="snapshot-time">
                    <span className="time-icon">🕐</span>
                    <span className="time-text">{formatDateTime(snapshot.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer">
          <div className="footer-info">
            <span className="submission-id">Submission ID: {submission.submissionId}</span>
            <span className="timestamp">
              Started: {formatDateTime(submission.startedAt)}
            </span>
            {submission.submittedAt && (
              <span className="timestamp">
                Submitted: {formatDateTime(submission.submittedAt)}
              </span>
            )}
          </div>
          <button className="close-footer-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>

      {/* Full-size image modal */}
      {selectedSnapshot && (
        <div className="full-image-overlay" onClick={handleCloseFullView}>
          <div className="full-image-container" onClick={(e) => e.stopPropagation()}>
            <button className="full-image-close" onClick={handleCloseFullView}>×</button>
            <div className="full-image-header">
              <div className="full-image-title">
                <h3>Snapshot {snapshots.findIndex(s => s.snapshotId === selectedSnapshot.snapshotId) + 1}</h3>
                <span className="full-image-time">
                  🕐 {formatDateTime(selectedSnapshot.createdAt)}
                </span>
              </div>
              <span className={`full-image-status ${selectedSnapshot.isViolate ? 'violation' : 'clean'}`}>
                {selectedSnapshot.isViolate ? '⚠️ Violation Detected' : '✅ Clean Snapshot'}
              </span>
            </div>
            <div className="full-image-wrapper">
              <SecureSnapshotImage 
                snapshotId={selectedSnapshot.snapshotId}
                alt="Full size snapshot"
                className="full-image"
                isViolate={selectedSnapshot.isViolate}
              />
            </div>
            <div className="full-image-footer">
              <div className="full-image-details">
                <span>Snapshot ID: {selectedSnapshot.snapshotId}</span>
                <span className="detail-separator">•</span>
                <span>Taken: {formatDateTime(selectedSnapshot.createdAt)}</span>
              </div>
              <button className="close-image-btn" onClick={handleCloseFullView}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapshotViewerModal;