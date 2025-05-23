import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import prisma from "../../libs/prismadb";

export async function POST(
  request: Request, 
) {
  const body = await request.json();
  const { 
    email,
    name,
    password,
   } = body;

   const hashedPassword = await bcrypt.hash(password, 12);

   const user = await prisma.user.create({
    data: {
      email,
      name,
      hashedPassword,
      roles:["visitor"] //default
    }
  });

  return NextResponse.json(user);
}
