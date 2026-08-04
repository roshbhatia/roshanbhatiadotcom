describe('Home', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('renders the bio without a network round trip', () => {
    cy.getByDataTest('main-title').should('contain', 'Roshan Bhatia')
    cy.getByDataTest('readme-section').should('be.visible')
    cy.getByDataTest('readme-section').should('contain', 'platform')

    // The bio used to be fetched through a CORS proxy that always failed.
    cy.getByDataTest('readme-section').should('not.contain', 'loading')
    cy.getByDataTest('readme-section').should('not.contain', 'error')
  })

  it('lists every post, newest first', () => {
    cy.getByDataTest('blog-card').should('have.length.at.least', 1)
    cy.getByDataTest('blog-card')
      .first()
      .find('[data-test="blog-date"]')
      .invoke('text')
      .then((newest) => {
        cy.getByDataTest('blog-card')
          .last()
          .find('[data-test="blog-date"]')
          .invoke('text')
          .then((oldest) => {
            expect(newest >= oldest).to.equal(true)
          })
      })
  })

  it('shows the whole writing list rather than hiding it behind the footer', () => {
    // The footer was sticky and painted over the list on first load.
    cy.getByDataTest('blog-card').last().should('be.visible')
  })

  it('filters posts and reports the count', () => {
    cy.getByDataTest('blog-card').its('length').as('total')
    cy.get('input[aria-label="Filter posts"]').type('keyboard')
    cy.getByDataTest('blog-card').should('have.length', 1)
    cy.getByDataTest('blog-card').should('contain', 'Keyboard')

    cy.get('input[aria-label="Filter posts"]').clear().type('zzzznomatch')
    cy.getByDataTest('blog-card').should('have.length', 0)
    cy.contains('no matches found').should('be.visible')
  })

  it('focuses the filter on ctrl+k', () => {
    cy.get('body').type('{ctrl}k')
    cy.focused().should('have.attr', 'aria-label', 'Filter posts')
  })

  it('opens the highlighted post with the keyboard alone', () => {
    cy.get('input[aria-label="Filter posts"]').focus().type('{downarrow}{enter}')
    cy.getByDataTest('blog-content').should('exist')
  })

  it('toggles between dark and light and remembers the choice', () => {
    cy.getByDataTest('theme-toggle').should('be.visible')

    cy.document().then((doc) => {
      const before = doc.documentElement.getAttribute('data-theme')
      cy.getByDataTest('theme-toggle').click()
      cy.document()
        .its('documentElement')
        .invoke('getAttribute', 'data-theme')
        .should((after) => {
          expect(after).to.be.oneOf(['dark', 'light'])
          expect(after).to.not.equal(before)
        })
        .then((after) => {
          cy.reload()
          cy.document()
            .its('documentElement')
            .invoke('getAttribute', 'data-theme')
            .should('equal', after)
        })
    })
  })
})
