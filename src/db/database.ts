import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {IngredientItem, Recipe, RecipeCategory, RecipeComment, RecipeDifficulty, RecipeStep} from '../types.ts';

const dataDir = path.resolve(process.cwd(), 'data');
export const videosDir = path.resolve(dataDir, 'uploads', 'videos');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, {recursive: true});
}
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, {recursive: true});
}

const dbPath = path.join(dataDir, 'pokhtnegar.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    author_username TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    prep_time INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    servings INTEGER NOT NULL DEFAULT 4,
    calories INTEGER,
    is_vegetarian INTEGER NOT NULL DEFAULT 0,
    is_diet INTEGER NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL,
    video_url TEXT,
    video_size_bytes INTEGER,
    ingredients_json TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(recipe_id, user_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, recipe_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );
`);

// Safe column migration in case an existing DB file lacks video columns
const recipeColumns = db.prepare('PRAGMA table_info(recipes)').all() as Array<{name: string}>;
const colNames = new Set(recipeColumns.map((c) => c.name));
if (!colNames.has('video_url')) {
  db.exec('ALTER TABLE recipes ADD COLUMN video_url TEXT');
}
if (!colNames.has('video_size_bytes')) {
  db.exec('ALTER TABLE recipes ADD COLUMN video_size_bytes INTEGER');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface SeedRecipe {
  authorUsername: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepTime: number;
  difficulty: RecipeDifficulty;
  servings: number;
  calories: number | null;
  isVegetarian: boolean;
  isDiet: boolean;
  imageUrl: string;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  ratings: number[];
  comments: Array<{username: string; body: string}>;
}

function seedInitialData() {
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM recipes').get() as {count: number};
  if (countRow.count > 0) return;

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)');
  const getUser = db.prepare('SELECT id, username FROM users WHERE username = ?');

  const seedUsers = ['sarashpaz_mina', 'nanva_kaveh', 'shirinipaz_neda', 'giahkhar_ali'];
  const defaultPassHash = hashPassword('pokhtnegar-seed-account');
  for (const u of seedUsers) {
    insertUser.run(u, defaultPassHash);
  }

  const userMap = new Map<string, number>();
  for (const u of seedUsers) {
    const row = getUser.get(u) as {id: number; username: string};
    userMap.set(u, row.id);
  }

  const seeds: SeedRecipe[] = [
    {
      authorUsername: 'sarashpaz_mina',
      title: 'ته‌چین مرغ زعفرانی مجلسی با ته‌دیگ طلایی',
      description:
        'ته‌چین اصیل ایرانی با بافت نرم در داخل و لایه بیرونی کاملاً برشته و طلایی، عطر زعفران دم‌کرده، ماست چکیده و زرشک تفت‌داده‌شده با کره.',
      category: 'cooking',
      prepTime: 75,
      difficulty: 'medium',
      servings: 6,
      calories: 540,
      isVegetarian: false,
      isDiet: false,
      imageUrl: '/src/assets/images/recipe_tahchin_saffron_1795495624588.jpg',
      ingredients: [
        {name: 'برنج ایرانی', amount: '۳ پیمانه'},
        {name: 'سینه مرغ پخته و ریش‌ریش', amount: '۴۰۰ گرم'},
        {name: 'ماست چکیده پرچرب', amount: '۱ پیمانه'},
        {name: 'زرده تخم‌مرغ', amount: '۳ عدد'},
        {name: 'زعفران دم‌کرده غلیظ', amount: '۴ قاشق غذاخوری'},
        {name: 'زرشک', amount: 'نصف پیمانه'},
        {name: 'کره یا روغن حیوانی', amount: '۸۰ گرم'},
        {name: 'خلال پسته و گلاب', amount: 'به مقدار لازم'},
      ],
      steps: [
        {
          title: 'آبکش کردن برنج',
          instruction: 'برنج خیس‌خورده را در آب جوش و نمک بپزید و زمانی که مغز برنج هنوز کمی سفت است آبکش کنید.',
          tip: 'برنج را بیش از حد نرم نکنید تا ته‌چین حالت خمیری نگیرد.',
        },
        {
          title: 'آماده‌سازی مایه ماست و زعفران',
          instruction: 'زرده تخم‌مرغ، ماست چکیده، زعفران دم‌کرده، دو قاشق گلاب و کمی نمک و فلفل را کاملاً یکدست هم بزنید.',
          tip: 'استفاده از زرده به تنهایی بوی زهم تخم‌مرغ را از بین می‌برد.',
        },
        {
          title: 'ترکیب برنج و لایه‌چینی مرغ',
          instruction: 'نصف برنج را با مایه زعفرانی مخلوط کرده، کف ظرف چرب‌شده فشرده کنید، لایه مرغ و زرشک را بچینید و بقیه برنج را اضافه کنید.',
        },
        {
          title: 'پخت در فر یا روی شعله ملایم',
          instruction: 'روی ظرف را با فویل بپوشانید و ۵۵ دقیقه در فر ۱۸۰ درجه یا با دم‌کنی روی شعله ملایم بپزید تا کناره‌ها طلایی شود.',
          tip: 'پس از پخت ۱۰ دقیقه صبر کنید و سپس در دیس برگردانید.',
        },
      ],
      ratings: [5, 5, 5, 4, 5],
      comments: [
        {username: 'nanva_kaveh', body: 'با زرده تخم‌مرغ و ماست چکیده واقعاً ترد و بدون بو شد. عالی بود!'},
        {username: 'shirinipaz_neda', body: 'من کمی هل ساییده هم به لایه مرغ زدم، عطرش بی‌نظیر شد.'},
      ],
    },
    {
      authorUsername: 'shirinipaz_neda',
      title: 'کیک شکلاتی مخملی با روکش گاناش براق',
      description:
        'کیک شکلاتی سه لایه با بافت بسیار مرطوب و اسفنجی و گاناش شکلات تلخ ۷۰ درصد؛ مناسب جشن‌ها و عصرانه‌های خاص بدون نیاز به همزن صنعتی.',
      category: 'cake',
      prepTime: 55,
      difficulty: 'medium',
      servings: 8,
      calories: 420,
      isVegetarian: true,
      isDiet: false,
      imageUrl: '/src/assets/images/recipe_velvet_cake_1795495624907.jpg',
      ingredients: [
        {name: 'آرد قنادی', amount: '۲ پیمانه'},
        {name: 'پودر کاکائو مرغوب', amount: 'نصف پیمانه'},
        {name: 'شکر', amount: '۱.۵ پیمانه'},
        {name: 'تخم‌مرغ', amount: '۳ عدد'},
        {name: 'شیر ولرم', amount: '۱ پیمانه'},
        {name: 'روغن مایع', amount: 'نصف پیمانه'},
        {name: 'قهوه دم‌کرده داغ', amount: 'نصف پیمانه'},
        {name: 'شکلات تلخ و خامه صبحانه', amount: '۲۰۰ گرم + ۲۰۰ گرم'},
      ],
      steps: [
        {
          title: 'مخلوط کردن مواد خشک',
          instruction: 'آرد، پودر کاکائو، بیکینگ‌پودر، جوش‌شیرین و نمک را دو بار الک کنید تا کیک کاملاً سبک و پف‌دار شود.',
        },
        {
          title: 'ترکیب مواد تر و قهوه داغ',
          instruction: 'تخم‌مرغ، شکر و وانیل را ۴ دقیقه هم بزنید، شیر و روغن را بیفزایید و در پایان مواد خشک و قهوه داغ را فولد کنید.',
          tip: 'قهوه داغ طعم شکلات را دو برابر عمیق‌تر می‌کند و مزه قهوه نمی‌دهد.',
        },
        {
          title: 'پخت و تهیه گاناش',
          instruction: 'مایه را در قالب چرب‌شده در فر ۱۷۵ درجه به مدت ۳۵ دقیقه بپزید. خامه داغ را روی شکلات خردشده بریزید و هم بزنید.',
        },
        {
          title: 'لایه‌گذاری و تزیین نهایی',
          instruction: 'پس از خنک شدن کامل کیک، لایه‌ها را با گاناش بپوشانید و با تمشک تازه یا رنده شکلات تزیین کنید.',
        },
      ],
      ratings: [5, 5, 4, 5],
      comments: [
        {username: 'sarashpaz_mina', body: 'اضافه کردن قهوه داغ واقعاً معجزه کرد، بافتش فوق‌العاده مرطوب ماند.'},
      ],
    },
    {
      authorUsername: 'nanva_kaveh',
      title: 'نان خمیرترش (ساوردو) خانگی با پوسته ترد',
      description:
        'نان سنتی با تخمیر طبیعی، حفره‌های هوایی درشت و پوسته طلایی ترد؛ بدون مخمر صنعتی و مناسب برای تغذیه سالم روزانه.',
      category: 'bread',
      prepTime: 120,
      difficulty: 'hard',
      servings: 10,
      calories: 190,
      isVegetarian: true,
      isDiet: true,
      imageUrl: '/src/assets/images/recipe_artisan_bread_1795495625641.jpg',
      ingredients: [
        {name: 'آرد نان پرپروتئین', amount: '۵۰۰ گرم'},
        {name: 'آب ولرم', amount: '۳۵۰ میلی‌لیتر'},
        {name: 'استارتر خمیرترش فعال', amount: '۱۰۰ گرم'},
        {name: 'نمک دریایی', amount: '۱۰ گرم'},
      ],
      steps: [
        {
          title: 'اتولیز آرد و آب',
          instruction: 'آرد و آب را بدون نمک مخلوط کرده و ۴۵ دقیقه استراحت دهید تا شبکه گلوتن به صورت طبیعی شکل بگیرد.',
        },
        {
          title: 'افزودن خمیرترش و تا زدن خمیر',
          instruction: 'استارتر فعال و نمک را اضافه کنید و طی ۲ ساعت هر ۳۰ دقیقه یک بار خمیر را به آرامی کشش داده و تا بزنید.',
          tip: 'تا زدن ملایم جایگزین ورز دادن طولانی است و حفره‌های هوا را حفظ می‌کند.',
        },
        {
          title: 'فرم‌دهی و استراحت سرد',
          instruction: 'خمیر را گرد کنید، در سبد آردپاشی‌شده قرار دهید و ۸ تا ۱۲ ساعت در یخچال استراحت دهید.',
        },
        {
          title: 'خط انداختن و پخت در قابلمه چدنی',
          instruction: 'روی خمیر تیغ بزنید و ۲۰ دقیقه در قابلمه چدنی داغ در فر ۲۴۰ درجه با در بسته و ۲۰ دقیقه با در باز بپزید.',
        },
      ],
      ratings: [5, 4, 5, 5],
      comments: [
        {username: 'giahkhar_ali', body: 'اولین باری بود که نان خمیرترش با این حفره‌های زیبا درآوردم!'},
      ],
    },
    {
      authorUsername: 'giahkhar_ali',
      title: 'کاسه کینوا و بادمجان کبابی رژیمی با سس ارده',
      description:
        'یک وعده کامل، سیرکننده و ۱۰۰٪ گیاهی سرشار از پروتئین گیاهی نخود و کینوا، بادمجان تنوری بدون سرخ کردن و سس سبک ارده و لیموترش.',
      category: 'cooking',
      prepTime: 30,
      difficulty: 'easy',
      servings: 2,
      calories: 360,
      isVegetarian: true,
      isDiet: true,
      imageUrl: '/src/assets/images/recipe_vegan_bowl_1795495625713.jpg',
      ingredients: [
        {name: 'کینوا سفید یا سه‌رنگ', amount: '۱ پیمانه'},
        {name: 'بادمجان قلمی', amount: '۲ عدد'},
        {name: 'نخود پخته', amount: '۱ پیمانه'},
        {name: 'گوجه‌فرنگی گیلاسی و خیار', amount: '۱ پیمانه'},
        {name: 'دانه انار و جعفری تازه', amount: 'نصف پیمانه'},
        {name: 'ارده و آب لیموترش تازه', amount: '۲ قاشق غذاخوری'},
        {name: 'روغن زیتون و پودر زیره', amount: '۱ قاشق غذاخوری'},
      ],
      steps: [
        {
          title: 'پخت کینوا',
          instruction: 'کینوا را خوب بشویید و با دو برابر آب به مدت ۱۵ دقیقه بپزید تا دانه‌ها باز شوند.',
        },
        {
          title: 'تنوری کردن بادمجان و نخود',
          instruction: 'مکعب‌های بادمجان و نخود را با روغن زیتون، زیره و نمک مزه‌دار کرده و ۲۰ دقیقه در فر یا ایرفرایر برشته کنید.',
          tip: 'ایرفرایر با یک قاشق روغن زیتون بادمجان را کاملاً طلایی و کم‌کالری می‌کند.',
        },
        {
          title: 'تهیه سس ارده و سرو',
          instruction: 'ارده، لیموترش، کمی آب سرد، سیر رنده‌شده و نعناع خشک را هم بزنید و روی کاسه بریزید.',
        },
      ],
      ratings: [5, 5, 4],
      comments: [
        {username: 'sarashpaz_mina', body: 'برای شام رژیمی خیلی سبک و خوشمزه است، سس ارده عالی شد.'},
      ],
    },
    {
      authorUsername: 'giahkhar_ali',
      title: 'کوکو سبزی مجلسی سریع با گردو و زرشک',
      description:
        'کوکو سبزی خوش‌رنگ و پف‌دار آماده در ۲۵ دقیقه؛ گزینه‌ای عالی برای شام سریع گیاهی و کم‌کربوهیدرات با ترکیب سبزی‌های معطر تازه.',
      category: 'cooking',
      prepTime: 25,
      difficulty: 'easy',
      servings: 4,
      calories: 270,
      isVegetarian: true,
      isDiet: true,
      imageUrl: '/src/assets/images/recipe_herb_frittata_1795495625246.jpg',
      ingredients: [
        {name: 'سبزی کوکو خردشده (تره، جعفری، گشنیز، شوید)', amount: '۴۰۰ گرم'},
        {name: 'تخم‌مرغ', amount: '۴ عدد'},
        {name: 'گردو خردشده', amount: 'نصف پیمانه'},
        {name: 'زرشک', amount: '۲ قاشق غذاخوری'},
        {name: 'آرد نخودچی یا گندم', amount: '۱ قاشق غذاخوری'},
        {name: 'زردچوبه، نمک و فلفل سیاه', amount: 'به مقدار لازم'},
      ],
      steps: [
        {
          title: 'آماده‌سازی سبزی و تخم‌مرغ',
          instruction: 'تخم‌مرغ‌ها را با زردچوبه و نمک بزنید تا کاملاً کف کند، سپس سبزی خشک و خردشده و آرد را اضافه کنید.',
          tip: 'سبزی باید کاملاً بدون آب باشد تا کوکو وا نرود.',
        },
        {
          title: 'تفت دادن گردو و زرشک',
          instruction: 'گردو و زرشک شسته‌شده را به مایه اضافه کرده و در تابه نچسب با کمی روغن گرم بریزید.',
        },
        {
          title: 'پخت دو طرفه و برش',
          instruction: 'روی حرارت ملایم ۱۰ دقیقه با در بسته و سپس ۷ دقیقه طرف دیگر را سرخ کنید تا مغزپخت شود.',
        },
      ],
      ratings: [5, 4, 5],
      comments: [],
    },
    {
      authorUsername: 'sarashpaz_mina',
      title: 'ته‌چین بادمجان و گردوی گیاهی (نسخه سبک)',
      description:
        'جایگزین گیاهی و سبک‌تر ته‌چین کلاسیک با بادمجان گریل‌شده، گردو، زرشک و برنج زعفرانی؛ سرشار از عطر اصیل ایرانی.',
      category: 'cooking',
      prepTime: 60,
      difficulty: 'medium',
      servings: 4,
      calories: 390,
      isVegetarian: true,
      isDiet: true,
      imageUrl: '/src/assets/images/hero_persian_kitchen_1795495624394.jpg',
      ingredients: [
        {name: 'برنج ایرانی', amount: '۲.۵ پیمانه'},
        {name: 'بادمجان', amount: '۳ عدد'},
        {name: 'ماست یونانی کم‌چرب', amount: '۱ پیمانه'},
        {name: 'تخم‌مرغ', amount: '۲ عدد'},
        {name: 'زعفران دم‌کرده', amount: '۳ قاشق غذاخوری'},
        {name: 'گردو خردشده و زرشک', amount: 'نصف پیمانه'},
      ],
      steps: [
        {
          title: 'گریل کردن ورقه‌های بادمجان',
          instruction: 'بادمجان‌ها را ورقه‌ای برش داده، نمک بزنید و پس از شستن با فرچه کمی روغن زده در تابه گریل کنید.',
        },
        {
          title: 'ترکیب مایه زعفرانی سبک',
          instruction: 'ماست یونانی کم‌چرب را با تخم‌مرغ، زعفران و کمی دارچین مخلوط کرده و نیمی از برنج آبکش‌شده را با آن ترکیب کنید.',
        },
        {
          title: 'دم کردن و سرو',
          instruction: 'لایه‌های برنج، بادمجان گریل، گردو و زرشک را بچینید و ۴۵ دقیقه با حرارت ملایم دم بگذارید.',
        },
      ],
      ratings: [5, 5],
      comments: [],
    },
  ];

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (
      author_id, author_username, title, description, category, prep_time,
      difficulty, servings, calories, is_vegetarian, is_diet, image_url,
      video_url, video_size_bytes, ingredients_json, steps_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)
  `);
  const insertRating = db.prepare('INSERT OR IGNORE INTO ratings (recipe_id, user_id, score) VALUES (?, ?, ?)');
  const insertComment = db.prepare('INSERT INTO comments (recipe_id, user_id, username, body) VALUES (?, ?, ?, ?)');

  const tx = db.transaction(() => {
    for (const s of seeds) {
      const authorId = userMap.get(s.authorUsername) ?? 1;
      const result = insertRecipe.run(
        authorId,
        s.authorUsername,
        s.title,
        s.description,
        s.category,
        s.prepTime,
        s.difficulty,
        s.servings,
        s.calories,
        s.isVegetarian ? 1 : 0,
        s.isDiet ? 1 : 0,
        s.imageUrl,
        JSON.stringify(s.ingredients),
        JSON.stringify(s.steps),
      );
      const recipeId = Number(result.lastInsertRowid);
      s.ratings.forEach((score, idx) => {
        const raterName = seedUsers[idx % seedUsers.length];
        const raterId = userMap.get(raterName) ?? 1;
        insertRating.run(recipeId, raterId, score);
      });
      for (const c of s.comments) {
        const commenterId = userMap.get(c.username) ?? 1;
        insertComment.run(recipeId, commenterId, c.username, c.body);
      }
    }
  });

  tx();
}

