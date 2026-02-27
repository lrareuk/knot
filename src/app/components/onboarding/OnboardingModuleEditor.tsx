"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createEmptyDebt,
  createEmptyDependant,
  createEmptyPension,
  createEmptyProperty,
  createEmptySavings,
  type OnboardingModule,
} from "@/lib/domain/defaults";
import { isModuleComplete } from "@/lib/domain/onboarding";
import type { DebtItem, DependantItem, FinancialPosition, PensionItem, PropertyItem, SavingsItem } from "@/lib/domain/types";
import { ONBOARDING_MODULE_META } from "@/lib/ui/paths";

type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  module: OnboardingModule;
  initialPosition: FinancialPosition;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function SectionShell({ children, title, help }: { children: ReactNode; title: string; help: string }) {
  return (
    <section className="panel stack-md">
      <div>
        <h2>{title}</h2>
        <p className="muted">{help}</p>
      </div>
      {children}
    </section>
  );
}

function EstimatedToggle({ checked, onChange }: { checked?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-control">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      Estimated
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  estimated,
  onEstimatedChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  estimated?: boolean;
  onEstimatedChange?: (value: boolean) => void;
}) {
  return (
    <div className="stack-xs">
      <label>{label}</label>
      <input type="number" value={value} onChange={(event) => onChange(toNumber(event.target.value))} />
      {onEstimatedChange ? <EstimatedToggle checked={estimated} onChange={onEstimatedChange} /> : null}
    </div>
  );
}

