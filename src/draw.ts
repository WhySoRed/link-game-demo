import { Table, Point } from "./linkGame";
import { Session, Random } from "koishi";
import {} from "koishi-plugin-canvas";
import { Config } from ".";

export async function draw(
  session: Session,
  config: Config,
  patterns: string[],
  table: Table,
  linkPathArr?: Point[][]
): Promise<string> {
  const blockSize = config.blockSize;
  const pattern = [""].concat(patterns);

  const width = (table.yLength + 2 - 0.8) * blockSize;
  const height = (table.xLength + 2 - 0.8) * blockSize;

  const patternBlockCanvas = await session.app.canvas.createCanvas(
    blockSize,
    blockSize
  );
  const ctxBlock = patternBlockCanvas.getContext("2d");

  ctxBlock.beginPath();
  ctxBlock.moveTo(0.2 * blockSize, 0.1 * blockSize);
  ctxBlock.lineTo(0.8 * blockSize, 0.1 * blockSize);
  ctxBlock.quadraticCurveTo(
    0.9 * blockSize,
    0.1 * blockSize,
    0.9 * blockSize,
    0.2 * blockSize
  );
  ctxBlock.lineTo(0.9 * blockSize, 0.8 * blockSize);
  ctxBlock.quadraticCurveTo(
    0.9 * blockSize,
    0.9 * blockSize,
    0.8 * blockSize,
    0.9 * blockSize
  );
  ctxBlock.lineTo(0.2 * blockSize, 0.9 * blockSize);
  ctxBlock.quadraticCurveTo(
    0.1 * blockSize,
    0.9 * blockSize,
    0.1 * blockSize,
    0.8 * blockSize
  );
  ctxBlock.lineTo(0.1 * blockSize, 0.2 * blockSize);
  ctxBlock.quadraticCurveTo(
    0.1 * blockSize,
    0.1 * blockSize,
    0.2 * blockSize,
    0.1 * blockSize
  );
  ctxBlock.closePath();
  ctxBlock.fillStyle = "#fcf5f7";
  ctxBlock.fill();
  const block = await patternBlockCanvas.toDataURL("image/png");
  ctxBlock.fillStyle = "#00a5bf";
  ctxBlock.fill();
  const blockShadow = await patternBlockCanvas.toDataURL("image/png");

  const canvas = await session.app.canvas.createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#002a33");
  gradient.addColorStop(1, "#002129");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const patternBlock = await session.app.canvas.loadImage(block);
  const patternBlockShadow = await session.app.canvas.loadImage(blockShadow);

  ctx.translate(-0.4 * blockSize, -0.4 * blockSize);

  ctx.fillStyle = "white";
  ctx.font = "40px";
  for (let i = 0; i < table.yLength + 2; i++) {
    for (let j = 0; j < table.xLength + 2; j++) {
      if (table.pattern[j][i]) {
        ctx.save();
        ctx.drawImage(
          patternBlockShadow,
          (i + 0.05) * blockSize,
          (j + 0.05) * blockSize
        );
        ctx.drawImage(patternBlock, i * blockSize, j * blockSize);
        ctx.restore();
        ctx.fillText(
          pattern[table.pattern[j][i]],
          i * blockSize + 0.25 * blockSize,
          j * blockSize + 0.65 * blockSize
        );
        ctx.save();
        ctx.fillStyle = "#de3163";
        ctx.font = `${0.2 * blockSize}px`;
        ctx.fillText(
          (j - 1) * table.yLength + (i - 1) + "",
          i * blockSize + 0.15 * blockSize,
          j * blockSize + 0.85 * blockSize
        );
        ctx.restore();
      }
    }
  }
  for (const i in linkPathArr) {
    const linkPath = linkPathArr[i];
    if (linkPath.length) {
      ctx.strokeStyle = "#de3163";
      ctx.lineWidth = 0.1 * blockSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";



      ctx.moveTo(
        linkPath[0].y * blockSize + 0.5 * blockSize,
        linkPath[0].x * blockSize + 0.5 * blockSize
      );
      for (let i = 1; i < linkPath.length; i++) {
        let drawpointX: number;
        let drawpointY: number;
        if (linkPath[i].y === 0)
          drawpointX = linkPath[i].y * blockSize + 0.8 * blockSize;
        else if (linkPath[i].y === table.yLength + 1)
          drawpointX = linkPath[i].y * blockSize + 0.2 * blockSize;
        else drawpointX = linkPath[i].y * blockSize + 0.5 * blockSize;

        if (linkPath[i].x === 0)
          drawpointY = linkPath[i].x * blockSize + 0.8 * blockSize;
        else if (linkPath[i].x === table.xLength + 1)
          drawpointY = linkPath[i].x * blockSize + 0.2 * blockSize;
        else drawpointY = linkPath[i].x * blockSize + 0.5 * blockSize;

        ctx.lineTo(drawpointX, drawpointY);
        ctx.stroke();
      }
    }
  }

  ctx.translate(0.4 * blockSize, 0.4 * blockSize);

  return canvas.toDataURL("image/png");
}

