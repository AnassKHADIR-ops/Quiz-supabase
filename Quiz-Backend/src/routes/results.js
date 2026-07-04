import express from "express";
import { query, pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// POST /api/results - submit a finished exam attempt
// body: { exam_id, started_at, answers: [{ question_id, selected_choice_ids: [...], time_spent_seconds }] }
router.post("/", requireAuth, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { exam_id, started_at, answers } = req.body;
    if (!exam_id || !Array.isArray(answers)) {
      return res.status(400).json({ error: "exam_id and answers are required" });
    }

    // Load correct choices for every question in this exam
    const correctRes = await query(
      `SELECT q.id AS question_id, c.id AS choice_id
       FROM questions q
       JOIN choices c ON c.question_id = q.id
       WHERE q.exam_id = $1 AND c.is_correct = true`,
      [exam_id]
    );

    const correctByQuestion = {};
    for (const row of correctRes.rows) {
      if (!correctByQuestion[row.question_id]) correctByQuestion[row.question_id] = new Set();
      correctByQuestion[row.question_id].add(row.choice_id);
    }

    const totalQuestions = Object.keys(correctByQuestion).length;
    let correctCount = 0;

    const gradedAnswers = answers.map((a) => {
      const correctSet = correctByQuestion[a.question_id] || new Set();
      const selected = new Set(a.selected_choice_ids || []);
      const isCorrect =
        selected.size === correctSet.size &&
        [...selected].every((id) => correctSet.has(id));
      if (isCorrect) correctCount++;
      return { ...a, is_correct: isCorrect };
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    await client.query("BEGIN");

    const resultInsert = await client.query(
      `INSERT INTO results (exam_id, student_id, score, total, percentage, started_at, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *`,
      [exam_id, req.user.id, correctCount, totalQuestions, percentage, started_at || null]
    );
    const result = resultInsert.rows[0];

    for (const a of gradedAnswers) {
      await client.query(
        `INSERT INTO answers (result_id, question_id, selected_choice_ids, is_correct, time_spent_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [result.id, a.question_id, a.selected_choice_ids || [], a.is_correct, a.time_spent_seconds || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...result, answers: gradedAnswers });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/results/me - logged-in student's own results
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.*, e.title AS exam_title
       FROM results r
       JOIN exams e ON e.id = r.exam_id
       WHERE r.student_id = $1
       ORDER BY r.submitted_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/results/exam/:examId - all results for an exam (teacher/admin, owner only)
router.get("/exam/:examId", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  try {
    const exam = await query("SELECT created_by FROM exams WHERE id = $1", [req.params.examId]);
    if (!exam.rows[0]) return res.status(404).json({ error: "Exam not found" });
    if (exam.rows[0].created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await query(
      `SELECT r.*, u.name AS student_name, u.email AS student_email
       FROM results r
       JOIN users u ON u.id = r.student_id
       WHERE r.exam_id = $1
       ORDER BY r.submitted_at DESC`,
      [req.params.examId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/results/:id/details - full review (correction) for one attempt
router.get("/:id/details", requireAuth, async (req, res, next) => {
  try {
    const resultRes = await query("SELECT * FROM results WHERE id = $1", [req.params.id]);
    const result = resultRes.rows[0];
    if (!result) return res.status(404).json({ error: "Result not found" });

    const isOwner = result.student_id === req.user.id;
    const isStaff = req.user.role === "teacher" || req.user.role === "admin";
    if (!isOwner && !isStaff) return res.status(403).json({ error: "Access denied" });

    const answersRes = await query(
      `SELECT a.*, q.question_text, q.solution_text, q.resource_url, q.topic
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       WHERE a.result_id = $1
       ORDER BY q.position ASC, q.id ASC`,
      [req.params.id]
    );

    const questionIds = answersRes.rows.map((a) => a.question_id);
    let choicesByQuestion = {};
    if (questionIds.length > 0) {
      const choicesRes = await query(
        `SELECT id, question_id, choice_text, is_correct, position
         FROM choices WHERE question_id = ANY($1) ORDER BY position ASC, id ASC`,
        [questionIds]
      );
      for (const c of choicesRes.rows) {
        if (!choicesByQuestion[c.question_id]) choicesByQuestion[c.question_id] = [];
        choicesByQuestion[c.question_id].push(c);
      }
    }

    const answers = answersRes.rows.map((a) => ({
      ...a,
      choices: choicesByQuestion[a.question_id] || [],
    }));

    res.json({ ...result, answers });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/results/:id — teacher/admin can delete a result
router.delete("/:id", requireAuth, requireRole("teacher", "admin"), async (req, res, next) => {
  try {
    const existing = await query("SELECT id FROM results WHERE id = $1", [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Result not found" });
    await query("DELETE FROM results WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// GET /api/results/student/:studentId — full analytics for one student (teacher or self)
router.get("/student/:studentId", requireAuth, async (req, res, next) => {
  try {
    const isStaff = req.user.role === "teacher" || req.user.role === "admin";
    const isSelf = req.user.id === Number(req.params.studentId);
    if (!isStaff && !isSelf) return res.status(403).json({ error: "Access denied" });

    // All results with exam + university info
    const resultsRes = await query(
      `SELECT r.id, r.score, r.total, r.percentage, r.submitted_at,
              e.title AS exam_title, e.year,
              u.name AS university_name, u.category, u.icon
       FROM results r
       JOIN exams e ON e.id = r.exam_id
       LEFT JOIN universities u ON u.id = e.university_id
       WHERE r.student_id = $1
       ORDER BY r.submitted_at ASC`,
      [req.params.studentId]
    );

    const results = resultsRes.rows;
    const total = results.length;
    const avgPct = total > 0
      ? Math.round(results.reduce((s, r) => s + Number(r.percentage), 0) / total)
      : 0;
    const best = total > 0 ? Math.max(...results.map((r) => Number(r.percentage))) : 0;
    const lowest = total > 0 ? Math.min(...results.map((r) => Number(r.percentage))) : 0;
    const passed = results.filter((r) => Number(r.percentage) >= 50).length;

    // Per-university breakdown
    const univMap = {};
    for (const r of results) {
      const key = r.university_name || "Other";
      if (!univMap[key]) univMap[key] = { name: key, icon: r.icon, scores: [] };
      univMap[key].scores.push(Number(r.percentage));
    }
    const byUniversity = Object.values(univMap).map((u) => ({
      name: u.name,
      icon: u.icon,
      count: u.scores.length,
      avg: Math.round(u.scores.reduce((a, b) => a + b, 0) / u.scores.length),
    }));

    res.json({
      stats: { total, avgPct, best, lowest, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 },
      history: results,
      byUniversity,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
