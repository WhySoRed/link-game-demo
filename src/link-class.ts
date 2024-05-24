import { is, Random } from "koishi";

const IS_EMPTY = 0;
const IS_VISITED = 1;
const IS_OTHER_PATTERN = 2;
const IS_TARGET = 3;
type PointJudgement = 0 | 1 | 2 | 3;

export class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

// 作为table.checkPath的返回值
export class PathInfo {
  enableLink: boolean;
  linkPath?: Point[];
  text?: string;
  constructor(enableLink: boolean, linkPath?: Point[], text?: string) {
    this.enableLink = enableLink;
    this.linkPath = linkPath;
    this.text = text;
  }
}

class Node extends Point {
  level: number = 0;
  parent?: Node;
  constructor(x: number, y: number, level?: number, parent?: Node) {
    super(x, y);
    if (level) this.level = level;
    if (parent) this.parent = parent;
  }
}

// 当前的游戏盘
export class Table {
  xLength: number;
  yLength: number;
  patternRange: number = 9;
  pattern: number[][];
  get isClear(): boolean {
    for (let x = 0; x < this.xLength + 1; x++) {
      for (let y = 0; y < this.yLength + 1; y++) {
        if (this.pattern[x][y] !== 0) return false;
      }
    }
    return true;
  }

  constructor(xLength: number, yLength: number, patternRange?: number) {
    if ((xLength * yLength) % 2 !== 0) throw new Error("总格数必须为偶数");
    this.xLength = xLength;
    this.yLength = yLength;
    if (patternRange) {
      this.patternRange = patternRange;
    }
    this.pattern = this.init();
    this.shuffle();
  }

  // 初始化
  init(): number[][] {
    const random = new Random();

    function randomArr(length: number) {
      const patternCreateArr: number[] = [];
      for (let i = 0; i < length; i++) {
        patternCreateArr.push(i + 1);
      }
      return random.shuffle(patternCreateArr);
    }

    let patternList: number[] = [];
    let patternCreateArr = randomArr(this.patternRange);

    for (let i = 0; i < (this.xLength * this.yLength) / 2; i++) {
      if (patternCreateArr.length === 0) {
        patternCreateArr = randomArr(this.patternRange);
      }
      const pattern = patternCreateArr.pop();
      patternList.push(pattern);
    }
    patternList = patternList.concat(patternList);

    const pattern: number[][] = [];
    for (let x = 0; x < this.xLength; x++) {
      pattern[x] = [];
      for (let y = 0; y < this.yLength; y++) {
        pattern[x][y] = patternList.pop();
      }
    }
    return pattern;
  }

  // 打乱
  shuffle() {
    const pointList: Point[] = [];
    let patternList: number[] = [];
    for (let x = 0; x < this.xLength; x++) {
      for (let y = 0; y < this.yLength; y++) {
        if (this.pattern[x][y]) {
          pointList.push(new Point(x, y));
          patternList.push(this.pattern[x][y]);
        }
      }
    }
    const random = new Random();
    patternList = random.shuffle(patternList);
    for (let i = 0; i < pointList.length; i++) {
      this.pattern[pointList[i].x][pointList[i].y] = patternList[i];
    }
  }

  remove(p1: Point, p2: Point): void {
    this.pattern[p1.x][p1.y] = 0;
    this.pattern[p2.x][p2.y] = 0;
  }

