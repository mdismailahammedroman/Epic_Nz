/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
import { envVar } from "../config/envVar";
import AppError from "../errorHelper/AppError";

// Parse SMTP port safely with fallback
const port = envVar.SMTP.SMTP_PORT ? parseInt(envVar.SMTP.SMTP_PORT, 10) : 465;

// Create the transporter
const transporter = nodemailer.createTransport({
  host: envVar.SMTP.SMTP_HOST,
  port, // SMTP port
  secure: port === 465, // true for SSL, false for TLS
  auth: {
    user: envVar.SMTP.SMTP_USER,
    pass: envVar.SMTP.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000, // 10 seconds
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
      from: envVar.SMTP.SMTP_USER,
      to,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });

    return true;
  } catch (error: any) {
    console.error("Error sending email:", error.message);
    throw new AppError(400, `Email error: ${error.message}`);
  }
};
