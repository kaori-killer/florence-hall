import { Badge } from "./Badge";

type Props = {
  badge?: string;
  title: string;
  description?: string;
};

export function PageHeader({ badge, title, description }: Props) {
  return (
    <header className="space-y-3">
      {badge && (
        <Badge variant="accent" withDot>
          {badge}
        </Badge>
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
