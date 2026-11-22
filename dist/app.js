const form = document.querySelector("#signup-form");

const fields = {
  contact: {
    input: document.querySelector("#contact"),
    error: document.querySelector("#contact-error"),
    validate(value) {
      const trimmed = value.trim();

      if (!trimmed) return "휴대폰 번호 또는 이메일 주소를 입력해 주세요.";

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const phoneDigits = trimmed.replace(/[\s()-]/g, "");
      const phonePattern = /^(?:\+82|0)1[0-9]\d{7,8}$/;

      if (!emailPattern.test(trimmed) && !phonePattern.test(phoneDigits)) {
        return "올바른 휴대폰 번호 또는 이메일 주소를 입력해 주세요.";
      }

      return "";
    },
  },
  name: {
    input: document.querySelector("#name"),
    error: document.querySelector("#name-error"),
    validate(value) {
      return value.trim() ? "" : "성명을 입력해 주세요.";
    },
  },
  username: {
    input: document.querySelector("#username"),
    error: document.querySelector("#username-error"),
    validate(value) {
      return value.trim() ? "" : "사용자 이름을 입력해 주세요.";
    },
  },
  password: {
    input: document.querySelector("#password"),
    error: document.querySelector("#password-error"),
    validate(value) {
      return value ? "" : "비밀번호를 입력해 주세요.";
    },
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

Object.values(fields).forEach((field) => {
  field.input.addEventListener("blur", () => validateField(field));
  field.input.addEventListener("input", () => {
    if (field.error.textContent) validateField(field);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const invalidField = Object.values(fields).find((field) => !validateField(field));
  invalidField?.input.focus();

  // 가입 API가 연결되기 전까지는 유효성 검사만 수행합니다.
});
