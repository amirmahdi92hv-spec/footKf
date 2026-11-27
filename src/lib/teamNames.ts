/** Persian display names for well-known clubs. Matched by English-name keyword (order matters: first hit wins).
 *  A manual `name_fa` set in the admin panel always wins; unknown clubs fall back to the provider name. */
const MAP: [string, string][] = [
  ["manchester city", "منچسترسیتی"], ["manchester united", "منچستریونایتد"], ["liverpool", "لیورپول"], ["arsenal", "آرسنال"], ["chelsea", "چلسی"],
  ["tottenham", "تاتنهام"], ["newcastle", "نیوکاسل"], ["aston villa", "استون‌ویلا"], ["brighton", "برایتون"], ["west ham", "وست‌هام"], ["crystal palace", "کریستال‌پالاس"],
  ["fulham", "فولام"], ["brentford", "برنتفورد"], ["everton", "اورتون"], ["bournemouth", "بورنموث"], ["nottingham", "ناتینگهام‌فارست"], ["wolverhampton", "ولورهمپتون"],
  ["leeds", "لیدزیونایتد"], ["burnley", "برنلی"], ["sunderland", "ساندرلند"], ["leicester", "لسترسیتی"], ["southampton", "ساوثهمپتون"], ["ipswich", "ایپسویچ"],
  ["real madrid", "رئال‌مادرید"], ["barcelona", "بارسلونا"], ["atlético", "اتلتیکومادرید"], ["atletico", "اتلتیکومادرید"], ["athletic club", "اتلتیک‌بیلبائو"], ["sevilla", "سویا"],
  ["real betis", "رئال‌بتیس"], ["real sociedad", "رئال‌سوسیداد"], ["villarreal", "ویارئال"], ["valencia", "والنسیا"], ["girona", "خیرونا"], ["celta", "سلتاویگو"],
  ["osasuna", "اوساسونا"], ["getafe", "ختافه"], ["mallorca", "مایورکا"], ["espanyol", "اسپانیول"], ["rayo", "رایووایکانو"], ["alavés", "آلاوس"], ["levante", "لوانته"],
  ["bayern", "بایرن‌مونیخ"], ["dortmund", "بوروسیا‌دورتموند"], ["leverkusen", "بایرلورکوزن"], ["leipzig", "رب‌لایپزیگ"], ["frankfurt", "آینتراخت‌فرانکفورت"],
  ["stuttgart", "اشتوتگارت"], ["freiburg", "فرایبورگ"], ["gladbach", "مونشن‌گلادباخ"], ["mönchengladbach", "مونشن‌گلادباخ"], ["wolfsburg", "ولفسبورگ"], ["hoffenheim", "هوفنهایم"],
  ["werder", "وردربرمن"], ["union berlin", "یونیون‌برلین"], ["mainz", "ماینتس"], ["augsburg", "آگسبورگ"], ["st. pauli", "سن‌پاولی"], ["hamburg", "هامبورگ"], ["köln", "کلن"],
  ["juventus", "یوونتوس"], ["inter", "اینتر"], ["milan", "میلان"], ["napoli", "ناپولی"], ["roma", "رم"], ["lazio", "لاتزیو"], ["atalanta", "آتالانتا"], ["fiorentina", "فیورنتینا"],
  ["bologna", "بولونیا"], ["torino", "تورینو"], ["genoa", "جنوا"], ["udinese", "اودینزه"], ["como", "کومو"], ["cagliari", "کالیاری"], ["parma", "پارما"], ["lecce", "لچه"],
  ["paris saint", "پاری‌سن‌ژرمن"], ["marseille", "المپیک‌مارسی"], ["lyon", "المپیک‌لیون"], ["monaco", "موناکو"], ["lille", "لیل"], ["nice", "نیس"], ["rennes", "رن"], ["lens", "لنس"],
  ["benfica", "بنفیکا"], ["porto", "پورتو"], ["sporting", "اسپورتینگ"], ["braga", "براگا"], ["ajax", "آژاکس"], ["psv", "پ‌اس‌وی"], ["feyenoord", "فاینورد"],
  ["celtic", "سلتیک"], ["rangers", "رنجرز"], ["galatasaray", "گالاتاسرای"], ["fenerbah", "فنرباغچه"], ["beşiktaş", "بشیکتاش"], ["besiktas", "بشیکتاش"],
];
const norm = (s: string) => s.toLowerCase();

export function teamFa(name: string, manual?: string | null): string {
  if (manual) return manual;
  const n = norm(name);
  for (const [k, v] of MAP) if (n.includes(k)) return v;
  return name;
}
