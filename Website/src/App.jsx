import { useMemo } from 'react'
import Footer from './components/Footer'
import Header from './components/Header'
import ContactSection from './components/sections/ContactSection'
import DocumentsSection from './components/sections/DocumentsSection'
import DomainSection from './components/sections/DomainSection'
import HeroSection from './components/sections/HeroSection'
import MilestonesSection from './components/sections/MilestonesSection'
import OverviewSection from './components/sections/OverviewSection'
import PresentationsSection from './components/sections/PresentationsSection'
import TeamSection from './components/sections/TeamSection'
import {
  contactCards,
  contactDetails,
  domainSections,
  documents,
  footerLinks,
  heroHighlights,
  methodologySteps,
  milestoneItems,
  navigationItems,
  overviewBlocks,
  presentationDecks,
  projectMeta,
  quickFacts,
  teamMembers,
  technologyGroups,
} from './data/siteContent'
import { useActiveSection } from './hooks/useActiveSection'
import { useThemeMode } from './hooks/useThemeMode'

function App() {
  const sectionIds = useMemo(
    () => navigationItems.map((item) => item.href.replace('#', '')),
    [],
  )
  const activeSection = useActiveSection(sectionIds)
  const { activeTheme, setThemePreference } = useThemeMode()

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-200">
      <Header
        activeSection={activeSection}
        activeTheme={activeTheme}
        navigationItems={navigationItems}
        projectTitle={projectMeta.shortName}
        setThemePreference={setThemePreference}
      />
      <main className="overflow-x-hidden w-full max-w-full">
        <HeroSection
          heroHighlights={heroHighlights}
          methodologySteps={methodologySteps}
          projectMeta={projectMeta}
          quickFacts={quickFacts}
        />
        <OverviewSection overviewBlocks={overviewBlocks} projectMeta={projectMeta} />
        <DomainSection
          domainSections={domainSections}
          methodologySteps={methodologySteps}
          technologyGroups={technologyGroups}
        />
        <MilestonesSection items={milestoneItems} />
        <DocumentsSection documents={documents} />
        <PresentationsSection presentationDecks={presentationDecks} />
        <TeamSection teamMembers={teamMembers} />
        <ContactSection
          contactCards={contactCards}
          contactDetails={contactDetails}
          projectMeta={projectMeta}
        />
      </main>
      <Footer footerLinks={footerLinks} projectMeta={projectMeta} />
    </div>
  )
}

export default App
