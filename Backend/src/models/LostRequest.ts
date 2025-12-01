import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILostRequest extends Document {
  ownerId: Types.ObjectId;
  category: string;
  description: string;
  location: string;
  confidenceLevel: number;
  matchedFoundItemIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const lostRequestSchema = new Schema<ILostRequest>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    location: {
      type: String,
      required: true,
      trim: true,
    },
    confidenceLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    matchedFoundItemIds: {
      type: [Schema.Types.ObjectId],
      ref: 'FoundItem',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by owner
lostRequestSchema.index({ ownerId: 1, createdAt: -1 });

export const LostRequest = mongoose.model<ILostRequest>('LostRequest', lostRequestSchema);
