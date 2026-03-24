export interface Message {
  id: string;
  board_code: string;
  coord_x: number;
  coord_y: number;
  author_id: string;
  author_name: string;
  author_color: string;
  content: string;
  created_at: string;
  reply_to_id?: string | null;
  reply_count?: number | null;
  depth?: number | null;
}

export interface Stroke {
  id: string;
  board_code: string;
  points: Array<{ x: number; y: number }>;
  author_id: string;
  author_color: string;
  stroke_width: number;
  created_at: string;
}

export interface Identity {
  uid: string;
  name: string;
  color: string;
}

export type ToastSeverity = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  duration?: number;
}

export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetTime: number;
  isLimited: boolean;
}

export interface RateLimitState {
  messages: RateLimitStatus;
  strokes: RateLimitStatus;
}
