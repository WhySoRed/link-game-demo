import { Table, Point } from './link-class'
import { Session } from 'koishi'
import {} from "koishi-plugin-canvas";

const pattern = ['','😀','❤','💎','⚡','👻','🐴','🐇']

export async function draw(session: Session, table: Table, ...points: Point[]):Promise<string> {
  const canvas = await session.app.canvas.createCanvas(
    (table.xLength + 2) * 100,
    (table.yLength + 2) * 100
  );
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < table.xLength; i++) {
    for (let j = 0; j < table.yLength; j++) {
      if (table.squares[i][j]) {
        ctx.fillStyle = "white";
        ctx.fillRect((i + 1) * 100 + 5, (j + 1) * 100 + 5 , 90, 90);

        ctx.font = "40px";
        ctx.fillText(pattern[table.squares[i][j]], (i + 1) * 100 + 25, (j + 1) * 100 + 65);
      }
    }
  }

  if (points.length) {
    ctx.fillStyle = "red";
    ctx.moveTo((points[0].x + 1) * 100 + 50, (points[0].y + 1) * 100 + 50);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo((points[i].x + 1) * 100 + 50, (points[i].y + 1) * 100 + 50);
    }
  }

  return canvas.toDataURL("image/png");
}
