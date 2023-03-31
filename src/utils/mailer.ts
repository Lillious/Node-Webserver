const nodemailer = require('nodemailer');
const logging = require('../utils/logging');
require('dotenv').config();

// Email setup
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || undefined,
    port: process.env.EMAIL_PORT || undefined,
    secure: process.env.EMAIL_SECURE || undefined,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    service: process.env.EMAIL_SERVICE || undefined
});

export const send = (email: string, subject: string, message: string) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `${subject}`,
        text: `${message}`
    };
    transporter.sendMail(mailOptions, function(error: any, info: any) {
        if (error) {
            logging.log.error(error);
        } else {
            logging.log.info('Email sent: ' + info.response);
        }
    });
}