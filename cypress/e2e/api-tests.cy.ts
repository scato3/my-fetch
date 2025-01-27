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
        expect(data[0]).to.deep.equal({ id: 1, key: "value" });
      },
    });

    cy.wait("@getRequest").then((interception) => {
      expect(interception.request.headers).to.have.property(
        "authorization",
        "Bearer test-token"
      );
      expect(interception.request.url).to.include("/api/test");
      expect(interception.request.url).to.include("select=%2A");
    });
  });

  it("POST Request Test", () => {
    const testData = { key: "value" };
    api.post({
      url: `${API_ENDPOINT}/test`,
      body: testData,
      onSuccess: (data: { key: string } & { id?: number }) => {
        expect(data).to.deep.equal({ id: 2, key: "value" });
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

  it("Timeout Test", () => {
    cy.intercept("GET", `${API_ENDPOINT}/test/timeout`, (req) => {
      req.reply({
        statusCode: 200,
        delay: 6000,
        body: { message: "Delayed response" }
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

  it("Retry Logic Test", () => {
    let attempts = 0;
    cy.intercept("GET", `${API_ENDPOINT}/test/retry`, (req) => {
      attempts++;
      if (attempts < 3) {
        req.reply({ 
          statusCode: 500,
          body: { message: "Server Error" }
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { success: true }
        });
      }
    }).as("retryRequest");

    api.get({
      url: `${API_ENDPOINT}/test/retry`,
      retryCount: 3,
      retryDelay: 100,
      onSuccess: (data) => {
        expect(data).to.deep.equal({ success: true });
      }
    });

    // 모든 요청을 기다림
    cy.wait("@retryRequest")
      .wait("@retryRequest")
      .wait("@retryRequest")
      .then(() => {
        expect(attempts).to.equal(3);
      });
  });

  it("Concurrent Requests Test", () => {
    [1, 2, 3].forEach(id => {
      cy.intercept("GET", `${API_ENDPOINT}/test/${id}`, {
        statusCode: 200,
        body: { id, data: `data${id}` }
      }).as(`request${id}`);
    });

    // 각 요청 확인
    [1, 2, 3].forEach(id => {
      cy.wait(`@request${id}`);
    });
  });

  it("Cache Headers Test", () => {
    cy.intercept("GET", `${API_ENDPOINT}/test`, (req) => {
      req.reply({
        statusCode: 200,
        body: [{ id: 1, key: "value" }]
      });
    }).as("getRequest");

    api.get({
      url: `${API_ENDPOINT}/test`,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    cy.wait("@getRequest").then((interception) => {
      expect(interception.request.headers['cache-control']).to.equal('no-cache');
    });
  });
});
