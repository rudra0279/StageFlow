// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MemoryUser } = require('./inMemoryStore');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['organizer', 'anchor', 'admin'],
      default: 'organizer',
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);

const UserProxy = new Proxy(MongooseUser, {
  get(target, prop) {
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_DB === 'true' || mongoose.connection.readyState === 0) {
      if (prop in MemoryUser) {
        return MemoryUser[prop];
      }
    }
    return target[prop];
  }
});

module.exports = UserProxy;
