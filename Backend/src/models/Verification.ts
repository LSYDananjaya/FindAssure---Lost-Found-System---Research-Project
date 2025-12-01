import mongoose, { Schema, Document, Types } from 'mongoose';

export type VerificationStatus = 'pending' | 'passed' | 'failed';

export interface IOwnerVideoAnswer {
  question: string;
  videoUrl: string;
}

export interface IVerification extends Document {
  foundItemId: Types.ObjectId;
  ownerId: Types.ObjectId;
  questions: string[];
  founderAnswers: string[];
  ownerVideoAnswers: IOwnerVideoAnswer[];
  status: VerificationStatus;
  similarityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const ownerVideoAnswerSchema = new Schema<IOwnerVideoAnswer>(
  {
    question: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const verificationSchema = new Schema<IVerification>(
  {
    foundItemId: {
      type: Schema.Types.ObjectId,
      ref: 'FoundItem',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questions: {
      type: [String],
      required: true,
    },
    founderAnswers: {
      type: [String],
      required: true,
    },
    ownerVideoAnswers: {
      type: [ownerVideoAnswerSchema],
      required: true,
      validate: {
        validator: function (v: IOwnerVideoAnswer[]) {
          return v.length === (this as any).questions.length;
        },
        message: 'Number of video answers must match number of questions',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending',
    },
    similarityScore: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
verificationSchema.index({ foundItemId: 1, ownerId: 1 });
verificationSchema.index({ status: 1, createdAt: -1 });

export const Verification = mongoose.model<IVerification>('Verification', verificationSchema);
