import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/login",
        { email, password }
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      navigate("/");
    } catch (err) {
      setError("Erreur lors de la connexion");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        value={password}
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Se connecter</button>
      {error && <p>{error}</p>}
    </form>
  );
}

export default Login;
