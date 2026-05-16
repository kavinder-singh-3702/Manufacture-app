export default function GlobalLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
        <p className="text-sm font-semibold" style={{ color: "var(--medium-gray)" }}>
          Loading…
        </p>
      </div>
    </div>
  );
}
