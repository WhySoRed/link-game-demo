import { Table, Point } from './link-class'
import { Session } from 'koishi'
import {} from "koishi-plugin-canvas";

const pattern = ['','😀','❤','💎','⚡','👻','🐴','🐇','🐉','🍎']

export async function draw(session: Session, table: Table, ...linkPath: Point[]):Promise<string> {
  const width = (table.xLength + 2) * 100;
  const height = (table.yLength + 2) * 100;

  const canvas = await session.app.canvas.createCanvas(width, height);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "white";
  ctx.font = "40px";
  for (let i = 0; i < table.xLength; i++) {
    ctx.fillText(i + 1 + "", (i + 1) * 100 + 40, 70);
    for (let j = 0; j < table.yLength; j++) {
      ctx.fillText(j + 1 + "", 40, (j + 1) * 100 + 70);
      if (table.pattern[i][j]) {
        ctx.fillRect((i + 1) * 100 + 5, (j + 1) * 100 + 5 , 90, 90);
        ctx.fillText(pattern[table.pattern[i][j]], (i + 1) * 100 + 25, (j + 1) * 100 + 65);
      }
    }
  }
  
  if (linkPath.length) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 10;

    ctx.moveTo((linkPath[0].x) * 100 + 50, (linkPath[0].y) * 100 + 50);
    for (let i = 1; i < linkPath.length; i++) {
      ctx.lineTo((linkPath[i].x) * 100 + 50, (linkPath[i].y) * 100 + 50);
      ctx.stroke();
    }
  }
  return canvas.toDataURL("image/png");
}
