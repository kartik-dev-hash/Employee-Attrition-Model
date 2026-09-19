// frontend/src/utils/emailService.js
import emailjs from "@emailjs/browser";

// EmailJS credentials
const SERVICE_ID = "service_nh43idk";
const TEMPLATE_ID = "template_840p0bb";
const PUBLIC_KEY = "3q7VCQ0D2kgxzAvfB";

export const sendWelcomeEmail = async (userData) => {
  const { to_email, to_name, password } = userData;

  const templateParams = {
    to_email: to_email,
    to_name: to_name,
    password: password,

    // Login page
    login_link: "http://localhost:5173/signIn",

    // Current year
    year: new Date().getFullYear(),
  };

  try {
    console.log("📧 Sending email to:", to_email);
    console.log("📧 Template params:", templateParams);

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY,
    );

    console.log("✅ Email sent successfully!", result);

    return {
      success: true,
      message: "Email sent successfully!",
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    console.error("Error details:", error.text);

    return {
      success: false,
      message: error.text || "Email failed",
    };
  }
};
