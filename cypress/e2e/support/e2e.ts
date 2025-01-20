import "./command";

// ***********************************************************
// This file is automatically loaded before every E2E test.
// You can add custom commands, global configurations, and more here.
// ***********************************************************

// Global settings to run before all tests
before(() => {
  // Supabase 로그인 대신 테스트 토큰 설정
  Cypress.env("ACCESS_TOKEN", "test-token");
});

// Example: Globally handle errors to prevent Cypress from failing the test
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignore the error and continue the tests
  return false;
});
