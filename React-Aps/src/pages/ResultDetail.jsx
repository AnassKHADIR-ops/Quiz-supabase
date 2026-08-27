import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resultsApi } from "../api.js";
import Results from "../components/Results.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function ResultDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    resultsApi.details(resultId)
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [resultId]);

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette soumission ? Cette action est irréversible.")) return;
    try {
      await resultsApi.deleteResult(resultId);
      navigate(-1);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="center-msg"><span className="spinner" /></div>;
  if (error) return (
    <div className="center-msg">
      <p className="error-msg" style={{ fontSize: "1rem", justifyContent: "center" }}>{error}</p>
      <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>Retour à l'accueil</button>
    </div>
  );
  if (!result) return (
    <div className="center-msg">
      <h3>Résultat introuvable</h3>
      <p style={{ color: "var(--text-muted)", marginTop: 6 }}>Cette soumission n'existe pas ou a été supprimée.</p>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/")}>Retour à l'accueil</button>
    </div>
  );

  return (
    <Results
      exam={{ title: result.exam_title || "Examen" }}
      result={result}
      studentName={result.student_name}
      onBack={() => navigate(-1)}
      onDelete={isTeacher ? handleDelete : undefined}
    />
  );
}

export default ResultDetail;
