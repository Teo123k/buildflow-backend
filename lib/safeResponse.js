export function safeResponse(data) {
  return {
    success: data.success ?? false,
    error: data.error ?? null,
    fetch: data.fetch ?? null,
    structure: data.structure ?? null,
    tasks: data.tasks ?? [],
  };
}
