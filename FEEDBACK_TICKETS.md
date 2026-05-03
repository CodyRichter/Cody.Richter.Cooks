# User Feedback Tickets

> **Generated**: 2026-01-31
> **Source**: Test user feedback session

This document breaks down user feedback into actionable development tickets, organized by priority and component area.

---

## 🔴 Priority 1: Critical Issues

### TICKET-001: Fix Notification System JSON Parsing Error
**Status**: Completed
**Priority**: Critical
**Estimated Effort**: 2-3 hours

#### Problem
Notification system is displaying `[Object object]` instead of proper error/success messages across multiple flows:
- User signup/registration
- Recipe editing operations
- General error handling

#### Root Cause
The notification calls in `AuthContext.tsx` and other files are receiving error objects that aren't being properly serialized to strings before display.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/contexts/AuthContext.tsx` (lines 181-196, 209-224)
2. `/frontend/src/app/recipes/edit/[recipe_id]/page.tsx` (lines 80, 113, 121)
3. `/frontend/src/app/recipes/create/page.tsx` (lines 46, 78, 86)

**Solution**:
- Update all `notifications.show()` calls to properly extract and stringify error messages
- Consider creating a utility function `formatNotificationError(error: unknown): string` in `/frontend/src/utils/notificationUtils.ts`
- Update error handling pattern:
  ```typescript
  // Current (broken):
  message: error // Shows "[Object object]"

  // Fixed:
  message: error instanceof Error ? error.message :
           typeof error === 'string' ? error :
           JSON.stringify(error)
  ```

**Testing**:
- Test signup flow with invalid credentials
- Test recipe edit with validation errors
- Test network failures
- Verify all notifications display human-readable messages

**Reference**: Per `frontend/AGENTS.md` line 10, prefer `notifications.show()` from `@mantine/notifications` for all user feedback.

---

### TICKET-002: Recipe Deletion Doesn't Update Sidebar/Search
**Status**: Completed
**Priority**: Critical
**Estimated Effort**: 3-4 hours

#### Problem
When a recipe is deleted via the DeleteRecipeModal, the sidebar and search results don't update to reflect the deletion, causing stale UI state.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/components/recipes/delete/DeleteRecipeModal.tsx`
2. `/frontend/src/components/navigation/sidebar/NavigationSidebar.tsx`
3. Recipe search/list hooks

**Solution**:
- After successful deletion, invalidate React Query cache for:
  - Recipe list queries
  - Individual recipe query
  - Search results
- Update DeleteRecipeModal's `onSuccess` callback:
  ```typescript
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    queryClient.invalidateQueries({ queryKey: ['recipe', recipe_id] });
    queryClient.invalidateQueries({ queryKey: ['recipeSearch'] });
    // Navigate away from deleted recipe
    router.push('/');
  }
  ```

**Testing**:
- Delete a recipe from view page
- Verify sidebar updates immediately
- Verify search results update
- Verify navigation redirects appropriately

**Reference**: Per `frontend/AGENTS.md` line 13, all server data fetching MUST use React Query for cache invalidation.

---

### TICKET-003: Sidebar Selection Broken for Deep-Linked Recipes
**Status**: Completed
**Priority**: High
**Estimated Effort**: 2-3 hours

#### Problem
When linking directly to a recipe that's not on the current page of search results, the sidebar doesn't show any selected recipe. Expected behavior: sidebar should scroll to and highlight the selected recipe.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/components/navigation/sidebar/NavigationSidebar.tsx`

**Solution**:
- On mount/route change, check if current recipe is in visible list
- If not, fetch the recipe and expand/scroll to its position
- Use React Query to prefetch recipe data
- Implement virtual scrolling position calculation
- Options:
  1. Expand search to show all recipes (may impact performance)
  2. Add "Jump to this recipe" indicator in sidebar
  3. Fetch and inject the current recipe into sidebar list

**Testing**:
- Navigate to recipe on page 5 of search while sidebar shows page 1
- Verify sidebar highlights or indicates current recipe
- Test with various search filters active

---

## 🟡 Priority 2: Important UX Improvements

### TICKET-005: Improve Ingredients/Instructions Tab Navigation
**Status**: Not Started
**Priority**: High
**Estimated Effort**: 2-3 hours

#### Problem
Users find it unclear how to swap between ingredients and instructions sections in the recipe edit UI.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/components/recipes/edit/EditRecipe.tsx`
2. Consider using Mantine's `<Tabs>` component

