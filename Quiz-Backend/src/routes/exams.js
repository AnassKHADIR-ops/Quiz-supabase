import express from "express";
import { query, pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/exams - list published exams (students) or all exams created by the teacher
router.get("/", requireAuth, async (req, res, next) => {
  try {
    let result;
    if (req.user.role === "teacher" || req.user.role === "admin") {
      result = await query(
        `SELECT e.*, s.name AS subject_name
         FROM exams e
         LEFT JOIN subjects s ON s.id = e.subject_id
         WHERE e.created_by = $1
         ORDER BY e.created_at DESC`,
        [req.user.id]
      );
    } else {
      result = await query(
        `SELECT e.id, e.title, e.description, e.duration_minutes, e.show_results, s.name AS subject_name
         FROM exams e
         LEFT JOIN subjects s ON s.id = e.subject_id
         WHERE e.is_published = true
         ORDER BY e.created_at DESC`
      );
    }
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/:id - exam with questions + choices (no is_correct/solution for students)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const examId = req.params.id;

    const examResult = await query("SELECT * FROM exams WHERE id = $1", [examId]);
    const exam = examResult.rows[0];
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    const isOwner = req.user.id === exam.created_by;
    const isStaff = req.user.role === "teacher" || req.user.role === "admin";

    if (!exam.is_published && !(isStaff && isOwner)) {
      return res.status(403).json({ error: "Exam not available" });
    }

    const questionsResult = await query(
      `SELECT id, question_text, question_type, topic, position,
              ${isOwner && isStaff ? "solution_text, resource_url," : ""}
              exam_id
       FROM questions WHERE exam_id = $1 ORDER BY position ASC, id ASC`,
      [examId]
    );

    const questionIds = questionsResult.rows.map((q) => q.id);
    let choicesByQuestion = {};
    if (questionIds.length > 0) {
      const choicesResult = await query(
        `SELECT id, question_id, choice_text, position
                ${isOwner && isStaff ? ", is_correct" : ""}
         FROM choices WHERE question_id = ANY($1) ORDER BY position ASC, id ASC`,
        [questionIds]
      );
      for (const c of choicesResult.rows) {
        if (!choicesByQuestion[c.question_id]) choicesByQuestion[c.question_id] = [];
        choicesByQuestion[c.question_id].push(c);
      }
    }

    const questions = questionsResult.rows.map((q) => ({
      ...q,
      choices: choicesByQuestion[q.id] || [],
    }));

    res.json({ ...exam, questions });
  } catch (err) {
    next(err);
  }
});

// POST /api/exams - create a new exam (teacher/admin)
router.post("/", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  try {
    const { title, description, subject_id, duration_minutes, show_results } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const result = await query(
      `INSERT INTO exams (title, description, subject_id, created_by, duration_minutes, show_results)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || null, subject_id || null, req.user.id, duration_minutes || null, show_results || "instant"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/exams/:id - update exam (e.g. publish/unpublish, edit fields)
router.patch("/:id", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  try {
    const { title, description, subject_id, duration_minutes, show_results, is_published } = req.body;

    const existing = await query("SELECT created_by FROM exams WHERE id = $1", [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Exam not found" });
    if (existing.rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await query(
      `UPDATE exams SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         subject_id = COALESCE($3, subject_id),
         duration_minutes = COALESCE($4, duration_minutes),
         show_results = COALESCE($5, show_results),
         is_published = COALESCE($6, is_published)
       WHERE id = $7 RETURNING *`,
      [title, description, subject_id, duration_minutes, show_results, is_published, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/exams/:id
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  try {
    const existing = await query("SELECT created_by FROM exams WHERE id = $1", [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Exam not found" });
    if (existing.rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }
    await query("DELETE FROM exams WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/exams/:id/questions - add a question with choices
router.post("/:id/questions", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { question_text, question_type, topic, solution_text, resource_url, position, choices } = req.body;
    if (!question_text || !Array.isArray(choices) || choices.length < 2) {
      return res.status(400).json({ error: "question_text and at least 2 choices are required" });
    }

    const exam = await query("SELECT created_by FROM exams WHERE id = $1", [req.params.id]);
    if (!exam.rows[0]) return res.status(404).json({ error: "Exam not found" });
    if (exam.rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    await client.query("BEGIN");

    const qResult = await client.query(
      `INSERT INTO questions (exam_id, question_text, question_type, topic, solution_text, resource_url, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, question_text, question_type || "single", topic || null, solution_text || null, resource_url || null, position || 0]
    );
    const question = qResult.rows[0];

    const insertedChoices = [];
    for (let i = 0; i < choices.length; i++) {
      const c = choices[i];
      const cResult = await client.query(
        `INSERT INTO choices (question_id, choice_text, is_correct, position)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [question.id, c.choice_text, !!c.is_correct, i]
      );
      insertedChoices.push(cResult.rows[0]);
    }

    await client.query("COMMIT");
    res.status(201).json({ ...question, choices: insertedChoices });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
