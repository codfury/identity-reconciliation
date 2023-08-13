const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  retry: {
    match: [
      Sequelize.ConnectionError,
      Sequelize.ConnectionTimedOutError,
      Sequelize.TimeoutError,
    ],
    max: 3, // Maximum retry 3 times
  },
});

const connectDb = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been successfully established.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = { sq: sequelize, connectDb };
