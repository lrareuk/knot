"use client";

import type { ReactNode } from "react";

type ModuleSectionProps = {
  title?: string;
  description?: string;
  kicker?: string;
  className?: string;
  children: ReactNode;
};

export default function ModuleSection({ title, description, kicker, className, children }: ModuleSectionProps) {
  const sectionClassName = `onboarding-module-section${className ? ` ${className}` : ""}`;
  const hasHeader = Boolean(kicker || title || description);

  return (
    <section className={sectionClassName}>
      {hasHeader ? (
        <header className="onboarding-module-section-head">
          {kicker ? <p className="onboarding-module-section-kicker">{kicker}</p> : null}
          {title ? <h2 className="onboarding-module-section-title">{title}</h2> : null}
          {description ? <p className="onboarding-module-section-copy">{description}</p> : null}
        </header>
      ) : null}
      <div className="onboarding-module-section-body">{children}</div>
    </section>
  );
}
