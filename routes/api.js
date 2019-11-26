/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
let ObjectID = require("mongodb").ObjectID;

module.exports = function(app, db) {
  app
    .route("/api/threads/:board")

    .post((req, res) => {
      // req.body {board: 'string', text: 'string', delete_password: 'string'}
      // req.params {board: 'string'}
      let board = req.params.board;
      db.collection(board).insertOne(
        {
          text: req.body.text,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: [],
          delete_password: req.body.delete_password
        },
        (err, data) => {
          if (err) return err;
          res.redirect(`/b/${board}/`);
        }
      );
    })

    .get((req, res) => {
      // req.params = {board: 'string'}
      let board = req.params.board;
      
      db.collection(board)
        .find({})
        .sort({ bumped_on: -1 })
        .limit(10)
        .project({
          text: 1,
          created_on: 1,
          bumped_on: 1,
          "replies.text": 1,
          "replies.created_on": 1,
          replies: { $slice: 3 }
        })
        .toArray((err, data) => {
          // data == array of thread objects
          res.json(data);
        });
    })

    .delete((req, res) => {
      let board = req.params.board;
      db.collection(board).findOne(
        { _id: ObjectID(req.body.thread_id) },
        (err, data) => {
          if (data) {
            if (data.delete_password == req.body.delete_password) {
              db.collection(board).deleteOne(
                { _id: ObjectID(req.body.thread_id) },
                (err, data) => {
                  if (err) {
                    res.send(err);
                  }
                  res.send("success");
                }
              );
            } else {
              res.send("incorrect password");
            }
          } else {
            res.send(
              `unable to find thread with thread_id ${req.body.thread_id} in ${board}`
            );
          }
        }
      );
    })

    .put((req, res) => {
      console.log(req.body);
      if (req.body.board && req.body.thread_id) {
        db.collection(req.params.board).findOneAndUpdate(
          { _id: ObjectID(req.body.thread_id) },
          { $set: { reported: true } },
          (err, data) => {
            if (err) throw err;
            if (data.lastErrorObject.updatedExisting) {
              res.send("success");
            } else {
              res.send("invalid thread id");
            }
          }
        );
      }
    });

  app
    .route("/api/replies/:board")

    .post((req, res) => {
      let board = req.params.board;
      // req.body = {board: 'string', thread_id: 'string', text: 'string', delete_password: 'string'}
      // req.params = {board: 'string'}
      db.collection(board).findOneAndUpdate(
        {
          _id: ObjectID(req.body.thread_id)
        },
        {
          $push: {
            replies: {
              $each: [
                {
                  _id: new ObjectID(),
                  text: req.body.text,
                  created_on: new Date(),
                  reported: false,
                  delete_password: req.body.delete_password
                }
              ],
              $sort: { created_on: -1 }
            }
          },
          $set: { bumped_on: new Date() }
        },
        { returnOriginal: false },
        (err, data) => {
          if (err) return err;
          res.redirect(`/b/${board}/${req.body.thread_id}`);
        }
      );
    })

    .get((req, res) => {
      let board = req.params.board;

      if (req.query.thread_id) {
        db.collection(board)
          .find({ _id: ObjectID(req.query.thread_id) })
          .project({
            reported: 0,
            delete_password: 0,
            "replies.reported": 0,
            "replies.delete_password": 0
          })
          .toArray((err, data) => {
            console.log(data)
            res.json(data[0]);
          });
      } else {
        res.send("no id sent");
      }
    })

    .delete((req, res) => {
      let deletePermission = false;
      let board = req.params.board;
      db.collection(board).findOne(
        {
          $and: [
            { _id: ObjectID(req.body.thread_id) },
            { "replies._id": ObjectID(req.body.reply_id) }
          ]
        },
        (err, data) => {
          if (err) throw err;
          if (data) {
            for (let reply of data.replies) {
              if (
                reply._id == req.body.reply_id &&
                reply.delete_password == req.body.delete_password
              ) {
                deletePermission = true;
              }
            }
            if (deletePermission) {
              db.collection(board).updateOne(
                { _id: ObjectID(req.body.thread_id) },
                { $set: { "replies.$[elem].text": "[deleted]" } },
                {
                  arrayFilters: [
                    {
                      "elem._id": ObjectID(req.body.reply_id),
                      "elem.delete_password": req.body.delete_password
                    }
                  ]
                },
                (err, data) => {
                  if (err) throw err;
                  res.send("success");
                }
              );
            } else {
              res.send("incorrect password");
            }
          } else {
            res.send(
              `could not find reply ${req.body.reply_id} in thread ${req.body.thread_id}`
            );
          }
        }
      );
    })

    .put((req, res) => {
      let board = req.params.board;
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let password = req.body.delete_password;
      db.collection(board).findOneAndUpdate(
        {
          $and: [
            { _id: ObjectID(thread_id) },
            { "replies._id": ObjectID(reply_id) }
          ]
        },
        { $set: { "replies.$[elem].reported": true } },
        {
          arrayFilters: [{ "elem._id": ObjectID(reply_id) }]
        },
        (err, data) => {
          if (err) throw err;
          if (data.lastErrorObject.updatedExisting) {
            res.send('success');
          } else {
            res.send('invalid id(s)')
          }
        }
      );
    });
};
