/* ==========================================================
   CineHub - script.js
   COS10005 Assignment 2
   One file linked on every page. Each init function only runs
   if the elements it needs exist on the current page.
   Sections: 1 Movie data | 2 Helpers | 3 Registration |
             4 Booking | 5 Recommendation | 6 Watchlist | 7 Start
   ========================================================== */
"use strict";

/* ---------- 1. Movie data ----------
   price = base price of one Adult ticket (AUD)
   tags  = viewing preferences the movie suits (used for recommendations) */
const MOVIES = [
  { id: "m1", title: "Skyline Pursuit", genre: "Action", rating: "M", price: 18, tags: ["friends", "solo"] },
  { id: "m2", title: "Laugh Lines", genre: "Comedy", rating: "PG", price: 16, tags: ["friends", "date", "family"] },
  { id: "m3", title: "Pip and the Paper Moon", genre: "Animation", rating: "G", price: 14, tags: ["family"] },
  { id: "m4", title: "The Quiet Harbour", genre: "Drama", rating: "M", price: 17, tags: ["solo", "date"] },
  { id: "m5", title: "Crimson Circuit", genre: "Action", rating: "MA15+", price: 19, tags: ["friends", "solo"] },
  { id: "m6", title: "Stargazers Club", genre: "Animation", rating: "PG", price: 15, tags: ["family", "friends"] }
];

/* Which ratings each age group may be shown */
const ALLOWED_RATINGS = {
  child: ["G", "PG"],
  teen: ["G", "PG", "M"],
  adult: ["G", "PG", "M", "MA15+"]
};

/* Ticket type price multipliers */
const TICKET_MULTIPLIER = { adult: 1, child: 0.6, student: 0.8 };

/* ---------- 2. Helpers ---------- */
function findMovie(id) {
  return MOVIES.find(function (m) { return m.id === id; });
}

/* Show (or clear) an error message. Each field has a <span id="<field>Error">.
   Returns true when there is no error. */
function setError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + "Error");
  const field = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
  }
  if (field) {
    field.classList.toggle("invalid", message !== "");
    field.setAttribute("aria-invalid", message !== "" ? "true" : "false");
  }
  return message === "";
}

/* Run every validator. validators = { fieldId: function returning "" or an error }.
   Returns true only if all pass, and focuses the first invalid field. */
function runValidators(validators) {
  let allValid = true;
  let firstBad = null;
  Object.keys(validators).forEach(function (fieldId) {
    const ok = setError(fieldId, validators[fieldId]());
    if (!ok && firstBad === null) {
      firstBad = fieldId;
    }
    allValid = allValid && ok;
  });
  if (firstBad !== null) {
    const el = document.getElementById(firstBad);
    if (el) { el.focus(); }
  }
  return allValid;
}

