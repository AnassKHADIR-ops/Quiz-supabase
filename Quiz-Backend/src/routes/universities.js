import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/universities — all universities with their published exams grouped
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const univResult = await query(
      `SELECT * FROM universities ORDER BY category, name`
    );

    const examResult = await query(
      `SELECT e.id, e.title, e.description, e.university_id, e.year,
              e.duration_minutes, e.show_results,
              u.name AS university_name, u.category
       FROM exams e
       JOIN universities u ON u.id = e.university_id
       WHERE e.is_published = true
       ORDER BY e.university_id, e.year DESC`
    );

    // Group exams by university
    const examsByUniversity = {};
    for (const exam of examResult.rows) {
      if (!examsByUniversity[exam.university_id]) {
        examsByUniversity[exam.university_id] = [];
      }
      examsByUniversity[exam.university_id].push(exam);
    }

    // Group universities by category
    const categoriesMap = {};
    for (const u of univResult.rows) {
      if (!categoriesMap[u.category]) {
        categoriesMap[u.category] = [];
      }
      categoriesMap[u.category].push({
        ...u,
        exams: examsByUniversity[u.id] || [],
      });
    }

    const categories = Object.entries(categoriesMap).map(([name, universities]) => ({
      name,
      universities,
    }));

    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// GET /api/universities/:id — single university with all its exams
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const univRes = await query(
      "SELECT * FROM universities WHERE id = $1", [req.params.id]
    );
    if (!univRes.rows[0]) return res.status(404).json({ error: "University not found" });

    const examsRes = await query(
      `SELECT id, title, description, year, duration_minutes, show_results
       FROM exams WHERE university_id = $1 AND is_published = true
       ORDER BY year DESC`,
      [req.params.id]
    );

    res.json({ ...univRes.rows[0], exams: examsRes.rows });
  } catch (err) {
    next(err);
  }
});

export default router;
