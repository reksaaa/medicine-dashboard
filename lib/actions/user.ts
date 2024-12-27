"use server";

import prisma from "@/lib/prisma";

export async function registerUser(profileData: FormData) {
  const email = profileData.get("email") as string;
  const password = profileData.get("password") as string;
  const name = profileData.get("name") as string;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
      },
    });
    return { success: true, data: user };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: `Failed to register user: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function deleteUser(email: string) {
  try {
    await prisma.user.delete({
      where: { email },
    });
    return { success: true };
  } catch (error) {
    console.error("Deletion error:", error);
    return {
      success: false,
      error: `Failed to delete user: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
