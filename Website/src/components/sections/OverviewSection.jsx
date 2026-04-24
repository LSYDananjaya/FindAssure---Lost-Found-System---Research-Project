import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function OverviewSection({ overviewBlocks, projectMeta }) {
  return (
    <section className="overview-section section-shell section-band">
      <div className="shell">
        <SectionIntro
          description="The platform is designed for institutional settings where trust, structured location reasoning, and safe recovery matter more than simple public listings."
          eyebrow="Project overview"
          title="Designed as a credible academic system, not a generic lost-item listing app."
        />

        <div className="overview-layout mt-12 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <Reveal className="surface overview-lead rounded-[2rem] p-7 md:p-8" distance={24}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
              Project framing
            </p>
            <p className="mt-4 max-w-3xl text-[1.06rem] leading-8 text-[var(--muted)]">
              {projectMeta.overview}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {overviewBlocks.map((block, index) => (
                <Reveal
                  className={index === 0 ? 'sm:col-span-2' : ''}
                  delay={80 + index * 45}
                  distance={18}
                  key={block.title}
                >
                  <article className={`overview-block rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--card-soft)] p-5 ${index === 0 ? 'overview-block-featured' : ''}`}>
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                      {block.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {block.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <div className="overview-stack grid gap-5">
            <Reveal className="surface overview-panel rounded-[2rem] p-7 md:p-8" delay={80} distance={24} variant="fade-left">
              <article>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Why this project matters
                </p>
                <h3 className="mt-2 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  It reduces friction for honest users while raising the bar for false claims.
                </h3>
                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                  Traditional workflows rely on memory, manual browsing, and weak
                  ownership checks. FindAssure introduces a safer path that keeps
                  finder details protected until verification succeeds.
                </p>
              </article>
            </Reveal>

            <Reveal className="surface overview-panel rounded-[2rem] p-7 md:p-8" delay={150} distance={24} variant="fade-left">
              <article>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  How the system works
                </p>
                <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
                  <Reveal delay={220} distance={16}>
                    <div className="rounded-[1.4rem] bg-[var(--card-soft)] px-4 py-4">
                      Finder submits images, category, location, and private
                      verification answers.
                    </div>
                  </Reveal>
                  <Reveal delay={260} distance={16}>
                    <div className="rounded-[1.4rem] bg-[var(--card-soft)] px-4 py-4">
                      Matching combines text, visual evidence, and indoor location
                      reasoning.
                    </div>
                  </Reveal>
                  <Reveal delay={300} distance={16}>
                    <div className="rounded-[1.4rem] bg-[var(--card-soft)] px-4 py-4">
                      Claimants complete video or audio-based verification before any
                      finder details are exposed.
                    </div>
                  </Reveal>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OverviewSection
