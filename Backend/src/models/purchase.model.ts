import mongoose, { Schema } from "mongoose";
import productSchema from "./product.model.js";

const purchaseSchema = new mongoose.Schema(
  {
    products: [{
      type: productSchema,
      required: true,
    }],
    location :{
        type: [String,String],
        required: true
    },
    receipt: [{
        type: String,
        required: true,
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    total:{
        type: Number,
        required: true
    },
    tax:{
        type: Number,
        required: true
    }
  },
  { timestamps: true }
);

export default purchaseSchema;
