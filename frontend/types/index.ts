export type MessageRole = "user" | "ai";

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export type VisualizationType = "bar" | "line" | "pie";

export interface Visualization {
  type: VisualizationType;
  labels: string[];
  values: number[];
  x_label?: string;
  y_label?: string;
  title?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  data?: TableData;
  visualization?: Visualization;
  sql?: string;
  timestamp: number;
  isPending?: boolean;
  isError?: boolean;
}

export interface ApiRequest {
  message: string;
  session_id: string;
}

export interface ApiResponse {
  response: string;
  data?: TableData;
  visualization?: Visualization;
  sql?: string;
}

export type HistoryItemType = "text" | "table" | "chart";

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: HistoryItemType;
  userMessageId: string;
  aiMessageId: string;
}
