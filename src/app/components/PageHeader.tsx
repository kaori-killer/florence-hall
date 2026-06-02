type Props = {
  badge?: string;
  title: string;
  description?: string;
};

export function PageHeader({ badge, title, description }: Props) {
  return (
    <header className="space-y-3">
      {badge && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {badge}
        </span>
      )}
      <h1 className="text-[28px] font-bold tracking-tight text-foreground sm:text-[32px]">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-foreground-2">
          {description}
        </p>
      )}
    </header>
  );
}
