"use client";

import { Children, ReactNode, useId, useMemo, useState } from "react";

export type AccordionItem = {
  id: string;
  title: string;
  content?: ReactNode;
  children?: AccordionItem[];
};

type PolicyAccordionProps = {
  items: AccordionItem[];
  defaultOpenId?: string;
  level?: 1 | 2;
  className?: string;
};

function getDefaultOpenId(items: AccordionItem[], preferred?: string): string | null {
  if (preferred && items.some((item) => item.id === preferred)) {
    return preferred;
  }

  return items[0]?.id ?? null;
}

export default function PolicyAccordion({
  items,
  defaultOpenId,
  level = 1,
  className = "",
}: PolicyAccordionProps) {
  const firstItemId = useMemo(() => getDefaultOpenId(items, defaultOpenId), [defaultOpenId, items]);
  const [openId, setOpenId] = useState<string | null>(firstItemId);
  const groupId = useId().replace(/:/g, "");
  const resolvedOpenId = openId && items.some((item) => item.id === openId) ? openId : firstItemId;

  const levelClass = `policy-accordion-level-${level}`;

  return (
    <div className={`policy-accordion ${levelClass} ${className}`.trim()}>
      {items.map((item, index) => {
        const safeKey = item.id || `${level}-${index}`;
        const renderKey = `${level}-${safeKey}-${index}`;
        const headingId = `${groupId}-${safeKey}-heading`;
        const panelId = `${groupId}-${safeKey}-panel`;
        const isOpen = resolvedOpenId === item.id;
        const hasChildren = Boolean(item.children && item.children.length > 0);
        const HeadingTag = level === 1 ? "h2" : "h3";

        return (
          <section
            key={renderKey}
            id={item.id}
            className={`policy-accordion-item ${isOpen ? "is-open" : ""}`}
          >
            <HeadingTag className="policy-accordion-heading">
              <button
                type="button"
                id={headingId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="policy-accordion-trigger"
                onClick={() => setOpenId(item.id)}
              >
                <span className="policy-accordion-title">{item.title}</span>
                <span className="policy-accordion-icon" aria-hidden="true">
                  ▾
                </span>
              </button>
            </HeadingTag>

            <div id={panelId} role="region" aria-labelledby={headingId} className="policy-accordion-panel" hidden={!isOpen}>
              <div className="policy-accordion-panel-inner">
                {Children.toArray(item.content)}
                {hasChildren ? (
                  <PolicyAccordion
                    items={item.children as AccordionItem[]}
                    defaultOpenId={item.children?.[0]?.id}
                    level={2}
                  />
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
