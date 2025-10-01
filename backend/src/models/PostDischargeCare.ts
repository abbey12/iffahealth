import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PostDischargeCareAttributes {
  id: string;
  patientId: string;
  assignedNurseId: string;
  doctorId: string;
  dischargeDate: Date;
  diagnosis: string;
  treatment: string;
  medications: string[];
  careInstructions: string;
  followUpDate: Date;
  status: 'active' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface PostDischargeCareCreationAttributes extends Optional<PostDischargeCareAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

export class PostDischargeCare extends Model<PostDischargeCareAttributes, PostDischargeCareCreationAttributes> implements PostDischargeCareAttributes {
  public id!: string;
  public patientId!: string;
  public assignedNurseId!: string;
  public doctorId!: string;
  public dischargeDate!: Date;
  public diagnosis!: string;
  public treatment!: string;
  public medications!: string[];
  public careInstructions!: string;
  public followUpDate!: Date;
  public status!: 'active' | 'completed' | 'cancelled';
  public priority!: 'high' | 'medium' | 'low';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PostDischargeCare.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assignedNurseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    dischargeDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    treatment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    medications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    careInstructions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active',
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
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
    modelName: 'PostDischargeCare',
    tableName: 'post_discharge_care',
    timestamps: true,
  }
);

export default PostDischargeCare;
