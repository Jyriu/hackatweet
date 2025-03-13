import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

// Cache local pour éviter de multiples appels pour le même utilisateur
const userCache = {};

export const useUserInfo = (username) => {
  const [userInfo, setUserInfo] = useState(userCache[username] || null);
  const [loading, setLoading] = useState(!userCache[username]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) return;
    if (userCache[username]) {
      setUserInfo(userCache[username]);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(`${API_URL}/api/users/by-username/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        userCache[username] = res.data;
        setUserInfo(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [username]);

  return { userInfo, loading, error };
};
