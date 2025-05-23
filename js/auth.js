document.addEventListener("DOMContentLoaded", () => {
  // password visibility toggle
  document.querySelectorAll(".toggle-password").forEach(function (icon) {
    icon.addEventListener("click", function () {
      const targetIds = this.getAttribute("data-targets")?.split(",") || [];
      targetIds.forEach(function (id) {
        const input = document.getElementById(id.trim());
        if (!input) return;

        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
      });

      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
    });
  });

  // show/hide ui
  const loginPage = document.querySelector(".loginPage");
  const registerPage = document.querySelector(".registerPage");
  const dashboardPage = document.querySelector(".dashboardPage");
  const addEditPage = document.querySelector(".addEditPage");
  const generatePage = document.querySelector(".generatePage");
  const aboutPage = document.querySelector(".aboutPage");
  const privacyPage = document.querySelector(".privacyPolicyPage");

  function showPage(pageToShow) {
    const pages = [loginPage, registerPage, dashboardPage, addEditPage, generatePage, aboutPage, privacyPage];
    pages.forEach(page => {
      if (page) {
        page.style.display = (page === pageToShow) ? "block" : "none";
      }
    });
  }

  const token = localStorage.getItem("bsk_token");

  if (token) {
    showPage(dashboardPage);
    renderCustomerItemsFromLocalStorage();
  } else {
    showPage(loginPage);
  }

  function logout() {
    const token = localStorage.getItem("bsk_token");
    fetch("http://api.eduvlan.ly/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ type: 2 })
    })
      .then((res) => {
        localStorage.removeItem("bsk_token");
        masterPassword = null;
        clearAddEditFields();
        showPage(loginPage);
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        localStorage.removeItem("bsk_token");
        masterPassword = null;
        clearAddEditFields();
        showPage(loginPage);
      });
  }

  document.getElementById("closeCopyModalBtn").addEventListener("click", () => {
    document.getElementById("copyModal").style.display = "none";
  });

  function clearAddEditFields() {
    document.getElementById("item_link").value = "";
    document.getElementById("item_name").value = "";
    document.getElementById("item_email").value = "";
    document.getElementById("item_pass").value = "";
    document.getElementById("item_note").value = "";
    document.getElementById("en_round").innerText = "";
    document.getElementById("success_msg").innerText = "";
    document.getElementById("failed_msg").innerText = "";
    document.getElementById("saveBtn").removeAttribute("data-edit-id");
  }

  function renderCustomerItemsFromLocalStorage() {
    const itemList = document.querySelector(".item_list");
    const storedItems = JSON.parse(localStorage.getItem("customer_items") || "[]");

    itemList.innerHTML = "";

    if (storedItems.length === 0) {
      itemList.innerHTML = "<div class='col-12 text-center text-muted'>No items found.</div>";
      return;
    }

    storedItems.forEach(item => {
      const itemElement = document.createElement("div");
      itemElement.classList.add("col-md-6", "item");
      itemElement.innerHTML = `
      <div class="p-3 border rounded shadow-sm h-100">
        <small class="text-muted d-block">Name: ${item.name}</small>
        <div class="d-grid gap-2 mt-5 mb-5">
          <button class="btn btn-sm user-btn" data-id="${item.id}" type="button"><i class="fa-solid fa-user"></i></button>
          <button class="btn btn-sm pass-btn" data-id="${item.id}" type="button"><i class="fa-solid fa-key"></i></button>
        </div>
        <div class="d-grid gap-2 mt-5 mb-5">
          <button class="btn btn-sm edit-btn" type="button" data-id="${item.id}"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm delete-btn" type="button" data-id="${item.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
      itemList.appendChild(itemElement);
    });

    //edit
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        clearAddEditFields()
        const itemId = btn.getAttribute("data-id");

        const items = JSON.parse(localStorage.getItem("customer_items") || "[]");
        const item = items.find(i => i.id == itemId);

        if (item) {
          document.getElementById("item_name").value = item.name || "";
          document.getElementById("item_link").value = item.link || "";
          document.getElementById("item_email").value = item.email || "";
          document.getElementById("item_pass").value = item.password || "";
          document.getElementById("item_note").value = item.note || "";
          document.getElementById("en_round").innerText = item.en_round || "";

          document.getElementById("saveBtn").setAttribute("data-edit-id", item.id);

          showPage(document.querySelector(".addEditPage"));
        }
      });
    });

    //delete
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-id");

        const modal = document.getElementById("confirmModal");
        modal.style.display = "flex";

        const confirmBtn = document.getElementById("confirmDeleteBtn");
        const cancelBtn = document.getElementById("cancelDeleteBtn");

        const token = localStorage.getItem("bsk_token");

        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));

        document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
          fetch(`http://api.eduvlan.ly/api/customer-item-delete/${itemId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          })
            .then(async response => {
              const data = await response.json();

              if (response.ok) {
                const items = JSON.parse(localStorage.getItem("customer_items") || "[]");
                const updatedItems = items.filter(i => i.id != itemId);
                localStorage.setItem("customer_items", JSON.stringify(updatedItems));
                renderCustomerItemsFromLocalStorage();
              } else {
                alert(data.message || "Failed to delete item.");
              }

              modal.style.display = "none";
            })
            .catch(error => {
              console.error("Delete error:", error);
              alert("An error occurred. Please try again.");
              modal.style.display = "none";
            });
        });

        document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
          modal.style.display = "none";
        });
      });
    });

    //copy email: 
    document.querySelectorAll(".user-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-id");
        const items = JSON.parse(localStorage.getItem("customer_items") || "[]");
        const item = items.find(i => i.id == itemId);

        if (!item || !item.email) {
          showCopyModal("No email found for this item.");
          return;
        }

        chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
          const masterPassword = response.password;

          if (!masterPassword) {
            alert("Session expired. Please log in again.");
            logout();
            return;
          }

          try {
            const rounds = parseInt(item.en_round) || 1;
            let decrypted = item.email;

            for (let i = 0; i < rounds; i++) {
              decrypted = bskDecrypt(decrypted, masterPassword);
            }

            navigator.clipboard.writeText(decrypted)
              .then(() => {
                showCopyModal("Username copied to clipboard!");
              })
              .catch(() => {
                showCopyModal("Failed to copy. Try again.");
              });
          } catch (e) {
            console.error("Decryption failed:", e);
            showCopyModal("Failed to decrypt username.");
          }
        });
      });
    });

    //copy pass:
    document.querySelectorAll(".pass-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const itemId = btn.getAttribute("data-id");
        const items = JSON.parse(localStorage.getItem("customer_items") || "[]");
        const item = items.find(i => i.id == itemId);

        if (!item || !item.email) {
          showCopyModal("No email found for this item.");
          return;
        }

        chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
          const masterPassword = response.password;

          if (!masterPassword) {
            alert("Session expired. Please log in again.");
            logout();
            return;
          }

          try {
            const rounds = parseInt(item.en_round) || 1;
            let decrypted = item.password;
            for (let i = 0; i < rounds; i++) {
              decrypted = bskDecrypt(decrypted, masterPassword);
            }
            navigator.clipboard.writeText(decrypted)
              .then(() => {
                showCopyModal("Password copied to clipboard!");
              })
              .catch(() => {
                showCopyModal("Failed to copy. Try again.");
              });
          } catch (e) {
            console.error("Decryption failed:", e);
            showCopyModal("Failed to decrypt password.");
          }
        });
      });
    });

  }

  function showCopyModal(message) {
    document.getElementById("copyModalMessage").innerText = message;
    document.getElementById("copyModal").style.display = "flex";
  }

  async function getCustomerItems() {
    const token = localStorage.getItem("bsk_token");
    const itemList = document.querySelector(".item_list");
    itemList.innerHTML = "";
    try {
      const response = await fetch("http://api.eduvlan.ly/api/customer-items", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && Array.isArray(data.data)) {
        localStorage.setItem("customer_items", JSON.stringify(data.data));
        renderCustomerItemsFromLocalStorage();
      } else {
        itemList.innerHTML = `<div class='col-12 text-danger text-center'>${data.message || "Failed to load items."}</div>`;
      }
    } catch (error) {
      console.error("Fetch error:", error);
      itemList.innerHTML = `<div class='col-12 text-danger text-center'>Error loading items. Please try again.</div>`;
    }
  }

  const loginButton = document.querySelector("#loginBtn");
  const logoutButton = document.querySelector("#logoutBtn");
  const goToRegister = document.querySelector("#toggleRegister");
  const registerButton = document.querySelector("#registerBtn");
  const registerError = document.getElementById("#registerError");
  const backToLoginButton = document.querySelector("#backToLoginBtn");
  const goToAddEdit = document.querySelector("#goToAddEdit");
  const encryptButton = document.querySelector("#encryptBtn");
  const decryptButton = document.querySelector("#decryptBtn");
  const saveButton = document.querySelector("#saveBtn");
  const goToGenerate = document.querySelector("#goToGenerate");

  if (loginButton) {
    loginButton.addEventListener("click", async () => {
      loginButton.disabled = true;
      loginButton.innerText = "Logging in...";
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPass").value;
      const loginError = document.getElementById("loginError");

      const payload = {
        email: email,
        password: password,
        type: 2
      };

      try {
        const response = await fetch("http://api.eduvlan.ly/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          loginButton.disabled = false;
          loginButton.innerText = "Login";
          chrome.runtime.sendMessage({
            type: "SET_MASTER_PASSWORD",
            payload: password
          }, (response) => {
            if (response && response.success) {
              localStorage.setItem("bsk_token", data.data.token);
              document.getElementById("loginPass").value = "";
              getCustomerItems();
              showPage(dashboardPage);
            } else {
              alert("Unable to store master password. Please try again.");
            }
          });
        } else {
          loginButton.disabled = false;
          loginButton.innerText = "Login";
          loginError.style.display = "block";
          loginError.innerText = data.message || "Invalid credentials.";
        }
      } catch (error) {
        console.error("Login error:", error);
        loginButton.disabled = false;
        loginButton.innerText = "Login";
        loginError.style.display = "block";
        loginError.innerText = "An error occurred. Please try again.";
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
    });
  }

  if (goToRegister) {
    goToRegister.addEventListener("click", () => {
      showPage(registerPage);
    });
  }

  if (registerButton) {
    registerButton.addEventListener("click", async () => {
      registerButton.disabled = true;
      registerButton.innerText = "Registering...";
      const email = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPass").value;
      const confirmPassword = document.getElementById("registerPassConfirm").value;
      const registerEmailError = document.getElementById("registerEmailErr");
      const registerPassError = document.getElementById("registerPassErr");
      const registerPassConfirmError = document.getElementById("registerPassConfirmErr");

      registerEmailError.innerText = "";
      registerPassError.innerText = "";
      registerPassConfirmError.innerText = "";

      const payload = {
        "email": email,
        "password": password,
        "password_confirmation": confirmPassword,
        "type": 2
      };
      try {
        const response = await fetch("http://api.eduvlan.ly/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          showPage(loginPage);
          registerButton.disabled = false;
          registerButton.innerText = "Register";
          alert("Registration successful! Please Login!.");
          registerEmailError.innerText = "";
          registerPassError.innerText = "";
          registerPassConfirmError.innerText = "";

        } else {
          if (data.errors) {
            if (data.errors.email) {
              registerEmailError.innerText = data.errors.email.join(" ");
              registerEmailError.style.display = "block";
            }
            if (data.errors.password) {
              registerPassError.innerText = data.errors.password.join(" ");
              registerPassError.style.display = "block";
            }
            if (data.errors.password_confirmation) {
              registerPassConfirmError.innerText = data.errors.password_confirmation.join(" ");
              registerPassConfirmError.style.display = "block";
            }
          } else {
            registerError.innerText = data.message || "Registration failed.";
            registerError.style.display = "block";
          }

          registerButton.disabled = false;
          registerButton.innerText = "Register";
        }
      }
      catch (error) {
        console.error("Registration error:", error);
        registerButton.disabled = false;
        registerButton.innerText = "Register";
      }
    });
  }

  if (backToLoginButton) {
    backToLoginButton.addEventListener("click", () => {
      showPage(loginPage);
    });
  }

  if (goToAddEdit) {
    goToAddEdit.addEventListener("click", () => {
      clearAddEditFields();
      showPage(addEditPage);
    });
  }

  if (goToGenerate) {
    goToGenerate.addEventListener("click", () => {
      showPage(generatePage);
    });
  }

  // generate passwords: 
  const lengthInput = document.getElementById('lengthInput');
  const lengthSlider = document.getElementById('lengthSlider');
  const generateBtn = document.getElementById('generateBtn');
  const generatedPassword = document.getElementById('generatedPassword');
  const outputSection = document.getElementById('outputSection');
  const copyBtn = document.getElementById('copyBtn');


  lengthSlider.addEventListener('input', () => {
    lengthInput.value = lengthSlider.value;
  });

  lengthInput.addEventListener('input', () => {
    let val = parseInt(lengthInput.value);

    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;

    lengthInput.value = val;
    lengthSlider.value = val;
  });

  function generatePassword(length) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const chars = upper + lower + numbers;

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }

  generateBtn.addEventListener('click', () => {
    const length = parseInt(document.getElementById('lengthInput').value);
    if (isNaN(length) || length < 1 || length > 99) return;

    const newPassword = generatePassword(length);
    generatedPassword.textContent = newPassword;
    outputSection.classList.remove('d-none');
    copyBtn.disabled = false;
  });
  
   const passCopyModal = document.getElementById('passCopyModal');
    const passCopyModalMessage = document.getElementById('passCopyModalMessage');
    const passCloseCopyModalBtn = document.getElementById('passCloseCopyModalBtn');
    
    copyBtn.addEventListener('click', () => {
        const password = generatedPassword.textContent;

        if (!password || password.includes('•')) return;

        navigator.clipboard.writeText(password).then(() => {
          
            passCopyModalMessage.textContent = "Password copied to clipboard!";
            passCopyModal.style.display = 'flex';
            copyBtn.disabled = true;
        }).catch(err => {
            passCopyModalMessage.textContent = "Failed to copy. Try again.";
            passCopyModal.style.display = 'flex';
        });
    });
    
    passCloseCopyModalBtn.addEventListener('click', () => {
        passCopyModal.style.display = 'none';
    });


  if (encryptButton) {
    encryptButton.addEventListener("click", () => {
      const itemLink = document.getElementById("item_link").value;
      const itemEmail = document.getElementById("item_email").value;
      const itemPassword = document.getElementById("item_pass").value;
      const itemNote = document.getElementById("item_note").value;
      const enRoundText = document.getElementById("en_round").innerText;
      let en_round = parseInt(enRoundText) || 0;

      en_round += 1;

      chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
        const masterPassword = response.password;

        if (!masterPassword) {
          alert("Session expired. Please log in again.");
          logout();
        }

        const encryptedLink = bskEncrypt(itemLink, masterPassword);
        const encryptedEmail = bskEncrypt(itemEmail, masterPassword);
        const encryptedPass = bskEncrypt(itemPassword, masterPassword);
        const encryptedNote = bskEncrypt(itemNote, masterPassword);

        document.getElementById("item_link").value = encryptedLink;
        document.getElementById("item_email").value = encryptedEmail;
        document.getElementById("item_pass").value = encryptedPass;
        document.getElementById("item_note").value = encryptedNote;
        document.getElementById("en_round").innerText = en_round;
      });
    });
  }

  if (decryptButton) {
    decryptButton.addEventListener("click", () => {
      const itemLink = document.getElementById("item_link").value;
      const itemEmail = document.getElementById("item_email").value;
      const itemPassword = document.getElementById("item_pass").value;
      const itemNote = document.getElementById("item_note").value;
      const enRoundText = document.getElementById("en_round").innerText;
      let en_round = parseInt(enRoundText) || 0;

      en_round -= 1;

      if (en_round < 0) {
        document.getElementById("failed_msg").innerText = "Already decrypted. Can't decrypt further.";
        return;
      }

      chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
        const masterPassword = response.password;

        if (!masterPassword) {
          alert("Session expired. Please log in again.");
          logout();
        }

        const decryptedLink = bskDecrypt(itemLink, masterPassword);
        const decryptedEmail = bskDecrypt(itemEmail, masterPassword);
        const decryptedPass = bskDecrypt(itemPassword, masterPassword);
        const decryptedNote = bskDecrypt(itemNote, masterPassword);

        document.getElementById("item_link").value = decryptedLink;
        document.getElementById("item_email").value = decryptedEmail;
        document.getElementById("item_pass").value = decryptedPass;
        document.getElementById("item_note").value = decryptedNote;
        document.getElementById("en_round").innerText = en_round;
      });
    });
  }

  saveButton.addEventListener("click", () => {
    const itemName = document.getElementById("item_name").value;
    const itemLink = document.getElementById("item_link").value;
    const itemEmail = document.getElementById("item_email").value;
    const itemPassword = document.getElementById("item_pass").value;
    const itemNote = document.getElementById("item_note").value;
    const enRoundText = document.getElementById("en_round").innerText;
    const en_round = parseInt(enRoundText) || 0;
    const successMsg = document.getElementById("success_msg");
    const failedMsg = document.getElementById("failed_msg");

    if (en_round <= 0) {
      document.getElementById("failed_msg").innerText = "Please encrypt the data before saving.";
      return;
    }

    const payload = {
      name: itemName,
      link: itemLink,
      email: itemEmail,
      password: itemPassword,
      note: itemNote,
      en_round: en_round
    };

    const token = localStorage.getItem("bsk_token");
    const editId = saveButton.getAttribute("data-edit-id");

    const url = editId
      ? `http://api.eduvlan.ly/api/customer-item-update/${editId}`
      : "http://api.eduvlan.ly/api/customer-item-save";

    const method = editId ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(async (response) => {
        const data = await response.json();

        if (response.ok) {
          clearAddEditFields();
          successMsg.innerText = data.message || (editId ? "Item updated successfully." : "Item saved successfully.");
          getCustomerItems();
        } else {
          failedMsg.innerText = data.message || "Failed to save item.";
        }
      })
      .catch((error) => {
        document.getElementById("success_msg").innerText = "";
        failedMsg.innerText = "Unexpected error. Please try again.";
      });
  });


  //footer
  document.querySelectorAll(".home-link").forEach((homeButton) => {
    homeButton.addEventListener("click", (e) => {
      e.preventDefault();
      const token = localStorage.getItem("bsk_token");
      if (token) {
        showPage(dashboardPage);
      } else {
        showPage(loginPage);
      }
    });
  });

  document.querySelectorAll(".about-link").forEach((aboutButton) => {
    aboutButton.addEventListener("click", (e) => {
      e.preventDefault();
      showPage(aboutPage);
    });
  });

  document.querySelectorAll(".privacy-link").forEach((aboutButton) => {
    aboutButton.addEventListener("click", (e) => {
      e.preventDefault();
      showPage(privacyPage);
    });
  });
});

