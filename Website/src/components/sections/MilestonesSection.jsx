import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function MilestonesSection({ items }) {
  return (
    <section className="section-anchor section-shell" id="milestones">
      <div className="shell">
        <SectionIntro
          description="Detailed breakdown of all academic assessments including dates, marks allocation, and current status. Click on each assessment to view full details."
          eyebrow="Milestones"
          title="Project assessments overview with expandable details."
        />

        <div className="mt-12 space-y-4">
          {items.map((item, index) => (
            <Reveal delay={index * 55} distance={24} key={item.title}>
              <details className="group rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--card-soft)] p-6">
                <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-[var(--ink)]">
                  <span>{item.title}</span>
                  <span className={`timeline-status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1rem] bg-[var(--canvas)] p-4">
                      <span className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Date</span>
                      <p className="mt-1 text-base text-[var(--ink)]">{item.date}</p>
                    </div>
                    <div className="rounded-[1rem] bg-[var(--canvas)] p-4">
                      <span className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Marks</span>
                      <p className="mt-1 text-base text-[var(--ink)]">{item.marks}</p>
                    </div>
                  </div>
                  <div className="rounded-[1rem] bg-[var(--canvas)] p-4">
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Assessment Details</span>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.note}</p>
                  </div>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MilestonesSection
