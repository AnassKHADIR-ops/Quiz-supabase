import { supabase } from "./lib/supabase.js";

function message(error) {
  return error?.message || "Une erreur est survenue. Réessayez.";
}

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(message(error));
  return data;
}

// Auth
export const authApi = {
  async register(name, email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw new Error(message(error));
    if (!data.session) {
      throw new Error("Compte créé. Vérifiez votre e-mail pour confirmer votre inscription.");
    }
    return authApi.me();
  },
  async login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(message(error));
    return authApi.me();
  },
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Session expirée. Connectez-vous de nouveau.");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .single();
    if (profileError) throw new Error(message(profileError));
    return { user: { id: profile.id, name: profile.full_name, email: profile.email, role: profile.role } };
  },
  logout: () => supabase.auth.signOut(),
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
  studentAnalytics: (studentId) => rpc("get_student_analytics", { p_student_id: studentId }),
};
