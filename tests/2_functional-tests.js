/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

let threadToDelete;
let threadToKeep;
let replyToDelete;

suite("Functional Tests", function() {
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Posting threads to board", function(done) {
        chai
          .request(server)
          .post("/api/threads/testingBoard")
          .send({ text: "Are we there yet?", delete_password: "delete" })
          .end((err, res) => {
            assert.equal(res.status, 200);
          });
        chai
          .request(server)
          .post("/api/threads/testingBoard")
          .send({
            text: "We are going to delete this post",
            delete_password: "delete"
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
          });
      });
    });

    suite("GET", function() {
      test("Test GET /api/thread/:board", function(done) {
        chai
          .request(server)
          .get("/api/threads/testingBoard")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "_id");
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "bumped_on");
            assert.property(res.body[0], "replies");
            assert.isArray(res.body[0].replies);
            
            threadToDelete = res.body[0]._id;
            threadToKeep = res.body[1]._id;
            
            
            done();
          });
      });
    });

    suite("DELETE", function() {
      
      test("Test DELETE /api/thread/:board with invalid thread id", function(done) {
        chai.request(server)
          .delete('/api/threads/testingBoard')
          .send({thread_id: '5dd49ccd24895f6a936d7285', delete_password: 'delete'})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'unable to find thread with thread_id 5dd49ccd24895f6a936d7285 in testingBoard');
            done();
        })
      });
      
      test("Test DELETE /api/thread/:board with valid thread id and invalid password", function(done) {
        chai.request(server)
          .delete('/api/threads/testingBoard')
          .send({thread_id: threadToDelete, delete_password: 'openSesame'})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
        })
      })
      
      test("Test DELETE /api/thread/:board with valid thread id and valid password", function(done) {
        chai.request(server)
          .delete('/api/threads/testingBoard')
          .send({thread_id: threadToDelete, delete_password: 'delete'})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        })
      })
      
    });

    suite("PUT", function() {
      
      test("Test PUT /api/threads/:board with invalid thread id", function(done) {
        chai.request(server)
        .put('/api/threads/testingBoard')
        .send({thread_id: '5dd49ccd24895f6a936d7285'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'invalid thread id');
          done();
        })
      })
      
      test("Test PUT /api/threads/:board with valid thread id", function(done) {
        chai.request(server)
        .put('/api/threads/testingBoard')
        .send({thread_id: threadToKeep})
        .end((err, res) => {
          console.log(threadToKeep)
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        })
      })
      
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {});

    suite("GET", function() {});

    suite("PUT", function() {});

    suite("DELETE", function() {});
  });
});