/* Re-check a single field when the user leaves it */
function validateOnBlur(validators) {
  Object.keys(validators).forEach(function (fieldId) {
    const el = document.getElementById(fieldId);
    if (el) {
      el.addEventListener("blur", function () {
        setError(fieldId, validators[fieldId]());
      });
    }
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function required(value, label) {
  return value.trim() === "" ? label + " is required." : "";
}

/* ---------- 3. Registration form ---------- */
function initRegistration() {
  const form = document.getElementById("registerForm");
  if (!form) { return; }

  const val = function (id) { return document.getElementById(id).value; };

  const validators = {
    username: function () {
      const v = val("username");
      if (v.trim() === "") { return "Username is required."; }
      if (v.length < 5) { return "Username must be at least 5 characters."; }
      if (!/^[A-Za-z0-9_]+$/.test(v)) { return "Use letters, numbers and underscores only."; }
      return "";
    },
    email: function () {
      const v = val("email");
      if (v.trim() === "") { return "Email address is required."; }
      return isValidEmail(v) ? "" : "Enter a valid email, for example name@example.com.";
    },
    phone: function () {
      const v = val("phone");
      if (v.trim() === "") { return "Phone number is required."; }
      return /^\d{8,15}$/.test(v) ? "" : "Phone number must be 8 to 15 digits, with no spaces or symbols.";
    },
    password: function () {
      const v = val("password");
      if (v === "") { return "Password is required."; }
      if (v.length < 10) { return "Password must be at least 10 characters."; }
      if (!/[A-Z]/.test(v)) { return "Password needs at least one uppercase letter."; }
      if (!/[a-z]/.test(v)) { return "Password needs at least one lowercase letter."; }
      if (!/[0-9]/.test(v)) { return "Password needs at least one number."; }
      if (!/[^A-Za-z0-9]/.test(v)) { return "Password needs at least one special character."; }
      return "";
    },
    confirmPassword: function () {
      const v = val("confirmPassword");
      if (v === "") { return "Please confirm your password."; }
      return v === val("password") ? "" : "Passwords do not match.";
    },
    gender: function () {
      return form.querySelector('input[name="gender"]:checked') ? "" : "Please select a gender.";
    },
    genres: function () {
      return form.querySelector('input[name="genres"]:checked') ? "" : "Select at least one preferred genre.";
    },
    country: function () {
      return required(val("country"), "Country/Region");
    }
  };

  validateOnBlur(validators);
  form.addEventListener("submit", function (event) {
    if (!runValidators(validators)) {
      event.preventDefault(); /* block submission until all errors are fixed */
    }
  });
}

/* ---------- 4. Booking form ---------- */
function initBooking() {
  const form = document.getElementById("bookingForm");
  if (!form) { return; }

  const el = function (id) { return document.getElementById(id); };
  const paymentMode = function () {
    const checked = form.querySelector('input[name="payment"]:checked');
    return checked ? checked.value : "";
  };

  /* Pre-fill the movie. The listing and recommendation pages link to
     booking.html?movie=<id>; we read that query string here. */
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("movie");
  if (requested && findMovie(requested)) {
    el("movie").value = requested;
  }

  /* Ticket price / booking cost: price x tickets x ticket-type multiplier */
  function updateCost() {
    const movie = findMovie(el("movie").value);
    const qty = parseInt(el("tickets").value, 10);
    const multiplier = TICKET_MULTIPLIER[el("ticketType").value] || 1;
    el("pricePerTicket").textContent = movie
      ? "$" + (movie.price * multiplier).toFixed(2) + " per ticket"
      : "Choose a movie to see the price.";
    const total = movie && qty > 0 ? movie.price * multiplier * qty : 0;
    el("totalCost").value = "$" + total.toFixed(2);
  }

  /* Show only the payment fields that match the chosen payment method.
     Hidden fieldsets are also disabled so they are not posted. */
  function updatePaymentFields() {
    const mode = paymentMode();
    el("voucherFields").hidden = mode !== "voucher";
    el("voucherFields").disabled = mode !== "voucher";
    el("cardFields").hidden = mode !== "online";
    el("cardFields").disabled = mode !== "online";
    setError("voucher", "");
    setError("cardNumber", "");
    setError("cardType", "");
  }

  /* "Same as email address" copies the email into the billing email */
  function syncBillingEmail() {
    if (el("sameEmail").checked) {
      el("billingEmail").value = el("email").value;
    }
  }

  /* Screening time cannot be in the past: set the minimum on the picker */
  function setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    el("screening").min = now.toISOString().slice(0, 16);
  }

  const validators = {
    fullName: function () { return required(el("fullName").value, "Full name"); },
    email: function () {
      const v = el("email").value;
      if (v.trim() === "") { return "Email address is required."; }
      return isValidEmail(v) ? "" : "Enter a valid email, for example name@example.com.";
    },
    phone: function () {
      const v = el("phone").value;
      if (v.trim() === "") { return "Phone number is required."; }
      const digits = v.replace(/\D/g, "");
      if (!/^[\d\s()+-]+$/.test(v) || digits.length < 10) {
        return "Phone number must contain at least 10 digits.";
      }
      return "";
    },
    movie: function () { return required(el("movie").value, "Movie selection"); },
    screening: function () {
      const v = el("screening").value;
      if (v === "") { return "Screening date and time is required."; }
      return new Date(v) < new Date() ? "Screening date and time cannot be in the past." : "";
    },
    tickets: function () {
      const v = el("tickets").value;
      if (v.trim() === "") { return "Number of tickets is required."; }
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? "" : "Number of tickets must be a whole number greater than 0.";
    },
    ticketType: function () { return required(el("ticketType").value, "Ticket type"); },
    payment: function () { return paymentMode() === "" ? "Please choose a payment method." : ""; },
    voucher: function () {
      if (paymentMode() !== "voucher") { return ""; }
      return /^\d{12}$/.test(el("voucher").value) ? "" : "Voucher code must be exactly 12 digits.";
    },
    cardType: function () {
      if (paymentMode() !== "online") { return ""; }
      return required(el("cardType").value, "Card type");
    },
    cardNumber: function () {
      if (paymentMode() !== "online") { return ""; }
      const v = el("cardNumber").value;
      if (v === "") { return "Card number is required."; }
      if (!/^\d+$/.test(v)) { return "Card number must contain digits only."; }
      const needed = el("cardType").value === "amex" ? 15 : 16; /* Amex 15, Visa/Mastercard 16 */
      return v.length === needed ? "" : "This card type needs exactly " + needed + " digits.";
    },
    billingEmail: function () {
      const v = el("billingEmail").value;
      if (v.trim() === "") { return "Billing email address is required."; }
      return isValidEmail(v) ? "" : "Enter a valid billing email.";
    }
  };

  /* Wire up the dynamic behaviour */
  el("movie").addEventListener("change", updateCost);
  el("tickets").addEventListener("input", updateCost);
  el("ticketType").addEventListener("change", updateCost);
  el("email").addEventListener("input", syncBillingEmail);
  el("sameEmail").addEventListener("change", syncBillingEmail);
  form.querySelectorAll('input[name="payment"]').forEach(function (radio) {
    radio.addEventListener("change", updatePaymentFields);
  });

  setMinDateTime();
  updateCost();
  updatePaymentFields();
  validateOnBlur(validators);

  form.addEventListener("submit", function (event) {
    if (!runValidators(validators)) {
      event.preventDefault(); /* block submission until all errors are fixed */
    }
  });
}

/* ---------- 5. Recommendation page ----------
   Rules: (1) remove movies whose rating is not allowed for the age group;
   (2) score the rest: +3 for matching genre, +2 for matching viewing
   preference; (3) show movies with a score above 0, best first. */
function getRecommendations(genre, age, viewing) {
  const allowed = ALLOWED_RATINGS[age];
  return MOVIES
    .filter(function (m) { return allowed.indexOf(m.rating) !== -1; })
    .map(function (m) {
      let score = 0;
      if (m.genre === genre) { score += 3; }
      if (m.tags.indexOf(viewing) !== -1) { score += 2; }
      return { movie: m, score: score };
    })
    .filter(function (r) { return r.score > 0; })
    .sort(function (a, b) { return b.score - a.score; });
}

function initRecommend() {
  const form = document.getElementById("recommendForm");
  if (!form) { return; }

  const results = document.getElementById("results");
  const validators = {
    genre: function () { return required(document.getElementById("genre").value, "Preferred genre"); },
    age: function () { return required(document.getElementById("age").value, "Age group"); },
    viewing: function () { return required(document.getElementById("viewing").value, "Viewing preference"); }
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault(); /* stay on the page and show results with JavaScript */
    if (!runValidators(validators)) { return; }

    const genre = document.getElementById("genre").value;
    const age = document.getElementById("age").value;
    const viewing = document.getElementById("viewing").value;
    const list = getRecommendations(genre, age, viewing);

    results.textContent = "";
    const heading = document.createElement("h2");
    heading.textContent = "Your recommendations";
    results.appendChild(heading);

    if (list.length === 0) {
      const none = document.createElement("p");
      none.className = "note";
      none.textContent = "No movies match those choices. Try a different genre or viewing preference.";
      results.appendChild(none);
      return;
    }

    /* Explain when no movie matches the chosen genre for this age group */
    if (list[0].movie.genre !== genre) {
      const info = document.createElement("p");
      info.className = "note";
      info.textContent = "No " + genre + " movie suits this age group, so these are the best matches for your viewing preference.";
      results.appendChild(info);
    }

    list.forEach(function (r) {
      const card = document.createElement("article");
      card.className = "panel";
      card.style.marginBottom = "1rem";

      const h3 = document.createElement("h3");
      h3.textContent = r.movie.title;
      const detail = document.createElement("p");
      detail.textContent = r.movie.genre + " | Rated " + r.movie.rating + " | $" + r.movie.price.toFixed(2) +
        " | Match score " + r.score + "/5";
      const link = document.createElement("a");
      link.className = "btn";
      link.href = "booking.html?movie=" + encodeURIComponent(r.movie.id);
      link.textContent = "Book " + r.movie.title;

      card.append(h3, detail, link);
      results.appendChild(card);
    });
    results.focus();
  });
}

/* ---------- 6. Watchlist (bonus) ----------
   The watchlist is an array of movie ids saved in localStorage, so it
   survives page changes. Reads and writes are wrapped in try/catch in case
   storage is blocked. */
const STORAGE_KEY = "cinehubWatchlist";

function loadWatchlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (e) {
    return [];
  }
}

