import BilingualRegisterForm from "@/components/BilingualRegisterForm";
import { prisma } from "@/lib/prisma";

export default async function RegisterRecruit() {
  const batches = await prisma.batch.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  return <BilingualRegisterForm batches={batches} />;
}
