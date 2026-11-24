import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type {NextFunction, Request, Response} from 'express';
import {db, getRecipeById, hashPassword, hashToken, mapRecipeRow, verifyPassword, videosDir} from './src/db/database.ts';
import type {StorageStats} from './src/types.ts';

const PORT = 3000;
const SESSION_COOKIE = 'pokhtnegar_session';
const MAX_VIDEO_BYTES = 30 * 1024 * 1024; // 30 MB per real uploaded video
const TOTAL_VIDEO_QUOTA_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB total server media quota

const ALLOWED_CATEGORIES = new Set(['cooking', 'cake', 'bread', 'dessert']);
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);
const ALLOWED_PRESET_IMAGES = new Set([
  '/src/assets/images/hero_persian_kitchen_1795495624394.jpg',
  '/src/assets/images/recipe_tahchin_saffron_1795495624588.jpg',
  '/src/assets/images/recipe_velvet_cake_1795495624907.jpg',
  '/src/assets/images/recipe_artisan_bread_1795495625641.jpg',
  '/src/assets/images/recipe_vegan_bowl_1795495625713.jpg',
  '/src/assets/images/recipe_herb_frittata_1795495625246.jpg',
]);

interface AuthUser {
  id: number;
  username: string;
}

interface AuthedRequest extends Request {
  user?: AuthUser;
}

function getStorageStats(): StorageStats {
  let usedBytes = 0;
  let videoCount = 0;
  try {
    const entries = fs.readdirSync(videosDir, {withFileTypes: true});
    for (const entry of entries) {
      if (entry.isFile() && /\.(mp4|webm|mov)$/i.test(entry.name)) {
        const stat = fs.statSync(path.join(videosDir, entry.name));
        usedBytes += stat.size;
        videoCount += 1;
      }
    }
  } catch {
    // Directory may be empty
  }
  return {
    maxVideoBytes: MAX_VIDEO_BYTES,
    totalQuotaBytes: TOTAL_VIDEO_QUOTA_BYTES,
    usedBytes,
    remainingBytes: Math.max(0, TOTAL_VIDEO_QUOTA_BYTES - usedBytes),
    videoCount,
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.length >= 16) return token;
  }
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE];
  if (cookieToken && cookieToken.length >= 16) {
    return cookieToken;
  }
  return null;
}

function resolveSessionUser(req: Request): AuthUser | null {
  const token = extractToken(req);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT u.id, u.username
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(tokenHash) as AuthUser | undefined;
  return row ?? null;
}

function verifyMutationHeader(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return true;
  }
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return true;
  }
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (typeof origin === 'string' && typeof host === 'string') {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!verifyMutationHeader(req)) {
    res.status(403).json({error: 'درخواست نامعتبر است.'});
    return;
  }
  const user = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({error: 'لطفاً ابتدا با نام کاربری خود وارد شوید.'});
    return;
  }
  req.user = user;
  next();
}

function setSessionCookie(res: Response, token: string): void {
  const maxAgeSec = 60 * 60 * 24 * 14;
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; Secure; SameSite=None; Partitioned`,
  );
}

function clearSessionCookie(res: Response): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`,
  );
}

function createSessionForUser(userId: number): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  db.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+14 days'))`).run(
    tokenHash,
    userId,
  );
  return rawToken;
}

function sanitizeImageUrl(input: unknown): string {
  if (typeof input !== 'string' || !input.trim()) {
    return '/src/assets/images/recipe_tahchin_saffron_1795495624588.jpg';
  }
  const trimmed = input.trim();
  if (ALLOWED_PRESET_IMAGES.has(trimmed)) {
    return trimmed;
  }
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length <= 2_200_000) {
    return trimmed;
  }
  return '/src/assets/images/recipe_tahchin_saffron_1795495624588.jpg';
}

function sanitizeVideoUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^\/api\/media\/videos\/[a-f0-9-]+\.(mp4|webm|mov)$/.test(trimmed)) {
    const filename = path.basename(trimmed);
    const fullPath = path.resolve(videosDir, filename);
    if (fullPath.startsWith(videosDir + path.sep) && fs.existsSync(fullPath)) {
      return trimmed;
    }
  }
  return null;
}

function detectVideoExtension(buf: Buffer, contentType: string): 'mp4' | 'webm' | 'mov' | null {
  if (buf.length < 16) return null;
  // WebM / Matroska EBML header: 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return 'webm';
  }
  // ISO BMFF (MP4 / MOV) has 'ftyp' at bytes 4..8
  const boxType = buf.subarray(4, 8).toString('ascii');
  if (boxType === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii');
    if (contentType === 'video/quicktime' || brand === 'qt  ') {
      return 'mov';
    }
    return 'mp4';
  }
  return null;
}

