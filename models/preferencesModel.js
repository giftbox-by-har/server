const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    products: [
      {
        product_id: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        selectedVariant: {
          type: String,
        },
      },
    ],
  },
);

const Preferences = mongoose.model("Preferences", preferencesSchema);

module.exports = Preferences;
