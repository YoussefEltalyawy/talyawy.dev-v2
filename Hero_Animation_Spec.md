# Hero Section Animation Spec

1. General Animation Philosophy
- No basic fade-ins.
- No random motion or chaotic transitions.
- Every element must appear in a controlled, staged sequence.
- Final layout must remain 100% identical to the current UI after animation completes.
- Animations must NOT change final positions, spacing, or layout in any way.
- All animations must be performance-optimized (smooth 60fps target).
- Prefer GPU-friendly transforms (transform, filter), avoid layout thrashing.

2. Initial State
- The screen starts completely black.
- No visible UI elements at first.
- Then elements appear in sequence.

3. Animation Sequence (Strict Order)
Step 1 — Header Section
- Animate logo + clock together
- They must start at the same time
- They must originate from their final position (no offset movement)
- Entry effect: Blur → sharp focus

Step 2 — Wave Shader
- Appears after header animation completes
- Must fade in using: Strong blur → clear focus
- No positional movement allowed

Step 3 — Hero Title (“talyawy”)
- Appears after wave shader
- Same animation style: Blur → clear
- No movement from off-screen or offset positions
- Must feel layered and intentional

Step 4 — Sub Hero Text
- Text: “creating the kind of internet worth exploring”
- Must animate word by word
- NOT letter by letter
- NOT line by line
- Each word:
  - Starts blurred
  - Becomes sharp
  - Appears in sequence with slight staggering

4. Animation Rules (Critical)
- All elements must animate from their exact final position
- No sliding from top, bottom, or sides
- Only allowed transitions: blur → clear, optional opacity smoothing
- No layout shift during or after animation

5. Performance Requirements
- Must be highly optimized
- Avoid unnecessary re-renders
- Use transform + filter-based animations only when possible
- Keep bundle size minimal
- Ensure smooth scrolling across the entire site

6. Architecture Requirements
- Use reusable animation utilities/components
- Do not hardcode animations directly into each element
- Keep system scalable for future sections beyond hero
- Design with a global animation system in mind

7. Final Output Requirement
- After implementation: UI must look exactly identical to current design state
- Only difference is the entrance animation experience
- No structural or visual changes allowed
