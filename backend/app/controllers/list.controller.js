import db from "../models/index.js";
import logger from "../config/logger.js";

const exports = {};

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });

    return res.send(lists);
  } catch (err) {
    logger.error(`List findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Failed to fetch lists." });
  }
};

export default exports;
