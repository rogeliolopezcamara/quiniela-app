import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await axios.post("http://127.0.0.1:8000/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token, user_id } = response.data;
      login(access_token, user_id);
      console.log("Login exitoso:", access_token, user_id);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error al hacer login:", err);
      setError(t('invalid_credentials'));
    }
  };

  return (
    <form onSubmit={handleLogin} className="max-w-sm mx-auto mt-20">
      <h1 className="text-2xl mb-4">{t('login')}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="email"
        placeholder={t('email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="block w-full p-2 mb-4 border"
        required
      />
      <input
        type="password"
        placeholder={t('password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="block w-full p-2 mb-4 border"
        required
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        {t('login_button')}
      </button>
    </form>
  );
}

export default Login;