**Current Implementation**: Likely uses custom buttons or unclear navigation
**Proposed Solution**:
- Replace with Mantine `<Tabs>` component for standard UX pattern
- Use clear icons from `@tabler/icons-react`:
  - IconChefHat or IconCarrot for Ingredients
  - IconList or IconListNumbers for Instructions
- Ensure tabs are visually prominent and centered
- Add keyboard shortcuts (optional):
  - Alt+1 for Ingredients
  - Alt+2 for Instructions

**Example Implementation**:
```typescript
import { Tabs } from '@mantine/core';
import { IconCarrot, IconListNumbers } from '@tabler/icons-react';

<Tabs defaultValue="ingredients">
  <Tabs.List>
    <Tabs.Tab value="ingredients" leftSection={<IconCarrot />}>
      Ingredients
    </Tabs.Tab>
    <Tabs.Tab value="instructions" leftSection={<IconListNumbers />}>
      Instructions
    </Tabs.Tab>
  </Tabs.List>
  {/* Content */}
</Tabs>
```

**Testing**:
- Verify smooth switching between tabs
- Test keyboard navigation
- Verify state persists when switching tabs

---

### TICKET-006: Display Available Tags to User
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 2 hours

#### Problem
Users don't know what tags are available when creating/editing recipes.

#### Implementation Details
**Files to Update**:
1. Recipe edit/create forms
2. Tag selection component

**Solution**:
- Implement autocomplete/dropdown showing existing tags
- Use Mantine's `<MultiSelect>` or `<TagsInput>` with `data` prop
- Fetch available tags from backend (create endpoint if needed)
- Show most popular tags as suggestions
- Allow free-form entry for new tags

**Backend Work** (if needed):
- Add GET endpoint: `/api/v1/tags/` to return list of unique tags
- Return tags sorted by usage frequency

**Testing**:
- Verify tag suggestions appear
- Test creating new tags
- Test selecting existing tags

---

### TICKET-007: Add CLEAR/RESET Button to View Recipe UI
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 2-3 hours

#### Problem
Users want ability to uncheck all ingredient checkboxes and reset portion scaling in one click.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/app/recipes/view/[recipe_id]/page.tsx`
2. View recipe ingredient components

**Solution**:
- Add "Reset" button near portion size controls
- Button should:
  - Reset portion scaling to original (1x or recipe default)
  - Uncheck all ingredient checkboxes
  - Uncheck all instruction checkboxes (if applicable)
- Use Mantine's `<Button>` with icon
- Suggested icon: `IconRefresh` or `IconArrowBackUp` from `@tabler/icons-react`
- Add confirmation dialog for safety (optional)

**Implementation Pattern**:
```typescript
const handleReset = () => {
  setPortionMultiplier(1);
  setCheckedIngredients([]);
  setCheckedInstructions([]);
};

<Button
  variant="light"
  color="gray"
  leftSection={<IconRefresh size={16} />}
  onClick={handleReset}
>
  Reset
</Button>
```

**Testing**:
- Check some ingredients, change portion size, then reset
- Verify all state clears properly

---

### TICKET-008: Add Recipe Creator to View Recipe UI
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1-2 hours

#### Problem
Recipe view page doesn't show who created the recipe.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/app/recipes/view/[recipe_id]/page.tsx`

**Current State**: Recipe detail header likely shows title, tags, cooking time, but not creator

**Solution**:
- Add creator display in recipe header section
- Show username with icon: `<IconChefHat>` or `<IconUser>`
- Position near other metadata (cooking time, servings)
- Make username clickable to view creator's other recipes (future enhancement)
- Data already available in RecipeDetail type (check `created_by` or `author` field)

**Example UI**:
```typescript
<Group gap="xs">
  <IconChefHat size={18} />
  <Text size="sm" c="dimmed">
    By {recipe.author?.username || 'Unknown Chef'}
  </Text>
</Group>
```

**Testing**:
- Verify creator displays for all recipes
- Test with recipes from different users
- Handle case where creator might be deleted/unknown

---

