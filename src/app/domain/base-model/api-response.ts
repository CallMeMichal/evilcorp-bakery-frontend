interface ApiResponse<T> {
  data: T[];
  detail: string;
  instance: string;
  status: number;
  success: boolean;
  timestamp: string;
  title: string;
  type: string;
}