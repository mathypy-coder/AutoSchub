// Statuts qui occupent un créneau (moniteur et élève).
export const BLOCKING_STATUSES = ['pending', 'accepted', 'en_route', 'in_progress'];

// Une demande « maintenant » sans réponse du moniteur expire après ce délai.
export const INSTANT_REQUEST_TTL_MIN = 15;

// Demandes restées sans réponse : expirées pour libérer le créneau (et rendre les heures du pack).
// Calculé à la lecture, comme le renouvellement des packs : pas de tâche planifiée.
export async function expireStaleBookings(db) {
  await db.run(
    `UPDATE bookings SET status = 'expired', updated_at = datetime('now')
       WHERE status = 'pending'
         AND ((is_instant = 1 AND created_at <= datetime('now', ?))
           OR (is_instant = 0 AND start_at <= ?))`,
    `-${INSTANT_REQUEST_TTL_MIN} minutes`,
    new Date().toISOString(),
  );
}