### TICKET-009: Improve Recipe Portion Scaling UX
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 2-3 hours

#### Problem
Portion scaling is not intuitive because:
- It's hidden under ingredients section
- No clear description of what it does
- Button color doesn't stand out

**Implementation Details**
**Files to Update**:
1. View recipe ingredients component
2. Portion scaling controls

**Solution**:
1. **Better Positioning**: Move portion controls to prominent location (near serving size in header)
2. **Clear Labeling**:
   - Change from just "Portions" to "Scale Recipe" or "Adjust Servings"
   - Add descriptive text: "This recipe makes {original_servings} servings"
3. **Visual Improvements**:
   - Use accent color (orange/blue) instead of gray
   - Add icons: `IconScale` or `IconAdjustments`
4. **Tooltips**: Add Mantine tooltip explaining functionality
5. **Visual Feedback**: Show calculation in real-time
   - "Original: 4 servings → Scaled: 8 servings (2x)"

**Example Implementation**:
```typescript
<Tooltip label="Adjust ingredient quantities to match your desired serving size">
  <Box>
    <Text size="sm" fw={500} mb={4}>Scale Recipe</Text>
    <Text size="xs" c="dimmed" mb={8}>
      Original: {recipe.serving_size} servings
    </Text>
    <SegmentedControl
      value={portionMultiplier.toString()}
      onChange={(val) => setPortionMultiplier(Number(val))}
      data={[
        { label: '0.5x', value: '0.5' },
        { label: '1x', value: '1' },
        { label: '2x', value: '2' },
        { label: '3x', value: '3' },
      ]}
      color="orange"
    />
  </Box>
</Tooltip>
```

**Testing**:
- Verify scaling calculations are correct
- Test tooltip display
- Ensure mobile-friendly

---

## 🟢 Priority 3: Visual & Polish Issues

### TICKET-010: Update Login Form Label Consistency
**Status**: Not Started
**Priority**: Low
**Estimated Effort**: 30 min - 1 hour

#### Problem
Login form says "USERNAME" but the system uses email. Need consistency.

#### Decision Needed
User feedback suggests: "It should allow either... Maybe? Or just be consistent"

#### Implementation Details
**File to Update**:
1. `/frontend/src/app/auth/login/page.tsx` (line 91)

**Options**:
1. **Option A**: Change label to "Email" and only accept email
   - Update backend to validate email format
   - More standard UX pattern

2. **Option B**: Keep "Username" and clarify it IS the username
   - No backend changes needed

3. **Option C**: Change to "Email or Username" and accept both
   - More complex backend logic needed
   - Better UX flexibility

**Recommended**: Option A (Email only) for simplicity and standardization

**Changes for Option A**:
```typescript
<TextInput
  label="Email"
  placeholder="Enter your email address"
  type="email"
  // ... rest of props
/>
```

**Testing**:
- Update field name in form state
- Test login with email format
- Update backend if needed

---

### TICKET-011: Change Ingredients Icon in Edit UI
**Status**: Not Started
**Priority**: Low
**Estimated Effort**: 15-30 min

#### Problem
Current ingredients icon is unclear or not representative.

#### Implementation Details
**Files to Update**:
1. Recipe edit components using ingredient icons
2. `/frontend/src/components/recipes/edit/ingredients/`

**Solution**:
- Replace current icon with more intuitive option from `@tabler/icons-react`:
  - `IconCarrot` (playful, food-related)
  - `IconChefHat` (cooking-related)
  - `IconShoppingCart` (shopping list metaphor)
  - `IconListCheck` (checklist)
- Ensure icon size and color match design system
- Update across all instances (tabs, headers, buttons)

**Testing**:
- Visual regression test
- Verify icon displays on all screen sizes

---

### TICKET-012: Remove Confusing Gear Icon by Recipe Details
**Status**: Not Started
**Priority**: Low
**Estimated Effort**: 30 min

#### Problem
There's a gear icon near recipe details that users mistake for a clickable button, but it's decorative or inactive.

#### Implementation Details
**Files to Check**:
1. `/frontend/src/app/recipes/view/[recipe_id]/page.tsx`
2. Recipe detail header components

**Solution**:
- Locate the `IconSettings` or gear icon
- Determine if it serves a purpose:
  - If decorative: Remove entirely
  - If functional but unclear: Make it an actual button with tooltip
