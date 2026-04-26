import { useState } from 'react'

import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function TechIconBase({ children, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}

function GroupIcon({ label }) {
  const className = 'domain-tech-group-icon'

  switch (label) {
    case 'App and interfaces':
      return (
        <TechIconBase className={className}>
          <rect height="13" rx="3" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5.5" />
          <path d="M8 18.5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          <path d="M9 9.2 6.9 12 9 14.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
          <path d="m15 9.2 2.1 2.8-2.1 2.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </TechIconBase>
      )
    case 'Backend and APIs':
      return (
        <TechIconBase className={className}>
          <ellipse cx="12" cy="6" rx="6.8" ry="2.8" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5.2 6v5.8c0 1.55 3.04 2.8 6.8 2.8s6.8-1.25 6.8-2.8V6" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5.2 11.7v5.8c0 1.55 3.04 2.8 6.8 2.8s6.8-1.25 6.8-2.8v-5.8" stroke="currentColor" strokeWidth="1.7" />
        </TechIconBase>
      )
    case 'Database and storage':
      return (
        <TechIconBase className={className}>
          <ellipse cx="12" cy="6" rx="6.6" ry="2.7" stroke="currentColor" strokeWidth="1.7" />
          <path d="M5.4 6v5.4c0 1.5 2.96 2.7 6.6 2.7s6.6-1.2 6.6-2.7V6" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 14.4v6.2M8.8 17.6h6.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </TechIconBase>
      )
    case 'Python AI services':
      return (
        <TechIconBase className={className}>
          <rect height="12.5" rx="3.2" stroke="currentColor" strokeWidth="1.7" width="12.5" x="5.75" y="5.75" />
          <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5m14 0h2.2M6.2 6.2l1.55 1.55m8.5 8.5 1.55 1.55m0-11.6-1.55 1.55m-8.5 8.5-1.55 1.55" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          <circle cx="12" cy="12" fill="currentColor" r="1.7" />
        </TechIconBase>
      )
    default:
      return (
        <TechIconBase className={className}>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.7" />
        </TechIconBase>
      )
  }
}

function ItemIcon({ item }) {
  const className = 'domain-tech-chip-icon'

  switch (item) {
    case 'React':
    case 'React Native':
      return (
        <TechIconBase className={className}>
          <ellipse cx="12" cy="12" rx="7" ry="2.9" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="7" ry="2.9" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="7" ry="2.9" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" fill="currentColor" r="1.5" />
        </TechIconBase>
      )
    case 'Vite':
      return (
        <TechIconBase className={className}>
          <path d="M12 3.3 6 7.1l1.7 10.1L12 20.7l4.3-3.5L18 7.1 12 3.3Z" fill="currentColor" opacity="0.18" />
          <path d="m12 4.5 4.8 2.9-1.4 8.3L12 18.4 8.6 15.7 7.2 7.4 12 4.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="m10 8.5 2 6 2-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Tailwind CSS':
      return (
        <TechIconBase className={className}>
          <path d="M7 9.2c1.1-1.5 2.3-2.2 3.6-2.2 2 0 2.5 1.4 3.7 2.3 1 .7 2.1.7 3.5.1-1.1 1.5-2.3 2.2-3.6 2.2-2 0-2.5-1.4-3.7-2.3-1-.7-2.1-.7-3.5-.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6.1 14.5c1.1-1.5 2.3-2.2 3.6-2.2 2 0 2.5 1.4 3.7 2.3 1 .7 2.1.7 3.5.1-1.1 1.5-2.3 2.2-3.6 2.2-2 0-2.5-1.4-3.7-2.3-1-.7-2.1-.7-3.5-.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Expo':
      return (
        <TechIconBase className={className}>
          <path d="m12 4.6 5.2 3v6L12 19.4l-5.2-5.8v-6L12 4.6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12 9.2 9.7 12 12 14.8 14.3 12 12 9.2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Node.js':
      return (
        <TechIconBase className={className}>
          <path d="m12 4.3 5.2 3v6.2l-5.2 3-5.2-3V7.3L12 4.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M10.2 9.2v5.6M13.7 9.8v4.4M10.2 10.8l3.5 2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Express':
      return (
        <TechIconBase className={className}>
          <path d="M5 8.5h8.5M5 12h6.5M5 15.5h8.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path d="m16.5 9 2.5 3-2.5 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'MongoDB':
      return (
        <TechIconBase className={className}>
          <path d="M12 4.3c2.3 2.1 3.5 4.5 3.5 7.3 0 2.9-1.2 5.4-3.5 7.5-2.3-2.1-3.5-4.6-3.5-7.5 0-2.8 1.2-5.2 3.5-7.3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M12 6.7v10.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'FastAPI':
    case 'Flask':
      return (
        <TechIconBase className={className}>
          <path d="M12 4.6v4.6l4.5 7.5a1.1 1.1 0 0 1-1 1.7H8.5a1.1 1.1 0 0 1-1-1.7L12 9.2" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M9.2 13h5.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'YOLOv8m':
      return (
        <TechIconBase className={className}>
          <path d="M12 5.2v3.1M12 15.7v3.1M5.2 12h3.1M15.7 12h3.1" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="12" fill="currentColor" r="1.2" />
        </TechIconBase>
      )
    case 'Florence-2':
      return (
        <TechIconBase className={className}>
          <path d="M6 7.2h12M6 12h12M6 16.8h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="17.2" cy="16.8" fill="currentColor" r="1.4" />
        </TechIconBase>
      )
    case 'DINOv2':
      return (
        <TechIconBase className={className}>
          <circle cx="7" cy="8" fill="currentColor" r="1.3" />
          <circle cx="17" cy="8" fill="currentColor" r="1.3" />
          <circle cx="12" cy="16" fill="currentColor" r="1.3" />
          <path d="M8.2 8h7.6M7.8 9.1l3.3 5.5M16.2 9.1l-3.3 5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'NLP similarity checking':
    case 'Semantic matching services':
      return (
        <TechIconBase className={className}>
          <rect height="5.4" rx="1.6" stroke="currentColor" strokeWidth="1.5" width="5.4" x="4.4" y="6.1" />
          <rect height="5.4" rx="1.6" stroke="currentColor" strokeWidth="1.5" width="5.4" x="14.2" y="12.5" />
          <path d="m9.8 8.8 4.4 4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Admin dashboard services':
    case 'Fraud-aware administration logic':
      return (
        <TechIconBase className={className}>
          <path d="M12 4.1 18 6.7v4.6c0 3.7-2.2 6.3-6 8.6-3.8-2.3-6-4.9-6-8.6V6.7L12 4.1Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="m9.7 12 1.5 1.5 3.1-3.3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Speech-to-text pipeline':
      return (
        <TechIconBase className={className}>
          <rect height="7.6" rx="2.8" stroke="currentColor" strokeWidth="1.5" width="5.2" x="9.4" y="5" />
          <path d="M7.5 11.7a4.5 4.5 0 0 0 9 0M12 16.2v2.8M9.2 19h5.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </TechIconBase>
      )
    case 'Whisper-style processing':
    case 'Video or audio response analysis':
      return (
        <TechIconBase className={className}>
          <path d="M6.4 14.8a4.8 4.8 0 0 1 0-5.6M17.6 14.8a4.8 4.8 0 0 0 0-5.6M9.4 16.9a7.6 7.6 0 0 1 0-9.8M14.6 16.9a7.6 7.6 0 0 0 0-9.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <circle cx="12" cy="12" fill="currentColor" r="1.4" />
        </TechIconBase>
      )
    default:
      return (
        <TechIconBase className={className}>
          <circle cx="12" cy="12" r="5.4" stroke="currentColor" strokeWidth="1.5" />
        </TechIconBase>
      )
  }
}

function ScopeTopicPanel({ section, activeSectionIndex, index, onSelect }) {
  return (
    <button
      aria-pressed={activeSectionIndex === index}
      className="domain-scope-topic"
      data-active={activeSectionIndex === index ? 'true' : 'false'}
      onClick={() => onSelect(index)}
      type="button"
    >
      <span className="domain-scope-topic-index">0{index + 1}</span>
      <span className="domain-scope-topic-copy">
        <span className="domain-scope-topic-title">{section.title}</span>
        <span className="domain-scope-topic-preview">{section.preview}</span>
      </span>
    </button>
  )
}

function DomainSection({ domainSections, methodologySteps, technologyGroups }) {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const activeSection = domainSections[activeSectionIndex] ?? domainSections[0]

  return (
    <section className="domain-section section-anchor section-shell section-band" id="domain">
      <div className="shell">
        <SectionIntro
          description="The domain section now behaves more like a reviewer-friendly scope brief, expanding each research topic into a clearer narrative that can be scanned quickly without losing academic intent."
          eyebrow="Domain"
          title="Research context expanded into a richer project scope narrative."
        />

        <div className="domain-scope-shell mt-12">
          <Reveal className="surface domain-scope rounded-[2rem] p-6 md:p-8 xl:p-9" distance={24}>
            <div className="domain-scope-header">
              <div className="domain-scope-intro">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Project Scope
                </p>
                <h3 className="mt-3 font-display text-[clamp(2rem,3vw,3.25rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
                  Four research threads, one clearer explanation path.
                </h3>
              </div>
              <p className="max-w-[42rem] text-[0.98rem] leading-8 text-[var(--muted)]">
                Select a scope item to read the reviewer-facing breakdown. Each topic expands the original
                research framing into a stronger narrative while keeping the methodology and platform stack
                below available as supporting evidence.
              </p>
            </div>

            <div className="domain-scope-layout mt-8">
              <div className="domain-scope-tabs" role="tablist" aria-label="Domain research topics">
                {domainSections.map((section, index) => (
                  <Reveal delay={index * 50} distance={18} key={section.title}>
                    <ScopeTopicPanel
                      activeSectionIndex={activeSectionIndex}
                      index={index}
                      onSelect={setActiveSectionIndex}
                      section={section}
                    />
                  </Reveal>
                ))}
              </div>

              <Reveal
                className="domain-scope-panel"
                delay={120}
                distance={24}
                key={activeSection.title}
                variant="fade-left"
              >
                <div className="domain-scope-panel-head">
                  <div>
                    <p className="domain-scope-panel-kicker">Active topic</p>
                    <h4 className="domain-scope-panel-title">{activeSection.title}</h4>
                  </div>
                  <span className="domain-scope-panel-badge">Detailed brief</span>
                </div>

                <p className="domain-scope-panel-lead">{activeSection.lead}</p>

                <div className="domain-scope-detail-grid">
                  {activeSection.details.map((detail) => (
                    <div className="domain-scope-detail" key={detail}>
                      <span className="domain-scope-detail-mark" />
                      <p>{detail}</p>
                    </div>
                  ))}
                </div>

                {activeSection.points ? (
                  <div className="domain-scope-points">
                    <p className="domain-scope-points-label">Key objectives</p>
                    <ul className="domain-scope-points-list">
                      {activeSection.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </div>
          </Reveal>
        </div>

        <div className="domain-detail-layout mt-12 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <Reveal className="surface domain-methodology rounded-[2rem] p-7 md:p-8" distance={24}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Methodology workflow
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  Evidence moves from submission to verified recovery.
                </h3>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                Multi-stage process
              </span>
            </div>

            <div className="mt-8 grid gap-4">
              {methodologySteps.map((step, index) => (
                <Reveal delay={80 + index * 45} distance={18} key={step.title}>
                  <div className="grid gap-4 rounded-[1.4rem] border border-[color:var(--line)] bg-[var(--card-soft)] p-5 md:grid-cols-[auto_1fr]">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-deep)] font-display text-sm font-bold text-white">
                      0{index + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold tracking-[-0.02em] text-[var(--ink)]">
                        {step.title}
                      </h4>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal className="surface domain-stack rounded-[2rem] p-7 md:p-8" delay={100} distance={24} variant="fade-left">
            <div className="domain-tech-overview">
              <div className="domain-tech-overview-copy">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Technologies Used
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  Full project stack across apps, services, data, and AI systems.
                </h3>
                <p className="mt-4 max-w-[60ch] text-[0.98rem] leading-8 text-[var(--muted)]">
                  The project combines user-facing interfaces, a Node service layer, persistent storage
                  systems, and multiple Python AI pipelines. The groups below summarize the architecture
                  reviewers actually see across the full implementation, not just the website.
                </p>
              </div>
              <div className="domain-tech-overview-meta">
                <span className="domain-tech-overview-stat">
                  <strong>{technologyGroups.length}</strong>
                  <span>Core stack domains</span>
                </span>
                <span className="domain-tech-overview-stat">
                  <strong>{technologyGroups.reduce((count, group) => count + group.items.length, 0)}</strong>
                  <span>Named technologies</span>
                </span>
              </div>
            </div>

            <div className="domain-tech-grid mt-7">
              {technologyGroups.map((group, index) => (
                <Reveal delay={180 + index * 45} distance={16} key={group.label}>
                  <article className="domain-tech-group rounded-[1.5rem] p-5 md:p-6">
                    <div className="domain-tech-group-top">
                      <div className="domain-tech-group-heading">
                        <span className="domain-tech-group-icon-shell" aria-hidden="true">
                          <GroupIcon label={group.label} />
                        </span>
                        <div className="domain-tech-group-title-wrap">
                          <p className="domain-tech-group-scope">{group.scopeLabel}</p>
                          <h4 className="domain-tech-group-title">{group.label}</h4>
                        </div>
                      </div>
                      <span className="domain-tech-group-count">{group.items.length} tech</span>
                    </div>
                    <p className="domain-tech-group-description">{group.description}</p>
                    <div className="domain-tech-chip-list">
                      {group.items.map((item) => (
                        <span className="domain-tech-chip" key={item}>
                          <span className="domain-tech-chip-icon-shell">
                            <ItemIcon item={item} />
                          </span>
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default DomainSection
