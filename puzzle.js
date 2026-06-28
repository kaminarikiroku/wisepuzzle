const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ゲームの基準解像度（タイマーやピースの拡大に伴い、破綻しないようベースサイズを調整）
const BASE_WIDTH = 1200;
const BASE_HEIGHT = 800;

const ROWS = 7;
const COLS = 10;

// グリッド（盤面）の1マスは70pxのまま
const BASE_CELL = 70;
const GRID_WIDTH = COLS * BASE_CELL;  // 700
const GRID_HEIGHT = ROWS * BASE_CELL; // 490

/* ==========================================
   【修正】手元のABCDピースのサイズを1.4倍（98px）に大きく変更
========================================== */
const PIECE_SIZE = 98; 

let scale = 1;

/* =========================
   リサイズ処理
========================= */
function resizeCanvas() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  const scaleX = (windowW * 0.98) / BASE_WIDTH;
  const scaleY = (windowH * 0.98) / BASE_HEIGHT;
  
  const MAX_SCALE = 2.0;
  scale = Math.min(scaleX, scaleY, MAX_SCALE);

  canvas.style.width = `${BASE_WIDTH * scale}px`;
  canvas.style.height = `${BASE_HEIGHT * scale}px`;

  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;

  positionStartButton();
}

/* =========================
   状態管理
========================= */
let grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let allPieces = [];
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    allPieces.push({ x, y });
  }
}
let used = new Set();
let pieces = [null, null, null, null]; 

let dragging = false;
let dragPiece = null;
let mouseX = 0;
let mouseY = 0;

const img = new Image();
img.src = "img/wise.png";

const labels = ["A", "B", "C", "D"];

let startTime = 0;
let elapsedTime = 0;
let gameClear = false;
let gameStarted = false;

/* ==========================================
   【修正】デザイン用クラスを付与したスタートボタン
========================================== */
const startButton = document.createElement("button");
startButton.innerText = "START";
startButton.className = "game-start-btn"; // CSSのスタイルを適用
document.body.appendChild(startButton);

function positionStartButton() {
  const rect = canvas.getBoundingClientRect();
  // タイマー下部に綺麗に収まるよう配置
  const baseTimerX = GRID_WIDTH + 40; 
  const baseTimerY = 200;

  startButton.style.left = `${rect.left + baseTimerX * scale}px`;
  startButton.style.top = `${rect.top + baseTimerY * scale}px`;
  startButton.style.transform = `scale(${scale})`;
  startButton.style.transformOrigin = "top left";
}

startButton.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    startTime = Date.now();
    startButton.style.display = "none";
  }
});

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* ==========================================
   【修正】タイマーの表示サイズを約2倍（90px）に変更
========================================== */
function drawTimer() {
  if (gameStarted && !gameClear) {
    elapsedTime = Date.now() - startTime;
  }

  const text = formatTime(elapsedTime);
  const fontSize = 90; // 2倍の大きさに変更

  ctx.font = `bold ${fontSize}px Arial Black`;
  const textWidth = ctx.measureText(text).width;
  const padding = 25;
  const boxW = textWidth + padding * 2;
  const boxH = fontSize + padding;

  const x = GRID_WIDTH + 40;
  const y = 20;

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(x, y, boxW, boxH);

  ctx.strokeStyle = "#00ff99"; // ボタンと合わせてエメラルドグリーンの枠線に
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, boxW, boxH);

  ctx.fillStyle = "#00ff99";
  ctx.fillText(text, x + padding, y + fontSize - 5);
}

/* =========================
   クリア判定・ピース管理
========================= */
function checkGameClear() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === 0) return false;
    }
  }
  return true;
}

function addNewPiece(label) {
  let remaining = allPieces.filter(p => {
    let key = `${p.x},${p.y}`;
    return grid[p.y][p.x] === 0 && !used.has(key);
  });

  if (remaining.length === 0) return null;

  let p = remaining[Math.floor(Math.random() * remaining.length)];
  let newPiece = { ...p, label };
  used.add(`${p.x},${p.y}`);
  return newPiece;
}

function generatePieces() {
  pieces = [null, null, null, null];
  for (let i = 0; i < 4; i++) {
    pieces[i] = addNewPiece(labels[i]);
  }
}

/* =========================
   描画
========================= */
function drawGrid() {
  ctx.filter = "grayscale(100%) brightness(1.2)";
  ctx.globalAlpha = 0.6;
  ctx.drawImage(img, 0, 0, GRID_WIDTH, GRID_HEIGHT);
  ctx.filter = "none";
  ctx.globalAlpha = 1.0;

  const imgW = img.width / COLS;
  const imgH = img.height / ROWS;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === 1) {
        ctx.drawImage(img, x * imgW, y * imgH, imgW, imgH, x * BASE_CELL, y * BASE_CELL, BASE_CELL, BASE_CELL);
      }

      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.strokeRect(x * BASE_CELL, y * BASE_CELL, BASE_CELL, BASE_CELL);

      const num = y * COLS + x + 1;
      const fontSize = 20;
      const padding = 5;

      ctx.font = `${fontSize}px Arial`;
      const text = String(num);
      const textWidth = ctx.measureText(text).width;

      const bx = x * BASE_CELL;
      const by = y * BASE_CELL;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bx, by, textWidth + padding * 2, fontSize + padding);

      ctx.fillStyle = "white";
      ctx.fillText(text, bx + padding, by + fontSize - 2);
    }
  }
}

