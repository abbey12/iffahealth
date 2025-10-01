import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  country: string;
  emergencyContact: string;
  emergencyPhone: string;
  bloodType?: string;
  allergies?: string[];
  medicalConditions?: string[];
  medications?: string[];
  isVerified: boolean;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public dateOfBirth!: Date;
  public gender!: 'male' | 'female' | 'other';
  public address!: string;
  public city!: string;
  public country!: string;
  public emergencyContact!: string;
  public emergencyPhone!: string;
  public bloodType?: string;
  public allergies?: string[];
  public medicalConditions?: string[];
  public medications?: string[];
  public isVerified!: boolean;
  public role!: 'patient' | 'doctor' | 'nurse' | 'admin';
  public profileImage?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public async hashPassword(): Promise<void> {
    this.password = await bcrypt.hash(this.password, 12);
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [10, 15],
      },
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Ghana',
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emergencyPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bloodType: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
      allowNull: true,
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    medicalConditions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    medications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'nurse', 'admin'),
      allowNull: false,
      defaultValue: 'patient',
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        await user.hashPassword();
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          await user.hashPassword();
        }
      },
    },
  }
);

export default User;
