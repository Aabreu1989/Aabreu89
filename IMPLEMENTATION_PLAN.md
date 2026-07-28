# Implementation Plan: MIRA SOBERANA V2026.FINAL - Estabilização Total

## Problem Analysis
1. **Ghost Data**: Deleted posts stay in Highlights/IA because there is no automatic cleanup (cascades or triggers) for the `knowledge_store` and `knowledge_base` tables. Also, the frontend UI 'Delete' was only filtering local state.
2. **Translation Failure**: The 'Story Modal' (Highlights) lacks the `onTranslationGenerated` callback, meaning translations in that view are never persisted to the database.
3. **Persistence Issues**: The 'Save', 'Like', and 'Verified' buttons are failing to persist because either (a) the DB constraints are blocking writes, (b) the RLS is not permissive enough for interactions, or (c) the UI is not fetching them correctly on initialization.

## Proposed Changes

### 1. Database (SQL)
- **Automatic Cleanup**: Add `ON DELETE CASCADE` to all relations of `posts` (including `saved_posts`, `post_votes`, `reports`, `comments`).
- **AI Sync**: Update the `posts` trigger to automatically purge `knowledge_store` and `knowledge_base` when a post is deleted.
- **Persistence Grants**: Explicitly GRANT ALL permissions to `authenticated` users for `post_votes`, `saved_posts`, and `comment_likes`.
- **Verified Status**: Explicitly allow updates to `is_verified` on the `posts` table for Admins.

### 2. Frontend (React)
- **App.tsx**: 
    - Fix `onDeletePost` to call `communityService.deletePost`.
    - Ensure `fetchUserInteractions` and `fetchSavedPosts` are called in every `refreshData` cycle.
- **CommunityView.tsx**:
    - Add `onTranslationGenerated` to the `TranslatedText` component in the `Story Modal`.
    - Add a "Verificar Post" option for Admins in the cinematic story view.
- **adminService.ts**:
    - Add `verifyPost(postId, isVerified)` to hit the new DB function.

## Verification Plan
1. **Delete a post**: Verify it disappears from the feed, from the "Destaques" (Highlights) and from the `knowledge_store` in the DB.
2. **Save a post**: Refresh the page and verify the "Save" button (Bookmark) stays active.
3. **Translate a post**: Translate in the Story Modal, close it, refresh, and verify the translation is still there (cached in DB).
4. **Verify a post**: As Admin (amandasabreu89@gmail.com), verify a post and check if the badge persists.
