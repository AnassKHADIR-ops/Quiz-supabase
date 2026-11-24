import { useEffect, useMemo, useState, useCallback } from "react";
import { usersApi } from "../api.js";
import {
  Users,
  UserCheck,
  UserX,
  UserMinus,
  Clock,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Trash,
  Inbox,
  Mail,
  KeyRound,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Phone
} from "./Icon.jsx";
import AdminEmailModal from "./AdminEmailModal.jsx";
import { WhatsAppIcon } from "./WhatsAppContactButton.jsx";
import { openGmailDirectly, EMAIL_TEMPLATES } from "../utils/emailTemplates.js";

const CACHE_KEY = "ak_cached_admin_users";

function formatWhatsAppPhone(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/[^0-9]/g, "");
  if (!digits) return "";
  // Convert Moroccan local format 06.../07... to 2126.../2127...
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "212" + digits.slice(1);
  }
  return digits;
}

function buildStudentWhatsAppUrl(phone, text) {
  const digits = formatWhatsAppPhone(phone);
  const encoded = encodeURIComponent(text);
  // If we have the student's phone, open their chat directly; otherwise open WhatsApp contact picker with prefilled text
  return digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

function getCachedUsers() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      sessionStorage.removeItem(CACHE_KEY);
      return [];
    }
    return parsed.filter((u) => u && typeof u === "object");
  } catch {
    try { sessionStorage.removeItem(CACHE_KEY); } catch {}
    return [];
  }
}

function setCachedUsers(list) {
  try {
    if (Array.isArray(list) && list.length > 0) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(list));
    }
  } catch {}
}

