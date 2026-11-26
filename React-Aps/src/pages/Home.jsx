import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { schoolsApi } from "../api.js";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Search,
  ShieldAlert,
  Target,
  TrendingUp,
  X,
} from "../components/Icon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import WhatsAppContactButton from "../components/WhatsAppContactButton.jsx";
import { getDriveDownloadUrl } from "../utils/driveUtils.js";
import { stripAccents } from "../utils/academicUtils.js";

function Home() {
  const { user, isRevoked, isPending, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation synchronisée avec l'URL (bouton Précédent du navigateur natif)
  const mainCategory = searchParams.get("cat") || null;
  const schoolParam = searchParams.get("school") || null;
  const subjectParam = searchParams.get("subject") || null;
  const yearParam = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const [previewDoc, setPreviewDoc] = useState(null);
  const [programmesOpen, setProgrammesOpen] = useState(false);

  useEffect(() => {
    setProgrammesOpen(false);
  }, [schoolParam, yearParam]);

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    schoolsApi
      .list()
      .then((data) => setSchools(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const school = useMemo(() => {
    if (!schoolParam || !schools.length) return null;
    return (
      schools.find(
        (s) =>
          String(s?.id || "").toLowerCase() === schoolParam.toLowerCase() ||
          String(s?.name || "").toLowerCase() === schoolParam.toLowerCase()
      ) || null
    );
  }, [schoolParam, schools]);

  const subject = useMemo(() => {
    if (!subjectParam || !school?.subjects) return null;
    return (
      school.subjects.find(
        (sub) =>
          String(sub?.id || "").toLowerCase() === subjectParam.toLowerCase() ||
          String(sub?.name || "").toLowerCase() === subjectParam.toLowerCase()
      ) || null
    );
  }, [subjectParam, school]);

  const year = yearParam;

  const selectCategory = (cat) => {
    setSearchParams(cat ? { cat } : {}, { replace: false });
  };

  const selectSchool = (s) => {
    setSearchParams({ cat: mainCategory || "concours", school: String(s.id) }, { replace: false });
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

  const filteredExams = useMemo(() => {
    const q = stripAccents(search).trim();
    if (!q) return [];
    return allExams.filter((ex) =>
      stripAccents(
        `${ex.title || ""} ${ex.schoolName || ""} ${ex.subjectName || ""} ${ex.year ?? ""} ${ex.description || ""}`
      ).includes(q)
    );
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

  const concoursSchools = useMemo(() => {
    return schools.filter(
      (s) => s.type === "bac_plus_2" || isIscae(s) || isEnseignement(s) || isCnc(s)
    );
  }, [schools]);

  const heroTitle = search.trim()
    ? "Résultats de recherche"
    : subject
    ? subject.name
    : school
    ? school.name
    : mainCategory === "cpge"
    ? "Classes Préparatoires"
    : mainCategory === "concours"
    ? "Concours & Recrutement"
    : null;

  return (
    <div className="ak-page">
      {/* ═══ HERO PLEINE LARGEUR ═══ */}
      <header className="ak-hero">
        <div className="ak-hero-in">
          <h1>
            {heroTitle ? (
              <>
                {heroTitle}
              </>
            ) : (
              <>
                Portail des <em>Formations &amp; Concours</em>
              </>
            )}
          </h1>
          <p>
            {search.trim()
              ? `${filteredExams.length} QCM / document(s) trouvé(s)`
              : "Choisissez votre cursus pour accéder aux cours complets, fiches de synthèse, replays vidéo et annales corrigées."}
          </p>

          {/* Barre de recherche intégrée au Hero */}
          <div style={{ maxWidth: 620, margin: "20px auto 0" }}>
            <div className="ak-search-box" style={{ flex: "none", maxWidth: "100%" }}>
              <span className="ak-search-ic" aria-hidden="true">
                <Search size={16} />
              </span>
              <input
                type="search"
                className="ak-search"
                autoComplete="off"
                placeholder="Rechercher un cours, concours, QCM (ISCAE, CRMEF, Algèbre, 2024)…"
                aria-label="Rechercher un cours, concours ou QCM"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="ak-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Effacer la recherche"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ak-wrapper ak-shell" style={{ paddingBlockStart: 28 }}>
        {/* ── Status Alert Banners (Revoked or Pending) ── */}
        {isRevoked && (
          <div
            style={{
              background: "var(--danger-light)",
              border: "1px solid rgba(220, 38, 38, 0.28)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(220, 38, 38, 0.15)",
                  color: "var(--danger)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "var(--danger)", fontSize: "0.95rem" }}>
                  Accès Révoqué par l'Administrateur
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  Votre accès aux cours privés, vidéos et QCM est actuellement suspendu. Veuillez contacter l'administrateur.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <WhatsAppContactButton
                user={user}
                type="revoked"
                variant="banner"
                label="Contacter sur WhatsApp"
              />
              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 10, fontWeight: 700 }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {isPending && (
          <div
            style={{
              background: "var(--warning-light)",
              border: "1px solid rgba(217, 119, 6, 0.28)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(217, 119, 6, 0.15)",
                  color: "#d97706",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: "#b45309", fontSize: "0.95rem" }}>
                  Inscription en Attente de Validation
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  Votre demande est en cours d'examen par le professeur. L'accès complet sera débloqué dès approbation.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <WhatsAppContactButton
                user={user}
                type="pending"
                variant="banner"
                label="Demander l'approbation sur WhatsApp"
              />
              <button
                type="button"
                onClick={refreshUser}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 10, fontWeight: 700 }}
              >
                Actualiser statut
              </button>
              <button
                type="button"
                onClick={logout}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: 10 }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="center-msg" style={{ padding: 48 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        )}

        {error && (
          <p className="error-msg" style={{ marginBottom: 20 }}>
            <AlertTriangle size={15} /> {error}
          </p>
        )}

        {/* ── Résultats de recherche ── */}
        {!loading && search.trim().length > 0 && (
          <div>
            {filteredExams.length === 0 ? (
              <div className="ak-empty">
                <p style={{ marginBottom: 12 }}>
                  Aucun QCM ne correspond à <strong>« {search} »</strong>.
                </p>
                <button
                  type="button"
                  className="ak-btn ak-btn-pdf"
                  onClick={() => setSearch("")}
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
                      <span className="badge">
                        {exam.schoolType === "post_bac" ? "Post-Bac" : "Concours"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation hiérarchique ── */}
        {!loading && !search.trim() && (
          <>
            {/* NIVEAU 1 : 2 GRANDES CARTES (CPGE vs CONCOURS L2/L3) */}
            {!mainCategory && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                }}
              >
                {/* Carte 1 : CPGE */}
                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => selectCategory("cpge")}
                  style={{
                    textAlign: "left",
                    padding: "36px 30px",
                    borderRadius: 20,
                    border: "1.5px solid var(--ak-br-accent)",
                    background: "linear-gradient(155deg, var(--surface) 0%, var(--ak-blue-tint) 100%)",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 15,
                        background: "linear-gradient(135deg, #132a4f, #1d4ed8)",
                        color: "white",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 20,
                        boxShadow: "0 8px 20px rgba(29, 78, 216, 0.28)",
                      }}
                    >
                      <GraduationCap size={26} />
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
                      Accompagnement complet pour les filières scientifiques et commerciales :{" "}
                      <strong>MPSI, MP, PCSI, PSI, TSI, ECS, ECT</strong>. Cours, fiches résumés, exercices et replays vidéo.
                    </p>
                  </div>

                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                      <span className="badge">Passerelle Bac→Prépa</span>
                      <span className="badge">1ère Année (Sup)</span>
                      <span className="badge">2ème Année (Spé)</span>
                      <span className="badge">Passerelle Sup→Spé</span>
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
                </button>

                {/* Carte 2 : Concours L2 / L3 */}
                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => selectCategory("concours")}
                  style={{
                    textAlign: "left",
                    padding: "36px 30px",
                    borderRadius: 20,
                    border: "1.5px solid var(--border)",
                    background: "linear-gradient(155deg, var(--surface) 0%, var(--surface-2) 100%)",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 15,
                        background: "linear-gradient(135deg, #0369a1, #2563eb)",
                        color: "white",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 20,
                        boxShadow: "0 8px 20px rgba(3, 105, 161, 0.25)",
                      }}
                    >
                      <Award size={26} />
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "var(--cyan)",
                        marginBottom: 6,
                      }}
                    >
                      Grandes Écoles &amp; Recrutement
                    </div>
                    <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                      Concours L2 / L3 &amp; Recrutement
                    </h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 20 }}>
                      Entraînement intensif avec QCM interactifs, annales officielles et solutions détaillées :{" "}
                      <strong>ISCAE, Recrutement des Enseignants (CRMEF), CNC et Passerelles Universitaires</strong>.
                    </p>
                  </div>

                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                      <span className="badge">Concours ISCAE</span>
                      <span className="badge badge-success">Recrutement Enseignants</span>
                      <span className="badge">Concours CPGE</span>
                      <span className="badge">QCM &amp; Annales</span>
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
                      Accéder aux Concours <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* NIVEAU 2 : ESPACE CPGE (4 CARTES) */}
            {mainCategory === "cpge" && !school && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                }}
              >
                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => navigate("/passerelle-bac-prepa")}
                  style={{ textAlign: "left", padding: "28px 24px", borderRadius: 18 }}
                >
                  <div className="exam-card-icon">
                    <GraduationCap size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "10px 0 4px" }}>
                    Passerelle Bac → Prépa
                  </h3>
                  <p>
                    Annales officielles des concours (Al Zahrawi, LYDEX, LYMED), devoirs d'entraînement et vidéos corrigées.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 10, fontWeight: 700, fontSize: "0.86rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Ouvrir la Passerelle Bac <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => navigate("/cours?annee=1")}
                  style={{
                    textAlign: "left",
                    padding: "28px 24px",
                    borderRadius: 18,
                    border: "1.5px solid var(--ak-br-accent)",
                    background: "linear-gradient(155deg, var(--surface) 0%, var(--ak-blue-tint) 100%)",
                  }}
                >
                  <div className="exam-card-icon">
                    <BookOpen size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "10px 0 4px" }}>
                    1ère Année Classes Prépa (Sup)
                  </h3>
                  <p>
                    MPSI, PCSI, TSI 1, ECS 1, ECT 1 : cours, résumés, fiches, exercices et vidéos d'explication.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 10, fontWeight: 700, fontSize: "0.86rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Choisir sa filière Sup <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => navigate("/cours?annee=2")}
                  style={{ textAlign: "left", padding: "28px 24px", borderRadius: 18 }}
                >
                  <div className="exam-card-icon">
                    <BookOpen size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "10px 0 4px" }}>
                    2ème Année Classes Prépa (Spé)
                  </h3>
                  <p>
                    MP, PSI, TSI 2, ECS 2, ECT 2 : préparation intensive aux concours (CNC, Mines, Centrale, BCE).
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 10, fontWeight: 700, fontSize: "0.86rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Choisir sa filière Spé <ArrowRight size={15} />
                  </div>
                </button>

                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => navigate("/passerelle")}
                  style={{ textAlign: "left", padding: "28px 24px", borderRadius: 18 }}
                >
                  <div className="exam-card-icon">
                    <TrendingUp size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "10px 0 4px" }}>
                    Passerelle Sup → Spé
                  </h3>
                  <p>
                    Feuille de route de l'été, 5 filières (MP, PSI, TSI, ECS, ECT), bibliothèque et vidéos d'explication.
                  </p>
                  <div style={{ marginTop: "auto", paddingTop: 10, fontWeight: 700, fontSize: "0.86rem", color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Ouvrir la Passerelle <ArrowRight size={15} />
                  </div>
                </button>
              </div>
            )}

            {/* NIVEAU 2 : CONCOURS L2 / L3 */}
            {mainCategory === "concours" && !school && (
              <div className="exam-grid">
                {concoursSchools.map((item) => {
                  const isItemIscae = isIscae(item);
                  const isItemEns = isEnseignement(item);
                  const isItemCnc = isCnc(item);

                  const cardIcon = isItemIscae ? (
                    <TrendingUp size={22} />
                  ) : isItemEns ? (
                    <GraduationCap size={22} />
                  ) : isItemCnc ? (
                    <Award size={22} />
                  ) : (
                    item.icon || <GraduationCap size={22} />
                  );

                  const cardDescription = isItemIscae
                    ? item.description ||
                      "Préparez le concours d'accès à la Grande École de Commerce du Maroc. QCM ciblés en mathématiques, logique et culture économique."
                    : isItemEns
                    ? item.description ||
                      "Cadre de référence officiel, programmes du Ministère de l'Éducation Nationale et annales corrigées (CRMEF / Agrégation)."
                    : isItemCnc
                    ? item.description ||
                      "Concours National Commun pour l'accès aux Grandes Écoles d'Ingénieurs marocaines (EHTP, EMI, ENSIAS, etc.)."
                    : item.description || "";

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="card exam-card"
                      onClick={() => selectSchool(item)}
                      style={{ textAlign: "left", padding: "26px 22px", borderRadius: 18 }}
                    >
                      <div className="exam-card-icon">{cardIcon}</div>
                      <h3 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "8px 0 4px" }}>
                        {item.name}
                      </h3>
                      <p>{cardDescription}</p>
                      <div className="exam-card-meta" style={{ marginTop: "auto", paddingTop: 10, flexWrap: "wrap" }}>
                        {isItemIscae && <span className="badge">Grande École de Commerce</span>}
                        {isItemEns && <span className="badge badge-success">Recrutement Enseignants</span>}
                        {isItemCnc && <span className="badge">Grandes Écoles d'Ingénieurs</span>}
                        <span className="badge">{item.subjects?.length || 0} matière(s)</span>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => {
                    const postBacSchool = schools.find((s) => s.type === "post_bac");
                    if (postBacSchool) selectSchool(postBacSchool);
                  }}
                  style={{ textAlign: "left", padding: "26px 22px", borderRadius: 18 }}
                >
                  <div className="exam-card-icon">
                    <Target size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "8px 0 4px" }}>
                    Concours Post-Bac (ENSA, ENSAM, Médecine)
                  </h3>
                  <p>
                    Entraînement aux épreuves d'accès direct après le baccalauréat (ENSA, ENSAM, FMP, FMD, IAV).
                  </p>
                  <div className="exam-card-meta" style={{ marginTop: "auto", paddingTop: 10 }}>
                    <span className="badge badge-success">Accès Direct Post-Bac</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="card exam-card"
                  onClick={() => navigate("/concours-cpge")}
                  style={{
                    textAlign: "left",
                    padding: "26px 22px",
                    borderRadius: 18,
                    border: "1.5px solid var(--ak-br-accent)",
                    background: "linear-gradient(155deg, var(--surface) 0%, var(--ak-blue-tint) 100%)",
                  }}
                >
                  <div className="exam-card-icon">
                    <Award size={22} />
                  </div>
                  <h3 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "8px 0 4px" }}>
                    Concours CPGE
                  </h3>
                  <p>
                    Annales officielles et corrigés détaillés MP, PSI, TSI : CNC, CCINP, Mines-Ponts, Centrale-Supélec, X-ENS, E3A.
                  </p>
                  <div className="exam-card-meta" style={{ marginTop: "auto", paddingTop: 10, flexWrap: "wrap" }}>
                    <span className="badge">1 000+ Annales &amp; Corrigés</span>
                    <span className="badge badge-success">Vidéos Solution</span>
                  </div>
                </button>
              </div>
            )}

            {/* NIVEAU 3 : MATIÈRES */}
            {school && !enseignement && !subject && (
              <div className="exam-grid">
                {(school.subjects || []).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="card exam-card"
                    onClick={() => selectSubject(item)}
                    style={{ textAlign: "left", padding: "26px 22px", borderRadius: 18 }}
                  >
                    <div className="exam-card-icon">
                      <BookOpen size={20} />
                    </div>
                    <h3 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "8px 0 4px" }}>
                      {item.name}
                    </h3>
                    <p>{item.level || "Matière de concours"}</p>
                    <div className="exam-card-meta" style={{ marginTop: "auto", paddingTop: 10 }}>
                      <span className="badge">{item.exams?.length || 0} QCM / Test(s)</span>
                    </div>
                  </button>
                ))}
                {(school.subjects || []).length === 0 && (
                  <p className="ak-empty">Aucune matière disponible pour le moment.</p>
                )}
              </div>
            )}

            {/* Vue Recrutement Enseignants (Cadre de référence & années) */}
            {school && enseignement && !year && (
              <div>
                {(school.programmes || []).length > 0 && (
                  <article className={`ak-card cat-algebre ${programmesOpen ? "open" : ""}`} style={{ marginBottom: 24 }}>
                    <button
                      type="button"
                      className="ak-card-head"
                      aria-expanded={programmesOpen}
                      onClick={() => setProgrammesOpen((prev) => !prev)}
                    >
                      <span className="ak-card-n" aria-hidden="true">
                        <GraduationCap size={20} />
                      </span>
                      <span className="ak-card-titles">
                        <span className="ak-card-titre">Cadre de Référence &amp; Programmes Officiels</span>
                        <span className="ak-card-desc">
                          Orientations pédagogiques et programmes du Ministère de l'Éducation Nationale
                        </span>
                      </span>
                      <span className="ak-badge ak-b-algebre">
                        {(school.programmes || []).length} document{(school.programmes || []).length > 1 ? "s" : ""}
                      </span>
                      <span className="ak-card-chev" aria-hidden="true">
                        <ChevronDown size={17} />
                      </span>
                    </button>
                    {programmesOpen && (
                      <div className="ak-card-body">
                        <div className="ak-doc-list">
                          {(school.programmes || []).map((prog) => (
                            <div key={prog.id} className="ak-doc-line-wrap">
                              <div className="ak-doc-line">
                                <span className="ak-doc-line-ic" aria-hidden="true">
                                  <FileText size={15} />
                                </span>
                                <span className="ak-doc-line-txt">
                                  <span className="ak-doc-line-t">{prog.label}</span>
                                  <span className="ak-doc-line-d">Session {prog.year}</span>
                                </span>
                                <span className="ak-doc-line-b">
                                  <button
                                    type="button"
                                    className="ak-btn ak-btn-pdf"
                                    onClick={() => setPreviewDoc(prog)}
                                  >
                                    <BookOpen size={14} /> Aperçu
                                  </button>
                                  <a
                                    className="ak-btn ak-btn-exo"
                                    href={getDriveDownloadUrl(prog.document_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Download size={14} /> Télécharger
                                  </a>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                )}

                <div className="ak-sep">
                  <div className="ak-sep-l">
                    <span className="ak-sep-dot" aria-hidden="true" />
                    Annales des Concours par Année
                  </div>
                  <div className="ak-sep-line" />
                </div>
                <div className="exam-grid">
                  {years.map((y) => (
                    <button
                      type="button"
                      key={y}
                      className="card exam-card"
                      onClick={() => selectYear(y)}
                      style={{ textAlign: "left", padding: "26px 22px", borderRadius: 18 }}
                    >
                      <div className="exam-card-icon">
                        <Calendar size={22} />
                      </div>
                      <h3 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "8px 0 4px" }}>
                        Session {y}
                      </h3>
                      <p>Épreuves écrites et QCM du concours de recrutement</p>
                      <div className="exam-card-meta" style={{ marginTop: "auto", paddingTop: 10 }}>
                        <span className="badge badge-success">Accéder aux sujets {y}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recrutement Enseignants - Année spécifique */}
            {school && enseignement && year && (
              <div>
                {yearProgrammes.length > 0 && (
                  <article className={`ak-card cat-algebre ${programmesOpen ? "open" : ""}`} style={{ marginBottom: 24 }}>
                    <button
                      type="button"
                      className="ak-card-head"
                      aria-expanded={programmesOpen}
                      onClick={() => setProgrammesOpen((prev) => !prev)}
                    >
                      <span className="ak-card-n">{year}</span>
                      <span className="ak-card-titles">
                        <span className="ak-card-titre">Documents officiels — Session {year}</span>
                      </span>
                      <span className="ak-badge ak-b-algebre">
                        {yearProgrammes.length} document{yearProgrammes.length > 1 ? "s" : ""}
                      </span>
                      <span className="ak-card-chev" aria-hidden="true">
                        <ChevronDown size={17} />
                      </span>
                    </button>
                    {programmesOpen && (
                      <div className="ak-card-body">
                        <div className="ak-doc-list">
                          {yearProgrammes.map((prog) => (
                            <div key={prog.id} className="ak-doc-line-wrap">
                              <div className="ak-doc-line">
                                <span className="ak-doc-line-ic" aria-hidden="true">
                                  <FileText size={15} />
                                </span>
                                <span className="ak-doc-line-txt">
                                  <span className="ak-doc-line-t">{prog.label}</span>
                                </span>
                                <span className="ak-doc-line-b">
                                  <button
                                    type="button"
                                    className="ak-btn ak-btn-pdf"
                                    onClick={() => setPreviewDoc(prog)}
                                  >
                                    <BookOpen size={14} /> Aperçu
                                  </button>
                                  <a
                                    className="ak-btn ak-btn-exo"
                                    href={getDriveDownloadUrl(prog.document_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Download size={14} /> Télécharger
                                  </a>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                )}

                <div className="ak-sep">
                  <div className="ak-sep-l">
                    <span className="ak-sep-dot" aria-hidden="true" />
                    Épreuves et QCM {year}
                  </div>
                  <div className="ak-sep-line" />
                </div>
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
                    <p className="ak-empty">Aucun examen disponible pour cette année.</p>
                  )}
                </div>
              </div>
            )}

            {/* NIVEAU 4 : EXAMENS D'UNE MATIÈRE */}
            {subject && (
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
                  <p className="ak-empty">Aucun examen disponible pour cette matière.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {previewDoc && (
        <PdfPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

export default Home;
