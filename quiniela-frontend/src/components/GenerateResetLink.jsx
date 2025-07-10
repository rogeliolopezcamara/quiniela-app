import { useState } from "react";

const GenerateResetLink = () => {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [resetLink, setResetLink] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResetLink(null);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/generate-reset-link/?email=${email}`, {
        method: "POST",
        headers: {
          "X-Reset-Token": secret,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al generar enlace");
      }

      const data = await res.json();
      setResetLink(data.reset_link);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 px-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔐 Generar enlace de restablecimiento</h1>

      <input
        type="email"
        placeholder="Correo del usuario"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <input
        type="text"
        placeholder="RESET_SECRET"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        className="w-full p-2 border mb-4"
      />

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Generando..." : "Generar enlace"}
      </button>

      {resetLink && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400 rounded">
          <p className="font-semibold">✅ Enlace generado:</p>
          <a
            href={resetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all"
          >
            {resetLink}
          </a>
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 border border-red-400 rounded text-red-700">
          {error}
        </div>
      )}
    </div>
  );
};

export default GenerateResetLink;