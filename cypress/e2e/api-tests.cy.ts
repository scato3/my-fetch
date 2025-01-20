/// <reference types="cypress" />

import Api from "../../src/index";

describe("hsc-fetch API E2E Test", () => {
  const API_ENDPOINT = "/api";

  beforeEach(() => {
    // 각 HTTP 메소드별 모의 응답 설정
    cy.intercept("GET", `${API_ENDPOINT}/test*`, {
      statusCode: 200,
      body: [{ id: 1, key: "value" }],
    }).as("getRequest");

    cy.intercept("POST", `${API_ENDPOINT}/test*`, {
      statusCode: 201,
      body: { id: 2, key: "value" },
    }).as("postRequest");

    cy.intercept("PUT", `${API_ENDPOINT}/test/*`, {
      statusCode: 200,
      body: { id: 3, key: "updated" },
    }).as("putRequest");

    cy.intercept("PATCH", `${API_ENDPOINT}/test/*`, {
      statusCode: 200,
      body: { id: 4, key: "patched" },
    }).as("patchRequest");

    cy.intercept("DELETE", `${API_ENDPOINT}/test/*`, {
      statusCode: 204,
    }).as("deleteRequest");
  });

  const api = new Api({
    baseUrl: Cypress.config().baseUrl || "",
    getToken: () => Cypress.env("ACCESS_TOKEN") || "test-token",
    onRefreshToken: async () => {
      // 토큰 갱신 즉시 수행
      Cypress.env("ACCESS_TOKEN", "new-test-token");
    },
  });

  it("GET Request Test", () => {
    api.get({
      url: `${API_ENDPOINT}/test`,
      query: { select: "*" },
      onSuccess: (data: Array<{ id: number; key: string }>) => {
        expect(data).to.be.an("array");
        expect(data[0]).to.have.property("key");
      },
    });

    cy.wait("@getRequest").then((interception) => {
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
      expect(interception.request.url).to.include("/api/test");
    });
  });

  it("POST Request Test", () => {
    const testData = { key: "value" };
    api.post({
      url: `${API_ENDPOINT}/test`,
      body: testData,
      onSuccess: (data: { key: string } & { id?: number }) => {
        expect(data).to.have.property("key", "value");
      },
    });

    cy.wait("@postRequest").then((interception) => {
      expect(interception.request.body).to.deep.equal(testData);
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
    });
  });

  it("PUT Request Test", () => {
    const updateData = { id: 3, key: "updated" };
    api.put({
      url: `${API_ENDPOINT}/test/3`,
      body: updateData,
      onSuccess: (data: { key: string } & { id?: number }) => {
        expect(data).to.have.property("key", "updated");
      },
    });

    cy.wait("@putRequest").then((interception) => {
      expect(interception.request.body).to.deep.equal(updateData);
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
    });
  });

  it("PATCH Request Test", () => {
    const patchData = { key: "patched" };
    api.patch({
      url: `${API_ENDPOINT}/test/4`,
      body: patchData,
      onSuccess: (data: { key: string } & { id?: number }) => {
        expect(data).to.have.property("key", "patched");
      },
    });

    cy.wait("@patchRequest").then((interception) => {
      expect(interception.request.body).to.deep.equal(patchData);
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
    });
  });

  it("DELETE Request Test", () => {
    api.delete({
      url: `${API_ENDPOINT}/test/5`,
      onSuccess: () => {
        // DELETE는 보통 204 No Content로 응답
      },
    });

    cy.wait("@deleteRequest").then((interception) => {
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
    });
  });

  it("Token Refresh Test", () => {
    let isFirstRequest = true;
    Cypress.env("ACCESS_TOKEN", "test-token");

    cy.intercept("GET", `${API_ENDPOINT}/test`, (req) => {
      const authHeader = req.headers.authorization;

      if (authHeader === "Bearer test-token" && isFirstRequest) {
        isFirstRequest = false;
        req.reply({
          statusCode: 401,
          headers: { "www-authenticate": 'Bearer error="invalid_token"' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: [{ id: 1, key: "value" }],
        });
      }
    }).as("tokenRefresh");

    api.get({
      url: `${API_ENDPOINT}/test`,
      onSuccess: (data: Array<{ id: number; key: string }>) => {
        expect(data).to.be.an("array");
      },
    });

    // 첫 번째 요청 (401)과 두 번째 요청 (200) 확인
    cy.wait("@tokenRefresh").then((interception) => {
      expect(interception.response?.statusCode).to.equal(401);
    });

    cy.wait("@tokenRefresh").then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
    });
  });

  it("Error Handling Test", () => {
    cy.intercept("GET", `${API_ENDPOINT}/test/error`, {
      statusCode: 500,
      body: { message: "Request failed" },
      headers: {
        "Content-Type": "application/json",
      },
    }).as("errorRequest");

    api.get({
      url: `${API_ENDPOINT}/test/error`,
      onError: (error) => {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.contain("Request failed");
      },
    });
  });

  it("Timeout Test", () => {
    cy.intercept("GET", `${API_ENDPOINT}/test/timeout`, (req) => {
      req.reply({
        statusCode: 200,
        body: { data: "delayed response" },
        delay: 6000, // milliseconds
      });
    }).as("timeoutRequest");

    api.get({
      url: `${API_ENDPOINT}/test/timeout`,
      timeout: 5000,
      onError: (error) => {
        expect(error.message).to.equal("Request timed out");
      },
    });
  });
});