export async function drawWin(session: Session, config: Config) {
  const blockSize = config.blockSize;
  const canvas = await session.app.canvas.createCanvas(
    4 * blockSize,
    3 * blockSize
  );
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 4 * blockSize, 3* blockSize);
  gradient.addColorStop(0, "#002a33");
  gradient.addColorStop(1, "#002129");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4 * blockSize, 3* blockSize);

  ctx.save();
  ctx.font = `${1.5 * blockSize}px`;
  ctx.rotate(0);
  ctx.fillText("🎇", 2.5 * blockSize, 1 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${2 * blockSize}px`;
  ctx.rotate(-0.1);
  ctx.fillText("🏆", 0 * blockSize, 2 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${1.5 * blockSize}px`;
  ctx.rotate(0.4);
  ctx.fillText("🥳", 2.2 * blockSize, 1.5 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${1.5 * blockSize}px`;
  ctx.rotate(0);
  ctx.fillText("🎆", -0.5 * blockSize, 2.8 * blockSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export async function drawWelcome(session: Session, config: Config) {
  const blockSize = config.blockSize;
  const canvas = await session.app.canvas.createCanvas(4 * blockSize, 3 * blockSize);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 4 * blockSize, 3* blockSize);
  gradient.addColorStop(0, "#002a33");
  gradient.addColorStop(1, "#002129");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4 * blockSize, 3 * blockSize);

  const randomPatternArr = (new Random()).shuffle(config.pattermType).slice(0, 4)

  ctx.save();
  ctx.font = `${1.7 * blockSize}px`;
  ctx.rotate(-.4);
  ctx.fillText(randomPatternArr[0], -.5 * blockSize, 2.2* blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${1.3 * blockSize}px`;
  ctx.rotate(.4);
  ctx.fillText(randomPatternArr[1], 2 * blockSize, 0 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${1.5 * blockSize}px`;
  ctx.rotate(-0.1);
  ctx.fillText(randomPatternArr[2], -0.2 * blockSize, 2.7 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.font = `${1.2 * blockSize}px`;
  ctx.rotate(.3);
  ctx.fillText(randomPatternArr[3], 3 * blockSize, 1 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#de3163";
  ctx.fillRect(0, 0, 4 * blockSize, 3 * blockSize);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#de3163";
  ctx.lineWidth = 0.1 * blockSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = 'white';
  ctx.shadowOffsetX = 0.05 * blockSize;
  ctx.beginPath();
  ctx.moveTo(2.5* blockSize, -0.5* blockSize);
  ctx.lineTo( blockSize, blockSize);
  ctx.lineTo(2* blockSize, 2* blockSize);
  ctx.lineTo(blockSize, 3*blockSize);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `${1.5 * blockSize}px`;
  ctx.rotate(0.4);
  ctx.fillText("🤔", 2.2 * blockSize, 1.5 * blockSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export async function drawOver(session: Session, config: Config) {
  const blockSize = config.blockSize;
  const canvas = await session.app.canvas.createCanvas(4 * blockSize, 3 * blockSize);
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 4 * blockSize, 3* blockSize);
  gradient.addColorStop(0, "#002a33");
  gradient.addColorStop(1, "#002129");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4 * blockSize, 3 * blockSize);

  ctx.save();
  ctx.font = `${1.2* blockSize}px`;
  ctx.rotate(0);
  ctx.fillText("🥀", 1.2 * blockSize, 2.1 * blockSize);
  ctx.restore();

  return canvas.toDataURL("image/png");
}
