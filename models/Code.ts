import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CodeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    author: { type: String, required: true, trim: true },
  },
  {
    collection: "codes",
    timestamps: true,
  },
);

export type CodeDocument = InferSchemaType<typeof CodeSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Code: Model<CodeDocument> =
  (mongoose.models.Code as Model<CodeDocument>) ||
  mongoose.model<CodeDocument>("Code", CodeSchema);

export default Code;
