module.exports = function (email, subject, name, id, cb) {
    const nodemailer = require('nodemailer');
    const {rootUrl} = require('../../config/rootUrl');
    
    let transporter = nodemailer.createTransport({
        host: "in-v3.mailjet.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: "974fdac587aaf10d510db70f797d6dbd",
            pass: "f145b6bd9e5c42522e259e8324e2748d"
        },
        tls: {
            rejectUnauthorised: false
        }
    });

    const url = rootUrl + '/supplier/'+id+'/account/confirmation';
    const data = `
        <div style="width: 100%;background-color: #f6f6f6;padding-top: 3rem;padding-bottom: 3rem">
        <link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet">
        <div style="width: 70%;display: block;margin-left: auto;margin-right: auto;padding:
            4rem;background-color: white;height: 100%;position: relative;">
            <div style="min-height: 20rem">
                <h2 style="font-family: 'Roboto', Helvetica, sans-serif;">Hello Mr., Mme. ${name}</h2>
                <p style="font-family: 'Roboto', Helvetica, sans-serif">Félicitation!! Vous êtes désormais notre partenaire. </p>
                <p style="font-family: 'Roboto', Helvetica, sans-serif">
                    Terminez la configuration de votre compte en cliquant <a style="color: #33475B;font-family: 'Roboto', Helvetica;" href="${url}">ICI</a>
                </p>
            </div>
            <div style="min-height: 5rem">
                <div style="text-align: center">
                <center>
                    <p><a style="font-family: 'Roboto', Helvetica, sans-serif;text-decoration: none;color: #33475B" href="http://entrecops.co">Visitez le site</a></p>
                    <span style="font-family: 'Roboto', Helvetica, sans-serif">Copyright &copy; 2019. All rights reserved.</span>
                </center>
                </div>
            </div>
        </div>
    </div>`;

    let mailOptions = {
        from: '"Entre Cops " <entrecops@entrecops.co>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: '', // plain text body
        html: data // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, cb);
}