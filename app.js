const express = require('./node_modules/express');
const mongoose = require('mongoose');
const config = require('./config/database');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport')
const session = require('express-session')
const http = require('http');
const path = require('path');
const socketIo = require("socket.io");
const passportInit = require('./api/lib/passport-init')
const { rootUrl, apiUrl} = require('./config/rootUrl')
const execution = require('./script-suppression');
const cron = require('node-cron');

// Routes
const userRoutes = require('./api/routes/users');
const categoryRoutes = require('./api/routes/categories');
const supplierRoutes = require('./api/routes/suppliers');
const eventRoutes = require('./api/routes/events');
const serviceRoutes = require('./api/routes/services');
const announceRoutes = require('./api/routes/announces'); // Routes for services and events
const galleryRoutes = require('./api/routes/galleries');
const bannersRoutes = require('./api/routes/banners');
const authRoutes = require('./api/routes/auth');
const emailsRoutes = require('./api/routes/emails');
const webhookRoutes = require('./api/routes/webhook');
const backupRoutes = require('./api/routes/backup');

// Connect to db
mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', async function() {
    console.log('Connected to mongodb');
})
require('dotenv').config();


// App initialization
const app = express();
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json())
app.use(passport.initialize())
passportInit()

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}))

cron.schedule('0 0 * * *', async () => {
    console.log('running database cleanup script');
    await execution();
})

http.globalAgent.maxSockets = 1
const server = http.createServer(app);

app.use(morgan('dev'))
app.use('/uploads', express.static('uploads'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const cors = require('cors');
const corsOptions ={
    origin:'http://localhost:3000',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', rootUrl, apiUrl)
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-Type, Accept, Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({})
    }
    next()
})

// Init socket io
const io = socketIo.listen(server, { wsEngine: 'ws' });
app.set('io', io)

// Assurez-vous de bien passer io dans les routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

/* App Routes */
app.use('/api/user', userRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/announce', announceRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/banner', bannersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/email', emailsRoutes);
app.use('/api/hook', webhookRoutes);
app.use('/api', backupRoutes);

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error)
})

app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
})


io.on('connection', function (socket) {
    // let client = socket.request._query
    console.log("un client vient de se connecter");

    // Notification for recommandation
    socket.on('new notification', function (data) {
        io.emit('display notification',  data)
    })
    socket.on('new anounce notification', function (data) {
        socket.broadcast.emit('display anounce notification',  data)
    })
    socket.on('new_notification', function (data) {
        console.log('called');
        socket.broadcast.emit('new_notification',  data)
    })

    socket.on("disconnect", () => console.log("Client disconnected"));
})

// Start the app
const PORT = process.env.PORT;
server.listen(PORT, function() {
    console.log("Server started and listening on http://localhost:"+PORT)
})