import { supabase } from "./lib/supabase.js";

function message(error) {
  if (!error) return "Une erreur est survenue. Réessayez.";
  const msg = error.message || error.error_description || String(error);
  
  if (msg.includes("User already registered") || msg.includes("already exists")) {
    return "Cette adresse e-mail est déjà associée à un compte.";
  }
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }
  if (msg.includes("Password should be at least")) {
    return "Le mot de passe doit comporter au moins 6 caractères.";
  }
  return msg;
}

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(message(error));
  return data;
}

// In-flight profile request cache to deduplicate concurrent calls
let inFlightMePromise = null;

// Auth
export const authApi = {
  async register(name, email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: cleanName } },
    });
    if (error) throw new Error(message(error));
    if (!data.session) {
      throw new Error("Votre inscription a été enregistrée. Elle est en attente d'approbation par l'administrateur.");
    }
    return authApi.me();
  },
  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw new Error(message(error));
    return authApi.fetchProfileForUser(data.user);
  },
  async fetchProfileForUser(supabaseUser) {
    if (!supabaseUser) throw new Error("Session expirée. Connectez-vous de nouveau.");

    // Query profiles with maybeSingle() to prevent unhandled rejection on race conditions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, approved_at, revoked_at, created_at, updated_at")
      .eq("id", supabaseUser.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Profiles fetch warning:", profileError.message);
    }

    const resolvedUser = {
      id: supabaseUser.id,
      name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split("@")[0] || "Étudiant",
      email: profile?.email || supabaseUser.email,
      role: profile?.role || "student",
      status: profile?.status || "pending",
      approved_at: profile?.approved_at || null,
      revoked_at: profile?.revoked_at || null,
      created_at: profile?.created_at || supabaseUser.created_at,
      updated_at: profile?.updated_at || supabaseUser.updated_at,
    };

    return { user: resolvedUser };
  },
  async me() {
    if (inFlightMePromise) {
      return inFlightMePromise;
    }

    inFlightMePromise = (async () => {
      try {
        // Fast local session check first (reads local JWT without extra network round-trip)
        const { data: { session } } = await supabase.auth.getSession();
        let targetUser = session?.user;

        if (!targetUser) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) throw new Error("Session expirée. Connectez-vous de nouveau.");
          targetUser = user;
        }

        return await authApi.fetchProfileForUser(targetUser);
      } finally {
        inFlightMePromise = null;
      }
    })();

    return inFlightMePromise;
  },
  logout: () => {
    inFlightMePromise = null;
    return supabase.auth.signOut();
  },
};

// Users & Access Management (Admin/Teacher)
export const usersApi = {
  list: () => rpc("get_users_list"),
  approve: (userId) => rpc("approve_user", { p_user_id: userId }),
  reject: (userId) => rpc("reject_user", { p_user_id: userId }),
  revoke: (userId) => rpc("revoke_user", { p_user_id: userId }),
  restore: (userId) => rpc("restore_user", { p_user_id: userId }),
  deleteAccess: (userId) => rpc("delete_user_access", { p_user_id: userId }),
};

// Exams
export const examsApi = {
  list: () => rpc("get_exams"),
  get: (examId) => rpc("get_exam_for_view", { p_exam_id: examId }),
  create: (payload) => rpc("create_exam", { p_payload: payload }),
  update: (examId, payload) => rpc("update_exam", { p_exam_id: examId, p_payload: payload }),
  delete: (examId) => rpc("delete_exam", { p_exam_id: examId }),
  addQuestion: (examId, payload) => rpc("add_question", { p_exam_id: examId, p_payload: payload }),
  updateQuestion: (questionId, payload) => rpc("update_question", { p_question_id: questionId, p_payload: payload }),
  deleteQuestion: (questionId) => rpc("delete_question", { p_question_id: questionId }),
  reorderQuestions: (examId, questionIds) => rpc("reorder_questions", { p_exam_id: examId, p_question_ids: questionIds }),
};

// Schools
export const schoolsApi = {
  list: () => rpc("get_schools_with_exams"),
  get: (schoolId) => rpc("get_school", { p_school_id: schoolId }),
  create: (payload) => rpc("create_school", { p_payload: payload }),
  update: (schoolId, payload) => rpc("update_school", { p_school_id: schoolId, p_payload: payload }),
  delete: (schoolId) => rpc("delete_school", { p_school_id: schoolId }),
};

export const subjectsApi = {
  create: (payload) => rpc("create_subject", { p_payload: payload }),
  update: (subjectId, payload) => rpc("update_subject", { p_subject_id: subjectId, p_payload: payload }),
  delete: (subjectId) => rpc("delete_subject", { p_subject_id: subjectId }),
};

// School programmes (per-year curriculum documents, hosted externally e.g. Google Drive)
export const programmesApi = {
  create: (payload) => rpc("create_school_programme", { p_payload: payload }),
  update: (id, payload) => rpc("update_school_programme", { p_id: id, p_payload: payload }),
  delete: (id) => rpc("delete_school_programme", { p_id: id }),
};

// Results
export const resultsApi = {
  submit: ({ exam_id, started_at, answers }) => rpc("submit_exam_attempt", {
    p_exam_id: exam_id,
    p_started_at: started_at,
    p_answers: answers,
  }),
  mine: () => rpc("get_my_results"),
  forExam: (examId) => rpc("get_exam_results", { p_exam_id: examId }),
  details: (resultId) => rpc("get_result_details", { p_result_id: resultId }),
  deleteResult: (resultId) => rpc("delete_result", { p_result_id: resultId }),
  deleteBulkResults: async (resultIds) => {
    try {
      return await rpc("delete_bulk_results", { p_result_ids: resultIds });
    } catch {
      // Fallback if bulk RPC is not yet migrated
      await Promise.all(resultIds.map((id) => rpc("delete_result", { p_result_id: id })));
      return resultIds.length;
    }
  },
  deleteForExam: async (examId) => {
    try {
      return await rpc("delete_exam_results", { p_exam_id: examId });
    } catch {
      // Fallback
      const res = await rpc("get_exam_results", { p_exam_id: examId });
      if (res && res.length > 0) {
        await Promise.all(res.map((r) => rpc("delete_result", { p_result_id: r.id })));
      }
      return res?.length || 0;
    }
  },
  studentAnalytics: (studentId) => rpc("get_student_analytics", { p_student_id: studentId }),
};
