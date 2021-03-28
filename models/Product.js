const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema(
  {
    writer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      maxlength: 50,
    },
    descriptionTitle: {
      type: String,
    },
    description: {
      type: String,
    },
    size: {
      type: [Number],
      default: [],
    },
    amountOfS: {
      type: Number,
      default: 0,
    },
    amountOfM: {
      type: Number,
      default: 0,
    },
    amountOfL: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
      default: [],
    },
    category: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      maxlength: 100,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    id: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index(
  {
    title: "text",
    descriptionTitle: "text",
    description: "text",
  },
  {
    weights: {
      title: 5,
      descriptionTitle: 2,
      description: 1,
    },
  }
);

const ManProduct = mongoose.model("ManProduct", productSchema);
const WomanProduct = mongoose.model("WomanProduct", productSchema);
const KidProduct = mongoose.model("KidProduct", productSchema);

module.exports = { ManProduct, WomanProduct, KidProduct };
