import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { universitiesApi } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

function Card({ children, onClick }) {
  return <button className="exam-card" onClick={onClick} style={{ textAlign: "left", border: 0, width: "100%", cursor: "pointer" }}>{children}</button>;
}

function Home() {
  const { user } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [university, setUniversity] = useState(null);
  const [branch, setBranch] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    universitiesApi.list().then(setUniversities).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const back = () => {
    if (subject) setSubject(null);
    else if (branch) setBranch(null);
    else setUniversity(null);
  };
  const title = subject ? subject.name : branch ? branch.name : university ? university.name : "Choisissez votre université";

  return <div className="page">
    <div className="page-header fade-up">
      <div className="section-label">⊙ PRÉPARATION AUX CONCOURS</div>
      <h1>{title}</h1>
      <p>Université → branche → matière → QCM par année</p>
    </div>
    {loading && <div className="center-msg"><span className="spinner" /></div>}
    {error && <p className="error-msg">⚠ {error}</p>}
    {!loading && !error && (university || branch || subject) && <button className="btn btn-secondary" onClick={back} style={{ marginBottom: 24 }}>← Retour</button>}

    {!loading && !error && !university && <div className="exam-grid">
      {universities.map((item) => <Card key={item.id} onClick={() => setUniversity(item)}>
        <div className="exam-card-icon">{item.icon || "🎓"}</div><h3>{item.name}</h3><p>{item.description || ""}</p>
        <div className="exam-card-meta"><span className="badge">{item.branches.length} branche(s)</span></div>
      </Card>)}
    </div>}

    {university && !branch && <div className="exam-grid">
      {university.branches.map((item) => <Card key={item.id} onClick={() => setBranch(item)}>
        <div className="exam-card-icon">🏫</div><h3>{item.name}</h3><p>{item.description || ""}</p>
        <div className="exam-card-meta"><span className="badge">{item.subjects.length} matière(s)</span></div>
      </Card>)}
      {university.branches.length === 0 && <p className="empty-state">Aucune branche disponible.</p>}
    </div>}

    {branch && !subject && <div className="exam-grid">
      {branch.subjects.map((item) => <Card key={item.id} onClick={() => setSubject(item)}>
        <div className="exam-card-icon">📘</div><h3>{item.name}</h3><p>{item.level || "Matière"}</p>
        <div className="exam-card-meta"><span className="badge">{item.exams.length} QCM</span></div>
      </Card>)}
      {branch.subjects.length === 0 && <p className="empty-state">Aucune matière disponible.</p>}
    </div>}

    {subject && <div className="exam-grid">
      {subject.exams.map((exam) => <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
        <div className="exam-card-icon">📝</div><h3>{exam.title}</h3><p>{exam.description || "QCM"}</p>
        <div className="exam-card-meta"><span className="badge">{exam.year}</span>{exam.duration_minutes && <span className="badge badge-warning">⏱ {exam.duration_minutes} min</span>}</div>
      </Link>)}
      {subject.exams.length === 0 && <p className="empty-state">Aucun QCM publié pour cette matière.</p>}
    </div>}
  </div>;
}

export default Home;
