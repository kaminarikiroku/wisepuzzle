const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ROWS = 7;
const COLS = 10;

// 余白
const marginRight = 400;
const marginBottom = 230;

// 画面サイズ取得
function calculateCellSize() {

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  return Math.floor(
    Math.max(
      50,
      Math.min(
        (screenW - marginRight) / COLS,
        (screenH - marginBottom) / ROWS
      )
    )
  );
}

let CELL = calculateCellSize();

/* =========================
   canvasサイズ
========================= */

function resizeCanvas() {

  CELL = calculateCellSize();

  canvas.width =
    COLS * CELL + marginRight;

  canvas.height =
    ROWS * CELL + marginBottom;
}

resizeCanvas();

/* =========================
   グリッド
========================= */

let grid = Array.from(
  { length: ROWS },
  () => Array(COLS).fill(0)
);

/* =========================
   全マス
========================= */

let allPieces = [];

for (let y = 0; y < ROWS; y++) {

  for (let x = 0; x < COLS; x++) {

    allPieces.push({ x, y });

  }
}

/* =========================
   使用済み
========================= */

let used = new Set();

/* =========================
   ピース
========================= */

let pieces = [];

/* =========================
   ドラッグ
========================= */

let dragging = false;
let dragPiece = null;

let mouseX = 0;
let mouseY = 0;

/* =========================
   画像
========================= */

const img = new Image();
img.src = "img/wise.png";

/* =========================
   ラベル
========================= */

const labels = ["A", "B", "C", "D"];

/* =========================
   タイマー
========================= */

let startTime = 0;

let elapsedTime = 0;

let gameClear = false;

let gameStarted = false;

/* =========================
   スタートボタン
========================= */

const startButton =
  document.createElement("button");

startButton.innerText =
  "START";

document.body.appendChild(
  startButton
);

startButton.style.fontSize =
  "28px";

startButton.style.padding =
  "15px 35px";

startButton.style.fontWeight =
  "bold";

startButton.style.cursor =
  "pointer";

startButton.style.zIndex =
  "999";

/* =========================
   ボタン位置
========================= */

function positionStartButton() {

  const fontSize =
    Math.floor(CELL * 0.7);

  const timerText =
    formatTime(elapsedTime);

  ctx.font =
    `bold ${fontSize}px Arial Black`;

  const textWidth =
    ctx.measureText(timerText).width;

  const padding = 25;

  const boxW =
    textWidth + padding * 2;

  const boxH =
    fontSize + padding;

  const timerX =
    canvas.width - boxW - 30;

  const timerY = 20;

  // タイマー下へ配置
  startButton.style.position =
    "absolute";

  startButton.style.left =
    `${timerX + 140}px`;

  startButton.style.top =
    `${timerY + boxH + 80}px`;
}

positionStartButton();

/* =========================
   スタート押下
========================= */

startButton.addEventListener(
  "click",
  () => {

    if (!gameStarted) {

      gameStarted = true;

      startTime = Date.now();

      startButton.style.display =
        "none";
    }
  }
);

