
module.exports = function(app) {

  const {db} = app.settings;

  app.get("/api/userprogress/", (req, res) => {

    db.userprogress.findAll({where: {uid: req.user.id}}).then(u => res.json(u).end());

  });

  app.post("/api/userprogress/save", (req, res) => {
    const {id: uid} = req.user;
    const {level, gems} = req.body;

    db.userprogress.findOrCreate({where: {uid, level}})
      .then(userprogressRows => {
        if (userprogressRows.length) {
          const userprogressRow = userprogressRows[0];
          userprogressRow.gems = gems;
          userprogressRow.datecompleted = db.fn("NOW");
          return userprogressRow.save().then(() => res.json(userprogressRows).end());
        }
        else {
          return res.json({error: "Unable to update user progress."}).end();
        }
      });

  });

};
