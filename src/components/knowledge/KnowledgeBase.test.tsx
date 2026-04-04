import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KnowledgeBase } from './KnowledgeBase'

describe('KnowledgeBase', () => {
  it('renders learning categories and titles from article data', () => {
    render(<KnowledgeBase />)

    // Check for categories
    expect(screen.getByText('User Guide')).toBeInTheDocument()
    expect(screen.getByText('Compliance')).toBeInTheDocument()

    // Check for specific article titles
    expect(screen.getByText('Getting Started with Covrd')).toBeInTheDocument()
    expect(screen.getByText('Labor Compliance & Break Times')).toBeInTheDocument()
  })

  it('filters articles based on search term', () => {
    render(<KnowledgeBase />)

    const searchInput = screen.getByPlaceholderText(/search articles/i)

    // Search for specific text found in one article
    fireEvent.change(searchInput, { target: { value: 'Automagic' } })

    // 'Automagic' should match Getting Started with Covrd
    expect(screen.getByText('Getting Started with Covrd')).toBeInTheDocument()

    // Other articles should be hidden
    expect(screen.queryByText('Labor Compliance & Break Times')).not.toBeInTheDocument()
  })

  it('navigates to an article detail view when clicked', () => {
    render(<KnowledgeBase />)

    // Click an article card
    fireEvent.click(screen.getByText('Getting Started with Covrd'))

    // Detailed view should show rendered markdown headers (e.g. "Welcome to Covrd!")
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Covrd!' })).toBeInTheDocument()

    // Category list shouldn't be visible in detail view
    expect(screen.queryByText('User Guide', { selector: 'h3' })).not.toBeInTheDocument()

    // Verify back button functionality
    const backBtn = screen.getByRole('button', { name: /Back to Library/i })
    fireEvent.click(backBtn)

    // We should be back on the main view
    expect(screen.getByText('User Guide', { selector: 'h3' })).toBeInTheDocument()
  })

  it('safely parses inline markdown to JSX formatting', () => {
    // This explicitly tests the parseInline() logic that drives the knowledge base.
    // It verifies our regex doesn't over-match and instead wraps properly.
    render(<KnowledgeBase />)

    // We navigate to an article known to have **bold** or *italic* syntax elements
    fireEvent.click(screen.getByText('Getting Started with Covrd'))

    // Check if the DOM rendered a standard HTML strong element from **text** syntax
    // There are strong tags in our article data. We can assert that the HTML element
    // is correctly parsed in the text content
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()

    // Because we use dangerouslySetInnerHTML, we look for elements with tag name STRONG
    // or EM internally to confirm parsing actually occurred instead of literal asterisks outed
    const strongTags = document.querySelectorAll('strong')
    expect(strongTags.length).toBeGreaterThan(0)

    // And verify the original ** syntax is NOT printed literally to the page payload text
    const textContent = document.body.textContent || ''
    expect(textContent).not.toMatch(/\*\*[A-Za-z]+\*\*/)
  })

  it('safely parses ordered lists into ol and li tags', () => {
    // Verifies that numbering correctly triggers list items instead of collapsed paragraphs
    render(<KnowledgeBase />)

    // Getting Started uses an ordered list for 'The Core Process'
    fireEvent.click(screen.getByText('Getting Started with Covrd'))

    // We expect there to be an ordered list present
    const ols = document.querySelectorAll('ol')
    expect(ols.length).toBeGreaterThan(0)

    // And there should be at least list items (representing 1., 2., 3.)
    const lis = ols[0].querySelectorAll('li')
    expect(lis.length).toBeGreaterThanOrEqual(2)
  })
})
