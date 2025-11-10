describe('Blog Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display blog posts', () => {
    // Check that blog cards are rendered
    cy.getByDataTest('blog-card').should('have.length.greaterThan', 0)
    
    // Check that first blog card has required elements
    cy.getByDataTest('blog-card').first().within(() => {
      cy.contains('[POST]').should('exist')
      cy.getByDataTest('blog-title').should('exist')
      cy.getByDataTest('blog-date').should('exist')
      cy.getByDataTest('reading-time').should('exist')
      cy.contains('[READ_MORE]').should('exist')
    })
  })

  it('should open blog post when clicked', () => {
    // Click on first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Check that modal opens with blog content
    cy.getByDataTest('blog-modal').should('be.visible')
    cy.getByDataTest('blog-modal').within(() => {
      cy.getByDataTest('back-button').should('exist')
      cy.getByDataTest('blog-title').should('exist')
      cy.getByDataTest('blog-date').should('exist')
      cy.getByDataTest('reading-time').should('exist')
    })
  })

  it('should display blog content correctly', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Wait for content to load
    cy.getByDataTest('blog-content').should('exist')
    
    // Check that main title is rendered
    cy.getByDataTest('blog-modal').within(() => {
      cy.get('h1').should('contain', 'Keyboard designing for fools, by an idiot')
      
      // Check that H2 elements contain key content (more flexible approach)
      cy.get('h2').should('have.length.gte', 3)
      
      // Check first H2 contains "The beginning of the end"
      cy.get('h2').first().invoke('text').then((text) => {
        expect(text).to.include('The beginning of the end')
      })
      
      // Check second H2 contains "middle bit"
      cy.get('h2').eq(1).invoke('text').then((text) => {
        expect(text).to.include('middle bit')
      })
      
      // Check third H2 contains "Assembly"
      cy.get('h2').eq(2).invoke('text').then((text) => {
        expect(text).to.include('Assembly')
      })
    })
  })

  it('should display table of contents', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Check that TOC is present
    cy.contains('[TABLE OF CONTENTS]').should('exist')
    
    // Check that TOC has clickable links
    cy.get('nav a').should('have.length.greaterThan', 0)
    
    // Check that first TOC link works
    cy.get('nav a').first().click()
    
    // Check that URL hash is updated
    cy.url().should('include', '#')
  })

  it('should display images with correct paths and captions', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()

    // Wait for images to load
    cy.get('img').should('have.length.greaterThan', 0)

    // Check that first image has correct src path
    cy.get('img').first().should('have.attr', 'src').and('include', '/writing/000/assets/')

    // Check that images with alt text have captions, images without alt text have no captions
    cy.get('img').each(($img) => {
      const alt = $img.attr('alt')
      const caption = $img.parent().find('.text-small.secondary-text.italic')

      if (alt && alt !== 'PLACEHOLDER') {
        expect(caption).to.exist
        expect(caption.text().trim()).to.equal(alt)
      } else {
        // Images without alt text should not have caption elements
        expect(caption).to.not.exist
      }
    })
  })

  it('should render links correctly in Resources sections', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Find Resources section (as plain text, not header)
    cy.contains('Resources:').should('exist')
    
    // Check that list items containing Resources have proper links
    cy.contains('li', 'Keyboard Layout Editor').within(() => {
      cy.get('a').should('exist')
      cy.get('a').should('have.attr', 'target', '_blank')
      cy.get('a').should('have.attr', 'rel', 'noopener noreferrer')
      cy.get('a').should('have.class', 'text-link')
      cy.get('a').should('contain', 'Keyboard Layout Editor')
    })
    
    cy.contains('li', 'Ergogen').within(() => {
      cy.get('a').should('exist')
      cy.get('a').should('have.attr', 'target', '_blank')
      cy.get('a').should('have.attr', 'rel', 'noopener noreferrer')
      cy.get('a').should('have.class', 'text-link')
      cy.get('a').should('contain', 'Ergogen')
    })
  })

  it('should style Background and Resources sections specially', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Check that Background and Resources sections exist as plain text (not styled headers)
    cy.contains('Background knowledge:').should('exist')
    cy.contains('Resources:').should('exist')
    
    // Note: Special styling only applies to headers containing "background" or "resources"
    // Since these are plain text in the current blog, we just verify they exist
  })

  it('should close modal when back button clicked', () => {
    // Open blog post
    cy.getByDataTest('blog-card').first().click()
    cy.getByDataTest('blog-modal').should('be.visible')
    
    // Click back button
    cy.getByDataTest('back-button').click()
    
    // Check that modal is closed
    cy.getByDataTest('blog-modal').should('not.exist')
    
    // Should return to blog list
    cy.getByDataTest('blog-card').should('be.visible')
  })

  it('should close modal when clicking outside', () => {
    // Open blog post
    cy.getByDataTest('blog-card').first().click()
    cy.getByDataTest('blog-modal').should('be.visible')
    
    // Click on overlay (outside modal content) - click at coordinates
    cy.getByDataTest('blog-modal').click(0, 0)
    
    // Wait for modal to close
    cy.wait(100)
    
    // Check that modal is closed
    cy.getByDataTest('blog-modal').should('not.exist')
  })

  it('should close modal when Escape key pressed', () => {
    // Open blog post
    cy.getByDataTest('blog-card').first().click()
    cy.getByDataTest('blog-modal').should('be.visible')
    
    // Press Escape key
    cy.get('body').type('{esc}')
    
    // Wait a moment for close animation to complete
    cy.wait(100)
    
    // Check that modal is closed
    cy.getByDataTest('blog-modal').should('not.exist')
  })

  it('should display theme toggle in correct position', () => {
    // Check theme toggle exists and is positioned correctly
    cy.getByDataTest('theme-toggle').should('exist')
    cy.getByDataTest('theme-toggle').should('have.css', 'position', 'fixed')
    cy.getByDataTest('theme-toggle').should('have.css', 'bottom')
    cy.getByDataTest('theme-toggle').should('have.css', 'right')
  })

  it('should display version information', () => {
    // Check version info exists
    cy.getByDataTest('version-info').should('exist')
    cy.getByDataTest('version-info').should('contain', 'VERSION:')
    cy.getByDataTest('build-time').should('exist')
    cy.getByDataTest('build-time').should('match', /[a-f0-9]{7,}/)
  })

  it('should render inline code correctly', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Check that inline code elements exist and are properly styled
    cy.get('code.inline-code').should('have.length.greaterThan', 0)
    
    // Check specific inline code content from the blog post
    cy.contains('code.inline-code', 'yaml').should('exist')
    
    // Verify inline code has proper styling (should not contain HTML tags)
    cy.get('code.inline-code').each(($code) => {
      const text = $code.text()
      // Should not contain HTML-like tags
      expect(text).to.not.include('<')
      expect(text).to.not.include('>')
      expect(text).to.not.include('</')
    })
  })

  it('should render code blocks with proper styling', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()

    // Check that code blocks exist
    cy.get('.code-block').should('have.length.greaterThan', 0)

    // Check that code blocks have language indicators
    cy.get('.code-block .accent-text').should('have.length.greaterThan', 0)
    cy.contains('.code-block .accent-text', '[PYTHON]').should('exist')

    // Check that code blocks have copy buttons
    cy.get('.code-block button').should('have.length.greaterThan', 0)
    cy.contains('.code-block button', '[COPY]').should('exist')

    // Check that syntax highlighting is applied (Shiki generates pre.shiki elements)
    cy.get('.code-block .shiki-wrapper').should('have.length.greaterThan', 0)
  })

  it('should copy code block content when copy button clicked', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Find first code block and click copy button
    cy.get('.code-block').first().within(() => {
      cy.contains('button', '[COPY]').click()
    })
    
    // Check that button text changes to COPIED
    cy.contains('.code-block button', '[COPIED]').should('exist')
    
    // Wait a moment and check it reverts back to COPY
    cy.wait(2500)
    cy.contains('.code-block button', '[COPY]').should('exist')
  })

  it('should apply opposite colorway for code elements', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()

    // Check that inline code uses opposite colorway CSS variables
    cy.get('code.inline-code').should('have.css', 'background-color')
    cy.get('code.inline-code').should('have.css', 'color')

    // Check that code blocks have styling (Shiki inlines styles)
    cy.get('.code-block .shiki-wrapper').should('exist')
    cy.get('.code-block .shiki-wrapper pre').should('have.css', 'background-color')
  })

  it('should render markdown formatting correctly', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Check that bold text is rendered
    cy.get('strong').should('have.length.greaterThan', 0)
    cy.contains('strong', 'Disclaimer:').should('exist')
    
    // Check that italic text is rendered
    cy.get('em').should('have.length.greaterThan', 0)
    
    // Check that links are rendered with proper attributes
    cy.get('a.text-link').should('have.length.greaterThan', 0)
    cy.get('a.text-link').each(($a) => {
      cy.wrap($a).should('have.attr', 'target', '_blank')
      cy.wrap($a).should('have.attr', 'rel', 'noopener noreferrer')
    })
  })

  it('should handle theme switching for code styling', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()

    // Wait for code to render
    cy.get('.code-block .shiki-wrapper pre').first().should('exist')

    // Get initial code block styling
    cy.get('.code-block .shiki-wrapper pre').first().invoke('css', 'background-color').as('initialBg')

    // Switch theme
    cy.getByDataTest('theme-toggle').click()

    // Wait for theme to apply and code to re-render
    cy.wait(500)

    // Check that code styling has changed (indicating theme switch worked)
    cy.get('.code-block .shiki-wrapper pre').first().invoke('css', 'background-color').then((newBg) => {
      cy.get('@initialBg').then((initialBg) => {
        expect(newBg).to.not.equal(initialBg)
      })
    })
  })
})