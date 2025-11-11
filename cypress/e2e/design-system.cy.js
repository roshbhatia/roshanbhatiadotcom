describe('Design System Demo', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display main page sections', () => {
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

  it('should display README content', () => {
    // Check that README section exists
    cy.getByDataTest('readme-section').should('exist')
    cy.getByDataTest('readme-title').should('exist')
    
    // Should have some content (not loading/error states)
    cy.getByDataTest('readme-section').should('not.contain', '[LOADING')
    cy.getByDataTest('readme-section').should('not.contain', '[ERROR]')
  })

  it('should display writing section', () => {
    // Check that writing section exists
    cy.getByDataTest('writing-section').should('exist')
    cy.getByDataTest('writing-title').should('exist')
    
    // Should contain blog cards
    cy.getByDataTest('blog-card').should('have.length.greaterThan', 0)
  })
})