export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center">
      <div
        className="w-12 h-12 rounded-full border-4 border-[#2552ca]/20 border-t-[#2552ca] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
