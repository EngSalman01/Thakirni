export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div
        className="w-12 h-12 rounded-full border-4 border-amber-600/20 border-t-amber-600 animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
