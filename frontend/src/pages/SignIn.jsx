import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Send,
  KeyRound,
  ChevronLeft,
} from "lucide-react";
import background from "../assets/background.jpg";
import bg_1 from "../assets/bg_1.png";
import bg_2 from "../assets/bg_2.png";
import bg_3 from "../assets/bg_3.png";
import { AuthContext } from "../context/AuthContext";
import {
  signin,
  sendOtp,
  verifyOtp,
  sendPasswordResetEmail,
} from "../utils/api";
import Navbar from "../components/Navbar";

const images = [background, bg_1, bg_2, bg_3, background, background];

function SignIn() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("email"); 

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // OTP state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState("send"); 
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Reset OTP state when switching to OTP tab
  useEffect(() => {
    if (activeTab === "otp") {
      setPhoneNumber("");
      setOtpCode("");
      setOtpStep("send");
      setOtpError("");
    }
  }, [activeTab]);

  // Email/Password handlers
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(emailRegex.test(value) ? "" : t("signin.errors.email"));
  };

  const handleResetEmailChange = (e) => {
    const value = e.target.value;
    setResetEmail(value);
    setResetEmailError(emailRegex.test(value) ? "" : t("signin.errors.email"));
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetEmailError("");
    setShowForgotPassword(true);
    setResetEmailSent(false);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || resetEmailError) {
      setResetEmailError(t("forgotPassword.errors.emailRequired"));
      return;
    }
    setIsSendingResetEmail(true);
    try {
      const language = i18n.language?.split(/[-_]/)[0] || "en";
      await sendPasswordResetEmail({ email: resetEmail, language });
      setResetEmailSent(true);
      toast.success(t("forgotPassword.success.emailSent"));
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("forgotPassword.errors.general"),
      );
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (emailError || !email || !password) {
      toast.error(t("signin.errors.form"));
      return;
    }
    try {
      const language = i18n.language?.split(/[-_]/)[0] || "en";
      const response = await signin({ email, password, language });
      const { accessToken, refreshToken, user } = response.data;
      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid login response");
      }
      login(accessToken, refreshToken, user);
      toast.success(t("signin.loginSuccess"));
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        toast.error(
          t("signin.errors.invalidCredentials") || "Invalid email or password",
        );
      } else if (status === 500) {
        toast.error(
          t("signin.errors.serverError") ||
            "Server error, please try again later",
        );
      } else {
        toast.error(message || t("signin.errors.login"));
      }
    }
  };

  // OTP handlers
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setOtpError(t("signin.otp.phoneRequired"));
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setOtpError(t("signin.otp.invalidPhone"));
      return;
    }
    setOtpSending(true);
    setOtpError("");
    try {
      await sendOtp({ phoneNumber });
      toast.success(t("signin.otp.otpSent"));
      setOtpStep("verify");
      setOtpCode("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || t("signin.otp.sendFailed");
      toast.error(errorMsg);
      setOtpError(errorMsg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpError(t("signin.otp.otpRequired"));
      return;
    }
    if (!/^\d{4,6}$/.test(otpCode)) {
      setOtpError(t("signin.otp.invalidOtp"));
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const language = i18n.language?.split(/[-_]/)[0] || "en";
      const response = await verifyOtp({
        phoneNumber,
        otp: otpCode,
        language,
      });
      const { accessToken, refreshToken, user } = response.data;
      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid login response");
      }
      login(accessToken, refreshToken, user);
      toast.success(t("signin.loginSuccess"));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        t("signin.otp.verifyFailed");
      toast.error(errorMsg);
      setOtpError(errorMsg);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = () => {
    handleSendOtp();
  };

  const handleChangePhoneNumber = () => {
    setOtpStep("send");
    setOtpCode("");
    setOtpError("");
  };

  // OTP Form UI
  const renderOtpForm = () => (
    <div className="space-y-5">
      {/* Phone Number Field (always visible, editable in send step) */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
          <Phone className="w-4 h-4 text-gray-600" />
          {t("signin.otp.phoneLabel")}
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (otpError) setOtpError("");
            }}
            placeholder={t("signin.otp.phonePlaceholder")}
            disabled={otpStep === "verify" && !otpSending}
            className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition ${
              otpStep === "verify" && !otpSending
                ? "bg-gray-50 border-gray-200 text-gray-500"
                : "border-gray-200"
            }`}
          />
        </div>
      </div>

      {otpStep === "send" ? (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={otpSending}
          className="w-full bg-[#00235c] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {otpSending ? (
            t("signin.otp.sending")
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("signin.otp.sendOtp")}
            </>
          )}
        </button>
      ) : (
        <>
          {/* OTP Code Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
              <KeyRound className="w-4 h-4 text-gray-600" />
              {t("signin.otp.otpLabel")}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (otpError) setOtpError("");
                }}
                placeholder={t("signin.otp.otpPlaceholder")}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpVerifying}
              className="w-full bg-[#00235c] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {otpVerifying
                ? t("signin.otp.verifying")
                : t("signin.otp.verify")}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={handleChangePhoneNumber}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3 h-3" />
                {t("signin.otp.changeNumber")}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpSending}
                className="text-[#2d6a4f] font-medium hover:underline disabled:opacity-50"
              >
                {otpSending
                  ? t("signin.otp.sending")
                  : t("signin.otp.resend")}
              </button>
            </div>
          </div>
        </>
      )}

      {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
    </div>
  );

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="bg-cover bg-center"
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10">
        <Navbar />

        <div className="flex items-start justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            {!showForgotPassword ? (
              <>
                {/* ── Email / OTP Toggle ── */}
                <div className="flex justify-center mb-6">
                  <div className="flex bg-gray-100 rounded-full p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setActiveTab("email")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeTab === "email"
                          ? "bg-white text-gray-800 shadow"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t("signin.tabs.email")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("otp")}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeTab === "otp"
                          ? "bg-white text-gray-800 shadow"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {t("signin.tabs.otp")}
                    </button>
                  </div>
                </div>

                {/* ── Title ── */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#00235c]">
                    {activeTab === "email"
                      ? t("signin.title")
                      : t("signin.otp.title")}
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm">
                    {activeTab === "email"
                      ? t("signin.subtitle")
                      : t("signin.otp.subtitle")}
                  </p>
                </div>

                {/* ── Dynamic Form ── */}
                {activeTab === "email" ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email field */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                        <Mail className="w-4 h-4 text-gray-600" />
                        {t("signin.emailLabel")}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          placeholder={t("signin.emailPlaceholder")}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
                        />
                      </div>
                      {emailError && (
                        <p className="text-red-500 text-xs mt-1">
                          {emailError}
                        </p>
                      )}
                    </div>

                    {/* Password field */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                        <Lock className="w-4 h-4 text-gray-600" />
                        {t("signin.passwordLabel")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t("signin.passwordPlaceholder")}
                          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember me + Forgot password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-[#00285c] focus:ring-[#00285c]"
                        />
                        {t("signin.rememberMe")}
                      </label>
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-sm text-[#00235c] font-medium hover:underline"
                      >
                        {t("signin.forgotPassword")}
                      </button>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      className="w-full bg-[#00235c] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 cursor-pointer shadow-md mt-2"
                    >
                      {t("signin.login")}
                      <span className="text-lg">›</span>
                    </button>
                  </form>
                ) : (
                  renderOtpForm()
                )}

                {/* Footer links */}
                <div className="mt-6 text-center text-sm space-y-2">
                  <p className="text-gray-600">
                    {t("signin.footerText")}{" "}
                    <Link
                      to="/signup"
                      className="font-semibold text-gray-800 underline underline-offset-2"
                    >
                      {t("signin.footerLink")}
                    </Link>
                  </p>
                  <p>
                    <Link
                      to="/landing"
                      className="text-gray-400 hover:text-gray-600 transition text-xs"
                    >
                      {t("signin.backToHome")}
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              /* ── Forgot Password ── */
              <>
                {!resetEmailSent ? (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {t("forgotPassword.title")}
                      </h2>
                      <p className="text-gray-500 text-sm mt-1">
                        {t("forgotPassword.instructions")}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                          <Mail className="w-4 h-4 text-gray-600" />
                          {t("signin.emailLabel")}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={handleResetEmailChange}
                            placeholder={t("signin.emailPlaceholder")}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
                          />
                        </div>
                        {resetEmailError && (
                          <p className="text-red-500 text-xs mt-1">
                            {resetEmailError}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={closeForgotPassword}
                          className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm"
                        >
                          {t("forgotPassword.back")}
                        </button>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isSendingResetEmail || !!resetEmailError}
                          className="flex-1 py-3 bg-[#00235c] hover:bg-[#0d3881] text-white font-medium rounded-xl shadow-md transition text-sm disabled:opacity-50 cursor-pointer disabled:hover:bg-[#00235c]"
                        >
                          {isSendingResetEmail
                            ? t("forgotPassword.sending")
                            : t("forgotPassword.send")}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Success state */
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {t("forgotPassword.success.title")}
                    </h2>
                    <p className="text-gray-600 mb-2 text-sm">
                      {t("forgotPassword.success.message").replace(
                        /\{\{\s*email\s*\}\}|\{\s*email\s*\}/g,
                        resetEmail,
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mb-6">
                      {t("forgotPassword.success.note")}
                    </p>
                    <button
                      type="button"
                      onClick={closeForgotPassword}
                      className="w-full py-3 bg-[#00235c] hover:bg-[#0d3881] text-white font-medium rounded-xl shadow-md transition cursor-pointer disabled:hover:bg-[#00235c]"
                    >
                      {t("forgotPassword.backToLogin")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
