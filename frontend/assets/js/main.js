(function () {
  var APPOINTMENT_KEY = "smilecare_appointments";
  var CONTACT_KEY = "smilecare_contacts";
  var SUPABASE_CONFIG = window.SMILECARE_SUPABASE_CONFIG || {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR_PUBLIC_ANON_KEY",
    appointmentsTable: "appointments",
    contactsTable: "contacts"
  };
  var supabaseClientPromise = null;
  var navItems = [
    { id: "home", label: "Home", href: "index.html" },
    { id: "services", label: "Services", href: "services.html" },
    { id: "about", label: "About Dr. Ghani", href: "about.html" },
    { id: "appointment", label: "Appointment", href: "appointment.html" },
    { id: "resources", label: "Patient Resources", href: "resources.html" },
    { id: "blog", label: "Blog", href: "blog.html" },
    { id: "contact", label: "Contact", href: "contact.html" }
  ];

  var page = document.body.dataset.page || "home";

  injectLayout(page);
  setupMobileNavigation();
  setCurrentYear();
  setupRevealAnimations();
  initAppointmentForm();
  initContactForm();
  initBlogFilters();
  initNewsletterForm();

  function injectLayout(activePage) {
    var headerTarget = document.querySelector('[data-include="header"]');
    var footerTarget = document.querySelector('[data-include="footer"]');

    if (headerTarget) {
      var navMarkup = navItems
        .map(function (item) {
          var className = item.id === activePage ? "is-active" : "";
          return '<a class="' + className + '" href="' + item.href + '">' + item.label + "</a>";
        })
        .join("");

      headerTarget.innerHTML =
        '<header class="site-header">' +
        '<div class="container site-header-inner">' +
        '<a class="brand" href="index.html" aria-label="Dr. Muhammad Usman Ghani Home">' +
        '<span class="brand-mark">DG</span>' +
        "<span>Dr. Muhammad Usman Ghani</span>" +
        "</a>" +
        '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mainNav">Menu</button>' +
        '<nav class="main-nav" id="mainNav">' +
        navMarkup +
        '<a href="../admin/index.html">Admin</a>' +
        "</nav>" +
        "</div>" +
        "</header>";
    }

    if (footerTarget) {
      footerTarget.innerHTML =
        '<footer class="site-footer">' +
        '<div class="container top">' +
        "<section>" +
        "<h4>Dr. Muhammad Usman Ghani</h4>" +
        "<p>Personalized dental care led by Dr. Muhammad Usman Ghani with clear guidance from first consultation to final smile.</p>" +
        "</section>" +
        "<section>" +
        "<h4>Visit & Contact</h4>" +
        "<ul>" +
        "<li>Phone: 03444884014</li>" +
        "<li>Email: drmusmang@gmail.com</li>" +
        "<li>Emergency Line: 03444884014</li>" +
        "</ul>" +
        "</section>" +
        "<section>" +
        "<h4>Office Hours</h4>" +
        "<ul>" +
        "<li>Mon-Thu: 9:00 AM - 7:00 PM</li>" +
        "<li>Fri: 9:00 AM - 4:00 PM</li>" +
        "<li>Sat: 10:00 AM - 3:00 PM</li>" +
        "<li>Sun: Emergency only</li>" +
        "</ul>" +
        "</section>" +
        "</div>" +
        '<div class="container bottom">' +
        "<span>Copyright <span class=\"year\"></span> Dr. Muhammad Usman Ghani</span>" +
        "<span>Professional care by Dr. Muhammad Usman Ghani</span>" +
        "</div>" +
        "</footer>";
    }
  }

  function setupMobileNavigation() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function setCurrentYear() {
    var currentYear = String(new Date().getFullYear());
    document.querySelectorAll(".year").forEach(function (el) {
      el.textContent = currentYear;
    });
  }

  function setupRevealAnimations() {
    var revealItems = document.querySelectorAll("[data-reveal]");
    if (!revealItems.length) {
      return;
    }

    if (typeof window.IntersectionObserver !== "function") {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, observerRef) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          var stagger = Number(entry.target.dataset.stagger || "0");
          window.setTimeout(function () {
            entry.target.classList.add("is-visible");
          }, stagger * 90);

          observerRef.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initAppointmentForm() {
    var form = document.getElementById("appointmentForm");
    if (!form) {
      return;
    }

    var dateInput = document.getElementById("preferredDate");
    var timeSelect = document.getElementById("preferredTime");
    var serviceSelect = document.getElementById("serviceType");
    var resultBox = document.getElementById("appointmentResult");

    if (dateInput) {
      dateInput.min = formatDateForInput(new Date());
      dateInput.addEventListener("change", async function () {
        await populateTimeSlots(dateInput.value, timeSelect, serviceSelect.value);
      });
    }

    if (serviceSelect) {
      serviceSelect.addEventListener("change", async function () {
        if (dateInput.value) {
          await populateTimeSlots(dateInput.value, timeSelect, serviceSelect.value);
        }
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var fullName = String(formData.get("fullName") || "").trim();
      var phone = String(formData.get("phone") || "").trim();
      var email = String(formData.get("email") || "").trim();
      var service = String(formData.get("serviceType") || "").trim();
      var date = String(formData.get("preferredDate") || "").trim();
      var time = String(formData.get("preferredTime") || "").trim();
      var notes = String(formData.get("notes") || "").trim();

      if (!fullName || !phone || !email || !service || !date || !time) {
        setFormMessage(resultBox, "error", "Please fill every required field before submitting.");
        return;
      }

      if (!isValidPhone(phone)) {
        setFormMessage(resultBox, "error", "Please enter a valid phone number including country or city code.");
        return;
      }

      if (await isBooked(date, time)) {
        setFormMessage(resultBox, "error", "This slot has just been booked. Please choose another available time.");
        await populateTimeSlots(date, timeSelect, service);
        return;
      }

      var appointment = {
        id: createRecordId(),
        confirmationCode: buildConfirmationCode(date, time),
        fullName: fullName,
        phone: phone,
        email: email,
        service: service,
        date: date,
        time: time,
        notes: notes,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      var appointmentSave = await saveAppointmentRecord(appointment);
      if (!appointmentSave.ok) {
        setFormMessage(resultBox, "error", appointmentSave.message);
        return;
      }

      setFormMessage(
        resultBox,
        "success",
        "Appointment request submitted. Your confirmation code is " + appointment.confirmationCode + ". Our team will call you shortly."
      );

      form.reset();
      if (dateInput) {
        dateInput.min = formatDateForInput(new Date());
      }
      await populateTimeSlots("", timeSelect, "");
    });

    populateTimeSlots("", timeSelect, "");
  }

  async function populateTimeSlots(dateValue, selectEl, serviceName) {
    if (!selectEl) {
      return;
    }

    selectEl.innerHTML = '<option value="">Select a time slot</option>';

    if (!dateValue) {
      return;
    }

    var dateRef = new Date(dateValue + "T00:00:00");
    if (Number.isNaN(dateRef.getTime())) {
      return;
    }

    var schedule = getClinicHours(dateRef.getDay());
    if (!schedule) {
      addDisabledSlot(selectEl, "Clinic closed for regular appointments");
      return;
    }

    var stepMinutes = getServiceDuration(serviceName) > 45 ? 60 : 30;
    var startMinutes = schedule.startHour * 60;
    var endMinutes = schedule.endHour * 60;
    var bookedSlots = await getBookedSlotsForDate(dateValue);

    var availableCount = 0;

    for (var minutes = startMinutes; minutes < endMinutes; minutes += stepMinutes) {
      var slotLabel = toSlotLabel(minutes);
      if (bookedSlots.has(slotLabel)) {
        continue;
      }

      var option = document.createElement("option");
      option.value = slotLabel;
      option.textContent = slotLabel;
      selectEl.appendChild(option);
      availableCount += 1;
    }

    if (availableCount === 0) {
      addDisabledSlot(selectEl, "No slots left for this date");
    }
  }

  function addDisabledSlot(selectEl, label) {
    var option = document.createElement("option");
    option.value = "";
    option.disabled = true;
    option.textContent = label;
    selectEl.appendChild(option);
  }

  function getClinicHours(dayIndex) {
    if (dayIndex === 0) {
      return null;
    }

    if (dayIndex >= 1 && dayIndex <= 4) {
      return { startHour: 9, endHour: 19 };
    }

    if (dayIndex === 5) {
      return { startHour: 9, endHour: 16 };
    }

    return { startHour: 10, endHour: 15 };
  }

  function getServiceDuration(serviceName) {
    var durations = {
      "General Checkup": 30,
      "Teeth Cleaning": 45,
      Whitening: 60,
      "Root Canal": 90,
      Implants: 90,
      Orthodontics: 60,
      "Pediatric Dentistry": 45,
      "Emergency Visit": 30
    };

    return durations[serviceName] || 30;
  }

  async function isBooked(date, time) {
    var client = await getSupabaseClient();
    if (client) {
      try {
        var result = await client
          .from(SUPABASE_CONFIG.appointmentsTable)
          .select("id")
          .eq("appointment_date", date)
          .eq("appointment_time", time)
          .neq("status", "cancelled")
          .limit(1);

        if (!result.error) {
          return Array.isArray(result.data) && result.data.length > 0;
        }
      } catch (error) {
        // Fall through to local fallback.
      }
    }

    return getStoredRecords(APPOINTMENT_KEY).some(function (item) {
      return item.date === date && item.time === time && item.status !== "cancelled";
    });
  }

  function buildConfirmationCode(date, time) {
    var compactDate = date.replace(/-/g, "");
    var compactTime = time.replace(/\s/g, "").replace(":", "").slice(0, 4);
    var randomPart = String(Math.floor(100 + Math.random() * 900));
    return "SC-" + compactDate + "-" + compactTime + "-" + randomPart;
  }

  function createRecordId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "id-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
  }

  function toSlotLabel(totalMinutes) {
    var hours24 = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    var suffix = hours24 >= 12 ? "PM" : "AM";
    var hours12 = hours24 % 12;

    if (hours12 === 0) {
      hours12 = 12;
    }

    var minuteLabel = String(minutes).padStart(2, "0");
    return String(hours12).padStart(2, "0") + ":" + minuteLabel + " " + suffix;
  }

  function formatDateForInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function setFormMessage(target, type, message) {
    if (!target) {
      return;
    }

    target.className = "form-result " + (type === "success" ? "is-success" : "is-error");
    target.textContent = message;
  }

  function isValidPhone(value) {
    var cleaned = value.replace(/[\s()-]/g, "");
    return /^\+?[0-9]{8,15}$/.test(cleaned);
  }

  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) {
      return;
    }

    var resultBox = document.getElementById("contactResult");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var formData = new FormData(form);
      var name = String(formData.get("name") || "").trim();
      var phone = String(formData.get("phone") || "").trim();
      var email = String(formData.get("email") || "").trim();
      var topic = String(formData.get("topic") || "General Inquiry").trim();
      var message = String(formData.get("message") || "").trim();

      if (!name || !phone || !email || !message) {
        setFormMessage(resultBox, "error", "Please complete every required field.");
        return;
      }

      if (!isValidPhone(phone)) {
        setFormMessage(resultBox, "error", "Please provide a valid phone number.");
        return;
      }

      var contactRecord = {
        id: createRecordId(),
        name: name,
        phone: phone,
        email: email,
        topic: topic,
        message: message,
        createdAt: new Date().toISOString()
      };

      var contactSave = await saveContactRecord(contactRecord);
      if (!contactSave.ok) {
        setFormMessage(resultBox, "error", contactSave.message);
        return;
      }

      setFormMessage(
        resultBox,
        "success",
        "Thank you. Your message has been received and our team will respond soon."
      );

      form.reset();
    });
  }

  function initBlogFilters() {
    var filterButtons = document.querySelectorAll("[data-filter-btn]");
    var posts = document.querySelectorAll("[data-post]");

    if (!filterButtons.length || !posts.length) {
      return;
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var selected = button.dataset.filter || "all";

        filterButtons.forEach(function (chip) {
          chip.classList.toggle("is-active", chip === button);
        });

        posts.forEach(function (post) {
          var category = post.dataset.category || "";
          var show = selected === "all" || category === selected;
          post.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  function initNewsletterForm() {
    var form = document.getElementById("newsletterForm");
    if (!form) {
      return;
    }

    var result = document.getElementById("newsletterResult");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var email = String(new FormData(form).get("newsletterEmail") || "").trim();
      if (!email || email.indexOf("@") === -1) {
        setFormMessage(result, "error", "Please provide a valid email address.");
        return;
      }

      setFormMessage(result, "success", "You are subscribed. Watch your inbox for monthly dental care tips.");
      form.reset();
    });
  }

  function getStoredRecords(key) {
    try {
      var value = localStorage.getItem(key);
      if (!value) {
        return [];
      }

      var parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveStoredRecords(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async function getBookedSlotsForDate(date) {
    var booked = new Set();

    var client = await getSupabaseClient();
    if (client) {
      try {
        var result = await client
          .from(SUPABASE_CONFIG.appointmentsTable)
          .select("appointment_time,status")
          .eq("appointment_date", date)
          .neq("status", "cancelled");

        if (!result.error && Array.isArray(result.data)) {
          result.data.forEach(function (row) {
            if (row && row.appointment_time) {
              booked.add(row.appointment_time);
            }
          });

          return booked;
        }
      } catch (error) {
        // Fall through to local fallback.
      }
    }

    getStoredRecords(APPOINTMENT_KEY).forEach(function (item) {
      if (item.date === date && item.status !== "cancelled") {
        booked.add(item.time);
      }
    });

    return booked;
  }

  async function saveAppointmentRecord(appointment) {
    var client = await getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        message: "Database connection is not configured. Please check Supabase config values."
      };
    }

    try {
      var result = await client.from(SUPABASE_CONFIG.appointmentsTable).insert({
        confirmation_code: appointment.confirmationCode,
        full_name: appointment.fullName,
        phone: appointment.phone,
        email: appointment.email,
        service: appointment.service,
        appointment_date: appointment.date,
        appointment_time: appointment.time,
        notes: appointment.notes,
        status: appointment.status
      });

      if (result.error) {
        return {
          ok: false,
          message: "Could not save appointment in Supabase: " + result.error.message
        };
      }

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: "Could not connect to Supabase right now. Please try again."
      };
    }
  }

  async function saveContactRecord(contactRecord) {
    var client = await getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        message: "Database connection is not configured. Please check Supabase config values."
      };
    }

    try {
      var result = await client.from(SUPABASE_CONFIG.contactsTable).insert({
        name: contactRecord.name,
        phone: contactRecord.phone,
        email: contactRecord.email,
        topic: contactRecord.topic,
        message: contactRecord.message
      });

      if (result.error) {
        return {
          ok: false,
          message: "Could not save message in Supabase: " + result.error.message
        };
      }

      return {
        ok: true
      };
    } catch (error) {
      return {
        ok: false,
        message: "Could not connect to Supabase right now. Please try again."
      };
    }
  }

  function hasSupabaseConfig() {
    return Boolean(
      SUPABASE_CONFIG &&
      SUPABASE_CONFIG.url &&
      SUPABASE_CONFIG.anonKey &&
      SUPABASE_CONFIG.url.indexOf("YOUR-PROJECT") === -1 &&
      SUPABASE_CONFIG.anonKey.indexOf("YOUR_PUBLIC_ANON_KEY") === -1
    );
  }

  function loadSupabaseScript() {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-supabase-cdn="true"]');
      if (existing) {
        existing.addEventListener("load", function () {
          resolve();
        });
        existing.addEventListener("error", function () {
          reject(new Error("Failed to load Supabase script."));
        });
        return;
      }

      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.dataset.supabaseCdn = "true";
      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error("Failed to load Supabase script."));
      };
      document.head.appendChild(script);
    });
  }

  async function getSupabaseClient() {
    if (!hasSupabaseConfig()) {
      return null;
    }

    if (supabaseClientPromise) {
      return supabaseClientPromise;
    }

    supabaseClientPromise = (async function () {
      try {
        await loadSupabaseScript();
        if (!window.supabase || typeof window.supabase.createClient !== "function") {
          return null;
        }

        return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
          auth: {
            persistSession: false
          }
        });
      } catch (error) {
        return null;
      }
    })();

    return supabaseClientPromise;
  }
})();
