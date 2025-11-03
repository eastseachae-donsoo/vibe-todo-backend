const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 사용자 스키마 정의
const userSchema = new mongoose.Schema({
  // 사용자명 (필수, 고유)
  username: {
    type: String,
    required: [true, '사용자명은 필수입니다.'],
    unique: true,
    trim: true,
    minlength: [3, '사용자명은 최소 3자 이상이어야 합니다.'],
    maxlength: [30, '사용자명은 30자를 초과할 수 없습니다.'],
    match: [/^[a-zA-Z0-9_]+$/, '사용자명은 영문자, 숫자, 언더스코어만 사용할 수 있습니다.']
  },
  
  // 이메일 (필수, 고유)
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '유효한 이메일 주소를 입력해주세요.']
  },
  
  // 비밀번호 (필수)
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다.'],
    select: false // 기본적으로 조회 시 제외
  },
  
  // 이름 (선택사항)
  name: {
    type: String,
    trim: true,
    maxlength: [50, '이름은 50자를 초과할 수 없습니다.']
  },
  
  // 프로필 이미지 URL
  profileImage: {
    type: String,
    default: null
  },
  
  // 계정 활성화 상태
  isActive: {
    type: Boolean,
    default: true
  },
  
  // 이메일 인증 상태
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // 이메일 인증 토큰
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  // 비밀번호 재설정 토큰
  passwordResetToken: {
    type: String,
    select: false
  },
  
  // 비밀번호 재설정 토큰 만료 시간
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  // 마지막 로그인 시간
  lastLogin: {
    type: Date,
    default: null
  },
  
  // 사용자 설정
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'ko'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  // 타임스탬프 자동 생성
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 사용자의 할 일 개수
userSchema.virtual('todoCount', {
  ref: 'Todo',
  localField: '_id',
  foreignField: 'createdBy',
  count: true
});

// 가상 필드: 완료된 할 일 개수
userSchema.virtual('completedTodoCount', {
  ref: 'Todo',
  localField: '_id',
  foreignField: 'createdBy',
  count: true,
  match: { completed: true }
});

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// 미들웨어: 저장 전 비밀번호 해싱
userSchema.pre('save', async function(next) {
  // 비밀번호가 수정되지 않았다면 다음으로
  if (!this.isModified('password')) return next();
  
  try {
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 미들웨어: 저장 전 이메일 소문자 변환
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// 인스턴스 메서드: 비밀번호 확인
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 인스턴스 메서드: 사용자 정보 업데이트
userSchema.methods.updateProfile = function(updateData) {
  const allowedFields = ['name', 'profileImage', 'preferences'];
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      this[field] = updateData[field];
    }
  });
  return this.save();
};

// 인스턴스 메서드: 계정 비활성화
userSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// 인스턴스 메서드: 계정 활성화
userSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// 인스턴스 메서드: 마지막 로그인 시간 업데이트
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// 정적 메서드: 이메일로 사용자 찾기
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// 정적 메서드: 사용자명으로 사용자 찾기
userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username });
};

// 정적 메서드: 활성 사용자만 조회
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// 모델 생성 및 내보내기
const User = mongoose.model('User', userSchema);

module.exports = User;
