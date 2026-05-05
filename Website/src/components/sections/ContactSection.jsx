import { useEffect, useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

const EMAILJS_PLACEHOLDERS = new Set([
  'YOUR_SERVICE_ID',
  'YOUR_TEMPLATE_ID',
  'YOUR_PUBLIC_KEY',
  'your_service_id_here',
  'your_template_id_here',
  'your_public_key_here',
])

function isConfiguredValue(value) {
  return Boolean(value && !EMAILJS_PLACEHOLDERS.has(value.trim()))
}

function ContactSection({ contactCards, contactDetails, projectMeta }) {
  const [submitted, setSubmitted] = useState(false)
  const [statusType, setStatusType] = useState('success') // 'success' or 'error'
  const [statusText, setStatusText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  })
  
  const formRef = useRef()
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''
  const isEmailConfigured =
    isConfiguredValue(serviceId) &&
    isConfiguredValue(templateId) &&
    isConfiguredValue(publicKey)

  useEffect(() => {
    if (!alert.visible) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setAlert((currentAlert) => ({
        ...currentAlert,
        visible: false,
      }))
    }, 5200)

    return () => window.clearTimeout(timeoutId)
  }, [alert.message, alert.title, alert.type, alert.visible])

  const showContactAlert = (type, title, message) => {
    setAlert({
      visible: true,
      type,
      title,
      message,
    })
  }

  const sendEmail = (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitted(false) // clear previous message
    setAlert((currentAlert) => ({
      ...currentAlert,
      visible: false,
    }))

    if (!isEmailConfigured) {
      const formData = new FormData(formRef.current)
      const name = formData.get('user_name') || ''
      const email = formData.get('user_email') || ''
      const subject = formData.get('subject') || `${projectMeta.shortName} research inquiry`
      const message = formData.get('message') || ''
      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        String(message),
      ].join('\n')

      window.location.href = `mailto:${contactDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setIsSubmitting(false)
      setSubmitted(true)
      setStatusType('success')
      setStatusText('Your email app has been opened with the inquiry details. Send the draft to contact the project team.')
      showContactAlert(
        'success',
        'Email draft ready',
        'Your email app opened with the inquiry details. Send the prepared draft to reach the project team.'
      )
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
          showContactAlert(
            'success',
            'Message sent',
            'Your inquiry was sent successfully. The FindAssure team will review it soon.'
          )
        },
        (error) => {
          console.error('EmailJS Error:', error)
          setSubmitted(true)
          setStatusType('error')
          setStatusText(`Failed to send message. ${error.text || 'Check console for details.'}`)
          setIsSubmitting(false)
          showContactAlert(
            'error',
            'Message not sent',
            error.text || 'Please try again or contact the project team by email.'
          )
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
              Send a message through the website. The form either forwards the
              inquiry directly or opens a prepared email draft for the project team.
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
                  className="button-primary contact-submit-button" 
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
          </Reveal>
        </div>
      </div>

      <div
        aria-hidden={!alert.visible}
        aria-live={alert.type === 'error' ? 'assertive' : 'polite'}
        className="contact-alert"
        data-type={alert.type}
        data-visible={alert.visible}
        role={alert.type === 'error' ? 'alert' : 'status'}
      >
        <span className="contact-alert-mark" aria-hidden="true" />
        <div>
          <p className="contact-alert-title">{alert.title}</p>
          <p className="contact-alert-message">{alert.message}</p>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
