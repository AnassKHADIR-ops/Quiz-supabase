import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  examsApi,
  programmesApi,
  schoolsApi,
  subjectsApi,
  coursesApi,
  passerelleApi,
} from "../api.js";
import MathText from "../components/MathText.jsx";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  GraduationCap,
  Sparkles,
  Video,
  X,
  PlayCircle,
  Clock,
  Download,
} from "../components/Icon.jsx";

const makeQuestion = () => ({
  question_text: "",
  solution_text: "",
  choices: Array.from({ length: 4 }, (_, i) => ({ choice_text: "", is_correct: i === 0 })),
});

const tabs = [
  { id: "schools", label: "Écoles", Icon: GraduationCap },
  { id: "subjects", label: "Matières", Icon: BookOpen },
  { id: "qcms", label: "QCM", Icon: ClipboardList },
  { id: "programmes", label: "Programmes", Icon: FileText },
  { id: "courses", label: "Cours CPGE", Icon: BookOpen },
  { id: "passerelle", label: "Passerelle Sup➔Spé", Icon: Sparkles },
];

const typeOptions = [
  { value: "post_bac", label: "Post-Bac" },
  { value: "bac_plus_2", label: "Bac+2" },
];

const categoryOptions = [
  { value: "algebre", label: "Algèbre" },
  { value: "analyse", label: "Analyse" },
  { value: "proba", label: "Probabilités" },
  { value: "geometrie", label: "Géométrie" },
];

const questionTemplates = [
  { label: "Inéquation", text: "Soit $S$ l’ensemble des solutions dans $\\mathbb{R}$ de l’inéquation : $$x-1 \\leq \\sqrt{x^2-3x-4}$$\n\n$S=$" },
  { label: "Limite", text: "Calculer la limite suivante :\n$$\\lim_{x\\to }\\frac{}{}$$" },
  { label: "Système", text: "Soit $S$ l’ensemble des solutions du système :\n$$\\begin{cases} \\ \\end{cases}$$" },
  { label: "Suite", text: "On considère la suite $(u_n)$ définie par :\n$$u_0=\\frac{1}{2}\\quad\\text{et}\\quad u_{n+1}=\\frac{3u_n}{1+2u_n}$$" },
];

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="management-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="management-modal-close" onClick={onClose} aria-label="Fermer">
          <X size={16} />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="management-empty">
      <span>◌</span>
      {text}
    </div>
  );
}

