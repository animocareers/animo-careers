interface StatCalloutProps {
  value: string;
  label: string;
}

export function StatCallout({ value, label }: StatCalloutProps) {
  return (
    <div className="inline-flex flex-col items-center rounded-3xl bg-gradient-card px-8 py-6 text-center">
      <span className="text-gradient text-4xl font-black">{value}</span>
      <span className="mt-1 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
