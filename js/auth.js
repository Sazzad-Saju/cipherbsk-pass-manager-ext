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
    logoutWithFirebase()
      .then(() => {
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
      if (item.id && item.id !== 'null') {
        const itemElement = document.createElement("div");
        itemElement.classList.add("col-md-6", "item");
        itemElement.innerHTML = `
          <div class="p-3 border rounded shadow-sm h-100">
            <small class="text-muted d-block">Name: ${item.name || ''}</small>
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
      }
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

        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));

        document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
          const userId = localStorage.getItem("bsk_token");
          try {
            await deleteItem(userId, itemId);
            const items = JSON.parse(localStorage.getItem("customer_items") || "[]");
            const updatedItems = items.filter(i => i.id != itemId);
            localStorage.setItem("customer_items", JSON.stringify(updatedItems));
            renderCustomerItemsFromLocalStorage();
            modal.style.display = "none";
          } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete item. Please try again.");
            modal.style.display = "none";
          }
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
    const userId = localStorage.getItem("bsk_token");
    const itemList = document.querySelector(".item_list");
    itemList.innerHTML = "";
    
    try {
      const items = await getItems(userId);
      localStorage.setItem("customer_items", JSON.stringify(items));
      renderCustomerItemsFromLocalStorage();
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

      try {
        const user = await loginWithFirebase(email, password);
        loginButton.disabled = false;
        loginButton.innerText = "Login";
        
        chrome.runtime.sendMessage({
          type: "SET_MASTER_PASSWORD",
          payload: password
        }, (response) => {
          if (response && response.success) {
            localStorage.setItem("bsk_token", user.uid);
            document.getElementById("loginPass").value = "";
            getCustomerItems();
            showPage(dashboardPage);
          } else {
            alert("Unable to store master password. Please try again.");
          }
        });
      } catch (error) {
        console.error("Login error:", error);
        loginButton.disabled = false;
        loginButton.innerText = "Login";
        loginError.style.display = "block";
        loginError.innerText = error.message || "Invalid credentials.";
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

      if (password !== confirmPassword) {
        registerPassConfirmError.innerText = "Passwords do not match";
        registerButton.disabled = false;
        registerButton.innerText = "Register";
        return;
      }

      try {
        await registerWithFirebase(email, password);
        registerButton.disabled = false;
        registerButton.innerText = "Register";
        
        const registerModal = document.getElementById('registerModal');
        const registerModalMessage = document.getElementById('registerModalMessage');
        const registerCloseModalBtn = document.getElementById('registerCloseModalBtn');
        
        registerModalMessage.textContent = "Registration successful! Please login.";
        registerModal.style.display = 'flex';
        
        registerCloseModalBtn.addEventListener('click', () => {
            registerModal.style.display = 'none';
            showPage(loginPage);
        });
      } catch (error) {
        console.error("Registration error:", error);
        registerButton.disabled = false;
        registerButton.innerText = "Register";
        
        if (error.code === 'auth/email-already-in-use') {
          registerEmailError.innerText = "Email already in use";
        } else if (error.code === 'auth/weak-password') {
          registerPassError.innerText = "Password is too weak";
        } else {
          registerEmailError.innerText = error.message;
        }
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
    encryptButton.addEventListener("click", async () => {
      const itemLink = document.getElementById("item_link").value;
      const itemEmail = document.getElementById("item_email").value;
      const itemPassword = document.getElementById("item_pass").value;
      const itemNote = document.getElementById("item_note").value;
      const enRoundText = document.getElementById("en_round").innerText;
      let en_round = parseInt(enRoundText) || 0;
      const failedMsg = document.getElementById("failed_msg");

      en_round += 1;

      // First check session status
      chrome.runtime.sendMessage({ type: "CHECK_SESSION" }, async (sessionResponse) => {
        if (!sessionResponse.valid) {
          failedMsg.innerText = "Session expired. Please log in again.";
          setTimeout(() => {
            logout();
          }, 1500);
          return;
        }

        // If session was restored, show a notification
        if (sessionResponse.restored) {
          failedMsg.innerText = "Session restored automatically.";
          setTimeout(() => {
            failedMsg.innerText = "";
          }, 2000);
        }

        // Get master password after confirming session is valid
        chrome.runtime.sendMessage({ type: "GET_MASTER_PASSWORD" }, (response) => {
          const masterPassword = response.password;

          if (!masterPassword) {
            failedMsg.innerText = "Unable to access encryption key. Please log in again.";
            setTimeout(() => {
              logout();
            }, 1500);
            return;
          }

          try {
            // Split encryption into chunks for large inputs
            const chunkSize = 1000; // Adjust this value based on testing
            
            const encryptChunk = (text) => {
              if (!text) return "";
              const chunks = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
              return chunks.map(chunk => bskEncrypt(chunk, masterPassword)).join('||');
            };

            const encryptedLink = encryptChunk(itemLink);
            const encryptedEmail = encryptChunk(itemEmail);
            const encryptedPass = encryptChunk(itemPassword);
            const encryptedNote = encryptChunk(itemNote);

            document.getElementById("item_link").value = encryptedLink;
            document.getElementById("item_email").value = encryptedEmail;
            document.getElementById("item_pass").value = encryptedPass;
            document.getElementById("item_note").value = encryptedNote;
            document.getElementById("en_round").innerText = en_round;
            failedMsg.innerText = "";
          } catch (error) {
            console.error("Encryption error:", error);
            failedMsg.innerText = error.message;
            if (error.message.includes("Please log in again")) {
              setTimeout(() => {
                logout();
              }, 1500);
            }
          }
        });
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

  saveButton.addEventListener("click", async () => {
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
      failedMsg.innerText = "Please encrypt the data before saving.";
      return;
    }

    const userId = localStorage.getItem("bsk_token");
    const editId = saveButton.getAttribute("data-edit-id");

    const itemData = {
      id: editId || null,
      name: itemName,
      link: itemLink,
      email: itemEmail,
      password: itemPassword,
      note: itemNote,
      en_round: en_round
    };

    try {
      await saveItem(userId, itemData);
      clearAddEditFields();
      successMsg.innerText = editId ? "Item updated successfully." : "Item saved successfully.";
      getCustomerItems();
    } catch (error) {
      console.error("Save error:", error);
      failedMsg.innerText = "Failed to save item. Please try again.";
    }
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