- If keeping, make purpose clear with label/tooltip

**Testing**:
- Verify removal doesn't break layout
- Check no dead event handlers remain

---

### TICKET-013: Improve Image Formatting and Size
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 2-3 hours

#### Problem
Images are too large on the UI and formatting is unclear.

#### Implementation Details
**Files to Update**:
1. Recipe view/edit components displaying images
2. CSS/styling for recipe images
3. Potentially create dedicated image component

**Solution**:
1. **Size Constraints**:
   - Set `max-width` and `max-height` on recipe images
   - Use `object-fit: cover` for consistent aspect ratios
   - Suggested max size: 400px width for detail view, 200px for cards

2. **Responsive Sizing**:
   - Use Mantine's responsive props
   - Scale down on mobile devices

3. **Use Next.js Image**:
   - Replace `<img>` with `<Image>` from `next/image`
   - Automatic optimization and lazy loading
   - Per `frontend/AGENTS.md` line 47: "Use `next/image` for all images"

4. **Upload Guidelines**:
   - Add guidance text: "Recommended: 800x600px, max 2MB"
   - Show image preview before save
   - Add aspect ratio guidelines

**Example**:
```typescript
import Image from 'next/image';

<Box style={{ maxWidth: 400, margin: '0 auto' }}>
  <Image
    src={recipe.image_url}
    alt={recipe.title}
    width={800}
    height={600}
    style={{
      width: '100%',
      height: 'auto',
      borderRadius: 'var(--mantine-radius-md)'
    }}
  />
</Box>
```

**Testing**:
- Test with various image sizes and aspect ratios
- Verify mobile responsiveness
- Check loading performance

---

### TICKET-014: Improve Recipe Card Width Consistency
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 2 hours

#### Problem
Recipe card width is inconsistent across different display sizes.

#### Implementation Details
**Files to Update**:
1. Recipe card components
2. Recipe list/grid layouts
3. CSS/styling files

**Solution**:
1. **Define Breakpoints**:
   - Mobile: Full width (single column)
   - Tablet: 2 columns, fixed card width
   - Desktop: 3-4 columns, max card width

2. **Use Mantine Grid System**:
   ```typescript
   import { SimpleGrid } from '@mantine/core';

   <SimpleGrid
     cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
     spacing="lg"
   >
     {recipes.map(recipe => <RecipeCard key={recipe.id} {...recipe} />)}
   </SimpleGrid>
   ```

3. **Card Constraints**:
   - Min width: 280px
   - Max width: 400px
   - Use CSS Grid or Flexbox with `flex: 1 1 300px`

**Testing**:
- Test at 320px, 768px, 1024px, 1920px widths
- Verify no overflow or awkward gaps
- Check card content doesn't break

---

### TICKET-015: Add Recipe Image to Home Page Card
**Status**: Not Started
**Priority**: Low
**Estimated Effort**: 1-2 hours

#### Problem
Home page recipe cards should have background images to be more visually appealing.

#### Implementation Details
**Files to Update**:
1. Home page component
2. Featured recipe card component

**Solution**:
1. **Background Image Card**:
   - Use `background-image` CSS with overlay
   - Add gradient overlay for text readability
   - Use `next/image` with `fill` layout

2. **Fallback**:
   - If no image, use gradient or default food photo
   - Consider using placeholders from unsplash or generate with AI

**Example**:
```typescript
<Card
  style={{
    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${recipe.image_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: 300,
    color: 'white'
  }}
>
  <Title order={2}>{recipe.title}</Title>
  <Text>{recipe.description}</Text>
</Card>
```

**Testing**:
- Test with and without recipe images
- Verify text is readable over all images
- Check mobile responsiveness

---

## 🔵 Priority 4: New Features

### TICKET-016: Add Required Field Indicators (Stars) in Recipe Edit UI
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1-2 hours

#### Problem
Users don't know which fields are required when editing recipes. Need visual indicators (asterisks/stars) on required fields, particularly for ingredients and instructions.

#### Implementation Details
**Files to Update**:
1. `/frontend/src/components/recipes/edit/EditRecipe.tsx`
2. Individual field components for ingredients/instructions

