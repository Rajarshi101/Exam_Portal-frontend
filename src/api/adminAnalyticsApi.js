import api from "./api";

export const getExamList = () => {
  return api.get("/api/admin/stats/exam-list");
};

export const getExamAnalytics = (examId) => {
  return api.get(`/api/admin/stats/exam-analytics/${examId}`);
};