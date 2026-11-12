const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8787';

export type AccessReason = 'free' | 'admin' | 'purchased' | 'subscription' | 'locked' | 'unavailable';
export interface Access {
  canRead: boolean;
  reason: AccessReason;
  previewPages: number;
  canPurchase: boolean;
}
export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  price: number;
  status: 'draft' | 'published' | 'archived';
  previewPages: number;
  coverEmoji: string;
  coverFrom: string;
  coverTo: string;
  coverUrl: string | null;
  readingMinutes: number;
  pageCount: number;
  access: Access;
}
export type Reaction = 'wiggle' | 'grow' | 'spin' | 'hop' | 'float';
export interface Sticker {
  emoji: string;
  x: number;
  y: number;
  sound: string;
  reaction: Reaction;
}
export interface Choice {
  emoji: string;
  label: string;
  correct: boolean;
}
export interface Question {
  prompt: string;
  choices: Choice[];
}
export interface PageActivity {
  stickers: Sticker[];
  question: Question | null;
}
export interface PageContent {
  position: number;
  text: string;
  emoji: string;
  imageUrl: string | null;
  activity: PageActivity | null;
}
export interface ReadResult {
  book: Book;
  pages: PageContent[];
  locked: boolean;
  totalPages: number;
}
export interface Plan {
  id: string;
  name: string;
  interval: 'month' | 'year';
  price: number;
  days: number;
  tagline: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}
export interface Me {
  user: User;
  subscription: null | {
    planId: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    state: 'active' | 'ending' | 'expired';
    /** In the free-trial period: access now, first charge when it ends. */
    trial: boolean;
    plan: Plan | null;
  };
  purchasedBookIds: string[];
  /** True until the account has ever subscribed: the next subscription starts with a free trial. */
  trialEligible: boolean;
  trialDays: number;
}
export interface Payment {
  id: string;
  kind: 'subscription' | 'book';
  refId: string;
  amount: number;
  status: 'succeeded' | 'failed';
  failureReason: string | null;
  last4: string | null;
  createdAt: string;
}
export interface Card {
  number: string;
  exp: string;
  cvc: string;
}
export interface BookDraft {
  title: string;
  author: string;
  summary: string;
  ageMin: number;
  ageMax: number;
  price: number;
  status: Book['status'];
  previewPages: number;
  coverEmoji: string;
  coverUrl: string | null;
  coverFrom: string;
  coverTo: string;
  readingMinutes: number;
  pages: { text: string; emoji: string; imageUrl: string | null; activity: PageActivity | null }[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

const TOKEN_KEY = 'ms_token';
export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string | null) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable (private mode): the session just won't survive a reload */
    }
  },
};

async function request<T>(method: string, path: string, body?: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.set(null); // stale token
    throw new ApiError(res.status, json.error?.code ?? 'ERROR', json.error?.message ?? 'Something went wrong', json.error?.details);
  }
  return json as T;
}

export const api = {
  login: (email: string, name?: string) => request<{ token: string; user: User }>('POST', '/v1/auth/login', { email, name }),
  me: () => request<Me>('GET', '/v1/me'),
  books: () => request<{ books: Book[] }>('GET', '/v1/books'),
  book: (key: string) => request<{ book: Book }>('GET', `/v1/books/${key}`),
  read: (key: string) => request<ReadResult>('GET', `/v1/books/${key}/read`),
  plans: () => request<{ plans: Plan[] }>('GET', '/v1/plans'),
  subscribe: (planId: string, card: Card, key: string) =>
    request<Me>('POST', '/v1/checkout/subscription', { planId, card }, { 'Idempotency-Key': key }),
  buy: (bookKey: string, card: Card, key: string) =>
    request<Me>('POST', `/v1/checkout/books/${bookKey}`, { card }, { 'Idempotency-Key': key }),
  cancel: () => request<Me>('POST', '/v1/subscription/cancel'),
  resume: () => request<Me>('POST', '/v1/subscription/resume'),
  history: () => request<{ payments: Payment[] }>('GET', '/v1/billing/history'),
  adminBook: (key: string) => request<{ book: BookDraft & { id: string; slug: string } }>('GET', `/v1/admin/books/${key}`),
  createBook: (b: BookDraft) => request<{ book: Book }>('POST', '/v1/books', b),
  updateBook: (key: string, b: BookDraft) => request<{ book: Book }>('PUT', `/v1/books/${key}`, b),
  deleteBook: (key: string) => request<{ archived: boolean }>('DELETE', `/v1/books/${key}`),
};

export const money = (n: number, currency = 'IDR') =>
  n === 0 ? 'Free' : new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
export const dateFmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
