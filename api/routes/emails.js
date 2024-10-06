const express = require('express')
const router = express.Router()
const sendMailGmail = require('../mailing/send_email')

router.post('/sendemail/gmail', (req, res) => {
    let isError = false;
    req.body.emails.forEach((email, i) => {
        sendMailGmail(req.body.object, email, JSON.parse(req.body.html), (error, info) => {
            if (error) {
                isError = true;
                return res.status(500).json({
                    "error": error
                })
            }
            console.log('Message sent: %s', info.messageId);
            if (req.body.emails.length == i+1) {
                return res.status(200).json({
                    mail: "Email sent",
                })
            }
        });
    });
})

// send mail when validate supplier account
router.post('/sendmail/:email/:subject/:name/:id/:to', (req, res, next) => {
    var sendmail = null;
    if (req.params.to == "validatesupplier") {
        sendmail = require('../mailing/validate_supplier_email');
    }
    sendmail(req.params.email, req.params.subject, req.params.name, req.params.id, (error, info) => {
        if (error) {
            console.log(error)
            return res.status(500).json({
                "error": error
            })
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return res.status(200).json({
            mail: "Email sent",
        })
    });
})


module.exports = router