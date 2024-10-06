const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const router = express.Router();


const savePath = path.join(__dirname, '/../../backup_db');

router.post('/backup', (req, res) => {
    exec(`mongodump --db entrecops --out ${savePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur de sauvegarde: ${error}`);
            return res.status(500).send('Erreur de sauvegarde');
        }
        console.log(`Sauvegarde de la base de donnée réussie: ${stdout}`);
        res.send('Sauvegarde de la base de donnée réussie');
    });
})

module.exports = router;