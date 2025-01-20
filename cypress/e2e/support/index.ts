declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom command to set test token
     * @example cy.setTestToken('test-token')
     */
    setTestToken(token: string): Chainable<void>;
  }
}
