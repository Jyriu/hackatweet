import axios from "axios";

const API_URL = "http://localhost:5000"; // Modifier selon le backend

export const fetchTweets = async (token) => {
  const response = await axios.get(`${API_URL}/tweets`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const postTweet = async (content, token) => {
  const response = await axios.post(`${API_URL}/tweets`, { content }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};
