import { defineConfig } from "cypress";
import * as dotenv from "dotenv";

// .env 파일에서 환경 변수 로드
dotenv.config();

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Node 이벤트 추가 가능
    },
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/e2e/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
    watchForFileChanges: false,
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    ACCESS_TOKEN: "",
    REFRESH_TOKEN: "",
  },
  video: false,
});
