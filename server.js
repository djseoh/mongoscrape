var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
const expHbars = require('express-handlebars');
var path = require('path');
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware


app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set('views', path.join(__dirname, 'views'));
app.engine("handlebars", expHbars({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoscraper");

// Routes


app.get("/scrape", function(req, res) {

  axios.get("https://www.npr.org/sections/news/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("div" , "#jpvx17-0-Box-cwadsP dCWSJp").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("h3")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

     
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          return res.json(err);
        });
    });

    res.send("Scrape Complete");
  });
});

app.get("/articles", function(req, res) {

  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    })
});

app.get("/articles/:id", function(req, res) {

  db.Article.find(req.params.id)
  .populate('notes')
  .then(function(dbArticle){
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  })
});

app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbNote) {
      return db.User.findOneAndUpdate({}, {$push: { notes: dbNote._id}}, {new: true});
    })
      .then(function(dbArticle) {
        res.json(dbArticle);
      })
      .catch(function(err) {
        res.json.err;
      });
  });


app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
  