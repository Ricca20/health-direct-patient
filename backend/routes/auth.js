const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Patient = require("../models/Patient");
const { generateTokens } = require("./token");
const sendEmail = require("../utils/sendEmail");
const PatientOtp = require("../models/patientOtpSchema");
const { upsertDeviceSession } = require("../utils/deviceSessionService");

const router = express.Router();

const formatSecurityTime = (date) =>
  new Date(date).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Europe/Moscow",
  });

const EMAIL_LANGUAGES = ["en", "ru"];

const normalizeEmailLanguage = (language) => {
  if (!language || typeof language !== "string") return "en";
  const code = language.toLowerCase().split(/[-_]/)[0];
  return EMAIL_LANGUAGES.includes(code) ? code : "en";
};

const resolveEmailLanguage = async ({ requestedLanguage, user, email }) => {
  const explicit = normalizeEmailLanguage(requestedLanguage || user?.notificationLanguage);
  if (explicit && explicit !== "en") {
    return explicit;
  }

  if (user?.notificationLanguage && EMAIL_LANGUAGES.includes(user.notificationLanguage)) {
    return user.notificationLanguage;
  }

  if (email) {
    const patient = await Patient.findOne({ email }).lean();
    if (patient?.notificationLanguage && EMAIL_LANGUAGES.includes(patient.notificationLanguage)) {
      return patient.notificationLanguage;
    }
  }

  return "en";
};

const buildSignupEmail = ({ language, displayName, appNumber, formattedDate, formattedTime, doctorValue, specialityValue }) => {
  const isRu = language === "ru";
  const subject = isRu ? "Подтверждение регистрации СОФОС" : "SOPHOS Registration Confirmation";
  const text = isRu
    ? `Уважаемый(ая) ${displayName},\n\nСпасибо за регистрацию в СОФОС.\n\nНомер заявки: ${appNumber}\nДата: ${formattedDate}\nВремя: ${formattedTime}\nВрач: ${doctorValue}\nСпециальность: ${specialityValue}\n\nЕсли эти данные еще не окончательны, они будут обновлены после подтверждения вашей записи.\n\nС уважением,\nКоманда СОФОС`
    : `Dear ${displayName},\n\nThank you for registering with SOPHOS.\n\nApplication Number: ${appNumber}\nDate: ${formattedDate}\nTime: ${formattedTime}\nDoctor: ${doctorValue}\nSpeciality: ${specialityValue}\n\nIf these details are not yet final, they will be updated when your appointment is confirmed.\n\nBest regards,\nSOPHOS Team`;
  const html = isRu
    ? `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">СОФОС</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Подтверждение регистрации</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#111827;">Добро пожаловать, ${displayName}!</div>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">Спасибо за регистрацию в <strong>СОФОС</strong>. Ваша регистрация принята, и профиль пациента теперь активен.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:16px;">
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:42%;font-weight:700;">Номер заявки</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${appNumber}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Дата</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${formattedDate}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Время</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${formattedTime}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Врач</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${doctorValue}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Специальность</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${specialityValue}</td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">Если эти данные еще не окончательны, они будут обновлены после подтверждения вашей записи.</p>
                <p style="margin:16px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">С уважением,<br/>Команда СОФОС</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">Это автоматическое письмо. Пожалуйста, не отвечайте на это сообщение.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`
    : `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">SOPHOS</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Registration Confirmation</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:22px;font-weight:700;margin-bottom:8px;color:#111827;">Welcome aboard, ${displayName}!</div>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">Thank you for registering with <strong>SOPHOS</strong>. Your registration has been received and your patient profile is now active.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:16px;">
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:42%;font-weight:700;">Application Number</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${appNumber}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Date</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${formattedDate}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Time</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${formattedTime}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #d9e2ec;">
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Doctor</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${doctorValue}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:700;">Speciality</td>
                    <td style="padding:8px 0;color:#111827;font-size:13px;">${specialityValue}</td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">If any of these details are incomplete, they will be updated as soon as your appointment is confirmed.</p>
                <p style="margin:16px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">Best regards,<br/>The SOPHOS Team</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">This is an automated email. Please do not reply to this message.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
  return { subject, text, html };
};

const buildResetRequestEmail = ({ language, resetUrl }) => {
  const isRu = language === "ru";
  const subject = isRu ? "Сброс пароля СОФОС" : "Password Reset Request - SOPHOS";
  const text = isRu
    ? `Вы запросили сброс пароля. Перейдите по ссылке: ${resetUrl}. Ссылка действительна 1 час.`
    : `You requested a password reset. Use this link: ${resetUrl}. This link expires in 1 hour.`;
  const html = isRu
    ? `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">СОФОС</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Сброс пароля</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">Мы получили запрос на сброс пароля для вашего аккаунта.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:16px;">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-weight:700;">Ссылка для сброса пароля</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;"><a href="${resetUrl}" style="color:#0b3780;text-decoration:none;word-break:break-all;">${resetUrl}</a></td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">Это автоматическое письмо. Пожалуйста, не отвечайте на это сообщение.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`
    : `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">SOPHOS</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Password Reset Request</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">We received a password reset request for your account.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:16px;">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-weight:700;">Password reset link</td>
                  </tr>
                  <tr>
                    <td style="padding-top:8px;"><a href="${resetUrl}" style="color:#0b3780;text-decoration:none;word-break:break-all;">${resetUrl}</a></td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-size:14px;line-height:1.7;color:#374151;">This link expires in 1 hour. If you did not request a password reset, please ignore this message.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">This is an automated email. Please do not reply to this message.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
  return { subject, text, html };
};

const buildResetSuccessEmail = ({ language }) => {
  const isRu = language === "ru";
  return {
    subject: isRu ? "Пароль успешно сброшен - СОФОС" : "Password Reset Successful - SOPHOS",
    text: isRu
      ? "Ваш пароль успешно сброшен."
      : "Your password has been successfully reset.",
    html: isRu
      ? `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">СОФОС</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Сброс пароля выполнен</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">Ваш пароль был успешно обновлен. Если вы не выполняли это действие, пожалуйста, свяжитесь с поддержкой.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">Это автоматическое письмо. Пожалуйста, не отвечайте на это сообщение.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`
      : `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">SOPHOS</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Password Reset Successful</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">Your password has been successfully reset. If you did not perform this action, please contact support.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">This is an automated email. Please do not reply to this message.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`,
  };
};

