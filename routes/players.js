const express = require('express');
const router = express.Router();
const xss = require('xss');
const data = require('../data');
const playerFuncs = data.players;

router.get('/', async (req, res) => {
    try {
        res.redirect('/');
    } catch (e) {
        res.status(500);
    }
});

router.get('/:playerid', async (req, res) => {
    if(req.params.playerid == undefined || typeof req.params.playerid != 'string'){
        res.redirect('/');
        return;
    }

    try {
        let username = req.params.playerid;
        const person = await playerFuncs.getPersonByUsername(username);
        if(!req.session.user)
            return res.render('pages/profile', {
                title: person.nickname + " | Stevens Esports",
                player: person,
                user: req.session.user,
            });
        else {
            return res.render('pages/profile', {
                title: person.nickname + " | Stevens Esports",
                player: person,
                user: req.session.user,
                isAdmin: req.session.user.role === "administrator"
            });
        }
    } catch (e) {
        res.redirect('/');
        console.log(e);
        return;
    }
});


module.exports = router;