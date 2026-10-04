import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { PERMIT_CODES } from '../data/permits.js';
import { SKILL_LEVELS } from '../data/skills.js';
import { HttpError } from '../errors.js';
import { latestSkillLevels, skillsForCategory, skillsSummary } from '../progress.js';

export function progressRoutes(db) {
  const router = Router();

  // Grille de compétences de l'élève connecté (ou d'un élève du moniteur connecté).
  router.get('/skills', requireAuth(), async (req, res) => {
    const { category } = req.query;
    if (!PERMIT_CODES.includes(category)) throw new HttpError(400, 'Catégorie de permis invalide.');
    let studentId = req.user.id;
    if (req.user.role === 'instructor') {
      studentId = Number(req.query.studentId);
      const link = Number.isInteger(studentId)
        ? await db.get('SELECT 1 FROM bookings WHERE instructor_id = ? AND student_id = ? LIMIT 1', req.user.id, studentId)
        : null;
      if (!link) throw new HttpError(404, 'Élève introuvable.');
    }
    const current = await latestSkillLevels(db, studentId, category);
    res.json({
      category,
      levels: SKILL_LEVELS,
      summary: await skillsSummary(db, studentId, category),
      skills: skillsForCategory(category).map((s) => ({
        ...s,
        level: current[s.id]?.level ?? 0,
        updatedAt: current[s.id]?.updatedAt ?? null,
      })),
    });
  });

  return router;
}
