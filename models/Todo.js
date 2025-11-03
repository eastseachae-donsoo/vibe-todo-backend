const mongoose = require('mongoose');

// 할 일 스키마 정의
const todoSchema = new mongoose.Schema({
  // 할 일 제목 (필수)
  title: {
    type: String,
    required: [true, '할 일 제목은 필수입니다.'],
    trim: true,
    maxlength: [200, '제목은 200자를 초과할 수 없습니다.']
  },
  
  // 할 일 설명 (선택사항)
  description: {
    type: String,
    trim: true,
    maxlength: [1000, '설명은 1000자를 초과할 수 없습니다.']
  },
  
  // 완료 상태 (기본값: false)
  completed: {
    type: Boolean,
    default: false
  },
  
  // 우선순위 (low, medium, high)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // 카테고리 (선택사항)
  category: {
    type: String,
    trim: true,
    maxlength: [50, '카테고리는 50자를 초과할 수 없습니다.']
  },
  
  // 마감일 (선택사항)
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: '마감일은 현재 시간보다 미래여야 합니다.'
    }
  },
  
  // 태그 배열
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, '각 태그는 30자를 초과할 수 없습니다.']
  }],
  
  // 생성자 ID (사용자 인증이 필요한 경우)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 사용자 인증이 없는 경우를 위해 선택사항으로 설정
  }
}, {
  // 타임스탬프 자동 생성 (createdAt, updatedAt)
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 마감일까지 남은 일수
todoSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// 가상 필드: 마감일 상태
todoSchema.virtual('dueStatus').get(function() {
  if (!this.dueDate) return 'no-due-date';
  const now = new Date();
  const due = new Date(this.dueDate);
  
  if (this.completed) return 'completed';
  if (due < now) return 'overdue';
  if (due <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) return 'due-today';
  if (due <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'due-soon';
  return 'not-due';
});

// 인덱스 설정 (검색 성능 향상)
todoSchema.index({ title: 'text', description: 'text' }); // 텍스트 검색용
todoSchema.index({ completed: 1, priority: -1 }); // 완료 상태와 우선순위로 정렬
todoSchema.index({ dueDate: 1 }); // 마감일로 정렬
todoSchema.index({ createdBy: 1 }); // 사용자별 조회
todoSchema.index({ category: 1 }); // 카테고리별 조회
todoSchema.index({ tags: 1 }); // 태그별 조회

// 미들웨어: 저장 전 실행
todoSchema.pre('save', function(next) {
  // 태그 배열에서 빈 문자열 제거
  if (this.tags) {
    this.tags = this.tags.filter(tag => tag.trim() !== '');
  }
  next();
});

// 정적 메서드: 완료된 할 일 조회
todoSchema.statics.findCompleted = function() {
  return this.find({ completed: true });
};

// 정적 메서드: 미완료 할 일 조회
todoSchema.statics.findPending = function() {
  return this.find({ completed: false });
};

// 정적 메서드: 마감일이 임박한 할 일 조회
todoSchema.statics.findDueSoon = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    completed: false,
    dueDate: { $lte: futureDate, $gte: new Date() }
  });
};

// 정적 메서드: 우선순위별 할 일 조회
todoSchema.statics.findByPriority = function(priority) {
  return this.find({ priority: priority });
};

// 인스턴스 메서드: 할 일 완료 처리
todoSchema.methods.markComplete = function() {
  this.completed = true;
  return this.save();
};

// 인스턴스 메서드: 할 일 미완료 처리
todoSchema.methods.markIncomplete = function() {
  this.completed = false;
  return this.save();
};

// 인스턴스 메서드: 우선순위 변경
todoSchema.methods.setPriority = function(priority) {
  if (['low', 'medium', 'high'].includes(priority)) {
    this.priority = priority;
    return this.save();
  }
  throw new Error('유효하지 않은 우선순위입니다.');
};

// 모델 생성 및 내보내기
const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
