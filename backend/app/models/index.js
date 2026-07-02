import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Register models and associations per features/sprint-*.md

export default db;
