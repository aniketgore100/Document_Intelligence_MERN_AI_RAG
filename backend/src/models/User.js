import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },


    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },


    role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
    }, 


    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },


    color: {
      type: String,
      default: () => {
        const colors = [
          '#e63946', '#2a9d8f', '#e9c46a', '#f4a261',
          '#264653', '#6d6875', '#457b9d', '#a8dadc',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
  },


  
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    color: this.color,
    roleName: this.roleName || " ",
  };
};

export default mongoose.model('User', userSchema);
