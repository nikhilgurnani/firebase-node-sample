/*
@author: Ankur Jat (ankur@grappus.com)
@summary: Main Entry point of the project. Responsible to creating httpServer
  using express APP, import all routes and bind requests accordingly.
  First of all we try to set all environment variables asap and also set
  required middleware.
@NOTE: We are using nodeJS cluster module to get benefits from multicode CPU
*/

/*
-Dotenv is a zero-dependency module that loads environment variables from a .env
  file into process.env.
- Storing configuration in the environment separate from code.
- Install using 'npm install dotenv --save'
- As early as possible in your application, require and configure dotenv.
*/
require('dotenv').config();
let express = require('express');
let app = express();
let apps = require('./apps');
let parsers = require('./parsers');

app.use(apps.morgan('tiny'));


// Add headers
app.use(function (request, response, next) {
  // Website you wish to allow to connect
  let allowedOrigins = parsers.fourColonParser(process.env.ALLOWED_HOSTS);
  let origin = request.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    response.setHeader('Access-Control-Allow-Origin', origin);
  }

  // Request methods you wish to allow
  response.setHeader('Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD');

  // Request headers you wish to allow
  response.setHeader('Access-Control-Allow-Headers',
    'X-Requested-With, content-type, authorization, password, authentication, \
    dauthentication, deviceType');

  next();
});
app.disable('x-powered-by');


/*
Helmet helps us secure your Express apps by setting various HTTP headers.
*/
app.use(require('helmet')());


let bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


/*
- Define the base route.
- Set the base routes to /api/ path
*/
// app.use(process.env.API_VERSION, require('./routes/routeBase'));


/*
- Node JS Application listen at port 3000
- We are using Cluster module of node
*/
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (process.env.NODE_ENV === 'test') {
  app.listen(process.env.NODE_SERVER_PORT, function(){
    console.log('info', {
      info: `Server is running at port ${process.env.NODE_SERVER_PORT}`,
      action: 'server-setup'
    });
  });
} else {
  if (cluster.isMaster) {
    console.log('info', {
      info: `Master ${process.pid} is running`,
      action: 'server-setup'
    });

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log('error', {
        error: `worker ${worker.process.pid} died`,
        action: 'server-setup',
        signal
      });
      cluster.fork();
    });
  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    app.listen(process.env.NODE_SERVER_PORT, function(){
      console.log('info', {
        info: `Server is running at port ${process.env.NODE_SERVER_PORT}`,
        action: 'server-setup'
      });
    });
  }
}


module.exports = app;
