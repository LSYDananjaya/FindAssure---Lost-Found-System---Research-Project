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
      'Conventional campus lost-and-found tools improve visibility, but they still expect users to scan records manually when item descriptions are vague or inconsistent.',
      'Multimodal retrieval research shows that visual understanding and language similarity work better together than either signal alone when matching real-world belongings.',
      'Research on image-based recognition and semantic similarity is especially relevant for lost-and-found contexts because owners and finders often describe the same object using different words, levels of detail, or remembered attributes.',
      'Indoor-aware studies also acknowledge that users often remember approximate spaces, landmarks, or floors rather than exact locations, which makes confidence-based location reasoning more realistic than strict coordinates.',
      'Many existing platforms focus on discovery and listing, but comparatively fewer studies examine how to delay sensitive disclosure until claim legitimacy has been tested.',
      'Across the literature, stronger ownership verification and fraud-aware oversight remain underdeveloped, especially for institutional environments where similar-looking belongings, repeated claims, and shared public spaces increase the risk of error.',
      'This makes the institutional setting materially different from general marketplace-style retrieval, because the system must support both technical matching quality and operational trust for staff, finders, and claimants.',
    ],
  },
  {
    title: 'Research Gap',
    preview: 'What is missing is an integrated workflow that balances retrieval accuracy, privacy, administrative review, and claimant trust.',
    lead:
      'The main research gap is not the absence of a single matching model, but the lack of one coherent recovery process that combines multimodal retrieval, uncertain indoor location reasoning, privacy-preserving verification, and administrative fraud awareness inside the same institutional workflow. Existing solutions improve one part of the problem at a time, but they rarely connect those improvements into a complete and trustworthy recovery path.',
    details: [
      'Many existing solutions reveal sensitive finder or item details too early, which weakens claim security and makes false recovery attempts harder to control.',
      'Systems that support text or image search usually do not combine those signals with uncertain indoor location memory in a structured decision process.',
      'Ambiguous descriptions, partially remembered item attributes, and crowded institutional spaces create retrieval conditions that basic search interfaces are not designed to handle well.',
      'Many tools also assume that once a likely match is shown, recovery can proceed immediately, even though high-similarity items often require stronger proof of ownership.',
      'Verification is frequently treated as a manual afterthought rather than an explicit system stage with structured prompts, controlled disclosure, and reviewable outcomes.',
      'Administrative fraud monitoring is rarely treated as a first-class requirement, leaving repeated claim behaviour, suspicious verification patterns, and unusual matching activity largely invisible.',
      'As a result, current systems do not adequately connect retrieval quality with institutional accountability, even though both are necessary for safe adoption in academic environments.',
    ],
  },
  {
    title: 'Research Problem',
    preview: 'Institutional recovery remains fragmented, slow, and vulnerable when evidence is incomplete, inconsistent, or easy to imitate.',
    lead:
      'In institutional settings, the recovery process breaks down because evidence is scattered across descriptions, images, and uncertain location memory, while manual verification remains too weak and too slow to scale across high-volume or high-similarity claims. This creates operational friction for owners, extra burden for staff, and avoidable risk when sensitive details are released before confidence in ownership has been established.',
    details: [
      'Owners and finders often describe the same item using different vocabulary, which reduces the reliability of keyword-only search and manual browsing.',
      'Similar-looking belongings such as bottles, bags, chargers, and devices require stronger claim validation than simple description matching can provide.',
      'Indoor environments add uncertainty because users frequently remember a likely area, route, or building rather than a precise location.',
      'Owners may know highly specific details about their item but still struggle to retrieve it if the system ranks results using only shallow textual overlap.',
      'Finders and administrators also need a structured process that reduces repetitive manual clarification, especially when many claims are submitted against similar items.',
      'Without controlled verification, false claimants can exploit early disclosure of details to imitate ownership and gain access to finder information.',
      'Administrators need a clearer decision trail so verification outcomes, suspicious patterns, and recovery handoffs can be reviewed with more confidence and explained when disputes occur.',
    ],
  },
  {
    title: 'Research Objectives',
    preview: 'The project targets a practical institutional platform with stronger retrieval, safer verification, and clearer oversight.',
    lead:
      'The objective is to design a research-driven lost-and-found platform that treats recovery as a staged evidence workflow rather than a simple listing board. The system should not only retrieve likely matches more effectively, but also manage when information is exposed, how ownership is tested, and how administrators are supported when suspicious or ambiguous cases require closer review.',
    details: [
      'Develop a multimodal matching pipeline that combines image evidence, language similarity, and structured item attributes to improve retrieval quality.',
      'Support confidence-aware indoor location reasoning so approximate memory can still contribute meaningfully to ranking and shortlisting.',
      'Introduce ownership verification before finder details or sensitive recovery information are exposed to claimants.',
      'Design the recovery workflow so sensitive disclosure happens progressively, based on evidence strength rather than immediate search visibility.',
      'Provide administrators with monitoring signals that surface suspicious claim patterns and strengthen institutional oversight.',
      'Create a system structure that is suitable for institutional use, where reviewability, traceability, and safer handoff decisions matter alongside retrieval accuracy.',
      'Demonstrate how multimodal AI can be applied in a practical campus service context rather than only as an isolated model benchmark.',
    ],
    points: [
      'Build a secure lost-and-found platform tailored to institutional spaces, shared facilities, and campus-style recovery workflows.',
      'Improve item matching accuracy by combining multimodal evidence, semantic similarity, and structured item attributes instead of relying on keywords alone.',
      'Use confidence-aware indoor location signals to model uncertain memory more realistically during ranking and shortlisting.',
      'Verify ownership before releasing finder information or other sensitive recovery details so privacy and claim legitimacy are handled together.',
      'Support administrators with fraud-aware monitoring, reviewable verification outcomes, and clearer operational signals for suspicious cases.',
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
    date: 'To be updated',
    marks: '12%',
    status: 'Completed',
    note: 'Proposal Presentation contributes 6% and Proposal Report contributes 6%, giving the proposal milestone a combined 12% allocation.',
  },
  {
    title: 'Progress Presentation 1',
    date: 'To be updated',
    marks: '15%',
    status: 'Completed',
    note: 'Progress Presentation 1 carries 15% of the overall assessment and represents the first major implementation checkpoint.',
  },
  {
    title: 'Progress Presentation 2',
    date: 'To be updated',
    marks: '18%',
    status: 'Ongoing',
    note: 'Progress Presentation 2 is weighted at 18% and covers the 90% completion review stage.',
  },
  {
    title: 'Final Report (Group)',
    date: 'To be updated',
    marks: '4%',
    status: 'Upcoming',
    note: 'Final group report submission contributes 4% in the provided breakdown.',
  },
  {
    title: 'Final Presentation',
    date: 'To be updated',
    marks: '10%',
    status: 'Upcoming',
    note: 'Final presentation contributes 10% in the provided breakdown.',
  },
  {
    title: 'Website',
    date: 'To be updated',
    marks: '2%',
    status: 'Upcoming',
    note: 'Project website assessment contributes 2% in the provided breakdown.',
  },
  {
    title: 'Check Lists',
    date: 'To be updated',
    marks: '2%',
    status: 'Upcoming',
    note: 'Checklist submission contributes 2% in the provided breakdown.',
  },
  {
    title: 'Logbook',
    date: 'To be updated',
    marks: '2%',
    status: 'Upcoming',
    note: 'Logbook submission contributes 2% in the provided breakdown.',
  },
  {
    title: 'Research Paper',
    date: 'To be updated',
    marks: '10%',
    status: 'Upcoming',
    note: 'Research Paper contributes 10% in the provided breakdown.',
  },
  {
    title: 'Viva',
    date: 'To be updated',
    marks: '10%',
    status: 'Upcoming',
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
      'Foundational charter and scope document for the project. Content will be updated when the approved file is ready for publication.',
    linkLabel: 'Google Drive file attached',
    actionLabel: 'Download file',
  },
  {
    title: 'Proposal Document',
    type: 'Research',
    status: 'Placeholder',
    fileUrl: null,
    description:
      'Formal proposal submission entry prepared for later replacement with the final review copy.',
    linkLabel: 'Document link to be added',
    actionLabel: 'Link will be added',
  },
  {
    title: 'Checklist Documents',
    type: 'Review',
    status: 'Available',
    fileUrl: null,
    downloads: [
      {
        label: 'Checklist 1',
        fileUrl: 'https://drive.google.com/file/d/1RK3k03O4zKe19V52QNVLTixTAtUHj_rb/view?usp=sharing',
      },
      {
        label: 'Checklist 2',
        fileUrl: 'https://drive.google.com/file/d/1GB4OdABMv4oOXfhJzWe1hzzV0Mk__l-9/view?usp=sharing',
      },
    ],
    description:
      'Checklist and compliance documents can be grouped here once the final academic versions are available.',
    linkLabel: 'Checklist 1 and Checklist 2 attached',
    actionLabel: 'Download file',
  },
  {
    title: 'Final Document',
    type: 'Submission',
    status: 'Placeholder',
    fileUrl: null,
    description:
      'Final report placeholder structured for later attachment without redesigning the page.',
    linkLabel: 'Document link to be added',
    actionLabel: 'Link will be added',
  },
  {
    title: 'Research Paper',
    type: 'Publication',
    status: 'Placeholder',
    fileUrl: null,
    description:
      'Journal or conference style paper entry reserved for the finished manuscript or publication-ready version.',
    linkLabel: 'Document link to be added',
    actionLabel: 'Link will be added',
  },
  {
    title: 'Poster',
    type: 'Poster',
    status: 'Placeholder',
    fileUrl: null,
    description:
      'Any later supplementary materials, ethics notes, or technical annexes can be published here.',
    linkLabel: 'Document link to be added',
    actionLabel: 'Link will be added',
  },
]

