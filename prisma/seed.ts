import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const memberCount = await prisma.member.count();
  if (memberCount === 0) {
    const defaultPassword = process.env.SEED_PASSWORD || "family2025";
    const hash = await bcrypt.hash(defaultPassword, 10);
    await prisma.member.createMany({
      data: [
        { name: "基金经理驰", loginName: "member1", passwordHash: hash, role: "weekly_reporter" },
        { name: "研究员阿沈", loginName: "member2", passwordHash: hash, role: "member" },
        { name: "散户老王", loginName: "member3", passwordHash: hash, role: "member" },
      ],
    });
    console.log("Seeded 3 members. Default password:", defaultPassword);
  } else {
    console.log("Members already seeded, skip.");
  }

  const researcher = await prisma.member.findFirst({ where: { loginName: "member2" } });
  if (researcher) {
    const existingLuxshare = await prisma.stockStrategy.findFirst({ where: { symbol: "立讯精密(002475)" } });
    const demoData = {
      memberId: researcher.id,
      symbol: "立讯精密(002475)",
      entryLevel: 50,
      addPosition: 48,
      reducePosition: 58,
      stopLoss: 48,
      takeProfit: 62,
      positionMgmt: "底仓 3 成，加仓后不超过 5 成",
      difficulty: 4,
      trendComment:
        "消费电子龙头，苹果链核心供应商，深圳主板 002475。近期股价在 50–56 区间震荡，可逢回调至 50 以下分批布局，止损 48，止盈 62。@[1:基金经理驰] 可结合周报对电子板块观点。",
    };
    if (!existingLuxshare) {
      await prisma.stockStrategy.create({ data: demoData });
      console.log("Seeded demo stock strategy: 立讯精密(002475)");
    } else {
      await prisma.stockStrategy.update({
        where: { id: existingLuxshare.id },
        data: {
          entryLevel: demoData.entryLevel,
          addPosition: demoData.addPosition,
          reducePosition: demoData.reducePosition,
          stopLoss: demoData.stopLoss,
          takeProfit: demoData.takeProfit,
          positionMgmt: demoData.positionMgmt,
          difficulty: demoData.difficulty,
          trendComment: demoData.trendComment,
        },
      });
      console.log("Updated 立讯精密(002475) with full demo fields.");
    }
  }

  const researcherForNotes = await prisma.member.findFirst({ where: { loginName: "member2" } });
  if (researcherForNotes) {
    const existingNote = await prisma.tradingNote.findFirst({ where: { memberId: researcherForNotes.id, noteDate: new Date("2026-01-30") } });
    if (!existingNote) {
      await prisma.tradingNote.createMany({
        data: [
          {
            memberId: researcherForNotes.id,
            noteDate: new Date("2026-01-27"),
            content: `1. 昨天下午央视报道氢能，果断加仓了亿华通。操作失误。后来下午2点亿华通60分钟出背离了，应该多等出1-2跟K，再操作。
2. 今日正确操作：早盘蜜雪高点卖了100股，现在还剩200股，基本解套。没卖完是因为判断新高没有出背离，还在主涨段。明天可以早盘继续新高卖掉。
3. 今日错误操作：1）先导、立讯没跌到位加少量加仓，应该等到零轴出金叉了有确定性了再加。先导最可惜的是昨天早上新高时没有全部T掉。2）格兰抛弃亿华通，下午我看亿华通一路在跌，所以果断减仓了1500股。事后想了想，其实应该不用这么鲁莽的，可以等它跌破均线了再减，刚才有点慌了阵脚，属于瞎操作。亿华通其实我原本成本还行，最近高位补仓、低位减仓这两个操作让我成本徒升。`,
          },
          {
            memberId: researcherForNotes.id,
            noteDate: new Date("2026-01-29"),
            content: `1. 昨天亿华通减仓的行为，今天来看不算太糟糕，反而是可以通过做反T来弥补。
2. 昨天最错误的行为是在刚开盘蜜雪大跌的时候，补仓了蜜雪。切记：以后不能在快速下跌段补仓，一定要等跌透了开始反弹了再进行补仓。这类型的错误我犯过很多次了。每次一大跌就感觉机会来了，其实更好的机会在后面`,
          },
          {
            memberId: researcherForNotes.id,
            noteDate: new Date("2026-01-30"),
            content: `1. 昨天夜里黄金大跌，今天白天黄金etf、有色etf大跌。昨晚错误的操作：买了GDX（美股的黄金公司股），错在买之前应该看一下期货黄金价格的。结果：一买就跌
2. 今天黄金etf、有色etf大跌，像极了去年10月国庆后的某天，中芯华虹涨幅较大后大跌。任何暴利大涨的某天，第二天可能就迎来大跌，这种时候下次有经验了可以先止盈一波
3. 昨天错误的操作：捞了世运电路（主要是早上听了格兰说世运挡不住新高，结果GJD就开始砸盘，今天也继续砸）。导致：一买就跌5个点以上。`,
          },
        ],
      });
      console.log("Seeded 3 trading notes (研究员阿沈, 2026.1.27 / 1.29 / 1.30)");
    } else {
      console.log("Trading notes already seeded, skip.");
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
