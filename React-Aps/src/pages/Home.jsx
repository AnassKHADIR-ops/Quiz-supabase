import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { schoolsApi } from "../api.js";

const typeOptions = [
  { id: "post_bac", label: "Post-Bac", hint: "Accès direct après le baccalauréat" },
  { id: "bac_plus_2", label: "Bac+2", hint: "Concours après classes préparatoires" },
];

function Card({ children, onClick }) {
  return <button className="exam-card" onClick={onClick} style={{ textAlign: "left", border: 0, width: "100%", cursor: "pointer" }}>{children}</button>;
}

function Home() {
  const [schools, setSchools] = useState([]);
  const [type, setType] = useState(null);
  const [school, setSchool] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    schoolsApi.list().then(setSchools).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const back = () => {
    if (subject) setSubject(null);
    else if (school) setSchool(null);
    else setType(null);
  };
  const typeLabel = type ? typeOptions.find((t) => t.id === type)?.label : null;
  const title = subject ? subject.name : school ? school.name : typeLabel || "Choisissez un type de concours";
  const visibleSchools = schools.filter((item) => item.type === type);

  return <div className="page">
    <div className="page-header fade-up">
      <div className="section-label">⊙ PRÉPARATION AUX CONCOURS</div>
      <h1>{title}</h1>
      <p>Type → école → matière → QCM par année</p>
    </div>
    {loading && <div className="center-msg"><span className="spinner" /></div>}
    {error && <p className="error-msg">⚠ {error}</p>}
    {!loading && !error && (type || school || subject) && <button className="btn btn-secondary" onClick={back} style={{ marginBottom: 24 }}>← Retour</button>}

    {!loading && !error && !type && <div className="exam-grid">
      {typeOptions.map((opt) => <Card key={opt.id} onClick={() => setType(opt.id)}>
        <div className="exam-card-icon">🎯</div><h3>{opt.label}</h3><p>{opt.hint}</p>
      </Card>)}
    </div>}

    {type && !school && <div className="exam-grid">
      {visibleSchools.map((item) => <Card key={item.id} onClick={() => setSchool(item)}>
        <div className="exam-card-icon">{item.icon || "🎓"}</div><h3>{item.name}</h3><p>{item.description || ""}</p>
        <div className="exam-card-meta"><span className="badge">{item.subjects.length} matière(s)</span></div>
      </Card>)}
      {visibleSchools.length === 0 && <p className="empty-state">Aucune école disponible pour ce type de concours.</p>}
    </div>}

    {school && !subject && <div className="exam-grid">
      {school.subjects.map((item) => <Card key={item.id} onClick={() => setSubject(item)}>
        <div className="exam-card-icon">📘</div><h3>{item.name}</h3><p>{item.level || "Matière"}</p>
        <div className="exam-card-meta"><span className="badge">{item.exams.length} QCM</span></div>
      </Card>)}
      {school.subjects.length === 0 && <p className="empty-state">Aucune matière disponible.</p>}
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
