function Footer({ footerLinks, projectMeta }) {
  return (
    <footer className="border-t border-[color:var(--line)] bg-[var(--shell)]/92 transition-colors duration-200">
      <div className="shell flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="font-display text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {projectMeta.name}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            Public-facing research showcase built for academic review and future
            updates. Replace placeholder links and team details from the central
            content data file when final assets are available.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-[var(--muted)]">
          {footerLinks.map((item) => (
            <a
              className="transition-colors duration-200 hover:text-[var(--ink)]"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
