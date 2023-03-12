const nodemailer = require('nodemailer');
const logging = require('../utils/logging');

// Email setup
const transporter = nodemailer.createTransport({
    host: '',
    port: 465,
    secure: true,
    auth: {
        user: '',
        pass: ''
    }
});

export const send = (email: string, code: string) => {
    const mailOptions = {
        from: '',
        to: email,
        subject: 'Verification Code',
        text: `Your verification code is: ${code}`
    };
    transporter.sendMail(mailOptions, function(error: any, info: any) {
        if (error) {
            logging.log.error(error);
        } else {
            logging.log.info('Email sent: ' + info.response);
        }
    });
}