seedInitialData();

interface RawRecipeRow {
  id: number;
  author_id: number;
  author_username: string;
  title: string;
  description: string;
  category: string;
  prep_time: number;
  difficulty: string;
  servings: number;
  calories: number | null;
  is_vegetarian: number;
  is_diet: number;
  image_url: string;
  video_url: string | null;
  video_size_bytes: number | null;
  ingredients_json: string;
  steps_json: string;
  created_at: string;
  avg_rating: number | null;
  rating_count: number;
  comment_count: number;
  is_favorite?: number;
  user_rating?: number | null;
}

export function mapRecipeRow(row: RawRecipeRow): Recipe {
  let ingredients: IngredientItem[] = [];
  let steps: RecipeStep[] = [];
  try {
    ingredients = JSON.parse(row.ingredients_json);
  } catch {
    ingredients = [];
  }
  try {
    steps = JSON.parse(row.steps_json);
  } catch {
    steps = [];
  }

  return {
    id: row.id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    title: row.title,
    description: row.description,
    category: row.category as RecipeCategory,
    prepTime: row.prep_time,
    difficulty: row.difficulty as RecipeDifficulty,
    servings: row.servings,
    calories: row.calories,
    isVegetarian: Boolean(row.is_vegetarian),
    isDiet: Boolean(row.is_diet),
    imageUrl: row.image_url,
    videoUrl: row.video_url ?? null,
    videoSizeBytes: row.video_size_bytes ?? null,
    ingredients,
    steps,
    avgRating: row.avg_rating ? Math.round(row.avg_rating * 10) / 10 : 0,
    ratingCount: row.rating_count ?? 0,
    commentCount: row.comment_count ?? 0,
    isFavorite: Boolean(row.is_favorite),
    userRating: row.user_rating ?? null,
    createdAt: row.created_at,
  };
}

