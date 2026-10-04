import { PERMITS } from './data/permits.js';
import { MASTERED, skillsForGroup } from './data/skills.js';

export function skillsForCategory(category) {
  const permit = PERMITS.find((p) => p.code === category);
  return skillsForGroup(permit?.group ?? 'voiture');
}

// Dernier niveau évalué de chaque compétence d'un élève pour une catégorie de permis.
export async function latestSkillLevels(db, studentId, category) {
  const rows = await db.all(
    `SELECT skill_id, level, created_at FROM skill_assessments
       WHERE id IN (SELECT MAX(id) FROM skill_assessments WHERE student_id = ? AND category = ? GROUP BY skill_id)`,
    studentId,
    category,
  );
  return Object.fromEntries(rows.map((r) => [r.skill_id, { level: r.level, updatedAt: r.created_at }]));
}

export async function skillsSummary(db, studentId, category) {
  const skills = skillsForCategory(category);
  const current = await latestSkillLevels(db, studentId, category);
  const mastered = skills.filter((s) => (current[s.id]?.level ?? 0) >= MASTERED).length;
  const progress = skills.reduce((sum, s) => sum + (current[s.id]?.level ?? 0), 0) / (skills.length * MASTERED);
  return { total: skills.length, mastered, progress: Math.round(progress * 100) / 100 };
}