export const presentationDecks = [
  {
    title: 'Proposal Presentation',
    status: 'Available',
    fileUrl: 'https://docs.google.com/presentation/d/1EJHhe6ITogSYc50hd_186kSywHqj1NY8/edit?usp=sharing&ouid=116710571634759331573&rtpof=true&sd=true',
    description:
      'Prepared slot for the proposal deck once the final presentation file is approved.',
    linkLabel: 'Google Slides file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Progress Presentation 1',
    status: 'Available',
    fileUrl: 'https://drive.google.com/file/d/1mM9WPihKMNAl7jBraL3jYWsV-RyXDM4Y/view?usp=sharing',
    description:
      'Early progress review deck placeholder ready for later upload.',
    linkLabel: 'Google Drive file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Progress Presentation 2',
    status: 'Available',
    fileUrl: 'https://docs.google.com/presentation/d/14SZqrE0613t39j7wF5hwvw6EPVKPum_S/edit?usp=sharing&ouid=116710571634759331573&rtpof=true&sd=true',
    description:
      'Second progress checkpoint deck placeholder ready for final content.',
    linkLabel: 'Google Slides file attached',
    actionLabel: 'Download deck',
  },
  {
    title: 'Final Presentation',
    status: 'Placeholder',
    fileUrl: null,
    description:
      'Reserved entry for the final presentation or viva support slides.',
    linkLabel: 'Presentation link to be added',
    actionLabel: 'Link will be added',
  },
]

