import nodemailer from "nodemailer";
import fs from "fs";
import { convert, htmlToText } from "html-to-text";

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ").at(0);
    this.url = url;
    this.from = `Marcos Teran <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // SENDGRID
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = fs.readFileSync(`${__dirname}/../public/templates/${template}.html`);
    let htmlText = Buffer.from(html).toString();
    htmlText = htmlText.replace("[firstName]", this.firstName);
    htmlText = htmlText.replace("[URL]", this.url);
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: htmlText,
      // text: htmlText,
      attachments: [
        {
          filename: "image-1.png",
          path: `${__dirname}/../public/templates/images/image-1.png`,
          cid: "image1@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-7.png",
          path: `${__dirname}/../public/templates/images/image-7.png`,
          cid: "image7@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-2.png",
          path: `${__dirname}/../public/templates/images/image-2.png`,
          cid: "image2@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-3.png",
          path: `${__dirname}/../public/templates/images/image-3.png`,
          cid: "image3@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-4.png",
          path: `${__dirname}/../public/templates/images/image-4.png`,
          cid: "image4@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-5.png",
          path: `${__dirname}/../public/templates/images/image-5.png`,
          cid: "image5@nodemailer.com", //same cid value as in the html img src
        },
        {
          filename: "image-6.png",
          path: `${__dirname}/../public/templates/images/image-6.png`,
          cid: "image6@nodemailer.com", //same cid value as in the html img src
        },
      ],
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours family!");
  }

  async sendPasswordReset() {
    await this.send("passwordReset", "Your password reset token (valid for only 10 minutes)");
  }
}
