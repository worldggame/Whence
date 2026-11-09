# whence — Whimsical Logo & Visual Refinement Plan

Update the **whence** visual identity with the selected logo direction: an unmistakable, whimsical golden question mark cradled within an open painterly blue Earth arc, rendered strictly in flat brushstrokes without gradients.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following logo decision has been confirmed by user selection in Phase 1:
> - **Selected Logo Direction**: **Option A — Golden question mark cradled within an open blue Earth arc**.
> - **Question Mark Legibility**: The question mark is immediately recognizable as an inquisitive `?`, with playful, organic brushstroke curves rather than cryptic geometry.
> - **Painterly Brushstrokes (Zero Gradients)**: Solid color palette only (`#38BDF8` celestial blue, `#F59E0B` golden amber). No linear or radial gradients.
> - **Pulsing Animation & Placement**: Sits directly to the right of the `whence` title wordmark with a subtle, gentle pulse.

---

## 1. Overview & Visual Identity

The new logo combines:
1. **The Earth Arc (Space)**: An open, expressive brushstroke crescent in celestial blue (`#38BDF8`) that swoops around the left and base, evoking a stylized planetary horizon or globe ring.
2. **The Solar Question Mark (Inquiry & Time)**: A cheerful, unmistakably hand-painted golden question mark (`#F59E0B`) nestled inside the arc, with its top curve rising above the horizon like the dawn sun.
3. **The Coordinate Dot**: A painterly golden dot (`#F59E0B`) at the base, serving as both the question mark dot and the map pin contact point.
4. **Typography**: Paired with the clean, elegant, and playful `Outfit` lowercase title wordmark (`whence`).

---

## 2. Technical Execution

- **Component**: Update `src/components/WhenceLogo.tsx` with calibrated SVG vector brushstroke paths for the cradled golden question mark and open blue Earth arc.
- **Responsive Sizing**: Seamless rendering in both header (`size="sm"`) and home screen hero (`size="lg"`).
- **Verification**: Verify visual balance, zero lint or compilation errors via `compile_applet` and `lint_applet`.
