// dev.js
// 목적: Windows 운영체제에서 Vercel CLI symlink 권한 문제(EPERM)가 발생할 때,
// 외부 패키지 추가 설치 없이 순수 Node.js 내장 모듈만으로
// 정적 파일(public/)과 서버리스 함수(api/analyze.js)를 로컬에서 즉시 구동합니다.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. .env 환경변수 파일 자동 로드 (Node.js 20.6.0 이상 내장 기능)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(__dirname, ".env"));
  } catch {
    // .env 파일이 없거나 읽을 수 없는 경우 무시
  }
}

// 2. Vercel 서버리스 함수 핸들러 동적 불러오기
import analyzeHandler from "./api/analyze.js";

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

// 파일 확장자별 MIME 타입 매핑
const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

// 3. 로컬 개발 서버 생성
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 4. API 요청 처리: POST /api/analyze
  if (pathname === "/api/analyze") {
    // Vercel Serverless Function의 res 헬퍼(status, json) 래핑
    res.status = function (statusCode) {
      res.statusCode = statusCode;
      return res;
    };
    res.json = function (data) {
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      res.end(JSON.stringify(data));
      return res;
    };

    // 요청 본문(body) 수신 및 JSON 파싱
    let bodyData = "";
    req.on("data", (chunk) => {
      bodyData += chunk;
    });

    req.on("end", async () => {
      try {
        req.body = bodyData ? JSON.parse(bodyData) : {};
      } catch {
        req.body = {};
      }

      try {
        // 실제 api/analyze.js 핸들러 실행
        await analyzeHandler(req, res);
      } catch (handlerErr) {
        console.error("핸들러 실행 중 예외:", handlerErr);
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: { code: "SERVER_ERROR", message: "Internal error" } }));
        }
      }
    });

    return;
  }

  // 5. 정적 파일(public/) 서빙
  let safePath = pathname === "/" ? "/index.html" : pathname;
  let filePath = path.join(PUBLIC_DIR, safePath);

  // 보안: public 디렉토리 외부 경로 탈출 방지
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

// 6. 서버 수신 시작
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🎉 마음 온도계 로컬 개발 서버가 준비되었습니다!`);
  console.log(`  👉 브라우저 주소: http://localhost:${PORT}`);
  console.log(`  👉 종료하려면 터미널에서 Ctrl + C 를 누르세요.`);
  console.log(`======================================================\n`);
});