function formatTime(ms) {

  const totalSeconds =
    Math.floor(ms / 1000);

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

/* =========================
   タイマー描画
========================= */

function drawTimer() {

  if (
    gameStarted &&
    !gameClear
  ) {

    elapsedTime =
      Date.now() - startTime;
  }

  const text =
    formatTime(elapsedTime);

  const fontSize =
    Math.floor(CELL * 1.2);

  ctx.font =
    `bold ${fontSize}px Arial Black`;

  const textWidth =
    ctx.measureText(text).width;

  const padding = 25;

  const boxW =
    textWidth + padding * 2;

  const boxH =
    fontSize + padding;

  const x =
    canvas.width - boxW - 10;

  const y = 20;

  // 背景
  ctx.fillStyle =
    "rgba(0,0,0,0.75)";

  ctx.fillRect(
    x,
    y,
    boxW,
    boxH
  );

  // 枠
  ctx.strokeStyle = "white";

  ctx.lineWidth = 4;

  ctx.strokeRect(
    x,
    y,
    boxW,
    boxH
  );

  // 文字
  ctx.fillStyle = "#00ff99";

  ctx.fillText(
    text,
    x + padding,
    y + fontSize
  );
}

/* =========================
   クリア判定
========================= */

function checkGameClear() {

  for (let y = 0; y < ROWS; y++) {

    for (let x = 0; x < COLS; x++) {

      if (grid[y][x] === 0) {

        return false;
      }
    }
  }

  return true;
}

/* =========================
   ピース生成
========================= */

function addNewPiece(label) {

  let remaining =
    allPieces.filter(p => {

      let key =
        `${p.x},${p.y}`;

      return (
        grid[p.y][p.x] === 0 &&
        !used.has(key)
      );
    });

  if (remaining.length === 0)
    return;

  let p =
    remaining[
      Math.floor(
        Math.random() *
        remaining.length
      )
    ];

  pieces.push({
  ...p,
  label
});

  used.add(`${p.x},${p.y}`);
}

function generatePieces() {

  pieces = [];

  for (let i = 0; i < 4; i++) {
  addNewPiece(labels[i]);
  }
}

/* =========================
   グリッド描画
========================= */

function drawGrid() {

  // 背景
  ctx.filter =
    "grayscale(100%) brightness(1.2)";

  ctx.globalAlpha = 0.6;

  ctx.drawImage(
    img,
    0,
    0,
    COLS * CELL,
    ROWS * CELL
  );

  ctx.filter = "none";

  ctx.globalAlpha = 1.0;

  const imgW =
    img.width / COLS;

  const imgH =
    img.height / ROWS;

  for (let y = 0; y < ROWS; y++) {

    for (let x = 0; x < COLS; x++) {

      // 正解済み
      if (grid[y][x] === 1) {

        ctx.drawImage(
          img,
          x * imgW,
          y * imgH,
          imgW,
          imgH,
          x * CELL,
          y * CELL,
          CELL,
          CELL
        );
      }

      // 枠
      ctx.strokeStyle =
        "black";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        x * CELL,
        y * CELL,
        CELL,
        CELL
      );

      // 番号
      const num =
        y * COLS + x + 1;

      const fontSize =
        Math.floor(CELL * 0.35);

      const padding = 6;

      ctx.font =
        `${fontSize}px Arial`;

      const text =
        String(num);

      const textWidth =
        ctx.measureText(text).width;

      const bx =
        x * CELL;

      const by =
        y * CELL;

      // 番号背景
      ctx.fillStyle =
        "rgba(0,0,0,0.6)";

      ctx.fillRect(
        bx,
        by,
        textWidth + padding * 2,
        fontSize + padding
      );

      // 番号文字
      ctx.fillStyle =
        "white";

      ctx.fillText(
        text,
        bx + padding,
        by + fontSize
      );
    }
  }
}

/* =========================
   ピース描画
========================= */