/* ==========================================
   【修正】ABCDピースを大きく描画＋文字をコンパクトに
========================================== */
function drawPieces() {
  const imgW = img.width / COLS;
  const imgH = img.height / ROWS;

  for (let i = 0; i < 4; i++) {
    let p = pieces[i];
    if (!p) continue;

    if (dragging && dragPiece === i) continue;

    // 大きくなったPIECE_SIZEに合わせて配置間隔を自動計算
    let px = 20 + i * (PIECE_SIZE + 75);
    let py = GRID_HEIGHT + 35;

    ctx.drawImage(img, p.x * imgW, p.y * imgH, imgW, imgH, px, py, PIECE_SIZE, PIECE_SIZE);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, PIECE_SIZE, PIECE_SIZE);

    // 文字フォントサイズと位置の調整
    const labelFont = 45;
    ctx.font = `bold ${labelFont}px Arial Black`;
    const label = p.label;
    const textWidth = ctx.measureText(label).width;

    const labelX = px + PIECE_SIZE / 2 - textWidth / 2;
    // ピースの内部またはギリギリ下に被るように配置して縦幅を節約
    const labelY = py + PIECE_SIZE + labelFont + 2;

    ctx.fillStyle = "#ffff00";
    ctx.strokeStyle = "#1500ff";
    ctx.lineWidth = 8;
    ctx.strokeText(label, labelX, labelY);
    ctx.fillText(label, labelX, labelY);
  }

  if (dragging && dragPiece !== null) {
    let p = pieces[dragPiece];
    if (p) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(
        img,
        p.x * imgW,
        p.y * imgH,
        imgW,
        imgH,
        mouseX - BASE_CELL / 2, // 掴むときは盤面のマス（BASE_CELL）サイズ感覚に合わせる
        mouseY - BASE_CELL / 2,
        BASE_CELL,
        BASE_CELL
      );
      ctx.globalAlpha = 1.0;
    }
  }
}

function drawAnswer() {
  // 右下の余白にバランスよく収まるよう正解画像の縦位置を調整
  const size = 340; 
  const dx = GRID_WIDTH + 40;
  const dy = BASE_HEIGHT - size - 20;

  const aspect = img.width / img.height;
  let w = size;
  let h = size;

  if (aspect > 1) {
    h = size / aspect;
  } else {
    w = size * aspect;
  }

  ctx.drawImage(img, dx, dy, w, h);
}

/* =========================
   座標変換 
========================= */
function getMouse(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / scale,
    y: (e.clientY - rect.top) / scale
  };
}

function getTouchPos(e) {
  if (!e.touches || e.touches.length === 0) return { x: mouseX, y: mouseY };
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.touches[0].clientX - rect.left) / scale,
    y: (e.touches[0].clientY - rect.top) / scale
  };
}

/* ==========================================
   操作イベント（当たり判定をPIECE_SIZEに修正）
========================================== */
function handleStart(x, y) {
  if (!gameStarted) return;

  for (let i = 0; i < 4; i++) {
    if (!pieces[i]) continue;

    let px = 20 + i * (PIECE_SIZE + 75);
    let py = GRID_HEIGHT + 35;

    // 大きくなったPIECE_SIZEの範囲でクリック判定
    if (x >= px && x <= px + PIECE_SIZE && y >= py && y <= py + PIECE_SIZE) {
      dragging = true;
      dragPiece = i; 
      break;
    }
  }
}

function handleEnd() {
  if (!dragging || dragPiece === null) return;

  let gx = Math.floor(mouseX / BASE_CELL);
  let gy = Math.floor(mouseY / BASE_CELL);
  let p = pieces[dragPiece];

  if (p && gx === p.x && gy === p.y && grid[gy]?.[gx] === 0) {
    grid[gy][gx] = 1;
    
    const currentLabel = labels[dragPiece]; 
    pieces[dragPiece] = addNewPiece(currentLabel);

    // ==========================================
    // 【修正】クリアした時の処理
    // ==========================================
    if (checkGameClear()) {
      gameClear = true;

      setTimeout(() => {
        window.location.href = "https://www.youtube.com/embed/gN713yRA6eM?si=-xxb5LQMeCmEDucd&amp;start=1222"; 
      }, 1000);
    }
  }
  

  dragging = false;
  dragPiece = null;
}

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMouse(e);
  handleStart(x, y);
});
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const { x, y } = getTouchPos(e);
  handleStart(x, y);
}, { passive: false });

canvas.addEventListener("mousemove", (e) => {
  const pos = getMouse(e);
  mouseX = pos.x;
  mouseY = pos.y;
});
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const pos = getTouchPos(e);
  mouseX = pos.x;
  mouseY = pos.y;
}, { passive: false });

canvas.addEventListener("mouseup", handleEnd);
canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  handleEnd();
});

/* =========================
   ループ・起動
========================= */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawPieces();
  drawAnswer();
  drawTimer();
  requestAnimationFrame(loop);
}

img.onload = () => {
  resizeCanvas();
  generatePieces();
  loop();
};

window.addEventListener("resize", () => {
  resizeCanvas();
});
