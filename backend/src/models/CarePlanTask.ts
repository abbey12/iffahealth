import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CarePlanTaskAttributes {
  id: string;
  postDischargeCareId: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  category: 'medication' | 'exercise' | 'diet' | 'appointment' | 'other';
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarePlanTaskCreationAttributes extends Optional<CarePlanTaskAttributes, 'id' | 'createdAt' | 'updatedAt' | 'status'> {}

export class CarePlanTask extends Model<CarePlanTaskAttributes, CarePlanTaskCreationAttributes> implements CarePlanTaskAttributes {
  public id!: string;
  public postDischargeCareId!: string;
  public title!: string;
  public description!: string;
  public dueDate!: Date;
  public status!: 'pending' | 'completed' | 'overdue';
  public priority!: 'high' | 'medium' | 'low';
  public category!: 'medication' | 'exercise' | 'diet' | 'appointment' | 'other';
  public completedAt?: Date;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CarePlanTask.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    postDischargeCareId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'post_discharge_care',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'overdue'),
      allowNull: false,
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      allowNull: false,
      defaultValue: 'medium',
    },
    category: {
      type: DataTypes.ENUM('medication', 'exercise', 'diet', 'appointment', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
    modelName: 'CarePlanTask',
    tableName: 'care_plan_tasks',
    timestamps: true,
    hooks: {
      beforeUpdate: (task: CarePlanTask) => {
        if (task.changed('status') && task.status === 'completed') {
          task.completedAt = new Date();
        }
      },
    },
  }
);

export default CarePlanTask;
