import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Trophy,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Video
} from "../components/Icon.jsx";

function driveFileId(url) {
  if (!url) return null;
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation state directly driven by URL searchParams for full browser/phone back-button support
  const mainCategory = searchParams.get("cat") || null;
  const schoolParam = searchParams.get("school") || null;
  const subjectParam = searchParams.get("subject") || null;
  const yearParam = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const [previewDoc, setPreviewDoc] = useState(null);

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    schoolsApi
      .list()
      .then((data) => setSchools(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Derived school from URL param + schools data
  const school = useMemo(() => {
    if (!schoolParam || !schools.length) return null;
    return (
      schools.find(
        (s) =>
          String(s.id).toLowerCase() === schoolParam.toLowerCase() ||
          s.name.toLowerCase() === schoolParam.toLowerCase()
      ) || null
    );
  }, [schoolParam, schools]);

  // Derived subject from URL param + school data
  const subject = useMemo(() => {
    if (!subjectParam || !school?.subjects) return null;
    return (
      school.subjects.find(
        (sub) =>
          String(sub.id).toLowerCase() === subjectParam.toLowerCase() ||
          sub.name.toLowerCase() === subjectParam.toLowerCase()
      ) || null
    );
  }, [subjectParam, school]);

  const year = yearParam;

  // History-aware navigation functions
  const selectCategory = (cat) => {
    setSearchParams(cat ? { cat } : {}, { replace: false });
  };

  const selectSchool = (s) => {
    setSearchParams(
      { cat: mainCategory || "concours", school: String(s.id) },
      { replace: false }
    );
  };

  const selectSubject = (sub) => {
    setSearchParams(
      {
        cat: mainCategory || "concours",
        school: String(school?.id || schoolParam),
        subject: String(sub.id),
      },
      { replace: false }
    );
  };

  const selectYear = (y) => {
    setSearchParams(
      {
        cat: mainCategory || "concours",
        school: String(school?.id || schoolParam),
        year: String(y),
      },
      { replace: false }
    );
  };

  // Robust back navigation: steps back one level in the hierarchy
  const handleBack = () => {
    if (subject) {
      setSearchParams(
        { cat: mainCategory || "concours", school: String(school?.id || schoolParam) },
        { replace: false }
      );
    } else if (year) {
      setSearchParams(
        { cat: mainCategory || "concours", school: String(school?.id || schoolParam) },
        { replace: false }
      );
    } else if (school) {
      setSearchParams({ cat: mainCategory || "concours" }, { replace: false });
    } else if (mainCategory) {
      setSearchParams({}, { replace: false });
    } else {
      navigate(-1);
    }
  };

  // Flatten all exams for direct search
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
    if (!q) return [];
    return allExams.filter((ex) => {
      return (
        ex.title.toLowerCase().includes(q) ||
        ex.schoolName.toLowerCase().includes(q) ||
        ex.subjectName.toLowerCase().includes(q) ||
        (ex.year && String(ex.year).includes(q)) ||
        (ex.description && ex.description.toLowerCase().includes(q))
      );
    });
  }, [allExams, search]);

  const isEnseignement = (s) => s?.name?.toLowerCase().includes("enseignement");
  const isIscae = (s) => s?.name?.toLowerCase().includes("iscae");
  const isCnc = (s) => s?.name?.toLowerCase().includes("cnc");

  const enseignement = school && isEnseignement(school);

  const years = enseignement
    ? [
        ...new Set([
          ...(school.programmes || []).map((p) => p.year),
          ...(school.subjects || []).flatMap((s) => (s.exams || []).map((e) => e.year)),
        ]),
      ].sort((a, b) => b - a)
    : [];

  const yearProgrammes = enseignement
    ? (school.programmes || []).filter((p) => p.year === year)
    : [];
  const yearExams = enseignement
    ? (school.subjects || []).flatMap((s) =>
        (s.exams || [])
          .filter((e) => e.year === year)
          .map((e) => ({ ...e, subjectName: s.name }))
      )
    : [];

  // Schools for Concours L2/L3 category (ISCAE, Enseignement, CNC, etc.)
  const concoursSchools = useMemo(() => {
    return schools.filter(
      (s) => s.type === "bac_plus_2" || isIscae(s) || isEnseignement(s) || isCnc(s)
    );
  }, [schools]);

  return (
    <div className="page" style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 18px 80px" }}>
      {/* ── Header ── */}
      <div className="page-header fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          className="section-label"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(67, 97, 238, 0.08)",
            color: "var(--primary)",
            padding: "4px 14px",
            borderRadius: 99,
            fontWeight: 700,
            fontSize: "0.78rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          <Sparkles size={14} /> E-LEARNING MATHEMATICS • PR. A. KHADIR
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
          {search ? "Résultats de recherche" : "Portail des Formations & Concours"}
        </h1>
        <p style={{ maxWidth: 640, margin: "8px auto 0", color: "var(--text-muted)", fontSize: "1rem" }}>
          {search
            ? `${filteredExams.length} QCM / document(s) trouvé(s)`
            : "Choisissez votre cursus pour accéder aux cours complets, fiches, vidéos et annales corrigées"}
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div
        className="card fade-up"
        style={{
          padding: "12px 18px",
          marginBottom: 28,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un cours, concours, QCM, chapitre (ex. ISCAE, CRMEF, Algèbre, Wallis, 2024)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 16px 10px 42px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-subtle, #f8fafc)",
              color: "var(--text)",
              fontSize: "0.95rem",
            }}
          />
        </div>
      </div>

      {loading && (
        <div className="center-msg" style={{ padding: 40, textAlign: "center" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      )}

      {error && (
        <p className="error-msg" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} /> {error}
        </p>
      )}

      {/* ── Search Results View ── */}
      {!loading && search.trim().length > 0 && (
        <div>
          {filteredExams.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 16px", textAlign: "center" }}>
              <Search size={42} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
              <h3>Aucun QCM trouvé</h3>
              <p>Aucun examen ne correspond à votre recherche "{search}".</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSearch("")}
                style={{ marginTop: 14, borderRadius: 10 }}
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
                      {exam.schoolType === "post_bac" ? "Post-Bac" : "Concours"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Hierarchical Card Navigation ── */}
      {!loading && !search.trim() && (
        <>
          {/* Back Button (Clean, minimal, no breadcrumb trail) */}
          {(mainCategory || school || subject) && (
            <div style={{ marginBottom: 20 }}>
              <button className="btn btn-secondary" onClick={handleBack} style={{ borderRadius: 12 }}>
                <ArrowLeft size={16} /> Retour
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
             NIVEAU 1 : LES 2 GRANDES CARTES (CPGE vs CONCOURS L2/L3)
             ══════════════════════════════════════════════════════ */}
          {!mainCategory && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {/* Carte 1 : CPGE */}
              <div
                className="card exam-card"
                onClick={() => selectCategory("cpge")}
                style={{
                  cursor: "pointer",
                  padding: "36px 28px",
                  borderRadius: 20,
                  border: "2px solid rgba(67, 97, 238, 0.2)",
                  background: "linear-gradient(145deg, var(--surface) 0%, rgba(67, 97, 238, 0.04) 100%)",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 24px rgba(67, 97, 238, 0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #4361ee, #7c3aed)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.6rem",
                      marginBottom: 20,
                      boxShadow: "0 6px 18px rgba(67, 97, 238, 0.35)",
                    }}
                  >
                    🎓
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--primary)",
                      marginBottom: 6,
                    }}
                  >
                    Filières d'Excellence
                  </div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                    CPGE (Classes Préparatoires)
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 20 }}>
                    Accompagnement complet pour les filières scientifiques et commerciales : 
                    <strong> MPSI, MP, PCSI, PSI, TSI, ECS, ECT</strong>. Cours, fiches résumés, exercices et vidéos d'explication.
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    <span className="badge badge-primary">Passerelle Bac→Prépa</span>
                    <span className="badge badge-primary">1ère Année (Sup)</span>
                    <span className="badge badge-primary">2ème Année (Spé)</span>
                    <span className="badge badge-primary">Passerelle Sup→Spé</span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 700,
                      color: "var(--primary)",
                      fontSize: "0.95rem",
                    }}
                  >
                    Accéder à l'espace CPGE <ArrowRight size={16} />
                  </div>
                </div>
              </div>

              {/* Carte 2 : Concours L2 / L3 */}
              <div
                className="card exam-card"
                onClick={() => selectCategory("concours")}
                style={{
                  cursor: "pointer",
                  padding: "36px 28px",
                  borderRadius: 20,
                  border: "2px solid rgba(217, 161, 58, 0.25)",
                  background: "linear-gradient(145deg, var(--surface) 0%, rgba(217, 161, 58, 0.05) 100%)",
                  transition: "all 0.25s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 24px rgba(217, 161, 58, 0.08)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      background: "linear-gradient(135deg, #d97706, #b45309)",
                      color: "white",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.6rem",
                      marginBottom: 20,
                      boxShadow: "0 6px 18px rgba(217, 119, 6, 0.35)",
                    }}
                  >
                    🏆
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#b45309",
                      marginBottom: 6,
                    }}
                  >
                    Grandes Écoles & Recrutement
                  </div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                    Concours L2 / L3 & Recrutement
                  </h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 20 }}>
                    Entraînement intensif avec QCM interactifs, annales officielles et solutions détaillées :
                    <strong> ISCAE, Recrutement des Enseignants (CRMEF), CNC et Passerelles Universitaires</strong>.
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    <span className="badge badge-warning">Concours ISCAE</span>
                    <span className="badge badge-success">Recrutement Enseignants</span>
                    <span className="badge badge-primary">Passerelles L2/L3</span>
                    <span className="badge">QCM & Annales</span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 700,
                      color: "#b45309",
                      fontSize: "0.95rem",
                    }}
                  >
                    Accéder aux Concours <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
             NIVEAU 2 : DANS LA CARTE CPGE (4 SOUS-CARTES)
             ══════════════════════════════════════════════════════ */}
          {mainCategory === "cpge" && !school && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 20,
                  marginBottom: 36,
                }}
              >
                {/* 1. Passerelle Bac → Prépa */}
                <div
                  className="card exam-card"
                  onClick={() => navigate("/cours")}
                  style={{
                    cursor: "pointer",
                    padding: "26px 22px",
                    borderRadius: 18,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div className="exam-card-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}>
                    🌉
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>
                    Passerelle Bac → Prépa
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    Méthodologie, rappels fondamentaux et entraînement pour réussir la transition du lycée vers la prépa.
                  </p>
                  <div style={{ marginTop: 14, fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)" }}>
                    Découvrir les modules ➔
                  </div>
                </div>

                {/* 2. 1ère Année Classes Prépa (Sup) */}
                <div
                  className="card exam-card"
                  onClick={() => navigate("/cours?annee=1")}
                  style={{
                    cursor: "pointer",
                    padding: "26px 22px",
                    borderRadius: 18,
                    border: "2px solid rgba(67, 97, 238, 0.25)",
                    background: "linear-gradient(145deg, var(--surface) 0%, rgba(67, 97, 238, 0.05) 100%)",
                  }}
                >
                  <div className="exam-card-icon" style={{ background: "rgba(67, 97, 238, 0.15)", color: "#4361ee" }}>
                    📘
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>
                    1ère Année Classes Prépa (Sup)
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    MPSI, PCSI, TSI 1, ECS 1, ECT 1 : cours, résumés, fiches, exercices et vidéos d'explication.
                  </p>
                  <div style={{ marginTop: 14, fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)" }}>
                    Choisir sa filière Sup ➔
                  </div>
                </div>

                {/* 3. 2ème Année Classes Prépa (Spé) */}
                <div
                  className="card exam-card"
                  onClick={() => navigate("/cours?annee=2")}
                  style={{
                    cursor: "pointer",
                    padding: "26px 22px",
                    borderRadius: 18,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                >
                  <div className="exam-card-icon" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
                    📙
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>
                    2ème Année Classes Prépa (Spé)
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    MP, PSI, TSI 2, ECS 2, ECT 2 : préparation intensive aux concours (CNC, Mines, Centrale, BCE).
                  </p>
                  <div style={{ marginTop: 14, fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)" }}>
                    Choisir sa filière Spé ➔
                  </div>
                </div>

                {/* 4. Passerelle Sup → Spé */}
                <div
                  className="card exam-card"
                  onClick={() => navigate("/passerelle")}
                  style={{
                    cursor: "pointer",
                    padding: "26px 22px",
                    borderRadius: 18,
                    border: "2px solid rgba(217, 161, 58, 0.3)",
                    background: "linear-gradient(145deg, var(--surface) 0%, rgba(217, 161, 58, 0.08) 100%)",
                  }}
                >
                  <div className="exam-card-icon" style={{ background: "rgba(217, 161, 58, 0.15)", color: "#b57809" }}>
                    🚀
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px", color: "var(--text)" }}>
                    Passerelle Sup → Spé
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                    Feuille de route de l'été, 5 filières (MP, PSI, TSI, ECS, ECT), bibliothèque et vidéos d'explication.
                  </p>
                  <div style={{ marginTop: 14, fontWeight: 700, fontSize: "0.85rem", color: "#b57809" }}>
                    Ouvrir la Passerelle ➔
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
             NIVEAU 2 : DANS LA CARTE CONCOURS L2 / L3 (ISCAE, CRMEF, ETC.)
             ══════════════════════════════════════════════════════ */}
          {mainCategory === "concours" && !school && (
            <div className="exam-grid">
              {concoursSchools.map((item) => {
                const isItemIscae = isIscae(item);
                const isItemEns = isEnseignement(item);
                const isItemCnc = isCnc(item);

                const cardIcon = isItemIscae ? (
                  <TrendingUp size={24} style={{ color: "#2563eb" }} />
                ) : isItemEns ? (
                  <GraduationCap size={24} style={{ color: "#7c3aed" }} />
                ) : isItemCnc ? (
                  <Award size={24} style={{ color: "#d97706" }} />
                ) : (
                  item.icon || <GraduationCap size={22} />
                );

                const cardDescription = isItemIscae
                  ? (item.description || "Préparez le concours d'accès à la Grande École de Commerce du Maroc. QCM ciblés en mathématiques, logique et culture économique avec corrections détaillées.")
                  : isItemEns
                  ? (item.description || "Cadre de référence officiel, programmes du Ministère de l'Éducation Nationale et annales corrigées pour le recrutement des enseignants (CRMEF / Capes / Agrégation).")
                  : isItemCnc
                  ? (item.description || "Concours National Commun pour l'accès aux Grandes Écoles d'Ingénieurs marocaines (EHTP, EMI, ENSIAS, etc.).")
                  : item.description || "";

                return (
                  <div
                    key={item.id}
                    className="card exam-card"
                    onClick={() => selectSchool(item)}
                    style={{ cursor: "pointer", padding: "26px 22px", borderRadius: 18 }}
                  >
                    <div className="exam-card-icon">{cardIcon}</div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                      {cardDescription}
                    </p>
                    <div className="exam-card-meta" style={{ marginTop: 14 }}>
                      {isItemIscae && (
                        <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                          Grande École de Commerce 🏆
                        </span>
                      )}
                      {isItemEns && (
                        <span className="badge badge-success" style={{ fontWeight: 800 }}>
                          Recrutement Enseignants 🎓
                        </span>
                      )}
                      {isItemCnc && (
                        <span className="badge badge-primary" style={{ fontWeight: 800 }}>
                          Grandes Écoles d'Ingénieurs ⚡
                        </span>
                      )}
                      <span className="badge">{item.subjects?.length || 0} matière(s)</span>
                    </div>
                  </div>
                );
              })}

              {/* Concours Post-Bac (Optionnel) */}
              <div
                className="card exam-card"
                onClick={() => {
                  const postBacSchool = schools.find((s) => s.type === "post_bac");
                  if (postBacSchool) selectSchool(postBacSchool);
                }}
                style={{ cursor: "pointer", padding: "26px 22px", borderRadius: 18 }}
              >
                <div className="exam-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                  <Target size={24} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>
                  Concours Post-Bac (ENSA, ENSAM, Médecine)
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
                  Entraînement aux épreuves d'accès direct après le baccalauréat (ENSA, ENSAM, FMP, FMD, IAV).
                </p>
                <div className="exam-card-meta" style={{ marginTop: 14 }}>
                  <span className="badge badge-success">Accès Direct Post-Bac</span>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
             NIVEAU 3 : MATIÈRES DE L'ÉCOLE / CONCOURS SÉLECTIONNÉ
             ══════════════════════════════════════════════════════ */}
          {school && !enseignement && !subject && (
            <div className="exam-grid">
              {(school.subjects || []).map((item) => (
                <div
                  key={item.id}
                  className="card exam-card"
                  onClick={() => selectSubject(item)}
                  style={{ cursor: "pointer", padding: "26px 22px", borderRadius: 18 }}
                >
                  <div className="exam-card-icon">
                    <BookOpen size={20} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>{item.name}</h3>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>{item.level || "Matière de concours"}</p>
                  <div className="exam-card-meta" style={{ marginTop: 14 }}>
                    <span className="badge badge-primary">{item.exams?.length || 0} QCM / Test(s)</span>
                  </div>
                </div>
              ))}
              {(school.subjects || []).length === 0 && (
                <p className="empty-state">Aucune matière disponible pour le moment.</p>
              )}
            </div>
          )}

          {/* Vue spéciale Recrutement Enseignants (avec Cadre de référence & années) */}
          {school && enseignement && !year && (
            <div className="enseignement-container">
              {/* Cadre de référence */}
              <div className="programme-officiel-card">
                <div className="programme-officiel-header">
                  <div className="programme-officiel-icon">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3>Cadre de Référence & Programmes Officiels</h3>
                    <p>Orientations pédagogiques et programmes du Ministère de l'Éducation Nationale</p>
                  </div>
                </div>
                <div className="programmes-list">
                  {(school.programmes || []).map((prog) => (
                    <div key={prog.id} className="programme-item">
                      <div className="programme-item-left">
                        <FileText size={18} />
                        <div>
                          <strong>{prog.label}</strong>
                          <span className="badge badge-accent" style={{ marginLeft: 8 }}>{prog.year}</span>
                        </div>
                      </div>
                      <div className="programme-item-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(prog)}>
                          <BookOpen size={14} /> Aperçu
                        </button>
                        <a
                          className="btn btn-secondary btn-sm"
                          href={driveDownloadUrl(prog.document_url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={14} /> Télécharger
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="section-title" style={{ marginTop: 32, marginBottom: 16 }}>
                Annales des Concours par Année
              </h2>
              <div className="exam-grid">
                {years.map((y) => (
                  <div
                    key={y}
                    className="card exam-card"
                    onClick={() => selectYear(y)}
                    style={{ cursor: "pointer", padding: "26px 22px", borderRadius: 18 }}
                  >
                    <div className="exam-card-icon">
                      <Calendar size={22} />
                    </div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "12px 0 6px" }}>Session {y}</h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                      Épreuves écrites et QCM du concours de recrutement
                    </p>
                    <div className="exam-card-meta" style={{ marginTop: 14 }}>
                      <span className="badge badge-success">Accéder aux sujets {y} ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recrutement Enseignants - Année spécifique */}
          {school && enseignement && year && (
            <div>
              {yearProgrammes.length > 0 && (
                <div className="programme-officiel-card" style={{ marginBottom: 24 }}>
                  <h4 style={{ marginBottom: 12 }}>Documents officiels — Session {year}</h4>
                  {yearProgrammes.map((prog) => (
                    <div key={prog.id} className="programme-item">
                      <div className="programme-item-left">
                        <FileText size={18} />
                        <strong>{prog.label}</strong>
                      </div>
                      <div className="programme-item-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(prog)}>
                          <BookOpen size={14} /> Aperçu
                        </button>
                        <a
                          className="btn btn-secondary btn-sm"
                          href={driveDownloadUrl(prog.document_url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={14} /> Télécharger
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h3 style={{ marginBottom: 16 }}>Épreuves et QCM {year}</h3>
              <div className="exam-grid">
                {yearExams.map((exam) => (
                  <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
                    <div className="exam-card-icon">{school.icon || <ClipboardList size={20} />}</div>
                    <h3>{exam.title}</h3>
                    <p>{exam.subjectName}</p>
                    <div className="exam-card-meta">
                      {exam.duration_minutes && (
                        <span className="badge badge-warning">
                          <Clock size={12} /> {exam.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {yearExams.length === 0 && (
                  <p className="empty-state">Aucun examen disponible pour cette année.</p>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
             NIVEAU 4 : EXAMENS D'UNE MATIÈRE
             ══════════════════════════════════════════════════════ */}
          {subject && (
            <div>
              <div className="exam-grid">
                {(subject.exams || []).map((exam) => (
                  <Link key={exam.id} to={`/exam/${exam.id}`} className="exam-card">
                    <div className="exam-card-icon">{school?.icon || <ClipboardList size={20} />}</div>
                    <h3>{exam.title}</h3>
                    <p>
                      {school?.name} • {subject.name}
                    </p>
                    <div className="exam-card-meta">
                      {exam.year && <span className="badge">{exam.year}</span>}
                      {exam.duration_minutes && (
                        <span className="badge badge-warning">
                          <Clock size={12} /> {exam.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {(subject.exams || []).length === 0 && (
                  <p className="empty-state">Aucun examen disponible pour cette matière.</p>
                )}
              </div>
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