function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.length < 3 || cleaned.length > 24) return null;
  if (!/^[a-z0-9_\u0600-\u06FF.-]+$/u.test(cleaned)) return null;
  return cleaned;
}

function removeVideoFileIfOrphaned(videoUrl: string | null): void {
  if (!videoUrl) return;
  const match = videoUrl.match(/^\/api\/media\/videos\/([a-f0-9-]+\.(mp4|webm|mov))$/);
  if (!match) return;
  const filename = match[1];
  const refRow = db.prepare('SELECT COUNT(*) AS cnt FROM recipes WHERE video_url = ?').get(videoUrl) as {cnt: number};
  if (refRow.cnt > 0) return;
  const target = path.resolve(videosDir, filename);
  if (target.startsWith(videosDir + path.sep) && fs.existsSync(target)) {
    try {
      fs.unlinkSync(target);
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Raw binary video upload endpoint (MUST come before express.json)
  app.post(
    '/api/videos/upload',
    requireAuth,
    express.raw({
      type: ['video/mp4', 'video/webm', 'video/quicktime'],
      limit: MAX_VIDEO_BYTES,
    }),
    (req, res) => {
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(contentType)) {
        res.status(400).json({error: 'فرمت ویدیو پشتیبانی نمی‌شود. فقط MP4، WebM یا MOV مجاز است.'});
        return;
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({error: 'فایل ویدیو خالی است.'});
        return;
      }

      if (req.body.length > MAX_VIDEO_BYTES) {
        res.status(413).json({error: 'حجم ویدیو نباید بیشتر از ۳۰ مگابایت باشد.'});
        return;
      }

      const ext = detectVideoExtension(req.body, contentType);
      if (!ext) {
        res.status(400).json({error: 'فایل انتخاب‌شده یک ویدیوی معتبر MP4/WebM/MOV نیست.'});
        return;
      }

      const stats = getStorageStats();
      if (stats.usedBytes + req.body.length > stats.totalQuotaBytes) {
        res.status(507).json({error: 'ظرفیت حافظه ویدیوی سرور پر شده است.'});
        return;
      }

      const filename = `${crypto.randomUUID()}.${ext}`;
      const destPath = path.resolve(videosDir, filename);
      if (!destPath.startsWith(videosDir + path.sep)) {
        res.status(400).json({error: 'مسیر ذخیره‌سازی نامعتبر است.'});
        return;
      }

      fs.writeFileSync(destPath, req.body);
      const videoUrl = `/api/media/videos/${filename}`;

      res.status(201).json({
        videoUrl,
        videoSizeBytes: req.body.length,
        storage: getStorageStats(),
      });
    },
  );

  // Handle payload too large error for video upload cleanly in JSON
  app.use((err: {type?: string; status?: number}, _req: Request, res: Response, next: NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      res.status(413).json({error: 'حجم فایل ویدیو بیشتر از سقف مجاز ۳۰ مگابایت است.'});
      return;
    }
    next(err);
  });

  app.use(express.json({limit: '3mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({ok: true});
  });

  app.get('/api/storage/stats', (_req, res) => {
    res.json({storage: getStorageStats()});
  });

  // Safe HTTP Range-capable video streaming route
  app.get('/api/media/videos/:filename', (req, res) => {
    const filename = String(req.params.filename || '');
    if (!/^[a-f0-9-]+\.(mp4|webm|mov)$/.test(filename)) {
      res.status(400).json({error: 'نام فایل ویدیو نامعتبر است.'});
      return;
    }
    const targetPath = path.resolve(videosDir, filename);
    if (!targetPath.startsWith(videosDir + path.sep) || !fs.existsSync(targetPath)) {
      res.status(404).json({error: 'ویدیو یافت نشد.'});
      return;
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(targetPath);
  });

  app.get('/api/auth/me', (req, res) => {
    const user = resolveSessionUser(req);
    res.json({user});
  });

  app.post('/api/auth/register', (req, res) => {
    const username = normalizeUsername(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username) {
      res.status(400).json({error: 'نام کاربری باید بین ۳ تا ۲۴ کاراکتر معتبر باشد.'});
      return;
    }
    if (password.length < 4 || password.length > 64) {
      res.status(400).json({error: 'رمز عبور باید بین ۴ تا ۶۴ کاراکتر باشد.'});
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      res.status(409).json({error: 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید یا وارد شوید.'});
      return;
    }

    const pwHash = hashPassword(password);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, pwHash);
    const userId = Number(result.lastInsertRowid);
    const token = createSessionForUser(userId);
    setSessionCookie(res, token);

    res.status(201).json({
      user: {id: userId, username},
      token,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const username = normalizeUsername(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      res.status(400).json({error: 'نام کاربری و رمز عبور الزامی است.'});
      return;
    }

    const row = db
      .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
      .get(username) as {id: number; username: string; password_hash: string} | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({error: 'نام کاربری یا رمز عبور نادرست است.'});
      return;
    }

    const token = createSessionForUser(row.id);
    setSessionCookie(res, token);

    res.json({
      user: {id: row.id, username: row.username},
      token,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = extractToken(req);
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    }
    clearSessionCookie(res);
    res.json({ok: true});
  });

  app.get('/api/recipes', (req, res) => {
    const currentUser = resolveSessionUser(req);
    const currentUserId = currentUser ? currentUser.id : null;

    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : '';
    const maxTime = Number(req.query.maxTime);
    const minTime = Number(req.query.minTime);
    const vegetarian = req.query.vegetarian === 'true' || req.query.vegetarian === '1';
    const diet = req.query.diet === 'true' || req.query.diet === '1';
    const hasVideo = req.query.hasVideo === 'true' || req.query.hasVideo === '1';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const conditions: string[] = [];
    const params: unknown[] = [currentUserId, currentUserId];

    if (category && ALLOWED_CATEGORIES.has(category)) {
      conditions.push('r.category = ?');
      params.push(category);
    }
    if (difficulty && ALLOWED_DIFFICULTIES.has(difficulty)) {
      conditions.push('r.difficulty = ?');
      params.push(difficulty);
    }
    if (!Number.isNaN(maxTime) && maxTime > 0) {
      conditions.push('r.prep_time <= ?');
      params.push(maxTime);
    }
    if (!Number.isNaN(minTime) && minTime > 0) {
      conditions.push('r.prep_time >= ?');
      params.push(minTime);
    }
    if (vegetarian) {
      conditions.push('r.is_vegetarian = 1');
    }
    if (diet) {
      conditions.push('r.is_diet = 1');
    }
    if (hasVideo) {
      conditions.push('r.video_url IS NOT NULL');
    }
    if (q) {
      conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.ingredients_json LIKE ? OR r.author_username LIKE ?)');
      const likeQ = `%${q}%`;
      params.push(likeQ, likeQ, likeQ, likeQ);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(
        `
        SELECT r.*,
          COALESCE((SELECT AVG(score) FROM ratings WHERE recipe_id = r.id), 0) AS avg_rating,
          (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count,
          CASE WHEN ? IS NOT NULL AND EXISTS (SELECT 1 FROM favorites WHERE recipe_id = r.id AND user_id = ?) THEN 1 ELSE 0 END AS is_favorite
        FROM recipes r
        ${whereClause}
        ORDER BY r.id DESC
      `,
      )
      .all(...params) as Parameters<typeof mapRecipeRow>[0][];

    res.json({recipes: rows.map(mapRecipeRow)});
  });

  app.get('/api/recipes/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({error: 'شناسه دستور پخت نامعتبر است.'});
      return;
    }
    const currentUser = resolveSessionUser(req);
    const recipe = getRecipeById(id, currentUser ? currentUser.id : null);
    if (!recipe) {
      res.status(404).json({error: 'دستور پخت مورد نظر یافت نشد.'});
      return;
    }
    res.json({recipe});
  });

  app.post('/api/recipes', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const category = typeof req.body?.category === 'string' ? req.body.category.trim() : '';
    const difficulty = typeof req.body?.difficulty === 'string' ? req.body.difficulty.trim() : '';
    const prepTime = Number(req.body?.prepTime);
    const servings = Number(req.body?.servings) || 4;
    const caloriesRaw = req.body?.calories;
    const calories = caloriesRaw !== null && caloriesRaw !== undefined && caloriesRaw !== '' ? Number(caloriesRaw) : null;
    const isVegetarian = Boolean(req.body?.isVegetarian);
    const isDiet = Boolean(req.body?.isDiet);
    const imageUrl = sanitizeImageUrl(req.body?.imageUrl);
    const videoUrl = sanitizeVideoUrl(req.body?.videoUrl);
    const videoSizeBytes =
      videoUrl && typeof req.body?.videoSizeBytes === 'number' && Number.isFinite(req.body.videoSizeBytes)
        ? Math.round(req.body.videoSizeBytes)
        : null;

    if (title.length < 3 || title.length > 120) {
      res.status(400).json({error: 'عنوان دستور پخت باید بین ۳ تا ۱۲۰ کاراکتر باشد.'});
      return;
    }
    if (description.length < 10 || description.length > 600) {
      res.status(400).json({error: 'توضیح کوتاه دستور پخت باید بین ۱۰ تا ۶۰۰ کاراکتر باشد.'});
      return;
    }
    if (!ALLOWED_CATEGORIES.has(category)) {
      res.status(400).json({error: 'دسته‌بندی نامعتبر است.'});
      return;
    }
    if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
      res.status(400).json({error: 'سطح دشواری نامعتبر است.'});
      return;
    }
    if (!Number.isFinite(prepTime) || prepTime < 1 || prepTime > 1440) {
      res.status(400).json({error: 'زمان آماده‌سازی باید بین ۱ تا ۱۴۴۰ دقیقه باشد.'});
      return;
    }

    const rawIngredients: unknown[] = Array.isArray(req.body?.ingredients) ? req.body.ingredients : [];
    const ingredients = rawIngredients
      .filter((i: unknown): i is {name: string; amount: string} => {
        return (
          typeof i === 'object' &&
          i !== null &&
          typeof (i as {name?: unknown}).name === 'string' &&
          (i as {name: string}).name.trim().length > 0
        );
      })
      .slice(0, 35)
      .map((i: {name: string; amount: string}) => ({
        name: i.name.trim().slice(0, 80),
        amount: typeof i.amount === 'string' ? i.amount.trim().slice(0, 50) : 'به مقدار لازم',
      }));

    if (ingredients.length === 0) {
      res.status(400).json({error: 'حداقل یک قلم ماده اولیه وارد کنید.'});
      return;
    }

    const rawSteps: unknown[] = Array.isArray(req.body?.steps) ? req.body.steps : [];
    const steps = rawSteps
      .filter((s: unknown): s is {title?: string; instruction: string; tip?: string} => {
        return (
          typeof s === 'object' &&
          s !== null &&
          typeof (s as {instruction?: unknown}).instruction === 'string' &&
          (s as {instruction: string}).instruction.trim().length > 0
        );
      })
      .slice(0, 20)
      .map((s: {title?: string; instruction: string; tip?: string}, idx: number) => ({
        title: typeof s.title === 'string' && s.title.trim() ? s.title.trim().slice(0, 80) : `مرحله ${idx + 1}`,
        instruction: s.instruction.trim().slice(0, 500),
        tip: typeof s.tip === 'string' && s.tip.trim() ? s.tip.trim().slice(0, 200) : undefined,
      }));

    if (steps.length === 0) {
      res.status(400).json({error: 'حداقل یک مرحله پخت وارد کنید.'});
      return;
    }

    const result = db
      .prepare(
        `
        INSERT INTO recipes (
          author_id, author_username, title, description, category, prep_time,
          difficulty, servings, calories, is_vegetarian, is_diet, image_url,
          video_url, video_size_bytes, ingredients_json, steps_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        user.id,
        user.username,
        title,
        description,
        category,
        Math.round(prepTime),
        difficulty,
        Math.max(1, Math.min(30, Math.round(servings))),
        calories !== null && Number.isFinite(calories) && calories > 0 ? Math.round(calories) : null,
        isVegetarian ? 1 : 0,
        isDiet ? 1 : 0,
        imageUrl,
        videoUrl,
        videoSizeBytes,
        JSON.stringify(ingredients),
        JSON.stringify(steps),
      );

    const created = getRecipeById(Number(result.lastInsertRowid), user.id);
    res.status(201).json({recipe: created});
  });

  app.patch('/api/recipes/:id/video', requireAuth, (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const user = req.user!;
    const existing = db
      .prepare('SELECT author_id, video_url FROM recipes WHERE id = ?')
      .get(id) as {author_id: number; video_url: string | null} | undefined;

    if (!existing) {
      res.status(404).json({error: 'دستور یافت نشد.'});
      return;
    }
    if (existing.author_id !== user.id) {
      res.status(403).json({error: 'فقط نویسنده دستور می‌تواند ویدیو را ویرایش کند.'});
      return;
    }

    const nextVideoUrl = req.body?.videoUrl === null ? null : sanitizeVideoUrl(req.body?.videoUrl);
    if (req.body?.videoUrl !== null && !nextVideoUrl) {
      res.status(400).json({error: 'آدرس ویدیوی آپلودشده معتبر نیست.'});
      return;
    }

    const nextSize =
      nextVideoUrl && typeof req.body?.videoSizeBytes === 'number' && Number.isFinite(req.body.videoSizeBytes)
        ? Math.round(req.body.videoSizeBytes)
        : null;

    db.prepare('UPDATE recipes SET video_url = ?, video_size_bytes = ? WHERE id = ?').run(nextVideoUrl, nextSize, id);
    if (existing.video_url && existing.video_url !== nextVideoUrl) {
      removeVideoFileIfOrphaned(existing.video_url);
    }

    const updated = getRecipeById(id, user.id);
    res.json({recipe: updated});
  });

  app.delete('/api/recipes/:id', requireAuth, (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const user = req.user!;
    const existing = db
      .prepare('SELECT author_id, video_url FROM recipes WHERE id = ?')
      .get(id) as {author_id: number; video_url: string | null} | undefined;
    if (!existing) {
      res.status(404).json({error: 'دستور یافت نشد.'});
      return;
    }
    if (existing.author_id !== user.id) {
      res.status(403).json({error: 'شما فقط می‌توانید دستورهای ثبت‌شده توسط خودتان را حذف کنید.'});
      return;
    }
    db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
    removeVideoFileIfOrphaned(existing.video_url);
    res.json({ok: true});
  });

  app.post('/api/recipes/:id/rate', requireAuth, (req: AuthedRequest, res) => {
    const recipeId = Number(req.params.id);
    const score = Number(req.body?.score);
    const user = req.user!;

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      res.status(400).json({error: 'شناسه نامعتبر است.'});
      return;
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      res.status(400).json({error: 'امتیاز باید عددی بین ۱ تا ۵ باشد.'});
      return;
    }

    const exists = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!exists) {
      res.status(404).json({error: 'دستور یافت نشد.'});
      return;
    }

    db.prepare(
      `INSERT INTO ratings (recipe_id, user_id, score) VALUES (?, ?, ?)
       ON CONFLICT(recipe_id, user_id) DO UPDATE SET score = excluded.score, created_at = datetime('now')`,
    ).run(recipeId, user.id, score);

    const updated = getRecipeById(recipeId, user.id);
    res.json({recipe: updated});
  });

  app.post('/api/recipes/:id/favorite', requireAuth, (req: AuthedRequest, res) => {
    const recipeId = Number(req.params.id);
    const user = req.user!;

    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      res.status(400).json({error: 'شناسه نامعتبر است.'});
      return;
    }

    const exists = db.prepare('SELECT id FROM recipes WHERE id = ?').get(recipeId);
    if (!exists) {
      res.status(404).json({error: 'دستور یافت نشد.'});
      return;
    }

    const fav = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?').get(user.id, recipeId);
    let isFavorite = false;
    if (fav) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?').run(user.id, recipeId);
      isFavorite = false;
    } else {
      db.prepare('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)').run(user.id, recipeId);
      isFavorite = true;
    }

    res.json({isFavorite});
  });

  app.get('/api/profile', (req, res) => {
    const user = resolveSessionUser(req);
    if (!user) {
      res.status(401).json({error: 'لطفاً وارد حساب کاربری شوید.'});
      return;
    }

    const favoriteRows = db
      .prepare(
        `
        SELECT r.*,
          COALESCE((SELECT AVG(score) FROM ratings WHERE recipe_id = r.id), 0) AS avg_rating,
          (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count,
          (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) AS comment_count,
          1 AS is_favorite
        FROM favorites f
        JOIN recipes r ON r.id = f.recipe_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `,
      )
      .all(user.id) as Parameters<typeof mapRecipeRow>[0][];

    const authoredRows = db
      .prepare(
        `
        SELECT r.*,
          COALESCE((SELECT AVG(score) FROM ratings WHERE recipe_id = r.id), 0) AS avg_rating,
          (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count,
          (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) AS comment_count,
          CASE WHEN EXISTS (SELECT 1 FROM favorites WHERE recipe_id = r.id AND user_id = ?) THEN 1 ELSE 0 END AS is_favorite
        FROM recipes r
        WHERE r.author_id = ?
        ORDER BY r.id DESC
      `,
      )
      .all(user.id, user.id) as Parameters<typeof mapRecipeRow>[0][];

    res.json({
      user,
      favorites: favoriteRows.map(mapRecipeRow),
      authored: authoredRows.map(mapRecipeRow),
    });
  });

  const httpServer = http.createServer(app);
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : {server: httpServer},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`PokhtNegar server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
