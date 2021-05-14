const express = require('express');
const router = express.Router();

const data = require('../data');
const playerFuncs = data.playerFunc;

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
        //res.status(400).render('player/playerNotExist', {title: 'Error 404: Player not Found!'});
        return;
    }

    try {
        let id = req.params.playerid;
        const person = await playerFuncs.getPersonById(id);
        res.render('pages/profile', {title: person.nickname + " | Stevens Esports", player: person});
    } catch (e) {
        //res.status(500).render('shows/errorpage', {title: 'Error', error: e });
        res.redirect('/');
        console.log(e);
    }
});


module.exports = router;