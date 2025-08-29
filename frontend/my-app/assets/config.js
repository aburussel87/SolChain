// Determine the API base URL based on platform
const getApiBaseUrl = () => {
  // Check if running on web
  if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
    return "http://localhost:5000/api";
  }
  // For mobile/Expo Go, use the network IP
  return "http://192.168.0.103:5000/api";
};

const config = {
  API_BASE_URL: "http://192.168.0.199:5000/api",
  timeout: 5000,
  retries: 3
};

export default config;