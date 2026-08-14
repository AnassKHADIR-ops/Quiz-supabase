import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { schoolsApi } from "../api.js";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Search,
  Target,
  X,
  Sparkles,
  TrendingUp,
  Briefcase,
  Award,
  Trophy
} from "../components/Icon.jsx";

const typeOptions = [
  {
    id: "post_bac",
    label: "Post-Bac",
    hint: "Accès direct après le baccalauréat (ENSA, ENSAM, FMP, IAV, etc.)",
    icon: <Target size={22} style={{ color: "var(--primary)" }} />
  },
  {
    id: "bac_plus_2",
    label: "Bac+2 / CPGE / Universités",
    hint: "Grandes Écoles de Commerce (ISCAE), Concours d'Enseignement (CRMEF), CNC, Masters",
    icon: <Trophy size={22} style={{ color: "#f59e0b" }} />
  },
];

const isEnseignement = (s) => s?.name?.toLowerCase().includes("enseignement");
const isIscae = (s) => s?.name?.toLowerCase().includes("iscae");
const isCnc = (s) => s?.name?.toLowerCase().includes("cnc");

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

function Card({ children, onClick, highlight = false }) {
  return (
    <button
      className={`exam-card ${highlight ? "exam-card--highlighted" : ""}`}
      onClick={onClick}
      style={{ textAlign: "left", border: 0, width: "100%", cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function DocumentPreview({ doc, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="document-preview-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="document-preview-head">
          <h3>{doc.label || `Programme ${doc.year}`}</h3>
          <div className="document-preview-actions">
            <a
              className="btn btn-secondary btn-sm"
              href={driveDownloadUrl(doc.document_url)}
              target="_blank"
              rel="noreferrer"
            >
              <Download size={15} /> Télécharger
            </a>
            <button className="management-modal-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        <iframe
          title={doc.label || "Programme"}
          src={drivePreviewUrl(doc.document_url)}
          className="document-preview-frame"
        />
      </div>
    </div>
  );
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    schoolsApi
      .list()
      .then(setSchools)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const back = () => {
    if (subject) setSubject(null);
    else if (year) setYear(null);
    else if (school) setSchool(null);
    else setType(null);
  };

  // Flatten all exams for direct search capabilities
  const allExams = useMemo(() => {
    const list = [];
    (schools || []).forEach((sc) => {
      (sc.subjects || []).forEach((sub) => {
        (sub.exams || []).forEach((ex) => {
          list.push({
            ...ex,
            schoolName: sc.name,
            schoolType: sc.type,
            schoolIcon: sc.icon,
            subjectName: sub.name,
          });
        });
      });
    });
    return list;
  }, [schools]);

  // Filtered exams during search
  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allExams.filter((ex) => {
      const matchCat =
        categoryFilter === "all"
          ? true
          : categoryFilter === "post_bac"
          ? ex.schoolType === "post_bac"
          : categoryFilter === "bac_plus_2"
          ? ex.schoolType === "bac_plus_2"
          : true;

      const matchSearch =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.schoolName.toLowerCase().includes(q) ||
        ex.subjectName.toLowerCase().includes(q) ||
        (ex.year && String(ex.year).includes(q)) ||
        (ex.description && ex.description.toLowerCase().includes(q));

      return matchCat && matchSearch;
    });
  }, [allExams, search, categoryFilter]);

  const typeLabel = type ? typeOptions.find((t) => t.id === type)?.label : null;
  const title = subject
    ? subject.name
    : year
    ? `Année ${year}`
    : school
    ? school.name
    : typeLabel || "Portail des Concours & Examens";

  const visibleSchools = schools.filter((item) => item.type === type);
  const enseignement = school && isEnseignement(school);

  const years = enseignement
    ? [
        ...new Set([
          ...(school.programmes || []).map((p) => p.year),
          ...school.subjects.flatMap((s) => s.exams.map((e) => e.year)),
        ]),
      ].sort((a, b) => b - a)
    : [];

  const yearProgrammes = enseignement
    ? (school.programmes || []).filter((p) => p.year === year)
    : [];
  const yearExams = enseignement
    ? school.subjects.flatMap((s) =>
        s.exams.filter((e) => e.year === year).map((e) => ({ ...e, subjectName: s.name }))
      )
    : [];

  const totalExamsCount = allExams.length;

  return (
    <div className="page">
      <div className="page-header fade-up">
        <div className="section-label">⊙ E-LEARNING MATHEMATICS • PR. A. KHADIR</div>
        <h1>{search ? "Résultats de recherche" : title}</h1>
        <p>
          {search
            ? `${filteredExams.length} QCM trouvé(s)`
            : "Annales corrigées avec solutions détaillées LaTeX et suivi de progression"}
        </p>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div
        className="card fade-up"
        style={{
          padding: "16px 20px",
          marginBottom: 28,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Rechercher un QCM, concours, matière, année (ex. ISCAE, ENSA, 2023, Analyse)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 36px 9px 36px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "0.9rem",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: 0,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "Tous" },
              { id: "post_bac", label: "Post-Bac" },
              { id: "bac_plus_2", label: "Bac+2" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id)}
                className={`user-filter-pill ${categoryFilter === f.id ? "active" : ""}`}
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {!search && (
          <div
            style={{
              marginTop: 10,
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <span>📚 {totalExamsCount} QCM disponibles</span>
            <span>🎓 Concours d'Ingénierie, Commerce & Enseignement</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="center-msg">
          <span className="spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
        </div>
      )}

      {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}

      {/* ── Search results view ── */}
      {!loading && !error && search.trim().length > 0 && (
        <div>
          {filteredExams.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 16px" }}>
              <Search size={38} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
              <h3>Aucun QCM trouvé</h3>
              <p>Aucun examen ne correspond à votre recherche "{search}".</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSearch("")}
                style={{ marginTop: 12 }}
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            <div className="exam-grid">
              {filteredExams.map((exam) => (
                <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
                  <div className="exam-card-icon">{exam.schoolIcon || <ClipboardList size={20} />}</div>
                  <h3>{exam.title}</h3>
                  <p>
                    {exam.schoolName} • {exam.subjectName}
                  </p>
                  <div className="exam-card-meta">
                    {exam.year && <span className="badge">{exam.year}</span>}
                    {exam.duration_minutes && (
                      <span className="badge badge-warning">
                        <Clock size={12} /> {exam.duration_minutes} min
                      </span>
                    )}
                    <span className="badge" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {exam.schoolType === "post_bac" ? "Post-Bac" : "Bac+2"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Hierarchical Navigation ── */}
      {!loading && !error && !search.trim() && (
        <>
          {(type || school || subject) && (
            <button className="btn btn-secondary" onClick={back} style={{ marginBottom: 24 }}>
              <ArrowLeft size={15} /> Retour
            </button>
          )}

          {/* Niveau 1 : Choix du type (Post-Bac vs Bac+2) */}
          {!type && (
            <div className="exam-grid">
              {typeOptions.map((opt) => (
                <Card key={opt.id} onClick={() => setType(opt.id)}>
                  <div className="exam-card-icon">{opt.icon}</div>
                  <h3>{opt.label}</h3>
                  <p>{opt.hint}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Niveau 2 : Écoles & Concours du type choisi */}
          {type && !school && (
            <div className="exam-grid">
              {visibleSchools.map((item) => {
                const isItemIscae = isIscae(item);
                const isItemEns = isEnseignement(item);
                const isItemCnc = isCnc(item);

                // Customized icons
                const cardIcon = isItemIscae ? (
                  <TrendingUp size={22} style={{ color: "#2563eb" }} />
                ) : isItemEns ? (
                  <GraduationCap size={22} style={{ color: "#7c3aed" }} />
                ) : isItemCnc ? (
                  <Award size={22} style={{ color: "#d97706" }} />
                ) : (
                  item.icon || <GraduationCap size={20} />
                );

                // Rich descriptions
                const cardDescription = isItemIscae
                  ? (item.description || "Préparez le concours d'accès à la Grande École de Commerce du Maroc. QCM ciblés en mathématiques, logique et culture économique avec corrections détaillées pour booster vos chances d'admission.")
                  : isItemEns
                  ? (item.description || "Cadre de référence officiel, programmes du Ministère de l'Éducation Nationale et annales corrigées pour le recrutement des enseignants (CRMEF / Capes / Agrégation).")
                  : isItemCnc
                  ? (item.description || "Concours National Commun pour l'accès aux Grandes Écoles d'Ingénieurs marocaines (EHTP, EMI, ENSIAS, etc.).")
                  : item.description || "";

                return (
                  <Card key={item.id} onClick={() => setSchool(item)}>
                    <div className="exam-card-icon">{cardIcon}</div>
                    <h3 style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{item.name}</span>
                    </h3>
                    <p style={{ lineHeight: 1.55 }}>{cardDescription}</p>
                    <div className="exam-card-meta">
                      {isItemIscae && (
                        <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                          Grande École de Commerce 🏆
                        </span>
                      )}
                      {isItemEns && (
                        <span className="badge badge-success" style={{ fontWeight: 800 }}>
                          Recrutement & CRMEF 🎓
                        </span>
                      )}
                      {isItemCnc && (
                        <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                          Grandes Écoles d'Ingénieurs ⚡
                        </span>
                      )}
                      <span className="badge">{item.subjects.length} matière(s)</span>
                    </div>
                  </Card>
                );
              })}
              {visibleSchools.length === 0 && (
                <p className="empty-state">Aucune école disponible pour ce type de concours.</p>
              )}
            </div>
          )}

          {/* Niveau 3 : Matières de l'école sélectionnée */}
          {school && !enseignement && !subject && (
            <div className="exam-grid">
              {school.subjects.map((item) => (
                <Card key={item.id} onClick={() => setSubject(item)}>
                  <div className="exam-card-icon">
                    <BookOpen size={20} />
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.level || "Matière"}</p>
                  <div className="exam-card-meta">
                    <span className="badge">{item.exams.length} QCM</span>
                  </div>
                </Card>
              ))}
              {school.subjects.length === 0 && (
                <p className="empty-state">Aucune matière disponible.</p>
              )}
            </div>
          )}

          {/* Concours d'Enseignement : Années & Programmes */}
          {enseignement && !year && (
            <>
              <div className="programme-banner" style={{ borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-md)" }}>
                <img
                  src="/images/logo-ministere-enseignement.jpg"
                  alt="Ministère de l'Éducation Nationale"
                  style={{ width: "100%", maxHeight: 180, objectFit: "cover" }}
                />
              </div>
              <div className="exam-grid">
                {years.map((y) => (
                  <Card key={y} onClick={() => setYear(y)}>
                    <div className="exam-card-icon">
                      <Calendar size={20} />
                    </div>
                    <h3>Année {y}</h3>
                    <div className="exam-card-meta">
                      {(school.programmes || []).some((p) => p.year === y) && (
                        <span className="badge badge-success">
                          <FileText size={12} /> Programme officiel disponible
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
                {years.length === 0 && (
                  <p className="empty-state">Aucune année disponible pour l’instant.</p>
                )}
              </div>
            </>
          )}

          {enseignement && year && (
            <div className="exam-grid">
              {yearProgrammes.length > 0 ? (
                yearProgrammes.map((doc) => (
                  <Card key={doc.id} onClick={() => setPreviewDoc(doc)}>
                    <div className="exam-card-icon">
                      <FileText size={20} />
                    </div>
                    <h3>{doc.label || `Programme ${year}`}</h3>
                    <p>Cliquer pour consulter et télécharger le document officiel</p>
                  </Card>
                ))
              ) : (
                <p className="empty-state">Programme non encore disponible pour {year}.</p>
              )}
              {yearExams.map((exam) => (
                <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
                  <div className="exam-card-icon">
                    <ClipboardList size={20} />
                  </div>
                  <h3>{exam.title}</h3>
                  <p>{exam.subjectName}</p>
                  <div className="exam-card-meta">
                    <span className="badge">{exam.year}</span>
                    {exam.duration_minutes && (
                      <span className="badge badge-warning">
                        <Clock size={12} /> {exam.duration_minutes} min
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {yearExams.length === 0 && (
                <p className="empty-state">Aucun QCM publié pour cette année.</p>
              )}
            </div>
          )}

          {/* QCM de la matière */}
          {subject && (
            <div className="exam-grid">
              {subject.exams.map((exam) => (
                <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
                  <div className="exam-card-icon">
                    <ClipboardList size={20} />
                  </div>
                  <h3>{exam.title}</h3>
                  <p>{exam.description || "QCM d'évaluation"}</p>
                  <div className="exam-card-meta">
                    <span className="badge">{exam.year}</span>
                    {exam.duration_minutes && (
                      <span className="badge badge-warning">
                        <Clock size={12} /> {exam.duration_minutes} min
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {subject.exams.length === 0 && (
                <p className="empty-state">Aucun QCM publié pour cette matière.</p>
              )}
            </div>
          )}
        </>
      )}

      {previewDoc && (
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

export default Home;
