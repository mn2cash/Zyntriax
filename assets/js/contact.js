// assets/js/contact.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("contact-status");
  const submitBtn = document.getElementById("contact-submit");

  function setStatusMessage(message){
    if (status) status.textContent = message;
  }

  if (status) {
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector("[name='name']").value.trim();
    const email = form.querySelector("[name='email']").value.trim();
    const message = form.querySelector("[name='message']").value.trim();
    const honeypot = form.querySelector("[name='hp_field']").value.trim();

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatusMessage("❌ Please enter a valid email address.");
      return;
    }

    if (honeypot) {
      setStatusMessage("❌ Submission blocked.");
      form.reset();
      return;
    }

    setStatusMessage("Sending...");
    var originalLabel = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    try {
      const { error } = await window.supabase
        .from("contact_messages")
        .insert({ name, email, message });

      if (error) {
        setStatusMessage("❌ Error: " + error.message);
      } else {
        setStatusMessage("✅ Message sent successfully!");
        form.reset();
      }
    } catch (err) {
      setStatusMessage("❌ Unexpected error: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  });
});