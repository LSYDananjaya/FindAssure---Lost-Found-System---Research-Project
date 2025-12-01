You are GitHub Copilot helping build a React Native Expo mobile app for a FINAL YEAR RESEARCH PROJECT.

## Tech stack
- React Native with Expo (SDK 51+ if available)
- TypeScript
- React Navigation (stack + tab if needed)
- Axios for API calls
- Firebase Authentication for user auth (email/password)
- Expo Camera / Expo AV for recording selfie videos (later)
- Backend is Node.js + Express + MongoDB (we will call REST APIs)

## Project domain
A Lost & Found System with 3 roles:
- Item Owner (lost items)
- Item Founder (found items)
- Admin

The app is mainly used by Owners + Founders. Admin is a simple dashboard after admin login.

## Navigation structure
Implement navigation like this:

- RootNavigator:
  - Auth stack:
    - LoginScreen
    - RegisterScreen
  - Main app stack:
    - HomeScreen
    - Founder flow screens
    - Owner flow screens
    - ProfileScreen
    - AdminLoginScreen
    - AdminDashboardScreen

HomeScreen:
- Buttons:
  - "Report a Found Item"
  - "Find Lost Item"
- Also show "Login / Register" if user is not authenticated.
- If authenticated, show small greeting + "Profile" button.

If an Owner is NOT logged in and taps "Find Lost Item", navigate to LoginScreen.

## Screens and behavior

### 1. HomeScreen
- Show 2 main buttons:
  - "Report a Found Item"
  - "Find Lost Item"
- Also show "Login / Register" if user is not authenticated.
- If authenticated, show small greeting + "Profile" button.

### 2. Auth
- LoginScreen: email + password.
- RegisterScreen: name, email, phone number, password, role (owner/founder). For now default to Owner.
- Use Firebase Authentication for auth. Store extra user info in backend via API after successful register.
- AuthContext:
  - Stores current user, token (Firebase ID token), and role.
  - Provides login, logout, register functions.
  - Automatically attaches auth token to Axios via an interceptor.

### 3. Owner profile
- ProfileScreen:
  - Show/update name, email, phone, maybe profile picture later.
  - Simple form calling backend `PATCH /api/users/me`.

### 4. Founder Flow: Report a Found Item

#### Screen: ReportFoundStartScreen
- UI:
  - Button to "Select / Capture Item Image". For now, it can simply select from library or use a placeholder image URI.
  - Button "Next" to go to details screen.
- Pass along image URI via navigation params.

#### Screen: ReportFoundDetailsScreen
- Props from nav: image URI.
- Fields:
  - Category (TextInput or Picker)
  - Description (multiline TextInput)
- Button "Confirm" → navigate to Questions screen and pass `{ imageUri, category, description }`.

#### Screen: ReportFoundQuestionsScreen
- Receive `{ imageUri, category, description }`.
- For now, DO NOT call real Claude API. Generate dummy suggested questions based on category and description (e.g., an array of 8–10 strings).
- UI:
  - Show list of suggested questions in selectable chips or checkboxes.
  - User can select EXACTLY 5 questions.
- Button "Next" enabled only when 5 questions are selected.
- On Next, navigate to ReportFoundAnswersScreen with `{ imageUri, category, description, selectedQuestions }`.

#### Screen: ReportFoundAnswersScreen
- Receive `{ imageUri, category, description, selectedQuestions }`.
- For each selected question, show a TextInput for the founder's text answer.
- Validate all answers are filled.
- Button "Next" → navigate to ReportFoundLocationScreen with:
  - `imageUri`
  - `category`
  - `description`
  - `selectedQuestions`
  - `founderAnswers` (array of strings).

#### Screen: ReportFoundLocationScreen
- Fields:
  - Location (text only for now, we will integrate map later). **This location must be sent to backend and saved in DB.**
  - Founder name, email, phone number.
