import { useRef } from 'react'
import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'
import { useScrollProgress } from '../../hooks/useScrollProgress'

function MilestonesSection({ items }) {
  const timelineRef = useRef(null)
  const timelineProgress = useScrollProgress(timelineRef, { start: 0.82, end: 0.18 })

  return (
    <section className="section-anchor section-shell" id="milestones">
      <div className="shell">
        <SectionIntro
          description="Milestones are driven from a single list so final dates, marks, and statuses can be updated quickly once academic approvals are confirmed."
          eyebrow="Milestones"
          title="A clean timeline for proposal, progress reviews, and final assessments."
        />

        <div className="timeline-shell mt-12 rounded-[2.2rem] px-5 py-6 md:px-8 md:py-8">
          <div
            className="timeline-track"
            ref={timelineRef}
            style={{ '--timeline-progress': timelineProgress.toFixed(3) }}
          >
            <div className="timeline-track-line" aria-hidden="true" />
            <div className="timeline-progress-rail timeline-track-progress" aria-hidden="true" />

            {items.map((item, index) => (
              <Reveal delay={index * 55} distance={24} key={item.title}>
                <article className="timeline-item timeline-card">
                  <div className="timeline-marker-shell" aria-hidden="true">
                    <span className="timeline-marker-ring" />
                    <span className="timeline-node timeline-node-large">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="timeline-card-main">
                    <div className="timeline-card-top">
                      <div className="timeline-card-heading">
                        <p className="timeline-card-label">Review stage</p>
                        <h3 className="timeline-card-title">{item.title}</h3>
                      </div>
                      <span className="timeline-status-badge">{item.status}</span>
                    </div>

                    <div className="timeline-meta-grid">
                      <div className="timeline-meta-card">
                        <span className="timeline-meta-title">Date</span>
                        <span className="timeline-meta-value">{item.date}</span>
                      </div>
                      <div className="timeline-meta-card">
                        <span className="timeline-meta-title">Marks</span>
                        <span className="timeline-meta-value">{item.marks}</span>
                      </div>
                      <div className="timeline-meta-card timeline-meta-card-status">
                        <span className="timeline-meta-title">State</span>
                        <span className="timeline-meta-value">{item.status}</span>
                      </div>
                    </div>

                    <p className="timeline-card-note">{item.note}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MilestonesSection
