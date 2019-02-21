// //express
// express-handlebars
// mongoose .... not using
// cheerio
// axios

// Dependencies
// Initialize Express
var express = require("express");
var exphbs = require("express-handlebars")
var handlebars = require("handlebars")
var cheerio = require("cheerio");
var axios = require("axios");
var logger = require("morgan");
var mongojs = require("mongojs");

// Initialize Express
var app = express();

// Configure our app for morgan and body parsing with express.json and express.urlEncoded
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

//handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Mongojs configuration
var databaseUrl = "warmup";
var collections = ["Posts"];

// Hook our mongojs config to the db var
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Routes
// ======
app.get("/", function(req, res) {
    db.posts.find({}, function(error, found) {
        // Show any errors
        if (error) {
          console.log(error);
        }
        else {
          // Otherwise, send the Posts we found to the browser as a json
          res.render("index", {posts:found});
        }
        console.log(found)
      });
})


app.get("/scrape", function(req, res) {

  // Parses our HTML and helps us find elements
var cheerio = require("cheerio");
// Makes HTTP request for HTML page
var axios = require("axios");

// First, tell the console what server.js is doing
console.log("\n***********************************\n" +
            "Grabbing every thread name and link\n" +
            "from reddit's webdev board:" +
            "\n***********************************\n");

// Making a request via axios for reddit's "webdev" board. The page's HTML is passed as the callback's third argument
axios.get("https://old.reddit.com/r/webdev/").then(function(response) {

  // Load the HTML into cheerio and save it to a variable
  // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
  var $ = cheerio.load(response.data);

  // An empty array to save the data that we'll scrape
  var results = [];

  // With cheerio, find each p-tag with the "title" class
  // (i: iterator. element: the current element)
  $("p.title").each(function(i, element) {

    // Save the text of the element in a "title" variable
    var title = $(element).text();

    // In the currently selected element, look at its child elements (i.e., its a-tags),
    // then save the values for any "href" attributes that the child elements may have
    var link = $(element).children().attr("href");

    var summary = $(element).siblings(".tagline").text()

    var image = $(element).parent().parent().siblings(".thumbnail").children("img").attr("src")

    // Save these results in an object that we'll push into the results array we defined earlier
    // object we're pushing into mongo
    results.push({
      title: title,

      link: link,

      summary: summary,

      image:image
    });

    // save result object in a db
    db.posts.insert({
      title: title,
      link: link,
      summary: summary,
      image:image
     
    })
  });

  // Log the results once you've looped through each of the elements found with cheerio
  console.log(results);
  

});
})


// Post a Post to the mongoose database
app.post("/submit", function(req, res) {
  // Save the request body as an object called Post
  var Post = req.body;

  // If we want the object to have a boolean value of false,
  // we have to do it here, because the ajax post will convert it
  // to a string instead of a boolean
  Post.read = false;

  // Save the Post object as an entry into the Posts collection in mongo
  db.Posts.save(Post, function(error, saved) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send the response to the client (for AJAX success function)
      res.send(saved);
    }
  });
});

// Find all Posts marked as read
app.get("/read", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is true
  db.Posts.find({ read: true }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send the Posts we found to the browser as a json
      res.json(found);
    }
  });
});

// Find all Posts marked as unread
app.get("/unread", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is false
  db.Posts.find({ read: false }, function(error, found) {
    // Show any errors
    if (error) {
      console.log(error);
    }
    else {
      // Otherwise, send the Posts we found to the browser as a json
      res.json(found);
    }
  });
});

// Mark a Post as having been read
app.put("/markread/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))

  // Update a doc in the Posts collection with an ObjectId matching
  // the id parameter in the url
  db.Posts.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set "read" to true for the Post we specified
      $set: {
        read: true
      }
    },
    // When that's done, run this function
    function(error, edited) {
      // show any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the result of our update to the browser
        console.log(edited);
        res.send(edited);
      }
    }
  );
});

// Mark a Post as having been not read
app.put("/markunread/:id", function(req, res) {
  // Remember: when searching by an id, the id needs to be passed in
  // as (mongojs.ObjectId(IdYouWantToFind))

  // Update a doc in the Posts collection with an ObjectId matching
  // the id parameter in the url
  db.Posts.update(
    {
      _id: mongojs.ObjectId(req.params.id)
    },
    {
      // Set "read" to false for the Post we specified
      $set: {
        read: false
      }
    },
    // When that's done, run this function
    function(error, edited) {
      // Show any errors
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the result of our update to the browser
        console.log(edited);
        res.send(edited);
      }
    }
  );
});

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});

