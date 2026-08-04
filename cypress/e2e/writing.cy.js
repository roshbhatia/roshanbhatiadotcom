describe('Reading a post', () => {
  it('opens a post from the list and shows its content', () => {
    cy.visit('/')
    cy.getByDataTest('blog-card').last().click()

    cy.getByDataTest('blog-title').should('be.visible')
    cy.getByDataTest('blog-content').should('be.visible')
    cy.getByDataTest('reading-time').should('contain', 'MIN READ')

    // The list and the post are separate views, never both at once.
    cy.getByDataTest('blog-list').should('not.exist')
  })

  it('is reachable directly by URL', () => {
    cy.visit('/#writing/000')
    cy.getByDataTest('blog-content').should('be.visible')
    cy.title().should('contain', 'Keyboard designing')
  })

  it('renders markdown that the old hand-rolled parser could not', () => {
    cy.visit('/#writing/000')

    // Lists were emitted as bare <li> with no <ul> wrapper.
    cy.get('[data-test="blog-content"] ul li').should('have.length.at.least', 1)

    // Images become figures, and captions render below them.
    cy.get('[data-test="blog-content"] figure.post-figure img').should(
      'have.length.at.least',
      1
    )
    cy.get('[data-test="blog-content"] figure.post-figure figcaption').should(
      'have.length.at.least',
      1
    )

    // Code is highlighted at build time, so it is present on first paint.
    cy.get('[data-test="blog-content"] .shiki').should('have.length.at.least', 1)

    // Bare URLs were left as plain text; they are links now.
    cy.get('[data-test="blog-content"] a[href^="https://"]').should(
      'have.length.at.least',
      1
    )
  })

  it('gives every heading in the table of contents a working target', () => {
    cy.visit('/#writing/000')
    cy.get('nav a[href^="#"]').should('have.length.at.least', 1)
    cy.get('nav a[href^="#"]').each(($link) => {
      const id = $link.attr('href').slice(1)
      cy.get(`[id="${id}"]`).should('exist')
    })
  })

  it('serves images small enough to read on a phone', () => {
    cy.visit('/#writing/000')
    cy.get('[data-test="blog-content"] img')
      .first()
      .should('have.attr', 'src')
      .and('match', /\.webp$/)
  })

  it('goes back to the index with the back button', () => {
    cy.visit('/#writing/000')
    cy.getByDataTest('back-button').click()
    cy.getByDataTest('blog-list').should('be.visible')
    cy.getByDataTest('blog-content').should('not.exist')
  })

  it('goes back to the index on Escape', () => {
    cy.visit('/#writing/000')
    cy.get('body').type('{esc}')
    cy.getByDataTest('blog-list').should('be.visible')
  })

  it('falls back to the index for an unknown slug', () => {
    cy.visit('/#writing/does-not-exist')
    cy.getByDataTest('blog-list').should('be.visible')
    cy.getByDataTest('blog-content').should('not.exist')
  })
})
