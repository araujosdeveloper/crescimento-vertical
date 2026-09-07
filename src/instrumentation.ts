/**
 * Hooks de inicialização do servidor (Next.js instrumentation).
 *
 * Registra erros não capturados (uncaught exception / unhandled rejection) no
 * contador de métricas e no log estruturado, sem expor stack sensível.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const [{ recordError }, { log }] = await Promise.all([
    import("./lib/metrics"),
    import("./lib/logger"),
  ]);

  process.on("uncaughtException", (error) => {
    recordError();
    log("error", "uncaught_exception", { message: error?.message });
  });

  process.on("unhandledRejection", (reason) => {
    recordError();
    const message = reason instanceof Error ? reason.message : String(reason);
    log("error", "unhandled_rejection", { message });
  });
}
