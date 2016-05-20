const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/signup', function(req, res, next) {
  const errors = []

  if (!req.body.email || !req.body.email.trim()) errors.push("Email can't be blank");
  if (!req.body.name || !req.body.name.trim()) errors.push("Name can't be blank");
  if (!req.body.password || !req.body.password.trim()) errors.push("Password can't be blank");

  if (errors.length) {
    console.log(errors);
    res.status(422).json({
      errors: errors
    })
  } else {

    knex('users')
      .whereRaw('lower(email) = ?', req.body.email.toLowerCase())
      .count()
      .first()
      .then(function (result) {
         if (result.count === "0") {
           const saltRounds = 4;
           const passwordHash = bcrypt.hashSync(req.body.password, saltRounds);

           var data = {
             name: req.body.name,
             email: req.body.email,
             password: passwordHash,
           }

           knex('users').insert(data)
             .returning('*')
             .then(function (users) {
               const user = users[0];
               const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET );
               res.json({
                 id: user.id,
                 name: user.name,
                 email: user.email,
                 token: token
               })
             })

         } else {
           console.log("Email has already been taken");
          res.status(422).json({
            errors: ["Email has already been taken"]
          })
        }
      })
  }
});

module.exports = router;
