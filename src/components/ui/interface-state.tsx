import type { InterfaceStateContent } from "@/types/public";

type StateTone = "empty" | "error" | "success";

function InterfaceState({
  title,
  description,
  action,
  tone,
}: InterfaceStateContent & { tone: StateTone }) {
  return (
    <div className={`interface-state interface-state-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div className="interface-state-action">{action}</div> : null}
    </div>
  );
}

export function EmptyState(props: InterfaceStateContent) {
  return <InterfaceState {...props} tone="empty" />;
}

export function ErrorState(props: InterfaceStateContent) {
  return <InterfaceState {...props} tone="error" />;
}

export function SuccessState(props: InterfaceStateContent) {
  return <InterfaceState {...props} tone="success" />;
}
