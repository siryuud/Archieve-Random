window.onload = () => {
  const canvas = document.getElementById("canvas");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "svg-lines");
  svg.setAttribute(
    "style",
    "position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;"
  );
  canvas.appendChild(svg);

  const boxes = {};

  const connectionSides = {};
  archiveData.forEach((item) => {
    connectionSides[item.id] = Math.random() < 0.5 ? "left" : "right";
  });

  archiveData.forEach((item) => {
    const box = document.createElement("div");
    box.className = "box";
    box.dataset.id = item.id;
    box.dataset.type = item.type;

    const leftDot = document.createElement("div");
    leftDot.classList.add("connector", "left");

    const rightDot = document.createElement("div");
    rightDot.classList.add("connector", "right");

    const content = document.createElement("div");
    content.className = "clickable";
    content.innerHTML = `<span>${item.title}</span>`;
    content.onclick = () => openDetailPanel(item);

    const handle = document.createElement("div");
    handle.className = "drag-handle";
    handle.innerText = "⋯";

    box.appendChild(leftDot);
    box.appendChild(content);
    box.appendChild(handle);
    box.appendChild(rightDot);
    canvas.appendChild(box);

    const x = Math.random() * (window.innerWidth - 200);
    const y = Math.random() * (window.innerHeight - 120);
    box.style.left = `${x}px`;
    box.style.top = `${y}px`;

    boxes[item.id] = box;

    interact(handle).draggable({
      listeners: {
        move(event) {
          const target = event.target.closest(".box");
          const dx = event.dx;
          const dy = event.dy;

          const prevX = parseFloat(target.getAttribute("data-x")) || 0;
          const prevY = parseFloat(target.getAttribute("data-y")) || 0;
          const x = prevX + dx;
          const y = prevY + dy;

          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", x);
          target.setAttribute("data-y", y);

          redrawLines();
        },
      },
    });
  });

  function drawLine(fromBox, toBox, color = "#C4C4E8") {
    if (!fromBox || !toBox) return;

    const fromSide = connectionSides[fromBox.dataset.id] || "right";
    const toSide = connectionSides[toBox.dataset.id] || "left";
    const fromDot = fromBox.querySelector(`.connector.${fromSide}`);
    const toDot = toBox.querySelector(`.connector.${toSide}`);
    if (!fromDot || !toDot) return;

    const fromRect = fromDot.getBoundingClientRect();
    const toRect = toDot.getBoundingClientRect();

    const x1 = fromRect.left + fromRect.width / 2 + window.scrollX;
    const y1 = fromRect.top + fromRect.height / 2 + window.scrollY;
    const x2 = toRect.left + toRect.width / 2 + window.scrollX;
    const y2 = toRect.top + toRect.height / 2 + window.scrollY;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "1.5");

    svg.appendChild(line);
  }

  function redrawLines() {
    svg.innerHTML = "";

    archiveData.forEach((item) => {
      if (!item.connections) return;

      const fromBox = boxes[item.id];
      if (!fromBox || fromBox.style.display === "none") return;

      item.connections.forEach((toId) => {
        const toBox = boxes[toId];
        if (!toBox || toBox.style.display === "none") return;

        drawLine(fromBox, toBox);
      });
    });
  }

  const sidebar = document.getElementById("sidebar");
  const sidebarContent = document.getElementById("sidebarContent");
  const closeSidebar = document.getElementById("closeSidebar");

  function openDetailPanel(item) {
    let mediaHTML = "";
    if (item.media && item.media.youtube) {
      const embedUrl = convertYouTubeEmbed(item.media.youtube);
      mediaHTML = `
        <div class="media-embed">
          <iframe width="100%" height="200" src="${embedUrl}"
            frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
          </iframe>
        </div>`;
    }

    sidebarContent.innerHTML = `
      <h2>${item.title}</h2>
      <p><strong>Type:</strong> ${item.type}</p>
      ${item.date ? `<p><strong>Date:</strong> ${item.date}</p>` : ""}
      ${mediaHTML}
    `;

    document
      .querySelectorAll(".box.selected")
      .forEach((el) => el.classList.remove("selected"));
    const box = document.querySelector(`.box[data-id="${item.id}"]`);
    if (box) box.classList.add("selected");

    document.getElementById("overlay-blur").classList.add("active");
    sidebar.classList.remove("hidden");
    setTimeout(() => sidebar.classList.add("show"), 10);
  }

  function convertYouTubeEmbed(url) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^?&]+)/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  }

  closeSidebar.onclick = () => {
    sidebar.classList.remove("show");
    setTimeout(() => {
      sidebar.classList.add("hidden");
      document
        .querySelectorAll(".box.selected")
        .forEach((el) => el.classList.remove("selected"));
      document.getElementById("overlay-blur").classList.remove("active");
    }, 300);
  };

  // Key Filter open/close handlers
  document.getElementById("keyBtn").onclick = () => {
    document.getElementById("slidePanel").classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("slidePanel").classList.add("show");
    }, 10);
  };

  document.getElementById("closePanel").onclick = () => {
    document.getElementById("slidePanel").classList.remove("show");
    setTimeout(() => {
      document.getElementById("slidePanel").classList.add("hidden");
    }, 300);
  };

  // Checkbox handling logic
  const checkboxes = document.querySelectorAll(
    '#slideContent input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      syncBoxVisibility();
    });
  });

  function syncBoxVisibility() {
    archiveData.forEach((item) => {
      const box = boxes[item.id];
      const checkbox = document.querySelector(
        `#slideContent input[data-type="${item.type}"]`
      );
      if (checkbox) {
        box.style.display = checkbox.checked ? "flex" : "none";
      }
    });
    redrawLines();
  }

  // List View button logic
  document.getElementById("listViewBtn").onclick = () => {
    const sortedData = [...archiveData].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    const html = `
      <h2>List View</h2>
      <ul class="list-view">
        ${sortedData
          .map(
            (item) => `
          <li class="list-item" data-id="${item.id}">
            <span class="title">${item.title}</span>
            <span class="date">${item.date || ""}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    `;
    openPanel(html);
    document.querySelectorAll(".list-item").forEach((li) => {
      li.addEventListener("click", () => {
        const item = archiveData.find((i) => i.id === li.dataset.id);
        if (item) openDetailPanel(item);
      });
    });
  };

  // About button logic
  document.getElementById("aboutBtn").onclick = () => {
    const html = `
    <div class="about-content">
      <h2>About Yuuri</h2>
      <img src="yuuri.webp" alt="Yuuri Image" style="width: 200px; border-radius: 8px; margin-bottom: 16px;">
      <ul style="list-style: none; padding: 0; line-height: 1.8;">
        <li><strong>본명:</strong> 키무라 유우리 (木村 優里)</li>
        <li><strong>출생:</strong> 1994년 3월 23일 (31세)</li>
        <li><strong>출신:</strong> 도쿄 치바현 치바시 미하마구 마쿠하리</li>
        <li><strong>국적:</strong> 일본</li>
        <li><strong>신체:</strong> 166.9cm</li>
        <li><strong>데뷔:</strong> 2016년 THE BUGZY</li>
        <li><strong>MBTI:</strong> ISTP</li>
        <li><strong>장르:</strong> J-POP, 모던 록</li>
        <li><strong>소속사:</strong> 소니 뮤직 엔터테인먼트 재팬</li>
      </ul>
    </div>
  `;
    openPanel(html);
  };

  // Helper function to open slidePanel with content
  function openPanel(html) {
    const slideContent = document.getElementById("slideContent");
    slideContent.innerHTML = html;
    document.getElementById("slidePanel").classList.remove("hidden");
    setTimeout(() => {
      document.getElementById("slidePanel").classList.add("show");
    }, 10);
  }

  redrawLines();
};
