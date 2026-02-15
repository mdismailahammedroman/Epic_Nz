/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
import { envVar } from "../config/envVar";
import AppError from "../errorHelper/AppError";

// Create the transporter
const transporter = nodemailer.createTransport({
  auth: {
    user: envVar.SMTP.SMTP_USER, // Email account username
    pass: envVar.SMTP.SMTP_PASSWORD, // Email account password or App password
  },
  port: Number(envVar.SMTP.SMTP_PORT),
  secure: Number(envVar.SMTP.SMTP_PORT) === 465, // SMTP port (use 465 for SSL, 587 for TLS)
  host: envVar.SMTP.SMTP_HOST, // SMTP host (e.g., smtp.gmail.com for Gmail)
});

// Interface for email options
interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

// Send email function
export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
  try {
    // Construct the path to the EJS template
    const templatePath = path.join(__dirname, `templates/${templateName}.ejs`);

    // Render the template with provided data
    const html = await ejs.renderFile(templatePath, templateData);

    // Send the email using the transporter
    await transporter.sendMail({
      from: envVar.SMTP.SMTP_USER, // Sender's email address
      to: to, // Recipient's email address
      subject: subject, // Subject of the email
      html: html, // HTML content rendered from the EJS template
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename, // Name of the attachment
        content: attachment.content, // Content of the attachment
        contentType: attachment.contentType, // MIME type of the attachment
      })),
    });

    return true;
  } catch (error: any) {
    console.error("Error sending email:", error.message); // Log the error message
    throw new AppError(400, `Email error: ${error.message}`);
  }
};
