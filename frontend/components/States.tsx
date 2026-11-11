export const Spinner = () => (
  <div className="flex justify-center py-24">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
  </div>
);

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-20 text-center text-sm text-muted">{children}</div>
);
