import Reveal from '../Reveal'
import SectionIntro from '../SectionIntro'

function TeamSection({ teamMembers }) {
  return (
    <section className="section-anchor section-shell" id="about">
      <div className="shell">
        <SectionIntro
          description="A clear roster structure is already in place, ready for final portraits, biographies, and project responsibilities."
          eyebrow="About Us"
          title="A research team roster designed for final profile details."
        />

        <div className="team-roster mt-12">
          {teamMembers.map((member, index) => (
            <Reveal delay={index * 55} distance={22} key={member.role}>
              <article className="team-profile surface card-lift rounded-[2rem] p-5 md:p-6">
                <div className="team-profile-media team-placeholder-shell rounded-[1.6rem] p-4">
                  <div className="team-placeholder-frame team-profile-frame rounded-[1.3rem] border border-dashed border-[color:var(--line)] p-4">
                    <div className="team-placeholder-stage team-profile-stage rounded-[1rem] p-4">
                      <div className="team-profile-media-top">
                        <span className="team-profile-badge">Profile reserve</span>
                        <span className="team-profile-index">0{index + 1}</span>
                      </div>
                      <div className="team-profile-media-bottom">
                        <p className="team-profile-media-label">Portrait slot</p>
                        <p className="team-profile-media-note">Ready for final academic profile imagery.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="team-profile-main">
                  <header className="team-profile-header">
                    <p className="team-profile-role">{member.role}</p>
                    <h3 className="team-profile-name">{member.name}</h3>
                  </header>

                  <p className="team-profile-bio">{member.bio}</p>

                  <dl className="team-profile-meta" aria-label={`${member.role} profile details`}>
                    <div className="team-profile-meta-item">
                      <dt className="team-profile-meta-label">Email</dt>
                      <dd className="team-profile-meta-value">{member.email}</dd>
                    </div>
                    <div className="team-profile-meta-item">
                      <dt className="team-profile-meta-label">Contribution</dt>
                      <dd className="team-profile-meta-value">{member.contribution}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TeamSection
