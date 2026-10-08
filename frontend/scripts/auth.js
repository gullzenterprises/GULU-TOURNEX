(() => {
  "use strict";

  const authScript = document.currentScript;
  const frontendBase = new URL("./", authScript?.src || window.location.href);
  const pageUrl = (relativePath) => new URL(relativePath, frontendBase);
  const loginUrl = pageUrl("pages/account/login.html");
  const signupUrl = pageUrl("pages/account/signup.html");
  const usernameUrl = pageUrl("pages/account/choose-username.html");
  const profileUrl = pageUrl("pages/account/profile.html");
  const statusBox = document.querySelector("[data-auth-status]");
  const toast = document.getElementById("demo-toast");
  const config = window.GULU_AUTH_CONFIG || {};
  const providerSdk = window.supabase;

  function showMessage(message, tone = "info") {
    if (statusBox) {
      statusBox.textContent = message;
      statusBox.dataset.tone = tone;
      statusBox.hidden = false;
      return;
    }
    if (toast) {
      toast.textContent = message;
      toast.hidden = false;
    }
  }

  function configReady() {
    const url = String(config.supabaseUrl || "");
    const key = String(config.publishableKey || "");
    try {
      const parsed = new URL(url);
      return ["https:", "http:"].includes(parsed.protocol)
        && !/YOUR_PROJECT|REPLACE_ME/i.test(url)
        && key.length > 20
        && !/YOUR_|REPLACE_ME|service_role|sb_secret_/i.test(key);
    } catch {
      return false;
    }
  }

  if (!configReady() || !providerSdk?.createClient) {
    const message = !configReady()
      ? "Login is not activated yet. Add your Supabase project URL and publishable key to frontend/scripts/auth-config.js."
      : "The authentication library could not load. Check your internet connection and reload.";
    showMessage(message, "error");
    document.querySelectorAll("[data-auth-form], [data-auth-provider], [data-username-form]").forEach((control) => {
      control.addEventListener(control.matches("form") ? "submit" : "click", (event) => {
        event.preventDefault();
        showMessage(message, "error");
      });
    });
    return;
  }

  const supabase = providerSdk.createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  const loginPath = loginUrl.pathname;
  const signupPath = signupUrl.pathname;
  const usernamePath = usernameUrl.pathname;
  const profilePath = profileUrl.pathname;
  const currentPath = window.location.pathname;

  function setButtonBusy(button, busy, busyText = "Please wait…") {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  }

  function friendlyError(error, context = "") {
    const raw = String(error?.message || "");
    const lower = raw.toLowerCase();
    if (lower.includes("username_taken") || error?.code === "23505") return "That username is already taken. Try another.";
    if (lower.includes("username_invalid")) return "Choose 3–20 characters using lowercase letters, numbers, or underscores.";
    if (lower.includes("username_already_set")) return "Your username has already been set.";
    if (lower.includes("provider is not enabled") || lower.includes("unsupported provider")) return "That sign-in provider is not enabled in the Supabase dashboard yet.";
    if (lower.includes("email not confirmed")) return "Confirm your email from the message we sent, then log in.";
    if (lower.includes("invalid login credentials")) return "Email or password did not match. Check them and try again.";
    if (lower.includes("password should be at least")) return "Use a longer password that meets the project's password policy.";
    if (context === "profile") return "We could not load your profile. Confirm the database migration has been run in Supabase.";
    return raw || "Something went wrong. Please try again.";
  }

  function handleError(error, context = "") {
    console.error("GULU TOURNEX auth error:", error);
    showMessage(friendlyError(error, context), "error");
  }

  function toggleAccountNavigation(user, profile) {
    document.querySelectorAll("[data-auth-guest]").forEach((item) => { item.hidden = Boolean(user); });
    document.querySelectorAll("[data-auth-user]").forEach((item) => { item.hidden = !user; });
    document.querySelectorAll("[data-auth-username]").forEach((item) => {
      item.textContent = profile?.username ? "@" + profile.username : "My profile";
    });
    document.querySelectorAll("[data-auth-email]").forEach((item) => {
      item.textContent = user?.email || "Email not shared by provider";
    });
    document.querySelectorAll("[data-auth-display-name]").forEach((item) => {
      item.textContent = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "GULU TOURNEX player";
    });
  }

  async function getProfile(user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  function go(url) {
    if (window.location.pathname !== url.pathname) window.location.replace(url.href);
  }

  function paintProfile(user, profile) {
    const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || "GULU TOURNEX player";
    document.querySelectorAll("[data-profile-name]").forEach((el) => { el.textContent = name; });
    document.querySelectorAll("[data-profile-username]").forEach((el) => { el.textContent = profile?.username || "Choose your username"; });
    const usernameEditor = document.querySelector("[data-profile-username-input]");
    if (usernameEditor && profile?.username) usernameEditor.value = profile.username;
    document.querySelectorAll("[data-profile-email]").forEach((el) => { el.textContent = user.email || "Email not shared by provider"; });
    const avatar = document.querySelector("[data-profile-avatar]");
    if (avatar) {
      const imageUrl = profile?.avatar_url;
      if (imageUrl && /^https:\/\//i.test(imageUrl)) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        avatar.replaceChildren(image);
      } else {
        avatar.textContent = name.trim().slice(0, 1).toUpperCase() || "G";
      }
    }
  }

  async function synchronizeSession(session) {
    const user = session?.user || null;
    toggleAccountNavigation(user, null);

    if (!user) {
      if (currentPath === profilePath || currentPath === usernamePath) go(loginUrl);
      return;
    }

    let profile;
    try {
      profile = await getProfile(user);
    } catch (error) {
      handleError(error, "profile");
      return;
    }

    toggleAccountNavigation(user, profile);
    paintProfile(user, profile);

    if (!profile?.username) {
      if (currentPath !== usernamePath) go(usernameUrl);
      return;
    }

    if (currentPath === usernamePath || currentPath === loginPath || currentPath === signupPath) {
      go(profileUrl);
    }
  }

  async function afterAuthentication(user) {
    if (!user) {
      showMessage("You are signed in, but we could not read the account. Reload and try again.", "error");
      return;
    }
    try {
      const profile = await getProfile(user);
      if (!profile?.username) go(usernameUrl);
      else go(profileUrl);
    } catch (error) {
      handleError(error, "profile");
    }
  }

  const emailForm = document.querySelector("[data-auth-form]");
  emailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = emailForm.querySelector('[type="submit"]');
    const formKind = emailForm.dataset.authForm;
    const formData = new FormData(emailForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    showMessage("", "info");
    if (!email || !password) {
      showMessage("Enter your email and password.", "error");
      return;
    }
    if (formKind === "signup" && password !== String(formData.get("confirmPassword") || "")) {
      showMessage("Those passwords do not match.", "error");
      return;
    }

    setButtonBusy(submit, true, formKind === "signup" ? "Creating account…" : "Logging in…");
    try {
      if (formKind === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: loginUrl.href }
        });
        if (error) throw error;
        if (data.session) {
          await afterAuthentication(data.user);
        } else {
          showMessage("Account created. Check your email to confirm it, then log in to choose your username.", "success");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterAuthentication(data.user);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setButtonBusy(submit, false);
    }
  });

  document.querySelectorAll("[data-auth-provider]").forEach((button) => {
    button.addEventListener("click", async () => {
      const provider = button.dataset.authProvider;
      setButtonBusy(button, true, "Connecting…");
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: loginUrl.href,
            ...(provider === "facebook" ? { scopes: "public_profile,email" } : {})
          }
        });
        if (error) throw error;
      } catch (error) {
        handleError(error);
        setButtonBusy(button, false);
      }
    });
  });

  const usernameForm = document.querySelector("[data-username-form]");
  const usernameInput = usernameForm?.querySelector('[name="username"]');
  const usernameStatus = document.querySelector("[data-username-status]");
  const reservedNames = new Set([
    "admin", "administrator", "api", "gulu", "gulutournex", "help",
    "leaderboard", "login", "null", "profile", "search", "settings",
    "signup", "support", "tournaments", "undefined", "www", "winners"
  ]);
  let availabilityTimer;
  let availabilityRequest = 0;

  function showUsernameStatus(message, tone = "info") {
    if (!usernameStatus) return;
    usernameStatus.textContent = message;
    usernameStatus.dataset.tone = tone;
  }

  async function checkUsernameAvailability(candidate, requestId) {
    const { data, error } = await supabase.rpc("username_is_available", {
      candidate_username: candidate
    });
    if (requestId !== availabilityRequest) return;
    if (error) {
      showUsernameStatus("Availability check failed. You can still try saving; the database will enforce uniqueness.", "error");
    } else if (data) {
      showUsernameStatus("That username is available.", "success");
    } else {
      showUsernameStatus("That username is taken or unavailable.", "error");
    }
  }

  usernameInput?.addEventListener("input", () => {
    const candidate = usernameInput.value.trim().toLowerCase();
    usernameInput.value = candidate;
    availabilityRequest += 1;
    const requestId = availabilityRequest;
    clearTimeout(availabilityTimer);

    if (!candidate) {
      showUsernameStatus("Your username is public and unique.", "info");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(candidate)) {
      showUsernameStatus("Use 3–20 lowercase letters, numbers, or underscores.", "error");
      return;
    }
    if (reservedNames.has(candidate)) {
      showUsernameStatus("That username is reserved. Choose another.", "error");
      return;
    }
    showUsernameStatus("Checking availability…", "info");
    availabilityTimer = setTimeout(() => { void checkUsernameAvailability(candidate, requestId); }, 350);
  });

  usernameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = usernameForm.querySelector('[type="submit"]');
    const candidate = String(usernameInput?.value || "").trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(candidate) || reservedNames.has(candidate)) {
      showUsernameStatus("Choose 3–20 lowercase letters, numbers, or underscores. Some names are reserved.", "error");
      return;
    }
    setButtonBusy(submit, true, "Saving username…");
    try {
      const { error } = await supabase.rpc("claim_username", {
        candidate_username: candidate
      });
      if (error) throw error;
      document.querySelectorAll("[data-profile-username]").forEach((el) => { el.textContent = candidate; });
      document.querySelectorAll("[data-auth-username]").forEach((el) => { el.textContent = "@" + candidate; });
      const editingProfile = currentPath === profilePath;
      showUsernameStatus(editingProfile ? "Username updated." : "Username saved. Opening your profile…", "success");
      if (!editingProfile) go(profileUrl);
    } catch (error) {
      showUsernameStatus(friendlyError(error), "error");
    } finally {
      setButtonBusy(submit, false);
    }
  });

  document.querySelectorAll("[data-auth-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      setButtonBusy(button, true, "Logging out…");
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        handleError(error);
        setButtonBusy(button, false);
        return;
      }
      window.location.replace(loginUrl.href);
    });
  });

  const oauthError = new URLSearchParams(window.location.hash.slice(1)).get("error_description")
    || new URLSearchParams(window.location.search).get("error_description");
  if (oauthError && (currentPath === loginPath || currentPath === signupPath)) {
    showMessage("Sign-in was cancelled or could not be completed. Please try again.", "error");
  }

  supabase.auth.getSession().then(({ data, error }) => {
    if (error) handleError(error);
    else return synchronizeSession(data.session);
  }).catch(handleError);

  supabase.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => { void synchronizeSession(session); }, 0);
  });
})();

