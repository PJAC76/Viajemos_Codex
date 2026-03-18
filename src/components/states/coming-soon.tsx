import { EmptyState } from "./empty-state";

export function ComingSoonState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return <EmptyState title={title} description={description} actionLabel="Disponible en siguiente modulo" />;
}
