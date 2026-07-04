export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: ChatAction;
}

export interface ChatAction {
  type: "generate_design" | "add_to_cart" | "change_color" | "change_position";
  payload: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  designId: string | null;
  status: "active" | "completed" | "abandoned";
}