- On submit:
  - Call backend API `POST /api/items/found` with body:
    - `imageUrl` (placeholder string for now)
    - `category`
    - `description`
    - `questions` (selectedQuestions)
    - `founderAnswers`
    - `location` (from input)
    - `founderContact: { name, email, phone }`
  - Backend returns the saved FoundItem.
  - Show success screen (ReportFoundSuccessScreen) and clear local state.

Success screen:
- Show "Found item reported successfully" and a button to go back Home.

### 5. Owner Flow: Find Lost Item

#### Screen: FindLostStartScreen
- Guard: If user not logged in, redirect to LoginScreen.
- Fields:
  - Category
  - Description
- On "Search":
  - Call backend:
    - `POST /api/items/lost` to save lost request with category, description, and userId (owner).
    - Then `GET /api/items/found` to get all found items (for now NO AI filtering).
  - Navigate to FindLostResultsScreen with list of found items.

#### Screen: FindLostResultsScreen
- Props: array of found items from backend.
- Show list using FlatList and `ItemCard` component:
  - Show image thumbnail, category, short description, foundLocation (location field from FoundItem).
- On tap:
  - navigate to ItemDetailScreen with selected item.

#### Screen: ItemDetailScreen
- Props: `foundItem`.
- Show:
  - Large image
  - Category, description
  - Found location (location)
  - Found date (createdAt)
  - The list of **questions ONLY**, **do NOT show founder’s text answers** to the owner.
    - We must hide founderAnswers from UI because the owner will answer via video and we need unbiased answers.
- Founder’s text answers are available in the data model but are not rendered on this screen.

- Button: "Answer Ownership Questions" → navigate to AnswerQuestionsVideoScreen with `foundItem` (including questions, but the screen should still not show founderAnswers).

#### Screen: AnswerQuestionsVideoScreen
- Props: `foundItem` with questions.
- For each question:
  - Allow recording a short selfie video (max ~5 sec).
  - For now, you can simulate this:
    - Provide a button "Record" that just picks a local file or uses a dummy URI.
    - Later replace with actual Expo AV camera recording.
- Show preview or placeholder for each recorded video.
- Button "Submit":
  - Call backend `POST /api/items/verification` with:
    - `foundItemId`
    - `ownerId` (from AuthContext)
    - `ownerVideoAnswers: [{ question, videoUrl }]`
  - After submit, navigate to VerificationPendingScreen.

#### Screen: VerificationPendingScreen
- Simple screen:
  - "Your verification is submitted. You will be notified once processed."
- In future, the backend will do AI similarity and mark verified/failed. Owner can then see founder contact.

### 6. Admin

#### Screen: AdminLoginScreen
- Simple email/password login for admin (can be Firebase user with role=admin, or a separate backend login).
- After login, navigate to AdminDashboardScreen.

#### Screen: AdminDashboardScreen
- Calls backend `GET /api/admin/overview`.
- Shows:
  - Count of total found items, lost requests, pending verifications.
  - List of found items in a FlatList (can navigate to AdminItemDetailScreen).

#### Screen: AdminItemDetailScreen
- Show details of found item.
- Maybe allow changing `status` via dropdown and call backend.

## Code Style

- Use functional components with hooks.
- Use TypeScript interfaces for:
  - User, FoundItem, LostRequest, Question, Verification.
- Create reusable UI components:
  - PrimaryButton
  - TextInputField
  - ItemCard
  - QuestionChip
- Use `src/api/axiosClient.ts` to create Axios instance with baseURL and auth interceptor.

## Types / Models (frontend version)

Define in `src/types/models.ts`:

- User
- FoundItem
- LostRequest
- Verification

Example shape:

```ts
export interface FoundItem {
  _id: string;
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];         // questions selected by founder
  founderAnswers: string[];    // NOT shown to owner in UI
  founderContact: {
    name: string;
    email: string;
    phone: string;
  };
  location: string;            // where item was found
  status: 'available' | 'pending_verification' | 'claimed';
  createdAt: string;
  updatedAt?: string;
}