export default function OnboardingModuleEditor({ module, initialPosition }: Props) {
  const [position, setPosition] = useState<FinancialPosition>(initialPosition);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const dirtyRef = useRef(false);

  const moduleCompletion = useMemo(() => {
    return ONBOARDING_MODULE_META.map((entry) => ({
      ...entry,
      complete: isModuleComplete(entry.key, position),
    }));
  }, [position]);

  useEffect(() => {
    if (!dirtyRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveState("saving");
      const response = await fetch("/api/financial-position", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(position),
      });

      if (response.ok) {
        dirtyRef.current = false;
        setSaveState("saved");
        setLastSaved(Date.now());
        return;
      }

      setSaveState("error");
    }, 500);

    return () => clearTimeout(timer);
  }, [position]);

  const updatePosition = (next: FinancialPosition) => {
    dirtyRef.current = true;
    setPosition(next);
  };

  const saveText = (() => {
    if (saveState === "saving") {
      return "Saving...";
    }
    if (saveState === "saved" && lastSaved) {
      return `Saved at ${new Date(lastSaved).toLocaleTimeString("en-GB")}`;
    }
    if (saveState === "error") {
      return "Unable to save. Check connection and continue editing.";
    }
    return "Auto-save enabled";
  })();

  return (
    <div className="page-shell">
      <div className="layout-two-col onboarding-layout">
        <aside className="panel stack-sm sticky-top">
          <h2>Onboarding progress</h2>
          <p className="muted">You can complete modules in any order.</p>
          <nav className="stack-xs">
            {moduleCompletion.map((entry) => (
              <Link key={entry.key} href={entry.path} className={`module-link ${entry.key === module ? "active" : ""}`}>
                <span>{entry.title}</span>
                <span className={entry.complete ? "pill-success" : "pill-muted"}>{entry.complete ? "Complete" : "Pending"}</span>
              </Link>
            ))}
          </nav>
          <Link href="/onboarding/review" className="ui-btn-secondary">
            Review all modules
          </Link>
          <p className="muted">{saveText}</p>
        </aside>

        <div className="stack-lg">
          {module === "key-dates" ? (
            <SectionShell
              title="Key dates"
              help="These dates define the matrimonial property period for your modelled outcomes."
            >
              <label>
                Date of marriage
                <input
                  type="date"
                  value={position.date_of_marriage ?? ""}
                  onChange={(event) =>
                    updatePosition({
                      ...position,
                      date_of_marriage: event.target.value || null,
                    })
                  }
                />
              </label>

              <label>
                Date of separation
                <input
                  type="date"
                  value={position.date_of_separation ?? ""}
                  onChange={(event) =>
                    updatePosition({
                      ...position,
                      date_of_separation: event.target.value || null,
                    })
                  }
                />
              </label>
            </SectionShell>
          ) : null}

          {module === "property" ? (
            <SectionShell
              title="Property"
              help="Add properties and ownership details. This helps model equity and housing costs under different outcomes."
            >
              {position.properties.map((property, index) => (
                <PropertyEditor
                  key={property.id}
                  item={property}
                  onChange={(next) => {
                    const properties = [...position.properties];
                    properties[index] = next;
                    updatePosition({ ...position, properties });
                  }}
                  onRemove={() => {
                    updatePosition({
                      ...position,
                      properties: position.properties.filter((entry) => entry.id !== property.id),
                    });
                  }}
                />
              ))}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => updatePosition({ ...position, properties: [...position.properties, createEmptyProperty()] })}
              >
                Add another property
              </button>
            </SectionShell>
          ) : null}

          {module === "income" ? (
            <SectionShell
              title="Income"
              help="Enter both parties' current income. These figures drive monthly surplus and deficit modelling."
            >
              <NumberField
                label="Your gross annual income"
                value={position.income.user_gross_annual}
                estimated={position.income.user_gross_annual_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    income: { ...position.income, user_gross_annual_estimated: checked },
                  })
                }
                onChange={(value) => updatePosition({ ...position, income: { ...position.income, user_gross_annual: value } })}
              />

              <NumberField
                label="Your net monthly income"
                value={position.income.user_net_monthly}
                estimated={position.income.user_net_monthly_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    income: { ...position.income, user_net_monthly_estimated: checked },
                  })
                }
                onChange={(value) => updatePosition({ ...position, income: { ...position.income, user_net_monthly: value } })}
              />

              <NumberField
                label="Partner gross annual income"
                value={position.income.partner_gross_annual}
                estimated={position.income.partner_gross_annual_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    income: { ...position.income, partner_gross_annual_estimated: checked },
                  })
                }
                onChange={(value) => updatePosition({ ...position, income: { ...position.income, partner_gross_annual: value } })}
              />

              <NumberField
                label="Partner net monthly income"
                value={position.income.partner_net_monthly}
                estimated={position.income.partner_net_monthly_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    income: { ...position.income, partner_net_monthly_estimated: checked },
                  })
                }
                onChange={(value) => updatePosition({ ...position, income: { ...position.income, partner_net_monthly: value } })}
              />

              <NumberField
                label="Other monthly income"
                value={position.income.other_income}
                estimated={position.income.other_income_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    income: { ...position.income, other_income_estimated: checked },
                  })
                }
                onChange={(value) => updatePosition({ ...position, income: { ...position.income, other_income: value } })}
              />

              <label>
                Other income holder
                <select
                  value={position.income.other_income_holder}
                  onChange={(event) =>
                    updatePosition({
                      ...position,
                      income: {
                        ...position.income,
                        other_income_holder: event.target.value as FinancialPosition["income"]["other_income_holder"],
                      },
                    })
                  }
                >
                  <option value="user">User</option>
                  <option value="partner">Partner</option>
                  <option value="joint">Joint</option>
                </select>
              </label>
            </SectionShell>
          ) : null}

          {module === "pensions" ? (
            <SectionShell
              title="Pensions"
              help="Add pension values for both parties. Splits are modelled outcomes, not legal entitlement calculations."
            >
              {position.pensions.map((pension, index) => (
                <PensionEditor
                  key={pension.id}
                  item={pension}
                  onChange={(next) => {
                    const pensions = [...position.pensions];
                    pensions[index] = next;
                    updatePosition({ ...position, pensions });
                  }}
                  onRemove={() => {
                    updatePosition({
                      ...position,
                      pensions: position.pensions.filter((entry) => entry.id !== pension.id),
                    });
                  }}
                />
              ))}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => updatePosition({ ...position, pensions: [...position.pensions, createEmptyPension()] })}
              >
                Add another pension
              </button>
            </SectionShell>
          ) : null}

          {module === "savings-investments" ? (
            <SectionShell
              title="Savings & investments"
              help="Record liquid and invested assets held by you, your partner, or jointly."
            >
              {position.savings.map((savings, index) => (
                <SavingsEditor
                  key={savings.id}
                  item={savings}
                  onChange={(next) => {
                    const nextSavings = [...position.savings];
                    nextSavings[index] = next;
                    updatePosition({ ...position, savings: nextSavings });
                  }}
                  onRemove={() => {
                    updatePosition({
                      ...position,
                      savings: position.savings.filter((entry) => entry.id !== savings.id),
                    });
                  }}
                />
              ))}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => updatePosition({ ...position, savings: [...position.savings, createEmptySavings()] })}
              >
                Add another savings item
              </button>
            </SectionShell>
          ) : null}

          {module === "debts" ? (
            <SectionShell
              title="Debts"
              help="Mortgages are captured under properties. Add all other debts and monthly repayment obligations here."
            >
              {position.debts.map((debt, index) => (
                <DebtEditor
                  key={debt.id}
                  item={debt}
                  onChange={(next) => {
                    const debts = [...position.debts];
                    debts[index] = next;
                    updatePosition({ ...position, debts });
                  }}
                  onRemove={() => {
                    updatePosition({
                      ...position,
                      debts: position.debts.filter((entry) => entry.id !== debt.id),
                    });
                  }}
                />
              ))}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => updatePosition({ ...position, debts: [...position.debts, createEmptyDebt()] })}
              >
                Add another debt
              </button>
            </SectionShell>
          ) : null}

          {module === "dependants-expenditure" ? (
            <SectionShell
              title="Dependants & expenditure"
              help="Dependants are recorded by age and living arrangement only. No names are collected."
            >
              {position.dependants.map((dependant, index) => (
                <DependantEditor
                  key={dependant.id}
                  item={dependant}
                  onChange={(next) => {
                    const dependants = [...position.dependants];
                    dependants[index] = next;
                    updatePosition({ ...position, dependants });
                  }}
                  onRemove={() => {
                    updatePosition({
                      ...position,
                      dependants: position.dependants.filter((entry) => entry.id !== dependant.id),
                    });
                  }}
                />
              ))}
              <button
                type="button"
                className="ui-btn-secondary"
                onClick={() => updatePosition({ ...position, dependants: [...position.dependants, createEmptyDependant()] })}
              >
                Add dependant
              </button>

              <div className="divider" />

              <h3>Monthly expenditure</h3>
              <NumberField
                label="Housing"
                value={position.expenditure.housing}
                estimated={position.expenditure.housing_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, housing_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, housing: value },
                  })
                }
              />
              <NumberField
                label="Utilities"
                value={position.expenditure.utilities}
                estimated={position.expenditure.utilities_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, utilities_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, utilities: value },
                  })
                }
              />
              <NumberField
                label="Council tax"
                value={position.expenditure.council_tax}
                estimated={position.expenditure.council_tax_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, council_tax_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, council_tax: value },
                  })
                }
              />
              <NumberField
                label="Food"
                value={position.expenditure.food}
                estimated={position.expenditure.food_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, food_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, food: value },
                  })
                }
              />
              <NumberField
                label="Transport"
                value={position.expenditure.transport}
                estimated={position.expenditure.transport_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, transport_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, transport: value },
                  })
                }
              />
              <NumberField
                label="Childcare"
                value={position.expenditure.childcare}
                estimated={position.expenditure.childcare_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, childcare_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, childcare: value },
                  })
                }
              />
              <NumberField
                label="Insurance"
                value={position.expenditure.insurance}
                estimated={position.expenditure.insurance_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, insurance_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, insurance: value },
                  })
                }
              />
              <NumberField
                label="Personal"
                value={position.expenditure.personal}
                estimated={position.expenditure.personal_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, personal_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, personal: value },
                  })
                }
              />
              <NumberField
                label="Other"
                value={position.expenditure.other}
                estimated={position.expenditure.other_estimated}
                onEstimatedChange={(checked) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, other_estimated: checked },
                  })
                }
                onChange={(value) =>
                  updatePosition({
                    ...position,
                    expenditure: { ...position.expenditure, other: value },
                  })
                }
              />
            </SectionShell>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PropertyEditor({
  item,
  onChange,
  onRemove,
}: {
  item: PropertyItem;
  onChange: (item: PropertyItem) => void;
  onRemove: () => void;
}) {
  return (
    <article className="panel stack-sm nested-panel">
      <label>
        Property label
        <input value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} />
      </label>
      <NumberField
        label="Current value"
        value={item.current_value}
        estimated={item.current_value_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, current_value_estimated: checked })}
        onChange={(value) => onChange({ ...item, current_value: value, equity: value - item.mortgage_outstanding })}
      />
      <p className="muted">
        If you do not know your property value, use{" "}
        <a
          href="https://www.zoopla.co.uk/home-values/"
          target="_blank"
          rel="noreferrer"
          className="inline-link"
        >
          Zoopla&apos;s valuation tool
        </a>
        . You can still enter your own estimate here.
      </p>
      <NumberField
        label="Mortgage outstanding"
        value={item.mortgage_outstanding}
        estimated={item.mortgage_outstanding_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, mortgage_outstanding_estimated: checked })}
        onChange={(value) => onChange({ ...item, mortgage_outstanding: value, equity: item.current_value - value })}
      />
      <NumberField
        label="Monthly property cost"
        value={item.monthly_cost}
        estimated={item.monthly_cost_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, monthly_cost_estimated: checked })}
        onChange={(value) => onChange({ ...item, monthly_cost: value })}
      />

      <label>
        Ownership
        <select value={item.ownership} onChange={(event) => onChange({ ...item, ownership: event.target.value as PropertyItem["ownership"] })}>
          <option value="joint">Joint</option>
          <option value="sole_user">Sole (user)</option>
          <option value="sole_partner">Sole (partner)</option>
        </select>
      </label>

      <label className="inline-control">
        <input type="checkbox" checked={item.is_matrimonial} onChange={(event) => onChange({ ...item, is_matrimonial: event.target.checked })} />
        Acquired during the marriage period
      </label>

      <button type="button" className="ui-btn-danger" onClick={onRemove}>
        Remove property
      </button>
    </article>
  );
}

