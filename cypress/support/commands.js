// Custom Cypress commands
Cypress.Commands.add('getByDataTest', (selector) => {
  return cy.get(`[data-test="${selector}"]`)
})

Cypress.Commands.add('clickByDataTest', (selector) => {
  return cy.get(`[data-test="${selector}"]`).click()
})