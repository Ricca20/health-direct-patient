import { useState, useEffect, useContext } from "react";
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
import api from "../utils/api";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const images = [background, bg_1, bg_2, bg_3, background, background];

function SignUp() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("email"); // "email" | "otp"

  // Email/Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState("send"); // "send" | "verify"
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
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

  // Email/Password validation
  const validatePassword = (pwd) => {
    if (pwd.length < 8) return t("signup.passwordLengthError");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return t("signup.passwordSymbolError");
    if (!/\d/.test(pwd)) return t("signup.passwordNumberError");
    if (!/[A-Z]/.test(pwd)) return t("signup.passwordUppercaseError");
    if (!/[a-z]/.test(pwd)) return t("signup.passwordLowercaseError");
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(emailRegex.test(value) ? "" : t("signup.emailError"));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    if (confirmPassword) {
      setConfirmPasswordError(
        value !== confirmPassword ? t("signup.passwordMismatchError") : "",
      );
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(
      value !== password ? t("signup.passwordMismatchError") : "",
    );
  };

  const isEmailFormValid = () =>
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    email &&
    password &&
    confirmPassword;

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isEmailFormValid()) {
      toast.error(t("signup.formError"));
      return;
    }
    setIsLoading(true);
    try {
      const language = i18n.language?.split(/[-_]/)[0] || "en";
      await api.post("/auth/signup", { email, password, language });
      toast.success(t("signup.signupSuccess"));
      setTimeout(() => navigate("/signin"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || t("signup.signupError"));
    } finally {
      setIsLoading(false);
    }
  };

  // OTP handlers
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) {
      setOtpError(t("signup.otp.phoneRequired"));
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setOtpError(t("signup.otp.invalidPhone"));
      return;
    }
    setOtpSending(true);
    setOtpError("");
    try {
      await api.post("/auth/send-otp", { phoneNumber });
      toast.success(t("signup.otp.otpSent"));
      setOtpStep("verify");
      setOtpCode("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || t("signup.otp.sendFailed");
      toast.error(errorMsg);
      setOtpError(errorMsg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setOtpError(t("signup.otp.otpRequired"));
      return;
    }
    if (!/^\d{4,6}$/.test(otpCode)) {
      setOtpError(t("signup.otp.invalidOtp"));
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const language = i18n.language?.split(/[-_]/)[0] || "en";
      const response = await api.post("/auth/signup-otp", {
        phoneNumber,
        otp: otpCode,
        language,
      });
      const { accessToken, refreshToken, user } = response.data;
      if (accessToken && refreshToken && user) {
        login(accessToken, refreshToken, user);
        toast.success(t("signup.otp.signupSuccess"));
      } else {
        toast.success(t("signup.otp.signupSuccess"));
        setTimeout(() => navigate("/signin"), 1000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        t("signup.otp.verifyFailed");
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

  const renderOtpForm = () => (
    <div className="space-y-5">
      {/* Phone Number Field */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
          <Phone className="w-4 h-4 text-gray-600" />
          {t("signup.otp.phoneLabel")}
          <span className="text-red-500">*</span>
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
            placeholder={t("signup.otp.phonePlaceholder")}
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
            t("signup.otp.sending")
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("signup.otp.sendOtp")}
            </>
          )}
        </button>
      ) : (
        <>
          {/* OTP Code Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
              <KeyRound className="w-4 h-4 text-gray-600" />
              {t("signup.otp.otpLabel")}
              <span className="text-red-500">*</span>
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
                placeholder={t("signup.otp.otpPlaceholder")}
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
                ? t("signup.otp.verifying")
                : t("signup.otp.register")}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={handleChangePhoneNumber}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3 h-3" />
                {t("signup.otp.changeNumber")}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpSending}
                className="text-[#2d6a4f] font-medium hover:underline disabled:opacity-50"
              >
                {otpSending
                  ? t("signup.otp.sending")
                  : t("signup.otp.resend")}
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

        <div className="flex items-start justify-center min-h-[calc(100vh-80px)] px-4 pt-10">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
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
                  {t("signup.tabs.email")}
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
                  {t("signup.tabs.otp")}
                </button>
              </div>
            </div>

            {/* ── Title ── */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-[#00235c]">
                {activeTab === "email"
                  ? t("signup.createAccount")
                  : t("signup.otp.title")}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                {activeTab === "email"
                  ? t("signup.subtitle")
                  : t("signup.otp.subtitle")}
              </p>
            </div>

            {activeTab === "email" ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
                    <Mail className="w-4 h-4 text-gray-600" />
                    {t("signup.emailLabel")}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder={t("signup.emailPlaceholder")}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
                    />
                  </div>
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>

                {/* Password + Confirm Password side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                      <Lock className="w-4 h-4 text-gray-600" />
                      {t("signup.passwordLabel")}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder={
                          t("signup.passwordPlaceholder") || "••••••••"
                        }
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
                    {passwordError && (
                      <p className="text-red-500 text-xs mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5 uppercase tracking-wide text-xs">
                      <Lock className="w-4 h-4 text-gray-600" />
                      {t("signup.confirmPasswordLabel")}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder={
                          t("signup.confirmPasswordPlaceholder") || "••••••••"
                        }
                        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00285c]/30 focus:border-[#00285c] transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {confirmPasswordError && (
                      <p className="text-red-500 text-xs mt-1">
                        {confirmPasswordError}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isEmailFormValid() || isLoading}
                  className="w-full bg-[#00235c] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-1 shadow-md mt-2"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      {t("signup.creatingAccount")}
                    </>
                  ) : (
                    <>
                      {t("signup.signUpButton") || "Register"}
                      <span className="text-lg">›</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              renderOtpForm()
            )}

            {/* Footer links */}
            <div className="mt-6 text-center text-sm space-y-2">
              <p className="text-gray-600">
                {t("signup.alreadyHaveAccount") || "Already have an account?"}{" "}
                <Link
                  to="/signin"
                  className="font-semibold text-gray-800 underline underline-offset-2"
                >
                  {t("signup.loginLink") || "Sign In"}
                </Link>
              </p>
              <p>
                <Link
                  to="/landing"
                  className="text-gray-400 hover:text-gray-600 transition text-xs"
                >
                  {t("signin.backToHome") || "Back to Home"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
