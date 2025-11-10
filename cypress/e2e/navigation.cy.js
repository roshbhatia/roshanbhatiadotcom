describe('Page Structure and Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display main navigation sections', () => {
    // Check that main sections exist
    cy.getByDataTest('main-title').should('contain', 'ROSHAN BHATIA')
    cy.get('h2').should('have.length.gte', 2) // At least README.MD and WRITING sections
  })

  it('should have working theme toggle', () => {
    // Check theme toggle exists
    cy.getByDataTest('theme-toggle').should('exist')
    
    // Get initial theme text
    cy.getByDataTest('theme-toggle').invoke('text').as('initialTheme')
    
    // Click theme toggle
    cy.getByDataTest('theme-toggle').click()
    
    // Check that theme changed (text should be different)
    cy.getByDataTest('theme-toggle').invoke('text').then((newTheme) => {
      cy.get('@initialTheme').then((initialTheme) => {
        expect(newTheme).to.not.equal(initialTheme)
      })
    })
    
    // Click again to cycle to next theme
    cy.getByDataTest('theme-toggle').click()
    
    // Check that theme changed again
    cy.getByDataTest('theme-toggle').invoke('text').then((thirdTheme) => {
      cy.get('@initialTheme').then((initialTheme) => {
        expect(thirdTheme).to.not.equal(initialTheme)
      })
    })
  })

  it('should have responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667) // iPhone SE
    cy.getByDataTest('blog-card').should('be.visible')
    
    // Test tablet viewport
    cy.viewport(768, 1024) // iPad
    cy.getByDataTest('blog-card').should('be.visible')
    
    // Test desktop viewport
    cy.viewport(1920, 1080) // Desktop
    cy.getByDataTest('blog-card').should('be.visible')
  })

  it('should have proper meta information', () => {
    // Check page title
    cy.get('head title').should('contain', 'Roshan Bhatia')
    
    // Check meta description
    cy.get('head meta[name="description"]').should('have.attr', 'content')
  })
})