function MathEditor({ label, value, onChange, placeholder, compact = false }) {
  return (
    <div className={`math-editor ${compact ? "compact" : ""}`}>
      <div className="math-editor-label">
        <label>{label || "Texte de la réponse"}</label>
      </div>
      <textarea
        required={label === "Question"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <div className="math-preview">
        <span>{compact ? "Aperçu" : "Aperçu instantané"}</span>
        <div>{value ? <MathText text={value} /> : "Le rendu apparaîtra ici."}</div>
      </div>
      {!compact && (
        <small>
          Le texte normal est conservé. Toute expression entre <code>$...$</code> ou <code>$$...$$</code> est automatiquement rendue en LaTeX.
        </small>
      )}
    </div>
  );
}

export default function Management() {
  const [active, setActive] = useState("schools");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState("");

  // Academic Data
  const [data, setData] = useState([]);
  const [exams, setExams] = useState([]);
  const [school, setSchool] = useState({ name: "", type: typeOptions[0].value, description: "" });
  const [subject, setSubject] = useState({ school_id: "", name: "", level: "" });
  const [qcm, setQcm] = useState({ subject_id: "", year: new Date().getFullYear(), title: "", duration_minutes: "", is_published: true });
  const [selectedExam, setSelectedExam] = useState("");
  const [question, setQuestion] = useState(makeQuestion);
  const [programme, setProgramme] = useState({ school_id: "", year: new Date().getFullYear(), label: "", document_url: "" });
  const [qcmEdit, setQcmEdit] = useState(null);

  // CPGE Courses Management State
  const [curriculum, setCurriculum] = useState(null);
  const [selectedYear, setSelectedYear] = useState("annee1");
  const [selectedBranchId, setSelectedBranchId] = useState("mpsi");
  const [courseChapterForm, setCourseChapterForm] = useState({
    id: "",
    n: 1,
    titre: "",
    cat: "algebre",
    badge: "",
    description: "",
    fiche_url: "",
    enonce_url: "",
    correction_url: "",
    video_url: "",
    video_duration: "",
  });
  const [courseBookForm, setCourseBookForm] = useState({
    titre: "",
    auteur: "",
    lien: "",
    cover: "",
  });
  const [editingChapterIdx, setEditingChapterIdx] = useState(null);
  const [editingBookIdx, setEditingBookIdx] = useState(null);

  // Passerelle Management State
  const [passerelleData, setPasserelleData] = useState(null);
  const [selectedPasserelleFiliereId, setSelectedPasserelleFiliereId] = useState("mp");
  const [passerelleChapForm, setPasserelleChapForm] = useState({
    id: "",
    titre: "",
    why: "",
    fiche: "",
  });
  const [editingPasserelleChapIdx, setEditingPasserelleChapIdx] = useState(null);
  const [passerelleItemForm, setPasserelleItemForm] = useState({
    id: "",
    titre: "",
    enonce: "",
    correction: "",
    video: "",
  });
  const [targetPasserelleChapIdx, setTargetPasserelleChapIdx] = useState(null);
  const [editingPasserelleItemIdx, setEditingPasserelleItemIdx] = useState(null);
  const [passerelleSeanceForm, setPasserelleSeanceForm] = useState({
    id: "",
    titre: "",
    video: "",
    support: "",
    sous: "",
  });
  const [editingPasserelleSeanceIdx, setEditingPasserelleSeanceIdx] = useState(null);
  const [passerelleBookForm, setPasserelleBookForm] = useState({
    titre: "",
    auteur: "",
    lien: "",
    cover: "",
  });
  const [editingPasserelleBookIdx, setEditingPasserelleBookIdx] = useState(null);

  const subjects = useMemo(() => data.flatMap((s) => s.subjects.map((sub) => ({ ...sub, school: s.name }))), [data]);
  const programmes = useMemo(() => data.flatMap((s) => (s.programmes || []).map((p) => ({ ...p, school: s.name }))), [data]);

  const currentBranch = useMemo(() => {
    if (!curriculum || !curriculum[selectedYear]) return null;
    const branches = curriculum[selectedYear].branches || [];
    return branches.find((b) => b.id === selectedBranchId) || branches[0] || null;
  }, [curriculum, selectedYear, selectedBranchId]);

  const currentPasserelleFiliere = useMemo(() => {
    if (!passerelleData || !Array.isArray(passerelleData.filieres)) return null;
    return passerelleData.filieres.find((f) => f.id === selectedPasserelleFiliereId) || passerelleData.filieres[0] || null;
  }, [passerelleData, selectedPasserelleFiliereId]);

  const refresh = async () => {
    const [s, e, c, p] = await Promise.all([
      schoolsApi.list().catch(() => []),
      examsApi.list().catch(() => []),
      coursesApi.getCurriculum().catch(() => null),
      passerelleApi.getData().catch(() => null),
    ]);
    setData(s);
    setExams(e);
    if (c) setCurriculum(c);
    if (p) setPasserelleData(p);
  };

  const notify = (text, type = "success") => setNotice({ text, type });

  useEffect(() => {
    refresh().catch((e) => notify(e.message, "error"));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const openModal = (name) => {
    setFormError("");
    setModal(name);
  };

  const submit = (api, state, reset) => async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await api(state);
      reset();
      setModal(null);
      notify("Ajouté avec succès.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openEdit = (api, id, name, label) => {
    setEditing({ api, id, label });
    setEditName(name);
    setFormError("");
    setModal("edit");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setFormError("");
    try {
      await editing.api(editing.id, { name: editName.trim() });
      setModal(null);
      setEditing(null);
      notify("Mis à jour.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const togglePublish = async (exam) => {
    try {
      await examsApi.update(exam.id, { is_published: !exam.is_published });
      notify(exam.is_published ? "QCM remis en brouillon." : "QCM publié pour les étudiants.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openQcmEdit = (exam) => {
    setQcmEdit({
      id: exam.id,
      year: exam.year || new Date().getFullYear(),
      title: exam.title || "",
      duration_minutes: exam.duration_minutes || "",
    });
    setFormError("");
    setModal("qcm-edit");
  };

  const saveQcmEdit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await examsApi.update(qcmEdit.id, {
        year: qcmEdit.year,
        title: qcmEdit.title,
        duration_minutes: qcmEdit.duration_minutes,
      });
      setModal(null);
      setQcmEdit(null);
      notify("QCM modifié.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await examsApi.addQuestion(selectedExam, question);
      setQuestion(makeQuestion());
      setModal(null);
      notify("Question ajoutée.");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const removeItem = async (api, id, confirmText) => {
    if (!window.confirm(confirmText)) return;
    try {
      await api(id);
      notify("Supprimé.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  /* ──────────────────────────────────────────────────────────
     CPGE Courses Handlers
  ────────────────────────────────────────────────────────── */
  const openCourseChapterModal = (chap = null, idx = null) => {
    setFormError("");
    setEditingChapterIdx(idx);
    if (chap) {
      setCourseChapterForm({
        id: chap.id || `${selectedBranchId}-${chap.n || idx + 1}`,
        n: chap.n || idx + 1,
        titre: chap.titre || "",
        cat: chap.cat || "algebre",
        badge: chap.badge || "",
        description: chap.description || "",
        fiche_url: chap.fiche_url || "",
        enonce_url: chap.enonce_url || "",
        correction_url: chap.correction_url || "",
        video_url: chap.video_url || "",
        video_duration: chap.video_duration || "",
      });
    } else {
      const nextNum = (currentBranch?.chapitres?.length || 0) + 1;
      setCourseChapterForm({
        id: `${selectedBranchId}-${nextNum}`,
        n: nextNum,
        titre: "",
        cat: "algebre",
        badge: "",
        description: "",
        fiche_url: "",
        enonce_url: "",
        correction_url: "",
        video_url: "",
        video_duration: "",
      });
    }
    setModal("course-chapter");
  };

  const saveCourseChapter = async (e) => {
    e.preventDefault();
    if (!currentBranch) return;
    setFormError("");

    try {
      const currentChapitres = [...(currentBranch.chapitres || [])];
      const newChapter = {
        ...courseChapterForm,
        n: Number(courseChapterForm.n) || 1,
        fiche_url: courseChapterForm.fiche_url.trim() || null,
        enonce_url: courseChapterForm.enonce_url.trim() || null,
        correction_url: courseChapterForm.correction_url.trim() || null,
        video_url: courseChapterForm.video_url.trim() || null,
      };

      if (editingChapterIdx !== null) {
        currentChapitres[editingChapterIdx] = newChapter;
      } else {
        currentChapitres.push(newChapter);
      }

      const updatedPayload = {
        ...currentBranch,
        chapitres: currentChapitres,
      };

      const updatedCurriculum = await coursesApi.saveBranch(selectedYear, currentBranch.id, updatedPayload);
      if (updatedCurriculum) setCurriculum(updatedCurriculum);
      setModal(null);
      notify("Chapitre enregistré dans Supabase avec succès.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const deleteCourseChapter = async (idx) => {
    if (!currentBranch || !window.confirm("Supprimer ce chapitre ?")) return;
    try {
      const currentChapitres = currentBranch.chapitres.filter((_, i) => i !== idx);
      const updatedPayload = { ...currentBranch, chapitres: currentChapitres };
      const updatedCurriculum = await coursesApi.saveBranch(selectedYear, currentBranch.id, updatedPayload);
      if (updatedCurriculum) setCurriculum(updatedCurriculum);
      notify("Chapitre supprimé.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openCourseBookModal = (book = null, idx = null) => {
    setFormError("");
    setEditingBookIdx(idx);
    if (book) {
      setCourseBookForm({
        titre: book.titre || "",
        auteur: book.auteur || "",
        lien: book.lien || "",
        cover: book.cover || "",
      });
    } else {
      setCourseBookForm({ titre: "", auteur: "", lien: "", cover: "" });
    }
    setModal("course-book");
  };

  const saveCourseBook = async (e) => {
    e.preventDefault();
    if (!currentBranch) return;
    setFormError("");

    try {
      const currentLivres = [...(currentBranch.livres || [])];
      const newBook = {
        titre: courseBookForm.titre.trim(),
        auteur: courseBookForm.auteur.trim(),
        lien: courseBookForm.lien.trim(),
        cover: courseBookForm.cover.trim() || null,
      };

      if (editingBookIdx !== null) {
        currentLivres[editingBookIdx] = newBook;
      } else {
        currentLivres.push(newBook);
      }

      const updatedPayload = { ...currentBranch, livres: currentLivres };
      const updatedCurriculum = await coursesApi.saveBranch(selectedYear, currentBranch.id, updatedPayload);
      if (updatedCurriculum) setCurriculum(updatedCurriculum);
      setModal(null);
      notify("Livre enregistré dans Supabase.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const deleteCourseBook = async (idx) => {
    if (!currentBranch || !window.confirm("Supprimer cet ouvrage recommandé ?")) return;
    try {
      const currentLivres = currentBranch.livres.filter((_, i) => i !== idx);
      const updatedPayload = { ...currentBranch, livres: currentLivres };
      const updatedCurriculum = await coursesApi.saveBranch(selectedYear, currentBranch.id, updatedPayload);
      if (updatedCurriculum) setCurriculum(updatedCurriculum);
      notify("Ouvrage supprimé.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  /* ──────────────────────────────────────────────────────────
     Passerelle Handlers
  ────────────────────────────────────────────────────────── */
  const openPasserelleChapModal = (chap = null, idx = null) => {
    setFormError("");
    setEditingPasserelleChapIdx(idx);
    if (chap) {
      setPasserelleChapForm({
        id: chap.id || `${selectedPasserelleFiliereId}-chap-${idx + 1}`,
        titre: chap.titre || "",
        why: chap.why || "",
        fiche: chap.fiche || "",
      });
    } else {
      const nextNum = (currentPasserelleFiliere?.chapitres?.length || 0) + 1;
      setPasserelleChapForm({
        id: `${selectedPasserelleFiliereId}-chap-${nextNum}`,
        titre: "",
        why: "",
        fiche: "",
      });
    }
    setModal("passerelle-chap");
  };

  const savePasserelleChap = async (e) => {
    e.preventDefault();
    if (!currentPasserelleFiliere) return;
    setFormError("");

    try {
      const currentChapitres = [...(currentPasserelleFiliere.chapitres || [])];
      if (editingPasserelleChapIdx !== null) {
        currentChapitres[editingPasserelleChapIdx] = {
          ...currentChapitres[editingPasserelleChapIdx],
          titre: passerelleChapForm.titre.trim(),
          why: passerelleChapForm.why.trim(),
          fiche: passerelleChapForm.fiche.trim() || null,
        };
      } else {
        currentChapitres.push({
          id: passerelleChapForm.id || `${selectedPasserelleFiliereId}-chap-${currentChapitres.length + 1}`,
          titre: passerelleChapForm.titre.trim(),
          why: passerelleChapForm.why.trim(),
          fiche: passerelleChapForm.fiche.trim() || null,
          items: [],
          seances: [],
        });
      }

      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      setModal(null);
      notify("Chapitre Passerelle enregistré dans Supabase.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const deletePasserelleChap = async (idx) => {
    if (!currentPasserelleFiliere || !window.confirm("Supprimer ce chapitre de transition ?")) return;
    try {
      const currentChapitres = currentPasserelleFiliere.chapitres.filter((_, i) => i !== idx);
      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      notify("Chapitre Passerelle supprimé.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openPasserelleItemModal = (chapIdx, item = null, itemIdx = null) => {
    setFormError("");
    setTargetPasserelleChapIdx(chapIdx);
    setEditingPasserelleItemIdx(itemIdx);
    if (item) {
      setPasserelleItemForm({
        id: item.id || `item-${Date.now()}`,
        titre: item.titre || "",
        enonce: item.enonce || "",
        correction: typeof item.correction === "string" ? item.correction : (item.correction?.[0]?.url || ""),
        video: item.video || "",
      });
    } else {
      setPasserelleItemForm({
        id: `item-${Date.now()}`,
        titre: "",
        enonce: "",
        correction: "",
        video: "",
      });
    }
    setModal("passerelle-item");
  };

  const savePasserelleItem = async (e) => {
    e.preventDefault();
    if (!currentPasserelleFiliere || targetPasserelleChapIdx === null) return;
    setFormError("");

    try {
      const currentChapitres = [...(currentPasserelleFiliere.chapitres || [])];
      const targetChap = { ...currentChapitres[targetPasserelleChapIdx] };
      const currentItems = [...(targetChap.items || [])];

      const newItem = {
        id: passerelleItemForm.id || `item-${Date.now()}`,
        titre: passerelleItemForm.titre.trim(),
        enonce: passerelleItemForm.enonce.trim() || null,
        correction: passerelleItemForm.correction.trim() || null,
        video: passerelleItemForm.video.trim() || null,
      };

      if (editingPasserelleItemIdx !== null) {
        currentItems[editingPasserelleItemIdx] = newItem;
      } else {
        currentItems.push(newItem);
      }

      targetChap.items = currentItems;
      currentChapitres[targetPasserelleChapIdx] = targetChap;

      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      setModal(null);
      notify("Exercice / Fiche enregistré(e).");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const deletePasserelleItem = async (chapIdx, itemIdx) => {
    if (!currentPasserelleFiliere || !window.confirm("Supprimer cette fiche / exercice ?")) return;
    try {
      const currentChapitres = [...currentPasserelleFiliere.chapitres];
      currentChapitres[chapIdx].items = currentChapitres[chapIdx].items.filter((_, i) => i !== itemIdx);
      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      notify("Élément supprimé.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const openPasserelleSeanceModal = (chapIdx, seance = null, seanceIdx = null) => {
    setFormError("");
    setTargetPasserelleChapIdx(chapIdx);
    setEditingPasserelleSeanceIdx(seanceIdx);
    if (seance) {
      setPasserelleSeanceForm({
        id: seance.id || `seance-${Date.now()}`,
        titre: seance.titre || "",
        video: seance.video || "",
        support: seance.support || "",
        sous: seance.sous || "",
      });
    } else {
      setPasserelleSeanceForm({
        id: `seance-${Date.now()}`,
        titre: "",
        video: "",
        support: "",
        sous: "",
      });
    }
    setModal("passerelle-seance");
  };

  const savePasserelleSeance = async (e) => {
    e.preventDefault();
    if (!currentPasserelleFiliere || targetPasserelleChapIdx === null) return;
    setFormError("");

    try {
      const currentChapitres = [...(currentPasserelleFiliere.chapitres || [])];
      const targetChap = { ...currentChapitres[targetPasserelleChapIdx] };
      const currentSeances = [...(targetChap.seances || [])];

      const newSeance = {
        id: passerelleSeanceForm.id || `seance-${Date.now()}`,
        titre: passerelleSeanceForm.titre.trim(),
        video: passerelleSeanceForm.video.trim() || null,
        support: passerelleSeanceForm.support.trim() || null,
        sous: passerelleSeanceForm.sous.trim() || null,
      };

      if (editingPasserelleSeanceIdx !== null) {
        currentSeances[editingPasserelleSeanceIdx] = newSeance;
      } else {
        currentSeances.push(newSeance);
      }

      targetChap.seances = currentSeances;
      currentChapitres[targetPasserelleChapIdx] = targetChap;

      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      setModal(null);
      notify("Séance Replay enregistrée.");
      await refresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const deletePasserelleSeance = async (chapIdx, seanceIdx) => {
    if (!currentPasserelleFiliere || !window.confirm("Supprimer cette séance replay ?")) return;
    try {
      const currentChapitres = [...currentPasserelleFiliere.chapitres];
      currentChapitres[chapIdx].seances = currentChapitres[chapIdx].seances.filter((_, i) => i !== seanceIdx);
      const updatedPayload = { ...currentPasserelleFiliere, chapitres: currentChapitres };
      const updatedData = await passerelleApi.saveFiliere(currentPasserelleFiliere.id, updatedPayload);
      if (updatedData) setPasserelleData(updatedData);
      notify("Séance supprimée.");
      await refresh();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  /* ──────────────────────────────────────────────────────────
     Modals Content
  ────────────────────────────────────────────────────────── */
  const modalContent =
    modal === "school" ? (
      <Modal title="Ajouter une école" onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={submit(schoolsApi.create, school, () => setSchool({ name: "", type: typeOptions[0].value, description: "" }))}>
          <label>Nom<input required value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} placeholder="ISCAE, ENSA Agadir…" /></label>
          <label>Type<select value={school.type} onChange={(e) => setSchool({ ...school, type: e.target.value })}>{typeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></label>
          <label>Description<textarea value={school.description} onChange={(e) => setSchool({ ...school, description: e.target.value })} /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Ajouter l’école</button>
        </form>
      </Modal>
    ) : modal === "subject" ? (
      <Modal title="Ajouter une matière" onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={submit(subjectsApi.create, subject, () => setSubject({ school_id: "", name: "", level: "" }))}>
          <label>École<select required value={subject.school_id} onChange={(e) => setSubject({ ...subject, school_id: e.target.value })}><option value="">Sélectionner</option>{data.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
          <label>Matière<input required value={subject.name} onChange={(e) => setSubject({ ...subject, name: e.target.value })} placeholder="Mathématiques" /></label>
          <label>Niveau<input value={subject.level} onChange={(e) => setSubject({ ...subject, level: e.target.value })} placeholder="Bac+2" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Ajouter la matière</button>
        </form>
      </Modal>
    ) : modal === "qcm" ? (
      <Modal title="Créer le QCM annuel" onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={submit(examsApi.create, qcm, () => setQcm({ subject_id: "", year: new Date().getFullYear(), title: "", duration_minutes: "", is_published: true }))}>
          <label>Matière<select required value={qcm.subject_id} onChange={(e) => setQcm({ ...qcm, subject_id: e.target.value })}><option value="">Sélectionner</option>{subjects.map((s) => (<option key={s.id} value={s.id}>{s.school} — {s.name}</option>))}</select></label>
          <div className="management-form-row">
            <label>Année<input required type="number" value={qcm.year} onChange={(e) => setQcm({ ...qcm, year: e.target.value })} /></label>
            <label>Durée<input type="number" value={qcm.duration_minutes} onChange={(e) => setQcm({ ...qcm, duration_minutes: e.target.value })} placeholder="Minutes" /></label>
          </div>
          <label>Titre (optionnel)<input value={qcm.title} onChange={(e) => setQcm({ ...qcm, title: e.target.value })} /></label>
          <label className="management-check"><input type="checkbox" checked={qcm.is_published} onChange={(e) => setQcm({ ...qcm, is_published: e.target.checked })} /><span>Publier immédiatement</span></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Créer le QCM</button>
        </form>
      </Modal>
    ) : modal === "question" ? (
      <Modal title="Créer une question mathématique" onClose={() => setModal(null)}>
        <form className="management-modal-form question-maker" onSubmit={addQuestion}>
          <div className="question-maker-intro">
            <strong>1. Rédigez votre énoncé</strong>
            <span>Utilisez les modèles et les boutons mathématiques : le rendu est vérifié avant l’enregistrement.</span>
          </div>
          <label>QCM<select required value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>{exams.map((e) => (<option key={e.id} value={e.id}>{e.title} · {e.year}</option>))}</select></label>
          <div className="question-templates">
            <span>Commencer avec :</span>
            {questionTemplates.map((template) => (
              <button type="button" key={template.label} onClick={() => setQuestion({ ...question, question_text: template.text })}>{template.label}</button>
            ))}
          </div>
          <MathEditor label="Question" value={question.question_text} onChange={(question_text) => setQuestion({ ...question, question_text })} placeholder="Écrivez votre question ou choisissez un modèle ci-dessus." />
          <div className="question-maker-heading">
            <div>
              <strong>2. Ajoutez les réponses</strong>
              <p>Sélectionnez la réponse correcte en cliquant sur son bouton radio.</p>
            </div>
            <div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuestion({ ...question, choices: [...question.choices, { choice_text: "", is_correct: false }] })}>+ Réponse</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuestion({ ...question, choices: [...question.choices, { choice_text: "Autre réponse", is_correct: false }] })}>+ Autre réponse</button>
            </div>
          </div>
          <div className="management-choices math-choices">
            {question.choices.map((c, i) => (
              <div className={`management-choice ${c.is_correct ? "correct" : ""}`} key={i}>
                <input aria-label={`Définir le choix ${String.fromCharCode(65 + i)} comme correct`} type="radio" name="correct" checked={c.is_correct} onChange={() => setQuestion({ ...question, choices: question.choices.map((item, idx) => ({ ...item, is_correct: idx === i })) })} />
                <span>{String.fromCharCode(65 + i)}</span>
                <div className="choice-editor">
                  <b>{c.is_correct ? "Bonne réponse" : `Choix ${String.fromCharCode(65 + i)}`}</b>
                  <MathEditor compact label="" value={c.choice_text} onChange={(choice_text) => { const choices = [...question.choices]; choices[i] = { ...c, choice_text }; setQuestion({ ...question, choices }); }} placeholder="Ex. $] -\infty;-1]\cup[4;+\infty[$" />
                </div>
                {question.choices.length > 2 && (
                  <button type="button" className="choice-remove" title="Supprimer cette réponse" onClick={() => { const choices = question.choices.filter((_, idx) => idx !== i); if (!choices.some((choice) => choice.is_correct)) choices[0].is_correct = true; setQuestion({ ...question, choices }); }}>×</button>
                )}
              </div>
            ))}
          </div>
          <div className="question-maker-heading">
            <div>
              <strong>3. Expliquez la correction</strong>
              <p>L’étudiant la voit après avoir répondu.</p>
            </div>
          </div>
          <MathEditor label="Correction" value={question.solution_text} onChange={(solution_text) => setQuestion({ ...question, solution_text })} placeholder="Ex. $x-1 \leq 0$ donc…" />
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> Enregistrer la question</button>
        </form>
      </Modal>
    ) : modal === "qcm-edit" && qcmEdit ? (
      <Modal title="Modifier le QCM" onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={saveQcmEdit}>
          <div className="management-form-row">
            <label>Année<input required type="number" value={qcmEdit.year} onChange={(e) => setQcmEdit({ ...qcmEdit, year: e.target.value })} /></label>
            <label>Durée (minutes)<input type="number" value={qcmEdit.duration_minutes} onChange={(e) => setQcmEdit({ ...qcmEdit, duration_minutes: e.target.value })} placeholder="Minutes" /></label>
          </div>
          <label>Titre<input value={qcmEdit.title} onChange={(e) => setQcmEdit({ ...qcmEdit, title: e.target.value })} /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Enregistrer les modifications</button>
        </form>
      </Modal>
    ) : modal === "programme" ? (
      <Modal title="Ajouter un document de programme" onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={submit(programmesApi.create, programme, () => setProgramme({ school_id: "", year: new Date().getFullYear(), label: "", document_url: "" }))}>
          <label>École<select required value={programme.school_id} onChange={(e) => setProgramme({ ...programme, school_id: e.target.value })}><option value="">Sélectionner</option>{data.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
          <label>Année<input required type="number" value={programme.year} onChange={(e) => setProgramme({ ...programme, year: e.target.value })} /></label>
          <label>Libellé (optionnel)<input value={programme.label} onChange={(e) => setProgramme({ ...programme, label: e.target.value })} placeholder="Ex. Partie 1, Français…" /></label>
          <label>Lien Google Drive<input required type="url" value={programme.document_url} onChange={(e) => setProgramme({ ...programme, document_url: e.target.value })} placeholder="https://drive.google.com/file/d/…/view" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Ajouter le document</button>
        </form>
      </Modal>
    ) : modal === "edit" && editing ? (
      <Modal title={`Modifier ${editing.label}`} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={saveEdit}>
          <label>Nouveau nom<input autoFocus required value={editName} onChange={(e) => setEditName(e.target.value)} /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary">Enregistrer les modifications</button>
        </form>
      </Modal>
    ) : modal === "course-chapter" ? (
      <Modal title={editingChapterIdx !== null ? "Modifier le chapitre CPGE" : "Ajouter un chapitre CPGE"} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={saveCourseChapter}>
          <div className="management-form-row">
            <label>Numéro d'ordre (N°)<input required type="number" value={courseChapterForm.n} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, n: e.target.value })} /></label>
            <label>Catégorie<select value={courseChapterForm.cat} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, cat: e.target.value })}>{categoryOptions.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}</select></label>
          </div>
          <label>Titre du chapitre<input required value={courseChapterForm.titre} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, titre: e.target.value })} placeholder="Ex. Espaces Vectoriels & Applications Linéaires" /></label>
          <div className="management-form-row">
            <label>Badge d'accroche (optionnel)<input value={courseChapterForm.badge} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, badge: e.target.value })} placeholder="Ex. Pilier Sup, Fondations" /></label>
            <label>Durée vidéo estimée<input value={courseChapterForm.video_duration} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, video_duration: e.target.value })} placeholder="Ex. 45 min" /></label>
          </div>
          <label>Description / Programme résumé<textarea value={courseChapterForm.description} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, description: e.target.value })} placeholder="Notions clés abordées dans ce chapitre..." /></label>
          <label>Lien Fiche de Résumé (PDF / Google Drive)<input type="url" value={courseChapterForm.fiche_url} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, fiche_url: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          <div className="management-form-row">
            <label>Lien Énoncé TD (PDF / Drive)<input type="url" value={courseChapterForm.enonce_url} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, enonce_url: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
            <label>Lien Corrigé TD (PDF / Drive)<input type="url" value={courseChapterForm.correction_url} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, correction_url: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          </div>
          <label>Lien Vidéo (YouTube / Replay Drive)<input type="url" value={courseChapterForm.video_url} onChange={(e) => setCourseChapterForm({ ...courseChapterForm, video_url: e.target.value })} placeholder="https://youtu.be/... ou lien Drive" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> {editingChapterIdx !== null ? "Enregistrer les modifications" : "Ajouter le chapitre"}</button>
        </form>
      </Modal>
    ) : modal === "course-book" ? (
      <Modal title={editingBookIdx !== null ? "Modifier l'ouvrage" : "Ajouter un ouvrage recommandé"} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={saveCourseBook}>
          <label>Titre de l'ouvrage<input required value={courseBookForm.titre} onChange={(e) => setCourseBookForm({ ...courseBookForm, titre: e.target.value })} placeholder="Ex. 100% Concours Prépas - Algèbre" /></label>
          <label>Auteur(s)<input value={courseBookForm.auteur} onChange={(e) => setCourseBookForm({ ...courseBookForm, auteur: e.target.value })} placeholder="Ex. Jean-Étienne Rombaldi" /></label>
          <label>Lien Google Drive / Téléchargement PDF<input required type="url" value={courseBookForm.lien} onChange={(e) => setCourseBookForm({ ...courseBookForm, lien: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          <label>Lien Image de Couverture (optionnel)<input type="url" value={courseBookForm.cover} onChange={(e) => setCourseBookForm({ ...courseBookForm, cover: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> {editingBookIdx !== null ? "Enregistrer" : "Ajouter l'ouvrage"}</button>
        </form>
      </Modal>
    ) : modal === "passerelle-chap" ? (
      <Modal title={editingPasserelleChapIdx !== null ? "Modifier le chapitre de transition" : "Ajouter un chapitre de transition"} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={savePasserelleChap}>
          <label>Titre du chapitre<input required value={passerelleChapForm.titre} onChange={(e) => setPasserelleChapForm({ ...passerelleChapForm, titre: e.target.value })} placeholder="Ex. Algèbre linéaire" /></label>
          <label>Pourquoi ce chapitre compte (explication pédagogique)<textarea value={passerelleChapForm.why} onChange={(e) => setPasserelleChapForm({ ...passerelleChapForm, why: e.target.value })} placeholder="Socle indispensable pour réussir la 2ème année..." /></label>
          <label>Lien Fiche de synthèse (PDF / Google Drive)<input type="url" value={passerelleChapForm.fiche} onChange={(e) => setPasserelleChapForm({ ...passerelleChapForm, fiche: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> Enregistrer le chapitre</button>
        </form>
      </Modal>
    ) : modal === "passerelle-item" ? (
      <Modal title={editingPasserelleItemIdx !== null ? "Modifier l'exercice / fiche" : "Ajouter un exercice / fiche"} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={savePasserelleItem}>
          <label>Titre de l'exercice / fiche<input required value={passerelleItemForm.titre} onChange={(e) => setPasserelleItemForm({ ...passerelleItemForm, titre: e.target.value })} placeholder="Ex. Fiche 1 de révision, Extrait CNC 2024..." /></label>
          <label>Lien Énoncé (PDF Drive)<input type="url" value={passerelleItemForm.enonce} onChange={(e) => setPasserelleItemForm({ ...passerelleItemForm, enonce: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          <label>Lien Corrigé (PDF Drive)<input type="url" value={passerelleItemForm.correction} onChange={(e) => setPasserelleItemForm({ ...passerelleItemForm, correction: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          <label>Lien Replay Vidéo (YouTube / Drive)<input type="url" value={passerelleItemForm.video} onChange={(e) => setPasserelleItemForm({ ...passerelleItemForm, video: e.target.value })} placeholder="https://youtu.be/... ou Drive" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> Enregistrer</button>
        </form>
      </Modal>
    ) : modal === "passerelle-seance" ? (
      <Modal title={editingPasserelleSeanceIdx !== null ? "Modifier la séance à distance" : "Ajouter une séance à distance"} onClose={() => setModal(null)}>
        <form className="management-modal-form" onSubmit={savePasserelleSeance}>
          <label>Titre de la séance<input required value={passerelleSeanceForm.titre} onChange={(e) => setPasserelleSeanceForm({ ...passerelleSeanceForm, titre: e.target.value })} placeholder="Ex. Séance 1 : Correction du problème d'analyse..." /></label>
          <label>Lien Support de cours / Tableau blanc (PDF Drive)<input type="url" value={passerelleSeanceForm.support} onChange={(e) => setPasserelleSeanceForm({ ...passerelleSeanceForm, support: e.target.value })} placeholder="https://drive.google.com/file/d/.../view" /></label>
          <label>Lien Enregistrement Vidéo (YouTube / Google Drive)<input type="url" value={passerelleSeanceForm.video} onChange={(e) => setPasserelleSeanceForm({ ...passerelleSeanceForm, video: e.target.value })} placeholder="https://youtu.be/... ou Drive" /></label>
          <label>Description / Sous-titre<input value={passerelleSeanceForm.sous} onChange={(e) => setPasserelleSeanceForm({ ...passerelleSeanceForm, sous: e.target.value })} placeholder="Ex. Théorie & Démonstrations interactives" /></label>
          {formError && <p className="error-msg"><AlertTriangle size={14} /> {formError}</p>}
          <button className="btn btn-primary"><Check size={15} /> Enregistrer la séance</button>
        </form>
      </Modal>
    ) : null;

  /* ──────────────────────────────────────────────────────────
     Render Main Content
  ────────────────────────────────────────────────────────── */
  const list =
    active === "schools" ? (
      <div className="management-list">
        {data.map((s) => (
          <article className="management-list-card" key={s.id}>
            <div className="list-icon">{s.icon || "🎓"}</div>
            <div>
              <h3>{s.name}</h3>
              <p>{s.description || "Aucune description"}</p>
              <small>{typeOptions.find((t) => t.value === s.type)?.label || s.type} · {s.subjects.length} matière(s)</small>
            </div>
            <div className="list-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(schoolsApi.update, s.id, s.name, "l’école")}>Modifier</button>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(schoolsApi.delete, s.id, `Supprimer "${s.name}" ? Ses matières seront aussi supprimées.`)}>Supprimer</button>
            </div>
          </article>
        ))}
        {data.length === 0 && <Empty text="Aucune école créée." />}
      </div>
    ) : active === "subjects" ? (
      <div className="management-list">
        {subjects.map((s) => (
          <article className="management-list-card" key={s.id}>
            <div className="list-icon"><BookOpen size={20} /></div>
            <div>
              <h3>{s.name}</h3>
              <p>{s.school}</p>
              <small>{s.level || "Niveau non défini"}</small>
            </div>
            <div className="list-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(subjectsApi.update, s.id, s.name, "la matière")}>Modifier</button>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(subjectsApi.delete, s.id, `Supprimer "${s.name}" ? Ses QCM perdront leur lien vers cette matière.`)}>Supprimer</button>
            </div>
          </article>
        ))}
        {subjects.length === 0 && <Empty text="Ajoutez d’abord une école, puis une matière." />}
      </div>
    ) : active === "qcms" ? (
      <div className="management-list">
        {exams.map((e) => (
          <article className="management-list-card qcm-card" key={e.id}>
            <Link className="qcm-card-main" to={`/management/qcm/${e.id}`}>
              <div className="list-icon"><ClipboardList size={20} /></div>
              <div>
                <h3>{e.title}</h3>
                <p>{e.subject_name || "Matière"} · {e.school_name || "École"}</p>
                <small>{e.year || "Année non définie"} {e.is_published ? "· Publié" : "· Brouillon"} {e.duration_minutes ? `· ${e.duration_minutes} min` : "· Durée non définie"}</small>
              </div>
            </Link>
            <div className="list-actions">
              <button className={`btn btn-sm ${e.is_published ? "btn-secondary" : "btn-primary"}`} onClick={() => togglePublish(e)}>{e.is_published ? "Dépublier" : "Publier"}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => openQcmEdit(e)}>Modifier</button>
              <Link className="btn btn-secondary btn-sm" to={`/management/qcm/${e.id}`}>Ouvrir l’éditeur →</Link>
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(examsApi.delete, e.id, `Supprimer le QCM "${e.title}" ? Cette action est irréversible.`)}>Supprimer</button>
            </div>
          </article>
        ))}
        {exams.length === 0 && <Empty text="Créez une matière puis son QCM annuel." />}
      </div>
    ) : active === "programmes" ? (
      <div className="management-list">
        {programmes.map((p) => (
          <article className="management-list-card" key={p.id}>
            <div className="list-icon"><FileText size={20} /></div>
            <div>
              <h3>{p.school} · {p.year}</h3>
              <p>{p.label || "Document de programme"}</p>
              <small><a href={p.document_url} target="_blank" rel="noreferrer">Ouvrir le lien ↗</a></small>
            </div>
            <div className="list-actions">
              <button className="btn btn-danger btn-sm" onClick={() => removeItem(programmesApi.delete, p.id, `Supprimer ce document (${p.year} · "${p.school}") ?`)}>Supprimer</button>
            </div>
          </article>
        ))}
        {programmes.length === 0 && <Empty text="Ajoutez le lien du programme (Google Drive) d’une école pour une année donnée." />}
      </div>
    ) : active === "courses" ? (
      <div style={{ display: "grid", gap: 20, marginTop: 18 }}>
        {/* Year and Branch Selectors */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={`btn btn-sm ${selectedYear === "annee1" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setSelectedYear("annee1");
                const first = curriculum?.annee1?.branches?.[0]?.id;
                if (first) setSelectedBranchId(first);
              }}
            >
              1ère Année (Sup)
            </button>
            <button
              className={`btn btn-sm ${selectedYear === "annee2" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => {
                setSelectedYear("annee2");
                const first = curriculum?.annee2?.branches?.[0]?.id;
                if (first) setSelectedBranchId(first);
              }}
            >
              2ème Année (Spé)
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(curriculum?.[selectedYear]?.branches || []).map((b) => (
              <button
                key={b.id}
                className={`btn btn-sm ${selectedBranchId === b.id ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setSelectedBranchId(b.id)}
              >
                {b.icon || "∑"} {b.nom}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Branch Details */}
        {currentBranch ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "14px 18px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{currentBranch.label || currentBranch.nom}</h3>
                <small style={{ color: "var(--text-muted)" }}>{currentBranch.badge || "Programme Officiel"} · {currentBranch.chapitres?.length || 0} chapitre(s) · {currentBranch.livres?.length || 0} livre(s)</small>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={() => openCourseChapterModal()}>
                  + Ajouter un chapitre
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => openCourseBookModal()}>
                  + Ajouter un livre
                </button>
              </div>
            </div>

            {/* Chapters list */}
            <div style={{ display: "grid", gap: 10 }}>
              <h4 style={{ margin: "8px 0 2px", color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Chapitres de la filière ({currentBranch.chapitres?.length || 0})
              </h4>
              {(currentBranch.chapitres || []).map((chap, idx) => (
                <article className="management-list-card" key={chap.id || idx}>
                  <div className="list-icon">{chap.n || idx + 1}</div>
                  <div>
                    <h3>{chap.titre}</h3>
                    <p style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ padding: "2px 8px", background: "var(--primary-light)", color: "var(--primary)", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700 }}>
                        {chap.cat || "Algèbre"}
                      </span>
                      {chap.badge && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>• {chap.badge}</span>}
                    </p>
                    <small style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                      {chap.fiche_url && <a href={chap.fiche_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>📄 Fiche PDF ↗</a>}
                      {chap.enonce_url && <a href={chap.enonce_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>📝 TD Énoncé ↗</a>}
                      {chap.correction_url && <a href={chap.correction_url} target="_blank" rel="noreferrer" style={{ color: "var(--success)" }}>✅ Corrigé ↗</a>}
                      {chap.video_url && <a href={chap.video_url} target="_blank" rel="noreferrer" style={{ color: "#ef4444" }}>🎬 Replay Vidéo ↗</a>}
                    </small>
                  </div>
                  <div className="list-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openCourseChapterModal(chap, idx)}>
                      Modifier
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteCourseChapter(idx)}>
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
              {(currentBranch.chapitres?.length || 0) === 0 && <Empty text="Aucun chapitre dans cette filière. Cliquez sur '+ Ajouter un chapitre'." />}
            </div>

            {/* Books list */}
            {(currentBranch.livres?.length || 0) > 0 && (
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <h4 style={{ margin: "8px 0 2px", color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ouvrages de référence recommandés ({currentBranch.livres.length})
                </h4>
                {currentBranch.livres.map((book, idx) => (
                  <article className="management-list-card" key={idx}>
                    <div className="list-icon">📚</div>
                    <div>
                      <h3>{book.titre}</h3>
                      <p>{book.auteur ? `Par ${book.auteur}` : "Ouvrage officiel"}</p>
                      <small><a href={book.lien} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>Ouvrir le livre PDF ↗</a></small>
                    </div>
                    <div className="list-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openCourseBookModal(book, idx)}>
                        Modifier
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCourseBook(idx)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Empty text="Sélectionnez une filière ci-dessus." />
        )}
      </div>
    ) : active === "passerelle" ? (
      <div style={{ display: "grid", gap: 20, marginTop: 18 }}>
        {/* Passerelle filières selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(passerelleData?.filieres || []).map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${selectedPasserelleFiliereId === f.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedPasserelleFiliereId(f.id)}
            >
              {f.icon || "∑"} {f.nom} ({f.de} ➔ {f.vers})
            </button>
          ))}
        </div>

        {currentPasserelleFiliere ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-2)", padding: "14px 18px", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Passerelle {currentPasserelleFiliere.nom} ({currentPasserelleFiliere.de} ➔ {currentPasserelleFiliere.vers})</h3>
                <small style={{ color: "var(--text-muted)" }}>{currentPasserelleFiliere.chapitres?.length || 0} chapitre(s) de transition</small>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => openPasserelleChapModal()}>
                + Ajouter un chapitre de transition
              </button>
            </div>

            {/* Chapters */}
            <div style={{ display: "grid", gap: 14 }}>
              {(currentPasserelleFiliere.chapitres || []).map((chap, cIdx) => (
                <div key={chap.id || cIdx} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", margin: "0 0 4px" }}>{cIdx + 1}. {chap.titre}</h3>
                      {chap.why && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 4px" }}>💡 {chap.why}</p>}
                      {chap.fiche && (
                        <small><a href={chap.fiche} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 700 }}>📄 Fiche de cours synthèse ↗</a></small>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openPasserelleItemModal(cIdx)}>
                        + Fiche / Exo
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openPasserelleSeanceModal(cIdx)}>
                        + Séance Replay
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openPasserelleChapModal(chap, cIdx)}>
                        Modifier
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deletePasserelleChap(cIdx)}>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Sub-items (Fiches / Exercices) */}
                  {(chap.items?.length || 0) > 0 && (
                    <div style={{ display: "grid", gap: 6, paddingLeft: 12, borderLeft: "2px solid var(--border)" }}>
                      <small style={{ fontWeight: 700, color: "var(--text-muted)" }}>Fiches d'exercices & Annales ({chap.items.length}) :</small>
                      {chap.items.map((it, itIdx) => (
                        <div key={it.id || itIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.85rem" }}>
                          <div>
                            <strong>{it.titre}</strong>
                            <div style={{ display: "flex", gap: 10, marginTop: 2, fontSize: "0.78rem" }}>
                              {it.enonce && <a href={it.enonce} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>Énoncé ↗</a>}
                              {it.correction && <a href={typeof it.correction === "string" ? it.correction : it.correction[0]?.url} target="_blank" rel="noreferrer" style={{ color: "var(--success)" }}>Corrigé ↗</a>}
                              {it.video && <a href={it.video} target="_blank" rel="noreferrer" style={{ color: "#ef4444" }}>Vidéo ↗</a>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: "3px 7px", fontSize: "0.75rem" }} onClick={() => openPasserelleItemModal(cIdx, it, itIdx)}>Modifier</button>
                            <button className="btn btn-danger btn-sm" style={{ padding: "3px 7px", fontSize: "0.75rem" }} onClick={() => deletePasserelleItem(cIdx, itIdx)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Replay Sessions */}
                  {(chap.seances?.length || 0) > 0 && (
                    <div style={{ display: "grid", gap: 6, paddingLeft: 12, borderLeft: "2px solid rgba(239, 68, 68, 0.4)" }}>
                      <small style={{ fontWeight: 700, color: "var(--text-muted)" }}>Séances interactives & Replays ({chap.seances.length}) :</small>
                      {chap.seances.map((s, sIdx) => (
                        <div key={s.id || sIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.85rem" }}>
                          <div>
                            <strong>🎬 {s.titre}</strong>
                            <div style={{ display: "flex", gap: 10, marginTop: 2, fontSize: "0.78rem" }}>
                              {s.support && <a href={s.support} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>Support PDF ↗</a>}
                              {s.video && <a href={s.video} target="_blank" rel="noreferrer" style={{ color: "#ef4444" }}>Replay Vidéo ↗</a>}
                              {s.sous && <span style={{ color: "var(--text-muted)" }}>• {s.sous}</span>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" style={{ padding: "3px 7px", fontSize: "0.75rem" }} onClick={() => openPasserelleSeanceModal(cIdx, s, sIdx)}>Modifier</button>
                            <button className="btn btn-danger btn-sm" style={{ padding: "3px 7px", fontSize: "0.75rem" }} onClick={() => deletePasserelleSeance(cIdx, sIdx)}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(currentPasserelleFiliere.chapitres?.length || 0) === 0 && <Empty text="Aucun chapitre de transition dans cette filière. Cliquez sur '+ Ajouter un chapitre de transition'." />}
            </div>
          </div>
        ) : (
          <Empty text="Sélectionnez une filière Passerelle ci-dessus." />
        )}
      </div>
    ) : null;

  const addLabel =
    active === "schools"
      ? "Ajouter une école"
      : active === "subjects"
      ? "Ajouter une matière"
      : active === "programmes"
      ? "Ajouter un programme"
      : active === "courses"
      ? "Ajouter un chapitre"
      : active === "passerelle"
      ? "Ajouter un chapitre"
      : "Créer un QCM";

  const modalName =
    active === "schools"
      ? "school"
      : active === "subjects"
      ? "subject"
      : active === "programmes"
      ? "programme"
      : active === "courses"
      ? "course-chapter"
      : active === "passerelle"
      ? "passerelle-chap"
      : "qcm";

  return (
    <main className="page management-page">
      <header className="management-hero">
        <div>
          <div className="section-label">⊙ ESPACE PROFESSEUR</div>
          <h1>Gestion académique & Cours</h1>
          <p>Gérez vos écoles, matières, QCMs, cours CPGE et chapitres Passerelle en temps réel.</p>
        </div>
      </header>

      {notice && (
        <div className={`management-notice ${notice.type === "error" ? "error" : ""}`}>
          {notice.text}
        </div>
      )}

      <div className="management-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={active === tab.id ? "active" : ""}
            onClick={() => setActive(tab.id)}
          >
            <span>
              <tab.Icon size={15} />
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <section className="management-panel">
        <div className="management-panel-head">
          <div>
            <h2>{tabs.find((tab) => tab.id === active).label}</h2>
            <p>Consultez, modifiez et enrichissez vos contenus pédagogiques.</p>
          </div>
          <button className="btn btn-primary" onClick={() => openModal(modalName)}>
            + {addLabel}
          </button>
        </div>
        {list}
      </section>

      {modalContent}
    </main>
  );
}
