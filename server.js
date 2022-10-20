if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const app = express();
const session = require('express-session');
const flash = require('express-flash');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const methodOverride = require('method-override');

// passport
const initializePassport = require('./passport-config');
initializePassport(passport,
    email => users.find(user=>user.email===email),
    id => users.find(user=>user.id===id)
    );

app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

const users = [];


// Setting up body-parser
app.use(express.urlencoded({ extended: false}));
// Setting up a view engine
app.set('view engine','ejs');
app.set("views", path.join(__dirname, "views"));

app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name});
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs', { name: 'Login'});
});

app.get('/register',checkNotAuthenticated, (req, res) => {
    res.render('register.ejs', { name: 'Register'});
});


// POSTS
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))
app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,    
            email: req.body.email,
            password: hashedPassword
        });
       res.redirect('/login');
    } catch (error) {
        res.redirect('/register');
    }
});

app.delete('/logout', (req, res) => {
    req.logOut(err=>{
        if(err) return err;
    });
    res.redirect('/login');
});

function checkAuthenticated(req,res, next) {
    if(req.isAuthenticated()){
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}

const port = process.env.port | 3000;

app.listen(3000, ()=>console.log(`Server listening on port: ${port}`));