function PensionEditor({
  item,
  onChange,
  onRemove,
}: {
  item: PensionItem;
  onChange: (item: PensionItem) => void;
  onRemove: () => void;
}) {
  return (
    <article className="panel stack-sm nested-panel">
      <label>
        Pension label
        <input value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} />
      </label>
      <label>
        Holder
        <select value={item.holder} onChange={(event) => onChange({ ...item, holder: event.target.value as PensionItem["holder"] })}>
          <option value="user">User</option>
          <option value="partner">Partner</option>
        </select>
      </label>
      <label>
        Pension type
        <select
          value={item.pension_type}
          onChange={(event) => onChange({ ...item, pension_type: event.target.value as PensionItem["pension_type"] })}
        >
          <option value="defined_contribution">Defined contribution</option>
          <option value="defined_benefit">Defined benefit</option>
          <option value="state">State pension</option>
        </select>
      </label>
      <NumberField
        label="Current value"
        value={item.current_value}
        estimated={item.current_value_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, current_value_estimated: checked })}
        onChange={(value) => onChange({ ...item, current_value: value })}
      />
      <NumberField
        label="Annual amount (for DB pension, optional)"
        value={item.annual_amount ?? 0}
        estimated={item.annual_amount_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, annual_amount_estimated: checked })}
        onChange={(value) => onChange({ ...item, annual_amount: value })}
      />
      <label className="inline-control">
        <input type="checkbox" checked={item.is_matrimonial} onChange={(event) => onChange({ ...item, is_matrimonial: event.target.checked })} />
        Acquired during the marriage period
      </label>
      <button type="button" className="ui-btn-danger" onClick={onRemove}>
        Remove pension
      </button>
    </article>
  );
}

