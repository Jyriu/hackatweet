import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function Register() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/register",
        formData
      );
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setUser(user);
      navigate("/");
    } catch (err) {
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" onChange={handleChange} />
      <input name="password" type="password" onChange={handleChange} />
      <button type="submit">S’inscrire</button>
      {error && <p>{error}</p>}
    </form>
  );
}

export default Register;