function drawPieces() {

  const imgW =
    img.width / COLS;

  const imgH =
    img.height / ROWS;

  pieces.forEach((p, i) => {

    if (
      dragging &&
      dragPiece === i
    ) return;

    let px =
      40 + i * (CELL + 80);

    let py =
      ROWS * CELL + 40;

    // ピース
    ctx.drawImage(
      img,
      p.x * imgW,
      p.y * imgH,
      imgW,
      imgH,
      px,
      py,
      CELL,
      CELL
    );

    // 枠
    ctx.strokeStyle =
      "white";

    ctx.lineWidth = 3;

    ctx.strokeRect(
      px,
      py,
      CELL,
      CELL
    );

    /* =========================
       A B C D
    ========================= */

    const labelFont =
      Math.floor(CELL * 0.8);

    ctx.font =
      `bold ${labelFont}px Arial Black`;

    const label = p.label;

    const textWidth =
      ctx.measureText(label).width;

    const labelX =
      px + CELL / 2 -
      textWidth / 2;

    const labelY =
      py + CELL +
      labelFont + 12;

    ctx.fillStyle =
      "#ffff00";

    ctx.strokeStyle =
      "#1500ff";

    ctx.lineWidth = 10;

    ctx.strokeText(
      label,
      labelX,
      labelY
    );

    ctx.fillText(
      label,
      labelX,
      labelY
    );
  });

  /* =========================
     ドラッグ中
  ========================= */

  if (
    dragging &&
    dragPiece !== null
  ) {

    let p =
      pieces[dragPiece];

    ctx.globalAlpha = 0.6;

    ctx.drawImage(
      img,
      p.x * (img.width / COLS),
      p.y * (img.height / ROWS),
      img.width / COLS,
      img.height / ROWS,
      mouseX - CELL / 2,
      mouseY - CELL / 2,
      CELL,
      CELL
    );

    ctx.globalAlpha = 1.0;
  }
}

/* =========================
   正解画像
========================= */

function drawAnswer() {

  // 110%くらいに拡大
  const size =
    CELL * 4;

  const dx =
    COLS * CELL + 40;

  const dy =
    ROWS * CELL - size + 90;

  const aspect =
    img.width / img.height;

  let w = size;
  let h = size;

  if (aspect > 1) {

    h = size / aspect;

  } else {

    w = size * aspect;
  }

  ctx.drawImage(
    img,
    dx,
    dy,
    w,
    h
  );

  ctx.fillStyle =
    "white";

  ctx.font =
    `bold ${Math.floor(CELL * 0.3)}px Arial`;

  /*ctx.fillText(
    "ANSWER",
    dx,
    dy - 10
  );*/
}

/* =========================
   座標変換
========================= */

function getMouse(e) {

  const rect =
    canvas.getBoundingClientRect();

  return {

    x:
      (e.clientX - rect.left) *
      (canvas.width / rect.width),

    y:
      (e.clientY - rect.top) *
      (canvas.height / rect.height)

  };
}

/* =========================
   マウス操作
========================= */

canvas.addEventListener(
  "mousedown",
  (e) => {

    // START前は操作不可
    if (!gameStarted)
      return;

    const { x, y } =
      getMouse(e);

    pieces.forEach((p, i) => {

      const px =
        40 + i * (CELL + 80);

      const py =
        ROWS * CELL + 40;

      if (
        x >= px &&
        x <= px + CELL &&
        y >= py &&
        y <= py + CELL
      ) {

        dragging = true;

        dragPiece = i;
      }
    });
  }
);

canvas.addEventListener(
  "mousemove",
  (e) => {

    const pos =
      getMouse(e);

    mouseX = pos.x;
    mouseY = pos.y;
  }
);

canvas.addEventListener(
  "mouseup",
  () => {

    if (
      !dragging ||
      dragPiece === null
    ) return;

    let gx =
      Math.floor(mouseX / CELL);

    let gy =
      Math.floor(mouseY / CELL);

    let p =
      pieces[dragPiece];

    // 正しい位置
    if (
      gx === p.x &&
      gy === p.y &&
      grid[gy]?.[gx] === 0
    ) {

      grid[gy][gx] = 1;

      const removedLabel = pieces[dragPiece].label;

    pieces.splice(dragPiece, 1);

addNewPiece(removedLabel);

      // クリア
      if (
        checkGameClear()
      ) {

        gameClear = true;
      }
    }

    dragging = false;

    dragPiece = null;
  }
);

/* =========================
   ループ
========================= */

function loop() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  drawGrid();

  drawPieces();

  drawAnswer();

  drawTimer();

  requestAnimationFrame(loop);
}

/* =========================
   起動
========================= */

img.onload = () => {

  generatePieces();

  loop();
};

/* =========================
   リサイズ
========================= */

window.addEventListener(
  "resize",
  () => {

    resizeCanvas();

    positionStartButton();

  }
);
