module.exports = function(app) {

  const {db} = app.settings;

  app.get("/api/snippets", (req, res) => {

    db.snippets.findAll({where: {uid: req.user.id}}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/bylid", (req, res) => {

    db.snippets.findAll({where: {uid: req.user.id, lid: req.query.lid}}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/byid", (req, res) => {

    db.snippets.findAll({where: {uid: req.user.id, id: req.query.id}}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/byuser", (req, res) => {

    const id = req.query.uid;
    const q = "SELECT snippets.id, snippets.snippetname, snippets.studentcontent, (select count(*) FROM likes where likes.likeid = snippets.id) AS likes, snippets.previewblob, snippets.lid, snippets.uid, users.username FROM snippets, users WHERE users.id = snippets.uid AND users.id = '" + id + "'";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/byUsernameAndFilename", (req, res) => {

    const q = "select snippets.id, snippets.snippetname, snippets.studentcontent, snippets.likes, snippets.previewblob, snippets.lid, snippets.uid from snippets, users where snippets.uid = users.id AND snippets.snippetname = '" + req.query.filename + "' AND users.username = '" + req.query.username + "'";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

  // todo: maybe change these into a single "upsert"

  app.post("/api/snippets/update", (req, res) => {

    db.snippets.update({studentcontent: req.body.studentcontent, snippetname: req.body.name}, {where: {uid: req.body.uid, lid: req.body.lid}})
      .then(u => res.json(u).end());

  });

  app.post("/api/snippets/new", (req, res) => {

    db.snippets.create({studentcontent: req.body.studentcontent, snippetname: req.body.name, uid: req.body.uid, lid: req.body.lid})
      .then(u => res.json(u).end());

  });

  app.get("/api/snippets/othersbylid", (req, res) => {

    const q = "SELECT * FROM snippets, users WHERE users.id = snippets.uid AND users.id != '" + req.user.id + "' AND snippets.lid = '" + req.query.lid + "'";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

    // db.snippets.findAll({where: {uid: {$not: req.user.id}, lid: req.query.lid}}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/allbylid", (req, res) => {

    const q = "SELECT snippets.id, snippets.snippetname, snippets.studentcontent, (select count(*) FROM likes where likes.likeid = snippets.id) AS likes, snippets.previewblob, snippets.lid, snippets.uid, users.username FROM snippets, users WHERE users.id = snippets.uid AND snippets.lid = '" + req.query.lid + "'";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

    // db.snippets.findAll({where: {uid: {$not: req.user.id}, lid: req.query.lid}}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/allothers", (req, res) => {

    const q = "SELECT snippets.id, snippets.snippetname, snippets.studentcontent, (select count(*) FROM likes where likes.likeid = snippets.id) AS likes, snippets.previewblob, snippets.lid, snippets.uid, users.username FROM snippets, users WHERE users.id = snippets.uid AND users.id != '" + req.user.id + "'";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/all", (req, res) => {

    const q = "SELECT snippets.id, snippets.snippetname, snippets.studentcontent, (select count(*) FROM likes where likes.likeid = snippets.id) AS likes, snippets.previewblob, snippets.lid, snippets.uid, users.username FROM snippets, users WHERE users.id = snippets.uid";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/allgeos", (req, res) => {

    const q = "SELECT * FROM geos WHERE sumlevel = 'MUNICIPALITY' AND substring(id, 1, 3) = '4mg' ORDER BY name";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

  app.get("/api/snippets/allschools", (req, res) => {

    const q = "SELECT DISTINCT name FROM schools ORDER BY name";
    db.query(q, {type: db.QueryTypes.SELECT}).then(u => res.json(u).end());

  });

};
