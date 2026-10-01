export type SafeErrorEvent =
  | 'request_error'
  | 'health_check_failed'
  | 'healthcheck_failed'
  | 'startup_failed'
  | 'shutdown_http_failed'
  | 'shutdown_database_failed';

type NodeEnv = 'development' | 'test' | 'production';
type ErrorLog = (...args: unknown[]) => void;

const SAFE_ERROR_DETAILS: Record<
  SafeErrorEvent,
  { code: string; message: string }
> = {
  request_error: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected request error',
  },
  health_check_failed: {
    code: 'HEALTH_CHECK_FAILED',
    message: 'Database health check failed',
  },
  healthcheck_failed: {
    code: 'HEALTHCHECK_FAILED',
    message: 'API healthcheck failed',
  },
  startup_failed: {
    code: 'STARTUP_FAILED',
    message: 'API startup failed',
  },
  shutdown_http_failed: {
    code: 'SHUTDOWN_HTTP_FAILED',
    message: 'HTTP server shutdown failed',
  },
  shutdown_database_failed: {
    code: 'SHUTDOWN_DATABASE_FAILED',
    message: 'Database shutdown failed',
  },
};

export function logSafeError(
  event: SafeErrorEvent,
  error: unknown,
  nodeEnv: NodeEnv,
  write: ErrorLog = console.error,
): void {
  if (nodeEnv !== 'production') {
    write(`[${event}]`, error);
    return;
  }

  write(JSON.stringify({ event, ...SAFE_ERROR_DETAILS[event] }));
}
