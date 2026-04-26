import { useRef } from 'react'
import Reveal from '../Reveal'
import { useScrollProgress } from '../../hooks/useScrollProgress'

function HeroSection({
  heroHighlights,
  methodologySteps,
  projectMeta,
  quickFacts,
}) {
  const heroRef = useRef(null)
  const heroProgress = useScrollProgress(heroRef, { start: 0.94, end: 0.12 })

  return (
    <section
      className="section-anchor relative overflow-hidden"
      id="home"
      ref={heroRef}
      style={{ '--hero-progress': heroProgress.toFixed(3) }}
    >
      <div
        aria-hidden="true"
        className="hero-aura absolute inset-x-0 top-0 -z-10 h-[42rem]"
      />
      <div className="shell section-shell">
        <div className="hero-layout grid items-start gap-10 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="hero-copy max-w-5xl">
            <Reveal>
              <span className="eyebrow">Institutional AI research project</span>
            </Reveal>
            <Reveal delay={60}>
              <p className="mt-6 max-w-2xl text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-text)]">
                Multimodal matching, secure verification, and fraud-aware oversight
              </p>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="display-title mt-5 max-w-6xl text-[clamp(3.4rem,7vw,6.1rem)] font-semibold text-[var(--ink)]">
                {projectMeta.name}
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-7 max-w-3xl text-[clamp(1.08rem,1.7vw,1.3rem)] leading-8 text-[var(--muted)]">
                {projectMeta.tagline}
              </p>
            </Reveal>

            <Reveal className="hero-actions-wrap" delay={180}>
              <div className="mt-8 flex flex-wrap gap-4">
                <a className="button-primary" href="#domain">
                  Explore research domain
                </a>
                <a className="button-secondary" href="#documents">
                  View publication placeholders
                </a>
              </div>
            </Reveal>

            <Reveal delay={220}>
              <div className="hero-facts mt-8 flex flex-wrap gap-3">
                {quickFacts.map((fact, index) => (
                  <Reveal className="inline-flex" delay={index * 45} distance={12} key={fact}>
                    <span className="hero-fact rounded-full border border-[color:var(--line)] bg-[var(--card-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                      {fact}
                    </span>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <div className="hero-highlights mt-12 grid gap-4 md:grid-cols-2">
              {heroHighlights.map((highlight, index) => (
                <Reveal
                  className={`surface card-lift hero-highlight rounded-[1.7rem] p-6 ${index === 0 ? 'md:col-span-2' : ''}`}
                  delay={240 + index * 60}
                  distance={22}
                  key={highlight.title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                        {highlight.label}
                      </p>
                      <h2 className="mt-3 max-w-2xl font-display text-[1.36rem] font-semibold tracking-[-0.045em] text-[var(--ink)]">
                        {highlight.title}
                      </h2>
                    </div>
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-4 max-w-[56ch] text-sm leading-7 text-[var(--muted)]">
                    {highlight.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal
            className="hero-board surface rounded-[2.2rem] p-6 md:p-8 xl:sticky xl:top-28"
            delay={160}
            distance={28}
            variant="fade-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Recovery workflow
                </p>
                <h2 className="mt-2 max-w-md font-display text-[2.1rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  Secure recovery is staged, auditable, and owner-first.
                </h2>
              </div>
              <div className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                Web overview
              </div>
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-[color:var(--line)] bg-[var(--hero-panel)] px-5 py-5">
              <p className="text-sm leading-7 text-[var(--muted)]">
                The website presents the system as a credible research platform rather
                than a marketing landing page: submission, matching, verification, and
                administrative review all remain visible in one coherent frame.
              </p>
            </div>

            <div className="mt-7 grid gap-4">
              {methodologySteps.slice(0, 3).map((step, index) => (
                <Reveal delay={220 + index * 70} distance={18} key={step.title}>
                  <article className="hero-step rounded-[1.6rem] border border-[color:var(--line)] bg-[var(--card-soft)] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-deep)] font-display text-sm font-bold text-white">
                        0{index + 1}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {quickFacts[index]}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                      {step.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-6" delay={440} distance={14} variant="scale-soft">
              <div className="rounded-[1.6rem] border border-[color:var(--line)] bg-[var(--shell)] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Why this matters
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Campus lost-and-found processes often break down when owners and
                  finders describe the same item differently. FindAssure turns that
                  ambiguity into a structured, verifiable recovery flow.
                </p>
              </div>
            </Reveal>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
