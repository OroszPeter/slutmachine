document.addEventListener("DOMContentLoaded", () => {
  let score = document.getElementById("score");
  let currentWin = document.getElementById("currentwin");
  let API_Url = "https://slotmachine.tryasp.net/";
  let token = null;

  const loginForm = document.getElementById("login-form");
  const loginContainer = document.getElementById("login-container");
  const appContainer = document.getElementById("app");

  const items = [
    "7️⃣",
    "❌",
    "🍓",
    "🍋",
    "🍉",
    "🍒",
    "💵",
    "🍊",
    "🍎"
  ];

  const rewards = {
    "7️⃣": { 3: 10000 },
    "❌": { 0: 0 },
    "🍓": { 1: 50, 2: 100, 3: 150 },
    "🍋": { 3: 1000 },
    "🍉": { 3: 2000 },
    "🍒": { 2: 100, 3: 300 },
    "💵": { 3: 5000 },
    "🍊": { 2: 200, 3: 500 },
    "🍎": { 1: 50, 2: 100, 3: 150 }
  };

  const doors = document.querySelectorAll(".door");
  document.querySelector("#spinner").addEventListener("click", spin);

  // Bejelentkezési eseménykezelő
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    await loginOrRegister(username, password);

    if (token) {
      loginContainer.style.display = "none";  // Bejelentkezési űrlap elrejtése
      appContainer.style.display = "flex";    // Alkalmazás megjelenítése
    }
  });

  // Bejelentkezési és regisztrációs logika
  async function loginOrRegister(username, password) {
    try {
      console.log("Bejelentkezés próbálkozás...");
      const loginResponse = await fetch(`${API_Url}api/Users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
  
      // Ellenőrizzük, hogy a válasz sikeres-e
      if (loginResponse.ok) {
        const contentType = loginResponse.headers.get("Content-Type");
  
        // Ha a válasz JSON formátumú, akkor JSON-ként dolgozzuk fel
        if (contentType && contentType.includes("application/json")) {
          const loginData = await loginResponse.json();
          token = loginData.token;
          localStorage.setItem("token", token);
          console.log("Bejelentkezve. Token:", token);
          await fetchUserData();
        } else {
          // Ha nem JSON válasz érkezik, akkor szöveges választ várunk
          const errorText = await loginResponse.text();
          console.log("Bejelentkezés nem sikerült:", errorText);
  
          // Ha a válaszban szerepel a "A felhasználó nem található!" üzenet, akkor regisztrációt végzünk
          if (errorText === "A felhasználó nem található!") {
            console.log("Felhasználó nem található, regisztrálás...");
            const registerResponse = await fetch(`${API_Url}api/Users/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password })
            });
  
            // Ha a regisztráció sikeres, akkor újra próbálkozunk a bejelentkezéssel
            if (registerResponse.ok) {
              console.log("Regisztráció sikeres. Újra bejelentkezés...");
              await loginOrRegister(username, password); // Regisztráció után újra bejelentkezés
            } else {
              console.log("Regisztráció sikertelen!");
              alert("Regisztráció sikertelen!");
            }
          } else {
            alert("Bejelentkezés sikertelen!");
          }
        }
      } else {
        console.log("Bejelentkezés nem sikerült: ", loginResponse.statusText);
        alert("Bejelentkezés nem sikerült!");
      }
    } catch (error) {
      console.error("Hiba történt a bejelentkezés során:", error);
    }
  }
  
  
  

  // Felhasználói adatok lekérése
  async function fetchUserData() {
    try {
      console.log("Felhasználói adatok lekérése...");
      const response = await fetch(`${API_Url}api/Users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("Felhasználói adatok:", userData);
        score.textContent = `${userData.userName}: ${userData.score}`;
      } else {
        console.error("Hiba történt a felhasználói adatok lekérésekor.");
      }
    } catch (error) {
      console.error("Hiba történt a felhasználói adatok lekérésekor:", error);
    }
  }

  // Pontok frissítése
  async function updateScore(amount) {
    try {
        console.log(`Pontok frissítése: ${amount}`);

        // Módosított URL query paraméterekkel
        const response = await fetch(`${API_Url}api/Users/update-score?amount=${amount}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",  // A többi header marad
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            const updatedScore = await response.json();  // A válaszban kapott frissített pontszám
            console.log("Frissített pontszám:", updatedScore);

            // Frissítjük a frontend pontszámot a válasz alapján
            score.textContent = `Petike: ${updatedScore}`;
        } else {
            console.error("Hiba történt a pontok frissítésekor:", response.statusText);
        }
    } catch (error) {
        console.error("Hiba történt a pontok frissítésekor:", error);
    }
}

  // Játék pörgetése
  async function spin() {
    if (!token) {
      alert("Jelentkezz be a játék elindításához!");
      return;
    }

    console.log("Pörgetés indítása...");
    await updateScore(-50); // Levonjuk a pörgetés árát

    currentWin.textContent = 0;

    init(false, 1, 2);
    for (const door of doors) {
      const boxes = door.querySelector(".boxes");
      const duration = parseInt(boxes.style.transitionDuration);
      boxes.style.transform = "translateY(0)";
      await new Promise((resolve) => setTimeout(resolve, duration * 100));
    }

    const doorSymbols = Array.from(doors).map(door => {
      const boxes = door.querySelector(".boxes");
      return boxes.children[0].textContent;
    });
    console.log("Kiválasztott szimbólumok:", doorSymbols);
    const symbolCounts = countSymbols(doorSymbols);
    console.log("Szimbólumok számlálása:", symbolCounts);
    const totalReward = calculateTotalReward(symbolCounts);
    console.log("Kiszámított nyeremény:", totalReward);

    setTimeout(() => {
      currentWin.textContent = totalReward;
    }, 1500);

    setTimeout(async () => {
      await updateScore(totalReward); // Frissítjük a pontokat
    }, 1500);
  }

  function countSymbols(symbols) {
    const symbolCounts = {};
    symbols.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });
    return symbolCounts;
  }

  function calculateTotalReward(symbolCounts) {
    let totalReward = 0;
    for (const symbol in symbolCounts) {
      const count = symbolCounts[symbol];
      if (rewards[symbol] && rewards[symbol][count]) {
        totalReward += rewards[symbol][count];
      }
    }
    return totalReward;
  }

  function init(firstInit = true, groups = 1, duration = 1) {
    for (const door of doors) {
      if (firstInit) {
        door.dataset.spinned = "0";
      } else if (door.dataset.spinned === "1") {
        return;
      }

      const boxes = door.querySelector(".boxes");
      const boxesClone = boxes.cloneNode(false);

      const pool = ["❓"];
      if (!firstInit) {
        const arr = [];
        for (let n = 0; n < (groups > 0 ? groups : 1); n++) {
          arr.push(...items);
        }
        pool.push(...shuffle(arr));
      }

      for (let i = pool.length - 1; i >= 0; i--) {
        const box = document.createElement("div");
        box.classList.add("box");
        box.style.width = door.clientWidth + "px";
        box.style.height = door.clientHeight + "px";
        box.textContent = pool[i];
        boxesClone.appendChild(box);
      }
      boxesClone.style.transitionDuration = `${duration > 0 ? duration : 1}s`;
      boxesClone.style.transform = `translateY(-${
        door.clientHeight * (pool.length - 1)
      }px)`;
      door.replaceChild(boxesClone, boxes);
    }
  }

  function shuffle([...arr]) {
    let m = arr.length;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      [arr[m], arr[i]] = [arr[i], arr[m]];
    }
    return arr;
  }

  init();
});
