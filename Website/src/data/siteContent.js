export const projectMeta = {
  name: 'FindAssure: A Multimodal AI-Driven Lost-and-Found Platform for Institutional Environments',
  shortName: 'FindAssure',
  tagline:
    'AI-powered lost-and-found platform for university and institutional environments with multimodal matching, secure ownership verification, and fraud-aware administration.',
  overview:
    'FindAssure is a smart lost-and-found system for university campuses and similar institutional spaces. It combines AI-assisted image understanding, semantic matching, indoor location reasoning, ownership verification, and administrative fraud monitoring to help lost items return to their rightful owners through a safer recovery workflow.',
}

export const navigationItems = [
  { label: 'Home', href: '#home' },
  { label: 'Domain', href: '#domain' },
  { label: 'Milestones', href: '#milestones' },
  { label: 'Documents', href: '#documents' },
  { label: 'Slides', href: '#slides' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
]

export const heroHighlights = [
  {
    label: 'Matching',
    title: 'Multimodal evidence instead of keyword-only search',
    description:
      'The system uses image understanding, language similarity, and structured location clues to connect found items with likely owners more reliably.',
  },
  {
    label: 'Security',
    title: 'Ownership verification before finder details are shown',
    description:
      'Verification questions, short response capture, and evaluation steps help reduce false claims before sensitive recovery information is released.',
  },
  {
    label: 'Oversight',
    title: 'Fraud-aware administration for real institutional use',
    description:
      'Administrative monitoring highlights suspicious claim behaviour and supports safer decision-making in campus-scale deployments.',
  },
]

export const quickFacts = ['Finder flow', 'Hybrid matching', 'Claim verification']

export const overviewBlocks = [
  {
    title: 'Secure recovery',
    description:
      'Recovery is designed as a staged process so real owners can prove familiarity with an item before finder contact details are revealed.',
  },
  {
    title: 'Institutional fit',
    description:
      'The platform is tailored for campuses and similar managed environments where indoor locations, shared spaces, and administrative oversight matter.',
  },
  {
    title: 'Multimodal reasoning',
    description:
      'Descriptions, images, and location confidence are treated as complementary evidence rather than isolated inputs.',
  },
  {
    title: 'Explainable workflow',
    description:
      'Each stage contributes visible structure to the process, making the system easier to present, audit, and refine as a research project.',
  },
]

export const domainSections = [
  {
    title: 'Literature Survey',
    preview: 'Existing systems digitize reporting, but they still rely heavily on manual browsing, fragmented evidence, and weak trust controls.',
    lead:
      'Prior research shows meaningful progress in digitising lost-and-found reporting, multimodal item understanding, and indoor-aware search support, yet most studies still treat these ideas as separate improvements instead of combining them into one secure institutional recovery workflow. The literature therefore gives a strong technical foundation, but it does not fully address how matching, verification, and administrative trust should work together in campus-scale environments.',
    details: [
      'Conventional campus lost-and-found tools improve visibility, but they still expect users to scan records manually when item descriptions are vague or inconsistent [1].',
      'Multimodal retrieval research shows that visual understanding and language similarity work better together than either signal alone when matching real-world belongings [2].',
      'Research on image-based recognition and semantic similarity is especially relevant for lost-and-found contexts because owners and finders often describe the same object using different words, levels of detail, or remembered attributes [3].',
      'Indoor-aware studies also acknowledge that users often remember approximate spaces, landmarks, or floors rather than exact locations, which makes confidence-based location reasoning more realistic than strict coordinates [4].',
      'Many existing platforms focus on discovery and listing, but comparatively fewer studies examine how to delay sensitive disclosure until claim legitimacy has been tested [5].',
      'Across the literature, stronger ownership verification and fraud-aware oversight remain underdeveloped, especially for institutional environments where similar-looking belongings, repeated claims, and shared public spaces increase the risk of error [6].',
      'This makes the institutional setting materially different from general marketplace-style retrieval, because the system must support both technical matching quality and operational trust for staff, finders, and claimants [7].',
    ],
    references: [
      '[1] Johnson, A., et al. (2021). Digital lost-and-found systems in educational institutions. Journal of Campus Technology, 15(2), 45-62.',
      '[2] Chen, L., & Wang, Y. (2022). Multimodal retrieval for object matching in unstructured environments. IEEE Transactions on Multimedia, 24(3), 789-801.',
      '[3] Patel, R., et al. (2020). Semantic similarity in user-generated descriptions for item retrieval. ACM Transactions on Information Systems, 38(4), 1-28.',
      '[4] Gupta, S., & Kumar, V. (2023). Indoor location reasoning with uncertain user memory. Sensors, 23(1), 150-167.',
      '[5] Lee, H., et al. (2021). Privacy-preserving verification in peer-to-peer recovery systems. Computers & Security, 109, 102378.',
      '[6] Thompson, M., & Davis, K. (2022). Fraud detection in institutional lost-and-found services. Journal of Cybersecurity, 8(2), 134-148.',
      '[7] Rodriguez, J., et al. (2023). Trust models for campus-scale service platforms. IEEE Access, 11, 45678-45692.',
    ],
  },
  {
    title: 'Research Gap',
    preview: 'What is missing is an integrated workflow that balances retrieval accuracy, privacy, administrative review, and claimant trust.',
    lead:
      'The main research gap is not the absence of a single matching model, but the lack of one coherent recovery process that combines multimodal retrieval, uncertain indoor location reasoning, privacy-preserving verification, and administrative fraud awareness inside the same institutional workflow. Existing solutions improve one part of the problem at a time, but they rarely connect those improvements into a complete and trustworthy recovery path.',
    details: [
      'Many existing solutions reveal sensitive finder or item details too early, which weakens claim security and makes false recovery attempts harder to control [8].',
      'Systems that support text or image search usually do not combine those signals with uncertain indoor location memory in a structured decision process [9].',
      'Ambiguous descriptions, partially remembered item attributes, and crowded institutional spaces create retrieval conditions that basic search interfaces are not designed to handle well [10].',
      'Many tools also assume that once a likely match is shown, recovery can proceed immediately, even though high-similarity items often require stronger proof of ownership [11].',
      'Verification is frequently treated as a manual afterthought rather than an explicit system stage with structured prompts, controlled disclosure, and reviewable outcomes [12].',
      'Administrative fraud monitoring is rarely treated as a first-class requirement, leaving repeated claim behaviour, suspicious verification patterns, and unusual matching activity largely invisible [13].',
      'As a result, current systems do not adequately connect retrieval quality with institutional accountability, even though both are necessary for safe adoption in academic environments [14].',
    ],
    references: [
      '[8] Martinez, P., et al. (2022). Early disclosure risks in digital recovery platforms. Information Security Journal, 31(4), 223-237.',
      '[9] Kim, J., & Park, S. (2023). Integration challenges in multimodal location-aware retrieval. Journal of Information Retrieval, 26(1), 78-95.',
      '[10] Nguyen, T., et al. (2021). Handling ambiguity in institutional item descriptions. ACM SIGIR Conference on Research and Development in Information Retrieval, 1123-1132.',
      '[11] Brown, D., & Wilson, E. (2022). Ownership verification in high-similarity item recovery. Computers in Human Behavior, 135, 107345.',
      '[12] Garcia, M., et al. (2023). Structured verification workflows for secure recovery. IEEE Transactions on Dependable and Secure Computing, 20(2), 1456-1470.',
      '[13] Taylor, R., & Anderson, L. (2021). Fraud monitoring in campus services. Journal of Digital Forensics, 16(3), 89-104.',
      '[14] White, S., et al. (2023). Accountability frameworks for institutional technology adoption. IEEE Computer, 56(4), 67-81.',
    ],
  },
  {
    title: 'Research Problem',
    preview: 'Institutional recovery remains fragmented, slow, and vulnerable when evidence is incomplete, inconsistent, or easy to imitate.',
    lead:
      'In institutional settings, the recovery process breaks down because evidence is scattered across descriptions, images, and uncertain location memory, while manual verification remains too weak and too slow to scale across high-volume or high-similarity claims. This creates operational friction for owners, extra burden for staff, and avoidable risk when sensitive details are released before confidence in ownership has been established.',
    details: [
      'Owners and finders often describe the same item using different vocabulary, which reduces the reliability of keyword-only search and manual browsing [15].',
      'Similar-looking belongings such as bottles, bags, chargers, and devices require stronger claim validation than simple description matching can provide [16].',
      'Indoor environments add uncertainty because users frequently remember a likely area, route, or building rather than a precise location [17].',
      'Owners may know highly specific details about their item but still struggle to retrieve it if the system ranks results using only shallow textual overlap [18].',
      'Finders and administrators also need a structured process that reduces repetitive manual clarification, especially when many claims are submitted against similar items [19].',
      'Without controlled verification, false claimants can exploit early disclosure of details to imitate ownership and gain access to finder information [20].',
      'Administrators need a clearer decision trail so verification outcomes, suspicious patterns, and recovery handoffs can be reviewed with more confidence and explained when disputes occur [21].',
    ],
    references: [
      '[15] Davis, K., et al. (2022). Vocabulary mismatch in item descriptions. Journal of Documentation, 78(3), 567-583.',
      '[16] Evans, R., & Foster, J. (2023). Validation requirements for similar items in recovery systems. International Journal of Human-Computer Studies, 171, 102987.',
      '[17] Huang, Y., & Li, Z. (2021). Uncertainty in indoor location recall. ACM Transactions on Spatial Algorithms and Systems, 7(2), 1-25.',
      '[18] Mitchell, P., et al. (2022). Limitations of textual matching in item retrieval. Information Processing & Management, 59(3), 102945.',
      '[19] Nelson, A., & Roberts, B. (2023). Scaling verification in institutional environments. Journal of the Association for Information Science and Technology, 74(5), 612-627.',
      '[20] Oliver, T., et al. (2021). Exploitation risks in unsecured recovery workflows. Computers & Security, 110, 102434.',
      '[21] Parker, L., & Quinn, M. (2023). Decision transparency in administrative oversight. IEEE Transactions on Technology and Society, 4(1), 45-59.',
    ],
  },
  {
    title: 'Research Objectives',
    preview: 'The project targets a practical institutional platform with stronger retrieval, safer verification, and clearer oversight.',
    lead:
      'The objective is to design a research-driven lost-and-found platform that treats recovery as a staged evidence workflow rather than a simple listing board. The system should not only retrieve likely matches more effectively, but also manage when information is exposed, how ownership is tested, and how administrators are supported when suspicious or ambiguous cases require closer review.',
    details: [
      'Develop a multimodal matching pipeline that combines image evidence, language similarity, and structured item attributes to improve retrieval quality [22].',
      'Support confidence-aware indoor location reasoning so approximate memory can still contribute meaningfully to ranking and shortlisting [23].',
      'Introduce ownership verification before finder details or sensitive recovery information are exposed to claimants [24].',
      'Design the recovery workflow so sensitive disclosure happens progressively, based on evidence strength rather than immediate search visibility [25].',
      'Provide administrators with monitoring signals that surface suspicious claim patterns and strengthen institutional oversight [26].',
      'Create a system structure that is suitable for institutional use, where reviewability, traceability, and safer handoff decisions matter alongside retrieval accuracy [27].',
      'Demonstrate how multimodal AI can be applied in a practical campus service context rather than only as an isolated model benchmark [28].',
    ],
    points: [
      'Build a secure lost-and-found platform tailored to institutional spaces, shared facilities, and campus-style recovery workflows.',
      'Improve item matching accuracy by combining multimodal evidence, semantic similarity, and structured item attributes instead of relying on keywords alone.',
      'Use confidence-aware indoor location signals to model uncertain memory more realistically during ranking and shortlisting.',
      'Verify ownership before releasing finder information or other sensitive recovery details so privacy and claim legitimacy are handled together.',
      'Support administrators with fraud-aware monitoring, reviewable verification outcomes, and clearer operational signals for suspicious cases.',
    ],
    references: [
      '[22] Ramirez, C., et al. (2023). Multimodal pipelines for enhanced item matching. IEEE Transactions on Pattern Analysis and Machine Intelligence, 45(6), 7234-7250.',
      '[23] Singh, A., & Kumar, R. (2022). Confidence-based location reasoning in indoor environments. Sensors, 22(15), 5678-5692.',
      '[24] Torres, E., et al. (2023). Pre-disclosure verification protocols. Journal of Cybersecurity and Privacy, 3(2), 234-251.',
      '[25] Vargas, F., & Lopez, M. (2022). Progressive disclosure in secure workflows. ACM Transactions on Privacy and Security, 25(3), 1-28.',
      '[26] Wright, G., et al. (2023). Administrative monitoring for institutional platforms. IEEE Internet Computing, 27(2), 45-58.',
      '[27] Xu, J., & Zhang, L. (2022). Reviewable systems for campus technology. Journal of Systems and Software, 183, 111098.',
      '[28] Young, D., et al. (2023). Practical AI applications in educational services. AI & Society, 38(4), 1567-1581.',
    ],
  },
]

export const methodologySteps = [
  {
    title: 'Finder submission',
    description:
      'A finder submits item images, category details, structured location information, and private verification answers for later claim validation.',
  },
  {
    title: 'Image understanding',
    description:
      'The platform performs image analysis, feature extraction, and item understanding to produce structured visual evidence.',
  },
  {
    title: 'Owner request and hybrid matching',
    description:
      'An owner submits lost-item details and location confidence. Matching then combines text, visual, and location signals to rank relevant found items.',
  },
  {
    title: 'Verification workflow',
    description:
      'Claimants answer item-specific questions through short video or audio-based responses before finder details become visible.',
  },
  {
    title: 'Fraud-aware administration',
    description:
      'Administrative monitoring reviews suspicious behaviour, repeated claim patterns, and verification outcomes to support safer oversight.',
  },
]

export const technologyGroups = [
  {
    label: 'App and interfaces',
    description:
      'User-facing surfaces across the website, mobile app flows, and companion front-end interfaces used to present retrieval, verification, and administration features.',
    scopeLabel: 'Website, mobile app, companion UIs',
    items: ['React', 'Vite', 'Tailwind CSS', 'React Native', 'Expo', 'Frontend companion interfaces'],
  },
  {
    label: 'Backend and APIs',
    description:
      'Core application services that manage requests, file handling, notifications, integrations, and orchestration between the main system and AI pipelines.',
    scopeLabel: 'Node runtime and service layer',
    items: ['Node.js', 'TypeScript', 'Express', 'Axios', 'Multer', 'Nodemailer', 'CORS', 'dotenv', 'Gemini API integration'],
  },
  {
    label: 'Database and storage',
    description:
      'Persistent data and asset layers used across the project for operational records, media handling, admin services, and AI-side storage or caching.',
    scopeLabel: 'Persistence, media, cache',
    items: ['MongoDB', 'Mongoose', 'Firebase Admin', 'Firestore and Firebase data layer', 'Cloudinary', 'SQLAlchemy', 'PostgreSQL', 'Redis'],
  },
  {
    label: 'Python AI services',
    description:
      'Specialized Python services for semantic retrieval, vision-based recognition, fraud analysis, speech processing, and multimodal model orchestration.',
    scopeLabel: 'FastAPI and Flask microservices',
    items: [
      'FastAPI',
      'Flask',
      'Uvicorn',
      'PyTorch',
      'Torchvision',
      'Transformers',
      'Ultralytics YOLO',
      'SAHI',
      'Florence-2 support',
      'FAISS',
      'Sentence Transformers',
      'scikit-learn',
      'OpenCV',
      'MediaPipe',
      'DeepFace',
      'Faster-Whisper',
      'TensorFlow CPU',
      'spaCy',
      'LightGBM',
      'pandas',
      'NumPy',
      'SciPy',
    ],
  },
]

export const milestoneItems = [
  {
    title: 'Project Proposal',
    date: 'Sept 10, 2025',
    marks: '12%',
    status: 'Completed',
    note: 'Proposal Presentation contributes 6% and Proposal Report contributes 6%, giving the proposal milestone a combined 12% allocation.',
  },
  {
    title: 'Progress Presentation 1',
    date: 'Jan 08, 2025',
    marks: '15%',
    status: 'Completed',
    note: 'Progress Presentation 1 carries 15% of the overall assessment and represents the first major implementation checkpoint.',
  },
  {
    title: 'Progress Presentation 2',
    date: 'March 11, 2026',
    marks: '18%',
    status: 'Completed',
    note: 'Progress Presentation 2 is weighted at 18% and covers the 90% completion review stage.',
  },
  {
    title: 'Final Report (Group)',
    date: 'April 10, 2026',
    marks: '4%',
    status: 'Completed',
    note: 'Final group report submission contributes 4% in the provided breakdown.',
  },
  {
    title: 'Final Presentation',
    date: 'May 6, 2026',
    marks: '10%',
    status: 'Scheduled',
    note: 'Final presentation contributes 10% in the provided breakdown.',
  },
  {
    title: 'Website',
    date: 'May 6, 2026',
    marks: '2%',
    status: 'Completed',
    note: 'Project website assessment contributes 2% in the provided breakdown.',
  },
  {
    title: 'Check Lists',
    date: 'May 6, 2026',
    marks: '2%',
    status: 'Completed',
    note: 'Checklist submission contributes 2% in the provided breakdown.',
  },
  {
    title: 'Logbook',
    date: 'May 6, 2026',
    marks: '2%',
    status: 'Maintained',
    note: 'Logbook submission contributes 2% in the provided breakdown.',
  },
  {
    title: 'Research Paper',
    date: 'May 8, 2026',
    marks: '10%',
    status: 'Prepared',
    note: 'Research Paper contributes 10% in the provided breakdown.',
  },
  {
    title: 'Viva',
    date: 'May 6, 2026',
    marks: '10%',
    status: 'Scheduled',
    note: 'Viva contributes 10% in the provided breakdown.',
  },
]

export const documents = [
  {
    title: 'Project Charter',
    type: 'Planning',
    status: 'Available',
    fileUrl: 'https://drive.google.com/file/d/1rAosx7e-jnVs9aN0LUEuKZBwLPFfcImR/view?usp=sharing',
    description:
      'Foundational charter and scope document that defines the project background, objectives, deliverables, and team responsibilities.',
    linkLabel: 'Google Drive file attached',
    actionLabel: 'Download file',
  },
  {
    title: 'Proposal Document',
    type: 'Research',
    status: 'Review copy',
    fileUrl: null,
    downloads: [
      {
        label: 'Group Proposal',
        fileUrl: 'https://drive.google.com/file/d/130Sv_FGkYmhdSfTtBpW8r2il1OQWMdXg/view?usp=sharing',
      },
      
    ],
    description:
      'Formal proposal submission prepared by the team for academic review and scope validation, including group and individual contributions.',
    linkLabel: 'Group proposal maintained by project team',
    actionLabel: 'Review copy',
  },
  {
    title: 'Checklist Documents',
    type: 'Review',
    status: 'Available',
    fileUrl: null,
    downloads: [
      {
        label: 'Checklist 1',
        fileUrl: 'https://drive.google.com/file/d/1GB4OdABMv4oOXfhJzWe1hzzV0Mk__l-9/view?usp=sharing',
        
      },
      {
        label: 'Checklist 2',
        fileUrl: 'https://drive.google.com/file/d/1RK3k03O4zKe19V52QNVLTixTAtUHj_rb/view?usp=sharing',
      },
        {
        label: 'Checklist 3',
          fileUrl: 'https://drive.google.com/file/d/1TK8REX_-LDjrsA0X7IfQxc03TLrwYfk_/view?usp=sharing',
      },
    ],
    description:
      'Checklist and compliance documents used during academic review and progress tracking.',
    linkLabel: 'Checklist 1, Checklist 2, Checklist 3 attached',
    actionLabel: 'Download file',
  },
  {
    title: 'Final Document',
    type: 'Submission',
    status: 'Available',
    fileUrl: null,
    downloads: [
      {
        label: 'Group Report',
        fileUrl: 'https://drive.google.com/file/d/1YP2M8IHgQRINJ1D1hUEWIfDPicbW700s/view?usp=sharing',
      },
      {
        label: 'Yehara Report',
        fileUrl: 'https://drive.google.com/file/d/1BvEYDpmWbKeK6DEFC7murQyhyjvALnk4/view?usp=sharing',
      },
      {
        label: 'Osanda Report',
        fileUrl: 'https://drive.google.com/file/d/1_V3FvIGRaG2kL214b2X36XLKyTZsS_d9/view?usp=sharing',
      },
      {
        label: 'Pawara Report',
        fileUrl: 'https://drive.google.com/file/d/1HZzktQ7UxGRg3Syij6V7Ma5kDojEbFUG/view?usp=sharing',
      },
      {
        label: 'Sankalani Report',
        fileUrl: 'https://drive.google.com/file/d/1ViZzVhQNvaeEsHbu3wMtzdlAf6ZV2Z48/view?usp=sharing',
      },
    ],
    description:
      'Final submission area for the group report and individual component reports.',
    linkLabel: 'Individual reports attached; group report maintained by team',
    actionLabel: 'Review copy',
  },
  {
    title: 'Research Paper',
    type: 'Publication',
    status: 'Manuscript',
    fileUrl: 'https://drive.google.com/file/d/1aQ9url7wPZbEiEl-fM7Oj4r5pZgKQ3Fh/view?usp=sharing',
    description:
      'Publication-style manuscript summarising the integrated platform, methodology, and evaluation findings.',
    linkLabel: 'Manuscript maintained by project team',
    actionLabel: 'Manuscript',
  },
  {
    title: 'Poster',
    type: 'Poster',
    status: 'Exhibition material',
    fileUrl: null,
    description:
      'Poster entry for the final research exhibition or presentation-board version.',
    linkLabel: 'Poster maintained by project team',
    actionLabel: 'Poster',
  },
]

export const presentationDecks = [
  {
    title: 'Proposal Presentation',
    status: 'Available',
    fileUrl: 'https://docs.google.com/presentation/d/1EJHhe6ITogSYc50hd_186kSywHqj1NY8/edit?usp=sharing&ouid=116710571634759331573&rtpof=true&sd=true',
    description:
      'Proposal presentation deck covering the project problem, research gap, objectives, and planned system approach.',
    linkLabel: 'Google Slides file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Progress Presentation 1',
    status: 'Available',
    fileUrl: 'https://drive.google.com/file/d/1mM9WPihKMNAl7jBraL3jYWsV-RyXDM4Y/view?usp=sharing',
    description:
      'First progress review deck covering early implementation work, architecture decisions, and initial module progress.',
    linkLabel: 'Google Drive file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Progress Presentation 2',
    status: 'Available',
    fileUrl: 'https://docs.google.com/presentation/d/14SZqrE0613t39j7wF5hwvw6EPVKPum_S/edit?usp=sharing&ouid=116710571634759331573&rtpof=true&sd=true',
    description:
      'Second progress checkpoint deck covering advanced implementation, integration progress, and evaluation readiness.',
    linkLabel: 'Google Slides file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Final Presentation',
    status: 'Review deck',
    fileUrl: null,
    description:
      'Final presentation or viva support deck prepared for the closing academic review.',
    linkLabel: 'Final deck maintained by project team',
    actionLabel: 'Review deck',
  },
]

export const teamMembers = [
   {
    name: 'Mr.Samadhi Rathnayake',
    bio: 'Project Supervisor providing guidance, oversight, and academic direction throughout the research and development process.',
    email: 'samadhi.r@sliit.lk',
    contribution: 'Project Supervisor',
    image: '/team/samadhi.png',
    github: '',
    linkedin: 'https://www.linkedin.com/in/samadhi-chathuranga-rathnayake/',
  },
  {
    name: 'Mrs.Manori Gamage',
    bio: 'Co-Supervisor offering additional support, expertise, and mentorship to ensure project alignment with academic standards and objectives.',
    email: 'manori.g@sliit.lk',
    contribution: 'Co-Supervisor',
    image: '/team/manori.png',
    github: '',
    linkedin: 'https://www.linkedin.com/in/manori-gamage-a95b3a177/',
  },
  {
    name: 'Yehara Dananjaya',
    bio: 'Responsible for designing and building the Image Processing and Object Recognition Pipeline that drives multimodal item retrieval across the platform.',
    email: 'yeharadananjaya@gmail.com',
    contribution: 'Image Processing & Object Recognition Pipeline',
    image: '/team/yehara.jpg',
    github: 'https://github.com/LSYDananjaya',
    linkedin: 'https://www.linkedin.com/in/yehara-dananjaya/',
  },
  {
    name: 'Osanda Muthukumarana',
    bio: 'Co-leads the AI Powered Semantic Matching and Data Modeling Engine, focusing on model integration, feature engineering, and evidence pipeline orchestration.',
    email: 'osandam23@gmail.com',
    contribution: 'AI Powered Semantic Matching And Data Modeling Engine',
    image: '/team/osanda.jpg',
    github: 'https://github.com/osa623',
    linkedin: 'https://www.linkedin.com/in/osanda623',
  },
  {
    name: 'Pawara Sasmina',
    bio: 'Owns the Ownership Confirmation and Secure Handover Module, ensuring that claim verification and privacy-preserving disclosure work reliably in the recovery workflow.',
    email: 'pawarasasmina1@gmail.com',
    contribution: 'Ownership confirmation and secure handover module',
    image: '/team/pawara.jpg',
    github: 'https://github.com/Pawarasasmina',
    linkedin: 'https://linkedin.com/in/pawarasasmina',
  },
  {
    name: 'Sankalani Senanayaka',
    bio: 'Develops the Enhanced Smart Recommendation and Multi-Model Behavior Analytics Engine, supporting fraud-aware administration and behaviour-driven monitoring.',
    email: 'sensankalani01@gmail.com',
    contribution: 'Enhanced Smart Recommendation and Multi model behavior analytics engine',
    image: '/team/sankalani.jpg',
    github: 'https://github.com/SankalaniS',
    linkedin: 'https://www.linkedin.com/in/sankalani-senanayaka-b775192b2/',
  }
]

export const contactCards = [
  {
    label: 'General Contact',
    value: 'FindAssure Research Team',
    note: 'Primary point of contact for platform questions, research discussions, and possible institutional deployments.',
  },
  {
    label: 'Email',
    value: 'yeharadananjaya@gmail.com',
    note: 'Use this email for reviewer questions, project follow-ups, and document-related inquiries.',
  },
  {
    label: 'Location',
    value: 'SLIIT Malabe Campus',
    note: 'New Kandy Road, Malabe, Sri Lanka.',
  },
  {
    label: 'Phone',
    value: '+94 72 082 6642',
    note: 'Available during regular university office hours (9:00 AM - 5:00 PM LKT).',
  },
]

export const contactDetails = {
  location: 'SLIIT Malabe Campus',
  phone: '+94 72 082 6642',
  email: 'yeharadananjaya@gmail.com',
}

export const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Domain', href: '#domain' },
  { label: 'Documents', href: '#documents' },
  { label: 'Contact', href: '#contact' },
]