export function getRecipeById(recipeId: number, currentUserId: number | null): Recipe | null {
  const row = db
    .prepare(
      `
      SELECT r.*,
        COALESCE((SELECT AVG(score) FROM ratings WHERE recipe_id = r.id), 0) AS avg_rating,
        (SELECT COUNT(*) FROM ratings WHERE recipe_id = r.id) AS rating_count,
        (SELECT COUNT(*) FROM comments WHERE recipe_id = r.id) AS comment_count,
        CASE WHEN ? IS NOT NULL AND EXISTS (SELECT 1 FROM favorites WHERE recipe_id = r.id AND user_id = ?) THEN 1 ELSE 0 END AS is_favorite,
        CASE WHEN ? IS NOT NULL THEN (SELECT score FROM ratings WHERE recipe_id = r.id AND user_id = ?) ELSE NULL END AS user_rating
      FROM recipes r
      WHERE r.id = ?
    `,
    )
    .get(currentUserId, currentUserId, currentUserId, currentUserId, recipeId) as RawRecipeRow | undefined;

  if (!row) return null;

  const comments = db
    .prepare(
      `SELECT id, recipe_id AS recipeId, username, body, created_at AS createdAt
       FROM comments
       WHERE recipe_id = ?
       ORDER BY id DESC`,
    )
    .all(recipeId) as RecipeComment[];

  const mapped = mapRecipeRow(row);
  mapped.comments = comments;
  return mapped;
}