function SavingsEditor({
  item,
  onChange,
  onRemove,
}: {
  item: SavingsItem;
  onChange: (item: SavingsItem) => void;
  onRemove: () => void;
}) {
  return (
    <article className="panel stack-sm nested-panel">
      <label>
        Savings label
        <input value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} />
      </label>
      <label>
        Holder
        <select value={item.holder} onChange={(event) => onChange({ ...item, holder: event.target.value as SavingsItem["holder"] })}>
          <option value="user">User</option>
          <option value="partner">Partner</option>
          <option value="joint">Joint</option>
        </select>
      </label>
      <label>
        Type
        <select value={item.type} onChange={(event) => onChange({ ...item, type: event.target.value as SavingsItem["type"] })}>
          <option value="cash">Cash</option>
          <option value="isa">ISA</option>
          <option value="investment">Investment</option>
          <option value="crypto">Crypto</option>
          <option value="other">Other</option>
        </select>
      </label>
      <NumberField
        label="Current value"
        value={item.current_value}
        estimated={item.current_value_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, current_value_estimated: checked })}
        onChange={(value) => onChange({ ...item, current_value: value })}
      />
      <label className="inline-control">
        <input type="checkbox" checked={item.is_matrimonial} onChange={(event) => onChange({ ...item, is_matrimonial: event.target.checked })} />
        Acquired during the marriage period
      </label>
      <button type="button" className="ui-btn-danger" onClick={onRemove}>
        Remove savings item
      </button>
    </article>
  );
}

