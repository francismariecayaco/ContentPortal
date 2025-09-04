// /js/landing.js
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadCompanies() {
  const feed = document.getElementById("landing-feed");
  feed.innerHTML = "";

  const companiesRef = collection(db, "companies");
  const snapshot = await getDocs(companiesRef);

  snapshot.forEach(doc => {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "company-card";
    card.innerHTML = `
      <h2>${data.name}</h2>
      <p>${data.description}</p>
      <a href="company.html?id=${doc.id}">Visit</a>
    `;
    feed.appendChild(card);
  });
}

window.onload = loadCompanies;
