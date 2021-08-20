[REPO OF CODE FROM THIS LESSON HERE AS A TEMPLATE](https://github.com/AlexMercedCoder/Express-Mongo-Auth-Template)

This article is a walkthrough to creating a basic level of authentication with Express, Mongo and JSON Web Token. You can add more layers of complexity if you wish (user roles, refresh tokens, etc.).

## Step 1 - Create the Application

- create new folder

- create a `server.js file`

- create a new npm project `npm init -y`

- install dependencies `npm install express jsonwebtoken bcryptjs morgan dotenv mercedlogger mongoose cors`

#### Overview of dependencies

- express: the web framework

- jsonwebtoken: library for signing/creating and verifying/validating JSON Web Tokens (JWT), often pronounced 'JOT' for some reason.

- bcryptjs: library for hashing strings like password and then comparing the hash to strings for validation.

- morgan: library for logs that can be helpful for debugging

- dotenv: library to allow for use of .env files

- mercedlogger: A library I created for colorful logs

- mongoose: ODM for connecting and sending queries to a mongo database

- cors: adds cors headers so our frontend app can make requests

<hr>

- install dev dependencies `npm install --save-dev nodemon`

- add scripts to package.json

```json
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
```

- create a .gitignore file

```
/node_modules
.env
```

- create a .env file

```
PORT=4000
DATABASE_URL=mongodb://localhost:27017/practicedb
SECRET="gouda2021"
```
* Note that the database url is assuming a local mongo database, if you don't have a local mongo database replace with url with a database hosted at mongodb.com. The secret key can be literally anything.

## Step 2 - Setup the Server

Just a basic express server setup

```js
require("dotenv").config() // load .env variables
const express = require("express") // import express
const morgan = require("morgan") //import morgan
const {log} = require("mercedlogger") // import mercedlogger's log function
const cors = require("cors") // import cors

//DESTRUCTURE ENV VARIABLES WITH DEFAULT VALUES
const {PORT = 3000} = process.env

// Create Application Object
const app = express()

// GLOBAL MIDDLEWARE
app.use(cors()) // add cors headers
app.use(morgan("tiny")) // log the request for debugging
app.use(express.json()) // parse json bodies


// ROUTES AND ROUTES
app.get("/", (req, res) => {
    res.send("this is the test route to make sure server is working")
})

// APP LISTENER
app.listen(PORT, () => log.green("SERVER STATUS", `Listening on port ${PORT}`))
```

- then run `npm run dev` and go to localhost:4000 and see if you get test message

## Step 3 - Connect to Mongo Database

- create a "db" folder and in that folder create a connection.js file with the following:

```js
require("dotenv").config() // load .env variables
const mongoose = require("mongoose") //import fresh mongoose object
const {log} = require("mercedlogger") // import merced logger

//DESTRUCTURE ENV VARIABLES
const {DATABASE_URL} = process.env 

// CONNECT TO MONGO
mongoose.connect = mongoose.connect(DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true})

// CONNECTION EVENTS
mongoose.connection
.on("open", () => log.green("DATABASE STATE", "Connection Open"))
.on("close", () => log.magenta("DATABASE STATE", "Connection Open"))
.on("error", (error) => log.red("DATABASE STATE", error))

// EXPORT CONNECTION
module.exports = mongoose
```

## Step 4 - Create Our Models

- We will create a user model which has the obligatory username and password
- We will create a todos model with a username property to track which user it belongs to

- create a models folder with a User.js and Todo.js with the following

User.js
```js
const {Schema, model} = require("../db/connection") // import Schema & model

// User Schema
const UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

// User model
const User = model("User", UserSchema)

module.exports = User
```

Todo.js
```js
const {Schema, model} = require("../db/connection") // import Schema & model

// User Schema
const TodoSchema = new Schema({
    username: {type: String, required: true},
    reminder: {type: String, required: true},
    completed: {type: Boolean, required: true, default: false}
})

// User model
const Todo = model("Todo", TodoSchema)

module.exports = Todo
```

## Step 5 - Create the User Controller

This controller will handle:

- "/signup" receive data, hash password, create a new user

- "/login" receive data, check if user exists, check if password is correct, generate token and send it in response

Create a folder called controllers and in that folder create a User.js with the following:

```js
require("dotenv").config(); // load .env variables
const { Router } = require("express"); // import router from express
const User = require("../models/User"); // import user model
const bcrypt = require("bcryptjs"); // import bcrypt to hash passwords
const jwt = require("jsonwebtoken"); // import jwt to sign tokens

const router = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { SECRET = "secret" } = process.env;

// Signup route to create a new user
router.post("/signup", async (req, res) => {
  try {
    // hash the password
    req.body.password = await bcrypt.hash(req.body.password, 10);
    // create a new user
    const user = await User.create(req.body);
    // send new user as response
    res.json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Login route to verify a user and get a token
router.post("/login", async (req, res) => {
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      //check if password matches
      const result = await bcrypt.compare(req.body.password, user.password);
      if (result) {
        // sign token and send it in response
        const token = await jwt.sign({ username: user.username }, SECRET);
        res.json({ token });
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router
```

## Step 6 - Connect the Router to server.js

Let's wire the router to server.js at which point we should be able to test signing up and logging in with tools like postman or insomnia by making post requests to...

- /user/signup
- /user/login

server.js

```js
require("dotenv").config() // load .env variables
const express = require("express") // import express
const morgan = require("morgan") //import morgan
const {log} = require("mercedlogger") // import mercedlogger's log function
const cors = require("cors") // import cors
const UserRouter = require("./controllers/User") //import User Routes

//DESTRUCTURE ENV VARIABLES WITH DEFAULT VALUES
const {PORT = 3000} = process.env

// Create Application Object
const app = express()

// GLOBAL MIDDLEWARE
app.use(cors()) // add cors headers
app.use(morgan("tiny")) // log the request for debugging
app.use(express.json()) // parse json bodies


// ROUTES AND ROUTES
app.get("/", (req, res) => {
    res.send("this is the test route to make sure server is working")
})
app.use("/user", UserRouter) // send all "/user" requests to UserRouter for routing

// APP LISTENER
app.listen(PORT, () => log.green("SERVER STATUS", `Listening on port ${PORT}`))
```

using the following request body:

```json
{
        "username":"testuser",
        "password":"testpassword"
}
```

- make a post request to /user/signup should get back the newly created user

- make a post request to /user/login should get back the auth token

## Step 7 - Create Auth Middleware

So now the frontend can login and receive the token, the convention expectation is in the requests to protected resources they'll send that token in a like so.

```json
{
        "authorization":"bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNoZWVzZSJ9.3qukDmoGqQDTfNcjvpGTWXpb18xyQCyPGcC2ORt3iIc"
}
```

This is referred to as "bearer form", it's not the only way to deliver token but a typical way. Notice the JWT token has three sections separate by a "."

- Part 1 - The Header, this encodes information about the token such as how its encrypted and type of token, for the token above the following is encoded:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- Part 2 -  The Payload, this is the data you are storing in the token:

```json
{"username":"cheese"}
```

- Part 3 - The Signature, this has the secret key, the secret key used sign/create the token must be the same as the one used to verify/decode the token. Generally you want the signature to be something very unique to your app so its clear verified token must've been generated by your application since no one else should know your secret key to encode their own tokens.

So our middleware which will be used as a route or router level middleware (not global) will:

- check if the token exists
- if not, reject the request
- verify the token (decode it if secret key matches)
- if not reject the request
- store the decoded payload in the request object to used by downstream middleware or route handlers.

in the controllers folder create a file called middleware.js with the following:

```js
require("dotenv").config(); // loading env variables
const jwt = require("jsonwebtoken");

// MIDDLEWARE FOR AUTHORIZATION (MAKING SURE THEY ARE LOGGED IN)
const isLoggedIn = async (req, res, next) => {
  try {
    // check if auth header exists
    if (req.headers.authorization) {
      // parse token from header
      const token = req.headers.authorization.split(" ")[1]; //split the header and get the token
      if (token) {
        const payload = await jwt.verify(token, process.env.SECRET);
        if (payload) {
          // store user data in request object
          req.user = payload;
          next();
        } else {
          res.status(400).json({ error: "token verification failed" });
        }
      } else {
        res.status(400).json({ error: "malformed auth header" });
      }
    } else {
      res.status(400).json({ error: "No authorization header" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
};

// export custom middleware
module.exports = {
  isLoggedIn,
};
```

## Step 8 - The Todo Controller

The Todo controller will make sure only logged in users can create/read/update/delete their todos, this will rely on username being stored in the token so only the logged in user resources will accessed. We will add the custom middleware as a route level middleware only on routes we want to protect.

in controllers create a Todo.js with the following:

```js
const { Router } = require("express"); // import Router from express
const Todo = require("../models/Todo"); // import Todo model
const { isLoggedIn } = require("./middleware"); // import isLoggedIn custom middleware

const router = Router();

//custom middleware could also be set at the router level like so
// router.use(isLoggedIn) then all routes in this router would be protected

// Index Route with isLoggedIn middleware
router.get("/", isLoggedIn, async (req, res) => {
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  //send all todos with that user
  res.json(
    await Todo.find({ username }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// Show Route with isLoggedIn middleware
router.get("/:id", isLoggedIn, async (req, res) => {
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  const _id = req.params.id; // get id from params
  //send target todo
  res.json(
    await Todo.findOne({ username, _id }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// create Route with isLoggedIn middleware
router.post("/", isLoggedIn, async (req, res) => {
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  req.body.username = username; // add username property to req.body
  //create new todo and send it in response
  res.json(
    await Todo.create(req.body).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// update Route with isLoggedIn middleware
router.put("/:id", isLoggedIn, async (req, res) => {
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  req.body.username = username; // add username property to req.body
  const _id = req.params.id;
  //update todo with same id if belongs to logged in User
  res.json(
    await Todo.updateOne({ username, _id }, req.body, { new: true }).catch(
      (error) => res.status(400).json({ error })
    )
  );
});

// update Route with isLoggedIn middleware
router.delete("/:id", isLoggedIn, async (req, res) => {
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  const _id = req.params.id;
  //remove todo with same id if belongs to logged in User
  res.json(
    await Todo.remove({ username, _id }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

module.exports = router
```

## Step 9 - connect todo router to server.js

server.js

```js
require("dotenv").config() // load .env variables
const express = require("express") // import express
const morgan = require("morgan") //import morgan
const {log} = require("mercedlogger") // import mercedlogger's log function
const cors = require("cors") // import cors
const UserRouter = require("./controllers/User") //import User Routes
const TodoRouter = require("./controllers/Todo") // import Todo Routes

//DESTRUCTURE ENV VARIABLES WITH DEFAULT VALUES
const {PORT = 3000} = process.env

// Create Application Object
const app = express()

// GLOBAL MIDDLEWARE
app.use(cors()) // add cors headers
app.use(morgan("tiny")) // log the request for debugging
app.use(express.json()) // parse json bodies


// ROUTES AND ROUTES
app.get("/", (req, res) => {
    res.send("this is the test route to make sure server is working")
})
app.use("/user", UserRouter) // send all "/user" requests to UserRouter for routing
app.use("/todos", TodoRouter) // send all "/todos" request to TodoROuter

// APP LISTENER
app.listen(PORT, () => log.green("SERVER STATUS", `Listening on port ${PORT}`))
```

- using postman or insomnia hit the /user/login route to get your token
- add a header to your headers `"authorization": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNoZWVzZSJ9.3qukDmoGqQDTfNcjvpGTWXpb18xyQCyPGcC2ORt3iIc" ` make sure that your token and the word bearer has a single space between them.

- now make requests to all the "/todos" route with and without the header to see what happens when you forget the header

The API is now complete, now you just need to build a ui that uses all these routes. Essentially the flow of your frontend app regardless of what framework you use or no framework:

- signup screen to signup
- login screent to login
- after logging in the returned token is saved in state somewhere
- the token is included in the headers of all requests to protected routes

## BONUS - Context Middleware

Another great use of middleware is creating a context property and request which can be used to pass any info you available to all routes, like your models.

update your middleware.js

```js
require("dotenv").config(); // loading env variables
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Todo = require("../models/Todo");

// CREATE CONTEXT MIDDLEWARE
const createContext = (req, res, next) => {
  // put any data you want in the object below to be accessible to all routes
  req.context = {
    models: {
      User,
      Todo,
    },
  };
  next();
};

// MIDDLEWARE FOR AUTHORIZATION (MAKING SURE THEY ARE LOGGED IN)
const isLoggedIn = async (req, res, next) => {
  try {
    // check if auth header exists
    if (req.headers.authorization) {
      // parse token from header
      const token = req.headers.authorization.split(" ")[1]; //split the header and get the token
      if (token) {
        const payload = await jwt.verify(token, process.env.SECRET);
        if (payload) {
          // store user data in request object
          req.user = payload;
          next();
        } else {
          res.status(400).json({ error: "token verification failed" });
        }
      } else {
        res.status(400).json({ error: "malformed auth header" });
      }
    } else {
      res.status(400).json({ error: "No authorization header" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
};

// export custom middleware
module.exports = {
  isLoggedIn,
  createContext
};
```

connect the middleware in server.js

```js
require("dotenv").config() // load .env variables
const express = require("express") // import express
const morgan = require("morgan") //import morgan
const {log} = require("mercedlogger") // import mercedlogger's log function
const cors = require("cors") // import cors
const UserRouter = require("./controllers/User") //import User Routes
const TodoRouter = require("./controllers/Todo") // import Todo Routes
const {createContext} = require("./controllers/middleware")

//DESTRUCTURE ENV VARIABLES WITH DEFAULT VALUES
const {PORT = 3000} = process.env

// Create Application Object
const app = express()

// GLOBAL MIDDLEWARE
app.use(cors()) // add cors headers
app.use(morgan("tiny")) // log the request for debugging
app.use(express.json()) // parse json bodies
app.use(createContext) // create req.context


// ROUTES AND ROUTES
app.get("/", (req, res) => {
    res.send("this is the test route to make sure server is working")
})
app.use("/user", UserRouter) // send all "/user" requests to UserRouter for routing
app.use("/todos", TodoRouter) // send all "/todos" request to TodoROuter

// APP LISTENER
app.listen(PORT, () => log.green("SERVER STATUS", `Listening on port ${PORT}`))
```

Now we don't have to import our models to our controllers cause the models are stored in the request object and can be refactored like so:

User.js

```js
require("dotenv").config(); // load .env variables
const { Router } = require("express"); // import router from express
const bcrypt = require("bcryptjs"); // import bcrypt to hash passwords
const jwt = require("jsonwebtoken"); // import jwt to sign tokens

const router = Router(); // create router to create route bundle

//DESTRUCTURE ENV VARIABLES WITH DEFAULTS
const { SECRET = "secret" } = process.env;

// Signup route to create a new user
router.post("/signup", async (req, res) => {
  const { User } = req.context.models;
  try {
    // hash the password
    req.body.password = await bcrypt.hash(req.body.password, 10);
    // create a new user
    const user = await User.create(req.body);
    // send new user as response
    res.json(user);
  } catch (error) {
    res.status(400).json({ error });
  }
});

// Login route to verify a user and get a token
router.post("/login", async (req, res) => {
  const { User } = req.context.models;
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      //check if password matches
      const result = await bcrypt.compare(req.body.password, user.password);
      if (result) {
        // sign token and send it in response
        const token = await jwt.sign({ username: user.username }, SECRET);
        res.json({ token });
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router;
```

Todo.js
```js
const { Router } = require("express"); // import Router from express
const { isLoggedIn } = require("./middleware"); // import isLoggedIn custom middleware

const router = Router();

//custom middleware could also be set at the router level like so
// router.use(isLoggedIn) then all routes in this router would be protected

// Index Route with isLoggedIn middleware
router.get("/", isLoggedIn, async (req, res) => {
  const { Todo } = req.context.models;
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  //send all todos with that user
  res.json(
    await Todo.find({ username }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// Show Route with isLoggedIn middleware
router.get("/:id", isLoggedIn, async (req, res) => {
  const { Todo } = req.context.models;
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  const _id = req.params.id; // get id from params
  //send target todo
  res.json(
    await Todo.findOne({ username, _id }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// create Route with isLoggedIn middleware
router.post("/", isLoggedIn, async (req, res) => {
  const { Todo } = req.context.models;
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  req.body.username = username; // add username property to req.body
  //create new todo and send it in response
  res.json(
    await Todo.create(req.body).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

// update Route with isLoggedIn middleware
router.put("/:id", isLoggedIn, async (req, res) => {
  const { Todo } = req.context.models;
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  req.body.username = username; // add username property to req.body
  const _id = req.params.id;
  //update todo with same id if belongs to logged in User
  res.json(
    await Todo.updateOne({ username, _id }, req.body, { new: true }).catch(
      (error) => res.status(400).json({ error })
    )
  );
});

// update Route with isLoggedIn middleware
router.delete("/:id", isLoggedIn, async (req, res) => {
  const { Todo } = req.context.models;
  const { username } = req.user; // get username from req.user property created by isLoggedIn middleware
  const _id = req.params.id;
  //remove todo with same id if belongs to logged in User
  res.json(
    await Todo.remove({ username, _id }).catch((error) =>
      res.status(400).json({ error })
    )
  );
});

module.exports = router;
```

## Conclusion

The above gives you the general pattern for implementing authentication in any web framework, feel free to customize it to your needs such adding user roles and more!