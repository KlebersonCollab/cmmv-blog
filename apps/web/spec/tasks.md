# Tasks: Fix X.com Iframe Breakage in PostPage
| # | Task | Status | Spec Ref |
|---|---|---|---|
| 1 | Update regex in `theme-centralotaku` | TODO | FR-1, AC-1 |
| 2 | Update regex in `theme-cupomnahora` | TODO | FR-1, AC-1 |
| 3 | Update regex in `theme-testatudo` | TODO | FR-1, AC-1 |
| 4 | Update regex in `theme-invasaonerd` | TODO | FR-1, AC-1 |
| 5 | Update regex in `theme-gamedevbr` | TODO | FR-1, AC-1 |

## Detailed Tasks
### Task 1: Update Regex in PagePost Themes
**Status**: TODO
**Spec References**: FR-1, AC-1
**Description**: Modify `processPostContent` regex patterns and string replacement callbacks to use quote-aware matching prefixes (`/(^|[^"'])(https!...)/g`).
**Files to modify**: 
- `apps/web/src/theme-centralotaku/views/PagePost.vue`
- `apps/web/src/theme-cupomnahora/views/PagePost.vue`
- `apps/web/src/theme-testatudo/views/PagePost.vue`
- `apps/web/src/theme-invasaonerd/views/PagePost.vue`
- `apps/web/src/theme-gamedevbr/views/PagePost.vue`
