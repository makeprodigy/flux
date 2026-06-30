const getBaseWSUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return apiUrl.replace(/^http/, 'ws');
};

type ProgressCallback = (progress: number, message: string) => void;
type CompleteCallback = (resultId: string) => void;
type FailedCallback = (error: string) => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private currentJobId: string | null = null;
  private onProgress: ProgressCallback | null = null;
  private onComplete: CompleteCallback | null = null;
  private onFailed: FailedCallback | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;

  connect(
    jobId: string,
    onProgress: ProgressCallback,
    onComplete: CompleteCallback,
    onFailed: FailedCallback,
  ): void {
    this.currentJobId = jobId;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onFailed = onFailed;
    this.manualClose = false;
    this.reconnectAttempts = 0;
    this._open();
  }

  private _open(): void {
    if (typeof window === 'undefined') return;

    try {
      const baseUrl = getBaseWSUrl();
      const wsUrl = new URL(baseUrl);
      const token = localStorage.getItem('flux_token');
      if (token) {
        wsUrl.searchParams.set('token', token);
      }
      this.socket = new WebSocket(wsUrl.toString());

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.socket && this.currentJobId) {
          this.socket.send(
            JSON.stringify({ type: 'subscribe', jobId: this.currentJobId }),
          );
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          this._handleMessage(data);
        } catch {
          // ignore malformed messages
        }
      };

      this.socket.onerror = () => {
        // onerror is always followed by onclose, so let onclose handle reconnect
      };

      this.socket.onclose = () => {
        if (this.manualClose) return;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts += 1;
          const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
          this.reconnectTimer = setTimeout(() => this._open(), delay);
        } else {
          this.onFailed?.('WebSocket connection lost after multiple retries.');
        }
      };
    } catch {
      this.onFailed?.('Failed to open WebSocket connection.');
    }
  }

  private _handleMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case 'job:progress':
        this.onProgress?.(
          (data.progress as number) ?? 0,
          (data.message as string) ?? '',
        );
        break;
      case 'job:complete':
        this.onComplete?.((data.resultId as string) ?? '');
        break;
      case 'job:failed':
        this.onFailed?.((data.error as string) ?? 'Job failed.');
        break;
      default:
        break;
    }
  }

  disconnect(): void {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentJobId = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onFailed = null;
    this.reconnectAttempts = 0;
  }
}

export const wsClient = new WSClient();
