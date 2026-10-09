"use client";
import { useEffect, useRef } from "react";
import { X, ArrowUpRight, Check, Clock, ChevronRight } from "lucide-react";
import type { Claim, Status } from "@/lib/model";
import { STATUS_LABEL } from "@/lib/model";
export function Logo() {
  return (
    <span className="brand">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M16 3 29 25h-8l-5-8-5 8H3L16 3Z"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinejoin="round"
        />
        <path d="m10 26 6-9 6 9" stroke="currentColor" strokeWidth="3.2" />
        <circle cx="16" cy="25" r="3.3" fill="currentColor" />
      </svg>
      <b>
        Seva <span>40</span>
      </b>
    </span>
  );
}
export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`status ${status}`}>
      <span />
      {STATUS_LABEL[status]}
    </span>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-orb">
        <Check size={26} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {body && <p>{body}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focus = () =>
      el
        ?.querySelector<HTMLElement>(
          'button,input,select,textarea,[tabindex="0"]',
        )
        ?.focus();
    focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && el) {
        const nodes = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
          ),
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">SEVA 40</span>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function ClaimLine({
  claim,
  onClick,
}: {
  claim: Claim;
  onClick: () => void;
}) {
  return (
    <button className="claim-line" onClick={onClick}>
      <span className="square-icon">
        <Clock size={19} />
      </span>
      <span className="grow">
        <b>{claim.taskTitle}</b>
        <small>
          {claim.taskDate} · {claim.hours} hours
        </small>
      </span>
      <StatusPill status={claim.status} />
      <ChevronRight size={17} />
    </button>
  );
}
export function ArrowLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  );
}
