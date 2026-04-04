export interface Article {
  id: string
  title: string
  category: 'User Guide' | 'Best Practices' | 'Compliance'
  tags: string[]
  content: string
}

export const ARTICLES: Article[] = [
  {
    id: 'getting-started-covrd',
    title: 'Getting Started with covrd',
    category: 'User Guide',
    tags: ['basics', 'onboarding', 'setup'],
    content: `
# Welcome to covrd!

covrd is designed to help you instantly generate fair and optimized schedules for your team across multiple weeks by utilizing the Automagic Schedule Builder. I decided to build the scheduling engine this way because manual scheduling often leads to unintentional bias and compliance violations. By automatically balancing weekly hours and availability boundaries, you can ensure that all constraints are mathematically met.

## The Core Process

Building your schedule involves three main steps:

1. **Team Roster**: Start by adding your employees, establishing their weekly target hours, and mapping out their availability.
2. **Coverage Requirements**: Next, navigate to the Coverage Canvas. Here, you define exactly how many people are needed during a given time block on specific dates across the month (for example, two people needed on April 6th from 9:00 AM to 5:00 PM).
3. **Schedule Builder**: When you click 'Automagic Schedule', the engine processes the inputs to instantly fill the required shifts for your chosen time period.

### Tips for Success

As far as success is concerned, it is important to note that being specific with your drafted coverage shifts yields the best results. Additionally, you should avoid overly limiting employee availability, because the engine might fail to find a valid scheduling solution if constraints are too severe.
`,
  },
  {
    id: 'using-coverage-canvas',
    title: 'How to Use the Coverage Canvas',
    category: 'User Guide',
    tags: ['coverage', 'calendar', 'drafting'],
    content: `
# Using the Coverage Canvas

The Coverage Canvas gives you a high-level monthly view to visualize and define your staffing requirements. I decided to build this as an interactive calendar because businesses often need to deploy different staffing models depending on holidays, seasons, or active promotions.

## Drafting Requirements

To begin mapping your staffing needs, simply click on any date cell within the month grid. This action opens a prompt where you can define specific shifts, the required staff count, and targeted roles (like "Barista" or "Manager"). The grid instantly displays your drafted shift counts, dynamically accounting for local and national holidays.

## Stamping a Pattern

You likely do not want to draft every single shift manually for the entire month. For this reason, I built the "Stamp Weekly Pattern" utility. First, you draft a full week of required shifts anywhere in the current month. Once you have a perfect week configured, click the **Stamp Weekly Pattern** button at the top of the canvas. The engine will instantly grab that fully assembled week and accurately copy it across to every other remaining week in the month.
`,
  },
  {
    id: 'fair-scheduling',
    title: 'Principles of Fair Scheduling',
    category: 'Best Practices',
    tags: ['fairness', 'burnout', 'retention'],
    content: `
# Principles of Fair Scheduling

Staff rotation should not result in random chaos for your team. Following fair scheduling principles actively increases employee retention by respecting boundaries.

## 1. Avoid Clopening Shifts

First, I recommend avoiding "clopening" shifts. A clopening occurs when an employee is scheduled for the closing shift at night and the immediate opening shift the following morning. This violates safe rest periods and leads to rapid burnout. To prevent this, the covrd solver engine is built to inherently reject assignments that do not allow for adequate rest between shifts.

## 2. Fair Weekend Distribution

Second, fair weekend distribution is critical. Almost everyone dislikes working every single weekend. For this reason, it is important to ensure the pain of less desirable shifts is distributed evenly across your roster, rather than consistently penalizing your newest hires. You can accomplish this in covrd by creatively drafting gaps on the Coverage Canvas, intentionally omitting certain weekend coverages to force alternating weekends between distinct teams.

## 3. Predictable Notice

Finally, predictable notice is essential. You should aim to release schedules at least two weeks in advance. According to industry research, last-minute schedule changes are one of the leading causes of turnover in shift-based work environments.
`,
  },
  {
    id: 'labor-compliance-basics',
    title: 'Labor Compliance & Break Times',
    category: 'Compliance',
    tags: ['legal', 'breaks', 'hours'],
    content: `
# Compliance Basics

While labor compliance laws vary heavily by jurisdiction, there are general principles regarding meal breaks and overtime that you should ensure your covrd setup accounts for.

## Meal and Rest Breaks

In many regions, shifts that approach six or eight hours legally require an unpaid meal break, which typically lasts around 30 minutes, along with shorter paid rest periods. I included an 'Unpaid Break Minutes' setting within the Coverage config so that you can specify this directly on the Canvas. This ensures that the employee's total billable hours are mathematically accurate, without forcing you to manually shave 30 minutes off their shift envelope.

## Maximum Hours and Overtime

Additionally, unmonitored overtime can quickly crush your labor budget. By properly configuring each employee's **Max Hours** inside the Team Roster, covrd's solver engine is mathematically restricted from ever scheduling an individual into overtime. Instead, the engine will automatically prioritize scheduling staff members who still have remaining hour allocations for the week.
`,
  },
]