const buildNewDeviceEmail = ({ displayName, session, language }) => {
  const isRu = language === "ru";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const devicesUrl = `${frontendUrl}/devices`;
  const securityUrl = `${frontendUrl}/signin`;
  const subject = isRu ? "Обнаружен вход с нового устройства" : "New Device Sign-In Alert";
  const text = isRu
    ? `Обнаружен вход на вашу учетную запись с нового устройства.\n\nУстройство: ${session.deviceType || "Unknown"}\nБраузер: ${session.browser || "Unknown"}\nОС: ${session.os || "Unknown"}\nIP-адрес: ${session.ipAddress || "Unknown"}\nМестоположение: ${session.location || "Unknown"}\nВремя: ${formatSecurityTime(session.lastLoginAt)}\n\nЕсли это были не вы, пожалуйста, проверьте активные устройства: ${devicesUrl}`
    : `New device sign-in detected for your account.\n\nDevice: ${session.deviceType || "Unknown"}\nBrowser: ${session.browser || "Unknown"}\nOS: ${session.os || "Unknown"}\nIP Address: ${session.ipAddress || "Unknown"}\nLocation: ${session.location || "Unknown"}\nTime: ${formatSecurityTime(session.lastLoginAt)}\n\nIf this was not you, review active devices immediately: ${devicesUrl}`;
  const html = isRu
    ? `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">СОФОС</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Уведомление о безопасности</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 18px;">
                <div style="font-size:27px;font-weight:700;margin-bottom:8px;color:#111827;">🔐 Обнаружен вход с нового устройства</div>
                <p style="margin:0 0 6px 0;font-size:18px;color:#1f2937;">Здравствуйте, ${displayName}!</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;color:#374151;">Мы зафиксировали вход на вашу учетную запись с нового устройства. Если это были вы, ничего делать не нужно. Если нет — отозвите доступ.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:10px 12px;">
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:42%;">Устройство</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.deviceType || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Браузер</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.browser || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">ОС</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.os || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">IP-адрес</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.ipAddress || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Местоположение</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.location || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Время</td><td style="padding:5px 0;color:#111827;font-size:13px;">${formatSecurityTime(session.lastLoginAt)} MSK</td></tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
                  <tr>
                    <td width="50%" style="padding-right:8px;">
                      <a href="${devicesUrl}" style="display:block;text-decoration:none;text-align:center;background:#0b3780;color:#ffffff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;">Разрешить доступ</a>
                    </td>
                    <td width="50%" style="padding-left:8px;">
                      <a href="${securityUrl}" style="display:block;text-decoration:none;text-align:center;background:#b91c1c;color:#ffffff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;">Блокировать и отозвать</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0 0;font-size:12px;color:#64748b;">Если это были не вы, проверьте активные устройства и измените пароль.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">Это автоматическое уведомление. Пожалуйста, не отвечайте на это письмо.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`
    : `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0b3780;text-align:center;color:#ffffff;">
                <div style="font-size:30px;font-weight:700;letter-spacing:0.2px;">SOPHOS</div>
                <div style="font-size:12px;opacity:0.92;margin-top:4px;">Security Alert</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 18px;">
                <div style="font-size:27px;font-weight:700;margin-bottom:8px;color:#111827;">🔐 New device sign-in detected</div>
                <p style="margin:0 0 6px 0;font-size:18px;color:#1f2937;">Hi, ${displayName}!</p>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;color:#374151;">We detected a sign-in to your account from a new device. If this was you, everything is fine. If not, block access immediately.</p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e6edf5;border-radius:10px;background:#f8fafc;padding:10px 12px;">
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;width:42%;">Device</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.deviceType || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Browser</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.browser || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">OS</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.os || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">IP Address</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.ipAddress || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Location</td><td style="padding:5px 0;color:#111827;font-size:13px;">${session.location || "Unknown"}</td></tr>
                  <tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">Time</td><td style="padding:5px 0;color:#111827;font-size:13px;">${formatSecurityTime(session.lastLoginAt)} MSK</td></tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">
                  <tr>
                    <td width="50%" style="padding-right:8px;">
                      <a href="${devicesUrl}" style="display:block;text-decoration:none;text-align:center;background:#0b3780;color:#ffffff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;">Allow Access</a>
                    </td>
                    <td width="50%" style="padding-left:8px;">
                      <a href="${securityUrl}" style="display:block;text-decoration:none;text-align:center;background:#b91c1c;color:#ffffff;padding:12px;border-radius:8px;font-weight:700;font-size:14px;">Block & Revoke</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:14px 0 0 0;font-size:12px;color:#64748b;">If you did not sign in, review active devices now and change your password immediately.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #edf2f7;">This is an automated security alert. Please do not reply to this email.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
  return { subject, text, html };
};

const maybeAlertOnNewDevice = async (user, req, deviceInfo, requestedLanguage) => {
  const { session, isNewDevice } = await upsertDeviceSession({ user, req, deviceInfo });
  if (!isNewDevice) {
    return;
  }

  const patient = await Patient.findOne({ email: user.email }).lean();
  const displayName =
    [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") ||
    user.email;
  const language = await resolveEmailLanguage({ requestedLanguage, user, email: user.email });
  const { subject, text, html } = buildNewDeviceEmail({ displayName, session, language });

  sendEmail(user.email, subject, text, html).catch((error) => {
    console.error("[NEW_DEVICE_ALERT_FAILED]", error.message);
  });
};

const resolvePatientIdForUser = async (user) => {
  if (!user?.email) return null;
  const patient = await Patient.findOne({ email: user.email }).select("patientId").lean();
  return patient?.patientId || null;
};

const buildAuthUserPayload = async (user, patientIdOverride = null) => {
  const patientId = patientIdOverride || (await resolvePatientIdForUser(user));
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    profileCompleted: user.profileCompleted || false,
    phoneNumber: user.phoneNumber,
    patientId,
  };
};

// routes/auth.js
router.post("/login", async (req, res) => {
  try {
    const { email, password, deviceInfo } = req.body;

    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // create access token with email, id, and role
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // create refresh token with only user id
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    await maybeAlertOnNewDevice(
      user,
      req,
      deviceInfo,
      req.body.language || req.body.notificationLanguage,
    );

    const userPayload = await buildAuthUserPayload(user);

    return res.json({
      accessToken,
      refreshToken,
      user: userPayload,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST Signup function
router.post("/signup", async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phoneNumber,
    dateOfBirth,
    gender,
    appointmentDate,
    appointmentTime,
    doctorName,
    speciality,
  } = req.body;

  const language = normalizeEmailLanguage(req.body.language || req.body.notificationLanguage || "en");

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Save in User collection
    const newUser = new User({
      email,
      password: hashedPassword,
      role: "patient",
      profileCompleted: false,
      notificationLanguage: language,
    });
    await newUser.save();

    const defaultFirstName = firstName || email.split("@")[0] || "Patient";
    const defaultLastName = lastName || "User";
    const defaultPhoneNumber = phoneNumber || "0000000000";
    const defaultDateOfBirth = dateOfBirth
      ? new Date(dateOfBirth)
      : new Date("1995-01-15");
    const defaultGender = gender || "Male";

    // Save in Patient collection too
    const newPatient = new Patient({
      email,
      firstName: defaultFirstName,
      lastName: defaultLastName,
      phoneNumber: defaultPhoneNumber,
      dateOfBirth: defaultDateOfBirth,
      gender: defaultGender,
      profileCompleted: false,
      comments: "Created by signup.",
      notificationLanguage: language,
    });
    await newPatient.save();

    const appNumber = newPatient.patientId || "N/A";
    const displayName = `${newPatient.firstName} ${newPatient.lastName}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const appointmentDateValue = appointmentDate || "To be scheduled";
    const appointmentTimeValue = appointmentTime || "To be scheduled";
    const doctorValue = doctorName || "To be assigned";
    const specialityValue = speciality || "To be assigned";

    const { subject, text, html } = buildSignupEmail({
      language,
      displayName,
      appNumber,
      formattedDate,
      formattedTime,
      doctorValue,
      specialityValue,
    });

    await sendEmail(email, subject, text, html);

    // Generate access + refresh tokens (same as login)
    const accessToken = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // short expiry
    );

    const refreshToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Save refresh token in DB
    newUser.refreshToken = refreshToken;
    await newUser.save();

    // Option 1: If you want cookie storage like login fix
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userPayload = await buildAuthUserPayload(newUser, newPatient.patientId);

    // Match login response
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken, // keep if frontend needs it explicitly
      user: userPayload,
    });
  } catch (error) {
    console.error("Error in /signup:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

const normalizePhoneNumber = (phoneNumber) => {
  return typeof phoneNumber === "string"
    ? phoneNumber.replace(/\D/g, "")
    : "";
};

const isValidPhoneNumber = (phoneNumber) => {
  const normalized = normalizePhoneNumber(phoneNumber);
  return typeof phoneNumber === "string" && /^\+?[0-9]{7,15}$/.test(phoneNumber) && normalized.length >= 7;
};

const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getPublicUser = async (user) => {
  const userPayload = await buildAuthUserPayload(user);
  return {
    ...userPayload,
    phoneNumber: user.phoneNumber,
  };
};

const ensureUserByPhone = async (phoneNumber) => {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  let user = await User.findOne({
    $or: [{ phoneNumber }, { phoneNumber: normalizedPhone }],
  });

  let patient = await Patient.findOne({
    $or: [{ phoneNumber }, { phoneNumber: normalizedPhone }],
  });

  if (patient?.email) {
    const patientUser = await User.findOne({ email: patient.email });
    if (patientUser) {
      user = patientUser;
    }
  }

  const preparePasswordAndEmail = async (existingEmail) => {
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const localPart = normalizedPhone || Date.now().toString();
    const emailPlaceholder = existingEmail || `otp_${localPart}@healthdirect.local`;
    return { emailPlaceholder, hashedPassword };
  };

  if (!user) {
    const { emailPlaceholder, hashedPassword } = await preparePasswordAndEmail(patient?.email);
    user = new User({
      email: emailPlaceholder,
      phoneNumber: normalizedPhone,
      password: hashedPassword,
      role: "patient",
      profileCompleted: false,
    });
    await user.save();
  } else {
    let shouldSave = false;

    if (!user.email) {
      const { emailPlaceholder } = await preparePasswordAndEmail(patient?.email);
      user.email = emailPlaceholder;
      shouldSave = true;
    }

    if (patient?.email && user.email.startsWith("otp_") && user.email !== patient.email) {
      const existingUser = await User.findOne({ email: patient.email });
      if (existingUser) {
        user = existingUser;
      } else {
        user.email = patient.email;
        shouldSave = true;
      }
    }

    if (!user.password) {
      const { hashedPassword } = await preparePasswordAndEmail(user.email);
      user.password = hashedPassword;
      shouldSave = true;
    }

    if (!user.role) {
      user.role = "patient";
      shouldSave = true;
    }

    if (!user.phoneNumber || user.phoneNumber !== normalizedPhone) {
      user.phoneNumber = normalizedPhone;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  }

  if (!patient) {
    patient = await Patient.findOne({ email: user.email });
  }

  if (!patient) {
    patient = new Patient({
      email: user.email,
      firstName: "Demo",
      middleName: "",
      lastName: "Patient",
      gender: "Male",
      dateOfBirth: new Date("1995-01-15"),
      phoneNumber: user.phoneNumber,
      additionalPhone: "",
      comments: "Created by OTP login.",
      profileCompleted: user.profileCompleted || false,
      notificationLanguage: user.notificationLanguage || "en",
    });
    await patient.save();
  }

  return user;
};

router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ message: "Valid phone number is required" });
    }

    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await PatientOtp.findOneAndUpdate(
      { phoneNumber },
      { phoneNumber, otp, expiresAt, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[OTP SEND] phoneNumber=${phoneNumber} otp=${otp} expiresAt=${expiresAt.toISOString()}`);

    return res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp, deviceInfo } = req.body;
    if (!phoneNumber || !otp || !isValidPhoneNumber(phoneNumber) || !/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ message: "Valid phone number and OTP are required" });
    }

    const otpRecord = await PatientOtp.findOne({ phoneNumber, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await ensureUserByPhone(phoneNumber);
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    await PatientOtp.deleteMany({ phoneNumber });

    await maybeAlertOnNewDevice(user, req, deviceInfo, req.body.language || req.body.notificationLanguage);

    console.log(`[OTP VERIFY] phoneNumber=${phoneNumber} userId=${user._id} verified`);

    const userPayload = await getPublicUser(user);

    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userPayload,
    });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    return res.status(500).json({ message: "OTP verification failed" });
  }
});

router.post("/signup-otp", async (req, res) => {
  try {
    const { phoneNumber, otp, deviceInfo } = req.body;
    if (!phoneNumber || !otp || !isValidPhoneNumber(phoneNumber) || !/^\d{4,6}$/.test(otp)) {
      return res.status(400).json({ message: "Valid phone number and OTP are required" });
    }

    const otpRecord = await PatientOtp.findOne({ phoneNumber, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await ensureUserByPhone(phoneNumber);
    if (!user.profileCompleted) {
      user.profileCompleted = false;
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    await PatientOtp.deleteMany({ phoneNumber });

    await maybeAlertOnNewDevice(user, req, deviceInfo, req.body.language || req.body.notificationLanguage);

    console.log(`[OTP SIGNUP] phoneNumber=${phoneNumber} userId=${user._id} createdOrVerified`);

    const userPayload = await getPublicUser(user);

    return res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: userPayload,
    });
  } catch (err) {
    console.error("Signup OTP error:", err.message);
    return res.status(500).json({ message: "OTP signup failed" });
  }
});

router.post("/refresh", async (req, res) => {
  console.log("----- REFRESH API CALLED -----");
  const { refreshToken } = req.body;
  if (!refreshToken){
      console.log("❌ No refresh token provided");
    return res.status(401).json({ message: "No refresh token" });
}
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
     console.log("❌ JWT verification failed:", err.message);
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  const user = await User.findById(decoded.id);
  //  || user.refreshToken !== refreshToken
  if (!user) {
    console.log("❌ User not found for ID:", decoded.id);
    return res.status(403).json({ message: "Token mismatch" });
  }

  // include email in the refreshed access token
  const newAccessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const userPayload = await buildAuthUserPayload(user);

  return res.json({
    accessToken: newAccessToken,
    user: userPayload,
  });
});
/**
 * POST /auth/patient-logout
 * Clears refresh token
 */
// Doctor logout
router.post("/logout", async (req, res) => {
  try {
    let refreshToken;

    // Accept both header and body
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      refreshToken = authHeader.split(" ")[1];
    } else if (req.body.refreshToken) {
      refreshToken = req.body.refreshToken;
    }

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      decoded = jwt.decode(refreshToken); // allow expired
    }

    if (decoded?.id) {
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("[LOGOUT_ERROR]", err.message);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

/**
 * GET /auth/validate
 * Checks if current access token is valid
 */
router.get("/validate", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Malformed token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const userPayload = await buildAuthUserPayload(user);

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      user: userPayload,
    });
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid or expired" });
  }
});

/**
 * POST /auth/forgot-password
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const requestedLanguage = normalizeEmailLanguage(req.body.language || req.body.notificationLanguage || "en");

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found (security)
      return res.status(200).json({
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1h
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const language = await resolveEmailLanguage({ requestedLanguage, user, email });
    const { subject, text, html } = buildResetRequestEmail({ resetUrl, language });

    await sendEmail(user.email, subject, text, html);

    return res.status(200).json({
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /auth/verify-reset-token/:token
 */
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    return res
      .status(200)
      .json({ message: "Valid reset token", email: user.email });
  } catch (error) {
    console.error("Verify reset token error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/reset-password
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required" });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    try {
      const requestedLanguage = normalizeEmailLanguage(
        req.body.language || req.body.notificationLanguage || "en"
      );
      const language = await resolveEmailLanguage({ requestedLanguage, user, email: user.email });
      const { subject, text, html } = buildResetSuccessEmail({ language });
      await sendEmail(user.email, subject, text, html);
    } catch (emailErr) {
      console.error("Password reset email error:", emailErr.message);
    }

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
