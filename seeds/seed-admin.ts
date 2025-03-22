import { db } from "../shared/db";
import { admin_users } from "../shared/schemas";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(32).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

async function seedAdmin() {
  try {
    const password = await hashPassword("user");
    
    await db.insert(admin_users).values({
      username: "password",
      password,
    });

    console.log("Admin user created successfully!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

seedAdmin(); 