function saveWatchlist(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    /* storage unavailable: the list just won't persist */
  }
}

function initWatchlistButtons() {
  const buttons = document.querySelectorAll(".watch-btn");
  if (buttons.length === 0) { return; }

  function refresh() {
    const list = loadWatchlist();
    buttons.forEach(function (btn) {
      const inList = list.indexOf(btn.dataset.id) !== -1;
      btn.textContent = inList ? "Remove from watchlist" : "Add to watchlist";
      btn.setAttribute("aria-pressed", inList ? "true" : "false");
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      let list = loadWatchlist();
      if (list.indexOf(btn.dataset.id) === -1) {
        list.push(btn.dataset.id);
      } else {
        list = list.filter(function (id) { return id !== btn.dataset.id; });
      }
      saveWatchlist(list);
      refresh();
    });
  });
  refresh();
}

function initWatchlistPage() {
  const container = document.getElementById("watchlistItems");
  if (!container) { return; }

  function render() {
    const list = loadWatchlist().map(findMovie).filter(Boolean);
    container.textContent = "";

    if (list.length === 0) {
      const empty = document.createElement("p");
      empty.className = "note";
      empty.textContent = "Your watchlist is empty. Add movies from the Movies page.";
      container.appendChild(empty);
      return;
    }

    list.forEach(function (m) {
      const card = document.createElement("article");
      card.className = "panel";
      card.style.marginBottom = "1rem";

      const h2 = document.createElement("h2");
      h2.textContent = m.title;
      const detail = document.createElement("p");
      detail.textContent = m.genre + " | Rated " + m.rating + " | $" + m.price.toFixed(2);

      const actions = document.createElement("div");
      actions.className = "actions";
      const book = document.createElement("a");
      book.className = "btn";
      book.href = "booking.html?movie=" + encodeURIComponent(m.id);
      book.textContent = "Book this movie";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn secondary";
      remove.textContent = "Remove from watchlist";
      remove.addEventListener("click", function () {
        saveWatchlist(loadWatchlist().filter(function (id) { return id !== m.id; }));
        render();
      });

      actions.append(book, remove);
      card.append(h2, detail, actions);
      container.appendChild(card);
    });
  }
  render();
}

/* ---------- 7. Start ---------- */
document.addEventListener("DOMContentLoaded", function () {
  initRegistration();
  initBooking();
  initRecommend();
  initWatchlistButtons();
  initWatchlistPage();
});
