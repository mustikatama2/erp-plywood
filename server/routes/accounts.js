module.exports = require("./_crud")("accounts", { searchCols: ["code","name","type"], defaultSort: "code ASC" });
