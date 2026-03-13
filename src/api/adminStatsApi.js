import api from "./api";

/**
 * Get exam statistics
 * total exams, published exams, draft exams
 */
export const getExamStats = () => {
  return api.get("/api/admin/stats/exams");
};

/**
 * Get candidate statistics
 * invited, pending, completed, expired
 */
export const getCandidateStats = () => {
  return api.get("/api/admin/stats/candidates");
};