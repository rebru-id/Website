// src/components/sections/AboutTeamSection.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useInView } from "@/hooks/useInView";

import type { TeamMember } from "@/types/team";
import { FOUNDERS, CORE_TEAM, ADVISORS, SHOW_ADVISORS } from "@/constants/team";
// ─────────────────────────────────────────────────────────────────────────────
// Avatar — photo atau initials fallback
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({
  member,
  size = "lg",
}: {
  member: TeamMember;
  size?: "lg" | "md" | "sm";
}) {
  const dim =
    size === "lg"
      ? "w-[72px] h-[72px]"
      : size === "md"
        ? "w-14 h-14"
        : "w-10 h-10";
  const textSize =
    size === "lg"
      ? "text-[1.1rem]"
      : size === "md"
        ? "text-[0.9rem]"
        : "text-[0.72rem]";

  if (member.photo) {
    return (
      <div
        className={`${dim} rounded-full overflow-hidden flex-shrink-0`}
        style={{ border: `1px solid ${member.border}` }}
      >
        <Image
          src={member.photo}
          alt={member.name}
          width={72}
          height={72}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-display font-semibold ${textSize}`}
      style={{
        background: member.bg,
        border: `1px solid ${member.border}`,
        color: member.accent,
      }}
    >
      {member.initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LinkedIn button — aktif jika ada URL, tooltip "Tidak tersedia" jika tidak
// ─────────────────────────────────────────────────────────────────────────────
function LinkedInButton({ url, name }: { url?: string; name: string }) {
  const baseStyle: React.CSSProperties = {
    border: "1px solid var(--border-default)",
    color: "var(--text-muted)",
  };

  if (url) {
    return (
      <a
        href={url}
        className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 hover:opacity-75"
        style={baseStyle}
        aria-label={`LinkedIn — ${name}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="fab fa-linkedin text-[0.75rem]" />
      </a>
    );
  }

  return (
    <div className="relative group">
      <div
        className="w-8 h-8 rounded flex items-center justify-center opacity-30 cursor-not-allowed"
        style={baseStyle}
        aria-label={`LinkedIn tidak tersedia — ${name}`}
      >
        <i className="fab fa-linkedin text-[0.75rem]" />
      </div>
      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded pointer-events-none
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <span
          className="font-mono text-[0.6rem] tracking-[0.1em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Tidak tersedia
        </span>
        {/* Arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderTop: "4px solid var(--border-default)",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expand button
// ─────────────────────────────────────────────────────────────────────────────
function ExpandBtn({
  open,
  onClick,
  fullWidth = false,
}: {
  open: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.1em] uppercase px-3.5 py-2 rounded-pill transition-all duration-200 ${fullWidth ? "w-full justify-center" : ""}`}
      style={{
        border: "1px solid var(--border-default)",
        color: "var(--text-muted)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-strong)";
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--text-secondary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-default)";
        (e.currentTarget as HTMLButtonElement).style.color =
          "var(--text-muted)";
      }}
    >
      <span>{open ? "Close" : "More details"}</span>
      <i
        className="fas fa-chevron-down text-[0.55rem] transition-transform duration-300"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Expertise list  (used inside expand panels)
// ─────────────────────────────────────────────────────────────────────────────
function ExpertiseList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span
            className="mt-[5px] w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: accent }}
          />
          <span
            className="text-[0.85rem] leading-[1.7]"
            style={{ color: "var(--text-secondary)" }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FounderCard — full-width, richest detail
// ─────────────────────────────────────────────────────────────────────────────
function FounderCard({
  member,
  index,
  inView,
}: {
  member: TeamMember;
  index: number;
  inView: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        background: member.bg,
        border: `1px solid ${member.border}`,
        transitionDelay: `${160 + index * 200}ms`,
      }}
    >
      {/* ── Collapsed content ── */}
      <div className="p-8">
        <div className="flex items-start gap-5 mb-5">
          <Avatar member={member} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p
                  className="font-mono text-[0.62rem] tracking-[0.18em] uppercase mb-1.5"
                  style={{ color: member.accent }}
                >
                  {member.role}
                </p>
                <h3
                  className="font-display font-semibold text-[1.45rem] leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {member.badge && (
                  <span
                    className="font-mono text-[0.58rem] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pill"
                    style={{
                      background: member.tagBg,
                      color: member.accent,
                      border: `1px solid ${member.border}`,
                    }}
                  >
                    {member.badge}
                  </span>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200"
                    style={{
                      border: "1px solid var(--border-default)",
                      color: "var(--text-muted)",
                    }}
                    aria-label={`LinkedIn — ${member.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="fab fa-linkedin text-[0.75rem]" />
                  </a>
                )}
              </div>
            </div>
            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {member.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.58rem] tracking-[0.1em] uppercase px-2.5 py-1 rounded-pill"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p
          className="text-[0.9rem] leading-[1.8] mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {member.tagline}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i
              className="fas fa-location-dot text-[0.6rem]"
              style={{ color: "var(--text-muted)" }}
            />
            <span
              className="font-mono text-[0.6rem] tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {member.location}
            </span>
          </div>
          <ExpandBtn open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {/* ── Expand panel ── */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: open ? "480px" : "0px",
          opacity: open ? 1 : 0,
          overflowY: open ? "auto" : "hidden",
          transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="h-px mx-8" style={{ background: member.border }} />
        <div className="p-8 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Bio */}
          <div>
            <p
              className="font-mono text-[0.6rem] tracking-[0.18em] uppercase mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Background
            </p>
            <p
              className="text-[0.88rem] leading-[1.85]"
              style={{ color: "var(--text-secondary)" }}
            >
              {member.bio}
            </p>
          </div>
          {/* Expertise */}
          <div>
            <p
              className="font-mono text-[0.6rem] tracking-[0.18em] uppercase mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Areas of Expertise
            </p>
            <ExpertiseList items={member.expertise} accent={member.accent} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CoreCard — compact, 2-col grid
// ─────────────────────────────────────────────────────────────────────────────
function CoreCard({
  member,
  index,
  inView,
}: {
  member: TeamMember;
  index: number;
  inView: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        transitionDelay: `${300 + index * 120}ms`,
      }}
    >
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar member={member} size="md" />
          <div className="flex-1 min-w-0">
            <p
              className="font-mono text-[0.58rem] tracking-[0.16em] uppercase mb-1"
              style={{ color: member.accent }}
            >
              {member.role}
            </p>
            <h3
              className="font-display font-semibold text-[1.15rem] leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {member.name}
            </h3>
          </div>
        </div>

        <p
          className="text-[0.85rem] leading-[1.75] mb-4"
          style={{ color: "var(--text-secondary)" }}
        >
          {member.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {member.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[0.56rem] tracking-[0.1em] uppercase px-2 py-0.5 rounded-pill"
              style={{
                background: member.bg,
                border: `1px solid ${member.border}`,
                color: member.accent,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <i
              className="fas fa-location-dot text-[0.55rem]"
              style={{ color: "var(--text-muted)" }}
            />
            <span
              className="font-mono text-[0.56rem] tracking-[0.1em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              {member.location}
            </span>
          </div>
          <ExpandBtn open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {/* Expand */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: open ? "360px" : "0px",
          opacity: open ? 1 : 0,
          overflowY: open ? "auto" : "hidden",
          transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className="h-px mx-6"
          style={{ background: "var(--border-subtle)" }}
        />
        <div className="p-6 pt-5">
          <p
            className="font-mono text-[0.58rem] tracking-[0.16em] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            About
          </p>
          <p
            className="text-[0.85rem] leading-[1.8] mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            {member.bio}
          </p>
          <div
            className="h-px mb-4"
            style={{ background: "var(--border-subtle)" }}
          />
          <ExpertiseList
            items={member.expertise.slice(0, 3)}
            accent={member.accent}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdvisorCard — medium detail, similar depth to founder
// ─────────────────────────────────────────────────────────────────────────────
function AdvisorCard({
  member,
  index,
  inView,
}: {
  member: TeamMember;
  index: number;
  inView: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-lg overflow-hidden transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{
        background: member.bg,
        border: `1px solid ${member.border}`,
        transitionDelay: `${480 + index * 180}ms`,
      }}
    >
      <div className="p-8">
        <div className="flex items-start gap-4 mb-5">
          <Avatar member={member} size="md" />
          <div className="flex-1 min-w-0">
            <p
              className="font-mono text-[0.6rem] tracking-[0.16em] uppercase mb-1.5"
              style={{ color: member.accent }}
            >
              {member.role}
            </p>
            <h3
              className="font-display font-semibold text-[1.35rem] leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {member.name}
            </h3>
            <p
              className="font-mono text-[0.58rem] tracking-[0.1em] uppercase mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {member.location}
            </p>
          </div>
          {member.linkedin && (
            <a
              href={member.linkedin}
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{
                border: `1px solid ${member.border}`,
                color: "var(--text-muted)",
              }}
              aria-label={`LinkedIn — ${member.name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin text-[0.72rem]" />
            </a>
          )}
        </div>

        <p
          className="text-[0.9rem] leading-[1.8] mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {member.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {member.tags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-[0.58rem] tracking-[0.1em] uppercase px-2.5 py-1 rounded-pill"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="h-px mb-5" style={{ background: member.border }} />

        <div className="flex items-center justify-end">
          <ExpandBtn open={open} onClick={() => setOpen((v) => !v)} />
        </div>
      </div>

      {/* Expand */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: open ? "440px" : "0px",
          opacity: open ? 1 : 0,
          overflowY: open ? "auto" : "hidden",
          transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="h-px mx-8" style={{ background: member.border }} />
        <div className="p-8 pt-6">
          <p
            className="font-mono text-[0.6rem] tracking-[0.18em] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Background
          </p>
          <p
            className="text-[0.88rem] leading-[1.85] mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {member.bio}
          </p>
          <p
            className="font-mono text-[0.6rem] tracking-[0.18em] uppercase mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            Areas of Expertise
          </p>
          <ExpertiseList items={member.expertise} accent={member.accent} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main section
// ─────────────────────────────────────────────────────────────────────────────
export default function AboutTeamSection() {
  const { ref, inView } = useInView(0.08);

  return (
    <section
      id="team"
      className="relative py-[var(--section-py-lg)] px-[var(--section-px)] overflow-hidden"
      style={{
        background: "var(--bg-primary)",
        // Offset untuk navbar fixed — sesuaikan nilai ini dengan tinggi navbar aktual
        scrollMarginTop: "80px",
      }}
    >
      {/* Top separator */}
      <div
        className="absolute top-0 left-[var(--section-px)] right-[var(--section-px)] h-px"
        style={{ background: "var(--impact-top-line)" }}
      />

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, var(--about-values-glow) 0%, transparent 70%)",
        }}
      />

      <div
        ref={ref}
        className="relative z-10 max-w-[var(--section-max-w)] mx-auto"
      >
        {/* ── Section header ── */}
        <div className="mb-20">
          <p
            className={`section-label mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "80ms" }}
          >
            The People Behind Rebru
          </p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <h2
              className={`section-title transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "180ms" }}
            >
              Our Team
            </h2>
            <p
              className={`text-[0.9rem] max-w-[360px] leading-[1.8] transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ color: "var(--text-muted)", transitionDelay: "280ms" }}
            >
              A compact, cross-functional team united by a shared belief that
              waste is not a problem — it&apos;s an underutilized resource.
            </p>
          </div>
        </div>

        {/* ── Founders ── */}
        <div className="mb-4">
          <p
            className={`font-mono text-[0.62rem] tracking-[0.2em] uppercase mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ color: "var(--coffee-latte)", transitionDelay: "120ms" }}
          >
            Founders
          </p>
          {/* Primary founder — full width */}
          {FOUNDERS[0] && (
            <div className="mb-5">
              <FounderCard member={FOUNDERS[0]} index={0} inView={inView} />
            </div>
          )}
          {/* Co-founders — 2-col grid */}
          {FOUNDERS.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {FOUNDERS.slice(1).map((member, i) => (
                <FounderCard
                  key={member.id}
                  member={member}
                  index={i + 1}
                  inView={inView}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Core Team ── */}
        <div className="mb-4 mt-14">
          <p
            className={`font-mono text-[0.62rem] tracking-[0.2em] uppercase mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ color: "var(--forest-sage)", transitionDelay: "160ms" }}
          >
            Core Team
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CORE_TEAM.map((member, i) => (
              <CoreCard
                key={member.id}
                member={member}
                index={i}
                inView={inView}
              />
            ))}
          </div>
        </div>

        {/* ── Advisors ── */}
        {SHOW_ADVISORS && (
          <div className="mt-14">
            <p
              className={`font-mono text-[0.62rem] tracking-[0.2em] uppercase mb-5 transition-all duration-600 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ color: "var(--amber)", transitionDelay: "200ms" }}
            >
              Advisors
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ADVISORS.map((member, i) => (
                <AdvisorCard
                  key={member.id}
                  member={member}
                  index={i}
                  inView={inView}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
