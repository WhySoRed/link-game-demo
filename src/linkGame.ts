import { Random } from "koishi";
import { Config } from ".";

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
  p1: Point;
  p2: Point;
  enableLink: boolean;
  linkPath?: Point[];
  text?: string;
  constructor(
    p1: Point,
    p2: Point,
    enableLink: boolean,
    linkPath?: Point[],
    text?: string
  ) {
    this.p1 = p1;
    this.p2 = p2;
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
  maxPatternTypes: number;
  pattern: number[][];
  get isClear(): boolean {
    for (let x = 0; x < this.xLength + 1; x++) {
      for (let y = 0; y < this.yLength + 1; y++) {
        if (this.pattern[x][y] !== 0) return false;
      }
    }
    return true;
  }

  constructor(xLength: number, yLength: number, maxPatternTypes: number) {
    if ((xLength * yLength) % 2 !== 0) throw new Error("总格数必须为偶数");
    this.xLength = xLength;
    this.yLength = yLength;
    this.maxPatternTypes = maxPatternTypes;
    this.pattern = this.init();
  }

  // 初始化
  init(): number[][] {
    const random = new Random();
    /**
     * 下面这部分是为了让每种图案的数量大致相同，并且全部为一对
     * *1 先生成一个长度为maxPatternTypes的随机数组patternCreateArr
     * *2 逐个放入本局游戏的图案列表patternList，让每种图案至少能出现一次
     * *3 为空则再生成
     * *4 把生成的长度为总格子数一半的patternList用concat方法翻倍，就得到了一个所有图案成对的格子图案的数组
     */
    function randomPatternArr(length: number) {
      const patternCreateArr: number[] = [];
      for (let i = 0; i < length; i++) {
        patternCreateArr.push(i + 1);
      }
      return random.shuffle(patternCreateArr);
    }

    let patternList: number[] = [];
    // 1
    let patternCreateArr = randomPatternArr(this.maxPatternTypes);
    for (let i = 0; i < (this.xLength * this.yLength) / 2; i++) {
      if (patternCreateArr.length === 0) {
        // 3
        patternCreateArr = randomPatternArr(this.maxPatternTypes);
      }
      const pattern = patternCreateArr.pop();
      patternList.push(pattern);
    }
    // 4
    patternList = patternList.concat(patternList);
    patternList = random.shuffle(patternList);

    const pattern: number[][] = [];
    for (let x = 0; x < this.xLength + 2; x++) {
      pattern[x] = [];
      for (let y = 0; y < this.yLength + 2; y++) {
        if (
          x === 0 ||
          x === this.xLength + 1 ||
          y === 0 ||
          y === this.yLength + 1
        )
          pattern[x][y] = 0;
        else pattern[x][y] = patternList.pop();
      }
    }
    return pattern;
  }

  // 打乱重排
  shuffle() {
    const pointList: Point[] = [];
    let patternList: number[] = [];
    // 获取当前游戏还有的所有格子和图案，存入数组，再把图案洗牌重新放回
    for (let x = 0; x < this.xLength + 2; x++) {
      for (let y = 0; y < this.yLength + 2; y++) {
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
  checkPath(config: Config, p1: Point, p2: Point): PathInfo {
    // 最大折线数
    let maxLevel = config.maxLink;
    if (
      config.moreSideFree &&
      ((p1.x === 1 && p2.x === this.xLength) ||
        (p1.x === this.xLength && p2.x === 1) ||
        (p1.y === 1 && p2.y === this.yLength) ||
        (p1.y === this.yLength && p2.y === 1))
    )
      maxLevel = 4;
    if (
      (config.sideFree || config.moreSideFree) &&
      ((p1.x === 1 && p2.y === 1) ||
        (p1.x === 1 && p2.y === this.yLength) ||
        (p1.x === this.xLength && p2.y === 1) ||
        (p1.x === this.xLength && p2.y === this.yLength) ||
        (p2.x === 1 && p1.y === 1) ||
        (p2.x === 1 && p1.y === this.yLength) ||
        (p2.x === this.xLength && p1.y === 1) ||
        (p2.x === this.xLength && p1.y === this.yLength))
    )
      maxLevel = 3;

    const visited: boolean[][] = []; // 记录是否访问过
    for (let x = 0; x < this.xLength + 2; x++) {
      visited[x] = [];
      for (let y = 0; y < this.yLength + 2; y++) {
        visited[x][y] = false;
      }
    }
    const nodeQueue: Node[] = []; // 建立一个队列

    nodeQueue.push(new Node(p1.x, p1.y)); // 将起点加入队列

    let linkPathInfo = new PathInfo(
      p1,
      p2,
      false,
      null,
      "这两个位置无法连接..."
    );

    // 搜索函数，如果是空则加入节点，如果是图案则确定是否是目标图案
    const checkTarget = (
      x: number,
      y: number,
      currentNode: Node
    ): PointJudgement => {
      if (this.pattern[x][y] === 0) {
        if (visited[x][y]) return IS_VISITED;
        visited[x][y] = true;
        nodeQueue.push(new Node(x, y, currentNode.level + 1, currentNode));
        return IS_EMPTY;
      }

      if (x !== p2.x || y !== p2.y) return IS_OTHER_PATTERN;

      const linkPath: Point[] = [];
      let node: Node = currentNode;
      while (node.parent) {
        linkPath.push(new Point(node.x, node.y));
        node = node.parent;
      }
      linkPath.push(new Point(node.x, node.y));
      linkPath.reverse().push(new Point(p2.x, p2.y));
      linkPathInfo = new PathInfo(p1, p2, true, linkPath, "找到通路");
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

  checkPoint(config: Config, p1: Point, p2: Point): PathInfo {
    if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y))
      return new PathInfo(p1, p2, false, null, "位置不是数字");
    if (p1.x === p2.x && p1.y === p2.y)
      return new PathInfo(p1, p2, false, null, "位置重复");
    if (
      p1.x < 1 ||
      p1.x > this.xLength ||
      p2.x < 1 ||
      p2.x > this.xLength ||
      p1.y < 1 ||
      p1.y > this.yLength ||
      p2.y < 1 ||
      p2.y > this.yLength
    )
      return new PathInfo(p1, p2, false, null, "位置超出范围");
    if (this.pattern[p1.x][p1.y] === 0 || this.pattern[p2.x][p2.y] === 0)
      return new PathInfo(p1, p2, false, null, "选择了一个没有图案的位置...");
    if (this.pattern[p1.x][p1.y] !== this.pattern[p2.x][p2.y])
      return new PathInfo(p1, p2, false, null, "两个位置的图案不一样...");

    return this.checkPath(config, p1, p2);
  }

  checkPointArr(config: Config, pointPairArr: [Point, Point][]): PathInfo[] {
    const pathInfoArr: PathInfo[] = [];
    // 避免耍赖在一次指令中多次选择同一个位置的图案导致bug
    const existPointArr: Point[] = [];
    for (let i = 0; i < pointPairArr.length; i++) {
      if (
        existPointArr.find(
          (point) =>
            point.x === pointPairArr[i][0].x && point.y === pointPairArr[i][0].y
        ) ||
        existPointArr.find(
          (point) =>
            point.x === pointPairArr[i][1].x && point.y === pointPairArr[i][1].y
        )
      ) {
        pathInfoArr.push(
          new PathInfo(
            pointPairArr[i][0],
            pointPairArr[i][1],
            false,
            null,
            "选择了已选择的位置"
          )
        );
      } else {
        const pathInfo = this.checkPoint(
          config,
          pointPairArr[i][0],
          pointPairArr[i][1]
        );
        pathInfoArr.push(pathInfo);
      }
    }
    return pathInfoArr;
  }

  static order2Point(orders: number, table: Table): Point {
    return new Point(
      Math.floor(orders / table.yLength) + 1,
      (orders % table.yLength) + 1
    );
  }

  static point2Order(point: Point, table: Table): number {
    return (point.x - 1) * table.yLength + point.y - 1;
  }
}
