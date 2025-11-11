describe('Page Structure and Navigation', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display main navigation sections', () => {
    // Check that main sections exist
    cy.getByDataTest('main-title').should('contain', 'ROSHAN BHATIA')
    cy.getByDataTest('readme-section').should('be.visible')
    cy.getByDataTest('writing-section').should('be.visible')
  })

  it('should have working theme toggle', () => {
    // Check theme toggle exists and is clickable
    cy.getByDataTest('theme-toggle').should('be.visible')

    // Get initial data-theme attribute from root div
    cy.get('[data-theme]').invoke('attr', 'data-theme').as('initialTheme')

    // Click theme toggle
    cy.getByDataTest('theme-toggle').click()

    // Verify data-theme attribute changed
    cy.get('@initialTheme').then((initialTheme) => {
      cy.get('[data-theme]').invoke('attr', 'data-theme').should('not.equal', initialTheme)
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