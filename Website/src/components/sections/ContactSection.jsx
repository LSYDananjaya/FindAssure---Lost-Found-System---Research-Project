import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function ContactSection({ contactCards, contactDetails, projectMeta }) {
  const [submitted, setSubmitted] = useState(false)
  const [statusType, setStatusType] = useState('success') // 'success' or 'error'
  const [statusText, setStatusText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const formRef = useRef()

  const sendEmail = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitted(false) // clear previous message

    // To use this, sign up at https://www.emailjs.com/
    // Create an Email Service, an Email Template, and get your Public Key from Account -> API Keys
    // Add your keys here or in a .env file (e.g. VITE_EMAILJS_SERVICE_ID=your_id)
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID'
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID'
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY'

    if (serviceId === 'YOUR_SERVICE_ID') {
      setIsSubmitting(false)
      setSubmitted(true)
      setStatusType('error')
      setStatusText('EmailJS is not configured. Please add your credentials in the code or .env file.')
      return
    }

    emailjs
      .sendForm(serviceId, templateId, formRef.current, {
        publicKey: publicKey,
      })
      .then(
        () => {
          setSubmitted(true)
          setStatusType('success')
          setStatusText('Thank you! Your message has been sent successfully.')
          setIsSubmitting(false)
          formRef.current.reset()
        },
        (error) => {
          console.error('EmailJS Error:', error)
          setSubmitted(true)
          setStatusType('error')
          setStatusText(`Failed to send message. ${error.text || 'Check console for details.'}`)
          setIsSubmitting(false)
        }
      )
  }

  return (
    <section className="section-anchor section-shell" id="contact">
      <div className="shell">
        <SectionIntro
          description="Have questions about the FindAssure platform or want to explore potential deployments in your institution? Reach out to our research team for technical and operational discussions."
          eyebrow="Contact Us"
          title="Get in touch with the project team."
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
                  System Status
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  The inquiry system is fully active and directly connected to our core research team for prompt review.
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
                Active
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Send us a message directly from the website. We'll get back to you 
              as soon as possible using the provided contact details.
            </p>

            <form
              ref={formRef}
              className="mt-8 grid gap-4"
              onSubmit={sendEmail}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                  Name
                  <input 
                    name="user_name"
                    required
                    className="field" 
                    placeholder="Your name" 
                    type="text" 
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                  Email
                  <input
                    name="user_email"
                    required
                    className="field"
                    placeholder="your.email@example.com"
                    type="email"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Subject
                <input
                  name="subject"
                  required
                  className="field"
                  placeholder="Research inquiry or collaboration topic"
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
                Message
                <textarea
                  name="message"
                  required
                  className="field min-h-36 resize-y"
                  placeholder="Write your message here."
                />
              </label>

              <div className="flex flex-col gap-4 border-t border-[color:var(--line)] pt-4 md:flex-row md:items-center md:justify-between">
                <p className="max-w-xl text-sm leading-7 text-[var(--muted)]">
                   Your message will be sent securely to our research team for review and response.
                </p>
                <button 
                  className="button-primary" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send inquiry'}
                </button>
              </div>

              <p
                className={`form-feedback rounded-[1.2rem] border px-4 py-3 text-sm 
                  ${statusType === 'error' 
                    ? 'border-red-500/20 bg-red-500/10 text-red-600' 
                    : 'border-[color:var(--line)] bg-[var(--card-soft)] text-[var(--muted)]'
                  }`}
                data-visible={submitted}
              >
                <span className="form-feedback-inner">
                  {statusText}
                </span>
              </p>
            </form>


            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] bg-[var(--card-soft)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Location
                </p>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {contactDetails.location}
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
