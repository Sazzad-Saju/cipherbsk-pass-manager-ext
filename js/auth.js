
document.addEventListener("DOMContentLoaded", () => {
    // password visibility toggle
    const passwordInput = document.getElementById("pass");
    const passwordConfirmInput = document.getElementById("pass_confirm");
    const togglePassword = document.getElementById("togglePassword");
    

    togglePassword.addEventListener("click", function () {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        const isPasswordConfirm = passwordConfirmInput.type === "password";
        passwordConfirmInput.type = isPasswordConfirm ? "text" : "password";
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });
    
    // show/hide ui
    chrome.storage.local.get(["user", "isLoggedIn"], (result) => {
      const user = result.user;
      const isLoggedIn = result.isLoggedIn;

      const registerView = document.querySelector(".proj-body.register");
      const loginView = document.querySelector(".proj-body.login");
      const dashboardView = document.querySelector(".proj-body.dashboard");

      // Hide all views initially
      registerView?.classList.add("d-none");
      loginView?.classList.add("d-none");
      dashboardView?.classList.add("d-none");

      // Decide what to show
      if (!user) {
        // No user exists, show register
        registerView?.classList.remove("d-none");
      } else if (!isLoggedIn) {
        // User exists but not logged in
        loginView?.classList.remove("d-none");
      } else {
        // User is logged in
        dashboardView?.classList.remove("d-none");
      }
    });
  });