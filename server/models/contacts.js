const { sq } = require("../dbConfig");
const { DataTypes } = require("sequelize");

const Contact = sq.define(
  "contacts",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    linkedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedPrecedence: {
      type: DataTypes.ENUM,
      values: ["primary", "secondary"],
      defaultValue: "primary",
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

(async () => {
    await Contact.sync({ alter: true });
    console.log('Model synced with the database');
  })();

module.exports = Contact;
