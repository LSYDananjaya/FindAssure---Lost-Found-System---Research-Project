# FindAssure Web App - Visual Flow Diagrams

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FindAssure Web Application                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Browser (Port 3000)                       │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │   Layout    │  │    Router    │  │   API Client     │   │  │
│  │  │  Component  │  │ (React Router│  │    (Axios)       │   │  │
│  │  │             │  │              │  │                  │   │  │
│  │  │ • Header    │  │ • /          │  │ • generateQs     │   │  │
│  │  │ • Nav       │  │ • /add-item  │  │ • createItem     │   │  │
│  │  │ • Footer    │  │ • /item/:id  │  │ • getItems       │   │  │
│  │  └─────────────┘  └──────────────┘  └──────────────────┘   │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐│  │
│  │  │                    Pages                                  ││  │
│  │  │                                                            ││  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││  │
│  │  │  │  Dashboard  │  │   AddItem   │  │   ItemDetail    │ ││  │
│  │  │  │             │  │             │  │                 │ ││  │
│  │  │  │ • Grid      │  │ • Step 1    │  │ • Image         │ ││  │
│  │  │  │ • Filters   │  │ • Step 2    │  │ • Questions     │ ││  │
│  │  │  │ • Cards     │  │ • Step 3    │  │ • Verification  │ ││  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘ ││  │
│  │  └──────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                 │                                    │
│                                 ▼                                    │
│                    ┌────────────────────────┐                       │
│                    │   Backend API Server   │                       │
│                    │    (Port 5000)         │                       │
│                    └────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Page Navigation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Navigation                              │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Home (/)   │
                              │  Dashboard   │
                              └───────┬──────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
          ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
          │  Add Found Item │  │ Filter Items│  │  View Item      │
          │  (/add-item)    │  │ (Same page) │  │  (/item/:id)    │
          └─────────────────┘  └─────────────┘  └────────┬────────┘
                    │                                      │
                    │                                      │
                    │                              ┌───────┴────────┐
                    │                              │                │
                    │                              ▼                ▼
                    │                      ┌───────────────┐ ┌────────────┐
                    │                      │ View Details  │ │Claim Item  │
                    │                      │               │ │            │
                    │                      └───────────────┘ └─────┬──────┘
                    │                                              │
                    │                                              │
                    └──────────────────────────────────────────────┤
                                                                   │
                                                                   ▼
                                                         ┌────────────────┐
                                                         │   Dashboard    │
                                                         │   (Success)    │
                                                         └────────────────┘
```

## Add Item Flow (Multi-Step)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Add Found Item Wizard                           │
└─────────────────────────────────────────────────────────────────────┘

    ┌────────────┐        ┌────────────┐        ┌────────────┐
    │   STEP 1   │───────▶│   STEP 2   │───────▶│   STEP 3   │
    │            │        │            │        │            │
    │ Basic Info │        │  Questions │        │  Contact   │
    └─────┬──────┘        └─────┬──────┘        └─────┬──────┘
          │                     │                      │
          │                     │                      │
┌─────────▼──────────┐ ┌────────▼────────────┐ ┌──────▼──────────┐
│                    │ │                     │ │                 │
│ • Category         │ │ • Click "Generate   │ │ • Name          │
│ • Description      │ │   Questions"        │ │ • Email         │
│ • Image URL        │ │                     │ │ • Phone         │
│ • Location         │ │ • Wait for AI       │ │                 │
│                    │ │                     │ │ • Summary       │
│ [Generate Qs] ────▶│ │ • Answer 10 Qs     │ │                 │
│                    │ │                     │ │ [Submit] ───────▶
└────────────────────┘ │ [Continue] ────────▶│ │                 │
                       └─────────────────────┘ └─────────────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │  POST /api/items │
                                              │      /found      │
                                              └─────────┬────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │   Save to DB     │
                                              └─────────┬────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │  Navigate to     │
                                              │   Dashboard      │
                                              └──────────────────┘
```

## Data Flow - Adding Item

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Add Item Data Flow                                │
└─────────────────────────────────────────────────────────────────────┘

Web App                Backend              Gemini AI         MongoDB
────────               ────────             ─────────         ────────

   │                      │                     │                │
   │ 1. Enter category    │                     │                │
   │    & description     │                     │                │
   │                      │                     │                │
   │ 2. Click "Generate"  │                     │                │
   ├─────────────────────▶│                     │                │
   │  POST /generate-     │                     │                │
   │       questions      │                     │                │
   │                      │ 3. Request questions│                │
   │                      ├────────────────────▶│                │
   │                      │                     │                │
   │                      │ 4. Return 10 Qs     │                │
   │                      │◀────────────────────┤                │
   │ 5. Display questions │                     │                │
   │◀─────────────────────┤                     │                │
   │                      │                     │                │
   │ 6. User answers Qs   │                     │                │
   │    & enters contact  │                     │                │
   │                      │                     │                │
   │ 7. Click Submit      │                     │                │
   ├─────────────────────▶│                     │                │
   │  POST /found         │                     │                │
   │  {                   │                     │                │
   │    category,         │                     │                │
   │    description,      │                     │                │
   │    questions,        │                     │                │
   │    founderAnswers,   │ 8. Save to DB       │                │
   │    location,         ├────────────────────────────────────▶│
   │    founderContact    │                     │                │
   │  }                   │                     │                │
   │                      │ 9. Confirm saved    │                │
   │                      │◀────────────────────────────────────┤
   │ 10. Success response │                     │                │
   │◀─────────────────────┤                     │                │
   │                      │                     │                │
   │ 11. Navigate to      │                     │                │
   │     Dashboard        │                     │                │
   │                      │                     │                │
```

## Claim Item Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Claim Item (Verification) Flow                    │
└─────────────────────────────────────────────────────────────────────┘

Web App                Backend                            MongoDB
────────               ────────                           ────────

   │                      │                                  │
   │ 1. Browse dashboard  │                                  │
   │                      │                                  │
   │ 2. Click item card   │                                  │
   ├─────────────────────▶│                                  │
   │  GET /found/:id      │                                  │
   │                      │ 3. Fetch item (no founderAnswers)│
   │                      ├─────────────────────────────────▶│
   │                      │                                  │
   │                      │ 4. Return item                   │
   │                      │◀─────────────────────────────────┤
   │ 5. Display item      │                                  │
   │◀─────────────────────┤                                  │
   │                      │                                  │
   │ • Show image         │                                  │
   │ • Show description   │                                  │
   │ • Show questions     │                                  │
   │ • Show contact       │                                  │
   │                      │                                  │
   │ 6. Click "Claim"     │                                  │
   │                      │                                  │
   │ 7. Answer questions  │                                  │
   │                      │                                  │
   │ 8. Click Submit      │                                  │
   ├─────────────────────▶│                                  │
   │  POST /verification  │                                  │
   │  {                   │                                  │
   │    foundItemId,      │                                  │
   │    ownerAnswers      │ 9. Create verification           │
   │  }                   ├─────────────────────────────────▶│
   │                      │    {                             │
   │                      │      foundItemId,                │
   │                      │      ownerId,                    │
   │                      │      answers: [                  │
   │                      │        {                         │
   │                      │          question,               │
   │                      │          founderAnswer,          │
   │                      │          ownerAnswer             │
   │                      │        }                         │
   │                      │      ],                          │
   │                      │      status: 'pending'           │
   │                      │    }                             │
   │                      │ 10. Confirm saved                │
   │                      │◀─────────────────────────────────┤
   │ 11. Success message  │                                  │
   │◀─────────────────────┤                                  │
   │                      │                                  │
   │ 12. Navigate home    │                                  │
   │                      │                                  │
```

## Component Hierarchy

```
App
 │
 └─── Router
       │
       └─── Layout
             │
             ├─── Header
             │     └─── Navigation
             │           ├─── Link: Dashboard (/)
             │           └─── Link: Add Item (/add-item)
             │
             ├─── Main Content (Outlet)
             │     │
             │     ├─── Dashboard (/)
             │     │     ├─── Filters
             │     │     │     ├─── Category Select
             │     │     │     └─── Status Select
             │     │     │
             │     │     └─── Items Grid
             │     │           └─── Item Card (multiple)
             │     │                 ├─── Image
             │     │                 ├─── Title
             │     │                 ├─── Description
             │     │                 ├─── Status Badge
             │     │                 └─── Metadata
             │     │
             │     ├─── AddItem (/add-item)
             │     │     ├─── Progress Bar
             │     │     │
             │     │     ├─── Step 1: Basic Info
             │     │     │     ├─── Category Select
             │     │     │     ├─── Description Textarea
             │     │     │     ├─── Image URL Input
             │     │     │     └─── Location Input
             │     │     │
             │     │     ├─── Step 2: Questions
             │     │     │     └─── Question Items (10)
             │     │     │           ├─── Question Text
             │     │     │           └─── Answer Textarea
             │     │     │
             │     │     └─── Step 3: Contact
             │     │           ├─── Name Input
             │     │           ├─── Email Input
             │     │           ├─── Phone Input
             │     │           └─── Summary Box
             │     │
             │     └─── ItemDetail (/item/:id)
             │           ├─── Back Button
             │           │
             │           ├─── Item Header
             │           │     ├─── Large Image
             │           │     ├─── Title & Status
             │           │     ├─── Description
             │           │     └─── Metadata
             │           │
             │           ├─── Questions Section
             │           │     └─── Question List
             │           │
             │           ├─── Claim Section (if available)
             │           │     ├─── Info Box
             │           │     └─── Claim Button
             │           │
             │           ├─── Verification Form (if claiming)
             │           │     ├─── Question Items (10)
             │           │     │     └─── Answer Textarea
             │           │     └─── Submit Button
             │           │
             │           └─── Contact Section
             │                 ├─── Name
             │                 ├─── Email
             │                 └─── Phone
             │
             └─── Footer
```

## State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                        State per Component                           │
└─────────────────────────────────────────────────────────────────────┘

Dashboard
├─── items: FoundItem[]              (from API)
├─── filteredItems: FoundItem[]      (computed)
├─── selectedCategory: string        (user selection)
├─── selectedStatus: string          (user selection)
├─── loading: boolean                (API state)
└─── error: string | null            (API state)

AddItem
├─── step: number (1, 2, 3)          (wizard state)
├─── category: string                (Step 1)
├─── description: string             (Step 1)
├─── imageUrl: string                (Step 1)
├─── location: string                (Step 1)
├─── questions: string[]             (Step 2 - from API)
├─── founderAnswers: string[]        (Step 2)
├─── founderName: string             (Step 3)
├─── founderEmail: string            (Step 3)
├─── founderPhone: string            (Step 3)
├─── generatingQuestions: boolean    (API state)
├─── loading: boolean                (API state)
└─── error: string | null            (API state)

ItemDetail
├─── item: FoundItem | null          (from API)
├─── showVerification: boolean       (UI state)
├─── ownerAnswers: string[]          (verification form)
├─── submitting: boolean             (API state)
├─── loading: boolean                (API state)
└─── error: string | null            (API state)
```

## API Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API Service Layer                               │
└─────────────────────────────────────────────────────────────────────┘

Component                   API Service              Backend
─────────                   ───────────              ────────

Dashboard
    │
    ├─ useEffect()
    │       │
    │       ├──▶ getFoundItems(filters)
    │                   │
    │                   ├──▶ GET /api/items/found?category=X&status=Y
    │                   │                    │
    │                   │                    └───▶ Return FoundItem[]
    │                   │
    │                   └──▶ setItems(data)
    │
    └─ onFilterChange()
            │
            └──▶ filterItems() (client-side)


AddItem
    │
    ├─ Step 1: onGenerateQuestions()
    │       │
    │       ├──▶ generateQuestions(category, description)
    │                   │
    │                   ├──▶ POST /api/items/generate-questions
    │                   │                    │
    │                   │                    └───▶ Return { questions }
    │                   │
    │                   └──▶ setQuestions(data.questions)
    │
    └─ Step 3: onSubmit()
            │
            ├──▶ createFoundItem({ ...itemData })
                        │
                        ├──▶ POST /api/items/found
                        │                    │
                        │                    └───▶ Return FoundItem
                        │
                        └──▶ navigate('/')


ItemDetail
    │
    ├─ useEffect()
    │       │
    │       ├──▶ getFoundItemById(id)
    │                   │
    │                   ├──▶ GET /api/items/found/:id
    │                   │                    │
    │                   │                    └───▶ Return FoundItem
    │                   │
    │                   └──▶ setItem(data)
    │
    └─ onSubmitVerification()
            │
            ├──▶ createVerification({ foundItemId, ownerAnswers })
                        │
                        ├──▶ POST /api/items/verification
                        │                    │
                        │                    └───▶ Return Verification
                        │
                        └──▶ navigate('/')
```

---

**Note**: These diagrams show the complete architecture and flow of the FindAssure Web Application. Use them as a reference for understanding the system structure and data flow.
