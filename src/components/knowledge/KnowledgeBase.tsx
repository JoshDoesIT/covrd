import { useState, useMemo } from 'react'
import { Search, BookOpen, ArrowLeft } from 'lucide-react'
import { ARTICLES } from '../../data/articles'
import type { Article } from '../../data/articles'
import './KnowledgeBase.css'

/**
 * A very simple markdown to JSX parser for controlled article strings.
 * Handles h1, h2, ul/li, em, strong, and paragraphs.
 */
function parseSimpleMarkdown(markdown: string) {
  const blocks = markdown.trim().split('\n\n')

  return blocks.map((block, idx) => {
    // Headings
    if (block.startsWith('# ')) {
      return <h1 key={idx}>{block.replace('# ', '')}</h1>
    }
    if (block.startsWith('## ')) {
      return <h2 key={idx}>{block.replace('## ', '')}</h2>
    }
    if (block.startsWith('### ')) {
      return <h3 key={idx}>{block.replace('### ', '')}</h3>
    }

    // Lists (poor man's ul/li parser)
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').map((line) => line.replace(/^[-*] /, ''))
      return (
        <ul key={idx}>
          {items.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ul>
      )
    }

    // Ordered Lists (ol/li)
    if (/^\d+\.\s/.test(block)) {
      const items = block.split('\n').map((line) => line.replace(/^\d+\.\s/, ''))
      return (
        <ol key={idx}>
          {items.map((item, i) => (
            <li key={i}>{parseInline(item)}</li>
          ))}
        </ol>
      )
    }

    // Default to paragraph
    return <p key={idx}>{parseInline(block)}</p>
  })
}

// Helper for inline styles (bold, italic)
function parseInline(text: string) {
  // We'll use a dangerouslySetInnerHTML approach for inline formatting
  // since this is controlled static data without XSS risk from users.
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)

  const selectedArticle = useMemo(() => {
    if (!selectedArticleId) return null
    return ARTICLES.find((a) => a.id === selectedArticleId) || null
  }, [selectedArticleId])

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return ARTICLES

    const query = searchTerm.toLowerCase()
    return ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.category.toLowerCase().includes(query) ||
        a.tags.some((t) => t.toLowerCase().includes(query)) ||
        a.content.toLowerCase().includes(query),
    )
  }, [searchTerm])

  const groupedArticles = useMemo(() => {
    const groups: Record<string, Article[]> = {}
    filteredArticles.forEach((a) => {
      if (!groups[a.category]) groups[a.category] = []
      groups[a.category].push(a)
    })
    return groups
  }, [filteredArticles])

  if (selectedArticle) {
    return (
      <div className="kb-container">
        <div className="kb-article-view">
          <button className="kb-back-btn" onClick={() => setSelectedArticleId(null)}>
            <ArrowLeft size={16} /> Back to Library
          </button>

          <div className="kb-article-content">{parseSimpleMarkdown(selectedArticle.content)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="kb-container">
      <header className="kb-header">
        <h2 className="kb-title">
          <BookOpen size={24} color="var(--color-accent)" />
          Knowledgebase
        </h2>
        <div className="kb-search-container">
          <Search size={16} className="kb-search-icon" />
          <input
            type="text"
            className="kb-search-input"
            placeholder="Search articles, guides, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="kb-content">
        {Object.entries(groupedArticles).length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No articles found for "{searchTerm}"</p>
        ) : (
          Object.entries(groupedArticles).map(([category, articles]) => (
            <div key={category} className="kb-category">
              <h3>{category}</h3>
              <div className="kb-grid">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="kb-card"
                    onClick={() => setSelectedArticleId(article.id)}
                  >
                    <h4 className="kb-card-title">{article.title}</h4>
                    <div className="kb-card-tags">
                      {article.tags.map((tag) => (
                        <span key={tag} className="kb-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
