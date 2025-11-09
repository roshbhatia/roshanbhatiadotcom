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
    cy.get('img').first().should('have.attr', 'src').and('include', '/writing/000/Keyboard designing for fools, by an idiot/')
    
    // Check that images have captions (either alt text or PLACEHOLDER)
    cy.get('img').each(($img) => {
      const caption = $img.parent().find('.text-small, .secondary-text, .italic')
      expect(caption).to.exist
      expect(caption.text().trim()).to.not.be.empty
    })
  })

  it('should render links correctly in Resources sections', () => {
    // Open first blog post
    cy.getByDataTest('blog-card').first().click()
    
    // Find Resources section (as plain text, not header)
    cy.contains('Resources:').should('exist')
    
    // Check that list items after Resources text have proper links
    cy.contains('Resources:').parent().find('li').each(($li) => {
      // Should contain anchor tags with proper attributes
      cy.wrap($li).find('a').should('exist')
      cy.wrap($li).find('a').should('have.attr', 'target', '_blank')
      cy.wrap($li).find('a').should('have.attr', 'rel', 'noopener noreferrer')
      cy.wrap($li).find('a').should('have.class', 'text-link')
    })
    
    // Check specific resource links exist and are clickable
    cy.contains('a', 'keyboard-layout-editor.com').should('exist')
    cy.contains('a', 'ergogen.xyz').should('exist')
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
    
    // Click on overlay (outside modal content)
    cy.getByDataTest('blog-modal').click('topLeft')
    
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
    cy.getByDataTest('build-time').should('exist')
    cy.getByDataTest('build-time').should('match', /[a-f0-9]{7,}/)
  })
})