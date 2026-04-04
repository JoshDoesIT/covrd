# Extending the Covrd UI

Covrd uses an uncompromising vanilla CSS styling aesthetic mixed with robust functional componentry powered by React 19. The UI elements prioritize glassmorphism, dynamic responsiveness, and premium visual interfaces.

This guide provides practical examples for extending the application safely.

## Component Structure

When creating new functional elements, always maintain isolation by breaking views into small, reusable components. I ended up deciding to abstract most of our reusable buttons and headers using `flex` structural alignment.

**Practical Example: Custom Share Button**

```tsx
import React from 'react'
import { ShareIcon } from 'lucide-react'

// Always strongly-type any property references
interface CustomShareProps {
  onShare: () => void
  styleClass?: string
}

export const CustomShareButton: React.FC<CustomShareProps> = ({ onShare, styleClass }) => {
  return (
    <button
      onClick={onShare}
      className={`action-btn glass-panel ${styleClass || ''}`}
      aria-label="Share current view"
    >
      <ShareIcon size={18} />
      <span>Share View</span>
    </button>
  )
}
```

### Styling Approach

Notice how the button utilizes `.action-btn` alongside `.glass-panel`.
We enforce our core design language through shared CSS utility rules found in `index.css`.

- **Dark Mode By Default**: All base elements inherit the `color-bg` which drives our cyberpunk/retro-terminal background gradient.
- **Glassmorphism**: When laying elements on top of the canvas, use the `glass-panel` class. It manages borders, background opacity, and backdrop-filtering natively.

## Error Handling at the UI Layer

Because the schedule and rendering pipelines are dynamically computed, isolated failures in logic must never crash the entire page.

I decided to mandate that complex components interact closely with React's Error Boundaries or gracefully fallback during hydration discrepancies.

```tsx
try {
  const processed = buildVisualGrid(assignments)
} catch (error) {
  // Provide a fallback UI directly within the component
  return <div className="error-state glass-panel">Could not render grid: {error.message}</div>
}
```

Always check for `null` bounds inside your render loops, especially concerning values reliant on IndexedDB hydration that may run slightly async during component mount.
