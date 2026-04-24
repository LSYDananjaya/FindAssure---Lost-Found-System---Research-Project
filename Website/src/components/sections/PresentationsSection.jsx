import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'
import DownloadPlaceholderButton from '../DownloadPlaceholderButton'

function PresentationsSection({ presentationDecks }) {
  return (
    <section className="section-anchor section-shell section-band" id="slides">
      <div className="shell">
        <SectionIntro
          description="Presentation decks follow the same data structure as documents, making it straightforward to swap placeholder actions for final files."
          eyebrow="Slides / Presentations"
          title="Presentation entries prepared for proposal, progress, and final review decks."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {presentationDecks.map((deck, index) => (
            <Reveal className="h-full" delay={index * 50} distance={22} key={deck.title}>
              <article className="surface card-lift flex h-full flex-col rounded-[2rem] p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-[1.5rem] bg-[var(--shell)] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                      Presentation deck
                    </p>
                    <p className="mt-2 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--accent-deep)]">
                      0{index + 1}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                    {deck.status}
                  </span>
                </div>
                <h3 className="mt-6 max-w-md font-display text-[1.9rem] font-semibold tracking-[-0.045em] text-[var(--ink)]">
                  {deck.title}
                </h3>
                <p className="mt-3 flex-1 max-w-[54ch] text-sm leading-7 text-[var(--muted)]">
                  {deck.description}
                </p>
                <div className="mt-6 flex flex-col gap-4 border-t border-[color:var(--line)] pt-5 md:flex-row md:items-center md:justify-between">
                  <div className="rounded-[1.2rem] border border-dashed border-[color:var(--line)] bg-[var(--shell)] px-4 py-3 text-sm text-[var(--muted)]">
                    {deck.linkLabel}
                  </div>
                  <DownloadPlaceholderButton fileUrl={deck.fileUrl} label={deck.actionLabel} />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PresentationsSection
