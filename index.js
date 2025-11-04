const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// 모델 import
const Todo = require('./models/Todo');
const User = require('./models/User');
// 라우터 import
const todosRouter = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(helmet()); // 보안 헤더 추가
// Referrer-Policy를 명시적으로 설정해 strict-origin-when-cross-origin 이슈 완화
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

// CORS 설정 - 환경변수로 프론트엔드 URL 관리
const allowedOrigins = [
  // 개발 환경
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
  // 환경변수로 추가된 프론트엔드 URL들 (쉼표로 구분)
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Origin이 없는 요청 (Postman, 모바일 앱 등) 허용
    if (!origin) return callback(null, true);
    
    // 허용된 Origin 목록에 있으면 허용
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // 프로덕션 환경에서는 모든 Origin 허용하지 않음
    // 개발 환경이나 특별한 경우를 위해 환경변수로 제어 가능
    if (process.env.ALLOW_ALL_ORIGINS === 'true') {
      return callback(null, true);
    }
    
    // 그 외의 경우 거부
    console.warn(`CORS 차단: ${origin}은 허용되지 않은 Origin입니다.`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // CORS 설정

// Private Network 프리플라이트 허용 (Chrome 보안 정책 대응)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    // CORS 설정과 일치하도록 Origin 검증
    if (!origin || allowedOrigins.includes(origin) || process.env.ALLOW_ALL_ORIGINS === 'true') {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Private-Network', 'true');
      return res.sendStatus(204);
    }
    return res.sendStatus(403); // 허용되지 않은 Origin
  }
  next();
});
app.use(morgan('combined')); // 로깅
app.use(express.json()); // JSON 파싱
app.use(express.urlencoded({ extended: true })); // URL 인코딩 파싱

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Todo Backend API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 라우터 마운트
app.use('/api/todos', todosRouter);
// 호환용 별칭 (프론트가 /todos로 호출하는 경우 대응)
app.use('/todos', todosRouter);

// 할 일 완료/미완료 토글
app.patch('/api/todos/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: '할 일을 찾을 수 없습니다.'
      });
    }

    todo.completed = !todo.completed;
    const updatedTodo = await todo.save();

    res.json({
      success: true,
      data: updatedTodo,
      message: `할 일이 ${updatedTodo.completed ? '완료' : '미완료'}로 변경되었습니다.`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '할 일 상태를 변경하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 할 일 삭제
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: '할 일을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '할 일이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '할 일을 삭제하는 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: '서버 내부 오류가 발생했습니다.'
  });
});

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('='.repeat(50));
  console.log('🎉 MongoDB 연결 성공!');
  console.log('='.repeat(50));
  // 보안을 위해 전체 URI 대신 호스트와 데이터베이스 이름만 표시
  try {
    const url = new URL(MONGODB_URI);
    const host = url.hostname;
    const dbName = url.pathname.slice(1) || 'default';
    console.log(`📊 데이터베이스: ${host}/${dbName}`);
  } catch (e) {
    console.log(`📊 데이터베이스: 연결됨`);
  }
  console.log(`⏰ 연결 시간: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50));
})
.catch((error) => {
  console.log('='.repeat(50));
  console.error('❌ MongoDB 연결 실패!');
  console.error('='.repeat(50));
  console.error(`오류 내용: ${error.message}`);
  console.error('='.repeat(50));
  process.exit(1);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
});

module.exports = app;
