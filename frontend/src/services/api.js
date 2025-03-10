import axios from "axios";

const API_URL = "http://localhost:5000"; // Modifier selon le backend

export const fetchTweets = async () => {
  const response = await axios.get(`${API_URL}/tweets`);
  return response.data;
};

export const postTweet = async (content) => {
  const response = await axios.post(`${API_URL}/tweets`, { content });
  return response.data;
};