export default function UserAccessManager({ onPendingCountChange }) {
  const [users, setUsers] = useState(() => getCachedUsers());
  const [loading, setLoading] = useState(() => getCachedUsers().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "reset" | "approved" | "rejected" | "revoked"
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [emailModalUser, setEmailModalUser] = useState(null);
  const [emailTemplateId, setEmailTemplateId] = useState("adhesion");

  // Validation Rapide par Email (suite à un message WhatsApp reçu)
  const [quickEmail, setQuickEmail] = useState("");
  const [quickApproving, setQuickApproving] = useState(false);

  // Modale Gestion Mot de passe & Code WhatsApp
  const [passwordModal, setPasswordModal] = useState({
    user: null,
    tab: "code", // "code" | "direct"
    code: "",
    expiresAt: null,
    generatingCode: false,
    newPassword: "",
    showPassword: true,
    savingPassword: false,
    copied: false,
  });

  const [copiedUserId, setCopiedUserId] = useState(null);

  const updateUsersList = useCallback((updater) => {
    setUsers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setCachedUsers(next);
      return next;
    });
  }, []);

  const handleOpenEmailModal = (user, templateId = "adhesion") => {
    setEmailTemplateId(templateId);
    setEmailModalUser(user);
  };

  const handleDirectGmail = (user, templateId = "adhesion") => {
    const tpl = EMAIL_TEMPLATES[templateId] || EMAIL_TEMPLATES.adhesion;
    const name = user.full_name || "";
    openGmailDirectly({
      to: user.email,
      subject: tpl.getSubject(name),
      body: tpl.getBody(name),
    });
  };

  const fetchUsers = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setRefreshing(true);
      }
      setError("");
      const list = await usersApi.list();
      if (Array.isArray(list)) {
        updateUsersList(list);
        const pending = list.filter((u) => u.status === "pending").length;
        if (onPendingCountChange) onPendingCountChange(pending);
      }
    } catch (err) {
      // If we already have users from cache, do NOT blank out the screen!
      console.warn("[UserAccessManager] fetchUsers warning:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onPendingCountChange, updateUsersList]);

  useEffect(() => {
    let isMounted = true;
    fetchUsers(false).then(() => {
      if (isMounted && getCachedUsers().length === 0) {
        setTimeout(() => {
          if (isMounted) fetchUsers(false);
        }, 600);
      }
    });

    // Auto-refresh when Pr. Khadir returns from WhatsApp to the dashboard tab
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        fetchUsers(false);
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [fetchUsers]);

  const notify = (text, type = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Validation Rapide par Email (1 clic depuis un message WhatsApp)
  const handleQuickApproveByEmail = async (e) => {
    e.preventDefault();
    const clean = quickEmail.trim().toLowerCase();
    if (!clean) {
      notify("Veuillez saisir ou coller l'adresse e-mail de l'étudiant.", "error");
      return;
    }
    setQuickApproving(true);
    try {
      const approved = await usersApi.quickApproveByEmail(clean);
      notify(`Accès validé avec succès pour ${approved?.full_name || clean} !`);
      setQuickEmail("");
      await fetchUsers(false);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setQuickApproving(false);
    }
  };

  // Ouvrir la modale de réinitialisation de mot de passe pour un étudiant
  const handleOpenPasswordModal = (user) => {
    const suggestedPass = `Maths${Math.floor(1000 + Math.random() * 9000)}!`;
    setPasswordModal({
      user,
      tab: user.reset_code ? "code" : "code",
      code: user.reset_code || "",
      expiresAt: user.reset_expires_at || null,
      generatingCode: false,
      newPassword: suggestedPass,
      showPassword: true,
      savingPassword: false,
      copied: false,
    });
  };

  const handleClosePasswordModal = () => {
    setPasswordModal((prev) => ({ ...prev, user: null }));
  };

  const handleGenerateResetCode = async () => {
    if (!passwordModal.user) return;
    setPasswordModal((prev) => ({ ...prev, generatingCode: true }));
    try {
      const res = await usersApi.generateResetCode(passwordModal.user.id);
      setPasswordModal((prev) => ({
        ...prev,
        code: res.code,
        expiresAt: res.expires_at,
        generatingCode: false,
        copied: false,
      }));
      notify(`Nouveau code WhatsApp généré (${res.code}) pour ${passwordModal.user.full_name || passwordModal.user.email}.`);
      await fetchUsers(false);
    } catch (err) {
      setPasswordModal((prev) => ({ ...prev, generatingCode: false }));
      notify(err.message, "error");
    }
  };

  const handleCopyCode = async (code, userId = null) => {
    try {
      await navigator.clipboard.writeText(code);
      if (userId) {
        setCopiedUserId(userId);
        setTimeout(() => setCopiedUserId(null), 2000);
      } else {
        setPasswordModal((prev) => ({ ...prev, copied: true }));
        setTimeout(() => setPasswordModal((prev) => ({ ...prev, copied: false })), 2000);
      }
      notify(`Code ${code} copié dans le presse-papiers.`);
    } catch {
      notify(`Code : ${code}`);
    }
  };

  const handleSendResetCodeWhatsApp = (user, code) => {
    const studentName = user.full_name || "Étudiant(e)";
    const resetLink = `https://quiz.anasskhadir.com/login?forgot=1&email=${encodeURIComponent(user.email)}`;
    const text =
      `Bonjour ${studentName},\n\n` +
      `Voici votre code de validation sécurisé pour réinitialiser votre mot de passe sur la plateforme (quiz.anasskhadir.com) :\n\n` +
      `🔐 Code à 6 chiffres : ${code}\n` +
      `📧 Email : ${user.email}\n` +
      `⏳ Validité : 30 minutes (usage unique)\n\n` +
      `👉 Cliquez ici puis allez sur l'étape "2. J'ai reçu le code" :\n${resetLink}\n\n` +
      `Pr. Anass Khadir`;
    window.open(buildStudentWhatsAppUrl(user.phone, text), "_blank", "noopener,noreferrer");
  };

  const handleAdminSetPassword = async (sendOnWhatsApp = false) => {
    const target = passwordModal.user;
    const pass = passwordModal.newPassword.trim();
    if (!target) return;
    if (pass.length < 6) {
      notify("Le mot de passe doit comporter au moins 6 caractères.", "error");
      return;
    }
    setPasswordModal((prev) => ({ ...prev, savingPassword: true }));
    try {
      await usersApi.setPassword(target.id, pass);
      notify(`Nouveau mot de passe enregistré pour ${target.full_name || target.email} !`);
      if (sendOnWhatsApp) {
        const studentName = target.full_name || "Étudiant(e)";
        const text =
          `Bonjour ${studentName},\n\n` +
          `Votre mot de passe pour la plateforme de Mathématiques (quiz.anasskhadir.com) a été réinitialisé par Pr. Anass Khadir :\n\n` +
          `📧 Email : ${target.email}\n` +
          `🔑 Nouveau mot de passe : ${pass}\n` +
          `🌐 Connexion : https://quiz.anasskhadir.com/login\n\n` +
          `Bonne continuation dans vos révisions !`;
        window.open(buildStudentWhatsAppUrl(target.phone, text), "_blank", "noopener,noreferrer");
      }
      handleClosePasswordModal();
      await fetchUsers(false);
    } catch (err) {
      notify(err.message, "error");
      setPasswordModal((prev) => ({ ...prev, savingPassword: false }));
    }
  };

  const handleApprove = async (user) => {
    setActionId(user.id);
    try {
      const res = await usersApi.approve(user.id);
      updateUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: "approved", approved_at: res.approved_at || new Date().toISOString(), revoked_at: null }
            : u
        )
      );
      notify(`Accès validé avec succès pour ${user.full_name || user.email}.`);
      if (onPendingCountChange) {
        const count = users.filter((u) => u.id !== user.id && u.status === "pending").length;
        onPendingCountChange(count);
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (user) => {
    if (!window.confirm(`Refuser la demande d'accès de "${user.full_name || user.email}" ?`)) return;
    setActionId(user.id);
    try {
      await usersApi.reject(user.id);
      updateUsersList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: "rejected" } : u))
      );
      notify(`Demande d'accès refusée pour ${user.full_name || user.email}.`, "warning");
      if (onPendingCountChange) {
        const count = users.filter((u) => u.id !== user.id && u.status === "pending").length;
        onPendingCountChange(count);
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRevoke = async (user) => {
    if (
      !window.confirm(
        `Révoquer immédiatement l'accès de "${user.full_name || user.email}" ? L'utilisateur perdra immédiatement l'accès à la plateforme privée.`
      )
    )
      return;
    setActionId(user.id);
    try {
      const res = await usersApi.revoke(user.id);
      updateUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: "revoked", revoked_at: res.revoked_at || new Date().toISOString() }
            : u
        )
      );
      notify(`Accès révoqué pour ${user.full_name || user.email}.`, "warning");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRestore = async (user) => {
    setActionId(user.id);
    try {
      const res = await usersApi.restore(user.id);
      updateUsersList((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: "approved", approved_at: res.approved_at || new Date().toISOString(), revoked_at: null }
            : u
        )
      );
      notify(`Accès rétabli avec succès pour ${user.full_name || user.email}.`);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (user) => {
    if (
      !window.confirm(
        `Supprimer définitivement le compte de "${user.full_name || user.email}" ? Cette action est irréversible.`
      )
    )
      return;
    setActionId(user.id);
    try {
      await usersApi.deleteAccess(user.id);
      updateUsersList((prev) => prev.filter((u) => u.id !== user.id));
      notify(`Compte de ${user.full_name || user.email} supprimé.`);
      if (onPendingCountChange) {
        const count = users.filter((u) => u.id !== user.id && u.status === "pending").length;
        onPendingCountChange(count);
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setActionId(null);
    }
  };

  // Counts
  const pendingUsers = useMemo(() => users.filter((u) => u.status === "pending"), [users]);
  const resetUsers = useMemo(() => users.filter((u) => Boolean(u.reset_code)), [users]);
  const approvedUsers = useMemo(() => users.filter((u) => u.status === "approved"), [users]);
  const rejectedUsers = useMemo(() => users.filter((u) => u.status === "rejected"), [users]);
  const revokedUsers = useMemo(() => users.filter((u) => u.status === "revoked"), [users]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchFilter =
        filter === "all"
          ? true
          : filter === "reset"
          ? Boolean(u.reset_code)
          : u.status === filter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        String(u.full_name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phone || "").toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [users, filter, search]);

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="user-access-manager">
      {feedback && (
        <div
          className={`management-notice ${feedback.type === "error" ? "error" : feedback.type === "warning" ? "warning" : ""}`}
          style={{
            marginBottom: 16,
            background: feedback.type === "error" ? "var(--danger-light)" : feedback.type === "warning" ? "var(--warning-light)" : "var(--success-light)",
            borderColor: feedback.type === "error" ? "var(--danger)" : feedback.type === "warning" ? "var(--warning)" : "var(--success)",
            color: feedback.type === "error" ? "var(--danger)" : feedback.type === "warning" ? "var(--warning-dark, #b45309)" : "var(--success)",
          }}
        >
          {feedback.text}
        </div>
      )}

      {error && <p className="error-msg"><AlertTriangle size={15} /> {error}</p>}

      {/* Validation Rapide par Email (WhatsApp) — 1 clic même pour anciens étudiants / comptes orphelins */}
      <form
        onSubmit={handleQuickApproveByEmail}
        style={{
          marginBottom: 18,
          padding: "14px 16px",
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 126, 0.06) 100%)",
          border: "1px solid rgba(37, 211, 102, 0.35)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 220, flex: "1 1 260px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <WhatsAppIcon size={19} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "var(--text)" }}>
              Validation Rapide par E-mail (WhatsApp)
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: 1.35 }}>
              Collez l'e-mail d'un étudiant (nouveau ou ancien) pour activer son accès en 1 clic
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 300px", maxWidth: 460 }}>
          <input
            type="email"
            placeholder="ex: anas.elmerkhi@gmail.com"
            value={quickEmail}
            onChange={(e) => setQuickEmail(e.target.value)}
            required
            style={{
              flex: 1,
              minWidth: 180,
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "0.85rem",
            }}
          />
          <button
            type="submit"
            disabled={quickApproving}
            className="btn btn-success btn-sm"
            style={{ padding: "9px 14px", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {quickApproving ? (
              <>
                <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2, borderTopColor: "white" }} />
                Validation…
              </>
            ) : (
              <>
                <Check size={14} /> Valider l'accès
              </>
            )}
          </button>
        </div>
      </form>

      {/* Summary Cards */}
      <div className="user-mgmt-stats">
        <div className="user-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("pending")}>
          <div className="user-stat-icon pending">
            <Clock size={22} />
          </div>
          <div className="user-stat-info">
            <div className="stat-num">{pendingUsers.length}</div>
            <div className="stat-title">En attente</div>
          </div>
        </div>

        <div className="user-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("approved")}>
          <div className="user-stat-icon approved">
            <UserCheck size={22} />
          </div>
          <div className="user-stat-info">
            <div className="stat-num">{approvedUsers.length}</div>
            <div className="stat-title">Autorisés</div>
          </div>
        </div>

        <div className="user-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("rejected")}>
          <div className="user-stat-icon rejected">
            <UserX size={22} />
          </div>
          <div className="user-stat-info">
            <div className="stat-num">{rejectedUsers.length}</div>
            <div className="stat-title">Refusés</div>
          </div>
        </div>

        <div className="user-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("revoked")}>
          <div className="user-stat-icon" style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)" }}>
            <ShieldAlert size={22} />
          </div>
          <div className="user-stat-info">
            <div className="stat-num">{revokedUsers.length}</div>
            <div className="stat-title">Révoqués</div>
          </div>
        </div>

        <div className="user-stat-card" style={{ cursor: "pointer" }} onClick={() => setFilter("all")}>
          <div className="user-stat-icon total">
            <Users size={22} />
          </div>
          <div className="user-stat-info">
            <div className="stat-num">{users.length}</div>
            <div className="stat-title">Total Inscrits</div>
          </div>
        </div>
      </div>

      {/* Banner for active WhatsApp Password Reset requests */}
      {resetUsers.length > 0 && filter !== "reset" && (
        <div
          className="pending-banner"
          style={{
            marginBottom: 12,
            background: "rgba(124, 58, 237, 0.08)",
            borderColor: "rgba(124, 58, 237, 0.35)",
          }}
        >
          <div className="pending-banner-text">
            <KeyRound size={20} style={{ color: "#7c3aed" }} />
            <div>
              <strong>
                {resetUsers.length} demande{resetUsers.length > 1 ? "s" : ""} de réinitialisation de mot de passe active{resetUsers.length > 1 ? "s" : ""}
              </strong>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                Un code à 6 chiffres attend d'être transmis par WhatsApp après vérification de l'identité de l'étudiant.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFilter("reset")}
            style={{ background: "#7c3aed", borderColor: "#7c3aed" }}
          >
            Voir les codes ({resetUsers.length}) →
          </button>
        </div>
      )}

      {/* Banner for pending requests */}
      {pendingUsers.length > 0 && filter !== "pending" && (
        <div className="pending-banner">
          <div className="pending-banner-text">
            <Clock size={20} style={{ color: "var(--warning)" }} />
            <div>
              <strong>{pendingUsers.length} demande{pendingUsers.length > 1 ? "s" : ""} d'inscription en attente</strong>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 2 }}>
                Des personnes attendent votre approbation pour accéder à la plateforme privée.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFilter("pending")}
          >
            Examiner les demandes ({pendingUsers.length}) →
          </button>
        </div>
      )}

      {/* Search Bar + Filter Pills */}
      <div className="user-search-bar">
        <input
          type="text"
          className="user-search-input"
          placeholder="Rechercher un utilisateur par nom, email ou téléphone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="user-filter-pills">
          <button
            className={`user-filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tous <span className="pill-count">{users.length}</span>
          </button>
          <button
            className={`user-filter-pill ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            En attente <span className="pill-count">{pendingUsers.length}</span>
          </button>
          {resetUsers.length > 0 && (
            <button
              className={`user-filter-pill ${filter === "reset" ? "active" : ""}`}
              onClick={() => setFilter("reset")}
              style={filter === "reset" ? { background: "#7c3aed", borderColor: "#7c3aed", color: "#fff" } : { borderColor: "rgba(124,58,237,0.4)", color: "#7c3aed" }}
            >
              Mots de passe <span className="pill-count">{resetUsers.length}</span>
            </button>
          )}
          <button
            className={`user-filter-pill ${filter === "approved" ? "active" : ""}`}
            onClick={() => setFilter("approved")}
          >
            Autorisés <span className="pill-count">{approvedUsers.length}</span>
          </button>
          <button
            className={`user-filter-pill ${filter === "rejected" ? "active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Refusés <span className="pill-count">{rejectedUsers.length}</span>
          </button>
          <button
            className={`user-filter-pill ${filter === "revoked" ? "active" : ""}`}
            onClick={() => setFilter("revoked")}
          >
            Révoqués <span className="pill-count">{revokedUsers.length}</span>
          </button>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => fetchUsers(true)}
          title="Actualiser et synchroniser la liste avec Supabase"
          disabled={loading || refreshing}
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <RefreshCw size={14} className={refreshing ? "spin-animate" : ""} />
          <span>Sync</span>
        </button>
      </div>

      {/* User list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state" style={{ padding: "48px 16px" }}>
          <Inbox size={38} className="empty-state-icon" style={{ color: "var(--text-faint)" }} />
          <h3>Aucun utilisateur trouvé</h3>
          <p>
            {search
              ? "Aucun résultat ne correspond à votre recherche."
              : filter === "pending"
              ? "Aucune demande d'inscription en attente."
              : filter === "approved"
              ? "Aucun utilisateur autorisé pour le moment."
              : filter === "rejected"
              ? "Aucune demande refusée."
              : filter === "revoked"
              ? "Aucun accès révoqué."
              : "Aucun utilisateur dans cette catégorie."}
          </p>
        </div>
      ) : (
        <div className="user-cards-grid">
          {filteredUsers.map((u) => {
            const isPending = u.status === "pending";
            const isApproved = u.status === "approved";
            const isRejected = u.status === "rejected";
            const isRevoked = u.status === "revoked";
            const isTeacher = u.role === "teacher" || u.role === "admin";
            const isBusy = actionId === u.id;
            const fullNameStr = typeof u.full_name === "string" ? u.full_name.trim() : "";
            const emailStr = typeof u.email === "string" ? u.email : "";
            const initials = fullNameStr
              ? fullNameStr
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : emailStr?.[0]?.toUpperCase() || "?";

            return (
              <div
                key={u.id}
                className={`user-item-card ${isPending ? "pending-highlight" : ""}`}
              >
                <div className="user-item-meta">
                  <div
                    className="user-avatar-lg"
                    style={{
                      background: isTeacher
                        ? "linear-gradient(135deg, var(--primary), #7c3aed)"
                        : isApproved
                        ? "var(--success-light)"
                        : isPending
                        ? "var(--warning-light)"
                        : "var(--danger-light)",
                      color: isTeacher
                        ? "white"
                        : isApproved
                        ? "var(--success)"
                        : isPending
                        ? "var(--warning)"
                        : "var(--danger)",
                    }}
                  >
                    {initials}
                  </div>
                  <div className="user-item-details">
                    <div className="user-item-name">
                      <span>{u.full_name || "Utilisateur sans nom"}</span>
                      {isTeacher && (
                        <span className="badge" style={{ background: "var(--primary)", color: "white", fontSize: "0.68rem" }}>
                          Professeur / Admin
                        </span>
                      )}
                      {isPending && (
                        <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}>
                          En attente d'approbation
                        </span>
                      )}
                      {isApproved && !isTeacher && (
                        <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                          Accès autorisé
                        </span>
                      )}
                      {isRejected && (
                        <span className="badge badge-danger" style={{ fontSize: "0.68rem" }}>
                          Demande refusée
                        </span>
                      )}
                      {isRevoked && (
                        <span className="badge badge-danger" style={{ fontSize: "0.68rem" }}>
                          Accès révoqué
                        </span>
                      )}
                      {u.reset_code && !isTeacher && (
                        <span
                          className="badge"
                          style={{
                            background: "rgba(124, 58, 237, 0.14)",
                            color: "#7c3aed",
                            border: "1px solid rgba(124, 58, 237, 0.35)",
                            fontSize: "0.68rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                          }}
                        >
                          🔐 Reset MDP demandé
                        </span>
                      )}
                    </div>
                    <div className="user-item-email" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span>{u.email}</span>
                      {u.phone && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                          <Phone size={11} /> {u.phone}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectGmail(u, isPending ? "adhesion" : isRevoked ? "reactivation" : "adhesion");
                        }}
                        title={`Ouvrir directement Gmail avec l'offre 500 DH/an pour ${u.email}`}
                        style={{
                          background: "rgba(234, 67, 53, 0.08)",
                          color: "#ea4335",
                          border: "1px solid rgba(234, 67, 53, 0.25)",
                          borderRadius: "4px",
                          padding: "2px 7px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: "inherit",
                        }}
                      >
                        <Mail size={11} /> 1-clic Gmail
                      </button>
                    </div>
                    <div className="user-item-date" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Inscrit le {formatDate(u.created_at)}</span>
                      {u.approved_at && (
                        <span style={{ color: "var(--success)" }}>• Validé le {formatDate(u.approved_at)}</span>
                      )}
                      {u.revoked_at && (
                        <span style={{ color: "var(--danger)" }}>• Révoqué le {formatDate(u.revoked_at)}</span>
                      )}
                    </div>

                    {/* Encadré Code de réinitialisation WhatsApp actif */}
                    {u.reset_code && !isTeacher && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: "rgba(124, 58, 237, 0.08)",
                          border: "1px solid rgba(124, 58, 237, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <KeyRound size={14} style={{ color: "#7c3aed", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", color: "var(--text)" }}>
                          Code WhatsApp :{" "}
                          <strong
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "0.92rem",
                              letterSpacing: "0.14em",
                              color: "#7c3aed",
                            }}
                          >
                            {u.reset_code}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(u.reset_code, u.id)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "1px solid rgba(124, 58, 237, 0.35)",
                            background: "var(--surface)",
                            color: "var(--text)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {copiedUserId === u.id ? <Check size={11} /> : <Copy size={11} />}
                          {copiedUserId === u.id ? "Copié" : "Copier"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendResetCodeWhatsApp(u, u.reset_code)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "none",
                            background: "linear-gradient(135deg, #25D366, #128C7E)",
                            color: "#fff",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <WhatsAppIcon size={12} /> Envoyer code sur WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="user-item-actions">
                  {isBusy ? (
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : isTeacher ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Compte principal
                    </span>
                  ) : (
                    <>
                      {/* Bouton Mot de passe disponible pour TOUS les étudiants */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenPasswordModal(u)}
                        title="Générer un code WhatsApp ou réinitialiser le mot de passe de cet étudiant"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          borderColor: u.reset_code ? "#7c3aed" : undefined,
                          color: u.reset_code ? "#7c3aed" : undefined,
                        }}
                      >
                        <KeyRound size={13} /> Mot de passe
                      </button>

                      {isPending ? (
                        <>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleOpenEmailModal(u, "adhesion")}
                            title="Envoyer une proposition d'adhésion (500 DH/an) par Gmail"
                            style={{
                              background: "linear-gradient(135deg, #ea4335, #d93025)",
                              color: "#fff",
                              borderColor: "#d93025",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              boxShadow: "0 2px 8px rgba(234, 67, 53, 0.25)",
                            }}
                          >
                            <Mail size={14} /> Contacter (Gmail)
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(u)}
                            title="Accepter l'inscription et donner accès"
                          >
                            <UserCheck size={14} /> Approuver
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(u)}
                            title="Refuser cette demande"
                          >
                            <UserX size={14} /> Refuser
                          </button>
                        </>
                      ) : isApproved ? (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEmailModal(u, "adhesion")}
                            title="Envoyer un email via Gmail"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <Mail size={13} /> Email
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRevoke(u)}
                            title="Révoquer immédiatement l'accès"
                          >
                            <UserMinus size={14} /> Révoquer l'accès
                          </button>
                        </>
                      ) : isRevoked ? (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEmailModal(u, "reactivation")}
                            title="Proposer la réactivation pour 500 DH/an via Gmail"
                            style={{ borderColor: "#ea4335", color: "#ea4335", display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <Mail size={13} /> Relancer (Gmail)
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleRestore(u)}
                            title="Rétablir l'accès de cet utilisateur"
                          >
                            <RotateCcw size={14} /> Rétablir l'accès
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(u)}
                            title="Supprimer définitivement"
                            style={{ color: "var(--danger)" }}
                          >
                            <Trash size={14} /> Supprimer
                          </button>
                        </>
                      ) : (
                        /* isRejected */
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEmailModal(u, "adhesion")}
                            title="Envoyer un email d'information ou d'adhésion"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                          >
                            <Mail size={13} /> Contacter
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(u)}
                            title="Réexaminer et approuver l'accès"
                          >
                            <UserCheck size={14} /> Approuver
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDelete(u)}
                            title="Supprimer définitivement"
                            style={{ color: "var(--danger)" }}
                          >
                            <Trash size={14} /> Supprimer
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de Gestion & Réinitialisation Sécurisée du Mot de Passe (WhatsApp) */}
      {passwordModal.user && (
        <div
          className="modal-backdrop"
          onMouseDown={handleClosePasswordModal}
          style={{ zIndex: 1200, padding: "16px 12px", overflowY: "auto" }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              width: "min(94vw, 480px)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              overflow: "hidden",
              margin: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 20px",
                background: "linear-gradient(135deg, #4361ee 0%, #7c3aed 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.2)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.02rem", fontWeight: 800, color: "white" }}>
                    Réinitialisation Mot de passe
                  </h3>
                  <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                    {passwordModal.user.full_name || "Étudiant"} · {passwordModal.user.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 20 }}>
              {/* Sélecteur d'option */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  padding: 4,
                  background: "var(--surface-2)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPasswordModal((p) => ({ ...p, tab: "code" }))}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: passwordModal.tab === "code" ? "var(--primary)" : "transparent",
                    color: passwordModal.tab === "code" ? "white" : "var(--text-muted)",
                  }}
                >
                  🔐 Code WhatsApp (6 chiffres)
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordModal((p) => ({ ...p, tab: "direct" }))}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: passwordModal.tab === "direct" ? "var(--primary)" : "transparent",
                    color: passwordModal.tab === "direct" ? "white" : "var(--text-muted)",
                  }}
                >
                  🔑 Nouveau MDP direct
                </button>
              </div>

              {passwordModal.tab === "code" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Générez un <strong>code à usage unique (30 min)</strong> et envoyez-le sur WhatsApp à l'étudiant. Il choisira lui-même son nouveau mot de passe en toute sécurité.
                  </p>

                  {passwordModal.code ? (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "var(--surface-2)",
                        border: "1px dashed rgba(124, 58, 237, 0.5)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Code de validation actif
                      </div>
                      <div
                        style={{
                          fontSize: "2rem",
                          fontWeight: 900,
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: "0.28em",
                          color: "#7c3aed",
                          margin: "8px 0",
                        }}
                      >
                        {passwordModal.code}
                      </div>
                      {passwordModal.expiresAt && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Expire le {formatDate(passwordModal.expiresAt)}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyCode(passwordModal.code)}
                          style={{ flex: 1, justifyContent: "center", gap: 6 }}
                        >
                          {passwordModal.copied ? <Check size={14} /> : <Copy size={14} />}
                          {passwordModal.copied ? "Copié !" : "Copier le code"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendResetCodeWhatsApp(passwordModal.user, passwordModal.code)}
                          style={{
                            flex: 1.4,
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "linear-gradient(135deg, #25D366, #128C7E)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          <WhatsAppIcon size={15} /> Envoyer sur WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        textAlign: "center",
                        fontSize: "0.84rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Aucun code actif actuellement pour cet étudiant.
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGenerateResetCode}
                    disabled={passwordModal.generatingCode}
                    style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                  >
                    {passwordModal.generatingCode ? (
                      <>
                        <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2, borderTopColor: "white" }} />
                        Génération…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={15} /> {passwordModal.code ? "Générer un nouveau code" : "Générer un code à 6 chiffres"}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Définissez directement un mot de passe temporaire (min. 6 caractères) dans Supabase Auth et envoyez-le à l'étudiant sur WhatsApp.
                  </p>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: 6 }}>
                      Nouveau mot de passe
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={passwordModal.showPassword ? "text" : "password"}
                        value={passwordModal.newPassword}
                        onChange={(e) => setPasswordModal((p) => ({ ...p, newPassword: e.target.value }))}
                        minLength={6}
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 12px",
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--surface-2)",
                          color: "var(--text)",
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordModal((p) => ({ ...p, showPassword: !p.showPassword }))}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                      >
                        {passwordModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      type="button"
                      disabled={passwordModal.savingPassword}
                      onClick={() => handleAdminSetPassword(true)}
                      style={{
                        width: "100%",
                        padding: "11px 16px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #25D366, #128C7E)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <WhatsAppIcon size={17} />
                      {passwordModal.savingPassword ? "Enregistrement…" : "Enregistrer & Envoyer sur WhatsApp"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={passwordModal.savingPassword}
                      onClick={() => handleAdminSetPassword(false)}
                      style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
                    >
                      Enregistrer sans ouvrir WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale d'envoi d'email Gmail pour l'administrateur */}
      <AdminEmailModal
        isOpen={Boolean(emailModalUser)}
        onClose={() => setEmailModalUser(null)}
        recipient={emailModalUser}
        initialTemplateId={emailTemplateId}
      />
    </div>
  );
}
