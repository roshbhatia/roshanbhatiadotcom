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
    // Check theme toggle exists and is clickable
    cy.getByDataTest('theme-toggle').should('be.visible')

    // Get initial background color to verify theme changes
    cy.get('body').invoke('css', 'background-color').as('initialBg')

    // Click theme toggle
    cy.getByDataTest('theme-toggle').click()

    // Wait and verify background changed (proves theme switched)
    cy.wait(300)
    cy.get('@initialBg').then((initialBg) => {
      cy.get('body').invoke('css', 'background-color').should('not.equal', initialBg)
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