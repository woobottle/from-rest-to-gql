import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../gql/src/schema.graphql",
  // gql 태그(graphql`...`)와 .graphql 문서를 어디서 스캔할지.
  // 생성 결과물 폴더(src/gql)는 다시 읽지 않도록 제외.
  documents: ["src/**/*.{ts,tsx}", "!src/gql/**/*"],
  ignoreNoDocuments: true,
  generates: {
    "src/gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
