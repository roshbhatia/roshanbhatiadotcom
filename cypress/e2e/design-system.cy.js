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