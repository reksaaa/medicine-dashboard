import Test from "@/components/test";
import React from "react";
import prisma from "@/lib/prisma";

const Page = async () => {
  const stock = await prisma.stockLevel.findMany({
    include: { medicine: true, distributionCenter: true },
  });
  return <Test stock={stock} />;
};

export default Page;
