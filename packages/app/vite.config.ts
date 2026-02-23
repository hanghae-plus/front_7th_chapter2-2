import { createViteConfig } from "../../createViteConfig";
import { resolve } from "path";

// GitHub Pages 배포를 위한 base path 설정
// production 빌드일 때만 base path 적용
// CI 환경에서도 E2E 테스트는 개발 모드로 실행되므로 NODE_ENV만 확인
const base: string = process.env.NODE_ENV === "production" ? "/front_7th_chapter2-2/" : "";

export default createViteConfig({
  base,
  esbuild: {
    jsx: "transform",
    jsxInject: `import React from 'react';`,
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    jsxDev: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
      },
    },
  },
});
