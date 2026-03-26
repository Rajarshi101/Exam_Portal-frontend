import api from "./api";

export const getExamList = () => {
  return api.get("/api/admin/stats/exam-list");
};

export const getExamAnalytics = (examId) => {
  return api.get(`/api/admin/stats/exam-analytics/${examId}`);
};

 
export const getBatchEmails = async (batchId) => {
  try {
    const response = await api.get(`/admin/users/${batchId}/students`);
    return response.data;
  } catch (error) {
    console.error("Error fetching batch emails:", error);
    throw error.response?.data || error.message;
  }
};
 
export const getBatchExamStats = async (batchId, emails) => {
  try {
    const response = await api.post(`/api/admin/stats/${batchId}/stats`, {
      emails: emails
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching batch exam stats:", error);
    throw error.response?.data || error.message;
  }
};
 
export const getExamBatchDetails = async (examId, batchId) => {
  try {
    const response = await api.get(`/api/admin/stats/${examId}/${batchId}/stats`);
    return response.data;
  } catch (error) {
    console.error("Error fetching exam batch details:", error);
    throw error.response?.data || error.message;
  }
};