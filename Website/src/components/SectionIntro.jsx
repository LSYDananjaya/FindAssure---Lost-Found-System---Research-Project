import Reveal from './Reveal'

function SectionIntro({ eyebrow, title, description }) {
  return (
    <div className="section-intro-shell max-w-4xl">
      <Reveal className="inline-flex" distance={12}>
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <Reveal className="max-w-5xl" delay={60} distance={20}>
        <h2 className="section-intro-title mt-6 font-display text-[clamp(2.35rem,4.6vw,4rem)] font-semibold tracking-[-0.055em] text-[var(--ink)]">
          {title}
        </h2>
      </Reveal>
      <Reveal className="section-kicker mt-5" delay={120} distance={18}>
        <p>{description}</p>
      </Reveal>
    </div>
  )
}

export default SectionIntro
