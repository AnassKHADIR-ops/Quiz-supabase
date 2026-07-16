import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { schoolsApi } from "../api.js";
import { AlertTriangle, ArrowLeft, BookOpen, Calendar, ClipboardList, Clock, Download, FileText, GraduationCap, Target, X } from "../components/Icon.jsx";

const typeOptions = [
  { id: "post_bac", label: "Post-Bac", hint: "Accès direct après le baccalauréat" },
  { id: "bac_plus_2", label: "Bac+2", hint: "Concours après classes préparatoires" },
];

const isEnseignement = (s) => s?.name === "Concours d'enseignement";

function driveFileId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
function drivePreviewUrl(url) {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}
function driveDownloadUrl(url) {
  const id = driveFileId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

function Card({ children, onClick }) {
  return <button className="exam-card" onClick={onClick} style={{ textAlign: "left", border: 0, width: "100%", cursor: "pointer" }}>{children}</button>;
}

function DocumentPreview({ doc, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <div className="document-preview-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="document-preview-head">
        <h3>{doc.label || `Programme ${doc.year}`}</h3>
        <div className="document-preview-actions">
          <a className="btn btn-secondary btn-sm" href={driveDownloadUrl(doc.document_url)} target="_blank" rel="noreferrer"><Download size={15} /> Télécharger</a>
          <button className="management-modal-close" onClick={onClose}><X size={16} /></button>
        </div>
      </div>
      <iframe title={doc.label || "Programme"} src={drivePreviewUrl(doc.document_url)} className="document-preview-frame" />
    </div>
  </div>;
}

function Home() {
  const [schools, setSchools] = useState([]);
  const [type, setType] = useState(null);
  const [school, setSchool] = useState(null);
  const [subject, setSubject] = useState(null);
  const [year, setYear] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    schoolsApi.list().then(setSchools).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const back = () => {
    if (subject) setSubject(null);
    else if (year) setYear(null);
    else if (school) setSchool(null);
    else setType(null);
  };
  const typeLabel = type ? typeOptions.find((t) => t.id === type)?.label : null;
  const title = subject ? subject.name : year ? `Année ${year}` : school ? school.name : typeLabel || "Choisissez un type de concours";
  const visibleSchools = schools.filter((item) => item.type === type);

  const enseignement = school && isEnseignement(school);
  const years = enseignement
    ? [...new Set([...(school.programmes || []).map((p) => p.year), ...school.subjects.flatMap((s) => s.exams.map((e) => e.year))])].sort((a, b) => b - a)
    : [];
  const yearProgrammes = enseignement ? (school.programmes || []).filter((p) => p.year === year) : [];
  const yearExams = enseignement
    ? school.subjects.flatMap((s) => s.exams.filter((e) => e.year === year).map((e) => ({ ...e, subjectName: s.name })))
    : [];

  return <div className="page">
    <div className="page-header fade-up">
      <div className="section-label">⊙ PRÉPARATION AUX CONCOURS</div>
      <h1>{title}</h1>
      <p>Type → école → matière → QCM par année</p>
    </div>
    {loading && <div className="center-msg"><span className="spinner" /></div>}
    {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}
    {!loading && !error && (type || school || subject) && <button className="btn btn-secondary" onClick={back} style={{ marginBottom: 24 }}><ArrowLeft size={15} /> Retour</button>}

    {!loading && !error && !type && <div className="exam-grid">
      {typeOptions.map((opt) => <Card key={opt.id} onClick={() => setType(opt.id)}>
        <div className="exam-card-icon"><Target size={20} /></div><h3>{opt.label}</h3><p>{opt.hint}</p>
      </Card>)}
    </div>}

    {type && !school && <div className="exam-grid">
      {visibleSchools.map((item) => <Card key={item.id} onClick={() => setSchool(item)}>
        <div className="exam-card-icon">{item.icon || <GraduationCap size={20} />}</div><h3>{item.name}</h3><p>{item.description || ""}</p>
        <div className="exam-card-meta"><span className="badge">{item.subjects.length} matière(s)</span></div>
      </Card>)}
      {visibleSchools.length === 0 && <p className="empty-state">Aucune école disponible pour ce type de concours.</p>}
    </div>}

    {school && !enseignement && !subject && <div className="exam-grid">
      {school.subjects.map((item) => <Card key={item.id} onClick={() => setSubject(item)}>
        <div className="exam-card-icon"><BookOpen size={20} /></div><h3>{item.name}</h3><p>{item.level || "Matière"}</p>
        <div className="exam-card-meta"><span className="badge">{item.exams.length} QCM</span></div>
      </Card>)}
      {school.subjects.length === 0 && <p className="empty-state">Aucune matière disponible.</p>}
    </div>}

    {enseignement && !year && <>
      <div className="programme-banner">
        <img src="/images/logo-ministere-enseignement.jpg" alt="Ministère de l'Éducation Nationale" />
      </div>
      <div className="exam-grid">
        {years.map((y) => <Card key={y} onClick={() => setYear(y)}>
          <div className="exam-card-icon"><Calendar size={20} /></div><h3>Année {y}</h3>
          <div className="exam-card-meta">{(school.programmes || []).some((p) => p.year === y) && <span className="badge badge-success"><FileText size={12} /> Programme disponible</span>}</div>
        </Card>)}
        {years.length === 0 && <p className="empty-state">Aucune année disponible pour l’instant.</p>}
      </div>
    </>}

    {enseignement && year && <div className="exam-grid">
      {yearProgrammes.length > 0
        ? yearProgrammes.map((doc) => <Card key={doc.id} onClick={() => setPreviewDoc(doc)}>
            <div className="exam-card-icon"><FileText size={20} /></div><h3>{doc.label || `Programme ${year}`}</h3><p>Cliquer pour consulter le document</p>
          </Card>)
        : <p className="empty-state">Programme non encore disponible pour {year}.</p>}
      {yearExams.map((exam) => <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
        <div className="exam-card-icon"><ClipboardList size={20} /></div><h3>{exam.title}</h3><p>{exam.subjectName}</p>
        <div className="exam-card-meta"><span className="badge">{exam.year}</span>{exam.duration_minutes && <span className="badge badge-warning"><Clock size={12} /> {exam.duration_minutes} min</span>}</div>
      </Link>)}
      {yearExams.length === 0 && <p className="empty-state">Aucun QCM publié pour cette année.</p>}
    </div>}

    {subject && <div className="exam-grid">
      {subject.exams.map((exam) => <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
        <div className="exam-card-icon"><ClipboardList size={20} /></div><h3>{exam.title}</h3><p>{exam.description || "QCM"}</p>
        <div className="exam-card-meta"><span className="badge">{exam.year}</span>{exam.duration_minutes && <span className="badge badge-warning"><Clock size={12} /> {exam.duration_minutes} min</span>}</div>
      </Link>)}
      {subject.exams.length === 0 && <p className="empty-state">Aucun QCM publié pour cette matière.</p>}
    </div>}

    {previewDoc && <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
  </div>;
}

export default Home;
