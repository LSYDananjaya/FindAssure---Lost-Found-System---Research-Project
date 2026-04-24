import { useState } from 'react'
import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function ContactSection({ contactCards, contactDetails, projectMeta }) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="section-anchor section-shell" id="contact">
      <div className="shell">
        <SectionIntro
          description="The contact area is ready for final institutional details. Until then, it keeps the structure visible without inventing phone numbers, addresses, or personal contacts."
          eyebrow="Contact Us"
          title="A clear inquiry path, ready for real project contacts."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="surface rounded-[2rem] p-8 md:p-10" distance={24}>
            <div className="flex flex-col gap-6">
              {contactCards.map((card, index) => (
                <Reveal delay={80 + index * 45} distance={16} key={card.label}>
                  <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[var(--card-soft)] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                          {card.label}
                        </p>
                        <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
                          {card.value}
                        </p>
                      </div>
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] px-3 text-sm font-bold text-[var(--accent-deep)]">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">
                      {card.note}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-8" delay={220} distance={14} variant="scale-soft">
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[var(--canvas)] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Current placeholder note
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Replace the general email, phone, and location fields in the
                  shared data file once your final project contacts are confirmed.
                </p>
              </div>
            </Reveal>
          </Reveal>

          <Reveal className="surface rounded-[2rem] p-8 md:p-10" delay={80} distance={24} variant="fade-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Inquiry Form
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Contact the project team
                </h3>
              </div>
              <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                Front-end only
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              This form is intentionally presentation-only unless you connect it
              to a backend later. It gives the website a professional inquiry
              pattern without pretending a live channel already exists.
            </p>

            <form
              className="mt-8 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                setSubmitted(true)
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                  Name
                  <input className="field" placeholder="Your name" type="text" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                  Email
                  <input
                    className="field"
                    placeholder="your.email@example.com"
                    type="email"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Subject
                <input
                  className="field"
                  placeholder="Research inquiry or collaboration topic"
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Message
                <textarea
                  className="field min-h-36 resize-y"
                  placeholder="Write your message here."
                />
              </label>

              <div className="flex flex-col gap-4 border-t border-[color:var(--line)] pt-4 md:flex-row md:items-center md:justify-between">
                <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                  Suggested recipient: {contactDetails.email}. Update this value
                  when the final project contact is approved.
                </p>
                <button className="button-primary" type="submit">
                  Send inquiry
                </button>
              </div>

              <p
                className="form-feedback rounded-[1.2rem] border border-[color:var(--line)] bg-[var(--card-soft)] px-4 py-3 text-sm text-[var(--muted)]"
                data-visible={submitted}
              >
                <span className="form-feedback-inner">
                  Inquiry UI submitted locally. Connect this form to a mail or
                  API workflow later if you want production handling.
                </span>
              </p>
            </form>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[var(--card-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Email
                </p>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {contactDetails.email}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--card-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Phone
                </p>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {contactDetails.phone}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-[var(--card-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Reference
                </p>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {projectMeta.shortName} public project website
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
