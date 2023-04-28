import nodemailer from 'nodemailer';
import * as log from '../utils/logging.js';
import dotenv from 'dotenv';
dotenv.config();

// Email setup
const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export function send (email: string, subject: string, message: string) : any {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `${subject}`,
        text: `${message}`
    };
    transporter.sendMail(mailOptions, function(error: any, info: any) {
        if (error) {
            log.error(error);
        } else {
            log.info('Email sent: ' + info.response);
        }
    });
}