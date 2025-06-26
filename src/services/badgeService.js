const db = require('../config/db');

async function getBadgeIdByTitle(title) {
  const res = await db.query('SELECT id FROM badges WHERE title = $1', [title]);
  return res.rows[0] ? res.rows[0].id : null;
}

async function userHasBadge(userId, badgeId) {
  const res = await db.query(
    'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2',
    [userId, badgeId]
  );
  return res.rows.length > 0;
}

async function awardBadge(userId, badgeId) {
  await db.query(
    'INSERT INTO user_badges (user_id, badge_id, awarded_at) VALUES ($1, $2, NOW())',
    [userId, badgeId]
  );
}

async function awardIfEligible(userId, title, condition) {
  if (!condition) return;
  const badgeId = await getBadgeIdByTitle(title);
  if (!badgeId) return;
  const hasIt = await userHasBadge(userId, badgeId);
  if (!hasIt) {
    await awardBadge(userId, badgeId);
  }
}

async function checkAndAwardBadges(userId) {
  // Anzahl erledigter Prompts
  const promptCountRes = await db.query(
    'SELECT COUNT(*) FROM prompts WHERE user_id = $1 AND done = true',
    [userId]
  );
  const promptCount = parseInt(promptCountRes.rows[0].count, 10);

  // Aktueller Level
  const userRes = await db.query('SELECT level FROM users WHERE id = $1', [userId]);
  const level = userRes.rows[0] ? parseInt(userRes.rows[0].level, 10) : 0;

  // Streak ermitteln
  const streakRes = await db.query(
    `SELECT DISTINCT DATE(created_at) AS day
       FROM prompts
      WHERE user_id = $1 AND done = true
      ORDER BY day ASC`,
    [userId]
  );
  const days = streakRes.rows.map((r) => new Date(r.day));
  let longest = 0;
  let current = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || (days[i] - days[i - 1]) / 86400000 === 1) {
      current += 1;
    } else if (i > 0 && (days[i] - days[i - 1]) / 86400000 > 1) {
      current = 1;
    }
    if (current > longest) longest = current;
  }

  await awardIfEligible(userId, 'Erster Prompt', promptCount >= 1);
  await awardIfEligible(userId, '10 Prompts erledigt', promptCount >= 10);
  await awardIfEligible(userId, 'Level 10 erreicht', level >= 10);
  await awardIfEligible(userId, 'Täglicher Denker (5 Tage aktiv)', longest >= 5);
}

async function getBadgesForUser(userId) {
  const res = await db.query(
    `SELECT b.id, b.title, b.description, b.icon,
            CASE WHEN ub.id IS NULL THEN false ELSE true END AS achieved
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       ORDER BY b.id`,
    [userId]
  );
  return res.rows;
}

module.exports = {
  checkAndAwardBadges,
  getBadgesForUser,
};

