import { prisma } from "@/lib/prisma";
import EvaluateClient from "./EvaluateClient";
import { getSession } from "@/lib/auth";

export default async function EvaluatePage(props: {
  searchParams: Promise<{ squad?: string }>
}) {
  const searchParams = await props.searchParams;
  const session = await getSession();
  const officer = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;
  const squadNumber = searchParams.squad;

  let recruits = await prisma.recruit.findMany({
    select: { id: true, chestNumber: true, name: true, unit: true, squadNumber: true }
  });

  // Filter recruits based on officer's assigned jurisdiction
  if (officer?.minChestNumber !== null && officer?.maxChestNumber !== null) {
    recruits = recruits.filter(r => {
      const chestNoInt = parseInt(r.chestNumber.replace(/\D/g, ''));
      if (isNaN(chestNoInt)) return false;
      return chestNoInt >= officer!.minChestNumber! && chestNoInt <= officer!.maxChestNumber!;
    });
  }

  if (squadNumber) {
    recruits = recruits.filter(r => r.squadNumber === squadNumber);
  }

  recruits.sort((a, b) => {
    const numA = parseInt(a.chestNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.chestNumber.replace(/\D/g, '')) || 0;
    if (numA !== numB) return numA - numB;
    return a.chestNumber.localeCompare(b.chestNumber);
  });

  return (
    <div>
      <h1 className="heading-1">Evaluate {squadNumber ? `Squad ${squadNumber}` : 'Recruit'} / {squadNumber ? `तुकडी ${squadNumber} चे मूल्यमापन` : 'प्रशिक्षणार्थी मूल्यमापन'}</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        {squadNumber ? "Record training performance evaluations for this entire squad." : "Record attendance or submit training performance evaluations for a recruit."}
      </p>

      {recruits.length === 0 ? (
        <div className="glass-card text-center">
          <p className="text-muted">No recruits found for this criteria. Please register recruits before evaluating.</p>
        </div>
      ) : (
        <EvaluateClient recruits={recruits} initialSquad={squadNumber} />
      )}
    </div>
  );
}