export const teamMembers = [
  {
    name: 'Team member profile to be confirmed',
    role: 'Research Lead',
    bio: 'Final profile copy will summarise academic focus, project leadership, and research direction for this role.',
    email: 'Email to be confirmed',
    contribution: 'Contribution summary to be confirmed',
  },
  {
    name: 'Team member profile to be confirmed',
    role: 'AI Systems',
    bio: 'Final profile copy will outline the AI pipeline responsibilities, model work, and core ownership areas.',
    email: 'Email to be confirmed',
    contribution: 'Contribution summary to be confirmed',
  },
  {
    name: 'Team member profile to be confirmed',
    role: 'Platform Engineering',
    bio: 'Final profile copy will cover implementation ownership, system integration work, and delivery responsibilities.',
    email: 'Email to be confirmed',
    contribution: 'Contribution summary to be confirmed',
  },
  {
    name: 'Team member profile to be confirmed',
    role: 'Evaluation',
    bio: 'Final profile copy will describe validation responsibilities, review focus, and supporting research contributions.',
    email: 'Email to be confirmed',
    contribution: 'Contribution summary to be confirmed',
  },
]

export const contactCards = [
  {
    label: 'General Contact',
    value: 'Content will be updated',
    note: 'Use this slot for the final public-facing contact person or project office once confirmed.',
  },
  {
    label: 'Email',
    value: 'Email placeholder',
    note: 'Replace with the final institutional or team contact email.',
  },
  {
    label: 'Phone',
    value: 'Phone placeholder',
    note: 'Replace with a verified contact number only when you are ready to publish it.',
  },
]

export const contactDetails = {
  email: 'Email placeholder',
  phone: 'Phone placeholder',
}

export const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Domain', href: '#domain' },
  { label: 'Documents', href: '#documents' },
  { label: 'Contact', href: '#contact' },
]
