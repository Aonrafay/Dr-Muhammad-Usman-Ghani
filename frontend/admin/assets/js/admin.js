(function () {
  var APPOINTMENT_KEY = "smilecare_appointments";
  var CONTACT_KEY = "smilecare_contacts";
  var AUTH_KEY = "smilecare_admin_authenticated";
  var LOCAL_ADMIN_EMAIL = "aonrafay@gmail.com";
  var LOCAL_ADMIN_PASSWORD = "qaz123@";
  var SUPABASE_CONFIG = window.SMILECARE_SUPABASE_CONFIG || {
    url: "https://YOUR-PROJECT.supabase.co",
    anonKey: "YOUR_PUBLIC_ANON_KEY",
    appointmentsTable: "appointments",
    contactsTable: "contacts"
  };
  var supabaseClientPromise = null;
  var actionsBound = false;
  var dashboardRefreshTimer = null;
  var realtimeChannel = null;
  var realtimeClient = null;
  var syncErrors = [];
  var latestAppointments = [];
  var statusOptions = ["pending", "confirmed", "checked-in", "in-progress", "completed", "cancelled", "no-show"];

  var tableBody = document.getElementById("appointmentTableBody");
  var serviceDemand = document.getElementById("serviceDemand");
  var messageList = document.getElementById("messageList");
  var todayCount = document.getElementById("todayCount");
  var syncStatusNode = document.getElementById("syncStatus");

  init();

  async function init() {
    var isAuthenticated = await initAuthGate();

    var year = document.getElementById("year");
    if (year) {
      year.textContent = String(new Date().getFullYear());
    }

    if (!isAuthenticated) {
      setSyncStatus("", "Database sync status: Waiting for admin login.");
      return;
    }

    bindActions();
    startAutoRefresh();
    renderDashboard();
  }

  async function initAuthGate() {
    var overlay = document.getElementById("authOverlay");
    var form = document.getElementById("authForm");
    var message = document.getElementById("authMessage");
    var logoutBtn = document.getElementById("logoutBtn");

    if (!(overlay instanceof HTMLElement) || !(form instanceof HTMLFormElement)) {
      return true;
    }

    var client = await getSupabaseClient();
    if (client && client.auth && typeof client.auth.getSession === "function") {
      try {
        var sessionResult = await client.auth.getSession();
        if (sessionResult && sessionResult.data && sessionResult.data.session) {
          setAuthMessage(message, "", "Enter your admin password to continue.");
        }
      } catch (error) {
        // Keep the login visible even if the session check fails.
      }
    }

    sessionStorage.removeItem(AUTH_KEY);
    setAuthUi(overlay, false);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var data = new FormData(form);
      var email = String(data.get("authEmail") || "").trim().toLowerCase();
      var password = String(data.get("authPassword") || "");

      if (!email || !password) {
        setAuthMessage(message, "error", "Please enter your email and password.");
        return;
      }

      setAuthMessage(message, "", "Signing in...");
      var authResult = await authenticateAdmin(email, password);
      if (authResult.ok) {
        sessionStorage.setItem(AUTH_KEY, "true");
        setAuthMessage(message, "success", authResult.message);
        setAuthUi(overlay, true);
        bindActions();
        startAutoRefresh();
        await startRealtimeSync();
        setSyncStatus("success", "Database sync status: Connected to Supabase.");
        await renderDashboard();
        return;
      }

      setAuthMessage(message, "error", authResult.message);
      setSyncStatus("error", "Database sync status: " + authResult.message);
    });

    if (logoutBtn instanceof HTMLButtonElement) {
      logoutBtn.addEventListener("click", async function () {
        try {
          var client = await getSupabaseClient();
          if (client && client.auth) {
            await client.auth.signOut();
          }
        } catch (error) {
          // Keep local logout behavior when remote sign-out fails.
        }

        sessionStorage.removeItem(AUTH_KEY);
        form.reset();
        setAuthMessage(message, "", "");
        setAuthUi(overlay, false);
        stopAutoRefresh();
        stopRealtimeSync();
        setSyncStatus("", "Database sync status: Waiting for admin login.");
      });
    }

    return false;
  }

  function setAuthUi(overlay, isAuthenticated) {
    overlay.classList.toggle("is-hidden", isAuthenticated);
    document.body.classList.toggle("auth-locked", !isAuthenticated);
  }

  function setAuthMessage(node, type, text) {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    node.className = "auth-message";
    if (type === "error") {
      node.classList.add("is-error");
    }
    if (type === "success") {
      node.classList.add("is-success");
    }
    node.textContent = text;
  }

  function setSyncStatus(type, message) {
    if (!(syncStatusNode instanceof HTMLElement)) {
      return;
    }

    syncStatusNode.className = "note";
    if (type === "success") {
      syncStatusNode.classList.add("is-success");
    }
    if (type === "error") {
      syncStatusNode.classList.add("is-error");
    }
    syncStatusNode.textContent = message;
  }

  async function authenticateAdmin(email, password) {
    // Normalize for local fallback comparison (case-insensitive for safety)
    var normalizedEmail = email.trim().toLowerCase();
    var normalizedLocalEmail = LOCAL_ADMIN_EMAIL.trim().toLowerCase();
    var isLocalCredentialMatch = normalizedEmail === normalizedLocalEmail && password === LOCAL_ADMIN_PASSWORD;

    // --- Try Supabase Auth FIRST so the client gets an authenticated session ---
    // This is critical: RLS policies only allow authenticated users to SELECT data.
    // If we return early on local credential match, the client stays anon and
    // fetchAppointments()/fetchMessages() will get empty results due to RLS.
    var client = await getSupabaseClient();

    if (client && client.auth) {
      try {
        var result = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (!result.error) {
          // Supabase Auth success - now check if user is in admin_users table
          try {
            var adminCheckResult = await client
              .from("admin_users")
              .select("*")
              .eq("email", email)
              .single();
            
            if (adminCheckResult.data) {
              console.log("✓ Supabase Auth + admin_users verified");
              return {
                ok: true,
                message: "Login successful. Supabase sync is active and admin role verified."
              };
            } else {
              // Auth successful but not in admin_users table - allow anyway for now
              console.warn("⚠ Supabase Auth succeeded but user not in admin_users table");
              return {
                ok: true,
                message: "Login successful. Supabase sync is active. (Note: User not found in admin_users table)"
              };
            }
          } catch (adminCheckError) {
            // admin_users table might not exist yet, but auth succeeded
            console.warn("⚠ Admin users table check failed (table may not exist yet):", adminCheckError);
            return {
              ok: true,
              message: "Login successful. Supabase sync is active."
            };
          }
        }

        // Supabase Auth failed - if local credentials match, fall back gracefully
        if (result.error && isLocalCredentialMatch) {
          console.warn("⚠ Supabase Auth failed but local credentials match. Falling back to local login:", result.error.message);
          return {
            ok: true,
            message: "Login successful. Local admin access granted (Supabase Auth unavailable — data sync may be limited)."
          };
        }

        if (result.error && result.error.message) {
          console.error("✗ Supabase Auth failed:", result.error.message);
          return {
            ok: false,
            message: result.error.message + " If the Supabase Auth user is not created yet, use the documented admin credentials (aonrafay@gmail.com / qaz123@) to log in locally."
          };
        }

        return {
          ok: false,
          message: "Login failed. Verify admin user exists in Supabase Auth."
        };
      } catch (error) {
        console.error("✗ Authentication error:", error);
        // Local fallback on network error
        if (isLocalCredentialMatch) {
          console.log("✓ Local admin login (after Supabase error)");
          return {
            ok: true,
            message: "Login successful. Local admin access granted (Supabase unavailable — data sync may be limited)."
          };
        }

        return {
          ok: false,
          message: "Unable to reach Supabase Auth. Please try again."
        };
      }
    }

    // Supabase client not configured — fall back to local credentials
    if (isLocalCredentialMatch) {
      console.log("✓ Local admin login (no Supabase client)");
      return {
        ok: true,
        message: "Login successful. Local admin access granted and dashboard sync is ready."
      };
    }

    return {
      ok: false,
      message: "Supabase client is not configured. Check supabase-config.js values."
    };
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    dashboardRefreshTimer = window.setInterval(function () {
      renderDashboard();
    }, 12000);
  }

  function stopAutoRefresh() {
    if (dashboardRefreshTimer) {
      window.clearInterval(dashboardRefreshTimer);
      dashboardRefreshTimer = null;
    }
  }

  async function startRealtimeSync() {
    var client = await getSupabaseClient();
    if (!client || typeof client.channel !== "function") {
      return;
    }

    stopRealtimeSync();

    realtimeClient = client;
    realtimeChannel = client.channel("smilecare-admin-dashboard-sync");

    realtimeChannel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SUPABASE_CONFIG.appointmentsTable },
        function () {
          renderDashboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SUPABASE_CONFIG.contactsTable },
        function () {
          renderDashboard();
        }
      )
      .subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          setSyncStatus("success", "Database sync status: Live updates connected to Supabase.");
        }
      });
  }

  function stopRealtimeSync() {
    if (realtimeClient && realtimeChannel && typeof realtimeClient.removeChannel === "function") {
      realtimeClient.removeChannel(realtimeChannel);
    }

    realtimeChannel = null;
    realtimeClient = null;
  }

  function bindActions() {
    if (actionsBound) {
      return;
    }

    actionsBound = true;

    if (tableBody) {
      tableBody.addEventListener("change", function (event) {
        var target = event.target;
        if (!(target instanceof HTMLSelectElement) || !target.classList.contains("status-select")) {
          return;
        }

        var appointmentId = target.dataset.id || "";
        updateAppointmentStatus(appointmentId, target.value);
      });
    }

    var seedButton = document.getElementById("seedDemo");
    if (seedButton) {
      seedButton.addEventListener("click", async function () {
        await seedDemoData();
        renderDashboard();
      });
    }

    var clearButton = document.getElementById("clearDemo");
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        var shouldClear = window.confirm("This will remove locally stored appointments and messages. Continue?");
        if (!shouldClear) {
          return;
        }

        localStorage.removeItem(APPOINTMENT_KEY);
        localStorage.removeItem(CONTACT_KEY);
        renderDashboard();
      });
    }
  }

  async function renderDashboard() {
    syncErrors = [];
    var appointments = (await fetchAppointments()).slice();
    var messages = (await fetchMessages()).slice();

    appointments.sort(function (a, b) {
      return toSortableDateTime(a) - toSortableDateTime(b);
    });

    latestAppointments = appointments.slice();

    renderStats(appointments, messages);
    renderAppointmentTable(appointments);
    renderServiceDemand(appointments);
    renderMessages(messages);

    if (syncErrors.length) {
      setSyncStatus("error", "Database sync status: " + syncErrors[0]);
    } else {
      setSyncStatus("success", "Database sync status: Synced with Supabase at " + new Date().toLocaleTimeString());
    }
  }

  function renderStats(appointments, messages) {
    var total = appointments.length;
    var pending = countByStatus(appointments, "pending");
    var confirmed = countByStatus(appointments, "confirmed") + countByStatus(appointments, "checked-in") + countByStatus(appointments, "in-progress");
    var today = appointments.filter(function (item) {
      return item.date === getTodayDateString();
    }).length;

    setText("statTotal", total);
    setText("statPending", pending);
    setText("statConfirmed", confirmed);
    setText("statMessages", messages.length);

    if (todayCount) {
      todayCount.textContent = String(today);
    }
  }

  function renderAppointmentTable(appointments) {
    if (!tableBody) {
      return;
    }

    if (!appointments.length) {
      tableBody.innerHTML =
        '<tr><td colspan="5"><div class="empty">No appointments submitted yet. Use the public appointment page or seed demo data.</div></td></tr>';
      return;
    }

    var rows = appointments.slice(0, 12).map(function (item) {
      var optionsMarkup = statusOptions
        .map(function (status) {
          var selected = status === (item.status || "pending") ? "selected" : "";
          return '<option value="' + status + '" ' + selected + '>' + toTitleCase(status) + "</option>";
        })
        .join("");

      return (
        "<tr>" +
        "<td>" + formatDate(item.date) + "</td>" +
        "<td>" + sanitize(item.time || "-") + "</td>" +
        "<td>" + sanitize(item.fullName || "-") + "</td>" +
        "<td>" + sanitize(item.service || "-") + "</td>" +
        '<td><select class="status-select" data-id="' + sanitize(item.id || "") + '">' +
        optionsMarkup +
        "</select></td>" +
        "</tr>"
      );
    });

    tableBody.innerHTML = rows.join("");
  }

  function renderServiceDemand(appointments) {
    if (!serviceDemand) {
      return;
    }

    if (!appointments.length) {
      serviceDemand.innerHTML = '<div class="empty">Service demand will appear after booking data is available.</div>';
      return;
    }

    var counts = {};
    appointments.forEach(function (item) {
      var key = item.service || "Unspecified";
      counts[key] = (counts[key] || 0) + 1;
    });

    var sorted = Object.keys(counts)
      .map(function (service) {
        return { service: service, count: counts[service] };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      })
      .slice(0, 6);

    var peak = sorted[0].count;

    serviceDemand.innerHTML = sorted
      .map(function (item) {
        var width = Math.round((item.count / peak) * 100);
        return (
          '<div class="demand-item">' +
          '<div class="demand-head"><strong>' + sanitize(item.service) + "</strong><span>" + item.count + " bookings</span></div>" +
          '<div class="demand-bar"><span style="width:' + width + '%"></span></div>' +
          "</div>"
        );
      })
      .join("");
  }

  function renderMessages(messages) {
    if (!messageList) {
      return;
    }

    if (!messages.length) {
      messageList.innerHTML = '<div class="empty">No messages yet. New contact form submissions will appear here.</div>';
      return;
    }

    var sorted = messages
      .slice()
      .sort(function (a, b) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      })
      .slice(0, 8);

    messageList.innerHTML = sorted
      .map(function (message) {
        return (
          '<article class="message-card">' +
          "<h3>" + sanitize(message.name || "Unknown") + "</h3>" +
          "<p>" + sanitize(message.message || "") + "</p>" +
          '<div class="message-meta">' +
          "Topic: " + sanitize(message.topic || "General Inquiry") +
          " | " + sanitize(message.phone || "") +
          " | " + sanitize(message.email || "") +
          " | " + formatDateTime(message.createdAt) +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  async function updateAppointmentStatus(appointmentId, status) {
    var appointmentRecord = findAppointmentById(appointmentId);
    var previousStatus = appointmentRecord ? appointmentRecord.status : "";
    var client = await getSupabaseClient();
    if (!client) {
      setSyncStatus("error", "Database sync status: Supabase client unavailable. Status was not updated.");
      return;
    }

    try {
      var remoteUpdate = await client
        .from(SUPABASE_CONFIG.appointmentsTable)
        .update({ status: status })
        .eq("id", appointmentId);

      if (remoteUpdate.error) {
        setSyncStatus("error", "Database sync status: " + remoteUpdate.error.message);
        return;
      }
    } catch (error) {
      setSyncStatus("error", "Database sync status: Could not update Supabase right now.");
      return;
    }

    var appointments = getRecords(APPOINTMENT_KEY);
    var updated = false;

    appointments.forEach(function (item) {
      if (item.id === appointmentId) {
        item.status = status;
        updated = true;
      }
    });

    if (updated) {
      setRecords(APPOINTMENT_KEY, appointments);
    }

    await renderDashboard();
    setSyncStatus("success", "Database sync status: Appointment status updated to " + toTitleCase(status) + ".");

    if (status === "confirmed" && previousStatus !== "confirmed") {
      var emailResult = await sendConfirmationEmail(appointmentRecord);
      if (!emailResult.ok) {
        setSyncStatus("error", "Confirmation email failed: " + emailResult.message);
        return;
      }

      if (appointmentRecord && appointmentRecord.email) {
        setSyncStatus("success", "Confirmation email sent to " + appointmentRecord.email + ".");
      }
    }
  }

  async function seedDemoData() {
    var demoAppointments = [
        {
          id: createId(),
          confirmationCode: "SC-" + dayOffset(1).replace(/-/g, "") + "-1000-331",
          fullName: "Amina Tariq",
          phone: "+92 300 555 1200",
          email: "amina@example.com",
          service: "General Checkup",
          date: dayOffset(1),
          time: "10:00 AM",
          notes: "Routine review",
          status: "pending",
          createdAt: new Date().toISOString()
        },
        {
          id: createId(),
          confirmationCode: "SC-" + dayOffset(2).replace(/-/g, "") + "-1130-442",
          fullName: "Fahad Ali",
          phone: "+92 301 777 8300",
          email: "fahad@example.com",
          service: "Whitening",
          date: dayOffset(2),
          time: "11:30 AM",
          notes: "Event preparation",
          status: "confirmed",
          createdAt: new Date().toISOString()
        },
        {
          id: createId(),
          confirmationCode: "SC-" + dayOffset(3).replace(/-/g, "") + "-0130-557",
          fullName: "Sadia Malik",
          phone: "+92 321 888 1100",
          email: "sadia@example.com",
          service: "Root Canal",
          date: dayOffset(3),
          time: "01:30 PM",
          notes: "Upper molar pain",
          status: "pending",
          createdAt: new Date().toISOString()
        },
        {
          id: createId(),
          confirmationCode: "SC-" + dayOffset(4).replace(/-/g, "") + "-0300-189",
          fullName: "Bilal Khan",
          phone: "+92 333 112 2200",
          email: "bilal@example.com",
          service: "Pediatric Dentistry",
          date: dayOffset(4),
          time: "03:00 PM",
          notes: "Child first visit",
          status: "checked-in",
          createdAt: new Date().toISOString()
        }
    ];

    var demoMessages = [
      {
        id: createId(),
        name: "Hassan N.",
        phone: "+92 300 400 6600",
        email: "hassan@example.com",
        topic: "Treatment Question",
        message: "Do you offer installment plans for implant treatment?",
        createdAt: new Date().toISOString()
      },
      {
        id: createId(),
        name: "Naila J.",
        phone: "+92 322 440 5500",
        email: "naila@example.com",
        topic: "Appointment Support",
        message: "Can I reschedule my Saturday slot to Friday afternoon?",
        createdAt: new Date().toISOString()
      }
    ];

    var client = await getSupabaseClient();
    if (client) {
      try {
        var appointmentCheck = await client
          .from(SUPABASE_CONFIG.appointmentsTable)
          .select("id")
          .limit(1);

        if (!appointmentCheck.error && Array.isArray(appointmentCheck.data) && appointmentCheck.data.length === 0) {
          await client.from(SUPABASE_CONFIG.appointmentsTable).insert(
            demoAppointments.map(function (item) {
              return {
                id: item.id,
                confirmation_code: item.confirmationCode,
                full_name: item.fullName,
                phone: item.phone,
                email: item.email,
                service: item.service,
                appointment_date: item.date,
                appointment_time: item.time,
                notes: item.notes,
                status: item.status,
                created_at: item.createdAt
              };
            })
          );
        }

        var messageCheck = await client
          .from(SUPABASE_CONFIG.contactsTable)
          .select("id")
          .limit(1);

        if (!messageCheck.error && Array.isArray(messageCheck.data) && messageCheck.data.length === 0) {
          await client.from(SUPABASE_CONFIG.contactsTable).insert(
            demoMessages.map(function (item) {
              return {
                id: item.id,
                name: item.name,
                phone: item.phone,
                email: item.email,
                topic: item.topic,
                message: item.message,
                created_at: item.createdAt
              };
            })
          );
        }

        return;
      } catch (error) {
        // Fall back to local demo data if Supabase is unavailable.
      }
    }

    if (getRecords(APPOINTMENT_KEY).length === 0) {
      setRecords(APPOINTMENT_KEY, demoAppointments);
    }

    if (getRecords(CONTACT_KEY).length === 0) {
      setRecords(CONTACT_KEY, demoMessages);
    }
  }

  function countByStatus(appointments, status) {
    return appointments.filter(function (item) {
      return (item.status || "pending") === status;
    }).length;
  }

  function toSortableDateTime(item) {
    var date = item.date || "1970-01-01";
    var time = to24Hour(item.time || "12:00 AM");
    return new Date(date + "T" + time + ":00").getTime();
  }

  function to24Hour(label) {
    var match = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(label || "");
    if (!match) {
      return "00:00";
    }

    var hour = Number(match[1]);
    var minute = Number(match[2]);
    var suffix = match[3].toUpperCase();

    if (suffix === "PM" && hour < 12) {
      hour += 12;
    }

    if (suffix === "AM" && hour === 12) {
      hour = 0;
    }

    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "-";
    }

    var value = new Date(dateString + "T00:00:00");
    if (Number.isNaN(value.getTime())) {
      return dateString;
    }

    return value.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatDateTime(timestamp) {
    var value = new Date(timestamp || 0);
    if (Number.isNaN(value.getTime())) {
      return "Unknown date";
    }

    return value.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getTodayDateString() {
    var today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dayOffset(offset) {
    var value = new Date();
    value.setDate(value.getDate() + offset);
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0")
    ].join("-");
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = String(value);
    }
  }

  function getRecords(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }

      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setRecords(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function findAppointmentById(appointmentId) {
    return (
      latestAppointments.find(function (item) {
        return item.id === appointmentId;
      }) || null
    );
  }

  async function sendConfirmationEmail(appointment) {
    if (!appointment || !appointment.email) {
      return { ok: false, message: "Patient email is missing." };
    }

    var payload = {
      email: appointment.email,
      name: appointment.fullName || "Patient",
      date: appointment.date || "",
      time: appointment.time || "",
      service: appointment.service || "Dental appointment",
      confirmationCode: appointment.confirmationCode || ""
    };

    try {
      var response = await fetch("/api/send-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      var data = null;
      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok || !data || data.ok !== true) {
        return {
          ok: false,
          message: (data && data.error) ? data.error : "Email service returned an error."
        };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, message: "Could not reach the email service." };
    }
  }

  async function fetchAppointments() {
    var client = await getSupabaseClient();
    if (!client) {
      pushSyncError("Supabase client unavailable. Showing local cache.");
      return getRecords(APPOINTMENT_KEY);
    }

    try {
      var result = await client
        .from(SUPABASE_CONFIG.appointmentsTable)
        .select("id,confirmation_code,full_name,phone,email,service,appointment_date,appointment_time,notes,status,created_at")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })
        .limit(500);

      if (result.error) {
        pushSyncError("Could not fetch appointments from Supabase: " + result.error.message);
        return getRecords(APPOINTMENT_KEY);
      }

      var normalized = (result.data || []).map(function (row) {
        return {
          id: row.id,
          confirmationCode: row.confirmation_code,
          fullName: row.full_name,
          phone: row.phone,
          email: row.email,
          service: row.service,
          date: row.appointment_date,
          time: row.appointment_time,
          notes: row.notes,
          status: row.status,
          createdAt: row.created_at
        };
      });

      setRecords(APPOINTMENT_KEY, normalized);
      return normalized;
    } catch (error) {
      pushSyncError("Could not fetch appointments from Supabase right now. Showing local cache.");
      return getRecords(APPOINTMENT_KEY);
    }
  }

  async function fetchMessages() {
    var client = await getSupabaseClient();
    if (!client) {
      pushSyncError("Supabase client unavailable. Showing local cache.");
      return getRecords(CONTACT_KEY);
    }

    try {
      var result = await client
        .from(SUPABASE_CONFIG.contactsTable)
        .select("id,name,phone,email,topic,message,created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (result.error) {
        pushSyncError("Could not fetch messages from Supabase: " + result.error.message);
        return getRecords(CONTACT_KEY);
      }

      var normalized = (result.data || []).map(function (row) {
        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          topic: row.topic,
          message: row.message,
          createdAt: row.created_at
        };
      });

      setRecords(CONTACT_KEY, normalized);
      return normalized;
    } catch (error) {
      pushSyncError("Could not fetch messages from Supabase right now. Showing local cache.");
      return getRecords(CONTACT_KEY);
    }
  }

  function pushSyncError(message) {
    if (syncErrors.indexOf(message) === -1) {
      syncErrors.push(message);
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
            persistSession: true
          }
        });
      } catch (error) {
        return null;
      }
    })();

    return supabaseClientPromise;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "id-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
  }

  function toTitleCase(value) {
    return String(value)
      .split("-")
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(" ");
  }

  function sanitize(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
