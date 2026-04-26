import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'
import DownloadPlaceholderButton from '../DownloadPlaceholderButton'

function DocumentsSection({ documents }) {
  return (
    <section className="section-anchor section-shell" id="documents">
      <div className="shell">
        <SectionIntro
          description="Every document entry is data-driven and intentionally uses placeholder actions until the final files are approved for publication."
          eyebrow="Documents"
          title="A structured document library that is easy to update later."
        />

        <div className="mt-12 grid gap-4">
          {documents.map((document, index) => {
            const hasDownloadGrid = document.downloads?.length > 1

            return (
              <Reveal className="h-full" delay={index * 45} distance={20} key={document.title}>
                <article
                  className={`document-card surface card-lift rounded-[1.8rem] p-6${
                    hasDownloadGrid ? ' document-card--with-download-grid' : ''
                  }`}
                >
                  <div className="document-card-rail">
                    <div className="document-card-index inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-deep)]">
                      0{index + 1}
                    </div>
                    {document.downloads && !hasDownloadGrid && (
                      <div className="document-card-actions">
                        {document.downloads.map((download) => (
                          <DownloadPlaceholderButton
                            fileUrl={download.fileUrl}
                            key={download.label}
                            label={download.label}
                          />
                        ))}
                      </div>
                    )}
                    {!document.downloads && (
                      <div className="document-card-actions">
                        <DownloadPlaceholderButton fileUrl={document.fileUrl} label={document.actionLabel} />
                      </div>
                    )}
                  </div>
                  <div className="document-card-main">
                    <div className="document-card-heading">
                      <div className="document-card-meta flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-deep)]">
                          {document.type}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                          {document.status}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">
                        {document.type}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {document.title}
                      </p>
                    </div>
                    <p className="document-card-summary text-sm leading-7 text-[var(--muted)]">
                      {document.description}
                    </p>
                    <div className="document-card-link rounded-[1.3rem] border border-dashed border-[color:var(--line)] bg-[var(--shell)] px-4 py-3 text-sm text-[var(--muted)]">
                      {document.linkLabel}
                    </div>
                  </div>
                  {hasDownloadGrid && (
                    <div className="document-card-download-grid" aria-label={`${document.title} downloads`}>
                      {document.downloads.map((download) => (
                        <DownloadPlaceholderButton
                          fileUrl={download.fileUrl}
                          key={download.label}
                          label={download.label}
                        />
                      ))}
                    </div>
                  )}
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default DocumentsSection
