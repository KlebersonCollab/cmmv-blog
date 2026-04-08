# Spec: Fix X.com Iframe Breakage in PostPage

## Context
When an X (Twitter) iframe is manually added to the post content, the UI is breaking leading to subsequent news content becoming hidden on `PagePost.vue`. This happens because a greedy Regex pattern responsible for replacing raw URLs with embed blocks is matching `x.com` links inside the `<iframe src="...">` attribute, replacing the URL inside the iframe with a `<div>` and breaking the HTML structure.

## User Stories
### US-1: View Post with Embedded X.com Iframe
**As a** reader, **I want** to read a post that contains an embedded X (Twitter) iframe, **so that** I can view the rest of the post content without the HTML breaking.

## Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | The system shall not mistakenly replace `x.com` or `twitter.com` URLs when they are placed inside an HTML attribute like `src=""` or `href=""`. | Must |
| FR-2 | The system shall continue to replace bare URLs in the content with the appropriate Twitter/X embed HTML. | Must |

## Acceptance Criteria
### AC-1: URLs inside attributes are ignored
**Given** a post content containing `<iframe src="https://x.com/user/status/123"></iframe>`
**When** the post rendered on the page
**Then** the iframe is rendered correctly and the `src` attribute is left intact
**Validation**: Loading the post should display the full document without clipping or invalid closing tags.

## Non-Functional Requirements
| ID | Requirement | Category |
|---|---|---|
| NFR-1 | Safe Regex logic must run in both client-side and server-side contexts across all themes. | Reliability |

## Constraints | Out of Scope | Dependencies | Open Questions
- **Constraint**: Must use JavaScript standard string replace or regex.
- **Out of Scope**: We will not parse HTML safely using full DOM parsers to avoid overhead, and instead use string replacements with quote awareness.
