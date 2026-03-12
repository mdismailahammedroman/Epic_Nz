/* eslint-disable @typescript-eslint/no-explicit-any */
import sgMail from "@sendgrid/mail";
import path from "path";
import ejs from "ejs";
import { envVar } from "../config/envVar";
import AppError from "../errorHelper/AppError";

sgMail.setApiKey(envVar.EMAIL.SENDGRID_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
}: SendEmailOptions) => {
  try {
const templatePath = path.join(__dirname, "../utils/templates", `${templateName}.ejs`);
console.log("Template path:", templatePath);
    const html = await ejs.renderFile(templatePath, templateData);

    const msg = {
      to,
      from: {
        email: envVar.EMAIL.SENDGRID_FROM_EMAIL,
        name: envVar.EMAIL.SENDGRID_FROM_NAME,
      },
      subject,
      html,
      mail_settings: { sandbox_mode: { enable: false } },
    };

    await sgMail.send(msg);

    return true;
  } catch (error: any) {
    console.error("Error sending email:", error.message);
    throw new AppError(400, `Email error: ${error.message}`);
  }
};
