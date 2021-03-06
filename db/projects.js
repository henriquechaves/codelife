module.exports = function(sequelize, db) {

  return sequelize.define("projects",
    {
      id: {
        type: db.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: db.TEXT,
      studentcontent: db.TEXT,
      uid: db.TEXT,
      datemodified: db.DATE
    }, 
    {
      freezeTableName: true,
      timestamps: false
    }
  );

};
