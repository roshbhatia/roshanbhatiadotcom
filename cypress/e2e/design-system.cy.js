describe('Design System Demo', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display main page sections', () => {
    // Check that main sections exist
    cy.getByDataTest('main-title').should('contain', 'ROSHAN BHATIA')
    cy.get('h2').should('have.length.gte', 2) // At least README.MD and WRITING sections
  })

  it('should have working theme toggle', () => {
    // Check theme toggle exists
    cy.getByDataTest('theme-toggle').should('exist')

    // Get initial theme
    cy.getByDataTest('theme-toggle').invoke('text').as('initialTheme')

    // Click theme toggle
    cy.getByDataTest('theme-toggle').click()

    // Wait for theme change
    cy.wait(100)

    // Check that theme changed
    cy.getByDataTest('theme-toggle').invoke('text').then((newTheme) => {
      cy.get('@initialTheme').then((initialTheme) => {
        expect(newTheme).to.not.equal(initialTheme)
      })
    })

    // Click again to toggle to next theme
    cy.getByDataTest('theme-toggle').click()

    // Wait for theme change
    cy.wait(100)

    // Check that theme changed again
    cy.getByDataTest('theme-toggle').invoke('text').then((thirdTheme) => {
      cy.get('@initialTheme').then((initialTheme) => {
        expect(thirdTheme).to.not.equal(initialTheme)
      })
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