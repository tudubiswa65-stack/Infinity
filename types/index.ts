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