  // 检查是否存在三条直线可以连接的通路
  checkPath(p1: Point, p2: Point): PathInfo {
    if (p1.x === p2.x && p1.y === p2.y) {
      return new PathInfo(false, null, "位置重复");
    }
    if (
      p1.x < 0 ||
      p1.x > this.xLength ||
      p2.x < 0 ||
      p2.x > this.xLength ||
      p1.y < 0 ||
      p1.y > this.yLength ||
      p2.y < 0 ||
      p2.y > this.yLength
    ) {
      return new PathInfo(false, null, "位置超出范围");
    }

    const pathCheckTable: number[][] = [];
    const startX: number = p1.x + 1;
    const startY: number = p1.y + 1;
    const endX: number = p2.x + 1;
    const endY: number = p2.y + 1;

    // 建立一个扩大一圈的检查路径的表格
    for (let x = 0; x < this.xLength + 2; x++) {
      pathCheckTable[x] = [];
      for (let y = 0; y < this.yLength + 2; y++) {
        if (
          x === 0 ||
          x === this.xLength + 1 ||
          y === 0 ||
          y === this.yLength + 1
        ) {
          pathCheckTable[x][y] = 0;
        } else pathCheckTable[x][y] = this.pattern[x - 1][y - 1];
      }
    }

    // 最大折线数
    const maxLevel =
      (p1.x === 0 && p2.y === 0) ||
      (p1.x === 0 && p2.y === this.yLength - 1) ||
      (p1.x === this.xLength - 1 && p2.y === 0) ||
      (p1.x === this.xLength - 1 && p2.y === this.yLength - 1) ||
      (p2.x === 0 && p1.y === 0) ||
      (p2.x === 0 && p1.y === this.yLength - 1) ||
      (p2.x === this.xLength - 1 && p1.y === 0) ||
      (p2.x === this.xLength - 1 && p1.y === this.yLength - 1)
        ? 3 //如果有一点在边缘则允许更大范围的搜索
        : 2; //否则超过三次折线则停止

    const visited: boolean[][] = []; // 记录是否访问过
    for (let x = 0; x < this.xLength + 2; x++) {
      visited[x] = [];
      for (let y = 0; y < this.yLength + 2; y++) {
        visited[x][y] = false;
      }
    }
    const nodeQueue: Node[] = []; // 建立一个队列

    nodeQueue.push(new Node(startX, startY)); // 将起点加入队列

    let linkPathInfo = new PathInfo(false, null, "没有通路");

    // 搜索函数，如果是空则加入节点，如果是图案则确定是否是目标图案
    const checkTarget = (
      x: number,
      y: number,
      currentNode: Node
    ): PointJudgement => {
      if (pathCheckTable[x][y] === 0) {
        if (visited[x][y]) return IS_VISITED;
        visited[x][y] = true;
        nodeQueue.push(new Node(x, y, currentNode.level + 1, currentNode));
        return IS_EMPTY;
      }

      if (x !== endX || y !== endY) return IS_OTHER_PATTERN;

      const linkPath: Point[] = [];
      let node: Node = currentNode;
      while (node.parent) {
        linkPath.push(new Point(node.x, node.y));
        node = node.parent;
      }
      linkPath.push(new Point(node.x, node.y));
      linkPath.reverse().push(new Point(endX, endY));
      linkPathInfo = new PathInfo(true, linkPath, "找到通路");
      return IS_TARGET;
    };

    // 广度优先搜索
    end: while (nodeQueue.length) {
      const currentNode = nodeQueue.shift();
      if (currentNode.level > maxLevel) break;
      // 向四个方向延伸
      const x = currentNode.x;
      const y = currentNode.y;
      for (let i = x + 1; i < this.xLength + 2; i++) {
        const judgement = checkTarget(i, y, currentNode);
        if (judgement === IS_TARGET) break end;
        else if (judgement === IS_OTHER_PATTERN) break;
        else continue;
      }
      for (let i = x - 1; i >= 0; i--) {
        const judgement = checkTarget(i, y, currentNode);
        if (judgement === IS_TARGET) break end;
        else if (judgement === IS_OTHER_PATTERN) break;
        else continue;
      }
      for (let i = y + 1; i < this.yLength + 2; i++) {
        const judgement = checkTarget(x, i, currentNode);
        if (judgement === IS_TARGET) break end;
        else if (judgement === IS_OTHER_PATTERN) break;
        else continue;
      }
      for (let i = y - 1; i >= 0; i--) {
        const judgement = checkTarget(x, i, currentNode);
        if (judgement === IS_TARGET) break end;
        else if (judgement === IS_OTHER_PATTERN) break;
        else continue;
      }
    }
    return linkPathInfo;
  }
}
