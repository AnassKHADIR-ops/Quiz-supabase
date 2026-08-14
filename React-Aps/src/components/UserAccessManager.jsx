import { useEffect, useMemo, useState } from "react";
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
  Inbox
} from "./Icon.jsx";

export default function UserAccessManager({ onPendingCountChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "approved" | "rejected" | "revoked"
  const [actionId, setActionId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    try {
      setError("");
      const list = await usersApi.list();
      setUsers(list || []);
      const pending = (list || []).filter((u) => u.status === "pending").length;
      if (onPendingCountChange) onPendingCountChange(pending);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const notify = (text, type = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleApprove = async (user) => {
    setActionId(user.id);
    try {
      const res = await usersApi.approve(user.id);
      setUsers((prev) =>
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
      setUsers((prev) =>
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
      setUsers((prev) =>
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
      setUsers((prev) =>
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
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
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
  const approvedUsers = useMemo(() => users.filter((u) => u.status === "approved"), [users]);
  const rejectedUsers = useMemo(() => users.filter((u) => u.status === "rejected"), [users]);
  const revokedUsers = useMemo(() => users.filter((u) => u.status === "revoked"), [users]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchFilter = filter === "all" ? true : u.status === filter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));
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
          placeholder="Rechercher un utilisateur par nom ou email…"
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
          onClick={fetchUsers}
          title="Actualiser la liste"
          disabled={loading}
        >
          <RefreshCw size={14} />
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
            const initials = u.full_name
              ? u.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : u.email?.[0]?.toUpperCase() || "?";

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
                    </div>
                    <div className="user-item-email">{u.email}</div>
                    <div className="user-item-date" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Inscrit le {formatDate(u.created_at)}</span>
                      {u.approved_at && (
                        <span style={{ color: "var(--success)" }}>• Validé le {formatDate(u.approved_at)}</span>
                      )}
                      {u.revoked_at && (
                        <span style={{ color: "var(--danger)" }}>• Révoqué le {formatDate(u.revoked_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="user-item-actions">
                  {isBusy ? (
                    <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : isTeacher ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                      Compte principal
                    </span>
                  ) : isPending ? (
                    <>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