function DebtEditor({
  item,
  onChange,
  onRemove,
}: {
  item: DebtItem;
  onChange: (item: DebtItem) => void;
  onRemove: () => void;
}) {
  return (
    <article className="panel stack-sm nested-panel">
      <label>
        Debt label
        <input value={item.label} onChange={(event) => onChange({ ...item, label: event.target.value })} />
      </label>
      <label>
        Holder
        <select value={item.holder} onChange={(event) => onChange({ ...item, holder: event.target.value as DebtItem["holder"] })}>
          <option value="user">User</option>
          <option value="partner">Partner</option>
          <option value="joint">Joint</option>
        </select>
      </label>
      <NumberField
        label="Outstanding balance"
        value={item.outstanding}
        estimated={item.outstanding_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, outstanding_estimated: checked })}
        onChange={(value) => onChange({ ...item, outstanding: value })}
      />
      <NumberField
        label="Monthly payment"
        value={item.monthly_payment}
        estimated={item.monthly_payment_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, monthly_payment_estimated: checked })}
        onChange={(value) => onChange({ ...item, monthly_payment: value })}
      />
      <label className="inline-control">
        <input type="checkbox" checked={item.is_matrimonial} onChange={(event) => onChange({ ...item, is_matrimonial: event.target.checked })} />
        Debt falls within the marriage period
      </label>
      <button type="button" className="ui-btn-danger" onClick={onRemove}>
        Remove debt
      </button>
    </article>
  );
}

function DependantEditor({
  item,
  onChange,
  onRemove,
}: {
  item: DependantItem;
  onChange: (item: DependantItem) => void;
  onRemove: () => void;
}) {
  return (
    <article className="panel stack-sm nested-panel">
      <NumberField
        label="Age"
        value={item.age}
        estimated={item.age_estimated}
        onEstimatedChange={(checked) => onChange({ ...item, age_estimated: checked })}
        onChange={(value) => onChange({ ...item, age: value })}
      />
      <label>
        Lives with
        <select value={item.lives_with} onChange={(event) => onChange({ ...item, lives_with: event.target.value as DependantItem["lives_with"] })}>
          <option value="shared">Shared</option>
          <option value="user">User</option>
          <option value="partner">Partner</option>
        </select>
      </label>
      <button type="button" className="ui-btn-danger" onClick={onRemove}>
        Remove dependant
      </button>
    </article>
  );
}