**Solution**:
1. **Add `withAsterisk` prop** to required Mantine inputs:
   ```typescript
   <TextInput
     label="Recipe Title"
     withAsterisk
     required
   />
   ```

2. **Custom Labels for Complex Fields**:
   ```typescript
   <Text size="sm" fw={500}>
     Ingredients <Text component="span" c="red">*</Text>
   </Text>
   ```

3. **Update Validation**:
   - Ensure validation errors highlight required fields
   - Show clear error messages

**Required Fields** (to mark):
- Recipe title
- At least one ingredient (name and quantity)
- At least one instruction
- Description (if required by business logic)

**Testing**:
- Try to save recipe without required fields
- Verify asterisks appear correctly
- Check validation messages are clear

---

### TICKET-017: Create Recipe Share UI
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 4-6 hours

#### Problem
No interface for sharing recipes with other users or externally.

#### Implementation Details
**Files to Create**:
1. `/frontend/src/components/recipes/share/RecipeShareModal.tsx`
2. Share button in recipe view page

**Features to Implement**:
1. **Share Options**:
   - Copy link to clipboard
   - Share via email (mailto link)
   - Social media sharing (optional)
   - Generate shareable QR code (optional)

2. **Privacy Controls** (if applicable):
   - Public link vs. private link
   - Expiring links
   - Permission levels

3. **UI Components**:
   - Use Mantine `<Modal>` component
   - `<CopyButton>` for link copying
   - Social icons from `@tabler/icons-react`

**Example Implementation**:
```typescript
import { Modal, Button, CopyButton, Stack, Group, Text } from '@mantine/core';
import { IconShare, IconCopy, IconCheck } from '@tabler/icons-react';

export function RecipeShareModal({ recipe, opened, onClose }) {
  const shareUrl = `${window.location.origin}/recipes/view/${recipe.id}`;

  return (
    <Modal opened={opened} onClose={onClose} title="Share Recipe">
      <Stack>
        <Text size="sm">Share this recipe with others!</Text>

        <CopyButton value={shareUrl}>
          {({ copied, copy }) => (
            <Button
              color={copied ? 'teal' : 'blue'}
              onClick={copy}
              leftSection={copied ? <IconCheck /> : <IconCopy />}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          )}
        </CopyButton>

        {/* Add more share options */}
      </Stack>
    </Modal>
  );
}
```

**Backend Work** (if needed):
- Create share tracking endpoint (analytics)
- Generate short URLs for sharing

**Testing**:
- Test copy to clipboard functionality
- Test share links work when opened
- Verify mobile-friendly

---

## 📋 Summary Statistics

- **Total Tickets**: 17
- **Critical Priority**: 3 tickets (~12-14 hours)
- **High Priority**: 7 tickets (~15-20 hours)
- **Medium Priority**: 5 tickets (~10-15 hours)
- **Low Priority**: 2 tickets (~1-2 hours)

**Total Estimated Effort**: 38-51 hours

---

## 🎯 Recommended Implementation Order

1. **Sprint 1** (Critical Fixes - Week 1):
   - TICKET-001: Fix notification JSON parsing
   - TICKET-002: Recipe deletion updates
   - TICKET-003: Sidebar selection fix

2. **Sprint 2** (UX Improvements - Week 2):
   - TICKET-005: Ingredients/Instructions navigation
   - TICKET-009: Portion scaling UX
   - TICKET-004: Optional title field
   - TICKET-016: Required field indicators

3. **Sprint 3** (Features & Polish - Week 3):
   - TICKET-017: Recipe share UI
   - TICKET-007: Reset button
   - TICKET-008: Show recipe creator
   - TICKET-013: Image formatting

4. **Sprint 4** (Final Polish - Week 4):
   - TICKET-006: Tag display
   - TICKET-014: Card width consistency
   - TICKET-010-012, TICKET-015: Minor UI fixes

---

## 📝 Notes

- All changes must follow `AGENTS.md` guidelines:
  - Run `npm run build` and `npm run lint` before commit
  - Use Mantine UI components exclusively
  - Use React Query for all data fetching
  - Follow conventional commits format

- Before starting any ticket, review the specific component files to understand current implementation

- Some tickets may reveal the need for backend API changes - coordinate with backend team

- Consider creating a shared `notificationUtils.ts` for TICKET-001 that can be reused across the codebase
