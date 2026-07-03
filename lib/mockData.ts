// Supabase 接続前の暫定データ。モックの数字と同一。
// 実装が進んだら useQuery / supabase.from() に差し替える。

export type CustomerStatus = 'good' | 'stall' | 'follow';

export type Customer = {
  id: string;
  name: string;
  branch: string;
  address: string;
  businessType: string;
  status: CustomerStatus;
  lastOrderedAt: string;          // ISO
  monthSalesJpy: number;
  totalSalesJpy: number;
  monthMarginJpy: number;
  painPoints: string[];
};

export type Product = {
  id: string;
  name: string;
  maker: string;
  category: string;
  unitPriceJpy: number;
  imageUrl: string;
  pitch: string;
  painSolution: string;
  targetTypes: string[];
  fitScore?: number;
};

export type OrderItem = {
  id: string;
  orderedAt: string;
  customerName: string;
  productName: string;
  quantity: number;
  subtotalJpy: number;
  rangerCommissionJpy: number;
  status: 'pending' | 'confirmed' | 'paid';
};

export type NotificationItem = {
  id: string;
  type: 'order' | 'achievement' | 'alert' | 'recommend' | 'progress';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type ShowroomInvite = {
  id: string;
  customerName: string;
  scheduledAt: string;
  status: 'invited' | 'confirmed' | 'visited';
  tastedProducts?: string[];
  memo?: string;
};

// -----------------------------------------------------
// サンプルデータ
// -----------------------------------------------------

export const rangerProfile = {
  name: '田中 健一',
  code: 'R-0001',
  rank: 'silver' as const,
  monthlyGoalJpy: 1_240_000,
  avatarInitial: '田',
};

export const homeKpis = {
  monthSalesJpy: 842_000,
  prevMonthSalesJpy: 752_000,
  monthGrowthPct: 0.12,
  goalProgressPct: 0.68,
  remainingToGoalJpy: 398_000,
  estimatedMarginJpy: 42_100,
  estimatedMarginDeltaJpy: 4_500,
  cumulativeMarginJpy: 356_800,        // paid を含む全期間マージン
  cumulativeUnpaidMarginJpy: 98_300,   // 未払い分のみ
  customerCount: 12,
  customersGood: 8,
  customersFollow: 2,
  newOrdersCount: 24,
  newOrdersDelta: 6,
};

export const todayTodos = [
  { id: 't1', color: 'red',     title: 'SAHANJIをフォロー', sub: '35日未発注・電話推奨', link: 'customers' },
  { id: 't2', color: 'amber',   title: '鼎泰豊に新商品「レンフラ メロン」を提案', sub: '適合度 92%・特許出願中', link: 'products' },
  { id: 't3', color: 'emerald', title: 'ショールーム来場 14:00', sub: 'KOI 佐々木様ご来場', link: 'showroom' },
];

export const customers: Customer[] = [
  {
    id: 'c-001', name: '鼎泰豊', branch: '東京駅八重洲口店', address: '東京都千代田区',
    businessType: '中華', status: 'good',
    lastOrderedAt: '2026-04-18T10:00:00+09:00',
    monthSalesJpy: 262_000, totalSalesJpy: 1_840_000, monthMarginJpy: 13_100,
    painPoints: ['人手不足'],
  },
  {
    id: 'c-002', name: 'SAHANJI', branch: 'ゆめタウン別府店', address: '大分県別府市',
    businessType: 'カフェ', status: 'follow',
    lastOrderedAt: '2026-03-17T14:00:00+09:00',
    monthSalesJpy: 76_000, totalSalesJpy: 584_000, monthMarginJpy: 3_800,
    painPoints: ['客単価が伸びない', '若年層が少ない'],
  },
  {
    id: 'c-003', name: 'KOI The', branch: 'なんば店', address: '大阪府大阪市',
    businessType: 'ドリンク', status: 'stall',
    lastOrderedAt: '2026-03-10T11:00:00+09:00',
    monthSalesJpy: 0, totalSalesJpy: 920_000, monthMarginJpy: 0,
    painPoints: ['新メニュー導入'],
  },
  {
    id: 'c-004', name: '台湾甜商店', branch: 'ららぽーと和泉店', address: '大阪府和泉市',
    businessType: 'スイーツ', status: 'good',
    lastOrderedAt: '2026-04-15T09:00:00+09:00',
    monthSalesJpy: 190_000, totalSalesJpy: 1_120_000, monthMarginJpy: 9_500,
    painPoints: ['テイクアウトが弱い'],
  },
  {
    id: 'c-005', name: '四季旬菜里山・囲炉裏', branch: '', address: '兵庫県神戸市',
    businessType: '和食', status: 'good',
    lastOrderedAt: '2026-04-10T12:00:00+09:00',
    monthSalesJpy: 162_000, totalSalesJpy: 860_000, monthMarginJpy: 8_100,
    painPoints: ['原価率を守りたい'],
  },
  {
    id: 'c-006', name: 'WILLCha', branch: '心斎橋店', address: '大阪府大阪市',
    businessType: 'ドリンク', status: 'good',
    lastOrderedAt: '2026-04-20T15:00:00+09:00',
    monthSalesJpy: 152_000, totalSalesJpy: 640_000, monthMarginJpy: 7_600,
    painPoints: ['他店との差別化'],
  },
];

export const products: Product[] = [
  {
    id: 'p-001', name: 'レンフラ メロン', maker: 'レンフラジャパン', category: 'ドリンク',
    unitPriceJpy: 380,
    imageUrl: 'https://makeshop-multi-images.akamaized.net/foodboat/shopimages/renfra-melon.jpg',
    pitch: '「若い女性に刺さる高級感を、客単価+200円で」と伝える。SNS映えするメロン色が主婦層のリピートを生みます。',
    painSolution: '客単価が伸びない悩みに、SNS映えメロン色で単価UP',
    targetTypes: ['カフェ', 'スイーツ'], fitScore: 0.92,
  },
  {
    id: 'p-002', name: 'クラフト80 ピーチ', maker: 'クラフト80', category: 'ドリンク',
    unitPriceJpy: 420,
    imageUrl: 'https://makeshop-multi-images.akamaized.net/foodboat/shopimages/craft80-peach.jpg',
    pitch: '「注ぐだけで完成するクラフト感」。新人でも回せる、店舗展開を止めない一本。',
    painSolution: 'オペ簡素化＋差別化を両立',
    targetTypes: ['多店舗カフェ', '居酒屋'], fitScore: 0.85,
  },
  {
    id: 'p-003', name: '茶スプレッソ アールグレイ', maker: '茶スプレッソ', category: 'ドリンク',
    unitPriceJpy: 450,
    imageUrl: 'https://makeshop-multi-images.akamaized.net/foodboat/shopimages/chaspresso-earlgrey.jpg',
    pitch: '「既存のエスプレッソマシンで本格紅茶」。新規投資ゼロで新メニュー追加可能。',
    painSolution: '新メニュー導入ハードルを下げる',
    targetTypes: ['コーヒー専門店', 'ベーカリーカフェ'], fitScore: 0.78,
  },
  {
    id: 'p-004', name: 'MDタピオカ黒糖', maker: 'MDフード', category: 'スイーツ',
    unitPriceJpy: 380,
    imageUrl: 'https://makeshop-multi-images.akamaized.net/foodboat/shopimages/md-tapioca-kokuto.jpg',
    pitch: '「黒糖の深い甘さとモチモチタピオカ」。テイクアウト需要を取り込める。',
    painSolution: 'テイクアウト売上の底上げ',
    targetTypes: ['スイーツ', 'ドリンクスタンド'], fitScore: 0.71,
  },
  {
    id: 'p-005', name: 'フングイ 55g', maker: 'フングイ商事', category: '食材',
    unitPriceJpy: 680,
    imageUrl: 'https://makeshop-multi-images.akamaized.net/foodboat/shopimages/fungui-55g.jpg',
    pitch: '「本格中華の香り、少量使いで原価率を守る」。ベテラン料理人にも刺さります。',
    painSolution: '原価率を守りつつ本格感UP',
    targetTypes: ['中華', '本格飲食'], fitScore: 0.66,
  },
];

export const recentOrders: OrderItem[] = [
  { id: 'o-1', orderedAt: '2026-04-20T15:00:00+09:00', customerName: 'WILLCha 心斎橋店', productName: 'レンフラ メロン',    quantity: 400, subtotalJpy: 152_000, rangerCommissionJpy: 3_040, status: 'confirmed' },
  { id: 'o-2', orderedAt: '2026-04-18T10:00:00+09:00', customerName: '鼎泰豊 東京駅',     productName: 'フングイ 55g',     quantity: 200, subtotalJpy: 136_000, rangerCommissionJpy: 2_720, status: 'confirmed' },
  { id: 'o-3', orderedAt: '2026-04-18T10:00:00+09:00', customerName: '鼎泰豊 東京駅',     productName: 'クラフト80 ピーチ', quantity: 300, subtotalJpy: 126_000, rangerCommissionJpy: 2_520, status: 'confirmed' },
  { id: 'o-4', orderedAt: '2026-04-15T09:00:00+09:00', customerName: '台湾甜商店 ららぽ', productName: 'MDタピオカ黒糖',    quantity: 500, subtotalJpy: 190_000, rangerCommissionJpy: 3_800, status: 'pending'   },
  { id: 'o-5', orderedAt: '2026-04-10T12:00:00+09:00', customerName: '四季旬菜 囲炉裏',   productName: '茶スプレッソ',     quantity: 360, subtotalJpy: 162_000, rangerCommissionJpy: 3_240, status: 'confirmed' },
  { id: 'o-6', orderedAt: '2026-04-05T14:00:00+09:00', customerName: 'SAHANJI 別府',      productName: 'レンフラ メロン',    quantity: 200, subtotalJpy: 76_000,  rangerCommissionJpy: 1_520, status: 'paid'      },
];

export const notifications: NotificationItem[] = [
  { id: 'n-1', type: 'order',       title: '受注が入りました', body: 'WILLCha 心斎橋店からレンフラ メロン ×400',     createdAt: '2026-04-20T15:04:00+09:00', read: false },
  { id: 'n-2', type: 'achievement', title: '今月報酬5万円突破まで残り¥7,900',    body: '次の1受注で到達します',                      createdAt: '2026-04-19T18:00:00+09:00', read: false },
  { id: 'n-3', type: 'alert',       title: 'SAHANJI が35日未発注',                body: '電話または訪問を推奨します',                  createdAt: '2026-04-19T09:00:00+09:00', read: true  },
  { id: 'n-4', type: 'recommend',   title: '鼎泰豊×レンフラ メロン 適合度92%',   body: '次回訪問でご提案ください',                    createdAt: '2026-04-18T07:00:00+09:00', read: true  },
  { id: 'n-5', type: 'progress',    title: '今月目標まであと2店舗',                body: '新規受注2件で達成です',                       createdAt: '2026-04-17T07:00:00+09:00', read: true  },
];

export const rankings = [
  { rank: 1, name: '佐藤 良太', score: 1_820_000, rankLabel: 'platinum' },
  { rank: 2, name: '山本 美咲', score: 1_460_000, rankLabel: 'gold'     },
  { rank: 3, name: '鈴木 大輔', score: 1_210_000, rankLabel: 'gold'     },
  { rank: 4, name: '田中 健一 (あなた)', score: 842_000, rankLabel: 'silver', me: true },
  { rank: 5, name: '高橋 あゆみ', score: 680_000, rankLabel: 'silver' },
  { rank: 6, name: '中村 智', score: 540_000, rankLabel: 'bronze' },
];

export const badges = [
  { code: 'first_order',    name: '初受注',             earned: true  },
  { code: 'goal_100k',      name: '10万円達成',         earned: true  },
  { code: 'goal_500k',      name: '50万円達成',         earned: true  },
  { code: 'loyal_customer', name: 'リピーターマスター', earned: false },
  { code: 'showroom_pro',   name: 'ショールーム案内人', earned: false },
];

export const showroomInvites: ShowroomInvite[] = [
  { id: 's-1', customerName: 'KOI The なんば店',         scheduledAt: '2026-04-21T14:00:00+09:00', status: 'confirmed', tastedProducts: ['茶スプレッソ アールグレイ'], memo: '佐々木様ご来場。新メニュー検討中' },
  { id: 's-2', customerName: 'SAHANJI ゆめタウン別府店', scheduledAt: '2026-04-25T11:00:00+09:00', status: 'invited',   memo: '客単価UP提案の現地試食' },
  { id: 's-3', customerName: '台湾甜商店 ららぽーと和泉店', scheduledAt: '2026-04-28T13:00:00+09:00', status: 'invited',   memo: 'テイクアウト向け新商品試食' },
  { id: 's-4', customerName: '四季旬菜 里山・囲炉裏',    scheduledAt: '2026-04-12T15:00:00+09:00', status: 'visited',   tastedProducts: ['フングイ 55g'], memo: '本格中華素材を試食。高評価' },
];

export const monthlyTrend = [
  { month: '2025/11', sales: 540_000 },
  { month: '2025/12', sales: 612_000 },
  { month: '2026/01', sales: 688_000 },
  { month: '2026/02', sales: 710_000 },
  { month: '2026/03', sales: 752_000 },
  { month: '2026/04', sales: 842_000 },
];
