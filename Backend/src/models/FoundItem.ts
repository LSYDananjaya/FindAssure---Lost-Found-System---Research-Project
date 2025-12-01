import mongoose, { Schema, Document, Types } from 'mongoose';

export type FoundItemStatus = 'available' | 'pending_verification' | 'claimed';

export interface IFounderContact {
  name: string;
  email: string;
  phone: string;
}

export interface IFoundItem extends Document {
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  founderAnswers: string[];
  founderContact: IFounderContact;
  location: string;
  status: FoundItemStatus;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const founderContactSchema = new Schema<IFounderContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const foundItemSchema = new Schema<IFoundItem>(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    questions: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one question is required',
      },
    },
    founderAnswers: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length === (this as any).questions.length;
        },
        message: 'Number of answers must match number of questions',
      },
    },
    founderContact: {
      type: founderContactSchema,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'pending_verification', 'claimed'],
      default: 'available',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
foundItemSchema.index({ category: 1, status: 1 });
foundItemSchema.index({ createdAt: -1 });

export const FoundItem = mongoose.model<IFoundItem>('FoundItem', foundItemSchema);
