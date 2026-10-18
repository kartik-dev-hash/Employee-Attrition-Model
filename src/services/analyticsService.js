import api from "../api/client";

/**
 * Fetch company-wide analytics overview snapshot & ML status
 */
export async function getCompanyAnalytics() {
  try {
    const response = await api.get("/api/hr/overview");
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallback = await api.get("/hr/analytics/overview");
      return fallback.data;
    }
    throw err;
  }
}

/**
 * Manually trigger refresh and persistence of fresh company & employee analytics
 */
export async function refreshCompanyAnalytics() {
  try {
    const response = await api.post("/api/hr/refresh");
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallback = await api.post("/hr/analytics/refresh");
      return fallback.data;
    }
    throw err;
  }
}

/**
 * Fetch detailed analytics for a single authorized employee
 */
export async function getEmployeeAnalytics(employeeId) {
  try {
    const response = await api.get(`/api/hr/employees/${employeeId}`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallback = await api.get(`/hr/analytics/employees/${employeeId}`);
      return fallback.data;
    }
    throw err;
  }
}

/**
 * Check machine learning model readiness, version, and training status
 */
export async function getMlModelStatus() {
  try {
    const response = await api.get("/api/hr/ml/status");
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallback = await api.get("/hr/analytics/ml/status");
      return fallback.data;
    }
    throw err;
  }
}

/**
 * Trigger controlled ML model training on verified dataset
 */
export async function triggerMlTraining(version = "1.0.0") {
  try {
    const response = await api.post("/api/hr/ml/train", { version });
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallback = await api.post("/hr/analytics/ml/train", { version });
      return fallback.data;
    }
    throw err;
  }
}
