const db = require('../config/db');

const BADGE_TITLES = {
  FIRST_PROMPT: 'Erster Prompt',
  TEN_PROMPTS: '10 Prompts erledigt',
  LEVEL_10: 'Level 10 erreicht',
  DAILY_THINKER: 'Täglicher Denker (5 Tage aktiv)'
};

async function getBadgeId(title) {
  const { rows } = await db.query('SELECT id FROM badges WHERE title = $1', [title]);
  return rows[0] ? rows[0].id : null;
}

async function userHasBadge(userId, badgeId) {
  const { rows } = await db.query(
    'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
    [userId, badgeId]
  );
  return rows.length > 0;
}

async function awardBadge(userId, badgeId) {
  await db.query(
    'INSERT INTO user_badges (user_id, badge_id, awarded_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
    [userId, badgeId]
  );
}

function hasFiveDayStreak(dates) {
  if (dates.length < 5) return false;
  // Dates are JS Date objects sorted ascending
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak += 1;
      if (streak >= 5) return true;
    } else if (diff > 1) {
      streak = 1;
    }
  }
  return false;
}

exports.checkAndAwardBadges = async function (userId) {
  // Count completed prompts
  const countRes = await db.query(
    'SELECT COUNT(*) FROM prompts WHERE user_id = $1 AND done = true',
    [userId]
  );
  const promptCount = parseInt(countRes.rows[0].count, 10);

  // Get user level
  const levelRes = await db.query('SELECT level FROM users WHERE id = $1', [userId]);
  const level = levelRes.rows[0] ? levelRes.rows[0].level : 0;

  // Distinct completion dates
  const dateRes = await db.query(
    'SELECT DISTINCT CAST(created_at AS DATE) AS d FROM prompts WHERE user_id = $1 AND done = true ORDER BY d ASC',
    [userId]
  );
  const dates = dateRes.rows.map((r) => new Date(r.d));
  const streakReached = hasFiveDayStreak(dates);

  await maybeAward(BADGE_TITLES.FIRST_PROMPT, promptCount >= 1);
  await maybeAward(BADGE_TITLES.TEN_PROMPTS, promptCount >= 10);
  await maybeAward(BADGE_TITLES.LEVEL_10, level >= 10);
  await maybeAward(BADGE_TITLES.DAILY_THINKER, streakReached);

  async function maybeAward(title, condition) {
    if (!condition) return;
    const badgeId = await getBadgeId(title);
    if (!badgeId) return;
    const already = await userHasBadge(userId, badgeId);
    if (!already) {
      await awardBadge(userId, badgeId);
    }
  }
};

exports.getBadgesWithStatus = async function (userId) {
  const { rows } = await db.query(
    `SELECT b.id, b.title, b.description, b.icon,
            (ub.id IS NOT NULL) AS achieved,
            ub.awarded_at
       FROM badges b
       LEFT JOIN user_badges ub
         ON ub.badge_id = b.id AND ub.user_id = $1
       ORDER BY b.id`,
    [userId]
  );
  return rows;
};
