# Todo Backend API Server

Node.js와 Express를 사용한 Todo 애플리케이션의 백엔드 API 서버입니다.

## 🚀 시작하기

### 필수 요구사항

- Node.js (v14 이상)
- npm 또는 yarn

### 설치 및 실행

1. 의존성 패키지 설치:
```bash
npm install
```

2. 환경 변수 설정:
```bash
# .env 파일을 생성하고 필요한 환경 변수를 설정하세요
cp .env.example .env
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 프로덕션 서버 실행:
```bash
npm start
```

### API 엔드포인트

- `GET /` - 서버 상태 확인
- `GET /health` - 헬스 체크

## 📁 프로젝트 구조

```
todo-backend/
├── server.js          # 메인 서버 파일
├── package.json       # 프로젝트 설정 및 의존성
├── .gitignore         # Git 무시 파일 목록
└── README.md          # 프로젝트 문서
```

## 🛠️ 사용된 기술

- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - 보안 헤더
- **Morgan** - HTTP 요청 로거
- **dotenv** - 환경 변수 관리

## 📝 스크립트

- `npm start` - 프로덕션 서버 실행
- `npm run dev` - 개발 서버 실행 (nodemon 사용)
- `npm test` - 테스트 실행

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| PORT | 서버 포트 | 3000 |
| NODE_ENV | 환경 설정 | development |

## 📄 라이선스

ISC
