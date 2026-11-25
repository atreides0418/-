const signupPage = document.querySelector(".signup-page");
const accountStep = document.querySelector("#account-step");
const termsStep = document.querySelector("#terms-step");
const signupForm = document.querySelector("#signup-form");
const completeButton = document.querySelector("#complete-signup");
const termsError = document.querySelector("#terms-error");
const allConsent = document.querySelector("#agree-all");
const consentItems = [...document.querySelectorAll(".consent-item")];
const requiredConsents = consentItems.filter((item) => item.dataset.required === "true");
const dialog = document.querySelector("#document-dialog");
const dialogTitle = document.querySelector("#document-title");
const dialogContent = document.querySelector("#document-content");
const dialogLink = document.querySelector("#document-link");

// 비밀번호는 화면 전환 동안에만 메모리에 두며 브라우저 저장소에 기록하지 않습니다.
const signupData = { email: "", nickname: "", password: "" };

const fields = {
  email: {
    input: document.querySelector("#email"), error: document.querySelector("#email-error"),
    validate(value) {
      if (!value.trim()) return "이메일 주소를 입력해 주세요.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? "" : "올바른 이메일 주소를 입력해 주세요.";
    },
  },
  nickname: {
    input: document.querySelector("#nickname"), error: document.querySelector("#nickname-error"),
    validate(value) {
      const nickname = value.trim();
      if (!nickname) return "닉네임을 입력해 주세요.";
      return nickname.length >= 2 && nickname.length <= 20 ? "" : "닉네임은 2~20자로 입력해 주세요.";
    },
  },
  password: {
    input: document.querySelector("#password"), error: document.querySelector("#password-error"),
    validate(value) {
      if (!value) return "비밀번호를 입력해 주세요.";
      return value.length >= 8 ? "" : "비밀번호는 8자 이상으로 입력해 주세요.";
    },
  },
};

const documentSummaries = {
  terms: {
    title: "서비스 이용약관", href: "./terms.html",
    sections: [
      ["문서 상태", "본 문서는 출시 전 법률·운영 검토를 위한 초안입니다. 서비스 운영자 정보, 시행일, 신고·분쟁 처리 기준을 확정한 뒤 정식 약관으로 교체해야 합니다."],
      ["검토 범위", "회원가입과 계정 관리, 손님·식당 운영자 계정, 게시물·댓글·평점, 저작권 이용허락, 팔로우·알림·비공개 메시지, 신고·삭제, 이용 제한·탈퇴, 서비스 변경과 약관 개정을 다룹니다."],
    ],
  },
  collection: {
    title: "개인정보 수집·이용 동의", href: "./privacy.html#collection",
    sections: [
      ["수집 항목", "이메일 주소, 닉네임, 비밀번호(서버에서는 복원 불가능한 해시값만 저장)를 수집합니다."],
      ["이용 목적과 보유 기간", "회원 식별, 계정 관리, 서비스 제공 및 보안에 이용합니다. 구체적인 보유 기간·법정 보관 항목은 실제 운영 정책과 법률 검토 후 확정해야 합니다."],
      ["거부 권리", "동의를 거부할 수 있으나, 필수 정보 처리에 동의하지 않으면 회원가입을 진행할 수 없습니다."],
    ],
  },
};

function showFieldError(field, message) {
  field.error.textContent = message;
  field.input.setAttribute("aria-invalid", String(Boolean(message)));
}

function validateField(field) {
  const message = field.validate(field.input.value);
  showFieldError(field, message);
  return !message;
}

function showStep(step) {
  const termsVisible = step === "terms";
  accountStep.hidden = termsVisible;
  termsStep.hidden = !termsVisible;
  history.replaceState({ step }, "", step === "terms" ? "#terms" : "#signup");
}

function updateConsentState() {
  const checkedCount = consentItems.filter((item) => item.checked).length;
  allConsent.checked = checkedCount === consentItems.length;
  allConsent.indeterminate = checkedCount > 0 && checkedCount < consentItems.length;
  completeButton.disabled = !requiredConsents.every((item) => item.checked);
}

function openDocument(kind) {
  const documentInfo = documentSummaries[kind];
  if (!documentInfo) return;
  dialogTitle.textContent = documentInfo.title;
  dialogContent.replaceChildren(...documentInfo.sections.map(([heading, text]) => {
    const section = document.createElement("section");
    const title = document.createElement("h3");
    const paragraph = document.createElement("p");
    title.textContent = heading;
    paragraph.textContent = text;
    section.append(title, paragraph);
    return section;
  }));
  dialogLink.href = documentInfo.href;
  dialogLink.textContent = `${documentInfo.title} 전체 보기`;
  dialog.showModal();
}

function consentRecords() {
  const now = new Date().toISOString();
  return [
    { type: "service_terms", version: "draft-2026-11", agreed: document.querySelector("#agree-terms").checked, agreedAt: now, source: "guest_signup" },
    { type: "privacy_collection", version: "draft-2026-11", agreed: document.querySelector("#agree-privacy-collection").checked, agreedAt: now, source: "guest_signup" },
  ];
}

async function submitSignup() {
  const endpoint = signupPage.dataset.signupEndpoint;
  if (!endpoint) {
    termsError.textContent = "가입 서버가 아직 연결되지 않았습니다. 회원정보와 동의 상태는 이 화면에 그대로 유지됩니다.";
    return;
  }
  completeButton.disabled = true;
  completeButton.textContent = "가입 처리 중…";
  termsError.textContent = "";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: signupData.email, nickname: signupData.nickname, password: signupData.password, consents: consentRecords() }),
    });
    if (!response.ok) throw new Error("signup_failed");
    const result = await response.json();
    if (typeof result.redirectUrl !== "string" || !result.redirectUrl.startsWith("/")) {
      throw new Error("missing_signup_redirect");
    }
    window.location.assign(result.redirectUrl);
  } catch {
    termsError.textContent = "가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    updateConsentState();
  } finally {
    completeButton.textContent = "동의하고 가입하기";
  }
}

Object.values(fields).forEach((field) => {
  field.input.addEventListener("blur", () => validateField(field));
  field.input.addEventListener("input", () => { if (field.error.textContent) validateField(field); });
});
signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const invalidField = Object.values(fields).find((field) => !validateField(field));
  if (invalidField) return invalidField.input.focus();
  signupData.email = fields.email.input.value.trim();
  signupData.nickname = fields.nickname.input.value.trim();
  signupData.password = fields.password.input.value;
  showStep("terms");
});
document.querySelector("#back-to-account").addEventListener("click", () => showStep("account"));
allConsent.addEventListener("change", () => { consentItems.forEach((item) => { item.checked = allConsent.checked; }); updateConsentState(); });
consentItems.forEach((item) => item.addEventListener("change", updateConsentState));
document.querySelectorAll(".document-button").forEach((button) => button.addEventListener("click", () => openDocument(button.dataset.document)));
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
completeButton.addEventListener("click", submitSignup);
updateConsentState();
