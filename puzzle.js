const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// ゲームの基準解像度（余白を削ってコンテンツに合わせたコンパクトな比率に調整）
const BASE_WIDTH = 1120;
const BASE_HEIGHT = 720;

const ROWS = 7;
const COLS = 10;

const BASE_CELL = 70;
const GRID_WIDTH = COLS * BASE_CELL;  // 700
const GRID_HEIGHT = ROWS * BASE_CELL; // 490

let scale = 1;

/* =========================
   リサイズ処理（余白を削って全体を大きく）
========================= */
function resizeCanvas() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  // 画面の98%まで使って限界まで大きく表示
  const scaleX = (windowW * 0.98) / BASE_WIDTH;
  const scaleY = (windowH * 0.98) / BASE_HEIGHT;
  
  // 最大拡大率の上限を2.0倍まで引き上げ
  const MAX_SCALE = 2.0;
  scale = Math.min(scaleX, scaleY, MAX_SCALE);

  // キャンバスの表示サイズを設定（CSSにより自動で中央配置されます）
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

// A, B, C, D の4つの固定部屋スロットとして管理
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

/* =========================
   スタートボタン
========================= */
const startButton = document.createElement("button");
startButton.innerText = "START";
document.body.appendChild(startButton);

startButton.style.position = "absolute";
startButton.style.fontSize = "28px";
startButton.style.padding = "15px 35px";
startButton.style.fontWeight = "bold";
startButton.style.cursor = "pointer";
startButton.style.zIndex = "999";

function positionStartButton() {
  const rect = canvas.getBoundingClientRect();
  // タイマーのすぐ下に配置されるよう基準座標を指定
  const baseTimerX = GRID_WIDTH + 40; 
  const baseTimerY = 140;

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

function drawTimer() {
  if (gameStarted && !gameClear) {
    elapsedTime = Date.now() - startTime;
  }

  const text = formatTime(elapsedTime);
  const fontSize = 45;

  ctx.font = `bold ${fontSize}px Arial Black`;
  const textWidth = ctx.measureText(text).width;
  const padding = 20;
  const boxW = textWidth + padding * 2;
  const boxH = fontSize + padding;

  // 右側の空きスペースの上部に配置
  const x = GRID_WIDTH + 40;
  const y = 15;

  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(x, y, boxW, boxH);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, boxW, boxH);

  ctx.fillStyle = "#00ff99";
  ctx.fillText(text, x + padding, y + fontSize - 2);
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

function drawPieces() {
  const imgW = img.width / COLS;
  const imgH = img.height / ROWS;

  for (let i = 0; i < 4; i++) {
    let p = pieces[i];
    if (!p) continue;

    if (dragging && dragPiece === i) continue;

    // 下側の置き場（i = 0:A, 1:B, 2:C, 3:D の並び位置が完全固定）
    let px = 15 + i * (BASE_CELL + 105);
    let py = GRID_HEIGHT + 30;

    ctx.drawImage(img, p.x * imgW, p.y * imgH, imgW, imgH, px, py, BASE_CELL, BASE_CELL);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, BASE_CELL, BASE_CELL);

    const labelFont = 50;
    ctx.font = `bold ${labelFont}px Arial Black`;
    const label = p.label;
    const textWidth = ctx.measureText(label).width;

    const labelX = px + BASE_CELL / 2 - textWidth / 2;
    const labelY = py + BASE_CELL + labelFont + 5;

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
        mouseX - BASE_CELL / 2,
        mouseY - BASE_CELL / 2,
        BASE_CELL,
        BASE_CELL
      );
      ctx.globalAlpha = 1.0;
    }
  }
}

function drawAnswer() {
  const size = 340; 
  const dx = GRID_WIDTH + 40;
  const dy = BASE_HEIGHT - size - 15;

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
   座標変換 (PC・スマホ共通)
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

/* =========================
   操作イベント（マウス＆タッチ両対応）
========================= */

function handleStart(x, y) {
  if (!gameStarted) return;

  for (let i = 0; i < 4; i++) {
    if (!pieces[i]) continue;

    let px = 15 + i * (BASE_CELL + 105);
    let py = GRID_HEIGHT + 30;

    if (x >= px && x <= px + BASE_CELL && y >= py && y <= py + BASE_CELL) {
      dragging = true;
      dragPiece = i; // 掴んだスロットインデックス(0=A, 1=B...)を固定記憶
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
    
    // 正解したスロットの本来の文字(A〜D)を引き継ぐ
    const currentLabel = labels[dragPiece]; 
    
    // そのアルファベットの位置スロットを、新しいピースで直接上書き
    pieces[dragPiece] = addNewPiece(currentLabel);

    if (checkGameClear()) {
      gameClear = true;
    }
  }

  dragging = false;
  dragPiece = null;
}

// ① 押し込み（クリック / タッチ開始）
canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMouse(e);
  handleStart(x, y);
});
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const { x, y } = getTouchPos(e);
  handleStart(x, y);
}, { passive: false });

// ② 移動（ドラッグ中）
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

// ③ 離したとき（ドロップ）
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
